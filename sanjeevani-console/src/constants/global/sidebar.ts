import {
  ActivityIcon,
  ChartColumnIncreasingIcon,
  ScrollTextIcon,
  StethoscopeIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
} from "@/constants/global/enums";
import { ROUTES } from "@/constants/global/routes";

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  module: PERMISSION_MODULES;
  sub_module: PERMISSION_SUB_MODULES;
  badge?: string;
}

export interface SidebarCategory {
  label: string;
  items: SidebarItem[];
}

/**
 * The sidebar is permission-filtered at render time, so a nurse, a doctor and
 * an administrator each see a structurally different menu.
 */
export const SIDEBAR_CATEGORIES: SidebarCategory[] = [
  {
    label: "Clinical",
    items: [
      {
        label: "Encounters",
        href: ROUTES.ENCOUNTERS.LIST,
        icon: StethoscopeIcon,
        module: PERMISSION_MODULES.PATIENT_MANAGEMENT,
        sub_module: PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT,
      },
      {
        label: "Patients",
        href: ROUTES.PATIENTS.LIST,
        icon: UsersRoundIcon,
        module: PERMISSION_MODULES.PATIENT_MANAGEMENT,
        sub_module: PERMISSION_SUB_MODULES.PATIENTS_MANAGEMENT,
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "District Dashboard",
        href: ROUTES.DASHBOARD,
        icon: ChartColumnIncreasingIcon,
        module: PERMISSION_MODULES.ANALYTICS,
        sub_module: PERMISSION_SUB_MODULES.DASHBOARD,
        badge: "LIVE",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Users",
        href: ROUTES.ADMINISTRATION.USERS,
        icon: UsersIcon,
        module: PERMISSION_MODULES.ADMINISTRATION,
        sub_module: PERMISSION_SUB_MODULES.USERS_MANAGEMENT,
      },
      {
        label: "Audit Trail",
        href: ROUTES.ADMINISTRATION.AUDIT_LOGS,
        icon: ScrollTextIcon,
        module: PERMISSION_MODULES.ADMINISTRATION,
        sub_module: PERMISSION_SUB_MODULES.AUDIT_LOGS,
      },
    ],
  },
];

export const PLATFORM_ICON = ActivityIcon;
