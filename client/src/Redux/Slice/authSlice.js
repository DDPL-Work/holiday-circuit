import { createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem("token");

const initialState = {
  user: null,
  token: token || null,
  isAuthenticated: !!token,
  verificationStatus: "not_submitted", 
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state) => {
      state.loading = true;
      state.error = null;
    },

    registerSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
    },

    loginSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      localStorage.setItem("token", action.payload.token);
    },

    //  COMPANY DETAILS SAVE
    saveCompanyDetails: (state, action) => {
      state.user = {
        ...state.user,
        company: action.payload,
      };
    },

    //  KYC DETAILS SAVE
    saveKycDetails: (state, action) => {
      state.user = {
        ...state.user,
        kyc: action.payload,
      };

      state.verificationStatus = "pending"; 
    },

    //  VERIFICATION STATUS CHANGE (Admin Approval Simulation)
    setVerificationStatus: (state, action) => {
      state.verificationStatus = action.payload;
    },

    authError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.verificationStatus = "not_submitted";
      localStorage.removeItem("token");
    },
  },
});

export const {
  setLoading,
  registerSuccess,
  loginSuccess,
  authError,
  logout,
  saveCompanyDetails,
  saveKycDetails,
  setVerificationStatus, 
} = authSlice.actions;

export default authSlice.reducer;
