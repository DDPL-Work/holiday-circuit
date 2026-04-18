import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Info,
  Lock,
  Mail,
  Phone,
  Send,
  Shield,
  UserPlus,
  X,
} from "lucide-react";

const FINANCE_EXEC_PERMISSIONS = ["View", "Edit", "Export", "Manage Verifications"];
const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  employeeId: "",
  designation: "",
  passwordMode: "auto",
  manualPassword: "",
  accountStatus: "Active",
  accessExpiry: "",
  sendWelcome: true,
};

function StepPill({ stepNumber, label, active, complete }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : complete
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-white text-slate-400"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
          active
            ? "bg-white/20 text-white"
            : complete
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-400"
        }`}
      >
        {complete ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : stepNumber}
      </span>
      {label}
    </div>
  );
}

function FooterButton({ children, variant = "secondary", ...props }) {
  const classes =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-300"
      : variant === "success"
        ? "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300"
        : "border border-slate-200 text-slate-500 hover:bg-slate-50";

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${classes}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function AddFinanceExecutiveModal({ loading, managerName, onClose, onAdd }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [successMeta, setSuccessMeta] = useState({
    credentialsEmailSent: true,
    temporaryPassword: "",
    message: "",
  });

  const steps = ["Personal Info", "Role & Access", "Account Setup"];
  const canContinuePersonal = form.fullName.trim() && form.email.trim() && form.phone.trim();
  const canContinueRole = form.designation.trim();
  const canCreate = !loading && (form.passwordMode === "auto" || form.manualPassword.trim().length >= 8);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const reset = () => {
    setStep(1);
    setForm(INITIAL_FORM);
    setError("");
    setSuccessMeta({ credentialsEmailSent: true, temporaryPassword: "", message: "" });
  };

  const handleCreate = async () => {
    if (form.passwordMode === "manual" && form.manualPassword.trim().length < 8) {
      setError("Manual password must be at least 8 characters.");
      return;
    }

    try {
      setError("");
      const data = await onAdd({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        employeeId: form.employeeId.trim(),
        department: "Finance",
        designation: form.designation.trim(),
        permissions: FINANCE_EXEC_PERMISSIONS,
        passwordMode: form.passwordMode,
        manualPassword: form.manualPassword,
        accountStatus: form.accountStatus,
        accessExpiry: form.accessExpiry,
        sendWelcome: form.sendWelcome,
      });

      setSuccessMeta({
        credentialsEmailSent: data?.credentialsEmailSent ?? form.sendWelcome,
        temporaryPassword: data?.temporaryPassword || "",
        message: data?.message || "Finance executive added successfully",
      });
      setStep(4);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add finance executive.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.28)]"
      >
        <div className="flex items-start justify-between bg-[#233047] px-5 py-4 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/12">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Add New Finance Executive</p>
              <p className="mt-0.5 text-[11px] text-white/65">
                Auto-linked to {managerName} (Reporting Manager)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step < 4 && (
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            {steps.map((label, index) => (
              <StepPill
                key={label}
                stepNumber={index + 1}
                label={label}
                active={step === index + 1}
                complete={step > index + 1}
              />
            ))}
          </div>
        )}

        <div className="custom-scroll max-h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden">
          {step < 4 && error ? (
            <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
              {error}
            </div>
          ) : null}

          {step === 1 && (
            <>
              <div className="space-y-4 p-5">
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-700">
                  <Info className="h-3.5 w-3.5" />
                  Reporting Manager will be automatically set to {managerName}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    placeholder="e.g. Karan Sharma"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Email Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        placeholder="name@holidaycircuit.com"
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Phone Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(event) => updateField("phone", event.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Employee ID <span className="font-normal text-slate-400">(optional)</span></label>
                  <div className="relative">
                    <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.employeeId}
                      onChange={(event) => updateField("employeeId", event.target.value)}
                      placeholder="e.g. HC-FIN-2026-012"
                      className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                <FooterButton onClick={onClose}><X className="h-3.5 w-3.5" />Cancel</FooterButton>
                <FooterButton variant="primary" onClick={() => canContinuePersonal ? setStep(2) : setError("Full name, email, and phone number are required to continue.")} disabled={!canContinuePersonal}>
                  Continue
                  <ChevronRight className="h-3.5 w-3.5" />
                </FooterButton>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-4 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Shield className="h-4 w-4" />
                  Role &amp; Access Configuration
                </div>

                <div className="relative rounded-xl border-2 border-blue-500 bg-blue-50 px-4 py-3">
                  <p className="text-sm font-semibold text-blue-700">Finance Executive</p>
                  <p className="mt-1 text-xs text-slate-500">Finance operations - handle verifications, settlements, and escalations under Finance Manager supervision.</p>
                  <span className="absolute right-4 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Department</label>
                    <input type="text" readOnly value="Finance" className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Designation <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.designation}
                      onChange={(event) => updateField("designation", event.target.value)}
                      placeholder="e.g. Finance Executive"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-slate-600">Permissions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {FINANCE_EXEC_PERMISSIONS.map((permission) => (
                      <div key={permission} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                        <Check className="h-3.5 w-3.5 text-slate-400" />
                        {permission}
                      </div>
                    ))}
                  </div>
                </div>

                {!canContinueRole ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">
                    Please fill in the designation to continue.
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                <FooterButton onClick={() => setStep(1)}><ChevronLeft className="h-3.5 w-3.5" />Back</FooterButton>
                <FooterButton variant="primary" onClick={() => canContinueRole ? setStep(3) : setError("Please fill in the designation to continue.")} disabled={!canContinueRole}>
                  Continue
                  <ChevronRight className="h-3.5 w-3.5" />
                </FooterButton>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-4 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Lock className="h-4 w-4" />
                  Account Setup
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-slate-600">Password Mode</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "auto", label: "Auto-Generate", desc: "System creates a secure password" },
                      { key: "manual", label: "Set Manually", desc: "Enter a custom password" },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => updateField("passwordMode", option.key)}
                        className={`rounded-xl border px-4 py-3 text-left transition ${
                          form.passwordMode === option.key ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-800">{option.label}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {form.passwordMode === "manual" ? (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Manual Password <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      value={form.manualPassword}
                      onChange={(event) => updateField("manualPassword", event.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Account Status</label>
                    <select
                      value={form.accountStatus}
                      onChange={(event) => updateField("accountStatus", event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Access Expiry <span className="font-normal text-slate-400">(optional)</span></label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={form.accessExpiry}
                        onChange={(event) => updateField("accessExpiry", event.target.value)}
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => updateField("sendWelcome", !form.sendWelcome)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    form.sendWelcome ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <span className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded border ${form.sendWelcome ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white text-transparent"}`}>
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-slate-800">Send Welcome Email</span>
                    <span className="mt-0.5 block text-xs text-slate-500">Notify the executive with login credentials</span>
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                <FooterButton onClick={() => setStep(2)} disabled={loading}><ChevronLeft className="h-3.5 w-3.5" />Back</FooterButton>
                <FooterButton variant="success" onClick={handleCreate} disabled={!canCreate}>
                  <Check className="h-3.5 w-3.5" />
                  {loading ? "Creating..." : "Create Executive"}
                </FooterButton>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-4 px-6 py-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-7 w-7" strokeWidth={3} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-slate-800">Executive Added Successfully!</h3>
                  <p className="text-sm text-slate-500">
                    <span className="font-medium text-slate-700">{form.fullName || "Executive"}</span> has been created as <span className="font-medium text-blue-600">Finance Executive</span> and linked to your team.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700">
                    <Info className="h-3.5 w-3.5" />
                    Reporting Manager auto-set to: {managerName}
                  </span>
                  {successMeta.credentialsEmailSent ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700">
                      <Send className="h-3.5 w-3.5" />
                      Welcome email sent to {form.email}
                    </span>
                  ) : null}
                </div>
                {!successMeta.credentialsEmailSent && successMeta.temporaryPassword ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Temporary Password</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{successMeta.temporaryPassword}</p>
                  </div>
                ) : null}
                {successMeta.message ? <p className="text-xs text-slate-400">{successMeta.message}</p> : null}
              </div>

              <div className="flex items-center justify-center gap-3 border-t border-slate-100 px-6 py-4">
                <FooterButton variant="primary" onClick={onClose}>Done</FooterButton>
                <FooterButton onClick={reset}>Add Another</FooterButton>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
