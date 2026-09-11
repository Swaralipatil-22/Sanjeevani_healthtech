import type {
  ENCOUNTER_SEVERITY,
  ENCOUNTER_STATUS,
  ENCOUNTER_VISIT_TYPES,
  EXPORT_FORMATS,
  GENDER_TYPES,
  PERMISSIONS,
  ROLES,
  USER_STATUS_TYPES,
} from "@/constants/global/enums";

export interface GlobalFilters<F = Record<string, unknown>> {
  filter?: F;
  page?: number;
  limit?: number;
  sort?: Record<string, -1 | 1>;
  export_format?: EXPORT_FORMATS;
}

export interface ListResponse<D> {
  data: D[];
  count: number;
}

export interface ResolvedPermission {
  module: string;
  sub_module: string;
  name: PERMISSIONS;
}

export interface Facility {
  id: string;
  code: string;
  name: string;
  type: string;
  district: string;
  state: string;
}

export interface DiagnosisCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  is_notifiable: boolean;
}

export interface Clinician {
  id: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  role_details?: { name: ROLES };
}

export interface UserProfile {
  id: string;
  email: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  role: ROLES;
  role_id: string;
  facility_id: string | null;
  status?: USER_STATUS_TYPES;
  last_login_at?: string | null;
  facility_details?: Facility | null;
  role_details?: { id: string; name: ROLES; description: string };
  permissions?: ResolvedPermission[];
}

export interface Patient {
  id: string;
  patient_code: string;
  age: number;
  gender: GENDER_TYPES;
  district: string;
  state: string;
  facility_id: string;
  chronic_conditions: string[];
  is_pregnant: boolean;
  created_at: string;
  updated_at: string;
  facility_details?: Facility;
  encounters?: Encounter[];
}

export interface EncounterVitals {
  temperature_celsius?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  pulse_bpm?: number | null;
  spo2_percentage?: number | null;
  weight_kg?: number | null;
  blood_sugar_mgdl?: number | null;
}

export interface Encounter {
  id: string;
  patient_id: string;
  clinician_id: string;
  facility_id: string;
  diagnosis_category_id: string;
  encounter_date: string;
  visit_type: ENCOUNTER_VISIT_TYPES;
  chief_complaint: string;
  symptoms: string[];
  diagnosis: string;
  severity: ENCOUNTER_SEVERITY;
  status: ENCOUNTER_STATUS;
  treatment: string;
  vitals: EncounterVitals;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient_details?: Pick<
    Patient,
    "id" | "patient_code" | "age" | "gender" | "district"
  >;
  clinician_details?: Clinician;
  facility_details?: Facility;
  diagnosis_category_details?: DiagnosisCategory;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  status: string;
  ip_address: string | null;
  request_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  user_details?: Pick<
    UserProfile,
    "id" | "first_name" | "last_name" | "employee_id" | "email"
  >;
}

export interface AnalyticsOverview {
  total_encounters: number;
  unique_patients: number;
  critical_cases: number;
  notifiable_cases: number;
  referred_cases: number;
  follow_ups_due: number;
  active_clinicians: number;
  facilities_reporting: number;
  previous_total_encounters: number;
  encounter_change_percentage: number | null;
  range: { from: string; to: string };
}

export interface TrendPoint {
  bucket: string;
  total: number;
  critical: number;
  notifiable: number;
}

export interface CategoryTrendPoint {
  bucket: string;
  category: string;
  total: number;
}

export interface AnalyticsTrends {
  granularity: "day" | "month" | "week";
  series: TrendPoint[];
  category_series: CategoryTrendPoint[];
  range: { from: string; to: string };
}

export interface DistributionSlice {
  label: string;
  value: number;
  code?: string;
  is_notifiable?: boolean;
  district?: string;
  facility_type?: string;
  critical?: number;
}

export interface AnalyticsDistribution {
  by_category: DistributionSlice[];
  by_severity: DistributionSlice[];
  by_gender: DistributionSlice[];
  by_age_band: DistributionSlice[];
  by_facility: DistributionSlice[];
  by_status: DistributionSlice[];
  range: { from: string; to: string };
}
