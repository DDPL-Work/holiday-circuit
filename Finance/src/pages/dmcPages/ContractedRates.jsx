import {
  Download,
  Upload,
  Box,
  Truck,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Calendar,
  Trash2,
  Eye,
  Edit,
  Save,
  Search,
  X,
  Building2,
  Compass,
  Bus,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  ShieldCheck,
  FileText,
  Layers,
  Sparkles,
  Star,
} from "lucide-react";
import DmcBulkUploadModal from "../../modal/DmcBulkUploadModal";
import Swal from "sweetalert2";
import { useEffect, useMemo, useState, useRef } from "react";
import API from "../../utils/Api.js";
import { AnimatePresence, motion } from "framer-motion";

const rateChangeReasonOptions = [
  { value: "blackout", label: "Blackout / Event Date" },
  { value: "dynamic_pricing", label: "Dynamic Pricing" },
  { value: "availability", label: "Availability Constraint" },
  { value: "supplier_revision", label: "Supplier Revision" },
  { value: "other", label: "Other" },
];

const rateSensitiveFieldPatterns = [
  /price/i,
  /rate/i,
  /currency/i,
  /valid\s*from/i,
  /valid\s*to/i,
  /availability/i,
  /blackout/i,
  /inventory/i,
  /allotment/i,
  /stock/i,
  /surcharge/i,
];

const isRateSensitiveHeader = (header = "") =>
  rateSensitiveFieldPatterns.some((pattern) => pattern.test(String(header || "")));

const getRateSensitiveChanges = (originalRow = {}, editedRow = {}) =>
  Object.keys(editedRow || {}).filter((header) => {
    if (!isRateSensitiveHeader(header)) return false;
    const oldValue = String(originalRow?.[header] ?? "").trim();
    const newValue = String(editedRow?.[header] ?? "").trim();
    return oldValue !== newValue;
  });

const getColumnLetter = (colIndex) => {
  let letter = "";
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter || "A";
};

const TABS = [
  { id: "all", label: "All", icon: Box, color: "slate" },
  { id: "hotel", label: "Hotel", icon: Building2, color: "purple" },
  { id: "activity", label: "Activity", icon: Compass, color: "emerald" },
  { id: "transport", label: "Transport", icon: Bus, color: "blue" },
];

const normalizeCategory = (cat) => {
  const c = String(cat || "").toLowerCase().trim();
  if (c === "sightseeing") return "activity";
  return c;
};

