import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronDown, Clock } from "lucide-react";
import { ImLocation2 } from "react-icons/im";
import { IoStarSharp } from "react-icons/io5";
import { FaCarSide } from "react-icons/fa";
import { MdKingBed, MdOutlineTravelExplore } from "react-icons/md";
import { BsPeople } from "react-icons/bs";
import { HiOutlineBriefcase } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { LiaHotelSolid } from "react-icons/lia";
import AddonRow from "./AddonRow";
import {
  serviceCardVariants,
  normalizeCurrencyCode,
  getExchangeRateForCurrency,
  getHotelBaseRateDisplayValue,
  roundCurrencyAmount,
  calculateServiceOriginalTotal,
  convertAmountToInr,
  getHotelVariantOptions,
  getTransportVehicleOptions,
  getInferredHotelMaxOccupancy,
  normalizeServiceFilterType,
  getSelectedTransportUsageOptionKeys,
  getSelectedTransportUsageOptionLabels,
  getTransportUsageLimitOptionsForKeys,
  getSelectedTransportUsageLimitLabels,
  normalizeTransportUsageOptionKey,
  TRANSPORT_USAGE_OPTIONS,
  getTransportUsageOptionDisplayPrice,
  formatCurrencyValue,
  formatAmountValue,
  formatExchangeRateValue,
  formatRoomOccupancyLabel,
  getBedTypeOptionLabel,
  normalizeBedTypeValue,
} from "./utils";

/*=======================   ====== Select Contracted Rates =======================================*/

