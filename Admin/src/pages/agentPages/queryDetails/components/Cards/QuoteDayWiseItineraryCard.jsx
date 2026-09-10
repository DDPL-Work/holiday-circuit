import React from "react";
import { Clock3 } from "lucide-react";
import { buildItineraryDayLabel } from "../../utils/queryDetailsHelpers";

export const QuoteDayWiseItineraryCard = ({ items = [], startDate = "" }) => {
  const normalizedItems = Array.isArray(items)
    ? items.filter((item) => item && (item.heading || item.title || item.description))
    : [];

  if (!normalizedItems.length) return null;

  return (
    <div className="mb-4 rounded-xl border border-orange-200 bg-white p-3">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <Clock3 size={14} />
        </div>
        <h4 className="font-semibold text-sm text-gray-900">Day Wise Itinerary</h4>
        <span className="ml-auto rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
          {normalizedItems.length} day{normalizedItems.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-3">
        {normalizedItems.map((item, index) => {
          const dayLabel =
            String(item?.dayLabel || "").trim() ||
            buildItineraryDayLabel(item?.dayNumber || index + 1, startDate);
          const heading = String(item?.heading || "").trim() || (item?.title ? `${dayLabel} : ${item.title}` : dayLabel);
          const description = String(item?.description || "").trim();

          return (
            <div key={`quote-itinerary-${index}`} className="rounded-xl border border-gray-200 bg-gray-50 p-3" style={{ borderLeft: "3px solid #f59e0b" }}>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
                  {item?.dayNumber || index + 1}
                </div>
                <p className="text-[13px] font-semibold text-[#92400E]">{heading}</p>
              </div>
              {description ? (
                <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-slate-700">{description}</p>
              ) : (
                <p className="mt-1 text-xs italic text-slate-400">Description pending.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
