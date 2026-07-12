import { configureStore } from "@reduxjs/toolkit";
import rolesReducer from "./slices/rolesSlice";
import hotspotReducer from "./slices/hotspotSlice";
import { customerReducer } from "./slices/customerslice";
import { ticketReducer } from "./slices/ticketSlice";
import { systemReducer } from "./slices/systemslice";

export const store = configureStore({
  reducer: {
    roles: rolesReducer,
    hotspot: hotspotReducer,
    customer: customerReducer,
    ticket: ticketReducer,
    system: systemReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
