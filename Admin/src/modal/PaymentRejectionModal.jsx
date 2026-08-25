import React, { useState, useRef, useEffect } from 'react';
import { X, XCircle, Clock, FileText, ShieldCheck, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

const REJECTION_REASONS = [
  'Incorrect UTR Number',
  'Incomplete Payment / Short Payment',
  'Invalid Bank Details',
  'Amount Mismatch',
  'Payment Proof Unclear/Blurred',
  'Duplicate Entry',
  'UTR Not Found in Bank Statement',
  'Other (Specify in Remarks)',
];

const PaymentRejectionModal = ({ onClose }) => {
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const dropdownRef = useRef(null);

  const reasonSelected = reason !== '';
  const remarksSufficient = remarks.trim().length >= 20;
  const canSubmit = reasonSelected && remarksSufficient;

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleConfirm = () => {
    if (!canSubmit) { setSubmitted(true); return; }
    alert(`Rejection confirmed!\nReason: ${reason}\nRemarks: ${remarks}`);
  };

  const showReasonError = submitted && !reasonSelected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative flex flex-col" style={{ maxHeight: '92vh' }}>

        {/* HEADER */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">Payment Rejection – Document Reason</h2>
              <p className="text-xs text-slate-400 mt-0.5">Finance team must provide a clear reason for payment rejection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors ml-2 shrink-0"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto">

          {/* DROPDOWN */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Select Rejection Reason
              <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(o => !o)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  showReasonError
                    ? 'border-red-400 bg-red-50/40 text-slate-500'
                    : reason
                    ? 'border-red-300 bg-white text-slate-800 font-medium'
                    : 'border-red-300 bg-white text-slate-400'
                } focus:outline-none`}
              >
                <span>{reason || '-- Choose a reason --'}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* DROPDOWN LIST */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div
                    onClick={() => { setReason(''); setDropdownOpen(false); }}
                    className="px-4 py-2.5 text-sm text-slate-400 hover:bg-gray-50 cursor-pointer"
                  >
                    -- Choose a reason --
                  </div>
                  {REJECTION_REASONS.map((r) => (
                    <div
                      key={r}
                      onClick={() => { setReason(r); setDropdownOpen(false); }}
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                        reason === r
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-slate-700 hover:bg-gray-50'
                      }`}
                    >
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {showReasonError && (
              <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> This field is required
              </p>
            )}
          </div>

          {/* REMARKS */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Additional Remarks &amp; Details
            </label>
            <textarea
              rows={4}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Provide detailed explanation for the rejection. This will be sent to the agent for correction..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {remarks.length} characters
              {!remarksSufficient && remarks.length > 0 && (
                <span className="text-amber-500"> • Provide specific details to help the agent correct the issue</span>
              )}
              {remarksSufficient && (
                <span className="text-green-500"> • Sufficient detail provided</span>
              )}
              {remarks.length === 0 && (
                <span> • Provide specific details to help the agent correct the issue</span>
              )}
            </p>
          </div>

          {/* VALIDATION CHECKLIST */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-700">Validation Checklist</span>
            </div>
            <div className="flex flex-col gap-2">
              <ChecklistItem
                done={reasonSelected}
                text="Rejection reason selected from dropdown"
              />
              <ChecklistItem
                done={remarksSufficient}
                text="Detailed remarks provided (minimum 20 characters)"
                pending={remarks.length > 0 && !remarksSufficient}
              />
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-700">Agent will receive notification with rejection details</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              canSubmit
                ? 'bg-red-500 hover:bg-red-600 text-white active:scale-95'
                : 'bg-red-200 text-white cursor-not-allowed'
            }`}
          >
            <XCircle className="w-4 h-4" />
            Confirm Rejection
          </button>
        </div>

      </div>
    </div>
  );
};

const ChecklistItem = ({ done, text, pending }) => (
  <div className="flex items-center gap-2">
    <CheckCircle2
      className={`w-4 h-4 shrink-0 transition-colors ${
        done ? 'text-green-500' : pending ? 'text-amber-400' : 'text-amber-300'
      }`}
    />
    <span className={`text-xs transition-colors ${done ? 'text-green-700' : 'text-amber-700'}`}>
      {text}
    </span>
  </div>
);

// // Demo wrapper
// const App = () => {
//   const [open, setOpen] = useState(true);
//   return (
//     <div className="min-h-screen bg-slate-100 flex items-center justify-center">
//       {!open && (
//         <button
//           onClick={() => setOpen(true)}
//           className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors"
//         >
//           Open Rejection Modal
//         </button>
//       )}
//       {open && <PaymentRejectionModal onClose={() => setOpen(false)} />}
//     </div>
//   );
// };

export default PaymentRejectionModal;