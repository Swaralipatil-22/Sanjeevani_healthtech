import type { CreationOptional, InferAttributes, Model } from "sequelize";

import type { ROLES } from "@/types/index.js";

export interface RoleAttributes
  extends Model<InferAttributes<RoleAttributes>, RoleCreationAttributes> {
  id: CreationOptional<string>;
  name: ROLES;
  description: string;
  created_at: CreationOptional<Date>;
  updated_at: CreationOptional<Date>;
}

export interface RoleCreationAttributes {
  id?: string;
  name: ROLES;
  description: string;
}
