import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface TicketState {
  selectedTicketId: number | null
  createSheetOpen: boolean
}

const initialState: TicketState = {
  selectedTicketId: null,
  createSheetOpen: false,
}

const ticketSlice = createSlice({
  name: "ticket",
  initialState,
  reducers: {
    openDetailSheet(state, action: PayloadAction<number>) {
      state.selectedTicketId = action.payload
    },
    closeDetailSheet(state) {
      state.selectedTicketId = null
    },
    openCreateSheet(state) {
      state.createSheetOpen = true
    },
    closeCreateSheet(state) {
      state.createSheetOpen = false
    },
  },
})

export const { openDetailSheet, closeDetailSheet, openCreateSheet, closeCreateSheet } =
  ticketSlice.actions

export const ticketReducer = ticketSlice.reducer
