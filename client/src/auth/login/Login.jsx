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

const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

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
    if (!values.email.trim()) nextErrors.email = "Email required";
    else if (!validateEmail(values.email)) nextErrors.email = "Invalid email";
    if (!values.password) nextErrors.password = "Password required";
    else if (values.password.length < 5) nextErrors.password = "Min 5 characters";
    return nextErrors;
  };

  const validateRecoveryStep = (step, values) => {
    const nextErrors = {};
    if (!values.email.trim()) nextErrors.email = "Work email required";
    else if (!validateEmail(values.email)) nextErrors.email = "Enter a valid email";

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
      toast.error("Please fix the highlighted fields.");
      return;
    }
    dispatch(loginUser(form));
  };

  const handleSendOtp = async () => {
    const nextErrors = validateRecoveryStep("request", recovery);
    setRecoveryErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Enter a valid work email to continue.");
      return;
    }
    try {
      setRecoveryLoading(true);
      await API.post("/auth/forgot-password/send-otp", { email: recovery.email.trim() });
      setForgotStep("verify");
      setResendCooldown(45);
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
      <div className="h-screen overflow-hidden flex bg-gray-100">
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

        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white px-6 lg:w-1/2">
          <div className="absolute right-6 top-6 z-10">
            <button
              onClick={() => setOpenOpsModal(true)}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
            >
              Team Workspace
            </button>
          </div>

          <div className="w-full max-w-md overflow-hidden py-6">
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
                    className="mb-5 flex min-h-[88px] items-center justify-center"
                  >
                    <img
                      src={logo}
                      alt="Company Logo"
                      width="88"
                      height="88"
                      decoding="async"
                      fetchPriority="high"
                      className="h-25 w-25 object-contain select-none absolute top-5 left-0.5"
                    />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-800">Welcome back, Agent</h2>
                  <p className="mb-6 mt-2 text-gray-500">
                    Enter your agent credentials to access your dashboard
                  </p>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="text-md font-semibold">
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
                          className={`w-full rounded-2xl border py-2.5 pl-11 pr-4 focus:outline-none ${
                            errors.email ? "border-rose-300 bg-rose-50/40" : "border-gray-300"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <label className="text-md font-semibold">
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
                        className={`w-full rounded-2xl border py-2.5 pl-11 pr-11 focus:outline-none ${
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
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl disabled:cursor-not-allowed disabled:bg-slate-500"
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
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      <ChevronLeft size={14} />
                      Back to sign in
                    </button>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                      <KeyRound size={13} />
                      Recovery Flow
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold text-gray-800">Forgot password</h2>
                  <p className="mb-6 mt-2 text-gray-500">
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
                          <label className="text-md font-semibold">Work Email</label>
                          <ValidationPill message={recoveryErrors.email} />
                        </div>
                        <input
                          type="email"
                          value={recovery.email}
                          onChange={(e) => handleRecoveryChange("email", e.target.value)}
                          onBlur={() => handleRecoveryBlur("email")}
                          placeholder="client@gmail.com"
                          className={`w-full rounded-2xl border px-4 py-2.5 focus:outline-none ${
                            recoveryErrors.email ? "border-rose-300 bg-rose-50/40" : "border-gray-300"
                          }`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={recoveryLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-white disabled:cursor-not-allowed disabled:bg-slate-500"
                      >
                        {recoveryLoading ? "Sending code..." : "Send verification code"}
                        {!recoveryLoading ? <ArrowRight className="w-5 h-5 stroke-[1.8]" /> : null}
                      </button>
                    </div>
                  ) : null}

                  {forgotStep === "verify" ? (
                    <div className="space-y-5">
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label className="text-md font-semibold">6-Digit OTP</label>
                          <ValidationPill message={recoveryErrors.otp} />
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={recovery.otp}
                          onChange={(e) => handleRecoveryChange("otp", e.target.value)}
                          onBlur={() => handleRecoveryBlur("otp")}
                          placeholder="000000"
                          className={`w-full rounded-2xl border px-4 py-3 text-center text-2xl font-semibold tracking-[0.35em] focus:outline-none ${
                            recoveryErrors.otp ? "border-rose-300 bg-rose-50/40" : "border-gray-300"
                          }`}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-xs text-slate-500">
                        <span>Didn&apos;t receive the code?</span>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={resendCooldown > 0 || recoveryLoading}
                          className="inline-flex items-center gap-2 font-semibold text-blue-600 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          <RefreshCw size={13} />
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={recoveryLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-white disabled:cursor-not-allowed disabled:bg-slate-500"
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
                          <label className="text-md font-semibold">New Password</label>
                          <ValidationPill message={recoveryErrors.newPassword} />
                        </div>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={recovery.newPassword}
                          onChange={(e) => handleRecoveryChange("newPassword", e.target.value)}
                          onBlur={() => handleRecoveryBlur("newPassword")}
                          placeholder="Create new password"
                          className={`w-full rounded-2xl border px-4 py-2.5 focus:outline-none ${
                            recoveryErrors.newPassword ? "border-rose-300 bg-rose-50/40" : "border-gray-300"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          className="absolute right-4 top-[45px] text-gray-400"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>

                      <div className="relative">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label className="text-md font-semibold">Confirm Password</label>
                          <ValidationPill message={recoveryErrors.confirmPassword} />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={recovery.confirmPassword}
                          onChange={(e) => handleRecoveryChange("confirmPassword", e.target.value)}
                          onBlur={() => handleRecoveryBlur("confirmPassword")}
                          placeholder="Confirm new password"
                          className={`w-full rounded-2xl border px-4 py-2.5 focus:outline-none ${
                            recoveryErrors.confirmPassword ? "border-rose-300 bg-rose-50/40" : "border-gray-300"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-4 top-[45px] text-gray-400"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={recoveryLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-white disabled:cursor-not-allowed disabled:bg-slate-500"
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
                        className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-white"
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
