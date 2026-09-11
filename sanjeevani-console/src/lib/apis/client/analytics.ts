import axios from "axios";

const BASE = "/proxy/patient-service/api/v1/analytics";

export interface AnalyticsParams {
  from?: string;
  to?: string;
  facility_id?: string;
  district?: string;
  granularity?: "day" | "month" | "week";
}

export const getAnalyticsOverview = (params: AnalyticsParams) =>
  axios.get(`${BASE}/overview`, { params });

export const getAnalyticsTrends = (params: AnalyticsParams) =>
  axios.get(`${BASE}/trends`, { params });

export const getAnalyticsDistribution = (params: AnalyticsParams) =>
  axios.get(`${BASE}/distribution`, { params });
