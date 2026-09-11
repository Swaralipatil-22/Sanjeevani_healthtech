import { Yup } from "@/global/validations/extensions/index.js";
import { buildGlobalFilterSchema } from "@/global/validations/schemas/common/index.js";
import { GENDER_TYPES } from "@/types/index.js";

export const PatientFilterSchema = Yup.object({
  search: Yup.string().trim().optional(),
  gender: Yup.array().of(Yup.string().oneOf(Object.values(GENDER_TYPES))),
  district: Yup.array().of(Yup.string()),
  facility_id: Yup.array().of(Yup.string()),
  min_age: Yup.number().integer().min(0).max(120).optional(),
  max_age: Yup.number().integer().min(0).max(120).optional(),
  is_pregnant: Yup.boolean().optional(),
});

export const ListPatientsSchema = buildGlobalFilterSchema(PatientFilterSchema);

export const PatientManagementSchema = Yup.object({
  age: Yup.number()
    .integer("Age must be a whole number.")
    .min(0, "Age cannot be negative.")
    .max(120, "Age must be 120 or below.")
    .required("Age is required."),
  gender: Yup.string()
    .oneOf(Object.values(GENDER_TYPES), "Select a valid gender.")
    .required("Gender is required."),
  district: Yup.string().validateStandardName(2, 64).required(
    "District is required.",
  ),
  state: Yup.string().validateStandardName(2, 64).required("State is required."),
  facility_id: Yup.string().trim().required("Facility is required."),
  chronic_conditions: Yup.array()
    .of(Yup.string().validateStandardName(2, 64))
    .default([]),
  is_pregnant: Yup.boolean().default(false),
});
