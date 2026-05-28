import {
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  Coins,
  Compass,
  DollarSign,
  FileText,
  Hash,
  Landmark,
  MapPin,
  Receipt,
  X,
} from "lucide-react";
import { createElement, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../utils/Api";

const formatDateInput = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const formatDisplayDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const addDaysToDate = (value, daysToAdd = 0) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
  return parsed.toISOString().slice(0, 10);
};

const CREDIT_PERIOD_OPTIONS = [7, 15];

const TEMPLATE_OPTIONS = [
  { value: "aurora-ledger", label: "Aurora Ledger" },
  { value: "classic-ledger", label: "Classic Ledger" },
  { value: "compact-ledger", label: "Compact Ledger" },
  { value: "finance-ledger", label: "Finance Ledger" },
];

const normalizeTemplateVariant = (value) =>
  TEMPLATE_OPTIONS.some((option) => option.value === value) ? value : "aurora-ledger";

const normalizeCreditPeriodDays = (value) => {
  const numericValue = Number(value);
  return CREDIT_PERIOD_OPTIONS.includes(numericValue) ? numericValue : 7;
};

const getCreditPeriodFromDates = (invoiceDate, dueDate) => {
  if (!invoiceDate || !dueDate) return 7;
  const parsedInvoiceDate = new Date(invoiceDate);
  const parsedDueDate = new Date(dueDate);
  if (Number.isNaN(parsedInvoiceDate.getTime()) || Number.isNaN(parsedDueDate.getTime())) return 7;

  parsedInvoiceDate.setHours(0, 0, 0, 0);
  parsedDueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((parsedDueDate - parsedInvoiceDate) / (1000 * 60 * 60 * 24));
  return normalizeCreditPeriodDays(diffDays);
};

const createEmptyItem = () => ({
  type: "Hotel",
  service: "",
  currency: "INR",
  qty: 1,
  rate: 0,
  addonTotal: 0,
  subtotal: 0,
  tax: 0,
});

const createInvoiceNumber = (queryId) => {
  if (!queryId) return "INV-0001";
  return `INV-${String(queryId).replace(/[^a-zA-Z0-9-]/g, "")}`;
};

const extractLeadingNumber = (value = "") => {
  const match = String(value || "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  return Number(match[1] || 0);
};

const getServiceInvoiceQuantity = (service = {}) => {
  const normalizedType = normalizeServiceType(service.type);
  const explicitBillableQuantity = Number(service.billableQuantityValue || 0);

  if (Number.isFinite(explicitBillableQuantity) && explicitBillableQuantity > 0) {
    return explicitBillableQuantity;
  }

  if (normalizedType === "Hotel") {
    const roomCount = Math.max(
      1,
      Number(service.roomCount || service.rooms || service.quantityValue || extractLeadingNumber(service.quantityLabel) || 1),
    );
    const nightCount = Math.max(
      1,
      Number(service.nightCount || service.nights || extractLeadingNumber(service.stayLabel) || 1),
    );

    return roomCount * nightCount;
  }

  const quantityValue = Number(service.quantityValue || 1);
  return Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
};

const getResolvedMappedServiceSubtotal = (service = {}) => {
  const normalizedType = normalizeServiceType(service.type);
  const rawTotal = Number(service.total || 0);

  if (normalizedType !== "Hotel") {
    return rawTotal;
  }

  return rawTotal;
};

const createItemFromService = (service = {}) => ({
  ...(function buildResolvedItem() {
    const qty = getServiceInvoiceQuantity(service);
    const subtotal = getResolvedMappedServiceSubtotal(service);
    const resolvedRate = Number(service.billableUnitRate || (qty > 0 ? subtotal / qty : service.rate) || 0);

    return {
      type: normalizeServiceType(service.type),
      service: service.serviceName || service.title || "",
      currency: service.currency || "INR",
      qty,
      rate: resolvedRate,
      addonTotal: 0,
      subtotal,
      tax: 0,
    };
  })(),
});

const getDraftStorageKey = (queryId) => `dmc-internal-invoice-${queryId || "default"}`;

const applyDerivedItemValues = (item, gstRate) => {
  const qty = Number(item.qty || 0);
  const rate = Number(item.rate || 0);
  const addonTotal = Number(item.addonTotal || 0);
  const subtotal = (qty * rate) + addonTotal;
  const tax = (subtotal * Number(gstRate || 0)) / 100;

  return {
    ...item,
    qty,
    rate,
    addonTotal,
    subtotal,
    tax: Number(tax.toFixed(2)),
  };
};

const normalizeServiceType = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "transport" || normalized === "transfer") return "Transport";
  if (normalized === "activity") return "Activity";
  if (normalized === "sightseeing") return "Sightseeing";
  return "Hotel";
};

