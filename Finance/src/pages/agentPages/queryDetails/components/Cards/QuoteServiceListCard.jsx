import React from "react";
import {
  formatDisplayDate,
  formatServiceTypeLabel,
  getServiceDescriptionBits,
  getTransportUsageDisplayLabelForQuote,
} from "../../utils/queryDetailsHelpers";

const TRANSPORT_USAGE_LABELS = {
  "inter-hotel-transfer": "Inter Hotel Transfer",
  "one-way-airport-transfer": "One Way / Airport Transfer",
  "full-day": "Full Day",
  "half-day": "Half Day",
  "round-trip": "Round Trip",
  "point-to-point": "One Way / Airport Transfer",
};

const TRANSPORT_USAGE_LIMIT_LABELS = {
  "full-day-80-km": "80 km / 8 hours",
  "full-day-100-km": "100 km / 10 hours",
  "half-day-40-km": "40 km / 4 hours",
  "half-day-4-hours": "40 km / 4 hours",
};

const normalizeTransportUsageOptionKeyForQuote = (value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) return "";
  if (normalizedValue.includes("inter hotel") || normalizedValue.includes("inter-hotel")) return "inter-hotel-transfer";
  if (normalizedValue.includes("airport") || normalizedValue.includes("one way") || normalizedValue.includes("one-way")) return "one-way-airport-transfer";
  if (normalizedValue.includes("full")) return "full-day";
  if (normalizedValue.includes("half")) return "half-day";
  if (normalizedValue.includes("round") || normalizedValue.includes("two way")) return "round-trip";
  if (normalizedValue.includes("point")) return "point-to-point";
  return normalizedValue;
};

