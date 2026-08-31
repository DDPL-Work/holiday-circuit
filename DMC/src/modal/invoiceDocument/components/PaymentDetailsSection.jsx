import React from 'react';
import { FileText, Eye, Download, CheckCircle, ChevronDown } from 'lucide-react';
import {
  formatRoundedAmount,
  getDocumentMeta,
  BANK_LOGOS,
} from '../utils/invoiceHelpers.jsx';

export const PaymentDetailsSection = ({
  invoice,
  documentList,
  handlePreviewDocument,
  handleDownloadDocument,
  payoutInstallments,
  cumulativePaid,
  expectedPayoutAmount,
  isPaid,
  settledAmount,
  settledDate,
  remainingBalance,
  roundedRemainingBalance,
  utrInput,
  setUtrInput,
  dateInput,
  setDateInput,
  sourceBank,
  setSourceBank,
  bankOptions,
  bankReferenceMatched,
  payoutReferenceDetailsComplete,
  transferAmount,
  setTransferAmount,
  formatIntegerInput,
  payoutAmountMatches,
  isBankDropdownOpen,
  setIsBankDropdownOpen,
  ratesMatch,
  allChecksPassed,
  handleReject,
  handleConfirm,
  isSubmitting,
}) => {
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <h3 className="mb-2 text-[10.5px] font-bold text-slate-800">Payment Details</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="text-[9.5px] font-medium text-slate-500">Party Name</p>
            <p className="truncate text-xs font-bold text-slate-800">{invoice.party}</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[9.5px] font-medium text-slate-500">Invoice Number</p>
            <p className="truncate text-xs font-bold text-slate-800">{invoice.id}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[9.5px] font-medium text-slate-500">Due Date</p>
            <p className="text-xs font-bold text-slate-800">{invoice.date}</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[9.5px] font-medium text-slate-500">Credit Period</p>
            <p className="text-xs font-bold text-slate-800">
              {invoice.creditTermLabel || `${Number(invoice.creditPeriodDays || 7)}-day credit`}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2">
          <h3 className="text-[10.5px] font-bold text-slate-800">Uploaded Documents</h3>
          <p className="mt-0.5 text-[9.5px] font-medium text-slate-500">
            DMC uploaded internal invoice files. Finance team can download and verify them here.
          </p>
        </div>
        <div className="space-y-2">
          {documentList.map((doc) => (
            <div
              key={doc.name}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">{doc.name}</p>
                  <p className="text-[9.5px] text-slate-400 font-medium">{getDocumentMeta(doc)}</p>
                </div>
              </div>
              <div className="ml-2 flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePreviewDocument(doc)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[9.5px] font-bold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(doc)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[9.5px] font-bold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  <Download className="h-3 w-3" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {payoutInstallments.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-800">DMC Payout Statement</h3>
            <span className="text-[9.5px] font-bold text-slate-600">
              Paid: {formatRoundedAmount(cumulativePaid)} / {formatRoundedAmount(expectedPayoutAmount)}
            </span>
          </div>
          <div className="space-y-1.5">
            {payoutInstallments.map((inst, index) => (
              <div
                key={inst.id || index}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-2.5 py-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">Installment {index + 1}</span>
                    <span className="text-[9.5px] text-slate-400 font-medium">({inst.paymentDate || inst.date})</span>
                  </div>
                  <p className="mt-0.5 truncate text-[9.5px] text-slate-500 font-medium">
                    Ref: {inst.utrNumber} | Bank: {inst.bankName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-xs text-emerald-600">
                    {formatRoundedAmount(inst.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPaid ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="mb-2.5 flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
              Payout Completed
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2">
              <p className="text-[9.5px] font-medium text-slate-500">Settled Amount</p>
              <p className="mt-1 text-xs font-bold text-emerald-700">{settledAmount}</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2">
              <p className="text-[9.5px] font-medium text-slate-500">Source Bank</p>
              <p className="mt-1 text-xs font-bold text-slate-800">
                {invoice.payoutBank || 'Recorded'}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2">
              <p className="text-[9.5px] font-medium text-slate-500">Payout Reference</p>
              <p className="mt-1 truncate text-xs font-bold font-mono text-slate-800">
                {invoice.payoutReference || invoice.paymentRef || 'Settled'}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2">
              <p className="text-[9.5px] font-medium text-slate-500">Settlement Date</p>
              <p className="mt-1 text-xs font-bold text-slate-800">{settledDate || invoice.date}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-[10.5px] font-bold text-slate-800">Bank Transfer Details</h3>
              {cumulativePaid > 0 && (
                <span className="text-[9.5px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Balance: {formatRoundedAmount(remainingBalance)}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[9.5px] font-medium text-slate-500">
              Enter bank reference details once payout is transferred to DMC account.
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Transfer Reference Number (UTR / Ref)
              </label>
              {utrInput && (
                <span className={`text-[9.5px] font-bold ${
                  bankReferenceMatched ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {bankReferenceMatched ? 'Valid Bank Format' : 'Check Bank Match'}
                </span>
              )}
            </div>
            <input
              type="text"
              value={utrInput}
              onChange={(e) => setUtrInput(e.target.value)}
              placeholder="e.g. HDFC000123456789 or UTR98765432"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none transition-all focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Transfer Date
              </label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none transition-all focus:border-blue-500 cursor-pointer"
              />
            </div>

            <div className="relative">
              <label className="mb-1 block text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Source Bank Account
              </label>
              <button
                type="button"
                onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                className="flex h-[34px] w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate font-semibold">
                  {sourceBank ? (
                    <>
                      {BANK_LOGOS[sourceBank]}
                      <span>{sourceBank}</span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-normal">Select Bank</span>
                  )}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </button>

              {isBankDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20 bg-transparent"
                    onClick={() => setIsBankDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg hide-scrollbar">
                    {bankOptions.map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => {
                          setSourceBank(bank);
                          setIsBankDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        {BANK_LOGOS[bank]}
                        <span>{bank}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Payment Amount (₹)
              </label>
              {transferAmount && (
                <span className={`text-[9.5px] font-bold ${
                  payoutAmountMatches ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {payoutAmountMatches
                    ? `Matching ${formatRoundedAmount(remainingBalance)}`
                    : `Exceeds Balance (${formatRoundedAmount(remainingBalance)})`}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
              <input
                type="text"
                value={transferAmount}
                onChange={(e) => setTransferAmount(formatIntegerInput(e.target.value))}
                placeholder="Enter transfer amount"
                className="w-full rounded-lg border border-slate-200 bg-white pl-7 pr-3 py-2 text-xs font-extrabold text-slate-900 outline-none transition-all focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleReject}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
            >
              Reject Invoice
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`rounded-xl px-3 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer ${
                ratesMatch && payoutDetailsComplete && payoutAmountMatches && allChecksPassed
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              Confirm Payout
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentDetailsSection;
