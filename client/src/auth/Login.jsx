import React, { useState, useEffect } from "react";
import logo from "../assets/download.jpg";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../Redux/Thunks/authThunk";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, user, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  // ✅ Redirect After Login (Safe Version)
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "agent") {
        navigate("/agent/dashboard");
      } else if (user.role === "dmc") {
        navigate("/dmc/dashboard");
      } else if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard"); // fallback
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* LEFT SIDE IMAGE */}
      <div className="hidden lg:flex w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
          alt="travel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>

        <div className="relative z-10 text-white p-20 flex flex-col justify-end">
          <h1 className="text-5xl font-semibold leading-tight">
            One World. Countless Circuits.
          </h1>
          <p className="mt-6 text-lg opacity-90 max-w-lg">
            The premier B2B platform for travel professionals.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE LOGIN FORM */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6">
        <div className="w-full max-w-md">

          {/* LOGO */}
          <div className="flex justify-center mb-8">
            <img
              src={logo}
              alt="Company Logo"
              className="h-14 object-contain"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-10">
            <h2 className="text-3xl font-semibold text-gray-800">
              Welcome back
            </h2>
            <p className="text-gray-500 mt-2 mb-6">
              Enter your credentials to access your dashboard
            </p>

            {/* 🔴 Error Message */}
            {error && (
              <p className="text-red-500 text-sm mb-4">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input
                  type="email"
                  placeholder="Enter Your Email..."
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="w-full mt-2 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <label className="text-gray-600">Password</label>
                  <Link to="#" className="text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <input
                  type="password"
                  placeholder="Enter Your Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full mt-2 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 transition"
              >
                {loading ? "Signing In..." : "Sign In →"}
              </button>
            </form>

            <p className="text-center text-gray-500 mt-8">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-600 font-medium cursor-pointer"
              >
                Sign up
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
