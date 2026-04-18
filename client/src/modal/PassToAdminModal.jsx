import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, TriangleAlert } from "lucide-react";
import API from "../utils/Api";

export default function PassToAdminModal({ onClose, order, onSuccess }) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const adminCoordinationStatus = String(order?.adminCoordination?.status || "idle");
  const isReopening = adminCoordinationStatus === "replied";

  const handleSubmit = async () => {
    const trimmedNote = note.trim();

    if (!trimmedNote) {
      toast.error("Please add a note for admin.");
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

      toast.success(data?.message || "Query passed to admin successfully");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to pass this query to admin right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xl">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-lg">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <TriangleAlert size={18} className="text-[#BB4D00]" />
          {isReopening ? "Re-open with Admin" : "Pass to Admin"}
        </h2>
        <p className="mb-6 mt-2 text-sm text-gray-600">
          {isReopening
            ? "Admin has already replied once. Send another note if you need a fresh review."
            : "Send this booking to admin for review and decision."}
        </p>

        <label className="mb-1 block text-sm font-medium text-gray-700">
          Note for Admin
        </label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g., Complex requirements need pricing approval, special contract terms, unable to process..."
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
            {isReopening ? "Send Again" : "Pass to Admin"}
          </button>
        </div>
      </div>
    </div>
  );
}
