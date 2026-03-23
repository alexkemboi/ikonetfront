import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HotspotPackage, HotspotState } from '@/lib/types/hotspot';

const initialState: HotspotState = {
  packages: [],
  selectedPackage: null,
  paymentStatus: 'idle',
  paymentMessage: null,
  hasActiveSession: false,
  sessionMessage: null,
};

const hotspotSlice = createSlice({
  name: 'hotspot',
  initialState,
  reducers: {
    setHotspotPackages: (state, action: PayloadAction<HotspotPackage[]>) => {
      state.packages = action.payload;
    },
    setSelectedPackage: (state, action: PayloadAction<HotspotPackage | null>) => {
      state.selectedPackage = action.payload;
    },
    setPaymentStatus: (state, action: PayloadAction<'idle' | 'loading' | 'succeeded' | 'failed'>) => {
      state.paymentStatus = action.payload;
    },
    setPaymentMessage: (state, action: PayloadAction<string | null>) => {
      state.paymentMessage = action.payload;
    },
    setHasActiveSession: (state, action: PayloadAction<boolean>) => {
      state.hasActiveSession = action.payload;
    },
    setSessionMessage: (state, action: PayloadAction<string | null>) => {
      state.sessionMessage = action.payload;
    },
    resetHotspotState: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setHotspotPackages,
  setSelectedPackage,
  setPaymentStatus,
  setPaymentMessage,
  setHasActiveSession,
  setSessionMessage,
  resetHotspotState,
} = hotspotSlice.actions;

export default hotspotSlice.reducer;
