import React from "react";
import { CreditCard } from "lucide-react";
import { DEFAULT_SELLER_BANK_DETAILS } from "../../utils/queryDetailsHelpers";

export const QuoteSellerBankDetailsCard = ({ bankDetails = [] }) => {
  const items = Array.isArray(bankDetails) && bankDetails.length > 0
    ? bankDetails
    : DEFAULT_SELLER_BANK_DETAILS;

  return (
    <div className="mb-4 rounded-xl border border-orange-200 bg-white p-3">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
          <CreditCard size={14} />
        </div>
        <h4 className="font-semibold text-sm text-gray-900">Seller&apos;s Bank Details</h4>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.label || idx} className="rounded-xl border border-gray-200 bg-gray-50 p-3" style={{ borderLeft: "3px solid #f97316" }}>
            <p className="text-[13px] leading-relaxed text-slate-800">
              <span className="font-semibold text-slate-900">{item.label}:</span>{" "}
              <span>{item.value}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
