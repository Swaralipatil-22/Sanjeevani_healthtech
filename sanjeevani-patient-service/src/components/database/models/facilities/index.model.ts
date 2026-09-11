import type { Sequelize } from "sequelize";

import { DataTypes } from "sequelize";

import type { ModelExtendedInstance } from "@/components/database/hooks.js";
import type { FacilityAttributes } from "@/components/database/models/facilities/index.type.js";

import {
  attachEntityIdHook,
  ENTITY_ID_COLUMN,
} from "@/components/database/hooks.js";
import { FACILITY_TYPES } from "@/types/index.js";

export const ID_PREFIX = "FACILITY";

export const defineFacilities = (
  sequelize: Sequelize,
): ModelExtendedInstance<FacilityAttributes> => {
  const Facilities = sequelize.define<FacilityAttributes>(
    "facilities",
    {
      id: ENTITY_ID_COLUMN,
      code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(128), allowNull: false },
      type: {
        type: DataTypes.ENUM(...Object.values(FACILITY_TYPES)),
        allowNull: false,
      },
      district: { type: DataTypes.STRING(64), allowNull: false },
      state: { type: DataTypes.STRING(64), allowNull: false },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: "facilities",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  ) as ModelExtendedInstance<FacilityAttributes>;

  Facilities.id_prefix = ID_PREFIX;
  attachEntityIdHook(Facilities, ID_PREFIX);

  Facilities.associate = (database): void => {
    Facilities.hasMany(database.patients!, {
      foreignKey: "facility_id",
      as: "patients",
    });
    Facilities.hasMany(database.encounters!, {
      foreignKey: "facility_id",
      as: "encounters",
    });
  };

  return Facilities;
};
