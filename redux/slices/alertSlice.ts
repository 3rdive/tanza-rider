import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AlertType = "success" | "error" | "warning";

type AlertState = {
  visible: boolean;
  heading?: string;
  message?: string;
  type?: AlertType;
  duration?: number | null; // ms, null means do not auto-dismiss
};

const initialState: AlertState = {
  visible: false,
  heading: undefined,
  message: undefined,
  type: "success",
  duration: 4000,
};

const alertSlice = createSlice({
  name: "alert",
  initialState,
  reducers: {
    showAlert: (
      state,
      action: PayloadAction<{
        heading?: string;
        message?: string;
        type?: AlertType;
        duration?: number | null;
      }>
    ) => {
      const { heading, message, type, duration } = action.payload;
      state.visible = true;
      state.heading = heading;
      state.message = message;
      state.type = type ?? inferTypeFromHeading(heading) ?? "success";
      state.duration = duration ?? 4000;
    },
    hideAlert: (state) => {
      state.visible = false;
    },
  },
});

function inferTypeFromHeading(heading?: string): AlertType | undefined {
  if (!heading) return undefined;
  const h = heading.toLowerCase();

  // Error patterns
  if (
    h.includes("error") ||
    h.includes("failed") ||
    h.includes("fail") ||
    h.includes("invalid") ||
    h.includes("denied") ||
    h.includes("unauthorized") ||
    h.includes("forbidden") ||
    h.includes("missing") ||
    h.includes("not found") ||
    h.includes("unable")
  )
    return "error";

  // Warning patterns
  if (h.includes("warn") || h.includes("caution")) return "warning";

  // Success patterns
  if (
    h.includes("success") ||
    h.includes("added") ||
    h.includes("done") ||
    h.includes("complete") ||
    h.includes("ok") ||
    h.includes("saved") ||
    h.includes("updated") ||
    h.includes("submitted")
  )
    return "success";

  return undefined;
}

export const { showAlert, hideAlert } = alertSlice.actions;
export default alertSlice.reducer;
