import React, { useState } from "react";
import { BedDouble, Car, CheckCircle2, FileText, Landmark, MoreVertical, Target, MapPin, Building2 } from "lucide-react";
import { MdStarRate } from "react-icons/md";
import { BsCheck2All } from "react-icons/bs";

const TRANSPORT_TYPES = ["transfer", "car", "transport"];
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
    return `₹ INR ${amount.toLocaleString("en-IN")}`;
  }
  return `₹ ${currStr} ${amount.toLocaleString("en-IN")}`;
};
const getLocation = (service = {}) => [service.city, service.country].filter(Boolean).join(", ") || "Location not specified";
const getSupplier = (service = {}) => text(service.supplierName || service.dmcName, "Supplier not specified");
const getServiceTotal = (service = {}) => {
  const total = Number(service.total);
  if (Number.isFinite(total) && total !== 0) return total;
  const price = Number(service.price);
  if (!Number.isFinite(price)) return 0;
  if (String(service.type).toLowerCase() === "hotel" && service.hotelRateMode !== "service-total") {
    return price * Math.max(1, Number(service.nights) || 1) * Math.max(1, Number(service.rooms) || 1);
  }
  return price;
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
  const rawPlan = String(hotel.mealPlan || hotel.meals || hotel.meal_plan || "CP").trim();
  const upper = rawPlan.toUpperCase();

  let code = "CP";
  let inclusionsText = "Breakfast Included";

  if (upper.includes("MAP") || upper.includes("HALF BOARD")) {
    code = "MAP";
    inclusionsText = "Breakfast & Dinner";
  } else if (upper.includes("AP") || upper.includes("FULL BOARD")) {
    code = "AP";
    inclusionsText = "Breakfast, Lunch & Dinner";
  } else if (upper.includes("EP") || upper.includes("ONLY ROOM") || upper.includes("ROOM ONLY") || upper.includes("NO MEAL")) {
    code = "EP";
    inclusionsText = "Room Only";
  } else if (upper.includes("CP") || upper.includes("BREAKFAST")) {
    code = "CP";
    inclusionsText = "Breakfast Included";
  } else {
    code = rawPlan || "CP";
    inclusionsText = rawPlan;
  }

  return { code, inclusionsText };
};

