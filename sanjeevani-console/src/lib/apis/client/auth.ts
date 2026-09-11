import axios from "axios";

const BASE = "/proxy/patient-service/api/v1/auth";

export const getProfile = () => axios.get(`${BASE}/profile`);

export const changePassword = (payload: {
  current_password: string;
  new_password: string;
}) => axios.post(`${BASE}/change-password`, payload);
