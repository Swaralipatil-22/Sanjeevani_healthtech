import type { CreationOptional, InferAttributes, Model } from "sequelize";

import type {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/types/index.js";

export interface PermissionAttributes
  extends Model<
    InferAttributes<PermissionAttributes>,
    PermissionCreationAttributes
  > {
  id: CreationOptional<string>;
  module: PERMISSION_MODULES;
  sub_module: PERMISSION_SUB_MODULES;
  name: PERMISSIONS;
  description: string;
  created_at: CreationOptional<Date>;
  updated_at: CreationOptional<Date>;
}

export interface PermissionCreationAttributes {
  id?: string;
  module: PERMISSION_MODULES;
  sub_module: PERMISSION_SUB_MODULES;
  name: PERMISSIONS;
  description: string;
}
