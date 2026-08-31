import API from "../../../../utils/Api";

export const todayInput = () => new Date().toISOString().slice(0, 10);

export const formatMoney = (value, currency = "INR") =>
  `${String(currency || "INR").toUpperCase() === "INR" ? "₹" : currency} ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

  
export const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};


export const EMPTY_CLAIMED_SUMMARY = {
  subtotal: "",
  taxAmount: "",
  grandTotal: "",
};


export const normalizeClaimedInputValue = (value) => {
  if (value === undefined || value === null || value === "") return "";
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : "";
};

export const buildClaimedSummaryFromFields = (fields = {}) => ({
  subtotal: normalizeClaimedInputValue(fields.subtotal),
  taxAmount: normalizeClaimedInputValue(fields.taxAmount),
  grandTotal: normalizeClaimedInputValue(fields.grandTotal),
});

export const getSortDateValue = (value) => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
};

export const sortPayableServices = (services = []) =>
  [...services].sort((left, right) => {
    if (Boolean(left.isClaimed) !== Boolean(right.isClaimed)) {
      return left.isClaimed ? 1 : -1;
    }
    const leftDue = getSortDateValue(left.dueDate);
    const rightDue = getSortDateValue(right.dueDate);
    if (leftDue !== rightDue) return leftDue - rightDue;
    return String(left.queryId || "").localeCompare(String(right.queryId || ""));
  });

export const getFileUrl = (filePath = "") => {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const apiBaseUrl = API.defaults.baseURL || "";
  const serverBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
  return `${serverBaseUrl}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
};


export const statusBadgeClass = (status = "") => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "partially paid") return "border-amber-200 bg-amber-50 text-amber-700";
  if (normalized === "approved") return "border-blue-200 bg-blue-50 text-blue-700";
  if (normalized === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
};



export const addDaysToDate = (value, daysToAdd = 0) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
  return parsed.toISOString().slice(0, 10);
};


export const TEMPLATE_OPTIONS = [
  { value: "aurora-ledger", label: "Aurora Ledger" },
  { value: "classic-ledger", label: "Classic Ledger" },
  { value: "compact-ledger", label: "Compact Ledger" },
  { value: "finance-ledger", label: "Finance Ledger" },
];


export const readStoredUser = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};


export const createInvoiceNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
  return `BULK-INV-${dateStr}-${timeStr}`;
};

export const SERVICES_PER_PAGE = 6;
