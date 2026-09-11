import axios from "axios";

import type { EncounterVitals, GlobalFilters } from "@/types";

const BASE = "/proxy/patient-service/api/v1/encounters";

export interface EncounterFilter {
  search?: string;
  patient_id?: string;
  clinician_id?: string[];
  facility_id?: string[];
  diagnosis_category_id?: string[];
  severity?: string[];
  status?: string[];
  visit_type?: string[];
  from?: string;
  to?: string;
}

export interface EncounterPayload {
  patient_id: string;
  facility_id: string;
  diagnosis_category_id: string;
  encounter_date: string;
  visit_type: string;
  chief_complaint: string;
  symptoms: string[];
  diagnosis: string;
  severity: string;
  status: string;
  treatment: string;
  vitals: EncounterVitals;
  follow_up_date: string | null;
  notes: string | null;
}

export const listEncounters = (payload: GlobalFilters<EncounterFilter>) =>
  axios.post(`${BASE}/list`, payload);

export const exportEncounters = (payload: GlobalFilters<EncounterFilter>) =>
  axios.post(`${BASE}/export`, payload, { responseType: "blob" });

export const getEncounterDetails = (id: string) => axios.get(`${BASE}/${id}`);

export const createEncounter = (payload: EncounterPayload) =>
  axios.post(BASE, payload);

export const updateEncounter = (id: string, payload: EncounterPayload) =>
  axios.post(`${BASE}/update/${id}`, payload);

export const deleteEncounter = (id: string) =>
  axios.post(`${BASE}/delete/${id}`);
