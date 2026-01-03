import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IRider, riderService, IUpdateRiderPayload } from "@/lib/api";

export interface RiderState {
  data: IRider | null;
  loading: boolean;
  error: string | null;
  updating: boolean;
  updateError: string | null;
}

const initialState: RiderState = {
  data: null,
  loading: false,
  error: null,
  updating: false,
  updateError: null,
};

export const fetchRiderMe = createAsyncThunk(
  "rider/fetchMe",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.user?.access_token;
      const res = await riderService.getMe(token);
      return res.data as IRider;
    } catch (err: any) {
      // normalize error
      const message =
        err?.response?.data?.message || err?.message || "Unknown error";
      return rejectWithValue(message);
    }
  },
);

export const updateRiderMe = createAsyncThunk(
  "rider/updateMe",
  async (payload: IUpdateRiderPayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.user?.access_token;
      const res = await riderService.updateMe(payload, token);
      return res.data as IRider;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Update failed";
      return rejectWithValue(message);
    }
  },
);

const riderSlice = createSlice({
  name: "rider",
  initialState,
  reducers: {
    clearRider(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.updating = false;
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRiderMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchRiderMe.fulfilled,
        (state, action: PayloadAction<IRider>) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchRiderMe.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch rider";
      })
      .addCase(updateRiderMe.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(
        updateRiderMe.fulfilled,
        (state, action: PayloadAction<IRider>) => {
          state.updating = false;
          state.data = action.payload;
          state.updateError = null;
        },
      )
      .addCase(updateRiderMe.rejected, (state, action) => {
        state.updating = false;
        state.updateError =
          (action.payload as string) ||
          action.error.message ||
          "Failed to update rider";
      });
  },
});

export const { clearRider } = riderSlice.actions;
export default riderSlice.reducer;
