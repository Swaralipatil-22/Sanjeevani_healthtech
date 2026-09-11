import type { CreationOptional, InferAttributes, Model } from "sequelize";

import type {
  ENCOUNTER_SEVERITY,
  ENCOUNTER_STATUS,
  ENCOUNTER_VISIT_TYPES,
} from "@/types/index.js";

export interface EncounterVitals {
  temperature_celsius?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  pulse_bpm?: number | null;
  spo2_percentage?: number | null;
  weight_kg?: number | null;
  blood_sugar_mgdl?: number | null;
}

export interface EncounterAttributes
  extends Model<
    InferAttributes<EncounterAttributes>,
    EncounterCreationAttributes
  > {
  id: CreationOptional<string>;
  patient_id: string;
  clinician_id: string;
  facility_id: string;
  diagnosis_category_id: string;
  encounter_date: Date;
  visit_type: ENCOUNTER_VISIT_TYPES;
  chief_complaint: string;
  symptoms: string[];
  diagnosis: string;
  severity: ENCOUNTER_SEVERITY;
  status: ENCOUNTER_STATUS;
  treatment: string;
  vitals: EncounterVitals;
  follow_up_date: Date | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: CreationOptional<Date>;
  updated_at: CreationOptional<Date>;
  deleted_at: CreationOptional<Date | null>;
}

export interface EncounterCreationAttributes {
  id?: string;
  patient_id: string;
  clinician_id: string;
  facility_id: string;
  diagnosis_category_id: string;
  encounter_date: Date | string;
  visit_type: ENCOUNTER_VISIT_TYPES;
  chief_complaint: string;
  symptoms?: string[];
  diagnosis: string;
  severity: ENCOUNTER_SEVERITY;
  status?: ENCOUNTER_STATUS;
  treatment: string;
  vitals?: EncounterVitals;
  follow_up_date?: Date | string | null;
  notes?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_by?: string | null;
}
