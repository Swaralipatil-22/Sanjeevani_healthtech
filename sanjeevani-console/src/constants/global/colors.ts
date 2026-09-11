import {
  ENCOUNTER_SEVERITY,
  ENCOUNTER_STATUS,
  ENCOUNTER_VISIT_TYPES,
  USER_STATUS_TYPES,
} from "@/constants/global/enums";

const CHIP_BASE =
  "inline-flex items-center justify-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap select-none";

export const CHIPS_FILLED = {
  GREY: `${CHIP_BASE} bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/25`,
  TEAL: `${CHIP_BASE} bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/25`,
  BLUE: `${CHIP_BASE} bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25`,
  GREEN: `${CHIP_BASE} bg-green-100 text-green-800 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/25`,
  AMBER: `${CHIP_BASE} bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25`,
  ORANGE: `${CHIP_BASE} bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/25`,
  RED: `${CHIP_BASE} bg-red-100 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25`,
  PURPLE: `${CHIP_BASE} bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/25`,
};

/**
 * Acuity is encoded twice on purpose - a coloured dot plus the text label -
 * so the table stays readable for colour-blind clinicians and in print.
 */
export const SEVERITY_CHIPS: Record<ENCOUNTER_SEVERITY, string> = {
  [ENCOUNTER_SEVERITY.MILD]: CHIPS_FILLED.GREEN,
  [ENCOUNTER_SEVERITY.MODERATE]: CHIPS_FILLED.AMBER,
  [ENCOUNTER_SEVERITY.SEVERE]: CHIPS_FILLED.ORANGE,
  [ENCOUNTER_SEVERITY.CRITICAL]: CHIPS_FILLED.RED,
};

export const SEVERITY_DOTS: Record<ENCOUNTER_SEVERITY, string> = {
  [ENCOUNTER_SEVERITY.MILD]: "acuity-dot acuity-dot-mild",
  [ENCOUNTER_SEVERITY.MODERATE]: "acuity-dot acuity-dot-moderate",
  [ENCOUNTER_SEVERITY.SEVERE]: "acuity-dot acuity-dot-severe",
  [ENCOUNTER_SEVERITY.CRITICAL]: "acuity-dot acuity-dot-critical",
};

export const ENCOUNTER_STATUS_CHIPS: Record<ENCOUNTER_STATUS, string> = {
  [ENCOUNTER_STATUS.CLOSED]: CHIPS_FILLED.GREY,
  [ENCOUNTER_STATUS.UNDER_TREATMENT]: CHIPS_FILLED.BLUE,
  [ENCOUNTER_STATUS.FOLLOW_UP_REQUIRED]: CHIPS_FILLED.AMBER,
  [ENCOUNTER_STATUS.REFERRED]: CHIPS_FILLED.PURPLE,
};

export const VISIT_TYPE_CHIPS: Record<ENCOUNTER_VISIT_TYPES, string> = {
  [ENCOUNTER_VISIT_TYPES.NEW_CONSULTATION]: CHIPS_FILLED.TEAL,
  [ENCOUNTER_VISIT_TYPES.FOLLOW_UP]: CHIPS_FILLED.BLUE,
  [ENCOUNTER_VISIT_TYPES.TELECONSULTATION]: CHIPS_FILLED.PURPLE,
  [ENCOUNTER_VISIT_TYPES.EMERGENCY]: CHIPS_FILLED.RED,
};

export const USER_STATUS_CHIPS: Record<USER_STATUS_TYPES, string> = {
  [USER_STATUS_TYPES.ACTIVE]: CHIPS_FILLED.GREEN,
  [USER_STATUS_TYPES.INACTIVE]: CHIPS_FILLED.GREY,
};

export const AUDIT_STATUS_CHIPS: Record<string, string> = {
  SUCCESS: CHIPS_FILLED.GREEN,
  DENIED: CHIPS_FILLED.RED,
  FAILURE: CHIPS_FILLED.AMBER,
};

export const ROLE_CHIPS: Record<string, string> = {
  ADMIN: CHIPS_FILLED.PURPLE,
  DOCTOR: CHIPS_FILLED.TEAL,
  NURSE: CHIPS_FILLED.BLUE,
};
