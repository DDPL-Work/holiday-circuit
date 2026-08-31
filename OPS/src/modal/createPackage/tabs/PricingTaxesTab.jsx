import React from "react";
import { IndianRupee, Coins } from "lucide-react";

export const PricingTaxesTab = ({
  basePrice,
  setBasePrice,
  price,
  setPrice,
  gstChecked,
  setGstChecked,
  gstPercent,
  setGstPercent,
  tcsChecked,
  setTcsChecked,
  tcsPercent,
  setTcsPercent,
  tourismChecked,
  setTourismChecked,
  tourismAmount,
  setTourismAmount,
  numBaseCost,
  gstAmt,
  tcsAmt,
  tourismAmt,
  totalTaxAmt,
  finalCalculatedPrice,
  totalLinkedServicesCost,
  validHotelsCount,
  validTransfersCount,
  validActivitiesCount,
  validSightseeingCount,
}) => {
  return (
    <div className="space-y-5 pt-1">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
            <Coins size={15} className="text-emerald-600" />
            5. Package Pricing, Taxes & Costing
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure base package rate per person, GST, TCS, and government fees.
          </p>
        </div>
      </div>

      {totalLinkedServicesCost > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2 text-xs shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <IndianRupee size={14} className="text-blue-600" />
              Calculated Total of Linked Services:
            </span>
            <span className="text-sm font-extrabold text-blue-700">
              ₹{totalLinkedServicesCost.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Includes {validHotelsCount} Hotel{validHotelsCount === 1 ? "" : "s"}, {validTransfersCount} Transfer{validTransfersCount === 1 ? "" : "s"}, {validActivitiesCount} Activity{validActivitiesCount === 1 ? "" : "ies"}, and {validSightseeingCount} Sightseeing tour{validSightseeingCount === 1 ? "" : "s"}.
          </p>
          <button
            type="button"
            onClick={() => setBasePrice(totalLinkedServicesCost)}
            className="mt-1 rounded-md bg-blue-600 text-white px-3 py-1 text-xs font-semibold hover:bg-blue-700 transition cursor-pointer shadow-2xs"
          >
            Use ₹{totalLinkedServicesCost.toLocaleString("en-IN")} as Base Package Price
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Base Package Price (before Tax) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">₹</span>
            <input
              type="number"
              min="0"
              required
              placeholder="e.g. 45000"
              value={basePrice || price}
              onChange={(e) => {
                setBasePrice(e.target.value);
                setPrice(e.target.value);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white pl-7 pr-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Final Payable Package Price (incl. Taxes)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">₹</span>
            <input
              type="number"
              readOnly
              value={finalCalculatedPrice || ""}
              className="w-full rounded-lg border border-emerald-200 bg-emerald-50/60 pl-7 pr-3 py-2 text-xs font-extrabold text-emerald-800 shadow-2xs"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <p className="text-xs font-bold text-slate-900">Tax & Surcharge Breakdown</p>
        
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* GST */}
          <div className={`rounded-xl border p-3.5 space-y-2 transition shadow-2xs ${gstChecked ? "border-blue-300 bg-blue-50/40" : "border-gray-200 bg-white"}`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gstChecked}
                onChange={(e) => setGstChecked(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-900">Goods & Services Tax (GST)</span>
            </label>

            {gstChecked && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Rate:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="28"
                      value={gstPercent}
                      onChange={(e) => setGstPercent(e.target.value)}
                      className="w-14 rounded-md border border-gray-300 bg-white px-2 py-0.5 text-xs text-center font-bold"
                    />
                    <span className="text-gray-500 font-bold">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
                  <span className="text-gray-600">GST Amount:</span>
                  <span className="font-bold text-blue-700">₹{gstAmt.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
          </div>

          {/* TCS */}
          <div className={`rounded-xl border p-3.5 space-y-2 transition shadow-2xs ${tcsChecked ? "border-indigo-300 bg-indigo-50/40" : "border-gray-200 bg-white"}`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tcsChecked}
                onChange={(e) => setTcsChecked(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-900">Tax Collected at Source (TCS)</span>
            </label>

            {tcsChecked && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Rate:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={tcsPercent}
                      onChange={(e) => setTcsPercent(e.target.value)}
                      className="w-14 rounded-md border border-gray-300 bg-white px-2 py-0.5 text-xs text-center font-bold"
                    />
                    <span className="text-gray-500 font-bold">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
                  <span className="text-gray-600">TCS Amount:</span>
                  <span className="font-bold text-indigo-700">₹{tcsAmt.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tourism Tax */}
          <div className={`rounded-xl border p-3.5 space-y-2 transition shadow-2xs ${tourismChecked ? "border-amber-300 bg-amber-50/40" : "border-gray-200 bg-white"}`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tourismChecked}
                onChange={(e) => setTourismChecked(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-900">Government Tourism Fee</span>
            </label>

            {tourismChecked && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Fixed Fee (₹):</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={tourismAmount}
                    onChange={(e) => setTourismAmount(e.target.value)}
                    className="w-20 rounded-md border border-gray-300 bg-white px-2 py-0.5 text-xs text-right font-bold"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
                  <span className="text-gray-600">Tourism Fee:</span>
                  <span className="font-bold text-amber-700">₹{tourismAmt.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingTaxesTab;
