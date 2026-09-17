import { configureStore } from "@reduxjs/toolkit";
import rolesReducer from "./slices/rolesSlice";
import hotspotReducer from "./slices/hotspotSlice";
import { customerReducer } from "./slices/customerslice";
import { ticketReducer } from "./slices/ticketSlice";
import { systemReducer } from "./slices/systemslice";
import companyContextReducer from "./slices/companyContextSlice";

export const store = configureStore({
  reducer: {
    roles: rolesReducer,
    hotspot: hotspotReducer,
    customer: customerReducer,
    ticket: ticketReducer,
    system: systemReducer,
    companyContext: companyContextReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
