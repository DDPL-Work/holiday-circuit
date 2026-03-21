import React, { useEffect, useState } from "react";
import logo from "../../assets/logo img.png";
import image from "../../assets/Image (Luxury Travel).svg";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { loginUser, logout } from "../../redux/slices/authSlice.js";
import OpsTeamLoginModal from "../../modal/OpsTeamLoginModal.jsx";

const Login = () => {
const [form, setForm] = useState({ email: "", password: "" });
const [showPassword, setShowPassword] = useState(false);
const [openOpsModal, setOpenOpsModal] = useState(false);
const dispatch = useDispatch();
const navigate = useNavigate();

const { loading, error, token, justLoggedIn, user } = useSelector((state) => state.auth);

const handleSubmit = (e) => {
e.preventDefault();
if (!validateLogin()) return;
dispatch(loginUser(form));
};

useEffect(() => {
dispatch(logout());
}, [dispatch]);

useEffect(() => {
if (token && justLoggedIn && user) {
if (user.role === "agent") {
toast.success("Welcome Agent! Agent Dashboard");
navigate("/agent/dashboard", { replace: true });
}
if (user.role === "admin") {
toast.success("Welcome Admin! System access granted");
navigate("/admin/dashboard", { replace: true });
}
}
}, [token, justLoggedIn, user, navigate]);


useEffect(() => {
if (error) toast.error(error);
}, [error]);


const validateLogin = () => {
if (!form.email.trim()) {
toast.error("Email is required");
return false;
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
toast.error("Enter a valid email address");
return false;
}
if (!form.password) {
toast.error("Password is required");
return false;
}
if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return false; } return true; };


  return ( <>
  <OpsTeamLoginModal open={openOpsModal} onClose={()=> setOpenOpsModal(false)}/>
    <div className="min-h-screen flex bg-gray-100 ">
      {/* LEFT SIDE IMAGE */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <img src={image} alt="travel" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-16 text-white">
          <h1 className="w-80 text-4xl font-bold leading-tight">
            One World. Countless Circuits.
          </h1>
          <p className="mt-6 text-md opacity-90 max-w-lg">
            The premier B2B platform for travel professionals. Manage bookings,
            queries, and finance in one seamless experience.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE LOGIN FORM */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 relative bg-white overflow-hidden">
        <div className="w-full max-w-md overflow-hidden">
          <div className="flex justify-end mb-4">
            <button onClick={()=> setOpenOpsModal(true)}
              className="absolute top-6 right-6 px-4 py-1.5 text-sm rounded-full bg-slate-900 text-white z-10
              cursor-pointer"
              >
              Internal Access
            </button>
          </div>

          {/* LOGO */}
          <div className="flex justify-center mb-8">
            <img src={logo} alt="Company Logo"
              className="w-25 h-25 object-contain absolute top-5 left-17 animate-softBounce" />
          </div>

          <div className="rounded-2xl p-10">
            <h2 className="text-3xl font-bold text-gray-800">Welcome back</h2>
            <p className="text-gray-500 mt-2 mb-6">
              Enter your credentials to access your dashboard
            </p>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="text-md font-semibold">
                  Email <span className="text-red-700">*</span>
                </label>
                <input type="email" placeholder="client@gmail.com" value={form.email} onChange={(e) =>
                setForm({ ...form, email: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 border border-gray-300  rounded-2xl focus:outline-none"
                />
              </div>

              <div className="relative">
                <div className="flex justify-between text-sm">
                  <label className="text-md font-semibold">
                    Password <span className="text-red-700">*</span>
                  </label>
                  <Link to="#" className="text-blue-600 hover:underline">
                  Forgot password?
                  </Link>
                </div>

                <input type={showPassword ? "text" : "password" } placeholder="****************" value={form.password}
                  onChange={(e)=>
                setForm({ ...form, password: e.target.value })
                }
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none"
                />
                <span className="absolute top-9 right-5 cursor-pointer" onClick={()=> setShowPassword(!showPassword)}
                  >
                  {showPassword ? (
                  <Eye className="w-5 h-5 stroke-[1.8] text-gray-500" />
                  ) : (
                  <EyeOff className="w-5 h-5 stroke-[1.8] text-gray-500" />
                  )}
                </span>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-xl">
                {loading ? "Signing in..." : "Sign in"}
                <ArrowRight className="w-5 h-5 stroke-[1.8]" />
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 font-medium cursor-pointer">
              Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
</>
);
};

export default Login;