import React, { useState } from "react";
import { BedDouble, Car, Landmark, Target, MapPin, Building2 } from "lucide-react";
import { MdStarRate } from "react-icons/md";
import { BsCheck2All } from "react-icons/bs";

const TRANSPORT_TYPES = ["transfer", "car", "transport", "cab", "vehicle", "flight", "train", "ferry"];
const text = (value, fallback = "Not specified") => String(value ?? "").trim() || fallback;
const formatDate = (value) => {
  if (!value) return "Date not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const formatAmount = (value, currency = "INR") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Not specified";
  const currStr = String(currency || "INR").trim();
  if (currStr.toUpperCase() === "INR") {
    return `₹ INR ${Math.round(amount).toLocaleString("en-IN")}`;
  }
  return `₹ ${currStr} ${Math.round(amount).toLocaleString("en-IN")}`;
};
const getLocation = (service = {}) => [service.city, service.country].filter(Boolean).join(", ") || "Location not specified";
const getSupplier = (service = {}) => text(service.supplierName || service.dmcName, "Supplier not specified");

const getServicePaxDetails = (service = {}, query = {}, quote = {}) => {
  const queryAdults = Number(query?.numberOfAdults ?? quote?.numberOfAdults ?? 0);
  const queryChildren = Number(query?.numberOfChildren ?? quote?.numberOfChildren ?? 0);
  const queryInfants = Number(query?.numberOfInfants ?? quote?.numberOfInfants ?? 0);

  const numAdults = Number(
    service.adults !== undefined && service.adults !== null && service.adults !== ""
      ? service.adults
      : (queryAdults > 0 ? queryAdults : (service.pax || 1))
  );
  const numChildren = Number(
    service.children !== undefined && service.children !== null && service.children !== ""
      ? service.children
      : queryChildren
  );
  const numInfants = Number(
    service.infants !== undefined && service.infants !== null && service.infants !== ""
      ? service.infants
      : queryInfants
  );

  const hasBreakdown = (numAdults > 0 || numChildren > 0 || numInfants > 0);
  const totalPax = hasBreakdown
    ? (numAdults + numChildren + numInfants)
    : Number(service.pax || queryAdults || 1);

  const parts = [];
  if (numAdults > 0) parts.push(`${numAdults} adult${numAdults > 1 ? "s" : ""}`);
  if (numChildren > 0) parts.push(`${numChildren} child${numChildren > 1 ? "ren" : ""}`);
  if (numInfants > 0) parts.push(`${numInfants} infant${numInfants > 1 ? "s" : ""}`);

  let paxLabel = "";
  if (parts.length > 1) {
    paxLabel = `${totalPax} pax (${parts.join(", ")})`;
  } else if (parts.length === 1) {
    paxLabel = parts[0];
  } else {
    paxLabel = `${totalPax} pax`;
  }

  return { numAdults, numChildren, numInfants, totalPax, paxLabel };
};

