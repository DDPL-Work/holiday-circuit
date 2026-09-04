import React from "react";

export const QueryTabNavigation = ({
  query,
  quotes,
  activeTab,
  setActiveTab,
  activeQuote,
}) => {
  const currentStatus = String(query?.status || query?.agentStatus || "").trim();

  const isBookingStage = [
    "Booking Processed",
    "Booking Confirmed",
    "Confirmed",
    "Client Approved",
    "Payment Verified",
    "Voucher Generated",
    "Active Booking",
    "Completed",
    "Vouchered",
    "Booking_Accepted",
    "Payment_Completed",
    "Invoice_Requested",
  ].includes(currentStatus);

  const isNewQueryStage =
    ["New Query", "New", "Pending", "Unassigned"].includes(currentStatus) ||
    (!query?.agentStatus && !query?.status);

  const availableTabs = [
    { id: "basic", label: "Basic Details" },
    { id: "quotes", label: "All Quotes", badge: quotes.length },
    ...(isNewQueryStage ? [{ id: "packages", label: "Pre Packages" }] : []),
    ...(isBookingStage
      ? [
          { id: "services", label: "Services Bookings", badge: activeQuote?.services?.length },
          { id: "accounting", label: "Accounting" },
          { id: "docs", label: "Docs" },
        ]
      : []),
    { id: "activities", label: "Activities", badge: query?.activityLog?.length },
  ];

  return (
    <div className="bg-slate-100/80 border-b border-x border-slate-200 px-5 pt-3 mb-5">
      <div className="flex items-center gap-7 overflow-x-auto custom-scroll text-sm">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 px-0.5 text-sm font-semibold transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "text-[#3E63DD] font-extrabold border-b-[3.5px] border-[#3E63DD] -mb-[1px]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}{" "}
            {tab.badge ? (
              <span className="ml-1.5 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
};
