import React from "react";
import { Package } from "lucide-react";
import { POPULAR_DESTINATIONS } from "../utils/packageUtils.js";

export const BasicDetailsTab = ({
  title,
  setTitle,
  destination,
  setDestination,
  country,
  setCountry,
  duration,
  setDuration,
  days,
  setDays,
  description,
  setDescription,
}) => {
  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
            <Package size={15} className="text-[#3E63DD]" />
            1. Basic Package Information
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Select destination to automatically link contracted rates and services.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Package Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 5N/6D Mussoorie & Dhanaulti Hills Delight"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Destination <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Mussoorie, Goa, Dubai, Kashmir, Kerala"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
          />
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-gray-500 font-medium">Quick Select:</span>
            {POPULAR_DESTINATIONS.map((dest) => (
              <button
                key={dest}
                type="button"
                onClick={() => setDestination(dest)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                  destination.toLowerCase() === dest.toLowerCase()
                    ? "bg-[#3E63DD] text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200/80"
                }`}
              >
                {dest}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Country
          </label>
          <input
            type="text"
            placeholder="e.g. India, UAE, Thailand"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Duration Label
          </label>
          <input
            type="text"
            placeholder="e.g. 5 Nights / 6 Days"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Total Days (Number)
          </label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 6"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Package Description / Overview
          </label>
          <textarea
            rows="3"
            placeholder="Short overview of the holiday package, experience highlights, and key destination appeal..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicDetailsTab;
