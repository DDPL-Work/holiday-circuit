import {Download,Upload,Box,Truck,CheckCircle,AlertCircle,FileSpreadsheet,Calendar,Trash2,Eye,Edit,Save,X} from "lucide-react";
import DmcBulkUploadModal from "../../modal/DmcBulkUploadModal";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import API from "../../utils/Api.js"
import { AnimatePresence, motion } from "framer-motion";

export default function ContractedRates() {
const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
const [uploads, setUploads] = useState([]);
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 8;

const [selectedSheet, setSelectedSheet] = useState(null);
const [editingRowIndex, setEditingRowIndex] = useState(null);
const [editRowData, setEditRowData] = useState({});
const [viewLoading, setViewLoading] = useState(false);

const handleViewData = async (id) => {
  try {
    setViewLoading(true);
    const res = await API.get(`/dmc/upload/view/${id}`);
    if (res.data.success) {
      setSelectedSheet({ ...res.data, uploadId: id });
      setEditingRowIndex(null);
    } else {
      Swal.fire({
        title: "Error",
        text: res.data.message || "Failed to load sheet data",
        icon: "error",
        iconColor: "#ef4444",
        background: "#ffffff",
        customClass: {
          popup: "rounded-3xl border border-slate-100 shadow-2xl p-6 font-sans bg-white",
          title: "text-xl font-bold text-rose-600 mb-1",
          htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed"
        }
      });
    }
  } catch (error) {
    console.error("View sheet error:", error);
    Swal.fire({
      title: "Error",
      text: error.response?.data?.message || "Failed to load sheet data",
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
    setViewLoading(false);
  }
};

const startEditingRow = (index, row) => {
  setEditingRowIndex(index);
  setEditRowData({ ...row });
};

const handleCellChange = (header, value) => {
  setEditRowData((prev) => ({
    ...prev,
    [header]: value
  }));
};

const saveEditedRow = async (index) => {
  if (!selectedSheet) return;
  
  try {
    const row = editRowData;
    const uploadId = selectedSheet.uploadId;
    
    // Call the database patch API to update the Excel file and trigger notifications
    const res = await API.patch(`/dmc/upload/edit-row/${uploadId}`, {
      rowIndex: index,
      updatedRow: row,
      category: selectedSheet.category,
      fileName: selectedSheet.fileName
    });

    if (res.data.success) {
      const updatedRows = [...selectedSheet.rows];
      updatedRows[index] = { ...editRowData };
      
      setSelectedSheet({
        ...selectedSheet,
        rows: updatedRows
      });
      
      setEditingRowIndex(null);
      
      Swal.fire({
        title: "Success",
        text: "Spreadsheet updated and managers notified successfully!",
        icon: "success",
        iconColor: "#107c41",
        timer: 2500,
        showConfirmButton: false,
        background: "#ffffff",
        customClass: {
          popup: "rounded-3xl border border-slate-100 shadow-2xl p-6 font-sans bg-white",
          title: "text-xl font-bold bg-gradient-to-r from-[#0b1e36] to-[#107c41] bg-clip-text text-transparent mb-1",
          htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed"
        }
      });
    } else {
      Swal.fire({
        title: "Error",
        text: res.data.message || "Failed to save row changes",
        icon: "error",
        iconColor: "#ef4444",
        background: "#ffffff",
        customClass: {
          popup: "rounded-3xl border border-slate-100 shadow-2xl p-6 font-sans bg-white",
          title: "text-xl font-bold text-rose-600 mb-1",
          htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed"
        }
      });
    }
  } catch (error) {
    console.error("Save row error:", error);
    Swal.fire({
      title: "Error",
      text: error.response?.data?.message || "Failed to save row changes on server",
      icon: "error",
      iconColor: "#ef4444",
      background: "#ffffff",
      customClass: {
        popup: "rounded-3xl border border-slate-100 shadow-2xl p-6 font-sans bg-white",
        title: "text-xl font-bold text-rose-600 mb-1",
        htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed"
      }
    });
  }
};

const cancelEditingRow = () => {
  setEditingRowIndex(null);
  setEditRowData({});
};



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
    iconColor: "#f43f5e",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
    background: "#ffffff",
    customClass: {
      popup: "rounded-3xl border border-slate-100 shadow-2xl p-6 font-sans bg-white",
      title: "text-lg font-bold text-slate-800 mb-1.5",
      htmlContainer: "text-xs font-semibold text-slate-500 mb-4",
      confirmButton: "rounded-xl px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-xs font-bold text-white shadow-md active:scale-95 duration-150 transition-all cursor-pointer",
      cancelButton: "rounded-xl px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-205 text-xs font-semibold text-slate-700 active:scale-95 duration-150 transition-all ml-2 cursor-pointer"
    },
    buttonsStyling: false
  });

  if (!result.isConfirmed) return;

  try {
    await API.delete(`/dmc/upload/${id}`);

    setUploads((prev) => prev.filter((item) => item._id !== id));

    Swal.fire({
      title: "Deleted!",
      text: "Upload has been removed successfully.",
      icon: "success",
      iconColor: "#107c41",
      timer: 1500,
      showConfirmButton: false,
      background: "#ffffff",
      customClass: {
        popup: "rounded-3xl border border-slate-100 shadow-2xl p-6 font-sans bg-white",
        title: "text-xl font-bold bg-gradient-to-r from-[#0b1e36] to-[#107c41] bg-clip-text text-transparent mb-1",
        htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed"
      }
    });

  } catch (error) {
    console.error(error); 
    Swal.fire({
      title: "Error",
      text: error.response?.data?.message || "Something went wrong while deleting.",
      icon: "error",
      iconColor: "#ef4444",
      background: "#ffffff",
      customClass: {
        popup: "rounded-3xl border border-slate-100 shadow-2xl p-6 font-sans bg-white",
        title: "text-xl font-bold text-rose-600 mb-1",
        htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed"
      }
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

    <div className="min-h-screen bg-gray-50 py-1">
      {/* TITLE + BUTTONS */}
      <div className="mb-7 border border-gray-200 bg-white px-6 py-5 shadow-sm rounded-xl">
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
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-[#0b1e36] to-[#107c41] hover:from-[#132d52] hover:to-[#16914d] hover:shadow-[0_4px_12px_rgba(16,124,65,0.25)] transition-all duration-300 font-semibold active:scale-95 cursor-pointer"
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

<div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">

  <h3 className="text-lg font-semibold mb-4 text-gray-800">
    Recent Uploads
  </h3>

  <div className="w-full overflow-x-auto">

    <table className="w-full text-sm">

      {/* HEADER */}
      <thead>
        <tr className="bg-gray-50 text-gray-500 text-[11px] border-b border-gray-200">
          <th className="text-left px-2 py-3.5 font-bold rounded-l-lg whitespace-nowrap">File Name</th>
          <th className="text-center px-2 py-3.5 font-bold whitespace-nowrap">Category</th>
          <th className="text-center px-2 py-3.5 font-bold whitespace-nowrap">Uploaded By</th>
          <th className="text-center px-2 py-3.5 font-bold whitespace-nowrap">Date</th>
          <th className="text-center px-2 py-3.5 font-bold whitespace-nowrap">Records</th>
          <th className="text-center px-2 py-3.5 font-bold whitespace-nowrap">Status</th>
          <th className="text-end px-3 py-3.5 font-bold rounded-r-lg whitespace-nowrap">Actions</th>
        </tr>
      </thead>

      <tbody>

        {paginatedUploads.map((item, index) => (

          <tr
            key={item._id || index}
            className="bg-white border-b border-gray-200 rounded-xl shadow-xs hover:bg-gray-100 transition"
          >

            {/* FILE */}
            <td className="px-2 py-4 font-medium text-[12px] whitespace-nowrap truncate max-w-[170px]">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="text-green-500 shrink-0" size={16} />
                <span className="truncate" title={item.fileName}>{item.fileName}</span>
              </div>
            </td>

            {/* CATEGORY */}
            <td className="text-center px-2 py-4 whitespace-nowrap">
              <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize">
                {item.category}
              </span>
            </td>

            {/* USER */}
            <td className="text-center px-2 py-4 text-[12px] text-gray-600 whitespace-nowrap font-medium">
              {item.uploadedBy}
            </td>

            {/* DATE */}
            <td className="text-center px-2 py-4 whitespace-nowrap">
              <div className="flex items-center text-[11px] justify-center gap-1.5 text-gray-600">
                <Calendar size={13} className="text-slate-400" />
                <span>{new Date(item.updatedAt).toLocaleDateString('en-GB')}</span>
              </div>
            </td>

            {/* RECORDS */}
            <td className="text-center px-2 py-4 font-semibold text-gray-750 text-[12px] whitespace-nowrap">
              {item.records}
            </td>

            {/* STATUS */}
            <td className="text-center px-2 py-4 whitespace-nowrap">
              {item.status === "success" ? (
                <CheckCircle className="text-green-500 mx-auto" size={16} />
              ) : (
                <AlertCircle className="text-yellow-500 mx-auto" size={16} />
              )}
            </td>

            {/* ACTIONS */}
            <td className="text-end px-3 py-4 text-xs whitespace-nowrap">
              <div className="flex justify-end items-center gap-3">
                <Eye
                  size={16}
                  onClick={() => handleViewData(item._id)}
                  className="cursor-pointer text-blue-500 hover:text-blue-600 transition-colors"
                  title="Show Sheet Data"
                />
                <Download
                  size={16}
                  onClick={() => handleDownload(item._id, item.fileName)}
                  className="cursor-pointer text-slate-500 hover:text-slate-800 transition-colors"
                  title="Download File"
                />
                <Trash2
                  size={16}
                  onClick={() => handleDelete(item._id)}
                  className="cursor-pointer text-red-500 hover:text-red-600 transition-colors"
                  title="Delete Upload"
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


      {/* EXCEL SHEET VIEWER MODAL */}
      <AnimatePresence>
        {selectedSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedSheet(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border border-slate-200"
            >
              {/* Excel Header Ribbon */}
              <div className="bg-gradient-to-r from-[#0b1e36] via-[#0e4e2c] to-[#107c41] text-white px-5 py-3.5 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={24} className="text-white shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold tracking-wide text-white drop-shadow-sm">
                      {selectedSheet.fileName}
                    </h3>
                    <p className="text-[10px] text-emerald-100 uppercase tracking-widest font-semibold mt-0.5">
                      Category: {selectedSheet.category} | Excel Spreadsheet Preview
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSheet(null)}
                  className="p-1.5 rounded-lg bg-black/20 hover:bg-rose-600/90 text-white transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Spreadsheet Table Grid */}
              <div className="flex-1 overflow-auto p-4 bg-[#f3f2f1]">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm max-h-[calc(90vh-100px)] overflow-auto custom-scroll">
                  <table className="min-w-max border-collapse text-[11px] font-sans w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#f3f2f1] border-b border-slate-300">
                        {/* Row Index Column Header */}
                        <th className="w-10 bg-[#e1dfdd] border-r border-slate-300 py-2.5 text-center text-slate-500 font-bold select-none whitespace-nowrap"></th>
                        
                        {/* Dynamic Headers */}
                        {selectedSheet.headers.map((header) => {
                          const isDesc = String(header || "").toLowerCase().includes("desc");
                          return (
                            <th
                              key={header}
                              className={`px-4 py-2.5 text-left text-slate-700 font-bold border-r border-slate-300 uppercase tracking-wider bg-[#f3f2f1] select-none whitespace-nowrap ${
                                isDesc ? "min-w-[320px] max-w-[450px]" : "min-w-[130px]"
                              }`}
                            >
                              {header}
                            </th>
                          );
                        })}
                        
                        {/* Actions Column Header */}
                        <th className="px-4 py-2.5 text-center text-slate-700 font-bold min-w-[120px] bg-[#f3f2f1] select-none whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSheet.rows.length ? (
                        selectedSheet.rows.map((row, index) => {
                          const isEditing = editingRowIndex === index;
                          return (
                            <tr
                              key={row._id || index}
                              className={`border-b border-slate-200 hover:bg-slate-50/50 transition-colors ${
                                isEditing ? "bg-blue-50/30" : ""
                              }`}
                            >
                              {/* Row Index */}
                              <td className="bg-[#f3f2f1] border-r border-slate-300 text-center text-slate-500 font-semibold select-none py-2">
                                {index + 1}
                              </td>

                              {/* Data Cells */}
                              {selectedSheet.headers.map((header) => {
                                const isDesc = String(header || "").toLowerCase().includes("desc");
                                return (
                                  <td
                                    key={header}
                                    className={`px-4 py-2 border-r border-slate-300 text-slate-800 font-medium ${
                                      isDesc 
                                        ? "min-w-[320px] max-w-[450px] whitespace-normal break-words py-3 leading-normal align-top text-left" 
                                        : "whitespace-nowrap"
                                    }`}
                                  >
                                    {isEditing ? (
                                      isDesc ? (
                                        <textarea
                                          rows={3}
                                          value={editRowData[header] !== undefined ? editRowData[header] : ""}
                                          onChange={(e) => handleCellChange(header, e.target.value)}
                                          className="w-full border border-blue-500 px-2 py-1 text-[11px] rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-400 min-h-[60px]"
                                        />
                                      ) : (
                                        <input
                                          type="text"
                                          value={editRowData[header] !== undefined ? editRowData[header] : ""}
                                          onChange={(e) => handleCellChange(header, e.target.value)}
                                          className="w-full border border-blue-500 px-2 py-1 text-[11px] rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        />
                                      )
                                    ) : (
                                      String(row[header] !== undefined ? row[header] : "")
                                    )}
                                  </td>
                                );
                              })}

                               {/* Actions Cell */}
                               <td className="px-4 py-2 text-center">
                                 <div className="flex items-center justify-center gap-2">
                                   {isEditing ? (
                                     <>
                                       <button
                                         onClick={() => saveEditedRow(index)}
                                         className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-750 text-white shadow-[0_2px_4px_rgba(16,124,65,0.2)] hover:shadow-[0_4px_8px_rgba(16,124,65,0.3)] px-2.5 py-1 rounded-md transition-all font-bold text-[11px] active:scale-95 duration-150 cursor-pointer"
                                         title="Save Changes"
                                       >
                                         <Save size={12} />
                                         Save
                                       </button>
                                       <button
                                         onClick={cancelEditingRow}
                                         className="inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-[0_2px_4px_rgba(244,63,94,0.2)] hover:shadow-[0_4px_8px_rgba(244,63,94,0.3)] px-2.5 py-1 rounded-md transition-all font-bold text-[11px] active:scale-95 duration-150 cursor-pointer"
                                         title="Cancel"
                                       >
                                         <X size={12} />
                                         Cancel
                                       </button>
                                     </>
                                   ) : (
                                     <button
                                       onClick={() => startEditingRow(index, row)}
                                       className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#0b1e36] to-[#107c41] hover:from-[#132d52] hover:to-[#16914d] text-white shadow-[0_2px_4px_rgba(11,30,54,0.2)] hover:shadow-[0_4px_8px_rgba(16,124,65,0.3)] px-3 py-1.5 rounded-md transition-all font-bold text-[11px] active:scale-95 duration-150 cursor-pointer"
                                       title="Edit Row"
                                     >
                                       <Edit size={12} />
                                       Edit
                                     </button>
                                   )}
                                 </div>
                               </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={selectedSheet.headers.length + 2}
                            className="px-4 py-12 text-center text-sm text-slate-400 font-medium"
                          >
                            No spreadsheet rows found in this file.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

</div>
  );
}
