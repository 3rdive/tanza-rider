import { IAuthSuccessData } from "@/lib/api";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


const initialState: IAuthSuccessData = {
 access_token: null,
 user: null
}

const userSlice = createSlice({
 name: "user",
 initialState,
 reducers: {
	setUser: (state, action: PayloadAction<IAuthSuccessData>) => {
	 state.user = action.payload.user;
	 state.access_token = action.payload.access_token;
	},
	clearUser: (state) => {
	 state.user = null;
	 state.access_token = null;
	}
 },
})

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;