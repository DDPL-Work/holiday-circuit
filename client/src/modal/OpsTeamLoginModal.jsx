import { useEffect, useRef, useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
  Settings,
  Wallet,
  Shield,
  Users,
  Briefcase,
} from "lucide-react";
import logo from "../assets/logo img.png";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, logout, resetAuthState } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const roles = [
  { label: "Operation Team", value: "operations", Icon: Settings },
  { label: "Finance Team", value: "finance_partner", Icon: Wallet },
  { label: "Super Admin", value: "admin", Icon: Shield },
  { label: "Operation Manager", value: "operation_manager", Icon: Users },
  { label: "Finance Manager", value: "finance_manager", Icon: Briefcase },
];

const allowedWorkspaceRoles = new Set(roles.map((role) => role.value));

const roleRedirectMap = {
  operations: { message: "Welcome Ops team! Access granted", path: "/ops/dashboard" },
  finance_partner: { message: "Welcome Finance Partner", path: "/finance/dashboard" },
  admin: { message: "Welcome Super Admin", path: "/admin/superAdminDashboard" },
  operation_manager: {
    message: "Welcome Operation Manager",
    path: "/operationManager/operationManagerDashboard",
  },
  finance_manager: {
    message: "Welcome Finance Manager",
    path: "/financeManager/financeManagerDashboard",
  },
};

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

const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

const ErrorPill = ({ message }) =>
  message ? (
    <span className="whitespace-nowrap rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-medium text-rose-600">
      {message}
    </span>
  ) : null;

