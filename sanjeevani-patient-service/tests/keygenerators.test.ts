import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import { KeyGenerators } from "@/utils/keygenerators.js";

describe("entity identifiers", () => {
  it("encodes the prefix and creation date", () => {
    const id = KeyGenerators.entityId("ENCOUNTER");
    expect(id).toMatch(
      new RegExp(`^ENCOUNTER-${dayjs().format("YYYYMMDD")}-[A-Za-z0-9]{7}$`),
    );
  });

  it("does not collide across a large batch", () => {
    const ids = new Set(
      Array.from({ length: 5000 }, () => KeyGenerators.entityId("PATIENT")),
    );
    expect(ids.size).toBe(5000);
  });
});

describe("patient codes", () => {
  it("pads sequentially so codes sort naturally", () => {
    expect(KeyGenerators.patientCode(1)).toBe("SNJ-PT-000001");
    expect(KeyGenerators.patientCode(4213)).toBe("SNJ-PT-004213");
  });

  it("carries no personal information", () => {
    // The code is derived from a counter alone - nothing about the person.
    expect(KeyGenerators.patientCode(42)).toBe("SNJ-PT-000042");
  });
});
