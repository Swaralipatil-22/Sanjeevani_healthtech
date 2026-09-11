import { Router } from "express";

import {
  changePassword,
  getProfile,
  login,
  logout,
} from "@/controllers/auth/index.controller.js";
import { AuthGuard } from "@/global/middlewares/authguards/index.js";
import { GlobalRequestValidator } from "@/global/validations/index.js";
import {
  ChangePasswordSchema,
  LoginSchema,
} from "@/global/validations/schemas/auth/index.js";

const router: Router = Router();

router.post("/login", GlobalRequestValidator(LoginSchema), login);
router.post("/logout", AuthGuard, logout);
router.get("/profile", AuthGuard, getProfile);
router.post(
  "/change-password",
  AuthGuard,
  GlobalRequestValidator(ChangePasswordSchema),
  changePassword,
);

export default router;
