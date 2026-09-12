import React from "react";

export const BasicDetailsTab = ({
  headerClientName,
  headerClientPhone,
  headerDestination,
  headerTravelDates,
  headerPaxSummary,
  headerDuration,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4 mb-6">
      <h3 className="text-base font-bold text-slate-900">Basic Booking Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
          <p className="text-slate-400 font-medium">Lead Passenger</p>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{headerClientName}</p>
          <p className="text-slate-500 mt-1">Phone: {headerClientPhone || "N/A"}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
          <p className="text-slate-400 font-medium">Destination</p>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{headerDestination}</p>
          <p className="text-slate-500 mt-1">Dates: {headerTravelDates}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
          <p className="text-slate-400 font-medium">PAX & Duration</p>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{headerPaxSummary}</p>
          <p className="text-slate-500 mt-1">Duration: {headerDuration || "N/A"}</p>
        </div>
      </div>
    </div>
  );
};
