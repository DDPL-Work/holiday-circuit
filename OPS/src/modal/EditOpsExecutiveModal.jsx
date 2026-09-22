import { useState } from "react";
import {
  Check,
  CreditCard,
  Mail,
  Phone,
  Shield,
  UserCheck,
  X,
} from "lucide-react";

const AVAILABLE_PERMISSIONS = [
  { id: "View", label: "View Access", desc: "View assigned queries, dashboard & bookings" },
  { id: "Edit", label: "Edit Access", desc: "Edit assigned quotations & service items" },
  { id: "Export", label: "Export Data", desc: "Export report sheets and transaction logs" },
  { id: "Manage Booking", label: "Manage Booking", desc: "Process vouchers & booking acceptances" },
  { id: "Create Query", label: "Create Query", desc: "Allows executive to create new client queries", isSpecial: true },
];

export default function EditOpsExecutiveModal({ executive, loading, onClose, onUpdate }) {
  const [form, setForm] = useState({
    fullName: executive?.name || "",
    email: executive?.email || "",
    phone: executive?.phone || "",
    employeeId: executive?.employeeId || "",
    designation: executive?.designation || "Operations Executive",
    permissions: Array.isArray(executive?.permissions) ? executive.permissions : ["View", "Edit", "Export", "Manage Booking"],
    accountStatus: executive?.accountStatus || "Active",
  });
  const [error, setError] = useState("");

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.designation.trim()) {
      setError("Full name, email, phone number, and designation are required.");
      return;
    }

    try {
      setError("");
      await onUpdate(executive.id || executive._id, {
        name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        employeeId: form.employeeId.trim(),
        designation: form.designation.trim(),
        permissions: form.permissions,
        accountStatus: form.accountStatus,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update ops executive.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-[1000px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.28)]">
        {/* Modal Header */}
        <div className="flex items-start justify-between bg-[#233047] px-5 py-4 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/12">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Edit Ops Executive</p>
              <p className="mt-0.5 text-[11px] text-white/65">
                Update profile &amp; permission settings for {executive?.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="custom-scroll max-h-[calc(100vh-160px)] overflow-y-auto overflow-x-hidden p-5 space-y-4">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
              {error}
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="e.g. Karan Sharma"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="name@holidaycircuit.com"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Employee ID <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.employeeId}
                  onChange={(event) => updateField("employeeId", event.target.value)}
                  placeholder="e.g. HC-OPS-2026-012"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Account Status
              </label>
              <select
                value={form.accountStatus}
                onChange={(event) => updateField("accountStatus", event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Designation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.designation}
              onChange={(event) => updateField("designation", event.target.value)}
              placeholder="e.g. Operations Executive"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Permissions & Query Access Configuration - Horizontal 3 Columns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-slate-600" />
                <p className="text-xs font-semibold text-slate-700">Permissions &amp; Access</p>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {form.permissions.length} active
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isChecked = form.permissions.includes(perm.id);
                return (
                  <button
                    key={perm.id}
                    type="button"
                    onClick={() => {
                      const next = isChecked
                        ? form.permissions.filter((p) => p !== perm.id)
                        : [...form.permissions, perm.id];
                      updateField("permissions", next);
                    }}
                    className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition cursor-pointer ${
                      isChecked
                        ? perm.isSpecial
                          ? "border-blue-400 bg-blue-50/90 shadow-xs ring-1 ring-blue-300/60"
                          : "border-blue-200 bg-blue-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 opacity-60"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded border transition shrink-0 ${
                        isChecked
                          ? "border-[#3E63DD] bg-[#3E63DD] text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 leading-tight">
                          {perm.label}
                        </span>
                        {perm.isSpecial && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[8.5px] font-extrabold text-[#3E63DD] uppercase tracking-wider">
                            Tab
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10.5px] text-slate-500 leading-snug">
                        {perm.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-[#3E63DD] hover:bg-[#3353c7] px-4 py-1.5 text-xs font-bold text-white transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
