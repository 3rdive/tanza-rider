import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface DeliveryRequest {
  id: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  distance: number;
  estimatedEarning: number;
  packageType: string;
  timeAgo: string;
  isUrgent: boolean;
  hasMultipleDeliveries?: boolean;
  deliveryDestinations?: {
    id: string;
    dropOffLocation: {
      address: string;
      latitude: string;
      longitude: string;
    };
    recipient: {
      name: string;
      role: string;
      email: string;
      phone: string;
    };
    distanceFromPickupKm: number;
    durationFromPickup: string;
    deliveryFee: number;
    delivered: boolean;
    deliveredAt: string | null;
    createdAt: string;
  }[];
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
