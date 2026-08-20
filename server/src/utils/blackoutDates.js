import XLSX from "xlsx";

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
    const p = XLSX.SSF.parse_date_code(value);
    if (p && p.y && p.m && p.d) {
      return new Date(Date.UTC(p.y, p.m - 1, p.d));
    }
  }

  const text = String(value || "").trim();
  if (!text) return null;

  if (/^\d{5}$/.test(text)) {
    const p = XLSX.SSF.parse_date_code(Number(text));
    if (p && p.y && p.m && p.d) {
      return new Date(Date.UTC(p.y, p.m - 1, p.d));
    }
  }

  // Match YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    return new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
  }

  // Match DD-Mon-YYYY or DD/Mon/YYYY or DD Mon YYYY (e.g. 24-Dec-2026, 04-Jan-2027)
  const dayMonthYearDash = text.match(/^(\d{1,2})[-/\s]([a-zA-Z]+)[-/\s](\d{4})$/);
  if (dayMonthYearDash) {
    const month = MONTH_LOOKUP[dayMonthYearDash[2].toLowerCase()];
    if (month !== undefined) {
      return new Date(Date.UTC(Number(dayMonthYearDash[3]), month, Number(dayMonthYearDash[1])));
    }
  }

  // Match DDst Mon YYYY
  const dayMonthYear = text.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (dayMonthYear) {
    const month = MONTH_LOOKUP[dayMonthYear[2].toLowerCase()];
    if (month !== undefined) {
      return new Date(Date.UTC(Number(dayMonthYear[3]), month, Number(dayMonthYear[1])));
    }
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyy = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    return new Date(Date.UTC(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1])));
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
  return headers.findIndex((header) => {
    const norm = normalizeHeader(header);
    return normalizedCandidates.some((c) => norm === c || norm.includes(c));
  });
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

  const headerRowIndex = rows.findIndex((row = []) => {
    const cells = row.map(normalizeHeader);
    const hasDateOrName = cells.some((cell) =>
      cell.includes("blackout") || cell.includes("date") || cell.includes("occasion") || cell.includes("start date")
    );
    const hasCategoryOrRegion = cells.some((cell) =>
      cell.includes("region") || cell.includes("season") || cell.includes("category") || cell.includes("end date") || cell.includes("rate action")
    );
    return hasDateOrName && hasCategoryOrRegion;
  });

  if (headerRowIndex < 0) return [];

  const headers = rows[headerRowIndex] || [];
  const blackoutNameIndex = getColumnIndex(headers, ["Blackout Name", "Occasion", "Event", "Name"]);
  const startDateIndex = getColumnIndex(headers, ["Start Date", "Start", "Date From", "From Date"]);
  const endDateIndex = getColumnIndex(headers, ["End Date", "End", "Date To", "To Date"]);
  const legacyDateIndex = getColumnIndex(headers, ["Date / Period", "Date", "Period"]);
  const seasonIndex = getColumnIndex(headers, ["Season", "Season Name"]);
  const categoryIndex = getColumnIndex(headers, ["Category", "Type", "Occasion Type"]);
  const regionIndex = getColumnIndex(headers, ["Applicable Region", "Region", "Destination"]);
  const rateActionIndex = getColumnIndex(headers, ["Rate Action", "Action", "Rate Policy"]);

  return rows
    .slice(headerRowIndex + 1)
    .map((row, index) => {
      let startDate = null;
      let endDate = null;
      let rawPeriod = "";

      if (startDateIndex >= 0 && row?.[startDateIndex]) {
        startDate = normalizeDateOnly(row[startDateIndex]);
        if (endDateIndex >= 0 && row?.[endDateIndex]) {
          endDate = normalizeDateOnly(row[endDateIndex]) || startDate;
        } else {
          endDate = startDate;
        }
        const sKey = toDateKey(startDate);
        const eKey = toDateKey(endDate);
        rawPeriod = sKey && eKey && sKey !== eKey ? `${sKey} to ${eKey}` : sKey || "";
      } else if (legacyDateIndex >= 0 && row?.[legacyDateIndex]) {
        rawPeriod = String(row[legacyDateIndex] || "").trim();
        const parsed = parseDateText(rawPeriod);
        startDate = parsed.startDate;
        endDate = parsed.endDate || startDate;
      }

      if (!startDate || !endDate) return null;

      const nameVal = String(row?.[blackoutNameIndex] || "").trim();
      const seasonVal = seasonIndex >= 0 ? String(row?.[seasonIndex] || "").trim() : "";
      const categoryVal = categoryIndex >= 0 ? String(row?.[categoryIndex] || "").trim() : "";
      const regionVal = regionIndex >= 0 ? String(row?.[regionIndex] || "").trim() : "";
      const rateActionVal = rateActionIndex >= 0 ? String(row?.[rateActionIndex] || "").trim() : "Black Date Rate";

      return {
        rowNumber: headerRowIndex + index + 2,
        blackoutName: nameVal || "Blackout Event",
        occasion: nameVal || "Blackout Event",
        rawPeriod,
        startDate,
        endDate,
        startDateKey: toDateKey(startDate),
        endDateKey: toDateKey(endDate),
        season: seasonVal || "Season 1",
        category: categoryVal || "Festival",
        applicableRegion: regionVal || "All India & International",
        rateAction: rateActionVal || "Black Date Rate",
        sourceSheet: sheetName,
      };
    })
    .filter(Boolean);
};

const normalizeLocationText = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export const isRegionApplicable = ({ region = "", country = "", city = "", destination = "" }) => {
  const normalizedRegion = normalizeLocationText(region);
  if (!normalizedRegion || normalizedRegion.includes("all") || normalizedRegion.includes("international")) return true;

  const normalizedCountry = normalizeLocationText(country);
  const normalizedCity = normalizeLocationText(city);
  const normalizedDestination = normalizeLocationText(destination);

  if (normalizedRegion.includes("india")) {
    if (normalizedCountry === "india" || normalizedDestination.includes("india")) {
      const subTokens = normalizedRegion.split(/[/,&|]+/).map((t) => t.trim()).filter(Boolean);
      if (subTokens.some((t) => t.includes("all india") || t === "india")) return true;
      return [normalizedCountry, normalizedCity, normalizedDestination].some(
        (val) => val && (normalizedRegion.includes(val) || val.includes(normalizedRegion)),
      );
    }
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

  return (
    blackoutDates.find((item) => {
      const blackoutStart = normalizeDateOnly(item?.startDate || item?.startDateKey);
      const blackoutEnd = normalizeDateOnly(item?.endDate || item?.endDateKey || item?.startDate);
      if (!blackoutStart || !blackoutEnd) return false;
      if (
        !isRegionApplicable({
          region: item?.applicableRegion,
          country,
          city,
          destination,
        })
      ) {
        return false;
      }
      return blackoutStart <= normalizedEnd && blackoutEnd >= normalizedStart;
    }) || null
  );
};

export const formatBlackoutLabel = (blackout = null) => {
  if (!blackout) return "";
  const name = blackout.blackoutName || blackout.occasion || "";
  const period =
    blackout.startDateKey && blackout.endDateKey && blackout.startDateKey !== blackout.endDateKey
      ? `${blackout.startDateKey} to ${blackout.endDateKey}`
      : blackout.startDateKey || blackout.rawPeriod || "";
  return [period, name, blackout.season, blackout.category].filter(Boolean).join(" - ");
};


