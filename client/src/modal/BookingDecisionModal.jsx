import { X, CheckCircle, XCircle } from "lucide-react";
import API from "../utils/Api";
import { useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function BookingDecisionModal({
  isOpen,
  onClose,
  mode = "accept",
  queryId,
}) {
  const [reason, setReason] = useState("");
  const isAccept = mode === "accept";

  // if (!isOpen) return null;

  // ================= Reject =================

  const handleRejectQuery = async () => {
    try {
      if (!reason.trim()) {
        return toast.error("Please enter rejection reason");
      }

      const res = await API.patch(`/ops/queries/${queryId}/reject-query`, {
        reason,
      });

      if (res?.data?.success) {
        toast.success("Query rejected");
        onClose();
        window.location.reload();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  // ================= Accept =================

  const handleAcceptQuery = async () => {
    try {
      const res = await API.patch(`/ops/queries/${queryId}/accept`);

      if (res?.data?.success) {
        toast.success("Query accepted");
        onClose();
        window.location.reload();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center">

          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* MODAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative bg-white w-full max-w-md rounded-2xl shadow-xl p-6 z-10"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isAccept ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {isAccept ? (
                    <CheckCircle className="text-green-600" />
                  ) : (
                    <XCircle className="text-red-600" />
                  )}
                </motion.div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {isAccept ? "Accept Booking" : "Reject Booking"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isAccept
                      ? "Confirm and proceed with this booking"
                      : "Provide a reason to reject this booking"}
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
              </motion.button>
            </div>

            {/* BODY */}
            <div className="mb-5">
              {isAccept ? (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    This action will confirm the booking and allow quotation creation.
                  </p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#F0FDF4] border border-[#B9F8CF] rounded-xl p-5 text-sm text-[#016630]"
                  >
                    This booking will be moved to the fulfillment pipeline where you can enter confirmation details and generate vouchers.
                  </motion.div>
                </>
              ) : (
                <>
                  <label className="text-xs text-gray-600 font-semibold mb-1 block">
                    Rejection Reason
                  </label>

                  <textarea
                    placeholder="e.g., Insufficient inventory for requested dates..."
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex-1 border border-gray-300 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isAccept ? handleAcceptQuery : handleRejectQuery}
                className={`flex-1 rounded-xl py-2 text-sm text-white cursor-pointer ${
                  isAccept
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isAccept ? "Confirm Accept" : "Confirm Reject"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}