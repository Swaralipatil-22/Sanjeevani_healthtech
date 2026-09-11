import type { Sequelize } from "sequelize";

import { DataTypes } from "sequelize";

import type { ModelExtendedInstance } from "@/components/database/hooks.js";
import type { RoleAttributes } from "@/components/database/models/roles/index.type.js";

import {
  attachEntityIdHook,
  ENTITY_ID_COLUMN,
} from "@/components/database/hooks.js";
import { ROLES } from "@/types/index.js";

export const ID_PREFIX = "IAM-ROLE";

export const defineRoles = (
  sequelize: Sequelize,
): ModelExtendedInstance<RoleAttributes> => {
  const Roles = sequelize.define<RoleAttributes>(
    "roles",
    {
      id: ENTITY_ID_COLUMN,
      // Uniqueness is declared as an index rather than `unique: true`:
      // Sequelize's alter-sync emits invalid SQL for a UNIQUE enum column.
      name: {
        type: DataTypes.ENUM(...Object.values(ROLES)),
        allowNull: false,
      },
      description: { type: DataTypes.STRING(255), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: "roles",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ unique: true, fields: ["name"], name: "roles_name_unique" }],
    },
  ) as ModelExtendedInstance<RoleAttributes>;

  Roles.id_prefix = ID_PREFIX;
  attachEntityIdHook(Roles, ID_PREFIX);

  Roles.associate = (database): void => {
    Roles.hasMany(database.rolepermissions!, {
      foreignKey: "role_id",
      as: "role_permissions",
    });
    Roles.hasMany(database.users!, { foreignKey: "role_id", as: "users" });
  };

  return Roles;
};
