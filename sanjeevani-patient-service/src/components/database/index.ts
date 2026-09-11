import type { Model, ModelStatic } from "sequelize";

import { Sequelize } from "sequelize";

import type { ModelExtendedInstance } from "@/components/database/hooks.js";
import type { AuditLogAttributes } from "@/components/database/models/auditlogs/index.type.js";
import type { DiagnosisCategoryAttributes } from "@/components/database/models/diagnosiscategories/index.type.js";
import type { EncounterAttributes } from "@/components/database/models/encounters/index.type.js";
import type { FacilityAttributes } from "@/components/database/models/facilities/index.type.js";
import type { PatientAttributes } from "@/components/database/models/patients/index.type.js";
import type { PermissionAttributes } from "@/components/database/models/permissions/index.type.js";
import type { RolePermissionAttributes } from "@/components/database/models/rolepermissions/index.type.js";
import type { RoleAttributes } from "@/components/database/models/roles/index.type.js";
import type { UserAttributes } from "@/components/database/models/users/index.type.js";

import { defineAuditLogs } from "@/components/database/models/auditlogs/index.model.js";
import { defineDiagnosisCategories } from "@/components/database/models/diagnosiscategories/index.model.js";
import { defineEncounters } from "@/components/database/models/encounters/index.model.js";
import { defineFacilities } from "@/components/database/models/facilities/index.model.js";
import { definePatients } from "@/components/database/models/patients/index.model.js";
import { definePermissions } from "@/components/database/models/permissions/index.model.js";
import { defineRolePermissions } from "@/components/database/models/rolepermissions/index.model.js";
import { defineRoles } from "@/components/database/models/roles/index.model.js";
import { defineUsers } from "@/components/database/models/users/index.model.js";
import { Logger } from "@/logger/index.js";
import { env } from "@/utils/env.js";

export interface Database {
  auditlogs: ModelExtendedInstance<AuditLogAttributes>;
  diagnosiscategories: ModelExtendedInstance<DiagnosisCategoryAttributes>;
  encounters: ModelExtendedInstance<EncounterAttributes>;
  facilities: ModelExtendedInstance<FacilityAttributes>;
  patients: ModelExtendedInstance<PatientAttributes>;
  permissions: ModelExtendedInstance<PermissionAttributes>;
  rolepermissions: ModelExtendedInstance<RolePermissionAttributes>;
  roles: ModelExtendedInstance<RoleAttributes>;
  users: ModelExtendedInstance<UserAttributes>;
}

class DatabaseManager {
  public driver: Sequelize;
  public models!: Database;
  private isBootstrapped = false;

  constructor() {
    this.driver = new Sequelize({
      dialect: "postgres",
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      schema: env.DB_SCHEMA,
      logging: env.DB_LOGGING ? (message): void => Logger.debug(message) : false,
      pool: { max: env.DB_POOL_MAX, min: env.DB_POOL_MIN, idle: 10_000 },
      define: { underscored: true, freezeTableName: true },
      ...(env.DB_SSL
        ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } }
        : {}),
    });

    this.registerModels();
  }

  private registerModels(): void {
    this.models = {
      roles: defineRoles(this.driver),
      permissions: definePermissions(this.driver),
      rolepermissions: defineRolePermissions(this.driver),
      facilities: defineFacilities(this.driver),
      diagnosiscategories: defineDiagnosisCategories(this.driver),
      users: defineUsers(this.driver),
      patients: definePatients(this.driver),
      encounters: defineEncounters(this.driver),
      auditlogs: defineAuditLogs(this.driver),
    };

    const registry = this.models as unknown as Record<
      string,
      ModelStatic<Model>
    >;

    for (const model of Object.values(this.models)) {
      model.associate?.(registry);
    }
  }

  public async connect(): Promise<void> {
    await this.driver.authenticate();
    Logger.info(
      `Database connected: ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`,
    );
  }

  /**
   * `sync({ alter: true })` is intentional for this deployment model: the
   * service owns its schema outright and there is no second writer. A shared
   * database would call for versioned migrations instead.
   */
  public async sync(): Promise<void> {
    if (!env.DB_SYNC) return;
    await this.driver.sync({ alter: true });
    Logger.info("Database schema synchronised.");
  }

  public async bootstrap(): Promise<void> {
    if (this.isBootstrapped) return;
    await this.connect();
    await this.sync();
    this.isBootstrapped = true;
  }

  public getTableName(model: keyof Database): string {
    return this.models[model].getTableName() as string;
  }

  public async isHealthy(): Promise<boolean> {
    try {
      await this.driver.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.driver.close();
    this.isBootstrapped = false;
  }
}

export const databaseManager = new DatabaseManager();
