import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { IWallet } from "@/lib/api";

export interface WalletState {
  data: IWallet | null;
  balance: number;
  loading: boolean;
  lastFetched?: number;
 customerCode: string;
}

const initialState: WalletState = {
  data: null,
  balance: 0,
  loading: false,
  lastFetched: undefined,
 customerCode: "",

};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setWallet(state, action: PayloadAction<IWallet | null>) {
      state.data = action.payload;
      state.balance = action.payload?.walletBalance ?? 0;
      state.lastFetched = Date.now();
    },
    setWalletBalance(state, action: PayloadAction<number>) {
      state.balance = action.payload ?? 0;
      if (state.data) {
        state.data.walletBalance = state.balance;
      }
    },
    setWalletLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    clearWallet() {
      return { ...initialState };
    },
  },
});

export const { setWallet, setWalletBalance, setWalletLoading, clearWallet } = walletSlice.actions;
export default walletSlice.reducer;
