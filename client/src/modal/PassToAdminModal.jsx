import { TriangleAlert } from "lucide-react";


export default function PassToAdminModal({ onClose }) {

  return (
    <div className="flex items-center justify-center h-screen">
      {/* Modal */}
    
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xl">
          <div className="bg-white rounded-lg shadow-lg w-100 p-6">
            {/* Title */}
            <h2 className="text-xl font-semibold flex items-center gap-2"><TriangleAlert size={17} className="text-[#BB4D00]" />Pass to Admin</h2>
            <p className="text-gray-600 text-sm mb-8">
              Send this booking to admin for review and decision
            </p>

            {/* Note Section */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note for Admin
            </label>
            <textarea
              placeholder="e.g., Complex requirements need pricing approval, special contract terms, unable to process..."
              className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none mb-4"
              rows={3}
            />

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button className="px-3 py-2 bg-[#E17100] text-white rounded-xl cursor-pointer">
                Pass to Admin
              </button>
            </div>
          </div>
        </div>
    </div>
  );
}