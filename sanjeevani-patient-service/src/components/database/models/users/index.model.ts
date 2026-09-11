import type { Sequelize } from "sequelize";

import { DataTypes } from "sequelize";

import type { ModelExtendedInstance } from "@/components/database/hooks.js";
import type { UserAttributes } from "@/components/database/models/users/index.type.js";

import {
  attachEntityIdHook,
  AUDIT_COLUMNS,
  ENTITY_ID_COLUMN,
} from "@/components/database/hooks.js";
import { USER_STATUS_TYPES } from "@/types/index.js";

export const ID_PREFIX = "USER";

export const defineUsers = (
  sequelize: Sequelize,
): ModelExtendedInstance<UserAttributes> => {
  const Users = sequelize.define<UserAttributes>(
    "users",
    {
      id: ENTITY_ID_COLUMN,
      employee_id: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      first_name: { type: DataTypes.STRING(64), allowNull: false },
      last_name: { type: DataTypes.STRING(64), allowNull: false },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      role_id: { type: DataTypes.STRING(64), allowNull: false },
      facility_id: { type: DataTypes.STRING(64), allowNull: true },
      status: {
        type: DataTypes.ENUM(...Object.values(USER_STATUS_TYPES)),
        allowNull: false,
        defaultValue: USER_STATUS_TYPES.ACTIVE,
      },
      last_login_at: { type: DataTypes.DATE, allowNull: true },
      ...AUDIT_COLUMNS,
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "users",
      timestamps: true,
      paranoid: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      defaultScope: { attributes: { exclude: ["password_hash"] } },
      scopes: { withPassword: { attributes: { include: ["password_hash"] } } },
    },
  ) as ModelExtendedInstance<UserAttributes>;

  Users.id_prefix = ID_PREFIX;
  attachEntityIdHook(Users, ID_PREFIX);

  Users.associate = (database): void => {
    Users.belongsTo(database.roles!, {
      foreignKey: "role_id",
      as: "role_details",
    });
    Users.belongsTo(database.facilities!, {
      foreignKey: "facility_id",
      as: "facility_details",
    });
    Users.hasMany(database.encounters!, {
      foreignKey: "clinician_id",
      as: "encounters",
    });
  };

  return Users;
};
