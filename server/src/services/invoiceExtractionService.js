import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import sharp from "sharp";
import { createWorker } from "tesseract.js";

const execFileAsync = promisify(execFile);
const MONEY_TOLERANCE = 1;
const BASE_CURRENCY = "INR";
const CURRENCY_API_BASE_URL =
  process.env.CURRENCY_API_BASE_URL || "https://api.frankfurter.dev/v2";
const CURRENCY_RATE_CACHE_MS = 1000 * 60 * 30;
const currencyRateCache = new Map();

const normalizeText = (value = "") =>
  String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[|]+/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const normalizeAmount = (value) => {
  const cleaned = String(value || "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCurrency = (value = "") => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "";
  if (["₹", "RS", "RS.", "INR", "â‚¹", "Ã¢â€šÂ¹"].includes(normalized)) return "INR";
  if (["$", "USD", "US$"].includes(normalized)) return "USD";
  if (["AED", "د.إ"].includes(normalized)) return "AED";
  if (["€", "EUR"].includes(normalized)) return "EUR";
  if (["£", "GBP"].includes(normalized)) return "GBP";
  return normalized;
};

const amountsMatch = (left, right) =>
  Math.abs(Number(left || 0) - Number(right || 0)) <= MONEY_TOLERANCE;

const formatAmount = (value) => Math.round(Number(value || 0)).toLocaleString("en-IN");
const formatMoney = (value, currency = BASE_CURRENCY) =>
  `${normalizeCurrency(currency) || BASE_CURRENCY} ${formatAmount(value)}`;

const parseDateToIso = (value = "") => {
  const raw = String(value || "")
    .replace(/^[^\d\w]+|[^\d\w]+$/g, "")
    .trim();
  if (!raw) return "";

  // 1. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymd = raw.match(/\b(20\d{2}|19\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (ymd) {
    const [, year, month, day] = ymd;
    const m = Number(month);
    const d = Number(day);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  // 2. DD-MM-YYYY or MM-DD-YYYY with 4-digit year (e.g. 10-01-2025 or 4/9/2026)
  const dmy4 = raw.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2}|19\d{2})\b/);
  if (dmy4) {
    const [, firstPart, secondPart, year] = dmy4;
    const first = Number(firstPart);
    const second = Number(secondPart);
    const month = first <= 12 && second > 12 ? first : second;
    const day = first <= 12 && second > 12 ? second : first;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  // 3. 2-Digit Year: DD-MM-YY or MM-DD-YY (e.g. 10-01-25 or 4/9/26 or 10/01/25)
  const dmy2 = raw.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})\b/);
  if (dmy2) {
    const [, firstPart, secondPart, shortYear] = dmy2;
    const first = Number(firstPart);
    const second = Number(secondPart);
    const yNum = Number(shortYear);
    const fullYear = yNum <= 50 ? 2000 + yNum : 1900 + yNum;
    const month = first <= 12 && second > 12 ? first : second;
    const day = first <= 12 && second > 12 ? second : first;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${fullYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  // 4. Named Month: 06 July 2026 / 10 Jan 2025 / 10-Jan-25 / 10 January 2025 / 4th Sep 2026 / 31Jul2026
  const named = raw.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s*[-/,\s]?\s*([A-Za-z]{3,9})\s*[-/,\s]?\s*(20\d{2}|19\d{2}|\d{2})\b/i);
  if (named) {
    const [, day, monthName, yearPart] = named;
    const monthIndex = [
      "jan", "feb", "mar", "apr", "may", "jun",
      "jul", "aug", "sep", "oct", "nov", "dec",
    ].indexOf(monthName.slice(0, 3).toLowerCase());
    if (monthIndex >= 0) {
      const yNum = Number(yearPart);
      const fullYear = yearPart.length === 2 ? (yNum <= 50 ? 2000 + yNum : 1900 + yNum) : yNum;
      const d = Number(day);
      if (d >= 1 && d <= 31) {
        return `${fullYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
  }

  // 5. Month First: Jan 10, 2025 / January 10 2025 / Jan 10 25 / July 06 2026
  const namedMonthFirst = raw.match(/\b([A-Za-z]{3,9})\s*[-/,\s]?\s*(\d{1,2})(?:st|nd|rd|th)?\s*[-/,\s]?\s*(20\d{2}|19\d{2}|\d{2})\b/i);
  if (namedMonthFirst) {
    const [, monthName, day, yearPart] = namedMonthFirst;
    const monthIndex = [
      "jan", "feb", "mar", "apr", "may", "jun",
      "jul", "aug", "sep", "oct", "nov", "dec",
    ].indexOf(monthName.slice(0, 3).toLowerCase());
    if (monthIndex >= 0) {
      const yNum = Number(yearPart);
      const fullYear = yearPart.length === 2 ? (yNum <= 50 ? 2000 + yNum : 1900 + yNum) : yNum;
      const d = Number(day);
      if (d >= 1 && d <= 31) {
        return `${fullYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
  }

  return "";
};

const extractDateAfterLabels = (text = "", labels = []) => {
  const normalized = normalizeText(text);
  const lines = splitInvoiceTextLines(normalized);

  const DATE_REGEX =
    /(?:\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b|\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b|\b\d{1,2}(?:st|nd|rd|th)?\s*[-/,\s]?\s*[A-Za-z]{3,9}\s*[-/,\s]?\s*\d{2,4}\b|\b[A-Za-z]{3,9}\s*[-/,\s]?\s*\d{1,2}(?:st|nd|rd|th)?\s*[-/,\s]?\s*\d{2,4}\b)/i;

  // Phase 1: Search labeled lines (same line, same line + next line for 2-column/block layouts)
  for (const label of labels) {
    const labelPattern = new RegExp(`(?:#\\s*)?\\b${label}\\b`, "i");

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!labelPattern.test(line)) continue;

      const labelMatch = line.match(labelPattern);
      const textAfter = line.slice(labelMatch.index + labelMatch[0].length).trim();
      const nextLine = (lines[index + 1] || "").trim();
      const combined = `${textAfter} ${nextLine}`.trim();
      const combinedLine = `${line} ${nextLine}`.trim();

      // 1. Same line check
      const sameLineParsed = parseDateToIso(textAfter);
      if (sameLineParsed) return sameLineParsed;

      const sameLineMatch = textAfter.match(DATE_REGEX) || line.match(DATE_REGEX);
      if (sameLineMatch) {
        const parsed = parseDateToIso(sameLineMatch[0]);
        if (parsed) return parsed;
      }

      // 2. Combined with next line (handles e.g. "06 July \n 2026")
      if (combined) {
        const combinedParsed = parseDateToIso(combined);
        if (combinedParsed) return combinedParsed;

        const combinedMatch = combined.match(DATE_REGEX) || combinedLine.match(DATE_REGEX);
        if (combinedMatch) {
          const parsed = parseDateToIso(combinedMatch[0]);
          if (parsed) return parsed;
        }
      }

      // 3. Next line alone
      if (nextLine) {
        const nextLineParsed = parseDateToIso(nextLine);
        if (nextLineParsed) return nextLineParsed;

        const nextLineMatch = nextLine.match(DATE_REGEX);
        if (nextLineMatch) {
          const parsed = parseDateToIso(nextLineMatch[0]);
          if (parsed) return parsed;
        }
      }
    }
  }

  // Phase 2: Fallback - Search first 25 header lines for any valid date
  for (let i = 0; i < Math.min(lines.length, 25); i += 1) {
    const line = lines[i];
    if (/phone|contact|mobile|gstin|pan|pincode|pin|tel|hsn/i.test(line)) continue;
    const match = line.match(DATE_REGEX);
    if (match) {
      const parsed = parseDateToIso(match[0]);
      if (parsed) return parsed;
    }
    const nextLine = lines[i + 1] || "";
    const combined = `${line} ${nextLine}`.trim();
    const combinedMatch = combined.match(DATE_REGEX);
    if (combinedMatch) {
      const parsed = parseDateToIso(combinedMatch[0]);
      if (parsed) return parsed;
    }
  }

  return "";
};

const findAmountAfterLabelsLegacy = (text, labels = []) => {
  for (const label of labels) {
    const pattern = new RegExp(
      `${label}\\s*[:#-]?\\s*(?:INR|Rs\\.?|₹|USD|AED|EUR)?\\s*([0-9][0-9,]*(?:\\.\\d{1,2})?)\\b(?!\\s*%)`,
      "i",
    );
    const match = text.match(pattern);
    const amount = normalizeAmount(match?.[1]);
    if (amount > 0) return amount;
  }

  return 0;
};

const sumAmountsAfterLabelsLegacy = (text, labels = []) => {
  let total = 0;
  for (const label of labels) {
    const pattern = new RegExp(
      `${label}\\s*[:#-]?\\s*(?:INR|Rs\\.?|₹|USD|AED|EUR)?\\s*([0-9][0-9,]*(?:\\.\\d{1,2})?)\\b(?!\\s*%)`,
      "gi",
    );
    for (const match of text.matchAll(pattern)) {
      total += normalizeAmount(match?.[1]);
    }
  }
  return total;
};

const AMOUNT_PATTERN =
  /(?<![A-Za-z0-9])(?:INR|Rs\.?|₹|â‚¹|Ã¢â€šÂ¹|\$|USD|AED|EUR|GBP|THB|SGD|MYR|IDR|EGP|AUD)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?)(?![A-Za-z0-9%])/gi;

