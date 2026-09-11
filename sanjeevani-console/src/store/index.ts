import { combineReducers, configureStore } from "@reduxjs/toolkit";

import mastersReducer from "@/store/slices/masters.slice";
import profileReducer from "@/store/slices/profile.slice";

export const rootReducer = combineReducers({
  profile: profileReducer,
  masters: mastersReducer,
});

/**
 * A factory rather than a module-level singleton, so each server render gets
 * its own store and no state leaks between requests.
 */
export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    devTools: process.env.NODE_ENV !== "production",
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
