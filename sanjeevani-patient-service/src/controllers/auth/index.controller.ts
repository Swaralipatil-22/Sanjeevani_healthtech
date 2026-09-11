import type { NextFunction, Request, Response } from "express";

import bcrypt from "bcryptjs";
import _ from "lodash";

import type { JWTPayload, ROLES } from "@/types/index.js";

import { databaseManager } from "@/components/database/index.js";
import { Repositories } from "@/components/repositories/index.js";
import { resolveRolePermissions } from "@/global/middlewares/authguards/index.js";
import { AuditService } from "@/services/audit/index.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_STATUS,
  USER_STATUS_TYPES,
} from "@/types/index.js";
import { CustomError } from "@/utils/customerror.js";
import { env } from "@/utils/env.js";
import { JWT } from "@/utils/jwt.js";

const buildUserProfile = (user: Record<string, unknown>): JWTPayload => ({
  id: _.get(user, "id") as string,
  email: _.get(user, "email") as string,
  employee_id: _.get(user, "employee_id") as string,
  first_name: _.get(user, "first_name") as string,
  last_name: _.get(user, "last_name") as string,
  role: _.get(user, "role_details.name") as ROLES,
  role_id: _.get(user, "role_id") as string,
  facility_id: (_.get(user, "facility_id") as string | null) ?? null,
});

export const login = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    const user = await Repositories.UsersRepository.model
      .scope("withPassword")
      .findOne({
        where: { email },
        include: [
          {
            model: databaseManager.models.roles,
            as: "role_details",
            attributes: ["id", "name"],
          },
          {
            model: databaseManager.models.facilities,
            as: "facility_details",
            attributes: ["id", "code", "name", "district", "state"],
          },
        ],
      });

    const isPasswordValid = user
      ? await bcrypt.compare(password, user.get("password_hash") as string)
      : false;

    // Identical response for "no such user" and "wrong password" so the
    // endpoint cannot be used to enumerate valid clinician accounts.
    if (!user || !isPasswordValid) {
      void AuditService.record(request, {
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        entity_type: "USER",
        entity_id: user ? (user.get("id") as string) : null,
        status: AUDIT_STATUS.FAILURE,
        actor_email: email,
        user_id: user ? (user.get("id") as string) : null,
        metadata: { reason: user ? "INVALID_PASSWORD" : "UNKNOWN_EMAIL" },
      });

      throw new CustomError(401, "Invalid email address or password.");
    }

    if (user.get("status") !== USER_STATUS_TYPES.ACTIVE) {
      throw new CustomError(
        403,
        "This account has been deactivated. Contact your administrator.",
      );
    }

    const profile = buildUserProfile(user.toJSON() as Record<string, unknown>);
    const token = JWT.sign(profile);
    const permissions = await resolveRolePermissions(profile.role_id);

    await Repositories.UsersRepository.update(
      { last_login_at: new Date() } as never,
      { where: { id: profile.id } },
    );

    void AuditService.record(request, {
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      entity_type: "USER",
      entity_id: profile.id,
      status: AUDIT_STATUS.SUCCESS,
      user_id: profile.id,
      actor_email: profile.email,
    });

    response.customResponse(
      200,
      {
        access_token: token,
        expires_in: JWT.expiresInSeconds(),
        user: {
          ...profile,
          facility_details: _.get(user.toJSON(), "facility_details", null),
        },
        permissions,
      },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const logout = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    void AuditService.record(request, {
      action: AUDIT_ACTIONS.LOGOUT,
      entity_type: "USER",
      entity_id: request.decoded_user?.id ?? null,
      status: AUDIT_STATUS.SUCCESS,
    });

    response.customResponse(
      200,
      { detail: "Signed out successfully." },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const getProfile = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await Repositories.UsersRepository.findByPK(
      request.decoded_user!.id,
      {
        include: [
          {
            model: databaseManager.models.roles,
            as: "role_details",
            attributes: ["id", "name", "description"],
          },
          {
            model: databaseManager.models.facilities,
            as: "facility_details",
            attributes: ["id", "code", "name", "district", "state", "type"],
          },
        ],
      },
    );

    if (!user) throw new CustomError(404, "User not found.");

    const permissions = await resolveRolePermissions(
      request.decoded_user!.role_id,
    );

    response.customResponse(
      200,
      { ...(user.toJSON() as Record<string, unknown>), permissions },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};

export const changePassword = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { current_password, new_password } = request.body as {
      current_password: string;
      new_password: string;
    };

    const user = await Repositories.UsersRepository.model
      .scope("withPassword")
      .findByPk(request.decoded_user!.id);

    if (!user) throw new CustomError(404, "User not found.");

    const isCurrentValid = await bcrypt.compare(
      current_password,
      user.get("password_hash") as string,
    );

    if (!isCurrentValid) {
      throw new CustomError(400, "Your current password is incorrect.");
    }

    await Repositories.UsersRepository.update(
      {
        password_hash: await bcrypt.hash(new_password, env.BCRYPT_SALT_ROUNDS),
        updated_by: request.decoded_user!.id,
      } as never,
      { where: { id: request.decoded_user!.id } },
    );

    response.customResponse(
      200,
      { detail: "Password updated successfully." },
      true,
      request.request_id,
      request.request_timestamp,
    );
  } catch (error) {
    next(CustomError.from(error));
  }
};
