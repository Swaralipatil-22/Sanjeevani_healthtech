import { Router } from "express";

import {
  createUser,
  getUserById,
  listUsers,
  updateUserById,
} from "@/controllers/users/index.controller.js";
import { AuthGuard } from "@/global/middlewares/authguards/index.js";
import { RouteGuard } from "@/global/middlewares/routeguards/index.js";
import { GlobalRequestValidator } from "@/global/validations/index.js";
import { IdParamSchema } from "@/global/validations/schemas/common/index.js";
import {
  ListUsersSchema,
  UserManagementSchema,
} from "@/global/validations/schemas/users/index.js";
import {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/types/index.js";

const router: Router = Router();

const READ_GUARD = RouteGuard(
  PERMISSION_MODULES.ADMINISTRATION,
  PERMISSION_SUB_MODULES.USERS_MANAGEMENT,
  [PERMISSIONS.READ_ALL],
);

const WRITE_GUARD = RouteGuard(
  PERMISSION_MODULES.ADMINISTRATION,
  PERMISSION_SUB_MODULES.USERS_MANAGEMENT,
  [PERMISSIONS.WRITE_ALL],
);

router.use(AuthGuard);

router.post("/list", READ_GUARD, GlobalRequestValidator(ListUsersSchema), listUsers);

router.post(
  "/",
  WRITE_GUARD,
  GlobalRequestValidator(UserManagementSchema),
  createUser,
);

router.post(
  "/update/:id",
  WRITE_GUARD,
  GlobalRequestValidator(IdParamSchema, "params"),
  GlobalRequestValidator(UserManagementSchema),
  updateUserById,
);

router.get(
  "/:id",
  READ_GUARD,
  GlobalRequestValidator(IdParamSchema, "params"),
  getUserById,
);

export default router;