const Service = ({
  index = 0,
  service,
  cardDomId,
  isEditorFocused = false,
  isEditMode = false,
  exchangeRates,
  allServices,
  toggleService,
  updateField,
  deleteService,
  onStartServiceEdit,
  onOpenSelectedServices,
  tripNights,
  remainingHotelNights,
  hotelNightStart,
  tripStartDate,
  tripEndDate,
  totalPassengers = 0,
  adultPassengers = 0,
}) => {
  const isBlackoutService = Boolean(service?.blackout?.isBlackout);
  const blackoutLabel =
    service?.blackout?.label || service?.blackout?.reason || "Blackout date";
  const currencyCode = normalizeCurrencyCode(service.currency);
  const exchangeRate = getExchangeRateForCurrency(currencyCode, exchangeRates);
  const baseRateDisplayValue = getHotelBaseRateDisplayValue(service);
  const total =
    service.useStoredPricing && Number(service.originalTotal || 0) > 0
      ? roundCurrencyAmount(service.originalTotal)
      : calculateServiceOriginalTotal(service);
  const totalInInr =
    service.useStoredPricing && Number(service.totalInInr || 0) > 0
      ? roundCurrencyAmount(service.totalInInr)
      : convertAmountToInr(total, currencyCode, exchangeRates);
  const baseRateInInr = convertAmountToInr(
    baseRateDisplayValue,
    currencyCode,
    exchangeRates,
  );
  const isForeignCurrency = currencyCode !== "INR";

  const hotelVariantOptions = useMemo(
    () => getHotelVariantOptions(allServices, service),
    [allServices, service],
  );

  const transportVehicleOptions = useMemo(
    () =>
      service.type === "transfer" || service.type === "car"
        ? getTransportVehicleOptions(allServices, service)
        : [],
    [allServices, service],
  );

  const hotelOccupancy = useMemo(
    () =>
      service.type === "hotel"
        ? getInferredHotelMaxOccupancy(service, service)
        : {
            maxAdults: 2,
            maxChildren: 1,
            childAgeLimit: "As per hotel policy",
          },
    [service],
  );

  const getHotelStars = (category) => {
    if (!category) return 3;
    const value = category.toString().toLowerCase().trim();
    const match = value.match(/\d/);
    if (match) return Number(match[0]);
    if (value.includes("luxury") || value.includes("premium")) return 5;
    if (value.includes("deluxe")) return 4;
    if (value.includes("standard")) return 3;
    if (value.includes("budget")) return 2;
    return 3;
  };

  const formatUsage = (val) => {
    if (!val) return "";
    return val.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const rawAmenities = (service.desc || "")
    .split(/,|\||\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const isTransportService =
    normalizeServiceFilterType(service.type) === "transfer";
  const selectedTransportUsageKeys =
    getSelectedTransportUsageOptionKeys(service);
  const selectedTransportUsageLabels = isTransportService
    ? getSelectedTransportUsageOptionLabels(service)
    : [];
  const selectedTransportUsageLimitOptions =
    getTransportUsageLimitOptionsForKeys(selectedTransportUsageKeys);
  const selectedTransportUsageLimitLabels = isTransportService
    ? getSelectedTransportUsageLimitLabels(
        service,
        selectedTransportUsageLimitOptions,
      )
    : [];
  const selectedTransportUsageKey =
    selectedTransportUsageKeys[0] || "one-way-airport-transfer";
  const selectedTransportLimitSummary =
    selectedTransportUsageLimitLabels[0] || "";
  const selectedTransportExtraKmRate =
    selectedTransportUsageKey === "full-day"
      ? Number(service.fullDayExtraPerKmRate || service.extraPerKmRate || 0)
      : selectedTransportUsageKey === "half-day"
        ? Number(service.halfDayExtraPerKmRate || service.extraPerKmRate || 0)
        : 0;
  const selectedTransportLimitNoteLabel =
    selectedTransportUsageKey === "full-day"
      ? "Full Day"
      : selectedTransportUsageKey === "half-day"
        ? "Half Day"
        : "";
  const amenities = isTransportService
    ? [
        ...rawAmenities.filter(
          (item) => !normalizeTransportUsageOptionKey(item),
        ),
        ...selectedTransportUsageLabels,
        ...selectedTransportUsageLimitLabels,
      ]
    : rawAmenities;

  /* ── shared micro-styles ── */
  const selectCls =
    "bg-white border border-gray-300 hover:border-[#3E63DD] text-slate-900 text-[11px] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer transition-colors focus:border-[#3E63DD] shadow-2xs font-medium";

  const inputCls =
    "bg-white border border-gray-300 hover:border-[#3E63DD] text-slate-900 text-[11px] rounded-lg px-2.5 py-1.5 w-20 outline-none transition-colors focus:border-[#3E63DD] shadow-2xs font-semibold";

  const dateCls =
    "w-full bg-white border border-gray-300 hover:border-[#3E63DD] text-slate-900 text-[11px] rounded-lg px-3 py-2 pr-9 outline-none transition-colors focus:border-[#3E63DD] shadow-2xs font-semibold [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

  const openDatePicker = (event) => {
    const input = event.currentTarget
      ?.closest?.("[data-date-picker-wrapper='true']")
      ?.querySelector?.("input[type='date']");

    if (!input) return;

    input.focus();
    input.showPicker?.();
    input.click();
  };

  const formatServiceDuration = (serv = {}, tourObj = {}) => {
    let dur = serv.duration || tourObj.duration || "";

    if (!dur) {
      const descText = `${tourObj.description || ""} ${serv.description || ""} ${serv.desc || ""}`;
      const minMatch = descText.match(/(\d+)\s*(?:mins?|minutes?)/i);
      const hrMatch = descText.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
      if (minMatch) {
        dur = minMatch[1];
      } else if (hrMatch) {
        dur = Math.round(parseFloat(hrMatch[1]) * 60);
      }
    }

    if (!dur) dur = "60";

    const num = Number(String(dur).replace(/[^\d.]/g, ""));
    if (!isNaN(num) && num > 0) {
      return `${num} Mins`;
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
      return list.length > 0
        ? list
        : ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
    };

    if (!rawSlots) {
      return generateRangeSlots(openTime, closeTime);
    }

    const parsed = rawSlots
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);

    // If exactly 2 slots matching open and close or "08:00, 18:00" -> treat as range
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

  /* helpers for transport */
  const calculateTripDayCountFromDate = (startDate, endDate) => {
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s) || isNaN(e)) return 1;
    return Math.max(1, Math.ceil((e - s) / 86400000));
  };

  const addDaysToServiceDate = (value, daysToAdd = 0) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return "";
    d.setDate(d.getDate() + Number(daysToAdd));
    return d.toISOString().slice(0, 10);
  };

  const formatDisplayDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return value;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const transportStartDate = service.serviceDate || tripStartDate || "";
  const maxTransportDays = Math.max(
    1,
    calculateTripDayCountFromDate(transportStartDate, tripEndDate),
  );
  const selectedTransportDays = Math.min(
    Math.max(Number(service.days || 1), 1),
    maxTransportDays,
  );
  const transportEndDate =
    transportStartDate && selectedTransportDays > 0
      ? addDaysToServiceDate(transportStartDate, selectedTransportDays - 1)
      : "";
  const transportDateOptions = useMemo(() => {
    if (!tripStartDate) return transportStartDate ? [transportStartDate] : [];

    const availableDateCount = Math.max(
      1,
      calculateTripDayCountFromDate(tripStartDate, tripEndDate),
    );
    return Array.from({ length: availableDateCount }, (_, index) =>
      addDaysToServiceDate(tripStartDate, index),
    ).filter(Boolean);
  }, [tripEndDate, tripStartDate, transportStartDate]);

  const getNightOptionLabel = (count) => {
    const startNight = Number(hotelNightStart || 1);
    const totalTripNights = Number(tripNights || 0);
    const endNight = totalTripNights
      ? Math.min(totalTripNights, startNight + count - 1)
      : startNight + count - 1;
    if (!totalTripNights) return `${count} Night${count > 1 ? "s" : ""}`;
    const slotLabel =
      count === 1 || startNight === endNight
        ? `Night ${startNight}`
        : `Night ${startNight}–${endNight}`;
    return `${count} Night${count > 1 ? "s" : ""} (${slotLabel})`;
  };

  const selectedNightCount = Number(service.nights || 0);
  const selectedNightEnd =
    selectedNightCount > 0
      ? Math.min(
          Number(tripNights || 0),
          Number(hotelNightStart || 1) + selectedNightCount - 1,
        )
      : 0;

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <motion.div
      id={cardDomId}
      custom={index}
      initial="hidden"
      animate="visible"
      variants={serviceCardVariants}
      className={`scroll-mt-28 mb-3 rounded-2xl border transition-all duration-200 text-slate-900
        ${isEditorFocused ? "ring-2 ring-sky-500 ring-offset-2 ring-offset-slate-50" : ""}
        ${
          service.checked
            ? "border-amber-400 bg-amber-50/40 shadow-xs"
            : "border-gray-200 bg-white hover:border-gray-300 shadow-2xs"
        }`}
    >
      {/* ── TOP ACCENT ── */}

      {/* ════════════════════════════════════════════
          SECTION 1 — HEADER  (identity + status)
      ════════════════════════════════════════════ */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 p-4 pb-3">
        <input
          type="checkbox"
          checked={service.checked}
          onChange={() => toggleService(service.id)}
          className="h-4 w-4 rounded border-gray-300 text-[#3E63DD] focus:ring-[#3E63DD] mt-1 shrink-0 cursor-pointer"
        />

        <div className="min-w-0">
          <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-3 gap-y-2">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg shadow-2xs
              ${service.checked ? "border-amber-300 bg-amber-100" : "border-gray-200 bg-slate-50"}`}
            >
              <span className={service.color || "text-gray-600"}>
                {service.icon || "Hotel"}
              </span>
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 text-sm font-semibold leading-tight text-slate-900">
                  {service.serviceName || service.title || service.hotelName}
                </p>

                <div className="inline-flex shrink-0 items-center gap-2">
                  {service.checked ? (
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-800">
                      Added to Quote
                    </span>
                  ) : (
                    <span className="rounded-full border border-gray-200 bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      Not Selected
                    </span>
                  )}

                  {service.checked && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditMode) {
                          onOpenSelectedServices?.(service);
                          return;
                        }

                        onStartServiceEdit?.(service);
                      }}
                      className="inline-flex h-[22px] cursor-pointer items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-[10px] font-semibold text-blue-700 transition hover:bg-blue-100 shadow-2xs"
                    >
                      {isEditMode ? "Review & Save" : "Click to Edit"}
                    </button>
                  )}
                </div>

                {isEditMode && service.checked && (
                  <span className="rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sky-800">
                    Editing
                  </span>
                )}
                {service.custom && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Custom
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  <ImLocation2 className="text-emerald-600" />
                  {[service.city, service.country].filter(Boolean).join(", ")}
                </span>
                {service.type === "hotel" && (
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="text-slate-400 font-normal">Hotel:</span>
                    {Array.isArray(service.hotels) &&
                    service.hotels.length > 1 ? (
                      <div className="relative inline-flex items-center">
                        <select
                          value={
                            service.hotelName ||
                            (service.hotels[0] &&
                              service.hotels[0].hotelName) ||
                            ""
                          }
                          onChange={(e) => {
                            updateField(
                              service.id,
                              "hotelName",
                              e.target.value,
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="appearance-none bg-white hover:bg-gray-50 border border-gray-300 text-slate-900 font-semibold text-xs rounded-lg pl-2 pr-6 py-0.5 outline-none cursor-pointer transition-all focus:border-[#3E63DD] shadow-2xs"
                        >
                          {(service.hotels || []).map((h, hIdx) => (
                            <option
                              key={h._id || hIdx}
                              value={h.hotelName}
                              className="bg-white text-slate-900"
                            >
                              {h.hotelName}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="absolute right-1.5 text-gray-500 pointer-events-none"
                          size={12}
                        />
                      </div>
                    ) : (
                      <span className="text-slate-900 font-semibold">
                        {service.hotelName}
                      </span>
                    )}
                  </span>
                )}
                {service.type !== "hotel" && service.hotelName && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="text-slate-400 font-normal">Hotel:</span>
                    <span className="text-slate-900 font-semibold">
                      {service.hotelName}
                    </span>
                  </span>
                )}
                {service.hotelCategory && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="text-slate-700 font-medium">Hotel</span>
                    <span className="flex items-center gap-0.5 ml-0.5">
                      {Array.from({
                        length: getHotelStars(service.hotelCategory),
                      }).map((_, i) => (
                        <IoStarSharp
                          key={i}
                          className="text-amber-500 text-[10px]"
                        />
                      ))}
                    </span>
                  </span>
                )}
                {service.type === "transfer" && (
                  <>
                    {service.vehicleType && (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <FaCarSide className="text-amber-600" />
                        {service.vehicleType}
                      </span>
                    )}
                    {(selectedTransportUsageLabels[0] || service.usageType) && (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <MdOutlineTravelExplore className="text-blue-600" />
                        {selectedTransportUsageLabels[0] ||
                          formatUsage(service.usageType)}
                      </span>
                    )}
                    {Number(service.passengerCapacity || 0) > 0 && (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <BsPeople className="text-emerald-600" />
                        {service.passengerCapacity} Pax
                      </span>
                    )}
                    {Number(service.luggageCapacity || 0) > 0 && (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <HiOutlineBriefcase className="text-sky-600" />
                        {service.luggageCapacity} Bags
                      </span>
                    )}
                    {(service.pickupTime || service.time) && (
                      <span className="flex items-center gap-1 text-amber-700 font-semibold">
                        <Clock size={11} className="text-amber-600" />
                        {service.pickupTime || service.time}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {service.checked && (
          <div className="ml-2 flex shrink-0 flex-col items-end text-right">
            <div>
              <p className="mb-1 text-[9px] uppercase tracking-widest text-slate-500 font-semibold">
                Total
              </p>
              <p className="text-[15px] font-bold leading-none text-slate-900">
                {formatCurrencyValue(total, currencyCode)}
              </p>
              {service.pricingTier && (
                <p
                  className={`mt-1 text-[10px] font-semibold leading-none ${
                    service.pricingTier.includes("Blackout")
                      ? "text-rose-600 font-bold"
                      : service.pricingTier.includes("S1") ||
                          service.pricingTier.includes("S2")
                        ? "text-emerald-700"
                        : "text-slate-500"
                  }`}
                >
                  / {service.pricingTier}
                </p>
              )}
              {isForeignCurrency && (
                <p className="mt-1 text-[10px] text-sky-700 font-semibold">
                  INR {formatAmountValue(totalInInr)}
                </p>
              )}
            </div>
          </div>
        )}

        {amenities.length > 0 && (
          <div className="col-start-2 col-span-2 flex w-full flex-wrap justify-start gap-x-1 gap-y-1.5">
            {amenities.map((item, i) => (
              <span
                key={i}
                className="whitespace-nowrap rounded-md border border-gray-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════
          SECTION 3 — SERVICE CONTROLS
          (only shown when service is checked)
      ════════════════════════════════════════════ */}
      {service.checked && (
        <div className="space-y-3 border-t border-gray-200 bg-slate-50 px-4 py-4 rounded-b-2xl">
          {/* ── label row ── */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
              Configuration
            </p>
            {service.custom && (
              <button
                onClick={() => deleteService(service.id)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-red-100 shadow-2xs cursor-pointer"
              >
                <RiDeleteBin6Line className="text-[11px]" /> Remove
              </button>
            )}
          </div>

          {/* ── BASE RATE ── */}
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)]">
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-2xs">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1">
                Base Rate
              </p>
              {isEditMode ? (
                <input
                  type="number"
                  min="0"
                  value={baseRateDisplayValue || ""}
                  onChange={(event) =>
                    updateField(
                      service.id,
                      "rate",
                      roundCurrencyAmount(event.target.value),
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[13px] font-bold text-amber-900 outline-none transition-colors focus:border-amber-500"
                />
              ) : (
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <p className="text-[13px] font-bold text-amber-700">
                    {formatCurrencyValue(
                      baseRateDisplayValue || 0,
                      currencyCode,
                    )}
                  </p>
                  {service.pricingTier && (
                    <span className="text-[10px] text-slate-500 font-normal">
                      / {service.pricingTier}
                    </span>
                  )}
                </div>
              )}
              {isForeignCurrency && (
                <>
                  <p className="text-[10px] text-sky-700 font-semibold mt-0.5">
                    ₹ {formatAmountValue(baseRateInInr)}
                  </p>
                  <div className="mt-2 inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] text-slate-700">
                    1 {currencyCode} ={" "}
                    <span className="ml-1 font-semibold text-sky-800">
                      ₹ {formatExchangeRateValue(exchangeRate)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-2xs">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
                Service Date
              </p>
              <div className="relative" data-date-picker-wrapper="true">
                <input
                  type="date"
                  value={service.serviceDate || ""}
                  onChange={(e) =>
                    updateField(service.id, "serviceDate", e.target.value)
                  }
                  min={tripStartDate || undefined}
                  max={
                    transportDateOptions[transportDateOptions.length - 1] ||
                    tripEndDate ||
                    undefined
                  }
                  tabIndex={-1}
                  className={`${dateCls} pointer-events-none w-full`}
                />
                <button
                  type="button"
                  onClick={openDatePicker}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                  aria-label="Open service date picker"
                >
                  <CalendarDays size={14} />
                </button>
              </div>
            </div>

            {isForeignCurrency && (
              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 flex items-center shadow-2xs">
                <p className="text-[11px] text-slate-700 font-medium">
                  1 {currencyCode} ={" "}
                  <span className="text-sky-700 font-bold">
                    ₹ {formatExchangeRateValue(exchangeRate)}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* ── HOTEL: NIGHTS ── */}
          {service.type === "hotel" && (
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 space-y-2.5 shadow-2xs">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Nights
              </p>

              {/* availability info */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-semibold">
                <span className="text-[10px] text-emerald-700">
                  {remainingHotelNights} of {tripNights} nights available
                </span>
                {tripNights > 0 && hotelNightStart > 0 && (
                  <span className="text-[10px] text-amber-700">
                    Slot: Night {hotelNightStart}
                    {remainingHotelNights > 1
                      ? `–${Math.min(tripNights, hotelNightStart + remainingHotelNights - 1)}`
                      : ""}
                  </span>
                )}
                {selectedNightCount > 0 &&
                  selectedNightEnd >= hotelNightStart && (
                    <span className="text-[10px] text-sky-700">
                      Assigned: Night {hotelNightStart}
                      {selectedNightEnd > hotelNightStart
                        ? `–${selectedNightEnd}`
                        : ""}
                    </span>
                  )}
              </div>

              <select
                value={service.nights || ""}
                onChange={(e) =>
                  updateField(service.id, "nights", e.target.value)
                }
                className={`${selectCls} w-full max-w-[260px]`}
              >
                <option value="">Select nights</option>
                {[...Array(Math.max(remainingHotelNights, 1))].map((_, i) => (
                  <option key={i} value={i + 1}>
                    {getNightOptionLabel(i + 1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── TRANSFER: USAGE + DAYS ── */}
          {(service.type === "transfer" || service.type === "car") && (
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 space-y-2.5 shadow-2xs">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Transfer Setup
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 font-semibold">
                {transportStartDate && (
                  <span className="text-[10px] text-emerald-700">
                    Up to {maxTransportDays} day
                    {maxTransportDays > 1 ? "s" : ""} from selected date
                  </span>
                )}
                {transportStartDate && transportEndDate && (
                  <span className="text-[10px] text-sky-700">
                    {transportStartDate === transportEndDate
                      ? formatDisplayDate(transportStartDate)
                      : `${formatDisplayDate(transportStartDate)} → ${formatDisplayDate(transportEndDate)}`}
                  </span>
                )}
              </div>

              {transportDateOptions.length > 1 && (
                <div>
                  <p className="mb-1.5 text-[9px] font-semibold text-slate-500">
                    Start Day
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {transportDateOptions.map((dateValue) => {
                      const isActive = dateValue === transportStartDate;
                      return (
                        <button
                          key={dateValue}
                          type="button"
                          onClick={() =>
                            updateField(service.id, "serviceDate", dateValue)
                          }
                          className={`cursor-pointer rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${
                            isActive
                              ? "border-amber-400 bg-amber-50 text-amber-900 shadow-2xs"
                              : "border-gray-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {formatDisplayDate(dateValue)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">
                    Choose any trip day first, then select `1 Day`, `2 Days`, or
                    more from that date.
                  </p>
                </div>
              )}

              {/* Vehicle Specifications & Notes (Shown above dropdowns) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  {service.vehicleType && (
                    <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-700 font-medium">
                      <FaCarSide className="text-amber-600" />
                      <span className="text-slate-500">Vehicle:</span>{" "}
                      {service.vehicleType}
                    </span>
                  )}
                  {Number(service.passengerCapacity || 0) > 0 && (
                    <span
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold ${
                        totalPassengers > Number(service.passengerCapacity || 0)
                          ? "border-red-300 bg-red-50 text-red-800"
                          : "border-gray-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <BsPeople
                        className={
                          totalPassengers >
                          Number(service.passengerCapacity || 0)
                            ? "text-red-600"
                            : "text-emerald-600"
                        }
                      />
                      <span
                        className={
                          totalPassengers >
                          Number(service.passengerCapacity || 0)
                            ? "text-red-600"
                            : "text-slate-500"
                        }
                      >
                        Capacity:
                      </span>{" "}
                      {service.passengerCapacity} Pax
                      {totalPassengers >
                        Number(service.passengerCapacity || 0) && (
                        <span className="text-[9px] text-red-600 font-normal">
                          ({totalPassengers} Pax Query - Insufficient)
                        </span>
                      )}
                    </span>
                  )}
                  {Number(service.luggageCapacity || 0) > 0 && (
                    <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-700 font-medium">
                      <HiOutlineBriefcase className="text-blue-600" />
                      <span className="text-slate-500">Luggage:</span>{" "}
                      {service.luggageCapacity} Bags
                    </span>
                  )}
                  {totalPassengers > 0 &&
                    totalPassengers <= 4 &&
                    Number(service.passengerCapacity || 0) >= 6 && (
                      <span className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] text-amber-900 font-semibold">
                        💡{" "}
                        <span>
                          Suggestion: For {totalPassengers} Pax, a <b>Sedan</b>{" "}
                          (3–4 Pax, 2–3 Bags) is more economical.
                        </span>
                      </span>
                    )}
                  {service.description && (
                    <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-700 font-medium">
                      <span className="text-slate-500">Info:</span>{" "}
                      {service.description}
                    </span>
                  )}
                </div>

                {/* Pickup / Transfer Time Selection on Top Right */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                    <Clock size={12} className="text-amber-600" />
                    Pickup Time:
                  </span>
                  <div className="relative flex items-center">
                    <input
                      type="time"
                      value={service.pickupTime || service.time || ""}
                      onChange={(e) => {
                        updateField(service.id, "pickupTime", e.target.value);
                        updateField(service.id, "time", e.target.value);
                      }}
                      className="h-7 rounded-lg border border-gray-300 bg-white px-2 text-[11px] font-semibold text-slate-900 outline-none focus:border-[#3E63DD] transition cursor-pointer shadow-2xs"
                    />
                    {(service.pickupTime || service.time) && (
                      <button
                        type="button"
                        onClick={() => {
                          updateField(service.id, "pickupTime", "");
                          updateField(service.id, "time", "");
                        }}
                        title="Clear time"
                        className="ml-1 text-slate-400 hover:text-red-600 transition cursor-pointer text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`grid grid-cols-1 gap-3 ${selectedTransportUsageLimitOptions.length > 0 ? "lg:grid-cols-4 md:grid-cols-2" : "lg:grid-cols-3 md:grid-cols-2"}`}
              >
                <div>
                  <p className="text-[9px] font-semibold text-slate-500 mb-1">
                    Vehicle Type
                  </p>
                  <div className="relative">
                    <select
                      value={
                        service.vehicleType ||
                        transportVehicleOptions[0]?.value ||
                        ""
                      }
                      onChange={(e) =>
                        updateField(service.id, "vehicleType", e.target.value)
                      }
                      className={`${selectCls.replace("rounded-lg", "rounded-full")} h-8 w-full pl-4 pr-8 appearance-none`}
                    >
                      {transportVehicleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-slate-500 mb-1">
                    Days
                  </p>
                  <div className="relative">
                    <select
                      value={selectedTransportDays}
                      onChange={(e) =>
                        updateField(service.id, "days", Number(e.target.value))
                      }
                      className={`${selectCls.replace("rounded-lg", "rounded-full")} h-8 w-full pl-4 pr-8 appearance-none`}
                    >
                      {[...Array(maxTransportDays)].map((_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1} Day{i > 0 ? "s" : ""}
                          {transportStartDate
                            ? ` (${formatDisplayDate(transportStartDate)}${i > 0 ? ` → ${formatDisplayDate(addDaysToServiceDate(transportStartDate, i))}` : ""})`
                            : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-slate-500 mb-1">
                    Usage
                  </p>
                  <div className="relative">
                    <select
                      value={selectedTransportUsageKey}
                      onChange={(e) =>
                        updateField(
                          service.id,
                          "transportUsageOptionKey",
                          e.target.value,
                        )
                      }
                      className={`${selectCls.replace("rounded-lg", "rounded-full")} h-8 w-full pl-4 pr-8 appearance-none`}
                    >
                      {TRANSPORT_USAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {`${option.label} (${formatCurrencyValue(
                            getTransportUsageOptionDisplayPrice(
                              service,
                              option.value,
                            ),
                            currencyCode,
                          )})`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                    />
                  </div>
                </div>
                {selectedTransportUsageLimitOptions.length > 0 && (
                  <div>
                    <p className="text-[9px] font-semibold text-slate-500 mb-1">
                      Limit
                    </p>
                    <div className="flex h-8 w-full items-center rounded-full border border-amber-300 bg-amber-50 px-4 text-[11px] font-semibold text-amber-900 shadow-2xs">
                      {selectedTransportLimitSummary}
                    </div>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {(selectedTransportLimitNoteLabel ||
                  service.fullDayNote ||
                  service.halfDayNote) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1 text-[11px] italic font-semibold text-amber-800">
                      {selectedTransportExtraKmRate > 0 && (
                        <p>
                          Extra km rate:{" "}
                          {formatCurrencyValue(
                            selectedTransportExtraKmRate,
                            currencyCode,
                          )}
                          /km.
                        </p>
                      )}
                      {selectedTransportUsageKey === "full-day" &&
                        service.fullDayNote && (
                          <p>Note (Full Day): {service.fullDayNote}</p>
                        )}
                      {selectedTransportUsageKey === "half-day" &&
                        service.halfDayNote && (
                          <p>Note (Half Day): {service.halfDayNote}</p>
                        )}
                      {selectedTransportLimitNoteLabel &&
                        !service.fullDayNote &&
                        !service.halfDayNote && (
                          <p>
                            Note: {selectedTransportLimitNoteLabel} limit
                            selected as {selectedTransportLimitSummary}. Extra
                            km will attract extra charges where applicable.
                          </p>
                        )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── ACTIVITY: TOUR TYPE + TIMINGS + ADULT PRICE + CHILD PRICE + DATE + ADULTS + CHILDREN + SLOT + TOTAL ── */}
          {service.type === "activity" &&
            (() => {
              const tourTypesList =
                Array.isArray(service.tourTypes) && service.tourTypes.length > 0
                  ? service.tourTypes
                  : [
                      {
                        tourType: "Sharing Tour",
                        adultPrice:
                          service.adultPrice ||
                          service.price ||
                          service.rate ||
                          0,
                        childPrice: service.childPrice || 0,
                      },
                      {
                        tourType: "Private Tour",
                        adultPrice:
                          service.adultPrice ||
                          service.price ||
                          service.rate ||
                          0,
                        childPrice: service.childPrice || 0,
                      },
                      {
                        tourType: "Ticket Tour",
                        adultPrice:
                          service.adultPrice ||
                          service.price ||
                          service.rate ||
                          0,
                        childPrice: service.childPrice || 0,
                      },
                    ];
              const currentTourType =
                service.tourType ||
                tourTypesList[0]?.tourType ||
                "Sharing Tour";
              const currentTourObj =
                tourTypesList.find(
                  (t) =>
                    String(t.tourType || "")
                      .trim()
                      .toLowerCase() ===
                    String(currentTourType || "")
                      .trim()
                      .toLowerCase(),
                ) ||
                tourTypesList[0] ||
                {};
              const availableSlots = resolveSlotOptions(service);
              const resolvedDuration = formatServiceDuration(
                service,
                currentTourObj,
              );

              return (
                <div className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-3 shadow-2xs text-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">
                        Activity Configuration
                      </p>
                    </div>

                    {/* Tour Type Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-500">
                        Tour Type:
                      </span>
                      <div className="relative">
                        <select
                          value={currentTourType}
                          onChange={(e) =>
                            updateField(service.id, "tourType", e.target.value)
                          }
                          className={`${selectCls.replace("rounded-lg", "rounded-full")} h-7.5 pl-3 pr-8 text-[11px] font-semibold appearance-none bg-white border border-gray-300 text-slate-900 hover:border-[#3E63DD] cursor-pointer shadow-2xs`}
                        >
                          {tourTypesList.map((t, idx) => (
                            <option
                              key={t._id || idx}
                              value={t.tourType}
                              className="bg-white text-slate-900 font-medium"
                            >
                              {t.tourType}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={13}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Info Pills: Operating Days | Open / Close | Duration */}
                  <div className="flex flex-wrap items-center gap-2">
                    {service.operatingDays && (
                      <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        <span className="text-slate-500">Days:</span>{" "}
                        {service.operatingDays}
                      </span>
                    )}
                    {(service.openingTime || service.closingTime) && (
                      <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        <Clock size={11} className="text-amber-600" />
                        <span className="text-slate-500">
                          Open / Close:
                        </span>{" "}
                        {service.openingTime || "08:00"} /{" "}
                        {service.closingTime || "18:00"}
                      </span>
                    )}
                    {resolvedDuration && (
                      <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        <Clock size={11} className="text-purple-600" />
                        <span className="text-slate-500">Duration:</span>{" "}
                        {resolvedDuration}
                      </span>
                    )}
                  </div>

                  {/* Description shifted to the top */}
                  {(currentTourObj.description ||
                    service.description ||
                    service.desc) && (
                    <p className="text-[10.5px] text-slate-500 font-normal italic leading-relaxed pt-0.5 border-t border-gray-100">
                      {currentTourObj.description ||
                        service.description ||
                        service.desc}
                    </p>
                  )}

                  {/* Configuration Grid: Adult Price | Child Price | Adults | Children | Slot | Total */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-0.5">
                    {/* 1. Adult Price */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Adult Price
                      </p>
                      {isEditMode ? (
                        <input
                          type="number"
                          value={
                            service.adultPrice !== undefined
                              ? service.adultPrice
                              : service.rate
                          }
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateField(service.id, "adultPrice", val);
                            updateField(service.id, "rate", val);
                          }}
                          className={`${inputCls} h-8 text-[11px] font-bold w-full`}
                        />
                      ) : (
                        <div className="flex h-8 w-full items-center rounded-lg border border-gray-200 bg-slate-50 px-2.5 text-[11px] font-bold text-slate-900">
                          {formatCurrencyValue(
                            service.adultPrice !== undefined
                              ? service.adultPrice
                              : service.rate,
                            currencyCode,
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. Child Price */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Child Price
                      </p>
                      {isEditMode ? (
                        <input
                          type="number"
                          value={service.childPrice || 0}
                          onChange={(e) =>
                            updateField(
                              service.id,
                              "childPrice",
                              Number(e.target.value),
                            )
                          }
                          className={`${inputCls} h-8 text-[11px] font-bold w-full`}
                        />
                      ) : (
                        <div className="flex h-8 w-full items-center rounded-lg border border-gray-200 bg-slate-50 px-2.5 text-[11px] font-bold text-slate-900">
                          {formatCurrencyValue(
                            service.childPrice || 0,
                            currencyCode,
                          )}
                        </div>
                      )}
                    </div>

                    {/* 3. Adults */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Adults
                      </p>
                      <input
                        type="number"
                        min={1}
                        value={
                          service.adults !== undefined
                            ? service.adults
                            : service.pax || 1
                        }
                        onChange={(e) => {
                          const num = Math.max(1, Number(e.target.value) || 1);
                          updateField(service.id, "adults", num);
                          updateField(
                            service.id,
                            "pax",
                            num + Number(service.children || 0),
                          );
                        }}
                        className={`${inputCls} h-8 text-[11px] font-bold w-full`}
                      />
                    </div>

                    {/* 4. Children */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Children
                      </p>
                      <input
                        type="number"
                        min={0}
                        value={
                          service.children !== undefined ? service.children : 0
                        }
                        onChange={(e) => {
                          const num = Math.max(0, Number(e.target.value) || 0);
                          updateField(service.id, "children", num);
                          updateField(
                            service.id,
                            "pax",
                            Number(service.adults || service.pax || 1) + num,
                          );
                        }}
                        className={`${inputCls} h-8 text-[11px] font-bold w-full`}
                      />
                    </div>

                    {/* 5. Slot / Time */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Slot / Time
                      </p>
                      <div className="relative">
                        <select
                          value={
                            service.selectedSlot || availableSlots[0] || "08:00"
                          }
                          onChange={(e) =>
                            updateField(
                              service.id,
                              "selectedSlot",
                              e.target.value,
                            )
                          }
                          className={`${selectCls.replace("rounded-lg", "rounded-md")} h-8 text-[11px] font-semibold w-full pl-2 pr-6 appearance-none bg-white border border-gray-300 text-slate-900 cursor-pointer focus:border-[#3E63DD]`}
                        >
                          <option value="" disabled>
                            Select Time
                          </option>
                          {availableSlots.map((slot, sIdx) => (
                            <option
                              key={sIdx}
                              value={slot}
                              className="bg-white text-slate-900 font-medium"
                            >
                              {slot}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={12}
                          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
                        />
                      </div>
                    </div>

                    {/* 6. Total (Calculated) */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Total
                      </p>
                      <div className="flex h-8 w-full items-center rounded-lg border border-gray-200 bg-slate-100 px-2.5 text-[11.5px] font-bold text-slate-900">
                        {formatCurrencyValue(total, currencyCode)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* ── SIGHTSEEING: TOUR TYPE + TIMINGS + ADULT PRICE + CHILD PRICE + DATE + ADULTS + CHILDREN + SLOT + TOTAL ── */}
          {service.type === "sightseeing" &&
            (() => {
              const tourTypesList =
                Array.isArray(service.tourTypes) && service.tourTypes.length > 0
                  ? service.tourTypes
                  : [
                      {
                        tourType: "Sharing Tour",
                        adultPrice:
                          service.adultPrice ||
                          service.price ||
                          service.rate ||
                          0,
                        childPrice: service.childPrice || 0,
                      },
                      {
                        tourType: "Private Tour",
                        adultPrice:
                          service.adultPrice ||
                          service.price ||
                          service.rate ||
                          0,
                        childPrice: service.childPrice || 0,
                      },
                      {
                        tourType: "Ticket Tour",
                        adultPrice:
                          service.adultPrice ||
                          service.price ||
                          service.rate ||
                          0,
                        childPrice: service.childPrice || 0,
                      },
                    ];
              const currentTourType =
                service.tourType ||
                tourTypesList[0]?.tourType ||
                "Sharing Tour";
              const currentTourObj =
                tourTypesList.find(
                  (t) =>
                    String(t.tourType || "")
                      .trim()
                      .toLowerCase() ===
                    String(currentTourType || "")
                      .trim()
                      .toLowerCase(),
                ) ||
                tourTypesList[0] ||
                {};
              const availableSlots = resolveSlotOptions(service);
              const resolvedDuration = formatServiceDuration(
                service,
                currentTourObj,
              );

              return (
                <div className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-3 shadow-2xs text-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">
                        Sightseeing Configuration
                      </p>
                    </div>

                    {/* Tour Type Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-500">
                        Tour Type:
                      </span>
                      <div className="relative">
                        <select
                          value={currentTourType}
                          onChange={(e) =>
                            updateField(service.id, "tourType", e.target.value)
                          }
                          className={`${selectCls.replace("rounded-lg", "rounded-full")} h-7.5 pl-3 pr-8 text-[11px] font-semibold appearance-none bg-white border border-gray-300 text-slate-900 hover:border-[#3E63DD] cursor-pointer shadow-2xs`}
                        >
                          {tourTypesList.map((t, idx) => (
                            <option
                              key={t._id || idx}
                              value={t.tourType}
                              className="bg-white text-slate-900 font-medium"
                            >
                              {t.tourType}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={13}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Info Pills: Operating Days | Open / Close | Duration */}
                  <div className="flex flex-wrap items-center gap-2">
                    {service.operatingDays && (
                      <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        <span className="text-slate-500">Days:</span>{" "}
                        {service.operatingDays}
                      </span>
                    )}
                    {(service.openingTime || service.closingTime) && (
                      <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        <Clock size={11} className="text-amber-600" />
                        <span className="text-slate-500">
                          Open / Close:
                        </span>{" "}
                        {service.openingTime || "08:00"} /{" "}
                        {service.closingTime || "18:00"}
                      </span>
                    )}
                    {resolvedDuration && (
                      <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        <Clock size={11} className="text-purple-600" />
                        <span className="text-slate-500">Duration:</span>{" "}
                        {resolvedDuration}
                      </span>
                    )}
                  </div>

                  {/* Description shifted to the top */}
                  {(currentTourObj.description ||
                    service.description ||
                    service.desc) && (
                    <p className="text-[10.5px] text-slate-500 font-normal italic leading-relaxed pt-0.5 border-t border-gray-100">
                      {currentTourObj.description ||
                        service.description ||
                        service.desc}
                    </p>
                  )}

                  {/* Configuration Grid: Adult Price | Child Price | Adults | Children | Slot | Total */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-0.5">
                    {/* 1. Adult Price */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Adult Price
                      </p>
                      {isEditMode ? (
                        <input
                          type="number"
                          value={
                            service.adultPrice !== undefined
                              ? service.adultPrice
                              : service.rate
                          }
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateField(service.id, "adultPrice", val);
                            updateField(service.id, "rate", val);
                          }}
                          className={`${inputCls} h-8 text-[11px] font-bold w-full`}
                        />
                      ) : (
                        <div className="flex h-8 w-full items-center rounded-lg border border-gray-200 bg-slate-50 px-2.5 text-[11px] font-bold text-slate-900">
                          {formatCurrencyValue(
                            service.adultPrice !== undefined
                              ? service.adultPrice
                              : service.rate,
                            currencyCode,
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. Child Price */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Child Price
                      </p>
                      {isEditMode ? (
                        <input
                          type="number"
                          value={service.childPrice || 0}
                          onChange={(e) =>
                            updateField(
                              service.id,
                              "childPrice",
                              Number(e.target.value),
                            )
                          }
                          className={`${inputCls} h-8 text-[11px] font-bold w-full`}
                        />
                      ) : (
                        <div className="flex h-8 w-full items-center rounded-lg border border-gray-200 bg-slate-50 px-2.5 text-[11px] font-bold text-slate-900">
                          {formatCurrencyValue(
                            service.childPrice || 0,
                            currencyCode,
                          )}
                        </div>
                      )}
                    </div>

                    {/* 3. Adults */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Adults
                      </p>
                      <input
                        type="number"
                        min={1}
                        value={
                          service.adults !== undefined
                            ? service.adults
                            : service.pax || 1
                        }
                        onChange={(e) => {
                          const num = Math.max(1, Number(e.target.value) || 1);
                          updateField(service.id, "adults", num);
                          updateField(
                            service.id,
                            "pax",
                            num + Number(service.children || 0),
                          );
                        }}
                        className={`${inputCls} h-8 text-[11px] font-bold w-full`}
                      />
                    </div>

                    {/* 4. Children */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Children
                      </p>
                      <input
                        type="number"
                        min={0}
                        value={
                          service.children !== undefined ? service.children : 0
                        }
                        onChange={(e) => {
                          const num = Math.max(0, Number(e.target.value) || 0);
                          updateField(service.id, "children", num);
                          updateField(
                            service.id,
                            "pax",
                            Number(service.adults || service.pax || 1) + num,
                          );
                        }}
                        className={`${inputCls} h-8 text-[11px] font-bold w-full`}
                      />
                    </div>

                    {/* 5. Slot / Time */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Slot / Time
                      </p>
                      <div className="relative">
                        <select
                          value={
                            service.selectedSlot || availableSlots[0] || "08:00"
                          }
                          onChange={(e) =>
                            updateField(
                              service.id,
                              "selectedSlot",
                              e.target.value,
                            )
                          }
                          className={`${selectCls.replace("rounded-lg", "rounded-md")} h-8 text-[11px] font-semibold w-full pl-2 pr-6 appearance-none bg-white border border-gray-300 text-slate-900 cursor-pointer focus:border-[#3E63DD]`}
                        >
                          <option value="" disabled>
                            Select Time
                          </option>
                          {availableSlots.map((slot, sIdx) => (
                            <option
                              key={sIdx}
                              value={slot}
                              className="bg-white text-slate-900 font-medium"
                            >
                              {slot}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={12}
                          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
                        />
                      </div>
                    </div>

                    {/* 6. Total (Calculated) */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Total
                      </p>
                      <div className="flex h-8 w-full items-center rounded-lg border border-gray-200 bg-slate-100 px-2.5 text-[11.5px] font-bold text-slate-900">
                        {formatCurrencyValue(total, currencyCode)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* ── HOTEL: ROOM + BED INFO ── */}
          {service.type === "hotel" && (
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-wrap gap-2 font-medium">
                {service.roomType && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] text-slate-700 shadow-2xs">
                    <LiaHotelSolid className="text-sky-600" />
                    <span className="text-slate-500">Category:</span>{" "}
                    {service.roomType}
                  </span>
                )}
                {Number(service.rooms || 0) > 0 && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] text-slate-700 shadow-2xs">
                    <BsPeople className="text-emerald-600" />
                    <span className="text-slate-500">Rooms:</span>{" "}
                    {service.rooms}
                  </span>
                )}
                {service.roomCategory && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] text-slate-700 shadow-2xs">
                    <LiaHotelSolid className="text-blue-600" />
                    <span className="text-slate-500">Room Type:</span>{" "}
                    {formatRoomOccupancyLabel(service.roomCategory)}
                  </span>
                )}
                {service.bedType && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] text-slate-700 shadow-2xs">
                    <MdKingBed className="text-amber-600" />
                    <span className="text-slate-500">Bed:</span>{" "}
                    {getBedTypeOptionLabel(service.bedType)}
                  </span>
                )}
                {service.extraBedType && service.extraBedType !== "None" && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] text-slate-700 shadow-2xs">
                    <MdKingBed className="text-orange-600" />
                    <span className="text-slate-500">Extra Bed:</span>{" "}
                    {service.extraBedType}
                  </span>
                )}
                <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] text-slate-700 shadow-2xs">
                  <BsPeople className="text-purple-600" />
                  <span className="text-slate-500">Max:</span>{" "}
                  {hotelOccupancy.maxAdults} Adults,{" "}
                  {hotelOccupancy.maxChildren} Child
                  {hotelOccupancy.maxChildren === 1 ? "" : "ren"}
                </span>
              </div>

              {/* Smart Hotel Room Capacity Suggestion Banner */}
              {(() => {
                const effectiveAdults = Number(adultPassengers !== undefined ? adultPassengers : totalPassengers);
                const hasExtraBed = service.extraAdult || (service.extraBedType && service.extraBedType !== "None");
                if (effectiveAdults > 0 && effectiveAdults > Math.max(1, Number(service.rooms || 1)) * (Number(hotelOccupancy.maxAdults || 2) + (hasExtraBed ? 1 : 0))) {
                  const needed = Math.max(1, Math.ceil(effectiveAdults / Number(hotelOccupancy.maxAdults || 2)));
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-900 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">💡</span>
                        <span>
                          For <b>{effectiveAdults} Adult{effectiveAdults > 1 ? "s" : ""}</b>, at least{" "}
                          <b>{needed} Room{needed > 1 ? "s are" : " is"}</b> recommended based on{" "}
                          {service.roomCategory || service.roomType || "room"} capacity ({hotelOccupancy.maxAdults || 2} Adult{Number(hotelOccupancy.maxAdults || 2) > 1 ? "s" : ""}/room).
                          Currently <b>{Number(service.rooms || 1)} Room{Number(service.rooms || 1) > 1 ? "s" : ""}</b> selected.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateField(service.id, "rooms", needed)}
                        className="cursor-pointer rounded-lg border border-amber-400 bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900 transition hover:bg-amber-200 shadow-2xs"
                      >
                        Auto-Set {needed} Rooms
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              {isEditMode && (
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 md:grid-cols-2 lg:grid-cols-5 shadow-2xs">
                  <div>
                    <label className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Room Category
                    </label>
                    <select
                      value={service.roomType || ""}
                      onChange={(e) =>
                        updateField(service.id, "roomType", e.target.value)
                      }
                      className={`${selectCls} w-full`}
                    >
                      <option value="">Select room category</option>
                      {(hotelVariantOptions?.roomTypes || (Array.isArray(hotelVariantOptions) ? hotelVariantOptions : [])).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Room Type (Occupancy)
                    </label>
                    <select
                      value={service.roomCategory || ""}
                      onChange={(e) =>
                        updateField(service.id, "roomCategory", e.target.value)
                      }
                      className={`${selectCls} w-full`}
                    >
                      <option value="">Select room type</option>
                      {(hotelVariantOptions?.roomCategories || ["Single", "Double", "Triple", "Quad"]).map((option) => (
                        <option key={option} value={option}>
                          {formatRoomOccupancyLabel(option)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Rooms
                    </label>
                    <select
                      value={Number(service.rooms || 1)}
                      onChange={(e) =>
                        updateField(
                          service.id,
                          "rooms",
                          Math.max(1, Number(e.target.value || 1)),
                        )
                      }
                      className={`${selectCls} w-full`}
                    >
                      {[...Array(8)].map((_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {index + 1} Room{index === 0 ? "" : "s"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Bed Type
                    </label>
                    <select
                      value={normalizeBedTypeValue(service.bedType) || ""}
                      onChange={(e) =>
                        updateField(service.id, "bedType", e.target.value)
                      }
                      className={`${selectCls} w-full`}
                    >
                      <option value="">Select bed type</option>
                      {(
                        hotelVariantOptions?.bedTypes || [
                          { value: "King", label: "King" },
                          { value: "Queen", label: "Queen" },
                          { value: "Twin", label: "Twin" },
                          { value: "Single", label: "Single" },
                        ]
                      ).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Extra Bed Type
                    </label>
                    <select
                      value={service.extraBedType || "None"}
                      onChange={(e) =>
                        updateField(service.id, "extraBedType", e.target.value)
                      }
                      className={`${selectCls} w-full`}
                    >
                      {(
                        hotelVariantOptions?.extraBedTypes || [
                          { value: "None", label: "None" },
                          { value: "Single Bed", label: "Single Bed" },
                        ]
                      ).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HOTEL: EXTRA PAX CHECKBOXES ── */}
          {service.type === "hotel" && (
            <div className="space-y-2 pt-1">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Optional Add-ons
              </p>

              {/* A.W.E.B */}
              <AddonRow
                label="A.W.E.B"
                sublabel="Extra adult with extra bed"
                checked={service.extraAdult || false}
                onChange={(v) => updateField(service.id, "extraAdult", v)}
                rate={service.awebRate || 0}
                currencyCode={currencyCode}
                isForeignCurrency={isForeignCurrency}
                exchangeRates={exchangeRates}
                accentClass="text-amber-700"
                borderHover="hover:border-amber-400"
              />

              {/* C.W.E.B */}
              <AddonRow
                label="C.W.E.B"
                sublabel="Child with extra bed"
                checked={service.childWithBed || false}
                onChange={(v) => updateField(service.id, "childWithBed", v)}
                rate={service.cwebRate || 0}
                currencyCode={currencyCode}
                isForeignCurrency={isForeignCurrency}
                exchangeRates={exchangeRates}
                accentClass="text-emerald-700"
                borderHover="hover:border-emerald-400"
              />

              {/* C.Wo.E.B */}
              <AddonRow
                label="C.Wo.E.B"
                sublabel="Child without extra bed"
                checked={service.childWithoutBed || false}
                onChange={(v) => updateField(service.id, "childWithoutBed", v)}
                rate={service.cwoebRate || 0}
                currencyCode={currencyCode}
                isForeignCurrency={isForeignCurrency}
                exchangeRates={exchangeRates}
                accentClass="text-blue-700"
                borderHover="hover:border-blue-400"
              />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Service;
