import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import * as Yup from "yup";

dayjs.extend(customParseFormat);

const NAME_PATTERN = /^[A-Za-zऀ-ॿ][A-Za-z0-9ऀ-ॿ\s'.,()/-]*$/;

declare module "yup" {
  interface StringSchema {
    validateStandardName(min?: number, max?: number): this;
    validateStandardDescription(min?: number, max?: number): this;
    validateDateTime(): this;
  }
}

/**
 * Devanagari is included in the name pattern deliberately: outreach staff
 * record complaints and diagnoses in Marathi as often as in English.
 */
Yup.addMethod(
  Yup.string,
  "validateStandardName",
  function validateStandardName(min = 2, max = 255) {
    return this.trim()
      .min(min, `Must be at least ${min} characters.`)
      .max(max, `Must not exceed ${max} characters.`)
      .matches(NAME_PATTERN, {
        message: "Must start with a letter and avoid special characters.",
        excludeEmptyString: true,
      });
  },
);

Yup.addMethod(
  Yup.string,
  "validateStandardDescription",
  function validateStandardDescription(min = 2, max = 2000) {
    return this.trim()
      .min(min, `Must be at least ${min} characters.`)
      .max(max, `Must not exceed ${max} characters.`);
  },
);

Yup.addMethod(Yup.string, "validateDateTime", function validateDateTime() {
  return this.test(
    "is-valid-datetime",
    "Must be a valid date.",
    (value) => value === undefined || value === null || dayjs(value).isValid(),
  );
});

export { Yup };
