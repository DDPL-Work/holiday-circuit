import React, { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  X,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { formatCurrency } from "../utils/formatter";

const PayoutBreakdownDropdown = forwardRef(
  ({ isOpen, onClose, contributingPayouts, periodLabel, loading }, ref) => {
    const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

    if (!isOpen) return null;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[95vw] max-w-7xl bg-gradient-to-br from-white via-sky-50/50 to-sky-100/25 backdrop-blur-md border border-sky-100/60 rounded-2xl p-0 overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] flex flex-col max-h-[88vh]"
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
            .payout-scroll-container {
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
            }
            .payout-scroll-container::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
              background: transparent !important;
            }
          `,
          }}
        />
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-950/20 via-sky-200/50 to-white border-b border-sky-200/60 shrink-0">
          <div>
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Coins className="w-4 h-4 text-rose-500 animate-pulse" />
              Actual Payout Breakdown ({periodLabel})
            </h4>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Detailed list of payments made to DMCs in the selected period.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-400 shrink-0 px-5">
            Loading payout details...
          </div>
        ) : contributingPayouts.length === 0 ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-400 flex flex-col items-center gap-2 shrink-0 px-5">
            <AlertCircle className="w-8 h-8 text-slate-300" />
            <span>No actual payouts recorded in this period.</span>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 pt-3 space-y-4 payout-scroll-container">
            {contributingPayouts.map(
              ({ invoice, payoutAmount, entries, isBulk, queryGroups, summary }) => {
                const invoiceId = invoice._id || invoice.id;
                const isExpanded = expandedInvoiceId === invoiceId;
                const dmcName =
                  invoice.dmc?.companyName ||
                  invoice.dmc?.name ||
                  invoice.dmcName ||
                  invoice.supplierName ||
                  "Unknown DMC";
                const numBookings = queryGroups.length;
                const numUnbookings = queryGroups.filter((g) => g.isCoveredOnly).length;
                const totalServices = queryGroups.reduce((sum, g) => sum + g.services.length, 0);

                return (
                  <div
                    key={invoiceId}
                    className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white"
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => setExpandedInvoiceId(isExpanded ? null : invoiceId)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            isBulk
                              ? "bg-indigo-50 text-indigo-650 border border-indigo-100"
                              : "bg-emerald-50 text-emerald-650 border border-emerald-100"
                          }`}
                        >
                          {isBulk ? "Bulk Upload" : "Single Payout"}
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">{dmcName}</h5>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            Invoice/Batch:{" "}
                            <span className="text-slate-650 font-extrabold">
                              {invoice.batchNumber || invoice.invoiceNumber || "N/A"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <p className="text-xs font-black text-rose-600 bg-rose-50/80 border border-rose-100/50 px-2 py-0.5 rounded-full inline-block">
                            Paid: {formatCurrency(payoutAmount)}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                            {entries.length} Installment{entries.length > 1 ? "s" : ""}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-slate-400" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-slate-100 bg-white p-4"
                        >
                          {/* Payout Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Installment Details
                              </span>
                              {entries.map((entry, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] font-semibold text-slate-700 mt-1 flex justify-between"
                                >
                                  <span>
                                    {entry.date
                                      ? new Date(entry.date).toLocaleDateString("en-US", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "N/A"}
                                    :
                                  </span>
                                  <span className="text-rose-600 font-extrabold ml-2">
                                    {formatCurrency(entry.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Bank & Ref (UTR)
                              </span>
                              <span className="text-[11px] font-bold text-slate-700 block mt-1">
                                Bank:{" "}
                                <span className="text-slate-650">
                                  {invoice.payoutBank || invoice.bankName || "N/A"}
                                </span>
                              </span>
                              <span className="text-[11px] font-bold text-slate-700 block mt-0.5">
                                UTR:{" "}
                                <span className="text-slate-650 font-semibold">
                                  {invoice.payoutReference || "N/A"}
                                </span>
                              </span>
                            </div>
                            {invoice.financeNotes && (
                              <div>
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Finance Notes
                                </span>
                                <p className="text-[11px] font-medium text-slate-600 mt-1 italic">
                                  "{invoice.financeNotes}"
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Invoice Financial Summary */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-4 bg-rose-50/10 p-3 rounded-lg border border-rose-100/30 text-xs">
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Invoice Subtotal
                              </span>
                              <span className="font-extrabold text-slate-700 block mt-1">
                                {formatCurrency(summary.subtotal)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                GST Amount
                              </span>
                              <span className="font-bold text-slate-650 block mt-1">
                                {formatCurrency(summary.gstAmount)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                TCS Amount
                              </span>
                              <span className="font-bold text-slate-650 block mt-1">
                                {formatCurrency(summary.tcsAmount)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Other Taxes / TDS
                              </span>
                              <span className="font-bold text-slate-650 block mt-1">
                                {formatCurrency(summary.otherTaxAmount)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Total Tax
                              </span>
                              <span className="font-extrabold text-rose-600 block mt-1">
                                {formatCurrency(summary.totalTax)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-wider block font-black">
                                Grand Total
                              </span>
                              <span className="font-black text-rose-600 block mt-1 bg-rose-50/80 px-1.5 py-0.5 rounded border border-rose-100/50 w-fit">
                                {formatCurrency(summary.grandTotal)}
                              </span>
                            </div>
                          </div>

                          {/* Bulk / Single Statistics */}
                          <div className="flex items-center gap-4 mb-3 border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                              Covered Bookings Breakdown:
                            </span>
                            <div className="flex gap-2">
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                                Bookings: {numBookings - numUnbookings}
                              </span>
                              {isBulk && (
                                <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                                  Unbookings: {numUnbookings}
                                </span>
                              )}
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                Services: {totalServices}
                              </span>
                            </div>
                          </div>

                          {/* Queries and Services details */}
                          <div className="space-y-3">
                            {queryGroups.map((group) => {
                              const isUnbooking =
                                group.isCoveredOnly || group.services.length === 0;

                              return (
                                <div
                                  key={group.queryCode}
                                  className={`border rounded-lg p-3 ${
                                    isUnbooking
                                      ? "bg-rose-50/20 border-rose-100/50"
                                      : "bg-slate-50/20 border-slate-100"
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-100/60 mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-extrabold text-slate-700">
                                        Booking: {group.queryCode}
                                      </span>
                                      {group.destination && (
                                        <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                          <MapPin size={10} />
                                          {group.destination}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isUnbooking ? (
                                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                          Unbooking / Canceled
                                        </span>
                                      ) : (
                                        <div className="flex flex-col items-end">
                                          <span className="text-[11px] font-extrabold text-slate-800 bg-slate-100/80 px-2 py-0.5 rounded">
                                            Query Total:{" "}
                                            {formatCurrency(
                                              group.totalCostWithTaxes || group.totalCost
                                            )}
                                          </span>
                                          {((group.gstShare || 0) > 0 ||
                                            (group.tcsShare || 0) > 0 ||
                                            (group.otherTaxShare || 0) > 0) && (
                                            <span className="text-[9px] text-slate-450 font-semibold mt-0.5">
                                              Base: {formatCurrency(group.baseSubtotal)}
                                              {group.gstShare > 0 &&
                                                ` + GST: ${formatCurrency(group.gstShare)}`}
                                              {group.tcsShare > 0 &&
                                                ` + TCS: ${formatCurrency(group.tcsShare)}`}
                                              {group.otherTaxShare > 0 &&
                                                ` + Other: ${formatCurrency(group.otherTaxShare)}`}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {isUnbooking ? (
                                    <p className="text-[11px] text-slate-400 italic">
                                      This booking is covered under the bulk upload/settlement batch
                                      but does not contain active services billed (unbooking).
                                    </p>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse">
                                        <thead>
                                          <tr className="border-b border-slate-100">
                                            <th className="py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                              Service
                                            </th>
                                            <th className="py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                              Type
                                            </th>
                                            <th className="py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center">
                                              Qty
                                            </th>
                                            <th className="py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">
                                              Rate
                                            </th>
                                            <th className="py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">
                                              Tax
                                            </th>
                                            <th className="py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">
                                              DMC Cost
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                          {group.services.map((svc, sIdx) => {
                                            const totalDmcCost =
                                              Number(svc.subtotal || 0) + Number(svc.tax || 0);
                                            return (
                                              <tr key={sIdx} className="text-[11px] text-slate-700">
                                                <td className="py-1.5 font-bold text-slate-800">
                                                  {svc.service}
                                                </td>
                                                <td className="py-1.5 font-semibold text-slate-500">
                                                  {svc.type}
                                                </td>
                                                <td className="py-1.5 text-center font-bold text-slate-700">
                                                  {svc.qty}
                                                </td>
                                                <td className="py-1.5 text-right font-extrabold text-slate-800">
                                                  {formatCurrency(svc.rate)}
                                                </td>
                                                <td className="py-1.5 text-right font-semibold text-slate-500">
                                                  {formatCurrency(svc.tax)}
                                                </td>
                                                <td className="py-1.5 text-right font-black text-slate-800">
                                                  {formatCurrency(totalDmcCost)}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Professional Written Summary */}
                          <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-xl border border-slate-200/50">
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block mb-1">
                              Audit Log & Payout Overview
                            </span>
                            <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                              This payment installment of{" "}
                              <span className="font-extrabold text-rose-600">
                                {formatCurrency(payoutAmount)}
                              </span>{" "}
                              was processed on{" "}
                              <span className="font-bold text-slate-800">
                                {entries
                                  .map((e) =>
                                    e.date
                                      ? new Date(e.date).toLocaleDateString("en-US", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "N/A"
                                  )
                                  .join(", ")}
                              </span>{" "}
                              via{" "}
                              <span className="font-bold text-slate-800">
                                {invoice.payoutBank || invoice.bankName || "N/A"}
                              </span>{" "}
                              (UTR/Ref No:{" "}
                              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {(invoice.payoutInstallments || [])
                                  .map((inst) => inst.utrNumber)
                                  .filter(Boolean)
                                  .join(", ") ||
                                  invoice.payoutReference ||
                                  "N/A"}
                              </span>
                              ) to settle invoice/batch{" "}
                              <span className="font-bold text-slate-800">
                                {invoice.batchNumber || invoice.invoiceNumber || "N/A"}
                              </span>{" "}
                              from{" "}
                              <span className="font-bold text-slate-800">{dmcName}</span>. The
                              total invoice volume equals{" "}
                              <span className="font-bold text-slate-800">
                                {formatCurrency(summary.grandTotal)}
                              </span>
                              , comprising a base cost of{" "}
                              <span className="font-bold text-slate-800">
                                {formatCurrency(summary.subtotal)}
                              </span>{" "}
                              and{" "}
                              <span className="font-bold text-slate-800">
                                {formatCurrency(summary.totalTax)}
                              </span>{" "}
                              total tax (
                              {summary.gstAmount > 0 &&
                                `GST: ${formatCurrency(summary.gstAmount)}`}
                              {summary.tcsAmount > 0 &&
                                `, TCS: ${formatCurrency(summary.tcsAmount)}`}
                              {summary.otherTaxAmount > 0 &&
                                `, Other: ${formatCurrency(summary.otherTaxAmount)}`}
                              ). This settlement applies to{" "}
                              <span className="font-bold text-slate-855">
                                {numBookings - numUnbookings} active booking
                                {numBookings - numUnbookings !== 1 ? "s" : ""}
                              </span>{" "}
                              covering{" "}
                              <span className="font-bold text-slate-855">
                                {totalServices} service{totalServices !== 1 ? "s" : ""}
                              </span>
                              {numUnbookings > 0 &&
                                `, and accounts for ${numUnbookings} unbooked/canceled query/queries`}
                              .
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
            )}
          </div>
        )}
      </motion.div>
    );
  }
);

PayoutBreakdownDropdown.displayName = "PayoutBreakdownDropdown";

export default PayoutBreakdownDropdown;
