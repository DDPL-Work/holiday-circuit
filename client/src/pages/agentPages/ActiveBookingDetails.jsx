import { ArrowLeft, CreditCard, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function ActiveBookingDetails({ onClose, booking }) {
  const containerVariant = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
  };

  return (
    <motion.div 
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#F6F9FC] p-1"
    >
      {/* Header */}
      <motion.div variants={itemVariant} className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
              className="text-lg rounded-xl px-4 py-1 border-gray-300 hover:bg-gray-100 cursor-pointer border">
              <ArrowLeft className="w-5 h-5 stroke-[1.8] text-black" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0B132B]">{booking.destination}</h1>
            <p className="text-xs text-gray-500 mt-1">{booking.id} · {booking.dates}</p>
          </div>
        </div>

        {booking.status === "Awaiting Documents" && (
          <span className="bg-yellow-100 text-yellow-700 text-sm px-4 py-1 rounded-full">Awaiting Documents</span>
        )}
        {booking.status === "Payment Pending" && (
          <span className="bg-red-400 text-white text-sm px-4 py-1 rounded-full">Payment Pending</span>
        )}
        {booking.status === "Confirmed" && (
          <span className="bg-green-100 text-green-700 text-sm px-4 py-1 rounded-full">Confirmed</span>
        )}
      </motion.div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE */}
        <motion.div variants={itemVariant} className="lg:col-span-2 space-y-6">
          {/* Traveler Documentation */}
          <motion.div variants={itemVariant} className="rounded-2xl bg-[#F6F9FD] border border-[#BEDBFF] shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">👤</div>
              <div>
                <h3 className="text-sm font-semibold text-[#0B132B]">Traveler Documentation</h3>
                <p className="text-xs text-gray-500">Upload passports/IDs for all passengers.</p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-gray-500 border-b border-b-gray-300">
                  <th className="text-left py-3">Traveler Name</th>
                  <th className="text-left py-3">Document Type</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-right py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-b-gray-300">
                  <td className="py-4 font-medium text-[#0B132B]">Rahul Sharma</td>
                  <td className="py-4">Passport</td>
                  <td className="py-4">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">✓ Uploaded</span>
                  </td>
                  <td className="py-4 text-right text-blue-600 cursor-pointer">View</td>
                </tr>
                <tr>
                  <td className="py-4 font-medium text-[#0B132B]">Anjali Sharma</td>
                  <td className="py-4">Passport</td>
                  <td className="py-4">
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">Pending</span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="border border-gray-300 rounded-lg px-4 py-1 text-sm hover:bg-gray-100 cursor-pointer">Upload</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </motion.div>

          {/* Note */}
          <motion.div variants={itemVariant} className="bg-yellow-50 border border-yellow-200 rounded-xl p-2 text-sm text-yellow-800 flex gap-2">
            <span className="font-semibold">Note:</span>
            <span className="text-xs">
              Please ensure all passports have at least 6 months of validity from the date of travel. Upload clear color scans.
            </span>
          </motion.div>
        </motion.div>

        {/* RIGHT SIDE */}
        <motion.div variants={itemVariant} className="bg-white rounded-2xl shadow-sm border border-[#BEDBFF] p-6 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-5 h-5 rounded-xl bg-green-100 flex items-center justify-center"><CreditCard /></div>
            <div>
              <h3 className="text-sm font-semibold text-[#0B132B]">Payment Update</h3>
              <p className="text-xs text-gray-500">Update payment details to confirm booking.</p>
            </div>
          </div>

          {/* Bank */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700">Bank Name</label>
            <select className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-1.5 text-sm outline-none ">
              <option>Select Bank</option>
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>SBI Bank</option>
              <option>AXIS Bank</option>
            </select>
          </div>

          {/* UTR */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700">UTR / Transaction ID</label>
            <input placeholder="e.g. UTR88291020" className="mt-1 w-full border-b-gray-300 rounded-xl px-4 py-1.5 text-sm outline-none border border-gray-300" />
          </div>

          {/* Upload */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700">Payment Receipt</label>
            <label htmlFor="receipt" className="mt-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer block hover:bg-gray-50 transition">
              <Upload className="mx-auto text-gray-400 mb-2" size={22} />
              <p className="text-sm text-gray-600">Click to upload receipt</p>
              <p className="text-xs text-gray-400">JPG, PNG or PDF</p>
            </label>
            <input id="receipt" type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" />
          </div>

          {/* Button */}
          <button className="w-full bg-[#0B132B] text-white rounded-xl py-2 text-sm font-medium cursor-pointer">
            Submit for Verification
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}