import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Mail,
  Phone,
  User2,
  Building2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { updateUserProfileLocal } from "../redux/slices/authSlice";
import API from "../utils/Api";

const roleLabels = {
  agent: "Travel Agent",
  admin: "System Admin",
  operations: "Operations Team",
  dmc_partner: "DMC Partner",
  finance_partner: "Finance Partner",
  operation_manager: "Operation Manager",
  finance_manager: "Finance Manager",
};

const buildInitials = (value = "") =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "HC";

export default function ProfileSettingsModal({ open, onClose, user }) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    profileImage: "",
    coverImage: "",
    brandingLogo: "",
    voucherFooterImage: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm({
      name: user?.name || "",
      companyName: user?.companyName || "",
      email: user?.email || "",
      phone: user?.phone ? String(user.phone) : "",
      profileImage: user?.profileImage || "",
      coverImage: user?.coverImage || "",
      brandingLogo: user?.brandingLogo || user?.brandLogoUrl || "",
      voucherFooterImage: user?.voucherFooterImage || user?.footerBanner || user?.pdfFooterImage || "",
    });
  }, [open, user]);

  const roleLabel = roleLabels[user?.role] || "Workspace User";
  const identityLabel = useMemo(
    () => form.name || form.companyName || user?.name || user?.companyName || "Holiday Circuit",
    [form.companyName, form.name, user],
  );
  const secondaryIdentity = useMemo(
    () => form.companyName || user?.companyName || form.name || "Holiday Circuit",
    [form.companyName, form.name, user],
  );

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        profileImage: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({
      ...prev,
      profileImage: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCoverImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        coverImage: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleBrandingLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        brandingLogo: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBrandingLogo = () => {
    setForm((prev) => ({
      ...prev,
      brandingLogo: "",
    }));
  };

  const handleFooterImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        voucherFooterImage: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFooterImage = () => {
    setForm((prev) => ({
      ...prev,
      voucherFooterImage: "",
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const payload = {
        name: form.name.trim(),
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        profileImage: form.profileImage,
        coverImage: form.coverImage,
        brandingLogo: form.brandingLogo,
        brandingName: form.companyName.trim(),
        voucherFooterImage: form.voucherFooterImage,
      };

      const { data } = await API.patch("/auth/profile", payload);
      dispatch(updateUserProfileLocal(data?.user || payload));
      toast.success("Profile updated successfully");
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const coverStyle = {
    background:
      "linear-gradient(135deg, #1e1b4b 0%, #31108f 40%, #4f46e5 70%, #ec4899 100%)",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_22px_64px_rgba(15,23,42,0.22)]"
          >
            <div className="overflow-y-auto hide-scrollbar flex-1">
              {/* Cover + Profile Header */}
              <div className="relative">
                {/* Cover Image Banner */}
                <div className="relative h-24 sm:h-30 w-full overflow-hidden" style={coverStyle}>
                  {form.coverImage || form.profileImage ? (
                    <img
                      src={form.coverImage || form.profileImage}
                      alt="Profile cover"
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-90"
                    />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(12,18,36,0.45)_0%,rgba(15,23,42,0.12)_42%,rgba(120,53,15,0.22)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />

                  {/* Edit Cover Button */}
                  <label className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-white/40 bg-slate-900/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-slate-900/75 cursor-pointer active:scale-95 shadow-md">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Edit Cover</span>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverImageChange}
                    />
                  </label>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSaving}
                    className="absolute right-3 top-3 z-20 rounded-full border border-white/40 bg-slate-900/50 p-2 text-white backdrop-blur-md transition hover:bg-slate-900/75 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Profile Row: Avatar left, Info right, Remove Photo far right */}
                <div className="relative z-10 -mt-9 sm:-mt-10 flex items-end justify-between gap-4 px-6 sm:px-8">
                  <div className="flex items-end gap-4 min-w-0">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {form.profileImage ? (
                        <img
                          src={form.profileImage}
                          alt="Profile"
                          className="h-18 w-18 sm:h-20 sm:w-20 rounded-full border-4 border-white object-cover shadow-xl bg-white"
                        />
                      ) : (
                        <div className="flex h-18 w-18 sm:h-20 sm:w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-slate-900 via-slate-800 to-amber-700 text-xl font-bold text-white shadow-xl ring-4 ring-indigo-500/10">
                          {buildInitials(identityLabel)}
                        </div>
                      )}

                      <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg transition active:scale-95">
                        <Camera className="h-3 w-3" />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>

                    {/* Name + Role */}
                    <div className="min-w-0 pb-1.5">
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight truncate">
                        {identityLabel}
                      </h2>
                      <p className="text-xs font-semibold text-slate-600">{roleLabel}</p>
                      <p className="text-xs text-slate-400 truncate">{secondaryIdentity}</p>
                    </div>
                  </div>

                  {/* Remove Photo Button */}
                  <div className="pb-1.5 shrink-0">
                    {form.profileImage ? (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-600 px-3.5 py-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        Remove Photo
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 whitespace-nowrap">No photo</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Profile Section */}
              <div className="px-5 sm:px-6 pt-3 pb-4">
                <div className="rounded-[16px] border border-slate-200 bg-white p-3.5 sm:p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                  {/* Header */}
                  <div className="mb-2.5">
                    <p className="text-sm font-semibold text-slate-950">Edit Profile</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Update your personal details.
                    </p>
                  </div>

                  {/* Form Fields */}
                  <div className="grid gap-2.5 md:grid-cols-2">
                    <label className="block group">
                      <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-650">
                        <div className="flex h-5 w-5 shrink-0 rotate-45 items-center justify-center rounded-[5px] bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200/80 text-indigo-600 shadow-2xs">
                          <User2 className="h-2 w-2 -rotate-45" />
                        </div>
                        Full Name
                      </span>
                      <input
                        value={form.name}
                        disabled
                        readOnly
                        className="w-full rounded-lg border border-slate-200 bg-slate-100/80 px-2.5 py-1.5 text-xs text-slate-500 cursor-not-allowed select-none outline-none"
                        placeholder="Enter your name"
                      />
                    </label>

                    {(user?.role === "agent" || user?.role === "dmc_partner" || user?.role === "admin" || user?.role === "operation_manager" || user?.role === "operations") && (
                    <label className="block group">
                      <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-650 cursor-pointer">
                        <div className="flex h-5 w-5 shrink-0 rotate-45 items-center justify-center rounded-[5px] bg-gradient-to-br from-sky-50 to-sky-100/60 border border-sky-200/80 text-sky-600 shadow-2xs transition-all duration-300 group-hover:rotate-[135deg] group-hover:from-sky-600 group-hover:to-sky-500 group-hover:text-white group-hover:border-transparent">
                          <Building2 className="h-2 w-2 -rotate-45 transition-all duration-300 group-hover:-rotate-[135deg]" />
                        </div>
                        COMPANY / BRANDING NAME
                      </span>
                      <input
                        value={form.companyName}
                        onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs outline-none transition hover:border-slate-350 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                        placeholder="Enter company or branding name"
                      />
                    </label>
                    )}

                    <label className="block group">
                      <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-650">
                        <div className="flex h-5 w-5 shrink-0 rotate-45 items-center justify-center rounded-[5px] bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/80 text-emerald-600 shadow-2xs">
                          <Mail className="h-2 w-2 -rotate-45" />
                        </div>
                        Email
                      </span>
                      <input
                        value={form.email}
                        disabled
                        readOnly
                        className="w-full rounded-lg border border-slate-200 bg-slate-100/80 px-2.5 py-1.5 text-xs text-slate-500 cursor-not-allowed select-none outline-none"
                        placeholder="Enter email address"
                      />
                    </label>

                    <label className="block group">
                      <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-650">
                        <div className="flex h-5 w-5 shrink-0 rotate-45 items-center justify-center rounded-[5px] bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/80 text-amber-600 shadow-2xs">
                          <Phone className="h-2 w-2 -rotate-45" />
                        </div>
                        Phone
                      </span>
                      <input
                        value={form.phone}
                        disabled
                        readOnly
                        className="w-full rounded-lg border border-slate-200 bg-slate-100/80 px-2.5 py-1.5 text-xs text-slate-500 cursor-not-allowed select-none outline-none"
                        placeholder="Enter phone number"
                      />
                    </label>

                    {/* Company / Brand Logo Upload (Left Column) & Voucher Footer Upload (Right Column) */}
                    {user?.role === "agent" && (
                      <>
                        <div>
                          <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-650">
                            <div className="flex h-5 w-5 shrink-0 rotate-45 items-center justify-center rounded-[5px] bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200/80 text-indigo-600 shadow-2xs">
                              <Building2 className="h-2 w-2 -rotate-45" />
                            </div>
                            Company / Brand Logo
                          </span>

                          {form.brandingLogo ? (
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white p-0.5 flex items-center justify-center shadow-2xs">
                                  <img
                                    src={form.brandingLogo}
                                    alt="Company Brand Logo"
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold text-slate-800 truncate">Logo Uploaded</p>
                                  <p className="text-[8px] text-slate-500 truncate">Used on quotations & PDFs</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <label className="flex items-center gap-1 text-[9px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md cursor-pointer transition">
                                  <span>Change</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleBrandingLogoChange}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={handleRemoveBrandingLogo}
                                  className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                  title="Remove Logo"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1.5 hover:bg-slate-100/70 hover:border-indigo-400 transition">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600">
                                  <Camera className="h-3 w-3" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold text-slate-800 truncate">Upload Brand Logo</p>
                                  <p className="text-[8px] text-slate-500 truncate">PNG, JPG, SVG or WEBP</p>
                                </div>
                              </div>
                              <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[9px] font-semibold text-slate-700 shadow-2xs shrink-0">
                                Upload
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleBrandingLogoChange}
                              />
                            </label>
                          )}
                        </div>

                        <div>
                          <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-650">
                            <div className="flex h-5 w-5 shrink-0 rotate-45 items-center justify-center rounded-[5px] bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/80 text-emerald-600 shadow-2xs">
                              <Building2 className="h-2 w-2 -rotate-45" />
                            </div>
                            PDF / Voucher Footer Banner
                          </span>

                          {form.voucherFooterImage ? (
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-8 w-10 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white p-0.5 flex items-center justify-center shadow-2xs">
                                  <img
                                    src={form.voucherFooterImage}
                                    alt="Footer Banner"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold text-slate-800 truncate">Footer Uploaded</p>
                                  <p className="text-[8px] text-slate-500 truncate">Bottom banner for PDFs & Vouchers</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <label className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md cursor-pointer transition">
                                  <span>Change</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFooterImageChange}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={handleRemoveFooterImage}
                                  className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                  title="Remove Footer Banner"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1.5 hover:bg-slate-100/70 hover:border-emerald-400 transition">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 border border-emerald-100 text-emerald-600">
                                  <Camera className="h-3 w-3" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold text-slate-800 truncate">Upload Voucher Footer</p>
                                  <p className="text-[8px] text-slate-500 truncate">PNG, JPG, SVG or WEBP</p>
                                </div>
                              </div>
                              <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[9px] font-semibold text-slate-700 shadow-2xs shrink-0">
                                Upload
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFooterImageChange}
                              />
                            </label>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 mt-3">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                    className="flex-1 rounded-lg bg-[linear-gradient(135deg,#7c3aed_0%,#6366f1_35%,#0ea5e9_70%,#06b6d4_100%)] hover:bg-[linear-gradient(135deg,#6d28d9_0%,#4f46e5_35%,#0284c7_70%,#0891b2_100%)] text-xs font-bold text-white shadow-xl shadow-indigo-500/30 px-4 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer text-center"
                    >
                      {isSaving ? "Saving..." : "Save Profile"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSaving}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-xs font-bold text-slate-700 px-4 py-2 transition-all active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer text-center"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
