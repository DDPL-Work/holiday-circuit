import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import {
  formatShortDate,
  formatCompactCurrency,
  getInvoiceMonthVerifiedPayment,
  getInvoiceMonthVerifiedPaymentDate,
  getPrimaryTravelDate,
  getInvoiceTotalAmount,
  isClientApprovedChecklistRecord,
} from "../utils/formatter";

export default function RevenueChecklistTable({
  groups,
  effectiveSelectedTaxMonth,
  loading,
  selectedPastMonth,
  onSelectPastMonth,
  selectedUpcomingMonth,
  onSelectUpcomingMonth,
  pastMonthsList,
}) {
  const [collapsedGroups, setCollapsedGroups] = useState({
    past: false,
    current: false,
    upcoming: false,
  });

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getMonthYearLabel = (monthStr) => {
    if (!monthStr) return "";
    const [yr, mn] = monthStr.split("-").map(Number);
    const date = new Date(yr, mn - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const [selectedYear, selectedMonth] = effectiveSelectedTaxMonth.split("-").map(Number);
  const currentMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
  const pastMonthDate = new Date(selectedYear, selectedMonth - 2, 1);
  const upcomingMonthDate = new Date(selectedYear, selectedMonth, 1);

  const pastMonthStrDefault = `${pastMonthDate.getFullYear()}-${String(
    pastMonthDate.getMonth() + 1
  ).padStart(2, "0")}`;
  const pastMonthStr = selectedPastMonth || pastMonthStrDefault;
  const currentMonthStr = `${currentMonthDate.getFullYear()}-${String(
    currentMonthDate.getMonth() + 1
  ).padStart(2, "0")}`;
  const upcomingMonthStrDefault = `${upcomingMonthDate.getFullYear()}-${String(
    upcomingMonthDate.getMonth() + 1
  ).padStart(2, "0")}`;
  const upcomingMonthStr = selectedUpcomingMonth || upcomingMonthStrDefault;

  const renderGroup = (key, title, list, colorClass, borderLeftColor) => {
    const isCollapsed = collapsedGroups[key];
    return (
      <div className="flex flex-col">
        {/* Group Header Accordion Control */}
        <div
          onClick={() => toggleGroup(key)}
          className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 hover:bg-slate-100/75 border-y border-slate-150 cursor-pointer select-none transition-all duration-150"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              size={13}
              className={`text-slate-400 transition-transform duration-200 transform ${
                isCollapsed ? "-rotate-90" : ""
              }`}
            />

            <span className={`text-[10px] font-black tracking-wider uppercase ${colorClass}`}>
              {title}
            </span>
            <span className="inline-flex items-center justify-center h-4.5 min-w-[20px] px-1 rounded-full text-[9.5px] font-extrabold bg-slate-200/85 text-slate-600 font-mono shadow-inner">
              {list.length}
            </span>
          </div>

          {/* Right side controls in the header */}
          <div className="flex items-center gap-2">
            {key === "past" && (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Month:
                </span>
                <input
                  type="month"
                  value={pastMonthStr}
                  onChange={(e) => {
                    onSelectPastMonth(e.target.value);
                    if (collapsedGroups.past) {
                      setCollapsedGroups((prev) => ({ ...prev, past: false }));
                    }
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer outline-none transition focus:border-indigo-300"
                />
              </div>
            )}
            {key === "upcoming" && (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Month:
                </span>
                <input
                  type="month"
                  value={upcomingMonthStr}
                  onChange={(e) => {
                    onSelectUpcomingMonth(e.target.value);
                    if (collapsedGroups.upcoming) {
                      setCollapsedGroups((prev) => ({ ...prev, upcoming: false }));
                    }
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer outline-none transition focus:border-orange-300"
                />
              </div>
            )}
          </div>
        </div>

        {/* Group Rows Container */}
        <div className="relative overflow-hidden">
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden bg-white"
              >
                {list.length === 0 ? (
                  <div className="px-6 py-5 text-center text-xs text-slate-455 font-semibold border-b border-slate-100 bg-slate-50/20">
                    No items in this month.
                  </div>
                ) : (
                  list.map((invoice, idx) => {
                    const destination =
                      invoice.tripSnapshot?.destination ||
                      invoice.query?.destination ||
                      "Unknown Destination";
                    const preTravelPaidAmount = getInvoiceMonthVerifiedPayment(
                      invoice,
                      effectiveSelectedTaxMonth
                    );
                    const isClientApprovedWithoutPayment =
                      preTravelPaidAmount <= 0 && isClientApprovedChecklistRecord(invoice);
                    const statusLabel = isClientApprovedWithoutPayment
                      ? "Client Approved"
                      : invoice.paymentStatus;

                    // Generate tags
                    const tags = [];
                    if (statusLabel) {
                      const isPaidState = statusLabel === "Paid";
                      const isPartialState = statusLabel.includes("Partial");
                      tags.push({
                        label: isPaidState ? "FULL PAID" : statusLabel.replace("_", " "),
                        isFullPaid: isPaidState,
                        className: isPaidState
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : isPartialState
                          ? "bg-amber-50 text-amber-750 border border-amber-100"
                          : statusLabel === "Unpaid"
                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                          : "bg-blue-50 text-blue-700 border border-blue-100",
                      });
                    }

                    return (
                      <motion.div
                        key={invoice._id || idx}
                        whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.55)" }}
                        className="flex gap-4 px-4 py-3 border-b border-slate-100 items-center text-xs text-slate-700 select-none relative"
                      >
                        {/* Status border accent on the left of each row */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[3.5px] ${borderLeftColor}`} />

                        {/* Query ID Column */}
                        <div className="w-[18%] pl-1 flex flex-col gap-0.5 min-w-0">
                          <span className="font-extrabold text-slate-900 truncate">
                            {invoice.query?.queryId || invoice.invoiceNumber || "Draft Query"}
                          </span>
                          <span className="text-[10px] text-slate-450 font-bold truncate">
                            {destination}
                          </span>
                        </div>

                        {/* Create Date Column */}
                        <div className="w-[13%] text-slate-600 font-medium truncate">
                          {formatShortDate(invoice.createdAt)}
                        </div>

                        {/* Travel Date Column */}
                        <div className="w-[13%] text-slate-600 font-medium truncate">
                          {formatShortDate(
                            invoice.tripSnapshot?.startDate || getPrimaryTravelDate(invoice)
                          )}
                        </div>

                        {/* Payment Date Column */}
                        <div className="w-[13%] text-slate-600 font-medium truncate">
                          {formatShortDate(
                            getInvoiceMonthVerifiedPaymentDate(invoice, effectiveSelectedTaxMonth)
                          ) || "-"}
                        </div>

                        {/* Partially Paid Column */}
                        <div className="w-[13%] font-bold text-slate-800 font-mono">
                          {formatCompactCurrency(preTravelPaidAmount)}
                        </div>

                        {/* Status Column */}
                        <div className="w-[12%] flex justify-center items-center min-w-0">
                          {tags.slice(0, 1).map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md flex items-center gap-1 ${tag.className}`}
                            >
                              {tag.isFullPaid && (
                                <CheckCircle2
                                  size={10}
                                  className="text-emerald-500 fill-emerald-50/50 shrink-0"
                                />
                              )}
                              <span>{tag.label}</span>
                            </span>
                          ))}
                        </div>

                        {/* Total Amount Column */}
                        <div className="w-[18%] text-right pr-2 font-black text-slate-900 font-mono">
                          {formatCompactCurrency(getInvoiceTotalAmount(invoice))}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full border border-slate-200/80 rounded-2xl shadow-sm bg-white overflow-hidden select-none finance-transparent-scrollbar">
      {/* Table Headers */}
      <div className="flex gap-4 items-center px-4 py-3 bg-gradient-to-r from-slate-50 via-slate-50/50 to-white border-b border-slate-200/85 text-[10px] font-extrabold uppercase text-slate-650 tracking-wider">
        <div className="w-[18%] pl-1">Query ID</div>
        <div className="w-[13%]">Create Date</div>
        <div className="w-[13%]">Travel Date</div>
        <div className="w-[13%]">Payment Date</div>
        <div className="w-[13%]">Partially Paid</div>
        <div className="w-[12%] text-center">Status</div>
        <div className="w-[18%] text-right pr-2">Total Amount</div>
      </div>

      {/* Accordions */}
      <div className="flex flex-col">
        {renderGroup(
          "past",
          `Past Month (${getMonthYearLabel(pastMonthStr)})`,
          groups.past,
          "text-purple-600",
          "bg-purple-500"
        )}
        {renderGroup(
          "current",
          `Current Month (${getMonthYearLabel(currentMonthStr)})`,
          groups.current,
          "text-sky-600",
          "bg-sky-500"
        )}
        {renderGroup(
          "upcoming",
          `Upcoming Month (${getMonthYearLabel(upcomingMonthStr)})`,
          groups.upcoming,
          "text-orange-500",
          "bg-orange-500"
        )}
      </div>
    </div>
  );
}
