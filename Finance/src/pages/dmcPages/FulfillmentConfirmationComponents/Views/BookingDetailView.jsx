import React from "react";
import {
  ArrowLeft,
  ChevronRight,
  CalendarDays,
  Users,
  User,
  ArrowRight,
  Building2,
  Star,
  Edit3,
  Car,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
  STATUS_TABS,
  getOpsStatusBadge,
  formatServiceDate,
  formatTimeAgo,
  getStarRatingDisplay,
  getServiceVoucherStatusInfo,
  formatServiceMoney,
  getResolvedServiceDisplayTotal,
  getServicePaymentStatusDisplay,
  serviceTypeLabel,
  formatDocumentDateTime,
  formatDocumentSize,
} from "../utils/formatter";
import ServicesTab from "../Tabs/ServicesTab";
import AccountingTab from "../Tabs/AccountingTab";
import InternalInvoiceTab from "../Tabs/InternalInvoiceTab";
import DocsTab from "../Tabs/DocsTab";

export default function BookingDetailView({
  handleBackToList,
  selectedStatusTab,
  selectedQuery,
  customerTotalAmount,
  totalServicesBookingCost,
  detailTab,
  setDetailTab,
  categorizedServices,
  serviceCategoryTab,
  setServiceCategoryTab,
  availableCategoryTabs,
  handleOpenVoucherModal,
  getServiceTagCommentsDisplay,
  handleOpenEditTagModal,
  accountingSubTab,
  setAccountingSubTab,
  customerPaidAmount,
  customerInstallments,
  navigate,
  referenceServices,
  getServiceKey,
  handleOpenSupplierPaymentModal,
  proformaInvoiceData,
  setIsCreatingProforma,
  setProformaInvoiceData,
  handleProfitRefresh,
  profitRefreshing,
  handleProfitCopyToClipboard,
  handleProfitExcelExport,
  selectedQueryId,
  travelerDocumentVerification,
  travelerProfiles,
  uploadedTravelerDocumentCount,
  travelersReadyForSupplierHandoff,
  handleTravelerDocumentOpen,
  handleTravelerDocumentDownload,
  downloadingDocumentId,
}) {
  return (
    <>
      {/* TOP MINIMAL NAVIGATION HEADER */}
      <div className="mb-2 flex items-center gap-2 px-1 py-0.5">
        <button
          type="button"
          onClick={handleBackToList}
          className="inline-flex items-center gap-2 text-slate-900 hover:text-blue-600 transition cursor-pointer font-bold"
        >
          <ArrowLeft size={16} className="text-slate-800" />
          <span className="text-sm font-bold text-slate-900 tracking-tight">
            Back
          </span>
        </button>
        <span className="text-slate-300 font-light mx-1">|</span>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>
            {STATUS_TABS.find((tab) => tab.key === selectedStatusTab)?.label ||
              "Payment Booking"}
          </span>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="text-slate-700 font-semibold">Current</span>
        </div>
      </div>

      {/* QUERY HEADER SUMMARY CARD */}
      {selectedQuery && (
        <div className="bg-white border-y border-r border-slate-200 border-l-[5px] border-l-emerald-600 py-3 px-4 sm:py-3.5 sm:px-4.5 relative transition-all">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            {/* Left Details Block */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {/* Line 1: # ID • Name • Destination • Agency • Badges */}
              <div className="flex items-center gap-1.5 flex-wrap text-base sm:text-lg font-bold text-slate-900 leading-snug">
                <span className="text-slate-400 font-normal">#</span>
                <span className="font-extrabold">
                  {String(
                    selectedQuery?.queryId || selectedQuery?._id || "4041372",
                  ).replace(/^#\s*/, "")}
                </span>
                <span className="text-slate-300 font-normal mx-0.5">•</span>
                <span className="truncate max-w-[240px] sm:max-w-none font-bold">
                  {selectedQuery?.travelerDetails?.[0]?.fullName ||
                    selectedQuery?.leadPaxName ||
                    selectedQuery?.agentName ||
                    selectedQuery?.clientName ||
                    "Mr. Prithvi Singh"}
                </span>
                <span className="text-slate-300 font-normal mx-0.5">•</span>
                <span className="font-bold">
                  {selectedQuery?.destination || "India"}
                </span>
                <span className="text-slate-300 font-normal mx-0.5">•</span>
                <span className="text-sm sm:text-base font-medium text-slate-700">
                  {selectedQuery?.agentCompany ||
                    selectedQuery?.agencyName ||
                    selectedQuery?.agentName ||
                    "Carma Tours"}
                </span>
                <span className="text-slate-300 font-normal mx-0.5">•</span>
                {/* Badges */}
                <div className="inline-flex items-center gap-2 ml-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300/80">
                    {getOpsStatusBadge(selectedQuery?.opsStatus, selectedQuery)
                      .label || "Converted"}
                  </span>
                </div>
              </div>
              {/* Line 2: Calendar 14 Jul, 2026 • 2N, 3D • Users 2 Adults */}
              <div className="flex items-center gap-2 flex-wrap text-sm text-slate-700 font-medium">
                <CalendarDays size={15} className="text-slate-400 shrink-0" />
                <span>
                  {formatServiceDate(
                    selectedQuery?.startDate ||
                      selectedQuery?.travelDate ||
                      selectedQuery?.services?.[0]?.serviceDate,
                  ) !== "-"
                    ? formatServiceDate(
                        selectedQuery?.startDate ||
                          selectedQuery?.travelDate ||
                          selectedQuery?.services?.[0]?.serviceDate,
                      )
                    : "14 Jul, 2026"}
                </span>
                <span className="text-slate-300 font-normal">•</span>
                <span>{selectedQuery?.duration || "2N, 3D"}</span>
                <span className="text-slate-300 font-normal">•</span>
                <Users size={15} className="text-slate-400 shrink-0 ml-0.5" />
                <span>
                  {selectedQuery?.passengers ||
                    selectedQuery?.adults ||
                    selectedQuery?.travelerDetails?.length ||
                    2}{" "}
                  Adults
                </span>
              </div>
              {/* Line 3: User Lead Guest Name (1A) */}
              <div className="flex items-center gap-2 flex-wrap text-sm text-slate-800 font-medium">
                <User size={15} className="text-slate-400 shrink-0" />
                <span>
                  {selectedQuery?.travelerDetails?.[0]?.fullName ||
                    selectedQuery?.leadPaxName ||
                    selectedQuery?.agentName ||
                    "Mr. Prithvi Singh"}
                </span>
                <span className="text-slate-900 font-bold">
                  (
                  {selectedQuery?.travelerDetails?.length
                    ? `${selectedQuery.travelerDetails.length}A`
                    : "1A"}
                  )
                </span>
              </div>
              {/* Line 4: Arrow Source Contact (DDLC Company) */}
              <div className="flex items-center gap-2 flex-wrap text-sm text-slate-800 font-medium pt-0.5">
                <ArrowRight size={15} className="text-slate-400 shrink-0" />
                <span className="font-medium text-slate-900">
                  {selectedQuery?.agentCompany ||
                    selectedQuery?.agencyName ||
                    selectedQuery?.contactPerson ||
                    "DDLC Company"}
                </span>
              </div>
            </div>
            {/* Right Package Cost Block */}
            <div className="lg:text-right shrink-0">
              <p className="text-[11px] font-normal text-slate-500">
                Package (INR)
              </p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {Math.floor(
                  Number(
                    customerTotalAmount ||
                      selectedQuery?.packagePrice ||
                      103267.5,
                  ),
                ).toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-slate-400 font-normal">inc. GST</p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Booking Details & Content Area */}
      <div className="min-w-0">
        {/* HORIZONTAL TAB NAVIGATION */}
        <div className="bg-white border-b border-x border-slate-200 px-5 pt-3 mb-5">
          <div className="flex items-center gap-8 overflow-x-auto custom-scroll text-sm">
            <button
              type="button"
              onClick={() => setDetailTab("basic")}
              className={`pb-3 font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                detailTab === "basic"
                  ? "text-blue-600 font-extrabold border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900 font-semibold"
              }`}
            >
              Basic Details
            </button>
            <button
              type="button"
              onClick={() => setDetailTab("services")}
              className={`pb-3 font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                detailTab === "services"
                  ? "text-blue-600 font-extrabold border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900 font-semibold"
              }`}
            >
              Services Bookings
            </button>
            <button
              type="button"
              onClick={() => setDetailTab("accounting")}
              className={`pb-3 font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                detailTab === "accounting"
                  ? "text-blue-600 font-extrabold border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900 font-semibold"
              }`}
            >
              Accounting
            </button>
            <button
              type="button"
              onClick={() => setDetailTab("internal_invoice")}
              className={`pb-3 font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                detailTab === "internal_invoice"
                  ? "text-blue-600 font-extrabold border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900 font-semibold"
              }`}
            >
              Internal Generate Invoice
            </button>
            <button
              type="button"
              onClick={() => setDetailTab("docs")}
              className={`pb-3 font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                detailTab === "docs"
                  ? "text-blue-600 font-extrabold border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900 font-semibold"
              }`}
            >
              Docs
            </button>
          </div>
        </div>

        {detailTab === "basic" &&
          (() => {
            const resolvedGstPercent = Number(
              selectedQuery?.taxPercentage ??
                selectedQuery?.gstPercent ??
                selectedQuery?.gstRate ??
                selectedQuery?.taxRate ??
                selectedQuery?.gst ??
                selectedQuery?.selectedQuotation?.pricing?.tax?.gst?.percent ??
                selectedQuery?.quotation?.pricing?.tax?.gst?.percent ??
                selectedQuery?.pricing?.tax?.gst?.percent ??
                selectedQuery?.quotationData?.pricing?.tax?.gst?.percent ??
                (selectedQuery?.taxPercentage === 0 ? 0 : 5),
            );
            return (
              <div className="space-y-4 pt-1 pb-6 px-1">
                {/* 1. TOP TITLE */}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Booking Services
                </h2>

                {/* 2. PACKAGE PRICE SECTION */}
                <div>
                  <div className="mb-1.5">
                    <h3 className="text-sm font-semibold text-slate-600">
                      Package Price
                    </h3>
                  </div>
                  {/* USED FOR CONVERSION GREEN BORDER BOX */}
                  <div className="w-full max-w-xl border-2 border-emerald-500 rounded-md bg-white overflow-hidden my-2 shadow-2xs">
                    <div className="bg-emerald-50 border-b border-emerald-200/80 px-3.5 py-1 text-xs font-semibold text-slate-900">
                      Used for Conversion
                    </div>
                    <div className="p-3 flex items-baseline gap-2 overflow-x-auto whitespace-nowrap">
                      <span className="text-sky-500 font-bold text-xs">
                        INR
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-sky-600 tracking-tight">
                        {Math.floor(
                          Number(
                            customerTotalAmount ||
                              selectedQuery?.packagePrice ||
                              103267.5,
                          ),
                        ).toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-medium text-slate-700">
                        (inc.{resolvedGstPercent}% GST & other taxes)
                      </span>
                      <span className="text-slate-300 font-light mx-1">/</span>
                      <span className="text-slate-400 text-xs font-medium">
                        INR
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-800">
                        {Math.floor(
                          Number(
                            totalServicesBookingCost ||
                              selectedQuery?.costPrice ||
                              98350,
                          ),
                        ).toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-slate-400 font-normal ml-0.5">
                        (cost price)
                      </span>
                    </div>
                  </div>
                  {/* CREATED SUBTEXT & LATEST QUOTE BADGE */}
                  <p className="text-xs text-slate-400 font-normal mt-1.5">
                    Created {formatTimeAgo(selectedQuery?.createdAt)} by{" "}
                    {selectedQuery?.assignedTo ||
                      selectedQuery?.agentName ||
                      "Srikant"}
                  </p>
                  <div className="mt-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                      Latest Quote
                    </span>
                  </div>
                </div>

                {/* 3. TRAVEL DATE & PAX SUMMARY CARD */}
                <div className="bg-white border border-slate-300 rounded-md p-3 flex items-center gap-2 text-xs sm:text-sm text-slate-800 font-medium my-2.5">
                  <CalendarDays size={15} className="text-slate-400 shrink-0" />
                  <span>
                    {formatServiceDate(
                      selectedQuery?.startDate ||
                        selectedQuery?.travelDate ||
                        selectedQuery?.services?.[0]?.serviceDate,
                    ) !== "-"
                      ? formatServiceDate(
                          selectedQuery?.startDate ||
                            selectedQuery?.travelDate ||
                            selectedQuery?.services?.[0]?.serviceDate,
                        )
                      : "18 Jul, 2026"}
                  </span>
                  <span>for</span>
                  <span>{selectedQuery?.duration || "3 Days"}</span>
                  <span className="text-slate-300 font-normal mx-0.5">•</span>
                  <Users size={15} className="text-slate-400 shrink-0" />
                  <span>
                    {selectedQuery?.passengers || selectedQuery?.adults || 2}{" "}
                    Adults
                  </span>
                </div>

                {/* 4. SERVICES SECTION */}
                <div className="space-y-4 pt-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Services
                  </h3>

                  {/* A. ACCOMMODATION / HOTEL TABLE */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                        <Building2 size={18} className="text-indigo-600" />
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        Accommodation
                      </h4>
                    </div>
                    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-300 text-xs font-bold text-slate-700">
                              <th className="py-3 px-4 w-[12%]">Night</th>
                              <th className="py-3 px-4 w-[34%]">Hotel</th>
                              <th className="py-3 px-4 w-[24%]">
                                Meal/Description
                              </th>
                              <th className="py-3 px-4 w-[18%]">Rooms</th>
                              <th className="py-3 px-4 w-[12%] text-end">
                                Price
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-800">
                            {(categorizedServices.hotels.length > 0
                              ? categorizedServices.hotels
                              : [
                                  {
                                    ordinal: "1st",
                                    resolvedServiceDate:
                                      selectedQuery?.startDate || "2026-05-21",
                                    serviceName: "ITC Maurya",
                                    address: "New Delhi",
                                    starRating: "5",
                                    description:
                                      "Executive Club | CP | ITC Maurya Hotel | Wifi | Air Conditioning | Daily Housekeeping",
                                    roomType: "DELUXE ROOM",
                                    roomCount: 1,
                                    pax: 2,
                                    total: 8000,
                                  },
                                  {
                                    ordinal: "2nd",
                                    resolvedServiceDate:
                                      selectedQuery?.endDate || "2026-05-22",
                                    serviceName: "Taj Palace New Delhi",
                                    address: "New Delhi",
                                    starRating: "5",
                                    description:
                                      "Luxury Room | MAP | Taj Palace New Delhi Hotel | Wifi | Air Conditioning | Complimentary Airport Drop",
                                    roomType: "DELUXE ROOM",
                                    roomCount: 1,
                                    pax: 2,
                                    total: 18000,
                                  },
                                ]
                            ).map((hotel, idx) => {
                              const starVal =
                                hotel.starRating ||
                                hotel.category ||
                                hotel.rating ||
                                hotel.star ||
                                selectedQuery?.starRating ||
                                "5";
                              const starCount = parseInt(
                                String(starVal).match(/\d+/)?.[0] || "5",
                                10,
                              );
                              const addressVal =
                                hotel.address ||
                                hotel.location ||
                                hotel.city ||
                                selectedQuery?.destination ||
                                "New Delhi";
                              const descText =
                                hotel.description ||
                                hotel.inclusions ||
                                hotel.remarks ||
                                (hotel.mealPlan || hotel.meal
                                  ? `${hotel.mealPlan || hotel.meal} included`
                                  : "Breakfast included");
                              return (
                                <tr
                                  key={idx}
                                  className="hover:bg-slate-50/50 transition-colors"
                                >
                                  {/* Night */}
                                  <td className="py-3 px-4 align-top">
                                    <p className="font-bold text-slate-900">
                                      {hotel.ordinal ||
                                        (idx === 0
                                          ? "1st"
                                          : idx === 1
                                            ? "2nd"
                                            : idx === 2
                                              ? "3rd"
                                              : `${idx + 1}th`)}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {formatServiceDate(
                                        hotel.resolvedServiceDate,
                                      )}
                                    </p>
                                  </td>
                                  {/* Hotel */}
                                  <td className="py-3 px-4 align-top">
                                    <p className="font-bold text-slate-900">
                                      {hotel.serviceName ||
                                        hotel.hotelName ||
                                        "The Orchid Hotel"}
                                    </p>
                                    <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                      <span>Address: {addressVal}</span>
                                      <span className="inline-flex items-center gap-0.5">
                                        {Array.from({
                                          length: Math.min(
                                            Math.max(starCount, 1),
                                            5,
                                          ),
                                        }).map((_, i) => (
                                          <Star
                                            key={i}
                                            size={12}
                                            className="fill-amber-400 text-amber-400 inline shrink-0"
                                          />
                                        ))}
                                      </span>
                                      <Edit3
                                        size={11}
                                        className="text-slate-400 hover:text-blue-600 cursor-pointer inline ml-1"
                                      />
                                    </div>
                                  </td>
                                  {/* Description / Inclusions */}
                                  <td className="py-3 px-4 align-top">
                                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-normal">
                                      {descText}
                                    </p>
                                  </td>
                                  {/* Rooms */}
                                  <td className="py-3 px-4 align-top">
                                    <p className="font-bold text-slate-900">
                                      {hotel.roomCount || 1} .
                                      {hotel.roomType || "DELUXE ROOM"}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {hotel.pax ||
                                        selectedQuery?.passengers ||
                                        2}{" "}
                                      Pax
                                    </p>
                                  </td>
                                  {/* Price */}
                                  <td className="py-3 px-4 align-top text-end">
                                    <p className="text-xs font-semibold text-slate-400">
                                      INR
                                    </p>
                                    <p className="font-bold text-slate-900">
                                      {Number(
                                        hotel.total ||
                                          hotel.cost ||
                                          hotel.price ||
                                          8000,
                                      ).toLocaleString("en-IN")}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      / N/A
                                    </p>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Accommodation Total Box */}
                    <div className="flex justify-end pt-0.5">
                      <div className="border border-slate-300 rounded-lg px-4 py-1.5 bg-white shadow-2xs inline-flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Total:
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          INR
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">
                          {(categorizedServices.hotels.length > 0
                            ? categorizedServices.hotels.reduce(
                                (sum, h) =>
                                  sum +
                                  Number(h.total || h.cost || h.price || 0),
                                0,
                              )
                            : 26000
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* B. TRANSPORT & SIGHTSEEING TABLE */}
                  {(() => {
                    const transportServicesList =
                      categorizedServices?.operational &&
                      categorizedServices.operational.length > 0
                        ? categorizedServices.operational
                        : [
                            {
                              serviceName: "Delhi Airport Pickup",
                              vehicleType: "AC Sedan",
                              resolvedServiceDate:
                                selectedQuery?.startDate || "2026-05-21",
                              routeDetails:
                                "Airport Pickup | Driver Included | AC Sedan",
                              pax: selectedQuery?.passengers || 2,
                              units: "1 Vehicle",
                              total: 4200,
                            },
                            {
                              serviceName: "Delhi Full Day City Ride",
                              vehicleType: "AC Sedan",
                              resolvedServiceDate:
                                selectedQuery?.endDate || "2026-05-22",
                              routeDetails:
                                "Calangute | Baga | Anjuna | Fort Aguada | 8 Hours | Driver | Fuel Included",
                              pax: selectedQuery?.passengers || 2,
                              units: "1 Vehicle",
                              total: 4800,
                            },
                          ];
                    const transportTotal = transportServicesList.reduce(
                      (sum, t) =>
                        sum + Number(t.total || t.cost || t.price || 0),
                      0,
                    );
                    return (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                            <Car size={18} className="text-amber-600" />
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900">
                            Transport & Sightseeing
                          </h4>
                        </div>
                        <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-300 text-xs font-bold text-slate-700">
                                <th className="py-3 px-4 w-[14%]">Date</th>
                                <th className="py-3 px-4 w-[34%]">
                                  Service / Vehicle
                                </th>
                                <th className="py-3 px-4 w-[22%]">
                                  Route & Inclusions
                                </th>
                                <th className="py-3 px-4 w-[18%]">
                                  Pax / Units
                                </th>
                                <th className="py-3 px-4 w-[12%] text-end">
                                  Price
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-800">
                              {transportServicesList.map((transport, idx) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-slate-50/50 transition-colors"
                                >
                                  {/* Date */}
                                  <td className="py-3 px-4 align-top font-semibold text-slate-900">
                                    {formatServiceDate(
                                      transport.resolvedServiceDate,
                                    )}
                                  </td>
                                  {/* Service / Vehicle */}
                                  <td className="py-3 px-4 align-top">
                                    <p className="font-bold text-slate-900">
                                      {transport.serviceName ||
                                        transport.name ||
                                        "Private Transport Service"}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                      Vehicle:{" "}
                                      {transport.vehicleType ||
                                        transport.vehicle ||
                                        "AC Sedan"}
                                    </p>
                                  </td>
                                  {/* Route & Inclusions */}
                                  <td className="py-3 px-4 align-top">
                                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-normal">
                                      {transport.routeDetails ||
                                        transport.description ||
                                        "Point to Point Transfer"}
                                    </p>
                                  </td>
                                  {/* Pax / Units */}
                                  <td className="py-3 px-4 align-top">
                                    <p className="font-bold text-slate-900">
                                      {transport.units || "1 Vehicle"}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {transport.pax ||
                                        selectedQuery?.passengers ||
                                        2}{" "}
                                      Pax
                                    </p>
                                  </td>
                                  {/* Price with / N/A */}
                                  <td className="py-3 px-4 align-top text-end">
                                    <p className="text-xs font-semibold text-slate-400">
                                      INR
                                    </p>
                                    <p className="font-bold text-slate-900">
                                      {Number(
                                        transport.total ||
                                          transport.cost ||
                                          transport.price ||
                                          4200,
                                      ).toLocaleString("en-IN")}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      / N/A
                                    </p>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {/* Transport Total Box */}
                      <div className="flex justify-end pt-0.5">
                        <div className="border border-slate-300 rounded-lg px-4 py-1.5 bg-white shadow-2xs inline-flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            Total:
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            INR
                          </span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {transportTotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* C. GRAND TOTAL SUMMARY CARD */}
                {(() => {
                  const finalSellingPrice = Math.floor(
                    Number(
                      customerTotalAmount ||
                        selectedQuery?.packagePrice ||
                        selectedQuery?.totalAmount ||
                        103267.5,
                    ),
                  );
                  const finalCostPrice = Math.floor(
                    Number(
                      totalServicesBookingCost ||
                        selectedQuery?.costPrice ||
                        98350,
                    ),
                  );
                  const gstRate = resolvedGstPercent;
                  return (
                    <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-2xs mt-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Booking Summary & Grand Total
                          </h4>
                          <div className="flex items-center gap-2.5 text-xs text-slate-700 mt-1 flex-wrap font-medium">
                            <span>
                              Services Cost Total:{" "}
                              <strong className="text-slate-900">
                                INR {finalCostPrice.toLocaleString("en-IN")}
                              </strong>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span>
                              Taxes (
                              {gstRate > 0 ? `${gstRate}% GST` : "GST"} & other
                              taxes):{" "}
                              <strong className="text-slate-900">
                                Included
                              </strong>
                            </span>
                          </div>
                        </div>
                        <div className="sm:text-end shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                            Grand Total (inc. GST & other taxes)
                          </p>
                          <p className="text-lg sm:text-xl font-bold text-emerald-600 tracking-tight mt-0.5">
                            INR {finalSellingPrice.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })()}

        <AnimatePresence mode="wait">
          {detailTab === "services" && (
            <ServicesTab
              serviceCategoryTab={serviceCategoryTab}
              setServiceCategoryTab={setServiceCategoryTab}
              availableCategoryTabs={availableCategoryTabs}
              categorizedServices={categorizedServices}
              selectedQuery={selectedQuery}
              getStarRatingDisplay={getStarRatingDisplay}
              formatServiceDate={formatServiceDate}
              formatTimeAgo={formatTimeAgo}
              getServiceVoucherStatusInfo={getServiceVoucherStatusInfo}
              handleOpenVoucherModal={handleOpenVoucherModal}
              getServiceTagCommentsDisplay={getServiceTagCommentsDisplay}
              handleOpenEditTagModal={handleOpenEditTagModal}
              formatServiceMoney={formatServiceMoney}
              getResolvedServiceDisplayTotal={getResolvedServiceDisplayTotal}
              getServicePaymentStatusDisplay={getServicePaymentStatusDisplay}
              totalServicesBookingCost={totalServicesBookingCost}
            />
          )}
          {detailTab === "accounting" && (
            <AccountingTab
              accountingSubTab={accountingSubTab}
              setAccountingSubTab={setAccountingSubTab}
              customerPaidAmount={customerPaidAmount}
              customerTotalAmount={customerTotalAmount}
              selectedQuery={selectedQuery}
              formatTimeAgo={formatTimeAgo}
              customerInstallments={customerInstallments}
              formatServiceDate={formatServiceDate}
              navigate={navigate}
              referenceServices={referenceServices}
              getServiceKey={getServiceKey}
              getResolvedServiceDisplayTotal={getResolvedServiceDisplayTotal}
              serviceTypeLabel={serviceTypeLabel}
              handleOpenSupplierPaymentModal={handleOpenSupplierPaymentModal}
              proformaInvoiceData={proformaInvoiceData}
              setIsCreatingProforma={setIsCreatingProforma}
              setProformaInvoiceData={setProformaInvoiceData}
              handleProfitRefresh={handleProfitRefresh}
              profitRefreshing={profitRefreshing}
              handleProfitCopyToClipboard={handleProfitCopyToClipboard}
              handleProfitExcelExport={handleProfitExcelExport}
            />
          )}
          {detailTab === "internal_invoice" && (
            <InternalInvoiceTab
              selectedQueryId={selectedQueryId}
              selectedQuery={selectedQuery}
              referenceServices={referenceServices}
            />
          )}
          {detailTab === "docs" && (
            <DocsTab
              selectedQuery={selectedQuery}
              travelerDocumentVerification={travelerDocumentVerification}
              travelerProfiles={travelerProfiles}
              uploadedTravelerDocumentCount={uploadedTravelerDocumentCount}
              travelersReadyForSupplierHandoff={travelersReadyForSupplierHandoff}
              formatDocumentDateTime={formatDocumentDateTime}
              formatDocumentSize={formatDocumentSize}
              handleTravelerDocumentOpen={handleTravelerDocumentOpen}
              handleTravelerDocumentDownload={handleTravelerDocumentDownload}
              downloadingDocumentId={downloadingDocumentId}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
