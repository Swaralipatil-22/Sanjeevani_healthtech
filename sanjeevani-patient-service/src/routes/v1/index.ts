import { Router } from "express";

import analyticsRoutes from "@/routes/v1/analytics/index.js";
import auditLogRoutes from "@/routes/v1/audit-logs/index.js";
import authRoutes from "@/routes/v1/auth/index.js";
import encounterRoutes from "@/routes/v1/encounters/index.js";
import masterRoutes from "@/routes/v1/masters/index.js";
import patientRoutes from "@/routes/v1/patients/index.js";
import userRoutes from "@/routes/v1/users/index.js";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/masters", masterRoutes);
router.use("/patients", patientRoutes);
router.use("/encounters", encounterRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/audit-logs", auditLogRoutes);
router.use("/users", userRoutes);

export default router;
