import { IVirtualAccount } from "@/lib/api";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface VirtualAccountState {
  data: IVirtualAccount | null;
}

const initialState: VirtualAccountState = {
  data: null,
};

const virtualAccountSlice = createSlice({
  name: "virtualAccount",
  initialState,
  reducers: {
    setVirtualAccount: (state, action: PayloadAction<IVirtualAccount>) => {
      state.data = action.payload;
    },
    clearVirtualAccount: (state) => {
      state.data = null;
    },
  },
});

export const { setVirtualAccount, clearVirtualAccount } = virtualAccountSlice.actions;
export default virtualAccountSlice.reducer;
