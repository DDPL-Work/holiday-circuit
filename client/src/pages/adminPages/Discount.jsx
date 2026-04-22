import { useState } from "react";
import { Gift, Plus, Pencil, Trash2, Mail, Users, X, Check, Send } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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

const initialCoupons = [
  {
    id: 1,
    code: "TEST",
    discount: "100%",
    description: "For Testing",
    startDate: "14/03/2026",
    endDate: "Never",
    users: "Unlimited",
    email: "test@example.com",
  },
  {
    id: 2,
    code: "MYQUOTE2026",
    discount: "5%",
    description: "FIRST 5 USERS!",
    startDate: "14/03/2026",
    endDate: "17/03/2026",
    users: "Unlimited",
    email: "promo@example.com",
  },
];

const emptyForm = {
  code: "",
  discount: "",
  description: "",
  startDate: "",
  endDate: "",
  users: "",
  email: "",
};

const toInputDate = (value = "") => {
  if (!value || value === "Never") return "";
  if (value.includes("-")) return value;
  const [day, month, year] = String(value).split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const toDisplayDate = (value = "") => {
  if (!value) return "";
  if (value.includes("/")) return value;
  const [year, month, day] = String(value).split("-");
  if (!day || !month || !year) return value;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
};

export default function CouponsDiscounts() {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (coupon) => {
    setEditId(coupon.id);
    setForm({
      ...coupon,
      startDate: toInputDate(coupon.startDate),
      endDate: toInputDate(coupon.endDate),
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.code || !form.discount) return;

    const nextCoupon = {
      ...form,
      startDate: toDisplayDate(form.startDate),
      endDate: toDisplayDate(form.endDate) || "Never",
    };

    if (editId) {
      setCoupons((prev) =>
        prev.map((coupon) => (coupon.id === editId ? { ...nextCoupon, id: editId } : coupon)),
      );
    } else {
      setCoupons((prev) => [...prev, { ...nextCoupon, id: Date.now() }]);
    }

    setShowModal(false);
  };

  const handleDelete = (id) => {
    setCoupons((prev) => prev.filter((coupon) => coupon.id !== id));
    setDeleteId(null);
  };

  const handleSendCoupon = (coupon) => {
    const targetEmail = coupon.email || "contact@example.com";
    const subject = encodeURIComponent(`Coupon Code: ${coupon.code}`);
    const body = encodeURIComponent(
      [
        "Hello,",
        "",
        `Your coupon code is ${coupon.code}.`,
        `Discount: ${coupon.discount}`,
        `Description: ${coupon.description || "-"}`,
        `Start Date: ${coupon.startDate || "Not set"}`,
        `End Date: ${coupon.endDate || "Never"}`,
        "",
        "Thank you.",
      ].join("\n"),
    );

    window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
  };

  const isExpired = (endDate) => {
    if (!endDate || endDate === "Never") return false;
    const [day, month, year] = String(endDate).split("/");
    return new Date(`${year}-${month}-${day}`) < new Date();
  };

  return (
    <div className="min-h-screen py-1 font-sans">
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

        {coupons.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-400">
            No coupons yet. Click <span className="font-semibold text-blue-600">+ Add Discount</span> to create one.
          </div>
        ) : (
          coupons.map((coupon, index) => {
            const expired = isExpired(coupon.endDate);

            return (
              <div
                key={coupon.id}
                className={`grid grid-cols-[1.2fr_0.7fr_1.1fr_1.15fr_0.8fr_0.8fr] items-center gap-5 px-6 py-2.5 transition-colors hover:bg-slate-50 ${
                  index !== coupons.length - 1 ? "border-b border-slate-200" : ""
                }`}
              >
                <span className="truncate text-[13px] font-semibold text-slate-900">{coupon.code}</span>
                <span className="text-sm font-semibold text-slate-700">{coupon.discount}</span>
                <span className="truncate text-[12px] text-slate-600">{coupon.description || "-"}</span>

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

                <span className="truncate text-sm text-slate-600">{coupon.email || "contact@example.com"}</span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendCoupon(coupon)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 text-xs font-semibold text-blue-600 transition-all hover:bg-blue-100"
                    title="Send coupon to agent"
                  >
                    <Send size={12} />
                    Send
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
            <div className="absolute inset-0" onClick={() => setShowModal(false)} />

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
                  onClick={() => setShowModal(false)}
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
                    <input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. SAVE20"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono font-semibold text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Discount <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: e.target.value })}
                      placeholder="e.g. 20% or Rs500"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">End Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <Users size={11} />
                      Users
                    </label>
                    <input
                      value={form.users}
                      onChange={(e) => setForm({ ...form, users: e.target.value })}
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
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="contact@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-xl bg-[#1e3a8a] px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-[#1d4ed8]"
                >
                  <Check size={14} strokeWidth={2.5} />
                  {editId ? "Save Changes" : "Create Coupon"}
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
            <div className="absolute inset-0" onClick={() => setDeleteId(null)} />

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
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-semibold text-white transition-all hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
