import { randomBytes } from "node:crypto";

import dayjs from "dayjs";

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const KeyGenerators = {
  /**
   * Human-traceable primary keys in the form `PREFIX-YYYYMMDD-aBcD123`. Support
   * staff can tell what a record is and when it was created from the ID alone.
   */
  entityId: (prefix: string, length = 7): string => {
    const suffix = Array.from(
      randomBytes(length),
      (byte) => ALPHABET[byte % ALPHABET.length],
    ).join("");

    return `${prefix}-${dayjs().format("YYYYMMDD")}-${suffix}`;
  },

  /** Anonymised, clinician-facing patient identifier (no PII by design). */
  patientCode: (sequence: number): string =>
    `SNJ-PT-${String(sequence).padStart(6, "0")}`,
};
