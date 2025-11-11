import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { orderService, IActiveOrder } from "@/lib/api";
import { RootState } from "../store";

interface ActiveOrdersState {
  orders: IActiveOrder[];
  loading: boolean;
  error: string | null;
}

const initialState: ActiveOrdersState = {
  orders: [],
  loading: false,
  error: null,
};

// Async thunk to fetch active orders
export const fetchActiveOrders = createAsyncThunk(
  "activeOrders/fetchActiveOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getActiveOrders();
      return response.data || [];
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to fetch active orders"
      );
    }
  }
);

const activeOrdersSlice = createSlice({
  name: "activeOrders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchActiveOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const selectActiveOrders = (state: RootState) =>
  state.activeOrders.orders;
export const selectActiveOrdersLoading = (state: RootState) =>
  state.activeOrders.loading;
export const selectActiveOrdersError = (state: RootState) =>
  state.activeOrders.error;

export default activeOrdersSlice.reducer;