export default function OpsTeamLoginModal({ open, onClose }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [roleMenuPlacement, setRoleMenuPlacement] = useState("down");
  const [roleMenuMaxHeight, setRoleMenuMaxHeight] = useState(280);
  const roleMenuRef = useRef(null);
  const roleButtonRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { error, token, justLoggedIn, user, loading } = useSelector(
    (state) => state.auth,
  );

  const validateForm = (values) => {
    const nextErrors = {};

    if (!values.role) nextErrors.role = "Select role";
    if (!values.email.trim()) nextErrors.email = "Email required";
    else if (!validateEmail(values.email)) nextErrors.email = "Invalid email";
    if (!values.password) nextErrors.password = "Password required";
    else if (values.password.length < 5) nextErrors.password = "Min 5 characters";

    return nextErrors;
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const nextErrors = validateForm({ ...form, [field]: value });
      return { ...prev, [field]: nextErrors[field] };
    });
  };

  const handleFieldBlur = (field) => {
    const nextErrors = validateForm(form);
    setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    dispatch(loginUser(form));
  };

  useEffect(() => {
    if (!open) return;

    if (token && justLoggedIn && user) {
      if (!allowedWorkspaceRoles.has(user.role)) {
        toast.error("Team Workspace is only for Operations, Finance, and Super Admin users.");
        dispatch(logout());
        dispatch(resetAuthState());
        return;
      }

      const redirectConfig = roleRedirectMap[user.role];

      if (redirectConfig) {
        toast.success(redirectConfig.message);
        navigate(redirectConfig.path, { replace: true });
      } else {
        toast.success("Login successful");
      }

      onClose?.();
      dispatch(resetAuthState());
    }
  }, [token, justLoggedIn, user, navigate, dispatch, onClose, open]);

  const handleRoleSelect = (roleValue) => {
    handleFieldChange("role", roleValue);
    setRoleMenuOpen(false);
    const nextErrors = validateForm({ ...form, role: roleValue });
    setErrors((prev) => ({ ...prev, role: nextErrors.role }));
  };

  useEffect(() => {
    if (!open || !error) return;

    toast.error(error);
    dispatch(resetAuthState());
  }, [error, dispatch, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setShowPassword(false);
      setErrors({});
      setRoleMenuOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!roleMenuOpen) return;

    const node = roleButtonRef.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const desired = 320;
      const nextPlacement =
        spaceBelow < desired && spaceAbove > spaceBelow ? "up" : "down";

      setRoleMenuPlacement(nextPlacement);

      const available = nextPlacement === "down" ? spaceBelow : spaceAbove;
      const nextMaxHeight = Math.min(340, Math.max(180, Math.floor(available - 12)));
      setRoleMenuMaxHeight(nextMaxHeight);
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setRoleMenuOpen(false);
        handleFieldBlur("role");
      }
    };

    const handlePointerDown = (event) => {
      const root = roleMenuRef.current;
      if (root && !root.contains(event.target)) {
        setRoleMenuOpen(false);
        handleFieldBlur("role");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("touchstart", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("touchstart", handlePointerDown);
    };
  }, [roleMenuOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={backdropVariant}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-[9000] bg-black/60 backdrop-blur-lg"
            onClick={onClose}
          />

          {/* ✅ py-8 added so top/bottom gap always rahega viewport mein */}
          <motion.div
            className="fixed inset-0 z-[9500] flex items-center justify-center p-4 py-8"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* ✅ max-h-[90vh] + overflow-y-auto: modal kabhi screen se bada nahi hoga */}
            <motion.div
              variants={modalVariant}
              className="relative w-full max-w-md rounded-[25px] border border-white/70 bg-white p-5 shadow-[0_32px_90px_rgba(15,23,42,0.25)] sm:p-6 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={onClose}
                className="absolute right-5 top-5 text-sm text-gray-500 transition hover:text-black"
              >
                x
              </button>

              {/* ✅ Logo size thodi kam, h-12 */}
              <div className="flex justify-center">
                <img src={logo} alt="Holiday Circuit" className="h-12 " />
              </div>

              {/* ✅ mt-1 (was mt-2) */}
              <h2 className="mt-1 text-center text-2xl font-bold text-slate-900">
                Holiday Circuit
              </h2>
              <p className="text-center text-xs text-slate-500">
                Operations, Finance & Admin Workspace
              </p>

              {/* ✅ mt-2 (was mt-3) */}
              <div className="mt-2 flex justify-center">
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                  Authorized Team & Admin Access
                </span>
              </div>

              {/* ✅ mt-4 space-y-3 (was mt-5 space-y-4) */}
              <motion.form
                onSubmit={handleSubmit}
                className="mt-4 space-y-3"
                initial="hidden"
                animate="visible"
                transition={{ staggerChildren: 0.08 }}
              >
                <motion.div variants={itemVariant}>
                  {/* ✅ min-h-[22px] mb-0.5 (was min-h-[26px] mb-1) */}
                  <div className="mb-0.5 flex min-h-[22px] items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-slate-900">Access Role</label>
                    <ErrorPill message={errors.role} />
                  </div>
                  <div className="relative" ref={roleMenuRef}>
                    {(() => {
                      const activeRole = roles.find((r) => r.value === form.role) || null;
                      const ActiveIcon = activeRole?.Icon || null;

                      return (
                        <>
                          <button
                            ref={roleButtonRef}
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={roleMenuOpen}
                            onClick={() => setRoleMenuOpen((prev) => !prev)}
                            className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm outline-none transition ${
                              errors.role
                                ? "border-rose-300 bg-rose-50/40"
                                : "border-slate-300 bg-slate-50 hover:border-slate-400 focus:border-slate-500"
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
                                {ActiveIcon ? <ActiveIcon size={15} /> : <Users size={15} />}
                              </span>
                              <span className="min-w-0 truncate text-left">
                                {activeRole ? activeRole.label : "Select role"}
                              </span>
                            </span>
                            <ChevronDown
                              size={16}
                              className={`flex-shrink-0 text-slate-400 transition-transform ${
                                roleMenuOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {roleMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                transition={{ duration: 0.14, ease: "easeOut" }}
                                className={`hide-scrollbar absolute left-0 right-0 z-20 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ${
                                  roleMenuPlacement === "up" ? "bottom-full mb-2" : "top-full mt-2"
                                }`}
                                style={{ maxHeight: roleMenuMaxHeight }}
                                role="listbox"
                                tabIndex={-1}
                              >
                                <div className="overflow-y-auto overflow-x-hidden">
                                {roles.map((r) => {
                                  const OptionIcon = r.Icon || Users;
                                  const selected = r.value === form.role;
                                  return (
                                    <button
                                      key={r.value}
                                      type="button"
                                      role="option"
                                      aria-selected={selected}
                                      onMouseDown={(event) => {
                                        event.preventDefault();
                                        handleRoleSelect(r.value);
                                      }}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                          event.preventDefault();
                                          handleRoleSelect(r.value);
                                        }
                                      }}
                                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition ${
                                        selected ? "bg-slate-50" : "hover:bg-slate-50"
                                      }`}
                                    >
                                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
                                        <OptionIcon size={10} />
                                      </span>
                                      <span className="min-w-0 flex-1 truncate font-medium text-xs text-slate-800">
                                        {r.label}
                                      </span>
                                      {selected ? (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                          <Check size={13} />
                                        </span>
                                      ) : null}
                                    </button>
                                  );
                                })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      );
                    })()}
                  </div>
                </motion.div>

                <motion.div variants={itemVariant}>
                  {/* ✅ min-h-[22px] mb-0.5 */}
                  <div className="mb-0.5 flex min-h-[22px] items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-slate-900">Email Address</label>
                    <ErrorPill message={errors.email} />
                  </div>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      onBlur={() => handleFieldBlur("email")}
                      placeholder="staff@holidaycircuit.com"
                      className={`w-full rounded-2xl py-2 pl-10 pr-3 text-sm outline-none transition ${
                        errors.email
                          ? "border border-rose-300 bg-rose-50/40"
                          : "border border-slate-300 bg-slate-50 focus:border-slate-500"
                      }`}
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariant}>
                  {/* ✅ min-h-[22px] mb-0.5 */}
                  <div className="mb-0.5 flex min-h-[22px] items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-slate-900">Password</label>
                    <ErrorPill message={errors.password} />
                  </div>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => handleFieldChange("password", e.target.value)}
                      onBlur={() => handleFieldBlur("password")}
                      placeholder="********"
                      className={`w-full rounded-2xl py-2 pl-10 pr-11 text-sm outline-none transition ${
                        errors.password
                          ? "border border-rose-300 bg-rose-50/40"
                          : "border border-slate-300 bg-slate-50 focus:border-slate-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </motion.div>

                {/* ✅ py-2 (was py-2.5) */}
                <motion.button
                  variants={itemVariant}
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-900 py-2 text-sm font-medium text-white transition hover:bg-[#031541] disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  {loading ? "Signing In..." : "Access Control Panel"}
                </motion.button>
              </motion.form>

              {/* ✅ mt-4 (was mt-5) */}
              <p className="mt-4 text-center text-xs text-gray-500">
                Authorized personnel only. All activities are monitored.
              </p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
