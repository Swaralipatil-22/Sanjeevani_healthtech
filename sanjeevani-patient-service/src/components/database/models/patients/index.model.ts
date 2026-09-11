import type { Sequelize } from "sequelize";

import { DataTypes } from "sequelize";

import type { ModelExtendedInstance } from "@/components/database/hooks.js";
import type { PatientAttributes } from "@/components/database/models/patients/index.type.js";

import {
  attachEntityIdHook,
  AUDIT_COLUMNS,
  ENTITY_ID_COLUMN,
} from "@/components/database/hooks.js";
import { GENDER_TYPES } from "@/types/index.js";

export const ID_PREFIX = "PATIENT";

/**
 * Patients are pseudonymised by design: the table holds no name, phone,
 * address or government identifier. `patient_code` is the only handle a
 * clinician sees, and it is meaningless outside this system.
 */
export const definePatients = (
  sequelize: Sequelize,
): ModelExtendedInstance<PatientAttributes> => {
  const Patients = sequelize.define<PatientAttributes>(
    "patients",
    {
      id: ENTITY_ID_COLUMN,
      patient_code: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0, max: 120 },
      },
      gender: {
        type: DataTypes.ENUM(...Object.values(GENDER_TYPES)),
        allowNull: false,
      },
      district: { type: DataTypes.STRING(64), allowNull: false },
      state: { type: DataTypes.STRING(64), allowNull: false },
      facility_id: { type: DataTypes.STRING(64), allowNull: false },
      chronic_conditions: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      is_pregnant: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      ...AUDIT_COLUMNS,
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "patients",
      timestamps: true,
      paranoid: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      indexes: [
        { fields: ["facility_id"] },
        { fields: ["district"] },
        { fields: ["created_by"] },
      ],
    },
  ) as ModelExtendedInstance<PatientAttributes>;

  Patients.id_prefix = ID_PREFIX;
  attachEntityIdHook(Patients, ID_PREFIX);

  Patients.associate = (database): void => {
    Patients.belongsTo(database.facilities!, {
      foreignKey: "facility_id",
      as: "facility_details",
    });
    Patients.hasMany(database.encounters!, {
      foreignKey: "patient_id",
      as: "encounters",
    });
  };

  return Patients;
};
