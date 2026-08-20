import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  BedDouble,
  Car,
  Landmark,
  Sparkles,
  Package,
  CalendarDays,
  Building2,
  Star,
  Check,
  Search,
  ChevronDown,
  IndianRupee,
  Coins,
  MapPin,
  Clock,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Info,
  Calendar,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import API from "../utils/Api.js";
import toast from "react-hot-toast";

const POPULAR_DESTINATIONS = [
  "Goa",
  "Dubai",
  "Kashmir",
  "Kerala",
  "Mussoorie",
  "Himachal",
  "Thailand",
  "Bali",
  "Andaman",
  "Rajasthan",
  "Singapore",
];

const initialHotel = () => ({
  serviceName: "",
  hotelName: "",
  name: "",
  roomType: "Standard Room",
  roomCategory: "Double",
  rooms: 1,
  nights: 1,
  day: "1",
  bedType: "Queen Bed",
  extraBedType: "None",
  maxAdults: 2,
  maxChildren: 1,
  mealPlan: "EP",
  basePrice: 0,
  price: 0,
  unit: "night",
  quantity: 1,
  supplier: "",
  supplierName: "",
  starCategory: "5 Star",
  description: "",
  extraAdult: false,
  childWithBed: false,
  childWithoutBed: false,
  awebRate: 0,
  cwebRate: 0,
  cwoebRate: 0,
  hotelsList: [],
  selectedHotelIdx: 0,
});

const initialTransfer = () => ({
  serviceName: "",
  name: "",
  title: "",
  vehicleType: "",
  passengerCapacity: 4,
  luggageCapacity: 2,
  day: "1",
  days: 1,
  usage: "one-way-airport-transfer",
  usagePrices: {
    "one-way-airport-transfer": 0,
    "inter-hotel-transfer": 0,
    "full-day": 0,
    "half-day": 0,
  },
  basePrice: 0,
  price: "",
  unit: "trip",
  quantity: 1,
  supplier: "",
  supplierName: "",
  vehiclesList: [],
  selectedVehicleIdx: 0,
  description: "",
  fullDayNote: "",
  halfDayNote: "",
  fullDayExtraPerKmRate: 0,
  halfDayExtraPerKmRate: 0,
  pickupTime: "",
  time: "",
});

const formatServiceDuration = (serv = {}, tourObj = {}) => {
  let dur = serv.duration || tourObj?.duration || "";
  
  if (!dur) {
    const descText = `${tourObj?.description || ""} ${serv.description || ""} ${serv.desc || ""}`;
    const minMatch = descText.match(/(\d+)\s*(?:mins?|minutes?)/i);
    const hrMatch = descText.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
    if (minMatch) {
      dur = minMatch[1];
    } else if (hrMatch) {
      dur = Math.round(parseFloat(hrMatch[1]) * 60);
    }
  }

  if (!dur) return "";

  const num = Number(String(dur).replace(/[^\d.]/g, ""));
  if (!isNaN(num) && num > 0) {
    const totalMins = num;
    const hrs = totalMins / 60;
    if (hrs >= 1) {
      if (Number.isInteger(hrs)) {
        return `${totalMins} Mins (${hrs} ${hrs === 1 ? "Hour" : "Hours"})`;
      } else {
        const hPart = Math.floor(hrs);
        const mPart = totalMins % 60;
        return `${totalMins} Mins (${hPart}h ${mPart}m)`;
      }
    }
    return `${totalMins} Mins`;
  }

  return String(dur);
};

const resolveSlotOptions = (serv = {}) => {
  const rawSlots = String(serv.slots || "").trim();
  const openTime = serv.openingTime || "08:00";
  const closeTime = serv.closingTime || "18:00";

  const generateRangeSlots = (open, close) => {
    const [oh] = String(open).split(":").map(Number);
    const [ch] = String(close).split(":").map(Number);
    const startHour = !isNaN(oh) ? oh : 8;
    const endHour = !isNaN(ch) ? ch : 18;
    const list = [];
    for (let h = startHour; h <= endHour; h++) {
      list.push(`${String(h).padStart(2, "0")}:00`);
    }
    return list.length > 0 ? list : ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
  };

  if (!rawSlots) {
    return generateRangeSlots(openTime, closeTime);
  }

  const parsed = rawSlots
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (
    parsed.length === 2 &&
    ((parsed[0] === openTime && parsed[1] === closeTime) ||
      (parsed[0] === "08:00" && parsed[1] === "18:00"))
  ) {
    return generateRangeSlots(parsed[0], parsed[1]);
  }

  if (rawSlots.includes("-") && parsed.length === 1) {
    const [start, end] = rawSlots.split("-").map((s) => s.trim());
    return generateRangeSlots(start, end);
  }

  return parsed;
};

// ==========================================
// 🕒 SCHEDULE CONFLICT DETECTION & VISUAL HELPERS
// ==========================================

// Convert time string "HH:MM" (e.g. "09:30") to minutes from midnight
const timeStringToMinutes = (timeStr = "") => {
  if (!timeStr || typeof timeStr !== "string") return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(mins)) return null;
  return hours * 60 + mins;
};

