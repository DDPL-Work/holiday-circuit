import React from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";

export const DayItineraryTab = ({
  itinerary,
  addItineraryDay,
  removeItineraryDay,
  updateItinerary,
}) => {
  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
            <CalendarDays size={15} className="text-blue-600" />
            7. Day-wise Itinerary Configuration
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Describe day-by-day activities, sightseeing plan, and travel schedule.
          </p>
        </div>
        <button
          type="button"
          onClick={addItineraryDay}
          className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3.5 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer shadow-2xs"
        >
          <Plus size={13} /> Add Day
        </button>
      </div>

      <div className="space-y-3 pt-1">
        {itinerary.map((dayItem, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3 relative shadow-2xs"
          >
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-gray-200">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CalendarDays size={14} className="text-blue-600" /> Day {dayItem.day || index + 1}
              </span>

              {itinerary.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItineraryDay(index)}
                  className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                  title="Remove Day"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Day Title
                </label>
                <input
                  type="text"
                  placeholder={`e.g. Day ${index + 1}: Arrival & Leisure Tour`}
                  value={dayItem.title || ""}
                  onChange={(e) => updateItinerary(index, "title", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-slate-800 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Day Description / Plan
                </label>
                <textarea
                  rows="2"
                  placeholder="Detailed schedule of places visited, meals, transport pickup, and evening activities..."
                  value={dayItem.description || ""}
                  onChange={(e) => updateItinerary(index, "description", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayItineraryTab;
