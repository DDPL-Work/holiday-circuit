import React from "react";
import { X, Download } from "lucide-react";
import { LiaHotelSolid } from "react-icons/lia";
import { MdOutlineFlight } from "react-icons/md";


const VoucherPreviewModal = ({ onClose }) => {
  return (
<div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm overflow-y-auto custom-scroll">
      
      {/* Wrapper (Top aligned) */}
      <div className="flex justify-center px-3 py-6 min-h-full">

        {/* Modal Box */}
        <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-2xl rounded-md shadow-2xl flex flex-col animate-scaleIn"
>

          {/* Header */}
          <div className="flex justify-between items-start p-4 border-b border-gray-300">
            <div>
              <h2 className="text-base font-semibold">
                Voucher Preview - QRY-2026-0231
              </h2>
              <p className="text-xs text-gray-500">
                Review and download the voucher for Mrs. Priya Sharma.
              </p>
            </div>
            <X onClick={onClose} className="cursor-pointer text-red-700  w-5 h-5 rounded-md " size={18} />
          </div>

          {/* Content */}
          <div className="px-4">

            {/* Blue Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white text-center py-6 mt-4 rounded-xl">
              <h1 className="text-lg font-semibold">Holiday Circuit</h1>
              <p className="text-xs mt-1">Travel Voucher</p>

              <div className="mt-3 inline-block bg-white/20 px-10 py-2 rounded-xl">
                <p className="text-[10px]">Voucher No.</p>
                <p className="text-sm font-semibold">QRY-2026-0231</p>
              </div>
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
              <div>
                <p className="text-gray-500">Guest Name</p>
                <p className="font-medium">Mrs. Priya Sharma</p>
              </div>

              <div>
                <p className="text-gray-500">Passengers</p>
                <p className="font-medium">3 PAX</p>
              </div>

              <div>
                <p className="text-gray-500">Destination</p>
                <p className="font-medium">Paris, France</p>
              </div>

              <div>
                <p className="text-gray-500">Duration</p>
                <p className="font-medium">6N/7D</p>
              </div>
            </div>

            {/* Service Details */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Service Details</h3>

              <div className="border border-gray-300 rounded-xl shadow-xs p-3 mb-3 bg-sky-50">
                <p className="font-medium text-sm mb-1 flex items-center gap-1"><LiaHotelSolid className="text-blue-700"/> Hotel</p>
                <div className="flex justify-between text-xs">
                  <div>
                    <p className="text-gray-500">Service</p>
                    <p>Le Meurice Paris</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Confirmation</p>
                    <p>HTL-LMP-12345</p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-300 rounded-xl shadow-xs p-3 mb-3 bg-sky-50">
                <p className="font-medium text-sm mb-1 flex items-center gap-1 "><MdOutlineFlight className="text-blue-700"/>Flight</p>
                <div className="flex justify-between text-xs">
                  <div>
                    <p className="text-gray-500">Service</p>
                    <p>Air France AF-226</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Confirmation</p>
                    <p>FLT-AF-67890</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Options */}
            <div className="mt-4 mb-4">
              <h3 className="text-sm font-semibold mb-2">Download Options</h3>

              <div className=" border border-gray-300 rounded-xl shadow-xs p-3 mb-2 flex items-start gap-2">
                <input type="radio" defaultChecked />
                <div>
                  <p className="text-xs font-medium">With Branding</p>
                  <p className="text-[10px] text-gray-500">
                    Include company logo
                  </p>
                </div>
              </div>

              <div className="border border-gray-300 rounded-xl p-3 flex items-start gap-2">
                <input type="radio" />
                <div>
                  <p className="text-xs font-medium">Without Branding</p>
                  <p className="text-[10px] text-gray-500">
                    Clean version
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-4 py-3 border-t  border-gray-300 ">
            <p className="text-[10px] text-gray-500">
              Voucher will include branding
            </p>

            <div className="flex gap-4">
              <button onClick={onClose} className="px-10 py-1.5 border border-gray-300 cursor-pointer rounded-xl text-xs text-gray-600">
                Close
              </button>
              <button className="px-10 py-1.5 bg-green-600 text-white cursor-pointer rounded-xl flex items-center gap-1 text-xs">
                <Download size={14} />
                Download
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VoucherPreviewModal;