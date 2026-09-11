import axios from "axios";

const BASE = "/proxy/patient-service/api/v1/masters";

export const listFacilities = () => axios.get(`${BASE}/facilities`);
export const listDiagnosisCategories = () =>
  axios.get(`${BASE}/diagnosis-categories`);
export const listClinicians = () => axios.get(`${BASE}/clinicians`);
