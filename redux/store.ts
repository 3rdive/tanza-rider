// src/redux/redux.ts
import resetSlice from "@/redux/slices/resetSlice";
import userSlice from "@/redux/slices/userSlice";
import virtualAccountReducer from "@/redux/slices/virtualAccountSlice";
import walletReducer from "@/redux/slices/walletSlice";
import deliveryRequestReducer from "@/redux/slices/deliveryRequestSlice";
import riderReducer from "@/redux/slices/riderSlice";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import locationSearchReducer from "./slices/locationSearchSlice";
import alertReducer from "./slices/alertSlice";
import activeOrdersReducer from "./slices/activeOrdersSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reset: resetSlice,
    user: userSlice,
    alert: alertReducer,
    virtualAccount: virtualAccountReducer,
    wallet: walletReducer,
    locationSearch: locationSearchReducer,
    deliveryRequest: deliveryRequestReducer,
    rider: riderReducer,
    activeOrders: activeOrdersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
