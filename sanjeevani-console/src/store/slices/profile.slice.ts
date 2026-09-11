import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { UserProfile } from "@/types";

export interface ProfileState {
  data: UserProfile | null;
  is_loaded: boolean;
}

const initialState: ProfileState = { data: null, is_loaded: false };

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<UserProfile>) {
      state.data = action.payload;
      state.is_loaded = true;
    },
    unsetProfile() {
      return initialState;
    },
  },
});

export const { setProfile, unsetProfile } = profileSlice.actions;
export default profileSlice.reducer;
