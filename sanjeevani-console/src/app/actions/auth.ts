"use server";

import { decodeJwt } from "jose";
import _ from "lodash";
import { cookies } from "next/headers";

import { AUTH_COOKIE } from "@/proxy";

const PATIENT_SERVICE_ENDPOINT =
  process.env.PATIENT_SERVICE_INTERNAL_ENDPOINT ?? "http://localhost:8000";

export interface LoginResult {
  success: boolean;
  detail?: string;
  redirect_to?: string;
}

/**
 * Login runs on the server so the JWT can be written straight into an
 * httpOnly cookie - it never passes through client-side JavaScript.
 */
export const login = async (
  email: string,
  password: string,
): Promise<LoginResult> => {
  let payload: unknown;

  try {
    const response = await fetch(
      `${PATIENT_SERVICE_ENDPOINT}/patient-service/api/v1/auth/login`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      },
    );

    payload = await response.json();

    if (!response.ok) {
      return {
        success: false,
        detail: _.get(
          payload,
          "data.detail",
          "Unable to sign in. Please try again.",
        ) as string,
      };
    }
  } catch {
    return {
      success: false,
      detail:
        "Cannot reach the patient service. Check that the API is running.",
    };
  }

  const token = _.get(payload, "data.access_token") as string | undefined;
  if (!token) {
    return { success: false, detail: "The server did not return a session." };
  }

  const { exp } = decodeJwt(token);
  const store = await cookies();

  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    // Expire the cookie a minute early so the UI never sends a token the API
    // is about to reject.
    maxAge: typeof exp === "number" ? exp - Math.floor(Date.now() / 1000) - 60 : 3600,
  });

  const destiny = store.get("requested_destiny")?.value;
  store.delete("requested_destiny");

  return { success: true, redirect_to: destiny || "/" };
};

export const logout = async (): Promise<void> => {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  store.delete("requested_destiny");
};
