"use client";

import { ShieldAlertIcon } from "lucide-react";
import type { ReactNode } from "react";

import type {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/constants/global/enums";

import { useHasPermission } from "@/lib/permissions/hooks";

interface PermissionGateProps {
  module: PERMISSION_MODULES;
  subModule: PERMISSION_SUB_MODULES;
  permissions: PERMISSIONS[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Element-level authorisation. `fallback={null}` hides a control entirely;
 * `fallback={<AccessDenied />}` swaps a whole page for a 403 panel without
 * changing the URL.
 */
export function PermissionGate(props: PermissionGateProps) {
  const isAllowed = useHasPermission(
    props.module,
    props.subModule,
    props.permissions,
  );

  if (!isAllowed) return <>{props.fallback ?? null}</>;
  return <>{props.children}</>;
}

export function AccessDenied() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded border p-10 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <ShieldAlertIcon className="text-muted-foreground size-5" />
      </div>
      <div className="text-sm font-medium">You do not have access</div>
      <p className="text-muted-foreground max-w-sm text-xs/relaxed">
        Your role does not include permission for this area. If you believe
        this is a mistake, contact your district administrator.
      </p>
    </div>
  );
}
