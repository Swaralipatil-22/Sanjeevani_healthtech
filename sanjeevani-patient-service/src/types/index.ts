import type { EXPORT_FORMATS, PERMISSIONS, ROLES } from "@/types/enums/index.js";

export * from "@/types/enums/index.js";

export interface JWTPayload {
  id: string;
  email: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  role: ROLES;
  role_id: string;
  facility_id: string | null;
}

export interface GlobalFilters<F = Record<string, unknown>> {
  filter?: F;
  page?: number;
  limit?: number;
  sort?: Record<string, -1 | 1>;
  export_format?: EXPORT_FORMATS;
}

export interface ListResponse<D = unknown[]> {
  data: D;
  count: number;
}

export interface PermissionRequirement {
  module: string;
  sub_module: string;
  permissions: PERMISSIONS[];
}
