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
      "linear-gradient(120deg, #dbeafe 0%, #e0f2fe 26%, #1e293b 26%, #0f172a 58%, #7c2d12 82%, #f59e0b 100%)",
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
                <div className="relative h-[118px] overflow-hidden sm:h-[126px]" style={coverStyle}>
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
                  <div className="translate-y-[44%] rounded-[20px] border border-white/80 bg-white/92 p-3 shadow-[0_14px_26px_rgba(15,23,42,0.08)] backdrop-blur">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative shrink-0">
                          {form.profileImage ? (
                            <img
                              src={form.profileImage}
                              alt="Profile"
                              className="h-[72px] w-[72px] sm:h-[80px] sm:w-[80px] rounded-full border-[4px] border-white object-cover shadow-[0_14px_24px_rgba(15,23,42,0.18)]"
                            />
                          ) : (
                            <div className="flex h-[72px] w-[72px] sm:h-[80px] sm:w-[80px] items-center justify-center rounded-full border-[4px] border-white bg-gradient-to-br from-slate-900 via-slate-800 to-amber-700 text-2xl font-semibold text-white shadow-[0_14px_24px_rgba(15,23,42,0.18)]">
                              {buildInitials(identityLabel)}
                            </div>
                          )}

                          <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-[3px] border-white bg-[#271a78] text-white shadow-lg transition hover:bg-[#1f1563]">
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
                          <h2 className="mt-1 text-[1.58rem] font-semibold tracking-tight text-slate-950 leading-[0.95] sm:text-[1.72rem] sm:whitespace-nowrap">
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
                        <div className="flex min-h-[78px] flex-col justify-center rounded-[16px] border border-slate-200 bg-[#f7f4ff] px-3 py-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <BriefcaseBusiness className="h-3.5 w-3.5 text-slate-400" />
                            <span>Current role</span>
                          </div>
                          <div className="mt-1.5 inline-flex rounded-full bg-[#e8e2ff] px-3 py-1 text-[11px] font-semibold text-[#2d1e86]">
                            {roleLabel}
                          </div>
                        </div>

                        <div className="flex min-h-[78px] flex-col justify-center rounded-[16px] border border-slate-200 bg-[#fff8ef] px-3 py-2">
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

              <div className="px-4 pb-4 pt-14 sm:pt-[4.2rem]">
                <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-3">
                    <div className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[15px] font-semibold text-slate-950">Edit Profile</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Update your personal card details while keeping the same profile modal flow.
                          </p>
                        </div>
                        <div className="inline-flex shrink-0 self-start items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Profile Active
                        </div>
                      </div>

                      <div className="mt-3.5 grid gap-2.5 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            <User2 className="h-3 w-3" />
                            Full Name
                          </span>
                          <input
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                            className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#271a78] focus:bg-white"
                            placeholder="Enter your name"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            <Building2 className="h-3 w-3" />
                            Company
                          </span>
                          <input
                            value={form.companyName}
                            onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
                            className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#271a78] focus:bg-white"
                            placeholder="Enter company name"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            <Mail className="h-3 w-3" />
                            Email
                          </span>
                          <input
                            value={form.email}
                            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                            className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#271a78] focus:bg-white"
                            placeholder="Enter email address"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            <Phone className="h-3 w-3" />
                            Phone
                          </span>
                          <input
                            value={form.phone}
                            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                            className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#271a78] focus:bg-white"
                            placeholder="Enter phone number"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="min-w-[140px] rounded-full bg-[#2c1b8f] px-5 py-2.5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(44,27,143,0.22)] transition hover:bg-[#241672] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Save Profile"}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="min-w-[120px] rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[20px] border border-slate-200 bg-[#fcfcfd] p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <Settings2 className="h-4 w-4 text-slate-400" />
                        Workspace Brief
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Profile Visibility</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{roleLabel}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Your name, role, and profile image are used across the sidebar, headers, and assigned workflow cards.
                          </p>
                        </div>

                        <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Active Workspace Identity</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{secondaryIdentity}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            This identity appears anywhere your account is shown to teammates, managers, agents, or admins.
                          </p>
                        </div>

                        {form.profileImage ? (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="w-full rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            Remove Current Photo
                          </button>
                        ) : (
                          <div className="rounded-[20px] border border-dashed border-slate-300 bg-white px-4 py-4 text-xs text-slate-500">
                            Add a profile photo to make your sidebar card and admin user rows feel more personal.
                          </div>
                        )}
                      </div>
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
