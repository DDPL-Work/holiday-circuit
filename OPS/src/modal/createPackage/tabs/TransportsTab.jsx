import React from "react";
import { Car, Plus, Trash2, ChevronDown, MapPin, AlertTriangle, Clock, Zap } from "lucide-react";
import { formatLocationWithDestination, TRANSPORT_USAGE_OPTIONS } from "../utils/packageUtils.js";
import { DayScheduleVisualizer } from "../components/DayScheduleVisualizer.jsx";

export const TransportsTab = ({
  transfers,
  addTransfer,
  removeTransfer,
  updateTransfer,
  handleVehicleTypeChange,
  handleUsageChange,
  selectDmcTransfer,
  getFilteredTransfers,
  destination,
  servicesLoading,
  activeTransferDropdownIdx,
  setActiveTransferDropdownIdx,
  transferConflicts,
  conflictingDays,
  allScheduledItems,
  scheduleConflicts,
  handleShiftItemDay,
  totalDaysCount,
  getServiceConflicts,
}) => {
  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
            <Car size={15} className="text-sky-600" />
            Airport Transfers & Cabs
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Select from contracted transfer routes in <strong>{destination}</strong> or customize vehicles.
          </p>
        </div>
        <button
          type="button"
          onClick={addTransfer}
          className="flex items-center gap-1.5 rounded-lg bg-sky-50 border border-sky-200 px-3.5 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 hover:border-sky-300 transition-colors cursor-pointer shadow-2xs"
        >
          <Plus size={13} /> Add Transfer
        </button>
      </div>

      {transferConflicts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              <span className="font-semibold text-slate-900 truncate">
                Transport Timing Conflict: <span className="font-normal text-slate-600">{transferConflicts.length} schedule conflict{transferConflicts.length > 1 ? "s" : ""} found.</span>
              </span>
            </div>
            <span className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 shrink-0">
              Action Needed
            </span>
          </div>

          {conflictingDays
            .filter((d) => transferConflicts.some((c) => c.day === d))
            .map((dayNum) => (
              <DayScheduleVisualizer
                key={dayNum}
                dayNum={dayNum}
                scheduledItems={allScheduledItems}
                conflicts={scheduleConflicts}
                onShiftItemDay={handleShiftItemDay}
                totalDays={totalDaysCount}
              />
            ))}
        </div>
      )}

      <div className="space-y-3 pt-1">
        {transfers.map((transfer, index) => {
          const filteredTransfers = getFilteredTransfers(transfer.name, transfer);
          const availableVehicles = Array.isArray(transfer.vehiclesList) && transfer.vehiclesList.length > 0
            ? transfer.vehiclesList
            : [];
          const cardConflicts = getServiceConflicts("transfer", index);

          return (
            <div
              key={index}
              className={`rounded-xl border ${cardConflicts.length > 0 ? "border-amber-300/80" : "border-gray-200"} bg-gray-50/50 p-4 space-y-3 relative shadow-2xs ${
                activeTransferDropdownIdx === index ? "z-30 ring-1 ring-blue-500/50" : "z-10"
              }`}
            >
              {cardConflicts.length > 0 && (
                <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-3 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="font-bold text-xs text-slate-900 block">Pickup Timing Conflict</span>
                      <div className="text-xs text-slate-700 space-y-0.5">
                        {cardConflicts.map((c, cIdx) => (
                          <p key={cIdx}>
                            • {c.detailedReason}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-amber-200/60">
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Zap size={11} className="text-amber-600" /> Quick Move:
                    </span>
                    {Array.from({ length: totalDaysCount }, (_, i) => i + 1)
                      .filter((d) => d !== (transfer.day || 1))
                      .map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => updateTransfer(index, "day", d)}
                          className="rounded-md bg-white border border-gray-300 hover:bg-gray-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition shadow-2xs cursor-pointer"
                        >
                          Move to Day {d}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-gray-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Car size={14} className="text-sky-600" /> Transfer #{index + 1}
                  </span>

                  {transfer.vehicleType && (
                    <span className="rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] text-slate-800 font-semibold shadow-2xs">
                      {transfer.vehicleType}
                    </span>
                  )}

                  {Boolean(transfer.vehicleType) && (
                    <span className="rounded-md bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] text-sky-700 font-semibold">
                      👤 {transfer.passengerCapacity || 4} Pax
                    </span>
                  )}

                  {Boolean(transfer.vehicleType) && (
                    <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] text-indigo-700 font-semibold">
                      🧳 {transfer.luggageCapacity !== undefined ? transfer.luggageCapacity : 2} Bags
                    </span>
                  )}

                  {transfer.supplierName && (
                    <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700 font-semibold">
                      Supplier: {transfer.supplierName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Clock size={13} className="text-amber-600" />
                      Pickup Time:
                    </span>
                    <div className="relative flex items-center">
                      <input
                        type="time"
                        value={transfer.pickupTime || transfer.time || ""}
                        onChange={(e) => {
                          updateTransfer(index, "pickupTime", e.target.value);
                          updateTransfer(index, "time", e.target.value);
                        }}
                        className={`h-7 rounded-lg border px-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition cursor-pointer shadow-2xs ${
                          cardConflicts.length > 0 ? "border-amber-400 bg-amber-50/60 ring-1 ring-amber-400" : "border-gray-300 bg-white"
                        }`}
                      />
                      {(transfer.pickupTime || transfer.time) && (
                        <button
                          type="button"
                          onClick={() => {
                            updateTransfer(index, "pickupTime", "");
                            updateTransfer(index, "time", "");
                          }}
                          title="Clear time"
                          className="ml-1 text-gray-400 hover:text-rose-500 transition cursor-pointer text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {transfers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTransfer(index)}
                      className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                      title="Remove Transfer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                <div className={`sm:col-span-6 relative dmc-autocomplete-container ${activeTransferDropdownIdx === index ? "z-40" : "z-10"}`}>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                    <span>Route / Service Name (Select Route or Type)</span>
                    {servicesLoading ? (
                      <span className="text-[10px] text-blue-600 font-medium">Loading Routes...</span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        {getFilteredTransfers("").length} Routes in {destination || "Selected Destination"}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Airport to Hotel Pickup, Sightseeing Cab, Station Drop..."
                      value={transfer.name}
                      onFocus={() => setActiveTransferDropdownIdx(index)}
                      onChange={(e) => {
                        updateTransfer(index, "name", e.target.value);
                        setActiveTransferDropdownIdx(index);
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setActiveTransferDropdownIdx(activeTransferDropdownIdx === index ? null : index)}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer transition-colors"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {activeTransferDropdownIdx === index && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl z-[100] divide-y divide-gray-100 [scrollbar-width:thin]">
                      {filteredTransfers.length === 0 ? (
                        <div className="p-3 text-[11px] text-gray-500 italic text-center">
                          No route found matching "{transfer.name}". You can freely type custom transfer route.
                        </div>
                      ) : (
                        filteredTransfers.map((dmcTransfer, tIdx) => {
                          const routeTitle = dmcTransfer.serviceName || dmcTransfer.name || dmcTransfer.title;
                          const isSelected = Boolean(transfer.name && routeTitle.toLowerCase() === transfer.name.trim().toLowerCase());
                          const matchesDest = destination && (dmcTransfer.city || dmcTransfer.destination || "").toLowerCase().includes(destination.toLowerCase());

                          return (
                            <div
                              key={dmcTransfer._id || dmcTransfer.id || tIdx}
                              onClick={() => selectDmcTransfer(index, dmcTransfer)}
                              className={`p-3 hover:bg-blue-50/60 cursor-pointer transition flex items-center justify-between gap-2 ${
                                isSelected ? "bg-blue-50/90 border-l-3 border-l-blue-600" : matchesDest ? "bg-gray-50/60" : ""
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                  <Car size={13} className="text-sky-600 shrink-0" />
                                  <span>{routeTitle}</span>
                                  {isSelected && (
                                    <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] px-1.5 py-0.2 font-bold">
                                      ✓ Selected
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate flex items-center gap-1 flex-wrap">
                                  <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                    <MapPin size={11} className="text-rose-500 shrink-0" />
                                    {formatLocationWithDestination(dmcTransfer.city, dmcTransfer.destination, destination)}
                                  </span>
                                  • Vehicle: <span className="text-slate-700 font-medium">{dmcTransfer.vehicleType || "Sedan / Car"}</span> • Capacity: {dmcTransfer.passengerCapacity || 4} Pax
                                </p>
                                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                                  Supplier: {dmcTransfer.supplierName || dmcTransfer.dmcName || "Contracted Supplier"}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-slate-900">
                                  ₹{Number(dmcTransfer.price || dmcTransfer.total || dmcTransfer.rate || 0).toLocaleString("en-IN")}
                                </span>
                                <span className="block text-[10px] text-gray-500">/ trip</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Travel Day</label>
                  <select
                    value={transfer.day || 1}
                    onChange={(e) => updateTransfer(index, "day", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
                  >
                    {Array.from({ length: totalDaysCount }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Day {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Vehicle Type</label>
                  <select
                    value={transfer.vehicleType || ""}
                    onChange={(e) => handleVehicleTypeChange(index, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
                  >
                    <option value="">Select Vehicle Type</option>
                    {availableVehicles.length > 0 ? (
                      availableVehicles.map((v, vIdx) => (
                        <option key={vIdx} value={v.vehicleType}>
                          {v.vehicleType} ({v.passengerCapacity || 4} Pax)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Sedan / Dzire (4 Pax)">Sedan / Dzire (4 Pax)</option>
                        <option value="SUV / Ertiga (6 Pax)">SUV / Ertiga (6 Pax)</option>
                        <option value="Innova Crysta (6-7 Pax)">Innova Crysta (6-7 Pax)</option>
                        <option value="Tempo Traveller (12-16 Pax)">Tempo Traveller (12-16 Pax)</option>
                        <option value="Luxury Coach / Bus">Luxury Coach / Bus</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Usage</label>
                  <select
                    value={transfer.usage || "one-way-airport-transfer"}
                    onChange={(e) => handleUsageChange(index, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  >
                    {TRANSPORT_USAGE_OPTIONS.map((opt) => {
                      const optPrice = transfer.usagePrices && transfer.usagePrices[opt.value] !== undefined
                        ? Number(transfer.usagePrices[opt.value])
                        : Number(transfer.basePrice || 0);
                      return (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} (₹{optPrice.toLocaleString("en-IN")})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pax Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={transfer.passengerCapacity || 4}
                    onChange={(e) => updateTransfer(index, "passengerCapacity", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Luggage (Bags)</label>
                  <input
                    type="number"
                    min="0"
                    value={transfer.luggageCapacity !== undefined ? transfer.luggageCapacity : 2}
                    onChange={(e) => updateTransfer(index, "luggageCapacity", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Transfer Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 2400"
                    value={transfer.price || ""}
                    onChange={(e) => updateTransfer(index, "price", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransportsTab;
