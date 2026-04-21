import { CalendarDays, CheckCircle2, Send, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { FaStar, FaWater } from "react-icons/fa";
import { GiCityCar, GiModernCity, } from "react-icons/gi";
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
import PackageTemplate from "./PackageTemplate";
import { ImLocation2 } from "react-icons/im";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const pageShellVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.06,
    },
  },
};

const sectionRevealVariants = {
  hidden: {
    opacity: 0,
    x: -28,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const sideStackVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const rightCardVariants = {
  hidden: {
    opacity: 0,
    x: 28,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const serviceCardVariants = {
  hidden: {
    opacity: 0,
    x: -24,
  },
  visible: (index = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.32,
      delay: Math.min(index * 0.04, 0.28),
      ease: "easeOut",
    },
  }),
};

const INDIAN_DESTINATION_KEYWORDS = [
  "india", "delhi", "jaipur", "udaipur", "goa", "kerala", "kashmir", "agra",
  "mumbai", "pune", "bengaluru", "bangalore", "chennai", "kolkata", "hyderabad",
  "shimla", "manali", "darjeeling", "rajasthan", "himachal", "andaman", "sikkim",
  "varanasi", "amritsar", "rishikesh", "ooty", "mysore", "coorg", "nainital",
  "mussoorie", "jaisalmer", "jodhpur", "pushkar", "kochi", "munnar", "alleppey",
  "leh", "ladakh", "ahmedabad", "surat", "bhopal", "indore", "dehradun",
];

const DEFAULT_EXCHANGE_RATES = Object.freeze({
  INR: 1,
  USD: 83.5,
  EUR: 90.5,
  GBP: 105.5,
  AED: 22.75,
  THB: 2.3,
  IDR: 0.0051,
  SGD: 61.5,
  MYR: 17.7,
  EGP: 1.65,
  AUD: 54.5,
});

const CURRENCY_LABELS = Object.freeze({
  INR: "INR",
  USD: "$",
  EUR: "EUR",
  GBP: "GBP",
  AED: "AED",
  THB: "THB",
  IDR: "IDR",
  SGD: "SGD",
  MYR: "MYR",
  EGP: "EGP",
  AUD: "AUD",
});

const normalizeCurrencyCode = (currency = "INR") =>
  String(currency || "INR").trim().toUpperCase() || "INR";

const roundCurrencyAmount = (value) =>
  Math.round(Number(value || 0));

const roundExchangeRateValue = (value) =>
  Number(Number(value || 0).toFixed(4));

const getCurrencyLabel = (currency = "INR") =>
  CURRENCY_LABELS[normalizeCurrencyCode(currency)] || normalizeCurrencyCode(currency);

const formatAmountValue = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatExchangeRateValue = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });

const formatCurrencyValue = (value, currency = "INR") =>
  `${getCurrencyLabel(currency)} ${formatAmountValue(value)}`;

const SERVICE_TYPE_LABELS = Object.freeze({
  hotel: "Hotel",
  transfer: "Transport",
  car: "Transport",
  activity: "Activity",
  sightseeing: "Sightseeing",
});

const CONTRACTED_RATE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "hotel", label: "Hotels" },
  { value: "transfer", label: "Transport" },
  { value: "activity", label: "Activities" },
  { value: "sightseeing", label: "Sightseeing" },
];

const normalizeServiceFilterType = (type = "") => {
  const normalizedType = String(type || "").toLowerCase().trim();
  if (normalizedType === "car" || normalizedType === "transport") {
    return "transfer";
  }

  return normalizedType;
};

const normalizeBedTypeValue = (value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (!normalizedValue) return "";
  if (["single", "double", "twin", "triple"].includes(normalizedValue)) {
    return normalizedValue;
  }
  if (normalizedValue.includes("king") || normalizedValue.includes("queen")) {
    return "double";
  }
  if (normalizedValue.includes("twin")) {
    return "twin";
  }
  if (normalizedValue.includes("triple")) {
    return "triple";
  }
  if (normalizedValue.includes("single")) {
    return "single";
  }

  return "";
};

const getServiceSearchAliases = (type = "") => {
  switch (normalizeServiceFilterType(type)) {
    case "hotel":
      return "hotel stay room";
    case "transfer":
      return "transport transfer car cab vehicle";
    case "activity":
      return "activity experience";
    case "sightseeing":
      return "sightseeing sightsheeting tour";
    default:
      return "";
  }
};

