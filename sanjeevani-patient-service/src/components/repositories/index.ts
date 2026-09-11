import type {
  Attributes,
  CreationAttributes,
  DestroyOptions,
  FindAndCountOptions,
  FindOptions,
  Model,
  ModelStatic,
  UpdateOptions,
} from "sequelize";

import type { Database } from "@/components/database/index.js";

import { databaseManager } from "@/components/database/index.js";

/**
 * Thin, uniformly-typed data-access layer. Controllers never touch a Sequelize
 * model directly, which keeps query construction in one reviewable place.
 */
export interface Repository<M extends Model> {
  model: ModelStatic<M>;
  findOne: (options: FindOptions<Attributes<M>>) => Promise<M | null>;
  findByPK: (
    id: string,
    options?: Omit<FindOptions<Attributes<M>>, "where">,
  ) => Promise<M | null>;
  findAll: (options?: FindOptions<Attributes<M>>) => Promise<M[]>;
  findAndCountAll: (
    options?: FindAndCountOptions<Attributes<M>>,
  ) => Promise<{ rows: M[]; count: number }>;
  count: (options?: FindOptions<Attributes<M>>) => Promise<number>;
  create: (payload: CreationAttributes<M>) => Promise<M>;
  bulkCreate: (
    payload: CreationAttributes<M>[],
    options?: { updateOnDuplicate?: (keyof Attributes<M>)[] },
  ) => Promise<M[]>;
  update: (
    payload: Partial<Attributes<M>>,
    options: UpdateOptions<Attributes<M>>,
  ) => Promise<number>;
  destroy: (options: DestroyOptions<Attributes<M>>) => Promise<number>;
}

const createRepository = <M extends Model>(
  model: ModelStatic<M>,
): Repository<M> => ({
  model,
  findOne: (options) => model.findOne(options),
  findByPK: (id, options) => model.findByPk(id, options),
  findAll: (options) => model.findAll(options),
  findAndCountAll: async (options) => {
    const result = await model.findAndCountAll(options);
    // findAndCountAll returns an array count when `group` is used; the list
    // endpoints never group, so normalising to a number here is safe.
    return {
      rows: result.rows,
      count: Array.isArray(result.count) ? result.count.length : result.count,
    };
  },
  count: (options) => model.count(options),
  create: (payload) => model.create(payload),
  bulkCreate: (payload, options) =>
    model.bulkCreate(payload, options as never),
  update: async (payload, options) => {
    const [affected] = await model.update(payload, options);
    return affected;
  },
  destroy: (options) => model.destroy(options),
});

const models = databaseManager.models as unknown as Record<
  keyof Database,
  ModelStatic<Model>
>;

export const Repositories = {
  AuditLogsRepository: createRepository(models.auditlogs),
  DiagnosisCategoriesRepository: createRepository(models.diagnosiscategories),
  EncountersRepository: createRepository(models.encounters),
  FacilitiesRepository: createRepository(models.facilities),
  PatientsRepository: createRepository(models.patients),
  PermissionsRepository: createRepository(models.permissions),
  RolePermissionsRepository: createRepository(models.rolepermissions),
  RolesRepository: createRepository(models.roles),
  UsersRepository: createRepository(models.users),
};
