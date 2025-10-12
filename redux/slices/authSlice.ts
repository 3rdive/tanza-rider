// src/redux/slices/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
 mobile: string | null;
 email: string | null;
 password: string | null;
 otp: string | null;
};

const initialState: AuthState = {
 mobile: null,
 email: null,
 password: null,
 otp: null,
};

const authSlice = createSlice({
 name: "auth",
 initialState,
 reducers: {
	setMobile: (state, action: PayloadAction<string>) => {
	 state.mobile = action.payload;
	},
	setEmail: (state, action: PayloadAction<string>) => {
	 state.email = action.payload;
	},
	setPassword: (state, action: PayloadAction<string>) => {
	 state.password = action.payload;
	},
	setOtp: (state, action: PayloadAction<string>) => {
	 state.otp = action.payload;
	},
	clearState: (state) => {
	 state.mobile = null;
	 state.email = null;
	 state.password = null;
	 state.otp = null;
	}
 },
});

export const { setMobile, setEmail, setPassword, setOtp, clearState } = authSlice.actions;
export default authSlice.reducer;