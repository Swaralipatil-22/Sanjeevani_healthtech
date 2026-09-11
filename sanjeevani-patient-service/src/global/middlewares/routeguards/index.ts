import type { NextFunction, Request, RequestHandler, Response } from "express";

import _ from "lodash";

import type {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/types/index.js";

import { resolveRolePermissions } from "@/global/middlewares/authguards/index.js";
import { AuditService } from "@/services/audit/index.service.js";
import { AUDIT_ACTIONS, AUDIT_STATUS } from "@/types/index.js";
import { CustomError } from "@/utils/customerror.js";

/**
 * Which of a route's acceptable permissions the caller actually holds.
 * Pure, so the authorisation decision can be unit-tested without Express.
 */
export const matchClaimedPermissions = (
  granted: { module: string; sub_module: string; name: string }[],
  module: string,
  subModule: string,
  allowed: PERMISSIONS[],
): PERMISSIONS[] =>
  allowed.filter((permission) =>
    granted.some(
      (item) =>
        item.module === module &&
        item.sub_module === subModule &&
        item.name === permission,
    ),
  );

/**
 * Declarative per-route authorisation.
 *
 * A route lists the permissions that may satisfy it; the guard records which
 * of them the caller actually holds on `request.permissions_claimed`.
 * Controllers then read that to decide whether to apply an ownership filter —
 * `READ_ALL` sees everything, `READ_OWNED` sees only its own records.
 */
export const RouteGuard =
  (
    module: PERMISSION_MODULES,
    subModule: PERMISSION_SUB_MODULES,
    allowed: PERMISSIONS[],
  ): RequestHandler =>
  async (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = request.decoded_user;
      if (!user) throw new CustomError(401, "Authentication is required.");

      const granted = await resolveRolePermissions(user.role_id);
      const claimed = matchClaimedPermissions(
        granted,
        module,
        subModule,
        allowed,
      );

      if (claimed.length === 0) {
        // Denials are audit events in their own right — an admin needs to see
        // who tried to reach what.
        void AuditService.record(request, {
          action: AUDIT_ACTIONS.PERMISSION_DENIED,
          entity_type: subModule,
          status: AUDIT_STATUS.DENIED,
          metadata: {
            module,
            sub_module: subModule,
            required: allowed,
            path: request.originalUrl,
          },
        });

        throw new CustomError(
          403,
          "You do not have permission to perform this action.",
          [],
          "PERMISSION_DENIED",
        );
      }

      request.permissions_claimed = claimed;
      next();
    } catch (error) {
      next(CustomError.from(error));
    }
  };

/** True when the caller may see every record, not just their own. */
export const hasFullAccess = (
  request: Request,
  permission: PERMISSIONS,
): boolean => _.includes(request.permissions_claimed, permission);