const getHotelRateBreakdown = (hotel = {}) => {
  const rCount = Math.max(1, Number(hotel.rooms || 1));
  const nVal = Math.max(1, Number(hotel.nights || 1));
  const directRoomNightRate = Number(
    hotel.roomPrice || hotel.unitPrice || hotel.ratePerNight || hotel.roomRate || hotel.pricePerNight || hotel.nightlyRate || 0
  );
  const explicitTotalPrice = Number(
    hotel.totalInInr || hotel.total || hotel.totalPrice || (hotel.isTotalPrice || hotel.isTotal ? hotel.price : 0)
  );

  let unitRoomNightRate = 0;
  let itemPrice = 0;

  if (directRoomNightRate > 0) {
    unitRoomNightRate = directRoomNightRate;
    itemPrice = explicitTotalPrice > 0 ? explicitTotalPrice : (unitRoomNightRate * rCount * nVal);
  } else if (explicitTotalPrice > 0) {
    itemPrice = explicitTotalPrice;
    unitRoomNightRate = Math.round(itemPrice / (nVal * rCount));
  } else {
    unitRoomNightRate = Number(hotel.price || hotel.rate || 0);
    itemPrice = unitRoomNightRate * rCount * nVal;
  }

  const unitNightRate = itemPrice > 0 ? Math.round(itemPrice / nVal) : (unitRoomNightRate * rCount);

  let nightlyRateLabel = "";
  let breakdownDetailLabel = "";

  if (itemPrice > 0) {
    nightlyRateLabel = `₹${unitNightRate.toLocaleString("en-IN")} / Night`;
    if (nVal > 1 && rCount > 1) {
      breakdownDetailLabel = `([₹ ${unitRoomNightRate.toLocaleString("en-IN")} / Room / Night] × ${rCount} Rooms × ${nVal} Nights)`;
    } else if (nVal > 1) {
      breakdownDetailLabel = `([₹ ${unitRoomNightRate.toLocaleString("en-IN")} / Room / Night] × ${rCount} Room${rCount > 1 ? "s" : ""} × ${nVal} Nights)`;
    } else if (rCount > 1) {
      breakdownDetailLabel = `([₹ ${unitRoomNightRate.toLocaleString("en-IN")} / Room / Night] × ${rCount} Rooms × 1 Night)`;
    } else {
      breakdownDetailLabel = `([₹ ${unitRoomNightRate.toLocaleString("en-IN")} / Room / Night] × 1 Room × 1 Night)`;
    }
  }

  return { itemPrice, unitNightRate, unitRoomNightRate, nightlyRateLabel, breakdownDetailLabel };
};

const getServiceTotal = (service = {}, query = {}, quote = {}) => {
  const type = String(service.type || service.category || "").toLowerCase();

  if (type === "activity" || type === "sightseeing") {
    const adultP = Number(
      service.adultPrice !== undefined && service.adultPrice !== null && service.adultPrice !== ""
        ? service.adultPrice
        : (service.adult_price ?? 0)
    );
    const childP = Number(
      service.childPrice !== undefined && service.childPrice !== null && service.childPrice !== ""
        ? service.childPrice
        : (service.child_price ?? 0)
    );

    const { numAdults, numChildren } = getServicePaxDetails(service, query, quote);

    if (adultP > 0 || childP > 0) {
      return (adultP * numAdults) + (childP * numChildren);
    }

    const totalInInr = Number(service.totalInInr);
    if (Number.isFinite(totalInInr) && totalInInr > 0) return totalInInr;

    const total = Number(service.total ?? service.totalPrice);
    if (Number.isFinite(total) && total > 0) return total;

    return Number(service.price ?? service.rate ?? service.amount ?? 0);
  }

  if (type === "hotel" && service.hotelRateMode !== "service-total") {
    const { itemPrice } = getHotelRateBreakdown(service);
    return itemPrice;
  }

  if (TRANSPORT_TYPES.includes(type)) {
    const totalInInr = Number(service.totalInInr);
    if (Number.isFinite(totalInInr) && totalInInr > 0) return totalInInr;

    const total = Number(service.total ?? service.totalPrice);
    if (Number.isFinite(total) && total > 0) return total;

    const rate = Number(service.rate ?? service.price ?? 0);
    const days = Math.max(1, Number(service.days) || 1);
    return rate * days;
  }

  const totalInInr = Number(service.totalInInr);
  if (Number.isFinite(totalInInr) && totalInInr > 0) return totalInInr;

  const directTotal = Number(service.total ?? service.totalPrice);
  if (Number.isFinite(directTotal) && directTotal > 0) return directTotal;

  const price = Number(service.price ?? service.rate ?? service.amount);
  if (Number.isFinite(price) && price > 0) return price;
  return 0;
};

