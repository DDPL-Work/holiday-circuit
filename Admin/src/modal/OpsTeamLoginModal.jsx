import { useEffect, useRef, useState, useMemo } from "react";
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
  Box,
  X,
  ChevronLeft,
  KeyRound,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import logo from "../assets/logo img.png";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, logout, resetAuthState } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import API from "../utils/Api";

const roles = [
  { label: "Operation Team", value: "operations", Icon: Settings },
  { label: "Finance Team", value: "finance_partner", Icon: Wallet },
  { label: "DMC Partner", value: "dmc_partner", Icon: Box },
  { label: "Super Admin", value: "admin", Icon: Shield },
  { label: "Operation Manager", value: "operation_manager", Icon: Users },
  { label: "Finance Manager", value: "finance_manager", Icon: Briefcase },
];

const allowedWorkspaceRoles = new Set(roles.map((role) => role.value));

const roleRedirectMap = {
  operations: { message: "Welcome Ops team! Access granted", path: "/ops/dashboard" },
  finance_partner: { message: "Welcome Finance Partner", path: "/finance/dashboard" },
  dmc_partner: { message: "Welcome DMC Partner", path: "/dmc/dashboard" },
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

const getEmailValidationError = (email) => {
  const emailStr = String(email || "").trim().toLowerCase();
  if (!emailStr) return "Email required";

  // Standard strict regex for email pattern validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(emailStr)) return "Invalid email format";

  // Split domain
  const parts = emailStr.split("@");
  if (parts.length !== 2) return "Invalid email format";
  const domain = parts[1];

  // Split domain name and TLD
  const domainParts = domain.split(".");
  const domainName = domainParts[0];
  const tld = domainParts.slice(1).join(".");

  // 1. Check spelling of "gmail"
  const gmailTypos = ["gmil", "gamil", "gmaill", "gmeil", "gmal", "gimail", "gmial"];
  if (gmailTypos.includes(domainName)) {
    return "Typo: Did you mean 'gmail'?";
  }

  // 2. Check spelling of ".com"
  const comTypos = ["ocm", "con", "cmo", "c0m", "cm", "coo"];
  if (comTypos.includes(tld)) {
    return `Typo: Did you mean '.com' instead of '.${tld}'?`;
  }

  // 3. Block other exact typos
  const commonTypos = [
    "gamil.com", "gamil.co", "gamil.in", "gamil.net",
    "gmil.com", "gmil.co", "gmil.in", "gmil.net",
    "gmail.co", "gmail.con",
    "gmaill.com", "gmeil.com",
    "yaho.com", "yhoo.com", "hotmal.com"
  ];
  if (commonTypos.includes(domain)) {
    return "Invalid email domain spelling";
  }

  return null;
};

const validateEmail = (email) => getEmailValidationError(email) === null;

const ErrorPill = ({ message }) =>
  message ? (
    <span className="whitespace-nowrap rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-medium text-rose-600">
      {message}
    </span>
  ) : null;

const createRecoveryState = (email = "") => ({
  email,
  otp: "",
  newPassword: "",
  confirmPassword: "",
});

const StepPill = ({ index, label, active, complete }) => (
  <div
    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
      complete
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white/70 text-slate-400"
    }`}
  >
    <span
      className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[9px] ${
        complete ? "bg-emerald-600 text-white" : active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
      }`}
    >
      {complete ? <CheckCircle2 size={10} /> : index}
    </span>
    {label}
  </div>
);

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

  // Recovery Flow States
  const [authView, setAuthView] = useState("login"); // "login" or "forgot"
  const [forgotStep, setForgotStep] = useState("request");
  const [recovery, setRecovery] = useState(createRecoveryState());
  const [recoveryErrors, setRecoveryErrors] = useState({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const recoveryStepIndex = useMemo(() => {
    if (forgotStep === "request") return 1;
    if (forgotStep === "verify") return 2;
    return 3;
  }, [forgotStep]);

  const validateRecoveryStep = (step, values) => {
    const nextErrors = {};
    const emailError = getEmailValidationError(values.email);
    if (emailError) nextErrors.email = emailError;

    if (step === "verify") {
      const otp = String(values.otp || "").replace(/\D/g, "");
      if (!otp) nextErrors.otp = "OTP required";
      else if (otp.length !== 6) nextErrors.otp = "Use 6 digits";
    }

    if (step === "reset") {
      if (!values.newPassword) nextErrors.newPassword = "Password required";
      else if (values.newPassword.length < 6) nextErrors.newPassword = "Min 6 characters";
      if (!values.confirmPassword) nextErrors.confirmPassword = "Confirm password";
      else if (values.confirmPassword !== values.newPassword) nextErrors.confirmPassword = "Passwords do not match";
    }

    return nextErrors;
  };

  const resetForgotFlow = (email = "") => {
    setAuthView("login");
    setForgotStep("request");
    setRecovery(createRecoveryState(email));
    setRecoveryErrors({});
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setRecoveryLoading(false);
    setResendCooldown(0);
  };

  const handleRecoveryChange = (field, value) => {
    const nextValue = field === "otp" ? String(value || "").replace(/\D/g, "").slice(0, 6) : value;
    setRecovery((prev) => ({ ...prev, [field]: nextValue }));
    setRecoveryErrors((prev) => {
      if (!prev[field]) return prev;
      const nextErrors = validateRecoveryStep(forgotStep, { ...recovery, [field]: nextValue });
      return { ...prev, [field]: nextErrors[field] };
    });
  };

  const handleRecoveryBlur = (field) => {
    const nextErrors = validateRecoveryStep(forgotStep, recovery);
    setRecoveryErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
  };

  const handleSendOtp = async () => {
    const nextErrors = validateRecoveryStep("request", recovery);
    setRecoveryErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.email) {
        toast.error(nextErrors.email);
      } else {
        toast.error("Enter a valid work email to continue.");
      }
      return;
    }
    try {
      setRecoveryLoading(true);
      await API.post("/auth/forgot-password/send-otp", { email: recovery.email.trim() });
      setForgotStep("verify");
      setResendCooldown(60);
      toast.success("A 6-digit verification code has been sent to your email.");
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message ||
          requestError?.response?.data?.error ||
          "Unable to send verification code right now.",
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const nextErrors = validateRecoveryStep("verify", recovery);
    setRecoveryErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Enter the 6-digit code to continue.");
      return;
    }
    try {
      setRecoveryLoading(true);
      await API.post("/auth/forgot-password/verify-otp", {
        email: recovery.email.trim(),
        otp: recovery.otp.trim(),
      });
      setForgotStep("reset");
      toast.success("Verification complete. Create your new password.");
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message ||
          requestError?.response?.data?.error ||
          "OTP verification failed.",
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const nextErrors = validateRecoveryStep("reset", recovery);
    setRecoveryErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please complete the password fields correctly.");
      return;
    }
    try {
      setRecoveryLoading(true);
      await API.post("/auth/forgot-password/reset", {
        email: recovery.email.trim(),
        password: recovery.newPassword,
        confirmPassword: recovery.confirmPassword,
      });
      setForgotStep("success");
      setForm((prev) => ({ ...prev, email: recovery.email.trim(), password: "" }));
      toast.success("Password updated successfully.");
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message ||
          requestError?.response?.data?.error ||
          "Unable to reset password.",
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timeoutId = window.setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timeoutId);
  }, [resendCooldown]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { error, token, justLoggedIn, user, loading } = useSelector(
    (state) => state.auth,
  );

  const validateForm = (values) => {
    const nextErrors = {};

    if (!values.role) nextErrors.role = "Select role";
    const emailError = getEmailValidationError(values.email);
    if (emailError) nextErrors.email = emailError;
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
      if (nextErrors.email) {
        toast.error(nextErrors.email);
      } else {
        toast.error("Please fix the highlighted fields.");
      }
      return;
    }

    dispatch(loginUser(form));
  };

  useEffect(() => {
    if (!open) return;

    if (token && justLoggedIn && user) {
      if (!allowedWorkspaceRoles.has(user.role)) {
        toast.error("Team Workspace is only for Operations, Finance, DMC, and Admin users.");
        dispatch(logout());
        dispatch(resetAuthState());
        return;
      }

      if (form.role && user.role !== form.role) {
        toast.error("Selected role does not match your account role.");
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
  }, [token, justLoggedIn, user, navigate, dispatch, onClose, open, form.role]);

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
      setAuthView("login");
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
            <motion.div
              variants={modalVariant}
              className="relative w-full max-w-[360px] sm:max-w-md min-h-0 sm:min-h-[550px] flex flex-col rounded-[25px] border border-white/70 bg-gradient-to-br from-blue-100/90 via-blue-50/80 via-60% to-slate-200/90 p-5 sm:p-7 shadow-[0_32px_90px_rgba(15,23,42,0.25)] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] backdrop-blur-md"
            >
              <button
                onClick={onClose}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-all duration-300 hover:bg-gradient-to-tr hover:from-blue-100/50 hover:to-slate-200/50 hover:text-slate-900 hover:shadow-sm"
              >
                <X size={16} />
              </button>

              <div className="flex-1 flex flex-col justify-start">
                <div className="flex justify-center mb-1">
                  <img src={logo} alt="Holiday Circuit" className="h-12" />
                </div>

              <h2 className="mt-1 text-center text-2xl font-bold text-slate-900">
                Holiday Circuit
              </h2>
              <p className="text-center text-xs text-slate-500">
                Operations, Finance & Admin Workspace
              </p>

              <div className="mt-2.5 flex justify-center">
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                  Authorized Team & Admin Access
                </span>
              </div>

              <AnimatePresence mode="wait">
                {authView === "login" ? (
                  <motion.form
                    key="modal-login-form"
                    onSubmit={handleSubmit}
                    className="mt-4 space-y-3"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          staggerChildren: 0.05,
                          duration: 0.2,
                        },
                      },
                    }}
                  >
                    <motion.div variants={itemVariant}>
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
                                    ? "border-rose-300 bg-rose-50/40 text-rose-900"
                                    : "border-slate-300 bg-white hover:border-slate-400 focus:border-slate-500"
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
                          className={`w-full rounded-2xl py-2.5 pl-10 pr-3 text-sm outline-none transition ${
                            errors.email
                              ? "border border-rose-300 bg-rose-50/40 text-rose-900"
                              : "border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          }`}
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariant}>
                      <div className="mb-0.5 flex min-h-[22px] items-center justify-between gap-3">
                        <label className="text-sm font-semibold text-slate-900">Password</label>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAuthView("forgot");
                              setForgotStep("request");
                              setRecovery(createRecoveryState(form.email.trim()));
                              setRecoveryErrors({});
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Forgot password?
                          </button>
                          <ErrorPill message={errors.password} />
                        </div>
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
                          className={`w-full rounded-2xl py-2.5 pl-10 pr-11 text-sm outline-none transition ${
                            errors.password
                              ? "border border-rose-300 bg-rose-50/40 text-rose-900"
                              : "border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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

                    <motion.button
                      variants={itemVariant}
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0f2d5a] to-[#0a0f1d] py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-500 hover:from-[#153e7a] hover:to-[#020617] hover:shadow-[0_4px_12px_rgba(15,45,90,0.3)] transition-all duration-300"
                    >
                      {loading ? "Signing In..." : "Access Control Panel"}
                      {!loading && <ArrowRight size={16} />}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="modal-recovery"
                    className="mt-3.5 space-y-3.5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => resetForgotFlow(recovery.email || form.email)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 hover:bg-white"
                      >
                        <ChevronLeft size={14} />
                        Back to sign in
                      </button>
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-50/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                        <KeyRound size={13} />
                        Recovery
                      </div>
                    </div>

                    <div className="text-center sm:text-left">
                      <h3 className="text-xl font-bold text-slate-900">Forgot password</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Recover your workspace account in three simple steps.
                      </p>
                    </div>

                    {forgotStep !== "success" ? (
                      <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                        <StepPill index={1} label="Email" active={recoveryStepIndex === 1} complete={recoveryStepIndex > 1} />
                        <StepPill index={2} label="OTP" active={recoveryStepIndex === 2} complete={recoveryStepIndex > 2} />
                        <StepPill index={3} label="Password" active={recoveryStepIndex === 3} complete={false} />
                      </div>
                    ) : null}

                    {forgotStep === "request" ? (
                      <div className="space-y-4">
                        <div>
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <label className="text-xs font-semibold text-slate-800">Work Email</label>
                            <ErrorPill message={recoveryErrors.email} />
                          </div>
                          <div className="relative">
                            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="email"
                              value={recovery.email}
                              onChange={(e) => handleRecoveryChange("email", e.target.value)}
                              onBlur={() => handleRecoveryBlur("email")}
                              placeholder="staff@holidaycircuit.com"
                              className={`w-full rounded-2xl py-2.5 pl-10 pr-3 text-sm outline-none transition ${
                                recoveryErrors.email
                                  ? "border border-rose-300 bg-rose-50/40 text-rose-900"
                                  : "border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              }`}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={recoveryLoading}
                          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0f2d5a] to-[#0a0f1d] py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-500 hover:from-[#153e7a] hover:to-[#020617] hover:shadow-[0_4px_12px_rgba(15,45,90,0.3)] transition-all duration-300"
                        >
                          {recoveryLoading ? "Sending code..." : "Send verification code"}
                          {!recoveryLoading && <ArrowRight size={16} />}
                        </button>
                      </div>
                    ) : null}

                    {forgotStep === "verify" ? (
                      <div className="space-y-3">
                        <div>
                          <div className="mb-0.5 flex min-h-[20px] items-center justify-between gap-3">
                            <label className="text-xs font-semibold text-slate-800">6-Digit OTP</label>
                            <ErrorPill message={recoveryErrors.otp} />
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={recovery.otp}
                            onChange={(e) => handleRecoveryChange("otp", e.target.value)}
                            onBlur={() => handleRecoveryBlur("otp")}
                            placeholder="000000"
                            className={`w-full rounded-2xl py-1.5 text-center text-lg font-bold tracking-[0.35em] outline-none transition ${
                              recoveryErrors.otp
                                ? "border border-rose-300 bg-rose-50/40 text-rose-900"
                                : "border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            }`}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white/60 px-4 py-2 text-[11px] text-slate-500">
                          <span className="text-center sm:text-left">Didn&apos;t receive the code?</span>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={resendCooldown > 0 || recoveryLoading}
                            className="inline-flex items-center justify-center gap-1.5 font-semibold text-blue-600 disabled:cursor-not-allowed disabled:text-slate-400 w-full sm:w-auto"
                          >
                            <RefreshCw size={11} className={resendCooldown > 0 ? "animate-spin" : ""} />
                            <span className="whitespace-nowrap">
                              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                            </span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={recoveryLoading}
                          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0f2d5a] to-[#0a0f1d] py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-500 hover:from-[#153e7a] hover:to-[#020617] hover:shadow-[0_4px_12px_rgba(15,45,90,0.3)] transition-all duration-300"
                        >
                          {recoveryLoading ? "Verifying..." : "Verify OTP"}
                          {!recoveryLoading && <ArrowRight size={16} />}
                        </button>
                      </div>
                    ) : null}

                    {forgotStep === "reset" ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <div className="mb-0.5 flex min-h-[20px] items-center justify-between gap-3">
                            <label className="text-xs font-semibold text-slate-800">New Password</label>
                            <ErrorPill message={recoveryErrors.newPassword} />
                          </div>
                          <div className="relative">
                            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={recovery.newPassword}
                              onChange={(e) => handleRecoveryChange("newPassword", e.target.value)}
                              onBlur={() => handleRecoveryBlur("newPassword")}
                              placeholder="Create new password"
                              className={`w-full rounded-2xl py-2 pl-10 pr-11 text-sm outline-none transition ${
                                recoveryErrors.newPassword
                                  ? "border border-rose-300 bg-rose-50/40 text-rose-900"
                                  : "border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-slate-700"
                            >
                              {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="mb-0.5 flex min-h-[20px] items-center justify-between gap-3">
                            <label className="text-xs font-semibold text-slate-800">Confirm Password</label>
                            <ErrorPill message={recoveryErrors.confirmPassword} />
                          </div>
                          <div className="relative">
                            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={recovery.confirmPassword}
                              onChange={(e) => handleRecoveryChange("confirmPassword", e.target.value)}
                              onBlur={() => handleRecoveryBlur("confirmPassword")}
                              placeholder="Confirm new password"
                              className={`w-full rounded-2xl py-2 pl-10 pr-11 text-sm outline-none transition ${
                                recoveryErrors.confirmPassword
                                  ? "border border-rose-300 bg-rose-50/40 text-rose-900"
                                  : "border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-slate-700"
                            >
                              {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleResetPassword}
                          disabled={recoveryLoading}
                          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0f2d5a] to-[#0a0f1d] py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-500 hover:from-[#153e7a] hover:to-[#020617] hover:shadow-[0_4px_12px_rgba(15,45,90,0.3)] transition-all duration-300"
                        >
                          {recoveryLoading ? "Updating password..." : "Update password"}
                          {!recoveryLoading && <ArrowRight size={16} />}
                        </button>
                      </div>
                    ) : null}

                    {forgotStep === "success" ? (
                      <div className="rounded-2xl border border-emerald-200 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-5 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                          <CheckCircle2 size={24} />
                        </div>
                        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                          Recovery Complete
                        </p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-900">
                          Password updated successfully
                        </h4>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Your account is ready. Return to login and use your new password.
                        </p>
                        <button
                          type="button"
                          onClick={() => resetForgotFlow(recovery.email)}
                          className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0f2d5a] to-[#0a0f1d] py-2.5 text-sm font-medium text-white hover:from-[#153e7a] hover:to-[#020617] hover:shadow-[0_4px_12px_rgba(15,45,90,0.3)] transition-all duration-300"
                        >
                          Return to sign in
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="mt-auto pt-3 text-center text-[11px] text-gray-500">
              Authorized personnel only. All activities are monitored.
            </p>
          </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
