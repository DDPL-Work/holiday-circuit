import {Download,Upload,Box,Truck,CheckCircle,AlertCircle,FileSpreadsheet,Calendar,Trash2} from "lucide-react";
import DmcBulkUploadModal from "../../modal/DmcBulkUploadModal";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import API from "../../utils/Api.js"

export default function ContractedRates() {
const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
const [uploads, setUploads] = useState([]);
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 8;



useEffect(() => {
 fetchUploads();

}, []);

useEffect(() => {
 setCurrentPage(1);
}, [uploads.length]);

const fetchUploads = async () => {
 try {
  const res = await API.get("/dmc/bulk-upload-history");
  console.log("getBulk", res)
 setUploads(res.data.uploads);
 } catch (error) {
  console.error("Upload fetch error:", error);
 }
};



const handleDelete = async (id) => {
  const result = await Swal.fire({
    title: "Delete this upload?",
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#ef4444",
  });

  if (!result.isConfirmed) return;

  try {
    await API.delete(`/dmc/upload/${id}`);

    setUploads((prev) => prev.filter((item) => item._id !== id));

    Swal.fire({
      title: "Deleted!",
      text: "Upload has been removed successfully.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });

  } catch (error) {
  console.error(error); 
  Swal.fire({
    title: "Error",
    text: error.response?.data?.message || "Something went wrong while deleting.",
    icon: "error",
  });
}
};


const handleDownload = async (id, fileName) => {
  try {
    const res = await API.get(`/dmc/upload/download/${id}`, {
      responseType: "blob", // 🔥 IMPORTANT
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", fileName || "file.xlsx");

    document.body.appendChild(link);
    link.click();
    link.remove();

  } catch (error) {
    console.error("Download error:", error);
    Swal.fire({
      title: "Error",
      text: "Download failed",
      icon: "error",
    });
  }
};

const totalPages = Math.ceil(uploads.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const paginatedUploads = uploads.slice(startIndex, startIndex + itemsPerPage);


  return (

    <div className="min-h-screen bg-gray-50 px-5 py-2">
      {/* TITLE + BUTTONS */}
      <div className="sticky top-0 z-30 -mx-6 mb-7 border-b border-gray-200 bg-gray-50 px-6 py-4 shadow-sm rounded-xl">
  <div className="flex items-center justify-between gap-4 ">
  <div>
    <h2 className="text-lg font-bold text-gray-800">
      Contracted Rates & Inventory
    </h2>
    <p className="text-sm text-gray-500">
      Manage hotel rates, transport, and package inventories
    </p>
  </div>

  <div className="flex gap-3">
    <button className="flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-lg text-sm bg-white cursor-pointer">
      <Download size={16} />
      Download Template   
    </button>

    <button
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white bg-slate-800 cursor-pointer"
      onClick={() => setShowBulkUploadModal(true)}
    >
      <Upload size={16} />
      Bulk Upload
    </button>
  </div>
  </div>
</div>

{/*======================================= STATS Cards ===================================== */}

      <div className="grid grid-cols-4 gap-2.5 mb-7 ">

        <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center border border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Total Hotels</p>
            <p className="text-xl font-semibold">1,248</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-lg">
            <Box className="text-purple-600" size={20} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center border border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Transport Options</p>
            <p className="text-xl font-semibold">456</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <Truck className="text-blue-600" size={20} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center border border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Active Contracts</p>
            <p className="text-xl font-semibold">892</p>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <CheckCircle className="text-green-600" size={20} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center border border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Expiring Soon</p>
            <p className="text-xl font-semibold">34</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-lg">
            <AlertCircle className="text-yellow-600" size={20} />
          </div>
        </div>

      </div>

{/*===================================== RECENT UPLOADS SECTION START ======================================== */}

<div className="bg-white rounded-xl p-">

  <h3 className="text-lg font-semibold mb-5 text-gray-800">
    Recent Uploads
  </h3>

  <div className="w-full max-h-100 overflow-y-auto custom-scroll">

    <table className="w-full text-sm">

      {/* HEADER */}
      <thead>
        <tr className="bg-gray-50 text-gray-500 text-xs border-b border-gray-200">
          <th className="text-left px-3 py-3 font-bold rounded-l-lg ">File Name</th>
          <th className="text-center px-5 py-3 font-bold">Category</th>
          <th className="text-center px- py-3 font-bold">Uploaded By</th>
          <th className="text-center px-5 py-3 font-bold">Date</th>
          <th className="text-center px-5 py-3 font-bold">Records</th>
          <th className="text-center px-5 py-3 font-bold">Status</th>
          <th className="text-end px-5 py-3 font-bold rounded-r-lg">Actions</th>
        </tr>
      </thead>

      <tbody >

        {paginatedUploads.map((item, index) => (

          <tr
            key={item._id || index}
            className="bg-white border-b border-gray-200 rounded-xl shadow-xs hover:bg-gray-100 transition "
          >

            {/* FILE */}
            <td className="px-3 py-5 flex items-left gap-2 font-medium text-[13px] ">
              <FileSpreadsheet className="text-green-500" size={18} />
              {item.fileName}
            </td>

            {/* CATEGORY */}
            <td className="text-center px-1 py-5">
              <span className="bg-gray-100 text-gray-700 text-[10px] px-2  py-1 rounded-md">
                {item.category}
              </span>
            </td>

            {/* USER */}
            <td className="text-center px-4 py-5 text-xs text-gray-600">
              {item.uploadedBy}
            </td>

            {/* DATE */}
            <td className="text-center px-4 py-5">
              <div className="flex items-center text-xs justify-center gap-2 text-gray-600">
                <Calendar size={15} />
                 {new Date(item.updatedAt).toLocaleDateString('en-GB')} 
              </div>
            </td>

            {/* RECORDS */}
            <td className="text-center px-4 py-5 font-medium text-gray-700">
              {item.records}
            </td>

            {/* STATUS */}
            <td className="text-center px-4 py-5">
              {item.status === "success" ? (
                <CheckCircle className="text-green-500 mx-auto" size={17} />
              ) : (
                <AlertCircle className="text-yellow-500 mx-auto" size={17} />
              )}
            </td>

            {/* ACTIONS */}
            <td className="text-end px-3 py-5 text-xs">
              <div className="flex justify-center gap-4 text-xs">
                <Download
                  size={17}
                onClick={() => handleDownload(item._id, item.fileName)}
                  className="cursor-pointer text-gray-500 hover:text-black"
                />
                <Trash2
                  size={17}
                  onClick={() => handleDelete(item._id)}
                  className="cursor-pointer text-red-500 hover:text-red-600"
                />
              </div>
            </td>

          </tr>

        ))}

      </tbody>

    </table>

  </div>

  {totalPages > 1 && (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:flex-row">
      <span className="text-xs font-medium text-gray-500">
        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, uploads.length)} of {uploads.length} entries
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {Array.from({ length: totalPages }).map((_, index) => {
            if (
              totalPages > 5 &&
              index !== 0 &&
              index !== totalPages - 1 &&
              Math.abs(currentPage - 1 - index) > 1
            ) {
              if (index === 1 && currentPage > 3) {
                return <span key={index} className="px-1 text-gray-400">...</span>;
              }
              if (index === totalPages - 2 && currentPage < totalPages - 2) {
                return <span key={index} className="px-1 text-gray-400">...</span>;
              }
              return null;
            }

            return (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                  currentPage === index + 1
                    ? "bg-slate-900 text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )}

</div>

 <DmcBulkUploadModal isOpen={showBulkUploadModal} onClose={() => setShowBulkUploadModal(false)}/>

</div>
  );
}
