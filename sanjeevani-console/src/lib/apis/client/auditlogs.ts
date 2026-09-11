import axios from "axios";

import type { GlobalFilters } from "@/types";

const BASE = "/proxy/patient-service/api/v1/audit-logs";

export interface AuditLogFilter {
  search?: string;
  user_id?: string[];
  action?: string[];
  status?: string[];
  entity_type?: string[];
  from?: string;
  to?: string;
}

export const listAuditLogs = (payload: GlobalFilters<AuditLogFilter>) =>
  axios.post(`${BASE}/list`, payload);

export const exportAuditLogs = (payload: GlobalFilters<AuditLogFilter>) =>
  axios.post(`${BASE}/export`, payload, { responseType: "blob" });
