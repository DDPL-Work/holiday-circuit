import React from "react";
import { Landmark, Plus, Trash2, ChevronDown, MapPin, AlertTriangle, Clock, Zap } from "lucide-react";
import { formatLocationWithDestination, resolveSlotOptions, formatServiceDuration } from "../utils/packageUtils.js";
import { DayScheduleVisualizer } from "../components/DayScheduleVisualizer.jsx";

export const ActivitiesTab = ({
  activities,
  addActivity,
  removeActivity,
  updateActivity,
  handleActivityTourTypeChange,
  selectDmcActivity,
  getFilteredActivities,
  sightseeing,
  addSightseeing,
  removeSightseeing,
  updateSightseeing,
  handleSightseeingTourTypeChange,
  selectDmcSightseeing,
  getFilteredSightseeing,
  destination,
  servicesLoading,
  activeActivityDropdownIdx,
  setActiveActivityDropdownIdx,
  activeSightseeingDropdownIdx,
  setActiveSightseeingDropdownIdx,
  activityOrSightConflicts,
  conflictingDays,
  allScheduledItems,
  scheduleConflicts,
  handleShiftItemDay,
  totalDaysCount,
  getServiceConflicts,
  checkSlotAvailability,
}) => {
  return (
    <div className="space-y-6 pt-1">
      {activityOrSightConflicts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              <span className="font-semibold text-slate-900 truncate">
                Tour Schedule Conflict: <span className="font-normal text-slate-600">{activityOrSightConflicts.length} schedule conflict{activityOrSightConflicts.length > 1 ? "s" : ""} found.</span>
              </span>
            </div>
            <span className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 shrink-0">
              Action Needed
            </span>
          </div>

          {conflictingDays
            .filter((d) => activityOrSightConflicts.some((c) => c.day === d))
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

      {/* ACTIVITIES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
              <Landmark size={15} className="text-emerald-600" />
              Activities & Adventure Experiences
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Select contracted activities & adventures in <strong>{destination}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={addActivity}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus size={13} /> Add Activity
          </button>
        </div>

        <div className="space-y-3">
          {activities.map((act, index) => {
            const filteredActivities = getFilteredActivities(act.name, act);
            const cardConflicts = getServiceConflicts("activity", index);
            const slotOptions = resolveSlotOptions(act);
            const currentDayNum = Number(act.day || 1);
            const actDurMins = 120;

            return (
              <div
                key={index}
                className={`rounded-xl border ${cardConflicts.length > 0 ? "border-amber-300/80" : "border-gray-200"} bg-gray-50/50 p-4 space-y-3 relative shadow-2xs ${
                  activeActivityDropdownIdx === index ? "z-30 ring-1 ring-blue-500/50" : "z-10"
                }`}
              >
                {cardConflicts.length > 0 && (
                  <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-3 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="font-bold text-xs text-slate-900 block">Activity Timing Conflict</span>
                        <div className="text-xs text-slate-700 space-y-0.5">
                          {cardConflicts.map((c, cIdx) => (
                            <p key={cIdx}>• {c.detailedReason}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-amber-200/60">
                      <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                        <Zap size={11} className="text-amber-600" /> Quick Move:
                      </span>
                      {Array.from({ length: totalDaysCount }, (_, i) => i + 1)
                        .filter((d) => d !== currentDayNum)
                        .map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => updateActivity(index, "day", d)}
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
                      <Landmark size={14} className="text-emerald-600" /> Activity #{index + 1}
                    </span>

                    {act.tourType && (
                      <span className="rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] text-slate-800 font-semibold shadow-2xs">
                        {act.tourType}
                      </span>
                    )}

                    {act.duration && (
                      <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700 font-semibold">
                        ⏱ {formatServiceDuration(act)}
                      </span>
                    )}

                    {act.supplierName && (
                      <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700 font-semibold">
                        Supplier: {act.supplierName}
                      </span>
                    )}
                  </div>

                  {activities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeActivity(index)}
                      className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                      title="Remove Activity"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                  <div className={`sm:col-span-6 relative dmc-autocomplete-container ${activeActivityDropdownIdx === index ? "z-40" : "z-10"}`}>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                      <span>Activity Name (Select Activity or Type)</span>
                      {servicesLoading ? (
                        <span className="text-[10px] text-blue-600 font-medium">Loading Activities...</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          {getFilteredActivities("").length} Activities in {destination || "Selected Destination"}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Scuba Diving, Paragliding, Desert Safari..."
                        value={act.name}
                        onFocus={() => setActiveActivityDropdownIdx(index)}
                        onChange={(e) => {
                          updateActivity(index, "name", e.target.value);
                          setActiveActivityDropdownIdx(index);
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveActivityDropdownIdx(activeActivityDropdownIdx === index ? null : index)}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer transition-colors"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {activeActivityDropdownIdx === index && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl z-[100] divide-y divide-gray-100 [scrollbar-width:thin]">
                        {filteredActivities.length === 0 ? (
                          <div className="p-3 text-[11px] text-gray-500 italic text-center">
                            No activity found matching "{act.name}". You can freely type custom activity.
                          </div>
                        ) : (
                          filteredActivities.map((dmcAct, aIdx) => {
                            const actTitle = dmcAct.serviceName || dmcAct.name || dmcAct.title;
                            const isSelected = Boolean(act.name && actTitle.toLowerCase() === act.name.trim().toLowerCase());
                            const matchesDest = destination && (dmcAct.city || dmcAct.destination || "").toLowerCase().includes(destination.toLowerCase());

                            return (
                              <div
                                key={dmcAct._id || dmcAct.id || aIdx}
                                onClick={() => selectDmcActivity(index, dmcAct)}
                                className={`p-3 hover:bg-blue-50/60 cursor-pointer transition flex items-center justify-between gap-2 ${
                                  isSelected ? "bg-blue-50/90 border-l-3 border-l-blue-600" : matchesDest ? "bg-gray-50/60" : ""
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                    <Landmark size={13} className="text-emerald-600 shrink-0" />
                                    <span>{actTitle}</span>
                                    {isSelected && (
                                      <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] px-1.5 py-0.2 font-bold">
                                        ✓ Selected
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-gray-500 mt-0.5 truncate flex items-center gap-1 flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                      <MapPin size={11} className="text-rose-500 shrink-0" />
                                      {formatLocationWithDestination(dmcAct.city, dmcAct.destination, destination)}
                                    </span>
                                    • Tour: <span className="text-slate-700 font-medium">{dmcAct.tourType || "Sharing Tour"}</span> • Duration: {dmcAct.duration || "120 Mins"}
                                  </p>
                                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                                    Supplier: {dmcAct.supplierName || dmcAct.dmcName || "Contracted Supplier"}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-bold text-slate-900">
                                    ₹{Number(dmcAct.price || dmcAct.rate || 0).toLocaleString("en-IN")}
                                  </span>
                                  <span className="block text-[10px] text-gray-500">/ person</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Scheduled Day</label>
                    <select
                      value={act.day || 1}
                      onChange={(e) => updateActivity(index, "day", Number(e.target.value))}
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
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tour Type</label>
                    <select
                      value={act.tourType || ""}
                      onChange={(e) => handleActivityTourTypeChange(index, e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
                    >
                      <option value="">Select Tour Type</option>
                      <option value="Sharing Tour">Sharing Tour</option>
                      <option value="Private Tour">Private Tour</option>
                      <option value="Ticket Tour">Ticket Tour</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Time Slot</label>
                    <select
                      value={act.selectedSlot || act.time || "08:00"}
                      onChange={(e) => updateActivity(index, "selectedSlot", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
                    >
                      {slotOptions.map((slot) => {
                        const check = checkSlotAvailability("activity", index, slot, currentDayNum, actDurMins, allScheduledItems);
                        return (
                          <option key={slot} value={slot}>
                            {slot} {check.isConflicting ? `⚠️ (Clashes with ${check.conflictingWith})` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Adults</label>
                    <input
                      type="number"
                      min="1"
                      value={act.adults !== undefined ? act.adults : 2}
                      onChange={(e) => updateActivity(index, "adults", Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Children</label>
                    <input
                      type="number"
                      min="0"
                      value={act.children !== undefined ? act.children : 0}
                      onChange={(e) => updateActivity(index, "children", Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Cost (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 3500"
                      value={act.price || ""}
                      onChange={(e) => updateActivity(index, "price", Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIGHTSEEING SECTION */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
              <Landmark size={15} className="text-sky-600" />
              Sightseeing Tours & Attractions
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Select contracted sightseeing tours in <strong>{destination}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={addSightseeing}
            className="flex items-center gap-1.5 rounded-lg bg-sky-50 border border-sky-200 px-3.5 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 hover:border-sky-300 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus size={13} /> Add Sightseeing
          </button>
        </div>

        <div className="space-y-3">
          {sightseeing.map((sight, index) => {
            const filteredSightseeing = getFilteredSightseeing(sight.name, sight);
            const cardConflicts = getServiceConflicts("sightseeing", index);
            const slotOptions = resolveSlotOptions(sight);
            const currentDayNum = Number(sight.day || 1);
            const sightDurMins = 60;

            return (
              <div
                key={index}
                className={`rounded-xl border ${cardConflicts.length > 0 ? "border-amber-300/80" : "border-gray-200"} bg-gray-50/50 p-4 space-y-3 relative shadow-2xs ${
                  activeSightseeingDropdownIdx === index ? "z-30 ring-1 ring-blue-500/50" : "z-10"
                }`}
              >
                {cardConflicts.length > 0 && (
                  <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-3 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="font-bold text-xs text-slate-900 block">Sightseeing Timing Conflict</span>
                        <div className="text-xs text-slate-700 space-y-0.5">
                          {cardConflicts.map((c, cIdx) => (
                            <p key={cIdx}>• {c.detailedReason}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-amber-200/60">
                      <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                        <Zap size={11} className="text-amber-600" /> Quick Move:
                      </span>
                      {Array.from({ length: totalDaysCount }, (_, i) => i + 1)
                        .filter((d) => d !== currentDayNum)
                        .map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => updateSightseeing(index, "day", d)}
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
                      <Landmark size={14} className="text-sky-600" /> Sightseeing #{index + 1}
                    </span>

                    {sight.tourType && (
                      <span className="rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] text-slate-800 font-semibold shadow-2xs">
                        {sight.tourType}
                      </span>
                    )}

                    {sight.duration && (
                      <span className="rounded-md bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] text-sky-700 font-semibold">
                        ⏱ {formatServiceDuration(sight)}
                      </span>
                    )}

                    {sight.supplierName && (
                      <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700 font-semibold">
                        Supplier: {sight.supplierName}
                      </span>
                    )}
                  </div>

                  {sightseeing.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSightseeing(index)}
                      className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                      title="Remove Sightseeing"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                  <div className={`sm:col-span-6 relative dmc-autocomplete-container ${activeSightseeingDropdownIdx === index ? "z-40" : "z-10"}`}>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                      <span>Sightseeing Name (Select Tour or Type)</span>
                      {servicesLoading ? (
                        <span className="text-[10px] text-blue-600 font-medium">Loading Tours...</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          {getFilteredSightseeing("").length} Tours in {destination || "Selected Destination"}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Kempty Falls, Gun Hill Ropeway, Taj Mahal Tour..."
                        value={sight.name}
                        onFocus={() => setActiveSightseeingDropdownIdx(index)}
                        onChange={(e) => {
                          updateSightseeing(index, "name", e.target.value);
                          setActiveSightseeingDropdownIdx(index);
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveSightseeingDropdownIdx(activeSightseeingDropdownIdx === index ? null : index)}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer transition-colors"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {activeSightseeingDropdownIdx === index && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl z-[100] divide-y divide-gray-100 [scrollbar-width:thin]">
                        {filteredSightseeing.length === 0 ? (
                          <div className="p-3 text-[11px] text-gray-500 italic text-center">
                            No sightseeing found matching "{sight.name}". You can freely type custom tour.
                          </div>
                        ) : (
                          filteredSightseeing.map((dmcSight, sIdx) => {
                            const sightTitle = dmcSight.serviceName || dmcSight.name || dmcSight.title;
                            const isSelected = Boolean(sight.name && sightTitle.toLowerCase() === sight.name.trim().toLowerCase());
                            const matchesDest = destination && (dmcSight.city || dmcSight.destination || "").toLowerCase().includes(destination.toLowerCase());

                            return (
                              <div
                                key={dmcSight._id || dmcSight.id || sIdx}
                                onClick={() => selectDmcSightseeing(index, dmcSight)}
                                className={`p-3 hover:bg-blue-50/60 cursor-pointer transition flex items-center justify-between gap-2 ${
                                  isSelected ? "bg-blue-50/90 border-l-3 border-l-blue-600" : matchesDest ? "bg-gray-50/60" : ""
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                    <Landmark size={13} className="text-sky-600 shrink-0" />
                                    <span>{sightTitle}</span>
                                    {isSelected && (
                                      <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] px-1.5 py-0.2 font-bold">
                                        ✓ Selected
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-gray-500 mt-0.5 truncate flex items-center gap-1 flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                      <MapPin size={11} className="text-rose-500 shrink-0" />
                                      {formatLocationWithDestination(dmcSight.city, dmcSight.destination, destination)}
                                    </span>
                                    • Tour: <span className="text-slate-700 font-medium">{dmcSight.tourType || "Sharing Tour"}</span> • Duration: {dmcSight.duration || "60 Mins"}
                                  </p>
                                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                                    Supplier: {dmcSight.supplierName || dmcSight.dmcName || "Contracted Supplier"}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-bold text-slate-900">
                                    ₹{Number(dmcSight.price || dmcSight.rate || 0).toLocaleString("en-IN")}
                                  </span>
                                  <span className="block text-[10px] text-gray-500">/ person</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Scheduled Day</label>
                    <select
                      value={sight.day || 1}
                      onChange={(e) => updateSightseeing(index, "day", Number(e.target.value))}
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
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tour Type</label>
                    <select
                      value={sight.tourType || ""}
                      onChange={(e) => handleSightseeingTourTypeChange(index, e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
                    >
                      <option value="">Select Tour Type</option>
                      <option value="Sharing Tour">Sharing Tour</option>
                      <option value="Private Tour">Private Tour</option>
                      <option value="Ticket Tour">Ticket Tour</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Time Slot</label>
                    <select
                      value={sight.selectedSlot || sight.time || "08:00"}
                      onChange={(e) => updateSightseeing(index, "selectedSlot", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
                    >
                      {slotOptions.map((slot) => {
                        const check = checkSlotAvailability("sightseeing", index, slot, currentDayNum, sightDurMins, allScheduledItems);
                        return (
                          <option key={slot} value={slot}>
                            {slot} {check.isConflicting ? `⚠️ (Clashes with ${check.conflictingWith})` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Adults</label>
                    <input
                      type="number"
                      min="1"
                      value={sight.adults !== undefined ? sight.adults : 2}
                      onChange={(e) => updateSightseeing(index, "adults", Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Children</label>
                    <input
                      type="number"
                      min="0"
                      value={sight.children !== undefined ? sight.children : 0}
                      onChange={(e) => updateSightseeing(index, "children", Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Cost (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 1800"
                      value={sight.price || ""}
                      onChange={(e) => updateSightseeing(index, "price", Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActivitiesTab;