const getHotelParticulars = (service = {}) => {
  const values = [];
  if (service.roomType || service.roomCategory) values.push(`Room: ${service.roomType || service.roomCategory}`);
  if (Number(service.rooms) > 0) values.push(`${service.rooms} room${Number(service.rooms) === 1 ? "" : "s"}`);
  const guests = [
    Number(service.adults) > 0 ? `${service.adults} adult${Number(service.adults) === 1 ? "" : "s"}` : "",
    Number(service.children) > 0 ? `${service.children} child${Number(service.children) === 1 ? "" : "ren"}` : "",
    Number(service.infants) > 0 ? `${service.infants} infant${Number(service.infants) === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  if (guests.length) values.push(guests.join(", "));
  return values;
};
const getTransportParticulars = (service = {}) => [
  service.transportUsageLabel || service.usageType,
  Number(service.days) > 0 ? `${service.days} day${Number(service.days) === 1 ? "" : "s"}` : "",
  Number(service.passengerCapacity) > 0 ? `${service.passengerCapacity} passenger capacity` : "",
  Number(service.luggageCapacity) > 0 ? `${service.luggageCapacity} luggage capacity` : "",
].filter(Boolean).join(" • ") || "Particulars not specified";
const getPaxParticulars = (service = {}) => [
  Number(service.pax) > 0 ? `${service.pax} pax` : "",
  Number(service.days) > 0 ? `${service.days} day${Number(service.days) === 1 ? "" : "s"}` : "",
].filter(Boolean).join(" • ") || "Particulars not specified";

function EmptyState({ label }) {
  return <div className="bg-white border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">No {label} found in this quotation.</div>;
}
function SectionHeader({ title }) {
  return <div className="flex items-center justify-between pt-0.5 pb-1"><h3 className="text-lg font-bold text-slate-900">{title}</h3></div>;
}

function ServiceTable({ title, emptyLabel, services, Icon, status, detailLabel, particulars, renderTitleExtra }) {
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
            {services.map((service, index) => <tr key={service._id || service.serviceId || index} className="hover:bg-slate-50">
              <td className="py-3.5 px-3.5 align-top border-r border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-sky-600 text-sm">
                  {React.createElement(Icon, { size: 15 })}
                  <span>
                    {text(service.title || service.name, "Service not specified")}
                    {service.vehicleType ? <span className="font-semibold text-slate-600 text-xs ml-1.5">- {service.vehicleType}</span> : null}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Building2 size={12} className="text-slate-400 shrink-0" /><span>Supplier: {getSupplier(service)}</span></p>
              </td>
              <td className="py-3.5 px-3.5 align-top border-r border-slate-200 text-xs text-slate-600 leading-relaxed">
                {service.description ? <p className="text-slate-600 text-xs leading-relaxed">{service.description}</p> : <p className="text-slate-400">Details not specified</p>}
              </td>
              <td className="py-3.5 px-3.5 align-top border-r border-slate-200">
                <p className="font-semibold text-slate-800 text-xs sm:text-sm">{formatDate(service.serviceDate)}</p>
                <p className="text-slate-500 mt-1 text-xs flex items-center gap-1"><MapPin size={12} className="text-slate-400 shrink-0" /><span>{getLocation(service)}</span></p>
              </td>
              <td className="py-3.5 px-3.5 align-top border-r border-slate-200">
                <p className="font-medium text-slate-800 text-xs leading-relaxed">{particulars(service)}</p>
              </td>
              <td className="py-3.5 px-3.5 align-top text-end font-bold text-slate-900">{formatAmount(getServiceTotal(service), service.currency)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    )}
  </section>;
}

export default function ServicesBookingsTab({ activeQuote = {}, onGenerateVoucher }) {
  const [activeSubTab, setActiveSubTab] = useState("all");
  // A recovered quotation can be temporarily null while its details are loading.
  // Normalize it once so every field access below remains safe during that state.
  const quote = activeQuote && typeof activeQuote === "object" ? activeQuote : {};
  const services = Array.isArray(quote.services) ? quote.services.filter(Boolean) : [];
  const hotels = services.filter((service) => String(service.type).toLowerCase() === "hotel");
  const transports = services.filter((service) => TRANSPORT_TYPES.includes(String(service.type).toLowerCase()));
  const sightseeing = services.filter((service) => String(service.type).toLowerCase() === "sightseeing");
  const activities = services.filter((service) => String(service.type).toLowerCase() === "activity");
  const subTabs = [
    { id: "all", label: "All Services", count: services.length }, { id: "hotels", label: "Hotels", count: hotels.length },
    { id: "transports", label: "Transports", count: transports.length }, { id: "sightseeing", label: "Sightseeing", count: sightseeing.length },
    { id: "activities", label: "Activities", count: activities.length },
  ];
  const showAll = activeSubTab === "all";
  const quoteStatus = text(quote.status, "Quotation created");

  return <div className="flex flex-col lg:flex-row items-stretch overflow-hidden font-sans bg-slate-100 border border-slate-200 shadow-2xs">
    <div className="w-full lg:w-40 shrink-0 bg-white border-r border-slate-200"><div className="flex lg:flex-col overflow-x-auto">
      {subTabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveSubTab(tab.id)} className={`min-w-max lg:min-w-0 w-full text-left px-4 py-3.5 text-sm transition-all flex items-center justify-between gap-3 ${activeSubTab === tab.id ? "bg-slate-50 text-[#3E63DD] border-r-4 border-r-[#3E63DD] font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"}`}><span>{tab.label}</span><span className="text-xs text-slate-400">{tab.count}</span></button>)}
    </div></div>
    <div className="flex-1 min-w-0 w-full px-5 pt-3 pb-8 space-y-6 bg-slate-100">
      {!services.length && showAll ? <EmptyState label="services" /> : null}
      {(showAll || activeSubTab === "hotels") && (hotels.length > 0 || activeSubTab === "hotels") && <section className="space-y-2.5">
        <SectionHeader title="Hotel Bookings" />
        {hotels.length === 0 ? <EmptyState label="hotel bookings" /> : <div className="bg-white border border-slate-200 overflow-x-auto shadow-2xs"><table className="w-full min-w-[780px] text-left text-xs sm:text-sm border-collapse">
          <thead><tr className="border-b border-slate-200 text-slate-900 font-bold text-xs"><th className="py-2.5 px-3.5 w-[24%] border-r border-slate-200">Service Name / Hotel</th><th className="py-2.5 px-3.5 w-[24%] border-r border-slate-200">Meal / Description</th><th className="py-2.5 px-3.5 w-[16%] border-r border-slate-200 text-center">Category</th><th className="py-2.5 px-3.5 w-[24%] border-r border-slate-200">Service Date / Stay & Particulars</th><th className="py-2.5 px-3.5 w-[12%] text-end">Service Price</th></tr></thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">{hotels.map((hotel, index) => {
            const { dateStr, nightsStr } = formatHotelDateRange(hotel);
            const { categoryText, starCount } = getHotelCategoryDisplay(hotel);
            const mealInfo = resolveMealPlanDisplay(hotel);
            const particulars = getHotelParticulars(hotel);
            return <tr key={hotel._id || hotel.serviceId || index} className="hover:bg-slate-50"><td className="py-3.5 px-3.5 align-top border-r border-slate-200"><div className="flex items-center gap-1.5 font-bold text-sky-600 text-sm"><BedDouble size={15} /><span>{text(hotel.title || hotel.hotelName, "Hotel not specified")}</span></div><p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={12} className="text-slate-400 shrink-0" /><span>{getLocation(hotel)}</span></p><p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Building2 size={12} className="text-slate-400 shrink-0" /><span>Supplier: {getSupplier(hotel)}</span></p></td><td className="py-3.5 px-3.5 align-top border-r border-slate-200 text-xs text-slate-600 leading-relaxed"><div className="flex flex-wrap items-center gap-1.5 font-medium text-slate-900 mb-1"><span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-1.5 py-0.5 rounded uppercase">{mealInfo.code}</span><span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><BsCheck2All className="text-emerald-600 text-xs shrink-0" /><span>{mealInfo.inclusionsText}</span></span></div>{hotel.description ? <p className="text-slate-600 text-xs leading-relaxed mt-1">{hotel.description}</p> : null}</td><td className="py-3.5 px-3.5 align-top border-r border-slate-200 text-center"><div className="flex flex-col items-center justify-center gap-1"><div className="flex items-center justify-center gap-0.5 text-amber-400">{Array.from({ length: starCount }).map((_, i) => <MdStarRate key={i} className="text-amber-400 text-sm sm:text-base shrink-0" />)}</div><span className="font-bold text-slate-900 text-xs sm:text-sm">{categoryText}</span></div></td><td className="py-3.5 px-3.5 align-top border-r border-slate-200"><div className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-800 text-xs sm:text-sm"><span>{dateStr}</span><span className="inline-block text-[11px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 shrink-0">{nightsStr}</span></div>{particulars.length ? <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{particulars.join(" - ")}</p> : <p className="text-xs text-slate-400 mt-1.5">Particulars not specified</p>}</td><td className="py-3.5 px-3.5 align-top text-end font-bold text-slate-900">{formatAmount(getServiceTotal(hotel), hotel.currency)}</td></tr>;
          })}</tbody>
        </table></div>}
      </section>}
      {(showAll || activeSubTab === "transports") && (transports.length > 0 || activeSubTab === "transports") && <ServiceTable title="Transport Services" emptyLabel="transport services" services={transports} Icon={Car} status={quoteStatus} detailLabel="Route & Details" particulars={getTransportParticulars} />}
      {(showAll || activeSubTab === "sightseeing") && (sightseeing.length > 0 || activeSubTab === "sightseeing") && <ServiceTable title="Sightseeing Tours" emptyLabel="sightseeing tours" services={sightseeing} Icon={Landmark} status={quoteStatus} detailLabel="Itinerary & Details" particulars={getPaxParticulars} />}
      {(showAll || activeSubTab === "activities") && (activities.length > 0 || activeSubTab === "activities") && <ServiceTable title="Activities & Experiences" emptyLabel="activities" services={activities} Icon={Target} status={quoteStatus} detailLabel="Experience Details" particulars={getPaxParticulars} />}
    </div>
  </div>;
}
