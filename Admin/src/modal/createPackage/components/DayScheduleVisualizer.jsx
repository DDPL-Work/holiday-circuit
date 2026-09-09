import React from "react";
import { Calendar, AlertTriangle } from "lucide-react";

export function DayScheduleVisualizer({
  dayNum,
  scheduledItems = [],
  conflicts = [],
  // onShiftItemDay,
  // totalDays = 2,
}) {
  const itemsOnDay = scheduledItems.filter((it) => it.day === dayNum);
  const dayConflicts = conflicts.filter((c) => c.day === dayNum);
  const totalMins = itemsOnDay.reduce((sum, it) => sum + (it.durMins || 0), 0);
  const totalHrs = Math.round((totalMins / 60) * 10) / 10;

  if (dayConflicts.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-[#3E63DD] font-bold text-xs">
            <Calendar size={13} /> Day {dayNum}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Schedule Timing Conflict
              </h4>
              <span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                ⚠️ {dayConflicts.length} Conflict{dayConflicts.length > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Total Booked: <span className="font-semibold text-slate-700">{totalHrs} Hours</span> ({totalMins} mins scheduled) • Standard daylight capacity is 10 Hours
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {dayConflicts.map((c, cIdx) => (
          <div
            key={cIdx}
            className="rounded-lg border border-gray-200 bg-slate-50/50 p-3.5 space-y-2.5 text-xs shadow-2xs"
          >
            <div className="border-l-3 border-amber-500 pl-3 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                Conflict Reason:
              </p>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {c.detailedReason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DayScheduleVisualizer;
