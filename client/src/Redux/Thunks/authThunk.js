// redux/thunks/authThunk.js

import axios from "axios";
import {
  setLoading,
  registerSuccess,
  loginSuccess,
  authError,
} from "../Slice/authSlice";

const API = "http://localhost:3000/api/auth";

// 🔹 REGISTER
export const registerUser = (formData) => async (dispatch) => {
  try {
    dispatch(setLoading());

    const response = await axios.post(`${API}/register`, formData);

    dispatch(registerSuccess(response.data));

  } catch (error) {
    dispatch(authError(error.response?.data?.message || "Register Failed"));
  }
};

// 🔹 LOGIN
export const loginUser = (formData) => async (dispatch) => {
  try {
    dispatch(setLoading());

    const response = await axios.post(`${API}/login`, formData);

    dispatch(loginSuccess(response.data));

  } catch (error) {
    dispatch(authError(error.response?.data?.message || "Login Failed"));
  }
};
