import type { Sequelize } from "sequelize";

import { DataTypes } from "sequelize";

import type { ModelExtendedInstance } from "@/components/database/hooks.js";
import type { RolePermissionAttributes } from "@/components/database/models/rolepermissions/index.type.js";

import {
  attachEntityIdHook,
  ENTITY_ID_COLUMN,
} from "@/components/database/hooks.js";

export const ID_PREFIX = "IAM-ROLE-PERMISSION";

export const defineRolePermissions = (
  sequelize: Sequelize,
): ModelExtendedInstance<RolePermissionAttributes> => {
  const RolePermissions = sequelize.define<RolePermissionAttributes>(
    "rolepermissions",
    {
      id: ENTITY_ID_COLUMN,
      role_id: { type: DataTypes.STRING(64), allowNull: false },
      permission_id: { type: DataTypes.STRING(64), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: "rolepermissions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["role_id", "permission_id"],
          name: "rolepermissions_pair_unique",
        },
      ],
    },
  ) as ModelExtendedInstance<RolePermissionAttributes>;

  RolePermissions.id_prefix = ID_PREFIX;
  attachEntityIdHook(RolePermissions, ID_PREFIX);

  RolePermissions.associate = (database): void => {
    RolePermissions.belongsTo(database.roles!, {
      foreignKey: "role_id",
      as: "role_details",
    });
    RolePermissions.belongsTo(database.permissions!, {
      foreignKey: "permission_id",
      as: "permission_details",
    });
  };

  return RolePermissions;
};
