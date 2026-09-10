import React from "react";
import { CalendarDays, CheckCircle, Clock3 } from "lucide-react";
import { formatDate, formatMoney } from "../../utils/dmcPaymentLedgerHelpers";

export const BookedServicesTable = ({
  selectDueServices,
  setSelectedRefs,
  loading,
  ledgerServices,
  paginatedServices,
  selectedRefs,
  toggleService,
  pageStart,
  pageEnd,
  currentPage,
  setCurrentPage,
  totalPages,
}) => {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">Booked Services</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectDueServices}
            className="rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#111827] to-black hover:opacity-90 px-4 py-1.5 text-xs font-bold text-white transition-all shadow-sm hover:scale-[1.02] transform active:scale-95"
          >
            Select due services
          </button>
          <button
            type="button"
            onClick={() => setSelectedRefs([])}
            className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <table className="min-w-[830px] w-full text-left text-xs">
          <thead className="bg-white text-[10px] uppercase tracking-[0.12em] text-slate-400 border-b border-slate-100">
            <tr>
              <th className="px-3 py-2 w-[40px]">Pick</th>
              <th className="px-3 py-2 w-[90px]">Booking</th>
              <th className="px-3 py-2 w-[220px]">Service</th>
              <th className="w-[120px] whitespace-nowrap px-3 py-2 text-center">Credit Start</th>
              <th className="px-3 py-2 w-[140px]">Due Date</th>
              <th className="px-3 py-2 text-right w-[80px]">Amount</th>
              <th className="px-3 py-2 w-[160px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center">
                      <div className="absolute h-10 w-10 animate-ping rounded-full bg-blue-100 opacity-75"></div>
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 animate-pulse mt-1">Loading Ledger Details...</p>
                  </div>
                </td>
              </tr>
            ) : ledgerServices.length ? (
              paginatedServices.map((service) => {
                const selected = selectedRefs.includes(service.serviceRef);
                return (
                  <tr key={service.serviceRef} className={selected ? "bg-blue-50/50" : "bg-white"}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={service.isClaimed}
                        onChange={() => toggleService(service.serviceRef)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-800">{service.queryId}</p>
                      <p className="text-[11px] text-slate-400">{service.destination || "-"}</p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-800">{service.serviceName}</p>
                      <p className="text-[11px] text-slate-400">{service.type}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-center text-slate-600">{formatDate(service.creditStartDate)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold whitespace-nowrap ${
                        service.isOverdue
                          ? "bg-rose-50 text-rose-700"
                          : service.isDue
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-50 text-slate-600"
                      }`}>
                        <CalendarDays size={12} />
                        {formatDate(service.dueDate)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {formatMoney(service.amount, service.currency)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold whitespace-nowrap ${
                        service.isClaimed
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {service.isClaimed ? <CheckCircle size={12} /> : <Clock3 size={12} />}
                        {service.isClaimed
                          ? `${service.status} (${service.claimInvoiceNumber})`
                          : "Unbilled"}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center text-slate-400">
                  No booked services found for this credit period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Showing {pageStart}-{pageEnd} of {ledgerServices.length} booked services
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1 || loading}
            className={`rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-300 transform active:scale-95 disabled:scale-100 ${
              currentPage === 1 || loading
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#1e3a8a] via-[#111827] to-black hover:opacity-90 hover:scale-[1.02]"
            }`}
          >
            Previous
          </button>
          <span className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600">
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages || loading}
            className={`rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-300 transform active:scale-95 disabled:scale-100 ${
              currentPage === totalPages || loading
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#1e3a8a] via-[#111827] to-black hover:opacity-90 hover:scale-[1.02]"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
