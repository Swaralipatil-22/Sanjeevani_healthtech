import type { Sequelize } from "sequelize";

import { DataTypes } from "sequelize";

import type { ModelExtendedInstance } from "@/components/database/hooks.js";
import type { DiagnosisCategoryAttributes } from "@/components/database/models/diagnosiscategories/index.type.js";

import {
  attachEntityIdHook,
  ENTITY_ID_COLUMN,
} from "@/components/database/hooks.js";

export const ID_PREFIX = "DIAGNOSIS-CATEGORY";

export const defineDiagnosisCategories = (
  sequelize: Sequelize,
): ModelExtendedInstance<DiagnosisCategoryAttributes> => {
  const DiagnosisCategories = sequelize.define<DiagnosisCategoryAttributes>(
    "diagnosiscategories",
    {
      id: ENTITY_ID_COLUMN,
      code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(128), allowNull: false },
      description: { type: DataTypes.STRING(255), allowNull: false },
      // Notifiable diseases must be reported to the district health office,
      // so the dashboard surfaces them separately.
      is_notifiable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: "diagnosiscategories",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  ) as ModelExtendedInstance<DiagnosisCategoryAttributes>;

  DiagnosisCategories.id_prefix = ID_PREFIX;
  attachEntityIdHook(DiagnosisCategories, ID_PREFIX);

  DiagnosisCategories.associate = (database): void => {
    DiagnosisCategories.hasMany(database.encounters!, {
      foreignKey: "diagnosis_category_id",
      as: "encounters",
    });
  };

  return DiagnosisCategories;
};
