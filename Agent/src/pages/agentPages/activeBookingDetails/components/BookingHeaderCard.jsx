import React from "react";
import {
  ArrowLeft,
  ChevronRight,
  CalendarDays,
  Users,
  UserSquare2,
  ArrowRight,
} from "lucide-react";

export const BookingHeaderCard = ({
  onClose,
  detailTab,
  headerBookingId,
  headerClientName,
  headerDestination,
  headerTravelDates,
  headerDuration,
  headerPaxSummary,
  headerAdultCount,
  booking,
  isFullPaymentVerified,
  isPaymentVerified,
  expectedPaymentAmount,
  approvedQuotationAmount,
}) => {
  return (
    <>
      {/* 1. TOP BREADCRUMB BAR (Back | Docs > Current) */}
      <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 font-medium px-1">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-bold cursor-pointer transition-all"
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>
        <span className="text-slate-300 font-light mx-0.5">|</span>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>
            {detailTab === "basic"
              ? "Basic Details"
              : detailTab === "services"
              ? "Services Bookings"
              : detailTab === "accounting"
              ? "Accounting"
              : detailTab === "internal_invoice"
              ? "Internal Generate Invoice"
              : "Docs"}
          </span>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="text-slate-700 font-semibold">Current</span>
        </div>
      </div>

      {/* 2. QUERY HEADER SUMMARY CARD (Green Left Accent Border matching DMC UI) */}
      <div className="bg-white border-y border-r border-slate-200 border-l-[5px] border-l-emerald-600 py-3 px-4 sm:py-3.5 sm:px-4.5 relative transition-all mb-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          {/* Left Details Block */}
          <div className="flex-1 space-y-1.5 min-w-0">
            {/* Line 1: # ID • Client Name • Destination • Agency • Badges */}
            <div className="flex items-center gap-1.5 flex-wrap text-base sm:text-lg font-bold text-slate-900 leading-snug">
              <span className="text-[#6679f4] font-bold">#</span>
              <span className="font-extrabold">{String(headerBookingId).replace(/^#\s*/, "")}</span>
              <span className="text-slate-300 font-normal mx-0.5">•</span>
              <span className="truncate max-w-[240px] sm:max-w-none font-bold">{headerClientName}</span>
              <span className="text-slate-300 font-normal mx-0.5">•</span>
              <span className="font-bold">{headerDestination}</span>
              <span className="text-slate-300 font-normal mx-0.5">•</span>
              <span className="text-sm sm:text-base font-medium text-slate-700">
                {booking?.agencyName || booking?.companyName || "DDLC Company"}
              </span>
              <span className="text-slate-300 font-normal mx-0.5">•</span>

              {/* Badges */}
              <div className="inline-flex items-center gap-2 ml-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300/80">
                  {isFullPaymentVerified ? "Full Paid" : isPaymentVerified ? "Partial Paid" : "Active Booking"}
                </span>
              </div>
            </div>

            {/* Line 2: Calendar Dates • Duration • Passengers */}
            <div className="flex items-center gap-2 flex-wrap text-sm text-slate-700 font-medium">
              <CalendarDays size={15} className="text-cyan-500 shrink-0" />
              <span>{headerTravelDates}</span>
              {headerDuration && (
                <>
                  <span className="text-slate-300 font-normal">•</span>
                  <span>{headerDuration}</span>
                </>
              )}
              <span className="text-slate-300 font-normal">•</span>
              <Users size={15} className="text-amber-500 shrink-0 ml-0.5" />
              <span>{headerPaxSummary}</span>
            </div>

            {/* Line 3: Lead Guest Name (2A) */}
            <div className="flex items-center gap-2 flex-wrap text-sm text-slate-800 font-medium">
              <UserSquare2 size={15} className="text-emerald-500 shrink-0" />
              <span>{headerClientName}</span>
              <span className="text-slate-900 font-bold">({headerAdultCount || 2}A)</span>
            </div>

            {/* Line 4: Arrow Agency Contact (DDLC Company) */}
            <div className="flex items-center gap-2 flex-wrap text-sm text-slate-800 font-medium pt-0.5">
              <ArrowRight size={15} className="text-violet-500 shrink-0" />
              <span className="font-medium text-slate-900">
                {booking?.agencyName || booking?.companyName || "DDLC Company"}
              </span>
            </div>
          </div>

          {/* Right Quotation Cost Block */}
          <div className="lg:text-right shrink-0">
            <p className="text-[11px] font-normal text-slate-500">Quotation (INR)</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              ₹ {Math.floor(Number(expectedPaymentAmount || approvedQuotationAmount || 38650)).toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-slate-400 font-normal">inc. GST & other taxes</p>
          </div>
        </div>
      </div>
    </>
  );
};
