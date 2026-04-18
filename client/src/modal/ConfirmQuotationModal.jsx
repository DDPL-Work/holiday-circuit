import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function ConfirmQuotationModal({ order, onClose }) {

  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const isInvoiceRequestedStage = order?.opsStatus === "Invoice_Requested";
  const isRevisionStage = order?.opsStatus === "Revision_Query";

  const handleClose = () => {
    setOpen(false);

    setTimeout(() => {
      onClose();
    }, 220);
  };

  const handleProceed = () => {
  setOpen(false);

  setTimeout(() => {
    onClose();

    navigate("/ops/quotation-builder", { state: order });

  }, 220);
};

  const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modal = {
    hidden: { opacity: 0, scale: 0.9, y: 40 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 22
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleClose}
          className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-50"
        >

          <motion.div
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl w-105 p-6"
          >

            <h2 className="text-xl font-semibold flex items-center gap-2 mb-1">
              <FileText size={18} className="text-[#00A63E]" />
              {isInvoiceRequestedStage
                ? "Open Builder For Finance Invoice"
                : isRevisionStage
                  ? "Open Builder For Revised Quotation"
                  : "Confirm & Create Quotation"}
            </h2>

            <p className="text-[#717182] text-sm mb-5">
              {isInvoiceRequestedStage
                ? "You will be redirected to the Quotation Builder to review the approved quotation and prepare the finance-side invoice."
                : isRevisionStage
                  ? "Agent has requested changes. Open the builder to prepare and send a revised quotation for the same query."
                  : "You will be redirected to the Quotation Builder to select rates and create a quote"}
            </p>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-[#016630] text-sm mb-4 border border-[#B9F8CF] bg-[#F0FDF4] rounded-xl p-4"
            >
              <strong>{order?.queryId}</strong>{" "}
              {isInvoiceRequestedStage
                ? "already has client approval. Open the builder to prepare the finance invoice record. Finance team will share the final invoice with the agent."
                : isRevisionStage
                  ? "is back for quotation revision. Update services/pricing and send the revised quote back to the agent."
                  : "will be moved to quotation stage. You'll select contracted rates, add markup, and send the quote to the agent."}
            </motion.p>

            <div className="space-y-2 text-sm text-gray-700 mb-4">
              <p>
                <span className="font-bold">Agent:</span> {order?.agent?.companyName}
              </p>

              <p>
                <span className="font-bold">Destination:</span> {order?.destination}
              </p>

              <p>
                <span className="font-bold">Value:</span> ₹{order?.customerBudget?.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="flex justify-end gap-3">

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClose}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 cursor-pointer"
              >
                Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleProceed}
                className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 cursor-pointer"
              >
                {isInvoiceRequestedStage
                  ? "Open Quotation Builder"
                  : isRevisionStage
                    ? "Open Revised Builder"
                    : "Proceed to Quotation Builder"}
              </motion.button>

            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
