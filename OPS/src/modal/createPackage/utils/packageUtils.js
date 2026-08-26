export const POPULAR_DESTINATIONS = [
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

export const GOA_SUB_CITIES = [
  "goa", "ponda", "panaji", "panjim", "calangute", "candolim", "baga",
  "old goa", "south goa", "north goa", "anjuna", "colva",
  "vagator", "margao", "mapusa", "vasco", "arambol", "morjim", "dabolim"
];

export const TRANSPORT_USAGE_OPTIONS = [
  { value: "one-way-airport-transfer", label: "One Way / Airport Transfer" },
  { value: "inter-hotel-transfer", label: "Inter Hotel Transfer" },
  { value: "full-day", label: "Full Day (80 km / 8 hrs)" },
  { value: "half-day", label: "Half Day (40 km / 4 hrs)" },
];

export const initialHotel = () => ({
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

export const initialTransfer = () => ({
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

export const initialActivity = () => ({
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

export const initialSightseeing = () => ({
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

export const initialItineraryDay = (dayNum = 1) => ({
  day: dayNum,
  title: `Day ${dayNum}: Sightseeing & Tour`,
  description: "",
});

export const formatServiceDuration = (serv = {}, tourObj = {}) => {
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

export const resolveSlotOptions = (serv = {}) => {
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

export const timeStringToMinutes = (timeStr = "") => {
  if (!timeStr || typeof timeStr !== "string") return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(mins)) return null;
  return hours * 60 + mins;
};

export const minutesToTimeString = (totalMinutes = 0) => {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const formatTimeAMPM = (timeStr = "") => {
  if (!timeStr) return "";
  const mins = timeStringToMinutes(timeStr);
  if (mins === null) return timeStr;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

export const parseDurationInMinutes = (durStr = "", defaultMins = 60) => {
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

export const formatDurationShort = (totalMins = 0) => {
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

export const formatDurationDetailed = (totalMins = 0) => {
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

export const detectScheduleConflicts = (transfers = [], activities = [], sightseeing = [], totalDays = 2) => {
  const scheduledItems = [];

  transfers.forEach((tr, index) => {
    const rawTime = tr.pickupTime || tr.time || "";
    const startMins = timeStringToMinutes(rawTime);
    if (startMins === null) return;
    const durMins = parseDurationInMinutes(tr.duration, 0);
    if (durMins <= 0) return;
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

          const suggestedDayShifts = [];

          for (let d = 1; d <= totalDays; d++) {
            if (d === itemA.day) continue;
            if (totalDays >= 3 && d === totalDays) continue;
            if (totalDays >= 3 && d === 1) {
              const hasDay1Transfer = transfers.some((tr) => Number(tr.day || 1) === 1);
              const isLongTour = (itemB.durMins || 0) >= 180 || (itemB.startMins || 0) < 12 * 60;
              if (hasDay1Transfer || isLongTour) continue;
            }

            const hasDepartureTransferOnDayD = transfers.some(
              (tr) => Number(tr.day || 1) === d && /drop|departure|airport drop/i.test(tr.name || tr.serviceName || "")
            );
            if (hasDepartureTransferOnDayD) continue;

            const itemsOnDayD = scheduledItems.filter((it) => it.day === d);
            const wouldConflictB = itemsOnDayD.some((it) => {
              const oS = Math.max(it.startMins, itemB.startMins);
              const oE = Math.min(it.endMins, itemB.endMins);
              return oS < oE;
            });
            if (wouldConflictB) continue;

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

export const checkSlotAvailability = (currentType, currentIndex, testSlot, dayNum, durationMins, scheduledItems = []) => {
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

export const getDayLoadSummary = (scheduledItems = [], totalDays = 2) => {
  const summary = {};
  for (let d = 1; d <= totalDays; d++) {
    const items = scheduledItems.filter((it) => Number(it.day) === d && it.type !== "transfer");
    const totalMins = items.reduce((sum, it) => sum + (it.durMins || 0), 0);
    const hrs = Math.round((totalMins / 60) * 10) / 10;
    const count = items.length;
    const isFull = totalMins >= 600;

    let label = "Free";
    if (count === 1) {
      const itemHrs = Math.round(((items[0].durMins || 60) / 60) * 10) / 10;
      label = isFull ? `${itemHrs} hrs (Full Day • 1 Tour)` : `${itemHrs} hrs (1 Tour)`;
    } else if (count > 1) {
      const parts = items.map((it) => `${Math.round(((it.durMins || 60) / 60) * 10) / 10} hrs`);
      const breakdown = parts.join(" + ");
      label = `${breakdown} = ${hrs} hrs Total (${count} Tours)`;
    }

    summary[d] = {
      day: d,
      totalMins,
      totalHours: hrs,
      itemsCount: count,
      isFull,
      label,
    };
  }
  return summary;
};

export const normalizeComparisonText = (val = "") => String(val || "").trim().toLowerCase();

export const formatLocationWithDestination = (cityStr = "", destStr = "", pkgDestStr = "") => {
  const c = String(cityStr || "").trim();
  const d = String(destStr || "").trim();
  const p = String(pkgDestStr || "").trim();

  const cNorm = c.toLowerCase();
  const pNorm = p.toLowerCase();
  const dNorm = d.toLowerCase();

  const isGoaRelated =
    pNorm.includes("goa") ||
    cNorm.includes("goa") ||
    dNorm.includes("goa") ||
    GOA_SUB_CITIES.some((sub) => cNorm.includes(sub));

  if (isGoaRelated) {
    if (cNorm && cNorm !== "goa" && !cNorm.includes("goa")) {
      return `Goa (${c})`;
    }
    return c || d || "Goa";
  }

  if (c && p && c.toLowerCase() !== p.toLowerCase() && !c.toLowerCase().includes(p.toLowerCase())) {
    return `${p} (${c})`;
  }

  return c || d || p || "Destination";
};

export const isMatchingPackageDestination = (item = {}, dest = "") => {
  const destClean = normalizeComparisonText(dest);
  if (!destClean) return true;

  const city = normalizeComparisonText(item.city);
  const itemDest = normalizeComparisonText(item.destination);
  const title = normalizeComparisonText(item.title || item.hotelName || item.serviceName || item.name);

  const isGoaPackage = GOA_SUB_CITIES.some((sub) => destClean.includes(sub));
  if (isGoaPackage) {
    const isItemInGoa = GOA_SUB_CITIES.some(
      (sub) => city.includes(sub) || itemDest.includes(sub) || title.includes(sub)
    );
    if (isItemInGoa) return true;
  }

  if (city && (city.includes(destClean) || destClean.includes(city))) return true;
  if (itemDest && (itemDest.includes(destClean) || destClean.includes(itemDest))) return true;
  if (title && title.includes(destClean)) return true;

  return false;
};

export const recalculateHotelPrice = (hotel) => {
  const base = Number(hotel.basePrice || 0);
  const aweb = hotel.extraAdult ? Number(hotel.awebRate || 0) : 0;
  const cweb = hotel.childWithBed ? Number(hotel.cwebRate || 0) : 0;
  const cwoeb = hotel.childWithoutBed ? Number(hotel.cwoebRate || 0) : 0;
  const perNightPerRoom = base + aweb + cweb + cwoeb;
  const n = Math.max(1, Number(hotel.nights || 1));
  const r = Math.max(1, Number(hotel.rooms || 1));
  return perNightPerRoom * n * r;
};

export const normalizeBedType = (bed = "") => {
  const norm = String(bed || "").toLowerCase().trim();
  if (norm.includes("king")) return "King Bed";
  if (norm.includes("queen")) return "Queen Bed";
  if (norm.includes("twin")) return "Twin Bed";
  if (norm.includes("double")) return "Double Bed";
  if (norm.includes("single")) return "Single Bed";
  return "Queen Bed";
};

export const normalizeExtraBedType = (extra = "") => {
  const norm = String(extra || "").toLowerCase().trim();
  if (norm === "" || norm === "none" || norm === "no") return "None";
  if (norm.includes("single")) return "Single Bed";
  if (norm.includes("rollaway")) return "Rollaway Bed";
  if (norm.includes("sofa")) return "Sofa Bed";
  if (norm.includes("mattress")) return "Mattress";
  return "None";
};

export const getOccupancyDefaultsForRoomCategory = (category = "", currentBedType = "") => {
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
  const isKing = String(currentBedType || "").toLowerCase().includes("king");
  return {
    maxAdults: 2,
    maxChildren: 1,
    bedType: isKing ? "King Bed" : "Queen Bed",
    extraBedType: "None",
  };
};

export const isTripleAllowedCategory = (roomTypeName = "") => {
  const name = String(roomTypeName || "").trim().toLowerCase();
  return name.includes("family") || name.includes("luxury") || name.includes("suite");
};

export const getTransportVehicleUsagePrices = (vehicle = {}, dmcTransfer = {}) => {
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
