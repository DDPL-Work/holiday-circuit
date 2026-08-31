import React from "react";
import { CheckCircle2 } from "lucide-react";

export const InclusionsNotesTab = ({
  inclusions,
  setInclusions,
  exclusions,
  setExclusions,
}) => {
  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-600" />
            6. Package Inclusions & Exclusions
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Define default inclusions and exclusions shown on client vouchers & quotations.
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-1">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Package Inclusions (comma or newline separated)
          </label>
          <textarea
            rows="4"
            placeholder="e.g. Daily breakfast, Airport pickup & drop, Sightseeing transfers as per itinerary, All toll taxes & driver charges"
            value={inclusions}
            onChange={(e) => setInclusions(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Package Exclusions (comma or newline separated)
          </label>
          <textarea
            rows="4"
            placeholder="e.g. Airfare/Train fare, Personal expenses, Entry tickets not mentioned, GST, Laundry"
            value={exclusions}
            onChange={(e) => setExclusions(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
};

export default InclusionsNotesTab;
