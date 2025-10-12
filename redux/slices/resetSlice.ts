// src/redux/slices/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
 mobile: string | null;
 password: string | null;
 otp: string | null;
};

const initialState: AuthState = {
 mobile: null,
 otp: null,
 password: null,
};

const resetSlice = createSlice({
 name: "auth",
 initialState,
 reducers: {
	setResetMobile: (state, action: PayloadAction<string>) => {
	 state.mobile = action.payload;
	},
	setResetOtp: (state, action: PayloadAction<string>) => {
	 state.otp = action.payload;
	},
	setResetPassword: (state, action: PayloadAction<string>) => {
	 state.password = action.payload;
	},
	clearResetState: (state) => {
	 state.mobile = null;
	 state.otp = null;
	 state.password = null;
	}
 },
});

export const { setResetMobile, setResetOtp, setResetPassword, clearResetState } = resetSlice.actions;
export default resetSlice.reducer;