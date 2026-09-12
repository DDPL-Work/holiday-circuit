import React from "react";
import { motion } from "framer-motion";
import { FileText, ExternalLink, Download } from "lucide-react";

export default function DocsTab({
  selectedQuery,
  travelerDocumentVerification,
  travelerProfiles,
  uploadedTravelerDocumentCount,
  travelersReadyForSupplierHandoff,
  formatDocumentDateTime,
  formatDocumentSize,
  handleTravelerDocumentOpen,
  handleTravelerDocumentDownload,
  downloadingDocumentId,
}) {
  return (
    <motion.div
      key="docs-tab-panel"
      initial={{
        opacity: 0,
        y: 10,
        scale: 0.995,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: -8,
        scale: 0.995,
      }}
      transition={{
        duration: 0.22,
        ease: "easeOut",
      }}
      className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-[#edf4ff] via-[#f5f8ff] to-[#e8fbf0] p-5 lg:p-6 shadow-sm space-y-6 font-sans"
    >
      {/* Docs Tab Header */}
      <div className="flex items-center justify-between pb-4 border-b border-blue-200/50 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Traveler Documents
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Access passenger passports, visas, and verified ID documents for query{" "}
              <span className="font-bold text-blue-700">
                {selectedQuery?.queryId || "-"}
              </span>
              .
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/80 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {travelerDocumentVerification?.status || "Verified"}
        </span>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-100/90 via-indigo-50/80 to-white p-4 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
            Total PAX Count
          </p>
          <p className="text-base font-extrabold text-slate-900 mt-1">
            {selectedQuery?.passengers ||
              travelerProfiles?.length ||
              0}{" "}
            Travelers
          </p>
        </div>
        <div className="rounded-xl border border-cyan-200/80 bg-gradient-to-br from-cyan-100/90 via-sky-50/80 to-white p-4 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-cyan-600 tracking-wider">
            Files Ready
          </p>
          <p className="text-base font-extrabold text-cyan-800 mt-1">
            {uploadedTravelerDocumentCount} Files Ready
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-100/90 via-teal-50/80 to-white p-4 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
            Supplier Ready
          </p>
          <p className="text-base font-extrabold text-emerald-800 mt-1">
            {travelersReadyForSupplierHandoff}/
            {travelerProfiles?.length || 0}
          </p>
        </div>
      </div>

      {/* Traveler List & File Slots */}
      <div className="space-y-4 pt-1">
        {travelerProfiles && travelerProfiles.length > 0 ? (
          travelerProfiles.map((traveler, index) => (
            <div
              key={traveler.id}
              className="rounded-xl border border-blue-200/50 bg-white/80 backdrop-blur-xs overflow-hidden shadow-2xs"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-100/70 via-indigo-50/50 to-emerald-100/50 border-b border-blue-200/50">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-2xs">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {traveler.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {traveler.travelerType}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-white/90 px-2.5 py-1 rounded border border-blue-200/60 shadow-2xs">
                  {traveler.uploadedCount}/
                  {traveler.documentSlots?.length || 0} DOCS
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 p-4">
                {traveler.documentSlots?.map((doc) => (
                  <div
                    key={doc.key}
                    className={`rounded-xl p-3.5 border transition-all ${doc.uploaded ? "bg-emerald-50/80 border-emerald-300/80 shadow-2xs" : "bg-white border-slate-200/80"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {doc.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${doc.uploaded ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}
                      >
                        {doc.uploaded ? "✓ READY" : "MISSING"}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mb-2 truncate">
                      {doc.fileName || "Not available"}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mb-3">
                      <div className="bg-white/90 p-2 rounded border border-slate-200/60">
                        <span className="text-[9px] block text-slate-400 font-bold uppercase">
                          Uploaded
                        </span>
                        <span className="font-medium text-slate-700">
                          {formatDocumentDateTime(doc.uploadedAt)}
                        </span>
                      </div>
                      <div className="bg-white/90 p-2 rounded border border-slate-200/60">
                        <span className="text-[9px] block text-slate-400 font-bold uppercase">
                          Size
                        </span>
                        <span className="font-medium text-slate-700">
                          {formatDocumentSize(doc.size)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleTravelerDocumentOpen(traveler, doc)
                        }
                        disabled={!doc.uploaded}
                        className="flex-1 py-1.5 px-3 text-xs font-semibold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                      >
                        <ExternalLink size={12} /> Open
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleTravelerDocumentDownload(traveler, doc)
                        }
                        disabled={
                          !doc.uploaded ||
                          downloadingDocumentId === `${traveler.id}-${doc.key}`
                        }
                        className="flex-1 py-1.5 px-3 text-xs font-bold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                      >
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-500 text-center py-8 bg-white/70 rounded-xl border border-blue-200/60">
            No traveler documents found.
          </div>
        )}
      </div>
    </motion.div>
  );
}
