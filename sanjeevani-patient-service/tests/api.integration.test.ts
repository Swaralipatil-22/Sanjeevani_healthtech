import _ from "lodash";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { databaseManager } from "@/components/database/index.js";
import { runSeeder } from "@/components/database/seeder.js";
import { application } from "@/index.js";
import { env } from "@/utils/env.js";

const BASE = `${env.SERVICE_BASE_PATH}/api/v1`;
const PASSWORD = env.SEED_DEFAULT_PASSWORD;

/**
 * These exercise the real Express app against a real PostgreSQL instance.
 * Without a reachable database they are skipped rather than failing, so
 * `npm test` stays green on a machine with no local Postgres.
 */
const isDatabaseReachable = async (): Promise<boolean> => {
  try {
    await databaseManager.driver.authenticate();
    return true;
  } catch {
    return false;
  }
};

const hasDatabase = await isDatabaseReachable();

describe.skipIf(!hasDatabase)("patient service API", () => {
  let doctorToken = "";
  let nurseToken = "";
  let adminToken = "";

  // Records the suite creates, hard-deleted afterwards so repeated runs do
  // not silently inflate the demo dataset.
  const created = { patientIds: [] as string[], encounterIds: [] as string[] };

  const signIn = async (email: string): Promise<string> => {
    const response = await request(application)
      .post(`${BASE}/auth/login`)
      .send({ email, password: PASSWORD });

    expect(response.status).toBe(200);
    return _.get(response.body, "data.access_token") as string;
  };

  beforeAll(async () => {
    await databaseManager.bootstrap();
    await runSeeder();

    doctorToken = await signIn("doctor@sanjeevani.health");
    nurseToken = await signIn("nurse@sanjeevani.health");
    adminToken = await signIn("admin@sanjeevani.health");
  }, 120_000);

  afterAll(async () => {
    if (created.encounterIds.length > 0) {
      await databaseManager.models.encounters.destroy({
        where: { id: created.encounterIds },
        force: true,
      });
    }

    if (created.patientIds.length > 0) {
      await databaseManager.models.patients.destroy({
        where: { id: created.patientIds },
        force: true,
      });
    }

    await databaseManager.close();
  });

  describe("health check", () => {
    it("reports the database as up", async () => {
      const response = await request(application).get(
        `${env.SERVICE_BASE_PATH}/health-check`,
      );

      expect(response.status).toBe(200);
      expect(_.get(response.body, "data.dependencies.database")).toBe("UP");
    });
  });

  describe("authentication", () => {
    it("rejects a wrong password without revealing the account exists", async () => {
      const response = await request(application)
        .post(`${BASE}/auth/login`)
        .send({ email: "doctor@sanjeevani.health", password: "wrong-password" });

      expect(response.status).toBe(401);
      expect(_.get(response.body, "data.detail")).toBe(
        "Invalid email address or password.",
      );
    });

    it("returns the same message for an unknown account", async () => {
      const response = await request(application)
        .post(`${BASE}/auth/login`)
        .send({ email: "nobody@sanjeevani.health", password: "whatever" });

      expect(response.status).toBe(401);
      expect(_.get(response.body, "data.detail")).toBe(
        "Invalid email address or password.",
      );
    });

    it("refuses an unauthenticated request", async () => {
      const response = await request(application).post(
        `${BASE}/encounters/list`,
      );
      expect(response.status).toBe(401);
    });

    it("refuses a malformed token", async () => {
      const response = await request(application)
        .post(`${BASE}/encounters/list`)
        .set("authorization", "Bearer not-a-real-token")
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe("role-based access control", () => {
    it("lets an administrator read the dashboard", async () => {
      const response = await request(application)
        .get(`${BASE}/analytics/overview`)
        .set("authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(_.get(response.body, "data.total_encounters")).toBeTypeOf(
        "number",
      );
    });

    it("denies a doctor the dashboard", async () => {
      const response = await request(application)
        .get(`${BASE}/analytics/overview`)
        .set("authorization", `Bearer ${doctorToken}`);

      expect(response.status).toBe(403);
      expect(_.get(response.body, "data.code")).toBe("PERMISSION_DENIED");
    });

    it("denies a nurse the audit trail", async () => {
      const response = await request(application)
        .post(`${BASE}/audit-logs/list`)
        .set("authorization", `Bearer ${nurseToken}`)
        .send({});

      expect(response.status).toBe(403);
    });

    it("denies an administrator any clinical write", async () => {
      const response = await request(application)
        .post(`${BASE}/encounters`)
        .set("authorization", `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(403);
    });

    it("records denied attempts in the audit trail", async () => {
      await request(application)
        .get(`${BASE}/analytics/overview`)
        .set("authorization", `Bearer ${doctorToken}`);

      const response = await request(application)
        .post(`${BASE}/audit-logs/list`)
        .set("authorization", `Bearer ${adminToken}`)
        .send({ filter: { action: ["PERMISSION_DENIED"] }, page: 1, limit: 5 });

      expect(response.status).toBe(200);
      expect(_.get(response.body, "data.count")).toBeGreaterThan(0);
    });
  });

  describe("ownership scoping", () => {
    it("shows a nurse only their own encounters", async () => {
      const response = await request(application)
        .post(`${BASE}/encounters/list`)
        .set("authorization", `Bearer ${nurseToken}`)
        .send({ page: 1, limit: 100 });

      expect(response.status).toBe(200);

      const nurseProfile = await request(application)
        .get(`${BASE}/auth/profile`)
        .set("authorization", `Bearer ${nurseToken}`);

      const nurseId = _.get(nurseProfile.body, "data.id");
      const rows = _.get(response.body, "data.data", []) as {
        clinician_id: string;
      }[];

      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((row) => row.clinician_id === nurseId)).toBe(true);
    });

    it("shows a doctor encounters from more than one clinician", async () => {
      const response = await request(application)
        .post(`${BASE}/encounters/list`)
        .set("authorization", `Bearer ${doctorToken}`)
        .send({ page: 1, limit: 200 });

      const clinicians = _.uniq(
        _.map(_.get(response.body, "data.data", []), "clinician_id"),
      );

      expect(clinicians.length).toBeGreaterThan(1);
    });
  });

  describe("encounter lifecycle", () => {
    let patientId = "";
    let encounterId = "";

    it("registers an anonymised patient", async () => {
      const facilities = await request(application)
        .get(`${BASE}/masters/facilities`)
        .set("authorization", `Bearer ${doctorToken}`);

      const facilityId = _.get(facilities.body, "data.data.0.id") as string;

      const response = await request(application)
        .post(`${BASE}/patients`)
        .set("authorization", `Bearer ${doctorToken}`)
        .send({
          age: 41,
          gender: "FEMALE",
          district: "Raigad",
          state: "Maharashtra",
          facility_id: facilityId,
          chronic_conditions: ["Hypertension"],
        });

      expect(response.status).toBe(201);
      expect(_.get(response.body, "data.patient_code")).toMatch(/^SNJ-PT-\d{6}$/);

      // No direct identifier is ever persisted.
      expect(response.body.data).not.toHaveProperty("name");
      expect(response.body.data).not.toHaveProperty("phone");

      patientId = _.get(response.body, "data.id") as string;
      created.patientIds.push(patientId);
    });

    it("rejects an invalid patient payload with a readable message", async () => {
      const response = await request(application)
        .post(`${BASE}/patients`)
        .set("authorization", `Bearer ${doctorToken}`)
        .send({ age: 900, gender: "UNKNOWN" });

      expect(response.status).toBe(422);
      expect(_.get(response.body, "data.detail")).toBeTypeOf("string");
    });

    it("records an encounter against the patient", async () => {
      const categories = await request(application)
        .get(`${BASE}/masters/diagnosis-categories`)
        .set("authorization", `Bearer ${doctorToken}`);

      const facilities = await request(application)
        .get(`${BASE}/masters/facilities`)
        .set("authorization", `Bearer ${doctorToken}`);

      const response = await request(application)
        .post(`${BASE}/encounters`)
        .set("authorization", `Bearer ${doctorToken}`)
        .send({
          patient_id: patientId,
          facility_id: _.get(facilities.body, "data.data.0.id"),
          diagnosis_category_id: _.get(categories.body, "data.data.0.id"),
          encounter_date: new Date().toISOString(),
          visit_type: "NEW_CONSULTATION",
          chief_complaint: "Persistent headache for a week",
          symptoms: ["Headache", "Giddiness"],
          diagnosis: "Essential hypertension - stage 1",
          severity: "MODERATE",
          status: "UNDER_TREATMENT",
          treatment: "Amlodipine 5mg OD, review in four weeks",
          vitals: { systolic_bp: 150, diastolic_bp: 95 },
        });

      expect(response.status).toBe(201);
      encounterId = _.get(response.body, "data.id") as string;
      created.encounterIds.push(encounterId);
    });

    it("attributes the encounter to the signed-in clinician, not the payload", async () => {
      const profile = await request(application)
        .get(`${BASE}/auth/profile`)
        .set("authorization", `Bearer ${doctorToken}`);

      const response = await request(application)
        .get(`${BASE}/encounters/${encounterId}`)
        .set("authorization", `Bearer ${doctorToken}`);

      expect(_.get(response.body, "data.clinician_id")).toBe(
        _.get(profile.body, "data.id"),
      );
    });

    it("hides another clinician's encounter from a nurse", async () => {
      const response = await request(application)
        .get(`${BASE}/encounters/${encounterId}`)
        .set("authorization", `Bearer ${nurseToken}`);

      // A 404 rather than a 403 - the nurse learns nothing about its existence.
      expect(response.status).toBe(404);
    });

    it("refuses to delete a patient who has clinical history", async () => {
      const response = await request(application)
        .post(`${BASE}/patients/delete/${patientId}`)
        .set("authorization", `Bearer ${doctorToken}`);

      expect(response.status).toBe(409);
      expect(_.get(response.body, "data.detail")).toMatch(/cannot be removed/i);
    });

    it("soft-deletes the encounter and drops it from the list", async () => {
      const response = await request(application)
        .post(`${BASE}/encounters/delete/${encounterId}`)
        .set("authorization", `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);

      const after = await request(application)
        .get(`${BASE}/encounters/${encounterId}`)
        .set("authorization", `Bearer ${doctorToken}`);

      expect(after.status).toBe(404);
    });
  });

  describe("response envelope", () => {
    it("wraps every response with correlation metadata", async () => {
      const response = await request(application)
        .post(`${BASE}/encounters/list`)
        .set("authorization", `Bearer ${doctorToken}`)
        .send({ page: 1, limit: 1 });

      expect(response.body).toMatchObject({
        success: true,
        status_code: 200,
      });
      expect(response.body.request_id).toBeTypeOf("string");
      expect(response.body.data.count).toBeTypeOf("number");
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it("returns a 404 envelope for an unknown route", async () => {
      const response = await request(application).get(`${BASE}/nowhere`);

      expect(response.status).toBe(404);
      expect(_.get(response.body, "data.detail")).toBeTypeOf("string");
    });
  });
});

describe.skipIf(hasDatabase)("patient service API", () => {
  it("skipped - no PostgreSQL reachable with the configured DB_* settings", () => {
    expect(hasDatabase).toBe(false);
  });
});
