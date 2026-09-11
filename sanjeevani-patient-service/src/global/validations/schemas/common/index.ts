import { Yup } from "@/global/validations/extensions/index.js";
import { EXPORT_FORMATS } from "@/types/index.js";

export const IdParamSchema = Yup.object({
  id: Yup.string().trim().required("An identifier is required."),
});

export const DateRangeSchema = Yup.object({
  from: Yup.string().validateDateTime().optional(),
  to: Yup.string().validateDateTime().optional(),
});

/**
 * Base shape for every `/list` and `/export` call: the console always sends
 * `{ filter, page, limit, sort, export_format }`.
 */
export const buildGlobalFilterSchema = (
  filterSchema: Yup.AnyObjectSchema,
): Yup.AnyObjectSchema =>
  Yup.object({
    filter: filterSchema.default({}),
    page: Yup.number().integer().min(1).default(1),
    limit: Yup.number().integer().min(1).max(1000).default(10),
    sort: Yup.object()
      .test(
        "is-sort-map",
        "Sort must map field names to 1 or -1.",
        (value) =>
          value === undefined ||
          Object.values(value).every((item) => item === 1 || item === -1),
      )
      .default(undefined),
    export_format: Yup.string()
      .oneOf(Object.values(EXPORT_FORMATS))
      .default(EXPORT_FORMATS.CSV),
  });