const getAmountsFromLine = (line = "") =>
  [...String(line || "").matchAll(AMOUNT_PATTERN)]
    .map((match) => normalizeAmount(match?.[1]))
    .filter((amount) => amount > 0);

const MONEY_TOKEN_PATTERN =
  /(?<![A-Za-z0-9])(?:(INR|Rs\.?|â‚¹|Ã¢â€šÂ¹|\$|USD|AED|EUR|GBP|THB|SGD|MYR|IDR|EGP|AUD)\s*)?([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?)(?![A-Za-z0-9%])/gi;

const getMoneyTokensFromLine = (line = "") =>
  [...String(line || "").matchAll(MONEY_TOKEN_PATTERN)]
    .map((match) => ({
      currency: normalizeCurrency(match?.[1]),
      amount: normalizeAmount(match?.[2]),
    }))
    .filter((token) => token.amount > 0);

const CURRENCY_AMOUNT_PATTERN =
  /(?<![A-Za-z0-9])(?:(INR|Rs\.?|Ã¢â€šÂ¹|ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹|\$|USD|AED|EUR|GBP|THB|SGD|MYR|IDR|EGP|AUD)\s*)+([+-]?\s*[0-9]{1,3}(?:,[0-9]{2,3})*(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?)(?![A-Za-z0-9%])/gi;

const splitInvoiceTextLines = (text = "") =>
  normalizeText(text).split(/\n+/).map((line) => line.trim()).filter(Boolean);

const getCurrencyAmountTokens = (text = "") =>
  splitInvoiceTextLines(text).flatMap((line, lineIndex) =>
    [...String(line || "").matchAll(CURRENCY_AMOUNT_PATTERN)]
      .map((match) => ({
        currency: normalizeCurrency(match?.[1]),
        amount: normalizeAmount(match?.[2]),
        line,
        lineIndex,
      }))
      .filter((token) => token.currency && Number.isFinite(token.amount) && token.amount !== 0),
  );

const inferLooseInvoiceAmounts = (text = "") => {
  const tokens = getCurrencyAmountTokens(text);
  const positiveTokens = tokens.filter((token) => token.amount > 0);
  if (!positiveTokens.length) {
    return { subtotal: 0, taxAmount: 0, grandTotal: 0, currency: "" };
  }

  const frequencyByAmount = new Map();
  positiveTokens.forEach((token) => {
    const key = token.amount.toFixed(2);
    const current = frequencyByAmount.get(key) || { amount: token.amount, count: 0, lastLineIndex: -1 };
    current.count += 1;
    current.lastLineIndex = Math.max(current.lastLineIndex, token.lineIndex);
    frequencyByAmount.set(key, current);
  });

  const frequentAmount = Array.from(frequencyByAmount.values())
    .sort((left, right) => right.count - left.count || right.lastLineIndex - left.lastLineIndex)[0]?.amount;
  const maxAmount = Math.max(...positiveTokens.map((token) => token.amount));
  const grandTotal = Math.round(frequentAmount || positiveTokens[positiveTokens.length - 1].amount || maxAmount);
  const subtotal = Math.round(maxAmount > grandTotal ? maxAmount : grandTotal);
  const taxAmount = subtotal < grandTotal ? Math.round(grandTotal - subtotal) : 0;

  return {
    subtotal,
    taxAmount,
    grandTotal,
    currency: positiveTokens.find((token) => token.currency)?.currency || "",
  };
};

const isDisclaimerOrNotesLine = (line = "") => {
  const lower = String(line || "").toLowerCase();
  return (
    lower.includes("income tax act") ||
    lower.includes("income tax rules") ||
    lower.includes("jurisdiction") ||
    lower.includes("interest @") ||
    lower.includes("per person") ||
    lower.includes("cash fully or partially") ||
    lower.includes("authorised signatory") ||
    lower.includes("computer generated") ||
    lower.includes("no signature required") ||
    lower.includes("bank info") ||
    lower.includes("ifsc -") ||
    lower.includes("ifsc code") ||
    lower.includes("account no") ||
    lower.includes("a/c payee") ||
    lower.includes("terms & conditions") ||
    lower.includes("subject to the jurisdiction") ||
    lower.includes("gst no") ||
    lower.includes("gst reg") ||
    lower.includes("gstin") ||
    lower.includes("pan no") ||
    lower.includes("p.a.no") ||
    lower.includes("cin -") ||
    lower.includes("cin no") ||
    lower.includes("state code") ||
    lower.includes("place of supply") ||
    lower.includes("txn no") ||
    lower.includes("x.o no") ||
    lower.includes("ticket no") ||
    lower.includes("flight details") ||
    lower.includes("passenger name") ||
    lower.includes("booking ref no") ||
    lower.includes("confirmation no")
  );
};

const findMoneyAfterLabels = (text, labels = []) => {
  const lines = splitInvoiceTextLines(text);

  for (const label of labels) {
    const labelPattern = new RegExp(`\\b${label}\\b`, "i");

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (isDisclaimerOrNotesLine(line) || !labelPattern.test(line)) continue;

      const labelMatch = line.match(labelPattern);
      const textAfterLabel = labelMatch ? line.slice(labelMatch.index + labelMatch[0].length) : line;
      const sameLineTokens = getMoneyTokensFromLine(textAfterLabel);
      if (sameLineTokens.length) {
        return sameLineTokens[sameLineTokens.length - 1];
      }

      const nextLine = lines[index + 1] || "";
      if (isDisclaimerOrNotesLine(nextLine)) continue;
      const nextLineLooksLikeAmountOnly =
        /^(?:INR|Rs\.?|â‚¹|Ã¢â€šÂ¹|\$|USD|AED|EUR|GBP|THB|SGD|MYR|IDR|EGP|AUD)?\s*[0-9][0-9,]*(?:\.\d{1,2})?\s*$/i.test(nextLine);
      if (nextLineLooksLikeAmountOnly) {
        const [nextToken] = getMoneyTokensFromLine(nextLine);
        if (nextToken?.amount > 0) return nextToken;
      }
    }
  }

  return { amount: findAmountAfterLabelsLegacy(text, labels), currency: "" };
};

const inferInvoiceCurrency = (text = "", moneyTokens = []) => {
  const explicitCurrency = moneyTokens.find((token) => token.currency)?.currency;
  if (explicitCurrency && explicitCurrency !== "USD") return explicitCurrency;

  const raw = String(text || "");
  const hasIndianContext = /gstin|cgst|sgst|igst|hsn|pincode|state\s*code|india|delhi|mumbai|pune|bengaluru|jaipur|₹|â‚¹|Ã¢â€šÂ¹|Rs\.?|INR/i.test(raw);
  if (hasIndianContext) return "INR";

  if (explicitCurrency) return explicitCurrency;
  if (/\b(?:USD|US\$)\b|\$/.test(raw)) return "USD";
  if (/\bAED\b|د\.إ/i.test(raw)) return "AED";
  if (/\bEUR\b|€/i.test(raw)) return "EUR";
  if (/\bGBP\b|£/i.test(raw)) return "GBP";
  return BASE_CURRENCY;
};

const normalizeExpectedCurrency = (summary = {}) =>
  normalizeCurrency(summary.currency || summary.baseCurrency || summary.expectedCurrency || BASE_CURRENCY) || BASE_CURRENCY;

const parseFrankfurterRate = (payload = {}, targetCurrency = BASE_CURRENCY) => {
  if (Array.isArray(payload)) {
    const row = payload.find(
      (item) => normalizeCurrency(item?.quote) === targetCurrency,
    );
    return {
      rate: Number(row?.rate || 0),
      date: row?.date || "",
    };
  }

  return {
    rate: Number(payload?.rates?.[targetCurrency] || 0),
    date: payload?.date || "",
  };
};

const fetchExchangeRate = async (sourceCurrency = "", targetCurrency = BASE_CURRENCY) => {
  const source = normalizeCurrency(sourceCurrency) || BASE_CURRENCY;
  const target = normalizeCurrency(targetCurrency) || BASE_CURRENCY;
  if (!source || !target || source === target) {
    return { rate: 1, source, target, provider: "same_currency", date: "" };
  }

  const cacheKey = `${source}:${target}`;
  const cached = currencyRateCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CURRENCY_RATE_CACHE_MS) {
    return cached.value;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  const url = `${CURRENCY_API_BASE_URL.replace(/\/+$/, "")}/rates?base=${encodeURIComponent(source)}&quotes=${encodeURIComponent(target)}`;

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Currency API returned ${response.status}`);
    }

    const payload = await response.json();
    const parsed = parseFrankfurterRate(payload, target);
    if (!Number.isFinite(parsed.rate) || parsed.rate <= 0) {
      throw new Error(`Currency API did not return ${source} to ${target} rate`);
    }

    const value = {
      rate: parsed.rate,
      source,
      target,
      provider: "frankfurter",
      date: parsed.date || "",
    };
    currencyRateCache.set(cacheKey, { cachedAt: Date.now(), value });
    return value;
  } catch (error) {
    return {
      rate: 0,
      source,
      target,
      provider: "frankfurter",
      date: "",
      error: error?.name === "AbortError"
        ? "Currency API request timed out"
        : error?.message || "Currency API request failed",
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

const convertFieldsToExpectedCurrency = async (fields = {}, expectedSummary = {}) => {
  const sourceCurrency = normalizeCurrency(fields.currency) || BASE_CURRENCY;
  const expectedCurrency = normalizeExpectedCurrency(expectedSummary);
  const originalAmounts = {
    subtotal: Number(fields.subtotal || 0),
    taxAmount: Number(fields.taxAmount || 0),
    grandTotal: Number(fields.grandTotal || 0),
  };
  const hasExtractedAmount =
    originalAmounts.subtotal > 0 ||
    originalAmounts.taxAmount > 0 ||
    originalAmounts.grandTotal > 0;

  if (!hasExtractedAmount || !sourceCurrency || sourceCurrency === expectedCurrency) {
    return {
      ...fields,
      currency: sourceCurrency || expectedCurrency,
      originalCurrency: sourceCurrency || expectedCurrency,
      convertedCurrency: expectedCurrency,
      originalAmounts,
      convertedAmounts: originalAmounts,
      exchangeRate: 1,
      conversionApplied: false,
    };
  }

  const exchangeRateResult = await fetchExchangeRate(sourceCurrency, expectedCurrency);
  const exchangeRate = Number(exchangeRateResult.rate || 0);

  if (!exchangeRate) {
    return {
      ...fields,
      currency: sourceCurrency,
      originalCurrency: sourceCurrency,
      convertedCurrency: expectedCurrency,
      originalAmounts,
      convertedAmounts: originalAmounts,
      exchangeRate: 0,
      exchangeRateProvider: exchangeRateResult.provider || "",
      exchangeRateError: exchangeRateResult.error || "",
      conversionApplied: false,
      conversionMissing: true,
    };
  }

  const convertedAmounts = {
    subtotal: Math.round(originalAmounts.subtotal * exchangeRate),
    taxAmount: Math.round(originalAmounts.taxAmount * exchangeRate),
    grandTotal: Math.round(originalAmounts.grandTotal * exchangeRate),
  };

  return {
    ...fields,
    subtotal: convertedAmounts.subtotal,
    taxAmount: convertedAmounts.taxAmount,
    grandTotal: convertedAmounts.grandTotal,
    currency: expectedCurrency,
    originalCurrency: sourceCurrency,
    convertedCurrency: expectedCurrency,
    originalAmounts,
    convertedAmounts,
    exchangeRate,
    exchangeRateProvider: exchangeRateResult.provider || "",
    exchangeRateDate: exchangeRateResult.date || "",
    conversionApplied: true,
  };
};

const findAmountAfterLabels = (text, labels = []) => {
  const lines = splitInvoiceTextLines(text);

  for (const label of labels) {
    const labelPattern = new RegExp(`\\b${label}\\b`, "i");

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (isDisclaimerOrNotesLine(line) || !labelPattern.test(line)) continue;

      const labelMatch = line.match(labelPattern);
      const textAfterLabel = labelMatch ? line.slice(labelMatch.index + labelMatch[0].length) : line;
      const sameLineAmounts = getAmountsFromLine(textAfterLabel);
      if (sameLineAmounts.length) {
        return sameLineAmounts[sameLineAmounts.length - 1];
      }

      const nextLine = lines[index + 1] || "";
      if (isDisclaimerOrNotesLine(nextLine)) continue;
      const nextLineLooksLikeAmountOnly =
        /^(?:INR|Rs\.?|₹|â‚¹|\$|USD|AED|EUR)?\s*[0-9][0-9,]*(?:\.\d{1,2})?\s*$/i.test(nextLine);
      if (nextLineLooksLikeAmountOnly) {
        const [nextAmount] = getAmountsFromLine(nextLine);
        if (nextAmount > 0) return nextAmount;
      }
    }
  }

  return findAmountAfterLabelsLegacy(text, labels);
};

const sumAmountsAfterLabels = (text, labels = []) => {
  let total = 0;
  const lines = splitInvoiceTextLines(text);

  for (const label of labels) {
    const labelPattern = new RegExp(`\\b${label}\\b`, "i");

    for (const line of lines) {
      if (isDisclaimerOrNotesLine(line) || !labelPattern.test(line)) continue;
      const labelMatch = line.match(labelPattern);
      const textAfterLabel = labelMatch ? line.slice(labelMatch.index + labelMatch[0].length) : line;
      const amounts = getAmountsFromLine(textAfterLabel);
      if (amounts.length) {
        total += amounts[amounts.length - 1];
      }
    }
  }

  return total || sumAmountsAfterLabelsLegacy(text, labels);
};

const INVALID_INVOICE_WORDS = new Set([
  "service",
  "services",
  "sightseeing",
  "hotel",
  "hotels",
  "transfer",
  "transfers",
  "activity",
  "activities",
  "transport",
  "location",
  "details",
  "date",
  "dates",
  "invoice",
  "invoices",
  "bill",
  "bills",
  "tax",
  "taxes",
  "gst",
  "vat",
  "customer",
  "client",
  "supplier",
  "vendor",
  "travel",
  "receipt",
  "payment",
  "payout",
  "note",
  "notes",
  "credit",
  "debit",
  "due",
  "terms",
  "description",
  "amount",
  "amounts",
  "total",
  "subtotal",
  "page",
  "original",
  "duplicate",
  "copy",
  "reference",
  "summary",
  "summery",
  "declaration",
  "signature",
  "contact",
  "phone",
  "email",
  "address",
  "name",
  "state",
]);

const isValidInvoiceNumberCandidate = (candidate = "") => {
  const cleaned = String(candidate || "")
    .replace(/^[#:\s,.-]+|[#:\s,.-]+$/g, "")
    .trim();
  if (!cleaned || cleaned.length < 1 || cleaned.length > 40) return false;
  const lower = cleaned.toLowerCase();
  if (INVALID_INVOICE_WORDS.has(lower)) return false;
  const hasDigit = /\d/.test(cleaned);
  const hasInvoicePrefix = /^(?:inv|bill|hc|tax|cn|dn|del|bom|blr|goa)[-_#]/i.test(cleaned);
  return hasDigit || hasInvoicePrefix;
};

const extractInvoiceNumber = (text) => {
  const lines = splitInvoiceTextLines(text);

  // Phase 1: High-priority labeled patterns (e.g. Invoice No DEL2608BS0037039, Txn No. : DEL-AS-26-G04739, Bill No: 1234)
  const HIGH_PRIORITY_PATTERNS = [
    /(?:invoice\s*no\.?|invoice\s*number|invoice\s*#|inv\s*no\.?|inv\s*#|bill\s*no\.?|bill\s*#|voucher\s*no\.?|document\s*no\.?|txn\s*no\.?|transaction\s*no\.?)\s*[:#-]?\s*([A-Z0-9\-_/]{3,35})\b/i,
    /\b(?:invoice|inv|bill|txn)\s*[:#-]\s*([A-Z0-9\-_/]{3,35})\b/i,
  ];

  for (const line of lines) {
    if (line.toLowerCase().includes("income tax act") || line.toLowerCase().includes("terms & conditions")) continue;
    for (const pattern of HIGH_PRIORITY_PATTERNS) {
      const match = line.match(pattern);
      if (match?.[1] && isValidInvoiceNumberCandidate(match[1])) {
        return match[1].replace(/^[#:\s,.-]+|[#:\s,.-]+$/g, "").trim();
      }
    }
  }

  // Phase 2: Look for line labeled with invoice
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.toLowerCase().includes("income tax act") || line.toLowerCase().includes("terms & conditions")) continue;

    // Skip generic document type titles alone on a line (e.g. "Payment Invoice", "Tax Invoice")
    if (/^(?:payment\s*invoice|tax\s*invoice|proforma\s*invoice|commercial\s*invoice|original\s*for\s*recipient|duplicate\s*copy)$/i.test(line.trim())) {
      continue;
    }

    const labelMatch = line.match(/(?:#\s*)?\b(?:invoice\s*no\.?|invoice\s*number|inv\s*no\.?|bill\s*no\.?|txn\s*no\.?|invoice|inv|bill)\b(?:\s*(?:number|no\.?|#))?/i);
    if (!labelMatch) continue;

    // Check same line
    const textAfter = line.slice(labelMatch.index + labelMatch[0].length).trim();
    if (textAfter) {
      const tokens = textAfter.split(/\s+/);
      for (const token of tokens) {
        const cleaned = token.replace(/^[#:\s,.-]+|[#:\s,.-]+$/g, "");
        if (isValidInvoiceNumberCandidate(cleaned)) {
          return cleaned;
        }
      }
    }

    // Check next line for vertical / block layouts (e.g. INVOICE \n 1045 or Txn No. \n DEL-AS-26-G04739)
    // Only if next line is not an agency name / address (e.g. "RSDEL0401058 - LEELA TRAVELS")
    const nextLine = lines[i + 1] || "";
    if (nextLine && !nextLine.toLowerCase().includes("income tax act") && !nextLine.includes(" - ") && !/travel|tours|agency|pvt|ltd|hotel/i.test(nextLine)) {
      const nextTokens = nextLine.split(/\s+/);
      for (const token of nextTokens) {
        const cleaned = token.replace(/^[#:\s,.-]+|[#:\s,.-]+$/g, "");
        if (isValidInvoiceNumberCandidate(cleaned)) {
          return cleaned;
        }
      }
    }
  }

  // Fallback pattern search
  const fallbackMatches = text.match(/\b(?:INV|BILL|HC|MMT|DEL|BOM|BLR|GOA)[-_/][A-Z0-9-_/]{1,30}\b/gi);
  if (fallbackMatches && fallbackMatches.length > 0) {
    for (const match of fallbackMatches) {
      if (isValidInvoiceNumberCandidate(match)) {
        return match.trim();
      }
    }
  }

  return "";
};

const KNOWN_PARTNER_BRANDS = [
  { match: /\b(?:tbo\s*tek\s*(?:limited|ltd)|tbo\s*tek|tek\s*travels|travel\s*boutique\s*online|tbo\s*holidays|tbo)\b/i, partnerName: "TBO Tek Limited", name: "TBO Tek Limited" },
  { match: /\b(?:trip\s*jack|tripjack|techzone\s*travels)\b/i, partnerName: "TRIP JACK Private Limited", name: "TRIP JACK Private Limited" },
  { match: /\b(?:makemytrip|make\s*my\s*trip|mmt)\b/i, partnerName: "MakeMyTrip India Pvt Ltd", name: "MakeMyTrip India Pvt Ltd" },
  { match: /\b(?:yatra\.com|yatra)\b/i, partnerName: "Yatra Online Limited", name: "Yatra Online Limited" },
  { match: /\b(?:agoda)\b/i, partnerName: "Agoda Company Pte Ltd", name: "Agoda" },
  { match: /\b(?:booking\.com|booking\s*dot\s*com)\b/i, partnerName: "Booking.com", name: "Booking.com" },
  { match: /\b(?:bhasin\s*travels|bhasin)\b/i, partnerName: "BHASIN TRAVELS ONLINE PRIVATE LIMITED", name: "BHASIN TRAVELS ONLINE PRIVATE LIMITED" },
  { match: /\b(?:riya\s*travel|riva\s*travel|riya\s*connect|riya)\b/i, partnerName: "Riya Travel & Tours (India) Pvt Ltd", name: "Riya Travel & Tours (India) Pvt Ltd" },
  { match: /\b(?:expedia)\b/i, partnerName: "Expedia", name: "Expedia" },
  { match: /\b(?:easemytrip|ease\s*my\s*trip|easy\s*trip\s*planners)\b/i, partnerName: "Easy Trip Planners Ltd", name: "EaseMyTrip" },
  { match: /\b(?:cleartrip|clear\s*trip)\b/i, partnerName: "Cleartrip Private Limited", name: "Cleartrip" },
  { match: /\b(?:goibibo|go\s*ibibo)\b/i, partnerName: "Goibibo", name: "Goibibo" },
  { match: /\b(?:hotelbeds)\b/i, partnerName: "Hotelbeds", name: "Hotelbeds" },
  { match: /\b(?:akbar\s*travels|akbar)\b/i, partnerName: "Akbar Online Booking Co. Pvt. Ltd.", name: "Akbar Travels" },
  { match: /\b(?:fly24hrs)\b/i, partnerName: "Fly24hrs Holiday Pvt. Ltd.", name: "Fly24hrs" },
];

const GENERIC_IGNORE_TITLES =
  /^(?:invoice|tax\s*invoice|payment\s*invoice|proforma\s*invoice|commercial\s*invoice|original\s*for\s*recipient|duplicate\s*copy|bill|receipt|voucher|statement|summary|original|duplicate|triplicate)$/i;

const COMPANY_ENTITY_REGEX =
  /\b([A-Za-z0-9&.' -]{2,60}?\s*(?:Pvt\.?\s*Ltd\.?|Private\s*Limited|Limited|Ltd\.?|LLP|Inc\.?))\b/i;

const cleanBuyerFromSupplierName = (nameStr = "") => {
  let cleaned = String(nameStr || "").trim();
  // Strip "To" and recipient/buyer agency column if extracted together
  cleaned = cleaned.replace(/\s+\b(?:to\b|billed\s+to|customer|buyer|client|guest|pax)\s*[:#-]?\s*.*$/i, "");
  cleaned = cleaned.replace(/\s+(?:leela\s*travels|holiday\s*circuit|travel\s*agency).*$/i, "");
  return cleaned.trim();
};

const extractSupplierAndPartner = (text = "") => {
  const normalized = normalizeText(text);
  const lines = splitInvoiceTextLines(normalized);

  // 1. Check if an exact registered company name appears in the top header lines (top 15 lines)
  // e.g. "TBO Tek Limited", "MakeMyTrip India Pvt Ltd", "Yatra Online Limited"
  for (let i = 0; i < Math.min(lines.length, 15); i += 1) {
    const line = lines[i];
    if (GENERIC_IGNORE_TITLES.test(line)) continue;
    if (/payment\s*invoice|tax\s*invoice|proforma|gst\s*reg|pan\s*no|cin\s*no|cin\s*number|date|phone|email:|web:|regd\s*office|corp\s*off|place\s*of\s*supply/i.test(line)) continue;

    // Check if line contains a company entity (e.g. "TBO Tek Limited", "XYZ Pvt Ltd")
    const entityMatch = line.match(COMPANY_ENTITY_REGEX);
    if (entityMatch?.[1]) {
      const candidate = cleanBuyerFromSupplierName(entityMatch[1].trim());
      if (
        candidate.length >= 3 &&
        candidate.length <= 70 &&
        !GENERIC_IGNORE_TITLES.test(candidate) &&
        !/^(?:to|customer|billed\s*to|buyer|guest|pax|leela\s*travels|holiday\s*circuit|owner's\s*name)/i.test(candidate)
      ) {
        return { supplierName: candidate, partnerName: candidate };
      }
    }

    if (/(?:travels|tours|holidays|hotel|resort|dmc)\b/i.test(line)) {
      const cleaned = cleanBuyerFromSupplierName(line);
      if (
        cleaned.length >= 3 &&
        cleaned.length <= 70 &&
        !GENERIC_IGNORE_TITLES.test(cleaned) &&
        !/^(?:to|customer|billed\s*to|buyer|guest|pax|leela\s*travels|holiday\s*circuit|owner's\s*name)/i.test(cleaned)
      ) {
        return { supplierName: cleaned, partnerName: cleaned };
      }
    }
  }

  // 2. Check explicit supplier / vendor labels
  const patterns = [
    /(?:supplier|vendor|billed\s+by|from)\s*(?:name)?\s*[:#-]\s*([^\n]{3,80})/i,
    /(?:dmc\s*\/\s*supplier|supplier\s*name|vendor\s*name)\s*\n\s*([^\n]{3,80})/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const name = cleanBuyerFromSupplierName(match[1].replace(/\s{2,}/g, " ").trim());
      if (
        name.length >= 3 &&
        !GENERIC_IGNORE_TITLES.test(name) &&
        !/^(?:to|customer|billed\s*to|buyer|guest|pax|leela\s*travels|holiday\s*circuit|owner's\s*name)/i.test(name)
      ) {
        return { supplierName: name, partnerName: name };
      }
    }
  }

  // 3. Fallback: Check known brands anywhere in top 25 lines
  const topText = lines.slice(0, 25).join(" ");
  for (const brand of KNOWN_PARTNER_BRANDS) {
    if (brand.match.test(topText)) {
      return {
        supplierName: brand.partnerName || brand.name,
        partnerName: brand.partnerName || brand.name,
      };
    }
  }

  const defaultFirstLine =
    lines[0] && lines[0].length > 3 && lines[0].length < 60 && !GENERIC_IGNORE_TITLES.test(lines[0])
      ? cleanBuyerFromSupplierName(lines[0])
      : "";
  return { supplierName: defaultFirstLine, partnerName: defaultFirstLine };
};

const extractSupplierName = (text) => extractSupplierAndPartner(text).supplierName;

const inferGrandTotal = (text) => {
  const candidates = [];
  const totalLinePattern = /(?:grand\s*total|total\s*due|total\s*amount|amount\s*payable|net\s*payable|invoice\s*total|\(\+\)\s*total|total)[^\n]{0,80}/gi;

  for (const lineMatch of text.matchAll(totalLinePattern)) {
    const line = lineMatch[0];
    if (isDisclaimerOrNotesLine(line)) continue;
    for (const amountMatch of line.matchAll(/(?:INR|Rs\.?|₹|USD|AED|EUR)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)\b(?!\s*%)/gi)) {
      const amount = normalizeAmount(amountMatch[1]);
      if (amount > 0) candidates.push(amount);
    }
  }

  return candidates.length ? Math.max(...candidates) : 0;
};

const extractTableSummary = (text = "") => {
  const lines = splitInvoiceTextLines(text);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (isDisclaimerOrNotesLine(line)) continue;

    // Pattern 1: "Total 58,440.00 29,692.00 88,132.00" or "Total 58,440.00 29,692.00"
    const m1 = line.match(
      /^\s*(?:Total|Subtotal|Gross\s*Total|Table\s*Total|Summary\s*Total)\s+([0-9,]+(?:\.\d{1,2})?)\s+([0-9,]+(?:\.\d{1,2})?)(?:\s+([0-9,]+(?:\.\d{1,2})?))?/i,
    );
    if (m1) {
      const a = normalizeAmount(m1[1]);
      const b = normalizeAmount(m1[2]);
      const c = m1[3] ? normalizeAmount(m1[3]) : Math.round(a + b);
      if (a > 0 && b >= 0) {
        return { subtotal: a, tax: b, total: c };
      }
    }

    // Pattern 2: "58,440.00 29,692.00 88,132.00 Total" or "58,440.00 29,692.00 Total"
    const m2 = line.match(
      /^([0-9,]+(?:\.\d{1,2})?)\s+([0-9,]+(?:\.\d{1,2})?)(?:\s+([0-9,]+(?:\.\d{1,2})?))?\s+(?:Total|Subtotal|Sum)$/i,
    );
    if (m2) {
      const a = normalizeAmount(m2[1]);
      const b = normalizeAmount(m2[2]);
      const c = m2[3] ? normalizeAmount(m2[3]) : Math.round(a + b);
      if (a > 0 && b >= 0) {
        return { subtotal: a, tax: b, total: c };
      }
    }

    // Pattern 3: Line containing 2 or 3 amounts and "Total" or "Subtotal"
    const amounts = getAmountsFromLine(line);
    if (amounts.length >= 2 && /\b(?:total|subtotal)\b/i.test(line)) {
      const a = amounts[0];
      const b = amounts[1];
      const c = amounts[2] || Math.round(a + b);
      if (a > 0 && b >= 0) {
        return { subtotal: a, tax: b, total: c };
      }
    }
  }

  return { subtotal: 0, tax: 0, total: 0 };
};

// Clean Rupee symbol glitches from OCR text (e.g. "Net Amount 21,29,434.32" -> "Net Amount: 1,29,434.32")
const sanitizeOcrRupeeArtifacts = (rawText = "") => {
  let text = String(rawText || "");

  // Fix OCR misrecognizing Rupee symbol ₹ as 2 before standard amounts (e.g. 21,29,434.32 -> 1,29,434.32)
  text = text.replace(
    /(?:Net\s*Amount|Amount\s*Payable|Total\s*Due|Grand\s*Total|Invoice\s*Total)\s*[:\s]*2([1-9][0-9]{0,2}(?:,[0-9]{2,3})*(?:\.\d{1,2})?)/gi,
    (match, num) => `Net Amount: ${num}`,
  );

  text = text.replace(
    /(?:Total|Gross|Basic)\s*[:\s]*2([1-9][0-9]{0,2}(?:,[0-9]{2,3})*(?:\.\d{1,2})?)/gi,
    (match, num) => `Total: ${num}`,
  );

  return text;
};

export const extractInvoiceFieldsFromText = (text = "") => {
  const normalized = sanitizeOcrRupeeArtifacts(normalizeText(text));
  const subtotalLabels = [
    "gross",
    "gross\\s*amount",
    "basic",
    "basic\\s*amount",
    "basic\\s*fare",
    "base\\s*fare",
    "fare",
    "hotel\\s*charges",
    "room\\s*charges",
    "package\\s*amount",
    "sub\\s*total",
    "subtotal",
    "taxable\\s*value",
    "taxable\\s*amount",
    "base\\s*amount",
    "total\\s*amount\\s*before\\s*tax",
  ];
  const taxLabels = [
    "flight\\s*tds\\s*deducted",
    "tds\\s*deducted",
    "management\\s*fee\\s*gst",
    "total\\s*tax",
    "tax\\s*amount",
    "gst\\s*amount",
    "vat\\s*amount",
    "igst",
    "cgst",
    "sgst",
    "gst\\s*tax",
    "vat\\s*tax",
    "tcs",
    "taxes\\s*\\/\\s*yq",
    "taxes\\s*\\/\\s*tax",
    "tax\\s*\\(inr\\)",
    "tax\\s*\\(₹\\)",
    "tax\\s*:",
    "tax\\s*=",
    "(?<!income\\s*)(?<!service\\s*)tax(?!\\s*act)(?!\\s*law)(?!\\s*exemption)(?!\\s*invoice)(?!\\s*reg)(?!\\s*no)",
  ];
  const grandTotalLabels = [
    "net\\s*amount",
    "net\\s*payable",
    "total\\s*due\\s*\\(inr\\)",
    "total\\s*due",
    "amount\\s*payable",
    "grand\\s*total",
    "total\\s*amount",
    "invoice\\s*total",
    "total\\s*value(?:\\s*\\([^)]*\\))?",
    "final\\s*amount",
    "net\\s*total",
    "(?<!line\\s+)(?<!sub\\s*)(?<!@\\s*\\d+%\\s*)total(?!\s*@)",
    "payment\\s*status",
    "total\\s*amount\\s*paid",
    "amount\\s*paid",
    "balance\\s*due",
  ];

  // 1. Detect table summary row (e.g., "58,440.00 29,692.00 Total" or "Total 58,440.00 29,692.00 88,132.00")
  const tableSummary = extractTableSummary(normalized);
  const tableSubtotal = tableSummary.subtotal;
  const tableTax = tableSummary.tax;
  const tableSum = tableSummary.total;

  const subtotalToken = findMoneyAfterLabels(normalized, subtotalLabels);
  const taxToken = findMoneyAfterLabels(normalized, taxLabels);
  const grandTotalToken = findMoneyAfterLabels(normalized, grandTotalLabels);
  const looseAmounts = inferLooseInvoiceAmounts(normalized);

  let subtotal = tableSubtotal || subtotalToken.amount || findAmountAfterLabels(normalized, subtotalLabels);
  let explicitTax = (tableTax > 0 ? tableTax : null) ?? (taxToken.amount || findAmountAfterLabels(normalized, taxLabels));
  const componentTax = sumAmountsAfterLabels(normalized, [
    "igst",
    "cgst",
    "sgst",
    "vat",
    "tcs",
    "tds",
  ]);

  // Check explicit 0 tax cases (e.g. Tax 0.00, TDS Amount 0.00)
  if (
    /\bTax\s+0(?:\.00)?\b/i.test(normalized) ||
    /\bTax\s*:\s*0(?:\.00)?\b/i.test(normalized) ||
    /\(\+\)\s*TDS\s*Amount\s*0(?:\.00)?\b/i.test(normalized) ||
    /\bTotal\s+Tax\s*[:\s]+0(?:\.00)?\b/i.test(normalized)
  ) {
    explicitTax = 0;
  }

  const taxAmount = explicitTax !== undefined && explicitTax !== null ? explicitTax : (componentTax || looseAmounts.taxAmount || 0);
  let grandTotal =
    grandTotalToken.amount || findAmountAfterLabels(normalized, grandTotalLabels) || inferGrandTotal(normalized) || tableSum || looseAmounts.grandTotal;

  // OCR Rupee Glitch Filter: If grandTotal starts with 2 and is abnormally huge compared to subtotal/gross
  if (grandTotal > 500000 && subtotal > 0 && grandTotal > subtotal * 1.5) {
    const sGrand = Math.round(grandTotal).toString();
    if (sGrand.startsWith("2")) {
      const fixedGrand = Number(sGrand.slice(1));
      if (fixedGrand > 0 && fixedGrand <= subtotal * 1.1) {
        grandTotal = fixedGrand;
      }
    }
  }

  // If Net Amount is extracted as grandTotal, ensure subtotal matches Net Base or Gross
  if (grandTotal > 0 && subtotal > grandTotal * 1.5) {
    const sSub = Math.round(subtotal).toString();
    if (sSub.startsWith("2")) {
      const fixedSub = Number(sSub.slice(1));
      if (fixedSub > 0 && fixedSub <= grandTotal * 1.1) {
        subtotal = fixedSub;
      }
    }
  }

  // Math Fallback: If OCR missed the "Total" label but scanned the correct total sum, reconstruct it.
  if (subtotal > 0 && taxAmount > 0 && Math.round(grandTotal) !== Math.round(subtotal + taxAmount) && !tableSum && !grandTotalToken.amount) {
    const expectedTotal = subtotal + taxAmount;
    const allAmounts = [...normalized.matchAll(/[0-9][0-9,]*(?:\.\d{1,2})?/g)]
      .map((m) => normalizeAmount(m[0]))
      .filter((amt) => amt > 0);
    const matchingAmount = allAmounts.find((amt) => Math.round(amt) === Math.round(expectedTotal));
    if (matchingAmount) {
      grandTotal = matchingAmount;
    }
  }
  const currency = inferInvoiceCurrency(normalized, [
    subtotalToken,
    taxToken,
    grandTotalToken,
    { currency: looseAmounts.currency, amount: looseAmounts.grandTotal },
  ]);

  let resolvedGrandTotal = Math.round(grandTotal || 0);
  let resolvedTax = Math.round(taxAmount || 0);

  // Validate tax: if tax exceeds grand total, it's likely a note/reference number, set to 0
  if (resolvedGrandTotal > 0 && resolvedTax >= resolvedGrandTotal) {
    resolvedTax = 0;
  }

  let resolvedSubtotal = Math.round(subtotal || (resolvedGrandTotal > 0 ? Math.max(0, resolvedGrandTotal - resolvedTax) : 0));

  // If subtotal is greater than grand total because it captured Gross (e.g. Gross 133,704 vs Net 129,434)
  // In B2B supplier invoice context, set subtotal as Net Base = (GrandTotal - Tax) so subtotal + tax = GrandTotal
  if (resolvedGrandTotal > 0 && resolvedSubtotal > resolvedGrandTotal) {
    resolvedSubtotal = Math.max(0, resolvedGrandTotal - resolvedTax);
  }

  // If subtotal + 0 tax = grand total, keep subtotal matched to grand total
  if (resolvedSubtotal > 0 && resolvedGrandTotal > 0 && resolvedTax === 0 && resolvedSubtotal !== resolvedGrandTotal && !tableSubtotal) {
    resolvedSubtotal = resolvedGrandTotal;
  }

  const supplierInfo = extractSupplierAndPartner(normalized);

  return {
    supplierName: supplierInfo.supplierName,
    partnerName: supplierInfo.partnerName,
    invoiceNumber: extractInvoiceNumber(normalized),
    invoiceDate: extractDateAfterLabels(normalized, [
      "invoice\\s*date",
      "inv\\s*date",
      "inv\\s*dt",
      "bill\\s*date",
      "billing\\s*date",
      "issue\\s*date",
      "date\\s*of\\s*issue",
      "date\\s*of\\s*invoice",
      "tax\\s*invoice\\s*date",
      "document\\s*date",
      "txn\\s*date",
      "transaction\\s*date",
      "receipt\\s*generated\\s*on",
      "pdf\\s*generated\\s*on",
      "generated\\s*on",
      "dated",
      "date",
      "invoice",
      "bill",
      "payment",
      "payout",
    ]),
    dueDate: extractDateAfterLabels(normalized, ["due"]),
    subtotal: resolvedSubtotal,
    taxAmount: resolvedTax,
    grandTotal: resolvedGrandTotal,
    currency,
  };
};

const calculateConfidence = (fields, textLength) => {
  let score = textLength > 80 ? 20 : textLength > 20 ? 10 : 0;
  if (fields.invoiceNumber) score += 18;
  if (fields.invoiceDate) score += 14;
  if (fields.subtotal > 0) score += 16;
  if (fields.taxAmount > 0) score += 10;
  if (fields.grandTotal > 0) score += 22;
  return Math.min(100, score);
};

const getFileKind = (file = {}) => {
  const mime = String(file.mimetype || "").toLowerCase();
  const ext = path.extname(file.originalname || file.filename || file.path || "").toLowerCase();

  if (mime.includes("pdf") || ext === ".pdf") return "pdf";
  if (mime.includes("wordprocessingml") || ext === ".docx") return "docx";
  if (mime.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"].includes(ext)) return "image";
  if (ext === ".doc") return "doc";
  return "unknown";
};

const extractPdfText = async (filePath) => {
  const buffer = await fs.promises.readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return normalizeText(result?.text || "");
  } finally {
    await parser.destroy();
  }
};

const renderPdfPages = async (filePath, maxPages = 15) => {
  const buffer = await fs.promises.readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  const tempFiles = [];
  try {
    const result = await parser.getScreenshot({ scale: 2 });
    const pages = Array.isArray(result?.pages) ? result.pages.slice(0, maxPages) : [];

    for (const [index, page] of pages.entries()) {
      if (!page?.data) continue;
      const tempPath = path.join(os.tmpdir(), `invoice-ocr-${Date.now()}-${index}.png`);
      await fs.promises.writeFile(tempPath, page.data);
      tempFiles.push(tempPath);
    }
  } finally {
    await parser.destroy();
  }
  return tempFiles;
};

const extractDocxText = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return normalizeText(result?.value || "");
};

const createPreprocessedOcrImage = async (filePath) => {
  const tempPath = path.join(os.tmpdir(), `invoice-ocr-prep-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
  try {
    await sharp(filePath)
      .resize({ width: 2400, withoutEnlargement: false, fit: "inside" })
      .grayscale()
      .normalize()
      .clahe({ width: 50, height: 50 })
      .sharpen({ sigma: 1.2, m1: 0.5, m2: 2.0 })
      .linear(1.1, -8)
      .png()
      .toFile(tempPath);
    return tempPath;
  } catch {
    await sharp(filePath)
      .resize({ width: 2400, withoutEnlargement: false })
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toFile(tempPath);
    return tempPath;
  }
};

const runTesseractCli = async (filePath) => {
  try {
    const { stdout } = await execFileAsync(
      "tesseract",
      [filePath, "stdout", "-l", "eng", "--psm", "6"],
      { timeout: 45000, maxBuffer: 1024 * 1024 * 8 },
    );
    return { available: true, text: normalizeText(stdout || ""), error: "" };
  } catch (error) {
    const unavailable = error?.code === "ENOENT";
    return {
      available: false,
      text: "",
      error: unavailable
        ? "Tesseract OCR is not installed on this server."
        : error?.message || "OCR failed for this invoice file.",
    };
  }
};

const runTesseractJs = async (filePath, { pageSegMode = "3" } = {}) => {
  let worker = null;
  try {
    worker = await createWorker("eng");
    await worker.setParameters({
      preserve_interword_spaces: "1",
      tessedit_pageseg_mode: pageSegMode,
    });
    const result = await worker.recognize(filePath);
    return {
      available: true,
      text: normalizeText(result?.data?.text || ""),
      error: "",
    };
  } catch (error) {
    return {
      available: false,
      text: "",
      error: error?.message || "Tesseract.js OCR failed for this invoice file.",
    };
  } finally {
    if (worker) {
      await worker.terminate().catch(() => null);
    }
  }
};

const runOcr = async (filePath) => {
  const cliResult = await runTesseractCli(filePath);
  if (cliResult.available || cliResult.text) return cliResult;

  const jsResult = await runTesseractJs(filePath);
  if (jsResult.available || jsResult.text) return jsResult;

  return {
    available: false,
    text: "",
    error: `${cliResult.error || "Tesseract CLI unavailable"} ${jsResult.error || "Tesseract.js unavailable"}`.trim(),
  };
};

const extractOcrText = async (filePath, fileKind) => {
  if (fileKind === "image") {
    let preprocessedFile = "";
    try {
      preprocessedFile = await createPreprocessedOcrImage(filePath);
      const preprocessedResult = await runOcr(preprocessedFile);
      if (preprocessedResult.text) return preprocessedResult;
    } catch {
      // Fall back to the original image below.
    } finally {
      if (preprocessedFile) {
        await fs.promises.unlink(preprocessedFile).catch(() => null);
      }
    }
    return runOcr(filePath);
  }

  if (fileKind !== "pdf") {
    return { available: false, text: "", error: "OCR is only attempted for images or scanned PDFs." };
  }

  const tempFiles = await renderPdfPages(filePath);
  if (!tempFiles.length) {
    return { available: false, text: "", error: "Unable to render this PDF for OCR." };
  }

  const textParts = [];
  let lastError = "";
  try {
    for (const tempFile of tempFiles) {
      let preprocessedFile = "";
      try {
        preprocessedFile = await createPreprocessedOcrImage(tempFile);
        const result = await runOcr(preprocessedFile);
        if (result.text) textParts.push(result.text);
        lastError = result.error;
      } catch {
        const result = await runOcr(tempFile);
        if (result.text) textParts.push(result.text);
        lastError = result.error;
      } finally {
        if (preprocessedFile) {
          await fs.promises.unlink(preprocessedFile).catch(() => null);
        }
      }
    }
  } finally {
    await Promise.all(tempFiles.map((tempFile) => fs.promises.unlink(tempFile).catch(() => null)));
  }

  return { available: true, text: normalizeText(textParts.join("\n")), error: lastError };
};

export const buildInvoiceExtractionVerification = ({
  extracted = {},
  claimedSummary = {},
  expectedSummary = {},
} = {}) => {
  const warnings = [];
  const notes = [];
  const extractedSummary = {
    subtotal: Number(extracted.subtotal || 0),
    taxAmount: Number(extracted.taxAmount || 0),
    grandTotal: Number(extracted.grandTotal || 0),
  };
  const claimed = {
    subtotal: Number(claimedSummary.subtotal || 0),
    taxAmount: Number(claimedSummary.taxAmount || claimedSummary.totalTax || 0),
    grandTotal: Number(claimedSummary.grandTotal || 0),
  };
  const expected = {
    subtotal: Number(expectedSummary.subtotal || 0),
    taxAmount: Number(expectedSummary.taxAmount || expectedSummary.totalTax || 0),
    grandTotal: Number(expectedSummary.grandTotal || 0),
  };

  const extractedHasAmounts = extractedSummary.grandTotal > 0;
  const extractedHasSubtotal = Number(extracted.subtotal || 0) > 0;
  const extractedHasTax = Number(extracted.taxAmount || extracted.totalTax || 0) > 0;
  const expectedHasSubtotal = Number(expected.subtotal || 0) > 0;
  const expectedHasTax = Number(expected.taxAmount || 0) > 0;
  const claimedHasAmounts = claimed.grandTotal > 0;
  const expectedHasAmounts = expected.grandTotal > 0;

  if (extracted.conversionMissing) {
    warnings.push(
      `Uploaded invoice currency is ${extracted.originalCurrency || "foreign currency"}, but live exchange rate was unavailable for ${extracted.convertedCurrency || BASE_CURRENCY} comparison${extracted.exchangeRateError ? ` (${extracted.exchangeRateError})` : ""}. Please verify conversion manually.`,
    );
  }

  if (extracted.conversionApplied) {
    notes.push(
      `Converted uploaded invoice from ${extracted.originalCurrency} to ${extracted.convertedCurrency} at ${Number(extracted.exchangeRate || 0).toLocaleString("en-IN")} via ${extracted.exchangeRateProvider || "currency API"}${extracted.exchangeRateDate ? ` (${extracted.exchangeRateDate})` : ""} for comparison.`,
    );
  }

  const claimedMatchesExtracted =
    !extractedHasAmounts ||
    !claimedHasAmounts ||
    ((!extractedHasSubtotal || amountsMatch(claimed.subtotal, extractedSummary.subtotal)) &&
      (!extractedHasTax || amountsMatch(claimed.taxAmount, extractedSummary.taxAmount)) &&
      amountsMatch(claimed.grandTotal, extractedSummary.grandTotal));
  const expectedMatchesExtracted =
    !extractedHasAmounts ||
    !expectedHasAmounts ||
    ((!expectedHasSubtotal || (extractedHasSubtotal && amountsMatch(expected.subtotal, extractedSummary.subtotal))) &&
      (!expectedHasTax || (extractedHasTax && amountsMatch(expected.taxAmount, extractedSummary.taxAmount))) &&
      amountsMatch(expected.grandTotal, extractedSummary.grandTotal));

  if (extractedHasAmounts && claimedHasAmounts && !claimedMatchesExtracted) {
    warnings.push(
      `Extracted total ${formatAmount(extractedSummary.grandTotal)} does not match entered total ${formatAmount(claimed.grandTotal)}.`,
    );
  }

  if (extractedHasAmounts && expectedHasAmounts && !expectedMatchesExtracted) {
    const mismatchParts = [];
    if (expectedHasSubtotal && !extractedHasSubtotal) {
      mismatchParts.push("subtotal not found in uploaded invoice");
    }
    if (extractedHasSubtotal && !amountsMatch(expected.subtotal, extractedSummary.subtotal)) {
      mismatchParts.push(
        `subtotal ${formatMoney(extractedSummary.subtotal, extracted.currency)} should be ${formatMoney(expected.subtotal, extracted.convertedCurrency || BASE_CURRENCY)}`,
      );
    }
    if (expectedHasTax && !extractedHasTax) {
      mismatchParts.push("tax not found in uploaded invoice");
    }
    if (extractedHasTax && !amountsMatch(expected.taxAmount, extractedSummary.taxAmount)) {
      mismatchParts.push(
        `tax ${formatMoney(extractedSummary.taxAmount, extracted.currency)} should be ${formatMoney(expected.taxAmount, extracted.convertedCurrency || BASE_CURRENCY)}`,
      );
    }
    if (!amountsMatch(expected.grandTotal, extractedSummary.grandTotal)) {
      mismatchParts.push(
        `total ${formatMoney(extractedSummary.grandTotal, extracted.currency)} should be ${formatMoney(expected.grandTotal, extracted.convertedCurrency || BASE_CURRENCY)}`,
      );
    }
    warnings.push(`Extracted invoice mismatch: ${mismatchParts.join("; ")}.`);
  }

  if (
    extractedHasAmounts &&
    (extractedHasSubtotal || extractedHasTax) &&
    !amountsMatch(extractedSummary.subtotal + extractedSummary.taxAmount, extractedSummary.grandTotal)
  ) {
    const tableSum = Math.round(extractedSummary.subtotal + extractedSummary.taxAmount);
    const diff = Math.round(extractedSummary.grandTotal - tableSum);
    const diffSign = diff > 0 ? `+${formatAmount(diff)}` : `-${formatAmount(Math.abs(diff))}`;
    warnings.push(
      `Subtotal (${formatAmount(extractedSummary.subtotal)}) + Tax (${formatAmount(extractedSummary.taxAmount)}) = ${formatAmount(tableSum)}, differing by ${diffSign} from final Net Grand Total (${formatAmount(extractedSummary.grandTotal)}) due to invoice adjustments (handling, TDS, extra taxes, or deductions).`,
    );
  }

  return {
    extractedSummary,
    claimedMatchesExtracted,
    expectedMatchesExtracted,
    passed: warnings.length === 0,
    warnings,
    notes,
  };
};

export const analyzeInvoiceFile = async (
  file,
  { claimedSummary = {}, expectedSummary = {} } = {},
) => {
  const filePath = file?.path;
  if (!filePath) {
    return {
      source: "none",
      status: "failed",
      ocrStatus: "not_run",
      error: "No invoice file was received.",
      fields: {},
      confidence: 0,
      verification: buildInvoiceExtractionVerification({ claimedSummary, expectedSummary }),
      rawTextSample: "",
    };
  }

  const fileKind = getFileKind(file);
  let source = "unsupported";
  let status = "unsupported";
  let ocrStatus = "not_run";
  let error = "";
  let text = "";

  try {
    if (fileKind === "pdf") {
      source = "pdf_text";
      text = await extractPdfText(filePath);
      status = text.length > 25 ? "parsed" : "needs_ocr";

      if (status === "needs_ocr") {
        const ocr = await extractOcrText(filePath, fileKind);
        ocrStatus = ocr.available ? "completed" : "unavailable";
        error = ocr.error;
        if (ocr.text) {
          source = "pdf_ocr";
          text = ocr.text;
          status = "parsed";
        }
      }
    } else if (fileKind === "docx") {
      source = "docx_text";
      text = await extractDocxText(filePath);
      status = text.length > 25 ? "parsed" : "empty";
    } else if (fileKind === "image") {
      source = "image_ocr";
      const ocr = await extractOcrText(filePath, fileKind);
      ocrStatus = ocr.available ? "completed" : "unavailable";
      error = ocr.error;
      text = ocr.text;
      status = text.length > 25 ? "parsed" : "ocr_unavailable";
    } else if (fileKind === "doc") {
      source = "legacy_doc";
      status = "unsupported";
      error = "Legacy .doc files can be stored, but automatic text extraction supports PDF, DOCX, and images.";
    }
  } catch (parseError) {
    status = "failed";
    error = parseError?.message || "Invoice parsing failed.";
  }

  const extractedFields = extractInvoiceFieldsFromText(text);
  const fields = await convertFieldsToExpectedCurrency(extractedFields, expectedSummary);
  const verification = buildInvoiceExtractionVerification({
    extracted: fields,
    claimedSummary,
    expectedSummary,
  });
  let confidence = calculateConfidence(fields, text.length);
  if (!verification.passed) {
    confidence = Math.min(60, Math.max(20, confidence - 40));
  }

  return {
    source,
    status,
    ocrStatus,
    error,
    fields,
    confidence,
    verification,
    rawTextSample: text.slice(0, 1200),
  };
};
