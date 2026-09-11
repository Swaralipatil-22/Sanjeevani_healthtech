import type { NextFunction, Request, Response } from "express";

import _ from "lodash";

import { localCacheManager } from "@/components/cache/index.js";
import { databaseManager } from "@/components/database/index.js";
import { Repositories } from "@/components/repositories/index.js";
import { USER_STATUS_TYPES } from "@/types/index.js";
import { CustomError } from "@/utils/customerror.js";
import { JWT } from "@/utils/jwt.js";

export interface ResolvedPermission {
  module: string;
  sub_module: string;
  name: string;
}

const PERMISSIONS_CACHE_TTL_IN_SECONDS = 300;

/**
 * Resolves the permission scopes granted to a role. Cached because it is read
 * on every authenticated request but changes only when an admin edits a role.
 */
export const resolveRolePermissions = async (
  roleId: string,
): Promise<ResolvedPermission[]> => {
  const cacheKey = `role-permissions:${roleId}`;
  const cached =
    localCacheManager.get<ResolvedPermission[]>(cacheKey);
  if (cached) return cached;

  const rows = await Repositories.RolePermissionsRepository.findAll({
    where: { role_id: roleId },
    include: [
      {
        model: databaseManager.models.permissions,
        as: "permission_details",
        attributes: ["module", "sub_module", "name"],
      },
    ],
  });

  const permissions = _.compact(
    rows.map((row) => {
      const details = _.get(row, "permission_details") as
        | ResolvedPermission
        | undefined;
      if (!details) return undefined;

      return {
        module: details.module,
        sub_module: details.sub_module,
        name: details.name,
      };
    }),
  );

  localCacheManager.set(
    cacheKey,
    permissions,
    PERMISSIONS_CACHE_TTL_IN_SECONDS,
  );

  return permissions;
};

export const AuthGuard = async (
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const header = _.get(request, "headers.authorization", "") as string;

    if (!header.startsWith("Bearer ")) {
      throw new CustomError(401, "Authentication is required.");
    }

    const token = header.slice("Bearer ".length).trim();
    const decoded = JWT.verify(token);

    // A token stays cryptographically valid after an account is disabled, so
    // account status is re-checked on every request rather than trusted.
    const user = await Repositories.UsersRepository.findByPK(decoded.id, {
      attributes: ["id", "status", "role_id"],
    });

    if (!user || user.get("status") !== USER_STATUS_TYPES.ACTIVE) {
      throw new CustomError(401, "This account is no longer active.");
    }

    request.access_token = token;
    request.decoded_user = decoded;

    next();
  } catch (error) {
    next(CustomError.from(error));
  }
};
