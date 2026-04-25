import { X, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../utils/Api";

export default function BookingDecisionModal({
  isOpen,
  onClose,
  mode = "accept",
  queryId,
  refresh,
  onDecisionSuccess,
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const isAccept = mode === "accept";
  const enterTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };
  const exitTransition = { duration: 0.14, ease: "easeOut" };

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    }

    if (!isOpen) {
      setReason("");
      setLoading(false);
      return;
    }

    if (isAccept) {
      setReason("");
    }
  }, [isAccept, isOpen]);

  if (!shouldRender) return null;

  const handleRejectQuery = async () => {
    if (loading) return;

    try {
      if (!reason.trim()) {
        toast.error("Please enter rejection reason");
        return;
      }

      setLoading(true);
      const res = await API.patch(`/ops/queries/reject/${queryId}`, { reason });

      if (res?.data?.success) {
        toast.success("Query rejected");
        onDecisionSuccess?.(res?.data?.query);
        await refresh?.();
        onClose?.();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuery = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const res = await API.patch(`/ops/queries/accept/${queryId}`);

      if (res?.data?.success) {
        toast.success("Query accepted");
        onDecisionSuccess?.(res?.data?.query);
        await refresh?.();
        onClose?.();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        if (!isOpen) {
          setShouldRender(false);
        }
      }}
    >
      {isOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={enterTransition}
            onClick={onClose}
            className="absolute inset-0 bg-black/45"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.965, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: 10, transition: exitTransition }}
            transition={enterTransition}
            className="relative z-10 w-full max-w-md transform-gpu rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: 0.03 }}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
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
                <X className="h-5 w-5 cursor-pointer text-gray-400 hover:text-gray-600" />
              </motion.button>
            </div>

            <div className="mb-5">
              {isAccept ? (
                <>
                  <p className="mb-3 text-sm text-gray-600">
                    This action will confirm the booking and allow quotation creation.
                  </p>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                    className="rounded-xl border border-[#B9F8CF] bg-[#F0FDF4] p-5 text-sm text-[#016630]"
                  >
                    This booking will be moved to the fulfillment pipeline where you can enter
                    confirmation details and generate vouchers.
                  </motion.div>
                </>
              ) : (
                <>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Rejection Reason
                  </label>

                  <textarea
                    placeholder="e.g., Insufficient inventory for requested dates..."
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </>
              )}
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex-1 cursor-pointer rounded-xl border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
                onClick={isAccept ? handleAcceptQuery : handleRejectQuery}
                disabled={loading}
                className={`flex-1 cursor-pointer rounded-xl py-2 text-sm text-white ${
                  isAccept
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } ${loading ? "cursor-not-allowed opacity-70" : ""}`}
              >
                {loading
                  ? isAccept
                    ? "Confirming..."
                    : "Rejecting..."
                  : isAccept
                    ? "Confirm Accept"
                    : "Confirm Reject"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
