"use client";

import _ from "lodash";

import type {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/constants/global/enums";
import type { ResolvedPermission } from "@/types";

import { useAppSelector } from "@/store/hooks";

export const usePermissions = (): ResolvedPermission[] =>
  useAppSelector((state) => _.get(state, "profile.data.permissions", []) ?? []);

/**
 * True when the signed-in user holds ANY of the listed permissions on the
 * given module/sub-module. Mirrors the server-side RouteGuard exactly, so the
 * UI hides what the API would refuse.
 */
export const useHasPermission = (
  module: PERMISSION_MODULES,
  subModule: PERMISSION_SUB_MODULES,
  allowed: PERMISSIONS[],
): boolean => {
  const permissions = usePermissions();

  return permissions.some(
    (item) =>
      item.module === module &&
      item.sub_module === subModule &&
      _.includes(allowed, item.name),
  );
};

export const hasPermission = (
  permissions: ResolvedPermission[],
  module: string,
  subModule: string,
  allowed: string[],
): boolean =>
  permissions.some(
    (item) =>
      item.module === module &&
      item.sub_module === subModule &&
      _.includes(allowed, item.name),
  );
