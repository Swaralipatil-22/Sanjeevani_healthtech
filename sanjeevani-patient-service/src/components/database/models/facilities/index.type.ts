import type { CreationOptional, InferAttributes, Model } from "sequelize";

import type { FACILITY_TYPES } from "@/types/index.js";

export interface FacilityAttributes
  extends Model<
    InferAttributes<FacilityAttributes>,
    FacilityCreationAttributes
  > {
  id: CreationOptional<string>;
  code: string;
  name: string;
  type: FACILITY_TYPES;
  district: string;
  state: string;
  is_active: CreationOptional<boolean>;
  created_at: CreationOptional<Date>;
  updated_at: CreationOptional<Date>;
}

export interface FacilityCreationAttributes {
  id?: string;
  code: string;
  name: string;
  type: FACILITY_TYPES;
  district: string;
  state: string;
  is_active?: boolean;
}
