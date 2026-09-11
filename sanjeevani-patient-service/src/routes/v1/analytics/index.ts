import { Router } from "express";

import {
  getAnalyticsDistribution,
  getAnalyticsOverview,
  getAnalyticsTrends,
} from "@/controllers/analytics/index.controller.js";
import { AuthGuard } from "@/global/middlewares/authguards/index.js";
import { RouteGuard } from "@/global/middlewares/routeguards/index.js";
import { GlobalRequestValidator } from "@/global/validations/index.js";
import { AnalyticsQuerySchema } from "@/global/validations/schemas/analytics/index.js";
import {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/types/index.js";

const router: Router = Router();

const DASHBOARD_GUARD = RouteGuard(
  PERMISSION_MODULES.ANALYTICS,
  PERMISSION_SUB_MODULES.DASHBOARD,
  [PERMISSIONS.READ_ALL],
);

router.use(AuthGuard, DASHBOARD_GUARD);

router.get(
  "/overview",
  GlobalRequestValidator(AnalyticsQuerySchema, "query"),
  getAnalyticsOverview,
);

router.get(
  "/trends",
  GlobalRequestValidator(AnalyticsQuerySchema, "query"),
  getAnalyticsTrends,
);

router.get(
  "/distribution",
  GlobalRequestValidator(AnalyticsQuerySchema, "query"),
  getAnalyticsDistribution,
);

export default router;
