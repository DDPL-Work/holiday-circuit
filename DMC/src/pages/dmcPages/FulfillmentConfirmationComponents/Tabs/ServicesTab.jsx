import React from "react";
import {
  BedDouble,
  CheckCircle,
  CheckCheck,
  FileText,
  AlertCircle,
  RefreshCw,
  Edit3,
  CarFront,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function ServicesTab({
  serviceCategoryTab,
  setServiceCategoryTab,
  availableCategoryTabs,
  categorizedServices,
  selectedQuery,
  getStarRatingDisplay,
  formatServiceDate,
  formatTimeAgo,
  getServiceVoucherStatusInfo,
  handleOpenVoucherModal,
  getServiceTagCommentsDisplay,
  handleOpenEditTagModal,
  formatServiceMoney,
  getResolvedServiceDisplayTotal,
  getServicePaymentStatusDisplay,
  totalServicesBookingCost,
}) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-0 mt-2 mb-6">
      {/* LEFT SIDEBAR CATEGORY SUB-TABS (Image 1 & 2 Style) */}
      <div className="w-full lg:w-48 shrink-0 bg-white border-r border-slate-200/80 self-stretch py-1 font-sans">
        <div className="flex lg:flex-col overflow-x-auto">
          <button
            type="button"
            onClick={() => setServiceCategoryTab("all")}
            className={`w-full text-left px-5 py-3.5 text-sm font-bold transition-all relative flex items-center justify-between cursor-pointer ${
              serviceCategoryTab === "all"
                ? "bg-slate-50 text-slate-900 border-r-4 border-r-blue-600 font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"
            }`}
          >
            <span>All Services</span>
          </button>
          {availableCategoryTabs.map((tab) => {
            const isActive = serviceCategoryTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setServiceCategoryTab(tab.id)}
                className={`w-full text-left px-5 py-3.5 text-sm font-bold transition-all relative flex items-center justify-between cursor-pointer ${
                  isActive
                    ? "bg-slate-50 text-slate-900 border-r-4 border-r-blue-600 font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT CONTENT PANEL */}
      <div className="flex-1 min-w-0 w-full pl-0 lg:pl-5 space-y-8 font-sans">
        {/* 1. HOTEL BOOKINGS SECTION */}
        {(serviceCategoryTab === "all" || serviceCategoryTab === "hotels") && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">
                Hotel Bookings
              </h3>
            </div>
            {categorizedServices.hotels.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 bg-white border border-slate-200/80 px-4 rounded-sm">
                No Hotel Bookings for this Trip.
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-sm overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-900">
                      <th className="py-2.5 px-4 w-[28%] font-semibold">
                        Hotel
                      </th>
                      <th className="py-2.5 px-4 w-[26%] font-semibold">
                        Stay and Services
                      </th>
                      <th className="py-2.5 px-4 w-[22%] font-semibold">
                        Status
                      </th>
                      <th className="py-2.5 px-4 w-[12%] font-semibold">
                        Tag/Comments
                      </th>
                      <th className="py-2.5 px-4 w-[12%] text-end font-semibold">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categorizedServices.hotels.map((service, idx) => (
                      <tr
                        key={service.referenceServiceKey || idx}
                        className="hover:bg-slate-50/50"
                      >
                        {/* Hotel info */}
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-[#0066cc] hover:underline text-xs flex items-center gap-1">
                              {service.serviceName}
                              <BedDouble
                                size={12}
                                className="text-blue-500 shrink-0"
                              />
                            </span>
                            <span className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                              {service.city ||
                                selectedQuery?.destination ||
                                selectedQuery?.destinationName ||
                                ""}
                              {getStarRatingDisplay(service, selectedQuery) ? (
                                <span className="text-amber-500 font-bold">
                                  {" • " +
                                    getStarRatingDisplay(
                                      service,
                                      selectedQuery,
                                    )}
                                </span>
                              ) : null}
                            </span>
                            <div className="mt-1 text-[11px]">
                              <span className="font-semibold text-slate-700">
                                CNF:{" "}
                              </span>
                              <span className="font-bold text-slate-900">
                                {service.confirmationNumber
                                  ? service.confirmationNumber
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>
                        {/* Stay and Services */}
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <span className="font-bold text-slate-900">
                              {formatServiceDate(service.resolvedServiceDate)}
                              {service.stayLabel
                                ? ` - ${service.stayLabel}`
                                : service.nights
                                  ? ` - ${service.nights} Night${service.nights > 1 ? "s" : ""}`
                                  : ""}
                            </span>
                            {/* Pax Summary Line */}
                            {(() => {
                              const adults = Number(service.adults ?? selectedQuery?.numberOfAdults ?? selectedQuery?.adults ?? 2);
                              const children = Number(service.children ?? selectedQuery?.numberOfChildren ?? selectedQuery?.children ?? 0);
                              const totalPax = adults + children;
                              const nights = Number(service.nights || 1);
                              return (
                                <div className="text-[11px] text-slate-500 font-medium">
                                  {nights} Night{nights > 1 ? "s" : ""} • {totalPax} Pax ({adults} Adult{adults > 1 ? "s" : ""}{children > 0 ? `, ${children} Child${children > 1 ? "ren" : ""}` : ""})
                                </div>
                              );
                            })()}
                            <div className="space-y-0.5 text-slate-600 text-[10.5px]">
                              <p>
                                {service.displayDescription ||
                                  service.description ||
                                  "Room Stay & Meals"}
                              </p>
                            </div>
                            {/* Normal Text: CAT, BED, TYPE */}
                            <div className="text-[10.5px] text-slate-500 font-normal mt-0.5">
                              <span className="font-semibold text-slate-700">CAT:</span> {service.roomCategory || "Double"} •{" "}
                              <span className="font-semibold text-slate-700">BED:</span> {service.bedType || "double"} •{" "}
                              <span className="font-semibold text-slate-700">TYPE:</span> {service.roomType || "Standard"}
                            </div>
                          </div>
                        </td>
                        {/* Status */}
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <div className="flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle
                                size={13}
                                className="text-emerald-600"
                              />
                              <span>
                                {service.status === "Confirmed"
                                  ? "Booked"
                                  : service.status || "Booked"}{" "}
                                <span className="text-slate-500 font-normal text-[10px]">
                                  {service.supplierName ||
                                    service.vendorName ||
                                    "Direct Hotel"}
                                </span>
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              by{" "}
                              {service.confirmedBy ||
                                selectedQuery?.confirmedBy ||
                                selectedQuery?.agentName ||
                                "Operations"}{" "}
                              •{" "}
                              {formatTimeAgo(
                                service.updatedAt ||
                                  selectedQuery?.updatedAt ||
                                  selectedQuery?.createdAt,
                              )}
                            </p>
                            {(() => {
                              const vInfo = getServiceVoucherStatusInfo(
                                service,
                                selectedQuery,
                              );
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenVoucherModal(service)}
                                  className={`inline-flex items-center gap-1.5 mt-1 font-bold text-[11px] cursor-pointer px-2.5 py-1 rounded border transition shadow-2xs whitespace-nowrap w-fit shrink-0 ${vInfo.bgClass}`}
                                >
                                  <FileText
                                    size={12}
                                    className={vInfo.isVouchered ? "text-emerald-600 shrink-0" : "text-slate-500 shrink-0"}
                                  />
                                  <span className={vInfo.isVouchered ? "text-emerald-400 text-[10px]" : "text-amber-400 text-[10px]"}>
                                    •
                                  </span>
                                  {vInfo.isVouchered ? (
                                    <CheckCheck
                                      size={13}
                                      className="text-emerald-600 shrink-0"
                                    />
                                  ) : (
                                    <AlertCircle
                                      size={12}
                                      className={`${vInfo.iconClass} shrink-0`}
                                    />
                                  )}
                                  <span
                                    className={`whitespace-nowrap font-bold ${vInfo.textClass}`}
                                  >
                                    {vInfo.label}
                                  </span>
                                  <span className={vInfo.isVouchered ? "text-emerald-400 text-[10px]" : "text-amber-400 text-[10px]"}>
                                    •
                                  </span>
                                  <RefreshCw
                                    size={11}
                                    className={vInfo.isVouchered ? "text-emerald-500 shrink-0" : "text-slate-400 shrink-0"}
                                  />
                                </button>
                              );
                            })()}
                          </div>
                        </td>
                        {/* Tag/Comments */}
                        <td className="py-3 px-4 align-top text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <span>
                              {getServiceTagCommentsDisplay(service)}
                            </span>
                            <Edit3
                              size={12}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0 transition-colors"
                              onClick={() => handleOpenEditTagModal(service)}
                              title="Edit Tag/Comments"
                            />
                          </div>
                        </td>
                        {/* Price */}
                        <td className="py-3 px-4 align-top text-end text-[11px]">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 text-slate-900 font-bold whitespace-nowrap">
                              <CheckCircle
                                size={12}
                                className="text-emerald-600 shrink-0"
                              />
                              <span>
                                Booking:{" "}
                                <span className="text-[10px] text-slate-500">
                                  INR
                                </span>{" "}
                                {formatServiceMoney(
                                  "INR",
                                  getResolvedServiceDisplayTotal(service),
                                ).replace(/[^0-9,.]/g, "")}
                              </span>
                            </div>
                            {(() => {
                              const payStatus = getServicePaymentStatusDisplay(
                                service,
                                selectedQuery,
                              );
                              return (
                                <div className="flex flex-col items-end gap-0.5">
                                  <span
                                    className={`${payStatus.colorClass} text-[10.5px] whitespace-nowrap`}
                                  >
                                    Amount Paid:{" "}
                                    <span className="text-[9px] font-normal">
                                      INR
                                    </span>{" "}
                                    {payStatus.paidText}
                                  </span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded border border-current font-extrabold uppercase whitespace-nowrap ${payStatus.colorClass}`}
                                  >
                                    {payStatus.statusBadge}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. OPERATIONAL SERVICES SECTION */}
        {(serviceCategoryTab === "all" ||
          serviceCategoryTab === "operational") && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">
                Operational Services
              </h3>
            </div>
            {categorizedServices.operational.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 bg-white border border-slate-200/80 px-4 rounded-sm">
                No Operational Services for this Trip.
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-sm overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-900">
                      <th className="py-2.5 px-4 w-[28%] font-semibold">
                        Service
                      </th>
                      <th className="py-2.5 px-4 w-[26%] font-semibold">
                        Date & Details
                      </th>
                      <th className="py-2.5 px-4 w-[22%] font-semibold">
                        Status
                      </th>
                      <th className="py-2.5 px-4 w-[12%] font-semibold">
                        Tag/Comments
                      </th>
                      <th className="py-2.5 px-4 w-[12%] text-end font-semibold">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categorizedServices.operational.map((service, idx) => (
                      <tr
                        key={service.referenceServiceKey || idx}
                        className="hover:bg-slate-50/50"
                      >
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="font-bold text-[#0066cc] hover:underline text-xs flex items-center gap-1 cursor-pointer"
                              onClick={() => handleOpenVoucherModal(service)}
                            >
                              {service.serviceName}
                              <CarFront
                                size={12}
                                className="text-amber-600 shrink-0"
                              />
                            </span>
                            <span className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                              {service.city ||
                                selectedQuery?.destination ||
                                "Transfer"}{" "}
                              •{" "}
                              {service.vehicleType ||
                                service.vehicle ||
                                service.displayQuantityLabel ||
                                service.unitLabel ||
                                "Vehicle"}
                            </span>

                            {(() => {
                              const vType = service.vehicleType || service.vehicle || service.displayQuantityLabel || service.unitLabel || "Vehicle";
                              const rawUsage = String(service.usageType || service.transferType || service.tripType || service.serviceMode || service.direction || "").trim();
                              let usageLabel = "";
                              if (rawUsage) {
                                const lowUsage = rawUsage.toLowerCase();
                                if (lowUsage.includes("point") || lowUsage.includes("oneway") || lowUsage.includes("one-way") || lowUsage.includes("one way")) {
                                  usageLabel = "One Way";
                                } else if (lowUsage.includes("round")) {
                                  usageLabel = "Round Trip";
                                } else if (lowUsage.includes("full") || lowUsage.includes("day")) {
                                  usageLabel = "Full Day Disposal";
                                } else if (lowUsage.includes("half")) {
                                  usageLabel = "Half Day Disposal";
                                } else {
                                  usageLabel = rawUsage;
                                }
                              } else {
                                usageLabel = "One Way Transfer";
                              }

                              let passCap = service.passengerCapacity || service.maxPassengers || service.maxPax || service.seatingCapacity || service.seats || null;
                              let luggCap = service.luggageCapacity || service.maxLuggage || service.luggage || service.baggageCapacity || service.bags || null;

                              if (!passCap) {
                                const vtLow = String(vType).toLowerCase();
                                if (vtLow.includes("sedan") || vtLow.includes("etios") || vtLow.includes("dzire") || vtLow.includes("car")) {
                                  passCap = "Max 4 Pax";
                                } else if (vtLow.includes("innova") || vtLow.includes("suv") || vtLow.includes("ertiga") || vtLow.includes("crysta")) {
                                  passCap = "Max 6 Pax";
                                } else if (vtLow.includes("tempo") || vtLow.includes("van") || vtLow.includes("minivan")) {
                                  passCap = "Max 12 Pax";
                                } else if (vtLow.includes("coach") || vtLow.includes("bus")) {
                                  passCap = "Max 25 Pax";
                                } else {
                                  passCap = "Max 4 Pax";
                                }
                              } else if (!String(passCap).toLowerCase().includes("pax")) {
                                passCap = `Max ${passCap} Pax`;
                              }

                              if (!luggCap) {
                                const vtLow = String(vType).toLowerCase();
                                if (vtLow.includes("sedan") || vtLow.includes("etios") || vtLow.includes("dzire") || vtLow.includes("car")) {
                                  luggCap = "2 Bags";
                                } else if (vtLow.includes("innova") || vtLow.includes("suv") || vtLow.includes("ertiga") || vtLow.includes("crysta")) {
                                  luggCap = "4 Bags";
                                } else if (vtLow.includes("tempo") || vtLow.includes("van") || vtLow.includes("minivan")) {
                                  luggCap = "8 Bags";
                                } else if (vtLow.includes("coach") || vtLow.includes("bus")) {
                                  luggCap = "20 Bags";
                                } else {
                                  luggCap = "2-3 Bags";
                                }
                              } else if (!String(luggCap).toLowerCase().includes("bag")) {
                                luggCap = `${luggCap} Bags`;
                              }

                              return (
                                <div className="flex flex-col gap-1 mt-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                      🚗 {usageLabel}
                                    </span>
                                    <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                      👥 {passCap}
                                    </span>
                                    <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                      🧳 {luggCap}
                                    </span>
                                  </div>
                                  {(service.pickupLocation || service.dropLocation) && (
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      📍 {service.pickupLocation || 'Pickup'} ➔ {service.dropLocation || 'Drop'}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}

                            <div className="mt-1 text-[11px]">
                              <span className="font-semibold text-slate-700">
                                CNF:{" "}
                              </span>
                              <span className="font-bold text-slate-900">
                                {service.confirmationNumber
                                  ? service.confirmationNumber
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <span className="font-bold text-slate-900">
                              {formatServiceDate(service.resolvedServiceDate)}
                              {service.stayLabel
                                ? ` - ${service.stayLabel}`
                                : service.days
                                  ? ` - ${service.days} Day${service.days > 1 ? "s" : ""}`
                                  : ""}
                            </span>
                            <div className="space-y-0.5 text-slate-600 text-[10.5px]">
                              <p>
                                {service.displayDescription ||
                                  service.description ||
                                  "Local Transfer"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <div className="flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle
                                size={13}
                                className="text-emerald-600"
                              />
                              <span>
                                {service.status === "Confirmed"
                                  ? "Booked"
                                  : service.status || "Booked"}{" "}
                                <span className="text-slate-500 font-normal text-[10px]">
                                  {service.supplierName ||
                                    service.vendorName ||
                                    "Cab Vendor"}
                                </span>
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              by{" "}
                              {service.confirmedBy ||
                                selectedQuery?.confirmedBy ||
                                selectedQuery?.agentName ||
                                "Operations"}{" "}
                              •{" "}
                              {formatTimeAgo(
                                service.updatedAt ||
                                  selectedQuery?.updatedAt ||
                                  selectedQuery?.createdAt,
                              )}
                            </p>
                            {(() => {
                              const vInfo = getServiceVoucherStatusInfo(
                                service,
                                selectedQuery,
                              );
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenVoucherModal(service)}
                                  className={`inline-flex items-center gap-1.5 mt-1 font-bold text-[11px] cursor-pointer px-2.5 py-1 rounded border transition shadow-2xs whitespace-nowrap w-fit shrink-0 ${vInfo.bgClass}`}
                                >
                                  <FileText
                                    size={12}
                                    className={vInfo.isVouchered ? "text-emerald-600 shrink-0" : "text-slate-500 shrink-0"}
                                  />
                                  <span className={vInfo.isVouchered ? "text-emerald-400 text-[10px]" : "text-amber-400 text-[10px]"}>
                                    •
                                  </span>
                                  {vInfo.isVouchered ? (
                                    <CheckCheck
                                      size={13}
                                      className="text-emerald-600 shrink-0"
                                    />
                                  ) : (
                                    <AlertCircle
                                      size={12}
                                      className={`${vInfo.iconClass} shrink-0`}
                                    />
                                  )}
                                  <span
                                    className={`whitespace-nowrap font-bold ${vInfo.textClass}`}
                                  >
                                    {vInfo.label}
                                  </span>
                                  <span className={vInfo.isVouchered ? "text-emerald-400 text-[10px]" : "text-amber-400 text-[10px]"}>
                                    •
                                  </span>
                                  <RefreshCw
                                    size={11}
                                    className={vInfo.isVouchered ? "text-emerald-500 shrink-0" : "text-slate-400 shrink-0"}
                                  />
                                </button>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <span>
                              {getServiceTagCommentsDisplay(service)}
                            </span>
                            <Edit3
                              size={12}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0 transition-colors"
                              onClick={() => handleOpenEditTagModal(service)}
                              title="Edit Tag/Comments"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top text-end text-[11px]">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 text-slate-900 font-bold whitespace-nowrap">
                              <CheckCircle
                                size={12}
                                className="text-emerald-600 shrink-0"
                              />
                              <span>
                                Booking:{" "}
                                <span className="text-[10px] text-slate-500">
                                  INR
                                </span>{" "}
                                {formatServiceMoney(
                                  "INR",
                                  getResolvedServiceDisplayTotal(service),
                                ).replace(/[^0-9,.]/g, "")}
                              </span>
                            </div>
                            {(() => {
                              const payStatus = getServicePaymentStatusDisplay(
                                service,
                                selectedQuery,
                              );
                              return (
                                <div className="flex flex-col items-end gap-0.5">
                                  <span
                                    className={`${payStatus.colorClass} text-[10.5px] whitespace-nowrap`}
                                  >
                                    Amount Paid:{" "}
                                    <span className="text-[9px] font-normal">
                                      INR
                                    </span>{" "}
                                    {payStatus.paidText}
                                  </span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded border border-current font-extrabold uppercase whitespace-nowrap ${payStatus.colorClass}`}
                                  >
                                    {payStatus.statusBadge}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. SIGHTSEEING SERVICES SECTION */}
        {(serviceCategoryTab === "all" ||
          serviceCategoryTab === "sightseeing") && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">
                Sightseeing Services
              </h3>
            </div>
            {categorizedServices.sightseeing.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 bg-white border border-slate-200/80 px-4 rounded-sm">
                No Sightseeing Services for this Trip.
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-sm overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-900">
                      <th className="py-2.5 px-4 w-[28%] font-semibold">
                        Sightseeing
                      </th>
                      <th className="py-2.5 px-4 w-[26%] font-semibold">
                        Date & Details
                      </th>
                      <th className="py-2.5 px-4 w-[22%] font-semibold">
                        Status
                      </th>
                      <th className="py-2.5 px-4 w-[12%] font-semibold">
                        Tag/Comments
                      </th>
                      <th className="py-2.5 px-4 w-[12%] text-end font-semibold">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categorizedServices.sightseeing.map((service, idx) => (
                      <tr
                        key={service.referenceServiceKey || idx}
                        className="hover:bg-slate-50/50"
                      >
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="font-bold text-[#0066cc] hover:underline text-xs flex items-center gap-1 cursor-pointer"
                              onClick={() => handleOpenVoucherModal(service)}
                            >
                              {service.serviceName}
                              <MapPin
                                size={12}
                                className="text-emerald-600 shrink-0"
                              />
                            </span>
                            <span className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                              {service.city ||
                                selectedQuery?.destination ||
                                "Sightseeing Tour"}{" "}
                              •{" "}
                              {service.duration ||
                                service.sightseeingType ||
                                service.tourType ||
                                service.unitLabel ||
                                "Tour"}
                            </span>
                            <div className="mt-1 text-[11px]">
                              <span className="font-semibold text-slate-700">
                                CNF:{" "}
                              </span>
                              <span className="font-bold text-slate-900">
                                {service.confirmationNumber
                                  ? service.confirmationNumber
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <span className="font-bold text-slate-900">
                              {formatServiceDate(service.resolvedServiceDate)}
                              {service.stayLabel
                                ? ` - ${service.stayLabel}`
                                : service.days
                                  ? ` - ${service.days} Day${service.days > 1 ? "s" : ""}`
                                  : ""}
                            </span>
                            <div className="space-y-0.5 text-slate-600 text-[10.5px]">
                              <p>
                                {service.displayDescription ||
                                  service.description ||
                                  "Full Day Sightseeing"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <div className="flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle
                                size={13}
                                className="text-emerald-600"
                              />
                              <span>
                                {service.status === "Confirmed"
                                  ? "Booked"
                                  : service.status || "Booked"}{" "}
                                <span className="text-slate-500 font-normal text-[10px]">
                                  {service.supplierName ||
                                    service.vendorName ||
                                    "Tour Guide"}
                                </span>
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              by{" "}
                              {service.confirmedBy ||
                                selectedQuery?.confirmedBy ||
                                selectedQuery?.agentName ||
                                "Operations"}{" "}
                              •{" "}
                              {formatTimeAgo(
                                service.updatedAt ||
                                  selectedQuery?.updatedAt ||
                                  selectedQuery?.createdAt,
                              )}
                            </p>
                            {(() => {
                              const vInfo = getServiceVoucherStatusInfo(
                                service,
                                selectedQuery,
                              );
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenVoucherModal(service)}
                                  className={`inline-flex items-center gap-1.5 mt-1 font-bold text-[11px] cursor-pointer px-2.5 py-1 rounded border transition shadow-2xs whitespace-nowrap w-fit shrink-0 ${vInfo.bgClass}`}
                                >
                                  <FileText
                                    size={12}
                                    className={vInfo.isVouchered ? "text-emerald-600 shrink-0" : "text-slate-500 shrink-0"}
                                  />
                                  <span className={vInfo.isVouchered ? "text-emerald-400 text-[10px]" : "text-amber-400 text-[10px]"}>
                                    •
                                  </span>
                                  {vInfo.isVouchered ? (
                                    <CheckCheck
                                      size={13}
                                      className="text-emerald-600 shrink-0"
                                    />
                                  ) : (
                                    <AlertCircle
                                      size={12}
                                      className={`${vInfo.iconClass} shrink-0`}
                                    />
                                  )}
                                  <span
                                    className={`whitespace-nowrap font-bold ${vInfo.textClass}`}
                                  >
                                    {vInfo.label}
                                  </span>
                                  <span className={vInfo.isVouchered ? "text-emerald-400 text-[10px]" : "text-amber-400 text-[10px]"}>
                                    •
                                  </span>
                                  <RefreshCw
                                    size={11}
                                    className={vInfo.isVouchered ? "text-emerald-500 shrink-0" : "text-slate-400 shrink-0"}
                                  />
                                </button>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <span>
                              {getServiceTagCommentsDisplay(service)}
                            </span>
                            <Edit3
                              size={12}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0 transition-colors"
                              onClick={() => handleOpenEditTagModal(service)}
                              title="Edit Tag/Comments"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top text-end text-[11px]">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 text-slate-900 font-bold whitespace-nowrap">
                              <CheckCircle
                                size={12}
                                className="text-emerald-600 shrink-0"
                              />
                              <span>
                                Booking:{" "}
                                <span className="text-[10px] text-slate-500">
                                  INR
                                </span>{" "}
                                {formatServiceMoney(
                                  "INR",
                                  getResolvedServiceDisplayTotal(service),
                                ).replace(/[^0-9,.]/g, "")}
                              </span>
                            </div>
                            {(() => {
                              const payStatus = getServicePaymentStatusDisplay(
                                service,
                                selectedQuery,
                              );
                              return (
                                <div className="flex flex-col items-end gap-0.5">
                                  <span
                                    className={`${payStatus.colorClass} text-[10.5px] whitespace-nowrap`}
                                  >
                                    Amount Paid:{" "}
                                    <span className="text-[9px] font-normal">
                                      INR
                                    </span>{" "}
                                    {payStatus.paidText}
                                  </span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded border border-current font-extrabold uppercase whitespace-nowrap ${payStatus.colorClass}`}
                                  >
                                    {payStatus.statusBadge}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. ACTIVITY BOOKINGS SECTION */}
        {(serviceCategoryTab === "all" ||
          serviceCategoryTab === "activities") && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">
                Activity Bookings
              </h3>
            </div>
            {categorizedServices.activities.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 bg-white border border-slate-200/80 px-4 rounded-sm">
                No Activity Bookings for this Trip.
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-sm overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-900">
                      <th className="py-2.5 px-4 w-[28%] font-semibold">
                        Activity
                      </th>
                      <th className="py-2.5 px-4 w-[26%] font-semibold">
                        Date & Details
                      </th>
                      <th className="py-2.5 px-4 w-[22%] font-semibold">
                        Status
                      </th>
                      <th className="py-2.5 px-4 w-[12%] font-semibold">
                        Tag/Comments
                      </th>
                      <th className="py-2.5 px-4 w-[12%] text-end font-semibold">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categorizedServices.activities.map((service, idx) => (
                      <tr
                        key={service.referenceServiceKey || idx}
                        className="hover:bg-slate-50/50"
                      >
                        {/* Activity Info with CNF */}
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="font-bold text-[#0066cc] hover:underline text-xs flex items-center gap-1 cursor-pointer"
                              onClick={() => handleOpenVoucherModal(service)}
                            >
                              {service.serviceName}
                              <Sparkles
                                size={12}
                                className="text-violet-600 shrink-0"
                              />
                            </span>
                            <span className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                              {service.city ||
                                selectedQuery?.destination ||
                                "Activity Pass"}{" "}
                              •{" "}
                              {service.duration ||
                                service.activityType ||
                                service.unitLabel ||
                                "Activity"}
                            </span>
                            <div className="mt-1 text-[11px]">
                              <span className="font-semibold text-slate-700">
                                CNF:{" "}
                              </span>
                              <span className="font-bold text-slate-900">
                                {service.confirmationNumber
                                  ? service.confirmationNumber
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <span className="font-bold text-slate-900">
                              {formatServiceDate(service.resolvedServiceDate)}
                              {service.stayLabel
                                ? ` - ${service.stayLabel}`
                                : service.days
                                  ? ` - ${service.days} Day${service.days > 1 ? "s" : ""}`
                                  : ""}
                            </span>
                            <div className="space-y-0.5 text-slate-600 text-[10.5px]">
                              <p>
                                {service.displayDescription ||
                                  service.description ||
                                  "Adventure Activity"}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Status */}
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <div className="flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle
                                size={13}
                                className="text-emerald-600"
                              />
                              <span>
                                {service.status === "Confirmed"
                                  ? "Booked"
                                  : service.status || "Booked"}{" "}
                                <span className="text-slate-500 font-normal text-[10px]">
                                  {service.supplierName ||
                                    service.vendorName ||
                                    "Activity Host"}
                                </span>
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              by{" "}
                              {service.confirmedBy ||
                                selectedQuery?.confirmedBy ||
                                selectedQuery?.agentName ||
                                "Operations"}{" "}
                              •{" "}
                              {formatTimeAgo(
                                service.updatedAt ||
                                  selectedQuery?.updatedAt ||
                                  selectedQuery?.createdAt,
                              )}
                            </p>
                            {(() => {
                              const vInfo = getServiceVoucherStatusInfo(
                                service,
                                selectedQuery,
                              );
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenVoucherModal(service)}
                                  className={`inline-flex items-center gap-1.5 mt-1 font-bold text-[11px] cursor-pointer px-2.5 py-1 rounded border transition shadow-2xs whitespace-nowrap w-fit shrink-0 ${vInfo.bgClass}`}
                                >
                                  <FileText
                                    size={12}
                                    className={vInfo.isVouchered ? "text-emerald-600 shrink-0" : "text-slate-500 shrink-0"}
                                  />
                                  <span className={vInfo.isVouchered ? "text-emerald-400 text-[10px]" : "text-amber-400 text-[10px]"}>
                                    •
                                  </span>
                                  {vInfo.isVouchered ? (
                                    <CheckCheck
                                      size={13}
                                      className="text-emerald-600 shrink-0"
                                    />
                                  ) : (
                                    <AlertCircle
                                      size={12}
                                      className={`${vInfo.iconClass} shrink-0`}
                                    />
                                  )}
                                  <span
                                    className={`whitespace-nowrap font-bold ${vInfo.textClass}`}
                                  >
                                    {vInfo.label}
                                  </span>
                                  <span className={vInfo.isVouchered ? "text-emerald-400 text-[10px]" : "text-amber-400 text-[10px]"}>
                                    •
                                  </span>
                                  <RefreshCw
                                    size={11}
                                    className={vInfo.isVouchered ? "text-emerald-500 shrink-0" : "text-slate-400 shrink-0"}
                                  />
                                </button>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <span>
                              {getServiceTagCommentsDisplay(service)}
                            </span>
                            <Edit3
                              size={12}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0 transition-colors"
                              onClick={() => handleOpenEditTagModal(service)}
                              title="Edit Tag/Comments"
                            />
                          </div>
                        </td>
                        {/* Price matching image */}
                        <td className="py-3 px-4 align-top text-end text-[11px]">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 text-slate-900 font-bold whitespace-nowrap">
                              <CheckCircle
                                size={12}
                                className="text-emerald-600 shrink-0"
                              />
                              <span>
                                Booking:{" "}
                                <span className="text-[10px] text-slate-500">
                                  INR
                                </span>{" "}
                                {formatServiceMoney(
                                  "INR",
                                  getResolvedServiceDisplayTotal(service),
                                ).replace(/[^0-9,.]/g, "")}
                              </span>
                            </div>
                            {(() => {
                              const payStatus = getServicePaymentStatusDisplay(
                                service,
                                selectedQuery,
                              );
                              return (
                                <div className="flex flex-col items-end gap-0.5">
                                  <span
                                    className={`${payStatus.colorClass} text-[10.5px] whitespace-nowrap`}
                                  >
                                    Amount Paid:{" "}
                                    <span className="text-[9px] font-normal">
                                      INR
                                    </span>{" "}
                                    {payStatus.paidText}
                                  </span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded border border-current font-extrabold uppercase whitespace-nowrap ${payStatus.colorClass}`}
                                  >
                                    {payStatus.statusBadge}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* BOTTOM SERVICES TOTAL SUMMARY CARD (Matching Image 2) */}
        <div className="flex justify-end mt-4 mb-2">
          <div className="bg-white border border-slate-200/90 shadow-2xs rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Total:</span>
            <span className="text-[10px] text-slate-400 font-medium">INR</span>
            <span className="text-base font-extrabold text-slate-900">
              {formatServiceMoney("INR", totalServicesBookingCost).replace(
                /[^0-9,.]/g,
                "",
              )}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-4 mt-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <FileText size={18} />
            </div>
            <div>
              <h4 className="font-bold text-xs">
                Service Confirmation & Voucher Vault
              </h4>
              <p className="text-[11px] text-slate-300">
                Click on any service's{" "}
                <span className="text-amber-400 font-bold">
                  Voucher Pending
                </span>{" "}
                or edit button above to generate and issue its voucher in the
                modal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
