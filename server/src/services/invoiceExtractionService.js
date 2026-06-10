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

const formatAmount = (value) => Number(value || 0).toLocaleString("en-IN");
const formatMoney = (value, currency = BASE_CURRENCY) =>
  `${normalizeCurrency(currency) || BASE_CURRENCY} ${formatAmount(value)}`;

const parseDateToIso = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const ymd = raw.match(/\b(20\d{2}|19\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (ymd) {
    const [, year, month, day] = ymd;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const dmy = raw.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2}|19\d{2})\b/);
  if (dmy) {
    const [, firstPart, secondPart, year] = dmy;
    const first = Number(firstPart);
    const second = Number(secondPart);
    const month = first <= 12 && second > 12 ? firstPart : secondPart;
    const day = first <= 12 && second > 12 ? secondPart : firstPart;
    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const named = raw.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s*,?\s*(20\d{2}|19\d{2})\b/);
  if (named) {
    const [, day, monthName, year] = named;
    const monthIndex = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ].indexOf(monthName.slice(0, 3).toLowerCase());
    if (monthIndex >= 0) {
      return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const namedMonthFirst = raw.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(20\d{2}|19\d{2})\b/);
  if (namedMonthFirst) {
    const [, monthName, day, year] = namedMonthFirst;
    const monthIndex = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ].indexOf(monthName.slice(0, 3).toLowerCase());
    if (monthIndex >= 0) {
      return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return "";
};

const extractDateAfterLabels = (text, labels = []) => {
  const datePattern =
    "((?:\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})|" +
    "(?:\\d{4}[-/.]\\d{1,2}[-/.]\\d{1,2})|" +
    "(?:\\d{1,2}\\s+[A-Za-z]{3,9}\\s*,?\\s*\\d{4})|" +
    "(?:[A-Za-z]{3,9}\\s+\\d{1,2}(?:st|nd|rd|th)?\\s*,?\\s*\\d{4}))";

  for (const label of labels) {
    const pattern = new RegExp(
      `${label}\\s*(?:date)?\\s*[:#-]?\\s*${datePattern}`,
      "i",
    );
    const match = text.match(pattern);
    const parsed = parseDateToIso(match?.[1]);
    if (parsed) return parsed;
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

const AMOUNT_PATTERN = /(?:INR|Rs\.?|₹|â‚¹|\$|USD|AED|EUR)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)\b(?!\s*%)/gi;

const getAmountsFromLine = (line = "") =>
  [...String(line || "").matchAll(AMOUNT_PATTERN)]
    .map((match) => normalizeAmount(match?.[1]))
    .filter((amount) => amount > 0);

const MONEY_TOKEN_PATTERN = /(?:(INR|Rs\.?|â‚¹|Ã¢â€šÂ¹|\$|USD|AED|EUR|GBP|THB|SGD|MYR|IDR|EGP|AUD)\s*)?([0-9][0-9,]*(?:\.\d{1,2})?)\b(?!\s*%)/gi;

const getMoneyTokensFromLine = (line = "") =>
  [...String(line || "").matchAll(MONEY_TOKEN_PATTERN)]
    .map((match) => ({
      currency: normalizeCurrency(match?.[1]),
      amount: normalizeAmount(match?.[2]),
    }))
    .filter((token) => token.amount > 0);

const CURRENCY_AMOUNT_PATTERN = /(?:(INR|Rs\.?|Ã¢â€šÂ¹|ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹|\$|USD|AED|EUR|GBP|THB|SGD|MYR|IDR|EGP|AUD)\s*)+([+-]?\s*[0-9][0-9,]*(?:\.\d{1,2})?)\b(?!\s*%)/gi;

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
  const grandTotal = Number((frequentAmount || positiveTokens[positiveTokens.length - 1].amount || maxAmount).toFixed(2));
  const subtotal = Number((maxAmount > grandTotal ? maxAmount : grandTotal).toFixed(2));
  const taxAmount = subtotal < grandTotal ? Number((grandTotal - subtotal).toFixed(2)) : 0;

  return {
    subtotal,
    taxAmount,
    grandTotal,
    currency: positiveTokens.find((token) => token.currency)?.currency || "",
  };
};

