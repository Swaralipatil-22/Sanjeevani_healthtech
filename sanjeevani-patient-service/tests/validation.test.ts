import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import { EncounterManagementSchema } from "@/global/validations/schemas/encounters/index.js";
import { PatientManagementSchema } from "@/global/validations/schemas/patients/index.js";
import {
  ENCOUNTER_SEVERITY,
  ENCOUNTER_VISIT_TYPES,
  GENDER_TYPES,
} from "@/types/index.js";

const VALID_ENCOUNTER = {
  patient_id: "PATIENT-20260910-aBcD123",
  facility_id: "FACILITY-20260910-QwErT12",
  diagnosis_category_id: "DIAGNOSIS-CATEGORY-20260910-Zx1",
  encounter_date: dayjs().subtract(1, "hour").toISOString(),
  visit_type: ENCOUNTER_VISIT_TYPES.NEW_CONSULTATION,
  chief_complaint: "High-grade fever for three days",
  symptoms: ["Fever", "Headache"],
  diagnosis: "Acute viral fever",
  severity: ENCOUNTER_SEVERITY.MILD,
  treatment: "Paracetamol 500mg TDS for three days, oral fluids",
  vitals: { systolic_bp: 120, diastolic_bp: 80 },
};

const VALID_PATIENT = {
  age: 34,
  gender: GENDER_TYPES.FEMALE,
  district: "Raigad",
  state: "Maharashtra",
  facility_id: "FACILITY-20260910-QwErT12",
};

describe("encounter validation", () => {
  it("accepts a complete encounter", async () => {
    await expect(
      EncounterManagementSchema.validate(VALID_ENCOUNTER),
    ).resolves.toBeTruthy();
  });

  it("rejects an encounter dated in the future", async () => {
    await expect(
      EncounterManagementSchema.validate({
        ...VALID_ENCOUNTER,
        encounter_date: dayjs().add(2, "day").toISOString(),
      }),
    ).rejects.toThrowError(/cannot be recorded in the future/i);
  });

  it("requires at least one symptom", async () => {
    await expect(
      EncounterManagementSchema.validate({
        ...VALID_ENCOUNTER,
        symptoms: [],
      }),
    ).rejects.toThrowError(/at least one symptom/i);
  });

  it("rejects an incomplete encounter", async () => {
    await expect(
      EncounterManagementSchema.validate({
        ...VALID_ENCOUNTER,
        diagnosis: "",
        treatment: "",
      }),
    ).rejects.toBeTruthy();
  });

  it("rejects a physiologically impossible temperature", async () => {
    await expect(
      EncounterManagementSchema.validate({
        ...VALID_ENCOUNTER,
        vitals: { temperature_celsius: 61 },
      }),
    ).rejects.toBeTruthy();
  });

  it("rejects a follow-up scheduled before the encounter", async () => {
    await expect(
      EncounterManagementSchema.validate({
        ...VALID_ENCOUNTER,
        follow_up_date: dayjs().subtract(10, "day").toISOString(),
      }),
    ).rejects.toThrowError(/after the encounter date/i);
  });

  it("rejects an unknown severity", async () => {
    await expect(
      EncounterManagementSchema.validate({
        ...VALID_ENCOUNTER,
        severity: "CATASTROPHIC",
      }),
    ).rejects.toBeTruthy();
  });

  it("strips fields the client is not allowed to set", async () => {
    const result = await EncounterManagementSchema.validate(
      { ...VALID_ENCOUNTER, clinician_id: "USER-someone-else" },
      { stripUnknown: true },
    );

    // The clinician is taken from the token, never the payload.
    expect(result).not.toHaveProperty("clinician_id");
  });
});

describe("patient validation", () => {
  it("accepts a valid anonymised patient", async () => {
    await expect(
      PatientManagementSchema.validate(VALID_PATIENT),
    ).resolves.toBeTruthy();
  });

  it("rejects an out-of-range age", async () => {
    await expect(
      PatientManagementSchema.validate({ ...VALID_PATIENT, age: 190 }),
    ).rejects.toThrowError(/120 or below/i);

    await expect(
      PatientManagementSchema.validate({ ...VALID_PATIENT, age: -1 }),
    ).rejects.toThrowError(/cannot be negative/i);
  });

  it("requires a facility", async () => {
    await expect(
      PatientManagementSchema.validate({ ...VALID_PATIENT, facility_id: "" }),
    ).rejects.toThrowError(/facility is required/i);
  });

  it("accepts Devanagari place names", async () => {
    await expect(
      PatientManagementSchema.validate({
        ...VALID_PATIENT,
        district: "रायगड",
      }),
    ).resolves.toBeTruthy();
  });
});
