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
  "DMC Partner": ["View", "Export", "Submit Invoice"],
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
});

export default function AddNewUserModal({
  onClose,
  onCreateUser,
  onUpdateUser,
  mode = "create",
  initialUser = null,
  managerOptions = null,
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
    setSelectedRole(nextState.selectedRole);
    setDepartment(nextState.department);
    setDesignation(nextState.designation);
    setPermissions(nextState.permissions);
    setPasswordMode(nextState.passwordMode);
    setManualPassword(nextState.manualPassword);
    setAccountStatus(nextState.accountStatus);
    setAccessExpiry(nextState.accessExpiry);
    setSendWelcome(nextState.sendWelcome);
  };

  useEffect(() => {
    const nextState = isEditMode ? getFormStateFromUser(initialUser) : EMPTY_FORM_STATE;
    applyFormState(nextState);
    setStep(1);
    setDone(false);
    setShowManualPassword(false);
    setCreationMeta({
      credentialsEmailSent: !isEditMode,
      temporaryPassword: "",
      message: "",
    });
  }, [isEditMode, initialUser]);

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
    if (!fullName || !email || !phone) {
      toast.error("Please complete name, email, and phone.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
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
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: "#0f172a",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
  };

  const iconInputWrap = {
    position: "relative",
    width: "100%",
  };

  const iconStyle = {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  };

  const inputWithIcon = {
    ...inputStyle,
    paddingLeft: 36,
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
          width: "min(740px, calc(100vw - 48px))",
          maxHeight: "calc(100vh - 48px)",
          borderRadius: 16,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            background: "#0f172a",
            padding: "20px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <UserPlus size={18} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#fff" }}>{isEditMode ? "Edit User" : "Add New User"}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Holiday Circuit — Role-Based Access Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none",
              background: "rgba(255,255,255,0.1)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={16} color="#fff" />
          </button>
        </div>

        {/* ── Step Indicator (hidden on success) ── */}
        {!done && (
          <div
            style={{
              background: "#f8fafc",
              padding: "14px 24px",
              display: "flex", alignItems: "center", gap: 6,
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            {steps.map((s, i) => {
              const isCompleted = step > s.num;
              const isActive = step === s.num;
              return (
                <div key={s.num} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "6px 14px",
                      borderRadius: 100,
                      background: isActive ? "#0f172a" : isCompleted ? "#f0fdf4" : "transparent",
                      border: isActive ? "none" : isCompleted ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                    }}
                  >
                    {isCompleted ? (
                      <Check size={12} color="#16a34a" strokeWidth={2.5} />
                    ) : (
                      <span
                        style={{
                          fontSize: 11, fontWeight: 600,
                          color: isActive ? "#fff" : "#94a3b8",
                        }}
                      >
                        {s.num}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 13, fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#fff" : isCompleted ? "#15803d" : "#94a3b8",
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <ChevronRight size={14} color="#cbd5e1" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Body ── */}
        <div
          className="custom-scroll"
          style={{
            padding: "24px 24px 0",
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
                {isEditMode ? "User Updated Successfully!" : "User Added Successfully!"}
              </p>
              <p style={{ margin: "10px 0 0", fontSize: 13, color: "#64748b" }}>
                <strong style={{ color: "#0f172a" }}>{fullName || "User"}</strong> has been {isEditMode ? "updated" : "created"} as{" "}
                <span style={{ color: "#7c3aed", fontWeight: 600 }}>{selectedRole || "Super Admin"}.</span>
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
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CreditCard size={14} color="#64748b" />
                </div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Personal Details</p>
              </div>

              {/* Full Name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
                    Email Address <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={iconInputWrap}>
                    <span style={iconStyle}><Mail size={14} color="#94a3b8" /></span>
                    <input
                      style={inputWithIcon}
                      placeholder="name@holidaycircuit.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
                    Phone Number <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={iconInputWrap}>
                    <span style={iconStyle}><Phone size={14} color="#94a3b8" /></span>
                    <input
                      style={inputWithIcon}
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Employee ID (+ Reporting Manager summary for Ops/Finance roles) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: showReportingManagerSummary ? "1fr 1fr" : "1fr",
                  gap: 14,
                  marginBottom: 8,
                }}
              >
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
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
                    <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
                      Reporting Manager{" "}
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>(Ops/Finance only)</span>
                    </label>
                    <div
                      style={{
                        height: 40,
                        borderRadius: 10,
                        border: "1px dashed #e2e8f0",
                        background: "#f8fafc",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 12px",
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      {manager ? manager : 'Set in "Role & Access" step'}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {!done && step === 2 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={14} color="#64748b" />
                </div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Role & Access Configuration</p>
              </div>

              {/* Select Role */}
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 10 }}>
                Select Role <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {ROLES.map((r) => {
                  const isSelected = selectedRole === r.key;
                  return (
                    <div
                      key={r.key}
                      onClick={() => handleRoleSelect(r.key)}
                      style={{
                        border: isSelected ? `2px solid ${r.color}` : "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "14px 16px",
                        cursor: "pointer",
                        background: isSelected ? `${r.color}08` : "#fff",
                        position: "relative",
                        transition: "border 0.15s",
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute", top: 10, right: 10,
                            width: 18, height: 18, borderRadius: "50%",
                            background: r.color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <Check size={10} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                      <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: r.color }}>{r.key}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{r.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: "10px 12px",
                  marginBottom: 18,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 10,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Users size={14} color="#64748b" />
                </div>
                <div style={{ lineHeight: 1.35 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
                    Reporting manager applies to Ops and Finance roles only
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                    DMC Partner accounts do not use manager onboarding in this workflow.
                  </p>
                </div>
              </div>

              {/* Department + Designation */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
                    Department <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                      <Building2 size={14} color="#94a3b8" />
                    </span>
                    <select
                      style={{ ...inputStyle, paddingLeft: 36, appearance: "none" }}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <ChevronRight
                      size={14} color="#94a3b8"
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%) rotate(90deg)", pointerEvents: "none" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
                    Designation / Job Title <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={iconInputWrap}>
                    <span style={iconStyle}><Briefcase size={14} color="#94a3b8" /></span>
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
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
                    Reporting Manager{" "}
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>(Ops only)</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <select
                      style={{ ...inputStyle, appearance: "none", paddingRight: 36 }}
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
                      size={14}
                      color="#94a3b8"
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%) rotate(90deg)",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
                    Manager list is filtered by role to keep reporting lines clean.
                  </p>
                </div>
              )}

              {/* Module Permissions */}
              {selectedRole && (
                <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "16px",
                  marginBottom: 8,
                }}
              >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Module Permissions</span>
                      <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 6 }}>(auto-populated · customisable)</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                      {permissions.length} selected
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {ALL_PERMISSIONS.map((p) => {
                          const active = permissions.includes(p);
                          return (
                            <button
                              key={p}
                              onClick={() => togglePermission(p)}
                              style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "6px 14px", borderRadius: 8,
                                border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500,
                                background: active ? "#0f172a" : "#f1f5f9",
                                color: active ? "#fff" : "#475569",
                                transition: "all 0.15s",
                              }}
                            >
                              {active && <Check size={11} strokeWidth={2.5} />}
                              {p}
                            </button>
                          );
                        })}
                  </div>
                  <p style={{ margin: "12px 0 0", fontSize: 11, color: "#94a3b8" }}>
                        Click a permission to toggle it on or off.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {!done && step === 3 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={14} color="#64748b" />
                </div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Account & Security Setup</p>
              </div>

              {/* Review Details */}
              <div
                style={{
                  background: "#f8fafc", border: "1px solid #f1f5f9",
                  borderRadius: 12, padding: "16px", marginBottom: 20,
                }}
              >
                <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em" }}>
                  REVIEW DETAILS
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 11, color: "#94a3b8" }}>Name</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{fullName || "—"}</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 11, color: "#94a3b8" }}>Email</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{email || "—"}</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 11, color: "#94a3b8" }}>Role</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: ROLES.find((r) => r.key === selectedRole)?.color || "#0f172a" }}>
                      {selectedRole || "—"}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 11, color: "#94a3b8" }}>Department</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{department || "—"}</p>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <p style={{ margin: "0 0 2px", fontSize: 11, color: "#94a3b8" }}>Designation</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{designation || "—"}</p>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "#94a3b8" }}>Permissions</p>
                    <p style={{ margin: 0, fontSize: 13, color: "#0f172a" }}>{permissions.join(", ") || "—"}</p>
                  </div>
                </div>
              </div>

              {!isEditMode && (
                <>
                  {/* Password Setup */}
                  <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Password Setup</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    <div
                      onClick={() => setPasswordMode("auto")}
                      style={{
                        border: passwordMode === "auto" ? "2px solid #0f172a" : "1px solid #e2e8f0",
                        borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                        background: passwordMode === "auto" ? "#f8fafc" : "#fff",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div
                          style={{
                            width: 16, height: 16, borderRadius: "50%",
                            border: `2px solid ${passwordMode === "auto" ? "#0f172a" : "#cbd5e1"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          {passwordMode === "auto" && (
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0f172a" }} />
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Auto-Generate</p>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b", paddingLeft: 24 }}>System creates a secure password</p>
                    </div>
                    <div
                      onClick={() => setPasswordMode("manual")}
                      style={{
                        border: passwordMode === "manual" ? "2px solid #0f172a" : "1px solid #e2e8f0",
                        borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                        background: passwordMode === "manual" ? "#f8fafc" : "#fff",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div
                          style={{
                            width: 16, height: 16, borderRadius: "50%",
                            border: `2px solid ${passwordMode === "manual" ? "#0f172a" : "#cbd5e1"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          {passwordMode === "manual" && (
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0f172a" }} />
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Set Manually</p>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b", paddingLeft: 24 }}>You define the initial password</p>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {passwordMode === "manual" ? (
                      <motion.div
                        key="manual-password"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        style={{ overflow: "hidden", marginBottom: 16 }}
                      >
                        <div style={{ paddingTop: 2 }}>
                          <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
                            Initial Password <span style={{ color: "#ef4444" }}>*</span>
                          </label>
                          <div style={{ position: "relative" }}>
                            <input
                              type={showManualPassword ? "text" : "password"}
                              style={{ ...inputStyle, paddingRight: 44 }}
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
                                right: 10,
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: 30,
                                height: 30,
                                borderRadius: 10,
                                border: "1px solid #e2e8f0",
                                background: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#64748b",
                              }}
                            >
                              {showManualPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </>
              )}

              {/* Account Status + Expiry */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 500, color: "#374151" }}>Account Status</p>
                  <div
                    style={{
                      display: "flex", background: "#f1f5f9",
                      borderRadius: 100, padding: 3, width: "fit-content",
                    }}
                  >
                    {["Active", "Inactive"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setAccountStatus(s)}
                        style={{
                          padding: "7px 22px", borderRadius: 100, border: "none",
                          cursor: "pointer", fontSize: 13, fontWeight: 500,
                          background: accountStatus === s
                            ? s === "Active" ? "#16a34a" : "#64748b"
                            : "transparent",
                          color: accountStatus === s ? "#fff" : "#64748b",
                          transition: "all 0.15s",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
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
                    borderRadius: 12, padding: "14px 16px", marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Send size={15} color="#0284c7" />
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0369a1" }}>Send Welcome Email</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#0284c7" }}>Notify user with login credentials & instructions</p>
                    </div>
                  </div>
                  {/* Toggle */}
                  <div
                    onClick={() => setSendWelcome((v) => !v)}
                    style={{
                      width: 44, height: 24, borderRadius: 100,
                      background: sendWelcome ? "#0284c7" : "#cbd5e1",
                      position: "relative", cursor: "pointer", flexShrink: 0,
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute", top: 3,
                        left: sendWelcome ? 23 : 3,
                        width: 18, height: 18, borderRadius: "50%", background: "#fff",
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
            padding: "16px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: "1px solid #f1f5f9", marginTop: 16,
          }}
        >
          {done ? (
            <>
              <div />
              <div style={{ display: "flex", gap: 10 }}>
                {!isEditMode && (
                  <button
                    onClick={handleAddAnother}
                    style={{
                      padding: "9px 20px", borderRadius: 10,
                      border: "1px solid #e2e8f0", background: "#fff",
                      fontSize: 13, fontWeight: 500, color: "#374151", cursor: "pointer",
                    }}
                  >
                    Add Another User
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{
                    padding: "9px 24px", borderRadius: 10, border: "none",
                    background: "#0f172a", fontSize: 13, fontWeight: 600,
                    color: "#fff", cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Step {step} of 3</p>
              <div style={{ display: "flex", gap: 10 }}>
                {step > 1 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "9px 18px", borderRadius: 10,
                      border: "1px solid #e2e8f0", background: "#fff",
                      fontSize: 13, fontWeight: 500, color: "#374151", cursor: "pointer",
                    }}
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                )}
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  style={{
                    padding: "9px 18px", borderRadius: 10,
                    border: "1px solid #e2e8f0", background: "#fff",
                    fontSize: 13, fontWeight: 500, color: "#374151", cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={step === 1 ? handleContinue1 : step === 2 ? handleContinue2 : handleSubmitUser}
                  disabled={isSubmitting}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "9px 22px", borderRadius: 10, border: "none",
                    background: step === 3 ? "#16a34a" : "#0f172a",
                    fontSize: 13, fontWeight: 600, color: "#fff", cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {step === 3 ? (
                    <><UserPlus size={14} /> {isSubmitting ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create User")}</>
                  ) : (
                    <>
                      Continue
                      <motion.span initial="initial" animate="animate" variants={arrowVariant} style={{ display: "inline-flex" }}>
                        <ChevronRight size={14} />
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