const formatHotelDateRange = (hotel = {}) => {
  const rawStart = hotel.serviceDate || hotel.checkIn || hotel.startDate;
  const nights = Math.max(1, Number(hotel.nights) || 1);
  const nightsStr = `${nights} Night${nights > 1 ? "s" : ""}`;

  if (!rawStart) return { dateStr: "Date not specified", nightsStr };

  let startFormatted = formatDate(rawStart);
  let endFormatted = "";

  if (hotel.checkOut && hotel.checkOut !== "-") {
    endFormatted = formatDate(hotel.checkOut);
  } else {
    const d = new Date(rawStart);
    if (!isNaN(d.getTime())) {
      const end = new Date(d);
      end.setDate(end.getDate() + nights);
      endFormatted = end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
  }

  const dateStr = endFormatted && endFormatted !== startFormatted
    ? `${startFormatted} - ${endFormatted}`
    : startFormatted;

  return { dateStr, nightsStr };
};

const getHotelCategoryDisplay = (hotel = {}) => {
  const rawCat = String(hotel.hotelCategory || hotel.starCategory || hotel.starRating || hotel.category || "5 Star").trim();
  const numMatch = rawCat.match(/(\d+)/);
  let count = 5;
  if (numMatch) {
    count = Math.min(5, Math.max(1, Number(numMatch[1])));
  }
  const categoryText = rawCat.toLowerCase().includes("star") ? rawCat : `${rawCat} Star`;
  return { categoryText, starCount: count };
};

const resolveMealPlanDisplay = (hotel = {}) => {
  // 1. Check explicit candidate fields
  const explicitCandidates = [
    hotel.mealPlan,
    hotel.meal_plan,
    hotel.meal,
    hotel.meals,
    hotel.mealType,
  ].filter((val) => typeof val === "string" && val.trim().length > 0);

  for (const candidate of explicitCandidates) {
    const upper = candidate.trim().toUpperCase();
    if (upper === "EP" || upper.includes("ROOM ONLY") || upper.includes("ONLY ROOM") || upper.includes("NO MEAL")) {
      return { code: "EP", inclusionsText: "Room Only" };
    }
    if (upper === "MAP" || upper.includes("HALF BOARD") || upper.includes("BREAKFAST & DINNER") || upper.includes("BREAKFAST AND DINNER") || upper.includes("BREAKFAST + DINNER")) {
      return { code: "MAP", inclusionsText: "Breakfast & Dinner" };
    }
    if (upper === "AP" || upper.includes("FULL BOARD") || upper.includes("ALL MEAL")) {
      return { code: "AP", inclusionsText: "Breakfast, Lunch & Dinner" };
    }
    if (upper === "AI" || upper.includes("ALL INCLUSIVE")) {
      return { code: "AI", inclusionsText: "All Inclusive" };
    }
    if (upper === "CP" || upper.includes("BREAKFAST") || upper.includes("BED & BREAKFAST") || upper.includes("B&B")) {
      return { code: "CP", inclusionsText: "Breakfast Included" };
    }
  }

  // 2. Check pipe-delimited segments in description, roomDescription, inclusions, roomType, notes
  const textSources = [
    hotel.description,
    hotel.roomDescription,
    hotel.inclusions,
    hotel.roomType,
    hotel.notes,
  ].filter(Boolean);

  for (const source of textSources) {
    const segments = String(source).split("|").map((s) => s.trim().toUpperCase());
    for (const seg of segments) {
      if (seg === "EP" || seg === "ROOM ONLY" || seg === "ONLY ROOM" || seg === "NO MEALS" || seg === "NO MEAL") {
        return { code: "EP", inclusionsText: "Room Only" };
      }
      if (seg === "MAP" || seg === "HALF BOARD" || seg === "BREAKFAST & DINNER" || seg === "BREAKFAST AND DINNER" || seg === "BREAKFAST + DINNER") {
        return { code: "MAP", inclusionsText: "Breakfast & Dinner" };
      }
      if (seg === "AP" || seg === "FULL BOARD" || seg === "ALL MEALS" || seg === "ALL MEAL") {
        return { code: "AP", inclusionsText: "Breakfast, Lunch & Dinner" };
      }
      if (seg === "AI" || seg === "ALL INCLUSIVE") {
        return { code: "AI", inclusionsText: "All Inclusive" };
      }
      if (seg === "CP" || seg === "BREAKFAST INCLUDED" || seg === "BREAKFAST" || seg === "BED & BREAKFAST" || seg === "B&B") {
        return { code: "CP", inclusionsText: "Breakfast Included" };
      }
    }
  }

  // 3. Check regex word boundaries in description text
  const fullDesc = textSources.join(" ");
  if (/\b(EP|ROOM\s*ONLY|ONLY\s*ROOM|EUROPEAN\s*PLAN|NO\s*MEALS?)\b/i.test(fullDesc)) {
    return { code: "EP", inclusionsText: "Room Only" };
  }
  if (/\b(MAP|HALF\s*BOARD|BREAKFAST\s*(?:AND|&|\+)\s*DINNER)\b/i.test(fullDesc)) {
    return { code: "MAP", inclusionsText: "Breakfast & Dinner" };
  }
  if (/\b(AP|FULL\s*BOARD|ALL\s*MEALS?)\b/i.test(fullDesc)) {
    return { code: "AP", inclusionsText: "Breakfast, Lunch & Dinner" };
  }
  if (/\b(AI|ALL\s*INCLUSIVE)\b/i.test(fullDesc)) {
    return { code: "AI", inclusionsText: "All Inclusive" };
  }
  if (/\b(CP|BREAKFAST(?:\s*INCLUDED)?|BED\s*&\s*BREAKFAST)\b/i.test(fullDesc)) {
    return { code: "CP", inclusionsText: "Breakfast Included" };
  }

  return { code: "EP", inclusionsText: "Room Only" };
};

const getHotelParticulars = (service = {}, query = {}, quote = {}) => {
  const values = [];
  if (service.roomType || service.roomCategory) values.push(`Room: ${service.roomType || service.roomCategory}`);
  if (Number(service.rooms) > 0) values.push(`${service.rooms} room${Number(service.rooms) === 1 ? "" : "s"}`);

  const queryAdults = Number(query?.numberOfAdults ?? quote?.numberOfAdults ?? 0);
  const queryChildren = Number(query?.numberOfChildren ?? quote?.numberOfChildren ?? 0);
  const queryInfants = Number(query?.numberOfInfants ?? quote?.numberOfInfants ?? 0);

  const adults = Number(service.adults !== undefined && service.adults !== null ? service.adults : queryAdults);
  const children = Number(service.children !== undefined && service.children !== null ? service.children : queryChildren);
  const infants = Number(service.infants !== undefined && service.infants !== null ? service.infants : queryInfants);

  const guests = [
    adults > 0 ? `${adults} adult${adults === 1 ? "" : "s"}` : "",
    children > 0 ? `${children} child${children === 1 ? "" : "ren"}` : "",
    infants > 0 ? `${infants} infant${infants === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  if (guests.length) values.push(guests.join(", "));
  return values;
};

const getTransportParticulars = (service = {}, query = {}, quote = {}) => {
  const { paxLabel } = getServicePaxDetails(service, query, quote);
  const days = Number(service.days || 1);
  const daysStr = days > 0 ? `${days} day${days === 1 ? "" : "s"}` : "";
  const vehicleStr = service.vehicleType || service.vehicle || "";
  const usageLabel = service.transportUsageLabel || service.usageType || "";
  const passCap = Number(service.passengerCapacity || 0) > 0 ? `${service.passengerCapacity} passenger capacity` : "";
  const lugCap = Number(service.luggageCapacity || 0) > 0 ? `${service.luggageCapacity} luggage capacity` : "";

  return [
    usageLabel,
    paxLabel,
    daysStr,
    vehicleStr,
    passCap,
    lugCap,
  ].filter(Boolean).join(" • ") || "Particulars not specified";
};

const getPaxParticulars = (service = {}, query = {}, quote = {}) => {
  const { paxLabel } = getServicePaxDetails(service, query, quote);
  const days = Number(service.days || service.numberOfDays || 1);
  const daysStr = days > 0 ? `${days} day${days === 1 ? "" : "s"}` : "";
  const tourType = service.tourType || service.tour_type || "";
  const slot = service.selectedSlot || service.slot || service.time || "";

  return [
    paxLabel,
    daysStr,
    tourType,
    slot ? `Slot: ${slot}` : "",
  ].filter(Boolean).join(" • ") || "Particulars not specified";
};

function EmptyState({ label }) {
  return <div className="bg-white border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">No {label} found in this quotation.</div>;
}
function SectionHeader({ title }) {
  return <div className="flex items-center justify-between pt-0.5 pb-1"><h3 className="text-lg font-bold text-slate-900">{title}</h3></div>;
}

function ServiceTable({ title, emptyLabel, services, Icon, detailLabel, particulars, query, quote }) {
  return <section className="space-y-2.5">
    <SectionHeader title={title} />
    {services.length === 0 ? <EmptyState label={emptyLabel} /> : (
      <div className="bg-white border border-slate-200 overflow-x-auto shadow-2xs">
        <table className="w-full min-w-[760px] text-left text-xs sm:text-sm border-collapse">
          <thead><tr className="border-b border-slate-200 text-slate-900 font-bold text-xs">
            <th className="py-2.5 px-3.5 w-[24%] border-r border-slate-200">Service Name / Particulars</th>
            <th className="py-2.5 px-3.5 w-[26%] border-r border-slate-200">{detailLabel || "Route / Description"}</th>
            <th className="py-2.5 px-3.5 w-[20%] border-r border-slate-200">Service Date & Location</th>
            <th className="py-2.5 px-3.5 w-[18%] border-r border-slate-200">Particulars</th>
            <th className="py-2.5 px-3.5 w-[12%] text-end">Service Price</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {services.map((service, index) => {
              const serviceTotal = getServiceTotal(service, query, quote);
              const type = String(service.type || "").toLowerCase();
              const adultP = Number(service.adultPrice ?? service.adult_price ?? 0);
              const childP = Number(service.childPrice ?? service.child_price ?? 0);
              const { numAdults, numChildren } = getServicePaxDetails(service, query, quote);
              
              let breakdownSubtext = null;
              if (type === "activity" || type === "sightseeing") {
                if (adultP > 0 && childP > 0 && numChildren > 0) {
                  breakdownSubtext = `(₹${adultP.toLocaleString("en-IN")} × ${numAdults}A + ₹${childP.toLocaleString("en-IN")} × ${numChildren}C)`;
                } else if (adultP > 0 && numAdults > 1) {
                  breakdownSubtext = `(₹${adultP.toLocaleString("en-IN")} × ${numAdults} Adults)`;
                }
              }

              return (
                <tr key={service._id || service.serviceId || index} className="hover:bg-slate-50">
                  <td className="py-3.5 px-3.5 align-top border-r border-slate-200">
                    <div className="flex items-center gap-1.5 font-bold text-sky-600 text-sm">
                      {React.createElement(Icon, { size: 15 })}
                      <span>
                        {text(service.title || service.name, "Service not specified")}
                        {service.vehicleType ? <span className="font-semibold text-slate-600 text-xs ml-1.5">- {service.vehicleType}</span> : null}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Building2 size={12} className="text-slate-400 shrink-0" />
                      <span>Supplier: {getSupplier(service)}</span>
                    </p>
                  </td>
                  <td className="py-3.5 px-3.5 align-top border-r border-slate-200 text-xs text-slate-600 leading-relaxed">
                    {service.description ? <p className="text-slate-600 text-xs leading-relaxed">{service.description}</p> : <p className="text-slate-400">Details not specified</p>}
                  </td>
                  <td className="py-3.5 px-3.5 align-top border-r border-slate-200">
                    <p className="font-semibold text-slate-800 text-xs sm:text-sm">{formatDate(service.serviceDate)}</p>
                    <p className="text-slate-500 mt-1 text-xs flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span>{getLocation(service)}</span>
                    </p>
                  </td>
                  <td className="py-3.5 px-3.5 align-top border-r border-slate-200">
                    <p className="font-medium text-slate-800 text-xs leading-relaxed">{particulars(service, query, quote)}</p>
                  </td>
                  <td className="py-3.5 px-3.5 align-top text-end font-bold text-slate-900">
                    <div>{formatAmount(serviceTotal, service.currency)}</div>
                    {breakdownSubtext && (
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5 whitespace-nowrap">
                        {breakdownSubtext}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </section>;
}

export default function ServicesBookingsTab({ activeQuote = {}, query = {}, onGenerateVoucher }) {
  const [activeSubTab, setActiveSubTab] = useState("all");
  const quote = activeQuote && typeof activeQuote === "object" ? activeQuote : {};
  const queryObj = query && typeof query === "object" ? query : {};
  const services = Array.isArray(quote.services) ? quote.services.filter(Boolean) : [];
  const hotels = services.filter((service) => String(service.type).toLowerCase() === "hotel");
  const transports = services.filter((service) => TRANSPORT_TYPES.includes(String(service.type).toLowerCase()));
  const sightseeing = services.filter((service) => String(service.type).toLowerCase() === "sightseeing");
  const activities = services.filter((service) => String(service.type).toLowerCase() === "activity");
  const subTabs = [
    { id: "all", label: "All Services", count: services.length },
    { id: "hotels", label: "Hotels", count: hotels.length },
    { id: "transports", label: "Transports", count: transports.length },
    { id: "sightseeing", label: "Sightseeing", count: sightseeing.length },
    { id: "activities", label: "Activities", count: activities.length },
  ];
  const showAll = activeSubTab === "all";

  return (
    <div className="flex flex-col lg:flex-row items-stretch overflow-hidden font-sans bg-slate-100 border border-slate-200 shadow-2xs">
      <div className="w-full lg:w-40 shrink-0 bg-white border-r border-slate-200">
        <div className="flex lg:flex-col overflow-x-auto">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`min-w-max lg:min-w-0 w-full text-left px-4 py-3.5 text-sm transition-all flex items-center justify-between gap-3 ${
                activeSubTab === tab.id
                  ? "bg-slate-50 text-[#3E63DD] border-r-4 border-r-[#3E63DD] font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-xs text-slate-400">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-w-0 w-full px-5 pt-3 pb-8 space-y-6 bg-slate-100">
        {!services.length && showAll ? <EmptyState label="services" /> : null}
        {(showAll || activeSubTab === "hotels") && (hotels.length > 0 || activeSubTab === "hotels") && (
          <section className="space-y-2.5">
            <SectionHeader title="Hotel Bookings" />
            {hotels.length === 0 ? (
              <EmptyState label="hotel bookings" />
            ) : (
              <div className="bg-white border border-slate-200 overflow-x-auto shadow-2xs">
                <table className="w-full min-w-[780px] text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-900 font-bold text-xs">
                      <th className="py-2.5 px-3.5 w-[24%] border-r border-slate-200">Service Name / Hotel</th>
                      <th className="py-2.5 px-3.5 w-[24%] border-r border-slate-200">Meal / Description</th>
                      <th className="py-2.5 px-3.5 w-[16%] border-r border-slate-200 text-center">Category</th>
                      <th className="py-2.5 px-3.5 w-[24%] border-r border-slate-200">Service Date / Stay & Particulars</th>
                      <th className="py-2.5 px-3.5 w-[12%] text-end">Service Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {hotels.map((hotel, index) => {
                      const { dateStr, nightsStr } = formatHotelDateRange(hotel);
                      const { categoryText, starCount } = getHotelCategoryDisplay(hotel);
                      const mealInfo = resolveMealPlanDisplay(hotel);
                      const particulars = getHotelParticulars(hotel, queryObj, quote);
                      const rateBreakdown = getHotelRateBreakdown(hotel, queryObj, quote);
                      return (
                        <tr key={hotel._id || hotel.serviceId || index} className="hover:bg-slate-50">
                          <td className="py-3.5 px-3.5 align-top border-r border-slate-200">
                            <div className="flex items-center gap-1.5 font-bold text-sky-600 text-sm">
                              <BedDouble size={15} />
                              <span>{text(hotel.title || hotel.hotelName, "Hotel not specified")}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin size={12} className="text-slate-400 shrink-0" />
                              <span>{getLocation(hotel)}</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Building2 size={12} className="text-slate-400 shrink-0" />
                              <span>Supplier: {getSupplier(hotel)}</span>
                            </p>
                          </td>
                          <td className="py-3.5 px-3.5 align-top border-r border-slate-200 text-xs text-slate-600 leading-relaxed">
                            <div className="flex flex-wrap items-center gap-1.5 font-medium text-slate-900 mb-1">
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-1.5 py-0.5 rounded uppercase">
                                {mealInfo.code}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                <BsCheck2All className="text-emerald-600 text-xs shrink-0" />
                                <span>{mealInfo.inclusionsText}</span>
                              </span>
                            </div>
                            {hotel.description ? <p className="text-slate-600 text-xs leading-relaxed mt-1">{hotel.description}</p> : null}
                          </td>
                          <td className="py-3.5 px-3.5 align-top border-r border-slate-200 text-center">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <div className="flex items-center justify-center gap-0.5 text-amber-400">
                                {Array.from({ length: starCount }).map((_, i) => (
                                  <MdStarRate key={i} className="text-amber-400 text-sm sm:text-base shrink-0" />
                                ))}
                              </div>
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">{categoryText}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5 align-top border-r border-slate-200">
                            <div className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-800 text-xs sm:text-sm">
                              <span>{dateStr}</span>
                              <span className="inline-block text-[11px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 shrink-0">
                                {nightsStr}
                              </span>
                            </div>
                            {particulars.length ? (
                              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{particulars.join(" - ")}</p>
                            ) : (
                              <p className="text-xs text-slate-400 mt-1.5">Particulars not specified</p>
                            )}
                          </td>
                          <td className="py-3.5 px-3.5 align-top text-end font-bold text-slate-900 whitespace-nowrap">
                            <p className="text-sm sm:text-base font-bold text-slate-900">
                              <span className="text-[11px] text-slate-400 font-normal uppercase mr-1">INR</span>
                              {Math.round(rateBreakdown.itemPrice).toLocaleString("en-IN")}
                            </p>
                            {rateBreakdown.nightlyRateLabel && (
                              <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                                {rateBreakdown.nightlyRateLabel}
                              </p>
                            )}
                            {rateBreakdown.breakdownDetailLabel && (
                              <p className="text-[10px] font-normal text-slate-400 mt-0.5">
                                {rateBreakdown.breakdownDetailLabel}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
        {(showAll || activeSubTab === "transports") && (transports.length > 0 || activeSubTab === "transports") && (
          <ServiceTable
            title="Transport Services"
            emptyLabel="transport services"
            services={transports}
            Icon={Car}
            detailLabel="Route & Details"
            particulars={getTransportParticulars}
            query={queryObj}
            quote={quote}
          />
        )}
        {(showAll || activeSubTab === "sightseeing") && (sightseeing.length > 0 || activeSubTab === "sightseeing") && (
          <ServiceTable
            title="Sightseeing Tours"
            emptyLabel="sightseeing tours"
            services={sightseeing}
            Icon={Landmark}
            detailLabel="Itinerary & Details"
            particulars={getPaxParticulars}
            query={queryObj}
            quote={quote}
          />
        )}
        {(showAll || activeSubTab === "activities") && (activities.length > 0 || activeSubTab === "activities") && (
          <ServiceTable
            title="Activities & Experiences"
            emptyLabel="activities"
            services={activities}
            Icon={Target}
            detailLabel="Experience Details"
            particulars={getPaxParticulars}
            query={queryObj}
            quote={quote}
          />
        )}
      </div>
    </div>
  );
}
