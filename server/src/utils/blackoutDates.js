const MONTH_LOOKUP = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const toDateKey = (value) => {
  const date = normalizeDateOnly(value);
  return date ? date.toISOString().slice(0, 10) : "";
};

export const normalizeDateOnly = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(Math.round((value - 25569) * MS_PER_DAY));
    return Number.isNaN(date.getTime())
      ? null
      : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  const text = String(value || "").trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    return new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
  }

  const dayMonthYear = text.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (dayMonthYear) {
    const month = MONTH_LOOKUP[dayMonthYear[2].toLowerCase()];
    if (month !== undefined) {
      return new Date(Date.UTC(Number(dayMonthYear[3]), month, Number(dayMonthYear[1])));
    }
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
};

const parseDateText = (value) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return { startDate: null, endDate: null };

  const crossMonthRange = text.match(
    /^(\d{1,2})\s+([a-zA-Z]+)\s*[-–]\s*(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/,
  );
  if (crossMonthRange) {
    const [, startDay, startMonthName, endDay, endMonthName, endYear] = crossMonthRange;
    const startMonth = MONTH_LOOKUP[startMonthName.toLowerCase()];
    const endMonth = MONTH_LOOKUP[endMonthName.toLowerCase()];
    if (startMonth !== undefined && endMonth !== undefined) {
      const resolvedEndYear = Number(endYear);
      const resolvedStartYear = startMonth > endMonth ? resolvedEndYear - 1 : resolvedEndYear;
      return {
        startDate: new Date(Date.UTC(resolvedStartYear, startMonth, Number(startDay))),
        endDate: new Date(Date.UTC(resolvedEndYear, endMonth, Number(endDay))),
      };
    }
  }

  const compactSameMonthRange = text.match(
    /^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/,
  );
  if (compactSameMonthRange) {
    const [, startDay, endDay, monthName, year] = compactSameMonthRange;
    const month = MONTH_LOOKUP[monthName.toLowerCase()];
    if (month !== undefined) {
      return {
        startDate: new Date(Date.UTC(Number(year), month, Number(startDay))),
        endDate: new Date(Date.UTC(Number(year), month, Number(endDay))),
      };
    }
  }

  const dateParts = text
    .split(/\s+(?:to|till|until)\s+|\s*[-–]\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (dateParts.length >= 2) {
    const first = normalizeDateOnly(dateParts[0]);
    const second = normalizeDateOnly(dateParts.slice(1).join(" "));
    if (first && second) {
      return first <= second
        ? { startDate: first, endDate: second }
        : { startDate: second, endDate: first };
    }
  }

  const date = normalizeDateOnly(text);
  return { startDate: date, endDate: date };
};

const normalizeHeader = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getColumnIndex = (headers = [], candidates = []) => {
  const normalizedCandidates = candidates.map(normalizeHeader);
  return headers.findIndex((header) => normalizedCandidates.includes(normalizeHeader(header)));
};

export const parseBlackoutDatesFromWorkbook = (workbook) => {
  if (!workbook?.SheetNames?.length) return [];

  const sheetName = workbook.SheetNames.find((name) =>
    String(name || "").toLowerCase().includes("blackout"),
  );
  if (!sheetName) return [];

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
    raw: false,
  });

  const headerRowIndex = rows.findIndex((row = []) =>
    row.some((cell) => normalizeHeader(cell).includes("date")) &&
    row.some((cell) => normalizeHeader(cell).includes("occasion")),
  );
  if (headerRowIndex < 0) return [];

  const headers = rows[headerRowIndex] || [];
  const dateIndex = getColumnIndex(headers, ["Date / Period", "Date", "Period"]);
  const occasionIndex = getColumnIndex(headers, ["Occasion", "Event"]);
  const categoryIndex = getColumnIndex(headers, ["Category", "Type"]);
  const regionIndex = getColumnIndex(headers, ["Applicable Region", "Region"]);

  if (dateIndex < 0) return [];

  return rows
    .slice(headerRowIndex + 1)
    .map((row, index) => {
      const rawPeriod = row?.[dateIndex] || "";
      const { startDate, endDate } = parseDateText(rawPeriod);
      if (!startDate || !endDate) return null;

      return {
        rowNumber: headerRowIndex + index + 2,
        rawPeriod: String(rawPeriod || "").trim(),
        startDate,
        endDate,
        startDateKey: toDateKey(startDate),
        endDateKey: toDateKey(endDate),
        occasion: String(row?.[occasionIndex] || "").trim(),
        category: String(row?.[categoryIndex] || "").trim(),
        applicableRegion: String(row?.[regionIndex] || "").trim() || "All",
        sourceSheet: sheetName,
      };
    })
    .filter(Boolean);
};

const normalizeLocationText = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const isRegionApplicable = ({ region = "", country = "", city = "", destination = "" }) => {
  const normalizedRegion = normalizeLocationText(region);
  if (!normalizedRegion || normalizedRegion.includes("all")) return true;

  const normalizedCountry = normalizeLocationText(country);
  const normalizedCity = normalizeLocationText(city);
  const normalizedDestination = normalizeLocationText(destination);

  if (normalizedRegion.includes("india")) {
    return normalizedCountry === "india" || normalizedDestination.includes("india");
  }

  return [normalizedCountry, normalizedCity, normalizedDestination].some(
    (value) => value && (normalizedRegion.includes(value) || value.includes(normalizedRegion)),
  );
};

export const findBlackoutMatch = ({
  blackoutDates = [],
  travelStart,
  travelEnd,
  country = "",
  city = "",
  destination = "",
} = {}) => {
  const start = normalizeDateOnly(travelStart);
  const end = normalizeDateOnly(travelEnd || travelStart);
  if (!start || !end || !Array.isArray(blackoutDates) || !blackoutDates.length) return null;

  const normalizedStart = start <= end ? start : end;
  const normalizedEnd = start <= end ? end : start;

  return blackoutDates.find((item) => {
    const blackoutStart = normalizeDateOnly(item?.startDate || item?.startDateKey);
    const blackoutEnd = normalizeDateOnly(item?.endDate || item?.endDateKey || item?.startDate);
    if (!blackoutStart || !blackoutEnd) return false;
    if (!isRegionApplicable({
      region: item?.applicableRegion,
      country,
      city,
      destination,
    })) {
      return false;
    }
    return blackoutStart <= normalizedEnd && blackoutEnd >= normalizedStart;
  }) || null;
};

export const formatBlackoutLabel = (blackout = null) => {
  if (!blackout) return "";
  const period =
    blackout.startDateKey && blackout.endDateKey && blackout.startDateKey !== blackout.endDateKey
      ? `${blackout.startDateKey} to ${blackout.endDateKey}`
      : blackout.startDateKey || blackout.rawPeriod || "";
  return [period, blackout.occasion, blackout.category].filter(Boolean).join(" - ");
};

import XLSX from "xlsx";
