import dayjs from "dayjs";

import type { EncounterPayload } from "@/lib/apis/client/encounters";

import {
  ENCOUNTER_SEVERITY,
  ENCOUNTER_STATUS,
  ENCOUNTER_VISIT_TYPES,
} from "@/constants/global/enums";

export const ENCOUNTER_INITIAL_DATA: EncounterPayload = {
  patient_id: "",
  facility_id: "",
  diagnosis_category_id: "",
  encounter_date: dayjs().format("YYYY-MM-DDTHH:mm"),
  visit_type: ENCOUNTER_VISIT_TYPES.NEW_CONSULTATION,
  chief_complaint: "",
  symptoms: [],
  diagnosis: "",
  severity: ENCOUNTER_SEVERITY.MILD,
  status: ENCOUNTER_STATUS.UNDER_TREATMENT,
  treatment: "",
  vitals: {
    temperature_celsius: null,
    systolic_bp: null,
    diastolic_bp: null,
    pulse_bpm: null,
    spo2_percentage: null,
    weight_kg: null,
    blood_sugar_mgdl: null,
  },
  follow_up_date: null,
  notes: null,
};

export const COMMON_SYMPTOMS = [
  "Fever",
  "Cough",
  "Headache",
  "Body ache",
  "Breathlessness",
  "Diarrhoea",
  "Vomiting",
  "Abdominal pain",
  "Chest pain",
  "Fatigue",
  "Dizziness",
  "Rash",
  "Joint pain",
  "Sore throat",
  "Loss of appetite",
];
