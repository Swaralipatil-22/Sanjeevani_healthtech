import axios from "axios";

import type { GlobalFilters } from "@/types";

const BASE = "/proxy/patient-service/api/v1/users";

export interface UserFilter {
  search?: string;
  role?: string[];
  status?: string[];
  facility_id?: string[];
}

export interface UserPayload {
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  facility_id: string | null;
  status: string;
  password?: string;
}

export const listUsers = (payload: GlobalFilters<UserFilter>) =>
  axios.post(`${BASE}/list`, payload);

export const getUserDetails = (id: string) => axios.get(`${BASE}/${id}`);

export const createUser = (payload: UserPayload) => axios.post(BASE, payload);

export const updateUser = (id: string, payload: UserPayload) =>
  axios.post(`${BASE}/update/${id}`, payload);