const syncDraftItemWithMappedService = (item = {}, mappedItem = null) => {
  if (!mappedItem) return item;

  return {
    ...item,
    type: mappedItem.type,
    service: mappedItem.service,
    currency: mappedItem.currency || item.currency,
    qty: mappedItem.qty,
    rate: mappedItem.rate,
    addonTotal: Number(mappedItem.addonTotal || 0),
  };
};

const doItemsMatchMappedServices = (items = [], mappedItems = []) =>
  items.length === mappedItems.length &&
  items.every((item, index) => {
    const mappedItem = mappedItems[index];

    return (
      normalizeServiceType(item.type) === normalizeServiceType(mappedItem?.type) &&
      String(item.service || "").trim().toLowerCase() ===
      String(mappedItem?.service || "").trim().toLowerCase()
    );
  });

const getServiceTypeIcon = (type = "") => {
  const normalizedType = normalizeServiceType(type);
  if (normalizedType === "Transport") return Car;
  if (normalizedType === "Activity") return Landmark;
  if (normalizedType === "Sightseeing") return Compass;
  return Building2;
};

const getCurrencyIcon = (currency = "") => {
  const normalizedCurrency = String(currency || "").trim().toUpperCase();
  if (normalizedCurrency === "USD") return DollarSign;
  if (normalizedCurrency === "EUR") return Landmark;
  if (normalizedCurrency === "AED") return Receipt;
  if (normalizedCurrency === "THB") return Coins;
  return Coins;
};

const FieldShell = ({
  icon,
  children,
  iconWrapClassName = "bg-slate-100 text-slate-600",
}) => (
  <div className="relative">
    <div
      className={`pointer-events-none absolute left-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md ${iconWrapClassName}`}
    >
      {icon ? createElement(icon, { size: 14 }) : null}
    </div>
    {children}
  </div>
);

