import { Yup } from "@/global/validations/extensions/index.js";

export const AnalyticsQuerySchema = Yup.object({
  from: Yup.string().validateDateTime().optional(),
  to: Yup.string().validateDateTime().optional(),
  facility_id: Yup.string().trim().optional(),
  district: Yup.string().trim().optional(),
  granularity: Yup.string()
    .oneOf(["day", "week", "month"])
    .default("day"),
}).test(
  "from-before-to",
  "The start date must fall before the end date.",
  (value) => !value?.from || !value?.to || new Date(value.from) <= new Date(value.to),
);
