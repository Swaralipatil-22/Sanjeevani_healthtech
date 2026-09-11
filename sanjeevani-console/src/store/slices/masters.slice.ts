import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { Clinician, DiagnosisCategory, Facility } from "@/types";

export interface MastersState {
  facilities: Facility[];
  diagnosis_categories: DiagnosisCategory[];
  clinicians: Clinician[];
  is_loaded: boolean;
}

const initialState: MastersState = {
  facilities: [],
  diagnosis_categories: [],
  clinicians: [],
  is_loaded: false,
};

const mastersSlice = createSlice({
  name: "masters",
  initialState,
  reducers: {
    setMasters(
      state,
      action: PayloadAction<Omit<MastersState, "is_loaded">>,
    ) {
      return { ...action.payload, is_loaded: true };
    },
    unsetMasters() {
      return initialState;
    },
  },
});

export const { setMasters, unsetMasters } = mastersSlice.actions;
export default mastersSlice.reducer;
