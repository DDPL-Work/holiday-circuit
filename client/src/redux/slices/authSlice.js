import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/Api.js"; // axios instance

// 🔹 LOGIN THUNK
export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post("/auth/login", data);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: JSON.parse(sessionStorage.getItem("user")) || null,
    token: sessionStorage.getItem("token") || null,
    loading: false,
    error: null,
    justLoggedIn: false,
  },

 reducers: {
  logout: (state) => {
    state.user = null;
    state.token = null;
    state.justLoggedIn = false;
    sessionStorage.clear();
  },

  resetAuthState: (state) => {
    state.justLoggedIn = false;
    state.error = null;
  },
},

  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.justLoggedIn = true;

        sessionStorage.setItem("token", action.payload.token);
        sessionStorage.setItem(
          "user",
          JSON.stringify(action.payload.user)
        );
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});


export const { logout, resetAuthState } = authSlice.actions;
export default authSlice.reducer;
