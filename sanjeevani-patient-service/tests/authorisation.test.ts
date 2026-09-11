import { describe, expect, it } from "vitest";

import { matchClaimedPermissions } from "@/global/middlewares/routeguards/index.js";
import {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/types/index.js";

const grant = (
  module: PERMISSION_MODULES,
  sub_module: PERMISSION_SUB_MODULES,
  name: PERMISSIONS,
): { module: string; sub_module: string; name: string } => ({
  module,
  sub_module,
  name,
});

// The three seeded roles, expressed exactly as the seeder grants them.
const DOCTOR_GRANTS = [
  grant(
    PERMISSION_MODULES.PATIENT_MANAGEMENT,
    PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT,
    PERMISSIONS.READ_ALL,
  ),
  grant(
    PERMISSION_MODULES.PATIENT_MANAGEMENT,
    PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT,
    PERMISSIONS.WRITE_ALL,
  ),
];

const NURSE_GRANTS = [
  grant(
    PERMISSION_MODULES.PATIENT_MANAGEMENT,
    PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT,
    PERMISSIONS.READ_OWNED,
  ),
  grant(
    PERMISSION_MODULES.PATIENT_MANAGEMENT,
    PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT,
    PERMISSIONS.WRITE_OWNED,
  ),
];

const ADMIN_GRANTS = [
  grant(
    PERMISSION_MODULES.ANALYTICS,
    PERMISSION_SUB_MODULES.DASHBOARD,
    PERMISSIONS.READ_ALL,
  ),
  grant(
    PERMISSION_MODULES.ADMINISTRATION,
    PERMISSION_SUB_MODULES.AUDIT_LOGS,
    PERMISSIONS.READ_ALL,
  ),
];

const READ_ENCOUNTERS = [PERMISSIONS.READ_ALL, PERMISSIONS.READ_OWNED];
const WRITE_ENCOUNTERS = [PERMISSIONS.WRITE_ALL, PERMISSIONS.WRITE_OWNED];

describe("route authorisation", () => {
  it("lets a doctor read every encounter", () => {
    const claimed = matchClaimedPermissions(
      DOCTOR_GRANTS,
      PERMISSION_MODULES.PATIENT_MANAGEMENT,
      PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT,
      READ_ENCOUNTERS,
    );

    expect(claimed).toContain(PERMISSIONS.READ_ALL);
  });

  it("scopes a nurse to their own encounters", () => {
    const claimed = matchClaimedPermissions(
      NURSE_GRANTS,
      PERMISSION_MODULES.PATIENT_MANAGEMENT,
      PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT,
      READ_ENCOUNTERS,
    );

    // Passing the guard but WITHOUT READ_ALL is what triggers the ownership
    // filter in the controllers.
    expect(claimed).toEqual([PERMISSIONS.READ_OWNED]);
    expect(claimed).not.toContain(PERMISSIONS.READ_ALL);
  });

  it("refuses an administrator any clinical write", () => {
    const claimed = matchClaimedPermissions(
      ADMIN_GRANTS,
      PERMISSION_MODULES.PATIENT_MANAGEMENT,
      PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT,
      WRITE_ENCOUNTERS,
    );

    expect(claimed).toHaveLength(0);
  });

  it("refuses a doctor the analytics dashboard", () => {
    const claimed = matchClaimedPermissions(
      DOCTOR_GRANTS,
      PERMISSION_MODULES.ANALYTICS,
      PERMISSION_SUB_MODULES.DASHBOARD,
      [PERMISSIONS.READ_ALL],
    );

    expect(claimed).toHaveLength(0);
  });

  it("refuses a nurse the audit trail", () => {
    const claimed = matchClaimedPermissions(
      NURSE_GRANTS,
      PERMISSION_MODULES.ADMINISTRATION,
      PERMISSION_SUB_MODULES.AUDIT_LOGS,
      [PERMISSIONS.READ_ALL],
    );

    expect(claimed).toHaveLength(0);
  });

  it("does not let a grant on one sub-module satisfy another", () => {
    const claimed = matchClaimedPermissions(
      DOCTOR_GRANTS,
      PERMISSION_MODULES.PATIENT_MANAGEMENT,
      PERMISSION_SUB_MODULES.PATIENTS_MANAGEMENT,
      READ_ENCOUNTERS,
    );

    expect(claimed).toHaveLength(0);
  });
});
