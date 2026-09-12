import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, CheckCircle2, FileText } from 'lucide-react';
import { sectionRevealVariants } from './utils';

const QuotationBuilderHeader = (props) => {
  const { additionalNotes, editingSourceQuotationSnapshotRef, editingTargetQuotationId, exclusions, formatCurrencyValue, inclusions, isEditingHistoricalQuotation, isQuotationHistoryOpen, navigate, orderQueryId, quotationHistory, quotationHistoryLoadError, quotationHistoryLoading, resetBuilderWorkspace, selectedHistoryQuotation, selectedHistoryQuotationId, services, setActiveDraftSourceQuotationId, setDraftHydrated, setDraftSourceReloadRequest, setEditingSourceQuotationSnapshot, setEditingTargetQuotationId, setIsFreshDraftMode, setIsQuotationHistoryOpen, setSelectedHistoryQuotationId } = props;
  
  return (
    <motion.div
          variants={sectionRevealVariants}
          className="mb-2.5 flex items-center justify-between"
        >
          <button
            onClick={() => navigate(-1)}
            className="text-[#3E63DD] hover:text-[#3252c4] text-sm font-semibold cursor-pointer"
          >
            ← Back to Order Acceptance
          </button>
          <div className="flex items-start gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsQuotationHistoryOpen((prev) => !prev)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 hover:border-gray-400 transition"
              >
                <FileText size={14} className="text-gray-500" />
                <span>Quotation History</span>
                <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                  {quotationHistory.length}
                </span>
                {isQuotationHistoryOpen ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              <AnimatePresence>
                {isQuotationHistoryOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="absolute right-0 top-full z-30 mt-2 w-[320px] origin-top-right overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl text-slate-900"
                  >
                    <div className="border-b border-gray-100 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Previous Quotations
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Select any quotation to review it first, then click edit
                        if you want to load it in the builder.
                      </p>
                    </div>

                    <div className="max-h-[28rem] overflow-y-auto px-2 py-2 [scrollbar-color:transparent_transparent] [scrollbar-width:none] [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent">
                      {quotationHistoryLoading ? (
                        <p className="px-2 py-3 text-xs text-slate-500">
                          Loading quotation history...
                        </p>
                      ) : quotationHistoryLoadError ? (
                        <p className="px-2 py-3 text-xs text-rose-600">
                          {quotationHistoryLoadError}
                        </p>
                      ) : quotationHistory.length ? (
                        quotationHistory.map((quotation) => {
                          const isSelected =
                            quotation.id === selectedHistoryQuotationId;

                          return (
                            <button
                              key={quotation.id}
                              type="button"
                              onClick={() => {
                                setSelectedHistoryQuotationId(quotation.id);
                              }}
                              className={`mb-2 flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                                isSelected
                                  ? "border-amber-400 bg-amber-50"
                                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50"
                              }`}
                            >
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  isSelected
                                    ? "border-amber-500 bg-amber-500 text-white"
                                    : "border-gray-300 bg-white text-transparent"
                                }`}
                              >
                                <CheckCircle2 size={11} strokeWidth={3} />
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                  <span className="truncate text-sm font-semibold text-slate-900">
                                    {quotation.quotationNumber ||
                                      `Quotation ${quotation.attemptNumber}`}
                                  </span>
                                  {quotation.isLatest && (
                                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                                      Latest
                                    </span>
                                  )}
                                </span>
                                <span className="mt-1 block text-[11px] text-slate-500">
                                  {quotation.status} •{" "}
                                  {quotation.createdAtLabel ||
                                    "Date unavailable"}
                                </span>
                                <span className="mt-1 block text-xs font-semibold text-amber-700">
                                  {formatCurrencyValue(
                                    quotation.displayAmount || 0,
                                    quotation.pricing?.currency || "INR",
                                  )}
                                </span>
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <p className="px-2 py-3 text-xs text-slate-500">
                          No previous quotations found for this query yet.
                        </p>
                      )}

                      {selectedHistoryQuotation &&
                        !quotationHistoryLoading &&
                        !quotationHistoryLoadError && (
                          <div className="mt-3 rounded-2xl border border-sky-400/20 bg-[#0b1220] p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                                  Selected History
                                </p>
                                <p className="mt-1 text-sm font-semibold text-white">
                                  {selectedHistoryQuotation.quotationNumber ||
                                    `Quotation ${selectedHistoryQuotation.attemptNumber}`}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-400">
                                  {selectedHistoryQuotation.status} •{" "}
                                  {selectedHistoryQuotation.createdAtLabel ||
                                    "Date unavailable"}
                                </p>
                              </div>
                              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                                Preview
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div className="rounded-xl border border-slate-800 bg-[#111827] px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                                  OPS Total
                                </p>
                                <p className="mt-1 text-xs font-semibold text-white">
                                  {formatCurrencyValue(
                                    selectedHistoryQuotation.opsTotalAmount ||
                                      0,
                                    selectedHistoryQuotation.pricing
                                      ?.currency || "INR",
                                  )}
                                </p>
                              </div>
                              <div className="rounded-xl border border-slate-800 bg-[#111827] px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                                  Services Total
                                </p>
                                <p className="mt-1 text-xs font-semibold text-sky-300">
                                  {formatCurrencyValue(
                                    Number(
                                      selectedHistoryQuotation.pricing
                                        ?.subTotal || 0,
                                    ) ||
                                      (
                                        selectedHistoryQuotation.services || []
                                      ).reduce(
                                        (sum, service) =>
                                          sum +
                                          Number(
                                            service?.totalInInr ||
                                              service?.total ||
                                              0,
                                          ),
                                        0,
                                      ),
                                    selectedHistoryQuotation.pricing
                                      ?.currency || "INR",
                                  )}
                                </p>
                              </div>
                              <div className="rounded-xl border border-slate-800 bg-[#111827] px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                                  Services
                                </p>
                                <p className="mt-1 text-xs font-semibold text-sky-300">
                                  {selectedHistoryQuotation.serviceCount || 0}{" "}
                                  item
                                  {selectedHistoryQuotation.serviceCount === 1
                                    ? ""
                                    : "s"}
                                </p>
                              </div>
                              <div className="rounded-xl border border-slate-800 bg-[#111827] px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                                  Taxes
                                </p>
                                <p className="mt-1 text-xs font-semibold text-emerald-300">
                                  {formatCurrencyValue(
                                    selectedHistoryQuotation.pricing?.tax
                                      ?.totalTax || 0,
                                    selectedHistoryQuotation.pricing
                                      ?.currency || "INR",
                                  )}
                                </p>
                              </div>
                            </div>

                            {selectedHistoryQuotation.agentRevisionRemark && (
                              <div className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/8 px-3 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-300">
                                  Revision Remark
                                </p>
                                <p className="mt-1 text-xs leading-5 text-rose-100">
                                  {selectedHistoryQuotation.agentRevisionRemark}
                                </p>
                              </div>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full border border-slate-700 bg-[#111827] px-2.5 py-1 text-[10px] font-medium text-slate-300">
                                Inclusions{" "}
                                {selectedHistoryQuotation.inclusions?.length ||
                                  0}
                              </span>
                              <span className="rounded-full border border-slate-700 bg-[#111827] px-2.5 py-1 text-[10px] font-medium text-slate-300">
                                Exclusions{" "}
                                {selectedHistoryQuotation.exclusions?.length ||
                                  0}
                              </span>
                              <span className="rounded-full border border-slate-700 bg-[#111827] px-2.5 py-1 text-[10px] font-medium text-slate-300">
                                Notes{" "}
                                {selectedHistoryQuotation.additionalNotes
                                  ?.length || 0}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsFreshDraftMode(false);
                                  setActiveDraftSourceQuotationId(
                                    selectedHistoryQuotation.id,
                                  );
                                  setEditingTargetQuotationId(
                                    selectedHistoryQuotation.id,
                                  );
                                  editingSourceQuotationSnapshotRef.current =
                                    selectedHistoryQuotation;
                                  setEditingSourceQuotationSnapshot(
                                    selectedHistoryQuotation,
                                  );
                                  setDraftHydrated(false);
                                  setDraftSourceReloadRequest(
                                    (value) => value + 1,
                                  );
                                  setIsQuotationHistoryOpen(false);
                                }}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                  editingTargetQuotationId ===
                                  selectedHistoryQuotation.id
                                    ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                                    : "border border-sky-400/30 bg-sky-500/10 text-sky-200 hover:border-sky-300/50 hover:bg-sky-500/15"
                                }`}
                              >
                                Edit This Quotation
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  resetBuilderWorkspace();
                                  setIsFreshDraftMode(true);
                                  setActiveDraftSourceQuotationId("");
                                  setEditingTargetQuotationId("");
                                  editingSourceQuotationSnapshotRef.current =
                                    null;
                                  setEditingSourceQuotationSnapshot(null);
                                  setDraftHydrated(false);
                                  setSelectedHistoryQuotationId("");
                                  setIsQuotationHistoryOpen(false);
                                }}
                                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                                  !isEditingHistoricalQuotation
                                    ? "border-yellow-400/40 bg-yellow-500/12 text-yellow-200"
                                    : "border-slate-700 bg-[#111827] text-slate-200 hover:border-slate-500 hover:text-white"
                                }`}
                              >
                                Start Fresh Draft
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-right font-semibold text-[#3E63DD]">
              <p className="text-xs text-gray-500">Query ID</p>
              <span className="font-bold">{orderQueryId || "-"}</span>
            </div>
          </div>
        </motion.div>
  );
};

export default QuotationBuilderHeader;
