import React from "react";
import { formatCurrencyValue, formatAmountValue, convertAmountToInr } from "./utils";

/* ─────────────────────────────────────────────────
   AddonRow — reusable helper for A.W.E.B etc.
───────────────────────────────────────────────── */
const AddonRow = ({
  label,
  sublabel,
  checked,
  onChange,
  rate,
  currencyCode,
  isForeignCurrency,
  exchangeRates,
  accentClass,
  borderHover,
}) => (
  <div
    className={`rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition-colors shadow-2xs ${borderHover}`}
  >
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-[#3E63DD] focus:ring-[#3E63DD] shrink-0 cursor-pointer"
        />
        <div>
          <p className="text-[11px] font-semibold text-slate-900">{label}</p>
          <p className="text-[9.5px] font-medium text-slate-500">{sublabel}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-[11px] font-bold ${accentClass}`}>
          {formatCurrencyValue(rate, currencyCode)}
        </p>
        {isForeignCurrency && (
          <p className="text-[10px] font-semibold text-sky-700">
            ₹{" "}
            {formatAmountValue(
              convertAmountToInr(rate, currencyCode, exchangeRates),
            )}
          </p>
        )}
      </div>
    </label>
  </div>
);

export default AddonRow;
