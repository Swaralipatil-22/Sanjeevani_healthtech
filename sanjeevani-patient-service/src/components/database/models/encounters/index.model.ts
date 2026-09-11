import type { Sequelize } from "sequelize";

import { DataTypes } from "sequelize";

import type { ModelExtendedInstance } from "@/components/database/hooks.js";
import type { EncounterAttributes } from "@/components/database/models/encounters/index.type.js";

import {
  attachEntityIdHook,
  AUDIT_COLUMNS,
  ENTITY_ID_COLUMN,
} from "@/components/database/hooks.js";
import {
  ENCOUNTER_SEVERITY,
  ENCOUNTER_STATUS,
  ENCOUNTER_VISIT_TYPES,
} from "@/types/index.js";

export const ID_PREFIX = "ENCOUNTER";

export const defineEncounters = (
  sequelize: Sequelize,
): ModelExtendedInstance<EncounterAttributes> => {
  const Encounters = sequelize.define<EncounterAttributes>(
    "encounters",
    {
      id: ENTITY_ID_COLUMN,
      patient_id: { type: DataTypes.STRING(64), allowNull: false },
      clinician_id: { type: DataTypes.STRING(64), allowNull: false },
      facility_id: { type: DataTypes.STRING(64), allowNull: false },
      diagnosis_category_id: { type: DataTypes.STRING(64), allowNull: false },
      encounter_date: { type: DataTypes.DATE, allowNull: false },
      visit_type: {
        type: DataTypes.ENUM(...Object.values(ENCOUNTER_VISIT_TYPES)),
        allowNull: false,
      },
      chief_complaint: { type: DataTypes.STRING(255), allowNull: false },
      symptoms: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      diagnosis: { type: DataTypes.STRING(255), allowNull: false },
      severity: {
        type: DataTypes.ENUM(...Object.values(ENCOUNTER_SEVERITY)),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(ENCOUNTER_STATUS)),
        allowNull: false,
        defaultValue: ENCOUNTER_STATUS.UNDER_TREATMENT,
      },
      treatment: { type: DataTypes.TEXT, allowNull: false },
      vitals: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      follow_up_date: { type: DataTypes.DATE, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      ...AUDIT_COLUMNS,
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "encounters",
      timestamps: true,
      paranoid: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      indexes: [
        { fields: ["patient_id"] },
        { fields: ["clinician_id"] },
        { fields: ["facility_id"] },
        { fields: ["diagnosis_category_id"] },
        { fields: ["encounter_date"] },
      ],
    },
  ) as ModelExtendedInstance<EncounterAttributes>;

  Encounters.id_prefix = ID_PREFIX;
  attachEntityIdHook(Encounters, ID_PREFIX);

  Encounters.associate = (database): void => {
    Encounters.belongsTo(database.patients!, {
      foreignKey: "patient_id",
      as: "patient_details",
    });
    Encounters.belongsTo(database.users!, {
      foreignKey: "clinician_id",
      as: "clinician_details",
    });
    Encounters.belongsTo(database.facilities!, {
      foreignKey: "facility_id",
      as: "facility_details",
    });
    Encounters.belongsTo(database.diagnosiscategories!, {
      foreignKey: "diagnosis_category_id",
      as: "diagnosis_category_details",
    });
  };

  return Encounters;
};