const findMoneyAfterLabels = (text, labels = []) => {
  const lines = splitInvoiceTextLines(text);

  for (const label of labels) {
    const labelPattern = new RegExp(`\\b${label}\\b`, "i");

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!labelPattern.test(line)) continue;

      const labelMatch = line.match(labelPattern);
      const textAfterLabel = labelMatch ? line.slice(labelMatch.index + labelMatch[0].length) : line;
      const sameLineTokens = getMoneyTokensFromLine(textAfterLabel);
      if (sameLineTokens.length) {
        return sameLineTokens[sameLineTokens.length - 1];
      }

      const nextLine = lines[index + 1] || "";
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
  if (explicitCurrency) return explicitCurrency;

  const raw = String(text || "");
  if (/\$/.test(raw)) return "USD";
  if (/â‚¹|Ã¢â€šÂ¹|Rs\.?|INR/i.test(raw)) return "INR";
  if (/AED/i.test(raw)) return "AED";
  if (/EUR/i.test(raw)) return "EUR";
  if (/GBP/i.test(raw)) return "GBP";
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
    subtotal: Number((originalAmounts.subtotal * exchangeRate).toFixed(2)),
    taxAmount: Number((originalAmounts.taxAmount * exchangeRate).toFixed(2)),
    grandTotal: Number((originalAmounts.grandTotal * exchangeRate).toFixed(2)),
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
      if (!labelPattern.test(line)) continue;

      const labelMatch = line.match(labelPattern);
      const textAfterLabel = labelMatch ? line.slice(labelMatch.index + labelMatch[0].length) : line;
      const sameLineAmounts = getAmountsFromLine(textAfterLabel);
      if (sameLineAmounts.length) {
        return sameLineAmounts[sameLineAmounts.length - 1];
      }

      const nextLine = lines[index + 1] || "";
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
      if (!labelPattern.test(line)) continue;
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

const extractInvoiceNumber = (text) => {
  const patterns = [
    /(?:invoice|inv|bill)\s*(?:number|no\.?|#)\s*[:#.-]?\s*([A-Z0-9][A-Z0-9/_-]{2,})/i,
    /(?:invoice|inv|bill)\s*(?:number|no\.?|#)\.?\s*\n\s*([A-Z0-9][A-Z0-9/_-]{2,})/i,
    /\b(INV[-/_][A-Z0-9][A-Z0-9/_-]{2,})\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].replace(/[.,;:]+$/, "").trim();
  }

  return "";
};

const extractSupplierName = (text) => {
  const patterns = [
    /(?:supplier|vendor|billed\s+by|from)\s*(?:name)?\s*[:#-]\s*([^\n]{3,80})/i,
    /(?:dmc\s*\/\s*supplier|supplier\s*name|vendor\s*name)\s*\n\s*([^\n]{3,80})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].replace(/\s{2,}/g, " ").trim();
  }

  return "";
};

const inferGrandTotal = (text) => {
  const candidates = [];
  const totalLinePattern = /(?:grand\s*total|total\s*amount|amount\s*payable|net\s*payable|invoice\s*total|total)[^\n]{0,80}/gi;

  for (const lineMatch of text.matchAll(totalLinePattern)) {
    const line = lineMatch[0];
    for (const amountMatch of line.matchAll(/(?:INR|Rs\.?|₹|USD|AED|EUR)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)\b(?!\s*%)/gi)) {
      const amount = normalizeAmount(amountMatch[1]);
      if (amount > 0) candidates.push(amount);
    }
  }

  return candidates.length ? Math.max(...candidates) : 0;
};

export const extractInvoiceFieldsFromText = (text = "") => {
  const normalized = normalizeText(text);
  const subtotalLabels = [
    "sub\\s*total",
    "subtotal",
    "taxable\\s*value",
    "taxable\\s*amount",
    "net\\s*amount",
    "base\\s*amount",
  ];
  const taxLabels = [
    "total\\s*tax",
    "tax\\s*amount",
    "tax",
    "gst\\s*amount",
    "vat\\s*amount",
  ];
  const grandTotalLabels = [
    "grand\\s*total",
    "total\\s*due",
    "payment\\s*status",
    "total\\s*amount\\s*paid",
    "amount\\s*payable",
    "net\\s*payable",
    "invoice\\s*total",
    "total\\s*amount",
    "amount\\s*paid",
    "balance\\s*due",
  ];
  const subtotalToken = findMoneyAfterLabels(normalized, subtotalLabels);
  const taxToken = findMoneyAfterLabels(normalized, taxLabels);
  const grandTotalToken = findMoneyAfterLabels(normalized, grandTotalLabels);
  const looseAmounts = inferLooseInvoiceAmounts(normalized);
  const subtotal = subtotalToken.amount || findAmountAfterLabels(normalized, subtotalLabels);
  const explicitTax = taxToken.amount || findAmountAfterLabels(normalized, taxLabels);
  const componentTax = sumAmountsAfterLabels(normalized, [
    "cgst",
    "sgst",
    "igst",
    "gst",
    "vat",
    "tcs",
  ]);
  const taxAmount = explicitTax || componentTax || looseAmounts.taxAmount;
  const grandTotal =
    grandTotalToken.amount || findAmountAfterLabels(normalized, grandTotalLabels) || inferGrandTotal(normalized) || looseAmounts.grandTotal;
  const currency = inferInvoiceCurrency(normalized, [
    subtotalToken,
    taxToken,
    grandTotalToken,
    { currency: looseAmounts.currency, amount: looseAmounts.grandTotal },
  ]);

  return {
    supplierName: extractSupplierName(normalized),
    invoiceNumber: extractInvoiceNumber(normalized),
    invoiceDate: extractDateAfterLabels(normalized, [
      "invoice",
      "bill",
      "payment",
      "payout",
      "receipt\\s*generated\\s*on",
      "pdf\\s*generated\\s*on",
      "generated\\s*on",
      "date",
    ]),
    dueDate: extractDateAfterLabels(normalized, ["due"]),
    subtotal: subtotal || looseAmounts.subtotal || (grandTotal && taxAmount ? Math.max(0, grandTotal - taxAmount) : 0),
    taxAmount,
    grandTotal,
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

const renderPdfFirstPages = async (filePath) => {
  const buffer = await fs.promises.readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  const tempFiles = [];
  try {
    const result = await parser.getScreenshot({ scale: 2, partial: [1, 2] });
    const pages = Array.isArray(result?.pages) ? result.pages.slice(0, 2) : [];

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
  await sharp(filePath)
    .resize({ width: 2400, withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toFile(tempPath);
  return tempPath;
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

  const tempFiles = await renderPdfFirstPages(filePath);
  if (!tempFiles.length) {
    return { available: false, text: "", error: "Unable to render this PDF for OCR." };
  }

  const textParts = [];
  let lastError = "";
  try {
    for (const tempFile of tempFiles) {
      const result = await runOcr(tempFile);
      if (!result.available) return result;
      if (result.text) textParts.push(result.text);
      lastError = result.error;
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
    extractedSummary.subtotal <= extractedSummary.grandTotal &&
    !amountsMatch(extractedSummary.subtotal + extractedSummary.taxAmount, extractedSummary.grandTotal)
  ) {
    warnings.push("Extracted subtotal plus tax does not equal extracted grand total.");
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
  const confidence = calculateConfidence(fields, text.length);
  const verification = buildInvoiceExtractionVerification({
    extracted: fields,
    claimedSummary,
    expectedSummary,
  });

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
