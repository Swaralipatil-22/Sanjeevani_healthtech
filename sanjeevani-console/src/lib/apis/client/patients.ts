import axios from "axios";

import type { GlobalFilters } from "@/types";

const BASE = "/proxy/patient-service/api/v1/patients";

export interface PatientFilter {
  search?: string;
  gender?: string[];
  district?: string[];
  facility_id?: string[];
  min_age?: number;
  max_age?: number;
  is_pregnant?: boolean;
}

export interface PatientPayload {
  age: number;
  gender: string;
  district: string;
  state: string;
  facility_id: string;
  chronic_conditions: string[];
  is_pregnant: boolean;
}

export const listPatients = (payload: GlobalFilters<PatientFilter>) =>
  axios.post(`${BASE}/list`, payload);

export const exportPatients = (payload: GlobalFilters<PatientFilter>) =>
  axios.post(`${BASE}/export`, payload, { responseType: "blob" });

export const getPatientDetails = (id: string) => axios.get(`${BASE}/${id}`);

export const createPatient = (payload: PatientPayload) =>
  axios.post(BASE, payload);

export const updatePatient = (id: string, payload: PatientPayload) =>
  axios.post(`${BASE}/update/${id}`, payload);

export const deletePatient = (id: string) =>
  axios.post(`${BASE}/delete/${id}`);