export default function InternalInvoice({ selectedQuery, queryServices = [] }) {
  const draftStorageKey = getDraftStorageKey(selectedQuery?.queryId);
  const existingInvoice = selectedQuery?.internalInvoice || null;
  const isFinanceVerified = ["Approved", "Paid"].includes(
    String(existingInvoice?.status || "").trim(),
  );
  const mappedQueryItems = queryServices.length
    ? queryServices.map(createItemFromService)
    : [];

  const existingDraft =
    typeof window !== "undefined"
      ? (() => {
        try {
          const raw = window.localStorage.getItem(draftStorageKey);
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })()
      : null;

  const initialGstRate =
    existingInvoice?.taxConfig?.gstRate ??
    existingDraft?.taxConfig?.gstRate ??
    5;
  const existingInvoiceMatchesQueryServices =
    Array.isArray(existingInvoice?.items) &&
    existingInvoice.items.length > 0 &&
    mappedQueryItems.length > 0 &&
    doItemsMatchMappedServices(existingInvoice.items, mappedQueryItems);
  const draftMatchesQueryServices =
    Array.isArray(existingDraft?.items) &&
    existingDraft.items.length > 0 &&
    mappedQueryItems.length > 0 &&
    doItemsMatchMappedServices(existingDraft.items, mappedQueryItems);
  const syncedExistingInvoiceItems = existingInvoiceMatchesQueryServices
    ? existingInvoice.items.map((item, index) =>
      syncDraftItemWithMappedService(item, mappedQueryItems[index]),
    )
    : existingInvoice?.items || [];
  const draftItemsWithMappedQuantities = draftMatchesQueryServices
    ? existingDraft.items.map((item, index) =>
      syncDraftItemWithMappedService(item, mappedQueryItems[index]),
    )
    : existingDraft?.items || [];
  const initialItems = (
    existingInvoice?.items?.length
      ? syncedExistingInvoiceItems
      : draftMatchesQueryServices
        ? draftItemsWithMappedQuantities
        : mappedQueryItems.length
          ? mappedQueryItems
          : [createEmptyItem()]
  ).map((item) => applyDerivedItemValues(item, initialGstRate));
  const initialInvoiceDate =
    formatDateInput(existingInvoice?.invoiceDate) ||
    existingDraft?.invoiceMeta?.invoiceDate ||
    formatDateInput(new Date());
  const initialDueDate =
    formatDateInput(existingInvoice?.dueDate) ||
    existingDraft?.invoiceMeta?.dueDate ||
    "";
  const initialCreditPeriodDays = normalizeCreditPeriodDays(
    existingInvoice?.creditPeriodDays ||
    existingDraft?.invoiceMeta?.creditPeriodDays ||
    getCreditPeriodFromDates(initialInvoiceDate, initialDueDate),
  );

  const [invoiceMeta, setInvoiceMeta] = useState({
    supplierName:
      existingInvoice?.supplierName ||
      existingDraft?.invoiceMeta?.supplierName ||
      selectedQuery?.agentName ||
      "",
    invoiceNumber:
      existingInvoice?.invoiceNumber ||
      existingDraft?.invoiceMeta?.invoiceNumber ||
      createInvoiceNumber(selectedQuery?.queryId),
    invoiceDate: initialInvoiceDate,
    creditPeriodDays: initialCreditPeriodDays,
    dueDate: addDaysToDate(initialInvoiceDate, initialCreditPeriodDays),
    templateVariant: normalizeTemplateVariant(
      existingInvoice?.templateVariant ||
      existingDraft?.invoiceMeta?.templateVariant,
    ),
  });
  const [items, setItems] = useState(initialItems);
  const [taxConfig, setTaxConfig] = useState({
    gstRate: initialGstRate,
    tcsRate:
      existingInvoice?.taxConfig?.tcsRate ??
      existingDraft?.taxConfig?.tcsRate ?? 0,
    otherTax:
      existingInvoice?.taxConfig?.otherTax ??
      existingDraft?.taxConfig?.otherTax ??
      0,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionPopup, setActionPopup] = useState(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const showActionPopup = (title, message) => {
    setActionPopup({ title, message });
    setTimeout(() => {
      setActionPopup((current) =>
        current?.title === title && current?.message === message ? null : current,
      );
    }, 2400);
  };

  const handleMetaChange = (field, value) => {
    setInvoiceMeta((prev) => {
      if (field === "invoiceDate") {
        return {
          ...prev,
          invoiceDate: value,
          dueDate: addDaysToDate(value, prev.creditPeriodDays),
        };
      }

      if (field === "creditPeriodDays") {
        const creditPeriodDays = normalizeCreditPeriodDays(value);
        return {
          ...prev,
          creditPeriodDays,
          dueDate: addDaysToDate(prev.invoiceDate, creditPeriodDays),
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleTaxChange = (field, value) => {
    const numericValue = Number(value || 0);

    setTaxConfig((prev) => ({
      ...prev,
      [field]: numericValue,
    }));

    if (field === "gstRate") {
      setItems((prev) =>
        prev.map((item) => applyDerivedItemValues(item, numericValue)),
      );
    }
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const updatedItem = {
          ...item,
          [field]:
            field === "qty" || field === "rate"
              ? Number(value || 0)
              : field === "type"
                ? normalizeServiceType(value)
                : value,
        };

        return applyDerivedItemValues(updatedItem, taxConfig.gstRate);
      }),
    );
  };

  const summary = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.subtotal || 0),
      0,
    );
    const gstAmount = items.reduce((sum, item) => sum + Number(item.tax || 0), 0);
    const tcsAmount = (subtotal * Number(taxConfig.tcsRate || 0)) / 100;
    const otherTaxAmount = Number(taxConfig.otherTax || 0);
    const totalTax = gstAmount + tcsAmount + otherTaxAmount;
    const grandTotal = subtotal + totalTax;

    return {
      subtotal,
      gstAmount,
      tcsAmount,
      otherTaxAmount,
      totalTax,
      grandTotal,
    };
  }, [items, taxConfig]);

  const currencyPrefix = items[0]?.currency || "INR";
  const formatMoney = (value) =>
    `${currencyPrefix} ${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  const handleSaveDraft = ({ silent = false } = {}) => {
    if (typeof window === "undefined") return;

    const payload = {
      invoiceMeta,
      items,
      taxConfig,
      summary,
      selectedQueryId: selectedQuery?.queryId || "",
      savedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
    if (!silent) {
      showActionPopup(
        "Draft Saved",
        "Internal invoice draft has been saved for this booking.",
      );
    }
  };

  const handleGenerateInvoice = async () => {
    if (isGenerating) return;

    if (isFinanceVerified) {
      toast.error(
        "Finance has already verified this internal invoice. It cannot be sent again.",
      );
      return;
    }

    if (!selectedQuery?.queryId) {
      toast.error("Please select a confirmed query first");
      return;
    }

    if (!invoiceMeta.supplierName || !invoiceMeta.invoiceNumber || !invoiceMeta.invoiceDate || !invoiceMeta.dueDate || !invoiceMeta.templateVariant) {
      toast.error("Please fill all invoice header fields");
      return;
    }

    const hasInvalidItem = items.some(
      (item) => !item.service || Number(item.qty || 0) <= 0 || Number(item.rate || 0) < 0,
    );

    if (hasInvalidItem) {
      toast.error("Please complete all line items before generating invoice");
      return;
    }

    setIsGenerating(true);

    try {
      await API.post("/dmc/internal-invoice", {
        queryId: selectedQuery?.queryId || selectedQuery?._id,
        invoiceMeta,
        items,
        taxConfig,
        summary,
        templateVariant: invoiceMeta.templateVariant,
      });

      handleSaveDraft({ silent: true });
      showActionPopup(
        "Sent to Finance Team",
        "Internal invoice has been submitted to finance for review and payout processing.",
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to send internal invoice to finance team",
      );
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
      }, 500);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow">
      <div className="border-b border-gray-300 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-gray-800">
          <FileText size={18} />
          Internal Invoice Details (DMC to System)
        </h2>

        <p className="mt-1 text-xs text-gray-500">
          Invoice rows are auto-filled from the booked services above and stay editable.
        </p>

        {existingInvoice?.status ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 ${isFinanceVerified
                ? "border-emerald-200 bg-emerald-50"
                : existingInvoice.status === "Rejected"
                  ? "border-rose-200 bg-rose-50"
                  : "border-sky-200 bg-sky-50"
              }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${isFinanceVerified
                      ? "text-emerald-700"
                      : existingInvoice.status === "Rejected"
                        ? "text-rose-700"
                        : "text-sky-700"
                    }`}
                >
                  Finance Update
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {isFinanceVerified
                    ? "Finance has completed verification and payout for this invoice."
                    : existingInvoice.status === "Rejected"
                      ? "Finance returned this invoice for correction."
                      : "This invoice is already in the finance workflow."}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {isFinanceVerified
                    ? `${existingInvoice.invoiceNumber || "The latest internal invoice"} is locked after finance verification. A new internal invoice will not be sent again for this booking.`
                    : existingInvoice.status === "Rejected"
                      ? "You can update the invoice details and submit the corrected version to finance again."
                      : "The latest version is already visible to finance. Sending again will replace the current finance copy for this booking."}
                </p>
                {existingInvoice.financeNotes ? (
                  <p className="mt-2 text-xs font-medium text-slate-700">
                    Finance note: {existingInvoice.financeNotes}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/70 bg-white px-3 py-1.5 font-medium text-slate-700">
                  Status: {existingInvoice.status}
                </span>
                {existingInvoice.submittedAt ? (
                  <span className="rounded-full border border-white/70 bg-white px-3 py-1.5 font-medium text-slate-700">
                    Submitted: {formatDisplayDate(existingInvoice.submittedAt)}
                  </span>
                ) : null}
                {existingInvoice.payoutDate ? (
                  <span className="rounded-full border border-white/70 bg-white px-3 py-1.5 font-medium text-slate-700">
                    Paid: {formatDisplayDate(existingInvoice.payoutDate)}
                  </span>
                ) : null}
                {existingInvoice.payoutReference ? (
                  <span className="rounded-full border border-white/70 bg-white px-3 py-1.5 font-medium text-slate-700">
                    Ref: {existingInvoice.payoutReference}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-gray-500">
              Supplier Name <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={Building2} iconWrapClassName="bg-indigo-100 text-indigo-700">
              <input
                value={invoiceMeta.supplierName}
                onChange={(e) => handleMetaChange("supplierName", e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-11 pr-2 text-sm"
                placeholder="DMC Company Name"
              />
            </FieldShell>
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Invoice Number <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={Receipt} iconWrapClassName="bg-violet-100 text-violet-700">
              <input
                value={invoiceMeta.invoiceNumber}
                onChange={(e) => handleMetaChange("invoiceNumber", e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-11 pr-2 text-sm"
                placeholder="INV-2026-0001"
              />
            </FieldShell>
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Invoice Date <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={Calendar} iconWrapClassName="bg-amber-100 text-amber-700">
              <input
                type="date"
                value={invoiceMeta.invoiceDate}
                onChange={(e) => handleMetaChange("invoiceDate", e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-11 pr-2 text-sm"
              />
            </FieldShell>
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Credit Period <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={Calendar} iconWrapClassName="bg-lime-100 text-lime-700">
              <select
                value={invoiceMeta.creditPeriodDays}
                onChange={(e) => handleMetaChange("creditPeriodDays", e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-11 pr-2 text-sm"
              >
                {CREDIT_PERIOD_OPTIONS.map((days) => (
                  <option key={days} value={days}>
                    {days}-day credit
                  </option>
                ))}
              </select>
            </FieldShell>
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Due Date <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={Calendar} iconWrapClassName="bg-cyan-100 text-cyan-700">
              <input
                type="date"
                value={invoiceMeta.dueDate}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-11 pr-2 text-sm text-slate-700"
              />
            </FieldShell>
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Template <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={FileText} iconWrapClassName="bg-rose-100 text-rose-700">
              <select
                value={invoiceMeta.templateVariant}
                onChange={(e) => handleMetaChange("templateVariant", e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-11 pr-2 text-sm"
              >
                {TEMPLATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FieldShell>
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-lg border border-gray-300 shadow">
          <div className="flex items-center justify-between border-b border-gray-300 p-3">
            <p className="text-sm font-medium">Itemized Service Table</p>
          </div>

          <div className="custom-scroll overflow-x-auto pb-2">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[130px_1.8fr_110px_100px_130px_130px_130px] items-center gap-3 border-b border-gray-300 p-3 text-center font-bold text-xs text-gray-700">
                <span>Type</span>
                <span>Service Name</span>
                <span>Currency</span>
                <span>Quantity</span>
                <span>Net Rate</span>
                <span>Subtotal</span>
                <span>Tax</span>
              </div>

              {items.map((item, index) => (
                <div
                  key={`invoice-item-${index}`}
                  className="grid grid-cols-[130px_1.8fr_110px_100px_130px_130px_130px] items-center gap-3 border-b border-gray-100 p-4 last:border-b-0"
                >
                  <FieldShell
                    icon={getServiceTypeIcon(item.type)}
                    iconWrapClassName="bg-blue-100 text-blue-700"
                  >
                    <input
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-11 pr-2 text-sm text-slate-700 outline-none"
                      value={item.type}
                      readOnly
                    />
                  </FieldShell>

                  <FieldShell
                    icon={getServiceTypeIcon(item.type)}
                    iconWrapClassName="bg-emerald-100 text-emerald-700"
                  >
                    <input
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-11 pr-2 text-xs text-slate-700 outline-none"
                      placeholder="Service name"
                      value={item.service}
                      readOnly
                    />
                  </FieldShell>

                  <FieldShell
                    icon={getCurrencyIcon(item.currency)}
                    iconWrapClassName="bg-fuchsia-100 text-fuchsia-700"
                  >
                    <select
                      className="w-full rounded-xl border border-gray-300 py-2 pl-11 pr-2 text-sm outline-none"
                      value={item.currency}
                      onChange={(e) =>
                        handleItemChange(index, "currency", e.target.value)
                      }
                    >
                      <option>INR</option>
                      <option>USD</option>
                      <option>AED</option>
                      <option>EUR</option>
                      <option>THB</option>
                    </select>
                  </FieldShell>

                  <FieldShell icon={Hash} iconWrapClassName="bg-sky-100 text-sky-700">
                    <input
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-11 pr-2 text-sm text-slate-700 outline-none"
                      value={item.qty}
                      type="number"
                      readOnly
                    />
                  </FieldShell>

                  <FieldShell
                    icon={getCurrencyIcon(item.currency)}
                    iconWrapClassName="bg-orange-100 text-orange-700"
                  >
                    <input
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-11 pr-2 text-sm text-slate-700 outline-none"
                      placeholder="0.00"
                      value={item.rate}
                      type="number"
                      readOnly
                    />
                  </FieldShell>

                  <FieldShell icon={FileText} iconWrapClassName="bg-cyan-100 text-cyan-700">
                    <input
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-11 pr-2 text-sm outline-none"
                      value={item.subtotal}
                      readOnly
                    />
                  </FieldShell>

                  <FieldShell
                    icon={getCurrencyIcon(item.currency)}
                    iconWrapClassName="bg-emerald-100 text-emerald-700"
                  >
                    <input
                      className="w-full rounded-xl border border-gray-300 bg-emerald-50 py-2 pl-11 pr-2 text-sm text-emerald-700 outline-none"
                      placeholder="0.00"
                      value={item.tax}
                      readOnly
                    />
                  </FieldShell>

                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="mb-3 text-sm font-medium">Tax Configuration</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="w-28 text-xs">GST Rate (%)</label>

                <FieldShell icon={DollarSign} iconWrapClassName="bg-blue-100 text-blue-700">
                  <input
                    className="w-24 rounded-lg border border-gray-400 py-2 pl-11 pr-2 text-sm"
                    value={taxConfig.gstRate}
                    onChange={(e) => handleTaxChange("gstRate", e.target.value)}
                  />
                </FieldShell>

                <span className="text-xs text-gray-600">
                  Auto-calculated on subtotal
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="w-28 text-xs">TCS Rate (%)</label>

                <FieldShell icon={Receipt} iconWrapClassName="bg-violet-100 text-violet-700">
                  <input
                    className="w-24 rounded-lg border border-gray-400 py-2 pl-11 pr-2 text-sm"
                    value={taxConfig.tcsRate}
                    onChange={(e) => handleTaxChange("tcsRate", e.target.value)}
                  />
                </FieldShell>

                <span className="text-xs text-gray-600">
                  Tax Collected at Source
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="w-28 text-xs">Other Tax</label>

                <FieldShell icon={DollarSign} iconWrapClassName="bg-amber-100 text-amber-700">
                  <input
                    className="w-24 rounded-lg border border-gray-400 py-2 pl-11 pr-2 text-sm"
                    value={taxConfig.otherTax}
                    onChange={(e) => handleTaxChange("otherTax", e.target.value)}
                  />
                </FieldShell>

                <span className="text-xs text-gray-600">Fixed amount</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-300 bg-sky-50 p-4">
            <p className="mb-4 text-sm font-medium">Invoice Summary</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(summary.subtotal)}</span>
              </div>

              <div className="flex justify-between text-blue-600">
                <span>GST ({taxConfig.gstRate}%)</span>
                <span>+ {formatMoney(summary.gstAmount)}</span>
              </div>

              <div className="flex justify-between text-blue-600">
                <span>TCS ({taxConfig.tcsRate}%)</span>
                <span>+ {formatMoney(summary.tcsAmount)}</span>
              </div>

              <div className="flex justify-between text-blue-600">
                <span>Other Tax</span>
                <span>+ {formatMoney(summary.otherTaxAmount)}</span>
              </div>

              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Total Tax</span>
                <span>{formatMoney(summary.totalTax)}</span>
              </div>

              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Grand Total</span>
                <span>{formatMoney(summary.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-400 p-4">
        <button
          onClick={handleSaveDraft}
          className="cursor-pointer rounded-xl border px-4 py-2 text-sm"
        >
          Save as Draft
        </button>

        <button
          onClick={handleGenerateInvoice}
          disabled={isGenerating || isFinanceVerified}
          className={`rounded-xl px-4 py-2 text-sm text-white ${isGenerating || isFinanceVerified
              ? "cursor-not-allowed bg-slate-400"
              : "cursor-pointer bg-gray-900"
            }`}
        >
          {isFinanceVerified
            ? "Verified by Finance"
            : isGenerating
              ? "Sending..."
              : existingInvoice?.status === "Rejected" || existingInvoice?.status === "Submitted" || existingInvoice?.status === "In Review"
                ? "Update & Resend to Finance"
                : "Generate & Send to Finance"}
        </button>
      </div>

      <AnimatePresence>
        {actionPopup && (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="pointer-events-none fixed top-6 right-6 z-50"
          >
            <div className="pointer-events-auto relative w-[360px] overflow-hidden rounded-[26px] border border-white/60 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.24)] backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500" />
              <div className="px-5 pb-4 pt-5">
                <div className="flex items-start gap-3">
                  <motion.div
                    initial={{ rotate: -10, scale: 0.88 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.08, duration: 0.24, ease: "easeOut" }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg"
                  >
                    <CheckCircle2 size={22} />
                  </motion.div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-600/80">
                      Internal Invoice
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {actionPopup.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {actionPopup.message}
                    </p>
                    <div className="mt-3 inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                      {selectedQuery?.queryId || "Current booking"} ready
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActionPopup(null)}
                    className="rounded-full bg-slate-100 p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
