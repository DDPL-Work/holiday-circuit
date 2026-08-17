import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../utils/Api.js"; // axios instance

// 🔹 LOGIN THUNK
export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post("/auth/login", data);
      console.log("Login response:", res.data); // Log the response data
      return res.data;
    } catch (error) {
      console.error("Login error:", error.response?.data); // Log the error data
      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

// 🔹 FETCH CURRENT USER THUNK
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get("/auth/me");
      return res.data?.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user profile"
      );
    }
  }
);

const getInitialUser = () => {
  try {
    const sessionUser = sessionStorage.getItem("user");
    if (sessionUser) return JSON.parse(sessionUser);
    const localUser = localStorage.getItem("user");
    if (localUser) return JSON.parse(localUser);
  } catch (e) {
    console.error("Failed to parse stored user", e);
  }
  return null;
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: getInitialUser(),
    token: sessionStorage.getItem("token") || localStorage.getItem("token") || null,
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
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  },

  updateUserProfileLocal: (state, action) => {
    state.user = {
      ...(state.user || {}),
      ...(action.payload || {}),
    };
    try {
      sessionStorage.setItem("user", JSON.stringify(state.user));
      localStorage.setItem("user", JSON.stringify(state.user));
    } catch (e) {
      console.error("Error setting user in storage", e);
    }
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

        try {
          sessionStorage.setItem("token", action.payload.token);
          sessionStorage.setItem("user", JSON.stringify(action.payload.user));
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem("user", JSON.stringify(action.payload.user));
        } catch (e) {
          console.error("Error storing auth in storage", e);
        }
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          try {
            sessionStorage.setItem("user", JSON.stringify(action.payload));
            localStorage.setItem("user", JSON.stringify(action.payload));
          } catch (e) {
            console.error("Error updating stored user on fetch", e);
          }
        }
      });
  },
});

export const { logout, resetAuthState, updateUserProfileLocal } = authSlice.actions;
export default authSlice.reducer;
