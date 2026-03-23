import { configureStore } from "@reduxjs/toolkit";
import rolesReducer from "./slices/rolesSlice";
import hotspotReducer from "./slices/hotspotSlice";

export const store = configureStore({
  reducer: {
    roles: rolesReducer,
    hotspot: hotspotReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
