import type { CreationOptional, InferAttributes, Model } from "sequelize";

import type { USER_STATUS_TYPES } from "@/types/index.js";

export interface UserAttributes
  extends Model<InferAttributes<UserAttributes>, UserCreationAttributes> {
  id: CreationOptional<string>;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  role_id: string;
  facility_id: string | null;
  status: USER_STATUS_TYPES;
  last_login_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: CreationOptional<Date>;
  updated_at: CreationOptional<Date>;
  deleted_at: CreationOptional<Date | null>;
}

export interface UserCreationAttributes {
  id?: string;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  role_id: string;
  facility_id?: string | null;
  status?: USER_STATUS_TYPES;
  last_login_at?: Date | null;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_by?: string | null;
}