const getServiceSearchText = (service = {}) =>
  [
    service.title,
    service.serviceName,
    service.hotelName,
    service.city,
    service.country,
    service.vehicleType,
    service.usageType,
    service.hotelCategory,
    service.roomType,
    service.bedType,
    service.desc,
    normalizeServiceFilterType(service.type),
    getServiceSearchAliases(service.type),
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");

const getServiceTypeLabel = (type = "") =>
  SERVICE_TYPE_LABELS[String(type || "").toLowerCase()] || "Service";

const getSelectedServiceIconTone = (type = "") => {
  switch (normalizeServiceFilterType(type)) {
    case "hotel":
      return "bg-[#2f7cf6]";
    case "activity":
      return "bg-[#00C950]";
    case "transfer":
      return "bg-[#AD46FF]";
    case "sightseeing":
      return "bg-[#4f8bff]";
    default:
      return "bg-slate-500";
  }
};

const renderSelectedServiceSummaryIcon = (service = {}) => {
  const iconTone = getSelectedServiceIconTone(service.type);

  if (React.isValidElement(service.icon)) {
    return React.cloneElement(service.icon, {
      className: `h-5 w-5 rounded-lg p-1 text-white ${iconTone}`,
    });
  }

  return (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-semibold text-white ${iconTone}`}
    >
      {String(service.icon || service.title || "S").trim().charAt(0).toUpperCase()}
    </span>
  );
};

const formatServiceDateLabel = (value) => {
  if (!value) return "Date pending";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getServiceCardDomId = (serviceId) => `quotation-service-card-${serviceId}`;

const isIndianDestination = (destination = "") => {
  const normalizedDestination = String(destination || "").trim().toLowerCase();
  if (!normalizedDestination) return false;

  return INDIAN_DESTINATION_KEYWORDS.some((keyword) =>
    normalizedDestination.includes(keyword),
  );
};

const getExchangeRateForCurrency = (currency = "INR", exchangeRates = {}) => {
  const code = normalizeCurrencyCode(currency);
  if (code === "INR") return 1;

  const configuredRate = Number(exchangeRates?.[code]);
  if (Number.isFinite(configuredRate) && configuredRate > 0) {
    return configuredRate;
  }

  return Number(DEFAULT_EXCHANGE_RATES[code] || 1);
};

const convertAmountToInr = (value, currency = "INR", exchangeRates = {}) =>
  roundCurrencyAmount(
    Number(value || 0) * getExchangeRateForCurrency(currency, exchangeRates),
  );

const calculateServiceOriginalTotal = (service = {}) => {
  const normalizedType = String(service?.type || "").toLowerCase();

  if (normalizedType === "hotel") {
    const nights = Number(service?.nights || 0);
    let total = Number(service?.rate || 0) * nights;

    if (service?.extraAdult) {
      total += Number(service?.awebRate || 0) * nights;
    }

    if (service?.childWithBed) {
      total += Number(service?.cwebRate || 0) * nights;
    }

    if (service?.childWithoutBed) {
      total += Number(service?.cwoebRate || 0) * nights;
    }

    return roundCurrencyAmount(total);
  }

  if (normalizedType === "transfer" || normalizedType === "car") {
    return roundCurrencyAmount(Number(service?.rate || 0) * Number(service?.days || 1));
  }

  if (normalizedType === "activity") {
    return roundCurrencyAmount(Number(service?.rate || 0) * Number(service?.pax || 1));
  }

  if (normalizedType === "sightseeing") {
    return roundCurrencyAmount(
      Number(service?.rate || 0) *
      Math.max(Number(service?.pax || 1), Number(service?.days || 1)),
    );
  }

  return roundCurrencyAmount(Number(service?.rate || 0));
};


const QuotationBuilder = () => {
  const resolveDmcOwner = (service = {}) => ({
    dmcId: service.dmcId || service.supplierId || "",
    dmcName: service.dmcName || "",
  });

  const formatDateInput = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
  };

  const addDaysToDate = (value, daysToAdd = 0) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    parsed.setDate(parsed.getDate() + Number(daysToAdd || 0));
    return parsed.toISOString().slice(0, 10);
  };

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
    [
      item.name,
      item.hotelName,
      item.serviceName,
      item.title,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

  const getContractedServiceDisplayNames = (service = {}) =>
    [
      service.title,
      service.serviceName,
      service.hotelName,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

  const getPackageLocationNames = (pkg = {}) =>
    [
      pkg.destination,
      pkg.city,
      pkg.country,
    ]
      .map((value) => normalizeLocationLabel(value))
      .filter(Boolean);

  const getServiceLocationNames = (service = {}) =>
    [
      service.city,
      service.country,
    ]
      .map((value) => normalizeLocationLabel(value))
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
          overlappingTokens.length >= Math.min(2, packageTokens.length, serviceTokens.length)
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
      getPackageServiceDate(getPackageMatchedServiceDayValue(item, service.type)) ||
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
      ...(pkg.activities || []).map((item) => ({ ...item, packageType: "activity" })),
      ...(pkg.sightseeing || []).map((item) => ({ ...item, packageType: "sightseeing" })),
      ...(pkg.transfers || []).map((item) => ({ ...item, packageType: "transfer" })),
    ];

    const matchedUpdates = new Map();
    const usedServiceIds = new Set();

    packageServices.forEach((item) => {
      const compatibleServices = availableServices.filter(
        (service) =>
          !usedServiceIds.has(service.id) &&
          getComparableServiceType(service.type) === getComparableServiceType(item.packageType) &&
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

      const strongMatch = rankedMatches.find(({ score }) => score >= 58)?.service;
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

  const havePackageSelectionsChanged = (previousServices = [], nextServices = []) =>
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
  const order = location.state;
  const navigate = useNavigate();
  const DEFAULT_GST_PERCENT = 5;
  const DEFAULT_TCS_PERCENT = 0;
  const DEFAULT_TOURISM_AMOUNT = 500;

  const [showOpsPopup, setShowOpsPopup] = useState(false);
  // markup
  const [markup, setMarkup] = useState(5);
  const [showSendOptions, setShowSendOptions] = useState(false);
  const [notes, setNotes] = useState("");
  // ops charges
  const [serviceCharge, setServiceCharge] = useState(0);
  const [handlingFee, setHandlingFee] = useState(0);

  const [appliedTaxTotal, setAppliedTaxTotal] = useState(0);

  // tax toggle
  const [gstChecked, setGstChecked] = useState(false);
  const [tcsChecked, setTcsChecked] = useState(false);
  const [tourismChecked, setTourismChecked] = useState(false);

  // manual override
  const [gstAmount, setGstAmount] = useState("");
  const [tcsAmount, setTcsAmount] = useState("");
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
  });
  const [services, setServices] = useState([]);
  const [quotationId, setQuotationId] = useState("");
  const [loadedQuotationDraft, setLoadedQuotationDraft] = useState(null);
  const [savingService, setSavingService] = useState(false);
  const [selectedSendOption, setSelectedSendOption] = useState(null);
  const [selectedPackageTemplate, setSelectedPackageTemplate] = useState(null);
  const [exchangeRates, setExchangeRates] = useState(() => ({ ...DEFAULT_EXCHANGE_RATES }));
  const [quickActionPopup, setQuickActionPopup] = useState(null);
  const [contractedRatesSearch, setContractedRatesSearch] = useState("");
  const [contractedRatesFilter, setContractedRatesFilter] = useState("all");
  const [focusedServiceCardId, setFocusedServiceCardId] = useState("");
  const [editingServiceCardId, setEditingServiceCardId] = useState("");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const isInvoiceRequestedStage = order?.opsStatus === "Invoice_Requested";
  const quoteCategory = isIndianDestination(order?.destination)
    ? "domestic"
    : "international";

  const showQuickActionFeedback = (type, title, message) => {
    setQuickActionPopup({ type, title, message });
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
    setDraftTourismAmount(roundCurrencyAmount(tourismAmount || DEFAULT_TOURISM_AMOUNT));
    setTaxSetupMode("manual");
  };

  const applyAutoTaxPreset = () => {
    setTaxSetupMode("auto");
    setDraftGstChecked(true);
    setDraftTcsChecked(true);
    setDraftTourismChecked(true);
    setDraftGstPercent((prev) =>
      Number(prev || DEFAULT_GST_PERCENT) || DEFAULT_GST_PERCENT
    );
    setDraftTcsPercent((prev) => Number(prev || DEFAULT_TCS_PERCENT));
    setDraftTourismAmount((prev) =>
      roundCurrencyAmount(prev || DEFAULT_TOURISM_AMOUNT) || DEFAULT_TOURISM_AMOUNT
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

    const activeService = services.find((service) => service.id === editingServiceCardId);
    if (!activeService || !activeService.checked) {
      setEditingServiceCardId("");
    }
  }, [editingServiceCardId, services]);

  useEffect(() => {
    const loadQuotationDraft = async () => {
      try {
        if (!order?._id) return;

        const requestConfig = order?.editQuotationId
          ? {
              params: {
                sourceQuotationId: order.editQuotationId,
              },
            }
          : undefined;

        const { data } = await API.get(`/ops/queries/${order._id}/quotation-draft`, requestConfig);
        const quotation = data?.quotation;

        if (!quotation) return;

        setQuotationId(quotation._id);
        setLoadedQuotationDraft(quotation);
        setValidTill(formatDateInput(quotation.validTill));
        setDraftValidTill(formatDateInput(quotation.validTill));

        const draftOpsMarkupPercent = Number(quotation?.pricing?.opsMarkup?.percent || 0);
        const draftOpsMarkupAmount = roundCurrencyAmount(quotation?.pricing?.opsMarkup?.amount || 0);
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

        const nextServiceCharge = roundCurrencyAmount(quotation?.pricing?.opsCharges?.serviceCharge || 0);
        const nextHandlingFee = roundCurrencyAmount(quotation?.pricing?.opsCharges?.handlingFee || 0);
        setServiceCharge(nextServiceCharge);
        setHandlingFee(nextHandlingFee);
        setDraftServiceCharge(nextServiceCharge);
        setDraftHandlingFee(nextHandlingFee);

        const nextGstPercent = Number(quotation?.pricing?.tax?.gst?.percent || DEFAULT_GST_PERCENT);
        const nextTcsPercent = Number(quotation?.pricing?.tax?.tcs?.percent || DEFAULT_TCS_PERCENT);
        const nextGstAmount = roundCurrencyAmount(quotation?.pricing?.tax?.gst?.amount || 0);
        const nextTcsAmount = roundCurrencyAmount(quotation?.pricing?.tax?.tcs?.amount || 0);
        const nextTourismAmount = roundCurrencyAmount(quotation?.pricing?.tax?.tourismFee?.amount || 0);
        const nextTotalTax = roundCurrencyAmount(quotation?.pricing?.tax?.totalTax || 0);
        const hasGst = nextGstAmount > 0 || nextGstPercent > 0;
        const hasTcs = nextTcsAmount > 0 || nextTcsPercent > 0;
        const hasTourism = nextTourismAmount > 0;

        setGstChecked(hasGst);
        setTcsChecked(hasTcs);
        setTourismChecked(hasTourism);
        setDraftGstChecked(hasGst);
        setDraftTcsChecked(hasTcs);
        setDraftTourismChecked(hasTourism);
        setGstPercent(nextGstPercent);
        setTcsPercent(nextTcsPercent);
        setDraftGstPercent(nextGstPercent);
        setDraftTcsPercent(nextTcsPercent);
        setGstAmount(nextGstAmount);
        setTcsAmount(nextTcsAmount);
        setTourismAmount(nextTourismAmount);
        setDraftTourismAmount(nextTourismAmount);
        setAppliedTaxTotal(nextTotalTax);
      } catch (error) {
        console.error("Failed to load quotation draft", error);
      } finally {
        setDraftHydrated(false);
      }
    };

    loadQuotationDraft();
  }, [order?._id]);






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
          icon: <LiaHotelSolid className="w-6 h-5 bg-blue-500 text-white rounded-md p-0.5" />,
          color: "text-blue-400"
        };

      case "activity":
        return {
          icon: <FaWater className=" w-6 h-5 bg-[#00C950] text-white rounded-md p-0.5" />,
          color: "text-green-400 text-[18px]"
        };

      case "transfer":
      case "car":
        return {
          icon: <GiCityCar className=" w-6 h-5 bg-[#AD46FF] text-white rounded-md p-0.5" />,
          color: "text-blue-400"
        };

      case "sightseeing":
        return {
          icon: <GiModernCity className=" w-6 h-5 bg-blue-500 text-white rounded-md p-0.5" />,
          color: "text-purple-400"
        };

      default:
        return {
          icon: <GiModernCity />,
          color: "text-gray-400"
        };
    }
  };

  const mapDraftServiceToUi = (service = {}, overrides = {}) => {
    const meta = getServiceMeta(service.type);
    const owner = resolveDmcOwner(service);

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
      desc: service.description || service.desc || "",
      city: service.city || "",
      country: service.country || "",
      vehicleType: service.vehicleType || "",
      usageType: service.usageType || "",
      passengerCapacity: service.passengerCapacity || 0,
      luggageCapacity: service.luggageCapacity || 0,
      rate: Number(service.price ?? service.rate ?? 0),
      awebRate: Number(service.awebRate || 0),
      cwebRate: Number(service.cwebRate || 0),
      cwoebRate: Number(service.cwoebRate || 0),
      currency: normalizeCurrencyCode(service.currency || "INR"),
      exchangeRate: Number(service.exchangeRate || 1),
      priceInInr: Number(service.priceInInr || 0),
      totalInInr: Number(service.totalInInr || 0),
      serviceDate: formatDateInput(service.serviceDate),
      nights: service.nights || "",
      days: service.days || 1,
      pax: service.pax || 1,
      roomCategory: service.roomCategory || "Double",
      roomType: service.roomType || "",
      hotelCategory: service.hotelCategory || "",
      bedType: normalizeBedTypeValue(service.bedType) || "double",
      adults: service.adults || 2,
      children: service.children || 0,
      infants: service.infants || 0,
      rooms: service.rooms || 1,
      extraAdult: Boolean(service.extraAdult),
      childWithBed: Boolean(service.childWithBed),
      childWithoutBed: Boolean(service.childWithoutBed),
      checked: overrides.checked ?? true,
      custom: overrides.custom ?? !service.serviceId,
      icon: meta.icon,
      color: meta.color,
    };
  };

  const mergeDraftServicesIntoAvailableServices = (availableServices = [], quotation = null) => {
    const draftServices = Array.isArray(quotation?.services) ? quotation.services : [];

    if (!draftServices.length) {
      return availableServices;
    }

    const usedDraftIndexes = new Set();

    const mergedBaseServices = availableServices.map((service) => {
      const matchIndex = draftServices.findIndex((draftService, index) => {
        if (usedDraftIndexes.has(index)) return false;

        const draftSourceId = String(draftService?.serviceId || "").trim();
        const currentSourceId = String(service?.serviceId || service?.id || "").trim();

        return Boolean(draftSourceId && currentSourceId && draftSourceId === currentSourceId);
      });

      if (matchIndex === -1) {
        return service;
      }

      usedDraftIndexes.add(matchIndex);
      const draftService = draftServices[matchIndex];

      return {
        ...service,
        ...mapDraftServiceToUi(draftService, {
          id: service.id,
          custom: false,
        }),
      };
    });

    const customDraftServices = draftServices
      .filter((_, index) => !usedDraftIndexes.has(index))
      .map((draftService) => mapDraftServiceToUi(draftService, { custom: true }));

    return [...mergedBaseServices, ...customDraftServices];
  };

  const buildDraftServicePayload = (service = {}) => ({
    draftServiceId: service.dbServiceId || "",
    serviceId: service.custom ? service.serviceId || "" : service.serviceId || service.id,
    dmcId: resolveDmcOwner(service).dmcId,
    dmcName: resolveDmcOwner(service).dmcName,
    supplierId: service.supplierId || "",
    supplierName: service.supplierName || "",
    type: normalizeQuotationServiceType(service.type),
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
    days: Number(service.days || 1),
    pax: Number(service.pax || 1),
    currency: normalizeCurrencyCode(service.currency || "INR"),
    price: roundCurrencyAmount(service.rate || 0),
    exchangeRate: Number(service.exchangeRate || getExchangeRateForCurrency(service.currency, exchangeRates)),
    priceInInr: roundCurrencyAmount(service.priceInInr || 0),
    extraAdult: Boolean(service.extraAdult),
    childWithBed: Boolean(service.childWithBed),
    childWithoutBed: Boolean(service.childWithoutBed),
    awebRate: roundCurrencyAmount(service.awebRate || 0),
    cwebRate: roundCurrencyAmount(service.cwebRate || 0),
    cwoebRate: roundCurrencyAmount(service.cwoebRate || 0),
    total: roundCurrencyAmount(service.originalTotal || calculateServiceOriginalTotal(service)),
    totalInInr: roundCurrencyAmount(
      service.totalInInr || convertAmountToInr(
        calculateServiceOriginalTotal(service),
        service.currency,
        exchangeRates,
      ),
    ),
  });


  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await API.get("/ops/dmcAllGetServices");
        console.log("services", res.data.data);
        const formatted = res.data.data.map((s) => {
          const meta = getServiceMeta(s.type);
          const owner = resolveDmcOwner(s);
          return {
            id: s.id,
            serviceId: s.id,
            dmcId: owner.dmcId,
            dmcName: owner.dmcName,
            supplierId: s.supplierId || "",
            supplierName: s.supplierName || "",
            type: s.type,
            title: s.title,
            desc: s.description || "",
            city: s.city || "",
            country: s.country || "",
            vehicleType: s.vehicleType || "",
            usageType: s.usageType || "",
            passengerCapacity: s.passengerCapacity || 0,
            luggageCapacity: s.luggageCapacity || 0,
            rate: s.price || 0,
            // 🔥 ADD THIS
            awebRate: s.awebRate || 0,
            cwebRate: s.cwebRate || 0,
            cwoebRate: s.cwoebRate || 0,
            currency: normalizeCurrencyCode(s.currency),
            serviceDate: s.serviceDate || "",
            nights: "",
            days: 1,
            pax: 1,
            // ================== ADD THIS ==================
            roomCategory: s.roomCategory || "Double",
            roomType: s.roomType,
            hotelCategory: s.hotelCategory,
            bedType: normalizeBedTypeValue(s.bedType) || "double",
            adults: 2,
            children: 0,
            infants: 0,
            rooms: s.rooms || 1,
            extraAdult: false,
            childWithBed: false,
            childWithoutBed: false,
            // ============================================
            checked: false,
            custom: false,
            icon: meta.icon,
            color: meta.color
          };
        });

        setServices(formatted);
      } catch (err) {
        console.error(err);
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    if (!loadedQuotationDraft || !services.length || draftHydrated) {
      return;
    }

    setServices((prev) => mergeDraftServicesIntoAvailableServices(prev, loadedQuotationDraft));
    setDraftHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftHydrated, loadedQuotationDraft, services.length]);

  useEffect(() => {
    if (!selectedPackageTemplate || !services.length) {
      return;
    }

    setServices((prev) => {
      const next = buildPackageMatchedServices(prev, selectedPackageTemplate);
      return havePackageSelectionsChanged(prev, next) ? next : prev;
    });
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
        vehicleType: data.vehicleType || "",
        usageType: data.usageType || "point-to-point",
        passengerCapacity: data.passengerCapacity || 0,
        luggageCapacity: data.luggageCapacity || 0,
        price: data.rate,
        currency: normalizeCurrencyCode(data.currency || "INR"),
        exchangeRate: getExchangeRateForCurrency(data.currency || "INR", exchangeRates),
        priceInInr: convertAmountToInr(data.rate || 0, data.currency || "INR", exchangeRates),
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
        bedType: normalizeBedTypeValue(data.bedType) || "double",
      };

      const { data: response } = await API.post(`/ops/quotations/${quotationId}/services`, payload);

      const mappedServices = (response.services || []).map((s) => {
        const meta = getServiceMeta(s.type);
        const owner = resolveDmcOwner(s);
        return {
          id: s._id,
          serviceId: s.serviceId || "",
          dbServiceId: s._id,
          dmcId: owner.dmcId,
          dmcName: owner.dmcName,
          supplierId: s.supplierId || "",
          supplierName: s.supplierName || "",
          type: s.type,
          title: s.title,
          desc: s.description || "",
          city: s.city || "",
          country: s.country || "",
          vehicleType: s.vehicleType || "",
          usageType: s.usageType || "",
          passengerCapacity: s.passengerCapacity || 0,
          luggageCapacity: s.luggageCapacity || 0,
          rate: s.price || 0,
          currency: normalizeCurrencyCode(s.currency || "INR"),
          exchangeRate: Number(s.exchangeRate || 1),
          priceInInr: Number(s.priceInInr || 0),
          totalInInr: Number(s.totalInInr || 0),
          serviceDate: s.serviceDate || "",
          nights: s.nights || "",
          days: s.days || 1,
          pax: s.pax || 1,
          adults: s.adults || 0,
          children: s.children || 0,
          infants: s.infants || 0,
          rooms: s.rooms || 1,
          bedType: normalizeBedTypeValue(s.bedType) || "double",
          roomCategory: s.roomCategory || "Double",
          roomType: s.roomType || "",
          hotelCategory: s.hotelCategory || "",
          extraAdult: Boolean(s.extraAdult),
          childWithBed: Boolean(s.childWithBed),
          childWithoutBed: Boolean(s.childWithoutBed),
          awebRate: Number(s.awebRate || 0),
          cwebRate: Number(s.cwebRate || 0),
          cwoebRate: Number(s.cwoebRate || 0),
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
        `${data.title} has been added to this quotation.`
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

      await API.delete(`/ops/quotations/${quotationId}/services/${target.dbServiceId}`);

      setServices((prev) => prev.filter((s) => s.id !== id));
      showQuickActionFeedback(
        "delete",
        "Service Removed",
        `${target.title} has been removed from this quotation.`
      );
    } catch (error) {
      console.error("Failed to delete service", error);
      toast.error(error?.response?.data?.message || "Failed to delete service");
    }
  };

  const selectedServicesWithPricing = useMemo(
    () =>
      services
        .filter((service) => service.checked === true)
        .map((service) => {
          const currency = normalizeCurrencyCode(service.currency);
          const exchangeRate = getExchangeRateForCurrency(currency, exchangeRates);
          const originalTotal = calculateServiceOriginalTotal(service);
          const priceInInr = convertAmountToInr(
            Number(service.rate || 0),
            currency,
            exchangeRates,
          );
          const totalInInr = convertAmountToInr(
            originalTotal,
            currency,
            exchangeRates,
          );

          return {
            ...service,
            currency,
            exchangeRate,
            originalTotal,
            priceInInr,
            totalInInr,
            isForeignCurrency: currency !== "INR",
          };
        }),
    [exchangeRates, services],
  );

  const contractedRateFilterCounts = useMemo(
    () =>
      services.reduce(
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
    [services],
  );

  const filteredServices = useMemo(() => {
    const normalizedSearch = contractedRatesSearch.trim().toLowerCase();

    return services.filter((service) => {
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
  }, [contractedRatesFilter, contractedRatesSearch, services]);

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
  const packageTemplateAmount = roundCurrencyAmount(selectedPackageTemplate?.price || 0);

  const opsMarkupBasisAmount = servicesTotal + packageTemplateAmount;

  // OPS markup
  let opsMarkup = 0;

  if (marginType === "percentage") {
    opsMarkup = roundCurrencyAmount((opsMarkupBasisAmount * Number(markup || 0)) / 100);
  } else {
    opsMarkup = roundCurrencyAmount(fixedMargin || 0);
  }

  const taxableAmountForTaxes =
    opsMarkupBasisAmount + opsMarkup + serviceFeeAmount + handlingFeeAmount;
  const draftGstFinal = draftGstChecked
    ? roundCurrencyAmount((taxableAmountForTaxes * Number(draftGstPercent || 0)) / 100)
    : 0;

  const draftTcsFinal = draftTcsChecked
    ? roundCurrencyAmount((taxableAmountForTaxes * Number(draftTcsPercent || 0)) / 100)
    : 0;

  const draftTourismFinal = draftTourismChecked
    ? roundCurrencyAmount(draftTourismAmount || DEFAULT_TOURISM_AMOUNT)
    : 0;

  const draftTaxationTotal = roundCurrencyAmount(
    draftGstFinal + draftTcsFinal + draftTourismFinal,
  );

  useEffect(() => {
    const nextAppliedTaxTotal =
      (gstChecked ? Number(gstAmount || 0) : 0) +
      (tcsChecked ? Number(tcsAmount || 0) : 0) +
      (tourismChecked ? Number(tourismAmount || 0) : 0);

    setAppliedTaxTotal(roundCurrencyAmount(nextAppliedTaxTotal));
  }, [gstAmount, gstChecked, tcsAmount, tcsChecked, tourismAmount, tourismChecked]);

  // OPS charges
  const opsChargesTotal = roundCurrencyAmount(serviceFeeAmount + handlingFeeAmount);
  // markup amount (OPS charges + markup + tax)
  const markupAmount = roundCurrencyAmount(opsChargesTotal + opsMarkup + appliedTaxTotal);

  // total amount
  const totalAmount = roundCurrencyAmount(opsMarkupBasisAmount + markupAmount);
  const selectedServices = selectedServicesWithPricing;


  //=========================================== Api call ======================================

  const persistQuotationDraft = async () => {
    if (!quotationId) {
      throw new Error("Quotation draft not ready yet");
    }

    const payload = {
      queryId: order.queryId,
      validTill: validTill || formatDateInput(loadedQuotationDraft?.validTill),
      services: selectedServices.map((service) => buildDraftServicePayload(service)),
      pricing: {
        currency: "INR",
        quoteCategory,
        baseAmount: roundCurrencyAmount(baseRate || 0),
        subTotal: roundCurrencyAmount(servicesTotal || 0),
        packageTemplateAmount,
        totalAmount: roundCurrencyAmount(totalAmount || 0),
      },
      opsPercent: marginType === "percentage" ? Number(markup || 0) : 0,
      opsAmount: marginType === "fixed"
        ? roundCurrencyAmount(fixedMargin || 0)
        : roundCurrencyAmount(opsMarkup || 0),
      serviceCharge: roundCurrencyAmount(serviceCharge || 0),
      handlingFee: roundCurrencyAmount(handlingFee || 0),
      tax: {
        gstAmount: gstChecked ? roundCurrencyAmount(gstAmount || draftGstFinal || 0) : 0,
        gstPercent: gstChecked ? Number(gstPercent || 0) : 0,
        tcsAmount: tcsChecked ? roundCurrencyAmount(tcsAmount || draftTcsFinal || 0) : 0,
        tcsPercent: tcsChecked ? Number(tcsPercent || 0) : 0,
        tourismAmount: tourismChecked
          ? roundCurrencyAmount(tourismAmount || draftTourismFinal || 0)
          : 0,
      },
    };

    const { data } = await API.put(`/ops/quotations/${quotationId}/draft`, payload);
    if (data?.quotation) {
      setLoadedQuotationDraft(data.quotation);
    }

    return data?.quotation || null;
  };

  const sendQuotation = async (sendVia = []) => {
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

    const servicesWithoutDate = selectedServices.filter((service) => !service.serviceDate);
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

    const loadingToast = toast.loading("Sending quotation...");

    try {

      // 🔥 MAIN PAYLOAD
      const payload = {
        quotationId,
        queryId: order.queryId,
        validTill,
        baseAmount: baseRate,
        sendVia: sendVia,
        services: selectedServices.map(s => {
          const normalizedType = normalizeQuotationServiceType(s.type);

          return {
            serviceId: s.serviceId || (!s.custom ? s.id : undefined),
            dmcId: resolveDmcOwner(s).dmcId,
            dmcName: resolveDmcOwner(s).dmcName,
            supplierId: s.supplierId || "",
            supplierName: s.supplierName || "",
            type: normalizedType,
            title: s.title,

            city: s.city,
            country: s.country,
            description: s.desc,
            serviceDate: s.serviceDate,
            roomCategory: s.roomCategory || "",
            roomType: s.roomType || "",
            hotelCategory: s.hotelCategory || "",
            rooms: Number(s.rooms || 1),
            adults: Number(s.adults || 0),
            children: Number(s.children || 0),
            infants: Number(s.infants || 0),
            bedType: normalizeBedTypeValue(s.bedType),
            extraAdult: Boolean(s.extraAdult),
            childWithBed: Boolean(s.childWithBed),
            childWithoutBed: Boolean(s.childWithoutBed),
            awebRate: roundCurrencyAmount(s.awebRate || 0),
            cwebRate: roundCurrencyAmount(s.cwebRate || 0),
            cwoebRate: roundCurrencyAmount(s.cwoebRate || 0),

            // HOTEL
            nights: Number(s.nights || 0),

            // TRANSFER
            vehicleType: s.vehicleType,
            passengerCapacity: s.passengerCapacity,
            luggageCapacity: s.luggageCapacity,
            usageType: s.usageType,
            days: s.days || 1,

            // ACTIVITY / SIGHTSEEING
            pax: s.pax || 1,

            // PRICE
            currency: s.currency,
            exchangeRate: s.exchangeRate,
            price: roundCurrencyAmount(s.rate || 0),
            priceInInr: roundCurrencyAmount(s.priceInInr || 0),
            total: roundCurrencyAmount(s.originalTotal || 0),
            totalInInr: roundCurrencyAmount(s.totalInInr || 0),
          };
        }),

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
          totalAmount: roundCurrencyAmount(totalAmount)
        },

        opsPercent: marginType === "percentage" ? Number(markup || 0) : 0,
        opsAmount: marginType === "fixed"
          ? roundCurrencyAmount(fixedMargin || 0)
          : roundCurrencyAmount(opsMarkup || 0),
        // OPS + TAX
        serviceCharge: roundCurrencyAmount(serviceCharge || 0),
        handlingFee: roundCurrencyAmount(handlingFee || 0),
        tax: {
          gstAmount: gstChecked ? roundCurrencyAmount(gstAmount || draftGstFinal || 0) : 0,
          gstPercent: gstChecked ? Number(gstPercent || 0) : 0,
          tcsAmount: tcsChecked ? roundCurrencyAmount(tcsAmount || draftTcsFinal || 0) : 0,
          tcsPercent: tcsChecked ? Number(tcsPercent || 0) : 0,
          tourismAmount: roundCurrencyAmount(tourismAmount || draftTourismFinal || 0)
        }
      };

      console.log("🔥 FINAL PAYLOAD:", payload);

      // ✅ STEP 1: Create quotation
      const res = await API.post("/ops/quotations", payload);
      console.log("payload", res.data)

      toast.dismiss(loadingToast);
      toast.success("Quotation sent successfully");
      const savedQuotation = res?.data?.quotation;
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
      toast.error(error?.response?.data?.message || "Failed to prepare finance invoice");
    }
  };

  const handleFinalSend = () => {
    if (!selectedSendOption) {
      toast.error("Please select an option");
      return;
    }

    const map = {
      "Email": ["email"],
      "WhatsApp": ["whatsapp"],
      "Dashboard Notification": ["dashboard_notification"],
      "PDF Download": ["pdf"],
      "Copy Text": ["copy"]
    };

    sendQuotation(map[selectedSendOption]);

    // optional UX
    setShowSendOptions(false);
    setSelectedSendOption(null);
  };

  const tripDuration = useMemo(
    () => getTripDuration(order?.startDate, order?.endDate),
    [order?.startDate, order?.endDate]
  );
  const tripNights = tripDuration.nights;
  const queryRequirementTags = [
    order?.hotelCategory ? `${order.hotelCategory} Hotels` : null,
    order?.transportRequired ? "Transport Required" : null,
    order?.sightseeingRequired ? "Sightseeing Required" : null,
    order?.customerBudget ? `Budget ₹${Number(order.customerBudget).toLocaleString("en-IN")}` : null,
  ].filter(Boolean);


  const getRemainingHotelNights = (allServices, currentId) => {
    const usedByOtherHotels = allServices
      .filter((service) => service.type === "hotel" && service.checked && service.id !== currentId)
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

    const usedByPreviousHotels = Math.max(0, getHotelNightStart(allServices, currentId) - 1);

    return addDaysToDate(order.startDate, usedByPreviousHotels);
  };

  const getAvailableTransportDaysFromDate = (startDateValue) => {
    if (!startDateValue || !order?.endDate) return 1;

    const startDate = new Date(startDateValue);
    const tripEndDate = new Date(order.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(tripEndDate.getTime())) {
      return 1;
    }

    const diff = tripEndDate - startDate;
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const totalPassengers =
    Number(order?.numberOfAdults || 0) + Number(order?.numberOfChildren || 0);
  const costPerPassenger =
    totalPassengers > 0 ? totalAmount / totalPassengers : 0;

  const toggleService = (id) => {
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
            serviceDate: nextChecked
              ? service.serviceDate || formatDateInput(order?.startDate)
              : service.serviceDate,
          };
        }

        if (!nextChecked) {
          return { ...service, checked: false, nights: "" };
        }

        const remainingHotelNights = getRemainingHotelNights(prev, id);

        if (remainingHotelNights === 0) {
          toast.error("All trip nights are already assigned to other hotels.");
          return service;
        }

        return {
          ...service,
          checked: true,
          serviceDate:
            service.serviceDate || getHotelDefaultStartDate(prev, id),
          nights: "",
        };
      })
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
            return { ...service, nights: "" };
          }

          const safeNights = Math.min(selectedNights, remainingHotelNights);

          return { ...service, nights: safeNights > 0 ? safeNights : "" };
        }

        if (service.type === "hotel" && field === "serviceDate") {
          return { ...service, serviceDate: value };
        }

        if ((service.type === "transfer" || service.type === "car") && field === "days") {
          const availableTransportDays = getAvailableTransportDaysFromDate(
            service.serviceDate || formatDateInput(order?.startDate),
          );
          const safeDays = Math.min(Math.max(Number(value || 1), 1), availableTransportDays);
          return { ...service, days: safeDays };
        }

        if ((service.type === "transfer" || service.type === "car") && field === "serviceDate") {
          const availableTransportDays = getAvailableTransportDaysFromDate(value);
          const safeDays = Math.min(Math.max(Number(service.days || 1), 1), availableTransportDays);
          return { ...service, serviceDate: value, days: safeDays };
        }

        return { ...service, [field]: value };
      })
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

  const handleSelectedServiceEditAction = async (service) => {
    if (!service?.id) return;

    if (editingServiceCardId !== service.id) {
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
    } catch (error) {
      toast.dismiss(savingToast);
      console.error("Failed to save edited service", error);
      toast.error(error?.response?.data?.message || "Failed to save edited service");
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
  };


  return (
    <>
      <motion.section
        initial="hidden"
        animate="visible"
        variants={pageShellVariants}
        className="-m-3 min-h-[calc(100vh-24px)] overflow-x-hidden bg-black p-3 text-white font-sans sm:-m-4 sm:min-h-[calc(100vh-32px)] sm:p-4 lg:-m-5 lg:min-h-[calc(100vh-40px)] lg:p-5"
      >
        {/* Header */}
        <motion.div variants={sectionRevealVariants} className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-yellow-400 text-sm cursor-pointer"
          >
            ← Back to Order Acceptance
          </button>
          <div className="text-yellow-400 font-semibold">
            <p className="text-right text-[#90a1b9] text-xs">Query ID</p>
            <span className="font-bold">{order.queryId}</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div variants={sectionRevealVariants}>
          <h1 className="text-2xl font-bold">Quotation Builder</h1>
          <p className="text-gray-400 mb-6">
            Create a quote from contracted rates
          </p>
        </motion.div>

        {/* Layout */}
        <motion.div variants={sectionRevealVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* LEFT SIDE */}
          <motion.div variants={sideStackVariants} className="lg:col-span-2 space-y-6">

            {/* Query Info */}
            <motion.div variants={sectionRevealVariants} className="bg-[#0b0f19] rounded-2xl p-6 border border-yellow-500/50">
              <h2 className="text-md font-semibold text-white mb-6">
                Query Information
              </h2>

              <div className="grid grid-cols-2 gap-x-3 gap-y-4">

                {/* Agent Name */}
                <div>
                  <p className="text-gray-400 text-xs mb-1">Agent Name</p>
                  <p className="text-white text-xs font-medium">
                    {order?.agent?.companyName}
                  </p>
                </div>

                {/* Agent Email */}
                <div>
                  <p className="text-gray-400 text-xs mb-1">Agent Email</p>
                  <p className="text-white  text-xs font-medium">
                    {order?.agent?.email}
                  </p>
                </div>

                {/* Destination */}
                <div>
                  <p className="text-gray-400 text-xs mb-">Destination</p>
                  <p className="text-white  text-xs font-medium">
                    {order?.destination}
                  </p>
                </div>

                {/* Travel Date */}
                <div>
                  <p className="text-gray-400 text-xs mb-">Travel Date</p>
                  <p className="text-white  text-xs font-medium">
                    {new Date(order?.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Duration */}
                <div>
                  <p className="text-gray-400 text-xs">Duration</p>
                  <p className="text-white  text-xs font-medium">
                    {tripDuration.label}
                  </p>
                </div>

                {/* Passengers */}
                <div>
                  <p className="text-gray-400 text-xs">Passengers</p>
                  <p className="text-white  text-xs font-medium">
                    {order?.numberOfAdults + order?.numberOfChildren} PAX
                  </p>
                </div>

              </div>

              <div className="mt-5 rounded-2xl border border-[#232833] bg-[#0f1522] p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-yellow-400/80">
                      Query Requirements
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Click to view the request context before building the quote.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQueryRequirements((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-[11px] text-yellow-300 hover:bg-yellow-500/15 transition-colors cursor-pointer"
                  >
                    {showQueryRequirements ? "Hide Details" : "Show Details"}
                    {showQueryRequirements ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {showQueryRequirements && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, y: -8 }}
                      animate={{ height: "auto", opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -8 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4">
                        {queryRequirementTags.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {queryRequirementTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-3 py-1.5 rounded-full bg-[#141c2b] border border-[#293244] text-[11px] font-medium text-gray-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 mb-3">No structured requirements added.</p>
                        )}

                        <div className="rounded-2xl border border-dashed border-[#2a3448] bg-[#0c111b] px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 mb-2">
                            Special Preferences / Notes
                          </p>
                          {order?.specialRequirements ? (
                            <div className="flex flex-wrap gap-2">
                              {order.specialRequirements
                                .split(/[.,;\n]/)
                                .map((item) => item.trim())
                                .filter(Boolean)
                                .map((item, index) => (
                                  <span
                                    key={`${item}-${index}`}
                                    className="px-3 py-1.5 rounded-xl bg-[#111827] border border-[#2b3648] text-xs text-slate-200"
                                  >
                                    {item}
                                  </span>
                                ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">No special preferences shared for this query.</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div variants={sectionRevealVariants}>
              <PackageTemplate onApply={applyPackageToServices} />
            </motion.div>


            {/*=================================== Select Contracted Rates Service =============================== */}

            <motion.div variants={sectionRevealVariants} className="dark-scrollbar h-120 overflow-y-auto bg-black pr-1">
              <div className="sticky top-0 z-10 mb-3 bg-black p-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-semibold">
                      Select Contracted Rates
                    </h2>
                    <p className="max-w-2xl text-[8px] leading-6 text-slate-400">
                      Tune ops charges and tax values from one compact control desk before sharing the quotation.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowQuickServiceModal(true)}
                    className="text-xs bg-yellow-400 text-black px-3 py-2 rounded-lg hover:bg-yellow-500 font-medium cursor-pointer"
                  >
                    + Quick Add Service
                  </button>
                </div>

                <div className="mt-3 rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-3">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          value={contractedRatesSearch}
                          onChange={(e) => setContractedRatesSearch(e.target.value)}
                          placeholder="Search hotel, transport, activity or sightseeing"
                          className="w-full rounded-xl border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-xs text-white outline-none transition-colors focus:border-yellow-500"
                        />
                        {(contractedRatesSearch || contractedRatesFilter !== "all") && (
                          <button
                            type="button"
                            onClick={() => {
                              setContractedRatesSearch("");
                              setContractedRatesFilter("all");
                            }}
                            className="rounded-xl border border-[#2a2a2a] px-3 py-2 text-[11px] text-slate-300 transition-colors hover:border-yellow-500/50 hover:text-white cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500">
                        {filteredServices.length === services.length
                          ? `${services.length} services available`
                          : `Showing ${filteredServices.length} of ${services.length} services`}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {CONTRACTED_RATE_FILTER_OPTIONS.map((option) => {
                        const isActive = contractedRatesFilter === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setContractedRatesFilter(option.value)}
                            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${isActive
                              ? "border-yellow-500 bg-yellow-500/10 text-yellow-300"
                              : "border-[#2a2a2a] bg-[#111111] text-slate-300 hover:border-yellow-500/40 hover:text-white"
                              }`}
                          >
                            {option.label} ({contractedRateFilterCounts[option.value] || 0})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              {/* Service Card */}
              {filteredServices.length > 0 ? (
                filteredServices.map((service, index) => (
                  <Service
                    key={service.id}
                    index={index}
                    service={service}
                    cardDomId={getServiceCardDomId(service.id)}
                    isEditorFocused={focusedServiceCardId === service.id}
                    isEditMode={editingServiceCardId === service.id}
                    exchangeRates={exchangeRates}
                    toggleService={toggleService}
                    updateField={updateField}
                    deleteService={deleteService}
                    tripNights={tripNights}
                    remainingHotelNights={getRemainingHotelNights(services, service.id)}
                    hotelNightStart={getHotelNightStart(services, service.id)}
                    tripStartDate={formatDateInput(order?.startDate)}
                    tripEndDate={formatDateInput(order?.endDate)}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0b0b0b] px-4 py-8 text-center">
                  <p className="text-sm font-medium text-white">No contracted services found</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Try another hotel name or switch the service filter to see more results.
                  </p>
                </div>
              )}
            </motion.div>
            {/* Notes */}
            <motion.div variants={sectionRevealVariants} className="bg-[#0e0e0e] border border-gray-700 rounded-3xl p-4">
              <p className="text-gray-400 mb-2">Additional Notes (Optional)</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add special terms, inclusions, exclusions, or any important information for the agent..."
                className="w-full bg-black border border-gray-600 rounded-xl p-3 text-sm"
                rows={4}
              />
            </motion.div>
          </motion.div>

          {/*========================= RIGHT SIDE =================================================== */}

          <motion.div variants={sideStackVariants} className="space-y-6">
            {/*=========================== DMC Margin Section ============================= */}

            <motion.div variants={rightCardVariants} className="bg-[#1a1600] border border-yellow-500 rounded-xl p-6">
              {/* Title */}
              <h2 className="font-semibold mb-4 text-start flex items-center gap-2">
                OPS Margin
              </h2>

              {/* Margin Type */}
              <p className="text-sm text-gray-300 mb-1 text-start">
                Margin Type
              </p>

              <select
                value={marginType}
                onChange={(e) => setMarginType(e.target.value)}
                className="w-full bg-black border text-sm mt-1 border-yellow-500 rounded-2xl pl-4 p-2 mb-4 outline-none text-white cursor-pointer"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>

              {/*========================================= Markup Percentage Section ================================ */}

              <p className="text-sm text-gray-300 mb-2 text-start">
                {marginType === "percentage"
                  ? "Markup Percentage"
                  : "Fixed Margin"}
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={marginType === "percentage" ? markup : fixedMargin}
                  onChange={(e) =>
                    marginType === "percentage"
                      ? setMarkup(e.target.value)
                      : setFixedMargin(roundCurrencyAmount(e.target.value))
                  }
                  className="w-full bg-black border border-yellow-500 text-sm font-bold rounded-2xl text-start pl-5 p-2 outline-none"
                />

                <span className="text-yellow-400 text-lg">
                  {marginType === "percentage" ? "%" : "₹"}
                </span>
              </div>
            </motion.div>

            {/* ==================================== Price Breakdown Section ============================================ */}

            <motion.div variants={rightCardVariants} className="bg-[#0e0e0e] border border-gray-700 rounded-xl p-4 border ">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[13px] font-semibold text-white">Selected Services</h2>
                  <p className="mt-1 max-w-[190px] text-[8px] leading-relaxed text-slate-400">
                    All checked services are listed here for quick edit or delete.
                  </p>
                </div>
                <div className="flex min-w-[80px] items-center justify-center gap-1 rounded-[28px] border border-yellow-500/40 bg-[#2a2208] px-1 py-1.5 text-center text-yellow-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <span className="text-[10px] font-semibold leading-none">
                    {selectedServices.length}
                  </span>
                  <span className="text-[10px] font-semibold leading-none">
                    selected
                  </span>
                </div>
              </div>

              {selectedServices.length > 0 ? (
                <div className="dark-scrollbar mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
                  {selectedServices.map((service) => (
                    <div
                      key={`selected-${service.id}`}
                      className="rounded-[28px] border border-[#22314a] bg-[#050505] p-3.5"
                    >
                      <div className="rounded-[22px] border border-[#162233] bg-[#08111c] px-3 py-3">
                        <div className="grid grid-cols-[40px,minmax(0,1fr),auto] gap-x-3 gap-y-2.5">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center self-start rounded-full border border-[#27436d] bg-[#0b1627] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            {renderSelectedServiceSummaryIcon(service)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate pr-2 pt-0.5 text-[14px] font-semibold leading-tight text-white">
                              {service.title}
                            </p>
                          </div>

                          <div className="pt-0.5 text-right ">
                            <p className="whitespace-nowrap text-[12px] font-semibold text-yellow-300">
                              {formatCurrencyValue(service.originalTotal || 0, service.currency)}
                            </p>
                            {service.isForeignCurrency && (
                              <p className="mt-1 text-[10px] text-sky-300">
                                INR {formatAmountValue(service.totalInInr || 0)}
                              </p>
                            )}
                          </div>

                          <div className="col-start-2 col-end-4 mt-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="flex items-center gap-1.5 rounded-[8px] bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold text-indigo-200 border border-indigo-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                {getServiceTypeLabel(service.type)}
                              </span>

                              {(service.city || service.country) && (
                                <div className="flex items-center gap-1.5 rounded-[8px] bg-[#111823] px-2.5 py-1 text-[10px] font-medium text-slate-300 border border-[#212f45]">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                  <span className="truncate max-w-[130px]">
                                    {service.city}
                                    {service.city && service.country ? ", " : ""}
                                    {service.country}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 rounded-[8px] bg-[#111823] px-2.5 py-1 text-[10px] font-medium text-slate-300 border border-[#212f45]">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                <span>{formatServiceDateLabel(service.serviceDate)}</span>
                              </div>

                              {service.type === "hotel" && Number(service.nights || 0) > 0 && (
                                <div className="flex items-center gap-1.5 rounded-[8px] bg-[#111823] px-2.5 py-1 text-[10px] font-medium text-slate-300 border border-[#212f45]">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
                                  <span>{service.nights} nights</span>
                                </div>
                              )}
                              {(service.type === "transfer" || service.type === "car") && Number(service.days || 0) > 0 && (
                                <div className="flex items-center gap-1.5 rounded-[8px] bg-[#111823] px-2.5 py-1 text-[10px] font-medium text-slate-300 border border-[#212f45]">
                                  <span>{service.days} day{Number(service.days || 0) > 1 ? "s" : ""}</span>
                                </div>
                              )}
                              {service.type === "activity" && Number(service.pax || 0) > 0 && (
                                <div className="flex items-center gap-1.5 rounded-[8px] bg-[#111823] px-2.5 py-1 text-[10px] font-medium text-slate-300 border border-[#212f45]">
                                  <span>{service.pax} pax</span>
                                </div>
                              )}
                              {service.type === "sightseeing" && (
                                <>
                                  {Number(service.pax || 0) > 0 && (
                                    <div className="flex items-center gap-1.5 rounded-[8px] bg-[#111823] px-2.5 py-1 text-[10px] font-medium text-slate-300 border border-[#212f45]">
                                      <span>{service.pax} pax</span>
                                    </div>
                                  )}
                                  {Number(service.days || 0) > 0 && (
                                    <div className="flex items-center gap-1.5 rounded-[8px] bg-[#111823] px-2.5 py-1 text-[10px] font-medium text-slate-300 border border-[#212f45]">
                                      <span>{service.days} day{Number(service.days || 0) > 1 ? "s" : ""}</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 px-.5">
                        <p className="text-[11px] font-medium text-slate-200">Quick Actions</p> 
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectedServiceEditAction(service)}
                            className="rounded-xl border border-sky-400/35 bg-sky-500/10 px-4 py-1.5 text-[11px] font-medium text-sky-200 transition hover:border-sky-300/50 hover:bg-sky-500/15 cursor-pointer"
                          >
                            {editingServiceCardId === service.id ? "Save" : "Edit"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectedServiceDelete(service)}
                            className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-1.5 text-[11px] font-medium text-red-200 transition hover:border-red-300/50 hover:bg-red-500/15 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[#28303d] bg-[#090909] px-4 py-6 text-center">
                  <p className="text-sm font-medium text-white">No services selected yet</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Pick services from the left panel and they will appear here automatically.
                  </p>
                </div>
              )}
            </motion.div>

            <motion.div variants={rightCardVariants} className="bg-[#0e0e0e] border border-gray-700 rounded-xl p-4 text-sm space-y-4">
              <div className="flex  gap-3">
                <h2 className="font-semibold mb-2">Price Breakdown</h2>

                <button
                  onClick={openOpsChargesPopup}
                  className="text-xs bg-yellow-400 text-black px-3 py-1 rounded-lg hover:bg-yellow-500 font-medium cursor-pointer"
                >
                  + OPS Charges
                </button>
              </div>
              <p className="flex justify-between border-b border-[#232426] ">
                <span className="text-[#90A1B9] mb-2">Selected Items</span>
                <span>{selectedServices.length} items</span>
              </p>
              {/* <p className="flex justify-between">
                <span className="text-[#90A1B9]">Subtotal (Base Rates)</span>
                <span>₹{baseRate}</span>
              </p> */}
              <p className="flex justify-between">
                <span className="text-[#90A1B9]">
                  OPS Markup (
                  {marginType === "percentage"
                    ? `${markup}%`
                    : `INR ${formatAmountValue(fixedMargin)}`}
                  )
                </span>
                <span className="text-yellow-400">
                  INR {formatAmountValue(opsMarkup)}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#90A1B9]">
                  Taxes (GST + TCS + Other)
                </span>
                <span
                  className={`${appliedTaxTotal > 0 ? "text-green-400" : "text-red-400"}`}>
                  INR {formatAmountValue(appliedTaxTotal)}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#90A1B9]">Services Total</span>
                <span className={`${servicesTotal > 0 ? "text-sky-500" : "text-red-400"}`}>INR {formatAmountValue(servicesTotal)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#90A1B9]">Package Template Add-on</span>
                <span className={`${packageTemplateAmount > 0 ? "text-emerald-400" : "text-gray-500"}`}>
                  INR {formatAmountValue(packageTemplateAmount)}
                </span>
              </p>
              {shouldShowDualPricing && (
                <div className="rounded-xl border border-[#20262f] bg-black/30 px-3 py-3 text-xs">
                  <p className="font-medium text-slate-200">Foreign Currency Snapshot</p>
                  <div className="mt-2 space-y-2">
                    {foreignCurrencyBreakdown.map((item) => (
                      <div
                        key={item.currency}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#1d2430] bg-[#0a0f16] px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-slate-100">
                            {formatCurrencyValue(item.originalTotal, item.currency)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            1 {item.currency} = INR {formatExchangeRateValue(item.exchangeRate)}
                          </p>
                        </div>
                        <span className="text-sky-300">
                          INR {formatAmountValue(item.inrTotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {shouldShowDualPricing && (
                <div className="rounded-xl border border-[#20262f] bg-black/30 px-3 py-3 text-xs">
                  <p className="font-medium text-slate-200">FX to INR</p>
                  <div className="mt-2 space-y-2">
                    {foreignCurrencyBreakdown.map((item) => (
                      <label
                        key={`${item.currency}-fx`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#1d2430] bg-[#0a0f16] px-3 py-2"
                      >
                        <span className="text-slate-300">1 {item.currency}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">=</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={exchangeRates[item.currency] ?? item.exchangeRate}
                            onChange={(e) =>
                              setExchangeRates((prev) => ({
                                ...prev,
                                [item.currency]: Number(e.target.value || 0),
                              }))
                            }
                            className="w-24 rounded-lg border border-[#374151] bg-[#050505] px-2 py-1.5 text-right text-white outline-none focus:border-yellow-400"
                          />
                          <span className="text-slate-400">INR</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold mt-4  border-t border-t-yellow-400 ">
                <span className="mt-1.5">Total Amount</span>
                <span className="text-yellow-400 mt-1.5">
                  INR {formatAmountValue(totalAmount)}
                </span>
              </div>
              <p className="flex justify-between text-gray-400">
                <span>Cost per Passenger</span>
                <span>INR {formatAmountValue(costPerPassenger)}</span>
              </p>
            </motion.div>

            {/*============================================ Buttons Finalize Button ==================================  */}
            <motion.div variants={rightCardVariants} className="relative w-full">
              {isInvoiceRequestedStage ? (
                <button
                  onClick={generateFinalInvoice}
                  className="w-full bg-yellow-400 text-black text-md py-2 rounded-xl font-semibold hover:bg-yellow-500 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send />
                  Prepare Finance Invoice
                </button>
              ) : (
                <button
                  onClick={() => setShowSendOptions(!showSendOptions)}
                  className="w-full bg-yellow-400 text-black text-md py-2 rounded-xl font-semibold hover:bg-yellow-500 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send />
                  Finalize & Send Quote
                </button>
              )}

              {/*======================== POPUp Send To =================================================== */}
              {/* Popup */}
              <div
                className={`absolute bottom-full mb-3 right-0 w-69 backdrop-blur-xl
      bg-linear-to-br from-[#8787875e] to-[#11111113] border border-gray-700/60
      rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden z-50
      transform transition-all duration-300 ease-out origin-bottom-right
      ${!isInvoiceRequestedStage && showSendOptions ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 translate-y-2 pointer-events-none"
                  }`}
              >
                {/** Header Info */}
                <div className="px-5 py-3 border-b border-gray-700/60">
                  <p className="text-sm text-gray-400">Agent: {order?.agent?.companyName}</p>
                  <p className="text-xs text-gray-500">Email: {order?.agent?.email}</p>
                  <p className="text-xs text-gray-500">
                    Selected Services: {services.filter(s => s.checked).length}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total Amount: INR {formatAmountValue(totalAmount)}
                  </p>
                </div>

                {/** Options */}
                {["Dashboard Notification", "Email", "WhatsApp", "PDF Download", "Copy Text"].map((option, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedSendOption(option)}
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer border-b
  ${selectedSendOption === option ? "bg-yellow-400/20" : "hover:bg-white/5"}`}
                  >
                    <span className="text-lg">
                      {option === "Email" ? "📧" :
                        option === "WhatsApp" ? "💬" :
                          option === "PDF Download" ? "⬇" :
                            option === "Copy Text" ? "📋" : "🔔"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{option}</p>
                      <p className="text-xs text-gray-400">
                        {option === "Email" ? `Send to ${order?.agent?.email}` : ""}
                        {option === "WhatsApp" ? "Direct message link" : ""}
                        {option === "PDF Download" ? "Formatted quote document" : ""}
                        {option === "Copy Text" ? "Plain text format" : ""}
                        {option === "Dashboard Notification" ? "In-app alert to agent" : ""}
                      </p>

                    </div>
                  </div>
                ))}

                <button
                  onClick={() => handleFinalSend()}
                  className="w-full bg-yellow-400 text-black py-2 font-semibold cursor-pointer"
                >
                  Send Now
                </button>
              </div>
            </motion.div>

            <motion.button variants={rightCardVariants} className="w-full bg-white py-2 text-md font-semibold text-gray-600 rounded-xl hover:text-gray-600 cursor-pointer">
              Save as Draft
            </motion.button>

            {/* Footer Note */}
            <motion.p variants={rightCardVariants} className="text-xs border p-5 rounded-2xl text-[#8EC5FF] bg-[#2B7FFF1A]">
              {isInvoiceRequestedStage
                ? `Note: Client approval is already received for ${order?.queryId}. Prepare the finance invoice from here and finance will share the final invoice with the agent.`
                : `Note: The quotation will be sent to ${order?.agent?.email || "agent email"}. Once the agent uploads the payment receipt, you can track the verification status in the Booking Hub.`}
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/*======================== ✅ POPUP Ops Charges =============================================*/}

      {showOpsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#050505]/78 p-3 backdrop-blur-[6px] sm:p-4">
          <div className="relative my-auto flex max-h-[calc(100vh-24px)] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-yellow-500/25 bg-[#101010]/95 shadow-[0_28px_120px_rgba(0,0,0,0.65)] animate-slideDown sm:max-h-[calc(100vh-32px)]">
            {/* Header */}
            <div className="relative overflow-hidden border-b border-[#2a2a2a] bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.16),_transparent_38%),linear-gradient(135deg,#171717_0%,#101010_65%,#0b0b0b_100%)] px-5 py-5 sm:px-6">
              <div className="absolute inset-y-0 right-0 w-48 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.16),_transparent_68%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-yellow-300/80">
                    Premium Controls
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                    Charges & Taxation
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                    Tune ops charges and tax values from one compact control desk before sharing the quotation.
                  </p>
                </div>

                <button
                  onClick={() => setShowOpsPopup(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="relative mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Ops Charges
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    INR {formatAmountValue(
                      roundCurrencyAmount(Number(draftServiceCharge || 0) + Number(draftHandlingFee || 0)),
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Service + handling setup</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Tax Preview
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    INR {formatAmountValue(draftTaxationTotal)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Live GST, TCS and tourism total</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Quote Validity
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {draftValidTill || "Not set"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Applied to the current quotation</p>
                </div>
              </div>
            </div>

            <div className="dark-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {/* 2 Column Layout */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                {/*========================= OPS CHARGES ========================================= */}

                <div className="rounded-[24px] border border-[#2d3238] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-300/75">
                        Classic Desk
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">OPS Charges</h3>
                    </div>
                    <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-[11px] font-medium text-yellow-200">
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
                        setDraftServiceCharge(roundCurrencyAmount(e.target.value))
                      }
                      className="mt-2 w-full rounded-2xl border border-[#31363f] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-yellow-400 focus:bg-[#111]"
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
                      className="mt-2 w-full rounded-2xl border border-[#31363f] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-yellow-400 focus:bg-[#111]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Valid Till</label>
                    <input
                      type="date"
                      value={draftValidTill}
                      onChange={(e) => setDraftValidTill(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[#31363f] bg-[#0d0d0d] px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-yellow-400 focus:bg-[#111] [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-[3] [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]"
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/6 bg-black/20 px-4 py-3 text-xs leading-5 text-slate-400">
                    These charges stay outside the service cards and shape the final commercial quote only.
                  </div>
                </div>

                {/*============================== TAXATION CHARGES ===========================*/}

                <div className="rounded-[24px] border border-[#2d3238] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/70">
                        Tax Console
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">Taxation</h3>
                      <p className="mt-1 text-[11px] leading-5 text-slate-400">
                        Auto se default taxes enable ho jayenge, aur manual mode me aap har value edit kar sakte ho.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={applyAutoTaxPreset}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${taxSetupMode === "auto"
                          ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                          : "border border-[#3a4456] bg-black/20 text-slate-300 hover:border-emerald-400/30 hover:text-emerald-200"
                          }`}
                      >
                        Auto Taxes
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaxSetupMode("manual")}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${taxSetupMode === "manual"
                          ? "border border-yellow-400/40 bg-yellow-500/12 text-yellow-200"
                          : "border border-[#3a4456] bg-black/20 text-slate-300 hover:border-yellow-400/30 hover:text-yellow-200"
                          }`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>

                  {/* GST */}
                  <div className="mb-3 flex flex-col justify-between rounded-2xl border border-[#31363f] bg-[#171717] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-100">
                        <input
                          type="checkbox"
                          checked={draftGstChecked}
                          onChange={() => {
                            setTaxSetupMode("manual");
                            setDraftGstChecked(!draftGstChecked);
                          }}
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
                          className="w-18 rounded-2xl border border-[#434a57] bg-black px-3 py-2 text-center text-xs text-white outline-none"
                        />
                        <span className="text-blue-400 text-xs">%</span>
                      </div>
                    </div>
                    <p className="mt-2 flex items-center justify-between gap-3 text-[11px] leading-5 text-slate-400">
                      <span>GST amount will be calculated from the taxable quotation value.</span>
                      <span className="text-emerald-300">INR {formatAmountValue(draftGstFinal)}</span>
                    </p>
                  </div>

                  {/*============================== TCS Charges ====================================== */}

                  <div className="mb-3 flex flex-col justify-between rounded-2xl border border-[#31363f] bg-[#171717] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-100">
                        <input
                          type="checkbox"
                          checked={draftTcsChecked}
                          onChange={() => {
                            setTaxSetupMode("manual");
                            setDraftTcsChecked(!draftTcsChecked);
                          }}
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
                          className="w-18 rounded-2xl border border-[#434a57] bg-black px-3 py-2 text-center text-xs text-white outline-none"
                        />
                        <span className="text-blue-400 text-xs">%</span>
                      </div>
                    </div>

                    <p className="mt-2 flex items-center justify-between gap-3 text-[11px] leading-5 text-slate-400">
                      <span>TCS amount will be calculated from the taxable quotation value.</span>
                      <span className="text-emerald-300">INR {formatAmountValue(draftTcsFinal)}</span>
                    </p>
                  </div>

                  {/*================================== Tourism Fees ============================================ */}

                  <div className="mb-3 flex flex-col justify-end rounded-2xl border border-[#31363f] bg-[#171717] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-100">
                        <input
                          type="checkbox"
                          checked={draftTourismChecked}
                          onChange={() => {
                            setTaxSetupMode("manual");
                            setDraftTourismChecked(!draftTourismChecked);
                          }}
                        />
                        Tourism Development Fee
                      </label>
                      <span className="text-blue-400 text-sm">₹{DEFAULT_TOURISM_AMOUNT}</span>
                    </div>

                    {draftTourismChecked && (
                      <input
                        type="number"
                        value={draftTourismAmount}
                        onChange={(e) => {
                          setTaxSetupMode("manual");
                          setDraftTourismAmount(roundCurrencyAmount(e.target.value || 0));
                        }}
                        className="mt-3 w-full rounded-2xl border border-[#31363f] bg-black px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-yellow-400 outline-none"
                      />
                    )}
                  </div>

                  {/*========================== Total Tax ============================================*/}

                  <div className="mt-4 flex justify-between rounded-2xl border border-white/6 bg-black/25 px-4 py-3">
                    <span className="text-sm font-medium text-slate-300">
                      Total Tax Amount
                    </span>
                    <span className="text-lg font-semibold text-white">
                      ₹{formatAmountValue(draftTaxationTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2a2a2a] bg-black/20 px-5 py-4 sm:px-6">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Quote control panel
              </p>
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => setShowOpsPopup(false)}
                  className="px-4 py-2 text-sm border border-[#404654] rounded-full text-gray-300 hover:bg-gray-800 cursor-pointer"
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
                  className="px-5 py-2 text-sm bg-yellow-400 text-black rounded-full font-semibold hover:bg-yellow-500 cursor-pointer shadow-[0_12px_30px_rgba(250,204,21,0.18)]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*======================== ✅ POPUP Success final Charges =============================================*/}
      {successPopup.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">

          <div className="bg-[#111] border border-yellow-500/40 rounded-2xl p-6 w-100 text-center shadow-2xl animate-scaleIn">

            {/* ICON */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center text-black text-3xl">
                ✓
              </div>
            </div>

            {/* TITLE */}
            <h2 className="text-xl font-semibold text-white mb-2">
              {successPopup.kind === "invoice" ? "Finance Invoice Prepared" : "Quotation Sent Successfully"}
            </h2>

            {/* SUBTEXT */}
            <p className="text-gray-400 text-sm mb-4">
              {successPopup.kind === "invoice"
                ? "The approved quotation has been converted into a finance-ready invoice. Finance team will share the final invoice with the agent."
                : "Your quotation has been delivered to the agent via selected channels."}
            </p>

            {/* DETAILS */}
            <div className="bg-[#1a1a1a] rounded-xl p-3 text-left text-xs mb-4">
              {successPopup.kind === "invoice" && (
                <p className="flex justify-between">
                  <span className="text-gray-400">Invoice Number</span>
                  <span className="text-white">{successPopup.invoiceNumber || "-"}</span>
                </p>
              )}
              <p className="flex justify-between">
                <span className="text-gray-400">Agent</span>
                <span className="text-white">
                  {successPopup.agentName ||
                    order?.agent?.companyName ||
                    order?.agent?.name ||
                    "-"}
                </span>
              </p>

              <p className="flex justify-between mt-1">
                <span className="text-gray-400">Total Amount</span>
                <span className="text-yellow-400">INR {formatAmountValue(successPopup.totalAmount || 0)}</span>
              </p>

              <p className="flex justify-between mt-1">
                <span className="text-gray-400">Services</span>
                <span className="text-white">{successPopup.serviceCount}</span>
              </p>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={() => setSuccessPopup((prev) => ({ ...prev, open: false }))}
                className="w-full bg-gray-800 text-white py-2 rounded-xl hover:bg-gray-700"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setSuccessPopup((prev) => ({ ...prev, open: false }));
                  navigate(successPopup.kind === "invoice" ? "/ops/bookings-management" : "/ops/dashboard");
                }}
                className="w-full bg-yellow-400 text-black py-2 rounded-xl font-semibold hover:bg-yellow-500"
              >
                {successPopup.kind === "invoice" ? "Go to Booking Hub" : "Go to Dashboard"}
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
            <div className="min-w-[280px] max-w-[320px] rounded-2xl border border-yellow-500/25 bg-[#111111]/95 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${quickActionPopup.type === "delete"
                    ? "bg-red-500/12 text-red-300"
                    : "bg-emerald-500/12 text-emerald-300"
                    }`}
                >
                  {quickActionPopup.type === "delete" ? (
                    <Trash2 size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">
                    {quickActionPopup.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
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

/*=======================   ====== Select Contracted Rates =======================================*/

/*
  ─────────────────────────────────────────────────────────────
  Service.jsx  —  Drop-in replacement for the <Service> block
  inside QuotationBuilder.jsx

  HOW TO USE:
    1. Delete the old `const Service = ({ ... }) => { ... }` block
       at the bottom of QuotationBuilder.jsx
    2. Paste this entire file's content in its place
       (or import it and use <Service ... /> as before)
  ─────────────────────────────────────────────────────────────
*/

const Service = ({
  index = 0,
  service,
  cardDomId,
  isEditorFocused = false,
  isEditMode = false,
  exchangeRates,
  toggleService,
  updateField,
  deleteService,
  tripNights,
  remainingHotelNights,
  hotelNightStart,
  tripStartDate,
  tripEndDate,
}) => {
  const currencyCode = normalizeCurrencyCode(service.currency);
  const exchangeRate = getExchangeRateForCurrency(currencyCode, exchangeRates);
  const total = calculateServiceOriginalTotal(service);
  const totalInInr = convertAmountToInr(total, currencyCode, exchangeRates);
  const baseRateInInr = convertAmountToInr(service.rate || 0, currencyCode, exchangeRates);
  const isForeignCurrency = currencyCode !== "INR";

  const getHotelStars = (category) => {
    if (!category) return 3;
    const value = category.toString().toLowerCase().trim();
    const match = value.match(/\d/);
    if (match) return Number(match[0]);
    if (value.includes("luxury") || value.includes("premium")) return 5;
    if (value.includes("deluxe")) return 4;
    if (value.includes("standard")) return 3;
    if (value.includes("budget")) return 2;
    return 3;
  };

  const formatUsage = (val) => {
    if (!val) return "";
    return val.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const amenities = (service.desc || "")
    .split(/,|\||\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  /* ── shared micro-styles ── */
  const selectCls =
    "bg-[#0a0a0a] border border-[#2a2a2a] hover:border-yellow-600/50 text-white text-[11px] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer transition-colors focus:border-yellow-500";

  const inputCls =
    "bg-[#0a0a0a] border border-[#2a2a2a] hover:border-yellow-600/50 text-white text-[11px] rounded-lg px-2.5 py-1.5 w-20 outline-none transition-colors focus:border-yellow-500";

  const priceInputCls =
    "mt-2 w-full rounded-lg border border-[#343434] bg-[#111] px-3 py-2 text-[11px] text-white outline-none transition-colors focus:border-yellow-500";

  const dateCls =
    "w-full bg-[#111] border border-[#343434] hover:border-yellow-600/60 text-white text-[11px] rounded-lg px-3 py-2.5 pr-9 outline-none transition-colors focus:border-yellow-500 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

  const openDatePicker = (event) => {
    const input = event.currentTarget
      ?.closest?.("[data-date-picker-wrapper='true']")
      ?.querySelector?.("input[type='date']");

    if (!input) return;

    input.focus();
    input.showPicker?.();
    input.click();
  };

  /* helpers for transport */
  const calculateTripDayCountFromDate = (startDate, endDate) => {
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s) || isNaN(e)) return 1;
    return Math.max(1, Math.ceil((e - s) / 86400000));
  };

  const addDaysToServiceDate = (value, daysToAdd = 0) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return "";
    d.setDate(d.getDate() + Number(daysToAdd));
    return d.toISOString().slice(0, 10);
  };

  const formatDisplayDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return value;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const transportStartDate = service.serviceDate || tripStartDate || "";
  const maxTransportDays = Math.max(1, calculateTripDayCountFromDate(transportStartDate, tripEndDate));
  const selectedTransportDays = Math.min(Math.max(Number(service.days || 1), 1), maxTransportDays);
  const transportEndDate =
    transportStartDate && selectedTransportDays > 0
      ? addDaysToServiceDate(transportStartDate, selectedTransportDays - 1)
      : "";

  const getNightOptionLabel = (count) => {
    const startNight = Number(hotelNightStart || 1);
    const totalTripNights = Number(tripNights || 0);
    const endNight = totalTripNights
      ? Math.min(totalTripNights, startNight + count - 1)
      : startNight + count - 1;
    if (!totalTripNights) return `${count} Night${count > 1 ? "s" : ""}`;
    const slotLabel =
      count === 1 || startNight === endNight
        ? `Night ${startNight}`
        : `Night ${startNight}–${endNight}`;
    return `${count} Night${count > 1 ? "s" : ""} (${slotLabel})`;
  };

  const selectedNightCount = Number(service.nights || 0);
  const selectedNightEnd =
    selectedNightCount > 0
      ? Math.min(Number(tripNights || 0), Number(hotelNightStart || 1) + selectedNightCount - 1)
      : 0;

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <motion.div
      id={cardDomId}
      custom={index}
      initial="hidden"
      animate="visible"
      variants={serviceCardVariants}
      className={`scroll-mt-28 mb-3 rounded-2xl border transition-all duration-200 overflow-hidden
        ${isEditorFocused ? "ring-2 ring-sky-400/60 ring-offset-2 ring-offset-black" : ""}
        ${service.checked
          ? "border-yellow-500/50 bg-[#0d0b00]"
          : "border-[#1f1f1f] bg-[#0b0b0b] hover:border-[#2a2a2a]"
        }`}
    >
      {/* ── TOP ACCENT ── */}
      {service.checked && (
        <div className="h-[1.5px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
      )}

      {/* ════════════════════════════════════════════
          SECTION 1 — HEADER  (identity + status)
      ════════════════════════════════════════════ */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {/* checkbox */}
        <input
          type="checkbox"
          checked={service.checked}
          onChange={() => toggleService(service.id)}
          className="accent-yellow-400 mt-1 h-3.5 w-3.5 flex-shrink-0 cursor-pointer"
        />

        {/* icon */}
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-lg
          ${service.checked ? "border-yellow-500/20 bg-yellow-500/10" : "border-[#222] bg-[#161616]"}`}>
          <span className={service.color || "text-gray-400"}>{service.icon || "🏨"}</span>
        </div>

        {/* title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-semibold text-white leading-tight">{service.title}</p>

            {/* status badge */}
            {service.checked ? (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">
                ✓ Added to Quote
              </span>
            ) : (
              <span className="rounded-full border border-slate-600/30 bg-slate-700/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Not Selected
              </span>
            )}

            {isEditMode && service.checked && (
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sky-300">
                ✎ Editing
              </span>
            )}
            {service.custom && (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black">
                Custom
              </span>
            )}
          </div>

          {/* location + stars */}
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-slate-300">
              <ImLocation2 className="text-emerald-400" />
              {[service.city, service.country].filter(Boolean).join(", ")}
            </span>
            {service.hotelCategory && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="text-slate-200">Hotel</span>
                <span className="flex items-center gap-0.5 ml-0.5">
                  {Array.from({ length: getHotelStars(service.hotelCategory) }).map((_, i) => (
                    <IoStarSharp key={i} className="text-yellow-400 text-[9px]" />
                  ))}
                </span>
              </span>
            )}
            {/* transport tags */}
            {service.type === "transfer" && (
              <>
                {service.vehicleType && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <FaCarSide className="text-yellow-400" />{service.vehicleType}
                  </span>
                )}
                {service.usageType && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <MdOutlineTravelExplore className="text-blue-400" />{formatUsage(service.usageType)}
                  </span>
                )}
                {service.passengerCapacity > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <BsPeople className="text-emerald-400" />{service.passengerCapacity} pax
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* right: total price (always visible when checked) */}
        {service.checked && (
          <div className="flex-shrink-0 text-right ml-2">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Total</p>
            <p className="text-[15px] font-semibold text-white leading-none">
              {formatCurrencyValue(total, currencyCode)}
            </p>
            {isForeignCurrency && (
              <p className="mt-1 text-[10px] text-sky-300">
                INR {formatAmountValue(totalInInr)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════
          SECTION 2 — AMENITY PILLS
      ════════════════════════════════════════════ */}
      {amenities.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {amenities.map((item, i) => (
              <span key={i} className="rounded-md border border-[#232323] bg-[#141414] px-2 py-0.5 text-[10px] text-slate-300">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          SECTION 3 — SERVICE CONTROLS
          (only shown when service is checked)
      ════════════════════════════════════════════ */}
      {service.checked && (
        <div className="space-y-3 border-t border-[#1a1a1a] bg-[#080800] px-4 py-4">

          {/* ── label row ── */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-400/70">
              Configuration
            </p>
            {service.custom && (
              <button
                onClick={() => deleteService(service.id)}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/8 px-2.5 py-1 text-[10px] font-medium text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
              >
                <RiDeleteBin6Line className="text-[11px]" /> Remove
              </button>
            )}
          </div>

          {/* ── BASE RATE ── */}
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)]">
            <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1">Base Rate</p>
              <p className="text-[13px] font-semibold text-yellow-400">
                {formatCurrencyValue(service.rate || 0, currencyCode)}
              </p>
              {isForeignCurrency && (
                <>
                  <p className="text-[10px] text-sky-300 mt-0.5">
                    INR {formatAmountValue(baseRateInInr)}
                  </p>
                  <div className="mt-2 inline-flex items-center rounded-lg border border-sky-500/20 bg-sky-500/8 px-2.5 py-1 text-[10px] text-slate-200">
                    1 {currencyCode} = <span className="ml-1 font-medium text-sky-300">INR {formatExchangeRateValue(exchangeRate)}</span>
                  </div>
                </>
              )}
              {isEditMode && (
                <div className="mt-2">
                  <label className="text-[9px] text-slate-500">Edit rate ({currencyCode})</label>
                  <input
                    type="number"
                    min="0"
                    value={service.rate || 0}
                    onChange={(e) => updateField(service.id, "rate", Math.max(0, Number(e.target.value || 0)))}
                    className={priceInputCls}
                  />
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Service Date</p>
              <div className="relative" data-date-picker-wrapper="true">
                <input
                  type="date"
                  value={service.serviceDate || ""}
                  onChange={(e) => updateField(service.id, "serviceDate", e.target.value)}
                  tabIndex={-1}
                  className={`${dateCls} pointer-events-none w-full`}
                />
                <button
                  type="button"
                  onClick={openDatePicker}
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/5 hover:text-white"
                  aria-label="Open service date picker"
                >
                  <CalendarDays size={14} />
                </button>
              </div>
            </div>

            {isForeignCurrency && (
              <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-2.5 flex items-center">
                <p className="text-[11px] text-slate-300">
                  1 {currencyCode} = <span className="text-sky-300 font-medium">INR {formatExchangeRateValue(exchangeRate)}</span>
                </p>
              </div>
            )}
          </div>

          {/* ── DATE ── */}
          <div className="hidden rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-2.5 max-w-[280px]">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Service Date</p>
            <input
              type="date"
              value={service.serviceDate || ""}
              onChange={(e) => updateField(service.id, "serviceDate", e.target.value)}
              className={dateCls}
            />
          </div>

          {/* ── HOTEL: NIGHTS ── */}
          {service.type === "hotel" && (
            <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-3 space-y-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Nights</p>

              {/* availability info */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-[10px] text-emerald-400">
                  {remainingHotelNights} of {tripNights} nights available
                </span>
                {tripNights > 0 && hotelNightStart > 0 && (
                  <span className="text-[10px] text-yellow-300">
                    Slot: Night {hotelNightStart}
                    {remainingHotelNights > 1
                      ? `–${Math.min(tripNights, hotelNightStart + remainingHotelNights - 1)}`
                      : ""}
                  </span>
                )}
                {selectedNightCount > 0 && selectedNightEnd >= hotelNightStart && (
                  <span className="text-[10px] text-sky-300">
                    Assigned: Night {hotelNightStart}
                    {selectedNightEnd > hotelNightStart ? `–${selectedNightEnd}` : ""}
                  </span>
                )}
              </div>

              <select
                value={service.nights || ""}
                onChange={(e) => updateField(service.id, "nights", e.target.value)}
                className={`${selectCls} w-full max-w-[260px]`}
              >
                <option value="">Select nights</option>
                {[...Array(Math.max(remainingHotelNights, 1))].map((_, i) => (
                  <option key={i} value={i + 1}>{getNightOptionLabel(i + 1)}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── TRANSFER: USAGE + DAYS ── */}
          {(service.type === "transfer" || service.type === "car") && (
            <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-3 space-y-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Transfer Setup</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {transportStartDate && (
                  <span className="text-[10px] text-emerald-400">
                    Up to {maxTransportDays} day{maxTransportDays > 1 ? "s" : ""} from start date
                  </span>
                )}
                {transportStartDate && transportEndDate && (
                  <span className="text-[10px] text-sky-300">
                    {transportStartDate === transportEndDate
                      ? formatDisplayDate(transportStartDate)
                      : `${formatDisplayDate(transportStartDate)} → ${formatDisplayDate(transportEndDate)}`}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-[9px] text-slate-500 mb-1">Usage</p>
                  <select
                    value={service.usageType || "point-to-point"}
                    onChange={(e) => updateField(service.id, "usageType", e.target.value)}
                    className={selectCls}
                  >
                    <option value="point-to-point">One Way</option>
                    <option value="round-trip">Two Way</option>
                    <option value="full-day">Full Day</option>
                    <option value="half-day">Half Day</option>
                  </select>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 mb-1">Days</p>
                  <select
                    value={selectedTransportDays}
                    onChange={(e) => updateField(service.id, "days", Number(e.target.value))}
                    className={selectCls}
                  >
                    {[...Array(maxTransportDays)].map((_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1} Day{i > 0 ? "s" : ""}
                        {transportStartDate
                          ? ` (${formatDisplayDate(transportStartDate)}${i > 0 ? ` → ${formatDisplayDate(addDaysToServiceDate(transportStartDate, i))}` : ""})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── ACTIVITY: PAX ── */}
          {service.type === "activity" && (
            <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-3 flex items-center gap-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">PAX</p>
              <input
                type="number"
                value={service.pax}
                onChange={(e) => updateField(service.id, "pax", Number(e.target.value))}
                className={inputCls}
              />
            </div>
          )}

          {/* ── SIGHTSEEING: PAX + DAYS ── */}
          {service.type === "sightseeing" && (
            <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] px-3 py-3 flex flex-wrap items-center gap-4">
              <div>
                <p className="text-[9px] text-slate-500 mb-1">PAX</p>
                <input
                  type="number"
                  value={service.pax}
                  onChange={(e) => updateField(service.id, "pax", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 mb-1">Days</p>
                <select
                  value={service.days}
                  onChange={(e) => updateField(service.id, "days", Number(e.target.value))}
                  className={selectCls}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i} value={i + 1}>{i + 1} Day{i > 0 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── HOTEL: ROOM + BED INFO ── */}
          {service.type === "hotel" && (service.roomType || service.bedType) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {service.roomType && (
                <span className="flex items-center gap-1.5 rounded-lg border border-[#232323] bg-[#141414] px-2.5 py-1 text-[10px] text-slate-300">
                  <LiaHotelSolid className="text-blue-400" />
                  <span className="text-slate-500">Room:</span> {service.roomType}
                </span>
              )}
              {service.bedType && (
                <span className="flex items-center gap-1.5 rounded-lg border border-[#232323] bg-[#141414] px-2.5 py-1 text-[10px] text-slate-300">
                  <MdKingBed className="text-yellow-400" />
                  <span className="text-slate-500">Bed:</span> {service.bedType}
                </span>
              )}
            </div>
          )}

          {/* ── HOTEL: EXTRA PAX CHECKBOXES ── */}
          {service.type === "hotel" && (
            <div className="space-y-2 pt-1">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Optional Add-ons
              </p>

              {/* A.W.E.B */}
              <AddonRow
                label="A.W.E.B"
                sublabel="Extra adult with extra bed"
                checked={service.extraAdult || false}
                onChange={(v) => updateField(service.id, "extraAdult", v)}
                rate={service.awebRate || 0}
                currencyCode={currencyCode}
                isForeignCurrency={isForeignCurrency}
                exchangeRates={exchangeRates}
                isEditMode={isEditMode}
                onRateChange={(v) => updateField(service.id, "awebRate", v)}
                accentClass="text-yellow-400"
                borderHover="hover:border-yellow-500/30"
                priceInputCls={priceInputCls}
              />

              {/* C.W.E.B */}
              <AddonRow
                label="C.W.E.B"
                sublabel="Child with extra bed"
                checked={service.childWithBed || false}
                onChange={(v) => updateField(service.id, "childWithBed", v)}
                rate={service.cwebRate || 0}
                currencyCode={currencyCode}
                isForeignCurrency={isForeignCurrency}
                exchangeRates={exchangeRates}
                isEditMode={isEditMode}
                onRateChange={(v) => updateField(service.id, "cwebRate", v)}
                accentClass="text-emerald-400"
                borderHover="hover:border-emerald-500/30"
                priceInputCls={priceInputCls}
              />

              {/* C.Wo.E.B */}
              <AddonRow
                label="C.Wo.E.B"
                sublabel="Child without extra bed"
                checked={service.childWithoutBed || false}
                onChange={(v) => updateField(service.id, "childWithoutBed", v)}
                rate={service.cwoebRate || 0}
                currencyCode={currencyCode}
                isForeignCurrency={isForeignCurrency}
                exchangeRates={exchangeRates}
                isEditMode={isEditMode}
                onRateChange={(v) => updateField(service.id, "cwoebRate", v)}
                accentClass="text-blue-400"
                borderHover="hover:border-blue-500/30"
                priceInputCls={priceInputCls}
              />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────
   AddonRow — small reusable helper for A.W.E.B etc.
───────────────────────────────────────────────── */
const AddonRow = ({
  label,
  sublabel,
  checked,
  onChange,
  rate,
  currencyCode,
  isForeignCurrency,
  exchangeRates,
  isEditMode,
  onRateChange,
  accentClass,
  borderHover,
  priceInputCls,
}) => (
  <div className={`rounded-xl border border-[#222] bg-[#141414] px-3 py-2.5 transition-colors ${borderHover}`}>
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-yellow-400 h-3.5 w-3.5"
        />
        <div>
          <p className="text-[11px] font-semibold text-white">{label}</p>
          <p className="text-[9px] text-slate-500">{sublabel}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-[11px] font-semibold ${accentClass}`}>
          {formatCurrencyValue(rate, currencyCode)}
        </p>
        {isForeignCurrency && (
          <p className="text-[10px] text-sky-300">
            INR {formatAmountValue(convertAmountToInr(rate, currencyCode, exchangeRates))}
          </p>
        )}
      </div>
    </label>
    {isEditMode && (
      <div className="mt-2.5 pl-6">
        <label className="text-[9px] text-slate-500">Edit rate ({currencyCode})</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={rate}
          onChange={(e) => onRateChange(Math.max(0, Number(e.target.value || 0)))}
          className={priceInputCls}
        />
      </div>
    )}
  </div>
);

export default QuotationBuilder;
