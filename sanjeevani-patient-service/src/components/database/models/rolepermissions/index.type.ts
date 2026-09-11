import type { CreationOptional, InferAttributes, Model } from "sequelize";

export interface RolePermissionAttributes
  extends Model<
    InferAttributes<RolePermissionAttributes>,
    RolePermissionCreationAttributes
  > {
  id: CreationOptional<string>;
  role_id: string;
  permission_id: string;
  created_at: CreationOptional<Date>;
  updated_at: CreationOptional<Date>;
}

export interface RolePermissionCreationAttributes {
  id?: string;
  role_id: string;
  permission_id: string;
}
