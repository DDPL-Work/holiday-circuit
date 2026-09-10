import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, TriangleAlert } from "lucide-react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import API from "../utils/Api";

export default function PassToAdminModal({ onClose, order, onSuccess }) {
  const currentUser = useSelector((state) => state.auth.user);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOperationManagerView = currentUser?.role === "operation_manager";
  const adminCoordinationStatus = String(order?.adminCoordination?.status || "idle");
  const isReopening = adminCoordinationStatus === "replied";
  const targetLabel = isOperationManagerView ? "admin" : "manager";
  const actionLabel = isOperationManagerView ? "Pass to Admin" : "Pass to Manager";
  const reopenLabel = isOperationManagerView ? "Re-open with Admin" : "Re-open with Manager";

  const handleSubmit = async () => {
    const trimmedNote = note.trim();

    if (!trimmedNote) {
      toast.error(`Please add a note for ${targetLabel}.`);
      return;
    }

    if (!order?._id) {
      toast.error("Query details are missing.");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await API.patch(`/ops/queries/pass-admin/${order._id}`, {
        note: trimmedNote,
      });

      toast.success(
        data?.message ||
          `Query passed to ${targetLabel} successfully`,
      );
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          `Unable to pass this query to ${targetLabel} right now.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-lg"
      >
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <TriangleAlert size={18} className="text-[#BB4D00]" />
          {isReopening ? reopenLabel : actionLabel}
        </h2>
        <p className="mb-6 mt-2 text-sm text-gray-600">
          {isReopening
            ? `A reply has already been shared once. Send another note if you need a fresh ${targetLabel} review.`
            : `Send this booking to ${isOperationManagerView ? "admin" : "ops manager"} for review and decision.`}
        </p>

        <label className="mb-1 block text-sm font-medium text-gray-700">
          Note for {isOperationManagerView ? "Admin" : "Manager"}
        </label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={
            isOperationManagerView
              ? "e.g., High-value exception needs admin approval, pricing override required, special approval needed..."
              : "e.g., Complex requirements need pricing approval, special contract terms, unable to process..."
          }
          className="mb-4 min-h-[120px] w-full rounded-2xl border border-gray-300 p-3 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          rows={5}
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer rounded-2xl bg-gray-200 px-4 py-2 text-gray-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex cursor-pointer items-center gap-2 rounded-2xl bg-[#E17100] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {isReopening ? "Send Again" : actionLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
