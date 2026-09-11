import jsonwebtoken from "jsonwebtoken";

import type { JWTPayload } from "@/types/index.js";

import { Cryptography } from "@/utils/crypto.js";
import { CustomError } from "@/utils/customerror.js";
import { env } from "@/utils/env.js";

/**
 * The user payload is AES-encrypted before being placed inside the JWT, so a
 * decoded-but-unverified token still leaks nothing about the clinician.
 */
export const JWT = {
  sign: (payload: JWTPayload): string =>
    jsonwebtoken.sign(
      { payload: Cryptography.encrypt(JSON.stringify(payload)) },
      env.JWT_SECRET_KEY,
      {
        expiresIn: env.JWT_EXPIRY_IN_SECONDS,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      },
    ),

  verify: (token: string): JWTPayload => {
    try {
      const decoded = jsonwebtoken.verify(token, env.JWT_SECRET_KEY, {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      }) as { payload: string };

      return JSON.parse(Cryptography.decrypt(decoded.payload)) as JWTPayload;
    } catch (error) {
      if (error instanceof jsonwebtoken.TokenExpiredError) {
        throw new CustomError(
          401,
          "Your session has expired. Please sign in again.",
          [],
          "TOKEN_EXPIRED",
        );
      }

      throw new CustomError(
        401,
        "Invalid authentication token.",
        [],
        "TOKEN_INVALID",
      );
    }
  },

  expiresInSeconds: (): number => env.JWT_EXPIRY_IN_SECONDS,
};
