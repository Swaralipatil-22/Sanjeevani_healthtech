export const ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
  },
  DASHBOARD: "/dashboard",
  PATIENTS: {
    LIST: "/patients",
    MANAGEMENT: "/patients/management",
    DETAILS: (id: string): string => `/patients/${id}`,
  },
  ENCOUNTERS: {
    LIST: "/encounters",
    MANAGEMENT: "/encounters/management",
    DETAILS: (id: string): string => `/encounters/${id}`,
  },
  ADMINISTRATION: {
    AUDIT_LOGS: "/administration/audit-logs",
    USERS: "/administration/users",
  },
} as const;

export const PRIVATE_ROUTE_PREFIXES = [
  "/dashboard",
  "/patients",
  "/encounters",
  "/administration",
];

export const BREADCRUMB_ROUTE_MAPPINGS: Record<string, string[]> = {
  "/dashboard": ["Analytics", "District Dashboard"],
  "/patients": ["Patient Management", "Patients"],
  "/patients/management": ["Patient Management", "Patients", "Register"],
  "/encounters": ["Patient Management", "Encounters"],
  "/encounters/management": ["Patient Management", "Encounters", "Record"],
  "/administration/audit-logs": ["Administration", "Audit Trail"],
  "/administration/users": ["Administration", "Users"],
};
