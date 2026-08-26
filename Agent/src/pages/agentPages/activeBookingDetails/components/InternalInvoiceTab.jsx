import React from "react";

export const InternalInvoiceTab = ({
  booking,
  headerBookingId,
  expectedPaymentAmount,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4 mb-6">
      <h3 className="text-base font-bold text-slate-900">Internal Generated Invoice</h3>
      <div className="border border-slate-200 rounded-md p-4 bg-slate-50 flex items-center justify-between text-xs">
        <div>
          <p className="font-bold text-slate-900 text-sm">Invoice #{booking?.invoiceNumber || booking?.bookingReference || headerBookingId}</p>
          <p className="text-slate-500 mt-0.5">Payable Amount: INR {(expectedPaymentAmount || 38650).toLocaleString("en-IN")}</p>
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded text-xs">
          Generated
        </span>
      </div>
    </div>
  );
};