const getTransportLimitLabelForQuote = (service = {}) => {
  const optionKey = normalizeTransportUsageOptionKeyForQuote(
    service?.transportUsageOptionKey ||
    service?.transportUsageLabel ||
    service?.usageType,
  );
  const limitKeys = String(service?.transportUsageLimitOptionKey || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const explicitLimitLabel = limitKeys
    .map((key) => TRANSPORT_USAGE_LIMIT_LABELS[key])
    .filter(Boolean)[0];

  if (explicitLimitLabel) return explicitLimitLabel;
  if (TRANSPORT_USAGE_LIMIT_LABELS[optionKey]) return TRANSPORT_USAGE_LIMIT_LABELS[optionKey];

  if (optionKey === "full-day") return "80 km / 8 hours";
  if (optionKey === "half-day") return "40 km / 4 hours";

  return "";
};

const buildTransportQuotationNotes = (service = {}) => {
  const optionKey = normalizeTransportUsageOptionKeyForQuote(
    service?.transportUsageOptionKey ||
    service?.transportUsageLabel ||
    service?.usageType,
  );

  if (!["full-day", "half-day"].includes(optionKey)) return [];

  const usageLabel = getTransportUsageDisplayLabelForQuote(service);
  const limitLabel = getTransportLimitLabelForQuote(service);
  const extraKmRate = Number(service?.fullDayExtraPerKmRate || service?.halfDayExtraPerKmRate || service?.extraPerKmRate || 0);
  const notes = [];

  if (extraKmRate > 0) {
    notes.push({ type: "extraKm", text: `Extra km rate: ₹ ${extraKmRate.toLocaleString("en-IN")}/km.` });
  }

  if (limitLabel) {
    notes.push({ type: "limit", text: `Note: ${usageLabel} limit selected as ${limitLabel}. Extra km will attract extra charges where applicable.` });
  }

  return notes;
};

export const QuoteServiceListCard = ({ services = [] }) => (
  <div className="mb-4 rounded-xl border border-[#BEDBFF] bg-white p-3">
    <div className="mb-3 flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <h4 className="font-semibold text-sm text-gray-900">Selected Services</h4>
      <span className="ml-auto bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
        {services.length} item{services.length === 1 ? "" : "s"}
      </span>
    </div>

    <ul className="space-y-2">
      {services.length > 0 ? (
        services.map((service, idx) => {
          const descriptionBits = getServiceDescriptionBits(service.description);
          const serviceDateLabel = formatDisplayDate(service.serviceDate);
          const typeLabel = formatServiceTypeLabel(service.type);
          const serviceTheme =
            service.type === "hotel"
              ? {
                borderColor: "#3b82f6",
                iconBg: "bg-blue-100",
                iconStroke: "#2563eb",
                badgeClass: "bg-blue-100 text-blue-700",
                metaClass: "bg-blue-50 text-blue-700 border border-blue-200",
              }
              : service.type === "transfer"
                ? {
                  borderColor: "#10b981",
                  iconBg: "bg-green-100",
                  iconStroke: "#15803d",
                  badgeClass: "bg-green-100 text-green-800",
                  metaClass: "bg-green-50 text-green-700 border border-green-200",
                }
                : service.type === "activity"
                  ? {
                    borderColor: "#f59e0b",
                    iconBg: "bg-amber-100",
                    iconStroke: "#d97706",
                    badgeClass: "bg-amber-100 text-amber-800",
                    metaClass: "bg-amber-50 text-amber-700 border border-amber-200",
                  }
                  : {
                    borderColor: "#8b5cf6",
                    iconBg: "bg-violet-100",
                    iconStroke: "#7c3aed",
                    badgeClass: "bg-violet-100 text-violet-800",
                    metaClass: "bg-violet-50 text-violet-700 border border-violet-200",
                  };

          const detailBadges = [];
          const metaBadges = [typeLabel];

          if (service.type === "hotel") {
            if (Number(service.nights || 0) > 0) detailBadges.push(`${service.nights}N`);
            if (Number(service.rooms || 0) > 0) detailBadges.push(`${service.rooms}R`);
            if (service.roomType) detailBadges.push(service.roomType);
            if (service.bedType) detailBadges.push(`${service.bedType} bed`);
            if (Number(service.adults || 0) > 0) detailBadges.push(`${service.adults} Adult`);
            if (Number(service.children || 0) > 0) detailBadges.push(`${service.children} Child`);
          }

          if (service.type === "transfer") {
            if (service.vehicleType) detailBadges.push(service.vehicleType);
            if (Number(service.passengerCapacity || 0) > 0) detailBadges.push(`${service.passengerCapacity} Pax`);
            if (Number(service.luggageCapacity || 0) > 0) detailBadges.push(`${service.luggageCapacity} Luggage`);
            const usageDisplayLabel = getTransportUsageDisplayLabelForQuote(service);
            if (usageDisplayLabel) detailBadges.push(usageDisplayLabel);
            if (Number(service.days || 0) > 0) detailBadges.push(`${service.days} Day${Number(service.days) > 1 ? "s" : ""}`);
          }

          if (service.type === "activity" || service.type === "sightseeing") {
            if (Number(service.pax || 0) > 0) detailBadges.push(`${service.pax} Pax`);
            if (Number(service.days || 0) > 0) detailBadges.push(`${service.days} Day${Number(service.days) > 1 ? "s" : ""}`);
          }

          if (serviceDateLabel) metaBadges.push(serviceDateLabel);

          if (service.type === "hotel") metaBadges.push("Stay included");
          if (service.type === "transfer") metaBadges.push("Transfer included");
          if (service.type === "activity" || service.type === "sightseeing") metaBadges.push("Experience included");

          return (
            <li key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3" style={{ borderLeft: `3px solid ${serviceTheme.borderColor}` }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-lg ${serviceTheme.iconBg} flex items-center justify-center flex-shrink-0`}>
                    {service.type === "hotel" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={serviceTheme.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    ) : service.type === "transfer" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={serviceTheme.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
                      </svg>
                    ) : service.type === "activity" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={serviceTheme.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20" /><path d="M2 12h20" /><circle cx="12" cy="12" r="9" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={serviceTheme.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 16.77l-5.4 2.84 1.03-6.01L3.27 9.35l6.03-.88L12 3z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-gray-900 break-words">{service.title}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="text-[11px] text-gray-400 break-words">
                        {[service.city, service.country].filter(Boolean).join(", ") || "Location shared in quotation"}
                      </span>
                    </div>
                  </div>
                </div>
                {detailBadges.length > 0 && (
                  <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                    {detailBadges.slice(0, 3).map((badge, badgeIndex) => (
                      <span key={`${badge}-${badgeIndex}`} className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${serviceTheme.badgeClass}`}>
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {detailBadges.length > 3 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {detailBadges.slice(3).map((badge, badgeIndex) => (
                    <span key={`${badge}-${badgeIndex}`} className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${serviceTheme.badgeClass}`}>
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {metaBadges.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {metaBadges.map((badge, badgeIndex) => (
                    <span key={`${badge}-${badgeIndex}`} className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${serviceTheme.metaClass}`}>
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {descriptionBits.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {descriptionBits.map((bit, bitIndex) => (
                    <span key={`${bit}-${bitIndex}`} className="bg-white border border-gray-200 rounded px-2 py-0.5 text-[10px] text-gray-500">
                      {bit}
                    </span>
                  ))}
                </div>
              )}

              {/* Special transfer / activity rate and notes callout */}
              {(() => {
                const transportNotes = buildTransportQuotationNotes(service);
                const specNote = String(service?.note || service?.specialNote || service?.transferNotes || service?.remarks || "").trim();

                if (!transportNotes.length && !specNote) return null;

                return (
                  <div className="mt-2 space-y-1.5 rounded-lg border border-amber-200/90 bg-amber-50/80 p-2.5 text-xs">
                    {transportNotes.map((note, nIdx) => (
                      <p
                        key={nIdx}
                        className={
                          note.type === "extraKm"
                            ? "font-semibold text-amber-900"
                            : "font-semibold text-[#9A3412] leading-relaxed"
                        }
                      >
                        {note.text}
                      </p>
                    ))}
                    {specNote && !transportNotes.some((n) => n.text.includes(specNote)) && (
                      <p className="text-[11px] leading-relaxed text-amber-900">
                        <span className="font-semibold">Note:</span> {specNote}
                      </p>
                    )}
                  </div>
                );
              })()}
            </li>
          );
        })
      ) : (
        <li className="text-center py-4 text-xs text-gray-400">No services provided</li>
      )}
    </ul>
  </div>
);
