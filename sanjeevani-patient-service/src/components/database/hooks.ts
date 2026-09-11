import type { Model, ModelStatic } from "sequelize";

import { DataTypes } from "sequelize";

import { KeyGenerators } from "@/utils/keygenerators.js";

export interface ModelExtendedInstance<M extends Model = Model>
  extends ModelStatic<M> {
  id_prefix: string;
  associate?: (database: Record<string, ModelStatic<Model>>) => void;
}

/** Every table uses a readable string PK (`ENC-20260910-aBcD123`). */
export const ENTITY_ID_COLUMN = {
  type: DataTypes.STRING(64),
  primaryKey: true,
  allowNull: false,
};

/**
 * Who touched the row. Deliberately plain string columns rather than FKs so a
 * deactivated clinician can never cascade-delete clinical history.
 */
export const AUDIT_COLUMNS = {
  created_by: { type: DataTypes.STRING(64), allowNull: true },
  updated_by: { type: DataTypes.STRING(64), allowNull: true },
  deleted_by: { type: DataTypes.STRING(64), allowNull: true },
};

export const attachEntityIdHook = <M extends Model>(
  model: ModelStatic<M>,
  prefix: string,
): void => {
  const assignId = (instance: M): void => {
    if (!instance.getDataValue("id" as keyof M["_attributes"])) {
      instance.setDataValue(
        "id" as keyof M["_attributes"],
        KeyGenerators.entityId(prefix) as never,
      );
    }
  };

  model.beforeValidate(assignId);

  // bulkCreate skips validation (and therefore beforeValidate) unless asked
  // to run per-row hooks, so batched inserts need their own pass.
  model.beforeBulkCreate((instances) => {
    for (const instance of instances) assignId(instance);
  });
};
