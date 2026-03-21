import {
  Eye,
  Upload,
  ShieldCheck,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import BulkDocumentUploadModal from "../../modal/BulkDocumentUploadModal";

/* ================= Animations ================= */
const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};
/* ============================================== */

const DocumentPortal = () => {
  const [openModal, setOpenModal] = useState(false);

  return (
    <motion.section
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Header */}
      <motion.header
        variants={itemVariant}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Document Portal</h1>
          <p className="text-sm text-gray-500">
            Securely upload and manage traveler documents.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpenModal(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2"
        >
          <Upload size={16} />
          Bulk Upload
        </motion.button>
      </motion.header>

      {/* Table Card */}
      <motion.div
        variants={itemVariant}
        className="bg-white shadow-sm rounded-xl p-4 space-y-4"
      >
        <div>
          <h2 className="font-semibold text-md">Traveler Documents</h2>
          <p className="text-xs text-gray-500">
            Passports and Visas for upcoming trips.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-gray-500 border-b-gray-200 border-b">
              <tr>
                <th className="text-left py-3">Traveler Name</th>
                <th className="text-left py-3">Booking Ref</th>
                <th className="text-left py-3">Passport Status</th>
                <th className="text-left py-3">Visa Status</th>
                <th className="text-right py-3">Actions</th>
              </tr>
            </thead>

            <motion.tbody
              variants={containerVariant}
              initial="hidden"
              animate="visible"
              className="divide-y divide-gray-200"
            >
              {/* Row 1 */}
              <motion.tr variants={itemVariant}>
                <td className="py-4 font-medium">Roy Admin</td>
                <td className="py-4">
                  <span className="border border-gray-300 px-2 py-1 rounded-xl text-xs">
                    Q-1001
                  </span>
                </td>
                <td className="py-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs flex w-fit items-center gap-1">
                    <ShieldCheck size={12} />
                    Verified
                  </span>
                </td>
                <td className="py-4 text-gray-500">Pending</td>
                <td className="py-4 text-right flex items-end justify-end">
                  <motion.button
                    whileHover={{ scale: 1.002 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-1 text-slate-800 text-sm"
                  >
                    <Eye size={16} /> View
                  </motion.button>
                </td>
              </motion.tr>

              {/* Row 2 */}
              <motion.tr variants={itemVariant}>
                <td className="py-4 font-medium">Anjali Sharma</td>
                <td className="py-4">
                  <span className="border border-gray-300 px-2 py-1 rounded-xl text-xs">
                    Q-1001
                  </span>
                </td>
                <td className="py-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs flex w-fit items-center gap-1">
                    <ShieldCheck size={12} />
                    Verified
                  </span>
                </td>
                <td className="py-4 text-gray-500">Pending</td>
                <td className="py-4 text-right flex items-end justify-end">
                  <motion.button
                    whileHover={{ scale: 1.002 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-1 text-slate-800 text-sm"
                  >
                    <Eye size={16} /> View
                  </motion.button>
                </td>
              </motion.tr>

              {/* Row 3 */}
              <motion.tr variants={itemVariant}>
                <td className="py-4 font-medium">John Doe</td>
                <td className="py-4">
                  <span className="border border-gray-300 px-2 py-1 rounded-xl text-xs">
                    Q-1002
                  </span>
                </td>
                <td className="py-4">
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs flex w-fit items-center gap-1">
                    <ShieldAlert size={12} />
                    Missing
                  </span>
                </td>
                <td className="py-4 text-gray-500">Not Started</td>
                <td className="py-4 text-right flex items-end justify-end">
                  <motion.button
                    whileHover={{ scale: 1.002 }}
                    whileTap={{ scale: 0.98 }}
                    className="border border-gray-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer hover:bg-gray-100"
                  >
                    <Upload size={14} />
                    Upload
                  </motion.button>
                </td>
              </motion.tr>

              {/* Row 4 */}
              <motion.tr variants={itemVariant}>
                <td className="py-4 font-medium">Jane Doe</td>
                <td className="py-4">
                  <span className="border border-gray-300 px-2 py-1 rounded-xl text-xs">
                    Q-1002
                  </span>
                </td>
                <td className="py-4">
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs flex w-fit items-center gap-1">
                    <Clock size={12} />
                    Reviewing
                  </span>
                </td>
                <td className="py-4 text-gray-500">Not Started</td>
                <td className="py-4 flex items-end justify-end text-right">
                  <motion.button
                    whileHover={{ scale: 1.002 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-1 text-slate-800 text-sm"
                  >
                    <Eye size={15} /> View
                  </motion.button>
                </td>
              </motion.tr>
            </motion.tbody>
          </table>
        </div>
      </motion.div>

      {/* Security Note */}
      <motion.div
        variants={itemVariant}
        className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800"
      >
        <ShieldCheck size={18} />
        <p>
          <strong>Security Note:</strong> All documents are encrypted at rest.
          Please ensure passports are scanned clearly in color (JPG/PDF format).
        </p>
      </motion.div>

      {/* MODAL */}
      {openModal && (
        <BulkDocumentUploadModal onClose={() => setOpenModal(false)} />
      )}
    </motion.section>
  );
};

export default DocumentPortal;