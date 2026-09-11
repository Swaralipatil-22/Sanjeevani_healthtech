import * as Yup from "yup";

import {
  ENCOUNTER_SEVERITY,
  ENCOUNTER_STATUS,
  ENCOUNTER_VISIT_TYPES,
} from "@/constants/global/enums";

/**
 * Step-scoped schemas. `EncounterSchemaStepMapper` hands Formik only the
 * schema for the step on screen, so a clinician is never blocked by errors
 * from a step they have not reached.
 */
export const EncounterStep1Schema = Yup.object({
  patient_id: Yup.string().trim().required("Select a patient."),
  facility_id: Yup.string().trim().required("Select a facility."),
  encounter_date: Yup.string()
    .required("Encounter date is required.")
    .test(
      "not-in-future",
      "An encounter cannot be recorded in the future.",
      (value) => !value || new Date(value).getTime() <= Date.now() + 60_000,
    ),
  visit_type: Yup.string()
    .oneOf(Object.values(ENCOUNTER_VISIT_TYPES), "Select a visit type.")
    .required("Visit type is required."),
  chief_complaint: Yup.string()
    .trim()
    .min(3, "Describe the complaint in at least 3 characters.")
    .max(255, "Keep the complaint under 255 characters.")
    .required("Chief complaint is required."),
});

export const EncounterStep2Schema = Yup.object({
  symptoms: Yup.array()
    .of(Yup.string().trim().min(2))
    .min(1, "Record at least one symptom.")
    .required("Record at least one symptom."),
  diagnosis: Yup.string()
    .trim()
    .min(3, "Diagnosis must be at least 3 characters.")
    .max(255)
    .required("Diagnosis is required."),
  diagnosis_category_id: Yup.string()
    .trim()
    .required("Select a diagnosis category."),
  severity: Yup.string()
    .oneOf(Object.values(ENCOUNTER_SEVERITY), "Select a severity.")
    .required("Severity is required."),
  status: Yup.string()
    .oneOf(Object.values(ENCOUNTER_STATUS))
    .required("Status is required."),
  treatment: Yup.string()
    .trim()
    .min(3, "Describe the treatment plan.")
    .max(2000)
    .required("Treatment plan is required."),
  vitals: Yup.object({
    temperature_celsius: Yup.number()
      .typeError("Enter a number.")
      .min(30, "Below the recordable range.")
      .max(45, "Above the recordable range.")
      .nullable(),
    systolic_bp: Yup.number().typeError("Enter a number.").min(50).max(260).nullable(),
    diastolic_bp: Yup.number().typeError("Enter a number.").min(30).max(180).nullable(),
    pulse_bpm: Yup.number().typeError("Enter a number.").min(30).max(220).nullable(),
    spo2_percentage: Yup.number()
      .typeError("Enter a number.")
      .min(50)
      .max(100)
      .nullable(),
    weight_kg: Yup.number().typeError("Enter a number.").min(1).max(300).nullable(),
    blood_sugar_mgdl: Yup.number()
      .typeError("Enter a number.")
      .min(20)
      .max(800)
      .nullable(),
  }).test(
    "bp-consistency",
    "Systolic pressure must be higher than diastolic.",
    (value) =>
      !value?.systolic_bp ||
      !value?.diastolic_bp ||
      value.systolic_bp > value.diastolic_bp,
  ),
});

export const EncounterStep3Schema = Yup.object({
  follow_up_date: Yup.string().nullable(),
  notes: Yup.string().trim().max(2000).nullable(),
});

export const EncounterSchemaStepMapper: Record<number, Yup.AnyObjectSchema> = {
  0: EncounterStep1Schema,
  1: EncounterStep2Schema,
  2: EncounterStep3Schema,
};

export const ENCOUNTER_STEPS = ["Visit", "Clinical", "Review"];
