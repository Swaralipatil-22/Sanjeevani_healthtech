import { Router } from "express";

import { getHealthCheck } from "@/controllers/healthcheck/index.controller.js";
import v1Routes from "@/routes/v1/index.js";

const router: Router = Router();

router.get("/health-check", getHealthCheck);
router.use("/api/v1", v1Routes);

export default router;
