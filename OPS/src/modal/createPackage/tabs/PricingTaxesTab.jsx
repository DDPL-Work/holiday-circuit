import React, { useMemo } from "react";
import { IndianRupee, Coins, BedDouble, Car, Sparkles, Landmark, Layers } from "lucide-react";

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
  hotels = [],
  transfers = [],
  activities = [],
  sightseeing = [],
}) => {
  const allSelectedServices = useMemo(() => {
    const list = [];

    // Hotels
    (hotels || []).forEach((h, idx) => {
      const title = h.hotelName || h.name || h.serviceName || "";
      if (!title.trim() && !Number(h.price)) return;
      const rCount = Math.max(1, Number(h.rooms || 1));
      const nCount = Math.max(1, Number(h.nights || 1));
      const bPrice = Number(h.basePrice || (h.price ? Math.round(Number(h.price) / (rCount * nCount)) : 0));
      const totPrice = Number(h.price || bPrice * rCount * nCount || 0);

      list.push({
        type: "hotel",
        id: `hotel-${idx}`,
        title: title || `Hotel ${idx + 1}`,
        subtitle: `Day ${h.day || 1} • ${h.roomType || h.roomCategory || "Standard Room"} • ${rCount} Room${rCount > 1 ? "s" : ""} • ${nCount} Night${nCount > 1 ? "s" : ""} • ${h.mealPlan || "EP"}${h.supplierName ? ` • DMC: ${h.supplierName}` : ""}`,
        details: [h.starCategory, h.bedType, h.maxAdults ? `Max: ${h.maxAdults} Adults` : null, h.description].filter(Boolean).join(" | "),
        price: totPrice,
        calcFormula: `(₹${bPrice.toLocaleString("en-IN")} × ${rCount} Room${rCount > 1 ? "s" : ""} × ${nCount} Night${nCount > 1 ? "s" : ""})`,
      });
    });

    // Transports
    (transfers || []).forEach((t, idx) => {
      const title = t.name || t.serviceName || t.title || "";
      if (!title.trim() && !Number(t.price)) return;
      const bPrice = Number(t.basePrice || t.price || 0);
      const totPrice = Number(t.price || bPrice || 0);
      const usageLabel = t.usage ? t.usage.replace(/-/g, " ") : "Transfer";

      list.push({
        type: "transfer",
        id: `transfer-${idx}`,
        title: title || `Transport ${idx + 1}`,
        subtitle: [t.vehicleType || "Sedan", `Day ${t.day || 1}`, usageLabel, t.supplierName ? `DMC: ${t.supplierName}` : null].filter(Boolean).join(" • "),
        details: [t.passengerCapacity ? `${t.passengerCapacity} Pax Capacity` : null, t.luggageCapacity ? `${t.luggageCapacity} Bags` : null, t.description].filter(Boolean).join(" | "),
        price: totPrice,
        calcFormula: bPrice > 0 && totPrice !== bPrice ? `(Base: ₹${bPrice.toLocaleString("en-IN")})` : null,
      });
    });

    // Activities
    (activities || []).forEach((a, idx) => {
      const title = a.name || a.serviceName || "";
      if (!title.trim() && !Number(a.price)) return;
      const paxNum = Math.max(1, Number(a.pax || (Number(a.adults || 2) + Number(a.children || 0)) || 1));
      const aRate = Number(a.adultPrice || a.basePrice || (a.price ? Math.round(Number(a.price) / paxNum) : 0));
      const totPrice = Number(a.price || (aRate * paxNum) || 0);

      list.push({
        type: "activity",
        id: `activity-${idx}`,
        title: title || `Activity ${idx + 1}`,
        subtitle: `Day ${a.day || 1} • ${a.tourType || "Group Tour"} • ${a.pricingBasis || "Per Pax"} • ${paxNum} Pax • Base: ₹${aRate.toLocaleString("en-IN")}${a.supplierName ? ` • DMC: ${a.supplierName}` : ""}`,
        details: [a.duration ? `${a.duration}` : null, a.selectedSlot || a.time ? `Slot: ${a.selectedSlot || a.time}` : null, a.description].filter(Boolean).join(" | "),
        price: totPrice,
        calcFormula: `(₹${aRate.toLocaleString("en-IN")} × ${paxNum} Pax)`,
      });
    });

    // Sightseeing
    (sightseeing || []).forEach((s, idx) => {
      const title = s.name || s.serviceName || "";
      if (!title.trim() && !Number(s.price)) return;
      const paxNum = Math.max(1, Number(s.pax || (Number(s.adults || 2) + Number(s.children || 0)) || 1));
      const aRate = Number(s.adultPrice || s.basePrice || (s.price ? Math.round(Number(s.price) / paxNum) : 0));
      const totPrice = Number(s.price || (aRate * paxNum) || 0);

      list.push({
        type: "sightseeing",
        id: `sightseeing-${idx}`,
        title: title || `Sightseeing ${idx + 1}`,
        subtitle: `Day ${s.day || 1} • ${s.tourType || "Group Tour"} • ${s.pricingBasis || "Per Pax"} • ${paxNum} Pax • Base: ₹${aRate.toLocaleString("en-IN")}${s.supplierName ? ` • DMC: ${s.supplierName}` : ""}`,
        details: [s.duration ? `${s.duration}` : null, s.selectedSlot || s.time ? `Slot: ${s.selectedSlot || s.time}` : null, s.description].filter(Boolean).join(" | "),
        price: totPrice,
        calcFormula: `(₹${aRate.toLocaleString("en-IN")} × ${paxNum} Pax)`,
      });
    });

    return list;
  }, [hotels, transfers, activities, sightseeing]);

  return (
    <div className="space-y-5 pt-1 font-sans">
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

      {/* Linked Services Overview Banner */}
      {totalLinkedServicesCost > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2.5 text-xs shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <IndianRupee size={14} className="text-blue-600" />
              Calculated Total of Linked Services:
            </span>
            <span className="text-base font-extrabold text-blue-700">
              ₹{totalLinkedServicesCost.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Includes {validHotelsCount} Hotel{validHotelsCount === 1 ? "" : "s"}, {validTransfersCount} Transfer{validTransfersCount === 1 ? "" : "s"}, {validActivitiesCount} Activity{validActivitiesCount === 1 ? "" : "ies"}, and {validSightseeingCount} Sightseeing tour{validSightseeingCount === 1 ? "" : "s"}.
          </p>
          <button
            type="button"
            onClick={() => {
              setBasePrice(totalLinkedServicesCost);
              setPrice(totalLinkedServicesCost);
            }}
            className="rounded-lg bg-blue-600 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-blue-700 transition cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
          >
            <span>Use ₹{totalLinkedServicesCost.toLocaleString("en-IN")} as Base Package Price</span>
          </button>
        </div>
      )}

      {/* Selected Services Dark Cards List */}
      {allSelectedServices.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers size={14} className="text-blue-600" />
              Selected Services ({allSelectedServices.length})
            </p>
            <span className="text-[11px] text-slate-400 font-medium">
              Live calculated rates from configured tabs
            </span>
          </div>

          <div className="space-y-2.5">
            {allSelectedServices.map((item) => {
              let badgeIcon = <Sparkles size={12} className="text-emerald-600" />;
              let badgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-200";
              let badgeLabel = "Activity";
              let priceColor = "text-emerald-700";

              if (item.type === "hotel") {
                badgeIcon = <BedDouble size={12} className="text-blue-600" />;
                badgeClass = "bg-blue-50 text-blue-700 border border-blue-200";
                badgeLabel = "Hotel";
                priceColor = "text-blue-700";
              } else if (item.type === "transfer") {
                badgeIcon = <Car size={12} className="text-sky-600" />;
                badgeClass = "bg-sky-50 text-sky-700 border border-sky-200";
                badgeLabel = "Transport";
                priceColor = "text-sky-700";
              } else if (item.type === "sightseeing") {
                badgeIcon = <Landmark size={12} className="text-purple-600" />;
                badgeClass = "bg-purple-50 text-purple-700 border border-purple-200";
                badgeLabel = "Sightseeing";
                priceColor = "text-purple-700";
              }

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-white p-3.5 sm:p-4 transition hover:border-blue-300 hover:shadow-xs shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 mt-0.5 ${badgeClass}`}>
                        {badgeIcon}
                        <span>{badgeLabel}</span>
                      </span>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
                          {item.title}
                        </h4>
                        {item.subtitle && (
                          <p className="text-xs text-slate-600 mt-1 leading-snug">
                            {item.subtitle}
                          </p>
                        )}
                        {item.details && (
                          <p className="text-[11px] text-slate-400 italic mt-0.5 leading-snug line-clamp-1">
                            {item.details}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 pl-10 sm:pl-0">
                      <p className={`text-sm sm:text-base font-extrabold ${priceColor}`}>
                        ₹ {item.price.toLocaleString("en-IN")}
                      </p>
                      {item.calcFormula && (
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          {item.calcFormula}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
