import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

import { env } from "@/utils/env.js";

const ALGORITHM = "aes-256-cbc";

/**
 * AES keys must be exactly 32 bytes and IVs exactly 16. Rather than forcing
 * operators to count characters we derive both deterministically from the
 * configured secrets.
 */
const KEY = scryptSync(env.AES_ENCRYPTION_KEY, "sanjeevani-salt", 32);
const IV = scryptSync(env.AES_ENCRYPTION_IV, "sanjeevani-salt", 16);

export const Cryptography = {
  encrypt: (plainText: string): string => {
    const cipher = createCipheriv(ALGORITHM, KEY, IV);
    return Buffer.concat([
      cipher.update(plainText, "utf8"),
      cipher.final(),
    ]).toString("base64");
  },

  decrypt: (cipherText: string): string => {
    const decipher = createDecipheriv(ALGORITHM, KEY, IV);
    return Buffer.concat([
      decipher.update(Buffer.from(cipherText, "base64")),
      decipher.final(),
    ]).toString("utf8");
  },

  randomToken: (bytes = 24): string => randomBytes(bytes).toString("hex"),
};
