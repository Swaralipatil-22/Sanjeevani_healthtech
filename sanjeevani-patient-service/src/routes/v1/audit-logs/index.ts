import { Router } from "express";

import {
  exportAuditLogs,
  listAuditLogs,
} from "@/controllers/auditlogs/index.controller.js";
import { AuthGuard } from "@/global/middlewares/authguards/index.js";
import { RouteGuard } from "@/global/middlewares/routeguards/index.js";
import { GlobalRequestValidator } from "@/global/validations/index.js";
import { ListAuditLogsSchema } from "@/global/validations/schemas/auditlogs/index.js";
import {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/types/index.js";

const router: Router = Router();

const AUDIT_GUARD = RouteGuard(
  PERMISSION_MODULES.ADMINISTRATION,
  PERMISSION_SUB_MODULES.AUDIT_LOGS,
  [PERMISSIONS.READ_ALL],
);

router.use(AuthGuard, AUDIT_GUARD);

router.post("/list", GlobalRequestValidator(ListAuditLogsSchema), listAuditLogs);
router.post(
  "/export",
  GlobalRequestValidator(ListAuditLogsSchema),
  exportAuditLogs,
);

export default router;
