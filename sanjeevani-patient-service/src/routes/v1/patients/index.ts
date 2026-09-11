import { Router } from "express";

import {
  createPatient,
  deletePatientById,
  exportPatients,
  getPatientById,
  listPatients,
  updatePatientById,
} from "@/controllers/patients/index.controller.js";
import { AuthGuard } from "@/global/middlewares/authguards/index.js";
import { RouteGuard } from "@/global/middlewares/routeguards/index.js";
import { GlobalRequestValidator } from "@/global/validations/index.js";
import { IdParamSchema } from "@/global/validations/schemas/common/index.js";
import {
  ListPatientsSchema,
  PatientManagementSchema,
} from "@/global/validations/schemas/patients/index.js";
import {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/types/index.js";

const router: Router = Router();

const READ_GUARD = RouteGuard(
  PERMISSION_MODULES.PATIENT_MANAGEMENT,
  PERMISSION_SUB_MODULES.PATIENTS_MANAGEMENT,
  [PERMISSIONS.READ_ALL, PERMISSIONS.READ_OWNED],
);

const WRITE_GUARD = RouteGuard(
  PERMISSION_MODULES.PATIENT_MANAGEMENT,
  PERMISSION_SUB_MODULES.PATIENTS_MANAGEMENT,
  [PERMISSIONS.WRITE_ALL, PERMISSIONS.WRITE_OWNED],
);

router.use(AuthGuard);

router.post(
  "/list",
  READ_GUARD,
  GlobalRequestValidator(ListPatientsSchema),
  listPatients,
);

router.post(
  "/export",
  READ_GUARD,
  GlobalRequestValidator(ListPatientsSchema),
  exportPatients,
);

router.post(
  "/",
  WRITE_GUARD,
  GlobalRequestValidator(PatientManagementSchema),
  createPatient,
);

router.post(
  "/update/:id",
  WRITE_GUARD,
  GlobalRequestValidator(IdParamSchema, "params"),
  GlobalRequestValidator(PatientManagementSchema),
  updatePatientById,
);

router.post(
  "/delete/:id",
  WRITE_GUARD,
  GlobalRequestValidator(IdParamSchema, "params"),
  deletePatientById,
);

router.get(
  "/:id",
  READ_GUARD,
  GlobalRequestValidator(IdParamSchema, "params"),
  getPatientById,
);

export default router;
