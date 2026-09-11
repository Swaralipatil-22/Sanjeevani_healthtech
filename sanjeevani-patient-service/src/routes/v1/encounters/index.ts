import { Router } from "express";

import {
  createEncounter,
  deleteEncounterById,
  exportEncounters,
  getEncounterById,
  listEncounters,
  updateEncounterById,
} from "@/controllers/encounters/index.controller.js";
import { AuthGuard } from "@/global/middlewares/authguards/index.js";
import { RouteGuard } from "@/global/middlewares/routeguards/index.js";
import { GlobalRequestValidator } from "@/global/validations/index.js";
import { IdParamSchema } from "@/global/validations/schemas/common/index.js";
import {
  EncounterManagementSchema,
  ListEncountersSchema,
} from "@/global/validations/schemas/encounters/index.js";
import {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/types/index.js";

const router: Router = Router();

const READ_GUARD = RouteGuard(
  PERMISSION_MODULES.PATIENT_MANAGEMENT,
  PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT,
  [PERMISSIONS.READ_ALL, PERMISSIONS.READ_OWNED],
);

const WRITE_GUARD = RouteGuard(
  PERMISSION_MODULES.PATIENT_MANAGEMENT,
  PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT,
  [PERMISSIONS.WRITE_ALL, PERMISSIONS.WRITE_OWNED],
);

router.use(AuthGuard);

router.post(
  "/list",
  READ_GUARD,
  GlobalRequestValidator(ListEncountersSchema),
  listEncounters,
);

router.post(
  "/export",
  READ_GUARD,
  GlobalRequestValidator(ListEncountersSchema),
  exportEncounters,
);

router.post(
  "/",
  WRITE_GUARD,
  GlobalRequestValidator(EncounterManagementSchema),
  createEncounter,
);

router.post(
  "/update/:id",
  WRITE_GUARD,
  GlobalRequestValidator(IdParamSchema, "params"),
  GlobalRequestValidator(EncounterManagementSchema),
  updateEncounterById,
);

router.post(
  "/delete/:id",
  WRITE_GUARD,
  GlobalRequestValidator(IdParamSchema, "params"),
  deleteEncounterById,
);

router.get(
  "/:id",
  READ_GUARD,
  GlobalRequestValidator(IdParamSchema, "params"),
  getEncounterById,
);

export default router;
