import React from 'react';
import { CheckCircle, AlertTriangle, Check, X, AlertCircle, Info, XCircle } from 'lucide-react';
import { formatRoundedAmount } from '../utils/invoiceHelpers.jsx';

export const RateValidationCard = ({
  financeValidationPassed,
  roundedAgreedRate,
  roundedInvoicedAmount,
  ratesMatch,
  roundedTaxAmount,
  showManualChecks,
  invoiceExtraction,
  extractionPassed,
  extractionFailed,
  extractionFieldChecks,
  extractionWarnings,
  extractionNotes,
  manualVerificationStatus,
  amountValidationRows,
  manualChecks,
  setManualChecks,
  handleVerifyPass,
  uploadedSummary,
  expectedSummary,
  allChecksPassed,
}) => {
  return (
    <div className={`rounded-xl border p-3 ${
      financeValidationPassed
        ? "border-emerald-200 bg-emerald-50"
        : "border-amber-200 bg-amber-50"
    }`}>
      <div className="mb-2.5 flex items-center gap-1.5">
        {financeValidationPassed ? (
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        )}
        <span className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${
          financeValidationPassed ? "text-emerald-700" : "text-amber-700"
        }`}>
          Rate Validation / Match
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col justify-between rounded-lg border border-emerald-100 bg-white p-2.5">
          <div>
            <p className="text-[8.5px] font-bold uppercase tracking-wide leading-snug text-slate-500">
              Ops Selected Services Total
            </p>
            <div className="mt-1.5 flex items-center gap-1">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="text-[17px] font-extrabold leading-none text-emerald-600">
                {roundedAgreedRate}
              </span>
            </div>
          </div>
          <p className="mt-2 text-[9px] font-medium leading-tight text-slate-500">
            Total of the services selected by ops in the quotation
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-emerald-100 bg-white p-2.5">
          <div>
            <p className="text-[8.5px] font-bold uppercase tracking-wide leading-snug text-slate-500">
              DMC Internal Invoice Services Total
            </p>
            <div className="mt-1.5 flex items-center gap-1">
              {ratesMatch ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              )}
              <span className={`text-[17px] font-extrabold leading-none ${
                ratesMatch ? "text-emerald-600" : "text-amber-600"
              }`}>
                {roundedInvoicedAmount}
              </span>
            </div>
          </div>
          <p className="mt-2 text-[9px] font-medium leading-tight text-slate-500">
            Total of DMC service prices. Invoice tax shown separately: {roundedTaxAmount}
          </p>
        </div>
      </div>

      {showManualChecks && (
        <div className="mt-2 rounded-lg border border-white/70 bg-white/85 px-2.5 py-2">
          {invoiceExtraction.status ? (
            <div className={`mb-2 rounded-lg border px-2 py-1.5 ${
              extractionPassed
                ? "border-emerald-100 bg-emerald-50/70"
                : extractionFailed
                  ? "border-rose-100 bg-rose-50/80"
                : "border-amber-100 bg-amber-50/80"
            }`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] ${
                  extractionPassed
                    ? "text-emerald-700"
                    : extractionFailed
                      ? "text-rose-700"
                      : "text-amber-700"
                }`}>
                  OCR / PDF Parser
                </p>
                <span className="text-[9.5px] font-bold text-slate-500">
                  {(invoiceExtraction.source || "parser").replace(/_/g, " ")} · {invoiceExtraction.confidence || 0}%
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[9.5px]">
                {extractionFieldChecks.map((field) => (
                  <div
                    key={field.key}
                    className={`flex flex-col justify-between p-1.5 rounded-lg border shadow-sm transition-all duration-200 cursor-default ${
                      field.key === 'grandTotal' ? 'col-span-2' : ''
                    } ${
                      field.matched 
                        ? "bg-emerald-500/10 border-emerald-200/50 text-emerald-950" 
                        : "bg-rose-500/10 border-rose-200/50 text-rose-950"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1 opacity-80">
                      <span className="text-[8.5px] font-extrabold uppercase tracking-wider">
                        {field.label}
                      </span>
                      {field.matched ? (
                        <CheckCircle size={10} className="text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle size={10} className="text-rose-600 shrink-0" />
                      )}
                    </div>
                    <span className="font-extrabold text-[10px] leading-tight">
                      {field.primaryValue}
                    </span>
                    {field.secondaryValue && (
                      <span className="mt-0.5 text-[8.5px] font-medium text-slate-500/80 leading-normal">
                        {field.secondaryValue}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {extractionWarnings.length ? (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-500/10 border border-amber-200/50 p-2 text-[9.5px] leading-relaxed text-amber-950 shadow-sm">
                  <AlertCircle size={11} className="mt-0.5 shrink-0 text-amber-600" />
                  <span>{extractionWarnings.join(" ")}</span>
                </div>
              ) : null}
              {extractionNotes.length ? (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-blue-500/10 border border-blue-200/50 p-2 text-[9.5px] leading-relaxed text-blue-950 shadow-sm">
                  <Info size={11} className="mt-0.5 shrink-0 text-blue-600" />
                  <span>{extractionNotes.join(" ")}</span>
                </div>
              ) : null}
              {invoiceExtraction.error ? (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-rose-500/10 border border-rose-200/50 p-2 text-[9.5px] leading-relaxed text-rose-950 shadow-sm">
                  <AlertCircle size={11} className="mt-0.5 shrink-0 text-rose-700" />
                  <span>{invoiceExtraction.error}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Uploaded Amount Check
            </p>
            <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold ${
              manualVerificationStatus === 'pass'
                ? "text-emerald-700"
                : manualVerificationStatus === 'fail'
                ? "text-rose-600"
                : "text-amber-600"
            }`}>
              {manualVerificationStatus === 'pass' ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Verified</span>
                </>
              ) : manualVerificationStatus === 'fail' ? (
                <>
                  <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span>Failed</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Pending Verification</span>
                </>
              )}
            </span>
          </div>
          <div className="space-y-1">
            {amountValidationRows.map((row) => (
              <div
                key={row.label}
                className={`grid grid-cols-[92px_1fr_auto] items-center gap-2 text-[9.5px] ${
                  manualChecks[row.key] === 'pass'
                    ? "text-emerald-700 font-semibold"
                    : manualChecks[row.key] === 'fail'
                    ? "text-rose-600 font-semibold"
                    : "text-slate-500"
                }`}
              >
                <span className="font-semibold">{row.label}</span>
                <span className="truncate">
                  DMC {formatRoundedAmount(row.uploaded)} / System {formatRoundedAmount(row.expected)}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleVerifyPass(row.key, row.uploaded, row.expected, row.label)}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200 ease-out transform active:scale-75 cursor-pointer ${
                      manualChecks[row.key] === 'pass'
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_2px_4px_rgba(16,185,129,0.2)] scale-105 font-bold'
                        : 'border-slate-200 bg-slate-50/40 text-slate-300 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50/20'
                    }`}
                    title="Mark as Pass"
                  >
                    <Check className={`h-2.5 w-2.5 stroke-[4.5px] transition-transform duration-200 ${manualChecks[row.key] === 'pass' ? 'scale-110' : 'scale-100'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualChecks(prev => ({
                      ...prev,
                      [row.key]: prev[row.key] === 'fail' ? 'pending' : 'fail'
                    }))}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200 ease-out transform active:scale-75 cursor-pointer ${
                      manualChecks[row.key] === 'fail'
                        ? 'border-rose-500 bg-rose-500 text-white shadow-[0_2px_4px_rgba(244,63,94,0.2)] scale-105 font-bold'
                        : 'border-slate-200 bg-slate-50/40 text-slate-300 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50/20'
                    }`}
                    title="Mark as Fail"
                  >
                    <X className={`h-2.5 w-2.5 stroke-[4.5px] transition-transform duration-200 ${manualChecks[row.key] === 'fail' ? 'scale-110' : 'scale-100'}`} />
                  </button>
                </div>
              </div>
            ))}
            <div className={`grid grid-cols-[92px_1fr_auto] items-center gap-2 text-[9.5px] ${
              manualChecks.totalCheck === 'pass'
                ? "text-emerald-700 font-semibold"
                : manualChecks.totalCheck === 'fail'
                ? "text-rose-600 font-semibold"
                : "text-slate-500"
            }`}>
              <span className="font-semibold">Total Check</span>
              <span className="truncate">
                DMC subtotal + tax = {formatRoundedAmount(uploadedSummary.subtotal + uploadedSummary.taxAmount)}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleVerifyPass('totalCheck', uploadedSummary.subtotal + uploadedSummary.taxAmount, expectedSummary.subtotal + expectedSummary.totalTax, 'Total Check')}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200 ease-out transform active:scale-75 cursor-pointer ${
                    manualChecks.totalCheck === 'pass'
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_2px_4px_rgba(16,185,129,0.2)] scale-105 font-bold'
                      : 'border-slate-200 bg-slate-50/40 text-slate-300 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50/20'
                  }`}
                  title="Mark as Pass"
                >
                  <Check className={`h-2.5 w-2.5 stroke-[4.5px] transition-transform duration-200 ${manualChecks.totalCheck === 'pass' ? 'scale-110' : 'scale-100'}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setManualChecks(prev => ({
                    ...prev,
                    totalCheck: prev.totalCheck === 'fail' ? 'pending' : 'fail'
                  }))}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200 ease-out transform active:scale-75 cursor-pointer ${
                    manualChecks.totalCheck === 'fail'
                      ? 'border-rose-500 bg-rose-500 text-white shadow-[0_2px_4px_rgba(244,63,94,0.2)] scale-105 font-bold'
                      : 'border-slate-200 bg-slate-50/40 text-slate-300 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50/20'
                  }`}
                  title="Mark as Fail"
                >
                  <X className={`h-2.5 w-2.5 stroke-[4.5px] transition-transform duration-200 ${manualChecks.totalCheck === 'fail' ? 'scale-110' : 'scale-100'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`mt-2 rounded-lg border px-2.5 py-2 ${
        ratesMatch
          ? allChecksPassed
            ? 'border-emerald-200 bg-white/80'
            : 'border-amber-200 bg-white/80'
          : 'border-amber-200 bg-amber-50'
      }`}>
        <p className={`text-[9.5px] leading-4 ${
          financeValidationPassed ? 'text-emerald-700' : 'text-amber-700'
        }`}>
          {financeValidationPassed
            ? 'Service totals and uploaded invoice amount match, so finance can continue with verification and payout processing.'
            : ratesMatch
              ? 'Service total matches, but manual uploaded subtotal, tax, grand total, or total check is pending or failed. Finance must manually verify and pass all checks before payout settlement.'
              : 'Service totals do not match. Finance should reject the invoice or review the reason before moving ahead. Rejection will notify the DMC on their dashboard bell icon.'}
        </p>
      </div>
    </div>
  );
};

export default RateValidationCard;
