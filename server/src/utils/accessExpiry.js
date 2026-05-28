const isDateOnlyString = (value = "") => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());

export const normalizeAccessExpiry = (value = "") => {
  if (!value) {
    return null;
  }

  const nextDate = value instanceof Date ? new Date(value) : new Date(String(value || "").trim());

  if (Number.isNaN(nextDate.getTime())) {
    return null;
  }

  const shouldUseEndOfDay =
    (typeof value === "string" && isDateOnlyString(value)) ||
    (nextDate.getHours() === 0 &&
      nextDate.getMinutes() === 0 &&
      nextDate.getSeconds() === 0 &&
      nextDate.getMilliseconds() === 0);

  if (shouldUseEndOfDay) {
    nextDate.setHours(23, 59, 59, 999);
  }

  return nextDate;
};

export const isAccessExpired = (value = "", referenceTime = Date.now()) => {
  const normalizedDeadline = normalizeAccessExpiry(value);
  if (!normalizedDeadline) {
    return false;
  }

  return normalizedDeadline.getTime() < Number(referenceTime || Date.now());
};