export default function ContractedRates() {
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const itemsPerPage = 8;

  // Excel Modal States
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [activeWorkbookSheet, setActiveWorkbookSheet] = useState("");
  const [selectedCell, setSelectedCell] = useState({
    row: 1,
    col: 0,
    colLetter: "A",
    key: "Service Name",
    label: "Service Name",
    value: "",
  });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isMaximized, setIsMaximized] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editRowData, setEditRowData] = useState({});
  const [viewLoading, setViewLoading] = useState(false);
  const [sheetSearchQuery, setSheetSearchQuery] = useState("");
  const [rateChangeReasonType, setRateChangeReasonType] = useState("");
  const [rateChangeReasonNote, setRateChangeReasonNote] = useState("");
  const [sheetPage, setSheetPage] = useState(1);
  const sheetItemsPerPage = 50;

  const formulaInputRef = useRef(null);

  useEffect(() => {
    if (!selectedSheet) {
      setSheetSearchQuery("");
      setEditingRowIndex(null);
      setEditRowData({});
      setRateChangeReasonType("");
      setRateChangeReasonNote("");
      setSheetPage(1);
      setActiveWorkbookSheet("");
      setZoomLevel(100);
      setIsMaximized(false);
      setSelectedCell({ row: 1, col: 0, colLetter: "A", key: "", label: "", value: "" });
    }
  }, [selectedSheet]);

  useEffect(() => {
    setSheetPage(1);
  }, [sheetSearchQuery, activeWorkbookSheet]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const filteredUploads = useMemo(() => {
    if (activeTab === "all") return uploads;
    return uploads.filter((item) => normalizeCategory(item.category) === activeTab.toLowerCase());
  }, [uploads, activeTab]);

  // Resolve current active sheet data
  const currentSheetData = useMemo(() => {
    if (!selectedSheet) return null;
    if (selectedSheet.sheets && activeWorkbookSheet && selectedSheet.sheets[activeWorkbookSheet]) {
      return selectedSheet.sheets[activeWorkbookSheet];
    }
    return {
      sheetName: activeWorkbookSheet || selectedSheet.sheetNames?.[0] || "Sheet1",
      headers: selectedSheet.headers || [],
      columns: selectedSheet.columns || (selectedSheet.headers || []).map((h) => ({ key: h, label: h })),
      rows: selectedSheet.rows || [],
      bannerTitle: selectedSheet.bannerTitle || "",
      bannerSubtitle: selectedSheet.bannerSubtitle || "",
      headerRows: selectedSheet.headerRows,
      readOnlyPreview: selectedSheet.readOnlyPreview,
    };
  }, [selectedSheet, activeWorkbookSheet]);

  const filteredSheetRows = useMemo(() => {
    if (!currentSheetData || !currentSheetData.rows) return [];
    if (!sheetSearchQuery.trim()) return currentSheetData.rows;

    const query = sheetSearchQuery.toLowerCase().trim();
    const searchableHeaders = currentSheetData.columns?.length
      ? currentSheetData.columns.map((column) => column.key)
      : currentSheetData.headers || [];

    return currentSheetData.rows
      .map((row, index) => ({ ...row, originalIndex: index }))
      .filter((row) => {
        // Direct visible cell check
        const hasDirectMatch = searchableHeaders.some((header) => {
          const val = row[header];
          if (val === undefined || val === null) return false;
          return String(val).toLowerCase().includes(query);
        });

        if (hasDirectMatch) return true;

        // Context check (Service Name, City, Country, Hotel Name, Supplier)
        const contextFields = [
          row._serviceName,
          row._city,
          row._country,
          row._hotelName,
          row._supplierName,
        ];

        return contextFields.some((field) => {
          if (!field) return false;
          return String(field).toLowerCase().includes(query);
        });
      });
  }, [currentSheetData, sheetSearchQuery]);

  const paginatedSheetRows = useMemo(() => {
    const start = (sheetPage - 1) * sheetItemsPerPage;
    return filteredSheetRows.slice(start, start + sheetItemsPerPage);
  }, [filteredSheetRows, sheetPage, sheetItemsPerPage]);

  const totalSheetPages = Math.ceil(filteredSheetRows.length / sheetItemsPerPage);

  const handleViewData = async (id) => {
    try {
      setViewLoading(true);
      const res = await API.get(`/dmc/upload/view/${id}`);
      if (res.data.success) {
        const data = res.data;
        const initialSheetName = data.sheetNames?.[0] || "Hotel Data";
        setSelectedSheet({ ...data, uploadId: id });
        setActiveWorkbookSheet(initialSheetName);
        setEditingRowIndex(null);
        setRateChangeReasonType("");
        setRateChangeReasonNote("");
        setZoomLevel(100);

        const firstHeader = data.sheets?.[initialSheetName]?.headers?.[0] || data.headers?.[0] || "Service Name";
        const firstValue = data.sheets?.[initialSheetName]?.rows?.[0]?.[firstHeader] || data.rows?.[0]?.[firstHeader] || "";
        setSelectedCell({
          row: 1,
          col: 0,
          colLetter: "A",
          key: firstHeader,
          label: firstHeader,
          value: firstValue,
        });
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
            htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed",
          },
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
          htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed",
        },
      });
    } finally {
      setViewLoading(false);
    }
  };

  const handleSwitchTab = (sheetName) => {
    setActiveWorkbookSheet(sheetName);
    setSheetPage(1);
    setSheetSearchQuery("");
    setEditingRowIndex(null);
    const targetSheet = selectedSheet?.sheets?.[sheetName];
    const firstHeader = targetSheet?.headers?.[0] || "A1";
    setSelectedCell({
      row: 1,
      col: 0,
      colLetter: "A",
      key: firstHeader,
      label: firstHeader,
      value: targetSheet?.rows?.[0]?.[firstHeader] || "",
    });
  };

  const handleCellClick = (originalIndex, colIndex, headerKey, headerLabel, cellVal) => {
    setSelectedCell({
      row: originalIndex + 1,
      col: colIndex,
      colLetter: getColumnLetter(colIndex),
      key: headerKey,
      label: headerLabel || headerKey,
      value: cellVal !== undefined ? cellVal : "",
    });
  };

  const startEditingRow = (index, row) => {
    setEditingRowIndex(index);
    setEditRowData({ ...row });
    setRateChangeReasonType("");
    setRateChangeReasonNote("");
  };

  const handleCellChange = (header, value) => {
    setEditRowData((prev) => ({
      ...prev,
      [header]: value,
    }));
    setSelectedCell((prev) => ({
      ...prev,
      value,
    }));
  };

  const handleFormulaBarChange = (value) => {
    if (editingRowIndex !== null && selectedCell.key) {
      handleCellChange(selectedCell.key, value);
    } else {
      setSelectedCell((prev) => ({
        ...prev,
        value,
      }));
    }
  };

  const saveEditedRow = async (index) => {
    if (!selectedSheet) return;

    try {
      const row = editRowData;
      const uploadId = selectedSheet.uploadId;
      const originalRow = currentSheetData?.rows?.[index] || selectedSheet.rows?.[index] || {};
      const rateSensitiveChanges = getRateSensitiveChanges(originalRow, row);

      if (rateSensitiveChanges.length > 0 && !rateChangeReasonType) {
        Swal.fire({
          title: "Reason Required",
          text: "Please select a reason for updating rate-sensitive inventory values.",
          icon: "warning",
          iconColor: "#f59e0b",
          background: "#ffffff",
          customClass: {
            popup: "rounded-3xl border border-slate-100 shadow-2xl p-6 font-sans bg-white",
            title: "text-lg font-bold text-slate-800 mb-1",
            htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed",
          },
        });
        return;
      }

      const res = await API.put(`/dmc/upload/${uploadId}/row/${index}`, {
        row,
        sheetName: activeWorkbookSheet,
        reasonType: rateChangeReasonType,
        reasonNote: rateChangeReasonNote,
      });

      if (res.data.success) {
        const savedRow = res.data.row || row;
        setSelectedSheet((prev) => {
          if (!prev) return prev;
          const updatedSheets = { ...(prev.sheets || {}) };
          if (updatedSheets[activeWorkbookSheet]) {
            const sheetRows = [...(updatedSheets[activeWorkbookSheet].rows || [])];
            sheetRows[index] = savedRow;
            updatedSheets[activeWorkbookSheet] = {
              ...updatedSheets[activeWorkbookSheet],
              rows: sheetRows,
            };
          }
          const rootRows = [...(prev.rows || [])];
          rootRows[index] = savedRow;
          return {
            ...prev,
            sheets: updatedSheets,
            rows: rootRows,
          };
        });

        setEditingRowIndex(null);
        setRateChangeReasonType("");
        setRateChangeReasonNote("");

        Swal.fire({
          title: "Updated!",
          text: res.data.message || "Spreadsheet and live contracted rate updated successfully!",
          icon: "success",
          iconColor: "#107c41",
          timer: 2200,
          showConfirmButton: false,
          background: "#ffffff",
          customClass: {
            popup: "rounded-3xl border border-slate-100 shadow-2xl p-6 font-sans bg-white",
            title: "text-xl font-bold bg-gradient-to-r from-[#0b1e36] to-[#107c41] bg-clip-text text-transparent mb-1",
            htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed",
          },
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
            htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed",
          },
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
          htmlContainer: "text-xs font-semibold text-slate-500 leading-relaxed",
        },
      });
    }
  };

