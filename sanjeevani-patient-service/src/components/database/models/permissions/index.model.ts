import type { Sequelize } from "sequelize";

import { DataTypes } from "sequelize";

import type { ModelExtendedInstance } from "@/components/database/hooks.js";
import type { PermissionAttributes } from "@/components/database/models/permissions/index.type.js";

import {
  attachEntityIdHook,
  ENTITY_ID_COLUMN,
} from "@/components/database/hooks.js";
import {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/types/index.js";

export const ID_PREFIX = "IAM-PERMISSION";

export const definePermissions = (
  sequelize: Sequelize,
): ModelExtendedInstance<PermissionAttributes> => {
  const Permissions = sequelize.define<PermissionAttributes>(
    "permissions",
    {
      id: ENTITY_ID_COLUMN,
      module: {
        type: DataTypes.ENUM(...Object.values(PERMISSION_MODULES)),
        allowNull: false,
      },
      sub_module: {
        type: DataTypes.ENUM(...Object.values(PERMISSION_SUB_MODULES)),
        allowNull: false,
      },
      name: {
        type: DataTypes.ENUM(...Object.values(PERMISSIONS)),
        allowNull: false,
      },
      description: { type: DataTypes.STRING(255), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: "permissions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["module", "sub_module", "name"],
          name: "permissions_scope_unique",
        },
      ],
    },
  ) as ModelExtendedInstance<PermissionAttributes>;

  Permissions.id_prefix = ID_PREFIX;
  attachEntityIdHook(Permissions, ID_PREFIX);

  Permissions.associate = (database): void => {
    Permissions.hasMany(database.rolepermissions!, {
      foreignKey: "permission_id",
      as: "role_permissions",
    });
  };

  return Permissions;
};
