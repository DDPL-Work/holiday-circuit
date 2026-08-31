import React from "react";
import { motion } from "framer-motion";
import InternalInvoice from "../../InternalInvoice";

export default function InternalInvoiceTab({
  selectedQueryId,
  selectedQuery,
  referenceServices,
}) {
  return (
    <motion.div
      key="invoice-tab-panel"
      initial={{
        opacity: 0,
        y: 10,
        scale: 0.995,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: -8,
        scale: 0.995,
      }}
      transition={{
        duration: 0.22,
        ease: "easeOut",
      }}
    >
      <InternalInvoice
        key={selectedQueryId || "invoice-default"}
        selectedQuery={selectedQuery}
        queryServices={referenceServices}
      />
    </motion.div>
  );
}
