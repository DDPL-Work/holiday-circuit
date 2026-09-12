import {
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  Car,
  ChevronDown,
  CheckCircle2,
  Clock,
  Coins,
  Compass,
  DollarSign,
  IndianRupee,
  FileText,
  Hash,
  Landmark,
  MapPin,
  Receipt,
  Upload,
  X,
  AlertCircle,
  Info,
  XCircle,
  Edit3,
  Wand2,
  Sparkles,
  Check,
} from "lucide-react";
import { createElement, useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotatingLines } from "react-loader-spinner";
import toast from "react-hot-toast";
import API from "../../utils/Api";
import { useSelector } from "react-redux";
import { gsap } from "gsap";

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

const CREDIT_PERIOD_OPTIONS = [7, 15, 0];

const TEMPLATE_OPTIONS = [
  { value: "aurora-ledger", label: "Aurora Ledger" },
  { value: "classic-ledger", label: "Classic Ledger" },
  { value: "compact-ledger", label: "Compact Ledger" },
  { value: "finance-ledger", label: "Finance Ledger" },
];

const normalizeTemplateVariant = (value) =>
  TEMPLATE_OPTIONS.some((option) => option.value === value) ? value : "aurora-ledger";

const normalizeCreditPeriodDays = (value, options = [7, 15]) => {
  const numericValue = Number(value);
  return options.includes(numericValue) ? numericValue : (options[0] !== undefined ? options[0] : 7);
};

const getCreditPeriodFromDates = (invoiceDate, dueDate, options = [7, 15]) => {
  if (!invoiceDate || !dueDate) return options[0] !== undefined ? options[0] : 7;
  const parsedInvoiceDate = new Date(invoiceDate);
  const parsedDueDate = new Date(dueDate);
  if (Number.isNaN(parsedInvoiceDate.getTime()) || Number.isNaN(parsedDueDate.getTime())) return options[0] !== undefined ? options[0] : 7;

  parsedInvoiceDate.setHours(0, 0, 0, 0);
  parsedDueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((parsedDueDate - parsedInvoiceDate) / (1000 * 60 * 60 * 24));
  return normalizeCreditPeriodDays(diffDays, options);
};

const EMPTY_CLAIMED_SUMMARY = {
  subtotal: "",
  taxAmount: "",
  grandTotal: "",
};

const normalizeClaimedInputValue = (value) => {
  if (value === undefined || value === null || value === "") return "";
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.round(numericValue) : "";
};

