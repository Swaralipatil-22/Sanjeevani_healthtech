import type { CreationOptional, InferAttributes, Model } from "sequelize";

import type { GENDER_TYPES } from "@/types/index.js";

export interface PatientAttributes
  extends Model<InferAttributes<PatientAttributes>, PatientCreationAttributes> {
  id: CreationOptional<string>;
  patient_code: string;
  age: number;
  gender: GENDER_TYPES;
  district: string;
  state: string;
  facility_id: string;
  chronic_conditions: string[];
  is_pregnant: CreationOptional<boolean>;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: CreationOptional<Date>;
  updated_at: CreationOptional<Date>;
  deleted_at: CreationOptional<Date | null>;
}

export interface PatientCreationAttributes {
  id?: string;
  patient_code?: string;
  age: number;
  gender: GENDER_TYPES;
  district: string;
  state: string;
  facility_id: string;
  chronic_conditions?: string[];
  is_pregnant?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_by?: string | null;
}
