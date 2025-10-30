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
}

const initialState: DeliveryRequestState = {
  showDeliveryModal: false,
  currentRequest: null,
};

const deliveryRequestSlice = createSlice({
  name: "deliveryRequest",
  initialState,
  reducers: {
    showDeliveryRequest: (state, action: PayloadAction<DeliveryRequest>) => {
      state.currentRequest = action.payload;
      state.showDeliveryModal = true;
    },
    hideDelivery: (state) => {
      state.showDeliveryModal = false;
      state.currentRequest = null;
    },
    acceptDeliveryRequest: (state) => {
      state.showDeliveryModal = false;
    },
    declineDeliveryRequest: (state) => {
      state.showDeliveryModal = false;
      state.currentRequest = null;
    },
  },
});

export const {
  showDeliveryRequest,
  hideDelivery,
  acceptDeliveryRequest,
  declineDeliveryRequest,
} = deliveryRequestSlice.actions;

export default deliveryRequestSlice.reducer;