const buildClaimedSummaryFromFields = (fields = {}) => ({
  subtotal: normalizeClaimedInputValue(fields.subtotal),
  taxAmount: normalizeClaimedInputValue(fields.taxAmount),
  grandTotal: normalizeClaimedInputValue(fields.grandTotal),
});

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
  const subtotal = Math.round((qty * rate) + addonTotal);
  const tax = Math.round((subtotal * Number(gstRate || 0)) / 100);

  return {
    ...item,
    qty,
    rate,
    addonTotal,
    subtotal,
    tax,
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
  const storedUser = typeof window !== "undefined" ? (() => {
    try {
      return JSON.parse(window.sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })() : null;

  const reduxUser = useSelector((state) => state.auth?.user);

  const resolvedCreditDays = useMemo(() => {
    if (reduxUser && Array.isArray(reduxUser.creditDays) && reduxUser.creditDays.length > 0) {
      return reduxUser.creditDays.map(Number);
    }
    if (storedUser && Array.isArray(storedUser.creditDays) && storedUser.creditDays.length > 0) {
      return storedUser.creditDays.map(Number);
    }
    if (storedUser && storedUser.creditDays !== undefined) {
      const parsed = Number(storedUser.creditDays);
      if (!Number.isNaN(parsed)) return [parsed];
    }
    return [7, 15];
  }, [reduxUser, storedUser]);

  const draftStorageKey = getDraftStorageKey(selectedQuery?.queryId);
  const existingInvoice = selectedQuery?.internalInvoice || null;
  const isFinanceVerified = ["Approved", "Paid"].includes(
    String(existingInvoice?.status || "").trim(),
  );
  const isBulkSettled = selectedQuery?.isBulkSettled || false;
  const bulkBatchNumber = selectedQuery?.bulkBatchNumber || "";
  const isLocked = isFinanceVerified;
  console.log("INTERNAL INVOICE DEBUG: selectedQuery ID =", selectedQuery?._id, "isBulkSettled =", isBulkSettled, "bulkBatchNumber =", bulkBatchNumber);
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
    getCreditPeriodFromDates(initialInvoiceDate, initialDueDate, resolvedCreditDays),
    resolvedCreditDays
  );

  const [invoiceMeta, setInvoiceMeta] = useState({
    supplierName:
      existingInvoice?.supplierName ||
      existingDraft?.invoiceMeta?.supplierName ||
      storedUser?.companyName ||
      storedUser?.name ||
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

  useEffect(() => {
    if (resolvedCreditDays.length > 0 && !resolvedCreditDays.includes(invoiceMeta.creditPeriodDays)) {
      const defaultVal = resolvedCreditDays[0];
      setInvoiceMeta((prev) => ({
        ...prev,
        creditPeriodDays: defaultVal,
        dueDate: addDaysToDate(prev.invoiceDate, defaultVal),
      }));
    }
  }, [resolvedCreditDays]);
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
  const [invoiceSource, setInvoiceSource] = useState(
    existingInvoice?.invoiceSource || existingDraft?.invoiceSource || "system_template",
  );
  const [uploadedInvoiceFile, setUploadedInvoiceFile] = useState(null);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [invoiceExtraction, setInvoiceExtraction] = useState(
    existingInvoice?.invoiceExtraction || existingDraft?.invoiceExtraction || null,
  );
  const [isExtractionOpen, setIsExtractionOpen] = useState(
    Boolean(existingInvoice?.invoiceExtraction || existingDraft?.invoiceExtraction),
  );
  const [claimedSummary, setClaimedSummary] = useState(() => {
    if (existingInvoice?.claimedSummary) {
      return buildClaimedSummaryFromFields(existingInvoice.claimedSummary);
    }
    if (existingDraft?.invoiceExtraction && existingDraft?.claimedSummary) {
      return buildClaimedSummaryFromFields(existingDraft.claimedSummary);
    }
    return EMPTY_CLAIMED_SUMMARY;
  });
  const [manuallyEditedFields, setManuallyEditedFields] = useState({
    subtotal: false,
    taxAmount: false,
    grandTotal: false,
  });
  const [dmcRemarks, setDmcRemarks] = useState(
    existingInvoice?.dmcRemarks || existingDraft?.dmcRemarks || "",
  );

  const handleClaimedSummaryChange = (field, value) => {
    const parsedValue = value === "" ? "" : Math.round(Number(value));
    setClaimedSummary((prev) => ({
      ...prev,
      [field]: parsedValue,
    }));
    setManuallyEditedFields((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleMatchSystemReference = () => {
    setClaimedSummary({
      subtotal: Math.round(Number(summary.subtotal || 0)),
      taxAmount: Math.round(Number(summary.totalTax || 0)),
      grandTotal: Math.round(Number(summary.grandTotal || 0)),
    });
    setManuallyEditedFields({
      subtotal: true,
      taxAmount: true,
      grandTotal: true,
    });
    toast.success("System Reference amounts applied to invoice inputs");
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [actionPopup, setActionPopup] = useState(null);
  const [showReuploadConfirm, setShowReuploadConfirm] = useState(false);
  const [showTopWarning, setShowTopWarning] = useState(false);
  const [showBulkLockModal, setShowBulkLockModal] = useState(false);
  const laserRef = useRef(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (isBulkSettled) {
      setShowTopWarning(true);
    } else {
      setShowTopWarning(false);
      setShowBulkLockModal(false);
    }
  }, [isBulkSettled, selectedQuery?.queryId]);

  useEffect(() => {
    let anim;
    if (isFileUploading && laserRef.current) {
      anim = gsap.fromTo(
        laserRef.current,
        { top: "0%" },
        {
          top: "100%",
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
        }
      );
    }
    return () => {
      if (anim) anim.kill();
    };
  }, [isFileUploading]);

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
        const creditPeriodDays = normalizeCreditPeriodDays(value, resolvedCreditDays);
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

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    setUploadedInvoiceFile(file);
    setIsFileUploading(true);
    setInvoiceExtraction(null);
    setIsExtractionOpen(false);

    try {
      const formData = new FormData();
      formData.append("uploadedInvoice", file);
      formData.append("claimedSummary", JSON.stringify(claimedSummary));
      formData.append("expectedSummary", JSON.stringify({
        ...summary,
        currency: items[0]?.currency || "INR",
      }));

      const { data } = await API.post("/dmc/internal-invoice/parse-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const extraction = data?.data || null;
      const fields = extraction?.fields || {};
      setInvoiceExtraction(extraction);
      setIsExtractionOpen(true);

      if (fields.invoiceNumber || fields.invoiceDate || fields.dueDate || fields.supplierName) {
        setInvoiceMeta((prev) => {
          const nextInvoiceDate = fields.invoiceDate || prev.invoiceDate;
          const nextDueDate =
            fields.dueDate ||
            (fields.invoiceDate ? addDaysToDate(fields.invoiceDate, prev.creditPeriodDays) : prev.dueDate);

          return {
            ...prev,
            supplierName: fields.supplierName || prev.supplierName,
            invoiceNumber: createInvoiceNumber(selectedQuery?.queryId) || (fields.invoiceNumber ? (fields.invoiceNumber.startsWith("INV-") ? fields.invoiceNumber : `INV-${fields.invoiceNumber}`) : prev.invoiceNumber),
            invoiceDate: nextInvoiceDate,
            dueDate: nextDueDate,
            creditPeriodDays: getCreditPeriodFromDates(nextInvoiceDate, nextDueDate, resolvedCreditDays),
          };
        });
      }

      setClaimedSummary(buildClaimedSummaryFromFields(fields));
      setManuallyEditedFields({
        subtotal: false,
        taxAmount: false,
        grandTotal: false,
      });

      if (extraction?.status === "parsed") {
        toast.success("Invoice parsed and values filled");
      } else {
        toast("Invoice uploaded. Please review fields manually.");
      }
    } catch (error) {
      setInvoiceExtraction({
        status: "failed",
        source: "upload",
        error: error?.response?.data?.message || "Unable to parse this invoice automatically.",
      });
      setIsExtractionOpen(true);
      toast.error(error?.response?.data?.message || "Invoice uploaded, parser needs manual review");
    } finally {
      setIsFileUploading(false);
      event.target.value = "";
    }
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
    `${currencyPrefix} ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

  const handleSaveDraft = ({ silent = false } = {}) => {
    if (typeof window === "undefined") return;

    if (isBulkSettled) {
      setShowBulkLockModal(true);
      return;
    }

    const payload = {
      invoiceMeta,
      invoiceSource,
      items,
      taxConfig,
      summary,
      claimedSummary,
      dmcRemarks,
      invoiceExtraction,
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

  const handleGenerateInvoice = async (bypassConfirm = false) => {
    if (isGenerating) return;

    if (isFinanceVerified) {
      toast.error(
        "Finance has already verified this internal invoice. It cannot be sent again.",
      );
      return;
    }

    if (isBulkSettled) {
      setShowBulkLockModal(true);
      return;
    }

    if (!selectedQuery?.queryId) {
      toast.error("Please select a confirmed query first");
      return;
    }

    const needsTemplate = invoiceSource === "system_template";
    if (
      !invoiceMeta.supplierName ||
      !invoiceMeta.invoiceNumber ||
      !invoiceMeta.invoiceDate ||
      !invoiceMeta.dueDate ||
      (needsTemplate && !invoiceMeta.templateVariant)
    ) {
      toast.error("Please fill all invoice header fields");
      return;
    }

    if (invoiceSource === "uploaded_invoice") {
      const hasUploadedFile = Boolean(
        uploadedInvoiceFile ||
        existingInvoice?.uploadedInvoice?.url ||
        existingInvoice?.uploadedInvoice?.filePath ||
        existingInvoice?.uploadedInvoice?.name
      );

      if (!hasUploadedFile) {
        toast.error("Please upload your invoice PDF or Word document");
        return;
      }

      if (Number(claimedSummary.grandTotal || 0) <= 0) {
        toast.error("Please enter claimed invoice total");
        return;
      }


      const subtotalMismatch = Math.abs(Math.round(Number(claimedSummary.subtotal || 0)) - Math.round(Number(summary.subtotal || 0))) > 1;
      const taxMismatch = Math.abs(Math.round(Number(claimedSummary.taxAmount || 0)) - Math.round(Number(summary.totalTax || 0))) > 1;
      const totalMismatch = Math.abs(Math.round(Number(claimedSummary.grandTotal || 0)) - Math.round(Number(summary.grandTotal || 0))) > 1;
      const hasMismatch = subtotalMismatch || taxMismatch || totalMismatch;

      if (!dmcRemarks || !String(dmcRemarks).trim()) {
        toast.error(
          hasMismatch
            ? "Rate mismatch detected. Please enter mandatory remarks/justification explaining why the uploaded amount differs before sending to Finance."
            : "Please enter mandatory DMC invoice remarks before sending to Finance."
        );
        return;
      }
    }

    const hasInvalidItem = items.some(
      (item) => !item.service || Number(item.qty || 0) <= 0 || Number(item.rate || 0) < 0,
    );

    if (hasInvalidItem) {
      toast.error("Please complete all line items before generating invoice");
      return;
    }

    if (existingInvoice?.status && !bypassConfirm) {
      setShowReuploadConfirm(true);
      return;
    }

    setIsGenerating(true);



    try {
      if (invoiceSource === "uploaded_invoice") {
        const formData = new FormData();
        formData.append("queryId", selectedQuery?.queryId || selectedQuery?._id);
        formData.append("invoiceSource", invoiceSource);
        formData.append("invoiceMeta", JSON.stringify({ ...invoiceMeta, invoiceSource, dmcRemarks: String(dmcRemarks || "").trim(), templateVariant: "" }));
        formData.append("dmcRemarks", String(dmcRemarks || "").trim());
        formData.append("items", JSON.stringify(items));
        formData.append("taxConfig", JSON.stringify(taxConfig));
        formData.append("summary", JSON.stringify({
          ...summary,
          currency: items[0]?.currency || "INR",
        }));
        formData.append("claimedSummary", JSON.stringify(claimedSummary));
        if (uploadedInvoiceFile) {
          formData.append("uploadedInvoice", uploadedInvoiceFile);
        }

        await API.post("/dmc/internal-invoice", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await API.post("/dmc/internal-invoice", {
          queryId: selectedQuery?.queryId || selectedQuery?._id,
          invoiceSource,
          invoiceMeta: { ...invoiceMeta, invoiceSource, dmcRemarks: String(dmcRemarks || "").trim() },
          dmcRemarks: String(dmcRemarks || "").trim(),
          items,
          taxConfig,
          summary: {
            ...summary,
            currency: items[0]?.currency || "INR",
          },
          claimedSummary,
          templateVariant: invoiceMeta.templateVariant,
        });
      }

      handleSaveDraft({ silent: true });
      showActionPopup(
        "Sent to Finance Team",
        invoiceSource === "uploaded_invoice"
          ? "Your uploaded invoice file has been sent to finance for review and payout processing."
          : "Company template invoice has been submitted to finance for review and payout processing.",
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
    <div className="mt-6 rounded-lg bg-white border border-slate-200 transition-all duration-300 overflow-hidden relative shadow-sm">
      <AnimatePresence>
        {showTopWarning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full overflow-hidden"
          >
            <div className="w-full bg-rose-50 border-b border-rose-200 text-rose-900 px-5 py-2.5 text-[11px] sm:text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-600 shrink-0" />
                <span className="leading-relaxed">
                  <strong>Bulk Settlement Lock:</strong> This booking has already been submitted to the finance team in bulk settlement batch <span className="font-mono font-bold text-rose-700 bg-rose-100/60 px-1.5 py-0.5 rounded">{bulkBatchNumber}</span>. A single invoice cannot be sent.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTopWarning(false)}
                className="text-rose-400 hover:text-rose-800 transition p-1 hover:bg-rose-100/50 rounded-lg shrink-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-tr from-[#1e3a8a] via-[#111827] to-slate-900 text-white shadow-sm ring-1 ring-slate-200">
              <FileText size={18} />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white ring-1 ring-white">
                ✓
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Internal Invoice Details (DMC to System)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                Invoice rows are auto-filled from booked services and remain fully editable.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
              Finance Integrated
            </span>
          </div>
        </div>

        <div className="relative mt-4 flex items-center overflow-hidden rounded-md bg-slate-100 border border-slate-200 p-1 text-xs shadow-inner">
          <button
            type="button"
            onClick={() => setInvoiceSource("system_template")}
            className={`relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md py-2 transition-all duration-300 ${
              invoiceSource === "system_template"
                ? "font-bold text-white"
                : "text-slate-600 hover:text-slate-900 font-medium"
            }`}
          >
            {invoiceSource === "system_template" && (
              <motion.span
                layoutId="invoice-source-tab-pill"
                className="absolute inset-0 rounded-md bg-gradient-to-r from-[#1e3a8a] via-[#111827] to-black shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <FileText size={13} />
              Use Company Template
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInvoiceSource("uploaded_invoice")}
            className={`relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md py-2 transition-all duration-300 ${
              invoiceSource === "uploaded_invoice"
                ? "font-bold text-white"
                : "text-slate-600 hover:text-slate-900 font-medium"
            }`}
          >
            {invoiceSource === "uploaded_invoice" && (
              <motion.span
                layoutId="invoice-source-tab-pill"
                className="absolute inset-0 rounded-md bg-gradient-to-r from-[#1e3a8a] via-[#111827] to-black shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Upload size={13} />
              Upload Own Invoice
            </span>
          </button>
        </div>

        {existingInvoice?.status ? (
          <div
            className={`mt-4 rounded-md border px-4 py-3 ${isFinanceVerified
                ? "border-emerald-200 bg-emerald-50/80"
                : existingInvoice.status === "Rejected"
                  ? "border-rose-200 bg-rose-50/80"
                  : "border-sky-200 bg-sky-50/80"
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
                <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs">
                  Status: {existingInvoice.status}
                </span>
                {existingInvoice.submittedAt ? (
                  <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs">
                    Submitted: {formatDisplayDate(existingInvoice.submittedAt)}
                  </span>
                ) : null}
                {existingInvoice.payoutDate ? (
                  <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs">
                    Paid: {formatDisplayDate(existingInvoice.payoutDate)}
                  </span>
                ) : null}
                {existingInvoice.payoutReference ? (
                  <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs">
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
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Supplier Name <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={Briefcase} iconWrapClassName="bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 shadow-sm">
              <input
                value={invoiceMeta.supplierName}
                onChange={(e) => handleMetaChange("supplierName", e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-blue-50/20 py-2 pl-10 pr-3 text-sm text-slate-800 shadow-2xs focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all"
                placeholder="DMC Company Name"
              />
            </FieldShell>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Invoice Number <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={Hash} iconWrapClassName="bg-gradient-to-tr from-sky-50 to-cyan-50 border border-sky-100 text-sky-600 shadow-sm">
              <input
                value={invoiceMeta.invoiceNumber}
                onChange={(e) => handleMetaChange("invoiceNumber", e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-sky-50/20 py-2 pl-10 pr-3 text-sm text-slate-800 shadow-2xs focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all"
                placeholder="INV-2026-0001"
              />
            </FieldShell>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Invoice Date <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={Calendar} iconWrapClassName="bg-gradient-to-tr from-orange-50 to-amber-50 border border-orange-100 text-orange-600 shadow-sm">
              <input
                type="date"
                value={invoiceMeta.invoiceDate}
                onChange={(e) => handleMetaChange("invoiceDate", e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-orange-50/20 py-2 pl-10 pr-3 text-sm text-slate-800 shadow-2xs focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all"
              />
            </FieldShell>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Credit Period <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={Clock} iconWrapClassName="bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-600 shadow-sm">
              <select
                value={invoiceMeta.creditPeriodDays}
                onChange={(e) => handleMetaChange("creditPeriodDays", e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-emerald-50/15 py-2 pl-10 pr-3 text-sm text-slate-800 shadow-2xs focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all cursor-pointer"
              >
                {resolvedCreditDays.map((days) => (
                  <option key={days} value={days}>
                    {Number(days) === 0 ? "Immediate (0-day credit)" : `${days}-day credit`}
                  </option>
                ))}
              </select>
            </FieldShell>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Due Date <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={CalendarDays} iconWrapClassName="bg-gradient-to-tr from-rose-50 to-red-50 border border-rose-100 text-rose-600 shadow-sm">
              <input
                type="date"
                value={invoiceMeta.dueDate}
                readOnly
                className="w-full rounded-md border border-slate-300 bg-rose-50/15 py-2 pl-10 pr-3 text-sm text-slate-700 shadow-2xs outline-none cursor-not-allowed"
              />
            </FieldShell>
          </div>

          {invoiceSource === "system_template" ? (
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Template <span className="text-red-600">*</span>
              </label>
              <FieldShell icon={FileText} iconWrapClassName="bg-gradient-to-tr from-violet-50 to-indigo-50 border border-violet-100 text-violet-600 shadow-sm">
                <select
                  value={invoiceMeta.templateVariant}
                  onChange={(e) => handleMetaChange("templateVariant", e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-violet-50/20 py-2 pl-10 pr-3 text-sm text-slate-800 shadow-2xs focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                >
                  {TEMPLATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldShell>
            </div>
          ) : null}
        </div>

        {invoiceSource === "uploaded_invoice" ? (
          <div className="mb-6 rounded-md border border-slate-200 bg-slate-50/50 p-4 shadow-2xs">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/80 pb-4">
              <div className="max-w-xl">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                    <FileText size={14} />
                  </span>
                  Upload DMC Invoice
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Upload your PDF or Word invoice. This exact file will be sent to finance; no company template PDF will be generated in this mode.
                </p>
                {existingInvoice?.uploadedInvoice?.name && !uploadedInvoiceFile ? (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                    <CheckCircle2 size={12} className="text-blue-500 animate-pulse" />
                    <span>Existing: {existingInvoice.uploadedInvoice.name}</span>
                  </div>
                ) : null}
              </div>

              <div className="shrink-0 w-full lg:w-72">
                {isFileUploading ? (
                  <div className="flex min-h-[86px] items-center justify-center rounded-md border border-dashed border-blue-300 bg-white p-3.5 text-center shadow-2xs relative w-full lg:w-72 overflow-hidden">
                    <div className="relative w-11 h-14 bg-white border border-slate-200 rounded-md shadow-sm flex flex-col justify-around p-2 overflow-hidden shrink-0">
                      <div className="h-1 w-7 bg-sky-200 rounded" />
                      <div className="h-1 w-8 bg-sky-100 rounded" />
                      <div className="h-1 w-5 bg-emerald-500 rounded" />
                      <div className="h-1 w-7 bg-sky-200 rounded" />
                      <div className="h-1.5 w-6 bg-emerald-100 rounded" />
                      
                      {/* Laser Bar */}
                      <div 
                        ref={laserRef}
                        className="absolute left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_8px_#06b6d4,0_0_12px_#06b6d4] z-10" 
                      />
                    </div>
                    
                    <div className="flex flex-col items-start ml-3.5 text-left">
                      <span className="text-xs font-bold text-slate-800 animate-pulse">
                        Scanning Invoice...
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 font-medium leading-tight">
                        Reading text & verifying totals
                      </span>
                    </div>
                  </div>
                ) : uploadedInvoiceFile ? (
                  <div className="relative flex min-h-[86px] flex-col items-center justify-center rounded-md border border-emerald-200 bg-emerald-50/80 p-3.5 text-center shadow-2xs group hover:border-emerald-300 transition-all duration-300">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedInvoiceFile(null);
                        setInvoiceExtraction(null);
                        setIsExtractionOpen(false);
                        setClaimedSummary(EMPTY_CLAIMED_SUMMARY);
                      }}
                      className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-md bg-white text-rose-500 shadow-2xs border border-emerald-100 hover:bg-rose-50 hover:text-rose-700 transition"
                      title="Remove Invoice"
                    >
                      <X size={11} />
                    </button>

                    <CheckCircle2 size={22} className="mb-1 text-emerald-600 animate-scale-in" />
                    <span className="max-w-[200px] truncate text-xs font-bold text-slate-800">
                      {uploadedInvoiceFile.name}
                    </span>
                    <span className="mt-0.5 text-[10px] text-emerald-600 font-semibold">
                      Successfully processed
                    </span>
                  </div>
                ) : (
                  <label className="flex min-h-[86px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-2xs transition hover:border-blue-400 hover:bg-blue-50/30 group">
                    <Upload size={18} className="mb-1 text-blue-500 transition-transform group-hover:-translate-y-0.5 duration-200" />
                    <span className="text-xs font-bold text-slate-700">Choose Invoice</span>
                    <span className="mt-0.5 text-[10px] font-normal text-slate-400">PDF, DOCX, JPG, PNG up to 10MB</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>

            {invoiceExtraction ? (
              (() => {
                const rawOcrFields = invoiceExtraction.fields || {};
                const activeInvoiceNumber = invoiceMeta.invoiceNumber || rawOcrFields.invoiceNumber || "";
                const activeInvoiceDate = invoiceMeta.invoiceDate || rawOcrFields.invoiceDate || "";
                const activeSubtotal =
                  claimedSummary.subtotal !== "" && claimedSummary.subtotal !== undefined && claimedSummary.subtotal !== null
                    ? Number(claimedSummary.subtotal)
                    : (rawOcrFields.subtotal !== undefined ? Number(rawOcrFields.subtotal) : null);
                const activeTaxAmount =
                  claimedSummary.taxAmount !== "" && claimedSummary.taxAmount !== undefined && claimedSummary.taxAmount !== null
                    ? Number(claimedSummary.taxAmount)
                    : (rawOcrFields.taxAmount !== undefined ? Number(rawOcrFields.taxAmount) : null);
                const activeGrandTotal =
                  claimedSummary.grandTotal !== "" && claimedSummary.grandTotal !== undefined && claimedSummary.grandTotal !== null
                    ? Number(claimedSummary.grandTotal)
                    : (rawOcrFields.grandTotal !== undefined ? Number(rawOcrFields.grandTotal) : null);

                const isFieldManuallyEdited = (key) => {
                  if (manuallyEditedFields[key]) return true;
                  if (key === "subtotal" || key === "taxAmount" || key === "grandTotal") {
                    if (claimedSummary[key] === "" || claimedSummary[key] === undefined || claimedSummary[key] === null) return false;
                    if (rawOcrFields[key] === undefined || rawOcrFields[key] === null) return true;
                    return Math.round(Number(claimedSummary[key])) !== Math.round(Number(rawOcrFields[key] || 0));
                  }
                  if (key === "invoiceNumber" || key === "invoiceDate") {
                    return Boolean(invoiceMeta[key] && rawOcrFields[key] && invoiceMeta[key] !== rawOcrFields[key]);
                  }
                  return false;
                };

                const amountMatches = (val, expected) => {
                  if (val === null || val === undefined || val === "") return false;
                  const numVal = Math.round(Number(val));
                  const numExp = Math.round(Number(expected || 0));
                  if (numExp === 0) return numVal === 0;
                  return numVal > 0 && Math.abs(numVal - numExp) <= 1;
                };

                const subtotalMatches = amountMatches(activeSubtotal, summary.subtotal);
                const taxMatches = amountMatches(activeTaxAmount, summary.totalTax);
                const totalMatches = amountMatches(activeGrandTotal, summary.grandTotal);
                const invoiceMatches = Boolean(activeInvoiceNumber);
                const dateMatches = Boolean(activeInvoiceDate);

                const allCardsMatch = invoiceMatches && dateMatches && subtotalMatches && taxMatches && totalMatches;
                const hasManualCorrections =
                  isFieldManuallyEdited("subtotal") ||
                  isFieldManuallyEdited("taxAmount") ||
                  isFieldManuallyEdited("grandTotal") ||
                  isFieldManuallyEdited("invoiceNumber") ||
                  isFieldManuallyEdited("invoiceDate");

                const getCurrencySymbol = (currency) => {
                  const cur = String(currency || '').trim().toUpperCase();
                  if (cur === 'INR') return '₹';
                  if (cur === 'USD') return '$';
                  if (cur === 'EUR') return '€';
                  if (cur === 'GBP') return '£';
                  if (cur === 'THB') return '฿';
                  return cur;
                };

                const getFieldCheckDetails = (label, key, activeVal, expectedVal, isAmount = false) => {
                  const matched = isAmount ? amountMatches(activeVal, expectedVal) : Boolean(activeVal);
                  const isManual = isFieldManuallyEdited(key);
                  const currency = rawOcrFields.currency || "INR";
                  let primaryValue = "-";
                  let secondaryValue = null;

                  if (isAmount) {
                    if (activeVal !== null && activeVal !== undefined && activeVal !== "") {
                      primaryValue = `${getCurrencySymbol(currency)} ${Math.round(Number(activeVal)).toLocaleString("en-IN")}`;
                    } else {
                      primaryValue = "-";
                    }

                    if (isManual && rawOcrFields[key] !== undefined && rawOcrFields[key] !== null) {
                      const ocrNum = Math.round(Number(rawOcrFields[key] || 0)).toLocaleString("en-IN");
                      if (rawOcrFields.conversionApplied && rawOcrFields.originalAmounts?.[key]) {
                        const origNum = Math.round(Number(rawOcrFields.originalAmounts[key] || 0)).toLocaleString("en-IN");
                        secondaryValue = `OCR: ${getCurrencySymbol(currency)} ${ocrNum} (from ${getCurrencySymbol(rawOcrFields.originalCurrency)} ${origNum})`;
                      } else {
                        secondaryValue = `OCR: ${getCurrencySymbol(currency)} ${ocrNum}`;
                      }
                    } else if (rawOcrFields.conversionApplied && Number(rawOcrFields.originalAmounts?.[key] || 0) > 0) {
                      secondaryValue = `from ${getCurrencySymbol(rawOcrFields.originalCurrency)} ${Math.round(Number(rawOcrFields.originalAmounts[key] || 0)).toLocaleString("en-IN")}`;
                    }
                  } else {
                    primaryValue = activeVal || "-";
                    if (isManual && rawOcrFields[key] && rawOcrFields[key] !== activeVal) {
                      secondaryValue = `OCR: ${rawOcrFields[key]}`;
                    }
                  }

                  return { label, key, primaryValue, secondaryValue, matched, isManual };
                };

                const fieldChecks = [
                  getFieldCheckDetails("Invoice", "invoiceNumber", activeInvoiceNumber, null, false),
                  getFieldCheckDetails("Date", "invoiceDate", activeInvoiceDate, null, false),
                  getFieldCheckDetails("Subtotal", "subtotal", activeSubtotal, summary.subtotal, true),
                  getFieldCheckDetails("Tax", "taxAmount", activeTaxAmount, summary.totalTax, true),
                  getFieldCheckDetails("Total", "grandTotal", activeGrandTotal, summary.grandTotal, true),
                ];

                return (
                  <div
                    className={`mt-4 overflow-hidden rounded-md border text-xs shadow-2xs transition-colors ${
                      allCardsMatch
                        ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                        : "border-rose-200 bg-rose-50/80 text-rose-900"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setIsExtractionOpen((prev) => !prev)}
                      className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-white/40 cursor-pointer"
                      aria-expanded={isExtractionOpen}
                    >
                      <div className="flex items-center gap-2">
                        {allCardsMatch ? (
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle size={15} className="text-rose-600 shrink-0" />
                        )}
                        <span className="font-bold uppercase tracking-[0.16em]">
                          {allCardsMatch ? "Parser / OCR Check · Verified" : "Parser / OCR Check · Review Needed"}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-2 rounded-md bg-white border border-slate-200 px-2.5 py-0.5 font-semibold text-slate-700 shadow-2xs">
                        {(invoiceExtraction.source || "parser").replace(/_/g, " ")} · {invoiceExtraction.confidence || 0}% confidence
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-300 ${isExtractionOpen ? "rotate-180" : ""}`}
                        />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExtractionOpen ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-slate-200/60 px-4 pb-4 pt-4">
                            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                              {fieldChecks.map((field) => (
                                <div
                                  key={field.label}
                                  className={`flex flex-col justify-between rounded-md border p-2.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                                    field.matched
                                      ? "border-emerald-300 bg-emerald-500/10 text-emerald-950 ring-1 ring-emerald-400/20"
                                      : "border-rose-200/80 bg-rose-500/10 text-rose-950"
                                  }`}
                                >
                                  <div className="mb-1.5 flex items-center justify-between gap-1 flex-wrap">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">
                                      {field.label}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {field.matched ? (
                                        <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                                      ) : (
                                        <XCircle size={13} className="shrink-0 text-rose-600" />
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs font-extrabold leading-tight">
                                    {field.primaryValue}
                                  </span>
                                  {field.secondaryValue && (
                                    <span className="mt-1 text-[10px] font-medium leading-normal text-slate-500/90 truncate" title={field.secondaryValue}>
                                      {field.secondaryValue}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {allCardsMatch ? (
                              <div className="mt-3.5 flex items-start gap-2.5 rounded-md border border-emerald-200/80 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-950 shadow-2xs">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                                <div>
                                  <span className="font-bold block">✓ All Invoice Values Verified Against System Reference</span>
                                  <span className="text-[11px] text-emerald-800">
                                    Uploaded invoice amounts match system reference totals ({currencyPrefix} {Math.round(summary.grandTotal).toLocaleString("en-IN")}). {hasManualCorrections ? "Manually verified & ready to send to Finance." : "Extracted values verified."}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3.5 flex items-start gap-2.5 rounded-md border border-rose-200/80 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-950 shadow-2xs">
                                <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                                <div>
                                  <span className="font-bold block">Rate / Amount Discrepancy Detected</span>
                                  <span className="text-[11px] text-rose-900">
                                    Uploaded invoice: Subtotal {formatMoney(activeSubtotal || 0)} (expected {formatMoney(summary.subtotal)}), Tax {formatMoney(activeTaxAmount || 0)} (expected {formatMoney(summary.totalTax)}), Total {formatMoney(activeGrandTotal || 0)} (expected {formatMoney(summary.grandTotal)}). You can send this invoice to Finance by providing mandatory justification in the remarks below.
                                  </span>
                                </div>
                              </div>
                            )}

                            {rawOcrFields.conversionApplied ? (
                              <div className="mt-2.5 flex items-start gap-2.5 rounded-md border border-blue-200/60 bg-blue-500/10 p-2.5 text-xs leading-relaxed text-blue-950 shadow-2xs">
                                <Info size={14} className="mt-0.5 shrink-0 text-blue-600" />
                                <span>Converted uploaded invoice from {rawOcrFields.originalCurrency} to {rawOcrFields.currency || "INR"} for comparison.</span>
                              </div>
                            ) : null}

                            {invoiceExtraction.error ? (
                              <div className="mt-2.5 flex items-start gap-2.5 rounded-md border border-rose-200/60 bg-rose-500/10 p-2.5 text-xs leading-relaxed text-rose-950 shadow-2xs">
                                <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-700" />
                                <span>{invoiceExtraction.error}</span>
                              </div>
                            ) : null}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })()
            ) : null}

            <div className="mt-5">
              <div className="mb-2.5 pb-2 border-b border-slate-200/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Uploaded Invoice Summary & Manual Inputs
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Adjust amounts if invoice parser extracted differing values.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Uploaded Subtotal
                    </label>
                    {claimedSummary.subtotal !== "" && Math.abs(Math.round(Number(claimedSummary.subtotal)) - Math.round(Number(summary.subtotal || 0))) <= 1 ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        <CheckCircle2 size={10} /> Matches System
                      </span>
                    ) : null}
                  </div>

                  <FieldShell icon={DollarSign} iconWrapClassName="bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 shadow-sm">
                    <input
                      type="number"
                      step="1"
                      value={claimedSummary.subtotal !== "" && claimedSummary.subtotal !== undefined && claimedSummary.subtotal !== null ? Math.round(Number(claimedSummary.subtotal)) : ""}
                      onChange={(event) => handleClaimedSummaryChange("subtotal", event.target.value)}
                      placeholder="Enter subtotal"
                      className={`w-full rounded-md border py-2 pl-10 pr-3 text-sm text-slate-900 shadow-2xs outline-none transition-all font-medium ${
                        claimedSummary.subtotal !== "" && Math.abs(Math.round(Number(claimedSummary.subtotal)) - Math.round(Number(summary.subtotal || 0))) <= 1
                          ? "border-emerald-300 bg-emerald-50/25 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                          : "border-slate-300 bg-blue-50/20 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      }`}
                    />
                  </FieldShell>
                  <p className="mt-1 text-[10px] text-slate-400 font-medium">
                    System Reference: <span className="font-semibold text-slate-600">{formatMoney(summary.subtotal)}</span>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Uploaded Tax
                    </label>
                    {claimedSummary.taxAmount !== "" && Math.abs(Math.round(Number(claimedSummary.taxAmount)) - Math.round(Number(summary.totalTax || 0))) <= 1 ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        <CheckCircle2 size={10} /> Matches System
                      </span>
                    ) : null}
                  </div>

                  <FieldShell icon={Receipt} iconWrapClassName="bg-gradient-to-tr from-rose-50 to-red-50 border border-rose-100 text-rose-600 shadow-sm">
                    <input
                      type="number"
                      step="1"
                      value={claimedSummary.taxAmount !== "" && claimedSummary.taxAmount !== undefined && claimedSummary.taxAmount !== null ? Math.round(Number(claimedSummary.taxAmount)) : ""}
                      onChange={(event) => handleClaimedSummaryChange("taxAmount", event.target.value)}
                      placeholder="Enter tax"
                      className={`w-full rounded-md border py-2 pl-10 pr-3 text-sm text-slate-900 shadow-2xs outline-none transition-all font-medium ${
                        claimedSummary.taxAmount !== "" && Math.abs(Math.round(Number(claimedSummary.taxAmount)) - Math.round(Number(summary.totalTax || 0))) <= 1
                          ? "border-emerald-300 bg-emerald-50/25 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                          : "border-slate-300 bg-rose-50/20 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      }`}
                    />
                  </FieldShell>
                  <p className="mt-1 text-[10px] text-slate-400 font-medium">
                    System Reference: <span className="font-semibold text-slate-600">{formatMoney(summary.totalTax)}</span> (GST {taxConfig.gstRate}% + TCS {taxConfig.tcsRate}% + Other)
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Uploaded Grand Total
                    </label>
                    {claimedSummary.grandTotal !== "" && Math.abs(Math.round(Number(claimedSummary.grandTotal)) - Math.round(Number(summary.grandTotal || 0))) <= 1 ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        <CheckCircle2 size={10} /> Matches System
                      </span>
                    ) : null}
                  </div>

                  <FieldShell icon={Coins} iconWrapClassName="bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-600 shadow-sm">
                    <input
                      type="number"
                      step="1"
                      value={claimedSummary.grandTotal !== "" && claimedSummary.grandTotal !== undefined && claimedSummary.grandTotal !== null ? Math.round(Number(claimedSummary.grandTotal)) : ""}
                      onChange={(event) => handleClaimedSummaryChange("grandTotal", event.target.value)}
                      placeholder="Enter total"
                      className={`w-full rounded-md border py-2 pl-10 pr-3 text-sm text-slate-900 shadow-2xs outline-none transition-all font-bold ${
                        claimedSummary.grandTotal !== "" && Math.abs(Math.round(Number(claimedSummary.grandTotal)) - Math.round(Number(summary.grandTotal || 0))) <= 1
                          ? "border-emerald-300 bg-emerald-50/25 text-emerald-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                          : "border-slate-300 bg-emerald-50/20 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      }`}
                    />
                  </FieldShell>
                  <p className="mt-1 text-[10px] text-slate-400 font-medium">
                    System Reference: <span className="font-semibold text-emerald-700">{formatMoney(summary.grandTotal)}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span>DMC Invoice Remark / Clarification</span>
                    <span className="text-red-600 font-bold text-sm leading-none">*</span>
                    <span className="inline-flex items-center rounded bg-rose-50 border border-rose-200/80 px-1.5 py-0.2 text-[8px] font-extrabold text-rose-700 uppercase">
                      Mandatory
                    </span>
                  </label>
                  {dmcRemarks && String(dmcRemarks).trim().length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      <CheckCircle2 size={10} /> Remark Added
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      <AlertCircle size={10} /> Required before sending
                    </span>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={dmcRemarks}
                  onChange={(e) => setDmcRemarks(e.target.value)}
                  placeholder="Enter mandatory remarks for the Finance team (e.g., reason for invoice upload, rate verification details, service notes, or tax clarification)..."
                  className={`w-full rounded-md border p-3 text-xs text-slate-800 shadow-2xs outline-none transition-all placeholder:text-slate-400 font-medium ${
                    dmcRemarks && String(dmcRemarks).trim().length > 0
                      ? "border-emerald-300 bg-emerald-50/15 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                      : "border-slate-300 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  }`}
                />
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>This remark is sent directly to the Finance team along with your invoice.</span>
                  <span>{String(dmcRemarks || "").trim().length} characters</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-6 overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 p-3">
            <p className="text-xs font-bold text-slate-800 tracking-wide uppercase">Itemized Service Table</p>
          </div>

          <div className="custom-scroll overflow-x-auto pb-2">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[130px_1.8fr_110px_100px_130px_130px_130px] items-center gap-3 border-b border-slate-200 bg-slate-50/60 p-3 text-center font-bold text-xs text-slate-600 tracking-wider uppercase">
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
                  className="grid grid-cols-[130px_1.8fr_110px_100px_130px_130px_130px] items-center gap-3 border-b border-slate-100 p-3 last:border-b-0 hover:bg-slate-50/30 transition-colors"
                >
                  <FieldShell
                    icon={getServiceTypeIcon(item.type)}
                    iconWrapClassName="bg-gradient-to-tr from-indigo-50 to-blue-50 border border-blue-100 text-blue-600 shadow-sm"
                  >
                    <input
                      className="w-full rounded-md border border-slate-300 bg-blue-50/20 py-1.5 pl-10 pr-2 text-sm text-slate-700 outline-none"
                      value={item.type}
                      readOnly
                    />
                  </FieldShell>

                  <FieldShell
                    icon={getServiceTypeIcon(item.type)}
                    iconWrapClassName="bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-600 shadow-sm"
                  >
                    <input
                      className="w-full rounded-md border border-slate-300 bg-emerald-50/15 py-1.5 pl-10 pr-2 text-xs text-slate-700 outline-none"
                      placeholder="Service name"
                      value={item.service}
                      readOnly
                    />
                  </FieldShell>

                  <FieldShell
                    icon={getCurrencyIcon(item.currency)}
                    iconWrapClassName="bg-gradient-to-tr from-fuchsia-50 to-pink-50 border border-fuchsia-100 text-fuchsia-600 shadow-sm"
                  >
                    <select
                      className="w-full rounded-md border border-slate-300 py-1.5 pl-10 pr-2 text-sm outline-none bg-fuchsia-50/20 shadow-2xs focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all cursor-pointer"
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

                  <FieldShell icon={Hash} iconWrapClassName="bg-gradient-to-tr from-sky-50 to-cyan-50 border border-sky-100 text-sky-600 shadow-sm">
                    <input
                      className="w-full rounded-md border border-slate-300 bg-sky-50/20 py-1.5 pl-10 pr-2 text-sm text-slate-700 outline-none"
                      value={item.qty}
                      type="number"
                      readOnly
                    />
                  </FieldShell>

                  <FieldShell
                    icon={getCurrencyIcon(item.currency)}
                    iconWrapClassName="bg-gradient-to-tr from-orange-50 to-amber-50 border border-orange-100 text-orange-600 shadow-sm"
                  >
                    <input
                      className="w-full rounded-md border border-slate-300 bg-orange-50/20 py-1.5 pl-10 pr-2 text-sm text-slate-700 outline-none"
                      placeholder="0"
                      value={item.rate}
                      type="number"
                      readOnly
                    />
                  </FieldShell>

                  <FieldShell icon={FileText} iconWrapClassName="bg-gradient-to-tr from-violet-50 to-indigo-50 border border-violet-100 text-violet-600 shadow-sm">
                    <input
                      className="w-full rounded-md border border-slate-300 bg-violet-50/30 py-1.5 pl-10 pr-2 text-sm outline-none text-slate-800 font-semibold"
                      value={item.subtotal}
                      readOnly
                    />
                  </FieldShell>

                  <FieldShell
                    icon={getCurrencyIcon(item.currency)}
                    iconWrapClassName="bg-gradient-to-tr from-rose-50 to-red-50 border border-rose-100 text-rose-600 shadow-sm"
                  >
                    <input
                      className="w-full rounded-md border border-slate-300 bg-emerald-50/30 py-1.5 pl-10 pr-2 text-sm text-emerald-700 outline-none font-medium"
                      placeholder="0"
                      value={item.tax}
                      readOnly
                    />
                  </FieldShell>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="mb-3 text-sm font-bold text-slate-700">Tax Configuration</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="w-28 text-xs font-semibold text-slate-600">GST Rate (%)</label>

                <FieldShell icon={IndianRupee} iconWrapClassName="bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 shadow-sm">
                  <input
                    className="w-24 rounded-md border border-slate-300 bg-blue-50/20 py-1.5 pl-10 pr-2 text-sm text-slate-800 shadow-2xs focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all"
                    value={taxConfig.gstRate}
                    onChange={(e) => handleTaxChange("gstRate", e.target.value)}
                  />
                </FieldShell>

                <span className="text-xs text-gray-500 font-medium">
                  Auto-calculated on subtotal
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="w-28 text-xs font-semibold text-slate-600">TCS Rate (%)</label>

                <FieldShell icon={Receipt} iconWrapClassName="bg-gradient-to-tr from-violet-50 to-purple-50 border border-violet-100 text-violet-600 shadow-sm">
                  <input
                    className="w-24 rounded-md border border-slate-300 bg-violet-50/20 py-1.5 pl-10 pr-2 text-sm text-slate-800 shadow-2xs focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all"
                    value={taxConfig.tcsRate}
                    onChange={(e) => handleTaxChange("tcsRate", e.target.value)}
                  />
                </FieldShell>

                <span className="text-xs text-gray-500 font-medium">
                  Tax Collected at Source
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="w-28 text-xs font-semibold text-slate-600">Other Tax</label>

                <FieldShell icon={IndianRupee} iconWrapClassName="bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-100 text-amber-600 shadow-sm">
                  <input
                    className="w-24 rounded-md border border-slate-300 bg-amber-50/20 py-1.5 pl-10 pr-2 text-sm text-slate-800 shadow-2xs focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all"
                    value={taxConfig.otherTax}
                    onChange={(e) => handleTaxChange("otherTax", e.target.value)}
                  />
                </FieldShell>

                <span className="text-xs text-gray-500 font-medium">Fixed amount</span>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 shadow-2xs">
            <p className="mb-2 text-sm font-bold text-slate-800">
              {invoiceSource === "uploaded_invoice" ? "System Reference Summary" : "Invoice Summary"}
            </p>
            {invoiceSource === "uploaded_invoice" ? (
              <p className="mb-4 text-xs leading-5 text-slate-500 font-medium">
                Finance will compare this system total with the uploaded invoice amount above.
              </p>
            ) : null}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between font-medium text-slate-600">
                <span>Subtotal</span>
                <span className="text-slate-900 font-bold">{formatMoney(summary.subtotal)}</span>
              </div>

              <div className="flex justify-between text-blue-600 font-medium">
                <span>GST ({taxConfig.gstRate}%)</span>
                <span>+ {formatMoney(summary.gstAmount)}</span>
              </div>

              <div className="flex justify-between text-blue-600 font-medium">
                <span>TCS ({taxConfig.tcsRate}%)</span>
                <span>+ {formatMoney(summary.tcsAmount)}</span>
              </div>

              <div className="flex justify-between text-blue-600 font-medium">
                <span>Other Tax</span>
                <span>+ {formatMoney(summary.otherTaxAmount)}</span>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-700">
                <span>Total Tax</span>
                <span>{formatMoney(summary.totalTax)}</span>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-base text-slate-900">
                <span>Grand Total</span>
                <span className="text-emerald-700">{formatMoney(summary.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4 rounded-b-md">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isLocked}
          className={`inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-300 shadow-2xs active:scale-[0.98] ${
            isLocked
              ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-60 border-slate-200"
              : "cursor-pointer bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-slate-300 hover:border-slate-400"
          }`}
        >
          <FileText size={14} className={isLocked ? "text-slate-400" : "text-slate-500"} />
          Save as Draft
        </button>

        <button
          type="button"
          onClick={handleGenerateInvoice}
          disabled={isGenerating || isLocked}
          className={`inline-flex items-center justify-center gap-2 rounded-md px-5 py-2 text-xs sm:text-sm font-semibold text-white transition-all duration-300 ease-in-out shadow-sm ${
            isGenerating || isLocked
              ? "cursor-not-allowed bg-slate-400 shadow-none opacity-60"
              : "cursor-pointer bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]"
          }`}
        >
          {isGenerating ? (
            <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <CheckCircle2 size={14} />
          )}
          {isFinanceVerified
            ? "Verified by Finance"
            : isBulkSettled
              ? "Submitted in Bulk Settlement (Locked)"
              : isGenerating
                ? "Sending..."
                : existingInvoice?.status === "Rejected" || existingInvoice?.status === "Submitted" || existingInvoice?.status === "In Review"
                  ? invoiceSource === "uploaded_invoice"
                    ? "Update Uploaded Invoice & Send"
                    : "Update & Resend to Finance"
                  : invoiceSource === "uploaded_invoice"
                    ? "Upload & Send to Finance"
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
            <div className="pointer-events-auto relative w-[360px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-600" />
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-2xs">
                    <CheckCircle2 size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-emerald-700">
                      Internal Invoice
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {actionPopup.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {actionPopup.message}
                    </p>
                    <div className="mt-2.5 inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      {selectedQuery?.queryId || "Current booking"} ready
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActionPopup(null)}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReuploadConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowReuploadConfirm(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-2xl z-10"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-50 border border-amber-200 text-amber-600 shadow-2xs">
                  <AlertCircle size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Invoice Already Submitted
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    A version of this internal invoice was already submitted to the Finance team. Resubmitting will overwrite the existing file and state in their workflow.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    Are you sure you want to proceed and send it again?
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowReuploadConfirm(false)}
                  className="rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReuploadConfirm(false);
                    handleGenerateInvoice(true);
                  }}
                  className="rounded-md bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:shadow-sm cursor-pointer"
                >
                  Confirm & Resend
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkLockModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
              onClick={() => setShowBulkLockModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-2xl z-10"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-200 shadow-2xs">
                  <AlertCircle size={20} className="stroke-[2.5]" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Bulk Settlement Locked
                  </h3>

                  <div className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    <p>
                      This booking has already been submitted to the finance team in bulk settlement batch <span className="font-semibold text-slate-700">{bulkBatchNumber}</span>.
                    </p>
                    <p className="mt-1.5">
                      A single invoice cannot be sent because this booking's services are already claimed and locked in a bulk settlement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBulkLockModal(false)}
                  className="rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkLockModal(false)}
                  className="rounded-md bg-red-600 hover:bg-red-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:shadow-sm cursor-pointer"
                >
                  Ok, Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
