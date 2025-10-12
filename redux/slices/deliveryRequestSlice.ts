import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface DeliveryRequest {
  id: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  distance: string;
  estimatedEarning: number;
  packageType: string;
  urgency: "normal" | "urgent";
  timeAgo: string;
}

interface DeliveryRequestState {
  showDeliveryModal: boolean;
  currentRequest: DeliveryRequest | null;
  isOnline: boolean;
  fadeAnim: number;
}

const initialState: DeliveryRequestState = {
  showDeliveryModal: false,
  currentRequest: null,
  isOnline: false,
  fadeAnim: 0,
};

const deliveryRequestSlice = createSlice({
  name: "deliveryRequest",
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    showDeliveryRequest: (state, action: PayloadAction<DeliveryRequest>) => {
      state.currentRequest = action.payload;
      state.showDeliveryModal = true;
    },
    hideDeliveryRequest: (state) => {
      state.showDeliveryModal = false;
      state.currentRequest = null;
    },
    acceptDeliveryRequest: (state) => {
      // This will be handled by the component that needs to update pending orders
      state.showDeliveryModal = false;
      state.currentRequest = null;
    },
    declineDeliveryRequest: (state) => {
      state.showDeliveryModal = false;
      state.currentRequest = null;
    },
    setFadeAnim: (state, action: PayloadAction<number>) => {
      state.fadeAnim = action.payload;
    },
  },
});

export const {
  setOnlineStatus,
  showDeliveryRequest,
  hideDeliveryRequest,
  acceptDeliveryRequest,
  declineDeliveryRequest,
  setFadeAnim,
} = deliveryRequestSlice.actions;

export default deliveryRequestSlice.reducer;
