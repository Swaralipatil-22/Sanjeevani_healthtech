import { Router } from "express";

import {
  listClinicians,
  listDiagnosisCategories,
  listFacilities,
} from "@/controllers/masters/index.controller.js";
import { AuthGuard } from "@/global/middlewares/authguards/index.js";

const router: Router = Router();

router.use(AuthGuard);

router.get("/facilities", listFacilities);
router.get("/diagnosis-categories", listDiagnosisCategories);
router.get("/clinicians", listClinicians);

export default router;
