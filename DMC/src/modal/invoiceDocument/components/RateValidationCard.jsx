import React from 'react';
import { CheckCircle, AlertTriangle, Check, X, AlertCircle, Info, XCircle } from 'lucide-react';
import { formatRoundedAmount, getNumericAmount } from '../utils/invoiceHelpers.jsx';

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
  const opsAmt = getNumericAmount(roundedAgreedRate);
  const dmcAmt = getNumericAmount(roundedInvoicedAmount);
  const rateDiff = Math.round(dmcAmt - opsAmt);

  return (
    <div className={`rounded-lg border p-3 ${
      financeValidationPassed || (!ratesMatch && allChecksPassed)
        ? "border-emerald-200 bg-emerald-50/70"
        : "border-amber-200 bg-amber-50/80"
    }`}>
      <div className="mb-2.5 flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          {financeValidationPassed ? (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          ) : !ratesMatch && allChecksPassed ? (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          )}
          <span className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${
            financeValidationPassed
              ? "text-emerald-700"
              : !ratesMatch && allChecksPassed
              ? "text-emerald-800"
              : "text-amber-700"
          }`}>
            {ratesMatch ? "Rate Validation / Match" : "Rate Validation / Mismatch Detected"}
          </span>
        </div>

        {!ratesMatch && (
          <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
            rateDiff > 0
              ? "bg-amber-100/90 text-amber-900 border-amber-300"
              : "bg-rose-100/90 text-rose-900 border-rose-300"
          }`}>
            <span>Rate Diff:</span>
            <span>{rateDiff > 0 ? `+ ${formatRoundedAmount(rateDiff)} (Higher)` : `- ${formatRoundedAmount(Math.abs(rateDiff))} (Lower)`}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col justify-between rounded-md border border-emerald-100 bg-white p-2.5 shadow-2xs">
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

        <div className={`flex flex-col justify-between rounded-md border p-2.5 shadow-2xs ${
          ratesMatch
            ? "border-emerald-100 bg-white"
            : "border-amber-200 bg-amber-50/40"
        }`}>
          <div>
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <p className="text-[8.5px] font-bold uppercase tracking-wide leading-snug text-slate-500">
                DMC Internal Invoice Services Total
              </p>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
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
        <div className="mt-2 rounded-md border border-white/70 bg-white/85 px-2.5 py-2 shadow-2xs">
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
            {amountValidationRows.map((row) => {
              const diff = Math.round(Number(row.uploaded || 0) - Number(row.expected || 0));
              const hasDiff = !row.matched && Math.abs(diff) > 0;

              return (
                <div
                  key={row.label}
                  className={`grid grid-cols-[85px_1fr_auto] items-center gap-2 text-[9.5px] ${
                    manualChecks[row.key] === 'pass'
                      ? "text-emerald-700 font-semibold"
                      : manualChecks[row.key] === 'fail'
                      ? "text-rose-600 font-semibold"
                      : "text-slate-500"
                  }`}
                >
                  <span className="font-semibold">{row.label}</span>
                  <div className="flex items-center gap-1 min-w-0 flex-wrap">
                    <span className="truncate">
                      DMC {formatRoundedAmount(row.uploaded)} / System {formatRoundedAmount(row.expected)}
                    </span>
                    {hasDiff && (
                      <span className={`inline-flex text-[8px] font-extrabold px-1 py-0.2 rounded shrink-0 ${
                        diff > 0
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}>
                        {diff > 0 ? `+${formatRoundedAmount(diff)}` : `-${formatRoundedAmount(Math.abs(diff))}`}
                      </span>
                    )}
                  </div>
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
              );
            })}
            <div className={`grid grid-cols-[85px_1fr_auto] items-center gap-2 text-[9.5px] ${
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

      <div className={`mt-2 rounded-md border px-2.5 py-2 ${
        ratesMatch
          ? allChecksPassed
            ? 'border-emerald-200 bg-white/80'
            : 'border-amber-200 bg-white/80'
          : allChecksPassed
          ? 'border-emerald-200 bg-emerald-50/60'
          : 'border-amber-200 bg-amber-50'
      }`}>
        <p className={`text-[9.5px] leading-4 ${
          financeValidationPassed || (!ratesMatch && allChecksPassed) ? 'text-emerald-700' : 'text-amber-700'
        }`}>
          {financeValidationPassed
            ? '✓ Service totals and uploaded invoice amount match. Finance can continue with verification and payout processing.'
            : !ratesMatch && allChecksPassed
            ? '✓ Rate discrepancy reviewed and accepted by Finance based on DMC remarks. All checklist items marked as Pass.'
            : !ratesMatch
            ? '⚠ Rate Mismatch Detected: DMC rate differs from Ops quotation. Please read the DMC Remark / Justification below to understand why the rate differs, and manually verify/pass each check before payout settlement (or Reject / Pass to Manager).'
            : 'Service total matches, but manual uploaded subtotal, tax, grand total, or total check is pending or failed. Finance must manually verify and pass all checks before payout settlement.'}
        </p>
      </div>
    </div>
  );
};

export default RateValidationCard;
