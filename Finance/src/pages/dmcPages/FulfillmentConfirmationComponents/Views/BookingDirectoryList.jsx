import React from "react";
import {
  Package,
  FileText,
  ChevronRight,
  MapPin,
  CalendarDays,
  Users,
  ArrowRight,
} from "lucide-react";
import {
  STATUS_TABS,
  getOpsStatusBadge,
  formatServiceMoney,
} from "../utils/formatter";

export default function BookingDirectoryList({
  confirmedQueries,
  statusCounts,
  selectedStatusTab,
  setSelectedStatusTab,
  filteredQueries,
  selectedQueryId,
  handleOpenQueryDetail,
}) {
  return (
    <>
      {/* TOP HORIZONTAL HEADER */}
      <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Booking Confirmation Directory
          </h1>
          <p className="text-sm text-slate-500">
            DMC Partner: select any confirmed query to view full details and
            complete fulfillment entries
          </p>
        </div>
      </div>

      {/* TOP HORIZONTAL STATUS TABS BAR */}
      <div className="mb-5 bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2 px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0 shadow-xs">
              <Package size={15} />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Query Status Directory
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total {confirmedQueries.length} confirmed bookings available
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scroll">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = statusCounts[tab.key] || 0;
            const isActive = selectedStatusTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedStatusTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-[1.01]"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
              >
                <Icon
                  size={14}
                  className={isActive ? "text-blue-400" : "text-slate-400"}
                />
                <span>{tab.label}</span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* QUERY LIST TABLE VIEW (Image 2 Style) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {selectedStatusTab === "ALL"
                ? "All Bookings"
                : `${STATUS_TABS.find((t) => t.key === selectedStatusTab)?.label || selectedStatusTab}`}{" "}
              ({filteredQueries.length})
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Guest / PAX</th>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredQueries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-slate-400 font-medium"
                  >
                    No queries found for status "{selectedStatusTab.replace("_", " ")}".
                  </td>
                </tr>
              ) : (
                filteredQueries.map((query) => {
                  const isSelected = selectedQueryId === query._id;
                  const badge = getOpsStatusBadge(query.opsStatus, query);
                  const leadGuest =
                    query.travelerDetails?.[0]?.fullName ||
                    query.agentName ||
                    "Guest";
                  const formattedDate = query.startDate
                    ? new Date(query.startDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-";
                  const rawAllocatedTs =
                    query.allocatedAt ||
                    query.quotationCreatedAt ||
                    query.updatedAt ||
                    query.createdAt;
                  const allocatedDate = rawAllocatedTs
                    ? new Date(rawAllocatedTs).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-";
                  const displayPackagePrice = Number(
                    query.quotationTaxableAmount ||
                      query.packagePrice ||
                      query.clientTotalAmount ||
                      0,
                  );
                  return (
                    <tr
                      key={query._id}
                      onClick={() => handleOpenQueryDetail(query)}
                      className={`cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? "bg-blue-50/80 font-medium border-l-4 border-l-blue-600"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* ID Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenQueryDetail(query);
                          }}
                          className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 text-xs cursor-pointer"
                        >
                          <span>{query.queryId}</span>
                          <ChevronRight size={13} className="text-blue-500" />
                        </button>
                      </td>
                      {/* Source Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10.5px] font-bold text-slate-700">
                            {query.agentName || "DQ"}
                          </span>
                        </div>
                      </td>
                      {/* Details Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            <MapPin size={12} className="text-amber-600" />
                            {query.destination || "Destination"}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <CalendarDays size={11} className="text-blue-500" />
                            {formattedDate} • {query.duration || "N/A"}
                          </span>
                        </div>
                      </td>
                      {/* Guest / PAX Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                            {leadGuest}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Users size={11} className="text-slate-400" />
                            {query.passengers || 0} PAX ({query.numberOfAdults || 0}A
                            {query.numberOfChildren
                              ? `, ${query.numberOfChildren}C`
                              : ""}
                            )
                          </span>
                        </div>
                      </td>
                      {/* Package Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs">
                            {formatServiceMoney("INR", displayPackagePrice)}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Allocated {allocatedDate}
                          </span>
                        </div>
                      </td>
                      {/* Status Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] border ${badge.bgClass}`}
                        >
                          <span>{badge.icon}</span>
                        </span>
                      </td>
                      {/* Actions Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenQueryDetail(query);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs bg-slate-900 text-white hover:bg-blue-600 cursor-pointer"
                        >
                          <span>Active View</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
