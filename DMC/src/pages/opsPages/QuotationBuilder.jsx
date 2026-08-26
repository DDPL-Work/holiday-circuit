import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  Mail,
  MessageCircle,
  Send,
  Trash2,
  X,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FaStar, FaWater } from "react-icons/fa";
import { GiCityCar, GiModernCity } from "react-icons/gi";
import { FaCarSide } from "react-icons/fa";
import { MdKingBed, MdOutlineTravelExplore } from "react-icons/md";
import { BsPeople } from "react-icons/bs";
import { HiOutlineBriefcase } from "react-icons/hi";
import { IoStarSharp } from "react-icons/io5";
import { LiaHotelSolid } from "react-icons/lia";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useLocation } from "react-router-dom";
import API from "../../utils/Api.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import QuickAddServiceModal from "../../modal/QuickAddServiceModal";
import { ImLocation2 } from "react-icons/im";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Service from "./QuotationBuilderComponents/Service";

import {
  pageShellVariants,
  sectionRevealVariants,
  sideStackVariants,
  rightCardVariants,
  INDIAN_DESTINATION_KEYWORDS,
  DEFAULT_EXCHANGE_RATES,
  CURRENCY_LABELS,
  DESTINATION_ALIAS_GROUPS,
  WHATSAPP_QUOTATION_BRAND,
  WHATSAPP_SECTION_DIVIDER,
  WHATSAPP_SUBSECTION_DIVIDER,
  DEFAULT_WHATSAPP_TERMS,
  SHOW_SELECTED_HISTORY_COMPARISON,
  SERVICE_TYPE_LABELS,
  CONTRACTED_RATE_FILTER_OPTIONS,
  HOTEL_ROOM_TYPE_OPTIONS,
  HOTEL_ROOM_CATEGORY_OPTIONS,
  HOTEL_BED_TYPE_OPTIONS,
  HOTEL_ROOM_TYPE_FIXED_PRICES,
  HOTEL_BED_TYPE_FIXED_PRICES,
  TRANSPORT_USAGE_OPTIONS,
  TRANSPORT_USAGE_LIMIT_OPTIONS,
  TRANSPORT_USAGE_FIXED_PRICES,
  TRANSPORT_USAGE_OPTION_LABELS,
} from "./QuotationBuilderComponents/utils";
import {
  normalizeCurrencyCode,
  expandDestinationAliases,
  roundCurrencyAmount,
  roundExchangeRateValue,
  getCurrencyLabel,
  formatAmountValue,
  formatExchangeRateValue,
  formatCurrencyValue,
  getCurrentUserRole,
  formatShareDate,
  buildTravelerSummary,
  getQueryPassengerCount,
  buildShareServiceQuantityLabel,
  buildShareServiceLocationLabel,
  buildPlainTextQuotationSummary,
  sanitizeDynamicListItems,
  normalizeDateInputValue,
  addDaysToNormalizedDate,
  getOrdinalValue,
  formatItineraryDateLabel,
  buildItineraryDayLabel,
  sanitizeDayWiseItineraryItems,
  areDayWiseItineraryItemsEqual,
  reconcileDayWiseItineraryItems,
  copyTextToClipboard,
  normalizeComparisonDateValue,
  normalizeComparisonTextValue,
  normalizeComparisonCountValue,
  formatDateInput,
  addDaysToDate,
} from "./QuotationBuilderComponents/utils";
import {
  normalizeWhatsAppPhoneNumber,
  parseWhatsAppDate,
  formatWhatsAppDate,
  formatWhatsAppActivityDate,
  formatWhatsAppItineraryDate,
  addDaysForWhatsApp,
  getWhatsAppDateDiff,
  inferSharingLabel,
  buildWhatsAppTravelerSummary,
  buildWhatsAppNightLabel,
  buildWhatsAppHotelMeta,
  buildWhatsAppHotelsSection,
  buildWhatsAppTransportSection,
  buildWhatsAppInclusionsSection,
  buildWhatsAppExclusionsSection,
  buildWhatsAppSellerBankDetailsSection,
  buildWhatsAppTermsSection,
  buildWhatsAppDayWiseItinerary,
  buildWhatsAppQuotationMessage,
} from "./QuotationBuilderComponents/utils";
import {
  getPublicBaseUrl,
  createPublicAssetUrl,
  downloadFileFromUrl,
  escapeWordHtml,
  buildWordQuotationDocumentHtml,
  downloadWordDocument,
} from "./QuotationBuilderComponents/utils";
import {
  normalizeServiceFilterType,
  normalizeBedTypeValue,
  getBedTypeOptionLabel,
  formatHotelOptionLabel,
  buildHotelVariantGroupKey,
  getHotelVariantServices,
  buildSelectOptionsWithFallback,
  normalizeHotelOptionLookupKey,
  normalizeHotelRoomTypeLookupKey,
  normalizeTransportUsageValue,
  normalizeTransportUsageOptionKey,
  getTransportUsageOptionMeta,
  getTransportUsageOptionKey,
  getSelectedTransportUsageOptionKeys,
  getSelectedTransportUsageOptionLabels,
  getTransportUsageLimitOptionsForKeys,
  getDefaultTransportUsageLimitKeyValue,
  getSelectedTransportUsageLimitLabels,
  getTransportUsageLimitText,
  stripTransportUsageSuffix,
  getServiceSearchAliases,
  getServiceSearchText,
  normalizeDestinationMatchText,
  getDestinationMatchTerms,
  doesServiceMatchDestination,
  getServiceTypeLabel,
  getSelectedServiceIconTone,
  renderSelectedServiceSummaryIcon,
  getSelectedServiceIncludedItems,
  formatServiceDateLabel,
  getServiceCardDomId,
  getSelectedServiceSummaryDomId,
  isIndianDestination,
  getExchangeRateForCurrency,
  convertAmountToInr,
  calculateServiceOriginalTotal,
  buildServiceEditBaseline,
  getSelectedServiceQuotationEdits,
} from "./QuotationBuilderComponents/utils";
import {
  getFixedHotelRoomTypePrice,
  inferHotelRoomTypeValue,
  getFixedHotelBedTypePrice,
  getFixedTransportUsagePrice,
  getResolvedHotelBaseRate,
  normalizeDateOnlyString,
  isDateInRange,
  checkBlackoutMatch,
  resolveSmartSeasonAndBlackoutPrice,
  resolveHotelSmartRate,
  resolveTransportSmartRate,
  resolveActivitySmartRate,
  getTransportVehicleUsagePrices,
  resolveTransportVehicleSelection,
  getTransportUsageOptionDisplayPrice,
  getFixedHotelOptionDelta,
  applyFixedHotelOptionPricing,
  applyFixedTransportUsagePricing,
  applyTransportUsageOptionPricing,
  doesHotelVariantMatchField,
  getHotelVariantForOption,
  getHotelRoomTypeOptionRate,
  getAdjustedHotelRoomTypeRate,
  getInferredHotelMaxOccupancy,
  scoreHotelVariantMatch,
  resolveHotelVariantSelection,
} from "./QuotationBuilderComponents/utils";

