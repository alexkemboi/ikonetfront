import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SystemState {
    editUserSheetOpen: boolean;
}

const initialState: SystemState = {
    editUserSheetOpen: false,
};

const systemSlice = createSlice({
    name: "system",
    initialState,
    reducers: {
        setEditUserSheetOpen(state, action: PayloadAction<boolean>) {
            state.editUserSheetOpen = action.payload;
        }
    }
});

export const { setEditUserSheetOpen } = systemSlice.actions;

export const systemReducer = systemSlice.reducer;