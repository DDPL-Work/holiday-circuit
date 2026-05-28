import React, { useEffect, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { RotatingLines } from "react-loader-spinner";
import API from "../utils/Api.js";
import Swal from "sweetalert2";

const DmcBulkUploadModal = ({ isOpen, onClose }) => {
  const [show, setShow] = useState(false);
  const [render, setRender] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("hotel");

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setTimeout(() => {
        setShow(true);
      }, 10);
    } else {
      setShow(false);
      setTimeout(() => {
        setRender(false);
      }, 300);
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      // 🔵 Loading popup
      Swal.fire({
        title: "Uploading...",
        text: "Please wait while your file is being processed",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const response = await API.post("/dmc/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // 🟢 Success popup
      Swal.fire({
        title: "Upload Successful!",
        text: `Uploaded By: ${response.data.uploadedBy}`,
        icon: "success",
        iconColor: "#107c41",
        background: "#ffffff",
        customClass: {
          popup: "rounded-3xl border border-slate-100 shadow-2xl p-6 font-sans bg-white",
          title: "text-xl font-bold bg-gradient-to-r from-[#0b1e36] to-[#107c41] bg-clip-text text-transparent mb-1",
          htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed"
        }
      });

      setFile(null);
      setFileName("");
      onClose();

    } catch (err) {
      console.error(err);

      // 🔴 Error popup
      Swal.fire({
        title: "Upload Failed",
        text: err.response?.data?.message || "Something went wrong. Please try again.",
        icon: "error",
        iconColor: "#ef4444",
        background: "#ffffff",
        customClass: {
          popup: "rounded-3xl border border-slate-100 shadow-2xl p-6 font-sans bg-white",
          title: "text-xl font-bold text-rose-600 mb-1",
          htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed"
        }
      });

    } finally {
      setLoading(false);
    }
  };

  if (!render) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* MODAL */}
      <div
        className={`relative bg-white w-120 rounded-2xl shadow-2xl p-6 overflow-hidden border border-slate-100
        transition-all duration-300
        ${
          show
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-6"
        }`}
      >
        {/* Top Gradient Accent Border */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0b1e36] via-[#0e4e2c] to-[#107c41]" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold bg-gradient-to-r from-[#0b1e36] to-[#107c41] bg-clip-text text-transparent">
          Bulk Upload Inventory
        </h2>
        <p className="text-xs text-gray-500 mt-1 mb-5 leading-normal">
          Upload hotel rates, transport options, or package inventories via Excel or CSV file
        </p>

        {/* CATEGORY */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-700 block mb-2">
            Inventory Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm outline-none transition-all cursor-pointer"
          >
            <option value="hotel">Hotel Rates</option>
            <option value="transport">Transport & Transfers</option>
            <option value="package">Package Tours</option>
            <option value="activity">Activities & Excursions</option>
            <option value="sightseeing">Sightseeing</option>
          </select>
        </div>

        {/* FILE UPLOAD */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-700 block mb-2">
            Upload File
          </label>
          <div
            className={`border-2 border-dashed rounded-xl h-36 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
              fileName 
                ? "border-emerald-400 bg-emerald-50/20 text-emerald-700 hover:bg-emerald-50/30" 
                : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:border-[#0b1e36]"
            }`}
          >
            {!loading && (
              <>
                <UploadCloud 
                  size={30} 
                  className={`mb-1.5 transition-colors duration-200 ${
                    fileName ? "text-emerald-500" : "text-slate-400"
                  }`} 
                />
                <p className="text-sm font-semibold">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Excel (.xlsx, .xls) or CSV files only
                </p>

                {fileName && (
                  <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-1 text-center max-w-[85%] truncate">
                    <p className="text-[11px] font-bold text-emerald-700 truncate" title={fileName}>
                      {fileName}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* UNIQUE LOADER */}
            {loading && (
              <div className="flex flex-col items-center gap-3">
                <RotatingLines
                  visible={true}
                  height="40"
                  width="40"
                  strokeColor="#0b1e36"
                  strokeWidth="4"
                  animationDuration="0.75"
                  ariaLabel="rotating-lines-loading"
                />
                <p className="text-sm text-slate-700 font-semibold">
                  Processing file...
                </p>
              </div>
            )}
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 duration-150 cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={!fileName || loading}
            className={`px-5 py-2 text-xs font-bold rounded-xl text-white transition-all duration-200 active:scale-95 cursor-pointer ${
              fileName && !loading
                ? "bg-gradient-to-r from-[#0b1e36] to-[#1d3d63] hover:from-[#132d52] hover:to-[#234b7a] shadow-[0_2px_8px_rgba(11,30,54,0.25)] hover:shadow-[0_4px_12px_rgba(11,30,54,0.35)]"
                : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200"
            }`}
          >
            Upload & Process
          </button>
        </div>
      </div>
    </div>
  );
};

export default DmcBulkUploadModal;
