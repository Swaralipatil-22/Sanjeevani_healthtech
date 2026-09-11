import { Yup } from "@/global/validations/extensions/index.js";
import { buildGlobalFilterSchema } from "@/global/validations/schemas/common/index.js";
import {
  ENCOUNTER_SEVERITY,
  ENCOUNTER_STATUS,
  ENCOUNTER_VISIT_TYPES,
} from "@/types/index.js";

export const EncounterFilterSchema = Yup.object({
  search: Yup.string().trim().optional(),
  patient_id: Yup.string().trim().optional(),
  clinician_id: Yup.array().of(Yup.string()),
  facility_id: Yup.array().of(Yup.string()),
  diagnosis_category_id: Yup.array().of(Yup.string()),
  severity: Yup.array().of(
    Yup.string().oneOf(Object.values(ENCOUNTER_SEVERITY)),
  ),
  status: Yup.array().of(Yup.string().oneOf(Object.values(ENCOUNTER_STATUS))),
  visit_type: Yup.array().of(
    Yup.string().oneOf(Object.values(ENCOUNTER_VISIT_TYPES)),
  ),
  from: Yup.string().validateDateTime().optional(),
  to: Yup.string().validateDateTime().optional(),
});

export const ListEncountersSchema = buildGlobalFilterSchema(
  EncounterFilterSchema,
);

const VitalsSchema = Yup.object({
  temperature_celsius: Yup.number().min(30).max(45).nullable(),
  systolic_bp: Yup.number().integer().min(50).max(260).nullable(),
  diastolic_bp: Yup.number().integer().min(30).max(180).nullable(),
  pulse_bpm: Yup.number().integer().min(30).max(220).nullable(),
  spo2_percentage: Yup.number().integer().min(50).max(100).nullable(),
  weight_kg: Yup.number().min(1).max(300).nullable(),
  blood_sugar_mgdl: Yup.number().min(20).max(800).nullable(),
}).default({});

export const EncounterManagementSchema = Yup.object({
  patient_id: Yup.string().trim().required("Patient is required."),
  facility_id: Yup.string().trim().required("Facility is required."),
  diagnosis_category_id: Yup.string()
    .trim()
    .required("Diagnosis category is required."),
  encounter_date: Yup.string()
    .validateDateTime()
    .required("Encounter date is required.")
    .test(
      "not-in-future",
      "An encounter cannot be recorded in the future.",
      (value) => !value || new Date(value).getTime() <= Date.now() + 60_000,
    ),
  visit_type: Yup.string()
    .oneOf(Object.values(ENCOUNTER_VISIT_TYPES), "Select a valid visit type.")
    .required("Visit type is required."),
  chief_complaint: Yup.string()
    .validateStandardDescription(3, 255)
    .required("Chief complaint is required."),
  symptoms: Yup.array()
    .of(Yup.string().validateStandardName(2, 64))
    .min(1, "Record at least one symptom.")
    .default([]),
  diagnosis: Yup.string()
    .validateStandardDescription(3, 255)
    .required("Diagnosis is required."),
  severity: Yup.string()
    .oneOf(Object.values(ENCOUNTER_SEVERITY), "Select a valid severity.")
    .required("Severity is required."),
  status: Yup.string()
    .oneOf(Object.values(ENCOUNTER_STATUS))
    .default(ENCOUNTER_STATUS.UNDER_TREATMENT),
  treatment: Yup.string()
    .validateStandardDescription(3, 2000)
    .required("Treatment plan is required."),
  vitals: VitalsSchema,
  follow_up_date: Yup.string().validateDateTime().nullable().default(null),
  notes: Yup.string().validateStandardDescription(0, 2000).nullable().default(null),
}).test(
  "follow-up-after-encounter",
  "The follow-up date must be after the encounter date.",
  (value) =>
    !value?.follow_up_date ||
    new Date(value.follow_up_date) > new Date(value.encounter_date),
);
