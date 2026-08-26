import React from "react";
import { Receipt, Download, CalendarDays, FileText } from "lucide-react";
import {
  getFileUrl,
  formatDate,
  formatMoney,
  statusBadgeClass,
} from "../../utils/dmcPaymentLedgerHelpers";

export const FinanceUploadedInvoicesTable = ({
  financeUploadedInvoices = [],
  loading,
}) => {
  return (
    <div className="mt-6">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              Finance Uploaded Invoices
            </p>
            <h3 className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Receipt size={16} />
              Vendor invoices uploaded by finance
            </h3>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
            {financeUploadedInvoices.length} invoice{financeUploadedInvoices.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-32 items-center justify-center text-xs font-semibold text-slate-400">
            Loading finance uploaded invoices...
          </div>
        ) : financeUploadedInvoices.length ? (
          <div className="overflow-x-auto pb-3 thin-scrollbar">
            <style>{`
              .thin-scrollbar::-webkit-scrollbar {
                height: 5px;
              }
              .thin-scrollbar::-webkit-scrollbar-track {
                background: #f8fafc;
                border-radius: 9px;
              }
              .thin-scrollbar::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 9px;
              }
              .thin-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}</style>
            <table className="min-w-[980px] w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-white text-[10px] uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Invoice No.</th>
                  <th className="px-3 py-2">Uploaded File</th>
                  <th className="px-3 py-2">Credit</th>
                  <th className="px-3 py-2">Due Date</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Payout Details</th>
                  <th className="px-3 py-2 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financeUploadedInvoices.map((invoice) => {
                  const invoiceUrl = getFileUrl(invoice.invoiceDocument?.filePath);
                  const receiptUrl = getFileUrl(invoice.receiptDocument?.filePath);
                  return (
                    <tr key={invoice.id || invoice.invoiceNumber} className="bg-white align-top">
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-900 whitespace-nowrap">{invoice.invoiceNumber}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400 whitespace-nowrap">
                          Uploaded by {invoice.uploadedByName || "Finance Team"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        {invoiceUrl ? (
                          <button
                            type="button"
                            onClick={() => window.open(invoiceUrl, "_blank", "noopener,noreferrer")}
                            className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                          >
                            <Download size={12} />
                            <span className="truncate">{invoice.invoiceDocument?.name || "Download invoice"}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">No file</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 whitespace-nowrap">
                          {invoice.creditPeriodDays}-day credit
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-slate-700">
                          <CalendarDays size={12} />
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <p className="font-bold text-slate-900 whitespace-nowrap">{formatMoney(invoice.amount, invoice.currency)}</p>
                        {Number(invoice.remainingAmount || 0) > 0 ? (
                          <p className="mt-0.5 text-[10px] font-semibold text-amber-600 whitespace-nowrap">
                            Remaining {formatMoney(invoice.remainingAmount, invoice.currency)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 font-bold whitespace-nowrap ${statusBadgeClass(invoice.status)}`}>
                          {invoice.status || "Submitted"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {invoice.payoutInstallments?.length ? (
                          <div className="space-y-1.5">
                            {invoice.payoutInstallments.map((payment, index) => (
                              <div key={`${payment.utrNumber}-${index}`} className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-2.5 py-1.5 min-w-[185px]">
                                <p className="font-bold text-emerald-700 whitespace-nowrap">
                                  {formatMoney(payment.amount, invoice.currency)} paid
                                </p>
                                <div className="text-[10px] text-slate-500 space-y-0.5 mt-0.5 whitespace-nowrap">
                                  <p>UTR: {payment.utrNumber || "-"}</p>
                                  <p>Bank: {payment.bankName || "-"}</p>
                                  <p>Date: {formatDate(payment.paymentDate)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">No payout recorded</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {receiptUrl ? (
                          <button
                            type="button"
                            onClick={() => window.open(receiptUrl, "_blank", "noopener,noreferrer")}
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                          >
                            <Download size={12} />
                            Receipt
                          </button>
                        ) : (
                          <span className="text-slate-400">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-32 flex-col items-center justify-center px-4 py-8 text-center">
            <FileText size={22} className="text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-500">No finance uploaded invoices yet</p>
            <p className="mt-1 text-xs text-slate-400">
              When finance uploads a vendor invoice for your account, it will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
