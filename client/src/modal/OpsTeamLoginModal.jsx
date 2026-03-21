import { useEffect, useState } from "react";
import { Mail, Lock } from "lucide-react";
import logo from "../assets/logo img.png";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resetAuthState } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const roles = [
  { label: "Operational Team", value: "operations" },
  { label: "DMC Partner", value: "dmc_partner" },
  { label: "Finance Team", value: "finance_partner" },
  { label: "System Admin", value: "admin" },
];

// animations
const backdropVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariant = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function OpsTeamLoginModal({ open, onClose }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { error, token, justLoggedIn, user } = useSelector(
    (state) => state.auth
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.role) return toast.error("Please select access role");
    if (!form.email) return toast.error("Email is required");
    if (!form.password) return toast.error("Password is required");

    dispatch(loginUser(form));
  };

  useEffect(() => {
    if (token && justLoggedIn && user) {

      if (user.role === "operations") {
        toast.success("Welcome Ops team! access granted");
        navigate("/ops/dashboard", { replace: true });
       }

      else if (user.role === "dmc_partner") {
      toast.success("Welcome DMC Partner");
      navigate("/dmc/dashboard", { replace: true });
    }else if(user.role ==="finance_partner"){
        toast.success("Welcome FINANCE Partner");
        navigate("/finance/dashboard", { replace: true });
    }

      onClose();
      dispatch(resetAuthState());
  }
   
  }, [token, justLoggedIn, user, navigate, dispatch, onClose]);
   

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetAuthState());
    }
  }, [error, dispatch]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP */}
          <motion.div
            variants={backdropVariant}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/60 backdrop-blur-lg z-9000"
            onClick={onClose}
          />

          {/* MODAL WRAPPER */}
          <motion.div
            className="fixed inset-0 z-[9500] flex items-center justify-center"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              variants={modalVariant}
              className="relative w-full max-w-md bg-[#ffffff] rounded-4xl shadow-lg p-6"
            >
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-5 text-gray-500 hover:text-black cursor-pointer"
              >
                ✕
              </button>

              {/* Logo */}
              <div className="flex justify-center">
                <img src={logo} alt="Holiday Circuit" className="h-15 animate-softBounce" />
              </div>

              <h2 className="text-xl font-bold text-center text-[#0F172A]">
                Holiday Circuit
              </h2>
              <p className="text-xs text-center text-gray-500">
                DMC & Operations Portal
              </p>

              <div className="flex justify-center mt-2">
                <span className="text-xs bg-orange-100 border text-orange-600 px-3 py-1 rounded-full">
                  Internal Access Only
                </span>
              </div>

              {/* FORM */}
              <motion.form
                onSubmit={handleSubmit}
                className="mt-4 space-y-4"
                initial="hidden"
                animate="visible"
                transition={{ staggerChildren: 0.08 }}
              >
                {/* ROLE */}
                <motion.div variants={itemVariant}>
                  <label className="text-sm font-semibold text-black">
                    Access Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                    className="w-full mt-1 rounded-xl px-3 py-2 text-sm border border-gray-400 bg-gray-100 outline-none"
                  >
                    <option value="">Select role</option>
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </motion.div>

                {/* EMAIL */}
                <motion.div variants={itemVariant}>
                  <label className="text-sm font-semibold text-black">
                    Email Address
                  </label>
                  <div className="relative mt-1">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="staff@holidaycircuit.com"
                      className="w-full rounded-xl pl-10 pr-3 py-2 text-sm border border-gray-400 bg-gray-100 outline-none"
                    />
                  </div>
                </motion.div>

                {/* PASSWORD */}
                <motion.div variants={itemVariant}>
                  <label className="text-sm font-semibold text-black">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full rounded-xl pl-10 pr-3 py-2 text-sm border border-gray-400 bg-gray-100 outline-none"
                    />
                  </div>
                </motion.div>

                {/* BUTTON */}
                <button
                  type="submit"
                  className="w-full bg-[#0F172A] text-white py-2.5 rounded-2xl text-sm font-medium cursor-pointer 
                  transition hover:bg-[#031541]"
                >
                  Access Control Panel
                </button>
              </motion.form>

              <p className="mt-5 text-xs text-center text-gray-500">
                Authorized personnel only. All activities are monitored.
              </p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}