const cancelEditingRow = () => {
  setEditingRowIndex(null);
  setEditRowData({});
  setRateChangeReasonType("");
  setRateChangeReasonNote("");
};

useEffect(() => {
  fetchUploads();
}, []);

const fetchUploads = async () => {
  try {
    const res = await API.get("/dmc/bulk-upload-history");
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
      responseType: "blob",
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

const totalPages = Math.ceil(filteredUploads.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const paginatedUploads = filteredUploads.slice(startIndex, startIndex + itemsPerPage);
const currentEditingOriginalRow =
  editingRowIndex !== null && currentSheetData?.rows ? currentSheetData.rows[editingRowIndex] || {} : {};
const currentRateSensitiveChanges =
  editingRowIndex !== null ? getRateSensitiveChanges(currentEditingOriginalRow, editRowData) : [];
const isRateChangeReasonRequired = currentRateSensitiveChanges.length > 0;
const sheetColumns = currentSheetData?.columns?.length
  ? currentSheetData.columns
  : (currentSheetData?.headers || []).map((header) => ({ key: header, label: header }));
const hasGroupedHeaders = Array.isArray(currentSheetData?.headerRows) && currentSheetData.headerRows.length > 0;
const showSheetActions = currentSheetData ? !currentSheetData.readOnlyPreview && activeWorkbookSheet !== "Blackout Dates" : false;
const availableSheets = selectedSheet?.sheetNames?.length ? selectedSheet.sheetNames : ["Hotel Data", "Blackout Dates"];

const getTabCount = (tabId) => {
  if (tabId === "all") return uploads.length;
  return uploads.filter((item) => normalizeCategory(item.category) === tabId.toLowerCase()).length;
};

const tabColorClasses = {
  slate: {
    active: "bg-slate-900 text-white shadow-md shadow-slate-900/20",
    inactive: "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200",
    icon: "text-slate-400",
    activeIcon: "text-white",
    count: "bg-slate-100 text-slate-600",
    activeCount: "bg-white/20 text-white",
  },
  purple: {
    active: "bg-purple-600 text-white shadow-md shadow-purple-600/20",
    inactive: "bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-900 border border-slate-200 hover:border-purple-200",
    icon: "text-purple-400",
    activeIcon: "text-white",
    count: "bg-purple-100 text-purple-600",
    activeCount: "bg-white/20 text-white",
  },
  emerald: {
    active: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20",
    inactive: "bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 hover:border-emerald-200",
    icon: "text-emerald-400",
    activeIcon: "text-white",
    count: "bg-emerald-100 text-emerald-600",
    activeCount: "bg-white/20 text-white",
  },
  blue: {
    active: "bg-blue-600 text-white shadow-md shadow-blue-600/20",
    inactive: "bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-900 border border-slate-200 hover:border-blue-200",
    icon: "text-blue-400",
    activeIcon: "text-white",
    count: "bg-blue-100 text-blue-600",
    activeCount: "bg-white/20 text-white",
  },
  amber: {
    active: "bg-amber-600 text-white shadow-md shadow-amber-600/20",
    inactive: "bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-900 border border-slate-200 hover:border-amber-200",
    icon: "text-amber-400",
    activeIcon: "text-white",
    count: "bg-amber-100 text-amber-600",
    activeCount: "bg-white/20 text-white",
  },
};

  return (
    <div className="min-h-screen bg-gray-50 py-1">
      {/* HEADER */}
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
            onClick={() => setShowBulkUploadModal(true)}
          >
            <Upload size={15} />
            Bulk Upload
          </button>
        </div>
      </div>

      {/*======================================= STATS Cards ===================================== */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        <div className="group relative bg-gradient-to-br from-purple-50/60 to-white hover:from-purple-100/40 hover:to-purple-50/20 rounded-2xl p-5 flex justify-between items-center border border-purple-100/70 border-b-[3.5px] border-b-purple-500/80 hover:border-purple-300 hover:border-b-purple-600 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5 transition-all duration-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">Total Hotels</p>
            <p className="text-2xl font-extrabold tracking-tight text-slate-800 group-hover:text-purple-900 transition-colors duration-300">1,248</p>
          </div>
          <div className="bg-purple-50/80 border border-purple-100/50 p-2.5 rounded-xl text-purple-650 shadow-[0_2px_8px_rgba(147,51,234,0.05)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
            <Box size={20} className="stroke-[2.2px] text-purple-650" />
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-blue-50/60 to-white hover:from-blue-100/40 hover:to-blue-50/20 rounded-2xl p-5 flex justify-between items-center border border-blue-100/70 border-b-[3.5px] border-b-blue-500/80 hover:border-blue-300 hover:border-b-blue-600 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">Transport Options</p>
            <p className="text-2xl font-extrabold tracking-tight text-slate-800 group-hover:text-blue-900 transition-colors duration-300">456</p>
          </div>
          <div className="bg-blue-50/80 border border-blue-100/50 p-2.5 rounded-xl text-blue-650 shadow-[0_2px_8px_rgba(59,130,246,0.05)] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
            <Truck size={20} className="stroke-[2.2px] text-blue-650" />
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-emerald-50/60 to-white hover:from-emerald-100/40 hover:to-emerald-50/20 rounded-2xl p-5 flex justify-between items-center border border-emerald-100/70 border-b-[3.5px] border-b-emerald-500/80 hover:border-emerald-300 hover:border-b-emerald-600 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">Active Contracts</p>
            <p className="text-2xl font-extrabold tracking-tight text-slate-800 group-hover:text-emerald-900 transition-colors duration-300">892</p>
          </div>
          <div className="bg-emerald-50/80 border border-emerald-100/50 p-2.5 rounded-xl text-emerald-650 shadow-[0_2px_8px_rgba(16,185,129,0.05)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
            <CheckCircle size={20} className="stroke-[2.2px] text-emerald-650" />
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-amber-50/60 to-white hover:from-amber-100/40 hover:to-amber-50/20 rounded-2xl p-5 flex justify-between items-center border border-amber-100/70 border-b-[3.5px] border-b-amber-500/80 hover:border-amber-300 hover:border-b-amber-600 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5 transition-all duration-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">Expiring Soon</p>
            <p className="text-2xl font-extrabold tracking-tight text-slate-800 group-hover:text-amber-900 transition-colors duration-300">34</p>
          </div>
          <div className="bg-amber-50/80 border border-amber-100/50 p-2.5 rounded-xl text-amber-650 shadow-[0_2px_8px_rgba(245,158,11,0.05)] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
            <AlertCircle size={20} className="stroke-[2.2px] text-amber-655" />
          </div>
        </div>
      </div>

      {/*===================================== RECENT UPLOADS SECTION ======================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* RECENT UPLOADS SECTION HEADER WITH RIGHT SIDE CATEGORY STATUS TABS */}
        <div className="border-b border-gray-200 px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800 text-sm">Upload Records</h3>
            <span className="text-xs text-slate-400 font-normal">
              ({filteredUploads.length} files)
            </span>
          </div>

          {/* RIGHT SIDE CATEGORY STATUS TABS */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = getTabCount(tab.id);
              const TabIcon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <TabIcon size={13} className={isActive ? "text-emerald-600" : "text-slate-400"} />
                  <span>{tab.label}</span>
                  <span
                    className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TABLE */}
        <div className="p-4">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
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
                {paginatedUploads.length > 0 ? (
                  paginatedUploads.map((item, index) => (
                    <tr
                      key={item._id || index}
                      className="bg-white border-b border-gray-200 rounded-xl shadow-xs hover:bg-gray-100 transition"
                    >
                      <td className="px-2 py-4 font-medium text-[12px] whitespace-nowrap truncate max-w-[170px]">
                        <div className="flex items-center gap-1.5">
                          <FileSpreadsheet className="text-green-500 shrink-0" size={16} />
                          <span className="truncate" title={item.fileName}>{item.fileName}</span>
                        </div>
                      </td>
                      <td className="text-center px-2 py-4 whitespace-nowrap">
                        <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize">
                          {item.category}
                        </span>
                      </td>
                      <td className="text-center px-2 py-4 text-[12px] text-gray-600 whitespace-nowrap font-medium">
                        {item.uploadedBy}
                      </td>
                      <td className="text-center px-2 py-4 whitespace-nowrap">
                        <div className="flex items-center text-[11px] justify-center gap-1.5 text-gray-600">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{new Date(item.updatedAt).toLocaleDateString('en-GB')}</span>
                        </div>
                      </td>
                      <td className="text-center px-2 py-4 font-semibold text-gray-750 text-[12px] whitespace-nowrap">
                        {item.records}
                      </td>
                      <td className="text-center px-2 py-4 whitespace-nowrap">
                        {item.status === "success" ? (
                          <CheckCircle className="text-green-500 mx-auto" size={16} />
                        ) : (
                          <AlertCircle className="text-yellow-500 mx-auto" size={16} />
                        )}
                      </td>
                      <td className="text-end px-3 py-4 text-xs whitespace-nowrap">
                        <div className="flex justify-end items-center gap-3">
                          <Eye
                            size={16}
                            onClick={() => !viewLoading && handleViewData(item._id)}
                            className={`${viewLoading ? "cursor-not-allowed text-blue-300" : "cursor-pointer text-blue-500 hover:text-blue-600"} transition-colors`}
                            title={viewLoading ? "Loading sheet data" : "Show Sheet Data"}
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-100 rounded-2xl">
                          <FileSpreadsheet size={28} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600">No uploads found</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {activeTab === "all"
                              ? "Upload your first service file to get started."
                              : `No ${activeTab} uploads yet. Try uploading a ${activeTab} file.`}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:flex-row mt-3 rounded-b-xl">
              <span className="text-xs font-medium text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUploads.length)} of {filteredUploads.length} entries
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
      </div>

      <DmcBulkUploadModal isOpen={showBulkUploadModal} onClose={() => setShowBulkUploadModal(false)}/>

      {/* EXCEL SHEET VIEWER MODAL (MATCHING IMAGE 2) */}
      <AnimatePresence>
        {selectedSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedSheet(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-[#f3f2f1] shadow-2xl flex flex-col overflow-hidden border border-slate-300 transition-all duration-300 ${
                isMaximized
                  ? "fixed inset-0 w-full h-full rounded-none z-50"
                  : "w-full max-w-[97vw] xl:max-w-7xl h-[92vh] rounded-xl"
              }`}
            >
              {/* 1. EXCEL TOP TITLE RIBBON BAR */}
              <div className="bg-gradient-to-r from-[#0d4f2b] via-[#107c41] to-[#0e5c32] text-white px-4 py-2.5 flex items-center justify-between shadow-md select-none shrink-0">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="p-1.5 bg-white/15 rounded-lg border border-white/20 shadow-inner flex items-center justify-center">
                    <FileSpreadsheet size={20} className="text-white drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-sm font-bold tracking-wide text-white drop-shadow-sm max-w-[320px] truncate"
                        title={selectedSheet.fileName}
                      >
                        {selectedSheet.fileName}
                      </h3>
                      <span className="bg-emerald-950/40 text-emerald-100 border border-emerald-400/30 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Protected View
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-100/80 font-medium tracking-wide">
                      Category: <span className="font-bold text-white capitalize">{selectedSheet.category || "Hotel"}</span> • Spreadsheet Live Preview
                    </p>
                  </div>
                </div>

                {/* Search Bar in Ribbon */}
                <div className="flex-1 max-w-md mx-4 relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-emerald-100/70">
                    <Search size={13} />
                  </div>
                  <input
                    type="text"
                    value={sheetSearchQuery}
                    onChange={(e) => setSheetSearchQuery(e.target.value)}
                    placeholder={`Search in ${activeWorkbookSheet || "spreadsheet"}...`}
                    className="w-full rounded-lg border border-white/25 bg-white/15 py-1 pl-9 pr-8 text-xs text-white placeholder-emerald-100/50 shadow-inner outline-none transition-all duration-200 focus:border-white focus:bg-white/25 focus:ring-2 focus:ring-white/10"
                  />
                  {sheetSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSheetSearchQuery("")}
                      className="absolute right-2 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                      title="Clear Search"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>

                {/* Right controls: Records badge, Download, Fullscreen, Close */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline-flex items-center gap-1 bg-black/20 text-emerald-100 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-white/10">
                    <Layers size={12} className="text-emerald-300" />
                    {currentSheetData?.rows?.length || 0} Records
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDownload(selectedSheet.uploadId, selectedSheet.fileName)}
                    className="p-1.5 rounded-lg bg-black/20 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
                    title="Download Excel File"
                  >
                    <Download size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMaximized((prev) => !prev)}
                    className="p-1.5 rounded-lg bg-black/20 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
                    title={isMaximized ? "Restore Window" : "Maximize Window"}
                  >
                    {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSheet(null)}
                    className="p-1.5 rounded-lg bg-black/20 hover:bg-rose-600 text-white transition-all duration-200 active:scale-95 cursor-pointer"
                    title="Close Spreadsheet"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* 2. EXCEL FORMULA BAR (ADDRESS BOX & FX) */}
              <div className="bg-[#f3f2f1] border-b border-[#d4d4d4] px-3 py-1.5 flex items-center gap-2 text-xs select-none shadow-2xs shrink-0">
                {/* Name Box (Address) */}
                <div className="w-20 bg-white border border-[#d1d5db] rounded-xs px-2 py-0.5 text-center font-mono font-bold text-slate-800 text-[11px] shadow-2xs flex items-center justify-between">
                  <span>{selectedCell ? `${selectedCell.colLetter}${selectedCell.row}` : "A1"}</span>
                  <span className="text-[9px] text-slate-400">▾</span>
                </div>

                {/* Function Icons */}
                <div className="flex items-center gap-0.5 border-r border-[#d4d4d4] pr-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (editingRowIndex !== null) cancelEditingRow();
                      else setSelectedCell((prev) => ({ ...prev, value: "" }));
                    }}
                    className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                    title="Cancel edit"
                  >
                    <X size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingRowIndex !== null) saveEditedRow(editingRowIndex);
                    }}
                    className="p-0.5 text-slate-400 hover:text-emerald-600 rounded transition cursor-pointer"
                    title="Enter / Commit"
                  >
                    <Check size={13} />
                  </button>
                  <span className="font-serif italic font-bold text-slate-500 text-sm px-1.5 select-none" title="Insert Function">
                    fx
                  </span>
                </div>

                {/* Formula Text Input */}
                <input
                  ref={formulaInputRef}
                  type="text"
                  value={selectedCell?.value !== undefined ? String(selectedCell.value) : ""}
                  onChange={(e) => handleFormulaBarChange(e.target.value)}
                  placeholder="Formula / cell value"
                  className="flex-1 bg-white border border-[#d1d5db] rounded-xs px-2.5 py-0.5 text-[11px] font-sans text-slate-900 shadow-2xs outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all"
                />

                {selectedCell?.label && (
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-1 shrink-0">
                    Col: {selectedCell.label}
                  </span>
                )}
              </div>

              {/* 3. OPTIONAL SHEET BANNER (FOR BLACKOUT DATES OR SPECIAL SHEETS) */}
              {currentSheetData?.bannerTitle && (
                <div className="bg-gradient-to-r from-rose-900/90 via-red-800/90 to-rose-900/90 text-white px-4 py-2 flex items-center justify-between border-b border-rose-950 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🚫</span>
                    <div>
                      <h4 className="text-xs font-bold tracking-wide uppercase">{currentSheetData.bannerTitle}</h4>
                      {currentSheetData.bannerSubtitle && (
                        <p className="text-[10.5px] text-rose-100">{currentSheetData.bannerSubtitle}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full">
                    Blackout Notice Active
                  </span>
                </div>
              )}

              {/* 4. RATE CHANGE REASON VALIDATION ALERT (DURING EDIT) */}
              {editingRowIndex !== null && (
                <div
                  className={`border-b p-3 shadow-xs shrink-0 ${
                    isRateChangeReasonRequired ? "border-amber-300 bg-amber-50" : "border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${
                          isRateChangeReasonRequired ? "text-amber-700" : "text-slate-700"
                        }`}
                      >
                        <ShieldCheck size={14} className={isRateChangeReasonRequired ? "text-amber-600" : "text-slate-500"} />
                        Rate Change Audit Validation
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        {isRateChangeReasonRequired
                          ? `Reason is mandatory because rate-sensitive inventory fields changed: ${currentRateSensitiveChanges.join(", ")}.`
                          : "You are editing this spreadsheet row. Modify cell values and click Save to sync."}
                      </p>
                    </div>

                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                      <select
                        value={rateChangeReasonType}
                        onChange={(e) => setRateChangeReasonType(e.target.value)}
                        disabled={!isRateChangeReasonRequired}
                        className={`h-8 rounded border px-3 text-xs font-semibold outline-none ${
                          isRateChangeReasonRequired
                            ? "border-amber-400 bg-white text-slate-800 focus:border-amber-600"
                            : "border-slate-200 bg-slate-50 text-slate-400"
                        }`}
                      >
                        <option value="">Select reason</option>
                        {rateChangeReasonOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={rateChangeReasonNote}
                        onChange={(e) => setRateChangeReasonNote(e.target.value)}
                        disabled={!isRateChangeReasonRequired}
                        placeholder="Example: supplier blackout surcharge for event dates / limited inventory"
                        className={`h-8 rounded border px-3 text-xs font-semibold outline-none ${
                          isRateChangeReasonRequired
                            ? "border-amber-400 bg-white text-slate-800 placeholder-slate-400 focus:border-amber-600"
                            : "border-slate-200 bg-slate-50 text-slate-400 placeholder-slate-300"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. EXCEL SPREADSHEET GRID (MATCHING IMAGE 2) */}
              <div className="flex-1 overflow-auto bg-white relative custom-scroll">
                <div
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: "top left",
                    width: `${100 / (zoomLevel / 100)}%`,
                  }}
                  className="transition-transform duration-100 ease-out"
                >
                  <table className="min-w-max border-collapse text-[11px] font-sans w-full bg-white select-none">
                    {/* THEAD: Column Letters & Dark Navy Header */}
                    <thead className="sticky top-0 z-30">
                      {/* Row 1: Column Letters (A, B, C, D, E...) */}
                      <tr className="bg-[#f3f2f1] text-[#595959] text-[10px] font-bold border-b border-[#d4d4d4]">
                        <th className="w-12 text-center bg-[#e1dfdd] border-r border-[#d4d4d4] select-none py-1">#</th>
                        {sheetColumns.map((column, colIdx) => {
                          const colLetter = getColumnLetter(colIdx);
                          const isColActive = selectedCell.col === colIdx;
                          return (
                            <th
                              key={`col-letter-${colIdx}`}
                              className={`px-3 py-1 text-center border-r border-[#d4d4d4] select-none font-mono ${
                                isColActive ? "bg-[#d1fae5] text-[#065f46] font-extrabold" : "bg-[#f3f2f1]"
                              }`}
                            >
                              {colLetter}
                            </th>
                          );
                        })}
                        {showSheetActions && (
                          <th className="px-3 py-1 text-center border-r border-[#d4d4d4] bg-[#f3f2f1] font-mono text-[#595959]">
                            {getColumnLetter(sheetColumns.length)}
                          </th>
                        )}
                      </tr>

                      {/* Row 2: Dark Navy Header Row (Matching Image 2) */}
                      {hasGroupedHeaders ? (
                        currentSheetData.headerRows.map((headerRow, headerRowIndex) => (
                          <tr
                            key={`header-row-${headerRowIndex}`}
                            className="bg-[#0f2438] text-white border-b border-[#0b1e36]"
                          >
                            <th className="w-12 bg-[#091829] border-r border-slate-700 py-2 text-center text-slate-400 font-mono text-[10px] select-none">
                              {headerRowIndex + 1}
                            </th>
                            {headerRow.map((headerCell, cellIndex) => (
                              <th
                                key={`${headerRowIndex}-${cellIndex}-${headerCell.label}`}
                                colSpan={headerCell.colSpan || 1}
                                rowSpan={headerCell.rowSpan || 1}
                                className={`px-3 py-2 text-center text-white font-bold border-r border-slate-700 uppercase tracking-wider bg-[#0f2438] select-none whitespace-nowrap ${
                                  headerCell.rowSpan ? "align-middle" : ""
                                }`}
                              >
                                {headerCell.label}
                              </th>
                            ))}
                            {headerRowIndex === 0 && showSheetActions && (
                              <th
                                rowSpan={currentSheetData.headerRows.length}
                                className="px-3 py-2 text-center text-white font-bold min-w-[120px] bg-[#0f2438] select-none whitespace-nowrap border-r border-slate-700"
                              >
                                Actions
                              </th>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr className="bg-[#0f2438] text-white border-b border-[#0b1e36]">
                          <th className="w-12 bg-[#091829] border-r border-slate-700 py-2 text-center text-slate-400 font-mono text-[10px] select-none">
                            1
                          </th>
                          {sheetColumns.map((column, colIdx) => {
                            const isDesc =
                              column.isDesc || String(column.label || column.key || "").toLowerCase().includes("desc");
                            const isDate =
                              column.isDate ||
                              /valid\s*from|valid\s*to|start\s*date|end\s*date|date/i.test(String(column.label || column.key || ""));
                            const isNumeric =
                              !isDate &&
                              (column.numeric ||
                              /rate|price|amount|capacity|count|#|id/i.test(String(column.label || column.key || "")));
                            return (
                              <th
                                key={column.key}
                                className={`px-3 py-2 font-bold border-r border-slate-700 uppercase tracking-wider bg-[#0f2438] text-white select-none whitespace-nowrap ${
                                  isNumeric ? "text-right" : isDate ? "text-center" : "text-left"
                                } ${isDesc ? "min-w-[340px] max-w-[460px]" : isDate ? "min-w-[130px]" : "min-w-[120px]"}`}
                              >
                                {column.label || column.key}
                              </th>
                            );
                          })}
                          {showSheetActions && (
                            <th className="px-3 py-2 text-center text-white font-bold min-w-[110px] bg-[#0f2438] select-none whitespace-nowrap border-r border-slate-700">
                              Actions
                            </th>
                          )}
                        </tr>
                      )}
                    </thead>

                    {/* TBODY: Data Rows with Excel Grid */}
                    <tbody>
                      {paginatedSheetRows.length ? (
                        paginatedSheetRows.map((row, index) => {
                          const originalIndex = row.originalIndex !== undefined ? row.originalIndex : index;
                          const isEditing = editingRowIndex === originalIndex;
                          const headerOffset = hasGroupedHeaders ? (currentSheetData.headerRows.length + 1) : 2;
                          const excelRowNumber = originalIndex + headerOffset;
                          const isRowSelected = selectedCell.row === excelRowNumber;

                          return (
                            <tr
                              key={row._id || originalIndex}
                              className={`border-b border-[#d4d4d4] hover:bg-slate-50 transition-colors ${
                                isEditing ? "bg-blue-50/40" : index % 2 === 1 ? "bg-[#fbfbfb]" : "bg-white"
                              }`}
                            >
                              {/* Left Row Number Gutter */}
                              <td
                                className={`w-12 border-r border-b border-[#d4d4d4] text-center font-mono text-[10px] select-none py-1.5 ${
                                  isRowSelected
                                    ? "bg-[#d1fae5] text-[#065f46] font-extrabold border-r-[#107c41]"
                                    : "bg-[#f3f2f1] text-[#595959]"
                                }`}
                              >
                                {excelRowNumber}
                              </td>

                              {/* Data Cells */}
                              {sheetColumns.map((column, colIdx) => {
                                const header = column.key;
                                const isMergedCol = Boolean(column.isGroupedMerged);
                                const isMergedGroup = isMergedCol && !sheetSearchQuery && row.groupRowIndex !== undefined;

                                // Skip cell if spanned from above
                                if (isMergedGroup && row.groupRowIndex > 0) {
                                  return null;
                                }

                                let cellVal = row[header] !== undefined ? row[header] : "";
                                if (String(header).toLowerCase().includes("vehicletype")) {
                                  cellVal = String(cellVal || "").replace(/[^\x20-\x7E]/g, "").trim();
                                }
                                const isDesc =
                                  column.isDesc || String(column.label || header || "").toLowerCase().includes("desc");
                                const isDate =
                                  column.isDate ||
                                  /valid\s*from|valid\s*to|start\s*date|end\s*date|date/i.test(String(column.label || header || ""));
                                const isNumeric =
                                  !isDate &&
                                  (column.numeric ||
                                  /rate|price|amount|pax|capacity|count|id|#|no/i.test(String(column.label || header || "")));
                                const isSelected = selectedCell.row === excelRowNumber && selectedCell.col === colIdx;

                                // Format cell value: Date vs Numeric vs Text
                                let displayValue = String(cellVal || "");
                                if (isDate) {
                                  if (cellVal instanceof Date && !isNaN(cellVal.getTime())) {
                                    displayValue = cellVal.toISOString().split("T")[0];
                                  } else if (typeof cellVal === "string" && /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(cellVal.trim())) {
                                    displayValue = cellVal.trim();
                                  } else {
                                    const rawNum = typeof cellVal === "number" ? cellVal : (!isNaN(Number(cellVal)) && /^\d{5}$/.test(String(cellVal).trim()) ? Number(cellVal) : null);
                                    if (rawNum && rawNum > 25569 && rawNum < 60000) {
                                      const utcDays = rawNum - 25569;
                                      const d = new Date(utcDays * 86400 * 1000);
                                      const year = d.getUTCFullYear();
                                      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
                                      const day = String(d.getUTCDate()).padStart(2, "0");
                                      displayValue = `${year}-${month}-${day}`;
                                    } else if (typeof cellVal === "string") {
                                      displayValue = cellVal.trim();
                                    }
                                  }
                                } else if (isNumeric) {
                                  if (typeof cellVal === "number" && !isNaN(cellVal)) {
                                    displayValue = cellVal.toLocaleString("en-IN");
                                  } else if (!isNaN(Number(cellVal)) && String(cellVal).trim() !== "") {
                                    displayValue = Number(cellVal).toLocaleString("en-IN");
                                  }
                                }

                                const rowSpan = isMergedGroup && row.groupRowIndex === 0 ? (row.groupRowSpan || 5) : 1;

                                return (
                                  <td
                                    key={header}
                                    rowSpan={rowSpan > 1 ? rowSpan : undefined}
                                    onClick={() =>
                                      handleCellClick(originalIndex, colIdx, header, column.label, displayValue || cellVal)
                                    }
                                    className={`px-3 py-1.5 border-r border-b border-[#d4d4d4] font-medium transition-colors cursor-cell ${
                                      rowSpan > 1 ? "align-middle bg-white font-semibold" : ""
                                    } ${
                                      isSelected
                                        ? "relative outline outline-2 outline-[#107c41] -outline-offset-1 bg-emerald-50/40 z-10 font-bold text-slate-950"
                                        : ""
                                    } ${
                                      isDesc
                                        ? "min-w-[340px] max-w-[460px] whitespace-normal break-words py-2 leading-relaxed text-left align-top text-slate-700"
                                        : isNumeric
                                        ? "text-right font-mono text-slate-900 whitespace-nowrap"
                                        : isDate
                                        ? "text-center font-mono text-slate-800 whitespace-nowrap"
                                        : "whitespace-nowrap text-slate-800 text-left"
                                    }`}
                                  >
                                    {isEditing ? (
                                      isDesc ? (
                                        <textarea
                                          rows={2}
                                          value={editRowData[header] !== undefined ? editRowData[header] : ""}
                                          onChange={(e) => handleCellChange(header, e.target.value)}
                                          className="w-full border border-blue-500 px-2 py-1 text-[11px] rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-400 min-h-[50px]"
                                        />
                                      ) : (
                                        <input
                                          type="text"
                                          value={editRowData[header] !== undefined ? editRowData[header] : ""}
                                          onChange={(e) => handleCellChange(header, e.target.value)}
                                          className="w-full border border-blue-500 px-2 py-0.5 text-[11px] rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        />
                                      )
                                    ) : (
                                      <span>
                                        {header === "Hotel Category" && cellVal ? (
                                          (() => {
                                            const valStr = String(cellVal || "").trim();
                                            const match = valStr.match(/(\d+)/);
                                            const starCount = match ? Math.min(Math.max(parseInt(match[1], 10), 1), 7) : 0;
                                            if (starCount > 0) {
                                              return (
                                                <span className="inline-flex items-center gap-1.5 py-0.5 whitespace-nowrap" title={displayValue}>
                                                  <span className="inline-flex items-center gap-0.5">
                                                    {Array.from({ length: starCount }).map((_, sIdx) => (
                                                      <Star key={sIdx} size={11} className="text-amber-400 fill-amber-400 shrink-0" />
                                                    ))}
                                                  </span>
                                                  <span className="text-slate-800 font-medium">{displayValue}</span>
                                                </span>
                                              );
                                            }
                                            return <span>{displayValue}</span>;
                                          })()
                                        ) : (
                                          displayValue
                                        )}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Row Actions Column */}
                              {showSheetActions && (
                                <td className="px-3 py-1.5 border-r border-b border-[#d4d4d4] text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {isEditing ? (
                                      <>
                                        <button
                                          onClick={() => saveEditedRow(originalIndex)}
                                          className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-xs px-2 py-0.5 rounded text-[10.5px] font-bold active:scale-95 duration-150 cursor-pointer"
                                          title="Save Changes"
                                        >
                                          <Save size={11} />
                                          Save
                                        </button>
                                        <button
                                          onClick={cancelEditingRow}
                                          className="inline-flex items-center gap-1 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-xs px-2 py-0.5 rounded text-[10.5px] font-bold active:scale-95 duration-150 cursor-pointer"
                                          title="Cancel"
                                        >
                                          <X size={11} />
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => startEditingRow(originalIndex, row)}
                                        className="inline-flex items-center gap-1 bg-gradient-to-r from-[#0b1e36] to-[#107c41] hover:from-[#132d52] hover:to-[#16914d] text-white shadow-xs px-2.5 py-1 rounded text-[10.5px] font-bold active:scale-95 duration-150 cursor-pointer"
                                        title="Edit Row"
                                      >
                                        <Edit size={11} />
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={sheetColumns.length + (showSheetActions ? 2 : 1)}
                            className="px-4 py-16 text-center text-sm text-slate-400 font-semibold"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <FileSpreadsheet size={32} className="text-slate-300" />
                              <p className="text-slate-500">
                                {sheetSearchQuery.trim()
                                  ? `No matching records found for "${sheetSearchQuery}" in ${activeWorkbookSheet || "this sheet"}.`
                                  : "No spreadsheet records found in this sheet."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. EXCEL BOTTOM SHEET NAVIGATION TABS & STATUS BAR (MATCHING IMAGE 2) */}
              <div className="bg-[#f3f2f1] border-t border-[#d4d4d4] px-2 py-1 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs select-none shadow-xs shrink-0">
                {/* Left side: Sheet Navigation & Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                  {/* Navigation Arrows */}
                  <div className="flex items-center gap-0.5 border-r border-[#d4d4d4] pr-1.5 mr-1">
                    <button
                      type="button"
                      disabled={availableSheets.indexOf(activeWorkbookSheet) <= 0}
                      onClick={() => {
                        const idx = availableSheets.indexOf(activeWorkbookSheet);
                        if (idx > 0) handleSwitchTab(availableSheets[idx - 1]);
                      }}
                      className="p-1 rounded text-slate-600 hover:bg-[#dedbd8] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                      title="Previous sheet"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={
                        availableSheets.indexOf(activeWorkbookSheet) >= availableSheets.length - 1
                      }
                      onClick={() => {
                        const idx = availableSheets.indexOf(activeWorkbookSheet);
                        if (idx < availableSheets.length - 1) handleSwitchTab(availableSheets[idx + 1]);
                      }}
                      className="p-1 rounded text-slate-600 hover:bg-[#dedbd8] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                      title="Next sheet"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Sheet Tabs */}
                  <div className="flex items-center gap-1">
                    {availableSheets.map((sName) => {
                      const isActive = (activeWorkbookSheet || availableSheets[0]) === sName;
                      const isBlackout = sName.toLowerCase().includes("blackout");

                      return (
                        <button
                          key={sName}
                          type="button"
                          onClick={() => handleSwitchTab(sName)}
                          className={`px-3.5 py-1 text-xs font-semibold flex items-center gap-1.5 rounded-t transition cursor-pointer ${
                            isActive
                              ? "bg-white text-slate-900 border-t-2 border-t-[#107c41] shadow-xs font-bold border-x border-[#d4d4d4]"
                              : "bg-[#e1dfdd] hover:bg-[#d8d5d2] text-slate-700 border border-transparent"
                          }`}
                        >
                          <FileSpreadsheet
                            size={13}
                            className={isActive ? "text-[#107c41]" : isBlackout ? "text-rose-500" : "text-slate-500"}
                          />
                          <span>{sName}</span>
                          {isBlackout && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-0.5"></span>
                          )}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-[#dedbd8] transition cursor-pointer"
                      title="Add Sheet (Protected View)"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Right side: Status, Pagination & Zoom Controls */}
                <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-600">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Ready</span>
                  </div>

                  <span className="text-slate-300">|</span>

                  {/* Row Counter & Pagination */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">
                      {filteredSheetRows.length} rows
                      {totalSheetPages > 1 && ` (Pg ${sheetPage}/${totalSheetPages})`}
                    </span>

                    {totalSheetPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSheetPage((prev) => Math.max(prev - 1, 1))}
                          disabled={sheetPage === 1}
                          className="px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => setSheetPage((prev) => Math.min(prev + 1, totalSheetPages))}
                          disabled={sheetPage === totalSheetPages}
                          className="px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-slate-300">|</span>

                  {/* Zoom Slider */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((prev) => Math.max(prev - 10, 75))}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#dedbd8] transition cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut size={12} />
                    </button>
                    <input
                      type="range"
                      min={75}
                      max={125}
                      step={5}
                      value={zoomLevel}
                      onChange={(e) => setZoomLevel(Number(e.target.value))}
                      className="w-16 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#107c41]"
                    />
                    <button
                      type="button"
                      onClick={() => setZoomLevel((prev) => Math.min(prev + 10, 125))}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#dedbd8] transition cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(100)}
                      className="text-[10.5px] font-mono font-bold text-slate-700 hover:text-[#107c41] px-1 cursor-pointer"
                      title="Reset Zoom to 100%"
                    >
                      {zoomLevel}%
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
