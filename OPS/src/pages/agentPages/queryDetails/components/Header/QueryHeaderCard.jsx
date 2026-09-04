import React, { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CalendarDays,
  Users,
  UserSquare2,
  ArrowRight,
  Pencil,
} from "lucide-react";
import { formatAmountValue } from "../../utils/queryDetailsHelpers";
import { TripTouristsModal } from "../../../../../modal/TripTouristsModal";

export const QueryHeaderCard = ({
  handleClose,
  query,
  quotes,
  activeTab,
  headerStatusMeta,
  headerLeadTraveler,
  headerCompany,
  headerDateRangeText,
  headerDuration,
  headerPaxSummary,
  headerTravelerCounts,
  headerPackageCurrency,
  headerPackageAmount,
  activeQuote,
}) => {
  const queryKey = `trip_tourists_${query?._id || query?.queryId || "default"}`;

  const [isTouristsModalOpen, setIsTouristsModalOpen] = useState(false);
  const [currentLeadTraveler, setCurrentLeadTraveler] = useState(() => {
    try {
      const savedLead = localStorage.getItem(`${queryKey}_lead`);
      if (savedLead) return savedLead;
    } catch (e) {}
    return headerLeadTraveler;
  });

  const [currentLeadPhone, setCurrentLeadPhone] = useState(() => {
    try {
      const savedPhone = localStorage.getItem(`${queryKey}_phone`);
      if (savedPhone) return savedPhone;
    } catch (e) {}
    return query?.phone || query?.mobileNumber || query?.contactNumber || query?.clientPhone || "";
  });

  React.useEffect(() => {
    try {
      const savedLead = localStorage.getItem(`${queryKey}_lead`);
      if (savedLead) {
        setCurrentLeadTraveler(savedLead);
      } else if (headerLeadTraveler) {
        setCurrentLeadTraveler(headerLeadTraveler);
      }
      const savedPhone = localStorage.getItem(`${queryKey}_phone`);
      if (savedPhone) {
        setCurrentLeadPhone(savedPhone);
      }
    } catch (e) {}
  }, [queryKey, headerLeadTraveler, query]);

  const rawLeadName = currentLeadTraveler || headerLeadTraveler || "";
  // Fix duplicate salutations like "Mr. Mr FRANK" => "Mr. FRANK"
  const cleanLeadName = rawLeadName.replace(/^(Mr\.|Mrs\.|Ms\.|Master|Dr\.)\s+(?=(Mr\.|Mrs\.|Ms\.|Master|Dr\.)\b)/i, "");
  const activeLeadName = cleanLeadName || currentLeadTraveler || headerLeadTraveler;

  const handleSaveTourists = (savedTourists) => {
    if (Array.isArray(savedTourists) && savedTourists.length > 0) {
      const primary = savedTourists.find((t) => t.isFlagged) || savedTourists[0];
      const salutation = primary?.salutation || "";
      const rawName = (primary?.name || "").replace(/^(Mr\.|Mrs\.|Ms\.|Master|Dr\.)\s*/i, "").trim();
      const fullName = [salutation, rawName].filter(Boolean).join(" ");
      if (fullName) {
        setCurrentLeadTraveler(fullName);
      }
      const phoneObj = primary?.phones?.[0];
      if (phoneObj && phoneObj.number) {
        const rawNum = phoneObj.number.trim();
        const codeStr = phoneObj.countryCode ? `+${phoneObj.countryCode.split("-")[0]}-` : "+91-";
        const formatted = rawNum.startsWith("+") ? rawNum : `${codeStr}${rawNum}`;
        setCurrentLeadPhone(formatted);
        try {
          localStorage.setItem(`${queryKey}_phone`, formatted);
        } catch (e) {}
      }
      if (primary?.email) {
        try {
          localStorage.setItem(`${queryKey}_email`, primary.email.trim());
        } catch (e) {}
      }
    }
  };

  return (
    <>
      {/* 1. TOP BREADCRUMB BAR (Back | [Active Tab] > Current) */}
      <div className="flex items-center gap-2 mb-2.5 text-xs text-slate-500 font-medium px-2 py-1">
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex items-center gap-1 text-slate-900 hover:text-slate-700 font-bold cursor-pointer transition-all"
        >
          <ArrowLeft size={14} />
          <span className="text-sm">Back</span>
        </button>
        <span className="text-slate-300 font-light mx-0.5">|</span>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-wrap">
          <span className="text-slate-800 font-bold">
            {(() => {
              const status = String(query?.status || query?.agentStatus || "").trim();
              if (["Confirmed", "Booking Confirmed", "Voucher Generated", "Active Booking", "Completed", "Vouchered"].includes(status)) {
                return "Booking Confirmed";
              }
              if (["Booking Processed", "Payment Verified", "Client Approved", "Booking_Accepted", "Payment_Completed", "Invoice_Requested"].includes(status)) {
                return "Booking Processed";
              }
              if (
                ["Quote Sent", "Sent to Client", "Quote Received", "Markup Applied", "Quote Accepted", "Quote Updated"].includes(status) ||
                (quotes && quotes.length > 0)
              ) {
                return "Quote Received";
              }
              if (["In Progress", "InProgress", "Working"].includes(status)) {
                return "In Progress";
              }
              return "New Query";
            })()}
          </span>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="text-slate-800 font-semibold">
            {activeTab === "basic"
              ? "Basic Details"
              : activeTab === "quotes"
                ? "All Quotes"
                : activeTab === "services"
                  ? "Services Bookings"
                  : activeTab === "accounting"
                    ? "Accounting"
                    : activeTab === "docs"
                      ? "Docs"
                      : "Activities"}
          </span>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="text-slate-500 font-normal">Current</span>
        </div>
      </div>

      {/* 2. QUERY HEADER SUMMARY CARD */}
      <div className={`bg-white border-y border-r border-slate-200 border-l-[5px] ${headerStatusMeta.accentBorder} py-3 px-4 sm:py-3.5 sm:px-4.5 relative transition-all`}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          {/* Left Details Block */}
          <div className="flex-1 space-y-1.5 min-w-0">
            {/* Line 1: # ID • Client Name • Destination • Agency • Badges */}
            <div className="flex items-center gap-1.5 flex-wrap text-base sm:text-lg font-bold text-slate-900 leading-snug">
              <span className="text-indigo-400 font-bold">#</span>
              <span className="font-extrabold">{String(query?.queryId || query?._id || "Not specified").replace(/^#\s*/, "")}</span>
              <span className="text-slate-300 font-normal mx-0.5">•</span>
              <span className="truncate max-w-[240px] sm:max-w-none font-bold">{cleanLeadName}</span>
              <span className="text-slate-300 font-normal mx-0.5">•</span>
              <span className="font-bold">{query?.destination || "Destination not specified"}</span>
              <span className="text-slate-300 font-normal mx-0.5">•</span>
              <span className="text-sm sm:text-base font-medium text-slate-700">
                {headerCompany}
              </span>
              <span className="text-slate-300 font-normal mx-0.5">•</span>

              {/* Badges */}
              <div className="inline-flex items-center gap-2 ml-1 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${headerStatusMeta.className}`}>
                  {headerStatusMeta.label}
                </span>
              </div>
            </div>

            {/* Line 2: Calendar Dates • Duration • Passengers */}
            <div className="flex items-center gap-2 flex-wrap text-sm text-slate-700 font-medium">
              <CalendarDays size={15} className="text-sky-500 shrink-0" />
              <span className="font-semibold text-slate-900">{headerDateRangeText}</span>
              <span className="text-slate-300 font-normal">•</span>
              <span>{headerDuration}</span>
              <span className="text-slate-300 font-normal">•</span>
              <Users size={15} className="text-amber-500 shrink-0 ml-0.5" />
              <span>{headerPaxSummary}</span>
            </div>

            {/* Line 3: Lead Guest Name + Phone (1A) */}
            <div className="flex items-center gap-2 flex-wrap text-sm text-slate-800 font-medium">
              <UserSquare2 size={15} className="text-emerald-400 shrink-0" />
              <span>{cleanLeadName}</span>
              {currentLeadPhone && (
                <span className="text-slate-600 font-medium text-xs sm:text-sm">
                  {currentLeadPhone.startsWith("+") ? currentLeadPhone : `+91-${currentLeadPhone}`}
                </span>
              )}
              <span className="text-slate-900 font-bold">({headerTravelerCounts.adults || 0}A)</span>
              <Pencil
                size={14}
                className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                onClick={() => setIsTouristsModalOpen(true)}
                title="Manage Tourists"
              />
            </div>

            {/* Line 4: Arrow Agency Contact (DDLC Company) */}
            <div className="flex items-center gap-2 flex-wrap text-sm text-slate-800 font-medium pt-0.5">
              <ArrowRight size={15} className="text-purple-400 shrink-0" />
              <span className="font-medium text-slate-900">
                {headerCompany}
              </span>
            </div>
          </div>

          {/* Right Quotation Cost Block */}
          {quotes.length > 0 && activeQuote && (
            <div className="lg:text-right shrink-0">
              <p className="text-[11px] font-normal text-slate-500">Quotation ({headerPackageCurrency})</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                ₹ {formatAmountValue(headerPackageAmount)}
              </p>
              <p className="text-[10px] text-slate-400 font-normal">inc. GST & other taxes</p>
            </div>
          )}
        </div>
      </div>

      <TripTouristsModal
        isOpen={isTouristsModalOpen}
        onClose={() => setIsTouristsModalOpen(false)}
        query={query}
        headerLeadTraveler={activeLeadName}
        onSave={handleSaveTourists}
      />
    </>
  );
};
