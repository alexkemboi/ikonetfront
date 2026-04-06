import { createSlice } from "@reduxjs/toolkit";


interface CustomerState {
  activeTab: string;
}

const initialState: CustomerState = {
  activeTab:"general"
};



const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    setActiveTab(state, action) {
      state.activeTab = action.payload;
    }
  }
});


export const { setActiveTab } = customerSlice.actions;
export const customerReducer = customerSlice.reducer;