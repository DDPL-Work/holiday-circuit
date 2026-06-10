import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  X,
  UserPlus,
  Mail,
  Phone,
  CreditCard,
  Users,
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  Shield,
  Send,
  CheckCircle2,
} from "lucide-react";

const ROLES = [
  {
    key: "Super Admin",
    color: "#7c3aed",
    desc: "Full system access — manage users, overrides, config & analytics",
  },
  {
    key: "Ops Team",
    color: "#1d4ed8",
    desc: "Operations management — handle bookings, fulfillment & quotations",
  },
  {
    key: "Operation Manager",
    color: "#0ea5e9",
    desc: "Ops leadership - oversee team queries, workload & escalations",
  },
  {
    key: "Finance Team",
    color: "#ca8a04",
    desc: "Finance operations - verify payments, manage invoices & reconciliation",
  },
  {
    key: "Finance Manager",
    color: "#b45309",
    desc: "Finance leadership - manage team transactions & internal invoices",
  },
  {
    key: "DMC Partner",
    color: "#15803d",
    desc: "DMC-specific access — submit invoices, manage inventory & view orders",
  },
];

const ALL_PERMISSIONS = [
  "View", "Edit", "Export", "Override", "Delete",
  "Manage Users", "Manage Booking", "Approve Payments", "Reject Payment", "Submit Invoice", "System Config",
];

const ROLE_DEFAULT_PERMISSIONS = {
  "Super Admin": ["View", "Edit", "Export", "Override", "Delete", "Manage Users", "Approve Payments", "System Config"],
  "Ops Team": ["View", "Edit", "Export", "Manage Booking"],
  "Finance Team": ["View", "Export", "Approve Payments", "Reject Payment"],
  "Operation Manager": ["View", "Edit", "Export", "Manage Booking"],
  "Finance Manager": ["View", "Export", "Approve Payments", "Reject Payment"],
  "DMC Partner": ["View", "Edit", "Export", "Submit Invoice"],
};

const DEPARTMENTS = [
  "Operations", "Finance", "DMC Relations", "Administration", "Technology", "Sales",
];

const MANAGER_APPLICABLE_ROLES = new Set([
  "Ops Team",
]);

const FALLBACK_MANAGERS = [
  "Rajesh Kumar",
  "Priya Sharma",
  "Amit Singh",
  "Sneha Patel",
];

const COMMON_DOMAIN_TYPOS = new Map([
  ["gamil.com", "gmail.com"],
  ["gmial.com", "gmail.com"],
  ["gnail.com", "gmail.com"],
  ["gmail.co", "gmail.com"],
  ["yaho.com", "yahoo.com"],
  ["yhoo.com", "yahoo.com"],
  ["outlok.com", "outlook.com"],
  ["hotmial.com", "hotmail.com"],
  ["icloud.co", "icloud.com"],
]);

const getEmailValidationError = (value = "") => {
  const normalizedEmail = String(value || "").trim().toLowerCase();
  if (!normalizedEmail) return "";

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(normalizedEmail)) {
    return "Please enter a valid email address.";
  }

  const atIndex = normalizedEmail.lastIndexOf("@");
  const localPart = normalizedEmail.slice(0, atIndex);
  const domain = normalizedEmail.slice(atIndex + 1);

  if (localPart.length < 3) {
    return "Email part before '@' must be at least 3 characters.";
  }

  if (/^(.)\1+$/.test(localPart)) {
    return "Email looks suspicious (repeated identical characters).";
  }

  const suggestedDomain = COMMON_DOMAIN_TYPOS.get(domain);
  if (suggestedDomain) {
    return `Did you mean ${localPart}@${suggestedDomain}?`;
  }

  return "";
};

const getPhoneValidationError = (value = "") => {
  const cleaned = String(value || "").trim().replace(/[\s-()]/g, "");
  if (!cleaned) return "";

  if (cleaned.startsWith("+")) {
    if (!/^\+\d{10,14}$/.test(cleaned)) {
      return "International number must have 10-14 digits after '+'.";
    }
    return "";
  }

  let localNum = cleaned;
  if (cleaned.startsWith("0")) {
    localNum = cleaned.slice(1);
  } else if (cleaned.startsWith("91") && cleaned.length > 10) {
    localNum = cleaned.slice(2);
  }

  if (!/^\d{10}$/.test(localNum)) {
    return "Please enter a valid 10-digit number.";
  }

  if (/^(.)\1+$/.test(localNum)) {
    return "Phone number looks suspicious (repeated identical digits).";
  }

  return "";
};

const overlayVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.24, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: "easeIn" } },
};

const frameVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.24, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: "easeIn" } },
};

const modalVariant = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: 18,
    scale: 0.97,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

