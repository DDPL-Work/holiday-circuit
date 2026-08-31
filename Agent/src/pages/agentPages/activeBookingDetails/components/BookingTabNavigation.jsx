import React from "react";

export const BookingTabNavigation = ({
  isPaymentDesk,
  isTravelerDocsDesk,
  detailTab,
  setDetailTab,
}) => {
  if (isPaymentDesk || isTravelerDocsDesk) return null;

  return (
    <div className="bg-white border-b border-x border-slate-200 px-5 pt-3 mb-5 shadow-2xs">
      <div className="flex items-center gap-8 overflow-x-auto custom-scroll text-sm">
        {[
          { id: "basic", label: "Basic Details" },
          { id: "services", label: "Services Bookings" },
          { id: "accounting", label: "Accounting" },
          { id: "internal_invoice", label: "Internal Generate Invoice" },
          { id: "docs", label: "Docs" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setDetailTab(tab.id)}
            className={`pb-3 font-bold transition-all relative whitespace-nowrap cursor-pointer ${
              detailTab === tab.id
                ? "text-[#3E63DD] font-extrabold border-b-2 border-[#3E63DD]"
                : "text-slate-600 hover:text-slate-900 font-semibold"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
