import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CustomerState {
  activeTab: string;
  renewSheetCustomerId: number | null;
  passwordSheetCustomerId: number | null;
}

const initialState: CustomerState = {
  activeTab: "general",
  renewSheetCustomerId: null,
  passwordSheetCustomerId: null,
};

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<string>) {
      state.activeTab = action.payload;
    },
    openRenewSheet(state, action: PayloadAction<number>) {
      state.renewSheetCustomerId = action.payload;
    },
    closeRenewSheet(state) {
      state.renewSheetCustomerId = null;
    },
    openPasswordSheet(state, action: PayloadAction<number>) {
      state.passwordSheetCustomerId = action.payload;
    },
    closePasswordSheet(state) {
      state.passwordSheetCustomerId = null;
    },
  },
});

export const {
  setActiveTab,
  openRenewSheet,
  closeRenewSheet,
  openPasswordSheet,
  closePasswordSheet,
} = customerSlice.actions;

export const customerReducer = customerSlice.reducer;
