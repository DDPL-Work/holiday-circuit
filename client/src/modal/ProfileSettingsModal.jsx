import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Camera,
  Mail,
  MapPin,
  Phone,
  Settings2,
  ShieldCheck,
  User2,
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
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    profileImage: "",
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
  const locationLabel = useMemo(
    () => form.companyName || user?.department || user?.companyName || "Holiday Circuit Workspace",
    [form.companyName, user],
  );
  const permissionTags = useMemo(() => {
    const tags = Array.isArray(user?.permissions)
      ? user.permissions.filter(Boolean).slice(0, 4)
      : [];

    if (tags.length) return tags;
    return ["Profile Access", "Workspace Access"];
  }, [user]);

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

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const payload = {
        name: form.name.trim(),
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        profileImage: form.profileImage,
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
            className="max-h-[calc(100vh-64px)] w-full max-w-[900px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_22px_64px_rgba(15,23,42,0.22)]"
          >
            <div className="custom-scroll max-h-[calc(100vh-64px)] overflow-y-auto">
              <div className="relative">
                <div className="relative h-[80px] overflow-hidden sm:h-[90px]" style={coverStyle}>
                  {form.profileImage ? (
                    <>
                      <img
                        src={form.profileImage}
                        alt="Profile cover"
                        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-40 blur-[10px]"
                      />
                      <img
                        src={form.profileImage}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-72"
                        style={{
                          clipPath: "inset(0 round 0)",
                          objectPosition: "center 26%",
                          mixBlendMode: "screen",
                        }}
                      />
                    </>
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(12,18,36,0.55)_0%,rgba(15,23,42,0.18)_42%,rgba(120,53,15,0.32)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-white/0" />
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="absolute right-4 top-4 z-20 rounded-full border border-white/50 bg-white/80 p-2 text-slate-600 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="absolute inset-x-0 bottom-0 px-4">
                  <div className="translate-y-[24px] rounded-[20px] border border-white/80 bg-white/92 p-3 shadow-[0_14px_26px_rgba(15,23,42,0.08)] backdrop-blur">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative shrink-0">
                          {form.profileImage ? (
                            <img
                              src={form.profileImage}
                              alt="Profile"
                              className="h-[56px] w-[56px] sm:h-[64px] sm:w-[64px] rounded-full border-[3px] border-white object-cover shadow-[0_14px_24px_rgba(15,23,42,0.18)]"
                            />
                          ) : (
                            <div className="flex h-[56px] w-[56px] sm:h-[64px] sm:w-[64px] items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-slate-900 via-slate-800 to-amber-700 text-xl font-semibold text-white shadow-[0_14px_24px_rgba(15,23,42,0.18)] ring-4 ring-indigo-500/10">
                              {buildInitials(identityLabel)}
                            </div>
                          )}

                          <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg transition active:scale-95">
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

                        <div className="min-w-0 pb-0 sm:pr-2">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                            Profile Canvas
                          </p>
                          <h2 className="mt-1 text-[1.32rem] font-semibold tracking-tight text-slate-950 leading-[0.95] sm:text-[1.42rem] sm:whitespace-nowrap">
                            {identityLabel}
                          </h2>
                          <p className="mt-0.5 text-[12px] text-slate-600">{roleLabel}</p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                            <MapPin className="h-3 w-3 text-amber-500" />
                            <span>{locationLabel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[280px]">
                        <div className="flex min-h-[62px] sm:min-h-[66px] flex-col justify-center rounded-[16px] border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 px-3 py-1.5">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <BriefcaseBusiness className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Current role</span>
                          </div>
                          <div className="mt-1.5 inline-flex rounded-full bg-[#e8e2ff] px-3 py-1 text-[11px] font-semibold text-[#2d1e86]">
                            {roleLabel}
                          </div>
                        </div>

                        <div className="flex min-h-[62px] sm:min-h-[66px] flex-col justify-center rounded-[16px] border border-amber-100 bg-gradient-to-br from-amber-50/50 to-orange-50/30 px-3 py-1.5">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                            <span>Permissions</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center content-start gap-1.5">
                            {permissionTags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5.5 pb-5.5 pt-[34px] sm:pt-[38px]">
                <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] items-stretch">
                  
                  {/* Left Column - Edit Profile */}
                  <div className="rounded-[20px] border border-slate-200 bg-white p-4.5 shadow-[0_10px_22px_rgba(15,23,42,0.04)] flex flex-col justify-between">
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[15px] font-semibold text-slate-950">Edit Profile</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Update your personal card details.
                          </p>
                        </div>
                        <div className="inline-flex shrink-0 self-start items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Profile Active
                        </div>
                      </div>

                      {/* Inputs Grid */}
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="block group">
                          <span className="mb-1.5 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-650 cursor-pointer">
                            <div className="flex h-6.5 w-6.5 shrink-0 rotate-45 items-center justify-center rounded-[8px] bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200/80 text-indigo-600 shadow-[0_2px_5px_rgba(79,70,229,0.06)] transition-all duration-300 group-hover:rotate-[135deg] group-hover:from-indigo-600 group-hover:to-indigo-500 group-hover:text-white group-hover:border-transparent">
                              <User2 className="h-3 w-3 -rotate-45 transition-all duration-300 group-hover:-rotate-[135deg]" />
                            </div>
                            Full Name
                          </span>
                          <input
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition hover:border-slate-350 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            placeholder="Enter your name"
                          />
                        </label>

                        <label className="block group">
                          <span className="mb-1.5 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-650 cursor-pointer">
                            <div className="flex h-6.5 w-6.5 shrink-0 rotate-45 items-center justify-center rounded-[8px] bg-gradient-to-br from-sky-50 to-sky-100/60 border border-sky-200/80 text-sky-600 shadow-[0_2px_5px_rgba(14,165,233,0.06)] transition-all duration-300 group-hover:rotate-[135deg] group-hover:from-sky-600 group-hover:to-sky-500 group-hover:text-white group-hover:border-transparent">
                              <Building2 className="h-3 w-3 -rotate-45 transition-all duration-300 group-hover:-rotate-[135deg]" />
                            </div>
                            Company
                          </span>
                          <input
                            value={form.companyName}
                            onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition hover:border-slate-350 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            placeholder="Enter company name"
                          />
                        </label>

                        <label className="block group">
                          <span className="mb-1.5 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-650 cursor-pointer">
                            <div className="flex h-6.5 w-6.5 shrink-0 rotate-45 items-center justify-center rounded-[8px] bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/80 text-emerald-600 shadow-[0_2px_5px_rgba(16,185,129,0.06)] transition-all duration-300 group-hover:rotate-[135deg] group-hover:from-emerald-600 group-hover:to-emerald-500 group-hover:text-white group-hover:border-transparent">
                              <Mail className="h-3 w-3 -rotate-45 transition-all duration-300 group-hover:-rotate-[135deg]" />
                            </div>
                            Email
                          </span>
                          <input
                            value={form.email}
                            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition hover:border-slate-350 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            placeholder="Enter email address"
                          />
                        </label>

                        <label className="block group">
                          <span className="mb-1.5 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-650 cursor-pointer">
                            <div className="flex h-6.5 w-6.5 shrink-0 rotate-45 items-center justify-center rounded-[8px] bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/80 text-amber-600 shadow-[0_2px_5px_rgba(245,158,11,0.06)] transition-all duration-300 group-hover:rotate-[135deg] group-hover:from-amber-600 group-hover:to-amber-500 group-hover:text-white group-hover:border-transparent">
                              <Phone className="h-3 w-3 -rotate-45 transition-all duration-300 group-hover:-rotate-[135deg]" />
                            </div>
                            Phone
                          </span>
                          <input
                            value={form.phone}
                            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition hover:border-slate-350 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                            placeholder="Enter phone number"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Action buttons inside Edit Profile card */}
                    <div className="flex items-center gap-4 mt-5">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-sm font-bold text-white shadow-[0_3px_10_rgba(79,70,229,0.2)] px-6 py-2 transition-all active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer text-center"
                      >
                        {isSaving ? "Saving..." : "Save Profile"}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-sm font-bold text-slate-700 px-6 py-2 transition-all active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer text-center"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Workspace Brief */}
                  <div className="rounded-[20px] border border-slate-200 bg-white p-4.5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] flex flex-col justify-between">
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[15px] font-semibold text-slate-950">Workspace Brief</p>
                          <p className="mt-1 text-xs text-slate-500">
                            View visibility and workspace settings.
                          </p>
                        </div>
                        <div className="inline-flex shrink-0 self-start items-center gap-1.5 whitespace-nowrap rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-[11px] font-semibold text-indigo-700">
                          <Settings2 className="h-3.5 w-3.5" />
                          Active
                        </div>
                      </div>

                      {/* Content Info list */}
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl border border-slate-150 bg-slate-50/30 px-4 py-2.5">
                          <span className="mb-1.5 flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-550">
                            <div className="flex h-5.5 w-5.5 shrink-0 rotate-45 items-center justify-center rounded-[6px] bg-gradient-to-br from-violet-50 to-violet-100/60 border border-violet-200/80 text-violet-600 shadow-sm">
                              <BriefcaseBusiness className="h-2.5 w-2.5 -rotate-45" />
                            </div>
                            Profile Visibility
                          </span>
                          <p className="text-xs font-bold text-slate-800 ml-8">{roleLabel}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500 ml-8 leading-relaxed">
                            Used in sidebar, headers, and workflow cards.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-150 bg-slate-50/30 px-4 py-2.5">
                          <span className="mb-1.5 flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-550">
                            <div className="flex h-5.5 w-5.5 shrink-0 rotate-45 items-center justify-center rounded-[6px] bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200/80 text-indigo-600 shadow-sm">
                              <User2 className="h-2.5 w-2.5 -rotate-45" />
                            </div>
                            Workspace Identity
                          </span>
                          <p className="text-xs font-bold text-slate-800 ml-8">{secondaryIdentity}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500 ml-8 leading-relaxed">
                            Visible to all users in the workspace.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Photo Action at the bottom */}
                    <div className="mt-5">
                      {form.profileImage ? (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="w-full rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 hover:from-rose-100 hover:to-red-100 border border-red-200 px-3.5 py-2 text-xs font-bold text-red-600 transition active:scale-98 cursor-pointer text-center"
                        >
                          Remove Photo
                        </button>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 px-4 py-2.5 text-[11px] text-slate-500 text-center leading-relaxed">
                          Upload a photo to personalize your profile.
                        </div>
                      )}
                    </div>
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
