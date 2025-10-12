import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SelectedLocationPayload {
  title: string;
  subtitle?: string;
  lat?: number;
  lon?: number;
  context?: string; // e.g., usersAddress | pickup | dropoff
}

interface LocationSearchState {
  selected: SelectedLocationPayload | null;
}

const initialState: LocationSearchState = {
  selected: null,
};

const locationSearchSlice = createSlice({
  name: "locationSearch",
  initialState,
  reducers: {
    setSelectedLocation: (state, action: PayloadAction<SelectedLocationPayload>) => {
      state.selected = action.payload;
    },
    clearSelectedLocation: (state) => {
      state.selected = null;
    },
  },
});

export const { setSelectedLocation, clearSelectedLocation } = locationSearchSlice.actions;
export default locationSearchSlice.reducer;