const arrowVariant = {
  initial: { x: 0 },
  animate: {
    x: [0, 4, 0],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const successIconWrapVariant = {
  hidden: { scale: 0.75, opacity: 0 },
  visible: {
    scale: [0.75, 1.08, 1],
    opacity: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const successCheckVariant = {
  hidden: { scale: 0.4, opacity: 0, rotate: -18 },
  visible: {
    scale: [0.4, 1.18, 1],
    opacity: 1,
    rotate: [ -18, 8, 0 ],
    transition: {
      duration: 0.5,
      delay: 0.12,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const EMPTY_FORM_STATE = {
  fullName: "",
  email: "",
  phone: "",
  employeeId: "",
  manager: "",
  selectedRole: "",
  department: "",
  designation: "",
  permissions: [],
  passwordMode: "auto",
  manualPassword: "",
  accountStatus: "Active",
  accessExpiry: "",
  sendWelcome: true,
  gstNumber: "",
  creditDays: [7],
};

const getFormStateFromUser = (user) => ({
  fullName: user?.name || "",
  email: user?.email || "",
  phone: user?.phone || "",
  employeeId: user?.employeeId || "",
  manager: user?.manager || "",
  selectedRole: user?.role || "",
  department: user?.department || "",
  designation: user?.designation || "",
  permissions: Array.isArray(user?.permissions) ? user.permissions : [],
  passwordMode: "auto",
  manualPassword: "",
  accountStatus: user?.status || "Active",
  accessExpiry: user?.accessExpiry ? String(user.accessExpiry).slice(0, 10) : "",
  sendWelcome: false,
  gstNumber: user?.gstNumber || "",
  creditDays: Array.isArray(user?.creditDays) ? user.creditDays : (user?.creditDays ? [Number(user.creditDays)] : [7]),
});

export default function AddNewUserModal({
  onClose,
  onCreateUser,
  onUpdateUser,
  mode = "create",
  initialUser = null,
  managerOptions = null,
  vendorMode = false,
}) {
  const isEditMode = mode === "edit";
  const [step, setStep] = useState(1);
  const initialFormState = isEditMode ? getFormStateFromUser(initialUser) : EMPTY_FORM_STATE;

  // Step 1
  const [fullName, setFullName] = useState(initialFormState.fullName);
  const [email, setEmail] = useState(initialFormState.email);
  const [phone, setPhone] = useState(initialFormState.phone);
  const [employeeId, setEmployeeId] = useState(initialFormState.employeeId);
  const [manager, setManager] = useState(initialFormState.manager);
  const [gstNumber, setGstNumber] = useState(initialFormState.gstNumber);
  const [creditDays, setCreditDays] = useState(initialFormState.creditDays);
  const [creditDropdownOpen, setCreditDropdownOpen] = useState(false);

  // Validation Errors
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Step 2
  const [selectedRole, setSelectedRole] = useState(initialFormState.selectedRole);
  const [department, setDepartment] = useState(initialFormState.department);
  const [designation, setDesignation] = useState(initialFormState.designation);
  const [permissions, setPermissions] = useState(initialFormState.permissions);

  // Step 3
  const [passwordMode, setPasswordMode] = useState(initialFormState.passwordMode);
  const [manualPassword, setManualPassword] = useState(initialFormState.manualPassword);
  const [showManualPassword, setShowManualPassword] = useState(false);
  const [accountStatus, setAccountStatus] = useState(initialFormState.accountStatus);
  const [accessExpiry, setAccessExpiry] = useState(initialFormState.accessExpiry);
  const [sendWelcome, setSendWelcome] = useState(initialFormState.sendWelcome);

  // Success
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationMeta, setCreationMeta] = useState({
    credentialsEmailSent: true,
    temporaryPassword: "",
    message: "",
  });

  const applyFormState = (nextState) => {
    setFullName(nextState.fullName);
    setEmail(nextState.email);
    setPhone(nextState.phone);
    setEmployeeId(nextState.employeeId);
    setManager(nextState.manager);
    setSelectedRole(vendorMode ? "DMC Partner" : nextState.selectedRole);
    setDepartment(vendorMode ? "DMC Relations" : nextState.department);
    setDesignation(vendorMode ? "DMC Partner" : nextState.designation);
    setPermissions(vendorMode ? ["View", "Edit", "Export", "Submit Invoice"] : nextState.permissions);
    setPasswordMode(nextState.passwordMode);
    setManualPassword(nextState.manualPassword);
    setAccountStatus(nextState.accountStatus);
    setAccessExpiry(nextState.accessExpiry);
    setSendWelcome(nextState.sendWelcome);
    setGstNumber(nextState.gstNumber || "");
    setCreditDays(nextState.creditDays || [7]);
    setCreditDropdownOpen(false);
    setEmailError("");
    setPhoneError("");
  };

  useEffect(() => {
    const nextState = isEditMode ? getFormStateFromUser(initialUser) : EMPTY_FORM_STATE;
    applyFormState(nextState);
    setStep(1);
    setDone(false);
    setShowManualPassword(false);
    setCreditDropdownOpen(false);
    setCreationMeta({
      credentialsEmailSent: !isEditMode,
      temporaryPassword: "",
      message: "",
    });
  }, [isEditMode, initialUser, vendorMode]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setPermissions(ROLE_DEFAULT_PERMISSIONS[role] || []);
    if (!MANAGER_APPLICABLE_ROLES.has(role)) {
      setManager("");
    }
  };

  const togglePermission = (p) => {
    setPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleContinue1 = () => {
    const emailErr = !email ? "Email address is required." : getEmailValidationError(email);
    const phoneErr = !phone ? "Phone number is required." : getPhoneValidationError(phone);

    if (!fullName) {
      toast.error(vendorMode ? "Please enter vendor name." : "Please enter a full name.");
      return;
    }

    if (emailErr || phoneErr) {
      setEmailError(emailErr);
      setPhoneError(phoneErr);
      toast.error("Please fix invalid fields before continuing.");
      return;
    }

    if (vendorMode) {
      if (!gstNumber) {
        toast.error("Please enter a GST number.");
        return;
      }
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
        toast.error("Please enter a valid GST number (15 characters, e.g. 07AAAAA1111A1Z1).");
        return;
      }
      if (!creditDays || creditDays.length === 0) {
        toast.error("Please select at least one Credit Days option.");
        return;
      }
    }

    setStep(2);
  };

  useEffect(() => {
    if (!selectedRole) return;
    if (!MANAGER_APPLICABLE_ROLES.has(selectedRole) && manager) {
      setManager("");
    }
  }, [manager, selectedRole]);

  const resolvedManagerOptions =
    Array.isArray(managerOptions) && managerOptions.length > 0
      ? managerOptions
      : FALLBACK_MANAGERS.map((name) => ({ name, role: "", department: "" }));

  const managerRoleFilter =
    selectedRole === "Ops Team"
      ? "Operation Manager"
      : "";

  const visibleManagers = resolvedManagerOptions.filter((entry) => {
    if (!managerRoleFilter) return true;
    return String(entry?.role || "").trim() === managerRoleFilter;
  });

  const showReportingManagerSummary =
    Boolean(selectedRole) && MANAGER_APPLICABLE_ROLES.has(selectedRole);

  const handleContinue2 = () => {
    if (!selectedRole || !department || !designation) {
      toast.error("Please complete role, department, and designation.");
      return;
    }

    setStep(3);
  };

  useEffect(() => {
    if (passwordMode !== "manual" && showManualPassword) {
      setShowManualPassword(false);
    }
  }, [passwordMode, showManualPassword]);

  const handleSubmitUser = async () => {
    const emailError = getEmailValidationError(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    if (!isEditMode && passwordMode === "manual" && manualPassword.trim().length < 8) {
      toast.error("Manual password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName,
        email,
        phone,
        employeeId,
        manager,
        selectedRole,
        department,
        designation,
        permissions,
        passwordMode,
        manualPassword,
        accountStatus,
        accessExpiry,
        sendWelcome,
        gstNumber,
        creditDays: Array.isArray(creditDays) ? creditDays.map(Number) : [Number(creditDays) || 7],
      };

      const response = isEditMode
        ? await onUpdateUser?.({
            id: initialUser?.id,
            ...payload,
          })
        : await onCreateUser?.(payload);

      setCreationMeta({
        credentialsEmailSent: isEditMode ? false : response?.credentialsEmailSent ?? sendWelcome,
        temporaryPassword: response?.temporaryPassword || "",
        message: response?.message || (isEditMode ? "User updated successfully" : ""),
      });
      setDone(true);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || `Unable to ${isEditMode ? "update" : "create"} user right now.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    applyFormState(EMPTY_FORM_STATE);
    setCreationMeta({ credentialsEmailSent: true, temporaryPassword: "", message: "" });
    setStep(1); setDone(false);
  };

  const steps = [
    { num: 1, label: "Personal Info" },
    { num: 2, label: "Role & Access" },
    { num: 3, label: "Account Setup" },
  ];

  const inputStyle = {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
    color: "#0f172a",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
    transition: "all 0.15s ease",
  };

  const iconInputWrap = {
    position: "relative",
    width: "100%",
  };

  const iconStyle = {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
  };

  const inputWithIcon = {
    ...inputStyle,
    paddingLeft: 30,
  };

  const successBadgeText = isEditMode
    ? creationMeta.message || "User updated successfully"
    : creationMeta.credentialsEmailSent
      ? `Login credentials sent to ${email || "user@holidaycircuit.com"}`
      : creationMeta.message || "User created successfully";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={frameVariant}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <motion.div
        variants={overlayVariant}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15,23,42,0.55)",
          backdropFilter: "blur(2px)",
        }}
      />
      <motion.div
        variants={modalVariant}
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(490px, calc(100vw - 32px))",
          maxHeight: "min(510px, calc(100vh - 32px))",
          borderRadius: 16,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 10px 40px rgba(15,23,42,0.15)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #0b1e36 0%, #1d3d63 50%, #107c41 100%)",
            padding: "10px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <UserPlus size={13} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>
                {vendorMode ? (isEditMode ? "Edit Vendor" : "Add New Vendor") : (isEditMode ? "Edit User" : "Add New User")}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>
                {vendorMode ? "Holiday Circuit — DMC Partner Setup" : "Holiday Circuit — Role-Based Access Control"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 24, height: 24, borderRadius: 4, border: "none",
              background: "rgba(255,255,255,0.1)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={12} color="#fff" />
          </button>
        </div>

        {/* ── Step Indicator (hidden on success) ── */}
        {!done && (
          <div
            style={{
              background: "#f8fafc",
              padding: "6px 16px 4px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
              {/* Tracker lines */}
              <div style={{ position: "absolute", left: 9, right: 9, top: "9px", height: 2, background: "#cbd5e1", zIndex: 0, borderRadius: 1 }} />
              <div style={{ position: "absolute", left: 9, width: `${(Math.min(step - 1, 2) / 2) * 97}%`, top: "9px", height: 2, background: "linear-gradient(to right, #0b1e36, #107c41)", zIndex: 0, borderRadius: 1, transition: "all 0.35s ease-in-out" }} />

              {steps.map((s, i) => {
                const isCompleted = step > s.num;
                const isActive = step === s.num;
                return (
                  <div key={s.num} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, zIndex: 1 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 8.5,
                        fontWeight: "bold",
                        transition: "all 0.3s ease",
                        background: isCompleted
                          ? "linear-gradient(135deg, #107c41 0%, #0e4e2c 100%)"
                          : isActive
                            ? "linear-gradient(135deg, #0b1e36 0%, #1d3d63 100%)"
                            : "#fff",
                        color: isActive || isCompleted ? "#fff" : "#94a3b8",
                        border: isActive
                          ? "2px solid #bfdbfe"
                          : isCompleted
                            ? "none"
                            : "1px solid #cbd5e1",
                        boxShadow: isActive ? "0 0 4px rgba(11,30,54,0.15)" : "none",
                      }}
                    >
                      {isCompleted ? (
                        <Check size={8} color="#fff" strokeWidth={3} />
                      ) : (
                        s.num
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 8.5,
                        fontWeight: isActive ? "bold" : 500,
                        color: isCompleted ? "#107c41" : isActive ? "#0b1e36" : "#94a3b8",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          className="hide-scrollbar"
          style={{
            padding: "12px 16px 0",
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >

          {/* SUCCESS SCREEN */}
          {done && (
            <div style={{ textAlign: "center", padding: "32px 16px 16px" }}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={successIconWrapVariant}
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "#dcfce7",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 0 0 0 rgba(34,197,94,0.18)",
                }}
              >
                <motion.div variants={successCheckVariant}>
                  <Check size={28} color="#16a34a" strokeWidth={2.5} />
                </motion.div>
              </motion.div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#0f172a" }}>
                {vendorMode
                  ? (isEditMode ? "Vendor Updated Successfully!" : "Vendor Added Successfully!")
                  : (isEditMode ? "User Updated Successfully!" : "User Added Successfully!")}
              </p>
              <p style={{ margin: "10px 0 0", fontSize: 13, color: "#64748b" }}>
                <strong style={{ color: "#0f172a" }}>{fullName || (vendorMode ? "Vendor" : "User")}</strong> has been {isEditMode ? "updated" : "created"} as{" "}
                <span style={{ color: vendorMode ? "#15803d" : "#7c3aed", fontWeight: 600 }}>{selectedRole || "Super Admin"}.</span>
              </p>
              {successBadgeText ? (
                <div
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "#f0f9ff", border: "1px solid #bae6fd",
                    borderRadius: 100, padding: "6px 16px", marginTop: 14,
                    fontSize: 12, color: "#0369a1",
                  }}
                >
                  <Send size={12} />
                  {successBadgeText}
                </div>
              ) : null}
              {!creationMeta.credentialsEmailSent && creationMeta.temporaryPassword ? (
                <div
                  style={{
                    marginTop: 16,
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    background: "#f8fafc",
                    padding: "14px 16px",
                  }}
                >
                  <p style={{ margin: "0 0 6px", fontSize: 12, color: "#64748b" }}>Temporary Password</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a", letterSpacing: "0.04em" }}>
                    {creationMeta.temporaryPassword}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 1 */}
          {!done && step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CreditCard size={12} color="#64748b" />
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Personal Details</p>
              </div>

              {/* Full Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
                  Full Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Arjun Mehta"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Email + Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                <div style={{ position: "relative" }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
                    Email Address <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={iconInputWrap}>
                    <span style={iconStyle}><Mail size={12} color="#94a3b8" /></span>
                    <input
                      style={emailError ? { ...inputWithIcon, borderColor: "#ef4444", background: "#fef2f2" } : inputWithIcon}
                      placeholder="name@holidaycircuit.com"
                      value={email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmail(val);
                        setEmailError(getEmailValidationError(val));
                      }}
                    />
                  </div>
                  {emailError && (
                    <p style={{ position: "absolute", left: 0, top: "100%", marginTop: 5, margin: 0, fontSize: 9.5, color: "#ef4444", fontWeight: 400, zIndex: 10, lineHeight: 1.1 }}>
                      {emailError}
                    </p>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
                    Phone Number <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={iconInputWrap}>
                    <span style={iconStyle}><Phone size={12} color="#94a3b8" /></span>
                    <input
                      style={phoneError ? { ...inputWithIcon, borderColor: "#ef4444", background: "#fef2f2" } : inputWithIcon}
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPhone(val);
                        setPhoneError(getPhoneValidationError(val));
                      }}
                    />
                  </div>
                  {phoneError && (
                    <p style={{ position: "absolute", left: 0, top: "100%", marginTop: 5, margin: 0, fontSize: 9.5, color: "#ef4444", fontWeight: 400, zIndex: 10, lineHeight: 1.1 }}>
                      {phoneError}
                    </p>
                  )}
                </div>
              </div>

              {/* Employee ID (+ Reporting Manager summary for Ops/Finance roles) / Vendor specific details */}
              {vendorMode ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
                      GST Number <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      style={inputStyle}
                      placeholder="e.g. 07AAAAA1111A1Z1"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>
                      Credit Days <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      {creditDropdownOpen && (
                        <div
                          onClick={() => setCreditDropdownOpen(false)}
                          style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 5,
                            background: "transparent",
                          }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setCreditDropdownOpen((prev) => !prev)}
                        style={{
                          ...inputStyle,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          textAlign: "left",
                          cursor: "pointer",
                          height: 30,
                          padding: "0 10px",
                          position: "relative",
                          zIndex: creditDropdownOpen ? 10 : 1,
                        }}
                      >
                        <span style={{ 
                          color: creditDays && creditDays.length > 0 ? "#0f172a" : "#94a3b8",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "90%"
                        }}>
                          {creditDays && creditDays.length > 0
                            ? creditDays.map((d) => Number(d) === 0 ? "Immediate (0)" : `${d} Days`).join(", ")
                            : "Select Credit Days"}
                        </span>
                        <ChevronRight
                          size={12}
                          color="#94a3b8"
                          style={{
                            transform: `rotate(${creditDropdownOpen ? 270 : 90}deg)`,
                            transition: "transform 0.15s ease",
                          }}
                        />
                      </button>

                      {creditDropdownOpen && (
                        <div
                          className="hide-scrollbar"
                          style={{
                            position: "absolute",
                            bottom: "100%",
                            left: 0,
                            right: 0,
                            marginBottom: 4,
                            background: "#fff",
                            border: "1px solid #cbd5e1",
                            borderRadius: 8,
                            boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                            zIndex: 10,
                            maxHeight: 180,
                            overflowY: "auto",
                            padding: 4,
                          }}
                        >
                          {[
                            { value: 0, label: "Immediate (0 Days)" },
                            { value: 3, label: "3 Days" },
                            { value: 5, label: "5 Days" },
                            { value: 7, label: "7 Days" },
                            { value: 10, label: "10 Days" },
                            { value: 12, label: "12 Days" },
                            { value: 15, label: "15 Days" },
                            { value: 18, label: "18 Days" },
                            { value: 20, label: "20 Days" },
                            { value: 21, label: "21 Days" },
                            { value: 25, label: "25 Days" },
                            { value: 30, label: "30 Days" },
                          ].map((opt) => {
                            const active = Array.isArray(creditDays) && creditDays.includes(opt.value);
                            return (
                              <div
                                key={opt.value}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCreditDays((prev) => {
                                    const arr = Array.isArray(prev) ? prev : [7];
                                    const updated = arr.includes(opt.value)
                                      ? arr.filter((x) => x !== opt.value)
                                      : [...arr, opt.value];
                                    return updated;
                                  });
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "6px 8px",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  background: active ? "#107c410c" : "transparent",
                                  color: active ? "#107c41" : "#334155",
                                  fontSize: 11.5,
                                  fontWeight: active ? 600 : 500,
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  if (!active) e.currentTarget.style.background = "#f1f5f9";
                                }}
                                onMouseLeave={(e) => {
                                  if (!active) e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={active}
                                  onChange={() => {}}
                                  style={{
                                    cursor: "pointer",
                                    accentColor: "#107c41",
                                    margin: 0,
                                    width: 13,
                                    height: 13,
                                  }}
                                />
                                <span>{opt.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: showReportingManagerSummary ? "1fr 1fr" : "1fr",
                    gap: 10,
                  }}
                >
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
                      Employee ID{" "}
                      <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input
                      style={inputStyle}
                      placeholder="e.g. HC-2024-055"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                    />
                  </div>
                  {showReportingManagerSummary ? (
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
                        Reporting Manager{" "}
                        <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>(Ops/Finance only)</span>
                      </label>
                      <div
                        style={{
                          height: 32,
                          borderRadius: 6,
                          border: "1px dashed #cbd5e1",
                          background: "#f8fafc",
                          display: "flex",
                          alignItems: "center",
                          padding: "0 10px",
                          fontSize: 11,
                          color: "#64748b",
                        }}
                      >
                        {manager ? manager : 'Set in "Role & Access" step'}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {!done && step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={12} color="#64748b" />
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Role & Access Configuration</p>
              </div>

              {vendorMode ? (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 9.5, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    LOCKED VENDOR CONFIGURATION
                  </p>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 9.5, color: "#94a3b8" }}>Selected Role</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#15803d" }}>DMC Partner</p>
                    <p style={{ margin: "3px 0 0", fontSize: 9.5, color: "#64748b", lineHeight: 1.3 }}>
                      DMC-specific access — submit invoices, manage inventory & view orders
                    </p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 9.5, color: "#94a3b8" }}>Department</p>
                      <p style={{ margin: 0, fontSize: 11.5, fontWeight: 500, color: "#334155" }}>DMC Relations</p>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 9.5, color: "#94a3b8" }}>Designation</p>
                      <p style={{ margin: 0, fontSize: 11.5, fontWeight: 500, color: "#334155" }}>DMC Partner</p>
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 9.5, color: "#94a3b8" }}>Default Permissions</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {["View", "Edit", "Export", "Submit Invoice"].map((p) => (
                        <span
                          key={p}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 500,
                            background: "#0f172a",
                            color: "#fff",
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Select Role */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
                      Select Role <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                      {ROLES.map((r) => {
                        const isSelected = selectedRole === r.key;
                        return (
                          <div
                            key={r.key}
                            onClick={() => handleRoleSelect(r.key)}
                            style={{
                              border: isSelected ? `1.5px solid ${r.color}` : "1px solid #cbd5e1",
                              borderRadius: 8,
                              padding: "6px 10px",
                              cursor: "pointer",
                              background: isSelected ? `${r.color}08` : "#fff",
                              position: "relative",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {isSelected && (
                              <div
                                style={{
                                  position: "absolute", top: 6, right: 6,
                                  width: 14, height: 14, borderRadius: "50%",
                                  background: r.color,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                              >
                                <Check size={8} color="#fff" strokeWidth={3} />
                              </div>
                            )}
                            <p style={{ margin: "0 0 2px", fontSize: 11.5, fontWeight: 600, color: r.color }}>{r.key}</p>
                            <p style={{ margin: 0, fontSize: 9.5, color: "#64748b", lineHeight: 1.3 }}>{r.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manager Helper Banner */}
                  <div
                    style={{
                      border: "1px solid #bae6fd",
                      background: "#f0f9ff",
                      borderRadius: 8,
                      padding: "6px 10px",
                      marginBottom: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        background: "#fff",
                        border: "1px solid #bae6fd",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Users size={11} color="#0284c7" />
                    </div>
                    <div style={{ lineHeight: 1.2 }}>
                      <p style={{ margin: 0, fontSize: 10.5, fontWeight: 600, color: "#0369a1" }}>
                        Reporting manager applies to Ops and Finance roles only
                      </p>
                    </div>
                  </div>

                  {/* Department + Designation */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 2 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
                        Department <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
                          <Building2 size={12} color="#94a3b8" />
                        </span>
                        <select
                          style={{ ...inputStyle, paddingLeft: 30, appearance: "none" }}
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                        >
                          <option value="">Select Department</option>
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <ChevronRight
                          size={12} color="#94a3b8"
                          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%) rotate(90deg)", pointerEvents: "none" }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
                        Designation / Job Title <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <div style={iconInputWrap}>
                        <span style={iconStyle}><Briefcase size={12} color="#94a3b8" /></span>
                        <input
                          style={inputWithIcon}
                          placeholder="e.g. Operations Executive"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reporting Manager (Ops only) */}
                  {selectedRole && MANAGER_APPLICABLE_ROLES.has(selectedRole) && (
                    <div style={{ marginBottom: 2 }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
                        Reporting Manager{" "}
                        <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>(Ops only)</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <select
                          style={{ ...inputStyle, appearance: "none", paddingRight: 30 }}
                          value={manager}
                          onChange={(e) => setManager(e.target.value)}
                        >
                          <option value="">
                            {managerRoleFilter ? `Select ${managerRoleFilter}` : "Select Manager"}
                          </option>
                          {visibleManagers.length > 0 ? (
                            visibleManagers.map((entry) => {
                              const name = String(entry?.name || "").trim();
                              if (!name) return null;
                              const dept = String(entry?.department || "").trim();
                              const label = dept ? `${name} (${dept})` : name;
                              return (
                                <option key={`${name}-${dept}`} value={name}>
                                  {label}
                                </option>
                              );
                            })
                          ) : (
                            <option value="" disabled>
                              No managers available yet
                            </option>
                          )}
                        </select>
                        <ChevronRight
                          size={12}
                          color="#94a3b8"
                          style={{
                            position: "absolute",
                            right: 10,
                            top: "50%",
                            transform: "translateY(-50%) rotate(90deg)",
                            pointerEvents: "none",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Module Permissions */}
                  {selectedRole && (
                    <div
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: 8,
                        padding: "8px 12px",
                        background: "#f8fafc",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyItems: "space-between", marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>Module Permissions</span>
                          <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>(customisable)</span>
                        </div>
                        <span style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>
                          {permissions.length} selected
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {ALL_PERMISSIONS.map((p) => {
                          const active = permissions.includes(p);
                          return (
                            <button
                              key={p}
                              onClick={() => togglePermission(p)}
                              style={{
                                display: "flex", alignItems: "center", gap: 4,
                                padding: "3px 8px", borderRadius: 6,
                                border: "none", cursor: "pointer", fontSize: 10.5, fontWeight: 500,
                                background: active ? "#0f172a" : "#e2e8f0",
                                color: active ? "#fff" : "#475569",
                                transition: "all 0.1s ease",
                              }}
                            >
                              {active && <Check size={9} strokeWidth={2.5} />}
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {!done && step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={12} color="#64748b" />
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Account & Security Setup</p>
              </div>

              {/* Review Details */}
              <div
                style={{
                  background: "#f8fafc", border: "1px solid #e2e8f0",
                  borderRadius: 8, padding: "8px 10px",
                }}
              >
                <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.04em" }}>
                  REVIEW DETAILS
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 10, color: "#94a3b8" }}>Name</p>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "#0f172a" }}>{fullName || "—"}</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 10, color: "#94a3b8" }}>Email</p>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "#0f172a" }}>{email || "—"}</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 10, color: "#94a3b8" }}>Role</p>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: ROLES.find((r) => r.key === selectedRole)?.color || "#0f172a" }}>
                      {selectedRole || "—"}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 10, color: "#94a3b8" }}>Department</p>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "#0f172a" }}>{department || "—"}</p>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <p style={{ margin: "0 0 2px", fontSize: 10, color: "#94a3b8" }}>Designation</p>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "#0f172a" }}>{designation || "—"}</p>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <p style={{ margin: "0 0 2px", fontSize: 10, color: "#94a3b8" }}>Permissions</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.3 }}>{permissions.join(", ") || "—"}</p>
                  </div>
                  {vendorMode && (
                    <>
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: 10, color: "#94a3b8" }}>GST Number</p>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "#0f172a" }}>{gstNumber || "—"}</p>
                      </div>
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: 10, color: "#94a3b8" }}>Credit Days</p>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "#0f172a" }}>
                          {Array.isArray(creditDays)
                            ? creditDays.map((d) => Number(d) === 0 ? "Immediate" : `${d} Days`).join(", ")
                            : (Number(creditDays) === 0 ? "Immediate" : `${creditDays} Days`)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {!isEditMode && (
                <>
                  {/* Password Setup */}
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Password Setup</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div
                        onClick={() => setPasswordMode("auto")}
                        style={{
                          border: passwordMode === "auto" ? "1.5px solid #0f172a" : "1px solid #cbd5e1",
                          borderRadius: 8, padding: "5px 8px", cursor: "pointer",
                          background: passwordMode === "auto" ? "#f8fafc" : "#fff",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <div
                            style={{
                              width: 12, height: 12, borderRadius: "50%",
                              border: `1.5px solid ${passwordMode === "auto" ? "#0f172a" : "#cbd5e1"}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            {passwordMode === "auto" && (
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0f172a" }} />
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>Auto-Generate</p>
                        </div>
                        <p style={{ margin: 0, fontSize: 10, color: "#64748b", paddingLeft: 18 }}>System creates password</p>
                      </div>
                      <div
                        onClick={() => setPasswordMode("manual")}
                        style={{
                          border: passwordMode === "manual" ? "1.5px solid #0f172a" : "1px solid #cbd5e1",
                          borderRadius: 8, padding: "5px 8px", cursor: "pointer",
                          background: passwordMode === "manual" ? "#f8fafc" : "#fff",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <div
                            style={{
                              width: 12, height: 12, borderRadius: "50%",
                              border: `1.5px solid ${passwordMode === "manual" ? "#0f172a" : "#cbd5e1"}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            {passwordMode === "manual" && (
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0f172a" }} />
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>Set Manually</p>
                        </div>
                        <p style={{ margin: 0, fontSize: 10, color: "#64748b", paddingLeft: 18 }}>Define initial password</p>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {passwordMode === "manual" ? (
                      <motion.div
                        key="manual-password"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ paddingTop: 2 }}>
                          <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
                            Initial Password <span style={{ color: "#ef4444" }}>*</span>
                          </label>
                          <div style={{ position: "relative" }}>
                            <input
                              type={showManualPassword ? "text" : "password"}
                              style={{ ...inputStyle, paddingRight: 36 }}
                              placeholder="Enter password"
                              value={manualPassword}
                              onChange={(e) => setManualPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowManualPassword((prev) => !prev)}
                              aria-label={showManualPassword ? "Hide password" : "Show password"}
                              style={{
                                position: "absolute",
                                right: 6,
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: 24,
                                height: 24,
                                borderRadius: 4,
                                border: "1px solid #cbd5e1",
                                background: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#64748b",
                              }}
                            >
                              {showManualPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </>
              )}

              {/* Account Status + Expiry */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 500, color: "#475569" }}>Account Status</p>
                  <div
                    style={{
                      display: "flex", background: "#e2e8f0",
                      borderRadius: 100, padding: 2, width: "fit-content",
                    }}
                  >
                    {["Active", "Inactive"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setAccountStatus(s)}
                        style={{
                          padding: "3px 12px", borderRadius: 100, border: "none",
                          cursor: "pointer", fontSize: 11.5, fontWeight: 500,
                          background: accountStatus === s
                            ? s === "Active" ? "#16a34a" : "#64748b"
                            : "transparent",
                          color: accountStatus === s ? "#fff" : "#475569",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
                    Access Expiry{" "}
                    <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={accessExpiry}
                    onChange={(e) => setAccessExpiry(e.target.value)}
                  />
                </div>
              </div>

              {!isEditMode && (
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "#f0f9ff", border: "1px solid #bae6fd",
                    borderRadius: 8, padding: "5px 10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Send size={13} color="#0284c7" />
                    <div>
                      <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: "#0369a1" }}>Send Welcome Email</p>
                      <p style={{ margin: 0, fontSize: 10, color: "#0284c7" }}>Notify user with login credentials</p>
                    </div>
                  </div>
                  {/* Toggle */}
                  <div
                    onClick={() => setSendWelcome((v) => !v)}
                    style={{
                      width: 32, height: 18, borderRadius: 100,
                      background: sendWelcome ? "#0284c7" : "#cbd5e1",
                      position: "relative", cursor: "pointer", flexShrink: 0,
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute", top: 2,
                        left: sendWelcome ? 16 : 2,
                        width: 14, height: 14, borderRadius: "50%", background: "#fff",
                        transition: "left 0.2s",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "8px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: "1px solid #f1f5f9", marginTop: 4,
          }}
        >
          {done ? (
            <>
              <div />
              <div style={{ display: "flex", gap: 8 }}>
                {!isEditMode && (
                  <button
                    onClick={handleAddAnother}
                    style={{
                      padding: "6px 14px", borderRadius: 8,
                      border: "1px solid #e2e8f0", background: "#fff",
                      fontSize: 12, fontWeight: 500, color: "#374151", cursor: "pointer",
                    }}
                  >
                    {vendorMode ? "Add Another Vendor" : "Add Another User"}
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{
                    padding: "6px 18px", borderRadius: 8, border: "none",
                    background: "linear-gradient(to right, #0b1e36, #1d3d63)",
                    boxShadow: "0 4px 12px rgba(11,30,54,0.15)",
                    fontSize: 12, fontWeight: 600,
                    color: "#fff", cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 11.5, color: "#94a3b8" }}>Step {step} of 3</p>
              <div style={{ display: "flex", gap: 8 }}>
                {step > 1 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "6px 14px", borderRadius: 8,
                      border: "1px solid #e2e8f0", background: "#fff",
                      fontSize: 12, fontWeight: 500, color: "#374151", cursor: "pointer",
                    }}
                  >
                    <ChevronLeft size={13} /> Back
                  </button>
                )}
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  style={{
                    padding: "6px 14px", borderRadius: 8,
                    border: "1px solid #e2e8f0", background: "#fff",
                    fontSize: 12, fontWeight: 500, color: "#374151", cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={step === 1 ? handleContinue1 : step === 2 ? handleContinue2 : handleSubmitUser}
                  disabled={isSubmitting}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "6px 18px", borderRadius: 8, border: "none",
                    background: step === 3
                      ? "linear-gradient(to right, #107c41, #15803d)"
                      : "linear-gradient(to right, #0b1e36, #1d3d63)",
                    boxShadow: step === 3
                      ? "0 4px 12px rgba(16,124,65,0.2)"
                      : "0 4px 12px rgba(11,30,54,0.2)",
                    fontSize: 12, fontWeight: 600, color: "#fff", cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.7 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  {step === 3 ? (
                    <><UserPlus size={13} /> {isSubmitting ? (isEditMode ? "Saving..." : (vendorMode ? "Creating Vendor..." : "Creating...")) : (isEditMode ? "Save Changes" : (vendorMode ? "Create Vendor" : "Create User"))}</>
                  ) : (
                    <>
                      Continue
                      <motion.span initial="initial" animate="animate" variants={arrowVariant} style={{ display: "inline-flex" }}>
                        <ChevronRight size={13} />
                      </motion.span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}



