import { Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BulkDocumentUploadModal({ onClose }) {
  const modalVariant = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: "easeIn" } },
  };

  const overlayVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed flex items-center justify-center z-50 inset-0"
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Overlay */}
        <motion.div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          variants={overlayVariant}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 relative z-10"
          variants={modalVariant}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Bulk Document Upload
            </h2>
            <button onClick={onClose}>
              <X className="text-gray-400 hover:text-gray-600" size={18} />
            </button>
          </div>

          {/* Upload Box */}
          <motion.label
            htmlFor="bulk-upload"
            className="border-2 border-dashed border-blue-200 bg-blue-50/40 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50 transition"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <Upload className="text-blue-600" size={20} />
            </div>

            <p className="text-sm font-medium text-slate-800">Drag & drop files here</p>
            <p className="text-xs text-gray-500 mt-1">PDF, JPG, or ZIP archives supported</p>
          </motion.label>

          <input
            id="bulk-upload"
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.zip"
          />

          {/* Instructions */}
          <div className="mt-4 bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Upload all traveler passports here.</li>
              <li>Our system will auto-link them to the passenger list.</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-5 text-sm">
            <button className="text-blue-600 hover:underline">
              Download Passenger Info Template (CSV)
            </button>
            <span className="text-gray-400 text-xs">Max 50MB</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100"
            >
              Cancel
            </button>
            <button className="px-5 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
              Start Upload
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}