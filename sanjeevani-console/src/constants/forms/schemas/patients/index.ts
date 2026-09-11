import * as Yup from "yup";

import type { PatientPayload } from "@/lib/apis/client/patients";

import { GENDER_TYPES } from "@/constants/global/enums";

export const PatientSchema = Yup.object({
  age: Yup.number()
    .typeError("Enter the age in years.")
    .integer("Age must be a whole number.")
    .min(0, "Age cannot be negative.")
    .max(120, "Age must be 120 or below.")
    .required("Age is required."),
  gender: Yup.string()
    .oneOf(Object.values(GENDER_TYPES), "Select a gender.")
    .required("Gender is required."),
  district: Yup.string()
    .trim()
    .min(2, "District must be at least 2 characters.")
    .max(64)
    .required("District is required."),
  state: Yup.string()
    .trim()
    .min(2, "State must be at least 2 characters.")
    .max(64)
    .required("State is required."),
  facility_id: Yup.string().trim().required("Select a facility."),
  chronic_conditions: Yup.array().of(Yup.string().trim().min(2)).default([]),
  is_pregnant: Yup.boolean().default(false),
});

export const PATIENT_INITIAL_DATA: PatientPayload = {
  age: 0,
  gender: "",
  district: "",
  state: "Maharashtra",
  facility_id: "",
  chronic_conditions: [],
  is_pregnant: false,
};

export const COMMON_CHRONIC_CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Asthma",
  "Anaemia",
  "Tuberculosis",
  "Epilepsy",
  "Chronic kidney disease",
];
