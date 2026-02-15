import React, { useState } from "react";
import logo from "../assets/logo img.png";
import image from "../assets/Image (Luxury Travel).svg";
import { ArrowRight } from "lucide-react";

import { Link } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { loginUser } from "../Redux/Thunks/authThunk";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* LEFT SIDE IMAGE */}
      <div className="hidden lg:flex w-1/2 relative">
        <img
          src={image}
          alt="travel"
          className="absolute inset-0 w-full h-full object-cover "
        />
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-16 text-white">
          <h1 className="w-120 text-5xl font-bold leading-tight">
            One World. Countless Circuits.
          </h1>
          <p className="mt-6 text-lg opacity-90 max-w-lg">
            The premier B2B platform for travel professionals. Manage bookings,
            queries, and finance in one seamless experience.{" "}
          </p>
        </div>
      </div>

      {/* RIGHT SIDE LOGIN FORM */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 relative bg-white">
        <div className="w-full max-w-md">
          {/* LOGO */}
          <div className="flex justify-center mb-8 ">
            <img
              src={logo}
              alt="Company Logo"
              className="w-34 h-30 object-contain absolute top-18 left-35"
            />
          </div>

          <div className="rounded-2xl p-10 ">
            <h2 className="text-3xl font-bold text-gray-800">Welcome back</h2>
            <p className="text-gray-500 mt-2 mb-6">
              Enter your credentials to access your dashboard
            </p>

            {/* 🔴 Error Message */}
            {/* {error && <p className="text-red-500 text-sm mb-4">{error}</p>} */}

            <form className="space-y-6">
              <div>
                <label className="text-md font-semibold">Email</label>
                <input
                  type="email"
                  placeholder="client@gmail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border  border-gray-300 rounded-2xl focus:outline-none"
                  // required
                />
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <label className="text-md font-semibold">Password</label>
                  <Link to="#" className="text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <input
                  type="password"
                  placeholder="****************"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none "
                  // required
                />
              </div>
              <Link to="/agent/dashboard">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition cursor-pointer "
                >
                  Sign in <ArrowRight className="w-5 h-5 stroke-[1.8] " />
                </button>
              </Link>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
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
