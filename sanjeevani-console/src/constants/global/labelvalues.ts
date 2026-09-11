import {
  ENCOUNTER_SEVERITY,
  ENCOUNTER_STATUS,
  ENCOUNTER_VISIT_TYPES,
  GENDER_TYPES,
  ROLES,
  USER_STATUS_TYPES,
} from "@/constants/global/enums";

export interface LabelValue {
  label: string;
  value: string;
}

const toOptions = <T extends string>(
  labels: Record<T, string>,
): LabelValue[] =>
  Object.entries(labels).map(([value, label]) => ({
    value,
    label: label as string,
  }));

export const SEVERITY_LABELS: Record<ENCOUNTER_SEVERITY, string> = {
  [ENCOUNTER_SEVERITY.MILD]: "Mild",
  [ENCOUNTER_SEVERITY.MODERATE]: "Moderate",
  [ENCOUNTER_SEVERITY.SEVERE]: "Severe",
  [ENCOUNTER_SEVERITY.CRITICAL]: "Critical",
};

export const ENCOUNTER_STATUS_LABELS: Record<ENCOUNTER_STATUS, string> = {
  [ENCOUNTER_STATUS.UNDER_TREATMENT]: "Under Treatment",
  [ENCOUNTER_STATUS.FOLLOW_UP_REQUIRED]: "Follow-up Required",
  [ENCOUNTER_STATUS.REFERRED]: "Referred",
  [ENCOUNTER_STATUS.CLOSED]: "Closed",
};

export const VISIT_TYPE_LABELS: Record<ENCOUNTER_VISIT_TYPES, string> = {
  [ENCOUNTER_VISIT_TYPES.NEW_CONSULTATION]: "New Consultation",
  [ENCOUNTER_VISIT_TYPES.FOLLOW_UP]: "Follow-up",
  [ENCOUNTER_VISIT_TYPES.TELECONSULTATION]: "Teleconsultation",
  [ENCOUNTER_VISIT_TYPES.EMERGENCY]: "Emergency",
};

export const GENDER_LABELS: Record<GENDER_TYPES, string> = {
  [GENDER_TYPES.FEMALE]: "Female",
  [GENDER_TYPES.MALE]: "Male",
  [GENDER_TYPES.OTHER]: "Other",
};

export const ROLE_LABELS: Record<ROLES, string> = {
  [ROLES.ADMIN]: "Administrator",
  [ROLES.DOCTOR]: "Doctor",
  [ROLES.NURSE]: "Nurse",
};

export const USER_STATUS_LABELS: Record<USER_STATUS_TYPES, string> = {
  [USER_STATUS_TYPES.ACTIVE]: "Active",
  [USER_STATUS_TYPES.INACTIVE]: "Inactive",
};

export const SEVERITY_OPTIONS = toOptions(SEVERITY_LABELS);
export const ENCOUNTER_STATUS_OPTIONS = toOptions(ENCOUNTER_STATUS_LABELS);
export const VISIT_TYPE_OPTIONS = toOptions(VISIT_TYPE_LABELS);
export const GENDER_OPTIONS = toOptions(GENDER_LABELS);
export const ROLE_OPTIONS = toOptions(ROLE_LABELS);
export const USER_STATUS_OPTIONS = toOptions(USER_STATUS_LABELS);

export const DATE_PRESETS: { label: string; days: number }[] = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 180 days", days: 180 },
];

export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
