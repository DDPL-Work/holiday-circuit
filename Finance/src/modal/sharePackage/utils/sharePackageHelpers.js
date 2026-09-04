// Clean Dynamic Default Fallbacks
export const DEFAULT_SELLER_BANK_DETAILS = [];
export const GENERAL_TERMS_AND_CONDITIONS = [];
export const DEFAULT_INCLUSIONS = [];
export const DEFAULT_EXCLUSIONS = [];

export const toDisplayList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n|,|•/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const getPackageDurationDetails = (pkg = {}, query = {}) => {
  const startDate = query?.startDate ? new Date(query.startDate) : null;
  const endDate = query?.endDate ? new Date(query.endDate) : null;
  if (
    startDate &&
    endDate &&
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) &&
    endDate > startDate
  ) {
    const nights = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
    return {
      nights,
      days: nights + 1,
      label: `${nights} Nights / ${nights + 1} Days`,
    };
  }

  const rawDuration = String(pkg?.duration || query?.duration || "").trim();
  const nightsMatch = rawDuration.match(/(\d+)\s*(?:n|nights?)/i);
  const daysMatch = rawDuration.match(/(\d+)\s*(?:d|days?)/i);
  const nights = Number(nightsMatch?.[1] || pkg?.nights || pkg?.numberOfNights || query?.numberOfNights || query?.nights || 0);
  const days = Number(daysMatch?.[1] || pkg?.days || pkg?.numberOfDays || query?.numberOfDays || query?.days || 0);

  return {
    nights,
    days: days || (nights ? nights + 1 : 0),
    label: nights
      ? `${nights} Nights / ${days || nights + 1} Days`
      : (rawDuration || "Duration on Request"),
  };
};

export const getTransportUsageLabel = (transport = {}) => {
  const value = String(
    transport?.usageType ||
    transport?.usage ||
    transport?.transportUsageLabel ||
    transport?.transportUsageOptionKey ||
    transport?.transferType ||
    transport?.serviceType ||
    ""
  ).trim();
  const normalized = value.toLowerCase().replace(/[_\s]+/g, "-");
  const labels = {
    "one-way-airport-transfer": "One Way / Airport Transfer",
    "inter-hotel-transfer": "Inter Hotel Transfer",
    "full-day": "Full Day",
    "half-day": "Half Day",
    "round-trip": "Round Trip",
  };
  return labels[normalized] || value.replace(/-/g, " ");
};
