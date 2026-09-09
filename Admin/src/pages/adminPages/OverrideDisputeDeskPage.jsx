import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Send,
  Eye,
  RefreshCw,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../utils/Api";
import { OverrideResolutionModal } from "./superAdminDashboard/components/Modals/OverrideResolutionModal";
import { getOverrideStatusMeta } from "./superAdminDashboard/utils/dashboardHelpers";

const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

const filterTabs = [
  { label: "All Disputes", key: "all" },
  { label: "Open", key: "open" },
  { label: "DMC / Finance", key: "dmc_finance" },
  { label: "Operations", key: "operations" },
  { label: "Agent Registration", key: "agent" },
  { label: "Resolved", key: "resolved" },
  { label: "Rejected", key: "rejected" },
];

export default function OverrideDisputeDeskPage() {
  const [overrideCases, setOverrideCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [selectedOverrideCase, setSelectedOverrideCase] = useState(null);
  const [overrideDecision, setOverrideDecision] = useState("approve");
  const [overrideNote, setOverrideNote] = useState("");
  const [overrideActionId, setOverrideActionId] = useState("");
  const [viewDetailCase, setViewDetailCase] = useState(null);

  const fetchOverrideData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const { data } = await API.get("/admin/dashboard");
      const superAdminData = data?.data?.superAdmin || {};
      const rows = Array.isArray(superAdminData.overrideCases) ? superAdminData.overrideCases : [];
      setOverrideCases(rows);
    } catch (error) {
      if (!silent) toast.error(error?.response?.data?.message || "Failed to load override disputes");
      setOverrideCases([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverrideData();
  }, []);

  const closeOverrideDialog = () => {
    setSelectedOverrideCase(null);
    setOverrideDecision("approve");
    setOverrideNote("");
  };

  const openOverrideDialog = (entry, decision = "approve") => {
    setSelectedOverrideCase(entry);
    setOverrideDecision(decision);
    setOverrideNote("");
  };

  const handleSubmitOverrideResolution = async () => {
    const trimmedNote = overrideNote.trim();

    if (!selectedOverrideCase?.targetType || !selectedOverrideCase?.targetId) {
      toast.error("Override case details are missing.");
      return;
    }

    if (!trimmedNote) {
      toast.error("Please add a resolution note.");
      return;
    }

    try {
      setOverrideActionId(selectedOverrideCase.id || selectedOverrideCase.targetId);
      const { data } = await API.patch(
        `/admin/override-cases/${selectedOverrideCase.targetType}/${selectedOverrideCase.targetId}/resolve`,
        {
          decision: overrideDecision,
          resolutionNote: trimmedNote,
        },
      );
      toast.success(data?.message || "Override resolved successfully");
      closeOverrideDialog();
      if (viewDetailCase?.id === selectedOverrideCase.id) {
        setViewDetailCase(null);
      }
      await fetchOverrideData(true);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to resolve override right now.");
    } finally {
      setOverrideActionId("");
    }
  };

  // Counts summary
  const counts = useMemo(() => {
    return {
      all: overrideCases.length,
      open: overrideCases.filter((c) => c.status === "Open").length,
      dmc_finance: overrideCases.filter(
        (c) =>
          String(c.sourceModule || "").toLowerCase().includes("dmc") ||
          String(c.sourceModule || "").toLowerCase().includes("finance") ||
          c.targetType === "internal_invoice_dispute" ||
          c.targetType === "payment_verification"
      ).length,
      operations: overrideCases.filter(
        (c) =>
          String(c.sourceModule || "").toLowerCase().includes("ops") ||
          String(c.sourceModule || "").toLowerCase().includes("operation") ||
          c.targetType === "ops_query"
      ).length,
      agent: overrideCases.filter(
        (c) =>
          String(c.sourceModule || "").toLowerCase().includes("agent") ||
          c.targetType === "agent_approval"
      ).length,
      resolved: overrideCases.filter((c) => c.status === "Approved" || c.status === "Resolved").length,
      rejected: overrideCases.filter((c) => c.status === "Rejected").length,
    };
  }, [overrideCases]);

  // Filtered list
  const filteredCases = useMemo(() => {
    return overrideCases.filter((item) => {
      // Tab filter
      if (activeFilter === "open" && item.status !== "Open") return false;
      if (activeFilter === "resolved" && item.status !== "Approved" && item.status !== "Resolved") return false;
      if (activeFilter === "rejected" && item.status !== "Rejected") return false;
      if (
        activeFilter === "dmc_finance" &&
        !String(item.sourceModule || "").toLowerCase().includes("dmc") &&
        !String(item.sourceModule || "").toLowerCase().includes("finance") &&
        item.targetType !== "internal_invoice_dispute" &&
        item.targetType !== "payment_verification"
      )
        return false;
      if (
        activeFilter === "operations" &&
        !String(item.sourceModule || "").toLowerCase().includes("ops") &&
        !String(item.sourceModule || "").toLowerCase().includes("operation") &&
        item.targetType !== "ops_query"
      )
        return false;
      if (
        activeFilter === "agent" &&
        !String(item.sourceModule || "").toLowerCase().includes("agent") &&
        item.targetType !== "agent_approval"
      )
        return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesRef = String(item.reference || "").toLowerCase().includes(query);
        const matchesModule = String(item.sourceModule || "").toLowerCase().includes(query);
        const matchesTitle = String(item.title || "").toLowerCase().includes(query);
        const matchesDesc = String(item.description || "").toLowerCase().includes(query);
        const matchesRequestedBy = String(item.requestedByName || "").toLowerCase().includes(query);
        const matchesStatus = String(item.status || "").toLowerCase().includes(query);

        if (!matchesRef && !matchesModule && !matchesTitle && !matchesDesc && !matchesRequestedBy && !matchesStatus) {
          return false;
        }
      }

      return true;
    });
  }, [overrideCases, activeFilter, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage);

  const getSourceBadgeClass = (sourceModule = "") => {
    const s = String(sourceModule || "").toLowerCase();
    if (s.includes("dmc")) return "bg-sky-50 text-sky-700 border-sky-200";
    if (s.includes("finance")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (s.includes("ops") || s.includes("operation")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (s.includes("agent")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <motion.section
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-4 px-4 sm:px-6 py-4 w-full font-sans"
    >
      {/* Header */}
      <motion.header variants={itemVariant} className="space-y-3.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Shield size={18} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Override & Dispute Desk</h1>
                <p className="text-xs text-gray-500">
                  Universal Super Admin decisions across ops, agents, finance, and DMC invoices.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative w-full sm:w-72 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search overrides & disputes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border rounded-lg text-sm border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition bg-white shadow-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchOverrideData()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition cursor-pointer shrink-0"
              title="Refresh"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin text-blue-600" : "text-gray-500"} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            const count = counts[tab.key] ?? 0;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#3E63DD] text-white shadow-[0_2px_8px_rgba(62,99,221,0.3)]"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.header>

      {/* Table Section (Border removed, generous column widths, no button collision) */}
      <motion.div variants={itemVariant} className="bg-white shadow-xs rounded-xl overflow-hidden border-0">
        <div className="thin-scrollbar overflow-x-auto">
          <table className="min-w-[1150px] w-full table-fixed text-xs">
            <colgroup>
              <col className="w-[17%]" />
              <col className="w-[14%]" />
              <col className="w-[23%]" />
              <col className="w-[13%]" />
              <col className="w-[9%]" />
              <col className="w-[24%]" />
            </colgroup>
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="text-left pl-5 pr-3 py-3 font-semibold">Reference ID</th>
                <th className="text-left pl-3 pr-4 py-3 font-semibold">Source Module</th>
                <th className="text-left px-4 py-3 font-semibold">Title & Description</th>
                <th className="text-left px-4 py-3 font-semibold">Raised By / Date</th>
                <th className="text-center px-3 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-blue-600" />
                      <span>Loading override disputes...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedCases.length > 0 ? (
                paginatedCases.map((entry) => {
                  const statusMeta = getOverrideStatusMeta(entry.status);
                  const isClosed = entry.status !== "Open";
                  return (
                    <tr
                      key={`${entry.targetType}-${entry.targetId}-${entry.status}`}
                      onClick={() => setViewDetailCase(entry)}
                      className="cursor-pointer transition-colors hover:bg-[#F9FAFB]"
                    >
                      {/* Reference (Truncated cleanly with ample width) */}
                      <td className="pl-5 pr-3 py-3.5 align-middle">
                        <span
                          className="font-bold text-slate-900 truncate block max-w-full"
                          title={entry.reference}
                        >
                          {entry.reference}
                        </span>
                      </td>

                      {/* Source Module (Single line badge with isolated spacing) */}
                      <td className="pl-3 pr-4 py-3.5 align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-md text-[11px] font-semibold border leading-tight ${getSourceBadgeClass(
                            entry.sourceModule
                          )}`}
                        >
                          {entry.sourceModule || "System"}
                        </span>
                      </td>

                      {/* Title & Description */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="space-y-0.5 max-w-xs sm:max-w-sm">
                          <p className="font-semibold text-slate-900 leading-snug truncate">{entry.title}</p>
                          <p className="text-slate-500 text-[11px] line-clamp-1 leading-normal">
                            {entry.description || "No dispute details provided."}
                          </p>
                        </div>
                      </td>

                      {/* Raised By / Date */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-800 truncate">{entry.requestedByName || "System"}</p>
                          <p className="text-slate-400 text-[11px] whitespace-nowrap">
                            {entry.requestedAtLabel || "Recently"}
                          </p>
                        </div>
                      </td>

                      {/* Status (Centered, spacious, never squashed) */}
                      <td className="px-3 py-3.5 align-middle text-center whitespace-nowrap">
                        <span
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-2.5 py-0.5 text-[11px] font-semibold min-w-[58px] leading-tight"
                          style={{
                            background: statusMeta.bg,
                            border: `1px solid ${statusMeta.border}`,
                            color: statusMeta.color,
                          }}
                        >
                          {entry.status}
                        </span>
                      </td>

                      {/* Actions (Spacious width, crisp buttons, zero overlap with Status) */}
                      <td className="px-5 py-3.5 align-middle text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap shrink-0">
                          {isClosed ? (
                            <button
                              type="button"
                              onClick={() => setViewDetailCase(entry)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer shadow-2xs shrink-0"
                            >
                              <Eye size={12} className="shrink-0" />
                              View
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => openOverrideDialog(entry, "approve")}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md hover:bg-emerald-100 hover:border-emerald-300 transition-colors whitespace-nowrap cursor-pointer shadow-2xs shrink-0"
                              >
                                <CheckCircle2 size={12} className="shrink-0" />
                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() => openOverrideDialog(entry, "reject")}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md hover:bg-rose-100 hover:border-rose-300 transition-colors whitespace-nowrap cursor-pointer shadow-2xs shrink-0"
                              >
                                <XCircle size={12} className="shrink-0" />
                                Reject
                              </button>

                              {!["agent_approval", "payment_verification"].includes(entry.targetType) ? (
                                <button
                                  type="button"
                                  onClick={() => openOverrideDialog(entry, "resolve")}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-colors whitespace-nowrap cursor-pointer shadow-2xs shrink-0"
                                >
                                  <Send size={12} className="shrink-0" />
                                  Resolve
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldCheck size={28} className="text-gray-300" />
                      <p className="font-semibold text-slate-700">No override or dispute records found</p>
                      <p className="text-xs text-gray-400">Try changing the filter or search keyword.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredCases.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-3 sm:flex-row">
            <span className="text-xs font-medium text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCases.length)} of{" "}
              {filteredCases.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <div className="hidden items-center gap-1 sm:flex">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNumber = idx + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        currentPage === pageNumber
                          ? "bg-[#3E63DD] text-white"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Override Decision Resolution Modal */}
      <AnimatePresence>
        {selectedOverrideCase && (
          <OverrideResolutionModal
            selectedOverrideCase={selectedOverrideCase}
            closeOverrideDialog={closeOverrideDialog}
            overrideActionId={overrideActionId}
            overrideDecision={overrideDecision}
            setOverrideDecision={setOverrideDecision}
            overrideNote={overrideNote}
            setOverrideNote={setOverrideNote}
            handleSubmitOverrideResolution={handleSubmitOverrideResolution}
          />
        )}
      </AnimatePresence>

      {/* Case Details Modal */}
      <AnimatePresence>
        {viewDetailCase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-[4px] p-4"
            onClick={() => setViewDetailCase(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <Shield size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Dispute Details</span>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">{viewDetailCase.reference}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewDetailCase(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Source Module</p>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{viewDetailCase.sourceModule}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Status</p>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{viewDetailCase.status}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Title</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{viewDetailCase.title}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dispute Details / Description</p>
                  <p className="text-xs text-slate-700 mt-1.5 leading-relaxed whitespace-pre-line">
                    {viewDetailCase.description || "No specific details shared."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Raised By:</span>
                    <span className="font-semibold text-slate-800">{viewDetailCase.requestedByName || "System"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Raised Date:</span>
                    <span className="font-semibold text-slate-800">{viewDetailCase.requestedAtLabel || "Recently"}</span>
                  </div>
                </div>

                {viewDetailCase.resolutionNote ? (
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Resolution Note</p>
                    <p className="text-xs font-semibold text-emerald-900 mt-1 leading-relaxed">
                      {viewDetailCase.resolutionNote}
                    </p>
                    {viewDetailCase.resolvedByName && (
                      <p className="text-[11px] text-emerald-700 mt-2">
                        Resolved By: <strong className="font-bold">{viewDetailCase.resolvedByName}</strong>
                      </p>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewDetailCase(null)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>

                {viewDetailCase.status === "Open" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const c = viewDetailCase;
                        setViewDetailCase(null);
                        openOverrideDialog(c, "approve");
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const c = viewDetailCase;
                        setViewDetailCase(null);
                        openOverrideDialog(c, "reject");
                      }}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
