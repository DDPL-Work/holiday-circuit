import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Gift,
  Mail,
  Pencil,
  Plus,
  Send,
  Trash2,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import API from "../../utils/Api";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.97,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

const deleteModalVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.96,
    transition: { duration: 0.16, ease: "easeIn" },
  },
};

const emptyForm = {
  code: "",
  discount: "",
  description: "",
  startDate: "",
  endDate: "",
  users: "",
  email: "",
  assignedAgentId: "",
};

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

const isExpired = (endDateValue = "") => {
  if (!endDateValue) return false;
  const parsed = new Date(`${endDateValue}T23:59:59`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed < new Date();
};

const mergeCoupon = (items, nextCoupon) => {
  const existingIndex = items.findIndex((coupon) => coupon.id === nextCoupon.id);
  if (existingIndex === -1) return [nextCoupon, ...items];

  return items.map((coupon) => (coupon.id === nextCoupon.id ? nextCoupon : coupon));
};

const FeedbackToast = ({ feedback, onClose }) => {
  if (!feedback) return null;

  return (
    <div className="fixed right-5 top-5 z-[80] w-full max-w-sm">
      <div
        className={`rounded-2xl border px-4 py-3 shadow-xl ${
          feedback.type === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white/80 p-1.5">
            {feedback.type === "error" ? <AlertCircle size={14} /> : <Check size={14} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{feedback.title}</p>
            <p className="mt-1 text-sm leading-5">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-current/70 transition-colors hover:bg-white/60"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CouponsDiscounts() {
  const [coupons, setCoupons] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sendingId, setSendingId] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        setPageError("");
        const { data } = await API.get("/admin/coupons");
        setCoupons(data?.data?.coupons || []);
        setAgents(data?.data?.agents || []);
      } catch (error) {
        setPageError(error?.response?.data?.message || "Unable to load coupons right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(null), 3200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const closeModal = (force = false) => {
    if (submitting && !force) return;
    setShowModal(false);
    setEditId(null);
    setForm(emptyForm);
    setFormError("");
  };

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (coupon) => {
    setEditId(coupon.id);
    setForm({
      code: coupon.code || "",
      discount: coupon.discount || "",
      description: coupon.description || "",
      startDate: coupon.startDateValue || "",
      endDate: coupon.endDateValue || "",
      users: coupon.usageLimit ? String(coupon.usageLimit) : "Unlimited",
      email: coupon.email || "",
      assignedAgentId: coupon.assignedAgentId || "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleEmailChange = (value) => {
    const normalizedValue = normalizeEmail(value);
    const matchedAgent = agents.find((agent) => normalizeEmail(agent.email) === normalizedValue);

    setForm((prev) => ({
      ...prev,
      email: value,
      assignedAgentId: matchedAgent?.id || "",
    }));
  };

  const handleSave = async () => {
    const code = String(form.code || "").trim().toUpperCase();
    const discount = String(form.discount || "").trim();
    const email = normalizeEmail(form.email);
    const matchedAgent =
      agents.find((agent) => agent.id === form.assignedAgentId) ||
      agents.find((agent) => normalizeEmail(agent.email) === email);

    if (!code || !discount) {
      setFormError("Code and discount are required.");
      return;
    }

    if (!matchedAgent) {
      setFormError("Please select a valid approved agent email.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const payload = {
        code,
        discount,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        usage: form.users,
        users: form.users,
        email: matchedAgent.email,
        assignedAgentId: matchedAgent.id,
      };

      const { data } = editId
        ? await API.patch(`/admin/coupons/${editId}`, payload)
        : await API.post("/admin/coupons", payload);

      const nextCoupon = data?.data?.coupon;
      if (nextCoupon) {
        setCoupons((prev) => mergeCoupon(prev, nextCoupon));
      }

      closeModal(true);
      setFeedback({
        type: "success",
        title: editId ? "Coupon Updated" : "Coupon Created",
        message: data?.message || "Coupon saved successfully.",
      });
    } catch (error) {
      setFormError(error?.response?.data?.message || "Unable to save coupon right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      setGeneratingCode(true);
      setFormError("");

      const { data } = await API.get("/admin/coupons/generate-code");
      const nextCode = String(data?.data?.code || "").trim().toUpperCase();

      if (!nextCode) {
        throw new Error("Coupon code was not generated.");
      }

      setForm((prev) => ({ ...prev, code: nextCode }));
    } catch (error) {
      setFormError(error?.response?.data?.message || error?.message || "Unable to generate coupon code right now.");
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      const { data } = await API.delete(`/admin/coupons/${id}`);
      setCoupons((prev) => prev.filter((coupon) => coupon.id !== id));
      setDeleteId(null);
      setFeedback({
        type: "success",
        title: "Coupon Deleted",
        message: data?.message || "Coupon deleted successfully.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        title: "Delete Failed",
        message: error?.response?.data?.message || "Unable to delete this coupon right now.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSendCoupon = async (coupon) => {
    try {
      setSendingId(coupon.id);
      const { data } = await API.post(`/admin/coupons/${coupon.id}/send`);
      const nextCoupon = data?.data?.coupon;
      if (nextCoupon) {
        setCoupons((prev) => mergeCoupon(prev, nextCoupon));
      }

      setFeedback({
        type: "success",
        title: "Coupon Sent",
        message: data?.message || `Coupon ${coupon.code} sent successfully.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        title: "Send Failed",
        message: error?.response?.data?.message || "Unable to send coupon right now.",
      });
    } finally {
      setSendingId("");
    }
  };

  return (
    <div className="min-h-screen py-1 font-sans">
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />

      <div className="mb-7 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e3a8a] shadow-md shadow-blue-200">
            <Gift size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Coupons & Discounts</h1>
            <p className="mt-0.5 text-sm text-slate-400">Create and manage discount codes and coupons.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:bg-[#1d4ed8] hover:shadow-blue-300 active:bg-[#1e40af]"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Discount
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.2fr_0.7fr_1.1fr_1.15fr_0.8fr_0.8fr] gap-6 border-b border-slate-200 bg-slate-50 px-5 py-4">
          {["Code", "Discount", "Description", "Validity", "User Email", "Actions"].map((heading) => (
            <p key={heading} className="text-xs font-semibold text-slate-700">
              {heading}
            </p>
          ))}
        </div>

        {loading ? (
          <div className="py-14 text-center text-sm text-slate-400">Loading coupons...</div>
        ) : pageError ? (
          <div className="py-14 text-center text-sm text-red-500">{pageError}</div>
        ) : coupons.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-400">
            No coupons yet. Click <span className="font-semibold text-blue-600">+ Add Discount</span> to create one.
          </div>
        ) : (
          coupons.map((coupon, index) => {
            const expired = isExpired(coupon.endDateValue);
            const isSending = sendingId === coupon.id;

            return (
              <div
                key={coupon.id}
                className={`grid grid-cols-[1.2fr_0.7fr_1.1fr_1.15fr_0.8fr_0.8fr] items-center gap-5 px-6 py-2.5 transition-colors hover:bg-slate-50 ${
                  index !== coupons.length - 1 ? "border-b border-slate-200" : ""
                }`}
              >
                <span className="truncate text-[13px] font-semibold text-slate-900">{coupon.code}</span>
                <span className="text-sm font-semibold text-slate-700">{coupon.discount}</span>
                <span
                  className="block truncate text-[12px] text-slate-600"
                  title={coupon.description || "-"}
                  aria-label={coupon.description || "-"}
                >
                  {coupon.description || "-"}
                </span>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-medium text-emerald-600">
                    Start: {coupon.startDate || "Not set"}
                  </span>
                  <span
                    className={`text-[11px] font-medium ${
                      expired ? "text-red-500" : coupon.endDate === "Never" ? "text-slate-400" : "text-red-500"
                    }`}
                  >
                    End: {coupon.endDate || "Never"}
                  </span>
                </div>

                <span
                  className="block truncate text-sm text-slate-600"
                  title={coupon.email || "contact@example.com"}
                  aria-label={coupon.email || "contact@example.com"}
                >
                  {coupon.email || "contact@example.com"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendCoupon(coupon)}
                    disabled={isSending}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 text-xs font-semibold text-blue-600 transition-all hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    title="Send coupon to agent"
                  >
                    <Send size={12} />
                    {isSending ? "Sending..." : "Send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(coupon)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(coupon.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {showModal ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0" onClick={closeModal} />

            <motion.div
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="h-1 w-full bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#3b82f6]" />

              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                    <Gift size={15} className="text-white" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">{editId ? "Edit Coupon" : "Add New Coupon"}</h2>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 px-6 py-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Code <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        value={form.code}
                        readOnly
                        placeholder="Click generate"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono font-semibold uppercase tracking-[0.12em] text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        disabled={generatingCode || submitting}
                        className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Generate unique coupon code"
                      >
                        <Wand2 size={14} />
                        {generatingCode ? "..." : "Gen"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Discount <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.discount}
                      onChange={(e) => setForm((prev) => ({ ...prev, discount: e.target.value }))}
                      placeholder="e.g. 20% or Rs500"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Short description"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">End Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <Users size={11} />
                      Usage
                    </label>
                    <input
                      value={form.users}
                      onChange={(e) => setForm((prev) => ({ ...prev, users: e.target.value }))}
                      placeholder="Unlimited or number"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <Mail size={11} />
                      Email
                    </label>
                    <input
                      list="coupon-agent-email-options"
                      value={form.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="contact@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <datalist id="coupon-agent-email-options">
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.email}>
                          {agent.label}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                {formError ? <p className="text-sm text-red-500">{formError}</p> : null}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-[#1e3a8a] px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Check size={14} strokeWidth={2.5} />
                  {submitting ? "Saving..." : editId ? "Save Changes" : "Create Coupon"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0" onClick={() => (!deleting ? setDeleteId(null) : null)} />

            <motion.div
              className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl"
              variants={deleteModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Coupon?</h3>
              <p className="mb-5 mt-1 text-sm text-slate-400">This action cannot be undone.</p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleting}
                  className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