import QuotationBuilderContent from "./QuotationBuilderComponents/QuotationBuilderContent";
import QuotationBuilderHeader from "./QuotationBuilderComponents/QuotationBuilderHeader";
const QuotationBuilder = () => {
  const resolveDmcOwner = (service = {}) => ({
    dmcId: service.dmcId || service.supplierId || "",
    dmcName: service.dmcName || "",
  });

  const normalizeQuotationServiceType = (type) => {
    const normalizedType = String(type || "").toLowerCase();
    if (normalizedType === "car" || normalizedType === "transport") {
      return "transfer";
    }

    return normalizedType || type;
  };

  const parsePackageServiceDayNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;

    const match = String(value).match(/(\d+)/);
    if (!match) return null;

    const parsedDay = Number(match[1]);
    if (!Number.isFinite(parsedDay) || parsedDay <= 0) return null;
    return parsedDay;
  };
  const getPackageServiceDate = (serviceDay) => {
    const dayNumber = parsePackageServiceDayNumber(serviceDay);
    if (!dayNumber || !order?.startDate) return "";

    return addDaysToDate(order.startDate, dayNumber - 1);
  };

  const getPackageServiceQuantity = (item = {}, fallbackKeys = []) => {
    const keys = ["quantity", "qty", ...fallbackKeys];

    for (const key of keys) {
      const value = Number(item?.[key]);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }

    return 1;
  };

  const getPackageMatchedServiceDayValue = (item = {}, serviceType = "") => {
    const directDayValue = item.day || item.dayNumber || item.serviceDay || "";
    if (directDayValue) return directDayValue;

    const normalizedType = String(serviceType || "").toLowerCase();
    if (
      (normalizedType === "transfer" || normalizedType === "car") &&
      !item.quantity &&
      !item.qty
    ) {
      return item.days || "";
    }

    return "";
  };

  const normalizeServiceLabel = (value) =>
    (value || "")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const normalizeLocationLabel = (value) =>
    (value || "")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getServiceTokens = (value) =>
    (value || "")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2);

  const getComparableServiceType = (type = "") => {
    const normalizedType = normalizeQuotationServiceType(type);
    return normalizedType === "transport" ? "transfer" : normalizedType;
  };

  const getPackageItemDisplayNames = (item = {}) =>
    [item.name, item.hotelName, item.serviceName, item.title]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

  const getContractedServiceDisplayNames = (service = {}) =>
    [service.title, service.serviceName, service.hotelName]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

  const getPackageLocationNames = (pkg = {}) =>
    [pkg.destination, pkg.city, pkg.country]
      .flatMap((value) =>
        expandDestinationAliases([normalizeLocationLabel(value)]),
      )
      .filter(Boolean);

  const getServiceLocationNames = (service = {}) =>
    [service.city, service.country]
      .flatMap((value) =>
        expandDestinationAliases([normalizeLocationLabel(value)]),
      )
      .filter(Boolean);

  const doesServiceMatchPackageLocation = (service = {}, pkg = {}) => {
    const packageLocations = getPackageLocationNames(pkg);
    if (!packageLocations.length) {
      return true;
    }

    const serviceLocations = getServiceLocationNames(service);
    if (!serviceLocations.length) {
      return false;
    }

    return packageLocations.some((packageLocation) =>
      serviceLocations.some((serviceLocation) => {
        if (!packageLocation || !serviceLocation) {
          return false;
        }

        if (
          packageLocation === serviceLocation ||
          packageLocation.includes(serviceLocation) ||
          serviceLocation.includes(packageLocation)
        ) {
          return true;
        }

        const packageTokens = getServiceTokens(packageLocation);
        const serviceTokens = getServiceTokens(serviceLocation);
        const overlappingTokens = packageTokens.filter((token) =>
          serviceTokens.includes(token),
        );

        return overlappingTokens.length > 0;
      }),
    );
  };

  const getPackageItemMatchScore = (item = {}, service = {}) => {
    if (
      getComparableServiceType(item.packageType || item.type) !==
      getComparableServiceType(service.type)
    ) {
      return -1;
    }

    const packageNames = getPackageItemDisplayNames(item);
    const serviceNames = getContractedServiceDisplayNames(service);
    let bestScore = 0;

    for (const packageName of packageNames) {
      const normalizedPackageName = normalizeServiceLabel(packageName);
      const packageTokens = getServiceTokens(packageName);

      for (const serviceName of serviceNames) {
        const normalizedServiceName = normalizeServiceLabel(serviceName);
        const serviceTokens = getServiceTokens(serviceName);

        if (!normalizedPackageName || !normalizedServiceName) {
          continue;
        }

        if (normalizedPackageName === normalizedServiceName) {
          bestScore = Math.max(bestScore, 100);
          continue;
        }

        if (
          normalizedPackageName.includes(normalizedServiceName) ||
          normalizedServiceName.includes(normalizedPackageName)
        ) {
          bestScore = Math.max(bestScore, 88);
          continue;
        }

        const overlappingTokens = packageTokens.filter((token) =>
          serviceTokens.includes(token),
        );

        if (
          packageTokens.length > 0 &&
          serviceTokens.length > 0 &&
          overlappingTokens.length >=
            Math.min(2, packageTokens.length, serviceTokens.length)
        ) {
          bestScore = Math.max(bestScore, 72 + overlappingTokens.length);
          continue;
        }

        if (
          overlappingTokens.length === 1 &&
          (packageTokens.length <= 2 || serviceTokens.length <= 2)
        ) {
          bestScore = Math.max(bestScore, 58);
        }
      }
    }

    return bestScore;
  };

  const buildPackageServicePatch = (item = {}, service = {}) => {
    const quantity = getPackageServiceQuantity(
      item,
      service.type === "hotel"
        ? ["nights", "days"]
        : service.type === "transfer" || service.type === "car"
          ? ["days", "duration"]
          : ["pax", "days"],
    );
    const serviceDate =
      getPackageServiceDate(
        getPackageMatchedServiceDayValue(item, service.type),
      ) ||
      service.serviceDate ||
      formatDateInput(order?.startDate);
    const unit = String(item.unit || "").toLowerCase();

    if (service.type === "hotel") {
      return {
        checked: true,
        serviceDate,
        nights: Math.max(1, quantity),
      };
    }

    if (service.type === "transfer" || service.type === "car") {
      return {
        checked: true,
        serviceDate,
        days: Math.max(1, quantity),
      };
    }

    if (service.type === "activity") {
      return {
        checked: true,
        serviceDate,
        pax: Math.max(1, quantity),
      };
    }

    if (service.type === "sightseeing") {
      return {
        checked: true,
        serviceDate,
        ...(unit.includes("day")
          ? { days: Math.max(1, quantity) }
          : { pax: Math.max(1, quantity) }),
      };
    }

    return {
      checked: true,
      serviceDate,
    };
  };

  const buildPackageMatchedServices = (availableServices = [], pkg) => {
    if (!pkg) {
      return availableServices;
    }

    const packageServices = [
      ...(pkg.hotels || []).map((item) => ({ ...item, packageType: "hotel" })),
      ...(pkg.activities || []).map((item) => ({
        ...item,
        packageType: "activity",
      })),
      ...(pkg.sightseeing || []).map((item) => ({
        ...item,
        packageType: "sightseeing",
      })),
      ...(pkg.transfers || []).map((item) => ({
        ...item,
        packageType: "transfer",
      })),
    ];

    const matchedUpdates = new Map();
    const usedServiceIds = new Set();

    packageServices.forEach((item) => {
      const compatibleServices = availableServices.filter(
        (service) =>
          !usedServiceIds.has(service.id) &&
          getComparableServiceType(service.type) ===
            getComparableServiceType(item.packageType) &&
          doesServiceMatchPackageLocation(service, pkg),
      );

      if (!compatibleServices.length) {
        return;
      }

      const rankedMatches = compatibleServices
        .map((service) => ({
          service,
          score: getPackageItemMatchScore(item, service),
        }))
        .sort((first, second) => second.score - first.score);

      const strongMatch = rankedMatches.find(
        ({ score }) => score >= 58,
      )?.service;
      const selectedService = strongMatch || compatibleServices[0];

      if (!selectedService) {
        return;
      }

      usedServiceIds.add(selectedService.id);
      matchedUpdates.set(
        selectedService.id,
        buildPackageServicePatch(item, selectedService),
      );
    });

    return availableServices.map((service) =>
      matchedUpdates.has(service.id)
        ? { ...service, ...matchedUpdates.get(service.id) }
        : { ...service, checked: false },
    );
  };

  const havePackageSelectionsChanged = (
    previousServices = [],
    nextServices = [],
  ) =>
    nextServices.some((service, index) => {
      const previous = previousServices[index];

      if (!previous) {
        return true;
      }

      return (
        previous.checked !== service.checked ||
        previous.serviceDate !== service.serviceDate ||
        Number(previous.nights || 0) !== Number(service.nights || 0) ||
        Number(previous.days || 0) !== Number(service.days || 0) ||
        Number(previous.pax || 0) !== Number(service.pax || 0)
      );
    });

  // markup
  const location = useLocation();
  const order = location.state ?? null;
  const hasOrderContext = Boolean(order?._id);
  const orderQueryId = order?.queryId || "";
  const navigate = useNavigate();
  const currentUserRole = useMemo(() => getCurrentUserRole(), []);
  const showLatestSentQuotationCard = currentUserRole === "operations";
  const DEFAULT_GST_PERCENT = 5;
  const DEFAULT_TCS_PERCENT = 0;
  const DEFAULT_TOURISM_AMOUNT = 500;

  const [showOpsPopup, setShowOpsPopup] = useState(false);
  // markup
  const [markup, setMarkup] = useState(5);
  const [showSendOptions, setShowSendOptions] = useState(false);
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState([]);
  const [dayWiseItinerary, setDayWiseItinerary] = useState([]);
  const [dynamicNoteInputs, setDynamicNoteInputs] = useState({
    inclusion: "",
    exclusion: "",
    additionalNote: "",
  });
  // ops charges
  const [serviceCharge, setServiceCharge] = useState(0);
  const [handlingFee, setHandlingFee] = useState(0);

  const [appliedTaxTotal, setAppliedTaxTotal] = useState(0);

  // tax toggle
  const [gstChecked, setGstChecked] = useState(false);
  const [tcsChecked, setTcsChecked] = useState(false);
  const [tourismChecked, setTourismChecked] = useState(false);

  // manual override
  const [, setGstAmount] = useState("");
  const [, setTcsAmount] = useState("");
  const [tourismAmount, setTourismAmount] = useState("");

  // quotation
  const [validTill, setValidTill] = useState("");

  const [draftServiceCharge, setDraftServiceCharge] = useState(0);
  const [draftHandlingFee, setDraftHandlingFee] = useState(0);
  const [draftValidTill, setDraftValidTill] = useState("");

  const [draftGstChecked, setDraftGstChecked] = useState(false);
  const [draftTcsChecked, setDraftTcsChecked] = useState(false);
  const [draftTourismChecked, setDraftTourismChecked] = useState(false);
  const [gstPercent, setGstPercent] = useState(DEFAULT_GST_PERCENT);
  const [tcsPercent, setTcsPercent] = useState(DEFAULT_TCS_PERCENT);
  const [draftGstPercent, setDraftGstPercent] = useState(DEFAULT_GST_PERCENT);
  const [draftTcsPercent, setDraftTcsPercent] = useState(DEFAULT_TCS_PERCENT);
  const [draftTourismAmount, setDraftTourismAmount] = useState(0);
  const [taxSetupMode, setTaxSetupMode] = useState("manual");

  const [showQuickServiceModal, setShowQuickServiceModal] = useState(false);
  const [showQueryRequirements, setShowQueryRequirements] = useState(false);
  const [marginType, setMarginType] = useState("percentage");
  const [fixedMargin, setFixedMargin] = useState(0);
  const [successPopup, setSuccessPopup] = useState({
    open: false,
    kind: "quote",
    invoiceNumber: "",
    totalAmount: 0,
    serviceCount: 0,
    agentName: "",
    deliveryWarnings: [],
  });
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesLoadError, setServicesLoadError] = useState("");
  const backgroundRatesRefreshRef = useRef({
    inFlight: false,
    lastStartedAt: 0,
  });
  const draftServicesAutosaveRef = useRef({
    ready: false,
    signature: "",
  });
  const [quotationId, setQuotationId] = useState("");
  const [loadedQuotationDraft, setLoadedQuotationDraft] = useState(null);
  const [baseServicesSnapshot, setBaseServicesSnapshot] = useState([]);
  const [quotationHistory, setQuotationHistory] = useState([]);
  const [quotationHistoryLoading, setQuotationHistoryLoading] = useState(false);
  const [quotationHistoryLoadError, setQuotationHistoryLoadError] =
    useState("");
  const [isQuotationHistoryOpen, setIsQuotationHistoryOpen] = useState(false);
  const [selectedHistoryQuotationId, setSelectedHistoryQuotationId] =
    useState("");
  const [activeDraftSourceQuotationId, setActiveDraftSourceQuotationId] =
    useState(String(order?.editQuotationId || "").trim());
  const [editingTargetQuotationId, setEditingTargetQuotationId] = useState(
    String(order?.editQuotationId || "").trim(),
  );
  const [editingSourceQuotationSnapshot, setEditingSourceQuotationSnapshot] =
    useState(null);
  const editingSourceQuotationSnapshotRef = useRef(null);
  const [isFreshDraftMode, setIsFreshDraftMode] = useState(false);
  const [draftSourceReloadRequest, setDraftSourceReloadRequest] = useState(0);
  const [resolvedAgentPhone, setResolvedAgentPhone] = useState(
    String(order?.agent?.phone || "").trim(),
  );
  const [savingService, setSavingService] = useState(false);
  const [selectedSendOption, setSelectedSendOption] = useState(null);
  const [selectedPackageTemplate, setSelectedPackageTemplate] = useState(null);
  const [exchangeRates, setExchangeRates] = useState(() => ({
    ...DEFAULT_EXCHANGE_RATES,
  }));
  const [quickActionPopup, setQuickActionPopup] = useState(null);
  const [contractedRatesSearch, setContractedRatesSearch] = useState("");
  const [contractedRatesFilter, setContractedRatesFilter] = useState("all");
  const [focusedServiceCardId, setFocusedServiceCardId] = useState("");
  const [editingServiceCardId, setEditingServiceCardId] = useState("");
  const [isSelectedServicesModalOpen, setIsSelectedServicesModalOpen] =
    useState(false);
  const [selectedServicesModalTargetId, setSelectedServicesModalTargetId] =
    useState("");
  const [selectedServicesModalScope, setSelectedServicesModalScope] =
    useState("all");
  const [activeWorkspaceModal, setActiveWorkspaceModal] = useState("");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [savingDraftQuote, setSavingDraftQuote] = useState(false);
  const [showFinanceInvoiceConfirm, setShowFinanceInvoiceConfirm] =
    useState(false);
  const [transportSelectionConfirm, setTransportSelectionConfirm] = useState({
    open: false,
    serviceId: "",
    serviceTitle: "",
    vehicleType: "",
    passengerCapacity: 0,
    luggageCapacity: 0,
    passengerCount: 0,
  });
  const [preparingFinanceInvoice, setPreparingFinanceInvoice] = useState(false);
  const isEditingHistoricalQuotation = Boolean(editingTargetQuotationId);
  const isAnyWorkspaceModalOpen =
    isSelectedServicesModalOpen || Boolean(activeWorkspaceModal);
  const isInvoiceRequestedStage = order?.opsStatus === "Invoice_Requested";
  const quoteCategory = isIndianDestination(order?.destination)
    ? "domestic"
    : "international";
  const sendOptions = [
    {
      label: "Dashboard Notification",
      description: "In-app alert to agent",
      icon: Bell,
    },
    {
      label: "Email",
      description: `Send to ${order?.agent?.email || "agent email"}`,
      icon: Mail,
    },
    {
      label: "WhatsApp",
      description: "Direct message link",
      icon: MessageCircle,
    },
    {
      label: "PDF Download",
      description: "Formatted quote document",
      icon: Download,
    },
    {
      label: "Word Format",
      description: "Editable quotation document",
      icon: FileText,
    },
  ];

  const sendOptionsPanelStyle = {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
  };

  const showQuickActionFeedback = (type, title, message) => {
    setQuickActionPopup({ type, title, message });
  };

  const updateDynamicNoteInput = (field, value) => {
    setDynamicNoteInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const appendDynamicNoteItem = (field) => {
    const normalizedValue = String(dynamicNoteInputs?.[field] || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalizedValue) return;

    const applyUpdate =
      field === "inclusion"
        ? setInclusions
        : field === "exclusion"
          ? setExclusions
          : setAdditionalNotes;

    applyUpdate((prev) => {
      const nextItems = sanitizeDynamicListItems([...prev, normalizedValue]);
      return Array.from(new Set(nextItems));
    });

    setDynamicNoteInputs((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const removeDynamicNoteItem = (field, indexToRemove) => {
    const applyUpdate =
      field === "inclusion"
        ? setInclusions
        : field === "exclusion"
          ? setExclusions
          : setAdditionalNotes;

    applyUpdate((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const openOpsChargesPopup = () => {
    setShowOpsPopup(true);
    setDraftServiceCharge(roundCurrencyAmount(serviceCharge));
    setDraftHandlingFee(roundCurrencyAmount(handlingFee));
    setDraftValidTill(validTill);
    setDraftGstChecked(gstChecked);
    setDraftTcsChecked(tcsChecked);
    setDraftTourismChecked(tourismChecked);
    setDraftGstPercent(Number(gstPercent || DEFAULT_GST_PERCENT));
    setDraftTcsPercent(Number(tcsPercent || DEFAULT_TCS_PERCENT));
    setDraftTourismAmount(
      roundCurrencyAmount(tourismAmount || DEFAULT_TOURISM_AMOUNT),
    );
    setTaxSetupMode("manual");
  };

  const applyAutoTaxPreset = () => {
    setTaxSetupMode("auto");
    setDraftGstChecked(true);
    setDraftTcsChecked(true);
    setDraftTourismChecked(true);
    setDraftGstPercent(
      (prev) => Number(prev || DEFAULT_GST_PERCENT) || DEFAULT_GST_PERCENT,
    );
    setDraftTcsPercent((prev) => Number(prev || DEFAULT_TCS_PERCENT));
    setDraftTourismAmount(
      (prev) =>
        roundCurrencyAmount(prev || DEFAULT_TOURISM_AMOUNT) ||
        DEFAULT_TOURISM_AMOUNT,
    );
  };

  useEffect(() => {
    if (!quickActionPopup) return undefined;

    const timer = setTimeout(() => {
      setQuickActionPopup(null);
    }, 2200);

    return () => clearTimeout(timer);
  }, [quickActionPopup]);

  useEffect(() => {
    if (!focusedServiceCardId) return undefined;

    const timer = setTimeout(() => {
      setFocusedServiceCardId("");
    }, 2200);

    return () => clearTimeout(timer);
  }, [focusedServiceCardId]);

  useEffect(() => {
    if (!editingServiceCardId) return;

    const activeService = services.find(
      (service) => service.id === editingServiceCardId,
    );
    if (!activeService || !activeService.checked) {
      setEditingServiceCardId("");
    }
  }, [editingServiceCardId, services]);

  useEffect(() => {
    if (!isAnyWorkspaceModalOpen || typeof document === "undefined") {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAnyWorkspaceModalOpen]);

  useEffect(() => {
    if (!isAnyWorkspaceModalOpen || typeof window === "undefined") {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        if (activeWorkspaceModal) {
          setActiveWorkspaceModal("");
          return;
        }

        closeSelectedServicesModal();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeWorkspaceModal, isAnyWorkspaceModalOpen]);

  useEffect(() => {
    if (!isSelectedServicesModalOpen || selectedServicesModalScope !== "single")
      return;

    const targetExists = services.some(
      (service) =>
        service.checked && service.id === selectedServicesModalTargetId,
    );

    if (!targetExists) {
      closeSelectedServicesModal();
    }
  }, [
    isSelectedServicesModalOpen,
    services,
    selectedServicesModalScope,
    selectedServicesModalTargetId,
  ]);

  useEffect(() => {
    if (
      !isSelectedServicesModalOpen ||
      !selectedServicesModalTargetId ||
      typeof window === "undefined"
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const target = document.getElementById(
        getSelectedServiceSummaryDomId(selectedServicesModalTargetId),
      );

      target?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [isSelectedServicesModalOpen, selectedServicesModalTargetId, services]);

  useEffect(() => {
    setResolvedAgentPhone(String(order?.agent?.phone || "").trim());
  }, [order?._id, order?.agent?.phone]);

  useEffect(() => {
    let isDisposed = false;

    const loadQuotationHistory = async () => {
      if (!order?._id) {
        setQuotationHistory([]);
        setSelectedHistoryQuotationId("");
        setQuotationHistoryLoadError("");
        return;
      }

      try {
        setQuotationHistoryLoading(true);
        setQuotationHistoryLoadError("");
        const { data } = await API.get(`/ops/queries/${order._id}/quotations`);
        const nextHistory = Array.isArray(data?.data?.quotations)
          ? data.data.quotations
          : [];

        if (isDisposed) {
          return;
        }

        setQuotationHistory(nextHistory);
        setSelectedHistoryQuotationId((prev) => {
          if (prev && nextHistory.some((quotation) => quotation.id === prev)) {
            return prev;
          }

          return nextHistory[0]?.id || "";
        });
      } catch (error) {
        if (isDisposed) {
          return;
        }

        console.error("Failed to load quotation history", error);
        setQuotationHistory([]);
        setSelectedHistoryQuotationId("");
        setQuotationHistoryLoadError(
          error?.response?.data?.message ||
            "Unable to load quotation history right now.",
        );
      } finally {
        if (!isDisposed) {
          setQuotationHistoryLoading(false);
        }
      }
    };

    loadQuotationHistory();

    return () => {
      isDisposed = true;
    };
  }, [order?._id]);

  const selectedHistoryQuotation = useMemo(
    () =>
      quotationHistory.find(
        (quotation) => quotation.id === selectedHistoryQuotationId,
      ) || null,
    [quotationHistory, selectedHistoryQuotationId],
  );
  const latestSentQuotation = useMemo(
    () =>
      quotationHistory.find((quotation) =>
        [
          "Quote Sent",
          "Quote Accepted",
          "Markup Applied",
          "Sent to Client",
          "Confirmed",
        ].includes(String(quotation?.status || "").trim()),
      ) ||
      quotationHistory[0] ||
      null,
    [quotationHistory],
  );

  const resetBuilderWorkspace = () => {
    setQuotationId("");
    setLoadedQuotationDraft(null);
    setValidTill("");
    setDraftValidTill("");
    setMarginType("percentage");
    setMarkup(0);
    setFixedMargin(0);
    setServiceCharge(0);
    setDraftHandlingFee(0);
    setGstChecked(false);
    setTcsChecked(false);
    setTourismChecked(false);
    setDraftGstChecked(false);
    setDraftTcsChecked(false);
    setDraftTourismChecked(false);
    setGstPercent(DEFAULT_GST_PERCENT);
    setTcsPercent(DEFAULT_TCS_PERCENT);
    setDraftGstPercent(DEFAULT_GST_PERCENT);
    setDraftTcsPercent(DEFAULT_TCS_PERCENT);
    setGstAmount("");
    setTcsAmount("");
    setTourismAmount("");
    setDraftTourismAmount(0);
    setAppliedTaxTotal(0);
    setInclusions([]);
    setExclusions([]);
    setAdditionalNotes([]);
    setSelectedPackageTemplate(null);
    setDayWiseItinerary(
      reconcileDayWiseItineraryItems(
        [],
        getTripDuration(order?.startDate, order?.endDate).days,
        formatDateInput(order?.startDate),
      ),
    );
    setDraftHydrated(false);

    if (baseServicesSnapshot.length) {
      setServices(baseServicesSnapshot.map((service) => ({ ...service })));
    }
  };

  const applyQuotationDraftToBuilder = (quotation) => {
    if (!quotation) return;

    setQuotationId(quotation._id || quotation.id || "");
    setLoadedQuotationDraft(quotation);
    setValidTill(formatDateInput(quotation.validTill));
    setDraftValidTill(formatDateInput(quotation.validTill));

    const draftOpsMarkupPercent = Number(
      quotation?.pricing?.opsMarkup?.percent || 0,
    );
    const draftOpsMarkupAmount = roundCurrencyAmount(
      quotation?.pricing?.opsMarkup?.amount || 0,
    );
    if (draftOpsMarkupPercent > 0) {
      setMarginType("percentage");
      setMarkup(draftOpsMarkupPercent);
      setFixedMargin(0);
    } else if (draftOpsMarkupAmount > 0) {
      setMarginType("fixed");
      setFixedMargin(draftOpsMarkupAmount);
      setMarkup(0);
    } else {
      setMarginType("percentage");
      setMarkup(0);
      setFixedMargin(0);
    }

    setServiceCharge(Number(quotation?.pricing?.serviceCharge || 0));
    setDraftServiceCharge(Number(quotation?.pricing?.serviceCharge || 0));
    setHandlingFee(Number(quotation?.pricing?.handlingFee || 0));
    setDraftHandlingFee(Number(quotation?.pricing?.handlingFee || 0));

    const nextGstChecked = Boolean(quotation?.pricing?.taxes?.gst?.applied);
    const nextTcsChecked = Boolean(quotation?.pricing?.taxes?.tcs?.applied);
    const nextTourismChecked = Boolean(
      quotation?.pricing?.taxes?.tourism?.applied,
    );
    const nextGstPercent = Number(
      quotation?.pricing?.taxes?.gst?.percent ?? DEFAULT_GST_PERCENT,
    );
    const nextTcsPercent = Number(
      quotation?.pricing?.taxes?.tcs?.percent ?? DEFAULT_TCS_PERCENT,
    );
    const nextGstAmount = Number(quotation?.pricing?.taxes?.gst?.amount || 0);
    const nextTcsAmount = Number(quotation?.pricing?.taxes?.tcs?.amount || 0);
    const nextTourismAmount = Number(
      quotation?.pricing?.taxes?.tourism?.amount || 0,
    );
    const nextTotalTax = Number(quotation?.pricing?.totalTax || 0);

    setGstChecked(nextGstChecked);
    setTcsChecked(nextTcsChecked);
    setTourismChecked(nextTourismChecked);
    setDraftGstChecked(nextGstChecked);
    setDraftTcsChecked(nextTcsChecked);
    setDraftTourismChecked(nextTourismChecked);
    setGstPercent(nextGstPercent);
    setTcsPercent(nextTcsPercent);
    setDraftGstPercent(nextGstPercent);
    setDraftTcsPercent(nextTcsPercent);
    setGstAmount(
      nextGstChecked && nextGstAmount > 0 ? String(nextGstAmount) : "",
    );
    setTcsAmount(
      nextTcsChecked && nextTcsAmount > 0 ? String(nextTcsAmount) : "",
    );
    setTourismAmount(
      nextTourismChecked && nextTourismAmount > 0
        ? String(nextTourismAmount)
        : "",
    );
    setDraftTourismAmount(nextTourismAmount);
    setAppliedTaxTotal(nextTotalTax);
    setInclusions(sanitizeDynamicListItems(quotation?.inclusions));
    setExclusions(sanitizeDynamicListItems(quotation?.exclusions));
    setAdditionalNotes(sanitizeDynamicListItems(quotation?.additionalNotes));
    setDayWiseItinerary(
      reconcileDayWiseItineraryItems(
        quotation?.dayWiseItinerary,
        getTripDuration(order?.startDate, order?.endDate).days,
        formatDateInput(order?.startDate),
      ),
    );
  };

  useEffect(() => {
    const loadQuotationDraft = async () => {
      try {
        if (!order?._id) return;

        resetBuilderWorkspace();

        const requestConfig = isFreshDraftMode
          ? {
              params: {
                freshDraft: true,
              },
            }
          : activeDraftSourceQuotationId
            ? {
                params: {
                  sourceQuotationId: activeDraftSourceQuotationId,
                  ...(draftSourceReloadRequest
                    ? { refreshFromSource: true }
                    : {}),
                },
              }
            : undefined;

        const { data } = await API.get(
          `/ops/queries/${order._id}/quotation-draft`,
          requestConfig,
        );
        const quotation = data?.quotation;
        const latestAgentPhone = String(
          data?.query?.agent?.phone || order?.agent?.phone || "",
        ).trim();

        if (latestAgentPhone) {
          setResolvedAgentPhone(latestAgentPhone);
        }

        if (!quotation) return;
        applyQuotationDraftToBuilder(quotation);
      } catch (error) {
        console.error("Failed to load quotation draft", error);
      } finally {
        if (draftSourceReloadRequest) {
          setDraftSourceReloadRequest(0);
        }
        setDraftHydrated(false);
      }
    };

    loadQuotationDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    order?._id,
    activeDraftSourceQuotationId,
    isFreshDraftMode,
    draftSourceReloadRequest,
    baseServicesSnapshot.length,
  ]);

  const getTripDuration = (start, end) => {
    if (!start || !end) {
      return { nights: 0, days: 0, label: "" };
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate - startDate;
    const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    const nights = Math.max(0, days - 1);

    return {
      nights,
      days,
      label: `${nights}N / ${days}D`,
    };
  };

  const getServiceMeta = (type) => {
    switch (type) {
      case "hotel":
        return {
          icon: (
            <LiaHotelSolid className="w-6 h-5 bg-blue-500 text-white rounded-md p-0.5" />
          ),
          color: "text-blue-400",
        };

      case "activity":
        return {
          icon: (
            <FaWater className=" w-6 h-5 bg-[#00C950] text-white rounded-md p-0.5" />
          ),
          color: "text-green-400 text-[18px]",
        };

      case "transfer":
      case "car":
        return {
          icon: (
            <GiCityCar className=" w-6 h-5 bg-[#AD46FF] text-white rounded-md p-0.5" />
          ),
          color: "text-blue-400",
        };

      case "sightseeing":
        return {
          icon: (
            <GiModernCity className=" w-6 h-5 bg-blue-500 text-white rounded-md p-0.5" />
          ),
          color: "text-purple-400",
        };

      default:
        return {
          icon: (
            <GiModernCity className=" w-6 h-5 bg-blue-500 text-white rounded-md p-0.5" />
          ),
          color: "text-gray-400",
        };
    }
  };

  const mapDraftServiceToUi = (service = {}, overrides = {}) => {
    const meta = getServiceMeta(service.type);
    const owner = resolveDmcOwner(service);
    const resolvedRoomType =
      inferHotelRoomTypeValue(service) || overrides.fallbackRoomType || "";
    const resolvedRoomCategory =
      service.roomCategory || overrides.fallbackRoomCategory || "Double";
    const resolvedBedType =
      normalizeBedTypeValue(service.bedType) ||
      normalizeBedTypeValue(overrides.fallbackBedType) ||
      "double-bed";
    const normalizedServiceType = normalizeServiceFilterType(service.type);
    const overrideFullServiceAmount = roundCurrencyAmount(
      overrides.fullServiceAmount || 0,
    );
    const overrideBaseServiceAmount = roundCurrencyAmount(
      overrides.baseServiceAmount || 0,
    );
    const resolvedRate = getResolvedHotelBaseRate(
      {
        ...service,
        roomType: resolvedRoomType,
        roomCategory: resolvedRoomCategory,
        bedType: resolvedBedType,
      },
      Number(service.price ?? service.rate ?? 0),
    );
    const hotelQuantity =
      normalizedServiceType === "hotel"
        ? Math.max(Number(service.nights || 1), 1) *
          Math.max(Number(service.rooms || 1), 1)
        : 1;
    const resolvedStoredTotal = roundCurrencyAmount(
      overrideFullServiceAmount ||
        service.total ||
        service.originalTotal ||
        service.totalInInr ||
        0,
    );
    const resolvedBaseRate =
      normalizedServiceType === "hotel"
        ? roundCurrencyAmount(
            overrideBaseServiceAmount ||
              service.quoteBaseRate ||
              service.price ||
              service.rate ||
              (resolvedStoredTotal > 0
                ? resolvedStoredTotal / hotelQuantity
                : 0) ||
              resolvedRate ||
              0,
          )
        : resolvedRate;
    const quoteBaseRate = resolvedBaseRate;

    return {
      id: overrides.id || service.serviceId || service._id,
      serviceId: service.serviceId || "",
      dbServiceId: service._id || service.dbServiceId || "",
      dmcId: owner.dmcId,
      dmcName: owner.dmcName,
      supplierId: service.supplierId || "",
      supplierName: service.supplierName || "",
      type: service.type,
      title: service.title,
      hotelName: service.hotelName || "",
      hotels: Array.isArray(service.hotels) ? service.hotels : [],
      desc: service.description || service.desc || "",
      city: service.city || "",
      country: service.country || "",
      vehicleType: service.vehicleType || "",
      vehicles: Array.isArray(service.vehicles) ? service.vehicles : [],
      fullDayNote: service.fullDayNote || "",
      halfDayNote: service.halfDayNote || "",
      transportUsagePrices: service.transportUsagePrices || {},
      usageType: service.usageType || "",
      transportUsageOptionKey: service.transportUsageOptionKey || "",
      transportUsageLabel: service.transportUsageLabel || "",
      transportUsageLimitOptionKey: service.transportUsageLimitOptionKey || "",
      extraPerKmRate: Number(service.extraPerKmRate || 0),
      fullDayExtraPerKmRate: Number(service.fullDayExtraPerKmRate || 0),
      halfDayExtraPerKmRate: Number(service.halfDayExtraPerKmRate || 0),
      passengerCapacity: service.passengerCapacity || 0,
      luggageCapacity: service.luggageCapacity || 0,
      rate: quoteBaseRate,
      quoteBaseRate,
      roomTypeOptionRate: roundCurrencyAmount(
        service.roomTypeOptionRate ??
          service.price ??
          service.rate ??
          resolvedRate ??
          0,
      ),
      roomTypeOptionCurrency: normalizeCurrencyCode(
        service.roomTypeOptionCurrency || service.currency || "INR",
      ),
      awebRate: Number(service.awebRate || 0),
      cwebRate: Number(service.cwebRate || 0),
      cwoebRate: Number(service.cwoebRate || 0),
      currency: normalizeCurrencyCode(service.currency || "INR"),
      exchangeRate: Number(service.exchangeRate || 1),
      priceInInr: Number(service.priceInInr || 0),
      originalTotal: resolvedStoredTotal,
      totalInInr: Number(service.totalInInr || 0),
      useStoredPricing: overrides.useStoredPricing ?? true,
      manualRateOverride: Boolean(
        service.manualRateOverride || overrides.manualRateOverride,
      ),
      serviceDate: formatDateInput(service.serviceDate),
      nights: service.nights || "",
      days: service.days || 1,
      pax: service.pax || 1,
      tourType:
        service.tourType || service.tourTypes?.[0]?.tourType || "Group Tour",
      tourTypes: Array.isArray(service.tourTypes) ? service.tourTypes : [],
      pricingBasis:
        service.pricingBasis ||
        service.tourTypes?.[0]?.pricingBasis ||
        (String(service.tourType || "")
          .toLowerCase()
          .includes("group") &&
        !String(service.tourType || "")
          .toLowerCase()
          .includes("per group")
          ? "Per Pax"
          : "Per Group"),
      maxPax:
        service.maxPax ||
        service.tourTypes?.[0]?.maxPax ||
        (String(service.tourType || "")
          .toLowerCase()
          .includes("group") &&
        !String(service.tourType || "")
          .toLowerCase()
          .includes("per group")
          ? "N/A (Shared Group)"
          : String(service.tourType || "")
                .toLowerCase()
                .includes("vip")
            ? "Up to 6 Pax"
            : "Up to 4 Pax"),
      operatingDays:
        service.operatingDays || overrides.operatingDays || "Mon-Sun",
      openingTime: service.openingTime || overrides.openingTime || "08:00",
      closingTime: service.closingTime || overrides.closingTime || "18:00",
      duration: service.duration || overrides.duration || "",
      slots: service.slots || overrides.slots || "",
      selectedSlot: service.selectedSlot || overrides.selectedSlot || "",
      adultPrice: Number(
        service.adultPrice !== undefined
          ? service.adultPrice
          : service.price || quoteBaseRate || 0,
      ),
      childPrice: Number(
        service.childPrice !== undefined ? service.childPrice : 0,
      ),
      roomCategory: resolvedRoomCategory,
      roomType: resolvedRoomType,
      hotelCategory: service.hotelCategory || "",
      bedType: resolvedBedType,
      adults: service.adults || 2,
      children: service.children || 0,
      infants: service.infants || 0,
      rooms: service.rooms || 1,
      extraAdult: Boolean(service.extraAdult),
      childWithBed: Boolean(service.childWithBed),
      childWithoutBed: Boolean(service.childWithoutBed),
      hotelRateMode: "unit-rate",
      checked: overrides.checked ?? true,
      custom: overrides.custom ?? !service.serviceId,
      editBaseline:
        overrides.editBaseline ||
        buildServiceEditBaseline({
          ...service,
          hotelRateMode: "unit-rate",
          quoteBaseRate,
          originalTotal: resolvedStoredTotal,
          roomTypeOptionRate:
            service.roomTypeOptionRate ??
            service.price ??
            service.rate ??
            resolvedRate ??
            0,
          roomTypeOptionCurrency:
            service.roomTypeOptionCurrency || service.currency || "INR",
        }),
      icon: meta.icon,
      color: meta.color,
    };
  };

  const mergeDraftServicesIntoAvailableServices = (
    availableServices = [],
    quotation = null,
  ) => {
    const draftServices = Array.isArray(quotation?.services)
      ? quotation.services
      : [];
    const sourceQuotationSnapshot =
      editingSourceQuotationSnapshotRef.current ||
      editingSourceQuotationSnapshot;
    const sourceSnapshotServices = Array.isArray(
      sourceQuotationSnapshot?.services,
    )
      ? sourceQuotationSnapshot.services
      : [];

    if (!draftServices.length) {
      return availableServices;
    }

    const usedDraftIndexes = new Set();
    const normalizeDraftMatchValue = (value = "") =>
      String(value || "")
        .trim()
        .toLowerCase();
    const normalizeDraftServiceId = (value = "") => {
      if (!value) return "";
      if (typeof value === "object") {
        return String(value?._id || value?.id || "").trim();
      }
      return String(value || "").trim();
    };

    const getServiceMatchKey = (service = {}) =>
      [
        normalizeServiceFilterType(service?.type),
        normalizeDraftMatchValue(
          service?.title || service?.hotelName || service?.name,
        ),
        normalizeDraftMatchValue(service?.city),
        normalizeDraftMatchValue(service?.country),
        normalizeDraftMatchValue(service?.roomType),
        normalizeDraftMatchValue(service?.roomCategory),
        normalizeDraftMatchValue(normalizeBedTypeValue(service?.bedType)),
      ].join("|");

    const getServiceSourceMatchKey = (service = {}) =>
      [
        normalizeServiceFilterType(service?.type),
        normalizeDraftMatchValue(
          service?.title || service?.hotelName || service?.name,
        ),
        normalizeDraftMatchValue(service?.city),
        normalizeDraftMatchValue(service?.country),
        normalizeDraftServiceId(service?.supplierId || service?.dmcId),
      ].join("|");

    const doServicesRepresentSameSource = (
      draftService = {},
      currentService = {},
    ) => {
      const draftType = normalizeServiceFilterType(draftService?.type);
      const currentType = normalizeServiceFilterType(currentService?.type);
      const draftUsageOptionKey = normalizeTransportUsageOptionKey(
        draftService?.transportUsageOptionKey ||
          draftService?.transportUsageLabel,
      );
      const currentUsageOptionKey = normalizeTransportUsageOptionKey(
        currentService?.transportUsageOptionKey ||
          currentService?.transportUsageLabel,
      );

      if (
        draftType === "transfer" &&
        currentType === "transfer" &&
        draftUsageOptionKey &&
        currentUsageOptionKey &&
        draftUsageOptionKey !== currentUsageOptionKey
      ) {
        return false;
      }

      const draftSourceId = normalizeDraftServiceId(
        draftService?.serviceId || draftService?.dbServiceId,
      );
      const draftDocumentId = normalizeDraftServiceId(
        draftService?._id || draftService?.draftServiceId,
      );
      const currentSourceId = normalizeDraftServiceId(
        currentService?.serviceId || currentService?.id,
      );
      const currentDraftId = normalizeDraftServiceId(
        currentService?.dbServiceId,
      );

      if (
        draftSourceId &&
        currentSourceId &&
        draftSourceId === currentSourceId
      ) {
        return true;
      }

      if (
        draftDocumentId &&
        currentDraftId &&
        draftDocumentId === currentDraftId
      ) {
        return true;
      }

      const draftKey = getServiceMatchKey(draftService);
      const currentKey = getServiceMatchKey(currentService);

      if (draftKey && currentKey && draftKey === currentKey) {
        return true;
      }

      const draftSourceKey = getServiceSourceMatchKey(draftService);
      const currentSourceKey = getServiceSourceMatchKey(currentService);

      return Boolean(
        draftSourceKey &&
        currentSourceKey &&
        draftSourceKey === currentSourceKey,
      );
    };

    const mergedBaseServices = availableServices.map((service) => {
      const matchIndex = draftServices.findIndex((draftService, index) => {
        if (usedDraftIndexes.has(index)) return false;

        return doServicesRepresentSameSource(draftService, service);
      });

      if (matchIndex === -1) {
        return service;
      }

      usedDraftIndexes.add(matchIndex);
      const draftService = draftServices[matchIndex];
      const sourceSnapshotService =
        sourceSnapshotServices.find(
          (sourceService) =>
            doServicesRepresentSameSource(sourceService, service) ||
            doServicesRepresentSameSource(sourceService, draftService),
        ) || null;
      const normalizedDraftType = normalizeServiceFilterType(
        draftService.type || service.type,
      );
      const hotelQuantity =
        Math.max(Number(draftService.nights || service.nights || 1), 1) *
        Math.max(Number(draftService.rooms || service.rooms || 1), 1);
      const isSightseeingGroup =
        normalizedDraftType === "sightseeing" &&
        (/private|premium|vip/i.test(
          String(draftService.tourType || service.tourType || ""),
        ) ||
          (String(draftService.pricingBasis || service.pricingBasis || "")
            .toLowerCase()
            .includes("group") &&
            !String(draftService.pricingBasis || service.pricingBasis || "")
              .toLowerCase()
              .includes("pax")));

      const serviceQuantity =
        normalizedDraftType === "hotel"
          ? hotelQuantity
          : normalizedDraftType === "transfer"
            ? Math.max(Number(draftService.days || service.days || 1), 1)
            : normalizedDraftType === "activity"
              ? Math.max(Number(draftService.pax || service.pax || 1), 1)
              : normalizedDraftType === "sightseeing"
                ? isSightseeingGroup
                  ? 1
                  : Math.max(Number(draftService.pax || service.pax || 1), 1)
                : 1;
      const liveBaseServiceAmount = roundCurrencyAmount(
        Number(service.roomTypeOptionRate || 0) ||
          Number(service.price || 0) ||
          Number(service.rate || 0) ||
          Number(service.quoteBaseRate || 0) ||
          0,
      );
      const storedBaseServiceAmount = roundCurrencyAmount(
        Number(service.quoteBaseRate || 0) ||
          Number(service.price || 0) ||
          Number(service.rate || 0) ||
          0,
      );
      const shouldRefreshLiveDraftRate =
        liveBaseServiceAmount > 0 && !draftService.manualRateOverride;
      const sourceBaseServiceAmount = roundCurrencyAmount(
        shouldRefreshLiveDraftRate
          ? liveBaseServiceAmount
          : Number(sourceSnapshotService?.quoteBaseRate || 0) ||
              Number(sourceSnapshotService?.price || 0) ||
              Number(sourceSnapshotService?.rate || 0) ||
              Number(draftService.quoteBaseRate || 0) ||
              Number(draftService.price || 0) ||
              Number(draftService.rate || 0) ||
              storedBaseServiceAmount ||
              0,
      );
      const refreshedServiceTotal = roundCurrencyAmount(
        (sourceBaseServiceAmount +
          (normalizedDraftType === "hotel" && draftService.extraAdult
            ? Number(service.awebRate || draftService.awebRate || 0)
            : 0) +
          (normalizedDraftType === "hotel" && draftService.childWithBed
            ? Number(service.cwebRate || draftService.cwebRate || 0)
            : 0) +
          (normalizedDraftType === "hotel" && draftService.childWithoutBed
            ? Number(service.cwoebRate || draftService.cwoebRate || 0)
            : 0)) *
          serviceQuantity,
      );
      const sourceStoredTotal = roundCurrencyAmount(
        shouldRefreshLiveDraftRate
          ? refreshedServiceTotal
          : Math.max(
              Number(sourceSnapshotService?.total || 0),
              Number(sourceSnapshotService?.originalTotal || 0),
              Number(draftService.total || 0),
              Number(draftService.originalTotal || 0),
              Number(service.total || 0),
              Number(service.originalTotal || 0),
              sourceBaseServiceAmount * hotelQuantity,
              0,
            ),
      );
      const draftMappedService = mapDraftServiceToUi(draftService, {
        id: service.id,
        custom: false,
        useStoredPricing: true,
        fullServiceAmount: sourceStoredTotal,
        baseServiceAmount: sourceBaseServiceAmount,
        fallbackRoomType: service.roomType || "",
        fallbackRoomCategory: service.roomCategory || "Double",
        fallbackBedType: service.bedType || "",
        editBaseline: buildServiceEditBaseline({
          ...(sourceSnapshotService || draftService),
          hotelRateMode: "unit-rate",
          quoteBaseRate: sourceBaseServiceAmount,
          originalTotal: sourceStoredTotal,
          roomType:
            inferHotelRoomTypeValue(draftService) || service.roomType || "",
          roomCategory:
            draftService.roomCategory || service.roomCategory || "Double",
          bedType:
            normalizeBedTypeValue(draftService.bedType) ||
            service.bedType ||
            "",
          roomTypeOptionRate:
            sourceSnapshotService?.roomTypeOptionRate ??
            draftService.roomTypeOptionRate ??
            service.rate ??
            service.price ??
            0,
          roomTypeOptionCurrency:
            sourceSnapshotService?.roomTypeOptionCurrency ||
            draftService.roomTypeOptionCurrency ||
            service.currency ||
            draftService.currency ||
            "INR",
        }),
      });

      return {
        ...service,
        checked: draftMappedService.checked,
        custom: false,
        dbServiceId: draftMappedService.dbServiceId,
        serviceDate: draftMappedService.serviceDate || service.serviceDate,
        nights: draftMappedService.nights || service.nights,
        days: draftMappedService.days || service.days,
        pax: draftMappedService.pax || service.pax,
        adults: draftMappedService.adults ?? service.adults,
        children: draftMappedService.children ?? service.children,
        infants: draftMappedService.infants ?? service.infants,
        rooms: draftMappedService.rooms ?? service.rooms,
        extraAdult: draftMappedService.extraAdult,
        childWithBed: draftMappedService.childWithBed,
        childWithoutBed: draftMappedService.childWithoutBed,
        hotelRateMode:
          draftMappedService.hotelRateMode || service.hotelRateMode,
        rate: shouldRefreshLiveDraftRate
          ? sourceBaseServiceAmount
          : draftMappedService.rate,
        quoteBaseRate:
          sourceBaseServiceAmount ||
          draftMappedService.quoteBaseRate ||
          draftMappedService.rate,
        currency: draftMappedService.currency,
        roomTypeOptionRate: shouldRefreshLiveDraftRate
          ? sourceBaseServiceAmount
          : draftMappedService.roomTypeOptionRate || service.roomTypeOptionRate,
        roomTypeOptionCurrency:
          draftMappedService.roomTypeOptionCurrency ||
          service.roomTypeOptionCurrency,
        awebRate: draftMappedService.awebRate,
        cwebRate: draftMappedService.cwebRate,
        cwoebRate: draftMappedService.cwoebRate,
        roomType: draftMappedService.roomType || service.roomType,
        roomCategory: draftMappedService.roomCategory || service.roomCategory,
        bedType: draftMappedService.bedType || service.bedType,
        operatingDays:
          draftMappedService.operatingDays ||
          service.operatingDays ||
          "Mon-Sun",
        openingTime:
          draftMappedService.openingTime || service.openingTime || "08:00",
        closingTime:
          draftMappedService.closingTime || service.closingTime || "18:00",
        duration: draftMappedService.duration || service.duration || "",
        slots: draftMappedService.slots || service.slots || "",
        selectedSlot:
          draftMappedService.selectedSlot || service.selectedSlot || "",
        adultPrice:
          draftMappedService.adultPrice !== undefined
            ? draftMappedService.adultPrice
            : service.adultPrice,
        childPrice:
          draftMappedService.childPrice !== undefined
            ? draftMappedService.childPrice
            : service.childPrice,
        tourType: draftMappedService.tourType || service.tourType,
        tourTypes:
          Array.isArray(draftMappedService.tourTypes) &&
          draftMappedService.tourTypes.length
            ? draftMappedService.tourTypes
            : service.tourTypes || [],
        useStoredPricing: true,
        originalTotal:
          sourceStoredTotal ||
          draftMappedService.originalTotal ||
          draftMappedService.total ||
          draftMappedService.rate,
        totalInInr: shouldRefreshLiveDraftRate
          ? sourceStoredTotal
          : draftMappedService.totalInInr || 0,
        priceInInr: shouldRefreshLiveDraftRate
          ? sourceBaseServiceAmount
          : draftMappedService.priceInInr || 0,
        editBaseline:
          draftMappedService.editBaseline ||
          buildServiceEditBaseline(draftMappedService),
      };
    });

    const customDraftServices = draftServices
      .filter(
        (draftService, index) =>
          !usedDraftIndexes.has(index) &&
          !availableServices.some((service) =>
            doServicesRepresentSameSource(draftService, service),
          ),
      )
      .map((draftService) =>
        mapDraftServiceToUi(draftService, {
          custom: true,
          useStoredPricing: true,
        }),
      );

    return [...mergedBaseServices, ...customDraftServices];
  };

  const syncLoadedDraftHotelPricing = (
    currentServices = [],
    quotation = null,
  ) => {
    const draftServices = Array.isArray(quotation?.services)
      ? quotation.services
      : [];
    if (!draftServices.length) return currentServices;

    const normalizeMatchValue = (value = "") =>
      String(value || "")
        .trim()
        .toLowerCase();
    const normalizeMatchId = (value = "") => {
      if (!value) return "";
      if (typeof value === "object") {
        return String(
          value?._id || value?.id || value?.toString?.() || "",
        ).trim();
      }
      return String(value || "").trim();
    };
    const getLooseKey = (service = {}) =>
      [
        normalizeServiceFilterType(service?.type),
        normalizeMatchValue(
          service?.title || service?.hotelName || service?.name,
        ),
        normalizeMatchValue(service?.city),
        normalizeMatchValue(service?.country),
      ].join("|");
    const isSameDraftService = (draftService = {}, service = {}) => {
      const draftId = normalizeMatchId(
        draftService.serviceId || draftService._id || draftService.dbServiceId,
      );
      const serviceId = normalizeMatchId(
        service.serviceId || service.id || service.dbServiceId,
      );
      if (draftId && serviceId && draftId === serviceId) return true;
      return getLooseKey(draftService) === getLooseKey(service);
    };

    let changed = false;
    const nextServices = currentServices.map((service) => {
      if (
        normalizeServiceFilterType(service.type) !== "hotel" ||
        !service.checked ||
        service.manualRateOverride
      ) {
        return service;
      }

      const draftService = draftServices.find((item) =>
        isSameDraftService(item, service),
      );
      if (!draftService) return service;

      const hotelQuantity =
        Math.max(Number(draftService.nights || service.nights || 1), 1) *
        Math.max(Number(draftService.rooms || service.rooms || 1), 1);
      const storedDraftBaseRate = roundCurrencyAmount(
        Number(draftService.quoteBaseRate || 0) ||
          Number(draftService.price || 0) ||
          Number(draftService.rate || 0) ||
          (Number(draftService.total || draftService.originalTotal || 0) > 0
            ? Number(draftService.total || draftService.originalTotal || 0) /
              hotelQuantity
            : 0),
      );
      const liveBaseRate = roundCurrencyAmount(
        Number(service.roomTypeOptionRate || 0) ||
          Number(service.price || 0) ||
          Number(service.rate || 0) ||
          Number(service.quoteBaseRate || 0) ||
          0,
      );
      const draftBaseRate = service.manualRateOverride
        ? storedDraftBaseRate
        : liveBaseRate || storedDraftBaseRate;
      if (!draftBaseRate) return service;

      const draftTotal = roundCurrencyAmount(
        service.manualRateOverride
          ? Number(draftService.total || 0) ||
              Number(draftService.originalTotal || 0) ||
              draftBaseRate * hotelQuantity
          : (draftBaseRate +
              (draftService.extraAdult
                ? Number(service.awebRate || draftService.awebRate || 0)
                : 0) +
              (draftService.childWithBed
                ? Number(service.cwebRate || draftService.cwebRate || 0)
                : 0) +
              (draftService.childWithoutBed
                ? Number(service.cwoebRate || draftService.cwoebRate || 0)
                : 0)) *
              hotelQuantity,
      );
      const optionRate = roundCurrencyAmount(
        (service.manualRateOverride ? 0 : draftBaseRate) ||
          service.roomTypeOptionRate ||
          draftService.roomTypeOptionRate ||
          service.rate ||
          service.price ||
          0,
      );

      const nextService = {
        ...service,
        rate: draftBaseRate,
        quoteBaseRate: draftBaseRate,
        originalTotal: draftTotal,
        totalInInr: Number(
          draftService.totalInInr || service.totalInInr || draftTotal,
        ),
        priceInInr: Number(
          draftService.priceInInr || service.priceInInr || draftBaseRate,
        ),
        useStoredPricing: true,
        hotelRateMode: "unit-rate",
        editBaseline: buildServiceEditBaseline({
          ...service,
          ...draftService,
          rate: draftBaseRate,
          quoteBaseRate: draftBaseRate,
          originalTotal: draftTotal,
          total: draftTotal,
          hotelRateMode: "unit-rate",
          roomTypeOptionRate: optionRate,
          roomTypeOptionCurrency:
            service.roomTypeOptionCurrency ||
            draftService.roomTypeOptionCurrency ||
            service.currency ||
            "INR",
        }),
      };

      if (
        roundCurrencyAmount(service.rate || 0) !== draftBaseRate ||
        roundCurrencyAmount(service.quoteBaseRate || 0) !== draftBaseRate ||
        roundCurrencyAmount(service.originalTotal || 0) !== draftTotal
      ) {
        changed = true;
      }

      return nextService;
    });

    return changed ? nextServices : currentServices;
  };

  const buildDraftServicePayload = (service = {}) => {
    const serviceTotal =
      service.useStoredPricing && Number(service.originalTotal || 0) > 0
        ? roundCurrencyAmount(service.originalTotal)
        : calculateServiceOriginalTotal(service);
    const serviceTotalInInr =
      service.useStoredPricing && Number(service.totalInInr || 0) > 0
        ? roundCurrencyAmount(service.totalInInr)
        : convertAmountToInr(serviceTotal, service.currency, exchangeRates);

    const normalizedServiceType = normalizeQuotationServiceType(service.type);
    const servicePax =
      normalizedServiceType === "hotel"
        ? getQueryPassengerCount(order) || Number(service.pax || 1)
        : Number(service.pax || 1);
    const serviceUnitDivisor =
      normalizedServiceType === "hotel"
        ? Math.max(Number(service.nights || 1), 1) *
          Math.max(Number(service.rooms || 1), 1)
        : 1;
    const serviceUnitRate =
      normalizedServiceType === "hotel"
        ? roundCurrencyAmount(
            service.manualRateOverride
              ? service.quoteBaseRate ||
                  service.rate ||
                  serviceTotal / serviceUnitDivisor ||
                  0
              : service.roomTypeOptionRate ||
                  service.price ||
                  service.rate ||
                  service.quoteBaseRate ||
                  serviceTotal / serviceUnitDivisor ||
                  0,
          )
        : roundCurrencyAmount(service.rate || 0);

    return {
      draftServiceId: service.dbServiceId || "",
      serviceId: service.custom
        ? service.serviceId || ""
        : service.transportUsageServiceIds?.[
            getTransportUsageOptionKey(service)
          ] ||
          service.serviceId ||
          service.id,
      dmcId: resolveDmcOwner(service).dmcId,
      dmcName: resolveDmcOwner(service).dmcName,
      supplierId: service.supplierId || "",
      supplierName: service.supplierName || "",
      type: normalizedServiceType,
      title: service.title,
      city: service.city || "",
      country: service.country || "",
      description: service.desc || service.description || "",
      serviceDate: service.serviceDate || "",
      roomCategory: service.roomCategory || "",
      roomType: service.roomType || "",
      hotelCategory: service.hotelCategory || "",
      bedType: normalizeBedTypeValue(service.bedType),
      adults: Number(service.adults || 0),
      children: Number(service.children || 0),
      infants: Number(service.infants || 0),
      rooms: Number(service.rooms || 1),
      nights: Number(service.nights || 0),
      vehicleType: service.vehicleType || "",
      passengerCapacity: Number(service.passengerCapacity || 0),
      luggageCapacity: Number(service.luggageCapacity || 0),
      usageType: service.usageType || "",
      transportUsageOptionKey:
        service.transportUsageOptionKey || getTransportUsageOptionKey(service),
      transportUsageLabel:
        service.transportUsageLabel ||
        getSelectedTransportUsageOptionLabels(service)[0] ||
        "",
      transportUsageLimitOptionKey: service.transportUsageLimitOptionKey || "",
      extraPerKmRate: Number(service.extraPerKmRate || 0),
      fullDayExtraPerKmRate: Number(service.fullDayExtraPerKmRate || 0),
      halfDayExtraPerKmRate: Number(service.halfDayExtraPerKmRate || 0),
      days: Number(service.days || 1),
      pax: servicePax,
      tourType: service.tourType || "",
      tourTypes: Array.isArray(service.tourTypes) ? service.tourTypes : [],
      pricingBasis: service.pricingBasis || "",
      maxPax: service.maxPax || "",
      currency: normalizeCurrencyCode(service.currency || "INR"),
      price: serviceUnitRate,
      hotelRateMode: "unit-rate",
      manualRateOverride: Boolean(service.manualRateOverride),
      quoteBaseRate: normalizedServiceType === "hotel" ? serviceUnitRate : 0,
      roomTypeOptionRate:
        normalizedServiceType === "hotel"
          ? roundCurrencyAmount(
              service.roomTypeOptionRate || serviceUnitRate || 0,
            )
          : 0,
      roomTypeOptionCurrency:
        normalizedServiceType === "hotel"
          ? normalizeCurrencyCode(
              service.roomTypeOptionCurrency || service.currency || "INR",
            )
          : "",
      exchangeRate: Number(
        service.exchangeRate ||
          getExchangeRateForCurrency(service.currency, exchangeRates),
      ),
      priceInInr: roundCurrencyAmount(
        convertAmountToInr(serviceUnitRate, service.currency, exchangeRates),
      ),
      extraAdult: Boolean(service.extraAdult),
      childWithBed: Boolean(service.childWithBed),
      childWithoutBed: Boolean(service.childWithoutBed),
      awebRate: roundCurrencyAmount(service.awebRate || 0),
      cwebRate: roundCurrencyAmount(service.cwebRate || 0),
      cwoebRate: roundCurrencyAmount(service.cwoebRate || 0),
      blackoutDates: Array.isArray(service.blackoutDates)
        ? service.blackoutDates
        : [],
      blackout: service.blackout || { isBlackout: false },
      blackoutOverride:
        service.blackoutOverride ||
        (service.blackout?.isBlackout
          ? {
              approved: true,
              source: "ops_manager_special_rate",
              reason:
                service.blackout.label ||
                service.blackout.reason ||
                "Blackout date special pricing",
            }
          : undefined),
      total: serviceTotal,
      totalInInr: serviceTotalInInr,
    };
  };

  const mergeRefreshedContractedServices = (
    previousServices = [],
    refreshedServices = [],
  ) => {
    if (!previousServices.length) return refreshedServices;

    const previousBySourceId = new Map(
      previousServices.map((service) => [
        String(service.serviceId || service.id || ""),
        service,
      ]),
    );
    const refreshedIds = new Set(
      refreshedServices.map((service) =>
        String(service.serviceId || service.id || ""),
      ),
    );

    const mergedServices = refreshedServices.map((service) => {
      const previous = previousBySourceId.get(
        String(service.serviceId || service.id || ""),
      );
      if (!previous) return service;
      const shouldPreservePricing = Boolean(
        previous.checked ||
        previous.useStoredPricing ||
        previous.manualRateOverride ||
        previous.blackoutOverride?.approved,
      );

      return {
        ...service,
        checked: previous.checked,
        serviceDate: previous.serviceDate || service.serviceDate,
        nights: previous.nights || service.nights,
        days: previous.days || service.days,
        pax: previous.pax || service.pax,
        usageType: previous.usageType || service.usageType,
        transportUsageOptionKey:
          previous.transportUsageOptionKey || service.transportUsageOptionKey,
        transportUsageLabel:
          previous.transportUsageLabel || service.transportUsageLabel,
        transportUsageLimitOptionKey:
          previous.transportUsageLimitOptionKey ||
          service.transportUsageLimitOptionKey,
        adults: previous.adults ?? service.adults,
        children: previous.children ?? service.children,
        infants: previous.infants ?? service.infants,
        rooms: previous.rooms ?? service.rooms,
        extraAdult: previous.extraAdult,
        childWithBed: previous.childWithBed,
        childWithoutBed: previous.childWithoutBed,
        hotelRateMode: previous.hotelRateMode || service.hotelRateMode,
        ...(shouldPreservePricing
          ? {
              rate: previous.rate,
              quoteBaseRate: previous.quoteBaseRate,
              roomTypeOptionRate: previous.roomTypeOptionRate,
              roomTypeOptionCurrency: previous.roomTypeOptionCurrency,
              currency: previous.currency,
              exchangeRate: previous.exchangeRate,
              useStoredPricing: previous.useStoredPricing,
              manualRateOverride: previous.manualRateOverride,
              originalTotal: previous.originalTotal,
              totalInInr: previous.totalInInr,
              priceInInr: previous.priceInInr,
              awebRate: previous.awebRate,
              cwebRate: previous.cwebRate,
              cwoebRate: previous.cwoebRate,
              editBaseline: previous.editBaseline || service.editBaseline,
              blackout: previous.blackout || service.blackout,
              blackoutOverride:
                previous.blackoutOverride || service.blackoutOverride,
            }
          : {}),
      };
    });

    const customServices = previousServices.filter((service) => {
      const sourceId = String(service.serviceId || service.id || "");
      return service.custom && !refreshedIds.has(sourceId);
    });

    return [...mergedServices, ...customServices];
  };

  const formatContractedServicesForUi = useCallback(
    (rawServices = []) =>
      rawServices
        .map((s) => {
          const meta = getServiceMeta(s.type);
          const owner = resolveDmcOwner(s);
          const normalizedServiceType = normalizeServiceFilterType(s.type);
          const resolvedRoomType = inferHotelRoomTypeValue(s);
          const resolvedRoomCategory = s.roomCategory || "Double";
          const defaultServicePax =
            normalizedServiceType === "hotel"
              ? getQueryPassengerCount(order) || 1
              : 1;
          const resolvedRate = getResolvedHotelBaseRate(
            {
              ...s,
              type: s.type,
              roomType: resolvedRoomType,
              roomCategory: resolvedRoomCategory,
            },
            s.price || 0,
          );
          const smart =
            normalizedServiceType === "hotel"
              ? resolveHotelSmartRate(
                  {
                    ...s,
                    type: s.type,
                    roomType: resolvedRoomType,
                    roomCategory: resolvedRoomCategory,
                  },
                  s.serviceDate || formatDateInput(order?.startDate),
                )
              : normalizedServiceType === "transfer" ||
                  normalizedServiceType === "car"
                ? resolveTransportSmartRate(
                    s,
                    s.serviceDate || formatDateInput(order?.startDate),
                  )
                : normalizedServiceType === "activity" ||
                    normalizedServiceType === "sightseeing"
                  ? resolveActivitySmartRate(
                      s,
                      s.serviceDate || formatDateInput(order?.startDate),
                    )
                  : {
                      rate: s.price || 0,
                      tier: "Standard Rate",
                      isBlackout: false,
                      blackoutLabel: "",
                    };

          const finalRate = smart.rate > 0 ? smart.rate : resolvedRate;
          const initialUsagePrices =
            normalizedServiceType === "transfer" ||
            normalizedServiceType === "car"
              ? getTransportVehicleUsagePrices(
                  (s.vehicles || []).find(
                    (v) =>
                      normalizeComparisonTextValue(v.vehicleType) ===
                      normalizeComparisonTextValue(s.vehicleType),
                  ) || {},
                  s,
                  s.serviceDate || formatDateInput(order?.startDate),
                )
              : s.transportUsagePrices || {};
          const contractedFullServiceAmount = roundCurrencyAmount(
            Number(s.quoteBaseRate || 0) ||
              Number(s.originalTotal || 0) ||
              Number(s.total || 0),
          );
          const useContractedServiceTotal =
            normalizedServiceType === "hotel" &&
            contractedFullServiceAmount > 0 &&
            contractedFullServiceAmount !== finalRate;
          const defaultTour =
            Array.isArray(s.tourTypes) && s.tourTypes.length > 0
              ? s.tourTypes[0]
              : {};
          const resolvedAdultPrice = Number(
            s.adultPrice !== undefined
              ? s.adultPrice
              : defaultTour.adultPrice !== undefined
                ? defaultTour.adultPrice
                : defaultTour.price || s.price || finalRate,
          );
          const resolvedChildPrice = Number(
            s.childPrice !== undefined
              ? s.childPrice
              : defaultTour.childPrice !== undefined
                ? defaultTour.childPrice
                : 0,
          );
          return {
            id: s.id,
            serviceId: s.id,
            dmcId: owner.dmcId,
            dmcName: owner.dmcName,
            supplierId: s.supplierId || "",
            supplierName: s.supplierName || "",
            type: s.type,
            title: s.serviceName || s.title || s.hotelName || "",
            serviceName: s.serviceName || "",
            hotelName: s.hotelName || "",
            hotels: Array.isArray(s.hotels) ? s.hotels : [],
            desc: s.description || "",
            city: s.city || "",
            country: s.country || "",
            vehicleType: s.vehicleType || "",
            vehicles: Array.isArray(s.vehicles) ? s.vehicles : [],
            fullDayNote: s.fullDayNote || "",
            halfDayNote: s.halfDayNote || "",
            transportUsagePrices: initialUsagePrices,
            usageType: s.usageType || "",
            transportUsageOptionKey: s.transportUsageOptionKey || "",
            transportUsageLabel: s.transportUsageLabel || "",
            transportUsageLimitOptionKey: s.transportUsageLimitOptionKey || "",
            extraPerKmRate: Number(s.extraPerKmRate || 0),
            fullDayExtraPerKmRate: Number(s.fullDayExtraPerKmRate || 0),
            halfDayExtraPerKmRate: Number(s.halfDayExtraPerKmRate || 0),
            passengerCapacity: s.passengerCapacity || 0,
            luggageCapacity: s.luggageCapacity || 0,
            rate: useContractedServiceTotal
              ? contractedFullServiceAmount
              : finalRate,
            quoteBaseRate: useContractedServiceTotal
              ? contractedFullServiceAmount
              : finalRate,
            roomTypeOptionRate: roundCurrencyAmount(
              s.roomTypeOptionRate ?? finalRate ?? 0,
            ),
            roomTypeOptionCurrency: normalizeCurrencyCode(
              s.roomTypeOptionCurrency || s.currency || "INR",
            ),
            pricingTier: smart.tier || "Standard Rate",
            blackoutDates: Array.isArray(s.blackoutDates)
              ? s.blackoutDates
              : [],
            blackout: smart.isBlackout
              ? { isBlackout: true, label: smart.blackoutLabel }
              : s.blackout || { isBlackout: false },
            operatingDays: s.operatingDays || "Mon-Sun",
            openingTime: s.openingTime || "08:00",
            closingTime: s.closingTime || "18:00",
            duration: s.duration || "",
            slots: s.slots || "",
            selectedSlot:
              s.selectedSlot ||
              String(s.slots || "")
                .split(",")[0]
                ?.trim() ||
              s.openingTime ||
              "08:00",
            adultPrice: resolvedAdultPrice,
            childPrice: resolvedChildPrice,
            // 🔥 ADD THIS
            awebRate: s.awebRate || 0,
            cwebRate: s.cwebRate || 0,
            cwoebRate: s.cwoebRate || 0,
            currency: normalizeCurrencyCode(s.currency),
            serviceDate: s.serviceDate || "",
            nights: "",
            days: 1,
            pax: defaultServicePax,
            tourType: s.tourType || defaultTour.tourType || "Sharing Tour",
            tourTypes: Array.isArray(s.tourTypes) ? s.tourTypes : [],
            roomCategory: resolvedRoomCategory,
            roomType: resolvedRoomType,
            hotelCategory: s.hotelCategory,
            bedType: normalizeBedTypeValue(s.bedType) || "double-bed",
            adults: Number(order?.numberOfAdults || 2),
            children: Number(order?.numberOfChildren || 0),
            infants: 0,
            rooms: s.rooms || 1,
            extraAdult: false,
            childWithBed: false,
            hotelRateMode: useContractedServiceTotal
              ? "service-total"
              : "unit-rate",
            originalTotal: useContractedServiceTotal
              ? contractedFullServiceAmount
              : 0,
            editBaseline: buildServiceEditBaseline({
              ...s,
              price: s.price || 0,
              quoteBaseRate: useContractedServiceTotal
                ? contractedFullServiceAmount
                : 0,
              originalTotal: useContractedServiceTotal
                ? contractedFullServiceAmount
                : 0,
              total: useContractedServiceTotal
                ? contractedFullServiceAmount
                : 0,
              hotelRateMode: useContractedServiceTotal
                ? "service-total"
                : "unit-rate",
              roomTypeOptionRate:
                s.roomTypeOptionRate ?? s.price ?? resolvedRate ?? 0,
              roomTypeOptionCurrency:
                s.roomTypeOptionCurrency || s.currency || "INR",
              serviceDate: s.serviceDate || "",
              days: 1,
              pax: defaultServicePax,
            }),
            // ============================================
            checked: false,
            custom: false,
            icon: meta.icon,
            color: meta.color,
          };
        })
        .reduce((accumulator, service) => {
          const normalizedType = normalizeServiceFilterType(service.type);

          if (normalizedType !== "transfer") {
            accumulator.push(service);
            return accumulator;
          }

          const optionKey = getTransportUsageOptionKey(service);
          const option = getTransportUsageOptionMeta(optionKey);
          const baseTitle = stripTransportUsageSuffix(service.title);
          const groupKey = [
            normalizeComparisonTextValue(baseTitle),
            normalizeComparisonTextValue(service.city),
            normalizeComparisonTextValue(service.country),
            normalizeComparisonTextValue(service.vehicleType),
            Number(service.passengerCapacity || 0),
            normalizeComparisonTextValue(
              service.supplierId ||
                service.dmcId ||
                service.supplierName ||
                service.dmcName,
            ),
          ].join("|");
          const price = roundCurrencyAmount(service.rate || service.price || 0);
          const existingIndex = accumulator.findIndex(
            (item) => item.__transportGroupKey === groupKey,
          );

          if (existingIndex === -1) {
            const transportUsagePrices =
              price > 0 ? { [option.value]: price } : {};
            const transportUsageServiceIds = {
              [option.value]: service.serviceId || service.id,
            };
            const normalizedService = {
              ...service,
              __transportGroupKey: groupKey,
              title: baseTitle,
              desc: String(service.desc || "")
                .split("|")
                .map((item) => item.trim())
                .filter(
                  (item) => item && !normalizeTransportUsageOptionKey(item),
                )
                .join(" | "),
              usageType: option.usageType,
              transportUsageOptionKey: option.value,
              transportUsageLabel: option.label,
              transportUsageLimitOptionKey:
                service.transportUsageLimitOptionKey ||
                getDefaultTransportUsageLimitKeyValue(option.value),
              transportUsagePrices,
              transportUsageServiceIds,
              rate: price || service.rate,
            };

            normalizedService.editBaseline = buildServiceEditBaseline({
              ...normalizedService,
              price: normalizedService.rate,
              rate: normalizedService.rate,
            });
            accumulator.push(normalizedService);
            return accumulator;
          }

          const existingService = accumulator[existingIndex];
          const nextTransportUsagePrices = {
            ...(existingService.transportUsagePrices || {}),
            ...(price > 0 ? { [option.value]: price } : {}),
          };
          const nextTransportUsageServiceIds = {
            ...(existingService.transportUsageServiceIds || {}),
            [option.value]: service.serviceId || service.id,
          };
          const shouldPreferPointToPoint =
            existingService.transportUsageOptionKey !==
              "one-way-airport-transfer" &&
            option.value === "one-way-airport-transfer";
          const selectedOption = shouldPreferPointToPoint
            ? option
            : getTransportUsageOptionMeta(
                existingService.transportUsageOptionKey,
              );
          const selectedRate = shouldPreferPointToPoint
            ? price || existingService.rate
            : existingService.rate;

          accumulator[existingIndex] = {
            ...existingService,
            usageType: selectedOption.usageType,
            transportUsageOptionKey: selectedOption.value,
            transportUsageLabel: selectedOption.label,
            transportUsageLimitOptionKey: shouldPreferPointToPoint
              ? getDefaultTransportUsageLimitKeyValue(selectedOption.value)
              : existingService.transportUsageLimitOptionKey,
            transportUsagePrices: nextTransportUsagePrices,
            transportUsageServiceIds: nextTransportUsageServiceIds,
            rate: selectedRate,
            extraPerKmRate: Number(
              existingService.extraPerKmRate || service.extraPerKmRate || 0,
            ),
            fullDayExtraPerKmRate: Number(
              existingService.fullDayExtraPerKmRate ||
                service.fullDayExtraPerKmRate ||
                0,
            ),
            halfDayExtraPerKmRate: Number(
              existingService.halfDayExtraPerKmRate ||
                service.halfDayExtraPerKmRate ||
                0,
            ),
            editBaseline: buildServiceEditBaseline({
              ...existingService,
              usageType: selectedOption.usageType,
              transportUsageOptionKey: selectedOption.value,
              transportUsageLabel: selectedOption.label,
              rate: selectedRate,
              price: selectedRate,
            }),
          };

          return accumulator;
        }, []),
    [order?.numberOfAdults, order?.numberOfChildren],
  );

  const loadServices = useCallback(
    async ({ preserveCurrent = false, showLoader = !preserveCurrent } = {}) => {
      if (showLoader) {
        setServicesLoading(true);
      }
      setServicesLoadError("");

      try {
        const res = await API.get("/ops/dmcAllGetServices", {
          skipGlobalLoader: true,
          params: {
            refreshedAt: Date.now(),
            queryId: order?._id || order?.id || order?.queryId || "",
          },
        });
        const formatted = formatContractedServicesForUi(res.data.data || []);

        setServices((previous) =>
          preserveCurrent
            ? mergeRefreshedContractedServices(previous, formatted)
            : formatted,
        );
        setBaseServicesSnapshot(formatted.map((service) => ({ ...service })));
      } catch (err) {
        console.error(err);
        if (!preserveCurrent) {
          setServices([]);
          setBaseServicesSnapshot([]);
          setServicesLoadError("Unable to load contracted rates right now.");
        }
      } finally {
        if (showLoader) {
          setServicesLoading(false);
        }
      }
    },
    [formatContractedServicesForUi, order?._id, order?.id, order?.queryId],
  );

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    const canOverrideBlackoutRate = (() => {
      try {
        const values = [];
        for (let index = 0; index < window.localStorage.length; index += 1) {
          const key = window.localStorage.key(index);
          if (key) values.push(window.localStorage.getItem(key));
        }
        const pageRoleText = String(
          document?.body?.innerText || "",
        ).toLowerCase();
        if (
          pageRoleText.includes("ops manager") ||
          pageRoleText.includes("operation manager")
        ) {
          return true;
        }
        for (const value of values) {
          const parsed = JSON.parse(value || "null");
          const roleText = JSON.stringify(parsed || {}).toLowerCase();
          if (
            roleText.includes("operation_manager") ||
            roleText.includes("operations_manager") ||
            roleText.includes("ops_manager") ||
            roleText.includes("ops manager") ||
            roleText.includes("operation manager") ||
            roleText.includes('"role":"admin"')
          ) {
            return true;
          }
        }
      } catch {
        return false;
      }
      return false;
    })();
    if (canOverrideBlackoutRate) return;

    const hasCheckedBlackoutService = services.some(
      (service) => service.blackout?.isBlackout && service.checked,
    );
    if (!hasCheckedBlackoutService) return;

    setServices((prev) =>
      prev.map((service) =>
        service.blackout?.isBlackout && service.checked
          ? { ...service, checked: false, nights: "", useStoredPricing: false }
          : service,
      ),
    );
  }, [services]);

  useEffect(() => {
    const refreshContractedRates = async ({ force = false } = {}) => {
      const now = Date.now();

      if (
        backgroundRatesRefreshRef.current.inFlight ||
        (!force &&
          now - backgroundRatesRefreshRef.current.lastStartedAt < 30000)
      ) {
        return;
      }

      backgroundRatesRefreshRef.current = {
        inFlight: true,
        lastStartedAt: now,
      };

      try {
        await loadServices({ preserveCurrent: true, showLoader: false });
      } finally {
        backgroundRatesRefreshRef.current.inFlight = false;
      }
    };
    const handleStorage = (event) => {
      if (event.key === "contractedRates:lastEditedAt") {
        refreshContractedRates({ force: true });
      }
    };
    const handleWindowFocus = () => refreshContractedRates();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshContractedRates();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadServices]);

  useEffect(() => {
    if (!loadedQuotationDraft || !services.length || draftHydrated) {
      return;
    }

    setServices((prev) =>
      mergeDraftServicesIntoAvailableServices(prev, loadedQuotationDraft),
    );
    setDraftHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draftHydrated,
    loadedQuotationDraft,
    services.length,
    editingSourceQuotationSnapshot,
  ]);

  useEffect(() => {
    if (!loadedQuotationDraft || !services.length) {
      return;
    }

    setServices((prev) =>
      syncLoadedDraftHotelPricing(prev, loadedQuotationDraft),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedQuotationDraft, services.length]);

  useEffect(() => {
    if (!selectedPackageTemplate || !services.length) {
      return;
    }

    setServices((prev) => {
      const next = buildPackageMatchedServices(prev, selectedPackageTemplate);
      return havePackageSelectionsChanged(prev, next) ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPackageTemplate, services.length]);

  const addCustomService = async (data) => {
    try {
      if (!quotationId) {
        toast.error("Quotation draft not ready yet");
        return;
      }

      setSavingService(true);

      const payload = {
        type: data.type,
        title: data.title,
        supplierId: data.supplierId || "",
        supplierName: data.supplierName || "",
        dmcId: data.dmcId || data.supplierId || "",
        dmcName: data.dmcName || "",
        description: data.desc,
        city: data.city || order?.destination || "",
        country: data.country || "",
        serviceDate: data.serviceDate || "",
        nights: data.nights || "",
        days: data.days || 1,
        pax: data.pax || 1,
        operatingDays: data.operatingDays || "Mon-Sun",
        openingTime: data.openingTime || "08:00",
        closingTime: data.closingTime || "18:00",
        duration: data.duration || "",
        slots: data.slots || "",
        selectedSlot: data.selectedSlot || "",
        tourType: data.tourType || "Group Tour",
        tourTypes: Array.isArray(data.tourTypes) ? data.tourTypes : [],
        adultPrice: data.adultPrice || data.rate || 0,
        childPrice: data.childPrice || 0,
        vehicleType: data.vehicleType || "",
        usageType: data.usageType || "point-to-point",
        transportUsageOptionKey:
          data.transportUsageOptionKey || getTransportUsageOptionKey(data),
        transportUsageLabel:
          data.transportUsageLabel ||
          getSelectedTransportUsageOptionLabels(data)[0] ||
          "",
        transportUsageLimitOptionKey: data.transportUsageLimitOptionKey || "",
        extraPerKmRate: Number(data.extraPerKmRate || 0),
        fullDayExtraPerKmRate: Number(data.fullDayExtraPerKmRate || 0),
        halfDayExtraPerKmRate: Number(data.halfDayExtraPerKmRate || 0),
        passengerCapacity: data.passengerCapacity || 0,
        luggageCapacity: data.luggageCapacity || 0,
        price: data.rate,
        currency: normalizeCurrencyCode(data.currency || "INR"),
        exchangeRate: getExchangeRateForCurrency(
          data.currency || "INR",
          exchangeRates,
        ),
        priceInInr: convertAmountToInr(
          data.rate || 0,
          data.currency || "INR",
          exchangeRates,
        ),
        totalInInr: convertAmountToInr(
          calculateServiceOriginalTotal({
            type: data.type,
            rate: data.rate,
            nights: data.nights,
            days: data.days,
            pax: data.pax,
          }),
          data.currency || "INR",
          exchangeRates,
        ),
        adults: data.adults || 0,
        children: data.children || 0,
        infants: data.infants || 0,
        rooms: data.rooms || 1,
        bedType: normalizeBedTypeValue(data.bedType) || "double-bed",
      };

      const { data: response } = await API.post(
        `/ops/quotations/${quotationId}/services`,
        payload,
      );

      const mappedServices = (response.services || []).map((s) => {
        const meta = getServiceMeta(s.type);
        const owner = resolveDmcOwner(s);
        const resolvedRoomType = inferHotelRoomTypeValue(s);
        const resolvedRoomCategory = s.roomCategory || "Double";
        const resolvedRate = getResolvedHotelBaseRate(
          {
            ...s,
            type: s.type,
            roomType: resolvedRoomType,
            roomCategory: resolvedRoomCategory,
          },
          s.price || 0,
        );
        return {
          id: s._id,
          serviceId: s.serviceId || "",
          dbServiceId: s._id,
          dmcId: owner.dmcId,
          dmcName: owner.dmcName,
          supplierId: s.supplierId || "",
          supplierName: s.supplierName || "",
          type: s.type,
          title: s.serviceName || s.title || s.hotelName || "",
          serviceName: s.serviceName || "",
          hotelName: s.hotelName || "",
          desc: s.description || "",
          city: s.city || "",
          country: s.country || "",
          vehicleType: s.vehicleType || "",
          usageType: s.usageType || "",
          transportUsageOptionKey: s.transportUsageOptionKey || "",
          transportUsageLabel: s.transportUsageLabel || "",
          transportUsageLimitOptionKey: s.transportUsageLimitOptionKey || "",
          extraPerKmRate: Number(s.extraPerKmRate || 0),
          fullDayExtraPerKmRate: Number(s.fullDayExtraPerKmRate || 0),
          halfDayExtraPerKmRate: Number(s.halfDayExtraPerKmRate || 0),
          passengerCapacity: s.passengerCapacity || 0,
          luggageCapacity: s.luggageCapacity || 0,
          rate: resolvedRate,
          currency: normalizeCurrencyCode(s.currency || "INR"),
          exchangeRate: Number(s.exchangeRate || 1),
          priceInInr: Number(s.priceInInr || 0),
          totalInInr: Number(s.totalInInr || 0),
          serviceDate: s.serviceDate || "",
          nights: s.nights || "",
          days: s.days || 1,
          pax: s.pax || 1,
          operatingDays: s.operatingDays || data.operatingDays || "Mon-Sun",
          openingTime: s.openingTime || data.openingTime || "08:00",
          closingTime: s.closingTime || data.closingTime || "18:00",
          duration: s.duration || data.duration || "",
          slots: s.slots || data.slots || "",
          selectedSlot: s.selectedSlot || data.selectedSlot || "",
          tourType: s.tourType || data.tourType || "Group Tour",
          tourTypes:
            Array.isArray(s.tourTypes) && s.tourTypes.length
              ? s.tourTypes
              : data.tourTypes || [],
          adultPrice:
            s.adultPrice !== undefined
              ? s.adultPrice
              : data.adultPrice || s.price || 0,
          childPrice:
            s.childPrice !== undefined ? s.childPrice : data.childPrice || 0,
          adults: s.adults || 0,
          children: s.children || 0,
          infants: s.infants || 0,
          rooms: s.rooms || 1,
          bedType: normalizeBedTypeValue(s.bedType) || "double-bed",
          roomCategory: resolvedRoomCategory,
          roomType: resolvedRoomType,
          hotelCategory: s.hotelCategory || "",
          extraAdult: Boolean(s.extraAdult),
          childWithBed: Boolean(s.childWithBed),
          childWithoutBed: Boolean(s.childWithoutBed),
          hotelRateMode:
            normalizeServiceFilterType(s.type) === "hotel"
              ? "service-total"
              : "unit-rate",
          awebRate: Number(s.awebRate || 0),
          cwebRate: Number(s.cwebRate || 0),
          cwoebRate: Number(s.cwoebRate || 0),
          editBaseline: buildServiceEditBaseline(s),
          checked: true,
          custom: true,
          icon: meta.icon,
          color: meta.color,
        };
      });

      setServices((prev) => {
        const normalServices = prev.filter((item) => !item.custom);
        return [...normalServices, ...mappedServices];
      });

      showQuickActionFeedback(
        "success",
        "Service Added",
        `${data.title} has been added to this quotation.`,
      );
    } catch (error) {
      console.error("Failed to add custom service", error);
      toast.error(error?.response?.data?.message || "Failed to add service");
    } finally {
      setSavingService(false);
    }
  };

  const deleteService = async (id) => {
    try {
      const target = services.find((item) => item.id === id);

      if (!target?.custom || !target?.dbServiceId) {
        setServices((prev) => prev.filter((s) => s.id !== id));
        return;
      }

      await API.delete(
        `/ops/quotations/${quotationId}/services/${target.dbServiceId}`,
      );

      setServices((prev) => prev.filter((s) => s.id !== id));
      showQuickActionFeedback(
        "delete",
        "Service Removed",
        `${target.title} has been removed from this quotation.`,
      );
    } catch (error) {
      console.error("Failed to delete service", error);
      toast.error(error?.response?.data?.message || "Failed to delete service");
    }
  };

  const selectedServicesWithPricing = useMemo(() => {
    return services
      .filter((service) => service.checked === true)
      .map((service) => {
        const currency = normalizeCurrencyCode(service.currency);
        const storedExchangeRate = Number(service.exchangeRate || 1);
        const exchangeRate = service.useStoredPricing
          ? storedExchangeRate
          : getExchangeRateForCurrency(currency, exchangeRates);
        const originalTotal = service.useStoredPricing
          ? roundCurrencyAmount(
              service.originalTotal ||
                service.quoteBaseRate ||
                service.total ||
                0,
            )
          : calculateServiceOriginalTotal(service);
        const priceInInr = service.useStoredPricing
          ? roundCurrencyAmount(
              service.priceInInr ||
                convertAmountToInr(Number(service.rate || 0), currency, {
                  ...exchangeRates,
                  [currency]: exchangeRate,
                }),
            )
          : convertAmountToInr(
              Number(service.rate || 0),
              currency,
              exchangeRates,
            );
        const totalInInr = service.useStoredPricing
          ? roundCurrencyAmount(
              service.totalInInr ||
                convertAmountToInr(originalTotal, currency, {
                  ...exchangeRates,
                  [currency]: exchangeRate,
                }),
            )
          : convertAmountToInr(originalTotal, currency, exchangeRates);

        return {
          ...service,
          currency,
          exchangeRate,
          originalTotal,
          priceInInr,
          totalInInr,
          isForeignCurrency: currency !== "INR",
        };
      });
  }, [exchangeRates, services]);

  const contractedRateFilterCounts = useMemo(
    () =>
      services
        .filter((service) =>
          doesServiceMatchDestination(service, order?.destination),
        )
        .reduce(
          (counts, service) => {
            counts.all += 1;
            const type = normalizeServiceFilterType(service.type);
            if (counts[type] !== undefined) {
              counts[type] += 1;
            }
            return counts;
          },
          {
            all: 0,
            hotel: 0,
            transfer: 0,
            activity: 0,
            sightseeing: 0,
          },
        ),
    [order?.destination, services],
  );

  const destinationMatchedServices = useMemo(
    () =>
      services.filter((service) =>
        doesServiceMatchDestination(service, order?.destination),
      ),
    [order?.destination, services],
  );

  const filteredServices = useMemo(() => {
    const normalizedSearch = contractedRatesSearch.trim().toLowerCase();

    return destinationMatchedServices.filter((service) => {
      const matchesType =
        contractedRatesFilter === "all" ||
        normalizeServiceFilterType(service.type) === contractedRatesFilter;

      if (!matchesType) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return getServiceSearchText(service).includes(normalizedSearch);
    });
  }, [
    contractedRatesFilter,
    contractedRatesSearch,
    destinationMatchedServices,
  ]);

  const servicesTotal = useMemo(
    () =>
      selectedServicesWithPricing.reduce(
        (sum, service) => sum + Number(service.totalInInr || 0),
        0,
      ),
    [selectedServicesWithPricing],
  );

  const foreignCurrencyBreakdown = useMemo(() => {
    const totals = new Map();

    selectedServicesWithPricing.forEach((service) => {
      if (!service.isForeignCurrency) return;

      const existing = totals.get(service.currency) || {
        currency: service.currency,
        exchangeRate: service.exchangeRate,
        originalTotal: 0,
        inrTotal: 0,
      };

      existing.originalTotal += Number(service.originalTotal || 0);
      existing.inrTotal += Number(service.totalInInr || 0);
      existing.exchangeRate = service.exchangeRate;
      totals.set(service.currency, existing);
    });

    return Array.from(totals.values()).map((item) => ({
      ...item,
      originalTotal: roundCurrencyAmount(item.originalTotal),
      inrTotal: roundCurrencyAmount(item.inrTotal),
      exchangeRate: roundExchangeRateValue(item.exchangeRate),
    }));
  }, [selectedServicesWithPricing]);

  const shouldShowDualPricing =
    quoteCategory === "international" && foreignCurrencyBreakdown.length > 0;

  const baseRate = roundCurrencyAmount(order?.customerBudget || 0);

  const serviceFeeAmount = roundCurrencyAmount(serviceCharge || 0);
  const handlingFeeAmount = roundCurrencyAmount(handlingFee || 0);
  const packageTemplateAmount = roundCurrencyAmount(
    selectedPackageTemplate?.price || 0,
  );

  const opsMarkupBasisAmount = servicesTotal + packageTemplateAmount;
  const hasTaxableQuoteValue = roundCurrencyAmount(opsMarkupBasisAmount) > 0;

  // OPS markup
  let opsMarkup = 0;

  if (marginType === "percentage") {
    opsMarkup = roundCurrencyAmount(
      (opsMarkupBasisAmount * Number(markup || 0)) / 100,
    );
  } else {
    opsMarkup = roundCurrencyAmount(fixedMargin || 0);
  }

  const taxableAmountForTaxes = hasTaxableQuoteValue
    ? opsMarkupBasisAmount + opsMarkup + serviceFeeAmount + handlingFeeAmount
    : 0;
  const draftGstFinal = draftGstChecked
    ? roundCurrencyAmount(
        (taxableAmountForTaxes * Number(draftGstPercent || 0)) / 100,
      )
    : 0;

  const draftTcsFinal = draftTcsChecked
    ? roundCurrencyAmount(
        (taxableAmountForTaxes * Number(draftTcsPercent || 0)) / 100,
      )
    : 0;

  const draftTourismFinal =
    draftTourismChecked && taxableAmountForTaxes > 0
      ? roundCurrencyAmount(draftTourismAmount || DEFAULT_TOURISM_AMOUNT)
      : 0;

  const draftTaxationTotal = roundCurrencyAmount(
    draftGstFinal + draftTcsFinal + draftTourismFinal,
  );

  const appliedGstFinal = gstChecked
    ? roundCurrencyAmount(
        (taxableAmountForTaxes * Number(gstPercent || 0)) / 100,
      )
    : 0;

  const appliedTcsFinal = tcsChecked
    ? roundCurrencyAmount(
        (taxableAmountForTaxes * Number(tcsPercent || 0)) / 100,
      )
    : 0;

  const appliedTourismFinal =
    tourismChecked && taxableAmountForTaxes > 0
      ? roundCurrencyAmount(tourismAmount || DEFAULT_TOURISM_AMOUNT)
      : 0;

  const currentAppliedTaxTotal = roundCurrencyAmount(
    appliedGstFinal + appliedTcsFinal + appliedTourismFinal,
  );

  useEffect(() => {
    setAppliedTaxTotal(currentAppliedTaxTotal);
  }, [currentAppliedTaxTotal]);

  // OPS charges
  const opsChargesTotal = roundCurrencyAmount(
    serviceFeeAmount + handlingFeeAmount,
  );
  // markup amount (OPS charges + markup + tax)
  const markupAmount = roundCurrencyAmount(
    opsChargesTotal + opsMarkup + currentAppliedTaxTotal,
  );

  // total amount
  const totalAmount = roundCurrencyAmount(opsMarkupBasisAmount + markupAmount);
  const selectedServices = selectedServicesWithPricing;
  const selectedServicesDraftSignature = useMemo(
    () =>
      JSON.stringify(
        selectedServices.map((service) => buildDraftServicePayload(service)),
      ),
    [selectedServices],
  );
  const visibleSelectedServices = useMemo(() => {
    if (
      selectedServicesModalScope === "single" &&
      selectedServicesModalTargetId
    ) {
      return selectedServices.filter(
        (service) => service.id === selectedServicesModalTargetId,
      );
    }

    return selectedServices;
  }, [
    selectedServices,
    selectedServicesModalScope,
    selectedServicesModalTargetId,
  ]);

  //=========================================== Api call ======================================

  const persistQuotationDraft = async () => {
    if (!quotationId) {
      throw new Error("Quotation draft not ready yet");
    }

    const payload = {
      queryId: orderQueryId,
      validTill: validTill || formatDateInput(loadedQuotationDraft?.validTill),
      inclusions: sanitizeDynamicListItems(inclusions),
      exclusions: sanitizeDynamicListItems(exclusions),
      additionalNotes: sanitizeDynamicListItems(additionalNotes),
      dayWiseItinerary: sanitizeDayWiseItineraryItems(itineraryEntries),
      services: selectedServices.map((service) =>
        buildDraftServicePayload(service),
      ),
      pricing: {
        currency: "INR",
        quoteCategory,
        baseAmount: roundCurrencyAmount(baseRate || 0),
        subTotal: roundCurrencyAmount(servicesTotal || 0),
        packageTemplateAmount,
        totalAmount: roundCurrencyAmount(totalAmount || 0),
      },
      opsPercent: marginType === "percentage" ? Number(markup || 0) : 0,
      opsAmount:
        marginType === "fixed"
          ? roundCurrencyAmount(fixedMargin || 0)
          : roundCurrencyAmount(opsMarkup || 0),
      serviceCharge: roundCurrencyAmount(serviceCharge || 0),
      handlingFee: roundCurrencyAmount(handlingFee || 0),
      tax: {
        gstAmount: appliedGstFinal,
        gstPercent: gstChecked ? Number(gstPercent || 0) : 0,
        tcsAmount: appliedTcsFinal,
        tcsPercent: tcsChecked ? Number(tcsPercent || 0) : 0,
        tourismAmount: appliedTourismFinal,
      },
    };

    const { data } = await API.put(
      `/ops/quotations/${quotationId}/draft`,
      payload,
    );
    if (data?.quotation) {
      setLoadedQuotationDraft(data.quotation);
    }

    return data?.quotation || null;
  };

  useEffect(() => {
    if (
      !quotationId ||
      !draftHydrated ||
      servicesLoading ||
      isInvoiceRequestedStage
    ) {
      draftServicesAutosaveRef.current = { ready: false, signature: "" };
      return undefined;
    }

    if (!draftServicesAutosaveRef.current.ready) {
      draftServicesAutosaveRef.current = {
        ready: true,
        signature: selectedServicesDraftSignature,
      };
      return undefined;
    }

    if (
      draftServicesAutosaveRef.current.signature ===
      selectedServicesDraftSignature
    ) {
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      try {
        await persistQuotationDraft();
        draftServicesAutosaveRef.current.signature =
          selectedServicesDraftSignature;
      } catch (error) {
        console.error("Failed to auto-save quotation services", error);
      }
    }, 300);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentAppliedTaxTotal,
    draftHydrated,
    isInvoiceRequestedStage,
    quotationId,
    selectedServicesDraftSignature,
    servicesLoading,
    totalAmount,
  ]);

  const resolveQuotationQueryId = (quotation) => {
    const quotationQueryId = quotation?.queryId;

    if (quotationQueryId && typeof quotationQueryId === "object") {
      return quotationQueryId?._id || quotationQueryId?.id || "";
    }

    return quotationQueryId || order?._id || "";
  };

  const buildQuotationSharePayload = (quotation) => {
    const servicesSource =
      Array.isArray(quotation?.services) && quotation.services.length
        ? quotation.services
        : selectedServices;
    const queryPax = getQueryPassengerCount(order);

    return {
      recipientName:
        order?.agent?.name ||
        order?.agentName ||
        order?.agent?.companyName ||
        "Agent",
      recipientCompanyName:
        order?.agent?.companyName ||
        order?.agentName ||
        order?.agent?.name ||
        "",
      phone: resolvedAgentPhone || order?.agent?.phone || "",
      quotationNumber: quotation?.quotationNumber || "",
      queryId: order?.queryId || "",
      destination: order?.destination || "",
      startDate: order?.startDate || "",
      endDate: order?.endDate || "",
      travelDates: `${formatShareDate(order?.startDate)} - ${formatShareDate(order?.endDate)}`,
      durationLabel: tripDuration.label || "-",
      tripNights: Number(tripDuration?.nights || 0),
      tripDays: Number(tripDuration?.days || 0),
      travelerSummary: buildTravelerSummary(order),
      numberOfAdults: Number(order?.numberOfAdults || 0),
      numberOfChildren: Number(order?.numberOfChildren || 0),
      numberOfInfants: Number(order?.numberOfInfants || 0),
      validTill: formatShareDate(quotation?.validTill || validTill),
      totalAmount: Number(quotation?.pricing?.totalAmount || totalAmount || 0),
      currency: quotation?.pricing?.currency || "INR",
      tcsAmount: Number(quotation?.pricing?.tax?.tcs?.amount || 0),
      inclusions: sanitizeDynamicListItems(
        Array.isArray(quotation?.inclusions)
          ? quotation.inclusions
          : inclusions,
      ),
      exclusions: sanitizeDynamicListItems(
        Array.isArray(quotation?.exclusions)
          ? quotation.exclusions
          : exclusions,
      ),
      additionalNotes: sanitizeDynamicListItems(
        Array.isArray(quotation?.additionalNotes)
          ? quotation.additionalNotes
          : additionalNotes,
      ),
      termsAndConditions:
        Array.isArray(quotation?.termsAndConditions) &&
        quotation.termsAndConditions.length
          ? sanitizeDynamicListItems(quotation.termsAndConditions)
          : [...DEFAULT_WHATSAPP_TERMS],
      dayWiseItinerary: sanitizeDayWiseItineraryItems(
        Array.isArray(quotation?.dayWiseItinerary)
          ? quotation.dayWiseItinerary
          : itineraryEntries,
      )
        .filter((entry) => entry.title || entry.description)
        .map((entry) => {
          const dayLabel =
            entry.dayLabel ||
            buildItineraryDayLabel(entry.dayNumber, entry.date);
          return {
            ...entry,
            dayLabel,
            heading: entry.title ? `${dayLabel}: ${entry.title}` : dayLabel,
          };
        }),
      sellerBankDetails: [
        { label: "Bank Name", value: "HDFC Bank" },
        { label: "A/c Holder Name", value: "Holiday Circuit" },
        { label: "A/c No.", value: "50200103968171" },
        { label: "IFSC", value: "HDFC0004413" },
        { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
      ],
      services: servicesSource.map((service) => {
        const normalizedType = normalizeQuotationServiceType(service?.type);
        const servicePax =
          normalizedType === "hotel"
            ? queryPax || Number(service?.pax || 0)
            : Number(service?.pax || 0);

        return {
          title: service?.title || "Service",
          type: normalizedType,
          typeLabel: SERVICE_TYPE_LABELS[normalizedType] || "Travel Service",
          location: buildShareServiceLocationLabel(service),
          city: service?.city || "",
          country: service?.country || "",
          serviceDateLabel: formatShareDate(service?.serviceDate),
          serviceDate: service?.serviceDate || "",
          quantityLabel: buildShareServiceQuantityLabel(service, queryPax),
          description: String(service?.description || service?.desc || "")
            .replace(/\s+/g, " ")
            .trim(),
          nights: Number(service?.nights || 0),
          rooms: Number(service?.rooms || 0),
          roomType: service?.roomType || "",
          bedType: service?.bedType || "",
          hotelCategory: service?.hotelCategory || "",
          adults: Number(service?.adults || 0),
          children: Number(service?.children || 0),
          infants: Number(service?.infants || 0),
          pax: servicePax,
          days: Number(service?.days || 0),
          usageType: service?.usageType || "",
          vehicleType: service?.vehicleType || "",
          passengerCapacity: Number(service?.passengerCapacity || 0),
          pickupTime: service?.pickupTime || service?.time || "",
          time: service?.pickupTime || service?.time || "",
        };
      }),
    };
  };

  const runPostSendAction = async (selectedAction, quotation) => {
    if (!selectedAction) {
      return "Quotation sent successfully";
    }

    const quoteDetails = buildQuotationSharePayload(quotation);

    if (selectedAction === "Copy Text") {
      await copyTextToClipboard(buildPlainTextQuotationSummary(quoteDetails));
      return "Quotation summary copied";
    }

    if (selectedAction === "PDF Download") {
      const queryDocumentId = resolveQuotationQueryId(quotation);

      if (!queryDocumentId) {
        throw new Error("Query reference missing for PDF generation.");
      }

      const { data } = await API.post("/ops/send", {
        queryId: queryDocumentId,
        channels: ["pdf"],
        quoteDetails,
        agent: {
          email: order?.agent?.email || "",
          phone: order?.agent?.phone || "",
        },
      });

      const pdfMeta = data?.results?.pdf;
      const publicFilePath = pdfMeta?.publicFilePath;

      if (!publicFilePath) {
        throw new Error("Quotation PDF could not be generated.");
      }

      await downloadFileFromUrl(
        createPublicAssetUrl(publicFilePath),
        pdfMeta?.fileName || `quotation_${quoteDetails.queryId || "quote"}.pdf`,
      );

      return "Quotation PDF downloaded";
    }

    if (selectedAction === "Word Format") {
      downloadWordDocument(
        quoteDetails,
        `quotation_${quoteDetails.queryId || "quote"}.doc`,
      );
      return "Quotation Word document downloaded";
    }

    if (selectedAction === "Dashboard Notification") {
      return "Dashboard notification sent to agent";
    }

    if (selectedAction === "Email") {
      return `Quotation sent to ${order?.agent?.email || "agent email"}`;
    }

    if (selectedAction === "WhatsApp") {
      const normalizedPhone = normalizeWhatsAppPhoneNumber(quoteDetails?.phone);

      if (!normalizedPhone) {
        throw new Error("Agent phone number is missing for WhatsApp sharing.");
      }

      const message = buildWhatsAppQuotationMessage(quoteDetails);
      const whatsappURL = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;

      if (typeof window === "undefined") {
        throw new Error("WhatsApp sharing is only available in the browser.");
      }

      window.open(whatsappURL, "_blank", "noopener,noreferrer");
      return "WhatsApp quotation is ready to send";
    }

    return "Quotation sent successfully";
  };

  const sendQuotation = async (sendVia = [], selectedAction = "") => {
    if (!validTill) {
      toast.error("Please select Valid Till date");
      return;
    }

    if (!selectedServices.length) {
      toast.error("No services selected");
      return;
    }

    const hotelsWithoutNights = selectedServices.filter(
      (service) => service.type === "hotel" && !Number(service.nights),
    );
    if (hotelsWithoutNights.length) {
      toast.error(
        `Select nights first: ${hotelsWithoutNights
          .map((service) => service.title)
          .join(", ")}`,
      );
      return;
    }

    const servicesWithoutDate = selectedServices.filter(
      (service) => !service.serviceDate,
    );
    if (servicesWithoutDate.length) {
      toast.error(
        `Select service date first: ${servicesWithoutDate
          .map((service) => service.title)
          .join(", ")}`,
      );
      return;
    }

    const unmappedServices = selectedServices.filter(
      (service) => !resolveDmcOwner(service).dmcId,
    );
    if (unmappedServices.length) {
      toast.error(
        `Assign DMC owner first: ${unmappedServices
          .map((service) => service.title)
          .join(", ")}`,
      );
      return;
    }

    const invalidPaxSightseeings = selectedServices.filter((service) => {
      if (service.type !== "sightseeing") return false;
      const paxNum = Number(service.pax || 1);
      const tourType = String(service.tourType || "").toLowerCase();
      if (/private/i.test(tourType) && paxNum > 4) return true;
      if (/premium|vip/i.test(tourType) && paxNum > 6) return true;
      return false;
    });

    if (invalidPaxSightseeings.length) {
      const firstInvalid = invalidPaxSightseeings[0];
      const isPrivate = /private/i.test(firstInvalid.tourType || "");
      const maxLimitMsg = isPrivate
        ? "Maximum 4 Pax allowed for Private Tour."
        : "Maximum 6 Pax allowed for Premium/VIP Tour.";
      toast.error(`${firstInvalid.title}: ${maxLimitMsg}`);
      return;
    }

    const loadingToast = toast.loading("Sending quotation...");

    try {
      // 🔥 MAIN PAYLOAD
      const targetQuotationId = editingTargetQuotationId || quotationId;
      const payload = {
        quotationId: targetQuotationId,
        editExistingQuotation: isEditingHistoricalQuotation,
        queryId: orderQueryId,
        selectedAction,
        validTill,
        baseAmount: baseRate,
        sendVia: sendVia,
        inclusions: sanitizeDynamicListItems(inclusions),
        exclusions: sanitizeDynamicListItems(exclusions),
        additionalNotes: sanitizeDynamicListItems(additionalNotes),
        dayWiseItinerary: sanitizeDayWiseItineraryItems(itineraryEntries),
        services: selectedServices.map((service) =>
          buildDraftServicePayload(service),
        ),

        pricing: {
          currency: "INR",
          quoteCategory,
          baseAmount: baseRate,
          subTotal: roundCurrencyAmount(servicesTotal),
          packageTemplateAmount,
          serviceCurrencyBreakdown: foreignCurrencyBreakdown.map((item) => ({
            currency: item.currency,
            amount: roundCurrencyAmount(item.originalTotal || 0),
            amountInInr: roundCurrencyAmount(item.inrTotal || 0),
            exchangeRate: Number(item.exchangeRate || 1),
          })),
          totalAmount: roundCurrencyAmount(totalAmount),
        },

        opsPercent: marginType === "percentage" ? Number(markup || 0) : 0,
        opsAmount:
          marginType === "fixed"
            ? roundCurrencyAmount(fixedMargin || 0)
            : roundCurrencyAmount(opsMarkup || 0),
        // OPS + TAX
        serviceCharge: roundCurrencyAmount(serviceCharge || 0),
        handlingFee: roundCurrencyAmount(handlingFee || 0),
        tax: {
          gstAmount: appliedGstFinal,
          gstPercent: gstChecked ? Number(gstPercent || 0) : 0,
          tcsAmount: appliedTcsFinal,
          tcsPercent: tcsChecked ? Number(tcsPercent || 0) : 0,
          tourismAmount: appliedTourismFinal,
        },
      };

      // ✅ STEP 1: Create quotation
      const res = await API.post("/ops/quotations", payload);
      const savedQuotation = res?.data?.quotation;
      const warnings = Array.isArray(res?.data?.warnings)
        ? [...res.data.warnings]
        : [];
      const sentToAgent = Boolean(res?.data?.sentToAgent);
      let actionSuccessMessage = sentToAgent
        ? "Quotation sent successfully"
        : "Quotation saved successfully";

      try {
        actionSuccessMessage = await runPostSendAction(
          selectedAction,
          savedQuotation,
        );
      } catch (actionError) {
        console.error("Post-send action failed", actionError);
        warnings.push(
          actionError?.message ||
            "Quotation was saved, but the selected action could not be completed.",
        );
      }

      const hasDeliveryWarnings = warnings.length > 0;

      toast.dismiss(loadingToast);
      toast.success(
        hasDeliveryWarnings
          ? "Quotation saved successfully"
          : actionSuccessMessage,
      );
      warnings.forEach((warning) => toast(warning, { icon: "!" }));
      setSuccessPopup({
        open: true,
        kind: "quote",
        invoiceNumber: "",
        totalAmount: Number(
          savedQuotation?.pricing?.totalAmount ||
            savedQuotation?.clientTotalAmount ||
            totalAmount ||
            0,
        ),
        serviceCount: Number(
          savedQuotation?.services?.length || selectedServices.length || 0,
        ),
        agentName:
          order?.agent?.companyName ||
          order?.agent?.name ||
          order?.agentName ||
          "",
        deliveryWarnings: warnings,
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to send quotation");
    }
  };

  const generateFinalInvoice = async () => {
    if (!quotationId) {
      toast.error("Quotation draft not ready yet");
      return;
    }

    if (preparingFinanceInvoice) {
      return;
    }

    setShowFinanceInvoiceConfirm(false);
    setPreparingFinanceInvoice(true);

    const loadingToast = toast.loading("Preparing finance invoice...");

    try {
      const { data } = await API.post("/ops/invoices", { quotationId });

      toast.dismiss(loadingToast);
      toast.success("Finance invoice prepared successfully");
      const generatedInvoice = data?.invoice;
      setSuccessPopup({
        open: true,
        kind: "invoice",
        invoiceNumber: generatedInvoice?.invoiceNumber || "",
        totalAmount: Number(generatedInvoice?.totalAmount || totalAmount || 0),
        serviceCount: Number(generatedInvoice?.lineItems?.length || 0),
        agentName:
          order?.agent?.companyName ||
          order?.agent?.name ||
          order?.agentName ||
          "",
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to prepare finance invoice",
      );
    } finally {
      setPreparingFinanceInvoice(false);
    }
  };

  const handleFinalSend = () => {
    if (!selectedSendOption) {
      toast.error("Please select an option");
      return;
    }

    const map = {
      Email: ["email"],
      WhatsApp: ["whatsapp"],
      "Dashboard Notification": ["dashboard_notification"],
      "PDF Download": ["pdf"],
      "Word Format": [],
      "Copy Text": ["copy"],
    };

    sendQuotation(map[selectedSendOption], selectedSendOption);

    // optional UX
    setShowSendOptions(false);
    setSelectedSendOption(null);
  };

  const handleSaveDraftQuote = async () => {
    if (!quotationId) {
      toast.error("Quotation draft not ready yet");
      return;
    }

    try {
      setSavingDraftQuote(true);
      await persistQuotationDraft();
      toast.success("Draft saved successfully. Quote not sent yet.");
    } catch (error) {
      console.error("Failed to save quotation draft", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save draft",
      );
    } finally {
      setSavingDraftQuote(false);
    }
  };

  const tripDuration = useMemo(
    () => getTripDuration(order?.startDate, order?.endDate),
    [order?.startDate, order?.endDate],
  );
  const tripNights = tripDuration.nights;
  const itineraryStartDate = formatDateInput(order?.startDate);
  const itineraryEntries = useMemo(
    () =>
      reconcileDayWiseItineraryItems(
        dayWiseItinerary,
        tripDuration.days,
        itineraryStartDate,
      ),
    [dayWiseItinerary, itineraryStartDate, tripDuration.days],
  );

  const updateDayWiseItineraryEntry = (dayNumber, field, value) => {
    setDayWiseItinerary((prev) =>
      reconcileDayWiseItineraryItems(
        prev,
        tripDuration.days,
        itineraryStartDate,
      ).map((entry) =>
        entry.dayNumber === dayNumber ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  useEffect(() => {
    setDayWiseItinerary((prev) => {
      const nextEntries = reconcileDayWiseItineraryItems(
        prev,
        tripDuration.days,
        itineraryStartDate,
      );

      return areDayWiseItineraryItemsEqual(prev, nextEntries)
        ? prev
        : nextEntries;
    });
  }, [itineraryStartDate, tripDuration.days]);

  const queryRequirementTags = [
    order?.transportRequired ? "Transport Required" : null,
    order?.sightseeingRequired ? "Sightseeing Required" : null,
    order?.customerBudget
      ? `Budget ₹${Number(order.customerBudget).toLocaleString("en-IN")}`
      : null,
  ].filter(Boolean);

  const getRemainingHotelNights = (allServices, currentId) => {
    const usedByOtherHotels = allServices
      .filter(
        (service) =>
          service.type === "hotel" &&
          service.checked &&
          service.id !== currentId,
      )
      .reduce((sum, service) => sum + Number(service.nights || 0), 0);

    return Math.max(0, tripNights - usedByOtherHotels);
  };

  const getHotelNightStart = (allServices, currentId) => {
    let usedByPreviousHotels = 0;

    for (const service of allServices) {
      if (service.id === currentId) break;

      if (service.type === "hotel" && service.checked) {
        usedByPreviousHotels += Number(service.nights || 0);
      }
    }

    if (!tripNights) return 0;

    return Math.min(tripNights, usedByPreviousHotels + 1);
  };

  const getHotelDefaultStartDate = (allServices, currentId) => {
    if (!order?.startDate) return "";

    const usedByPreviousHotels = Math.max(
      0,
      getHotelNightStart(allServices, currentId) - 1,
    );

    return addDaysToDate(order.startDate, usedByPreviousHotels);
  };

  const getAvailableTransportDaysFromDate = (startDateValue) => {
    if (!startDateValue || !order?.endDate) return 1;

    const startDate = new Date(startDateValue);
    const tripEndDate = new Date(order.endDate);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(tripEndDate.getTime())
    ) {
      return 1;
    }

    const diff = tripEndDate - startDate;
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const adultPassengers = Number(order?.numberOfAdults || 0);
  const childPassengers = Number(order?.numberOfChildren || 0);
  const totalPassengers = adultPassengers + childPassengers;
  const costPerPassenger =
    totalPassengers > 0 ? totalAmount / totalPassengers : 0;

  const toggleService = (id, force = false) => {
    const targetService = services.find((service) => service.id === id);
    const normalizedTargetType = normalizeServiceFilterType(
      targetService?.type,
    );
    const nextChecked = !targetService?.checked;
    const servicePassengerCapacity = Number(
      targetService?.passengerCapacity || 0,
    );

    if (
      !force &&
      nextChecked &&
      (normalizedTargetType === "transfer" || normalizedTargetType === "car") &&
      servicePassengerCapacity > 0 &&
      totalPassengers > 0 &&
      (servicePassengerCapacity < totalPassengers ||
        (totalPassengers <= 4 && servicePassengerCapacity >= 6))
    ) {
      setTransportSelectionConfirm({
        open: true,
        serviceId: id,
        serviceTitle: targetService?.title || "Selected transport service",
        vehicleType: targetService?.vehicleType || "Vehicle",
        passengerCapacity: servicePassengerCapacity,
        luggageCapacity: Number(
          targetService?.luggageCapacity ||
            (servicePassengerCapacity >= 6 ? 4 : 2),
        ),
        passengerCount: totalPassengers,
      });
      return;
    }

    if (
      normalizedTargetType === "hotel" &&
      nextChecked &&
      totalPassengers > 0
    ) {
      const occupancy = getInferredHotelMaxOccupancy(
        targetService?.hotels?.[0]?.rooms?.[0] || {},
        targetService || {},
      );
      const maxAdultsPerRoom = Number(
        occupancy.maxAdults || targetService?.maxAdults || 2,
      );
      const currentRooms = Math.max(1, Number(targetService?.rooms || 1));
      const totalCap =
        currentRooms * (maxAdultsPerRoom + (targetService?.extraAdult ? 1 : 0));
      const neededRooms = Math.max(
        1,
        Math.ceil(totalPassengers / maxAdultsPerRoom),
      );

      if (totalPassengers > totalCap) {
        toast(
          `Room Suggestion: For ${totalPassengers} passengers, ${neededRooms} rooms are recommended based on ${targetService?.roomCategory || targetService?.roomType || "room"} capacity (${maxAdultsPerRoom} Pax/room). Currently ${currentRooms} room selected.`,
          {
            id: `hotel-pax-suggest-${id}`,
            duration: 5500,
            style: {
              border: "1px solid rgba(250, 204, 21, 0.4)",
              background: "#141414",
              color: "#fef08a",
            },
          },
        );
      }
    }

    if (
      normalizedTargetType === "hotel" &&
      nextChecked &&
      getRemainingHotelNights(services, id) === 0
    ) {
      toast.error("All trip nights are already assigned to other hotels.", {
        id: `hotel-night-limit-${id}`,
      });
      return;
    }

    setServices((prev) =>
      prev.map((service) => {
        if (service.id !== id) {
          return service;
        }

        const nextChecked = !service.checked;

        if (service.type !== "hotel") {
          return {
            ...service,
            checked: nextChecked,
            useStoredPricing: nextChecked ? service.useStoredPricing : false,
            serviceDate: nextChecked
              ? service.serviceDate || formatDateInput(order?.startDate)
              : service.serviceDate,
          };
        }

        if (!nextChecked) {
          return {
            ...service,
            checked: false,
            nights: "",
            useStoredPricing: false,
          };
        }

        return {
          ...service,
          checked: true,
          useStoredPricing: service.useStoredPricing,
          blackout: service.blackout,
          serviceDate:
            service.serviceDate || getHotelDefaultStartDate(prev, id),
          nights: "",
        };
      }),
    );
  };

  const updateField = (id, field, value) => {
    setServices((prev) =>
      prev.map((service) => {
        if (service.id !== id) {
          return service;
        }

        if (service.type === "hotel" && field === "nights") {
          const remainingHotelNights = getRemainingHotelNights(prev, id);
          const selectedNights = Number(value);

          if (!selectedNights) {
            return { ...service, nights: "", useStoredPricing: false };
          }

          const safeNights = Math.min(selectedNights, remainingHotelNights);

          return {
            ...service,
            nights: safeNights > 0 ? safeNights : "",
            useStoredPricing: false,
          };
        }

        if (service.type === "hotel" && field === "serviceDate") {
          return { ...service, serviceDate: value, useStoredPricing: false };
        }

        if (field === "rate") {
          const normalizedServiceType = normalizeServiceFilterType(
            service.type,
          );
          const nextRate = roundCurrencyAmount(value);
          return {
            ...service,
            rate: nextRate,
            quoteBaseRate:
              normalizedServiceType === "hotel"
                ? nextRate
                : service.quoteBaseRate,
            hotelRateMode:
              normalizedServiceType === "hotel"
                ? "unit-rate"
                : service.hotelRateMode,
            useStoredPricing: false,
            manualRateOverride: true,
            originalTotal: 0,
            totalInInr: 0,
            priceInInr: 0,
          };
        }

        if (service.type === "hotel" && field === "rooms") {
          const requestedRooms = Math.max(1, Number(value || 1));
          const maxAllowedRooms = Math.max(1, adultPassengers || 0);

          if (requestedRooms > maxAllowedRooms) {
            toast.error(
              `You can book rooms only according to the number of adults, not more than that.`,
              { id: `room-limit-${id}` },
            );
            return {
              ...service,
              rooms: maxAllowedRooms,
              useStoredPricing: false,
            };
          }

          return {
            ...service,
            rooms: requestedRooms,
            useStoredPricing: false,
          };
        }

        if (service.type === "hotel" && field === "hotelName") {
          const hotelsList = Array.isArray(service.hotels)
            ? service.hotels
            : [];
          const selectedHotel =
            hotelsList.find((h) => h.hotelName === value) || hotelsList[0];
          if (selectedHotel) {
            const roomsList = Array.isArray(selectedHotel.rooms)
              ? selectedHotel.rooms
              : [];
            const matchedRoom =
              roomsList.find((r) => r.roomType === service.roomType) ||
              roomsList.find((r) => r.roomCategory === service.roomCategory) ||
              roomsList[0] ||
              {};
            const nextHotelCategory =
              selectedHotel.hotelCategory || service.hotelCategory || "5 Star";
            const nextSupplierName =
              selectedHotel.supplierName || service.supplierName || "";
            const nextPrice =
              matchedRoom.price !== undefined
                ? Number(matchedRoom.price)
                : Number(service.price || 0);
            const occupancy = getInferredHotelMaxOccupancy(matchedRoom, {
              ...service,
              roomType:
                matchedRoom.roomType || service.roomType || "Standard Room",
              roomCategory:
                matchedRoom.roomCategory || service.roomCategory || "Double",
            });
            return {
              ...service,
              hotelName: selectedHotel.hotelName,
              hotelCategory: nextHotelCategory,
              starCategory: nextHotelCategory,
              supplierName: nextSupplierName,
              roomType:
                matchedRoom.roomType || service.roomType || "Standard Room",
              roomCategory:
                matchedRoom.roomCategory || service.roomCategory || "Double",
              bedType:
                normalizeBedTypeValue(matchedRoom.bedType) || service.bedType,
              extraBedType:
                matchedRoom.extraBedType || service.extraBedType || "None",
              maxAdults: occupancy.maxAdults,
              maxChildren: occupancy.maxChildren,
              childAgeLimit: occupancy.childAgeLimit,
              mealPlan: matchedRoom.mealPlan || service.mealPlan || "EP",
              desc:
                matchedRoom.description ||
                `${matchedRoom.roomType || ""} | ${matchedRoom.mealPlan || ""} | ${selectedHotel.hotelName}`,
              rate: nextPrice,
              price: nextPrice,
              quoteBaseRate: nextPrice,
              roomTypeOptionRate: nextPrice,
              awebRate: Number(matchedRoom.awebRate || 0),
              cwebRate: Number(matchedRoom.cwebRate || 0),
              cwoebRate: Number(matchedRoom.cwoebRate || 0),
              hotelRateMode: "unit-rate",
              useStoredPricing: false,
              manualRateOverride: true,
              originalTotal: 0,
              totalInInr: 0,
              priceInInr: 0,
            };
          }
        }

        if (
          service.type === "hotel" &&
          ["roomCategory", "roomType", "bedType", "extraBedType"].includes(
            field,
          )
        ) {
          const resolved = resolveHotelVariantSelection(
            prev,
            service,
            field,
            value,
          );
          if (totalPassengers > 0) {
            const occupancy = getInferredHotelMaxOccupancy(
              resolved.hotels?.[0]?.rooms?.[0] || {},
              resolved,
            );
            const maxAdultsPerRoom = Number(
              occupancy.maxAdults || resolved.maxAdults || 2,
            );
            const currentRooms = Math.max(1, Number(resolved.rooms || 1));
            const totalCap =
              currentRooms * (maxAdultsPerRoom + (resolved.extraAdult ? 1 : 0));
            const neededRooms = Math.max(
              1,
              Math.ceil(totalPassengers / maxAdultsPerRoom),
            );

            if (totalPassengers > totalCap) {
              toast(
                `Room Suggestion: For ${totalPassengers} passengers, ${neededRooms} rooms are recommended based on ${resolved.roomCategory || resolved.roomType || "room"} capacity (${maxAdultsPerRoom} Pax/room). Currently ${currentRooms} room selected.`,
                {
                  id: `hotel-pax-suggest-${id}`,
                  duration: 5000,
                  style: {
                    border: "1px solid rgba(250, 204, 21, 0.4)",
                    background: "#141414",
                    color: "#fef08a",
                  },
                },
              );
            }
          }
          return resolved;
        }

        if (
          (service.type === "sightseeing" || service.type === "activity") &&
          field === "tourType"
        ) {
          const tourList = Array.isArray(service.tourTypes)
            ? service.tourTypes
            : [];
          const matchedTour =
            tourList.find(
              (t) =>
                String(t.tourType || "")
                  .trim()
                  .toLowerCase() ===
                String(value || "")
                  .trim()
                  .toLowerCase(),
            ) || {};
          const nextAdultPrice = Number(
            matchedTour.adultPrice !== undefined
              ? matchedTour.adultPrice
              : matchedTour.price !== undefined
                ? matchedTour.price
                : service.price || service.rate || 0,
          );
          const nextChildPrice = Number(
            matchedTour.childPrice !== undefined ? matchedTour.childPrice : 0,
          );
          const nextTourType = matchedTour.tourType || value;
          const nextDesc =
            matchedTour.description ||
            service.desc ||
            service.description ||
            "";

          return {
            ...service,
            tourType: nextTourType,
            rate: nextAdultPrice,
            price: nextAdultPrice,
            adultPrice: nextAdultPrice,
            childPrice: nextChildPrice,
            quoteBaseRate: nextAdultPrice,
            desc: nextDesc,
            description: nextDesc,
            useStoredPricing: false,
            manualRateOverride: true,
            originalTotal: 0,
            totalInInr: 0,
            priceInInr: 0,
          };
        }

        if (
          (service.type === "sightseeing" || service.type === "activity") &&
          field === "serviceDate"
        ) {
          const smart = resolveActivitySmartRate(
            service,
            value,
            service.tourType,
          );
          return {
            ...service,
            serviceDate: value,
            rate: service.manualRateOverride ? service.rate : smart.adultPrice,
            price: service.manualRateOverride
              ? service.price
              : smart.adultPrice,
            adultPrice: service.manualRateOverride
              ? service.adultPrice
              : smart.adultPrice,
            childPrice: service.manualRateOverride
              ? service.childPrice
              : smart.childPrice,
            pricingTier: smart.tier,
            blackout: smart.isBlackout
              ? { isBlackout: true, label: smart.blackoutLabel }
              : { isBlackout: false },
            useStoredPricing: false,
          };
        }

        if (
          (service.type === "transfer" || service.type === "car") &&
          field === "vehicleType"
        ) {
          const resolved = resolveTransportVehicleSelection(
            prev,
            service,
            value,
          );
          const resolvedCap = Number(resolved.passengerCapacity || 0);
          const resolvedLug = Number(
            resolved.luggageCapacity || (resolvedCap >= 6 ? 4 : 2),
          );

          if (
            totalPassengers > 0 &&
            resolvedCap > 0 &&
            resolvedCap < totalPassengers
          ) {
            toast.error(
              `Capacity Warning: ${resolved.vehicleType || "Selected vehicle"} fits only ${resolvedCap} pax (luggage: ${resolvedLug} bags), but this query has ${totalPassengers} passengers.`,
              { id: `vehicle-pax-warning-${id}`, duration: 5000 },
            );
          } else if (
            totalPassengers > 0 &&
            totalPassengers <= 4 &&
            resolvedCap >= 6
          ) {
            toast(
              `Vehicle Suggestion: For ${totalPassengers} pax, a Sedan (3-4 Pax, 2-3 Bags) is more economical. Selected ${resolved.vehicleType} has ${resolvedCap} pax & ${resolvedLug} bags capacity.`,
              {
                id: `vehicle-pax-suggestion-${id}`,
                duration: 5500,
                style: {
                  border: "1px solid rgba(250, 204, 21, 0.4)",
                  background: "#141414",
                  color: "#fef08a",
                },
              },
            );
          }
          return resolved;
        }

        if (
          (service.type === "transfer" || service.type === "car") &&
          field === "transportUsageOptionKey"
        ) {
          return applyTransportUsageOptionPricing(
            service,
            value,
            service.rate,
            service.currency,
          );
        }

        if (
          (service.type === "transfer" || service.type === "car") &&
          field === "transportUsageLimitOptionKey"
        ) {
          const availableLimitKeys = getTransportUsageLimitOptionsForKeys(
            getSelectedTransportUsageOptionKeys(service),
          ).map((option) => option.value);
          const currentValue =
            String(service.transportUsageLimitOptionKey || "")
              .split(",")
              .map((key) => key.trim())
              .find((key) => availableLimitKeys.includes(key)) || "";
          const nextValue =
            currentValue === value
              ? ""
              : availableLimitKeys.includes(value)
                ? value
                : "";
          return {
            ...service,
            transportUsageLimitOptionKey: nextValue,
            useStoredPricing: false,
          };
        }

        if (
          (service.type === "transfer" || service.type === "car") &&
          field === "usageType"
        ) {
          return applyFixedTransportUsagePricing(
            {
              ...service,
              usageType: normalizeTransportUsageValue(value),
              useStoredPricing: false,
            },
            service.rate,
            service.currency,
          );
        }

        if (
          (service.type === "transfer" || service.type === "car") &&
          field === "days"
        ) {
          const availableTransportDays = getAvailableTransportDaysFromDate(
            service.serviceDate || formatDateInput(order?.startDate),
          );
          const safeDays = Math.min(
            Math.max(Number(value || 1), 1),
            availableTransportDays,
          );
          return { ...service, days: safeDays, useStoredPricing: false };
        }

        if (service.type === "hotel" && field === "serviceDate") {
          const smart = resolveHotelSmartRate(service, value);
          return {
            ...service,
            serviceDate: value,
            rate: service.manualRateOverride ? service.rate : smart.rate,
            price: service.manualRateOverride ? service.price : smart.rate,
            quoteBaseRate: service.manualRateOverride
              ? service.quoteBaseRate
              : smart.rate,
            roomTypeOptionRate: service.manualRateOverride
              ? service.roomTypeOptionRate
              : smart.rate,
            pricingTier: smart.tier,
            blackout: smart.isBlackout
              ? { isBlackout: true, label: smart.blackoutLabel }
              : { isBlackout: false },
            useStoredPricing: false,
          };
        }

        if (
          (service.type === "transfer" || service.type === "car") &&
          field === "serviceDate"
        ) {
          const availableTransportDays =
            getAvailableTransportDaysFromDate(value);
          const safeDays = Math.min(
            Math.max(Number(service.days || 1), 1),
            availableTransportDays,
          );
          const smart = resolveTransportSmartRate(service, value);
          const selectedVehicle =
            (service.vehicles || []).find(
              (v) =>
                normalizeComparisonTextValue(v.vehicleType) ===
                normalizeComparisonTextValue(service.vehicleType),
            ) || {};
          const usagePrices = getTransportVehicleUsagePrices(
            selectedVehicle,
            service,
            value,
          );
          return {
            ...service,
            serviceDate: value,
            days: safeDays,
            rate: service.manualRateOverride ? service.rate : smart.rate,
            price: service.manualRateOverride ? service.price : smart.rate,
            quoteBaseRate: service.manualRateOverride
              ? service.quoteBaseRate
              : smart.rate,
            pricingTier: smart.tier,
            transportUsagePrices: usagePrices,
            blackout: smart.isBlackout
              ? { isBlackout: true, label: smart.blackoutLabel }
              : { isBlackout: false },
            useStoredPricing: false,
          };
        }

        return { ...service, [field]: value, useStoredPricing: false };
      }),
    );
  };

  const focusServiceEditor = (service) => {
    if (!service?.id) return;

    setContractedRatesSearch("");
    setContractedRatesFilter(normalizeServiceFilterType(service.type) || "all");
    setFocusedServiceCardId(service.id);
    setEditingServiceCardId(service.id);

    window.setTimeout(() => {
      const target = document.getElementById(getServiceCardDomId(service.id));
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
  };

  const closeSelectedServicesModal = () => {
    setIsSelectedServicesModalOpen(false);
    setSelectedServicesModalTargetId("");
    setSelectedServicesModalScope("all");
  };

  const openSelectedServicesModal = (serviceId = "", scope = "all") => {
    setActiveWorkspaceModal("");
    setSelectedServicesModalTargetId(serviceId || "");
    setSelectedServicesModalScope(scope);
    setIsSelectedServicesModalOpen(true);
  };

  const openWorkspaceModal = (workspace) => {
    closeSelectedServicesModal();
    setActiveWorkspaceModal(workspace);
  };

  const closeWorkspaceModal = () => {
    setActiveWorkspaceModal("");
  };

  const openSelectedServicesModalForService = (service) => {
    if (!service?.id || !service.checked) return;

    setFocusedServiceCardId(service.id);
    openSelectedServicesModal(service.id, "single");
  };

  const handleSelectedServiceEditAction = async (service) => {
    if (!service?.id) return;

    if (editingServiceCardId !== service.id) {
      closeSelectedServicesModal();
      focusServiceEditor(service);
      return;
    }

    const savingToast = toast.loading("Saving edited service...");

    try {
      await persistQuotationDraft();
      toast.dismiss(savingToast);
      toast.success("Edited service saved");
      showQuickActionFeedback(
        "success",
        "Edit Saved",
        `${service.title} changes have been saved successfully.`,
      );
      setEditingServiceCardId("");
      closeSelectedServicesModal();
    } catch (error) {
      toast.dismiss(savingToast);
      console.error("Failed to save edited service", error);
      toast.error(
        error?.response?.data?.message || "Failed to save edited service",
      );
    }
  };

  const handleSelectedServiceDelete = async (service) => {
    if (!service?.id) return;

    if (editingServiceCardId === service.id) {
      setEditingServiceCardId("");
    }

    if (service.custom) {
      await deleteService(service.id);
      return;
    }

    toggleService(service.id);
  };

  const applyPackageToServices = (pkg) => {
    setSelectedPackageTemplate(pkg);

    if (!pkg) {
      return;
    }

    setServices((prev) => buildPackageMatchedServices(prev, pkg));

    if (
      Array.isArray(pkg.dayWiseItinerary) &&
      pkg.dayWiseItinerary.length > 0
    ) {
      setDayWiseItinerary(pkg.dayWiseItinerary);
    }
  };

  const renderSelectedServicesList = (servicesToRender = selectedServices) =>
    servicesToRender.length > 0 ? (
      <div
        className={`dark-scrollbar space-y-3 overflow-y-auto pr-1 ${
          selectedServicesModalScope === "single" ? "mx-auto max-w-2xl" : ""
        }`}
      >
        {servicesToRender.map((service) => {
          const serviceEdits = getSelectedServiceQuotationEdits(service);
          const selectedTransportUsageLabels =
            normalizeServiceFilterType(service.type) === "transfer"
              ? getSelectedTransportUsageOptionLabels(service)
              : [];
          const selectedTransportUsageLimitLabels =
            normalizeServiceFilterType(service.type) === "transfer"
              ? getSelectedTransportUsageLimitLabels(
                  service,
                  getTransportUsageLimitOptionsForKeys(
                    getSelectedTransportUsageOptionKeys(service),
                  ),
                )
              : [];
          const serviceIncludedItems = getSelectedServiceIncludedItems(service);
          const isSingleServiceModalView =
            selectedServicesModalScope === "single" &&
            servicesToRender.length === 1;

          const Chip = ({
            icon,
            label,
            value,
            accent = "text-slate-300",
            iconColor = "text-slate-500",
          }) => (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#212f45] bg-[#0a1018] px-2.5 py-[5px]">
              {icon && (
                <span
                  className={`flex-shrink-0 ${iconColor}`}
                  style={{ lineHeight: 0 }}
                >
                  {icon}
                </span>
              )}
              {label && (
                <span className="flex-shrink-0 text-[10px] font-medium text-slate-500">
                  {label}:
                </span>
              )}
              <span
                className={`max-w-[120px] truncate text-[10px] font-semibold leading-none ${accent}`}
              >
                {value}
              </span>
            </div>
          );

          const typeAccent =
            service.type === "hotel"
              ? {
                  bg: "bg-indigo-500/10",
                  border: "border-indigo-500/20",
                  text: "text-indigo-200",
                }
              : service.type === "activity"
                ? {
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20",
                    text: "text-emerald-200",
                  }
                : service.type === "transfer" || service.type === "car"
                  ? {
                      bg: "bg-violet-500/10",
                      border: "border-violet-500/20",
                      text: "text-violet-200",
                    }
                  : {
                      bg: "bg-blue-500/10",
                      border: "border-blue-500/20",
                      text: "text-blue-200",
                    };
          const isTargetedService =
            selectedServicesModalTargetId === service.id;

          return (
            <div
              key={`selected-${service.id}`}
              id={getSelectedServiceSummaryDomId(service.id)}
              className={`rounded-[24px]
          border bg-[#050505] p-3 transition-all duration-200 ${
            isTargetedService
              ? "border-sky-400/60 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]"
              : "border-[#22314a]"
          }
          ${isSingleServiceModalView ? "mx-auto w-full max-w-2xl" : ""}`}
            >
              <div className="rounded-[18px] border border-[#162233] bg-[#08111c] px-3 py-3">
                <div
                  className={`flex items-start gap-2.5 ${isSingleServiceModalView ? "flex-col" : ""}`}
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#27436d] bg-[#0b1627]">
                    {renderSelectedServiceSummaryIcon(service)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13px] font-semibold leading-tight text-white">
                        {service.title}
                      </p>
                      {isTargetedService && (
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sky-300">
                          Active
                        </span>
                      )}
                    </div>
                    {(service.city || service.country) && (
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {[service.city, service.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>

                  <div
                    className={`${
                      isSingleServiceModalView
                        ? "w-full pl-[46px] text-left"
                        : "flex-shrink-0 pl-1 text-right"
                    }`}
                  >
                    <p className="whitespace-nowrap text-[12px] font-semibold leading-tight text-yellow-300">
                      {formatCurrencyValue(
                        service.originalTotal || 0,
                        service.currency,
                      )}
                    </p>
                    {service.isForeignCurrency && (
                      <p className="mt-0.5 whitespace-nowrap text-[10px] text-sky-300">
                        ₹ {formatAmountValue(service.totalInInr || 0)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <div
                    className={`inline-flex items-center rounded-lg border px-2.5 py-[5px] ${typeAccent.bg}
                ${typeAccent.border}`}
                  >
                    <span
                      className={`text-[10px] font-semibold leading-none ${typeAccent.text}`}
                    >
                      {getServiceTypeLabel(service.type)}
                    </span>
                  </div>

                  {service.serviceDate && (
                    <Chip
                      icon={
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      }
                      value={formatServiceDateLabel(service.serviceDate)}
                    />
                  )}

                  {service.type === "hotel" &&
                    Number(service.nights || 0) > 0 && (
                      <Chip
                        icon={
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2 4v16" />
                            <path d="M2 8h18a2 2 0 0 1 2 2v10" />
                            <path d="M2 17h20" />
                            <path d="M6 8v9" />
                          </svg>
                        }
                        value={`${service.nights} night${Number(service.nights) > 1 ? "s" : ""}`}
                        accent="text-sky-200"
                      />
                    )}

                  {service.type === "hotel" &&
                    Number(service.rooms || 0) > 0 && (
                      <Chip
                        icon={
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                        }
                        value={`${service.rooms} room${Number(service.rooms) > 1 ? "s" : ""}`}
                      />
                    )}

                  {service.type === "hotel" && service.bedType && (
                    <Chip
                      icon={
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5" />
                          <path d="M2 20v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4" />
                          <path d="M2 14h20" />
                          <path d="M7 14v2" />
                          <path d="M17 14v2" />
                        </svg>
                      }
                      value={getBedTypeOptionLabel(service.bedType)}
                      accent="text-amber-200"
                      iconColor="text-amber-400"
                    />
                  )}

                  {selectedTransportUsageLabels.map((label) => (
                    <Chip
                      key={`${service.id}-usage-${label}`}
                      icon={
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 17h4V5H2v12h3" />
                          <path d="M20 17h2v-5l-3-4h-5v9h1" />
                          <circle cx="7.5" cy="17.5" r="2.5" />
                          <circle cx="17.5" cy="17.5" r="2.5" />
                        </svg>
                      }
                      value={label}
                      accent="text-violet-200"
                      iconColor="text-violet-400"
                    />
                  ))}

                  {selectedTransportUsageLimitLabels.map((label) => (
                    <Chip
                      key={`${service.id}-limit-${label}`}
                      icon={
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 19.5V4.5" />
                          <path d="M8 19.5V4.5" />
                          <path d="M12 19.5V4.5" />
                          <path d="M16 19.5V4.5" />
                          <path d="M20 19.5V4.5" />
                        </svg>
                      }
                      value={label}
                      accent="text-amber-200"
                      iconColor="text-amber-400"
                    />
                  ))}

                  {(service.type === "transfer" || service.type === "car") &&
                    Number(service.days || 0) > 0 && (
                      <Chip
                        icon={
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        }
                        value={`${service.days} day${Number(service.days) > 1 ? "s" : ""}`}
                        accent="text-violet-200"
                        iconColor="text-violet-400"
                      />
                    )}

                  {(service.pickupTime || service.time) && (
                    <Chip
                      icon={<Clock size={10} />}
                      value={`Pickup: ${service.pickupTime || service.time}`}
                      accent="text-yellow-200"
                      iconColor="text-yellow-400"
                    />
                  )}

                  {service.type === "activity" && (
                    <>
                      {service.tourType && (
                        <Chip
                          icon={
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polygon points="12 8 8 12 12 16 16 12 12 8" />
                            </svg>
                          }
                          value={service.tourType}
                          accent="text-emerald-200"
                          iconColor="text-emerald-400"
                        />
                      )}
                      {service.pricingBasis && (
                        <Chip
                          icon={
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                          }
                          value={service.pricingBasis}
                          accent="text-emerald-200"
                          iconColor="text-emerald-400"
                        />
                      )}
                      {Number(service.pax || 0) > 0 && (
                        <Chip
                          icon={
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          }
                          value={`${service.pax} pax`}
                          accent="text-emerald-200"
                          iconColor="text-emerald-400"
                        />
                      )}
                      {service.maxPax && (
                        <Chip
                          icon={
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          }
                          value={
                            service.maxPax.includes("Max")
                              ? service.maxPax
                              : `Max: ${service.maxPax}`
                          }
                          accent="text-purple-200"
                          iconColor="text-purple-400"
                        />
                      )}
                    </>
                  )}

                  {service.type === "sightseeing" && (
                    <>
                      {service.tourType && (
                        <Chip
                          icon={
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polygon points="12 8 8 12 12 16 16 12 12 8" />
                            </svg>
                          }
                          value={service.tourType}
                          accent="text-sky-200"
                          iconColor="text-sky-400"
                        />
                      )}
                      {service.pricingBasis && (
                        <Chip
                          icon={
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                          }
                          value={service.pricingBasis}
                          accent="text-emerald-200"
                          iconColor="text-emerald-400"
                        />
                      )}
                      {Number(service.pax || 0) > 0 && (
                        <Chip
                          icon={
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                            </svg>
                          }
                          value={`${service.pax} pax`}
                          accent="text-blue-200"
                          iconColor="text-blue-400"
                        />
                      )}
                      {service.maxPax && (
                        <Chip
                          icon={
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          }
                          value={
                            service.maxPax.includes("Max")
                              ? service.maxPax
                              : `Max: ${service.maxPax}`
                          }
                          accent="text-purple-200"
                          iconColor="text-purple-400"
                        />
                      )}
                    </>
                  )}
                </div>

                {serviceIncludedItems.length > 0 && (
                  <div className="mt-3 rounded-[14px] border border-emerald-500/18 bg-[#07150f] px-3 py-2.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                        Included In Service
                      </p>
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[7px] font-semibold text-emerald-200">
                        {serviceIncludedItems.length} item
                        {serviceIncludedItems.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {serviceIncludedItems.map((item, itemIndex) => (
                        <span
                          key={`${service.id}-include-${itemIndex}`}
                          className="inline-flex items-center rounded-[8px] border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-[5px] text-[10px] font-medium leading-none text-emerald-100"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {serviceEdits.length > 0 && (
                  <div className="mt-3 rounded-[14px] border border-sky-500/20 bg-[#071420] px-3 py-2.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
                        Quotation Edits
                      </p>
                      <span className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[7px] font-semibold text-sky-200">
                        {serviceEdits.length} update
                        {serviceEdits.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {serviceEdits.map((edit) => {
                        const toneClasses =
                          edit.variant === "success"
                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                            : edit.variant === "warning"
                              ? "border-yellow-500/25 bg-yellow-500/10 text-yellow-100"
                              : edit.variant === "danger"
                                ? "border-red-500/25 bg-red-500/10 text-red-200"
                                : "border-sky-500/20 bg-sky-500/10 text-sky-100";
                        const iconClasses =
                          edit.variant === "success"
                            ? "text-emerald-300"
                            : edit.variant === "warning"
                              ? "text-yellow-300"
                              : edit.variant === "danger"
                                ? "text-red-300"
                                : "text-sky-300";

                        return (
                          <span
                            key={`${service.id}-${edit.key}-${edit.label}`}
                            className={`inline-flex items-center gap-1
                  rounded-[8px] border px-2.5 py-[5px] text-[10px] font-medium leading-none ${toneClasses}`}
                          >
                            <CheckCircle2
                              size={11}
                              className={`shrink-0 ${iconClasses}`}
                            />
                            <span className="font-semibold">{edit.label}</span>
                            <span className="opacity-40">:</span>
                            <span>{edit.value}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-3 px-0.5">
                <p className="text-[10px] font-medium text-slate-400">
                  Quick Actions
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectedServiceEditAction(service)}
                    className="cursor-pointer rounded-xl border border-sky-400/35 bg-sky-500/10 px-3.5 py-1.5 text-[11px]
                font-medium text-sky-200 transition hover:border-sky-300/50 hover:bg-sky-500/15"
                  >
                    {editingServiceCardId === service.id ? "Save" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectedServiceDelete(service)}
                    className="cursor-pointer rounded-xl border border-red-400/25 bg-red-500/10 px-3.5 py-1.5 text-[11px]
                font-medium text-red-200 transition hover:border-red-300/50 hover:bg-red-500/15"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="rounded-2xl border border-dashed border-[#28303d] bg-[#090909] px-4 py-8 text-center">
        <p className="text-sm font-medium text-white">
          No services selected yet
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Pick services from the section above and they will appear here
          automatically.
        </p>
      </div>
    );

  const renderSelectedServicesModal = () => {
    if (typeof document === "undefined") {
      return null;
    }

    return createPortal(
      <AnimatePresence>
        {isSelectedServicesModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[120] flex h-screen w-screen items-center justify-center bg-slate-900/60 px-3 py-4 backdrop-blur-sm"
            onClick={closeSelectedServicesModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className={`flex
            w-full flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white
            shadow-2xl ${
              selectedServicesModalScope === "single"
                ? "max-h-[90vh] max-w-3xl"
                : "h-[min(90vh,960px)] max-w-5xl"
            }`}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Selected services"
            >
              <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-slate-50 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selectedServicesModalScope === "single"
                      ? "Service Editor"
                      : "Selected Services"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedServicesModalScope === "single"
                      ? "This focused view shows only the service you chose to edit."
                      : "All checked services are listed here for quick edit or delete."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    {visibleSelectedServices.length}{" "}
                    {selectedServicesModalScope === "single"
                      ? "service"
                      : "selected"}
                  </div>
                  <button
                    type="button"
                    onClick={closeSelectedServicesModal}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-500 transition hover:border-gray-300 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                    aria-label="Close selected services modal"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div
                className={`dark-scrollbar overflow-y-auto px-5 py-5 ${
                  selectedServicesModalScope === "single"
                    ? "max-h-[calc(90vh-140px)]"
                    : "flex-1"
                }`}
              >
                {renderSelectedServicesList(visibleSelectedServices)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    );
  };

  const renderItineraryWorkspaceContent = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 bg-amber-100 text-amber-800">
            <CalendarDays size={15} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Auto Synced With Duration
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Duration: {tripDuration.label || "Trip dates pending"}
              {order?.startDate
                ? ` • Starts
                ${formatShareDate(order.startDate)}`
                : ""}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
          {itineraryEntries.length} Day
          {itineraryEntries.length === 1 ? "" : "s"}
        </span>
      </div>

      {itineraryEntries.length ? (
        itineraryEntries.map((entry) => {
          const dayLabel =
            entry.dayLabel ||
            buildItineraryDayLabel(entry.dayNumber, entry.date);
          const fullHeading = entry.title
            ? `${dayLabel}: ${entry.title}`
            : dayLabel;

          return (
            <div
              key={`itinerary-day-${entry.dayNumber}`}
              className="rounded-2xl border border-gray-200 bg-slate-50 p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-100 text-orange-700">
                    <MdOutlineTravelExplore size={15} />
                  </span>
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {fullHeading}
                  </p>
                </div>
                <span className="rounded-full border border-orange-200 bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-800">
                  Day {entry.dayNumber}
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={entry.title}
                  onChange={(e) =>
                    updateDayWiseItineraryEntry(
                      entry.dayNumber,
                      "title",
                      e.target.value,
                    )
                  }
                  placeholder="Enter heading e.g. North Phu Quoc Airport to Phu Quoc Hotel - pvt"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none
            transition focus:border-[#3E63DD] focus:ring-1 focus:ring-[#3E63DD]"
                />
                <textarea
                  value={entry.description}
                  onChange={(e) =>
                    updateDayWiseItineraryEntry(
                      entry.dayNumber,
                      "description",
                      e.target.value,
                    )
                  }
                  rows={4}
                  placeholder="Add description, timings, activities, transfers, meals, or special notes for this day..."
                  className="min-h-[120px] w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3E63DD] focus:ring-1 focus:ring-[#3E63DD]"
                />
              </div>
            </div>
          );
        })
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
          Trip duration is not available yet, so itinerary days cannot be
          generated.
        </p>
      )}
    </div>
  );

  const renderNotesWorkspaceContent = () => (
    <div className="space-y-4">
      {[
        {
          key: "inclusion",
          title: "Inclusions",
          placeholder: "Add included item and press Add",
          items: inclusions,
          accent:
            "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold",
        },
        {
          key: "exclusion",
          title: "Exclusions",
          placeholder: "Add excluded item and press Add",
          items: exclusions,
          accent: "border-rose-300 bg-rose-50 text-rose-800 font-semibold",
        },
        {
          key: "additionalNote",
          title: "Important Notes",
          placeholder: "Add special terms or extra information and press Add",
          items: additionalNotes,
          accent: "border-sky-300 bg-sky-50 text-sky-800 font-semibold",
        },
      ].map((section) => (
        <div
          key={section.key}
          className="rounded-2xl border border-gray-200 bg-slate-50 p-3"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  section.key === "inclusion"
                    ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                    : section.key === "exclusion"
                      ? "border-rose-300 bg-rose-100 text-rose-700"
                      : "border-sky-300 bg-sky-100 text-sky-700"
                }`}
              >
                {section.key === "inclusion" ? (
                  <CheckCircle2 size={15} />
                ) : section.key === "exclusion" ? (
                  <X size={15} />
                ) : (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 3h6" />
                    <path d="M10 12h4" />
                    <path d="M10 16h4" />
                    <path d="M9 8h6" />
                    <path d="M5 3h1a2 2 0 0 1 2 2v16l-3-2-3 2V5a2 2 0 0 1 2-2Z" />
                    <path d="M14 3h5a2 2 0 0 1 2 2v16l-3-2-3 2V5a2 2 0 0 0-2-2Z" />
                  </svg>
                )}
              </span>
              <p className="text-sm font-semibold text-slate-900">
                {section.title}
              </p>
            </div>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] ${section.accent}`}
            >
              {section.items.length} item{section.items.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <input
              type="text"
              value={dynamicNoteInputs[section.key]}
              onChange={(e) =>
                updateDynamicNoteInput(section.key, e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  appendDynamicNoteItem(section.key);
                }
              }}
              placeholder={section.placeholder}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#3E63DD] focus:ring-1 focus:ring-[#3E63DD]"
            />
            <button
              type="button"
              onClick={() => appendDynamicNoteItem(section.key)}
              className="rounded-xl border border-amber-400 bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 cursor-pointer shadow-xs"
            >
              Add
            </button>
          </div>

          {section.items.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {section.items.map((item, index) => (
                <div
                  key={`${section.key}-${index}-${item}`}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeDynamicNoteItem(section.key, index)}
                    className="text-slate-400 transition hover:text-red-500 cursor-pointer"
                    aria-label={`Remove ${section.title} item`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              No {section.title.toLowerCase()} added yet.
            </p>
          )}
        </div>
      ))}
    </div>
  );

  const renderWorkspaceModal = () => {
    if (typeof document === "undefined") {
      return null;
    }

    const modalConfig =
      activeWorkspaceModal === "itinerary"
        ? {
            title: "Day Wise Itinerary",
            description:
              "Add a heading and description for each day in a dedicated itinerary workspace.",
            badge: `${itineraryEntries.length} Day${itineraryEntries.length === 1 ? "" : "s"}`,
            ariaLabel: "Day wise itinerary workspace",
            content: renderItineraryWorkspaceContent(),
          }
        : {
            title: "Additional Notes",
            description:
              "Manage inclusions, exclusions, and important notes that appear across quotation views.",
            badge: `${inclusions.length + exclusions.length + additionalNotes.length} Items`,
            ariaLabel: "Additional notes workspace",
            content: renderNotesWorkspaceContent(),
          };

    return createPortal(
      <AnimatePresence>
        {activeWorkspaceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[120] flex h-screen w-screen items-center justify-center bg-slate-900/60 px-3 py-4 backdrop-blur-sm"
            onClick={closeWorkspaceModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="flex h-[min(90vh,960px)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={modalConfig.ariaLabel}
            >
              <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-slate-50 px-5 py-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                        activeWorkspaceModal === "itinerary"
                          ? "border-orange-200 bg-orange-100 text-orange-700"
                          : "border-sky-200 bg-sky-100 text-sky-700"
                      }`}
                    >
                      {activeWorkspaceModal === "itinerary" ? (
                        <CalendarDays size={18} />
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 3h6" />
                          <path d="M10 12h4" />
                          <path d="M10 16h4" />
                          <path d="M9 8h6" />
                          <path d="M5 3h1a2 2 0 0 1 2 2v16l-3-2-3 2V5a2 2 0 0 1 2-2Z" />
                          <path d="M14 3h5a2 2 0 0 1 2 2v16l-3-2-3 2V5a2 2 0 0 0-2-2Z" />
                        </svg>
                      )}
                    </span>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {modalConfig.title}
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {modalConfig.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    {modalConfig.badge}
                  </div>
                  <button
                    type="button"
                    onClick={closeWorkspaceModal}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-500 transition hover:border-gray-300 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                    aria-label={`Close ${modalConfig.title} modal`}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="dark-scrollbar flex-1 overflow-y-auto px-5 py-5">
                {modalConfig.content}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    );
  };

  const renderSelectedServicesSection = (variants = sectionRevealVariants) => (
    <>
      <motion.div
        variants={variants}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[13px] font-semibold text-slate-900">
              Selected Services
            </h2>
            <p className="mt-1 whitespace-nowrap text-[11px] leading-relaxed text-slate-500">
              Review, edit, and manage all selected services inside a focused
              modal workspace.
            </p>
          </div>
          <div className="flex min-w-[88px] items-center justify-center gap-1 rounded-[28px] border border-blue-200 bg-blue-50 px-2 py-1.5 text-center text-blue-700 shadow-2xs">
            <span className="text-[11px] font-bold leading-none">
              {selectedServices.length}
            </span>
            <span className="text-[11px] font-bold leading-none">selected</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Service Desk
              </p>
              <p className="mt-1 text-xs text-slate-700">
                Open the modal to work with the currently selected quotation
                services.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                openSelectedServicesModal(editingServiceCardId || "", "all")
              }
              className="cursor-pointer rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100 shadow-2xs"
            >
              Open All Selected Services
            </button>
          </div>
        </div>
      </motion.div>
      {renderSelectedServicesModal()}
    </>
  );

  const renderQuotationWorkspaceButtons = (
    variants = sectionRevealVariants,
  ) => {
    const totalNoteItems =
      inclusions.length + exclusions.length + additionalNotes.length;

    return (
      <div className="space-y-3">
        <motion.button
          variants={variants}
          type="button"
          onClick={() => openWorkspaceModal("itinerary")}
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-amber-500 px-4 py-2.5 text-md font-semibold text-white transition hover:bg-amber-600 shadow-xs"
        >
          <CalendarDays size={18} />
          <span>Day Wise Itinerary</span>
          <span className="rounded-full border border-white/20 bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
            {itineraryEntries.length}D
          </span>
        </motion.button>

        <motion.button
          variants={variants}
          type="button"
          onClick={() => openWorkspaceModal("notes")}
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-md font-semibold text-slate-700 transition hover:bg-gray-50 shadow-xs"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3h8" />
            <path d="M8 7h8" />
            <path d="M8 11h5" />
            <path d="M6 3h1a2 2 0 0 1 2 2v16l-3-2-3 2V5a2 2 0 0 1 2-2Z" />
            <path d="M14 3h4a2 2 0 0 1 2 2v16l-3-2-3 2V5a2 2 0 0 0-2-2Z" />
          </svg>
          <span>Additional Notes</span>
          <span className="rounded-full border border-gray-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {totalNoteItems}
          </span>
        </motion.button>
      </div>
    );
  };

  if (!hasOrderContext) {
    return (
      <motion.section
        initial="hidden"
        animate="visible"
        variants={pageShellVariants}
        className="-m-3 min-h-[calc(100vh-24px)] overflow-x-hidden bg-slate-50 p-3 text-slate-900 font-sans sm:-m-4 sm:min-h-[calc(100vh-32px)] sm:p-4 lg:-m-5 lg:min-h-[calc(100vh-40px)] lg:p-5"
      >
        <motion.div
          variants={sectionRevealVariants}
          className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center"
        >
          <div className="w-full rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-600">
              Quotation Builder
            </p>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              Query details are missing
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This page needs query data from Order Acceptance. Open the
              quotation builder from the previous screen so we can load the
              right quotation context.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/ops/order-acceptance")}
                className="rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 shadow-xs cursor-pointer"
              >
                Go to Order Acceptance
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-gray-50 cursor-pointer shadow-xs"
              >
                Go Back
              </button>
            </div>
          </div>
        </motion.div>
      </motion.section>
    );
  }

  return (
    <>
      <motion.section
        initial="hidden"
        animate="visible"
        variants={pageShellVariants}
        className="-m-3 min-h-[calc(100vh-24px)] overflow-x-hidden bg-slate-50 p-3 text-slate-900 font-sans sm:-m-4 sm:min-h-[calc(100vh-32px)] sm:p-4 lg:-m-5 lg:min-h-[calc(100vh-40px)] lg:p-5"
      >
        {/* Header */}
        <QuotationBuilderHeader
          additionalNotes={additionalNotes}          editingSourceQuotationSnapshotRef={editingSourceQuotationSnapshotRef}
          editingTargetQuotationId={editingTargetQuotationId}
          exclusions={exclusions}
          formatCurrencyValue={formatCurrencyValue}
          inclusions={inclusions}
          isEditingHistoricalQuotation={isEditingHistoricalQuotation}
          isQuotationHistoryOpen={isQuotationHistoryOpen}          navigate={navigate}
          orderQueryId={orderQueryId}          quotationHistory={quotationHistory}
          quotationHistoryLoadError={quotationHistoryLoadError}
          quotationHistoryLoading={quotationHistoryLoading}
          resetBuilderWorkspace={resetBuilderWorkspace}
          selectedHistoryQuotation={selectedHistoryQuotation}
          selectedHistoryQuotationId={selectedHistoryQuotationId}
          services={services}
          setActiveDraftSourceQuotationId={setActiveDraftSourceQuotationId}
          setDraftHydrated={setDraftHydrated}
          setDraftSourceReloadRequest={setDraftSourceReloadRequest}
          setEditingSourceQuotationSnapshot={setEditingSourceQuotationSnapshot}
          setEditingTargetQuotationId={setEditingTargetQuotationId}
          setIsFreshDraftMode={setIsFreshDraftMode}
          setIsQuotationHistoryOpen={setIsQuotationHistoryOpen}
          setSelectedHistoryQuotationId={setSelectedHistoryQuotationId}        />

        {/* Title */}
        <motion.div
          variants={sectionRevealVariants}
          className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Quotation Builder
            </h1>
            <p className="text-gray-500 text-sm">
              Create a quote from contracted rates
            </p>
            {order?.opsStatus === "Revision_Query" && (
              <p className="mt-2 inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                Revision builder now starts with a fresh draft
              </p>
            )}
          </div>
        </motion.div>
        {showLatestSentQuotationCard && latestSentQuotation && (
          <motion.div
            variants={sectionRevealVariants}
            className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-xs text-slate-900"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-800">
                  Latest Quotation Sent To Agent
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-slate-900">
                    {latestSentQuotation.quotationNumber || "Quotation"}
                  </span>
                  <span className="rounded-full border border-sky-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-800">
                    {latestSentQuotation.status || "Quote Sent"}
                  </span>
                  {latestSentQuotation.createdBy?.label && (
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                      Sent by {latestSentQuotation.createdBy.label}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  This query already has a quotation shared with the agent.
                  {latestSentQuotation.updatedAtLabel
                    ? ` Last updated ${latestSentQuotation.updatedAtLabel}.`
                    : ""}
                </p>
              </div>
              <div className="grid min-w-[220px] grid-cols-2 gap-2">
                <div className="rounded-xl border border-sky-200 bg-white px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Total
                  </p>
                  <p className="mt-1 text-sm font-semibold text-sky-800">
                    {formatCurrencyValue(
                      latestSentQuotation.displayAmount || 0,
                      latestSentQuotation.pricing?.currency || "INR",
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-sky-200 bg-white px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Services
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {latestSentQuotation.serviceCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {SHOW_SELECTED_HISTORY_COMPARISON && selectedHistoryQuotation && (
          <motion.div
            variants={sectionRevealVariants}
            className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm text-slate-900"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-800">
                    Reference History
                  </span>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selectedHistoryQuotation.quotationNumber ||
                      `Quotation ${selectedHistoryQuotation.attemptNumber}`}
                  </h2>
                  <span className="rounded-full border border-gray-200 bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
                    {selectedHistoryQuotation.status}
                  </span>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  This quotation is shown only for comparison. The active
                  revision draft below is fresh and independent from this
                  history entry.
                </p>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    Created
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedHistoryQuotation.createdAtLabel || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    Valid Till
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedHistoryQuotation.validTillLabel || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  Services Total
                </p>
                <p className="mt-1 text-sm font-semibold text-sky-700">
                  {formatCurrencyValue(
                    selectedHistoryQuotation.pricing?.subTotal || 0,
                    selectedHistoryQuotation.pricing?.currency || "INR",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  OPS Markup
                </p>
                <p className="mt-1 text-sm font-semibold text-amber-700">
                  {formatCurrencyValue(
                    selectedHistoryQuotation.pricing?.opsMarkup?.amount || 0,
                    selectedHistoryQuotation.pricing?.currency || "INR",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  OPS Charges
                </p>
                <p className="mt-1 text-sm font-semibold text-orange-700">
                  {formatCurrencyValue(
                    Number(
                      selectedHistoryQuotation.pricing?.opsCharges
                        ?.serviceCharge || 0,
                    ) +
                      Number(
                        selectedHistoryQuotation.pricing?.opsCharges
                          ?.handlingFee || 0,
                      ),
                    selectedHistoryQuotation.pricing?.currency || "INR",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  Taxes
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  {formatCurrencyValue(
                    selectedHistoryQuotation.pricing?.tax?.totalTax || 0,
                    selectedHistoryQuotation.pricing?.currency || "INR",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  OPS Total
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatCurrencyValue(
                    selectedHistoryQuotation.opsTotalAmount || 0,
                    selectedHistoryQuotation.pricing?.currency || "INR",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  Client Total
                </p>
                <p className="mt-1 text-sm font-semibold text-violet-700">
                  {selectedHistoryQuotation.clientTotalAmount !== null &&
                  selectedHistoryQuotation.clientTotalAmount !== undefined
                    ? formatCurrencyValue(
                        selectedHistoryQuotation.clientTotalAmount,
                        selectedHistoryQuotation.pricing?.currency || "INR",
                      )
                    : "Not shared"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Services in this quotation
                  </h3>
                  <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    {selectedHistoryQuotation.serviceCount} item
                    {selectedHistoryQuotation.serviceCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedHistoryQuotation.services?.length ? (
                    selectedHistoryQuotation.services.map((service, index) => (
                      <div
                        key={`${selectedHistoryQuotation.id}-service-${index}`}
                        className="rounded-2xl border border-gray-200 bg-white px-3 py-3 shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {service?.title || "Service"}
                          </p>
                          <span className="text-xs font-medium text-slate-500">
                            {formatCurrencyValue(
                              service?.totalInInr || service?.total || 0,
                              selectedHistoryQuotation.pricing?.currency ||
                                "INR",
                            )}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {service?.type || "service"}
                          {service?.city ? ` • ${service.city}` : ""}
                          {service?.serviceDate
                            ? ` • ${formatShareDate(service.serviceDate)}`
                            : ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">
                      No services were saved in this quotation.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {selectedHistoryQuotation.agentRevisionRemark && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
                      Revision Remark
                    </p>
                    <p className="mt-2 text-sm leading-6 text-rose-900">
                      {selectedHistoryQuotation.agentRevisionRemark}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Inclusions
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedHistoryQuotation.inclusions?.length || 0}
                  </p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Exclusions
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedHistoryQuotation.exclusions?.length || 0}
                  </p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Additional Notes
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedHistoryQuotation.additionalNotes?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {renderWorkspaceModal()}

        {/* Layout */}
        <QuotationBuilderContent
          CONTRACTED_RATE_FILTER_OPTIONS={CONTRACTED_RATE_FILTER_OPTIONS}          adultPassengers={adultPassengers}
          appliedTaxTotal={appliedTaxTotal}
          childPassengers={childPassengers}
          contractedRateFilterCounts={contractedRateFilterCounts}
          contractedRatesFilter={contractedRatesFilter}
          contractedRatesSearch={contractedRatesSearch}
          costPerPassenger={costPerPassenger}          deleteService={deleteService}
          destinationMatchedServices={destinationMatchedServices}
          editingServiceCardId={editingServiceCardId}          exchangeRates={exchangeRates}
          filteredServices={filteredServices}
          fixedMargin={fixedMargin}
          focusServiceEditor={focusServiceEditor}
          focusedServiceCardId={focusedServiceCardId}
          foreignCurrencyBreakdown={foreignCurrencyBreakdown}
          getHotelNightStart={getHotelNightStart}
          getRemainingHotelNights={getRemainingHotelNights}
          handleFinalSend={handleFinalSend}
          handleSaveDraftQuote={handleSaveDraftQuote}
          handleSelectedServiceDelete={handleSelectedServiceDelete}
          handleSelectedServiceEditAction={handleSelectedServiceEditAction}          isInvoiceRequestedStage={isInvoiceRequestedStage}          marginType={marginType}
          markup={markup}          openOpsChargesPopup={openOpsChargesPopup}
          openSelectedServicesModalForService={
            openSelectedServicesModalForService
          }
          opsMarkup={opsMarkup}          order={order}          packageTemplateAmount={packageTemplateAmount}
          queryRequirementTags={queryRequirementTags}          renderQuotationWorkspaceButtons={renderQuotationWorkspaceButtons}
          renderSelectedServicesSection={renderSelectedServicesSection}
          savingDraftQuote={savingDraftQuote}
          selectedSendOption={selectedSendOption}
          selectedServices={selectedServices}          sendOptions={sendOptions}
          sendOptionsPanelStyle={sendOptionsPanelStyle}          services={services}
          servicesLoadError={servicesLoadError}
          servicesLoading={servicesLoading}
          servicesTotal={servicesTotal}
          setContractedRatesFilter={setContractedRatesFilter}
          setContractedRatesSearch={setContractedRatesSearch}
          setExchangeRates={setExchangeRates}
          setFixedMargin={setFixedMargin}
          setMarginType={setMarginType}
          setMarkup={setMarkup}
          setSelectedSendOption={setSelectedSendOption}
          setShowQueryRequirements={setShowQueryRequirements}
          setShowQuickServiceModal={setShowQuickServiceModal}
          setShowSendOptions={setShowSendOptions}
          shouldShowDualPricing={shouldShowDualPricing}
          showQueryRequirements={showQueryRequirements}
          showSendOptions={showSendOptions}          toggleService={toggleService}          totalAmount={totalAmount}          totalPassengers={totalPassengers}          tripDuration={tripDuration}          tripNights={tripNights}          updateField={updateField}        />
      </motion.section>

      {/* ======================== POPUP Ops Charges ======================== */}
      {showOpsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs sm:p-4">
          <div className="relative my-auto flex h-[calc(100vh-16px)] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-2xl animate-slideDown sm:h-[calc(100vh-24px)] text-slate-900">
            {/* ===== HEADER (title + close only) ===== */}
            <div className="relative border-b border-gray-200 bg-slate-50 px-5 py-4 sm:px-6">
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                    Premium Controls
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                    Charges & Taxation
                  </h2>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                    Tune ops charges and tax values from one compact control
                    desk before sharing the quotation.
                  </p>
                </div>
                <button
                  onClick={() => setShowOpsPopup(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-slate-500 transition hover:bg-gray-100 hover:text-slate-900 cursor-pointer shadow-2xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ===== STICKY SUMMARY CARDS (won't scroll) ===== */}
            <div className="border-b border-gray-200 bg-slate-50 px-5 pt-3 pb-3 sm:px-6">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-2xs">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Ops Charges
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    ₹{" "}
                    {formatAmountValue(
                      roundCurrencyAmount(
                        Number(draftServiceCharge || 0) +
                          Number(draftHandlingFee || 0),
                      ),
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Service + handling setup
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-2xs">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Tax Preview
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    ₹ {formatAmountValue(draftTaxationTotal)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Live GST, TCS and tourism total
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-2xs">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Quote Validity
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {draftValidTill || "Not set"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Applied to the current quotation
                  </p>
                </div>
              </div>
            </div>

            {/* ===== SCROLLABLE BODY ===== */}
            <div className="dark-scrollbar flex-1 overflow-y-auto px-5 py-4 sm:px-6 bg-slate-50">
              {/* Two-column layout */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                {/* ======= OPS CHARGES ======= */}
                <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-2xs">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                        Classic Desk
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">
                        OPS Charges
                      </h3>
                    </div>
                    <div className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800">
                      {taxSetupMode === "auto" ? "Auto Ready" : "Manual Setup"}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Service Charge
                    </label>
                    <input
                      type="number"
                      value={draftServiceCharge}
                      onChange={(e) =>
                        setDraftServiceCharge(
                          roundCurrencyAmount(e.target.value),
                        )
                      }
                      className="mt-1.5 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-400 outline-none transition focus:border-[#3E63DD] shadow-2xs font-semibold"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Handling Fee
                    </label>
                    <input
                      type="number"
                      value={draftHandlingFee}
                      onChange={(e) =>
                        setDraftHandlingFee(roundCurrencyAmount(e.target.value))
                      }
                      className="mt-1.5 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-400 outline-none transition focus:border-[#3E63DD] shadow-2xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Valid Till
                    </label>
                    <input
                      type="date"
                      value={draftValidTill}
                      onChange={(e) => setDraftValidTill(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-[#3E63DD] shadow-2xs font-semibold"
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
                    These charges stay outside the service cards and shape the
                    final commercial quote only.
                  </div>
                </div>

                {/* ======= TAXATION ======= */}
                <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-2xs">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                        Tax Console
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">
                        Taxation
                      </h3>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        Auto se default taxes enable ho jayenge, aur manual mode
                        me aap har value edit kar sakte ho.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={applyAutoTaxPreset}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                          taxSetupMode === "auto"
                            ? "border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs"
                            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Auto Taxes
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaxSetupMode("manual")}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                          taxSetupMode === "manual"
                            ? "border border-amber-300 bg-amber-50 text-amber-900 shadow-2xs"
                            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>

                  {/* GST */}
                  <div className="mb-3 flex flex-col justify-between rounded-2xl border border-gray-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftGstChecked}
                          onChange={() => {
                            setTaxSetupMode("manual");
                            setDraftGstChecked(!draftGstChecked);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-[#3E63DD] focus:ring-[#3E63DD]"
                        />
                        GST (Goods & Services Tax)
                      </label>
                      <div className="flex shrink-0 items-center gap-2">
                        <input
                          type="number"
                          value={draftGstPercent}
                          onChange={(e) => {
                            setTaxSetupMode("manual");
                            setDraftGstPercent(Number(e.target.value || 0));
                          }}
                          className="w-18 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-center text-xs font-semibold text-slate-900 outline-none focus:border-[#3E63DD] shadow-2xs"
                        />
                        <span className="text-blue-700 text-xs font-bold">
                          %
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 flex items-center justify-between gap-3 text-[11px] leading-5 text-slate-500">
                      <span>
                        GST amount will be calculated from the taxable quotation
                        value.
                      </span>
                      <span className="text-emerald-700 font-bold">
                        ₹ {formatAmountValue(draftGstFinal)}
                      </span>
                    </p>
                  </div>

                  {/* TCS */}
                  <div className="mb-3 flex flex-col justify-between rounded-2xl border border-gray-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftTcsChecked}
                          onChange={() => {
                            setTaxSetupMode("manual");
                            setDraftTcsChecked(!draftTcsChecked);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-[#3E63DD] focus:ring-[#3E63DD]"
                        />
                        TCS (Tax Collected at Source)
                      </label>
                      <div className="flex shrink-0 items-center gap-2">
                        <input
                          type="number"
                          value={draftTcsPercent}
                          onChange={(e) => {
                            setTaxSetupMode("manual");
                            setDraftTcsPercent(Number(e.target.value || 0));
                          }}
                          className="w-18 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-center text-xs font-semibold text-slate-900 outline-none focus:border-[#3E63DD] shadow-2xs"
                        />
                        <span className="text-blue-700 text-xs font-bold">
                          %
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 flex items-center justify-between gap-3 text-[11px] leading-5 text-slate-500">
                      <span>
                        TCS amount will be calculated from the taxable quotation
                        value.
                      </span>
                      <span className="text-emerald-700 font-bold">
                        ₹ {formatAmountValue(draftTcsFinal)}
                      </span>
                    </p>
                  </div>

                  {/* Tourism Fees */}
                  <div className="mb-3 flex flex-col justify-end rounded-2xl border border-gray-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftTourismChecked}
                          onChange={() => {
                            setTaxSetupMode("manual");
                            setDraftTourismChecked(!draftTourismChecked);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-[#3E63DD] focus:ring-[#3E63DD]"
                        />
                        Tourism Development Fee
                      </label>
                      <span className="text-blue-700 text-sm font-bold">
                        ₹{DEFAULT_TOURISM_AMOUNT}
                      </span>
                    </div>
                    {draftTourismChecked && (
                      <input
                        type="number"
                        value={draftTourismAmount}
                        onChange={(e) => {
                          setTaxSetupMode("manual");
                          setDraftTourismAmount(
                            roundCurrencyAmount(e.target.value || 0),
                          );
                        }}
                        className="mt-3 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-400 focus:border-[#3E63DD] outline-none font-semibold shadow-2xs"
                      />
                    )}
                  </div>

                  {/* Total Tax */}
                  <div className="mt-4 flex justify-between rounded-2xl border border-gray-200 bg-slate-100 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-700">
                      Total Tax Amount
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      ₹{formatAmountValue(draftTaxationTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== FOOTER BUTTONS ===== */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-3.5 sm:px-6">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">
                Quote control panel
              </p>
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => setShowOpsPopup(false)}
                  className="px-5 py-2 text-sm border border-gray-300 rounded-full text-slate-700 hover:bg-gray-50 font-semibold cursor-pointer transition shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setServiceCharge(roundCurrencyAmount(draftServiceCharge));
                    setHandlingFee(roundCurrencyAmount(draftHandlingFee));
                    setValidTill(draftValidTill);
                    setGstChecked(draftGstChecked);
                    setTcsChecked(draftTcsChecked);
                    setTourismChecked(draftTourismChecked);
                    setGstPercent(draftGstPercent);
                    setTcsPercent(draftTcsPercent);
                    setGstAmount(roundCurrencyAmount(draftGstFinal));
                    setTcsAmount(roundCurrencyAmount(draftTcsFinal));
                    setTourismAmount(roundCurrencyAmount(draftTourismFinal));
                    setAppliedTaxTotal(draftTaxationTotal);
                    setShowOpsPopup(false);
                    setTimeout(() => {
                      toast.success("Charges & taxation applied");
                    }, 200);
                  }}
                  className="px-6 py-2 text-sm bg-amber-500 text-white rounded-full font-bold hover:bg-amber-600 cursor-pointer shadow-xs transition"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {transportSelectionConfirm.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-[71] flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="w-full max-w-sm rounded-[28px] border border-gray-200 bg-white p-6 shadow-2xl text-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                    Transport Warning
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    Confirm this transport service?
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTransportSelectionConfirm({
                      open: false,
                      serviceId: "",
                      serviceTitle: "",
                      passengerCapacity: 0,
                      passengerCount: 0,
                    })
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-slate-50 text-slate-500 transition hover:bg-gray-100 hover:text-slate-900 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {transportSelectionConfirm.passengerCapacity <
                transportSelectionConfirm.passengerCount ? (
                  <>
                    This transport vehicle is for only{" "}
                    <span className="font-semibold text-amber-700">
                      {transportSelectionConfirm.passengerCapacity} pax
                    </span>{" "}
                    (
                    <span className="text-slate-500">
                      {transportSelectionConfirm.luggageCapacity || 2} luggage
                      bags
                    </span>
                    ), while this booking has{" "}
                    <span className="font-semibold text-red-600">
                      {transportSelectionConfirm.passengerCount} passengers
                    </span>
                    . The passenger count exceeds vehicle capacity. Are you sure
                    you want to select{" "}
                    <span className="font-semibold text-slate-900">
                      {transportSelectionConfirm.serviceTitle}
                    </span>
                    ?
                  </>
                ) : transportSelectionConfirm.passengerCount <= 4 &&
                  transportSelectionConfirm.passengerCapacity >= 6 ? (
                  <>
                    For{" "}
                    <span className="font-semibold text-amber-700">
                      {transportSelectionConfirm.passengerCount} passengers
                    </span>
                    , a{" "}
                    <span className="font-semibold text-slate-900">
                      Sedan (3–4 Pax, 2–3 Bags)
                    </span>{" "}
                    is usually more suitable and cost-effective.
                    <br />
                    You have selected{" "}
                    <span className="font-semibold text-slate-900">
                      {transportSelectionConfirm.serviceTitle}
                    </span>{" "}
                    (Capacity:{" "}
                    <span className="font-semibold text-amber-700">
                      {transportSelectionConfirm.passengerCapacity} pax
                    </span>
                    , Luggage:{" "}
                    <span className="font-semibold text-sky-700">
                      {transportSelectionConfirm.luggageCapacity || 4} bags
                    </span>
                    ).
                    <br />
                    Do you want to continue with this vehicle?
                  </>
                ) : (
                  <>
                    This transport service is for{" "}
                    <span className="font-semibold text-amber-700">
                      {transportSelectionConfirm.passengerCapacity} pax
                    </span>{" "}
                    (
                    <span className="text-slate-500">
                      {transportSelectionConfirm.luggageCapacity || 2} bags
                    </span>
                    ), while this booking currently has{" "}
                    <span className="font-semibold text-slate-900">
                      {transportSelectionConfirm.passengerCount} passenger
                      {transportSelectionConfirm.passengerCount === 1
                        ? ""
                        : "s"}
                    </span>
                    . Are you sure you want to continue with{" "}
                    <span className="font-semibold text-slate-900">
                      {transportSelectionConfirm.serviceTitle}
                    </span>
                    ?
                  </>
                )}
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setTransportSelectionConfirm({
                      open: false,
                      serviceId: "",
                      serviceTitle: "",
                      passengerCapacity: 0,
                      passengerCount: 0,
                    })
                  }
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-gray-50 shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pendingServiceId =
                      transportSelectionConfirm.serviceId;
                    setTransportSelectionConfirm({
                      open: false,
                      serviceId: "",
                      serviceTitle: "",
                      passengerCapacity: 0,
                      passengerCount: 0,
                    });
                    if (pendingServiceId) {
                      toggleService(pendingServiceId, true);
                    }
                  }}
                  className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 shadow-xs cursor-pointer"
                >
                  Yes, Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*======================== ✅ POPUP Success final Charges =============================================*/}
      {showFinanceInvoiceConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[28px] border border-gray-200 bg-white p-6 shadow-2xl text-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                  Finance Invoice
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Continue with approved booking?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFinanceInvoiceConfirm(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-slate-50 text-slate-500 transition hover:bg-gray-100 hover:text-slate-900 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will continue the approved booking flow and notify the agent
              that the booking is in the amount and documents stage.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowFinanceInvoiceConfirm(false)}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-gray-50 shadow-2xs cursor-pointer"
              >
                No
              </button>
              <button
                type="button"
                onClick={generateFinalInvoice}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 shadow-xs cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {successPopup.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-100 text-center shadow-2xl animate-scaleIn text-slate-900">
            {/* ICON */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center text-white text-3xl font-bold shadow-xs">
                ✓
              </div>
            </div>

            {/* TITLE */}
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {successPopup.kind === "invoice"
                ? "Finance Invoice Prepared"
                : successPopup.deliveryWarnings?.length
                  ? "Quotation Saved"
                  : "Quotation Sent Successfully"}
            </h2>

            {/* SUBTEXT */}
            <p className="text-slate-500 text-sm mb-4">
              {successPopup.kind === "invoice"
                ? "The approved quotation has been converted into a finance-ready invoice. Finance team will share the final invoice with the agent."
                : successPopup.deliveryWarnings?.length
                  ? "Your quotation was saved, but one or more selected delivery channels could not be completed."
                  : "Your quotation has been delivered to the agent via selected channels."}
            </p>

            {/* DETAILS */}
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 text-left text-xs mb-4">
              {successPopup.kind === "invoice" && (
                <p className="flex justify-between">
                  <span className="text-slate-500">Invoice Number</span>
                  <span className="text-slate-900 font-semibold">
                    {successPopup.invoiceNumber || "-"}
                  </span>
                </p>
              )}
              <p className="flex justify-between">
                <span className="text-slate-500">Agent</span>
                <span className="text-slate-900 font-semibold">
                  {successPopup.agentName ||
                    order?.agent?.companyName ||
                    order?.agent?.name ||
                    "-"}
                </span>
              </p>

              <p className="flex justify-between mt-1">
                <span className="text-slate-500">Total Amount</span>
                <span className="text-amber-700 font-bold">
                  ₹ {formatAmountValue(successPopup.totalAmount || 0)}
                </span>
              </p>

              <p className="flex justify-between mt-1">
                <span className="text-slate-500">Services</span>
                <span className="text-slate-900 font-semibold">
                  {successPopup.serviceCount}
                </span>
              </p>
            </div>

            {successPopup.kind === "quote" &&
              successPopup.deliveryWarnings?.length > 0 && (
                <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                    Delivery Issue
                  </p>
                  <p className="mt-1 text-sm text-amber-900">
                    {successPopup.deliveryWarnings[0]}
                  </p>
                </div>
              )}

            {/* BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setSuccessPopup((prev) => ({ ...prev, open: false }))
                }
                className="w-full border border-gray-300 bg-white text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50 shadow-2xs cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setSuccessPopup((prev) => ({ ...prev, open: false }));
                  navigate(
                    successPopup.kind === "invoice"
                      ? "/ops/bookings-management"
                      : "/ops/dashboard",
                  );
                }}
                className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-semibold hover:bg-amber-600 shadow-xs cursor-pointer"
              >
                {successPopup.kind === "invoice"
                  ? "Go to Booking Hub"
                  : "Go to Dashboard"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {quickActionPopup && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 right-5 z-[60]"
          >
            <div className="min-w-[280px] max-w-[320px] rounded-2xl border border-gray-200 bg-white p-3 shadow-xl backdrop-blur-sm text-slate-900">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${
                    quickActionPopup.type === "delete"
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  }`}
                >
                  {quickActionPopup.type === "delete" ? (
                    <Trash2 size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {quickActionPopup.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {quickActionPopup.message}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuickAddServiceModal
        showModal={showQuickServiceModal}
        setShowModal={setShowQuickServiceModal}
        addCustomService={addCustomService}
        savingService={savingService}
      />
    </>
  );
};

export default QuotationBuilder;
