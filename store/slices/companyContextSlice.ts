import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { readContextCookie } from "@/lib/companyContextClient";

export type CompanyContextState = {
  /** Selected company code; `null` means union across companies (ALL). */
  companyCode: string | null;
  /** True while a context switch is in flight (router.refresh pending). */
  switching: boolean;
};

const initialState: CompanyContextState = {
  companyCode: null,
  switching: false,
};

const companyContextSlice = createSlice({
  name: "companyContext",
  initialState,
  reducers: {
    /** Initialize from the persisted cookie on first client render. */
    initCompanyContext(state) {
      state.companyCode = readContextCookie();
    },
    setCompanyContext(state, action: PayloadAction<string | null>) {
      state.companyCode = action.payload;
    },
    setContextSwitching(state, action: PayloadAction<boolean>) {
      state.switching = action.payload;
    },
  },
});

export const {
  initCompanyContext,
  setCompanyContext,
  setContextSwitching,
} = companyContextSlice.actions;

export default companyContextSlice.reducer;