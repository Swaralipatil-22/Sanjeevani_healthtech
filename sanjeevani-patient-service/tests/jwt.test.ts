import jsonwebtoken from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import type { JWTPayload } from "@/types/index.js";

import { ROLES } from "@/types/index.js";
import { CustomError } from "@/utils/customerror.js";
import { env } from "@/utils/env.js";
import { JWT } from "@/utils/jwt.js";

const PAYLOAD: JWTPayload = {
  id: "USER-20260910-aBcD123",
  email: "doctor@sanjeevani.health",
  employee_id: "SNJ-DOC-001",
  first_name: "Meera",
  last_name: "Kulkarni",
  role: ROLES.DOCTOR,
  role_id: "IAM-ROLE-20260910-xYz9876",
  facility_id: "FACILITY-20260910-QwErT12",
};

describe("session tokens", () => {
  it("round-trips a clinician payload", () => {
    expect(JWT.verify(JWT.sign(PAYLOAD))).toEqual(PAYLOAD);
  });

  it("keeps the payload unreadable without the key", () => {
    const decoded = jsonwebtoken.decode(JWT.sign(PAYLOAD)) as {
      payload: string;
    };

    // The claim is an AES blob, so decoding without verifying leaks nothing.
    expect(decoded.payload).not.toContain(PAYLOAD.email);
    expect(decoded.payload).not.toContain(PAYLOAD.id);
  });

  it("rejects a token signed with a different key", () => {
    const foreign = jsonwebtoken.sign({ payload: "tampered" }, "another-key", {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresIn: 3600,
    });

    expect(() => JWT.verify(foreign)).toThrow(CustomError);
  });

  it("reports an expired session distinctly", () => {
    const expired = jsonwebtoken.sign(
      { payload: "anything" },
      env.JWT_SECRET_KEY,
      {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        expiresIn: -10,
      },
    );

    expect(() => JWT.verify(expired)).toThrowError(/session has expired/i);
  });

  it("rejects a token issued for another audience", () => {
    const foreign = jsonwebtoken.sign(
      { payload: "anything" },
      env.JWT_SECRET_KEY,
      { issuer: "SomethingElse", audience: "SomethingElse", expiresIn: 3600 },
    );

    expect(() => JWT.verify(foreign)).toThrow(CustomError);
  });
});
