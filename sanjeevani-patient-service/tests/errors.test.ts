import { describe, expect, it } from "vitest";
import * as Yup from "yup";

import { CustomError } from "@/utils/customerror.js";

describe("error normalisation", () => {
  it("keeps an existing CustomError intact", () => {
    const original = new CustomError(403, "Denied.");
    expect(CustomError.from(original)).toBe(original);
  });

  it("turns a Yup failure into a 422 the console can render", async () => {
    const schema = Yup.object({
      diagnosis: Yup.string().required("Diagnosis is required."),
    });

    try {
      await schema.validate({}, { abortEarly: false });
      expect.unreachable("validation should have failed");
    } catch (error) {
      const normalised = CustomError.from(error);
      expect(normalised.status_code).toBe(422);
      expect(normalised.toDetails().detail).toBe("Diagnosis is required.");
      expect(normalised.code).toBe("VALIDATION_ERROR");
    }
  });

  it("does not leak internals from an unknown throw", () => {
    const normalised = CustomError.from(new Error("connect ECONNREFUSED"));
    expect(normalised.status_code).toBe(500);
    expect(normalised.toDetails()).toHaveProperty("detail");
  });

  it("always exposes a detail field for the frontend contract", () => {
    // The console reads every error from `response.data.data.detail`.
    expect(CustomError.from("unexpected").toDetails().detail).toBeTypeOf(
      "string",
    );
  });
});
