import { Box, Building2, Compass, Bus, Eye } from "lucide-react";

export const rateChangeReasonOptions = [
  { value: "blackout", label: "Blackout / Event Date" },
  { value: "dynamic_pricing", label: "Dynamic Pricing" },
  { value: "availability", label: "Availability Constraint" },
  { value: "supplier_revision", label: "Supplier Revision" },
  { value: "other", label: "Other" },
];

export const rateSensitiveFieldPatterns = [
  /price/i,
  /rate/i,
  /currency/i,
  /valid\s*from/i,
  /valid\s*to/i,
  /availability/i,
  /blackout/i,
  /inventory/i,
  /allotment/i,
  /stock/i,
  /surcharge/i,
];

export const isRateSensitiveHeader = (header = "") =>
  rateSensitiveFieldPatterns.some((pattern) => pattern.test(String(header || "")));

export const getRateSensitiveChanges = (originalRow = {}, editedRow = {}) =>
  Object.keys(editedRow || {}).filter((header) => {
    if (!isRateSensitiveHeader(header)) return false;
    const oldValue = String(originalRow?.[header] ?? "").trim();
    const newValue = String(editedRow?.[header] ?? "").trim();
    return oldValue !== newValue;
  });

export const getColumnLetter = (colIndex) => {
  let letter = "";
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter || "A";
};

export const TABS = [
  { id: "all", label: "All", icon: Box, color: "slate" },
  { id: "hotel", label: "Hotel", icon: Building2, color: "purple" },
  { id: "activity", label: "Activity", icon: Compass, color: "emerald" },
  { id: "transport", label: "Transport", icon: Bus, color: "blue" },
];
