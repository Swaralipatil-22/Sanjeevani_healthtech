import type { Sequelize } from "sequelize";

import { DataTypes } from "sequelize";

import type { ModelExtendedInstance } from "@/components/database/hooks.js";
import type { AuditLogAttributes } from "@/components/database/models/auditlogs/index.type.js";

import {
  attachEntityIdHook,
  ENTITY_ID_COLUMN,
} from "@/components/database/hooks.js";
import { AUDIT_ACTIONS, AUDIT_STATUS } from "@/types/index.js";

export const ID_PREFIX = "AUDIT";

/**
 * Append-only: no updated_at, no soft delete, and no update path anywhere in
 * the service. An audit row that can be edited is not an audit row.
 */
export const defineAuditLogs = (
  sequelize: Sequelize,
): ModelExtendedInstance<AuditLogAttributes> => {
  const AuditLogs = sequelize.define<AuditLogAttributes>(
    "auditlogs",
    {
      id: ENTITY_ID_COLUMN,
      user_id: { type: DataTypes.STRING(64), allowNull: true },
      actor_email: { type: DataTypes.STRING(255), allowNull: true },
      action: {
        type: DataTypes.ENUM(...Object.values(AUDIT_ACTIONS)),
        allowNull: false,
      },
      entity_type: { type: DataTypes.STRING(64), allowNull: false },
      entity_id: { type: DataTypes.STRING(64), allowNull: true },
      status: {
        type: DataTypes.ENUM(...Object.values(AUDIT_STATUS)),
        allowNull: false,
      },
      ip_address: { type: DataTypes.STRING(64), allowNull: true },
      user_agent: { type: DataTypes.STRING(512), allowNull: true },
      request_id: { type: DataTypes.STRING(64), allowNull: true },
      metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      created_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: "auditlogs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        { fields: ["user_id"] },
        { fields: ["action"] },
        { fields: ["entity_type", "entity_id"] },
        { fields: ["created_at"] },
      ],
    },
  ) as ModelExtendedInstance<AuditLogAttributes>;

  AuditLogs.id_prefix = ID_PREFIX;
  attachEntityIdHook(AuditLogs, ID_PREFIX);

  AuditLogs.associate = (database): void => {
    AuditLogs.belongsTo(database.users!, {
      foreignKey: "user_id",
      as: "user_details",
    });
  };

  return AuditLogs;
};
