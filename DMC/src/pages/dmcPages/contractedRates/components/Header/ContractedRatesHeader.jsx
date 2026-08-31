import React from "react";
import { Upload } from "lucide-react";

export const ContractedRatesHeader = ({ onOpenBulkUploadModal }) => {
  return (
    <div className="mb-6 border border-gray-200 bg-white px-6 py-4 shadow-sm rounded-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            Bulk Service Upload & Inventory
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage hotel rates, transport, activities, and sightseeing inventories
          </p>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-white bg-gradient-to-r from-[#0b1e36] to-[#107c41] hover:from-[#132d52] hover:to-[#16914d] hover:shadow-[0_4px_12px_rgba(16,124,65,0.25)] transition-all duration-300 font-bold active:scale-95 cursor-pointer shrink-0"
          onClick={onOpenBulkUploadModal}
        >
          <Upload size={15} />
          Bulk Upload
        </button>
      </div>
    </div>
  );
};
