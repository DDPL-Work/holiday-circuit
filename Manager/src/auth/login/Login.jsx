import { useEffect, useMemo, useState } from "react";
import logo from "../../assets/logo img.png";
import image from "../../assets/Image (Luxury Travel).svg";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { loginUser, logout, resetAuthState } from "../../redux/slices/authSlice.js";
import OpsTeamLoginModal from "../../modal/OpsTeamLoginModal.jsx";
import API from "../../utils/Api.js";

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

const createRecoveryState = (email = "") => ({
  email,
  otp: "",
  newPassword: "",
  confirmPassword: "",
});

const ValidationPill = ({ message }) =>
  message ? (
    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-medium text-rose-600">
      {message}
    </span>
  ) : null;

const StepPill = ({ index, label, active, complete }) => (
  <div
    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium ${
      complete
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-400"
    }`}
  >
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
        complete ? "bg-emerald-600 text-white" : active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
      }`}
    >
      {complete ? <CheckCircle2 size={11} /> : index}
    </span>
    {label}
  </div>
);

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [openOpsModal, setOpenOpsModal] = useState(false);
  const [authView, setAuthView] = useState("login");
  const [forgotStep, setForgotStep] = useState("request");
  const [recovery, setRecovery] = useState(createRecoveryState());
  const [recoveryErrors, setRecoveryErrors] = useState({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, justLoggedIn, user } = useSelector((state) => state.auth);

  const recoveryStepIndex = useMemo(() => {
    if (forgotStep === "request") return 1;
    if (forgotStep === "verify") return 2;
    return 3;
  }, [forgotStep]);

  const authPanelMotion = shouldReduceMotion
    ? {
        initial: false,
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 0, scale: 1 },
        transition: { duration: 0.18, ease: "easeOut" },
      }
    : {
        initial: { opacity: 0, y: 10, scale: 0.995 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -6, scale: 0.995 },
        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
      };

  const brandMotion = shouldReduceMotion
    ? {
        initial: false,
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.18, ease: "easeOut" },
      }
    : {
        initial: { opacity: 0, y: 6, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.32, delay: 0.04, ease: [0.22, 1, 0.36, 1] },
      };

  const validateLoginForm = (values) => {
    const nextErrors = {};
    const emailError = getEmailValidationError(values.email);
    if (emailError) nextErrors.email = emailError;
    if (!values.password) nextErrors.password = "Password required";
    else if (values.password.length < 5) nextErrors.password = "Min 5 characters";
    return nextErrors;
  };

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

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const nextErrors = validateLoginForm({ ...form, [field]: value });
      return { ...prev, [field]: nextErrors[field] };
    });
  };

  const handleFieldBlur = (field) => {
    const nextErrors = validateLoginForm(form);
    setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validateLoginForm(form);
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
    dispatch(logout());
  }, [dispatch]);

  useEffect(() => {
    if (openOpsModal) return;

    if (token && justLoggedIn && user) {
      if (user.role !== "agent") {
        toast.error("This login form is only for agents. Please use Team Workspace.");
        dispatch(logout());
        dispatch(resetAuthState());
        return;
      }

      toast.success("Welcome Agent! Agent Dashboard");
      dispatch(resetAuthState());
      navigate("/agent/dashboard", { replace: true });
    }
  }, [token, justLoggedIn, user, navigate, dispatch, openOpsModal]);

  useEffect(() => {
    if (!error || openOpsModal) return;

    toast.error(error);
    dispatch(resetAuthState());
  }, [error, dispatch, openOpsModal]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timeoutId = window.setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timeoutId);
  }, [resendCooldown]);

  return (
    <>
      <OpsTeamLoginModal open={openOpsModal} onClose={() => setOpenOpsModal(false)} />
      <div className="min-h-screen overflow-y-auto lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-gray-100">
        <div className="hidden lg:flex w-1/2 relative overflow-hidden">
          <img src={image} alt="travel" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
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

        <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-100/85 via-blue-50/60 via-60% to-slate-200/50 px-6 py-12 lg:w-1/2 lg:min-h-0 lg:h-full lg:py-0">
          <div className="absolute right-6 top-6 z-10">
            <button
              onClick={() => setOpenOpsModal(true)}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-[#0f2d5a] to-[#0a0f1d] text-white px-4 py-2 text-sm font-medium border border-white/5 transition-all duration-300 hover:from-[#153e7a] hover:to-[#020617] hover:shadow-[0_4px_10px_rgba(15,45,90,0.25)]"
            >
              Team Workspace
            </button>
          </div>

          <div className="w-full max-w-md overflow-hidden py-6 mt-12 lg:mt-0">
            <AnimatePresence mode="wait" initial={false}>
              {authView === "login" ? (
                <motion.div
                  key="agent-login"
                  initial={authPanelMotion.initial}
                  animate={authPanelMotion.animate}
                  exit={authPanelMotion.exit}
                  transition={authPanelMotion.transition}
                  className="rounded-2xl p-2 will-change-transform"
                >
                  <motion.div
                    initial={brandMotion.initial}
                    animate={brandMotion.animate}
                    transition={brandMotion.transition}
                    className="mb-5 flex min-h-[88px] items-center justify-center relative"
                  >
                    <img
                      src={logo}
                      alt="Company Logo"
                      width="88"
                      height="88"
                      decoding="async"
                      fetchPriority="high"
                      className="h-25 w-25 object-contain select-none"
                    />
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Welcome back</h2>
                  <p className="mb-4 mt-1.5 text-xs sm:text-sm text-gray-500">
                    Enter your agent credentials to access your dashboard
                  </p>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="text-sm sm:text-md font-semibold text-slate-800">
                          Email <span className="text-red-700">*</span>
                        </label>
                        <ValidationPill message={errors.email} />
                      </div>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          placeholder="client@gmail.com"
                          value={form.email}
                          onChange={(e) => handleFieldChange("email", e.target.value)}
                          onBlur={() => handleFieldBlur("email")}
                          className={`w-full rounded-2xl border py-2 sm:py-2.5 pl-11 pr-4 text-sm sm:text-base focus:outline-none ${
                            errors.email ? "border-rose-300 bg-rose-50/40" : "border-gray-300"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <label className="text-sm sm:text-md font-semibold text-slate-800">
                          Password <span className="text-red-700">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAuthView("forgot");
                              setForgotStep("request");
                              setRecovery(createRecoveryState(form.email.trim()));
                              setRecoveryErrors({});
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            Forgot password?
                          </button>
                          <ValidationPill message={errors.password} />
                        </div>
                      </div>

                      <Lock className="pointer-events-none absolute left-4 top-[calc(50%+14px)] h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="****************"
                        value={form.password}
                        onChange={(e) => handleFieldChange("password", e.target.value)}
                        onBlur={() => handleFieldBlur("password")}
                        className={`w-full rounded-2xl border py-2 sm:py-2.5 pl-11 pr-11 text-sm sm:text-base focus:outline-none ${
                          errors.password ? "border-rose-300 bg-rose-50/40" : "border-gray-300"
                        }`}
                      />
                      <span
                        className="absolute right-5 top-[calc(50%+14px)] -translate-y-1/2 cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <Eye className="h-5 w-5 stroke-[1.8] text-gray-500" />
                        ) : (
                          <EyeOff className="h-5 w-5 stroke-[1.8] text-gray-500" />
                        )}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0f2d5a] to-[#0a0f1d] text-white py-2.5 rounded-xl disabled:cursor-not-allowed disabled:bg-slate-500 hover:from-[#153e7a] hover:to-[#020617] hover:shadow-[0_4px_12px_rgba(15,45,90,0.3)] transition-all duration-300"
                    >
                      {loading ? "Signing in..." : "Sign in"}
                      <ArrowRight className="w-5 h-5 stroke-[1.8]" />
                    </button>
                  </form>

                  <p className="text-center text-sm text-gray-500 mt-5">
                    Don&apos;t have an account?{" "}
                    <Link to="/register" className="text-blue-600 font-medium cursor-pointer">
                      Sign up
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="agent-recovery"
                  initial={authPanelMotion.initial}
                  animate={authPanelMotion.animate}
                  exit={authPanelMotion.exit}
                  transition={authPanelMotion.transition}
                  className="rounded-2xl p-2 will-change-transform"
                >
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => resetForgotFlow(recovery.email || form.email)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50"
                    >
                      <ChevronLeft size={14} />
                      Back to sign in
                    </button>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600">
                      <KeyRound size={13} />
                      Recovery Flow
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Forgot password</h2>
                  <p className="mb-4 mt-1.5 text-xs sm:text-sm text-gray-500">
                    Recover your account in three quick steps without leaving the login screen.
                  </p>

                  {forgotStep !== "success" ? (
                    <div className="mb-6 flex flex-wrap gap-2">
                      <StepPill index={1} label="Email" active={recoveryStepIndex === 1} complete={recoveryStepIndex > 1} />
                      <StepPill index={2} label="OTP" active={recoveryStepIndex === 2} complete={recoveryStepIndex > 2} />
                      <StepPill index={3} label="Password" active={recoveryStepIndex === 3} complete={false} />
                    </div>
                  ) : null}

                  {forgotStep === "request" ? (
                    <div className="space-y-5">
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label className="text-sm sm:text-md font-semibold text-slate-800">Work Email</label>
                          <ValidationPill message={recoveryErrors.email} />
                        </div>
                        <input
                          type="email"
                          value={recovery.email}
                          onChange={(e) => handleRecoveryChange("email", e.target.value)}
                          onBlur={() => handleRecoveryBlur("email")}
                          placeholder="client@gmail.com"
                          className={`w-full rounded-2xl border px-4 py-2 sm:py-2.5 text-sm sm:text-base focus:outline-none transition-all ${
                            recoveryErrors.email
                              ? "border-rose-300 bg-rose-50/40 text-slate-900 placeholder:text-rose-300"
                              : "border-gray-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          }`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={recoveryLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f2d5a] to-[#0a0f1d] py-2.5 text-white disabled:cursor-not-allowed disabled:bg-slate-500 hover:from-[#153e7a] hover:to-[#020617] hover:shadow-[0_4px_12px_rgba(15,45,90,0.3)] transition-all duration-300"
                      >
                        {recoveryLoading ? "Sending code..." : "Send verification code"}
                        {!recoveryLoading ? <ArrowRight className="w-5 h-5 stroke-[1.8]" /> : null}
                      </button>
                    </div>
                  ) : null}

                  {forgotStep === "verify" ? (
                    <div className="space-y-4">
                      <div>
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <label className="text-sm sm:text-md font-semibold text-slate-800">6-Digit OTP</label>
                          <ValidationPill message={recoveryErrors.otp} />
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={recovery.otp}
                          onChange={(e) => handleRecoveryChange("otp", e.target.value)}
                          onBlur={() => handleRecoveryBlur("otp")}
                          placeholder="000000"
                          className={`w-full rounded-2xl border px-4 py-1.5 sm:py-2 text-center text-base sm:text-xl font-semibold tracking-[0.25em] sm:tracking-[0.35em] focus:outline-none transition-all ${
                            recoveryErrors.otp
                              ? "border-rose-300 bg-rose-50/40 text-rose-900 placeholder:text-rose-300"
                              : "border-gray-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          }`}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2.5 text-xs text-slate-500">
                        <span className="text-center sm:text-left">Didn&apos;t receive the code?</span>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={resendCooldown > 0 || recoveryLoading}
                          className="inline-flex items-center justify-center gap-2 font-semibold text-blue-600 disabled:cursor-not-allowed disabled:text-slate-400 w-full sm:w-auto"
                        >
                          <RefreshCw size={13} className={resendCooldown > 0 ? "animate-spin" : ""} />
                          <span className="whitespace-nowrap">
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                          </span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={recoveryLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f2d5a] to-[#0a0f1d] py-2.5 text-white disabled:cursor-not-allowed disabled:bg-slate-500 hover:from-[#153e7a] hover:to-[#020617] hover:shadow-[0_4px_12px_rgba(15,45,90,0.3)] transition-all duration-300"
                      >
                        {recoveryLoading ? "Verifying..." : "Verify OTP"}
                        {!recoveryLoading ? <ArrowRight className="w-5 h-5 stroke-[1.8]" /> : null}
                      </button>
                    </div>
                  ) : null}

                  {forgotStep === "reset" ? (
                    <div className="space-y-5">
                      <div className="relative">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label className="text-md font-semibold text-slate-800">New Password</label>
                          <ValidationPill message={recoveryErrors.newPassword} />
                        </div>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={recovery.newPassword}
                          onChange={(e) => handleRecoveryChange("newPassword", e.target.value)}
                          onBlur={() => handleRecoveryBlur("newPassword")}
                          placeholder="Create new password"
                          className={`w-full rounded-2xl border px-4 py-2.5 focus:outline-none transition-all ${
                            recoveryErrors.newPassword
                              ? "border-rose-300 bg-rose-50/40 text-rose-900 placeholder:text-rose-300"
                              : "border-gray-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          className="absolute right-4 top-[45px] text-gray-400 hover:text-gray-600 transition"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>

                      <div className="relative">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label className="text-md font-semibold text-slate-800">Confirm Password</label>
                          <ValidationPill message={recoveryErrors.confirmPassword} />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={recovery.confirmPassword}
                          onChange={(e) => handleRecoveryChange("confirmPassword", e.target.value)}
                          onBlur={() => handleRecoveryBlur("confirmPassword")}
                          placeholder="Confirm new password"
                          className={`w-full rounded-2xl border px-4 py-2.5 focus:outline-none transition-all ${
                            recoveryErrors.confirmPassword
                              ? "border-rose-300 bg-rose-50/40 text-rose-900 placeholder:text-rose-300"
                              : "border-gray-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-4 top-[45px] text-gray-400 hover:text-gray-600 transition"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={recoveryLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f2d5a] to-[#0a0f1d] py-2.5 text-white disabled:cursor-not-allowed disabled:bg-slate-500 hover:from-[#153e7a] hover:to-[#020617] hover:shadow-[0_4px_12px_rgba(15,45,90,0.3)] transition-all duration-300"
                      >
                        {recoveryLoading ? "Updating password..." : "Update password"}
                        {!recoveryLoading ? <ArrowRight className="w-5 h-5 stroke-[1.8]" /> : null}
                      </button>
                    </div>
                  ) : null}

                  {forgotStep === "success" ? (
                    <div className="rounded-3xl border border-emerald-200 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] px-6 py-7 shadow-sm">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <CheckCircle2 size={28} />
                      </div>
                      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        Recovery Complete
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                        Password updated successfully
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-500">
                        Your account is ready. Return to sign in using the new password.
                      </p>
                      <button
                        type="button"
                        onClick={() => resetForgotFlow(recovery.email)}
                        className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f2d5a] to-[#0a0f1d] py-2.5 text-white hover:from-[#153e7a] hover:to-[#020617] hover:shadow-[0_4px_12px_rgba(15,45,90,0.3)] transition-all duration-300"
                      >
                        Return to sign in
                        <ArrowRight className="w-5 h-5 stroke-[1.8]" />
                      </button>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
