import React, { useEffect, useMemo, useState, useRef } from "react";
import DmcBulkUploadModal from "../../modal/DmcBulkUploadModal";
import Swal from "sweetalert2";
import API from "../../utils/Api.js";
import { AnimatePresence, motion } from "framer-motion";

import {
  rateChangeReasonOptions,
  getRateSensitiveChanges,
  getColumnLetter,
  TABS,
} from "./contractedRates/utils/contractedRatesHelpers";

import { ContractedRatesHeader } from "./contractedRates/components/Header/ContractedRatesHeader";
import { ContractedRatesStatsCards } from "./contractedRates/components/Stats/ContractedRatesStatsCards";
import { UploadCategoryTabs } from "./contractedRates/components/History/UploadCategoryTabs";
import { UploadHistoryTable } from "./contractedRates/components/History/UploadHistoryTable";
import { UploadPagination } from "./contractedRates/components/History/UploadPagination";
import { ExcelRibbonHeader } from "./contractedRates/components/SpreadsheetModal/ExcelRibbonHeader";
import { ExcelFormulaBar } from "./contractedRates/components/SpreadsheetModal/ExcelFormulaBar";
import { ExcelGridView } from "./contractedRates/components/SpreadsheetModal/ExcelGridView";
import { ExcelPaginationFooter } from "./contractedRates/components/SpreadsheetModal/ExcelPaginationFooter";

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

  const normalizeCategory = (cat) => {
    const c = String(cat || "").toLowerCase().trim();
    if (c === "sightseeing") return "activity";
    return c;
  };

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

  return (
    <div className="min-h-screen bg-gray-50 py-1">
      {/* HEADER */}
      <ContractedRatesHeader onOpenBulkUploadModal={() => setShowBulkUploadModal(true)} />

      {/* STATS CARDS */}
      <ContractedRatesStatsCards />

      {/* RECENT UPLOADS SECTION */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* SECTION HEADER WITH CATEGORY STATUS TABS */}
        <div className="border-b border-gray-200 px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800 text-sm">Upload Records</h3>
            <span className="text-xs text-slate-400 font-normal">
              ({filteredUploads.length} files)
            </span>
          </div>

          <UploadCategoryTabs
            tabs={TABS}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            getTabCount={getTabCount}
          />
        </div>

        {/* TABLE */}
        <div className="p-4">
          <UploadHistoryTable
            paginatedUploads={paginatedUploads}
            viewLoading={viewLoading}
            handleViewData={handleViewData}
            handleDownload={handleDownload}
            handleDelete={handleDelete}
            activeTab={activeTab}
          />

          {/* PAGINATION */}
          <UploadPagination
            startIndex={startIndex}
            itemsPerPage={itemsPerPage}
            filteredUploadsLength={filteredUploads.length}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
          />
        </div>
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
              <ExcelRibbonHeader
                selectedSheet={selectedSheet}
                activeWorkbookSheet={activeWorkbookSheet}
                sheetSearchQuery={sheetSearchQuery}
                setSheetSearchQuery={setSheetSearchQuery}
                currentSheetData={currentSheetData}
                handleDownload={handleDownload}
                isMaximized={isMaximized}
                setIsMaximized={setIsMaximized}
                onClose={() => setSelectedSheet(null)}
              />

              {/* 2. EXCEL FORMULA BAR */}
              <ExcelFormulaBar
                selectedCell={selectedCell}
                editingRowIndex={editingRowIndex}
                cancelEditingRow={cancelEditingRow}
                setSelectedCell={setSelectedCell}
                saveEditedRow={saveEditedRow}
                formulaInputRef={formulaInputRef}
                handleFormulaBarChange={handleFormulaBarChange}
              />

              {/* 3, 4 & 5. EXCEL SPREADSHEET GRID & AUDIT BANNERS */}
              <ExcelGridView
                currentSheetData={currentSheetData}
                editingRowIndex={editingRowIndex}
                isRateChangeReasonRequired={isRateChangeReasonRequired}
                currentRateSensitiveChanges={currentRateSensitiveChanges}
                rateChangeReasonType={rateChangeReasonType}
                setRateChangeReasonType={setRateChangeReasonType}
                rateChangeReasonOptions={rateChangeReasonOptions}
                rateChangeReasonNote={rateChangeReasonNote}
                setRateChangeReasonNote={setRateChangeReasonNote}
                zoomLevel={zoomLevel}
                sheetColumns={sheetColumns}
                selectedCell={selectedCell}
                showSheetActions={showSheetActions}
                hasGroupedHeaders={hasGroupedHeaders}
                paginatedSheetRows={paginatedSheetRows}
                sheetSearchQuery={sheetSearchQuery}
                editRowData={editRowData}
                handleCellChange={handleCellChange}
                handleCellClick={handleCellClick}
                saveEditedRow={saveEditedRow}
                cancelEditingRow={cancelEditingRow}
                startEditingRow={startEditingRow}
              />

              {/* 6. EXCEL BOTTOM SHEET NAVIGATION TABS & STATUS BAR */}
              <ExcelPaginationFooter
                availableSheets={availableSheets}
                activeWorkbookSheet={activeWorkbookSheet}
                handleSwitchTab={handleSwitchTab}
                filteredSheetRowsLength={filteredSheetRows.length}
                sheetPage={sheetPage}
                totalSheetPages={totalSheetPages}
                setSheetPage={setSheetPage}
                zoomLevel={zoomLevel}
                setZoomLevel={setZoomLevel}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
