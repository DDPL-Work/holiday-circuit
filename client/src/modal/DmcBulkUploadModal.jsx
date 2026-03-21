import React, { useEffect, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { RotatingLines } from "react-loader-spinner";
// import toast from "react-hot-toast";
import API from "../utils/Api.js"
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
    console.log("upload", response)

    // 🟢 Success popup
    Swal.fire({
      title: "Upload Successful!",
      text: `Uploaded By: ${response.data.uploadedBy}`,
      icon: "success",
    });

    setFile(null);
    setFileName("");
    onClose();

  } catch (err) {
    console.error(err);

    // 🔴 Error popup
    Swal.fire({
      title: "Upload Failed",
      text:
        err.response?.data?.message ||
        "Something went wrong. Please try again.",
      icon: "error",
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
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* MODAL */}
      <div
        className={`relative bg-white w-120 rounded-xl shadow-xl p-6
        transition-all duration-300
        ${
          show
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-6"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-black"
        >
          <X size={18} />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          Bulk Upload Inventory
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">
          Upload hotel rates, transport options, or package inventories via
          Excel or CSV file
        </p>
        {/* CATEGORY */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Inventory Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Upload File
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl h-36 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 relative">
            {!loading && (
              <>
                <UploadCloud size={28} className="mb-1 text-gray-400" />
                <p className="text-sm">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400">
                  Excel (.xlsx, .xls) or CSV files only
                </p>

                {fileName && (
                  <p className="text-xs text-green-600 mt-2">{fileName}</p>
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
                  strokeColor="#2563eb"
                  strokeWidth="4"
                  animationDuration="0.75"
                  ariaLabel="rotating-lines-loading"
                />

                <p className="text-sm text-blue-700 font-medium">
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
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
           onClick={handleUpload}
            disabled={!fileName || loading}
            className={`px-4 py-2 text-sm rounded-xl text-white cursor-pointer ${
              fileName && !loading
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-300 cursor-not-allowed"
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