// Convert minutes from midnight back to "HH:MM"
const minutesToTimeString = (totalMinutes = 0) => {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

// Convert "08:00" to "08:00 AM", "16:00" to "04:00 PM"
const formatTimeAMPM = (timeStr = "") => {
  if (!timeStr) return "";
  const mins = timeStringToMinutes(timeStr);
  if (mins === null) return timeStr;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

// Extract duration in minutes from duration string or default
const parseDurationInMinutes = (durStr = "", defaultMins = 60) => {
  if (!durStr) return defaultMins;
  const str = String(durStr).trim();
  const minMatch = str.match(/(\d+)\s*(?:mins?|minutes?)/i);
  if (minMatch) {
    const m = parseInt(minMatch[1], 10);
    if (!isNaN(m) && m > 0) return m;
  }
  const hrMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
  if (hrMatch) {
    const h = parseFloat(hrMatch[1]);
    if (!isNaN(h) && h > 0) return Math.round(h * 60);
  }
  const rawNum = parseInt(str.replace(/[^\d]/g, ""), 10);
  if (!isNaN(rawNum) && rawNum > 0) return rawNum;
  return defaultMins;
};

// Format duration minutes to readable text, e.g. 600 -> "10 hrs", 90 -> "1h 30m"
const formatDurationShort = (totalMins = 0) => {
  if (!totalMins || isNaN(totalMins) || totalMins <= 0) return "0m";
  const hrs = totalMins / 60;
  if (hrs >= 1) {
    if (Number.isInteger(hrs)) {
      return `${hrs} ${hrs === 1 ? "hr" : "hrs"}`;
    } else {
      const hPart = Math.floor(hrs);
      const mPart = totalMins % 60;
      return `${hPart}h ${mPart}m`;
    }
  }
  return `${totalMins}m`;
};

const formatDurationDetailed = (totalMins = 0) => {
  if (!totalMins || isNaN(totalMins) || totalMins <= 0) return "0 Mins";
  const hrs = totalMins / 60;
  if (hrs >= 1) {
    if (Number.isInteger(hrs)) {
      return `${totalMins} Mins (${hrs} ${hrs === 1 ? "Hour" : "Hours"})`;
    } else {
      const hPart = Math.floor(hrs);
      const mPart = totalMins % 60;
      return `${totalMins} Mins (${hPart}h ${mPart}m)`;
    }
  }
  return `${totalMins} Mins`;
};

// Master schedule conflict detector comparing transfers, activities & sightseeing
const detectScheduleConflicts = (transfers = [], activities = [], sightseeing = [], totalDays = 2) => {
  const scheduledItems = [];

  // 1. Collect Transfers (Only if transfer explicitly has a duration)
  transfers.forEach((tr, index) => {
    const rawTime = tr.pickupTime || tr.time || "";
    const startMins = timeStringToMinutes(rawTime);
    if (startMins === null) return;
    const durMins = parseDurationInMinutes(tr.duration, 0);
    if (durMins <= 0) return; // Do not assume artificial default duration for transfers
    const endMins = startMins + durMins;
    const dayNum = Number(tr.day || 1);
    const title = tr.name || tr.serviceName || tr.title || `Transfer #${index + 1}`;

    scheduledItems.push({
      id: `transfer-${index}`,
      type: "transfer",
      index,
      day: dayNum,
      name: title,
      startMins,
      endMins,
      durMins,
      startStr: minutesToTimeString(startMins),
      endStr: minutesToTimeString(endMins),
      startFormatted: formatTimeAMPM(minutesToTimeString(startMins)),
      endFormatted: formatTimeAMPM(minutesToTimeString(endMins)),
      durFormatted: formatDurationShort(durMins),
      durDetailed: formatDurationDetailed(durMins),
    });
  });

  // 2. Collect Activities
  activities.forEach((act, index) => {
    const rawTime = act.selectedSlot || act.time || "";
    const startMins = timeStringToMinutes(rawTime);
    if (startMins === null) return;
    const durMins = parseDurationInMinutes(act.duration, 120);
    const endMins = startMins + durMins;
    const dayNum = Number(act.day || 1);
    const title = act.name || act.serviceName || `Activity #${index + 1}`;

    scheduledItems.push({
      id: `activity-${index}`,
      type: "activity",
      index,
      day: dayNum,
      name: title,
      startMins,
      endMins,
      durMins,
      startStr: minutesToTimeString(startMins),
      endStr: minutesToTimeString(endMins),
      startFormatted: formatTimeAMPM(minutesToTimeString(startMins)),
      endFormatted: formatTimeAMPM(minutesToTimeString(endMins)),
      durFormatted: formatDurationShort(durMins),
      durDetailed: formatDurationDetailed(durMins),
    });
  });

  // 3. Collect Sightseeing
  sightseeing.forEach((sight, index) => {
    const rawTime = sight.selectedSlot || sight.time || "";
    const startMins = timeStringToMinutes(rawTime);
    if (startMins === null) return;
    const durMins = parseDurationInMinutes(sight.duration, 60);
    const endMins = startMins + durMins;
    const dayNum = Number(sight.day || 1);
    const title = sight.name || sight.serviceName || `Sightseeing #${index + 1}`;

    scheduledItems.push({
      id: `sightseeing-${index}`,
      type: "sightseeing",
      index,
      day: dayNum,
      name: title,
      startMins,
      endMins,
      durMins,
      startStr: minutesToTimeString(startMins),
      endStr: minutesToTimeString(endMins),
      startFormatted: formatTimeAMPM(minutesToTimeString(startMins)),
      endFormatted: formatTimeAMPM(minutesToTimeString(endMins)),
      durFormatted: formatDurationShort(durMins),
      durDetailed: formatDurationDetailed(durMins),
    });
  });

  const conflicts = [];

  for (let i = 0; i < scheduledItems.length; i++) {
    for (let j = i + 1; j < scheduledItems.length; j++) {
      const itemA = scheduledItems[i];
      const itemB = scheduledItems[j];

      if (itemA.day === itemB.day) {
        const overlapStart = Math.max(itemA.startMins, itemB.startMins);
        const overlapEnd = Math.min(itemA.endMins, itemB.endMins);

        if (overlapStart < overlapEnd) {
          const overlapMins = overlapEnd - overlapStart;
          const overlapStartStr = minutesToTimeString(overlapStart);
          const overlapEndStr = minutesToTimeString(overlapEnd);
          const overlapStartFormatted = formatTimeAMPM(overlapStartStr);
          const overlapEndFormatted = formatTimeAMPM(overlapEndStr);
          const overlapDurFormatted = formatDurationShort(overlapMins);

          const typeLabelA = itemA.type === "transfer" ? "Transport" : itemA.type === "activity" ? "Activity" : "Sightseeing";
          const typeLabelB = itemB.type === "transfer" ? "Transport" : itemB.type === "activity" ? "Activity" : "Sightseeing";

          const detailedReason = `${typeLabelA} "${itemA.name}" (${itemA.durDetailed}) starts at ${itemA.startFormatted} and runs until ${itemA.endFormatted}. ${typeLabelB} "${itemB.name}" (${itemB.durDetailed}) starts at ${itemB.startFormatted} and runs until ${itemB.endFormatted}. Both clash for ${overlapDurFormatted} (${overlapStartFormatted} - ${overlapEndFormatted}) on Day ${itemA.day}.`;

          // Find smart candidate touring days in the package
          const suggestedDayShifts = [];

          // 1. Shift Option for Item B (e.g. Sightseeing)
          for (let d = 1; d <= totalDays; d++) {
            if (d === itemA.day) continue;

            // Rule 1: Departure Day (last day of multi-day trip) -> Guests have checkout & airport drop; not suitable for tours
            if (totalDays >= 3 && d === totalDays) continue;

            // Rule 2: Day 1 (Arrival Day) -> Guests arrive & check in; avoid scheduling long (>= 3 hrs) tours or early morning tours
            if (totalDays >= 3 && d === 1) {
              const hasDay1Transfer = transfers.some((tr) => Number(tr.day || 1) === 1);
              const isLongTour = (itemB.durMins || 0) >= 180 || (itemB.startMins || 0) < 12 * 60;
              if (hasDay1Transfer || isLongTour) continue;
            }

            // Rule 3: Check if Day d has a departure/airport drop transfer scheduled
            const hasDepartureTransferOnDayD = transfers.some(
              (tr) => Number(tr.day || 1) === d && /drop|departure|airport drop/i.test(tr.name || tr.serviceName || "")
            );
            if (hasDepartureTransferOnDayD) continue;

            // Rule 4: Overlap check with existing services on Day d
            const itemsOnDayD = scheduledItems.filter((it) => it.day === d);
            const wouldConflictB = itemsOnDayD.some((it) => {
              const oS = Math.max(it.startMins, itemB.startMins);
              const oE = Math.min(it.endMins, itemB.endMins);
              return oS < oE;
            });
            if (wouldConflictB) continue;

            // Rule 5: Daily Daylight Capacity check (Max 10 hours / 600 mins)
            const currentDayMins = itemsOnDayD.reduce((sum, it) => sum + (it.durMins || 0), 0);
            if (currentDayMins + (itemB.durMins || 0) > 600) continue;

            suggestedDayShifts.push({
              targetItem: itemB,
              itemType: typeLabelB,
              toDay: d,
              label: `Move ${typeLabelB} to Day ${d}`,
              fullLabel: `Shift ${typeLabelB} "${itemB.name}" to Day ${d}`,
            });
          }

          // 2. Shift Option for Item A (e.g. Activity) if not a transfer
          if (itemA.type !== "transfer") {
            for (let d = 1; d <= totalDays; d++) {
              if (d === itemA.day) continue;
              if (totalDays >= 3 && d === totalDays) continue;
              if (totalDays >= 3 && d === 1) {
                const hasDay1Transfer = transfers.some((tr) => Number(tr.day || 1) === 1);
                const isLongTour = (itemA.durMins || 0) >= 180 || (itemA.startMins || 0) < 12 * 60;
                if (hasDay1Transfer || isLongTour) continue;
              }
              const hasDepartureTransferOnDayD = transfers.some(
                (tr) => Number(tr.day || 1) === d && /drop|departure|airport drop/i.test(tr.name || tr.serviceName || "")
              );
              if (hasDepartureTransferOnDayD) continue;

              const itemsOnDayD = scheduledItems.filter((it) => it.day === d);
              const wouldConflictA = itemsOnDayD.some((it) => {
                const oS = Math.max(it.startMins, itemA.startMins);
                const oE = Math.min(it.endMins, itemA.endMins);
                return oS < oE;
              });
              if (wouldConflictA) continue;

              const currentDayMins = itemsOnDayD.reduce((sum, it) => sum + (it.durMins || 0), 0);
              if (currentDayMins + (itemA.durMins || 0) > 600) continue;

              suggestedDayShifts.push({
                targetItem: itemA,
                itemType: typeLabelA,
                toDay: d,
                label: `Move ${typeLabelA} to Day ${d}`,
                fullLabel: `Shift ${typeLabelA} "${itemA.name}" to Day ${d}`,
              });
            }
          }

          conflicts.push({
            id: `${itemA.id}-${itemB.id}`,
            day: itemA.day,
            itemA,
            itemB,
            overlapStart,
            overlapEnd,
            overlapMins,
            overlapStartStr,
            overlapEndStr,
            overlapStartFormatted,
            overlapEndFormatted,
            overlapDurFormatted,
            detailedReason,
            suggestedDayShifts,
            message: `Day ${itemA.day}: ${typeLabelA} "${itemA.name}" (${itemA.startStr} - ${itemA.endStr}) overlaps with ${typeLabelB} "${itemB.name}" (${itemB.startStr} - ${itemB.endStr}) by ${overlapDurFormatted}`,
          });
        }
      }
    }
  }

  return { conflicts, scheduledItems };
};

// Check slot availability for dropdowns
const checkSlotAvailability = (currentType, currentIndex, testSlot, dayNum, durationMins, scheduledItems = []) => {
  const startMins = timeStringToMinutes(testSlot);
  if (startMins === null) return { isConflicting: false };
  const endMins = startMins + durationMins;

  for (const item of scheduledItems) {
    if (item.type === currentType && item.index === currentIndex) continue;
    if (item.day !== dayNum) continue;

    const overlapStart = Math.max(startMins, item.startMins);
    const overlapEnd = Math.min(endMins, item.endMins);
    if (overlapStart < overlapEnd) {
      const typeLabel = item.type === "transfer" ? "Transport" : item.type === "activity" ? "Activity" : "Sightseeing";
      return {
        isConflicting: true,
        conflictingWith: item.name,
        conflictingType: typeLabel,
        timeRange: `${item.startStr} - ${item.endStr}`,
      };
    }
  }

  return { isConflicting: false };
};

// Calculate total booked minutes and load for each day (Activities & Sightseeing)
const getDayLoadSummary = (scheduledItems = [], totalDays = 2) => {
  const summary = {};
  for (let d = 1; d <= totalDays; d++) {
    // Only count actual tours/activities/sightseeing towards daylight tour schedule
    const items = scheduledItems.filter((it) => it.day === d && it.type !== "transfer");
    const totalMins = items.reduce((sum, it) => sum + (it.durMins || 0), 0);
    const hrs = Math.round((totalMins / 60) * 10) / 10;
    const isFull = totalMins >= 600; // >= 10 hrs
    summary[d] = {
      day: d,
      totalMins,
      totalHours: hrs,
      itemsCount: items.length,
      isFull,
      label: totalMins === 0 ? "Free" : `${hrs} hrs${isFull ? " (Full)" : ""}`,
    };
  }
  return summary;
};

// ==========================================
// 💡 SCHEDULE CONFLICT BREAKDOWN COMPONENT
// ==========================================
function DayScheduleVisualizer({
  dayNum,
  scheduledItems = [],
  conflicts = [],
  onShiftItemDay,
  totalDays = 2,
}) {
  const itemsOnDay = scheduledItems.filter((it) => it.day === dayNum);
  const dayConflicts = conflicts.filter((c) => c.day === dayNum);
  const totalMins = itemsOnDay.reduce((sum, it) => sum + (it.durMins || 0), 0);
  const totalHrs = Math.round((totalMins / 60) * 10) / 10;

  if (dayConflicts.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-xs">
      {/* Header matching Agent Portal style */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-[#3E63DD] font-bold text-xs">
            <Calendar size={13} /> Day {dayNum}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Schedule Timing Conflict
              </h4>
              <span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                ⚠️ {dayConflicts.length} Conflict{dayConflicts.length > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Total Booked: <span className="font-semibold text-slate-700">{totalHrs} Hours</span> ({totalMins} mins scheduled) • Standard daylight capacity is 10 Hours
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Math Explanation + 1-Click Auto Resolvers (Matching Agent Portal Remarks Style) */}
      <div className="space-y-2.5">
        {dayConflicts.map((c, cIdx) => (
          <div
            key={cIdx}
            className="rounded-lg border border-gray-200 bg-slate-50/50 p-3.5 space-y-2.5 text-xs shadow-2xs"
          >
            <div className="border-l-3 border-amber-500 pl-3 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                Conflict Reason:
              </p>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {c.detailedReason}
              </p>
            </div>

            {/* Smart Action Buttons in Brand Blue #3E63DD */}
            {Array.isArray(c.suggestedDayShifts) && c.suggestedDayShifts.length > 0 && (
              <div className="pt-2.5 border-t border-gray-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                  <Zap size={12} className="text-amber-600 shrink-0" />
                  <span>Suggested 1-Click Auto-Fixes:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {c.suggestedDayShifts.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => onShiftItemDay(sug.targetItem, sug.toDay)}
                      title={sug.fullLabel || sug.label}
                      className="inline-flex items-center gap-1 rounded-md bg-[#3E63DD] hover:bg-[#3252c4] text-white px-2.5 py-1 text-xs font-semibold shadow-xs transition-all duration-150 cursor-pointer active:scale-98"
                    >
                      <Zap size={11} className="shrink-0" />
                      <span>{sug.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const initialActivity = () => ({
  serviceName: "",
  name: "",
  day: 1,
  tourTypesList: [
    { tourType: "Sharing Tour", adultPrice: 0, childPrice: 0 },
    { tourType: "Private Tour", adultPrice: 0, childPrice: 0 },
    { tourType: "Ticket Tour", adultPrice: 0, childPrice: 0 },
  ],
  selectedTourIdx: 0,
  tourType: "",
  adultPrice: "",
  childPrice: "",
  adults: 2,
  children: 0,
  basePrice: 0,
  pax: 2,
  selectedSlot: "08:00",
  time: "08:00",
  price: "",
  unit: "person",
  quantity: 1,
  operatingDays: "",
  openingTime: "",
  closingTime: "",
  duration: "",
  supplier: "",
  supplierName: "",
  description: "",
});

const initialSightseeing = () => ({
  serviceName: "",
  name: "",
  day: 1,
  tourTypesList: [
    { tourType: "Sharing Tour", adultPrice: 0, childPrice: 0 },
    { tourType: "Private Tour", adultPrice: 0, childPrice: 0 },
    { tourType: "Ticket Tour", adultPrice: 0, childPrice: 0 },
  ],
  selectedTourIdx: 0,
  tourType: "",
  adultPrice: "",
  childPrice: "",
  adults: 2,
  children: 0,
  basePrice: 0,
  pax: 2,
  selectedSlot: "08:00",
  time: "08:00",
  price: "",
  unit: "person",
  quantity: 1,
  operatingDays: "",
  openingTime: "",
  closingTime: "",
  duration: "",
  supplier: "",
  supplierName: "",
  description: "",
});

const initialItineraryDay = (dayNum = 1) => ({
  day: dayNum,
  title: `Day ${dayNum}: Sightseeing & Tour`,
  description: "",
});

export default function CreatePreDefinedPackageModal({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("Mussoorie");
  const [country, setCountry] = useState("India");
  const [duration, setDuration] = useState("5 Nights / 6 Days");
  const [days, setDays] = useState("6");
  const [price, setPrice] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [gstChecked, setGstChecked] = useState(true);
  const [gstPercent, setGstPercent] = useState(5);
  const [tcsChecked, setTcsChecked] = useState(false);
  const [tcsPercent, setTcsPercent] = useState(5);
  const [tourismChecked, setTourismChecked] = useState(false);
  const [tourismAmount, setTourismAmount] = useState("");
  const [description, setDescription] = useState("");
  const [inclusions, setInclusions] = useState("Daily breakfast, Airport pickup & drop, Sightseeing transfers as per itinerary");
  const [exclusions, setExclusions] = useState("Airfare/Train fare, Personal expenses, Entry tickets not mentioned");

  // Services Lists
  const [hotels, setHotels] = useState([initialHotel()]);
  const [transfers, setTransfers] = useState([initialTransfer()]);
  const [activities, setActivities] = useState([]);
  const [sightseeing, setSightseeing] = useState([]);

  // Day-wise Itinerary (Default 2 Days)
  const [itinerary, setItinerary] = useState([
    { day: 1, title: "Day 1: Arrival & Leisure", description: "Pickup from airport/station, transfer to hotel. Check-in and relax for the evening." },
    { day: 2, title: "Day 2: Sightseeing Tour & Departure", description: "Explore major landmarks, scenic spots, and transfer with wonderful memories." },
  ]);

  // Live DMC-uploaded Services (Complete Catalogue + Destination Filtered)
  const [allDmcServices, setAllDmcServices] = useState({
    hotels: [],
    transfers: [],
    activities: [],
    sightseeing: [],
  });
  const [servicesLoading, setServicesLoading] = useState(false);

  // Active Dropdown States for autocomplete
  const [activeHotelDropdownIdx, setActiveHotelDropdownIdx] = useState(null);
  const [activeTransferDropdownIdx, setActiveTransferDropdownIdx] = useState(null);
  const [activeActivityDropdownIdx, setActiveActivityDropdownIdx] = useState(null);
  const [activeSightseeingDropdownIdx, setActiveSightseeingDropdownIdx] = useState(null);

  // Fetch complete DMC uploaded inventory library & destination-specific services
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        // Fetch all DMC services in database
        const res = await API.get("/ops/dmcAllGetServices", {
          params: { destination: "" },
          skipGlobalLoader: true,
        });

        if (isMounted && res.data) {
          const rawList = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data?.data?.hotels)
            ? [
                ...(res.data.data.hotels || []),
                ...(res.data.data.transfers || []),
                ...(res.data.data.activities || []),
                ...(res.data.data.sightseeing || []),
              ]
            : Array.isArray(res.data?.services)
            ? res.data.services
            : [];

          const hotelList = rawList.filter((s) => s.type === "hotel" || s.serviceCategory === "hotel" || s.hotelName || s.roomType);
          const transferList = rawList.filter((s) => s.type === "transfer" || s.vehicleType || s.serviceCategory === "transfer");
          const activityList = rawList.filter((s) => s.type === "activity" || s.serviceCategory === "activity");
          const sightList = rawList.filter((s) => s.type === "sightseeing" || s.serviceCategory === "sightseeing");

          setAllDmcServices({
            hotels: hotelList,
            transfers: transferList,
            activities: activityList,
            sightseeing: sightList,
          });
        }
      } catch (err) {
        console.error("Failed to load DMC services:", err);
      } finally {
        if (isMounted) setServicesLoading(false);
      }
    };

    fetchServices();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Close dropdowns on global click
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest(".dmc-autocomplete-container")) {
        setActiveHotelDropdownIdx(null);
        setActiveTransferDropdownIdx(null);
        setActiveActivityDropdownIdx(null);
        setActiveSightseeingDropdownIdx(null);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  if (!isOpen) return null;

  // Helpers to get sorted & filtered list for destination and search terms
  const normalizeComparisonText = (val = "") => String(val || "").trim().toLowerCase();

  const isMatchingPackageDestination = (item = {}, dest = "") => {
    const destClean = normalizeComparisonText(dest);
    if (!destClean) return true;

    const city = normalizeComparisonText(item.city);
    const itemDest = normalizeComparisonText(item.destination);
    const title = normalizeComparisonText(item.title || item.hotelName || item.serviceName || item.name);

    if (city && (city.includes(destClean) || destClean.includes(city))) return true;
    if (itemDest && (itemDest.includes(destClean) || destClean.includes(itemDest))) return true;
    if (title && title.includes(destClean)) return true;

    return false;
  };

  const getFilteredHotels = (searchQuery = "", currentHotelObj = null) => {
    const term = normalizeComparisonText(searchQuery);
    const destTerm = normalizeComparisonText(destination);

    // Strictly filter by package destination first
    let list = destTerm
      ? allDmcServices.hotels.filter((h) => isMatchingPackageDestination(h, destTerm))
      : allDmcServices.hotels;

    const currentTitle = normalizeComparisonText(
      currentHotelObj?.serviceName || currentHotelObj?.name || currentHotelObj?.hotelName
    );
    const isExactCurrentSelection = Boolean(currentTitle && currentTitle === term);

    if (!term || isExactCurrentSelection) {
      return list;
    }

    return list.filter((h) => {
      const serviceStr = normalizeComparisonText(h.serviceName || h.title || h.name || h.hotelName);
      const hotelStr = normalizeComparisonText(h.hotelName);
      const cityStr = normalizeComparisonText(h.city || h.destination);
      const supplierStr = normalizeComparisonText(h.supplierName || h.dmcName);
      const roomStr = normalizeComparisonText(h.roomType || h.roomCategory);
      return (
        serviceStr.includes(term) ||
        hotelStr.includes(term) ||
        cityStr.includes(term) ||
        supplierStr.includes(term) ||
        roomStr.includes(term)
      );
    });
  };

  const getFilteredTransfers = (searchQuery = "", currentTransferObj = null) => {
    const destTerm = normalizeComparisonText(destination);
    const term = normalizeComparisonText(searchQuery);

    let list = destTerm
      ? allDmcServices.transfers.filter((t) => isMatchingPackageDestination(t, destTerm))
      : allDmcServices.transfers;

    const currentName = normalizeComparisonText(currentTransferObj?.name);
    const isExactCurrentSelection = Boolean(currentName && currentName === term);

    if (!term || isExactCurrentSelection) {
      return list;
    }

    return list.filter((t) => {
      const nameStr = normalizeComparisonText(t.serviceName || t.name || t.title);
      const vehicleStr = normalizeComparisonText(t.vehicleType);
      const cityStr = normalizeComparisonText(t.city || t.destination);
      const supplierStr = normalizeComparisonText(t.supplierName || t.dmcName);
      return nameStr.includes(term) || vehicleStr.includes(term) || cityStr.includes(term) || supplierStr.includes(term);
    });
  };

  const getFilteredActivities = (searchQuery = "", currentActObj = null) => {
    const destTerm = normalizeComparisonText(destination);
    const term = normalizeComparisonText(searchQuery);

    let list = destTerm
      ? allDmcServices.activities.filter((a) => isMatchingPackageDestination(a, destTerm))
      : allDmcServices.activities;

    const currentName = normalizeComparisonText(currentActObj?.name);
    const isExactCurrentSelection = Boolean(currentName && currentName === term);

    if (!term || isExactCurrentSelection) {
      return list;
    }

    return list.filter((a) => {
      const nameStr = normalizeComparisonText(a.name || a.title);
      const cityStr = normalizeComparisonText(a.city || a.destination);
      const supplierStr = normalizeComparisonText(a.supplierName || a.dmcName);
      return nameStr.includes(term) || cityStr.includes(term) || supplierStr.includes(term);
    });
  };

  const getFilteredSightseeing = (searchQuery = "", currentSightObj = null) => {
    const destTerm = normalizeComparisonText(destination);
    const term = normalizeComparisonText(searchQuery);

    let list = destTerm
      ? allDmcServices.sightseeing.filter((s) => isMatchingPackageDestination(s, destTerm))
      : allDmcServices.sightseeing;

    const currentName = normalizeComparisonText(currentSightObj?.name);
    const isExactCurrentSelection = Boolean(currentName && currentName === term);

    if (!term || isExactCurrentSelection) {
      return list;
    }

    return list.filter((s) => {
      const nameStr = normalizeComparisonText(s.name || s.title);
      const cityStr = normalizeComparisonText(s.city || s.destination);
      const supplierStr = normalizeComparisonText(s.supplierName || s.dmcName);
      return nameStr.includes(term) || cityStr.includes(term) || supplierStr.includes(term);
    });
  };

  // Helper to recalculate hotel total price based on basePrice, nights, rooms, and add-ons
  const recalculateHotelPrice = (hotel) => {
    const base = Number(hotel.basePrice || 0);
    const aweb = hotel.extraAdult ? Number(hotel.awebRate || 0) : 0;
    const cweb = hotel.childWithBed ? Number(hotel.cwebRate || 0) : 0;
    const cwoeb = hotel.childWithoutBed ? Number(hotel.cwoebRate || 0) : 0;
    const perNightPerRoom = base + aweb + cweb + cwoeb;
    const n = Math.max(1, Number(hotel.nights || 1));
    const r = Math.max(1, Number(hotel.rooms || 1));
    return perNightPerRoom * n * r;
  };

  const normalizeBedType = (bed = "") => {
    const norm = String(bed || "").toLowerCase().trim();
    if (norm.includes("king")) return "King Bed";
    if (norm.includes("queen")) return "Queen Bed";
    if (norm.includes("twin")) return "Twin Bed";
    if (norm.includes("double")) return "Double Bed";
    if (norm.includes("single")) return "Single Bed";
    return "Queen Bed";
  };

  const normalizeExtraBedType = (extra = "") => {
    const norm = String(extra || "").toLowerCase().trim();
    if (norm === "" || norm === "none" || norm === "no") return "None";
    if (norm.includes("single")) return "Single Bed";
    if (norm.includes("rollaway")) return "Rollaway Bed";
    if (norm.includes("sofa")) return "Sofa Bed";
    if (norm.includes("mattress")) return "Mattress";
    return "None";
  };

  // Helper to map room occupancy category to bedType, extraBedType, maxAdults and maxChildren
  const getOccupancyDefaultsForRoomCategory = (category = "", currentBedType = "") => {
    const norm = String(category || "").toLowerCase().trim();
    if (norm.includes("single")) {
      return {
        maxAdults: 1,
        maxChildren: 1,
        bedType: "Single Bed",
        extraBedType: "None",
      };
    }
    if (norm.includes("triple")) {
      const isKing = String(currentBedType || "").toLowerCase().includes("king");
      return {
        maxAdults: 3,
        maxChildren: 1,
        bedType: isKing ? "King Bed" : "Twin Bed",
        extraBedType: "Single Bed",
      };
    }
    if (norm.includes("quad")) {
      return {
        maxAdults: 4,
        maxChildren: 2,
        bedType: "King Bed",
        extraBedType: "Single Bed",
      };
    }
    if (norm.includes("family")) {
      return {
        maxAdults: 4,
        maxChildren: 2,
        bedType: "King Bed",
        extraBedType: "Single Bed",
      };
    }
    if (norm.includes("twin")) {
      return {
        maxAdults: 2,
        maxChildren: 1,
        bedType: "Twin Bed",
        extraBedType: "None",
      };
    }
    // Double (default)
    const isKing = String(currentBedType || "").toLowerCase().includes("king");
    return {
      maxAdults: 2,
      maxChildren: 1,
      bedType: isKing ? "King Bed" : "Queen Bed",
      extraBedType: "None",
    };
  };

  // Add Row Helpers
  const addHotel = () => setHotels([...hotels, initialHotel()]);
  const removeHotel = (index) => setHotels(hotels.filter((_, i) => i !== index));
  const updateHotel = (index, field, value) => {
    const updated = [...hotels];
    updated[index][field] = value;

    if (field === "hotelName" || field === "serviceName") {
      updated[index].name = value;
    }

    if (field === "roomCategory") {
      const defaults = getOccupancyDefaultsForRoomCategory(value, updated[index].bedType);
      updated[index].maxAdults = defaults.maxAdults;
      updated[index].maxChildren = defaults.maxChildren;
      updated[index].bedType = defaults.bedType;
      updated[index].extraBedType = defaults.extraBedType;
    }

    if (
      field === "basePrice" ||
      field === "nights" ||
      field === "rooms" ||
      field === "extraAdult" ||
      field === "childWithBed" ||
      field === "childWithoutBed"
    ) {
      updated[index].price = recalculateHotelPrice(updated[index]);
    }

    if (field === "price") {
      const n = Math.max(1, Number(updated[index].nights || 1));
      const r = Math.max(1, Number(updated[index].rooms || 1));
      updated[index].basePrice = Math.round(Number(value || 0) / (n * r));
    }

    setHotels(updated);
  };

  // Switch between hotel properties if DMC service has multiple hotels
  const handleHotelPropertyChange = (hotelIdx, propertyIdx) => {
    const updated = [...hotels];
    const hotelItem = updated[hotelIdx];
    const hotelsList = hotelItem.hotelsList || [];
    const selectedHotel = hotelsList[propertyIdx];
    if (!selectedHotel) return;

    const roomsList = Array.isArray(selectedHotel.rooms) && selectedHotel.rooms.length > 0 ? selectedHotel.rooms : [];
    const primaryRoom = roomsList[0] || {};
    const baseRate = Number(primaryRoom.price || 0);

    hotelItem.selectedHotelIdx = propertyIdx;
    hotelItem.hotelName = selectedHotel.hotelName || hotelItem.hotelName;
    hotelItem.starCategory = selectedHotel.hotelCategory || hotelItem.starCategory;
    hotelItem.supplierName = selectedHotel.supplierName || hotelItem.supplierName;
    hotelItem.roomType = primaryRoom.roomType || hotelItem.roomType;
    hotelItem.roomCategory = primaryRoom.roomCategory || hotelItem.roomCategory;
    hotelItem.bedType = normalizeBedType(primaryRoom.bedType || hotelItem.bedType);
    hotelItem.extraBedType = normalizeExtraBedType(primaryRoom.extraBedType || hotelItem.extraBedType);
    hotelItem.maxAdults = primaryRoom.maxAdults !== undefined ? primaryRoom.maxAdults : 2;
    hotelItem.maxChildren = primaryRoom.maxChildren !== undefined ? primaryRoom.maxChildren : 1;
    hotelItem.mealPlan = primaryRoom.mealPlan || hotelItem.mealPlan;
    hotelItem.basePrice = baseRate;
    hotelItem.awebRate = Number(primaryRoom.awebRate || 0);
    hotelItem.cwebRate = Number(primaryRoom.cwebRate || 0);
    hotelItem.cwoebRate = Number(primaryRoom.cwoebRate || 0);
    hotelItem.price = recalculateHotelPrice(hotelItem);

    setHotels(updated);
  };

  // Switch Room Category (Standard Room, Deluxe Room, Suite, etc.)
  const handleRoomCategoryChange = (hotelIdx, roomTypeName) => {
    const updated = [...hotels];
    const hotelItem = updated[hotelIdx];
    const hotelsList = hotelItem.hotelsList || [];
    const selectedHotel = hotelsList[hotelItem.selectedHotelIdx || 0] || {};
    const roomsList = Array.isArray(selectedHotel.rooms) ? selectedHotel.rooms : [];
    const foundRoom = roomsList.find((r) => r.roomType === roomTypeName);

    hotelItem.roomType = roomTypeName;
    if (foundRoom) {
      hotelItem.roomCategory = foundRoom.roomCategory || hotelItem.roomCategory;
      hotelItem.bedType = normalizeBedType(foundRoom.bedType || hotelItem.bedType);
      hotelItem.extraBedType = normalizeExtraBedType(foundRoom.extraBedType || hotelItem.extraBedType);
      hotelItem.maxAdults = foundRoom.maxAdults !== undefined ? foundRoom.maxAdults : hotelItem.maxAdults;
      hotelItem.maxChildren = foundRoom.maxChildren !== undefined ? foundRoom.maxChildren : hotelItem.maxChildren;
      hotelItem.mealPlan = foundRoom.mealPlan || hotelItem.mealPlan;
      hotelItem.basePrice = Number(foundRoom.price || 0);
      hotelItem.awebRate = Number(foundRoom.awebRate || 0);
      hotelItem.cwebRate = Number(foundRoom.cwebRate || 0);
      hotelItem.cwoebRate = Number(foundRoom.cwoebRate || 0);
    }
    hotelItem.price = recalculateHotelPrice(hotelItem);
    setHotels(updated);
  };

  // Switch Room Occupancy (Single, Double, Twin, Triple, Quad, Family)
  const handleRoomOccupancyChange = (hotelIdx, occupancyCategory) => {
    const updated = [...hotels];
    const hotelItem = updated[hotelIdx];
    hotelItem.roomCategory = occupancyCategory;

    const hotelsList = hotelItem.hotelsList || [];
    const selectedHotel = hotelsList[hotelItem.selectedHotelIdx || 0] || {};
    const roomsList = Array.isArray(selectedHotel.rooms) ? selectedHotel.rooms : [];
    const matchingRoom = roomsList.find(
      (r) =>
        (r.roomType === hotelItem.roomType && String(r.roomCategory || "").toLowerCase() === String(occupancyCategory || "").toLowerCase()) ||
        String(r.roomCategory || "").toLowerCase() === String(occupancyCategory || "").toLowerCase()
    );

    const defaults = getOccupancyDefaultsForRoomCategory(occupancyCategory, hotelItem.bedType);

    if (matchingRoom) {
      hotelItem.maxAdults = matchingRoom.maxAdults !== undefined ? matchingRoom.maxAdults : defaults.maxAdults;
      hotelItem.maxChildren = matchingRoom.maxChildren !== undefined ? matchingRoom.maxChildren : defaults.maxChildren;
      hotelItem.bedType = matchingRoom.bedType ? normalizeBedType(matchingRoom.bedType) : defaults.bedType;
      hotelItem.extraBedType = matchingRoom.extraBedType ? normalizeExtraBedType(matchingRoom.extraBedType) : defaults.extraBedType;
      if (matchingRoom.price) {
        hotelItem.basePrice = Number(matchingRoom.price);
      }
      if (matchingRoom.awebRate !== undefined) hotelItem.awebRate = Number(matchingRoom.awebRate || 0);
      if (matchingRoom.cwebRate !== undefined) hotelItem.cwebRate = Number(matchingRoom.cwebRate || 0);
      if (matchingRoom.cwoebRate !== undefined) hotelItem.cwoebRate = Number(matchingRoom.cwoebRate || 0);
    } else {
      hotelItem.maxAdults = defaults.maxAdults;
      hotelItem.maxChildren = defaults.maxChildren;
      hotelItem.bedType = defaults.bedType;
      hotelItem.extraBedType = defaults.extraBedType;
    }

    hotelItem.price = recalculateHotelPrice(hotelItem);
    setHotels(updated);
  };

  // Select DMC Hotel from Dropdown
  const selectDmcHotel = (index, dmcHotel) => {
    const updated = [...hotels];
    const serviceTitle = dmcHotel.serviceName || dmcHotel.title || dmcHotel.hotelName || dmcHotel.name || "";

    const hotelsList = Array.isArray(dmcHotel.hotels) && dmcHotel.hotels.length > 0
      ? dmcHotel.hotels
      : [
          {
            hotelName: dmcHotel.hotelName || serviceTitle,
            hotelCategory: dmcHotel.starCategory || dmcHotel.hotelCategory || "5 Star",
            supplierName: dmcHotel.supplierName || dmcHotel.dmcName || "",
            rooms: [
              {
                roomType: dmcHotel.roomType || "Standard Room",
                roomCategory: dmcHotel.roomCategory || "Double",
                bedType: dmcHotel.bedType || "Queen Bed",
                extraBedType: dmcHotel.extraBedType || "None",
                maxAdults: dmcHotel.maxAdults !== undefined ? dmcHotel.maxAdults : 2,
                maxChildren: dmcHotel.maxChildren !== undefined ? dmcHotel.maxChildren : 1,
                mealPlan: dmcHotel.mealPlan || "EP",
                price: Number(dmcHotel.price || dmcHotel.total || dmcHotel.rate || 0),
                awebRate: Number(dmcHotel.awebRate || 0),
                cwebRate: Number(dmcHotel.cwebRate || 0),
                cwoebRate: Number(dmcHotel.cwoebRate || 0),
              },
            ],
          },
        ];

    const primaryHotel = hotelsList[0] || {};
    const roomsList = Array.isArray(primaryHotel.rooms) && primaryHotel.rooms.length > 0 ? primaryHotel.rooms : [];
    const primaryRoom = roomsList[0] || {};

    const baseRate = Number(primaryRoom.price !== undefined ? primaryRoom.price : (dmcHotel.price || dmcHotel.total || dmcHotel.rate || 0));
    const aweb = Number(primaryRoom.awebRate !== undefined ? primaryRoom.awebRate : (dmcHotel.awebRate || 0));
    const cweb = Number(primaryRoom.cwebRate !== undefined ? primaryRoom.cwebRate : (dmcHotel.cwebRate || 0));
    const cwoeb = Number(primaryRoom.cwoebRate !== undefined ? primaryRoom.cwoebRate : (dmcHotel.cwoebRate || 0));

    const n = Math.max(1, Number(updated[index].nights || 1));
    const r = Math.max(1, Number(updated[index].rooms || 1));

    updated[index] = {
      ...updated[index],
      serviceName: serviceTitle,
      hotelName: primaryHotel.hotelName || dmcHotel.hotelName || serviceTitle,
      name: serviceTitle,
      title: serviceTitle,
      hotelsList: hotelsList,
      selectedHotelIdx: 0,
      roomType: primaryRoom.roomType || dmcHotel.roomType || "Standard Room",
      roomCategory: primaryRoom.roomCategory || dmcHotel.roomCategory || "Double",
      rooms: r,
      nights: n,
      bedType: primaryRoom.bedType || dmcHotel.bedType || "Queen Bed",
      extraBedType: primaryRoom.extraBedType || dmcHotel.extraBedType || "None",
      maxAdults: primaryRoom.maxAdults !== undefined ? primaryRoom.maxAdults : (dmcHotel.maxAdults || 2),
      maxChildren: primaryRoom.maxChildren !== undefined ? primaryRoom.maxChildren : (dmcHotel.maxChildren || 1),
      mealPlan: primaryRoom.mealPlan || dmcHotel.mealPlan || "EP",
      basePrice: baseRate,
      awebRate: aweb,
      cwebRate: cweb,
      cwoebRate: cwoeb,
      price: baseRate * n * r,
      supplier: dmcHotel.supplier || dmcHotel.supplierId || dmcHotel.dmcId || dmcHotel._id || "",
      supplierName: primaryHotel.supplierName || dmcHotel.supplierName || dmcHotel.dmcName || "",
      starCategory: primaryHotel.hotelCategory || dmcHotel.starCategory || dmcHotel.hotelCategory || "5 Star",
      description: dmcHotel.description || updated[index].description || "",
    };
    setHotels(updated);
    setActiveHotelDropdownIdx(null);
    toast.success(`Service linked: ${serviceTitle}`);
  };

  const TRANSPORT_USAGE_OPTIONS = [
    { value: "one-way-airport-transfer", label: "One Way / Airport Transfer" },
    { value: "inter-hotel-transfer", label: "Inter Hotel Transfer" },
    { value: "full-day", label: "Full Day (80 km / 8 hrs)" },
    { value: "half-day", label: "Half Day (40 km / 4 hrs)" },
  ];

  const getTransportVehicleUsagePrices = (vehicle = {}, dmcTransfer = {}) => {
    const pointToPoint = vehicle?.usageTypes?.pointToPoint || [];
    const hourly = vehicle?.usageTypes?.hourly || [];

    const oneWay =
      pointToPoint.find((p) =>
        String(p.name || p.usageType || "").toLowerCase().includes("one way") ||
        String(p.name || "").toLowerCase().includes("airport")
      ) || pointToPoint[0];

    const interHotel =
      pointToPoint.find((p) =>
        String(p.name || p.usageType || "").toLowerCase().includes("inter hotel") ||
        String(p.name || "").toLowerCase().includes("inter-hotel")
      ) || pointToPoint[1];

    const fullDay =
      hourly.find((h) =>
        String(h.name || h.usageType || "").toLowerCase().includes("full")
      ) || hourly[0];

    const halfDay =
      hourly.find((h) =>
        String(h.name || h.usageType || "").toLowerCase().includes("half")
      ) || hourly[1];

    const defaultPrice = Number(dmcTransfer?.price || dmcTransfer?.total || dmcTransfer?.rate || 0);

    const oneWayPrice = Number(oneWay?.price !== undefined ? oneWay.price : defaultPrice);
    const interHotelPrice = Number(interHotel?.price !== undefined ? interHotel.price : defaultPrice);
    const fullDayPrice = Number(fullDay?.price !== undefined ? fullDay.price : defaultPrice);
    const halfDayPrice = Number(halfDay?.price !== undefined ? halfDay.price : defaultPrice);

    const fullDayExtraPerKmRate = Number(
      fullDay?.extraPerKmRate !== undefined
        ? fullDay.extraPerKmRate
        : dmcTransfer?.fullDayExtraPerKmRate || 0
    );
    const halfDayExtraPerKmRate = Number(
      halfDay?.extraPerKmRate !== undefined
        ? halfDay.extraPerKmRate
        : dmcTransfer?.halfDayExtraPerKmRate || 0
    );

    return {
      "one-way-airport-transfer": oneWayPrice,
      "inter-hotel-transfer": interHotelPrice,
      "full-day": fullDayPrice,
      "half-day": halfDayPrice,
      fullDayExtraPerKmRate,
      halfDayExtraPerKmRate,
    };
  };

  const totalDaysCount = Math.max(
    1,
    Number(days) || (duration ? Number(duration.match(/\d+/g)?.[1] || duration.match(/\d+/g)?.[0]) : 1) || 1
  );

  const addTransfer = () => {
    const newIdx = transfers.length;
    const assignedDay = newIdx === 0 ? 1 : newIdx === 1 ? totalDaysCount : Math.min(newIdx + 1, totalDaysCount);
    setTransfers([...transfers, { ...initialTransfer(), day: assignedDay }]);
  };
  const removeTransfer = (index) => setTransfers(transfers.filter((_, i) => i !== index));
  const updateTransfer = (index, field, value) => {
    const updated = [...transfers];
    updated[index][field] = value;

    if (field === "name" || field === "serviceName") {
      updated[index].name = value;
      updated[index].serviceName = value;
    }

    if (field === "days") {
      const d = Math.max(1, Number(value || 1));
      const base = Number(updated[index].basePrice || 0);
      if (base > 0) {
        updated[index].price = base * d;
      }
    }

    if (field === "basePrice") {
      const d = Math.max(1, Number(updated[index].days || 1));
      updated[index].price = Number(value || 0) * d;
    }

    if (field === "price") {
      const d = Math.max(1, Number(updated[index].days || 1));
      updated[index].basePrice = Math.round(Number(value || 0) / d);
    }

    setTransfers(updated);
  };

  const handleVehicleTypeChange = (transferIdx, value) => {
    const updated = [...transfers];
    const item = updated[transferIdx];
    const vList = item.vehiclesList || [];
    const matched = vList.find((v) => v.vehicleType === value);

    item.vehicleType = value;
    if (matched) {
      item.passengerCapacity = Number(matched.passengerCapacity || 4);
      item.luggageCapacity = Number(matched.luggageCapacity || 2);
      if (matched.description) item.description = matched.description;
      const prices = getTransportVehicleUsagePrices(matched, item);
      item.usagePrices = prices;
      const currentUsage = item.usage || "one-way-airport-transfer";
      const rate = prices[currentUsage] !== undefined ? prices[currentUsage] : item.basePrice || 0;
      item.basePrice = rate;
      const d = Math.max(1, Number(item.days || 1));
      item.price = rate * d;
    } else {
      if (value.includes("Sedan")) {
        item.passengerCapacity = 4;
        item.luggageCapacity = 2;
      } else if (value.includes("SUV") || value.includes("Innova") || value.includes("Ertiga")) {
        item.passengerCapacity = 6;
        item.luggageCapacity = 4;
      } else if (value.includes("Tempo")) {
        item.passengerCapacity = 12;
        item.luggageCapacity = 8;
      }
    }
    setTransfers(updated);
  };

  const handleUsageChange = (transferIdx, usageKey) => {
    const updated = [...transfers];
    const item = updated[transferIdx];
    item.usage = usageKey;
    const usagePrices = item.usagePrices || {};
    const rate = usagePrices[usageKey] !== undefined ? Number(usagePrices[usageKey]) : Number(item.basePrice || 0);
    item.basePrice = rate;
    const d = Math.max(1, Number(item.days || 1));
    item.price = rate * d;
    setTransfers(updated);
  };

  // Select DMC Transfer from Dropdown
  const selectDmcTransfer = (index, dmcTransfer) => {
    const updated = [...transfers];
    const routeTitle = dmcTransfer.serviceName || dmcTransfer.name || dmcTransfer.title || "";

    const vehiclesList = Array.isArray(dmcTransfer.vehicles) && dmcTransfer.vehicles.length > 0
      ? dmcTransfer.vehicles
      : [
          {
            vehicleType: dmcTransfer.vehicleType || "Sedan / Dzire (4 Pax)",
            passengerCapacity: Number(dmcTransfer.passengerCapacity || 4),
            luggageCapacity: Number(dmcTransfer.luggageCapacity || 2),
            description: dmcTransfer.description || "",
            usageTypes: dmcTransfer.usageTypes || {},
          },
        ];

    const primaryVehicle = vehiclesList[0] || {};
    const usagePrices = getTransportVehicleUsagePrices(primaryVehicle, dmcTransfer);
    const selectedUsage = updated[index].usage || "one-way-airport-transfer";
    const selectedUsageRate = usagePrices[selectedUsage] !== undefined ? usagePrices[selectedUsage] : Number(dmcTransfer.price || dmcTransfer.rate || 0);
    const d = Math.max(1, Number(updated[index].days || 1));

    updated[index] = {
      ...updated[index],
      serviceName: routeTitle,
      name: routeTitle,
      title: routeTitle,
      vehiclesList: vehiclesList,
      selectedVehicleIdx: 0,
      vehicleType: primaryVehicle.vehicleType || dmcTransfer.vehicleType || "Sedan / Dzire (4 Pax)",
      passengerCapacity: Number(primaryVehicle.passengerCapacity || dmcTransfer.passengerCapacity || 4),
      luggageCapacity: Number(primaryVehicle.luggageCapacity || dmcTransfer.luggageCapacity || 2),
      usage: selectedUsage,
      usagePrices: usagePrices,
      basePrice: selectedUsageRate,
      price: selectedUsageRate * d,
      fullDayNote: dmcTransfer.fullDayNote || "",
      halfDayNote: dmcTransfer.halfDayNote || "",
      fullDayExtraPerKmRate: usagePrices.fullDayExtraPerKmRate || 0,
      halfDayExtraPerKmRate: usagePrices.halfDayExtraPerKmRate || 0,
      supplier: dmcTransfer.supplier || dmcTransfer.supplierId || dmcTransfer.dmcId || dmcTransfer._id || "",
      supplierName: dmcTransfer.supplierName || dmcTransfer.dmcName || "",
      description: primaryVehicle.description || dmcTransfer.description || updated[index].description || "",
    };
    setTransfers(updated);
    setActiveTransferDropdownIdx(null);
    toast.success(`Transport linked: ${routeTitle}`);
  };

  const addActivity = () => setActivities([...activities, initialActivity()]);
  const removeActivity = (index) => setActivities(activities.filter((_, i) => i !== index));

  const handleActivityTourTypeChange = (index, selectedTourType) => {
    const updated = [...activities];
    const item = updated[index];
    const tList = item.tourTypesList || [];
    const matched = tList.find((t) => String(t.tourType || "").trim().toLowerCase() === String(selectedTourType || "").trim().toLowerCase()) || {};

    const adultRate = Number(matched.adultPrice !== undefined ? matched.adultPrice : (matched.price !== undefined ? matched.price : (item.adultPrice || 0)));
    const childRate = Number(matched.childPrice !== undefined ? matched.childPrice : (matched.childRate !== undefined ? matched.childRate : (item.childPrice || 0)));
    const adultsNum = Math.max(1, Number(item.adults !== undefined ? item.adults : (item.pax || 2)));
    const childrenNum = Math.max(0, Number(item.children || 0));

    item.tourType = selectedTourType;
    if (selectedTourType) {
      item.adultPrice = adultRate;
      item.childPrice = childRate;
      item.basePrice = adultRate;
      if (matched.description) item.description = matched.description;
      item.price = (adultRate * adultsNum) + (childRate * childrenNum);
    }

    setActivities(updated);
  };

  const updateActivity = (index, field, value) => {
    const updated = [...activities];
    updated[index][field] = value;

    if (field === "name" || field === "serviceName") {
      updated[index].name = value;
      updated[index].serviceName = value;
    }

    if (field === "adults" || field === "children" || field === "adultPrice" || field === "childPrice") {
      const aCount = Math.max(1, Number(field === "adults" ? value : (updated[index].adults !== undefined ? updated[index].adults : 1)));
      const cCount = Math.max(0, Number(field === "children" ? value : (updated[index].children !== undefined ? updated[index].children : 0)));
      const aRate = Number(field === "adultPrice" ? value : (updated[index].adultPrice !== undefined ? updated[index].adultPrice : 0));
      const cRate = Number(field === "childPrice" ? value : (updated[index].childPrice !== undefined ? updated[index].childPrice : 0));
      
      updated[index].adults = aCount;
      updated[index].children = cCount;
      updated[index].pax = aCount + cCount;
      updated[index].adultPrice = aRate;
      updated[index].childPrice = cRate;
      updated[index].basePrice = aRate;
      updated[index].price = (aRate * aCount) + (cRate * cCount);
    }

    if (field === "selectedSlot") {
      updated[index].selectedSlot = value;
      updated[index].time = value;
    }

    if (field === "price") {
      updated[index].price = Number(value || 0);
    }

    setActivities(updated);
  };

  // Select DMC Activity from Dropdown
  const selectDmcActivity = (index, dmcAct) => {
    const updated = [...activities];
    const actTitle = dmcAct.serviceName || dmcAct.name || dmcAct.title || "";
    const tourTypesList = Array.isArray(dmcAct.tourTypes) && dmcAct.tourTypes.length > 0
      ? dmcAct.tourTypes.map((t) => ({
          ...t,
          adultPrice: Number(t.adultPrice !== undefined ? t.adultPrice : (t.price || dmcAct.adultPrice || dmcAct.price || 0)),
          childPrice: Number(t.childPrice !== undefined ? t.childPrice : (t.childRate || dmcAct.childPrice || dmcAct.childRate || 0)),
        }))
      : [
          {
            tourType: dmcAct.tourType || "Sharing Tour",
            adultPrice: Number(dmcAct.adultPrice !== undefined ? dmcAct.adultPrice : (dmcAct.price || dmcAct.rate || 0)),
            childPrice: Number(dmcAct.childPrice !== undefined ? dmcAct.childPrice : (dmcAct.childRate || dmcAct.cwebRate || 0)),
            description: dmcAct.description || "",
          },
          {
            tourType: "Private Tour",
            adultPrice: Number(dmcAct.adultPrice !== undefined ? dmcAct.adultPrice : (dmcAct.price || dmcAct.rate || 0)),
            childPrice: Number(dmcAct.childPrice !== undefined ? dmcAct.childPrice : (dmcAct.childRate || dmcAct.cwebRate || 0)),
            description: dmcAct.description || "",
          },
          {
            tourType: "Ticket Tour",
            adultPrice: Number(dmcAct.adultPrice !== undefined ? dmcAct.adultPrice : (dmcAct.price || dmcAct.rate || 0)),
            childPrice: Number(dmcAct.childPrice !== undefined ? dmcAct.childPrice : (dmcAct.childRate || dmcAct.cwebRate || 0)),
            description: dmcAct.description || "",
          },
        ];

    const defaultTour = tourTypesList[0] || {};
    const defaultTourType = defaultTour.tourType || dmcAct.tourType || "Sharing Tour";
    const adultRate = Number(
      defaultTour.adultPrice !== undefined
        ? defaultTour.adultPrice
        : dmcAct.adultPrice !== undefined
        ? dmcAct.adultPrice
        : defaultTour.price || dmcAct.price || dmcAct.rate || 0
    );
    const childRate = Number(
      defaultTour.childPrice !== undefined
        ? defaultTour.childPrice
        : dmcAct.childPrice !== undefined
        ? dmcAct.childPrice
        : dmcAct.childRate !== undefined
        ? dmcAct.childRate
        : dmcAct.cwebRate !== undefined
        ? dmcAct.cwebRate
        : 0
    );
    
    const adultsNum = Math.max(1, Number(updated[index].adults || 2));
    const childrenNum = Math.max(0, Number(updated[index].children || 0));
    const calculatedTotal = (adultRate * adultsNum) + (childRate * childrenNum);

    const availableSlots = resolveSlotOptions(dmcAct);
    const selectedSlot = updated[index].selectedSlot || availableSlots[0] || "08:00";

    updated[index] = {
      ...updated[index],
      serviceName: actTitle,
      name: actTitle,
      tourTypesList: tourTypesList,
      selectedTourIdx: 0,
      tourType: defaultTourType,
      adultPrice: adultRate,
      childPrice: childRate,
      basePrice: adultRate,
      adults: adultsNum,
      children: childrenNum,
      pax: adultsNum + childrenNum,
      selectedSlot: selectedSlot,
      time: selectedSlot,
      operatingDays: dmcAct.operatingDays || dmcAct.days || "Mon-Sun",
      openingTime: dmcAct.openingTime || "08:00",
      closingTime: dmcAct.closingTime || "18:00",
      duration: dmcAct.duration || "120 Mins",
      slots: dmcAct.slots || "",
      price: calculatedTotal,
      supplier: dmcAct.supplier || dmcAct.supplierId || dmcAct.dmcId || dmcAct._id || "",
      supplierName: dmcAct.supplierName || dmcAct.dmcName || "",
      description: defaultTour.description || dmcAct.description || updated[index].description || "",
    };
    setActivities(updated);
    setActiveActivityDropdownIdx(null);
    toast.success(`Activity linked: ${actTitle}`);
  };

  const addSightseeing = () => setSightseeing([...sightseeing, initialSightseeing()]);
  const removeSightseeing = (index) => setSightseeing(sightseeing.filter((_, i) => i !== index));

  const handleSightseeingTourTypeChange = (index, selectedTourType) => {
    const updated = [...sightseeing];
    const item = updated[index];
    const tList = item.tourTypesList || [];
    const matched = tList.find((t) => String(t.tourType || "").trim().toLowerCase() === String(selectedTourType || "").trim().toLowerCase()) || {};

    const adultRate = Number(matched.adultPrice !== undefined ? matched.adultPrice : (matched.price !== undefined ? matched.price : (item.adultPrice || 0)));
    const childRate = Number(matched.childPrice !== undefined ? matched.childPrice : (matched.childRate !== undefined ? matched.childRate : (item.childPrice || 0)));
    const adultsNum = Math.max(1, Number(item.adults !== undefined ? item.adults : (item.pax || 2)));
    const childrenNum = Math.max(0, Number(item.children || 0));

    item.tourType = selectedTourType;
    if (selectedTourType) {
      item.adultPrice = adultRate;
      item.childPrice = childRate;
      item.basePrice = adultRate;
      if (matched.description) item.description = matched.description;
      item.price = (adultRate * adultsNum) + (childRate * childrenNum);
    }

    setSightseeing(updated);
  };

  const updateSightseeing = (index, field, value) => {
    const updated = [...sightseeing];
    updated[index][field] = value;

    if (field === "name" || field === "serviceName") {
      updated[index].name = value;
      updated[index].serviceName = value;
    }

    if (field === "adults" || field === "children" || field === "adultPrice" || field === "childPrice") {
      const aCount = Math.max(1, Number(field === "adults" ? value : (updated[index].adults !== undefined ? updated[index].adults : 1)));
      const cCount = Math.max(0, Number(field === "children" ? value : (updated[index].children !== undefined ? updated[index].children : 0)));
      const aRate = Number(field === "adultPrice" ? value : (updated[index].adultPrice !== undefined ? updated[index].adultPrice : 0));
      const cRate = Number(field === "childPrice" ? value : (updated[index].childPrice !== undefined ? updated[index].childPrice : 0));
      
      updated[index].adults = aCount;
      updated[index].children = cCount;
      updated[index].pax = aCount + cCount;
      updated[index].adultPrice = aRate;
      updated[index].childPrice = cRate;
      updated[index].basePrice = aRate;
      updated[index].price = (aRate * aCount) + (cRate * cCount);
    }

    if (field === "selectedSlot") {
      updated[index].selectedSlot = value;
      updated[index].time = value;
    }

    if (field === "price") {
      updated[index].price = Number(value || 0);
    }

    setSightseeing(updated);
  };

  // Select DMC Sightseeing from Dropdown
  const selectDmcSightseeing = (index, dmcSight) => {
    const updated = [...sightseeing];
    const sightTitle = dmcSight.serviceName || dmcSight.name || dmcSight.title || "";
    const tourTypesList = Array.isArray(dmcSight.tourTypes) && dmcSight.tourTypes.length > 0
      ? dmcSight.tourTypes.map((t) => ({
          ...t,
          adultPrice: Number(t.adultPrice !== undefined ? t.adultPrice : (t.price || dmcSight.adultPrice || dmcSight.price || 0)),
          childPrice: Number(t.childPrice !== undefined ? t.childPrice : (t.childRate || dmcSight.childPrice || dmcSight.childRate || 0)),
        }))
      : [
          {
            tourType: dmcSight.tourType || "Sharing Tour",
            adultPrice: Number(dmcSight.adultPrice !== undefined ? dmcSight.adultPrice : (dmcSight.price || dmcSight.rate || 0)),
            childPrice: Number(dmcSight.childPrice !== undefined ? dmcSight.childPrice : (dmcSight.childRate || dmcSight.cwebRate || 0)),
            description: dmcSight.description || "",
          },
          {
            tourType: "Private Tour",
            adultPrice: Number(dmcSight.adultPrice !== undefined ? dmcSight.adultPrice : (dmcSight.price || dmcSight.rate || 0)),
            childPrice: Number(dmcSight.childPrice !== undefined ? dmcSight.childPrice : (dmcSight.childRate || dmcSight.cwebRate || 0)),
            description: dmcSight.description || "",
          },
          {
            tourType: "Ticket Tour",
            adultPrice: Number(dmcSight.adultPrice !== undefined ? dmcSight.adultPrice : (dmcSight.price || dmcSight.rate || 0)),
            childPrice: Number(dmcSight.childPrice !== undefined ? dmcSight.childPrice : (dmcSight.childRate || dmcSight.cwebRate || 0)),
            description: dmcSight.description || "",
          },
        ];

    const defaultTour = tourTypesList[0] || {};
    const defaultTourType = defaultTour.tourType || dmcSight.tourType || "Sharing Tour";
    const adultRate = Number(
      defaultTour.adultPrice !== undefined
        ? defaultTour.adultPrice
        : dmcSight.adultPrice !== undefined
        ? dmcSight.adultPrice
        : defaultTour.price || dmcSight.price || dmcSight.rate || 0
    );
    const childRate = Number(
      defaultTour.childPrice !== undefined
        ? defaultTour.childPrice
        : dmcSight.childPrice !== undefined
        ? dmcSight.childPrice
        : dmcSight.childRate !== undefined
        ? dmcSight.childRate
        : dmcSight.cwebRate !== undefined
        ? dmcSight.cwebRate
        : 0
    );
    
    const adultsNum = Math.max(1, Number(updated[index].adults || 2));
    const childrenNum = Math.max(0, Number(updated[index].children || 0));
    const calculatedTotal = (adultRate * adultsNum) + (childRate * childrenNum);

    const availableSlots = resolveSlotOptions(dmcSight);
    const selectedSlot = updated[index].selectedSlot || availableSlots[0] || "08:00";

    updated[index] = {
      ...updated[index],
      serviceName: sightTitle,
      name: sightTitle,
      tourTypesList: tourTypesList,
      selectedTourIdx: 0,
      tourType: defaultTourType,
      adultPrice: adultRate,
      childPrice: childRate,
      basePrice: adultRate,
      adults: adultsNum,
      children: childrenNum,
      pax: adultsNum + childrenNum,
      selectedSlot: selectedSlot,
      time: selectedSlot,
      operatingDays: dmcSight.operatingDays || dmcSight.days || "Mon-Sun",
      openingTime: dmcSight.openingTime || "08:00",
      closingTime: dmcSight.closingTime || "18:00",
      duration: dmcSight.duration || "60 Mins",
      slots: dmcSight.slots || "",
      price: calculatedTotal,
      supplier: dmcSight.supplier || dmcSight.supplierId || dmcSight.dmcId || dmcSight._id || "",
      supplierName: dmcSight.supplierName || dmcSight.dmcName || "",
      description: defaultTour.description || dmcSight.description || updated[index].description || "",
    };
    setSightseeing(updated);
    setActiveSightseeingDropdownIdx(null);
    toast.success(`Sightseeing linked: ${sightTitle}`);
  };

  const addItineraryDay = () => setItinerary([...itinerary, initialItineraryDay(itinerary.length + 1)]);
  const removeItineraryDay = (index) => setItinerary(itinerary.filter((_, i) => i !== index));
  const updateItinerary = (index, field, value) => {
    const updated = [...itinerary];
    updated[index][field] = value;
    setItinerary(updated);
  };

  const numBaseCost = Number(basePrice || (price && !basePrice ? price : 0) || 0);
  const gstAmt = gstChecked && numBaseCost > 0 ? Math.round((numBaseCost * Number(gstPercent || 0)) / 100) : 0;
  const tcsAmt = tcsChecked && numBaseCost > 0 ? Math.round((numBaseCost * Number(tcsPercent || 0)) / 100) : 0;
  const tourismAmt = tourismChecked && Number(tourismAmount) > 0 ? Math.round(Number(tourismAmount)) : 0;
  const totalTaxAmt = gstAmt + tcsAmt + tourismAmt;
  const finalCalculatedPrice = numBaseCost + totalTaxAmt;

  const linkedHotelsCost = hotels.reduce((sum, h) => sum + Number(h.price || 0), 0);
  const linkedTransfersCost = transfers.reduce((sum, t) => sum + Number(t.price || 0), 0);
  const linkedActivitiesCost = activities.reduce((sum, a) => sum + Number(a.price || 0), 0);
  const linkedSightseeingCost = sightseeing.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const totalLinkedServicesCost = linkedHotelsCost + linkedTransfersCost + linkedActivitiesCost + linkedSightseeingCost;

  const validHotelsCount = hotels.filter((h) => h.hotelName?.trim() || h.name?.trim() || Number(h.price) > 0).length;
  const validTransfersCount = transfers.filter((t) => t.name?.trim() || Number(t.price) > 0).length;
  const validActivitiesCount = activities.filter((a) => a.name?.trim() || Number(a.price) > 0).length;
  const validSightseeingCount = sightseeing.filter((s) => s.name?.trim() || Number(s.price) > 0).length;

  const selectedHotelsList = hotels.filter((h) => h.hotelName?.trim() || h.name?.trim() || Number(h.price) > 0);
  const selectedTransfersList = transfers.filter((t) => t.name?.trim() || Number(t.price) > 0);
  const selectedActivitiesList = activities.filter((a) => a.name?.trim() || Number(a.price) > 0);
  const selectedSightseeingList = sightseeing.filter((s) => s.name?.trim() || Number(s.price) > 0);

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      return toast.error("Please enter a package title");
    }
    if (!destination.trim()) {
      return toast.error("Please enter a destination (e.g. Goa, Dubai, Mussoorie)");
    }
    const finalPrice = finalCalculatedPrice > 0 ? finalCalculatedPrice : Number(price || 0);
    if (!finalPrice || finalPrice <= 0) {
      return toast.error("Please enter a valid base package price");
    }

    // Validation for Max Pax in Activities & Sightseeing
    for (const act of activities) {
      if (!act.name?.trim()) continue;
      const paxNum = Number(act.pax || 1);
      const maxPaxStr = String(act.maxPax || "").toLowerCase();
      const match = maxPaxStr.match(/\d+/);
      if (match) {
        const maxLimit = Number(match[0]);
        if (maxLimit > 0 && paxNum > maxLimit) {
          return toast.error(`${act.name}: Maximum ${maxLimit} Pax allowed for ${act.tourType || "this tour"}.`);
        }
      } else {
        const tourType = String(act.tourType || "").toLowerCase();
        if (/private/i.test(tourType) && paxNum > 4) {
          return toast.error(`${act.name}: Maximum 4 Pax allowed for Private Tour.`);
        }
        if (/premium|vip/i.test(tourType) && paxNum > 6) {
          return toast.error(`${act.name}: Maximum 6 Pax allowed for Premium/VIP Tour.`);
        }
      }
    }

    for (const sight of sightseeing) {
      if (!sight.name?.trim()) continue;
      const paxNum = Number(sight.pax || 1);
      const maxPaxStr = String(sight.maxPax || "").toLowerCase();
      const match = maxPaxStr.match(/\d+/);
      if (match) {
        const maxLimit = Number(match[0]);
        if (maxLimit > 0 && paxNum > maxLimit) {
          return toast.error(`${sight.name}: Maximum ${maxLimit} Pax allowed for ${sight.tourType || "this tour"}.`);
        }
      } else {
        const tourType = String(sight.tourType || "").toLowerCase();
        if (/private/i.test(tourType) && paxNum > 4) {
          return toast.error(`${sight.name}: Maximum 4 Pax allowed for Private Tour.`);
        }
        if (/premium|vip/i.test(tourType) && paxNum > 6) {
          return toast.error(`${sight.name}: Maximum 6 Pax allowed for Premium/VIP Tour.`);
        }
      }
    }

    try {
      setLoading(true);
      const payload = {
        title: title.trim(),
        destination: destination.trim(),
        country: country.trim(),
        duration: duration.trim(),
        days: Number(days) || 1,
        basePrice: numBaseCost > 0 ? numBaseCost : finalPrice,
        tax: {
          gstPercent: gstChecked ? Number(gstPercent || 0) : 0,
          gstAmount: gstAmt,
          tcsPercent: tcsChecked ? Number(tcsPercent || 0) : 0,
          tcsAmount: tcsAmt,
          tourismAmount: tourismAmt,
          totalTax: totalTaxAmt,
        },
        price: finalPrice,
        description: description.trim(),
        inclusions: inclusions.trim(),
        exclusions: exclusions.trim(),
        dayWiseItinerary: itinerary.filter((it) => it.title?.trim() || it.description?.trim()),
        hotels: hotels.filter((h) => h.hotelName?.trim() || h.name?.trim()),
        transfers: transfers.filter((t) => t.name?.trim()),
        activities: activities.filter((a) => a.name?.trim()),
        sightseeing: sightseeing.filter((s) => s.name?.trim()),
      };

      const res = await API.post("/dmc/package", payload);
      toast.success("Pre-defined package template created successfully!");
      onSuccess?.(res.data?.data || payload);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to create package template");
    } finally {
      setLoading(false);
    }
  };

  // Schedule Conflicts & Timeline Intelligence Detection
  const { conflicts: scheduleConflicts, scheduledItems: allScheduledItems } = useMemo(() => {
    return detectScheduleConflicts(transfers, activities, sightseeing, totalDaysCount);
  }, [transfers, activities, sightseeing, totalDaysCount]);

  const dayLoadSummary = useMemo(() => {
    return getDayLoadSummary(allScheduledItems, totalDaysCount);
  }, [allScheduledItems, totalDaysCount]);

  const conflictingDays = useMemo(() => {
    const daysSet = new Set(scheduleConflicts.map((c) => c.day));
    return Array.from(daysSet).sort((a, b) => a - b);
  }, [scheduleConflicts]);

  const transferConflicts = useMemo(() => {
    return scheduleConflicts.filter((c) => c.itemA.type === "transfer" || c.itemB.type === "transfer");
  }, [scheduleConflicts]);

  const activityOrSightConflicts = useMemo(() => {
    return scheduleConflicts.filter((c) => c.itemA.type !== "transfer" || c.itemB.type !== "transfer");
  }, [scheduleConflicts]);

  const getServiceConflicts = (type, index) => {
    return scheduleConflicts.filter(
      (c) => (c.itemA.type === type && c.itemA.index === index) || (c.itemB.type === type && c.itemB.index === index)
    );
  };

  const handleShiftItemDay = (item, newDay) => {
    if (!item) return;
    const targetDay = Number(newDay);
    if (item.type === "activity") {
      updateActivity(item.index, "day", targetDay);
      toast.success(`Moved "${item.name}" to Day ${targetDay}`);
    } else if (item.type === "sightseeing") {
      updateSightseeing(item.index, "day", targetDay);
      toast.success(`Moved "${item.name}" to Day ${targetDay}`);
    } else if (item.type === "transfer") {
      updateTransfer(item.index, "day", targetDay);
      toast.success(`Moved "${item.name}" to Day ${targetDay}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn">
      <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col rounded-xl border border-gray-200 bg-white text-slate-800 shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-[#3E63DD] shrink-0">
              <Package size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Create Pre-defined Package Template
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure reusable packages with live uploaded hotels, cabs, sightseeing & itinerary
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation with Schedule Conflict Badges */}
        <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50/80 px-4 sm:px-6 pt-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
          {[
            { id: "basic", label: "1. Basic Details", count: null, hasWarning: false },
            { id: "hotels", label: "2. Hotels", count: hotels.length, hasWarning: false },
            { id: "transfers", label: "3. Transports", count: transfers.length, hasWarning: transferConflicts.length > 0 },
            { id: "activities", label: "4. Activities & Tours", count: activities.length + sightseeing.length, hasWarning: activityOrSightConflicts.length > 0 },
            { id: "pricing", label: "5. Pricing & Taxes", count: null, hasWarning: false },
            { id: "inclusions", label: "6. Inclusions & Notes", count: null, hasWarning: false },
            { id: "itinerary", label: "7. Day-wise Itinerary", count: itinerary.length > 0 ? `${itinerary.length} Days` : null, hasWarning: false },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative -mb-px rounded-t-lg px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer inline-flex items-center gap-1.5 leading-normal ${
                activeTab === tab.id
                  ? "bg-white text-[#3E63DD] border-t-2 border-t-[#3E63DD] border-x border-x-gray-200 border-b border-b-white shadow-2xs font-bold z-10"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 border-t-2 border-t-transparent border-x border-x-transparent border-b border-b-transparent font-medium"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count !== undefined && (
                <span className={`text-[11px] ${activeTab === tab.id ? "text-[#3E63DD] font-bold" : "text-gray-500 font-medium"}`}>
                  ({tab.count})
                </span>
              )}
              {tab.hasWarning && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 leading-none shrink-0 shadow-2xs">
                  <AlertTriangle size={10} className="text-amber-600 shrink-0" />
                  <span>Overlap</span>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5 bg-white [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          
          {/* TAB 1: BASIC DETAILS */}
          {activeTab === "basic" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
                    <Package size={15} className="text-[#3E63DD]" />
                    1. Basic Package Information
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select destination to automatically link contracted rates and services.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Package Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5N/6D Mussoorie & Dhanaulti Hills Delight"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mussoorie, Goa, Dubai, Kashmir, Kerala"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  />
                  {/* Quick destination suggestion pills */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-gray-500 font-medium">Quick Select:</span>
                    {POPULAR_DESTINATIONS.map((dest) => (
                      <button
                        key={dest}
                        type="button"
                        onClick={() => setDestination(dest)}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                          destination.toLowerCase() === dest.toLowerCase()
                            ? "bg-[#3E63DD] text-white shadow-xs"
                            : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200/80"
                        }`}
                      >
                        {dest}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. India, UAE, Thailand"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 Nights / 6 Days"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Days (Number)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 6"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Package Description / Overview
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Short overview of the holiday package, experience highlights, and key destination appeal..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HOTELS (WITH LIVE DMC AUTOCOMPLETE DROPDOWN & FULL ROOM/ADDON CONFIGURATION) */}
          {activeTab === "hotels" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
                    <BedDouble size={15} className="text-amber-600" />
                    Hotel Stays & Accommodations
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select from contracted hotels in <strong>{destination}</strong> or pick from catalogue / type custom properties.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addHotel}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus size={13} /> Add Hotel
                </button>
              </div>

              <div className="space-y-4 pt-1">
                {hotels.map((hotel, index) => {
                  const filteredHotels = getFilteredHotels(hotel.serviceName || hotel.name, hotel);
                  const selectedHotelObj = (hotel.hotelsList && hotel.hotelsList[hotel.selectedHotelIdx || 0]) || {};
                  const availableRooms = Array.isArray(selectedHotelObj.rooms) && selectedHotelObj.rooms.length > 0
                    ? selectedHotelObj.rooms
                    : [];

                  return (
                    <div key={index} className={`rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3.5 relative shadow-2xs ${activeHotelDropdownIdx === index ? "z-50 ring-1 ring-blue-500/50 overflow-visible" : "z-10 overflow-visible"}`}>
                      
                      {/* Hotel Card Header with Hotel Dropdown & Badges */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-gray-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <BedDouble size={14} className="text-amber-600" /> Hotel #{index + 1}
                          </span>

                          {/* Hotel Dropdown (if multiple properties in DMC service) */}
                          {hotel.hotelsList && hotel.hotelsList.length > 1 ? (
                            <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-0.5 text-xs text-slate-700 shadow-2xs">
                              <span className="text-gray-500 font-medium text-[11px]">Hotel:</span>
                              <select
                                value={hotel.selectedHotelIdx || 0}
                                onChange={(e) => handleHotelPropertyChange(index, Number(e.target.value))}
                                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
                              >
                                {hotel.hotelsList.map((hProp, pIdx) => (
                                  <option key={pIdx} value={pIdx} className="bg-white text-slate-800">
                                    {hProp.hotelName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : hotel.hotelName ? (
                            <span className="rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] text-slate-800 font-semibold shadow-2xs">
                              Hotel: {hotel.hotelName}
                            </span>
                          ) : null}

                          <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                            ★ {hotel.starCategory || "5 Star"}
                          </span>

                          {hotel.supplierName && (
                            <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700 font-semibold">
                              Supplier: {hotel.supplierName}
                            </span>
                          )}
                        </div>

                        {hotels.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeHotel(index)}
                            className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Remove Hotel"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Main Service Autocomplete Row + Meal Plan + Nights + Price */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        
                        {/* Service Name with Live Autocomplete */}
                        <div className={`sm:col-span-2 relative dmc-autocomplete-container ${activeHotelDropdownIdx === index ? "z-40" : "z-10"}`}>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                            <span>Service Name (Select Service or Type)</span>
                            {servicesLoading ? (
                              <span className="text-[10px] text-blue-600 font-medium">Loading Services...</span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                {getFilteredHotels("").length} Services in {destination || "Selected Destination"}
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="e.g. Mussoorie Queen of Hills Luxury, Luxury Resort Stay..."
                              value={hotel.serviceName || hotel.name || ""}
                              onFocus={() => setActiveHotelDropdownIdx(index)}
                              onChange={(e) => {
                                updateHotel(index, "serviceName", e.target.value);
                                setActiveHotelDropdownIdx(index);
                              }}
                              className="w-full rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                            />
                            <button
                              type="button"
                              onClick={() => setActiveHotelDropdownIdx(activeHotelDropdownIdx === index ? null : index)}
                              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer transition-colors"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>

                          {/* Autocomplete Dropdown List */}
                          {activeHotelDropdownIdx === index && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl z-[100] divide-y divide-gray-100 [scrollbar-width:thin]">
                              {filteredHotels.length === 0 ? (
                                <div className="p-3 text-[11px] text-gray-500 italic text-center">
                                  No service found matching "{hotel.serviceName || hotel.name || ""}". You can freely type custom service name.
                                </div>
                              ) : (
                                filteredHotels.map((dmcHotel, hIdx) => {
                                  const serviceTitle = dmcHotel.serviceName || dmcHotel.title || dmcHotel.name || dmcHotel.hotelName;
                                  const isSelected = Boolean(
                                    (hotel.serviceName && serviceTitle.toLowerCase() === hotel.serviceName.trim().toLowerCase()) ||
                                    (hotel.name && serviceTitle.toLowerCase() === hotel.name.trim().toLowerCase())
                                  );
                                  const matchesDest = destination && (dmcHotel.city || dmcHotel.destination || "").toLowerCase().includes(destination.toLowerCase());

                                  return (
                                    <div
                                      key={dmcHotel._id || dmcHotel.id || hIdx}
                                      onClick={() => selectDmcHotel(index, dmcHotel)}
                                      className={`p-3 hover:bg-blue-50/60 cursor-pointer transition flex items-center justify-between gap-2 ${
                                        isSelected ? "bg-blue-50/90 border-l-3 border-l-blue-600" : matchesDest ? "bg-gray-50/60" : ""
                                      }`}
                                    >
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                          <Building2 size={13} className="text-blue-600 shrink-0" />
                                          <span>{serviceTitle}</span>
                                          {isSelected && (
                                            <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] px-1.5 py-0.2 font-bold">
                                              ✓ Selected
                                            </span>
                                          )}
                                          <span className="text-[10px] font-semibold text-amber-600">
                                            ★ {dmcHotel.starCategory || dmcHotel.hotelCategory || "4 Star"}
                                          </span>
                                        </p>
                                        <p className="text-[11px] text-gray-500 mt-0.5 truncate flex items-center gap-1 flex-wrap">
                                          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                            <MapPin size={11} className="text-rose-500 shrink-0" />
                                            {dmcHotel.city || dmcHotel.destination || "Verified Location"}
                                          </span>
                                          {dmcHotel.hotelName && dmcHotel.hotelName !== serviceTitle && (
                                            <> • Hotel: <span className="text-slate-700 font-medium">{dmcHotel.hotelName}</span></>
                                          )}
                                          • {dmcHotel.roomType || "Deluxe Room"} • {dmcHotel.mealPlan || "CP Plan"}
                                        </p>
                                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                                          Supplier: {dmcHotel.supplierName || dmcHotel.dmcName || "Contracted Supplier"}
                                        </p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-xs font-bold text-slate-900">
                                          ₹{Number(dmcHotel.price || dmcHotel.total || dmcHotel.rate || 0).toLocaleString("en-IN")}
                                        </span>
                                        <span className="block text-[10px] text-gray-500">/ night</span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Meal Plan</label>
                          <select
                            value={hotel.mealPlan || "EP"}
                            onChange={(e) => updateHotel(index, "mealPlan", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                          >
                            <option value="EP">EP (Room Only)</option>
                            <option value="CP">CP (Breakfast Included)</option>
                            <option value="MAP">MAP (Breakfast & Dinner)</option>
                            <option value="AP">AP (All Meals Included)</option>
                            <option value="AI">AI (All Inclusive)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Total Hotel Cost (₹)
                            {Number(hotel.basePrice) > 0 && (
                              <span className="text-[10px] text-blue-600 ml-1 font-normal">
                                (₹{Number(hotel.basePrice).toLocaleString("en-IN")}/nt)
                              </span>
                            )}
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 48900"
                            value={hotel.price || ""}
                            onChange={(e) => updateHotel(index, "price", Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Room Configuration Grid */}
                      <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-3.5 md:grid-cols-3 lg:grid-cols-6 shadow-2xs">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Room Category
                          </label>
                          <select
                            value={hotel.roomType || "Standard Room"}
                            onChange={(e) => handleRoomCategoryChange(index, e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                          >
                            {availableRooms.length > 0 ? (
                              availableRooms.map((r, rIdx) => (
                                <option key={rIdx} value={r.roomType}>
                                  {r.roomType}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="Standard Room">Standard Room</option>
                                <option value="Deluxe Room">Deluxe Room</option>
                                <option value="Premium Room">Premium Room</option>
                                <option value="Family Room">Family Room</option>
                                <option value="Luxury Room">Luxury Room</option>
                                <option value="Suite">Suite</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Room Type (Occupancy)
                          </label>
                          <select
                            value={hotel.roomCategory || "Double"}
                            onChange={(e) => handleRoomOccupancyChange(index, e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                          >
                            <option value="Double">Double (2 persons)</option>
                            <option value="Triple">Triple (3 persons)</option>
                            <option value="Single">Single (1 person)</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Nights
                          </label>
                          <select
                            value={Number(hotel.nights || 1)}
                            onChange={(e) => updateHotel(index, "nights", Math.max(1, Number(e.target.value || 1)))}
                            className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                          >
                            {[...Array(15)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1} Night{i === 0 ? "" : "s"}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Rooms
                          </label>
                          <select
                            value={Number(hotel.rooms || 1)}
                            onChange={(e) => updateHotel(index, "rooms", Math.max(1, Number(e.target.value || 1)))}
                            className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                          >
                            {[...Array(8)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1} Room{i === 0 ? "" : "s"}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Bed Type
                          </label>
                          <select
                            value={hotel.bedType || "Queen Bed"}
                            onChange={(e) => updateHotel(index, "bedType", e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                          >
                            <option value="Queen Bed">Queen Bed</option>
                            <option value="King Bed">King Bed</option>
                            <option value="Twin Bed">Twin Bed</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Extra Bed Type
                          </label>
                          <select
                            value={hotel.extraBedType || "None"}
                            onChange={(e) => updateHotel(index, "extraBedType", e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-2 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                          >
                            <option value="None">None</option>
                            <option value="Single Bed">Single Bed</option>
                          </select>
                        </div>
                      </div>

                      {/* Max Occupancy Display Pill */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">MAX OCCUPANCY:</span>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-2xs">
                          <span className="text-emerald-700 font-bold">{hotel.maxAdults || 2} Adult{Number(hotel.maxAdults || 2) === 1 ? "" : "s"}</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-sky-700 font-bold">{hotel.maxChildren !== undefined ? hotel.maxChildren : 1} Child{Number(hotel.maxChildren !== undefined ? hotel.maxChildren : 1) === 1 ? "" : "ren"}</span>
                        </div>
                      </div>

                      {/* Optional Add-ons Row */}
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          Optional Add-ons
                        </p>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                          
                          {/* A.W.E.B */}
                          <label className={`flex items-center justify-between gap-2 rounded-lg border p-3 cursor-pointer transition shadow-2xs ${hotel.extraAdult ? "border-amber-300 bg-amber-50/50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={hotel.extraAdult || false}
                                onChange={(e) => updateHotel(index, "extraAdult", e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-900">A.W.E.B</p>
                                <p className="text-[10px] text-gray-500">Extra adult with extra bed</p>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-amber-700">
                              ₹{Number(hotel.awebRate || 0).toLocaleString("en-IN")}
                            </span>
                          </label>

                          {/* C.W.E.B */}
                          <label className={`flex items-center justify-between gap-2 rounded-lg border p-3 cursor-pointer transition shadow-2xs ${hotel.childWithBed ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={hotel.childWithBed || false}
                                onChange={(e) => updateHotel(index, "childWithBed", e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-900">C.W.E.B</p>
                                <p className="text-[10px] text-gray-500">Child with extra bed</p>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-emerald-700">
                              ₹{Number(hotel.cwebRate || 0).toLocaleString("en-IN")}
                            </span>
                          </label>

                          {/* C.Wo.E.B */}
                          <label className={`flex items-center justify-between gap-2 rounded-lg border p-3 cursor-pointer transition shadow-2xs ${hotel.childWithoutBed ? "border-sky-300 bg-sky-50/50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={hotel.childWithoutBed || false}
                                onChange={(e) => updateHotel(index, "childWithoutBed", e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-900">C.Wo.E.B</p>
                                <p className="text-[10px] text-gray-500">Child without extra bed</p>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-sky-700">
                              ₹{Number(hotel.cwoebRate || 0).toLocaleString("en-IN")}
                            </span>
                          </label>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: TRANSPORTS (WITH LIVE DMC ROUTE AUTOCOMPLETE) */}
          {activeTab === "transfers" && (
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

              {/* Transport Conflicts Global Timeline Breakdown */}
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
                    <div key={index} className={`rounded-xl border ${cardConflicts.length > 0 ? "border-amber-300/80" : "border-gray-200"} bg-gray-50/50 p-4 space-y-3 relative shadow-2xs ${activeTransferDropdownIdx === index ? "z-30 ring-1 ring-blue-500/50" : "z-10"}`}>
                      
                      {/* Individual Transfer Conflict Alert - Clean Agent Style */}
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

                          {/* 1-Click Quick Move Actions */}
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

                      {/* Transfer Header with Badges & Pickup Time */}
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
                          {/* Pickup Time input matching QuotationBuilder */}
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

                      {/* Top Row: Service Name Autocomplete + Travel Day + Vehicle Type */}
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                        
                        {/* Route / Name with Live Autocomplete */}
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

                          {/* Autocomplete Dropdown List */}
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
                                            {dmcTransfer.city || dmcTransfer.destination || destination}
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

                        {/* Travel Day Dropdown */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Travel Day</label>
                          <select
                            value={transfer.day || 1}
                            onChange={(e) => updateTransfer(index, "day", Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
                          >
                            {Array.from({ length: totalDaysCount }, (_, i) => i + 1).map((d) => {
                              const dayInfo = dayLoadSummary[d];
                              let extraText = "";
                              if (dayInfo) {
                                extraText = dayInfo.totalMins > 0 ? ` (${dayInfo.label})` : " (Free)";
                              }
                              return (
                                <option key={d} value={d}>
                                  Day {d}{extraText}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Vehicle Type Dropdown */}
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

                      {/* Second Row: Usage + Passenger Capacity + Luggage Capacity + Days + Rate */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                        
                        {/* Usage Dropdown matching Quotation side */}
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

                        {/* Passenger Capacity */}
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

                        {/* Luggage Capacity */}
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

                        {/* Dynamic Multiplier Dropdown (Trips / Rental Days / Half-Days) */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            {transfer.usage === "full-day"
                              ? "Rental Days"
                              : transfer.usage === "half-day"
                              ? "Half-Days"
                              : "No. of Trips"}
                          </label>
                          <select
                            value={Number(transfer.days || 1)}
                            onChange={(e) => updateTransfer(index, "days", Math.max(1, Number(e.target.value || 1)))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs font-medium cursor-pointer"
                          >
                            {[...Array(10)].map((_, i) => {
                              const count = i + 1;
                              const unitLabel =
                                transfer.usage === "full-day"
                                  ? count === 1 ? "Day" : "Days"
                                  : transfer.usage === "half-day"
                                  ? count === 1 ? "Half-Day" : "Half-Days"
                                  : count === 1 ? "Trip" : "Trips";
                              return (
                                <option key={count} value={count}>
                                  {count} {unitLabel}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {/* Third Row: Rate & Usage Notes */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-gray-200">
                        <div className="text-[11px] text-gray-600 space-y-0.5">
                          {transfer.usage === "full-day" && transfer.fullDayNote && (
                            <p className="italic font-medium text-slate-700">Note (Full Day): {transfer.fullDayNote}</p>
                          )}
                          {transfer.usage === "half-day" && transfer.halfDayNote && (
                            <p className="italic font-medium text-slate-700">Note (Half Day): {transfer.halfDayNote}</p>
                          )}
                          {transfer.fullDayExtraPerKmRate > 0 && (
                            <p className="italic text-amber-700 font-medium">Extra km rate: ₹{transfer.fullDayExtraPerKmRate}/km where applicable.</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          <label className="text-[11px] font-semibold text-slate-700">Total Price (₹):</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 4500"
                            value={transfer.price || ""}
                            onChange={(e) => updateTransfer(index, "price", Number(e.target.value))}
                            className="w-32 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none shadow-2xs"
                          />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVITIES & SIGHTSEEING (WITH LIVE DMC AUTOCOMPLETE) */}
          {activeTab === "activities" && (
            <div className="space-y-5 pt-1">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
                    <Landmark size={15} className="text-emerald-600" />
                    Sightseeing Tours & Activities
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select from uploaded activities & sightseeing in <strong>{destination}</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addActivity}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus size={13} /> Add Activity
                  </button>
                  <button
                    type="button"
                    onClick={addSightseeing}
                    className="flex items-center gap-1.5 rounded-lg bg-purple-50 border border-purple-200 px-3.5 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-100 hover:border-purple-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus size={13} /> Add Sightseeing
                  </button>
                </div>
              </div>

              {/* Schedule Overlap Global Intelligence & Visual Timeline Breakdown */}
              {scheduleConflicts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-800 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                      <span className="font-semibold text-slate-900 truncate">
                        Timeline Overlap Detected:{" "}
                        <span className="font-normal text-slate-600">
                          {scheduleConflicts.length} schedule conflict{scheduleConflicts.length > 1 ? "s" : ""} found. Review below timeline & smart fixes.
                        </span>
                      </span>
                    </div>
                    <span className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 shrink-0">
                      Action Needed
                    </span>
                  </div>

                  {conflictingDays.map((dayNum) => (
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

              {/* Activities Section */}
              <div className="space-y-3 pt-1">
                <p className="text-xs font-bold text-slate-900">Activities & Experiences ({activities.length})</p>
                {activities.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No specific activities added yet. Click "+ Add Activity" to add.</p>
                ) : (
                  activities.map((act, index) => {
                    const filteredActs = getFilteredActivities(act.name, act);
                    const tourTypesList = Array.isArray(act.tourTypesList) && act.tourTypesList.length > 0
                      ? act.tourTypesList
                      : [
                          { tourType: "Sharing Tour", adultPrice: act.adultPrice || act.basePrice || act.price || 0, childPrice: act.childPrice || 0 },
                          { tourType: "Private Tour", adultPrice: act.adultPrice || act.basePrice || act.price || 0, childPrice: act.childPrice || 0 },
                          { tourType: "Ticket Tour", adultPrice: act.adultPrice || act.basePrice || act.price || 0, childPrice: act.childPrice || 0 }
                        ];
                    const currentTourType = act.tourType || tourTypesList[0]?.tourType || "Sharing Tour";
                    const currentTourObj = tourTypesList.find(t => String(t.tourType || "").trim().toLowerCase() === String(currentTourType || "").trim().toLowerCase()) || tourTypesList[0] || {};
                    const availableSlots = resolveSlotOptions(act);
                    const resolvedDuration = formatServiceDuration(act, currentTourObj);
                    const adultsCount = act.adults !== undefined ? Number(act.adults) : (act.pax !== undefined ? Number(act.pax) : 2);
                    const childrenCount = act.children !== undefined ? Number(act.children) : 0;
                    const adultPriceVal = act.adultPrice !== undefined ? Number(act.adultPrice) : Number(act.basePrice || 0);
                    const childPriceVal = act.childPrice !== undefined ? Number(act.childPrice) : 0;
                    const totalPriceVal = act.price !== undefined && act.price !== "" ? Number(act.price) : (adultPriceVal * adultsCount + childPriceVal * childrenCount);
                    const cardConflicts = getServiceConflicts("activity", index);

                    return (
                      <div key={index} className={`rounded-xl border ${cardConflicts.length > 0 ? "border-amber-300/80" : "border-gray-200"} bg-gray-50/50 p-4 space-y-3 relative shadow-2xs ${activeActivityDropdownIdx === index ? "z-30 ring-1 ring-blue-500/50" : "z-10"}`}>
                        
                        {/* Individual Activity Conflict Alert - Clean Agent Style */}
                        {cardConflicts.length > 0 && (
                          <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-3 space-y-2 text-xs">
                            <div className="flex items-start gap-2">
                              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1 space-y-1">
                                <span className="font-bold text-xs text-slate-900 block">Time Overlap Conflict</span>
                                <div className="text-xs text-slate-700 space-y-0.5">
                                  {cardConflicts.map((c, cIdx) => (
                                    <p key={cIdx}>
                                      • {c.detailedReason}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* 1-Click Quick Move Actions */}
                            <div className="pt-2 border-t border-amber-200/60 space-y-1.5">
                              <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                <Zap size={11} className="text-amber-600" /> Quick Move Activity:
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {Array.from({ length: totalDaysCount }, (_, i) => i + 1)
                                  .filter((d) => {
                                    if (d === (act.day || 1)) return false;
                                    if (totalDaysCount >= 3 && d === totalDaysCount) return false;
                                    if (totalDaysCount >= 3 && d === 1) {
                                      const hasDay1Transfer = transfers.some((tr) => Number(tr.day || 1) === 1);
                                      const isLong = parseDurationInMinutes(act.duration, 120) >= 180;
                                      if (hasDay1Transfer || isLong) return false;
                                    }
                                    return true;
                                  })
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
                          </div>
                        )}

                        {/* Top Header: Activity Configuration + Tour Type Selector + Delete */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              Activity #{index + 1}
                              {act.supplierName && (
                                <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700 font-semibold">
                                  Supplier: {act.supplierName}
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-[11px] font-semibold text-slate-600">Tour Type:</span>
                            <div className="relative">
                              <select
                                value={act.tourType || ""}
                                onChange={(e) => handleActivityTourTypeChange(index, e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white pl-2.5 pr-7 py-1 text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs cursor-pointer appearance-none"
                              >
                                <option value="">Select Tour Type</option>
                                {tourTypesList.map((t, tIdx) => (
                                  <option key={t._id || tIdx} value={t.tourType}>
                                    {t.tourType}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>

                            <button
                              type="button"
                              onClick={() => removeActivity(index)}
                              className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Remove Activity"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Info Badges: Days | Open/Close | Duration (Only when service has info or is selected) */}
                        {Boolean(act.operatingDays || act.openingTime || act.closingTime || resolvedDuration) && (
                          <div className="flex flex-wrap items-center gap-2">
                            {act.operatingDays && (
                              <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 font-medium shadow-2xs">
                                <span className="text-gray-400 font-normal">Days:</span> {act.operatingDays}
                              </span>
                            )}
                            {(act.openingTime || act.closingTime) && (
                              <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 font-medium shadow-2xs">
                                <Clock size={11} className="text-amber-600" />
                                <span className="text-gray-400 font-normal">Open / Close:</span> {act.openingTime || "08:00"} / {act.closingTime || "18:00"}
                              </span>
                            )}
                            {resolvedDuration && (
                              <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 font-medium shadow-2xs">
                                <Clock size={11} className="text-purple-600" />
                                <span className="text-gray-400 font-normal">Duration:</span> {resolvedDuration}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Description / Highlights */}
                        {Boolean(currentTourObj.description || act.description || act.desc) && (
                          <p className="text-[11px] text-gray-500 italic">
                            {currentTourObj.description || act.description || act.desc}
                          </p>
                        )}

                        {/* First Row: Search Input + Day Dropdown */}
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                          <div className={`sm:col-span-10 relative dmc-autocomplete-container ${activeActivityDropdownIdx === index ? "z-40" : "z-10"}`}>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Activity / Experience</label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="e.g. Scuba Diving, Adventure Tour, Desert Safari..."
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

                            {/* Dropdown */}
                            {activeActivityDropdownIdx === index && (
                              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl z-[100] divide-y divide-gray-100 [scrollbar-width:thin]">
                                {filteredActs.length === 0 ? (
                                  <div className="p-3 text-[11px] text-gray-500 italic text-center">
                                    No activity currently uploaded. You can freely type custom activity name.
                                  </div>
                                ) : (
                                  filteredActs.map((dmcAct, aIdx) => {
                                    const actTitle = dmcAct.serviceName || dmcAct.name || dmcAct.title;
                                    const isSelected = Boolean(act.name && actTitle.toLowerCase() === act.name.trim().toLowerCase());
                                    const defaultTour = Array.isArray(dmcAct.tourTypes) && dmcAct.tourTypes.length > 0 ? dmcAct.tourTypes[0] : {};
                                    const actAdultPrice = Number(
                                      dmcAct.adultPrice !== undefined
                                        ? dmcAct.adultPrice
                                        : defaultTour.adultPrice !== undefined
                                        ? defaultTour.adultPrice
                                        : dmcAct.price || dmcAct.rate || 0
                                    );
                                    const actChildPrice = Number(
                                      dmcAct.childPrice !== undefined
                                        ? dmcAct.childPrice
                                        : defaultTour.childPrice !== undefined
                                        ? defaultTour.childPrice
                                        : dmcAct.childRate !== undefined
                                        ? dmcAct.childRate
                                        : dmcAct.cwebRate !== undefined
                                        ? dmcAct.cwebRate
                                        : 0
                                    );

                                    return (
                                      <div
                                        key={dmcAct._id || dmcAct.id || aIdx}
                                        onClick={() => selectDmcActivity(index, dmcAct)}
                                        className={`p-3 hover:bg-blue-50/60 cursor-pointer transition flex items-center justify-between gap-2 ${
                                          isSelected ? "bg-blue-50/90 border-l-3 border-l-blue-600" : ""
                                        }`}
                                      >
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                            <span>{actTitle}</span>
                                            {isSelected && (
                                              <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] px-1.5 py-0.2 font-bold">
                                                ✓ Selected
                                              </span>
                                            )}
                                            <span className="text-[10px] text-gray-500 font-medium">
                                              • {dmcAct.tourType || defaultTour.tourType || "Sharing Tour"}
                                            </span>
                                          </p>
                                          <p className="text-[11px] text-gray-500 mt-0.5 truncate flex items-center gap-1 flex-wrap">
                                            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                              <MapPin size={11} className="text-rose-500 shrink-0" />
                                              {dmcAct.city || dmcAct.destination || destination}
                                            </span>
                                            • {dmcAct.category || "Experience"}
                                            • Days: {dmcAct.operatingDays || dmcAct.days || "Mon-Sun"}
                                          </p>
                                          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                                            Supplier: {dmcAct.supplierName || dmcAct.dmcName || "Contracted Supplier"}
                                          </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="text-xs font-bold text-slate-900">
                                            ₹{actAdultPrice.toLocaleString("en-IN")}
                                          </span>
                                          <span className="block text-[10px] text-gray-500">/ adult</span>
                                          <span className="block text-[9px] text-gray-400">
                                            Child: ₹{actChildPrice.toLocaleString("en-IN")}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>

                          {/* Day Dropdown */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Day</label>
                            <select
                              value={act.day || 1}
                              onChange={(e) => updateActivity(index, "day", Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
                            >
                              {Array.from({ length: totalDaysCount }, (_, i) => i + 1).map((d) => {
                                const dayInfo = dayLoadSummary[d];
                                let extraText = "";
                                if (dayInfo) {
                                  extraText = dayInfo.totalMins > 0 ? ` (${dayInfo.label})` : " (Free)";
                                }
                                return (
                                  <option key={d} value={d}>
                                    Day {d}{extraText}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        {/* Second Row: Configuration Grid: Adult Price | Child Price | Adults | Children | Slot / Time | Total */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-gray-200">
                          {/* 1. Adult Price */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Adult Price</label>
                            <input
                              type="number"
                              min="0"
                              value={adultPriceVal || ""}
                              onChange={(e) => updateActivity(index, "adultPrice", Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                            />
                          </div>

                          {/* 2. Child Price */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Child Price</label>
                            <input
                              type="number"
                              min="0"
                              value={childPriceVal || ""}
                              onChange={(e) => updateActivity(index, "childPrice", Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                            />
                          </div>

                          {/* 3. Adults */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Adults</label>
                            <input
                              type="number"
                              min="1"
                              value={adultsCount}
                              onChange={(e) => updateActivity(index, "adults", Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                            />
                          </div>

                          {/* 4. Children */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Children</label>
                            <input
                              type="number"
                              min="0"
                              value={childrenCount}
                              onChange={(e) => updateActivity(index, "children", Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                            />
                          </div>

                          {/* 5. Slot / Time */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Slot / Time</label>
                            <div className="relative">
                              <select
                                value={act.selectedSlot || availableSlots[0] || "08:00"}
                                onChange={(e) => updateActivity(index, "selectedSlot", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white pl-2 pr-6 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs cursor-pointer appearance-none"
                              >
                                {availableSlots.map((slot, sIdx) => {
                                  const slotCheck = checkSlotAvailability(
                                    "activity",
                                    index,
                                    slot,
                                    Number(act.day || 1),
                                    parseDurationInMinutes(act.duration, 120),
                                    allScheduledItems
                                  );
                                  return (
                                    <option key={sIdx} value={slot}>
                                      {slot} {slotCheck.isConflicting ? `⚠️ (Busy: ${slotCheck.conflictingWith})` : "✓ Free"}
                                    </option>
                                  );
                                })}
                              </select>
                              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>
                          </div>

                          {/* 6. Total */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Total (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={totalPriceVal || ""}
                              onChange={(e) => updateActivity(index, "price", Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-extrabold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none shadow-2xs"
                            />
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sightseeing Section */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-bold text-slate-900">Sightseeing Tours ({sightseeing.length})</p>
                {sightseeing.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No sightseeing tours added yet. Click "+ Add Sightseeing" to add.</p>
                ) : (
                  sightseeing.map((sight, index) => {
                    const filteredSight = getFilteredSightseeing(sight.name, sight);
                    const tourTypesList = Array.isArray(sight.tourTypesList) && sight.tourTypesList.length > 0
                      ? sight.tourTypesList
                      : [
                          { tourType: "Sharing Tour", adultPrice: sight.adultPrice || sight.basePrice || sight.price || 0, childPrice: sight.childPrice || 0 },
                          { tourType: "Private Tour", adultPrice: sight.adultPrice || sight.basePrice || sight.price || 0, childPrice: sight.childPrice || 0 },
                          { tourType: "Ticket Tour", adultPrice: sight.adultPrice || sight.basePrice || sight.price || 0, childPrice: sight.childPrice || 0 }
                        ];
                    const currentTourType = sight.tourType || tourTypesList[0]?.tourType || "Sharing Tour";
                    const currentTourObj = tourTypesList.find(t => String(t.tourType || "").trim().toLowerCase() === String(currentTourType || "").trim().toLowerCase()) || tourTypesList[0] || {};
                    const availableSlots = resolveSlotOptions(sight);
                    const resolvedDuration = formatServiceDuration(sight, currentTourObj);
                    const adultsCount = sight.adults !== undefined ? Number(sight.adults) : (sight.pax !== undefined ? Number(sight.pax) : 2);
                    const childrenCount = sight.children !== undefined ? Number(sight.children) : 0;
                    const adultPriceVal = sight.adultPrice !== undefined ? Number(sight.adultPrice) : Number(sight.basePrice || 0);
                    const childPriceVal = sight.childPrice !== undefined ? Number(sight.childPrice) : 0;
                    const totalPriceVal = sight.price !== undefined && sight.price !== "" ? Number(sight.price) : (adultPriceVal * adultsCount + childPriceVal * childrenCount);
                    const cardConflicts = getServiceConflicts("sightseeing", index);

                    return (
                      <div key={index} className={`rounded-xl border ${cardConflicts.length > 0 ? "border-amber-300/80" : "border-gray-200"} bg-gray-50/50 p-4 space-y-3 relative shadow-2xs ${activeSightseeingDropdownIdx === index ? "z-30 ring-1 ring-blue-500/50" : "z-10"}`}>
                        
                        {/* Individual Sightseeing Conflict Alert - Clean Agent Style */}
                        {cardConflicts.length > 0 && (
                          <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-3 space-y-2 text-xs">
                            <div className="flex items-start gap-2">
                              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1 space-y-1">
                                <span className="font-bold text-xs text-slate-900 block">Time Overlap Conflict</span>
                                <div className="text-xs text-slate-700 space-y-0.5">
                                  {cardConflicts.map((c, cIdx) => (
                                    <p key={cIdx}>
                                      • {c.detailedReason}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* 1-Click Quick Move Actions */}
                            <div className="pt-2 border-t border-amber-200/60 space-y-1.5">
                              <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                <Zap size={11} className="text-amber-600" /> Quick Move Sightseeing:
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {Array.from({ length: totalDaysCount }, (_, i) => i + 1)
                                  .filter((d) => {
                                    if (d === (sight.day || 1)) return false;
                                    if (totalDaysCount >= 3 && d === totalDaysCount) return false;
                                    if (totalDaysCount >= 3 && d === 1) {
                                      const hasDay1Transfer = transfers.some((tr) => Number(tr.day || 1) === 1);
                                      const isLong = parseDurationInMinutes(sight.duration, 60) >= 180;
                                      if (hasDay1Transfer || isLong) return false;
                                    }
                                    return true;
                                  })
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
                          </div>
                        )}

                        {/* Top Header: Sightseeing Configuration + Tour Type Selector + Delete */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              Sightseeing #{index + 1}
                              {sight.supplierName && (
                                <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700 font-semibold">
                                  Supplier: {sight.supplierName}
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-[11px] font-semibold text-slate-600">Tour Type:</span>
                            <div className="relative">
                              <select
                                value={sight.tourType || ""}
                                onChange={(e) => handleSightseeingTourTypeChange(index, e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white pl-2.5 pr-7 py-1 text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs cursor-pointer appearance-none"
                              >
                                <option value="">Select Tour Type</option>
                                {tourTypesList.map((t, tIdx) => (
                                  <option key={t._id || tIdx} value={t.tourType}>
                                    {t.tourType}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>

                            <button
                              type="button"
                              onClick={() => removeSightseeing(index)}
                              className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Remove Sightseeing"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Info Badges: Days | Open/Close | Duration (Only when service has info or is selected) */}
                        {Boolean(sight.operatingDays || sight.openingTime || sight.closingTime || resolvedDuration) && (
                          <div className="flex flex-wrap items-center gap-2">
                            {sight.operatingDays && (
                              <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 font-medium shadow-2xs">
                                <span className="text-gray-400 font-normal">Days:</span> {sight.operatingDays}
                              </span>
                            )}
                            {(sight.openingTime || sight.closingTime) && (
                              <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 font-medium shadow-2xs">
                                <Clock size={11} className="text-amber-600" />
                                <span className="text-gray-400 font-normal">Open / Close:</span> {sight.openingTime || "08:00"} / {sight.closingTime || "18:00"}
                              </span>
                            )}
                            {resolvedDuration && (
                              <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 font-medium shadow-2xs">
                                <Clock size={11} className="text-purple-600" />
                                <span className="text-gray-400 font-normal">Duration:</span> {resolvedDuration}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Description / Highlights */}
                        {Boolean(currentTourObj.description || sight.description || sight.desc) && (
                          <p className="text-[11px] text-gray-500 italic">
                            {currentTourObj.description || sight.description || sight.desc}
                          </p>
                        )}

                        {/* First Row: Search Input + Day Dropdown */}
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                          <div className={`sm:col-span-10 relative dmc-autocomplete-container ${activeSightseeingDropdownIdx === index ? "z-40" : "z-10"}`}>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sightseeing Tour</label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="e.g. Kempty Falls Tour, Mall Road Sightseeing, Fort Tour..."
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

                            {/* Dropdown */}
                            {activeSightseeingDropdownIdx === index && (
                              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl z-[100] divide-y divide-gray-100 [scrollbar-width:thin]">
                                {filteredSight.length === 0 ? (
                                  <div className="p-3 text-[11px] text-gray-500 italic text-center">
                                    No sightseeing tour found. You can freely type custom tour name.
                                  </div>
                                ) : (
                                  filteredSight.map((dmcSight, sIdx) => {
                                    const sightTitle = dmcSight.serviceName || dmcSight.name || dmcSight.title;
                                    const isSelected = Boolean(sight.name && sightTitle.toLowerCase() === sight.name.trim().toLowerCase());
                                    const defaultTour = Array.isArray(dmcSight.tourTypes) && dmcSight.tourTypes.length > 0 ? dmcSight.tourTypes[0] : {};
                                    const sightAdultPrice = Number(
                                      dmcSight.adultPrice !== undefined
                                        ? dmcSight.adultPrice
                                        : defaultTour.adultPrice !== undefined
                                        ? defaultTour.adultPrice
                                        : dmcSight.price || dmcSight.rate || 0
                                    );
                                    const sightChildPrice = Number(
                                      dmcSight.childPrice !== undefined
                                        ? dmcSight.childPrice
                                        : defaultTour.childPrice !== undefined
                                        ? defaultTour.childPrice
                                        : dmcSight.childRate !== undefined
                                        ? dmcSight.childRate
                                        : dmcSight.cwebRate !== undefined
                                        ? dmcSight.cwebRate
                                        : 0
                                    );

                                    return (
                                      <div
                                        key={dmcSight._id || dmcSight.id || sIdx}
                                        onClick={() => selectDmcSightseeing(index, dmcSight)}
                                        className={`p-3 hover:bg-blue-50/60 cursor-pointer transition flex items-center justify-between gap-2 ${
                                          isSelected ? "bg-blue-50/90 border-l-3 border-l-blue-600" : ""
                                        }`}
                                      >
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                            <span>{sightTitle}</span>
                                            {isSelected && (
                                              <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] px-1.5 py-0.2 font-bold">
                                                ✓ Selected
                                              </span>
                                            )}
                                            <span className="text-[10px] text-gray-500 font-medium">
                                              • {dmcSight.tourType || defaultTour.tourType || "Sharing Tour"}
                                            </span>
                                          </p>
                                          <p className="text-[11px] text-gray-500 mt-0.5 truncate flex items-center gap-1">
                                            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                              <MapPin size={11} className="text-rose-500 shrink-0" />
                                              {dmcSight.city || dmcSight.destination || destination}
                                            </span>
                                            • {dmcSight.category || "Sightseeing"}
                                            • Days: {dmcSight.operatingDays || dmcSight.days || "Mon-Sun"}
                                          </p>
                                          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                                            Supplier: {dmcSight.supplierName || dmcSight.dmcName || "Contracted Supplier"}
                                          </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="text-xs font-bold text-slate-900">
                                            ₹{sightAdultPrice.toLocaleString("en-IN")}
                                          </span>
                                          <span className="block text-[10px] text-gray-500">/ adult</span>
                                          <span className="block text-[9px] text-gray-400">
                                            Child: ₹{sightChildPrice.toLocaleString("en-IN")}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>

                          {/* Day Dropdown */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Day</label>
                            <select
                              value={sight.day || 1}
                              onChange={(e) => updateSightseeing(index, "day", Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs cursor-pointer"
                            >
                              {Array.from({ length: totalDaysCount }, (_, i) => i + 1).map((d) => {
                                const dayInfo = dayLoadSummary[d];
                                let extraText = "";
                                if (dayInfo) {
                                  extraText = dayInfo.totalMins > 0 ? ` (${dayInfo.label})` : " (Free)";
                                }
                                return (
                                  <option key={d} value={d}>
                                    Day {d}{extraText}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        {/* Second Row: Configuration Grid: Adult Price | Child Price | Adults | Children | Slot / Time | Total */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-gray-200">
                          {/* 1. Adult Price */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Adult Price</label>
                            <input
                              type="number"
                              min="0"
                              value={adultPriceVal || ""}
                              onChange={(e) => updateSightseeing(index, "adultPrice", Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                            />
                          </div>

                          {/* 2. Child Price */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Child Price</label>
                            <input
                              type="number"
                              min="0"
                              value={childPriceVal || ""}
                              onChange={(e) => updateSightseeing(index, "childPrice", Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                            />
                          </div>

                          {/* 3. Adults */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Adults</label>
                            <input
                              type="number"
                              min="1"
                              value={adultsCount}
                              onChange={(e) => updateSightseeing(index, "adults", Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                            />
                          </div>

                          {/* 4. Children */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Children</label>
                            <input
                              type="number"
                              min="0"
                              value={childrenCount}
                              onChange={(e) => updateSightseeing(index, "children", Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                            />
                          </div>

                          {/* 5. Slot / Time */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Slot / Time</label>
                            <div className="relative">
                              <select
                                value={sight.selectedSlot || availableSlots[0] || "08:00"}
                                onChange={(e) => updateSightseeing(index, "selectedSlot", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white pl-2 pr-6 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs cursor-pointer appearance-none"
                              >
                                {availableSlots.map((slot, sIdx) => {
                                  const slotCheck = checkSlotAvailability(
                                    "sightseeing",
                                    index,
                                    slot,
                                    Number(sight.day || 1),
                                    parseDurationInMinutes(sight.duration, 60),
                                    allScheduledItems
                                  );
                                  return (
                                    <option key={sIdx} value={slot}>
                                      {slot} {slotCheck.isConflicting ? `⚠️ (Busy: ${slotCheck.conflictingWith})` : "✓ Free"}
                                    </option>
                                  );
                                })}
                              </select>
                              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>
                          </div>

                          {/* 6. Total */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Total (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={totalPriceVal || ""}
                              onChange={(e) => updateSightseeing(index, "price", Number(e.target.value))}
                              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-extrabold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none shadow-2xs"
                            />
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PRICING & TAXES CONFIGURATION */}
          {activeTab === "pricing" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
                    <IndianRupee size={15} className="text-[#3E63DD]" />
                    5. Pricing & Taxes Configuration
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configure base net cost, view linked services subtotal, and apply GST, TCS & Tourism taxes.
                  </p>
                </div>
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 shrink-0">
                  Auto-Tax Engine
                </span>
              </div>

              {/* Linked Services Auto-Sum helper banner */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-blue-600" />
                      Linked Services Subtotal: <span className="text-blue-700 font-extrabold">₹ {totalLinkedServicesCost.toLocaleString("en-IN")}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Calculated from {validHotelsCount} Hotel(s), {validTransfersCount} Transport(s), {validActivitiesCount} Activity(s), and {validSightseeingCount} Sightseeing(s) added in previous tabs.
                    </p>
                  </div>
                  {totalLinkedServicesCost > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setBasePrice(String(totalLinkedServicesCost));
                        setPrice(String(totalLinkedServicesCost));
                        toast.success(`Total Services Cost set to ₹ ${totalLinkedServicesCost.toLocaleString("en-IN")}`);
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-[#3E63DD] hover:bg-[#3252c4] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <Sparkles size={12} />
                      <span>Select Services Base Cost</span>
                    </button>
                  )}
                </div>

                {/* Selected Services Itemized List with Name & Price */}
                {(selectedHotelsList.length > 0 || selectedTransfersList.length > 0 || selectedActivitiesList.length > 0 || selectedSightseeingList.length > 0) && (
                  <div className="border-t border-blue-200/60 pt-3 space-y-2">
                    <p className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                      Selected Services Breakdown ({selectedHotelsList.length + selectedTransfersList.length + selectedActivitiesList.length + selectedSightseeingList.length} Items):
                    </p>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin]">
                      
                      {/* Hotels List */}
                      {selectedHotelsList.map((h, idx) => {
                        const hNights = Number(h.nights) || 1;
                        const hRooms = Number(h.rooms) || 1;
                        const hTotal = Number(h.price || 0);
                        const hNightlyRate = Number(h.basePrice || 0);

                        // Extra bed details
                        const extraBedsList = [];
                        if (h.extraAdult && Number(h.awebRate) > 0) extraBedsList.push(`Extra Adult (₹${Number(h.awebRate).toLocaleString("en-IN")})`);
                        if (h.childWithBed && Number(h.cwebRate) > 0) extraBedsList.push(`Child w/ Bed (₹${Number(h.cwebRate).toLocaleString("en-IN")})`);
                        if (h.childWithoutBed && Number(h.cwoebRate) > 0) extraBedsList.push(`Child w/o Bed (₹${Number(h.cwoebRate).toLocaleString("en-IN")})`);
                        if (extraBedsList.length === 0 && h.extraBedType && h.extraBedType !== "None") {
                          extraBedsList.push(`Extra Bed: ${h.extraBedType}`);
                        }

                        const hotelMeta = [
                          h.roomType ? `Room: ${h.roomType}` : "Standard Room",
                          h.roomCategory ? `Category: ${h.roomCategory}` : "Double",
                          h.bedType ? `Bed: ${h.bedType}` : "Queen Bed",
                          extraBedsList.length > 0 ? extraBedsList.join(", ") : "Extra Bed: None",
                          h.mealPlan ? `Meal: ${h.mealPlan}` : "EP",
                          `${hRooms} Room${hRooms > 1 ? "s" : ""} • ${hNights} Night${hNights > 1 ? "s" : ""}`,
                          h.starCategory ? `★ ${h.starCategory}` : null,
                          h.supplierName ? `Supplier: ${h.supplierName}` : null,
                        ].filter(Boolean).join(" • ");

                        return (
                          <div
                            key={`hotel-item-${idx}`}
                            className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs shadow-2xs hover:border-gray-300 transition"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <span className="flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700 shrink-0 self-start mt-0.5">
                                  <BedDouble size={11} /> Hotel
                                </span>
                                <div className="min-w-0">
                                  {h.serviceName && h.serviceName !== h.hotelName && (
                                    <span className="text-[10px] font-semibold text-slate-500 block truncate">
                                      {h.serviceName}
                                    </span>
                                  )}
                                  <span className="font-bold text-xs text-slate-900 block truncate">
                                    {h.hotelName || h.name || `Hotel ${idx + 1}`}
                                  </span>
                                  <span className="text-[11px] text-gray-500 block truncate mt-0.5">
                                    {hotelMeta}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-extrabold text-slate-900">
                                  ₹ {hTotal.toLocaleString("en-IN")}
                                </span>
                                {hNights > 1 && hNightlyRate > 0 && (
                                  <p className="text-[10px] text-gray-400">
                                    (₹{hNightlyRate.toLocaleString("en-IN")} / night)
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* Hotel Description */}
                            {Boolean(h.description || h.desc) && (
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {h.description || h.desc}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {/* Transports List */}
                      {selectedTransfersList.map((t, idx) => {
                        const tCost = Number(t.price || 0);
                        const tUsageLabel = t.usage === "one-way-airport-transfer"
                          ? "One Way / Airport Transfer"
                          : t.usage === "inter-hotel-transfer"
                          ? "Inter-Hotel Transfer"
                          : t.usage === "full-day"
                          ? "Full Day Cab"
                          : t.usage === "half-day"
                          ? "Half Day Cab"
                          : (t.usage || "One Way Transfer");

                        const transferMeta = [
                          t.day ? `Day ${t.day}` : null,
                          t.vehicleType ? `Vehicle: ${t.vehicleType}` : null,
                          tUsageLabel,
                          `Capacity: ${t.passengerCapacity || 4} Pax, ${t.luggageCapacity !== undefined ? t.luggageCapacity : 2} Bags`,
                          (t.pickupTime || t.time) ? `Pickup: ${t.pickupTime || t.time}` : null,
                          t.days
                            ? t.usage === "full-day"
                              ? `${t.days} Day${Number(t.days) > 1 ? "s" : ""}`
                              : t.usage === "half-day"
                              ? `${t.days} Half-Day${Number(t.days) > 1 ? "s" : ""}`
                              : `${t.days} Trip${Number(t.days) > 1 ? "s" : ""}`
                            : "1 Trip",
                          (t.fullDayExtraPerKmRate || t.halfDayExtraPerKmRate)
                            ? `Extra: ₹${t.fullDayExtraPerKmRate || t.halfDayExtraPerKmRate}/km`
                            : null,
                          t.supplierName ? `Supplier: ${t.supplierName}` : null,
                        ].filter(Boolean).join(" • ");

                        return (
                          <div
                            key={`transfer-item-${idx}`}
                            className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs shadow-2xs hover:border-gray-300 transition"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <span className="flex items-center gap-1 rounded-md bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-700 shrink-0">
                                  <Car size={11} /> Transport
                                </span>
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 block truncate">
                                    {t.name || t.serviceName || t.vehicleType || `Transport ${idx + 1}`}
                                  </span>
                                  <span className="text-[11px] text-gray-500 block truncate">
                                    {transferMeta}
                                  </span>
                                </div>
                              </div>
                              <span className="font-extrabold text-slate-900 shrink-0">
                                ₹ {tCost.toLocaleString("en-IN")}
                              </span>
                            </div>
                            {/* Transport Description / Notes */}
                            {Boolean(t.description || t.fullDayNote || t.halfDayNote || t.desc) && (
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {t.description || t.fullDayNote || t.halfDayNote || t.desc}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {/* Activities List */}
                      {selectedActivitiesList.map((a, idx) => {
                        const aCost = Number(a.price || 0);
                        const aAdultPrice = Number(a.adultPrice !== undefined ? a.adultPrice : (a.basePrice || 0));
                        const aChildPrice = Number(a.childPrice || 0);
                        const aAdults = Number(a.adults !== undefined ? a.adults : (a.pax || 1));
                        const aChildren = Number(a.children || 0);
                        const aTourType = a.tourType || "Sharing Tour";

                        const details = [
                          a.day ? `Day ${a.day}` : null,
                          aTourType,
                          `${aAdults} Adult(s)` + (aChildren > 0 ? `, ${aChildren} Child(ren)` : ""),
                          a.selectedSlot || a.time ? `Slot: ${a.selectedSlot || a.time}` : null,
                          aAdultPrice > 0 ? `Adult: ₹${aAdultPrice.toLocaleString("en-IN")}` : null,
                          aChildPrice > 0 ? `Child: ₹${aChildPrice.toLocaleString("en-IN")}` : null,
                          a.supplierName ? `Supplier: ${a.supplierName}` : null,
                        ].filter(Boolean).join(" • ");

                        return (
                          <div
                            key={`activity-item-${idx}`}
                            className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs shadow-2xs hover:border-gray-300 transition"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <span className="flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                                  <Sparkles size={11} /> Activity
                                </span>
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 block truncate">
                                    {a.name || a.serviceName || `Activity ${idx + 1}`}
                                  </span>
                                  <span className="text-[11px] text-gray-500 block truncate">
                                    {details}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-extrabold text-slate-900">
                                  ₹ {aCost.toLocaleString("en-IN")}
                                </span>
                                {(aAdultPrice > 0 || aChildPrice > 0) && (
                                  <p className="text-[10px] text-gray-400">
                                    {[
                                      aAdultPrice > 0 ? `₹${aAdultPrice.toLocaleString("en-IN")} / adult` : null,
                                      aChildPrice > 0 ? `₹${aChildPrice.toLocaleString("en-IN")} / child` : null,
                                    ].filter(Boolean).join(" • ")}
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* Description */}
                            {Boolean(a.description || a.desc) && (
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {a.description || a.desc}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {/* Sightseeing List */}
                      {selectedSightseeingList.map((s, idx) => {
                        const sCost = Number(s.price || 0);
                        const sAdultPrice = Number(s.adultPrice !== undefined ? s.adultPrice : (s.basePrice || 0));
                        const sChildPrice = Number(s.childPrice || 0);
                        const sAdults = Number(s.adults !== undefined ? s.adults : (s.pax || 1));
                        const sChildren = Number(s.children || 0);
                        const sTourType = s.tourType || "Sharing Tour";

                        const details = [
                          s.day ? `Day ${s.day}` : null,
                          sTourType,
                          `${sAdults} Adult(s)` + (sChildren > 0 ? `, ${sChildren} Child(ren)` : ""),
                          s.selectedSlot || s.time ? `Slot: ${s.selectedSlot || s.time}` : null,
                          s.supplierName ? `Supplier: ${s.supplierName}` : null,
                        ].filter(Boolean).join(" • ");

                        return (
                          <div
                            key={`sightseeing-item-${idx}`}
                            className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs shadow-2xs hover:border-gray-300 transition"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <span className="flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700 shrink-0">
                                  <Landmark size={11} /> Sightseeing
                                </span>
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 block truncate">
                                    {s.name || s.serviceName || `Sightseeing ${idx + 1}`}
                                  </span>
                                  <span className="text-[11px] text-gray-500 block truncate">
                                    {details}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-extrabold text-slate-900">
                                  ₹ {sCost.toLocaleString("en-IN")}
                                </span>
                                {(sAdultPrice > 0 || sChildPrice > 0) && (
                                  <p className="text-[10px] text-gray-400">
                                    {[
                                      sAdultPrice > 0 ? `₹${sAdultPrice.toLocaleString("en-IN")} / adult` : null,
                                      sChildPrice > 0 ? `₹${sChildPrice.toLocaleString("en-IN")} / child` : null,
                                    ].filter(Boolean).join(" • ")}
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* Description */}
                            {Boolean(s.description || s.desc) && (
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {s.description || s.desc}
                              </p>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  </div>
                )}
              </div>

              {/* PRICING & TAXES CONFIGURATION DESK */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4 shadow-2xs">
                
                {/* 1. Total Services Cost Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Services Cost (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-gray-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 60000"
                      value={basePrice || price}
                      onChange={(e) => {
                        setBasePrice(e.target.value);
                        setPrice(e.target.value);
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white pl-7 pr-3 py-2 text-xs font-bold text-slate-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Base net cost of all included services before government and local taxes.
                  </p>
                </div>

                {/* 2. Three Taxes Configuration Row (GST, TCS, Tourism Fee) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-0.5">
                  
                  {/* A. GST Block */}
                  <div className={`rounded-lg border p-3.5 transition-all shadow-2xs ${gstChecked ? "border-blue-300 bg-blue-50/50" : "border-gray-200 bg-white opacity-70"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={gstChecked}
                          onChange={(e) => setGstChecked(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                        />
                        <span>GST (Tax)</span>
                      </label>
                      <span className={`text-xs font-extrabold ${gstChecked ? "text-blue-700" : "text-gray-400"}`}>
                        + ₹ {gstAmt.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        disabled={!gstChecked}
                        value={gstPercent}
                        onChange={(e) => setGstPercent(e.target.value)}
                        className="w-16 rounded-md border border-gray-300 bg-white px-2 py-1 text-center text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50 shadow-2xs"
                      />
                      <span className="text-[11px] font-medium text-gray-500">% Rate</span>
                    </div>
                  </div>

                  {/* B. TCS Block */}
                  <div className={`rounded-lg border p-3.5 transition-all shadow-2xs ${tcsChecked ? "border-blue-300 bg-blue-50/50" : "border-gray-200 bg-white opacity-70"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={tcsChecked}
                          onChange={(e) => setTcsChecked(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                        />
                        <span>TCS</span>
                      </label>
                      <span className={`text-xs font-extrabold ${tcsChecked ? "text-blue-700" : "text-gray-400"}`}>
                        + ₹ {tcsAmt.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        disabled={!tcsChecked}
                        value={tcsPercent}
                        onChange={(e) => setTcsPercent(e.target.value)}
                        className="w-16 rounded-md border border-gray-300 bg-white px-2 py-1 text-center text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50 shadow-2xs"
                      />
                      <span className="text-[11px] font-medium text-gray-500">% Rate</span>
                    </div>
                  </div>

                  {/* C. Tourism Fee / Other Tax Block */}
                  <div className={`rounded-lg border p-3.5 transition-all shadow-2xs ${tourismChecked ? "border-blue-300 bg-blue-50/50" : "border-gray-200 bg-white opacity-70"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={tourismChecked}
                          onChange={(e) => setTourismChecked(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                        />
                        <span>Tourism Fee</span>
                      </label>
                      <span className={`text-xs font-extrabold ${tourismChecked ? "text-blue-700" : "text-gray-400"}`}>
                        + ₹ {tourismAmt.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-gray-500 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        disabled={!tourismChecked}
                        placeholder="e.g. 1000"
                        value={tourismAmount}
                        onChange={(e) => setTourismAmount(e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50 shadow-2xs"
                      />
                    </div>
                  </div>

                </div>

                {/* 3. Live Summary Pill Card */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-center flex flex-col justify-center shadow-2xs">
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Services Cost</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">₹ {numBaseCost.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-center flex flex-col justify-center shadow-2xs">
                    <p className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                      Total Taxes (GST + TCS + Tourism)
                    </p>
                    <p className="text-sm font-extrabold text-blue-700 mt-0.5">+ ₹ {totalTaxAmt.toLocaleString("en-IN")}</p>
                    <div className="mt-1 flex items-center justify-center gap-1 flex-wrap">
                      {gstChecked && gstAmt > 0 && (
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-100/80 rounded px-1.5 py-0.2">
                          GST: +₹{gstAmt.toLocaleString("en-IN")}
                        </span>
                      )}
                      {tcsChecked && tcsAmt > 0 && (
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-100/80 rounded px-1.5 py-0.2">
                          TCS: +₹{tcsAmt.toLocaleString("en-IN")}
                        </span>
                      )}
                      {tourismChecked && tourismAmt > 0 && (
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-100/80 rounded px-1.5 py-0.2">
                          Tourism: +₹{tourismAmt.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-center flex flex-col justify-center shadow-2xs">
                    <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Final Price</p>
                    <p className="text-base font-extrabold text-emerald-700 mt-0.5">₹ {finalCalculatedPrice.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>

              {/* FINAL TOTAL PACKAGE SELLING PRICE INPUT */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 space-y-2 shadow-2xs">
                <label className="block text-xs font-bold text-slate-900">
                  Final Package Selling Price (₹ INR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-extrabold text-blue-700">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 68000"
                    value={finalCalculatedPrice > 0 ? finalCalculatedPrice : price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (!basePrice) setBasePrice(e.target.value);
                    }}
                    className="w-full rounded-lg border border-blue-400 bg-white pl-9 pr-3 py-2.5 text-base font-extrabold text-blue-700 placeholder-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Standard package selling price (inclusive of taxes) applied when loaded in quotation builder and displayed to agents.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: INCLUSIONS & NOTES */}
          {activeTab === "inclusions" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
                    <Sparkles size={15} className="text-[#3E63DD]" />
                    6. Inclusions, Exclusions & Notes
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Terms, inclusions and exclusions shown to client in quotation.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Package Inclusions
                  </label>
                  <textarea
                    rows="3"
                    placeholder="e.g. Daily breakfast, Hotel stay, Private airport transfers, Sightseeing as per itinerary"
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Package Exclusions
                  </label>
                  <textarea
                    rows="3"
                    placeholder="e.g. Flight tickets, Personal expenses, Alcoholic drinks, Entry monument tickets"
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DAY-WISE ITINERARY (PLACED AT THE END) */}
          {activeTab === "itinerary" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
                    <CalendarDays size={15} className="text-purple-600" />
                    7. Day-by-Day Tour Itinerary Schedule
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Define day-wise route, highlights & activities that will auto-fill in WhatsApp/PDF quotation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addItineraryDay}
                  className="flex items-center gap-1.5 rounded-lg bg-purple-50 border border-purple-200 px-3.5 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-100 hover:border-purple-300 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus size={13} /> Add Day
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {itinerary.map((item, index) => (
                  <div key={index} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-1">
                        <span className="rounded-md bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-bold text-purple-700 shrink-0">
                          Day {item.day || index + 1}
                        </span>
                        <input
                          type="text"
                          placeholder={`e.g. Day ${index + 1}: Sightseeing Tour & Excursion`}
                          value={item.title}
                          onChange={(e) => updateItinerary(index, "title", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                        />
                      </div>
                      {itinerary.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItineraryDay(index)}
                          className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Remove Day"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Itinerary Description / Activities</label>
                      <textarea
                        rows="2"
                        placeholder="Detail pickup times, monuments visited, meals included, and evening plans..."
                        value={item.description}
                        onChange={(e) => updateItinerary(index, "description", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-700 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[#3E63DD] hover:bg-[#3252c4] px-5 py-2 text-xs font-bold text-white shadow-sm transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving Template..." : "Save Pre-defined Package"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
