import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Clock3,
  CheckCircle2,
  CheckCheck,
  CreditCard,
  FileCheck2,
  FileText,
  BadgeCheck,
  Mail,
  Download,
  Send,
  X,
  RotateCcw,
  ThumbsUp,
  Eye,
  EyeOff,
  Filter,
  Building2,
  Car,
  Target,
  Landmark,
  Plane,
  Package,
  Layers,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Users,
  UserSquare2,
  RefreshCw,
  Check,
  Maximize2,
  MessageSquare,
  Plus,
  Pencil,
  Share2,
  MoreVertical,
  Trash2,
  Bed,
  Star,
  Info,
  AlertTriangle,
  Search,
  MapPin,
  BookOpen,
  Copy,
  Navigation,
  Luggage,
  Briefcase,
} from "lucide-react";
import React, { useEffect, useState, useMemo, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import API from "../../utils/Api.js";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { IoStarSharp } from "react-icons/io5";
import { MdStarBorderPurple500 } from "react-icons/md";
import VoucherPreviewModal from "../../modal/VoucherPreviewModal";
import SharePackageModal from "../../modal/SharePackageModal";
import ServicesBookingsTab from "../../components/ServicesBookingsTab";
import { buildVoucherHtml } from "../../utils/voucherTemplate";
import CreateProformaInvoice from "../../components/accounting/CreateProformaInvoice";
import ProformaInvoiceView from "../../components/accounting/ProformaInvoiceView";

import {
  containerVariant,
  itemVariant,
  formatMoney,
  formatDisplayDate,
  buildPublicAssetUrl,
  getOrdinalSuffix,
  getPackageNightCount,
  buildItineraryDayLabel,
  getRelativeTimeString,
  formatUsageLabel,
  formatServiceTypeLabel,
  getServiceDescriptionBits,
  SELLER_BANK_DETAILS,
  QUOTATION_TERMS,
  CLIENT_SHARE_TERMS,
  formatAmountValue,
  parseShareDate,
  formatShareDate,
  formatShareActivityDate,
  formatShareItineraryDate,
  addDaysToShareDate,
  getShareDateDiff,
  getDurationMeta,
  getClientRecipientName,
  getQueryTravelerCounts,
  buildClientTravelerSummary,
  normalizeShareServiceType,
  inferSharingLabel,
  buildClientServiceQuantityLabel,
  DEFAULT_SELLER_BANK_DETAILS,
  TRANSPORT_USAGE_LABELS,
  TRANSPORT_USAGE_LIMIT_LABELS,
  fetchQuotationsByQuery,
  getSavedAgentBranding,
} from "./queryDetails/utils/queryDetailsHelpers";

import { ActionPillButton } from "./queryDetails/components/Cards/ActionPillButton";
import { QuoteInfoListCard } from "./queryDetails/components/Cards/QuoteInfoListCard";
import { QuoteDayWiseItineraryCard } from "./queryDetails/components/Cards/QuoteDayWiseItineraryCard";
import { QuoteSellerBankDetailsCard } from "./queryDetails/components/Cards/QuoteSellerBankDetailsCard";
import { QuoteTermsAndConditionsCard } from "./queryDetails/components/Cards/QuoteTermsAndConditionsCard";
import { QuoteServiceListCard } from "./queryDetails/components/Cards/QuoteServiceListCard";
import { QueryHeaderCard } from "./queryDetails/components/Header/QueryHeaderCard";
import { QueryTabNavigation } from "./queryDetails/components/Navigation/QueryTabNavigation";
import { RevisionModal } from "./queryDetails/components/Modals/RevisionModal";
import { SendSuccessModal } from "./queryDetails/components/Modals/SendSuccessModal";

const QueryDetails = ({ query, onClose, onRefresh }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const [quotes, setQuotes] = useState([]);
  const [expandedQuoteIds, setExpandedQuoteIds] = useState({});
  const [showQuoteHistory, setShowQuoteHistory] = useState(false);
  const [quoteDropdownPos, setQuoteDropdownPos] = useState({ top: 0, left: 0 });
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [markupType, setMarkupType] = useState("PERCENT");
  const [markupValue, setMarkupValue] = useState("");
  const [isMarkupModalOpen, setIsMarkupModalOpen] = useState(false);
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  const [markupTargetMode, setMarkupTargetMode] = useState("QUOTATION");
  const [markupTargetItem, setMarkupTargetItem] = useState(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionQuoteId, setRevisionQuoteId] = useState(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [acceptQuoteId, setAcceptQuoteId] = useState(null);
  const [acceptSubmitting, setAcceptSubmitting] = useState(false);
  const [isClientApprovalModalOpen, setIsClientApprovalModalOpen] = useState(false);
  const [clientApprovalQuoteId, setClientApprovalQuoteId] = useState(null);
  const [clientApprovalSubmitting, setClientApprovalSubmitting] = useState(false);
  const [markupSubmittingId, setMarkupSubmittingId] = useState(null);
  const [sendSubmittingId, setSendSubmittingId] = useState(null);
  const [sendSuccessMeta, setSendSuccessMeta] = useState(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendQuoteId, setSendQuoteId] = useState(null);
  const [sendShareMode, setSendShareMode] = useState("QUOTATION");
  const [sendRecipientEmail, setSendRecipientEmail] = useState("");
  const [sendChannel, setSendChannel] = useState("EMAIL");
  const [sendRecipientPhone, setSendRecipientPhone] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandLogoFile, setBrandLogoFile] = useState(null);
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam === "docs" || tabParam === "documents") return "docs";
    return "basic";
  });
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const [showPackageThreeDotsMenu, setShowPackageThreeDotsMenu] = useState(false);
  const threeDotsMenuRef = useRef(null);
  const packageThreeDotsMenuRef = useRef(null);

  const [tasks, setTasks] = useState([]);
  const [openTaskMenuId, setOpenTaskMenuId] = useState(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // Live DMC-uploaded inventory rates (matches exact uploaded CSV/Excel rates from DMC)
  const [liveDmcHotels, setLiveDmcHotels] = useState([]);
  const [liveDmcTransfers, setLiveDmcTransfers] = useState([]);
  const [liveDmcActivities, setLiveDmcActivities] = useState([]);
  const [liveDmcSightseeing, setLiveDmcSightseeing] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchDmcCatalogue = async () => {
      try {
        const res = await API.get("/ops/dmcAllGetServices", {
          params: { destination: "" },
          skipGlobalLoader: true,
        });
        if (isMounted && res.data) {
          const rawData = res.data?.data;
          let rawList = [];
          if (Array.isArray(rawData)) {
            rawList = rawData;
          } else if (rawData && typeof rawData === "object") {
            rawList = [
              ...(Array.isArray(rawData.activities) ? rawData.activities : []),
              ...(Array.isArray(rawData.sightseeing) ? rawData.sightseeing : []),
              ...(Array.isArray(rawData.hotels) ? rawData.hotels : []),
              ...(Array.isArray(rawData.transfers) ? rawData.transfers : []),
              ...(Array.isArray(rawData.services) ? rawData.services : []),
            ];
          } else if (Array.isArray(res.data?.services)) {
            rawList = res.data.services;
          }

          const hotelsOnly = rawList.filter(
            (s) => s.type === "hotel" || s.serviceCategory === "hotel" || s.hotelName || s.roomType
          );
          setLiveDmcHotels(hotelsOnly);

          const transfersOnly = rawList.filter(
            (s) => s.type === "transfer" || s.serviceCategory === "transport" || s.serviceCategory === "transfer" || s.vehicleType || s.vehicles || s.usageType
          );
          setLiveDmcTransfers(transfersOnly);

          const rawActivities = Array.isArray(rawData?.activities) && rawData.activities.length > 0
            ? rawData.activities
            : rawList.filter(
                (s) => s.type === "activity" || s.serviceCategory === "activity" || s.activityName || /activity|experience|scuba|water|trek|safari/i.test(s.title || s.name || s.serviceName || "")
              );
          setLiveDmcActivities(rawActivities.length > 0 ? rawActivities : rawList);

          const rawSightseeing = Array.isArray(rawData?.sightseeing) && rawData.sightseeing.length > 0
            ? rawData.sightseeing
            : rawList.filter(
                (s) => s.type === "sightseeing" || s.serviceCategory === "sightseeing" || s.sightseeingName || /sightseeing|tour|fort|palace|beach|island|heritage/i.test(s.title || s.name || s.serviceName || "")
              );
          setLiveDmcSightseeing(rawSightseeing.length > 0 ? rawSightseeing : rawList);
        }
      } catch (err) {
        // failover cleanly to package-stored rates
      }
    };
    fetchDmcCatalogue();
    return () => {
      isMounted = false;
    };
  }, []);

  // Package Customizations State (Keyed by packageId)
  const [packageCustomizations, setPackageCustomizations] = useState({});
  const [showAddHotelForm, setShowAddHotelForm] = useState(false);
  const [showAddTransferForm, setShowAddTransferForm] = useState(false);
  const [showAddActivityForm, setShowAddActivityForm] = useState(false);
  const [showAddSightseeingForm, setShowAddSightseeingForm] = useState(false);
  const [activeAddActivityRow, setActiveAddActivityRow] = useState(null);
  const [activeAddSightseeingRow, setActiveAddSightseeingRow] = useState(null);

  const [newHotelInput, setNewHotelInput] = useState({ name: "", roomCategory: "Double", bedType: "Queen", roomType: "Standard Room", nights: 1, price: 5000, pax: "2 Pax", meal: "Daily Breakfast" });
  const [newTransferInput, setNewTransferInput] = useState({
    dmcTransferId: "",
    name: "",
    serviceTitle: "",
    actualVehicleName: "",
    vehicleType: "Sedan",
    usageType: "One Way / Airport Transfer",
    passengerCapacity: 4,
    luggageCapacity: 2,
    day: "Day 1",
    days: 1,
    vehicles: 1,
    price: 2500,
    oneWayRate: 2500,
    interHotelRate: 1500,
    fullDayRate: 3500,
    halfDayRate: 2200,
    fullDayNote: "Full day disposal: Max 80 km / 8 hours limit. Extra km & hours charged separately.",
    halfDayNote: "Half day disposal: Max 40 km / 4 hours limit. Extra km & hours charged separately.",
    fullDayExtraPerKmRate: 0,
    halfDayExtraPerKmRate: 0,
    interHotelCount: 0,
    fullDayCount: 0,
    halfDayCount: 0,
    city: "",
    description: "One Way / Airport transfer in AC vehicle with professional driver, fuel & toll included",
  });
  const [newActivityInput, setNewActivityInput] = useState({
    name: "",
    tourType: "Private Tour",
    day: "Day 2",
    adultPrice: 1500,
    childPrice: 750,
    adults: query?.numberOfAdults || 2,
    children: query?.numberOfChildren || 0,
    selectedSlot: "08:00",
    price: 3000,
    description: "Tour activity with admission tickets",
  });
  const [newSightseeingInput, setNewSightseeingInput] = useState({
    name: "",
    tourType: "Private Tour",
    day: "Day 2",
    adultPrice: 1800,
    childPrice: 900,
    adults: query?.numberOfAdults || 2,
    children: query?.numberOfChildren || 0,
    selectedSlot: "08:00",
    price: 3600,
    description: "Guided local sightseeing tour with transfers included",
  });

  const getPkgCustom = (pkgId) => {
    return packageCustomizations[pkgId] || {
      excludedHotels: [],
      excludedTransfers: [],
      excludedActivities: [],
      excludedSightseeing: [],
      hotelOverrides: {},
      transferOverrides: {},
      activityOverrides: {},
      sightseeingOverrides: {},
      customHotels: [],
      customTransfers: [],
      customActivities: [],
      customSightseeing: [],
    };
  };

  const updatePkgCustom = (pkgId, updater) => {
    setPackageCustomizations((prev) => {
      const current = prev[pkgId] || {
        excludedHotels: [],
        excludedTransfers: [],
        excludedActivities: [],
        excludedSightseeing: [],
        hotelOverrides: {},
        transferOverrides: {},
        activityOverrides: {},
        sightseeingOverrides: {},
        customHotels: [],
        customTransfers: [],
        customActivities: [],
      };
      return {
        ...prev,
        [pkgId]: updater(current),
      };
    });
  };

  const getQueryChildAges = (queryObj) => {
    if (!queryObj) return [];
    
    // 1. Check travelerDetails or travelers array (e.g. { travelerType: "Child", childAge: 6 })
    const travelersList = Array.isArray(queryObj.travelerDetails)
      ? queryObj.travelerDetails
      : (Array.isArray(queryObj.travelers) ? queryObj.travelers : []);
    
    const fromTravelers = travelersList
      .filter((t) => String(t?.travelerType || t?.type || "").toLowerCase() === "child" || t?.childAge !== undefined)
      .map((t) => Number(t?.childAge !== undefined ? t.childAge : (t?.age !== undefined ? t.age : 5)))
      .filter((a) => !isNaN(a) && a >= 0);
    if (fromTravelers.length > 0) return fromTravelers;

    // 2. Check childTravelers array (e.g. { fullName: "...", age: 6 })
    if (Array.isArray(queryObj.childTravelers) && queryObj.childTravelers.length > 0) {
      return queryObj.childTravelers.map((t) => Number(t?.age ?? t?.childAge ?? 5)).filter((a) => !isNaN(a));
    }

    // 3. Direct childAges or childrenAges arrays
    if (Array.isArray(queryObj.childAges) && queryObj.childAges.length > 0) {
      return queryObj.childAges.map(Number).filter((a) => !isNaN(a));
    }
    if (Array.isArray(queryObj.childrenAges) && queryObj.childrenAges.length > 0) {
      return queryObj.childrenAges.map(Number).filter((a) => !isNaN(a));
    }

    const numChildren = Number(queryObj.numberOfChildren ?? queryObj.children ?? 0);
    return Array.from({ length: numChildren }, () => 5);
  };

  const updateHotelConfig = (pkgId, hotelIdx, field, deltaOrValue, isAbsolute = false, defaultVal = undefined, isCustom = false, customIndex = 0) => {
    updatePkgCustom(pkgId, (c) => {
      const queryAdults = Number(query?.numberOfAdults ?? query?.adults ?? 2);
      const queryChildAgesList = getQueryChildAges(query);
      const queryChildren = Number(query?.numberOfChildren ?? query?.children ?? queryChildAgesList.length);
      const fallbackDefault = defaultVal !== undefined
        ? defaultVal
        : (field === "children" ? queryChildren : (field === "adults" ? queryAdults : 1));

      if (isCustom) {
        const nextCustomHotels = [...(c.customHotels || [])];
        if (!nextCustomHotels[customIndex]) return c;
        const currentHotel = { ...nextCustomHotels[customIndex] };
        const currentValue = currentHotel[field] !== undefined ? currentHotel[field] : null;

        let nextValue;
        if (typeof deltaOrValue === "string") {
          nextValue = deltaOrValue;
        } else if (isAbsolute) {
          nextValue = Math.max(0, deltaOrValue);
        } else {
          const base = currentValue !== null ? currentValue : fallbackDefault;
          nextValue = Math.max(0, base + deltaOrValue);
        }

        if (field === "rooms" || field === "nights" || field === "adults") {
          nextValue = Math.max(1, Number(nextValue) || 1);
        } else if (field === "children") {
          nextValue = Math.max(0, Number(nextValue) || 0);
        }

        // Occupancy Notifications for Custom Hotel
        const customRooms = Number(field === "rooms" ? nextValue : (currentHotel.rooms || currentHotel.roomCount || 1));
        const customAdults = Number(field === "adults" ? nextValue : (currentHotel.adults !== undefined ? currentHotel.adults : queryAdults));

        if (field === "adults" && nextValue > (currentValue ?? fallbackDefault)) {
          if (nextValue > customRooms * 3) {
            const minRooms = Math.ceil(nextValue / 3);
            toast.error(
              `⚠️ ${nextValue} Adults exceed capacity for ${customRooms} Room(s) (Max 3 adults/room with extra bed). Extra room required (Min ${minRooms} rooms).`,
              { id: "hotel-occupancy-warn", duration: 4000 }
            );
          } else if (nextValue === customRooms * 2 + 1 && (currentHotel.awebCount || 0) === 0) {
            toast(
              `💡 ${nextValue} Adults in ${customRooms} Room(s) require 1 Adult Extra Bed (AWEB).`,
              { icon: "🛏️", id: "hotel-occupancy-hint" }
            );
          }
        } else if (field === "rooms" && nextValue < (currentValue ?? fallbackDefault)) {
          if (customAdults > nextValue * 3) {
            const minRooms = Math.ceil(customAdults / 3);
            toast.error(
              `⚠️ ${nextValue} Room(s) can fit max ${nextValue * 3} adults. For ${customAdults} adults, you need at least ${minRooms} rooms.`,
              { id: "hotel-room-warn", duration: 4000 }
            );
          }
        }

        let nextChildAges = Array.isArray(currentHotel.childAges)
          ? [...currentHotel.childAges]
          : (queryChildAgesList.length > 0 ? [...queryChildAgesList] : []);
        if (field === "children") {
          while (nextChildAges.length < nextValue) {
            const fallbackAge = queryChildAgesList[nextChildAges.length] !== undefined ? queryChildAgesList[nextChildAges.length] : 5;
            nextChildAges.push(fallbackAge);
          }
          if (nextChildAges.length > nextValue) {
            nextChildAges = nextChildAges.slice(0, nextValue);
          }
          currentHotel.childAges = nextChildAges;
        }

        currentHotel[field] = nextValue;
        nextCustomHotels[customIndex] = currentHotel;
        return {
          ...c,
          customHotels: nextCustomHotels,
        };
      }

      const currentHotelConfig = c.hotelOverrides?.[hotelIdx] || {};
      const currentValue = currentHotelConfig[field] !== undefined ? currentHotelConfig[field] : null;
      let nextValue;
      if (typeof deltaOrValue === "string") {
        nextValue = deltaOrValue;
      } else if (isAbsolute) {
        nextValue = Math.max(0, deltaOrValue);
      } else {
        const base = currentValue !== null ? currentValue : fallbackDefault;
        nextValue = Math.max(0, base + deltaOrValue);
      }

      if (field === "rooms" || field === "nights" || field === "adults") {
        nextValue = Math.max(1, Number(nextValue) || 1);
      } else if (field === "children") {
        nextValue = Math.max(0, Number(nextValue) || 0);
      }

      // Occupancy Notifications for Standard Package Hotel
      const pkgRooms = Number(field === "rooms" ? nextValue : (currentHotelConfig.rooms !== undefined ? currentHotelConfig.rooms : 1));
      const pkgAdults = Number(field === "adults" ? nextValue : (currentHotelConfig.adults !== undefined ? currentHotelConfig.adults : queryAdults));

      if (field === "adults" && nextValue > (currentValue ?? fallbackDefault)) {
        if (nextValue > pkgRooms * 3) {
          const minRooms = Math.ceil(nextValue / 3);
          toast.error(
            `⚠️ ${nextValue} Adults exceed capacity for ${pkgRooms} Room(s) (Max 3 adults/room with extra bed). Extra room required (Min ${minRooms} rooms).`,
            { id: "hotel-occupancy-warn", duration: 4000 }
          );
        } else if (nextValue === pkgRooms * 2 + 1 && (currentHotelConfig.awebCount || 0) === 0) {
          toast(
            `💡 ${nextValue} Adults in ${pkgRooms} Room(s) require 1 Adult Extra Bed (AWEB).`,
            { icon: "🛏️", id: "hotel-occupancy-hint" }
          );
        }
      } else if (field === "rooms" && nextValue < (currentValue ?? fallbackDefault)) {
        if (pkgAdults > nextValue * 3) {
          const minRooms = Math.ceil(pkgAdults / 3);
          toast.error(
            `⚠️ ${nextValue} Room(s) can fit max ${nextValue * 3} adults. For ${pkgAdults} adults, you need at least ${minRooms} rooms.`,
            { id: "hotel-room-warn", duration: 4000 }
          );
        }
      }

      let nextChildAges = Array.isArray(currentHotelConfig.childAges)
        ? [...currentHotelConfig.childAges]
        : (queryChildAgesList.length > 0 ? [...queryChildAgesList] : []);
      if (field === "children") {
        while (nextChildAges.length < nextValue) {
          const fallbackAge = queryChildAgesList[nextChildAges.length] !== undefined ? queryChildAgesList[nextChildAges.length] : 5;
          nextChildAges.push(fallbackAge);
        }
        if (nextChildAges.length > nextValue) {
          nextChildAges = nextChildAges.slice(0, nextValue);
        }
      }

      return {
        ...c,
        hotelOverrides: {
          ...c.hotelOverrides,
          [hotelIdx]: {
            ...currentHotelConfig,
            [field]: nextValue,
            ...(field === "nights" ? { nightsManuallyChanged: true } : {}),
            ...(field === "children" ? { childAges: nextChildAges } : {}),
          },
        },
      };
    });
  };

  const updateChildAge = (pkgId, hotelIdx, childIdx, age, isCustom = false, customIndex = 0) => {
    updatePkgCustom(pkgId, (c) => {
      const queryChildAgesList = getQueryChildAges(query);

      if (isCustom) {
        const nextCustomHotels = [...(c.customHotels || [])];
        if (!nextCustomHotels[customIndex]) return c;
        const currentHotel = { ...nextCustomHotels[customIndex] };
        const currentCount = Number(currentHotel.children !== undefined ? currentHotel.children : queryChildAgesList.length);
        const existingAges = Array.isArray(currentHotel.childAges)
          ? [...currentHotel.childAges]
          : (queryChildAgesList.length === currentCount ? [...queryChildAgesList] : Array.from({ length: currentCount }, (_, i) => queryChildAgesList[i] !== undefined ? queryChildAgesList[i] : 5));
        existingAges[childIdx] = Number(age);
        currentHotel.childAges = existingAges;
        nextCustomHotels[customIndex] = currentHotel;
        return {
          ...c,
          customHotels: nextCustomHotels,
        };
      }

      const currentHotelConfig = c.hotelOverrides?.[hotelIdx] || {};
      const currentCount = Number(currentHotelConfig.children !== undefined ? currentHotelConfig.children : Number(query?.numberOfChildren ?? query?.children ?? queryChildAgesList.length));
      const existingAges = Array.isArray(currentHotelConfig.childAges)
        ? [...currentHotelConfig.childAges]
        : (queryChildAgesList.length === currentCount ? [...queryChildAgesList] : Array.from({ length: currentCount }, (_, i) => queryChildAgesList[i] !== undefined ? queryChildAgesList[i] : 5));
      existingAges[childIdx] = Number(age);
      return {
        ...c,
        hotelOverrides: {
          ...c.hotelOverrides,
          [hotelIdx]: {
            ...currentHotelConfig,
            childAges: existingAges,
          },
        },
      };
    });
  };

  const toggleHotelAddon = (pkgId, hotelIdx, addonKey, isCustom = false, customIndex = 0) => {
    updatePkgCustom(pkgId, (c) => {
      if (isCustom) {
        const nextCustomHotels = [...(c.customHotels || [])];
        if (!nextCustomHotels[customIndex]) return c;
        const currentHotel = { ...nextCustomHotels[customIndex] };
        const currentVal = Number(currentHotel[addonKey] || 0);
        currentHotel[addonKey] = currentVal > 0 ? 0 : 1;
        nextCustomHotels[customIndex] = currentHotel;
        return {
          ...c,
          customHotels: nextCustomHotels,
        };
      }

      const currentHotelConfig = c.hotelOverrides?.[hotelIdx] || {};
      const currentCount = Number(currentHotelConfig[addonKey] || 0);
      const nextCount = currentCount > 0 ? 0 : 1;
      return {
        ...c,
        hotelOverrides: {
          ...c.hotelOverrides,
          [hotelIdx]: {
            ...currentHotelConfig,
            [addonKey]: nextCount,
          },
        },
      };
    });
  };

  const updateTransferConfig = (pkgId, transferIdx, field, deltaOrValue, isAbsolute = false, defaultVal = undefined, isCustom = false, customIndex = 0) => {
    updatePkgCustom(pkgId, (c) => {
      const queryAdults = Number(query?.numberOfAdults ?? query?.adults ?? 2);
      const queryChildren = Number(query?.numberOfChildren ?? query?.children ?? 0);
      const fallbackDefault = defaultVal !== undefined
        ? defaultVal
        : (field === "vehicles" ? 1 : (field === "days" ? 1 : (field === "adults" ? queryAdults : (field === "children" ? queryChildren : 1))));

      if (isCustom) {
        const nextCustomTransfers = [...(c.customTransfers || [])];
        if (!nextCustomTransfers[customIndex]) return c;
        const currentTransfer = { ...nextCustomTransfers[customIndex] };
        const currentValue = currentTransfer[field] !== undefined ? currentTransfer[field] : null;

        let nextValue;
        if (typeof deltaOrValue === "string") {
          nextValue = deltaOrValue;
        } else if (isAbsolute) {
          nextValue = Math.max(0, deltaOrValue);
        } else {
          const base = currentValue !== null ? currentValue : fallbackDefault;
          nextValue = Math.max(0, base + deltaOrValue);
        }

        if (field === "vehicles" || field === "days" || field === "adults") {
          nextValue = Math.max(1, Number(nextValue) || 1);
        } else if (field === "children") {
          nextValue = Math.max(0, Number(nextValue) || 0);
        }

        // Capacity notification
        const customVehicles = Number(field === "vehicles" ? nextValue : (currentTransfer.vehicles || 1));
        const customCapacity = Number(currentTransfer.passengerCapacity || 4);
        const customAdults = Number(field === "adults" ? nextValue : (currentTransfer.adults !== undefined ? currentTransfer.adults : queryAdults));
        const customChildren = Number(field === "children" ? nextValue : (currentTransfer.children !== undefined ? currentTransfer.children : queryChildren));
        const totalPax = customAdults + customChildren;

        if ((field === "adults" || field === "children") && totalPax > customVehicles * customCapacity) {
          const minVehicles = Math.ceil(totalPax / customCapacity);
          toast.error(
            `⚠️ ${totalPax} Passengers exceed capacity for ${customVehicles} Cab(s) (Max ${customVehicles * customCapacity} Pax). Extra cab recommended (Min ${minVehicles} cabs).`,
            { id: "transfer-capacity-warn", duration: 4000 }
          );
        }

        currentTransfer[field] = nextValue;
        nextCustomTransfers[customIndex] = currentTransfer;
        return {
          ...c,
          customTransfers: nextCustomTransfers,
        };
      }

      const currentTransferConfig = c.transferOverrides?.[transferIdx] || {};
      const currentValue = currentTransferConfig[field] !== undefined ? currentTransferConfig[field] : null;
      let nextValue;
      if (typeof deltaOrValue === "string") {
        nextValue = deltaOrValue;
      } else if (isAbsolute) {
        nextValue = Math.max(0, deltaOrValue);
      } else {
        const base = currentValue !== null ? currentValue : fallbackDefault;
        nextValue = Math.max(0, base + deltaOrValue);
      }

      if (field === "vehicles" || field === "days" || field === "adults") {
        nextValue = Math.max(1, Number(nextValue) || 1);
      } else if (field === "children") {
        nextValue = Math.max(0, Number(nextValue) || 0);
      }

      return {
        ...c,
        transferOverrides: {
          ...c.transferOverrides,
          [transferIdx]: {
            ...currentTransferConfig,
            [field]: nextValue,
          },
        },
      };
    });
  };

  const toggleTransferAddon = (pkgId, transferIdx, addonKey, isCustom = false, customIndex = 0) => {
    updatePkgCustom(pkgId, (c) => {
      if (isCustom) {
        const nextCustomTransfers = [...(c.customTransfers || [])];
        if (!nextCustomTransfers[customIndex]) return c;
        const currentTransfer = { ...nextCustomTransfers[customIndex] };
        const currentVal = Number(currentTransfer[addonKey] || 0);
        currentTransfer[addonKey] = currentVal > 0 ? 0 : 1;
        nextCustomTransfers[customIndex] = currentTransfer;
        return {
          ...c,
          customTransfers: nextCustomTransfers,
        };
      }

      const currentTransferConfig = c.transferOverrides?.[transferIdx] || {};
      const currentCount = Number(currentTransferConfig[addonKey] || 0);
      const nextCount = currentCount > 0 ? 0 : 1;
      return {
        ...c,
        transferOverrides: {
          ...c.transferOverrides,
          [transferIdx]: {
            ...currentTransferConfig,
            [addonKey]: nextCount,
          },
        },
      };
    });
  };

  const parsePaxCount = (val, fallback = 1) => {
    if (val === undefined || val === null || val === "") return fallback;
    if (typeof val === "number") return isNaN(val) || val < 1 ? fallback : Math.round(val);
    const num = parseInt(String(val).replace(/[^\d]/g, ""), 10);
    return isNaN(num) || num < 1 ? fallback : num;
  };

  const parseMoney = (val, fallback = 0) => {
    if (val === undefined || val === null || val === "") return fallback;
    if (typeof val === "number") return isNaN(val) ? fallback : val;
    const num = parseFloat(String(val).replace(/[^\d.]/g, ""));
    return isNaN(num) ? fallback : num;
  };

  const updateActivityConfig = (pkgId, actIdx, field, deltaOrValue, isAbsolute = false, defaultVal = undefined, isCustom = false, customIndex = 0) => {
    updatePkgCustom(pkgId, (c) => {
      const fallbackDefault = parsePaxCount(defaultVal, 1);

      if (isCustom) {
        const nextCustomActs = [...(c.customActivities || [])];
        if (!nextCustomActs[customIndex]) return c;
        const currentAct = { ...nextCustomActs[customIndex] };
        const rawCurrent = currentAct[field];
        let nextValue;
        if (typeof deltaOrValue === "string" && !isAbsolute) {
          nextValue = deltaOrValue;
        } else if (isAbsolute) {
          nextValue = typeof deltaOrValue === "number" ? Math.max(0, deltaOrValue) : deltaOrValue;
        } else {
          const currentNum = parsePaxCount(rawCurrent !== undefined && rawCurrent !== null ? rawCurrent : fallbackDefault, fallbackDefault);
          nextValue = Math.max(1, currentNum + Number(deltaOrValue || 0));
        }
        if (field === "children") {
          nextValue = Math.max(0, parsePaxCount(nextValue, 0));
        } else if (field === "pax" || field === "quantity" || field === "adults") {
          nextValue = Math.max(1, parsePaxCount(nextValue, 1));
        }
        currentAct[field] = nextValue;
        nextCustomActs[customIndex] = currentAct;
        return {
          ...c,
          customActivities: nextCustomActs,
        };
      }

      const currentActOverrides = c.activityOverrides || {};
      const currentActConfig = currentActOverrides[actIdx] || {};
      const rawCurrent = currentActConfig[field];
      let nextValue;
      if (typeof deltaOrValue === "string" && !isAbsolute) {
        nextValue = deltaOrValue;
      } else if (isAbsolute) {
        nextValue = typeof deltaOrValue === "number" ? Math.max(0, deltaOrValue) : deltaOrValue;
      } else {
        const defaultFallbackVal = field === "children" ? 0 : fallbackDefault;
        const currentNum = parsePaxCount(rawCurrent !== undefined && rawCurrent !== null ? rawCurrent : defaultFallbackVal, defaultFallbackVal);
        nextValue = Math.max(field === "children" ? 0 : 1, currentNum + Number(deltaOrValue || 0));
      }
      if (field === "children") {
        nextValue = Math.max(0, parsePaxCount(nextValue, 0));
      } else if (field === "pax" || field === "quantity" || field === "adults") {
        nextValue = Math.max(1, parsePaxCount(nextValue, 1));
      }
      return {
        ...c,
        activityOverrides: {
          ...currentActOverrides,
          [actIdx]: {
            ...currentActConfig,
            [field]: nextValue,
          },
        },
      };
    });
  };

  const updateSightseeingConfig = (pkgId, sightIdx, field, deltaOrValue, isAbsolute = false, defaultVal = undefined, isCustom = false, customIndex = 0) => {
    updatePkgCustom(pkgId, (c) => {
      const fallbackDefault = parsePaxCount(defaultVal, 1);
      
      if (isCustom) {
        const nextCustomSights = [...(c.customSightseeing || [])];
        if (!nextCustomSights[customIndex]) return c;
        const currentSight = { ...nextCustomSights[customIndex] };
        const rawCurrent = currentSight[field];
        let nextValue;
        if (typeof deltaOrValue === "string" && !isAbsolute) {
          nextValue = deltaOrValue;
        } else if (isAbsolute) {
          nextValue = typeof deltaOrValue === "number" ? Math.max(0, deltaOrValue) : deltaOrValue;
        } else {
          const defaultFallbackVal = field === "children" ? 0 : fallbackDefault;
          const currentNum = parsePaxCount(rawCurrent !== undefined && rawCurrent !== null ? rawCurrent : defaultFallbackVal, defaultFallbackVal);
          nextValue = Math.max(field === "children" ? 0 : 1, currentNum + Number(deltaOrValue || 0));
        }
        if (field === "children") {
          nextValue = Math.max(0, parsePaxCount(nextValue, 0));
        } else if (field === "pax" || field === "quantity" || field === "adults") {
          nextValue = Math.max(1, parsePaxCount(nextValue, 1));
        }
        currentSight[field] = nextValue;
        nextCustomSights[customIndex] = currentSight;
        return {
          ...c,
          customSightseeing: nextCustomSights,
        };
      }

      const currentSightOverrides = c.sightseeingOverrides || {};
      const currentSightConfig = currentSightOverrides[sightIdx] || {};
      const rawCurrent = currentSightConfig[field];
      let nextValue;
      if (typeof deltaOrValue === "string" && !isAbsolute) {
        nextValue = deltaOrValue;
      } else if (isAbsolute) {
        nextValue = typeof deltaOrValue === "number" ? Math.max(0, deltaOrValue) : deltaOrValue;
      } else {
        const defaultFallbackVal = field === "children" ? 0 : fallbackDefault;
        const currentNum = parsePaxCount(rawCurrent !== undefined && rawCurrent !== null ? rawCurrent : defaultFallbackVal, defaultFallbackVal);
        nextValue = Math.max(field === "children" ? 0 : 1, currentNum + Number(deltaOrValue || 0));
      }
      if (field === "children") {
        nextValue = Math.max(0, parsePaxCount(nextValue, 0));
      } else if (field === "pax" || field === "quantity" || field === "adults") {
        nextValue = Math.max(1, parsePaxCount(nextValue, 1));
      }
      return {
        ...c,
        sightseeingOverrides: {
          ...currentSightOverrides,
          [sightIdx]: {
            ...currentSightConfig,
            [field]: nextValue,
          },
        },
      };
    });
  };

  const toggleExcludeHotel = (pkgId, idx) => {
    updatePkgCustom(pkgId, (c) => {
      const exists = c.excludedHotels.includes(idx);
      const updated = exists ? c.excludedHotels.filter((i) => i !== idx) : [...c.excludedHotels, idx];
      toast.success(exists ? "Hotel stay restored to quotation" : "Hotel stay dropped from quotation");
      return { ...c, excludedHotels: updated };
    });
  };

  const toggleExcludeTransfer = (pkgId, idx) => {
    updatePkgCustom(pkgId, (c) => {
      const exists = c.excludedTransfers.includes(idx);
      const updated = exists ? c.excludedTransfers.filter((i) => i !== idx) : [...c.excludedTransfers, idx];
      toast.success(exists ? "Transfer service restored" : "Transfer service dropped");
      return { ...c, excludedTransfers: updated };
    });
  };

  const toggleExcludeActivity = (pkgId, idx) => {
    updatePkgCustom(pkgId, (c) => {
      const exists = c.excludedActivities.includes(idx);
      const updated = exists ? c.excludedActivities.filter((i) => i !== idx) : [...c.excludedActivities, idx];
      toast.success(exists ? "Activity tour restored" : "Activity tour dropped");
      return { ...c, excludedActivities: updated };
    });
  };

  const toggleExcludeSightseeing = (pkgId, idx) => {
    updatePkgCustom(pkgId, (c) => {
      const exists = c.excludedSightseeing.includes(idx);
      const updated = exists ? c.excludedSightseeing.filter((i) => i !== idx) : [...c.excludedSightseeing, idx];
      toast.success(exists ? "Sightseeing tour restored" : "Sightseeing tour dropped");
      return { ...c, excludedSightseeing: updated };
    });
  };

  const resetPkgCustomizations = (pkgId) => {
    setPackageCustomizations((prev) => {
      const next = { ...prev };
      delete next[pkgId];
      return next;
    });
    toast.success("Package restored to original template!");
  };

  const loadQueryTasks = async () => {
    if (!query?._id) {
      setTasks([]);
      return;
    }

    try {
      const { data } = await API.get(`/agent/queries/${query._id}/tasks`);
      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
    } catch (error) {
      console.error("Unable to load query tasks", error);
      setTasks([]);
    }
  };

  const handleToggleResolveTask = async (taskId) => {
    try {
      const { data } = await API.patch(`/agent/query-tasks/${taskId}/resolve`);
      if (data?.task) {
        setTasks((prev) => prev.map((task) => (task.id === taskId ? data.task : task)));
      }
      setOpenTaskMenuId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await API.delete(`/agent/query-tasks/${taskId}`);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      setOpenTaskMenuId(null);
      toast.success("Task / Comment deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete task");
    }
  };

  const handleAddTask = async () => {
    const text = newTaskText.trim();
    if (!text || !query?._id) return;

    try {
      const { data } = await API.post(`/agent/queries/${query._id}/tasks`, {
        text,
        dueDate: newTaskDueDate || null,
      });
      if (data?.task) setTasks((prev) => [data.task, ...prev]);
      setNewTaskText("");
      setNewTaskDueDate("");
      setIsAddingTask(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save task");
    }
  };

  useEffect(() => {
    setIsAddingTask(false);
    setOpenTaskMenuId(null);
    loadQueryTasks();
  }, [query?._id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (threeDotsMenuRef.current && !threeDotsMenuRef.current.contains(event.target)) {
        setShowThreeDotsMenu(false);
      }
      if (packageThreeDotsMenuRef.current && !packageThreeDotsMenuRef.current.contains(event.target)) {
        setShowPackageThreeDotsMenu(false);
      }
    };
    if (showThreeDotsMenu || showPackageThreeDotsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showThreeDotsMenu, showPackageThreeDotsMenu]);
  const [isIncExcExpanded, setIsIncExcExpanded] = useState(false);
  const [isItineraryExpanded, setIsItineraryExpanded] = useState(false);
  const [isTermsExpanded, setIsTermsExpanded] = useState(false);
  const [accountingSubTab, setAccountingSubTab] = useState("payments");
  const [isCreatingProforma, setIsCreatingProforma] = useState(false);
  const [proformaInvoiceData, setProformaInvoiceData] = useState(null);
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [logPaymentModal, setLogPaymentModal] = useState(null);
  const [paymentInstallmentModal, setPaymentInstallmentModal] = useState(null);
  const [paymentComments, setPaymentComments] = useState({});
  const [activeCommentKey, setActiveCommentKey] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [loggedPayments, setLoggedPayments] = useState({});
  const [bookingPaymentRecord, setBookingPaymentRecord] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherModalMode, setVoucherModalMode] = useState("preview");

  const openPaymentInvoice = async (payment) => {
    if (payment?.paymentInvoiceUrl) {
      window.open(payment.paymentInvoiceUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const invoiceId = bookingPaymentRecord?.invoice?._id || query?.invoice?._id;
    if (!invoiceId || !payment?.isPaymentInvoiceAvailable) return;

    try {
      const { data } = await API.post(
        `/agent/invoices/${invoiceId}/payment-receipts/${payment.paymentIndex}/generate`,
      );
      const paymentInvoiceUrl = String(data?.receipt?.url || "").trim();
      if (!paymentInvoiceUrl) {
        toast.error("Payment invoice is not available yet.");
        return;
      }
      window.open(paymentInvoiceUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to open payment invoice right now.");
    }
  };

  const buildCurrentVoucherData = () => {
    const targetQuote = activeQuote || quotes[0] || {};
    const rawServices = Array.isArray(targetQuote?.services) && targetQuote.services.length > 0
      ? targetQuote.services
      : Array.isArray(query?.services)
      ? query.services
      : [];

    const nights = query?.nights || targetQuote?.nights || 4;
    const days = query?.days || targetQuote?.days || (nights + 1);

    return {
      _id: query?._id,
      query: query?.queryId || query?._id,
      voucherNumber: query?.voucherNumber || `VCH-${query?.queryId || "001"}`,
      name: query?.name || query?.clientName || query?.customerName || query?.guestName || "Valued Client",
      guestName: query?.name || query?.clientName || query?.customerName || query?.guestName || "Valued Client",
      destination: query?.destination || "Destination",
      travelDate: query?.startDate || null,
      passengers: `${(query?.numberOfAdults || 1)} Adults${query?.numberOfChildren > 0 ? `, ${query.numberOfChildren} Children` : ""}`,
      duration: query?.duration || targetQuote?.duration || `${nights}N / ${days}D`,
      adults: query?.numberOfAdults || 1,
      children: query?.numberOfChildren || 0,
      services: rawServices.map((s) => ({
        type: s.type || "service",
        title: s.title || s.name || s.description || "Service details",
        name: s.title || s.name || s.description || "Service details",
        status: s.confirmationNumber || s.status ? "Confirmed" : "Pending",
        confirmation: s.confirmationNumber || s.status || "Pending",
      })),
      agencyPhone: currentUser?.phone || "+91 8851346665",
      agencyEmail: currentUser?.email || "ops@holidaycircuit.com",
      agencyAddress: currentUser?.companyAddress || currentUser?.address || "2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058",
      voucherFooterImage: currentUser?.voucherFooterImage || currentUser?.footerBanner || currentUser?.pdfFooterImage || "",
    };
  };

  const handlePreviewVoucher = () => {
    try {
      const vData = buildCurrentVoucherData();
      const targetQuote = activeQuote || quotes[0] || {};
      const agentBranding = getSavedAgentBranding({ quote: targetQuote, user: currentUser });
      const htmlContent = buildVoucherHtml(vData, "with", agentBranding);
      const win = window.open("", "_blank");
      if (win && win.document) {
        win.document.write(htmlContent);
        win.document.close();
      } else {
        handleOpenSendModal(activeQuote || quotes[0], "VOUCHER");
      }
    } catch (err) {
      console.error("Voucher preview error:", err);
      handleOpenSendModal(activeQuote || quotes[0], "VOUCHER");
    }
  };

  const handleDownloadVoucher = () => {
    try {
      const vData = buildCurrentVoucherData();
      const targetQuote = activeQuote || quotes[0] || {};
      const agentBranding = getSavedAgentBranding({ quote: targetQuote, user: currentUser });
      const htmlContent = buildVoucherHtml(vData, "with", agentBranding);
      const blob = new Blob(["\ufeff", htmlContent], {
        type: "application/msword",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Travel_Voucher_${vData.voucherNumber}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Travel Voucher downloaded successfully");
    } catch (err) {
      console.error("Voucher download error:", err);
      toast.error("Failed to download voucher.");
    }
  };

  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const nextQuotes = await fetchQuotationsByQuery(query._id);
        setQuotes(nextQuotes);
      } catch (err) {
        console.error("Error fetching quotations:", err);
      }
    };

    fetchQuotations();
  }, [query._id]);

  // Accounting is an overview only. It reads the same invoice data as the
  // Booking Payments desk, so installments stay consistent in both places.
  useEffect(() => {
    let cancelled = false;

    const fetchBookingPaymentOverview = async () => {
      try {
        const { data } = await API.get("/agent/active-bookings");
        if (cancelled) return;

        const queryIdentifiers = [query?._id, query?.queryId, query?.invoice?._id]
          .filter(Boolean)
          .map(String);
        const matchingRecord = (Array.isArray(data) ? data : []).find((record) => {
          const recordIdentifiers = [
            record?._id,
            record?.queryId,
            record?.invoice?._id,
            record?.invoice?.query?._id,
            record?.invoice?.query,
          ]
            .filter(Boolean)
            .map((value) => String(value?._id || value));

          return recordIdentifiers.some((identifier) => queryIdentifiers.includes(identifier));
        });

        setBookingPaymentRecord(matchingRecord || null);
      } catch (error) {
        // Keep the accounting screen usable if this read-only overview fails.
        console.error("Unable to load booking payment overview:", error);
        if (!cancelled) setBookingPaymentRecord(null);
      }
    };

    fetchBookingPaymentOverview();

    return () => {
      cancelled = true;
    };
  }, [query?._id, query?.queryId, query?.invoice?._id]);

  useEffect(() => {
    setExpandedQuoteIds((prev) => {
      const nextState = {};

      quotes.forEach((quote, index) => {
        if (!quote?._id) return;

        nextState[quote._id] =
          typeof prev[quote._id] === "boolean" ? prev[quote._id] : index === 0;
      });

      return nextState;
    });
  }, [quotes]);

  const updateQuote = (updatedQuote) => {
    setQuotes((prev) =>
      prev.map((q) => (q._id === updatedQuote._id ? updatedQuote : q)),
    );
  };

  const openMarkupModal = (item, mode = null) => {
    const isPackage =
      mode === "PACKAGE" ||
      (!item?.quotationNumber &&
        (item?.price || item?.basePrice || item?.destination) &&
        !quotes.some((q) => q._id === item?._id));

    if (isPackage) {
      const targetPkg =
        item ||
        (agentPackages || []).find((p) => p._id === selectedAgentPackageId) ||
        agentPackages?.[0];
      setMarkupTargetMode("PACKAGE");
      setMarkupTargetItem(targetPkg || null);
      setActiveQuoteId(null);
      setMarkupType(targetPkg?.agentMarkup?.type || "PERCENT");
      setMarkupValue(
        targetPkg?.agentMarkup?.value !== undefined &&
          targetPkg?.agentMarkup?.value !== null &&
          targetPkg?.agentMarkup?.value !== ""
          ? String(targetPkg.agentMarkup.value)
          : "",
      );
      setIsMarkupModalOpen(true);
      return;
    }

    const targetQuote =
      (item && quotes.find((q) => q._id === item._id)) ||
      activeQuote ||
      quotes[0];
    setMarkupTargetMode("QUOTATION");
    setMarkupTargetItem(targetQuote || null);
    setActiveQuoteId(targetQuote?._id || null);
    setMarkupType(targetQuote?.agentMarkup?.type || "PERCENT");
    setMarkupValue(
      targetQuote?.agentMarkup?.value ? String(targetQuote.agentMarkup.value) : "",
    );
    setIsMarkupModalOpen(true);
  };

  const closeMarkupModal = () => {
    if (markupSubmittingId) return;
    setIsMarkupModalOpen(false);
    setActiveQuoteId(null);
    setMarkupTargetMode("QUOTATION");
    setMarkupTargetItem(null);
    setMarkupType("PERCENT");
    setMarkupValue("");
  };

  const toggleQuoteVisibility = (quoteId) => {
    if (!quoteId) return;

    setExpandedQuoteIds((prev) => ({
      ...prev,
      [quoteId]: !prev[quoteId],
    }));
  };

  const openAcceptModal = (quoteId) => {
    setAcceptQuoteId(quoteId || null);
    setIsAcceptModalOpen(true);
  };

  const closeAcceptModal = () => {
    if (acceptSubmitting) return;
    setIsAcceptModalOpen(false);
    setAcceptQuoteId(null);
  };

  const openClientApprovalModal = (quoteId) => {
    setClientApprovalQuoteId(quoteId || null);
    setIsClientApprovalModalOpen(true);
  };

  const closeClientApprovalModal = () => {
    if (clientApprovalSubmitting) return;
    setIsClientApprovalModalOpen(false);
    setClientApprovalQuoteId(null);
  };

  const handleAcceptQuote = async (quoteId) => {
    try {
      setAcceptSubmitting(true);
      const res = await API.patch(`/agent/quotations/${quoteId}/accept`, {
        action: "ACCEPT",
      });
      toast.success("Quote accepted");
      updateQuote(res.data.quotation);
      setActiveQuoteId(quoteId);
      setIsAcceptModalOpen(false);
      setAcceptQuoteId(null);
    } catch (err) {

      toast.error(err.response?.data?.message || "Error");
    } finally {
      setAcceptSubmitting(false);
    }
  };

  const handleApplyMarkup = async () => {
    const validationMessage = validateAgentMarkupInput({
      markupType,
      markupValue,
    });

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    if (markupTargetMode === "PACKAGE" || (!activeQuoteId && markupTargetItem)) {
      const targetPkg =
        markupTargetItem ||
        (agentPackages || []).find((p) => p._id === selectedAgentPackageId) ||
        agentPackages?.[0];

      if (!targetPkg) {
        toast.error("No package selected to apply markup");
        return;
      }

      setMarkupSubmittingId(targetPkg._id || "package");
      try {
        const pkgServicesSum =
          (Array.isArray(targetPkg?.hotels) ? targetPkg.hotels : []).reduce((s, h) => s + Number(h.price || 0), 0) +
          (Array.isArray(targetPkg?.transfers) ? targetPkg.transfers : []).reduce((s, t) => s + Number(t.price || 0), 0) +
          (Array.isArray(targetPkg?.activities) ? targetPkg.activities : []).reduce((s, a) => s + Number(a.price || 0), 0) +
          (Array.isArray(targetPkg?.sightseeing) ? targetPkg.sightseeing : []).reduce((s, si) => s + Number(si.price || 0), 0);

        const baseCost = Number(
          targetPkg.customizedFinalPrice ||
            targetPkg.customPrice ||
            targetPkg.costPrice ||
            targetPkg.netPrice ||
            targetPkg.basePrice ||
            targetPkg.price ||
            (pkgServicesSum > 0 ? pkgServicesSum : 250000),
        );
        const { markupAmount, finalAmount } = calculateAgentMarkupPreview({
          markupType,
          markupValue,
          opsTotal: baseCost,
        });

        const markupObj = {
          type: markupType,
          value: Number(markupValue),
          markupAmount,
          finalAmount,
        };

        setAgentPackages((prev) =>
          prev.map((pkg) => {
            if (pkg._id === targetPkg._id) {
              return {
                ...pkg,
                basePrice: baseCost,
                costPrice: baseCost,
                price: finalAmount,
                clientTotalAmount: finalAmount,
                agentMarkup: markupObj,
                status: "Markup Applied",
              };
            }
            return pkg;
          }),
        );

        try {
          const queryKey = `agent_pkg_markup_${query?._id || query?.queryId}_${targetPkg._id}`;
          localStorage.setItem(queryKey, JSON.stringify(markupObj));
          localStorage.setItem(`agent_pkg_markup_${targetPkg._id}`, JSON.stringify(markupObj));
        } catch (e) {
          console.error("Failed to save package markup to localStorage", e);
        }

        const hadExistingMarkup =
          Number(targetPkg?.agentMarkup?.markupAmount || targetPkg?.agentMarkup?.value || 0) > 0;
        toast.success(hadExistingMarkup ? "Markup updated" : "Markup applied");
        closeMarkupModal();
      } catch (err) {
        console.error("Error applying package markup:", err);
        toast.error("Failed to apply package markup");
      } finally {
        setMarkupSubmittingId(null);
      }
      return;
    }

    const targetQuote =
      quotes.find((q) => q._id === activeQuoteId) ||
      markupTargetItem ||
      activeQuote ||
      quotes[0];

    if (!targetQuote || !targetQuote._id) {
      toast.error("Quotation not found");
      return;
    }

    try {
      setMarkupSubmittingId(targetQuote._id);
      const hadExistingMarkup =
        Number(targetQuote?.agentMarkup?.markupAmount || 0) > 0 ||
        Number(targetQuote?.agentMarkup?.value || 0) > 0;

      const res = await API.patch(`/agent/quotations/${targetQuote._id}/accept`, {
        action: "APPLY_MARKUP",
        markupType,
        markupValue: Number(markupValue),
      });
      toast.success(hadExistingMarkup ? "Markup updated" : "Markup applied");
      updateQuote(res.data.quotation);
      const nextQuotes = await fetchQuotationsByQuery(query._id);
      setQuotes(nextQuotes);
      await onRefresh?.();
      setMarkupSubmittingId(null);
      closeMarkupModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to apply markup");
    } finally {
      setMarkupSubmittingId(null);
    }
  };

  const handleOpenSendModal = (quote, mode = "QUOTATION") => {
    const savedBranding = getSavedAgentBranding({
      quote,
      user: currentUser,
    });

    setSendQuoteId(quote?._id || null);
    setSendShareMode(mode);
    setSendRecipientEmail(String(query?.clientEmail || "").trim());
    setSendRecipientPhone(String(query?.clientPhone || "").trim());
    setSendChannel("EMAIL");
    setBrandName(savedBranding.name);
    setBrandLogoUrl(savedBranding.logo);
    setBrandLogoFile(null);
    setIsSendModalOpen(true);
  };

  const handleCloseSendModal = () => {
    setIsSendModalOpen(false);
    setSendQuoteId(null);
    setSendShareMode("QUOTATION");
    setSendRecipientEmail("");
    setSendRecipientPhone("");
    setSendChannel("EMAIL");
    setBrandName("");
    setBrandLogoUrl("");
    setBrandLogoFile(null);
  };

  const handleSendToClient = async (quote, recipientEmail) => {
    const normalizedRecipientEmail = String(recipientEmail || "").trim().toLowerCase();

    if (!normalizedRecipientEmail) {
      toast.error("Please enter client email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRecipientEmail)) {
      toast.error("Please enter a valid client email");
      return;
    }

    try {
      setSendSubmittingId(quote._id);
      const res = await API.patch(`/agent/quotations/${quote._id}/accept`, {
        action: "SEND_TO_CLIENT",
        recipientEmail: normalizedRecipientEmail,
      });
      updateQuote(res.data.quotation);
      setSendSuccessMeta({
        recipientEmail: res.data?.recipientEmail || "",
        quotationNumber: res.data?.summary?.quotationNumber || quote?.quotationNumber || "",
        destination: res.data?.summary?.destination || query.destination,
        totalAmount:
          res.data?.summary?.totalAmount ??
          quote?.clientTotalAmount ??
          quote?.pricing?.totalAmount ??
          0,
        serviceCount: res.data?.summary?.serviceCount ?? quote?.services?.length ?? 0,
        validTill:
          res.data?.summary?.validTill ||
          (quote?.validTill
            ? new Date(quote.validTill).toLocaleDateString("en-IN")
            : "-"),
      });
      handleCloseSendModal();
      await onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to send quotation email");
    } finally {
      setSendSubmittingId(null);
    }
  };

  const markQuoteSharedToClient = async (target) => {
    const targetId = typeof target === "string" ? target : target?._id;
    if (!targetId) return;

    const res = await API.patch(`/agent/quotations/${targetId}/accept`, {
      action: "MARK_SHARED_TO_CLIENT",
    });

    if (res.data?.quotation) {
      updateQuote(res.data.quotation);
    }

    await onRefresh?.();
    return res.data;
  };

  const handleClientApproved = async (id) => {
    try {
      setClientApprovalSubmitting(true);
      const res = await API.put(`/agent/quotations/${id}/confirm`);
      toast.success("Client approval sent to operations");
      updateQuote(res.data.quotation);
      setIsClientApprovalModalOpen(false);
      setClientApprovalQuoteId(null);
      await onRefresh?.();
    } catch (err) {
      if (["SUPPLIER_RATE_CHANGED", "OUTDATED_QUOTATION"].includes(err.response?.data?.code)) {
        toast.error(
          err.response?.data?.message ||
          "Supplier rates have changed. Please review the quotation again.",
          { duration: 7000 },
        );
      } else {
        toast.error(err.response?.data?.message || "Unable to process booking");
      }
    } finally {
      setClientApprovalSubmitting(false);
    }
  };

  const getClientPdfUrl = async (quoteId) => {
    const { data } = await API.get(`/agent/quotations/${quoteId}/client-pdf`);
    const publicUrl = buildPublicAssetUrl(data?.pdf?.publicFilePath);

    if (!publicUrl) {
      throw new Error("Unable to prepare client PDF");
    }

    const separator = publicUrl.includes("?") ? "&" : "?";
    return `${publicUrl}${separator}v=${Date.now()}`;
  };

  const openRevisionModal = (quoteId) => {
    setRevisionQuoteId(quoteId);
    setRevisionReason("");
    setIsRevisionModalOpen(true);
  };

  const handleRequestRevision = async () => {
    if (!revisionQuoteId) return;

    const trimmedReason = revisionReason.trim();
    if (!trimmedReason) {
      toast.error("Please add the revision reason for operations.");
      return;
    }

    try {
      setRevisionSubmitting(true);
      const res = await API.put(`/agent/quotations/${revisionQuoteId}/revision`, {
        reason: trimmedReason,
      });
      toast.success("Revision request sent to operations");
      if (res.data?.quotation) {
        updateQuote(res.data.quotation);
      }
      setIsRevisionModalOpen(false);
      setRevisionReason("");
      await onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to request revision");
    } finally {
      setRevisionSubmitting(false);
    }
  };

  const handleClose = () => onClose();

  const sortedQuotes = useMemo(
    () =>
      [...quotes].sort(
        (left, right) =>
          new Date(right?.updatedAt || right?.createdAt || 0).getTime() -
          new Date(left?.updatedAt || left?.createdAt || 0).getTime(),
      ),
    [quotes],
  );
  const latestQuote = sortedQuotes[0] || null;

  const activeQuote = selectedQuoteId
    ? sortedQuotes.find((quote) => quote._id === selectedQuoteId) || latestQuote
    : latestQuote;

  const headerLeadTraveler = getClientRecipientName(query);
  const headerTravelerCounts = getQueryTravelerCounts(query);
  const headerDurationMeta = getDurationMeta(query);
  const headerDuration = headerDurationMeta.totalDays
    ? `${headerDurationMeta.totalNights}N/${headerDurationMeta.totalDays}D`
    : "Duration not specified";
  const headerStartDate = query?.startDate ? new Date(query.startDate) : null;
  const headerNights = Number(query?.numberOfNights) || Number(headerDurationMeta.totalNights) || 4;
  const headerEndDate = query?.endDate
    ? new Date(query.endDate)
    : headerStartDate
      ? new Date(new Date(headerStartDate).setDate(headerStartDate.getDate() + headerNights))
      : null;
  const headerDateRangeText = headerStartDate
    ? `${formatDisplayDate(headerStartDate)} - ${formatDisplayDate(headerEndDate)}`
    : "Date not specified";
  const headerPaxSummary = [
    headerTravelerCounts.adults > 0 ? `${headerTravelerCounts.adults} Adult${headerTravelerCounts.adults === 1 ? "" : "s"}` : "",
    headerTravelerCounts.children > 0 ? `${headerTravelerCounts.children} Child${headerTravelerCounts.children === 1 ? "" : "ren"}` : "",
    headerTravelerCounts.infants > 0 ? `${headerTravelerCounts.infants} Infant${headerTravelerCounts.infants === 1 ? "" : "s"}` : "",
  ].filter(Boolean).join(", ") || "Passengers not specified";
  const headerCompany = String(
    query?.agencyName || query?.companyName || currentUser?.companyName || currentUser?.name || currentUser?.fullName || "",
  ).trim() || "Company not specified";
  const headerStatus = String(activeQuote?.status || query?.agentStatus || query?.opsStatus || "Pending").trim();
  const hasActiveQuoteMarkup = Number(activeQuote?.agentMarkup?.markupAmount || activeQuote?.agentMarkup?.value || 0) > 0 || activeQuote?.status === "Markup Applied";
  const isActiveQuoteSentToClient = activeQuote?.status === "Sent to Client" || Boolean(activeQuote?.isSentToClient || activeQuote?.sentToClientAt || activeQuote?.sharedWithClient || query?.voucherStatus === "sent");

  const agentQueryStatus = String(query?.agentStatus || query?.status || "").trim();
  const opsQueryStatus = String(query?.opsStatus || "").trim();

  // 1. Booking Confirmed stage
  const isBookingConfirmed =
    ["Confirmed", "Voucher Generated", "Active Booking", "Booking Confirmed", "Completed", "Vouchered"].includes(agentQueryStatus) ||
    opsQueryStatus === "Confirmed";

  // 2. Booking Processed (Client Approved) stage
  const isBookingProcessed =
    !isBookingConfirmed &&
    ["Client Approved", "Booking Processed", "Payment Verified"].includes(agentQueryStatus);

  // 3. Quote Received stage
  const isQuoteReceived =
    !isBookingConfirmed &&
    !isBookingProcessed &&
    (["Quote Sent", "Quote Received", "Quote Accepted", "Markup Applied", "Sent to Client", "Quote Updated"].includes(agentQueryStatus) ||
     (quotes && quotes.length > 0 && !["In Progress", "Pending", "Revision Requested", "Rejected"].includes(agentQueryStatus)));

  // 4. In Progress stage
  const isInProgress =
    !isBookingConfirmed &&
    !isBookingProcessed &&
    !isQuoteReceived &&
    ["In Progress", "InProgress", "Working"].includes(agentQueryStatus);

  // 5. Revision Requested stage
  const isRevisionRequested =
    agentQueryStatus === "Revision Requested";

  // 6. Rejected stage
  const isRejected =
    agentQueryStatus === "Rejected";

  const getHeaderStatusMeta = () => {
    if (isBookingConfirmed) {
      return {
        label: "✓ Booking Confirmed",
        className: "bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold",
        accentBorder: "border-l-[#2e7d32]",
      };
    }
    if (isBookingProcessed) {
      return {
        label: "✓ Booking Processed",
        className: "bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold",
        accentBorder: "border-l-indigo-600",
      };
    }
    if (isQuoteReceived) {
      if (isActiveQuoteSentToClient && hasActiveQuoteMarkup) {
        return {
          label: "✓ Sent to Client",
          className: "bg-blue-100 text-blue-800 border border-blue-300 font-bold",
          accentBorder: "border-l-[#3b58b5]",
        };
      }
      if (isActiveQuoteSentToClient && !hasActiveQuoteMarkup) {
        return {
          label: "✓ Sent to Client",
          className: "bg-slate-100 text-slate-700 border border-slate-300 font-semibold",
          accentBorder: "border-l-slate-400",
        };
      }
      return {
        label: "Quote Received",
        className: "bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold",
        accentBorder: "border-l-emerald-500",
      };
    }
    if (isInProgress) {
      return {
        label: "In Progress",
        className: "bg-sky-100 text-sky-700 border border-sky-200 font-semibold",
        accentBorder: "border-l-sky-500",
      };
    }
    if (isRevisionRequested) {
      return {
        label: "Revision Requested",
        className: "bg-rose-100 text-rose-800 border border-rose-200 font-semibold",
        accentBorder: "border-l-rose-500",
      };
    }
    if (isRejected) {
      return {
        label: "Rejected",
        className: "bg-rose-100 text-rose-800 border border-rose-200 font-semibold",
        accentBorder: "border-l-rose-500",
      };
    }
    return {
      label: "New Query",
      className: "bg-amber-100 text-amber-800 border border-amber-200 font-semibold",
      accentBorder: "border-l-amber-500",
    };
  };

  const headerStatusMeta = getHeaderStatusMeta();
  const headerPackageCurrency = String(activeQuote?.pricing?.currency || "INR").trim() || "INR";
  const headerPackageAmount = Number(
    activeQuote?.clientTotalAmount ?? activeQuote?.pricing?.totalAmount ?? activeQuote?.pricing?.subTotal ?? 0,
  );

  const currentVoucherData = useMemo(() => {
    if (!query) return null;
    return {
      _id: query._id,
      query: query.queryId || query._id,
      voucherNumber: query.voucherNumber || `VCH-${query.queryId || "001"}`,
      name: query.clientName || query.customerName || "Valued Client",
      guestName: query.clientName || query.customerName || "Valued Client",
      destination: query.destination || "Destination",
      travelDate: query.startDate || null,
      passengers: `${(query.numberOfAdults || 1) + (query.numberOfChildren || 0)} PAX`,
      duration: `${query.numberOfNights || 1}N/${(query.numberOfNights || 1) + 1}D`,
      services: (activeQuote?.services || []).map((s) => ({
        type: s.type || "service",
        name: s.title || s.name || "",
        status: "Confirmed",
        confirmation: "Confirmed",
      })),
      agentName: currentUser?.companyName || currentUser?.name || "Travel Agent",
      agentPhone: currentUser?.phone || "",
      agentEmail: currentUser?.email || "",
    };
  }, [query, activeQuote, currentUser]);

  const [agentPackages, setAgentPackages] = useState([]);
  const [agentPackagesLoading, setAgentPackagesLoading] = useState(false);
  const [agentPackagesSearch, setAgentPackagesSearch] = useState("");
  const [selectedAgentPackageId, setSelectedAgentPackageId] = useState(null);
  const [packageAccordions, setPackageAccordions] = useState({
    inclusions: false,
    schedule: false,
    terms: false,
  });

  useEffect(() => {
    if (activeTab === "packages" && agentPackages.length === 0) {
      const fetchPackages = async () => {
        setAgentPackagesLoading(true);
        try {
          const res = await API.get("/dmc/package", { skipGlobalLoader: true });
          const rawPkgs = res.data?.data || [];
          const hydratedPkgs = rawPkgs.map((pkg) => {
            try {
              const queryKey = `agent_pkg_markup_${query?._id || query?.queryId}_${pkg._id}`;
              const globalKey = `agent_pkg_markup_${pkg._id}`;
              const savedStr = localStorage.getItem(queryKey) || localStorage.getItem(globalKey);
              if (savedStr) {
                const savedMarkup = JSON.parse(savedStr);
                const baseCost = Number(
                  pkg.costPrice ?? pkg.netPrice ?? pkg.basePrice ?? pkg.price ?? 225000,
                );
                const finalAmt =
                  savedMarkup.finalAmount ||
                  baseCost + Number(savedMarkup.markupAmount || 0);
                return {
                  ...pkg,
                  basePrice: baseCost,
                  costPrice: baseCost,
                  price: finalAmt,
                  clientTotalAmount: finalAmt,
                  agentMarkup: savedMarkup,
                  status: "Markup Applied",
                };
              }
            } catch (e) {
              // ignore parse errors
            }
            return pkg;
          });
          setAgentPackages(hydratedPkgs);
        } catch (err) {
          console.error("Error fetching packages for agent tab:", err);
          setAgentPackages([]);
        } finally {
          setAgentPackagesLoading(false);
        }
      };
      fetchPackages();
    }
  }, [activeTab, agentPackages.length, query?._id, query?.queryId]);

  const bookingConfirmedAt =
    query.activityLog
      ?.slice()
      .reverse()
      .find((log) => log?.action === "Booking Confirmed")?.timestamp || null;

  const isQueryRejected =
    query.agentStatus === "Rejected" || query.opsStatus === "Rejected";
  const rejectionReason = String(query.rejectionNote || "").trim();

  const getDisplayAction = (action) => {
    if (action === "Query Received") return "Query Created";
    if (action === "Client Approved") return "Booking Processed";
    return action;
  };

  const getActivityTheme = (action) => {
    const normalizedAction = getDisplayAction(action);

    const activityThemes = {
      "Query Created": {
        dot: "bg-[#3E63DD]",
        line: "bg-blue-100",
        surface: "border-blue-100 bg-blue-50/40 hover:bg-blue-50/70 transition-colors",
        badge: "bg-blue-50 text-[#3E63DD] border border-blue-200/80 font-medium",
        Icon: Sparkles,
      },
      "Query Accepted": {
        dot: "bg-blue-600",
        line: "bg-blue-100",
        surface: "border-blue-100 bg-blue-50/30 hover:bg-blue-50/60 transition-colors",
        badge: "bg-blue-50 text-blue-700 border border-blue-200/80 font-medium",
        Icon: BadgeCheck,
      },
      "Query Rejected": {
        dot: "bg-rose-500",
        line: "bg-rose-100",
        surface: "border-rose-100 bg-rose-50/40 hover:bg-rose-50/70 transition-colors",
        badge: "bg-rose-50 text-rose-700 border border-rose-200/80 font-medium",
        Icon: ShieldAlert,
      },
      "Revision Requested": {
        dot: "bg-amber-500",
        line: "bg-amber-100",
        surface: "border-amber-100 bg-amber-50/40 hover:bg-amber-50/70 transition-colors",
        badge: "bg-amber-50 text-amber-700 border border-amber-200/80 font-medium",
        Icon: ShieldAlert,
      },
      "Quote Sent": {
        dot: "bg-indigo-600",
        line: "bg-indigo-100",
        surface: "border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50/70 transition-colors",
        badge: "bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium",
        Icon: FileCheck2,
      },
      "Booking Processed": {
        dot: "bg-indigo-600",
        line: "bg-indigo-100",
        surface: "border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50/70 transition-colors",
        badge: "bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium",
        Icon: CheckCircle2,
      },
      "Booking Confirmed": {
        dot: "bg-emerald-600",
        line: "bg-emerald-100",
        surface: "border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors",
        badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium",
        Icon: CheckCircle2,
      },
      "Invoice Generated": {
        dot: "bg-indigo-600",
        line: "bg-indigo-100",
        surface: "border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50/70 transition-colors",
        badge: "bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium",
        Icon: CreditCard,
      },
      "Traveler Documents Submitted": {
        dot: "bg-slate-600",
        line: "bg-slate-200",
        surface: "border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors",
        badge: "bg-slate-100 text-slate-700 border border-slate-200/80 font-medium",
        Icon: FileCheck2,
      },
      "Traveler Documents Verified": {
        dot: "bg-emerald-600",
        line: "bg-emerald-100",
        surface: "border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors",
        badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium",
        Icon: CheckCircle2,
      },
      "Payment Submitted": {
        dot: "bg-blue-600",
        line: "bg-blue-100",
        surface: "border-blue-100 bg-blue-50/40 hover:bg-blue-50/70 transition-colors",
        badge: "bg-blue-50 text-blue-700 border border-blue-200/80 font-medium",
        Icon: CreditCard,
      },
      "Payment Verified": {
        dot: "bg-emerald-600",
        line: "bg-emerald-100",
        surface: "border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors",
        badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium",
        Icon: BadgeCheck,
      },
    };

    return (
      activityThemes[normalizedAction] || {
        dot: "bg-slate-500",
        line: "bg-slate-100",
        surface: "border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors",
        badge: "bg-slate-100 text-slate-700 border border-slate-200/80 font-medium",
        Icon: Clock3,
      }
    );
  };

  if (isCreatingProforma) {
    return (
      <div className="w-full min-h-screen bg-white font-sans antialiased">
        <CreateProformaInvoice
          onClose={() => setIsCreatingProforma(false)}
          onSave={(data) => {
            setProformaInvoiceData(data);
            setIsCreatingProforma(false);
            toast.success("Proforma Invoice saved successfully");
          }}
          queryData={query}
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="p- sm:p- font-sans antialiased max-w-[1600px] mx-auto"
    >
      <QueryHeaderCard
        handleClose={handleClose}
        query={query}
        quotes={quotes}
        activeTab={activeTab}
        headerStatusMeta={headerStatusMeta}
        headerLeadTraveler={headerLeadTraveler}
        headerCompany={headerCompany}
        headerDateRangeText={headerDateRangeText}
        headerDuration={headerDuration}
        headerPaxSummary={headerPaxSummary}
        headerTravelerCounts={headerTravelerCounts}
        headerPackageCurrency={headerPackageCurrency}
        headerPackageAmount={headerPackageAmount}
        activeQuote={activeQuote}
      />

      <QueryTabNavigation
        query={query}
        quotes={quotes}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeQuote={activeQuote}
      />
      <div className="w-full">
        {(activeTab === "basic" || activeTab === "quotes" || !activeTab) && (
          <div className="w-full flex flex-col lg:flex-row gap-3.5 items-stretch mb-8">
            {(() => {
              const displayQuotesList = sortedQuotes;

              if (displayQuotesList.length === 0) {
                const isQuotesTab = activeTab === "quotes";
                const isInProgress = query?.agentStatus === "In Progress";

                const headingText = isQuotesTab
                  ? "No quotations yet"
                  : isInProgress
                  ? "Quotation is in progress"
                  : "Quotation is pending";

                const subtext = isQuotesTab
                  ? "A quotation will appear here once it has been prepared for this query."
                  : isInProgress
                  ? "Operations team has accepted your query. Package price and quotation details will appear after a quotation is created."
                  : "This is a newly created query. Package price and quotation details will appear after a quotation is created.";

                return (
                  <>
                    <div className="flex-1 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-2xs">
                      {isQuotesTab ? (
                        <FileText size={28} className="mx-auto text-slate-400 mb-2" />
                      ) : (
                        <Clock3 size={28} className="mx-auto text-slate-400 mb-2" />
                      )}
                      <h3 className="text-base font-bold text-slate-900">
                        {headingText}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {subtext}
                      </p>
                    </div>

                    {!isQuotesTab && (
                      <div className="w-full lg:w-[280px] shrink-0 space-y-3.5">
                        {/* TASKS & COMMENTS */}
                        <div className="border border-slate-200 shadow-2xs rounded-xl overflow-hidden bg-white">
                          <div className="px-4 py-3 border-b border-slate-200 bg-[#f8fafc]">
                            <h3 className="font-bold text-base text-slate-900 font-sans">Tasks & Comments</h3>
                          </div>

                          <div className="p-4 space-y-3.5">
                            {tasks.length > 0 ? (
                              tasks.map((t) => (
                                <div key={t.id} className="relative space-y-1 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <p className="font-medium text-xs sm:text-[13px] text-slate-800 leading-relaxed whitespace-pre-line font-sans">{t.text}</p>
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-normal">
                                        <span>{t.timeAgo} by {t.author}</span>
                                        {t.dueDate && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-[10px] font-semibold text-blue-700 border border-blue-200/80">
                                            <CalendarDays size={10} className="text-blue-600 shrink-0" />
                                            {new Date(t.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Three dot action button */}
                                    <div className="relative shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setOpenTaskMenuId(openTaskMenuId === t.id ? null : t.id)}
                                        className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
                                      >
                                        <MoreVertical size={15} />
                                      </button>

                                      {/* Dropdown Popup */}
                                      {openTaskMenuId === t.id && (
                                        <div className="absolute right-0 top-7 z-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 px-2 whitespace-nowrap min-w-[130px] space-y-1">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleResolveTask(t.id)}
                                            className="w-full text-left px-2 py-1 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-all cursor-pointer"
                                          >
                                            {t.resolved ? "Mark as Unresolved" : "Mark as Resolved"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteTask(t.id)}
                                            className="w-full text-left px-2 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-all cursor-pointer flex items-center gap-1.5"
                                          >
                                            <Trash2 size={13} className="shrink-0" />
                                            Delete Task
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Checkmark row if resolved */}
                                  {t.resolved && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium pt-1">
                                      <Check size={14} className="text-slate-900 stroke-[2.5]" />
                                      <span>{t.resolvedBy || t.author}, {t.resolvedTimeAgo || t.timeAgo}</span>
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className={`${isAddingTask ? "hidden" : "min-h-[150px] flex flex-col items-center justify-center px-4 py-4 text-center"}`}>
  <h4 className="text-base font-bold text-slate-900">All caught up!</h4>
  <p className="mt-1.5 max-w-[230px] text-xs leading-relaxed text-slate-500">
    Add comments such as follow ups, required actions etc for better trip flow
  </p>
  <button
    type="button"
    onClick={() => setIsAddingTask(true)}
    className="mt-3 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#3E63DD] shadow-2xs transition-colors hover:bg-blue-50 cursor-pointer"
  >
    Add New
  </button>
</div>
                            )}

                            {isAddingTask ? (
                              <div className="pt-2 space-y-2 border-t border-slate-100">
                                <textarea
                                  rows={2.5}
                                  value={newTaskText}
                                  onChange={(e) => setNewTaskText(e.target.value)}
                                  placeholder="Enter task or comment..."
                                  className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3E63DD] font-sans resize-y custom-scroll"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleAddTask();
                                    }
                                    if (e.key === "Escape") {
                                      setIsAddingTask(false);
                                      setNewTaskText("");
                                      setNewTaskDueDate("");
                                    }
                                  }}
                                />

                                <div className="flex items-center gap-2">
                                  <input
                                    type="date"
                                    value={newTaskDueDate}
                                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                                    className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3E63DD] font-sans cursor-pointer"
                                  />
                                  <span className="text-[10.5px] text-slate-500 font-sans whitespace-nowrap">Target / Due Date</span>
                                </div>

                                <div className="flex items-center gap-2 pt-1 font-sans">
                                  <button
                                    type="button"
                                    onClick={handleAddTask}
                                    className="px-3.5 py-1.5 bg-[#3E63DD] hover:bg-[#3452b9] text-white text-xs font-semibold rounded-lg cursor-pointer shadow-2xs transition"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsAddingTask(false);
                                      setNewTaskText("");
                                      setNewTaskDueDate("");
                                    }}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg cursor-pointer transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={`${tasks.length === 0 ? "hidden" : "pt-1"}`}>
                                <button
                                  type="button"
                                  onClick={() => setIsAddingTask(true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-indigo-900 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                                >
                                  <Plus size={14} className="stroke-[2.5]" /> Add
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* REQUIREMENTS */}
                        <div className="border border-slate-200 shadow-2xs rounded-xl overflow-hidden bg-white font-sans">
                          <div className="px-4.5 py-3.5 border-b border-slate-200 bg-[#f8fafc]">
                            <h3 className="font-bold text-base text-slate-900 font-sans">Requirements</h3>
                            <p className="mt-0.5 text-xs text-slate-500 font-sans leading-snug">
                              Trip requirements & preferences submitted with this query.
                            </p>
                          </div>

                          <div className="p-4 space-y-4 font-sans">
                            <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-100 pb-3">
                              <div>
                                <p className="text-[11px] font-semibold text-slate-400">Dates</p>
                                <p className="font-bold text-slate-800 mt-0.5 text-xs leading-snug">
                                  {new Date(query.startDate).toLocaleDateString("en-IN")} - {new Date(query.endDate).toLocaleDateString("en-IN")}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold text-slate-400">Travelers</p>
                                <p className="font-bold text-slate-800 mt-0.5 text-xs leading-snug">
                                  {query.numberOfAdults} Adults
                                  {query.numberOfChildren > 0 && `, ${query.numberOfChildren} Kids`}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="text-[11px] font-semibold text-slate-400 mb-2">Preferences</p>
                              {query.specialRequirements ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {query.specialRequirements
                                    .split(/[.,;\n]/)
                                    .filter((item) => item.trim() !== "")
                                    .map((item, index) => (
                                      <span
                                        key={index}
                                        className="px-2.5 py-1 text-[9.5px] font-medium text-blue-800 bg-blue-50/80 border border-blue-200/80 rounded-2xl leading-normal text-left break-words max-w-full"
                                      >
                                        {item.trim()}
                                      </span>
                                    ))}
                                </div>
                              ) : (
                                <p className="font-medium text-slate-600 text-xs">No special preferences</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              }
              const activeIndex = selectedQuoteId
                ? displayQuotesList.findIndex((q) => q._id === selectedQuoteId)
                : 0;
              const index = activeIndex !== -1 ? activeIndex : 0;
              const quote = displayQuotesList[index] || activeQuote || displayQuotesList[0];
              const normalizedQuoteStatus = String(quote?.status || "").trim();
              const isLatestQuote = index === 0;
              const isAfterConversionQuote = Boolean(
                quote?.isAfterConversion ||
                quote?.isAfterConversionQuote ||
                quote?.isPostConversion ||
                quote?.sourceQuotationId ||
                quote?.status === "Revised" ||
                quote?.agentRevisionRemark ||
                (isLatestQuote && quotes.length > 1 && (quotes.some((q) => q.status === "Confirmed" || q.status === "Quote Accepted") || query?.agentStatus === "Revision Requested"))
              );

              const showAcceptActions = normalizedQuoteStatus === "Quote Sent";
              const showMarkupActions = ["Quote Accepted", "Markup Applied", "Sent to Client"].includes(normalizedQuoteStatus);
              const canShareQuote = ["Quote Accepted", "Markup Applied", "Sent to Client"].includes(normalizedQuoteStatus);
              const canConfirmClientApproval = normalizedQuoteStatus === "Sent to Client";
              const isClientApprovedQuote = normalizedQuoteStatus === "Confirmed";

              const opsQuoteAmount = Number(
                quote?.pricing?.totalAmount ?? quote?.totalAmount ?? 14500
              );
              const activeQuotePrice = Number(
                quote?.clientTotalAmount ?? opsQuoteAmount
              );
              const quoteTax = quote?.pricing?.tax || {};
              const gstPercent = Number(quoteTax?.gst?.percent || 0);
              const gstAmount = Number(quoteTax?.gst?.amount || 0);
              const tcsAmount = Number(quoteTax?.tcs?.amount || 0);
              const tourismTaxAmount = Number(quoteTax?.tourismFee?.amount || 0);
              const otherTaxAmount = tcsAmount + tourismTaxAmount;
              const totalTaxAmount = Number(quoteTax?.totalTax ?? (gstAmount + otherTaxAmount));
              const opsPreTaxAmount = Math.max(0, opsQuoteAmount - totalTaxAmount);
              const taxSummaryParts = [];
              if (gstPercent > 0) {
                taxSummaryParts.push(`GST ${gstPercent}%`);
              } else if (gstAmount > 0) {
                taxSummaryParts.push("GST");
              }

              const taxSummary = taxSummaryParts.length
                ? `${taxSummaryParts.join(" + ")} + other taxes`
                : "other taxes";

              const queryTravelerDetails = Array.isArray(query?.travelerDetails) ? query.travelerDetails : [];
              const travelerCounts = getQueryTravelerCounts(query);
              const adultTravelers = queryTravelerDetails.filter(
                (traveler) => String(traveler?.travelerType || "").trim().toLowerCase() !== "child",
              );
              const childTravelers = queryTravelerDetails.filter(
                (traveler) => String(traveler?.travelerType || "").trim().toLowerCase() === "child",
              );
              const childWithExtraBedTravelers = childTravelers.filter(
                (traveler) => Number(traveler?.childAge || 0) >= 5,
              );
              const childWithoutBedTravelers = childTravelers.filter(
                (traveler) => Number(traveler?.childAge || 0) < 5,
              );
              const unclassifiedChildCount = Math.max(0, travelerCounts.children - childTravelers.length);
              const travelerPriceCategories = [
                travelerCounts.adults > 0 && {
                  key: "adult",
                  count: travelerCounts.adults,
                  weight: 1,
                  label: `Person (${inferSharingLabel(quote?.services || [])})`,
                  paxLabel: `${travelerCounts.adults} Pax`,
                },
                childWithExtraBedTravelers.length > 0 && {
                  key: "child-with-bed",
                  count: childWithExtraBedTravelers.length,
                  weight: 0.6734,
                  label: "Child with Extra Bed/Mattress",
                  paxLabel: `${childWithExtraBedTravelers.length} Child${childWithExtraBedTravelers.length > 1 ? "ren" : ""}${childWithExtraBedTravelers.length === 1 && childWithExtraBedTravelers[0]?.childAge ? ` (${childWithExtraBedTravelers[0].childAge}y)` : ""}`,
                },
                (childWithoutBedTravelers.length + unclassifiedChildCount) > 0 && {
                  key: "child",
                  count: childWithoutBedTravelers.length + unclassifiedChildCount,
                  weight: 0.303,
                  label: "Child",
                  paxLabel: `${childWithoutBedTravelers.length + unclassifiedChildCount} Child${childWithoutBedTravelers.length + unclassifiedChildCount > 1 ? "ren" : ""}${childWithoutBedTravelers.length === 1 && unclassifiedChildCount === 0 && childWithoutBedTravelers[0]?.childAge ? ` (${childWithoutBedTravelers[0].childAge}y)` : ""}`,
                },
              ].filter(Boolean);
              const weightedTravelerCount = travelerPriceCategories.reduce(
                (sum, category) => sum + (category.count * category.weight),
                0,
              );
              let allocatedTravelerAmount = 0;
              const travelerPriceBreakdown = travelerPriceCategories.map((category, index) => {
                const isLastCategory = index === travelerPriceCategories.length - 1;
                const categoryTotal = isLastCategory
                  ? Math.max(0, Math.round(activeQuotePrice - allocatedTravelerAmount))
                  : Math.round(activeQuotePrice * ((category.count * category.weight) / weightedTravelerCount));
                allocatedTravelerAmount += categoryTotal;
                return {
                  ...category,
                  perTravelerAmount: Math.round(categoryTotal / category.count),
                };
              });

              const isValidRemark = (text) => {
                const str = String(text || "").trim();
                if (str.length < 4) return false;
                if (/^[a-z]\s+[a-z]\s+[a-z]+/i.test(str)) return false;
                return true;
              };

              const quotationRemarks = Array.isArray(quote?.additionalNotes)
                ? quote.additionalNotes.map((note) => String(note || "").trim()).filter(isValidRemark)
                : [];

              const hasMarkupApplied = Number(quote?.agentMarkup?.markupAmount || quote?.agentMarkup?.value || 0) > 0 || normalizedQuoteStatus === "Markup Applied";
              const isBookingConfirmedStage =
                ["Confirmed", "Voucher Generated", "Active Booking", "Booking Confirmed", "Completed", "Vouchered"].includes(query?.agentStatus) ||
                ["Confirmed", "Vouchered", "Payment_Completed"].includes(query?.opsStatus);
              const isClientApprovedStage =
                normalizedQuoteStatus === "Confirmed" ||
                ["Client Approved", "Booking Processed", "Payment Verified", "Invoice_Requested", "Booking_Accepted"].includes(query?.agentStatus) ||
                isBookingConfirmedStage;
              const isSharedWithClient =
                isClientApprovedStage ||
                normalizedQuoteStatus === "Sent to Client" ||
                Boolean(quote?.isSentToClient || quote?.sentToClientAt || quote?.sharedWithClient || query?.voucherStatus === "sent");

              let statusRemarkLine = "";
              if (isBookingConfirmedStage) {
                statusRemarkLine = "Quotation Status: Booking Confirmed & Vouchers Processed (Services confirmed with suppliers).";
              } else if (isClientApprovedStage) {
                statusRemarkLine = hasMarkupApplied
                  ? "Quotation Status: Client Approved & Booking Processed (Markup applied & shared with client)."
                  : "Quotation Status: Client Approved & Booking Processed (Proceeding for service bookings & invoicing).";
              } else if (isSharedWithClient) {
                if (hasMarkupApplied) {
                  statusRemarkLine = "Quotation Status: Client Markup is APPLIED & quotation is shared with client.";
                } else {
                  statusRemarkLine = "Quotation Status: NO Markup applied (Ops net cost quotation shared with client).";
                }
              } else if (hasMarkupApplied) {
                statusRemarkLine = "Quotation Status: Client Markup is APPLIED (Pending client sharing).";
              } else if (normalizedQuoteStatus === "Revision Requested") {
                statusRemarkLine = "Quotation Status: Quotation Revision requested with Operations.";
              } else if (normalizedQuoteStatus === "Quote Sent") {
                statusRemarkLine = "Quotation Status: Quote received from Operations (Pending agent markup & client sharing).";
              } else {
                statusRemarkLine = "Quotation Status: NO Markup applied (Raw Ops cost quotation).";
              }

              const agentActionRemarks = [];
              if (isBookingConfirmedStage) {
                agentActionRemarks.push("Trip is confirmed. Download traveler vouchers and itinerary from Docs portal to share with the client.");
              } else if (isClientApprovedStage) {
                agentActionRemarks.push("This quotation is client approved and can now proceed for service bookings.");
                agentActionRemarks.push("Upload client identity documents in the Docs portal and monitor service confirmations.");
              } else if (normalizedQuoteStatus === "Sent to Client") {
                agentActionRemarks.push("Share or resend the quotation with the client via WhatsApp or Email.");
                agentActionRemarks.push("After client confirmation, mark the selected quotation as Client Approved to proceed with booking.");
              } else if (["Quote Accepted", "Markup Applied"].includes(normalizedQuoteStatus)) {
                agentActionRemarks.push("Add or update the client markup to set the final selling price.");
                agentActionRemarks.push("Share the final quotation with the client by Email or WhatsApp.");
              } else if (normalizedQuoteStatus === "Quote Sent") {
                agentActionRemarks.push("Review and accept this Operations quotation before applying any client markup.");
              } else if (normalizedQuoteStatus === "Revision Requested") {
                agentActionRemarks.push("Review the revised quotation from Operations and continue with acceptance or sharing.");
              }
              const customerAgentRemarks = [statusRemarkLine, ...quotationRemarks, ...agentActionRemarks].filter(Boolean);

              const allQuoteServices = Array.isArray(quote?.services) ? quote.services : [];

              const isHotelItem = (s) => {
                const type = String(s?.type || s?.category || "").trim().toLowerCase();
                const title = String(s?.title || s?.hotelName || s?.name || "").trim().toLowerCase();
                if (type === "hotel" || type === "accommodation" || type === "stay") return true;
                if (s?.roomType || s?.starCategory || s?.hotelCategory || s?.starRating) return true;
                if (title.includes("hotel") || title.includes("resort") || title.includes("villas") || title.includes("inn") || title.includes("suites") || title.includes("hyatt") || title.includes("taj") || title.includes("eden") || title.includes("kandyan") || title.includes("amari")) return true;
                return false;
              };

              const hotelServices = allQuoteServices.filter((s) => isHotelItem(s));

              return (
                <>
                  {/* LEFT SIDEBAR LIST OF QUOTES (Only when All Quotes tab is active) */}
                  {activeTab === "quotes" && (
                    <div className="w-full md:w-36 lg:w-40 shrink-0 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs self-stretch flex flex-col">
                      <div className="divide-y divide-slate-100 shrink-0">
                        {displayQuotesList.map((item, qIdx) => {
                          const itemPrice = Number(
                            item?.clientTotalAmount ?? item?.pricing?.totalAmount ?? item?.totalAmount ?? 14500
                          );
                          const isSelected = selectedQuoteId
                            ? item._id === selectedQuoteId
                            : qIdx === index;
                          const quoteDate = item?.createdAt || item?.updatedAt;
                          const dateStr = quoteDate
                            ? formatDisplayDate(quoteDate, { month: "short" })
                            : "Date unavailable";
                          const durStr = `${query?.numberOfNights ? query.numberOfNights + 1 : 0}D`;
                          const paxStr = `${query?.numberOfAdults || 0}A`;
                          const timeAgo = quoteDate ? `Created ${getRelativeTimeString(quoteDate)}` : "Creation date unavailable";
                          const isClientApproved = item.status === "Confirmed";
                          const hasMarkup = Number(item?.agentMarkup?.markupAmount || item?.agentMarkup?.value || 0) > 0 || item.status === "Markup Applied";
                          const isSentToClient = item.status === "Sent to Client" || Boolean(item.isSentToClient || item.sentToClientAt || item.sharedWithClient);
                          const isBlueTheme = !isClientApproved && hasMarkup && isSentToClient;
                          const isGrayCheckTheme = !isClientApproved && !hasMarkup && isSentToClient;
                          const isGreenTheme = isClientApproved;

                          return (
                            <div
                              key={item._id || qIdx}
                              onClick={() => setSelectedQuoteId(item._id)}
                              className={`relative px-3 py-3 cursor-pointer transition-colors ${isSelected
                                ? "bg-[#f8fafc]"
                                : "hover:bg-slate-50"
                                }`}
                            >
                              {isSelected && (
                                <div className={`absolute right-0 top-0 bottom-0 w-[3.5px] ${isGreenTheme ? "bg-emerald-600" : isBlueTheme ? "bg-[#3b58b5]" : isGrayCheckTheme ? "bg-[#94a3b8]" : "bg-[#cbd5e1]"}`} />
                              )}
                              <div className="flex items-start justify-between gap-1">
                                <span
                                  className={`text-2xl sm:text-[26px] font-extrabold tracking-tight leading-none ${isBlueTheme
                                    ? "text-[#3b58b5]"
                                    : isGreenTheme
                                      ? "text-[#2e7d32]"
                                      : "text-[#475569]"
                                    }`}
                                >
                                  {Math.round(itemPrice).toLocaleString("en-IN")}
                                </span>
                                {(isBlueTheme || isGreenTheme || isGrayCheckTheme) && (
                                  <span
                                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold mt-0.5 ${isBlueTheme ? "bg-[#3b58b5]" : isGreenTheme ? "bg-[#2e7d32]" : "bg-[#64748b]"
                                      }`}
                                  >
                                    <Check size={11} strokeWidth={3.5} />
                                  </span>
                                )}
                              </div>
                              <p className="mt-1.5 text-xs font-extrabold text-slate-900">
                                {dateStr} • {durStr} • {paxStr}
                              </p>
                              <p className="mt-0.5 text-xs font-normal text-slate-500">
                                {timeAgo}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      {/* Empty filler element so sidebar white background extends to bottom */}
                      <div className="flex-1 bg-white min-h-[40px]" />
                    </div>
                  )}

                  {/* MAIN CONTENT AREA */}
                  <div className="flex-1 min-w-0 space-y-6">
                    {/* 1. LATEST QUOTE SECTION */}
                    <div>
                      {activeTab !== "quotes" && (
                        <h3 className="text-base font-bold text-slate-900 mb-2.5">Latest Quote</h3>
                      )}

                      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
                        {/* HEADER ROW: Package Quote Price & Action Buttons */}
                        <div className="relative flex flex-col gap-4 border-b border-slate-100 pb-3.5 lg:block">
                          <div className="w-full">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                              <span>Package Quote Price</span>
                              <Pencil size={13} className="text-slate-400 cursor-pointer hover:text-slate-600" />
                            </div>

                            {isClientApprovedQuote ? (
                              <div className="mt-3.5 overflow-hidden rounded-md border-2 border-emerald-500 bg-white">
                                <div className="bg-emerald-50 px-4 py-2 text-xs font-semibold text-slate-900">
                                  Used for Conversion
                                </div>
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 px-4 py-4">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-xs font-medium text-sky-600 uppercase tracking-wider">INR</span>
                                    <span className="text-2xl sm:text-3xl font-extrabold text-sky-600 tracking-tight leading-none">
                                      {Math.round(activeQuotePrice).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                  <span className="text-xs font-medium text-black">(inc. {taxSummary})</span>
                                  <span className="text-2xl font-light text-slate-500">/</span>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-xs font-medium text-slate-500">INR</span>
                                    <span className="text-xl font-medium text-slate-900">
                                      {Math.round(opsPreTaxAmount).toLocaleString("en-IN")}
                                    </span>
                                    <span className="text-xs text-slate-500 font-normal">(cost price)</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="my-3.5 py-1 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">INR</span>
                                  <span className="text-2xl sm:text-3xl font-extrabold text-sky-600 tracking-tight leading-none">
                                    {Math.round(activeQuotePrice).toLocaleString("en-IN")}
                                  </span>
                                </div>
                                <span className="text-xs font-normal text-black">(inc. {taxSummary})</span>
                                <span className="text-slate-300 font-light mx-1">/</span>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-xs font-semibold text-slate-700">
                                    INR {Math.round(opsPreTaxAmount).toLocaleString("en-IN")}
                                  </span>
                                  <span className="text-xs text-slate-400 font-normal">(cost price)</span>
                                </div>
                              </div>
                            )}

                            {travelerPriceBreakdown.length > 0 && (
                              <div className="mt-3 space-y-1 text-sm text-slate-900">
                                {travelerPriceBreakdown.map((item) => (
                                  <p key={item.key}>
                                    <span className="font-medium">{formatAmountValue(item.perTravelerAmount)}</span>
                                    <span className="mx-1.5 text-slate-400">/</span>
                                    <span>{item.label} x {item.paxLabel}</span>
                                  </p>
                                ))}
                              </div>
                            )}
                            {customerAgentRemarks.length > 0 && (
                              <div className="mt-4 border-l-2 border-emerald-200 pl-4 text-sm leading-6 text-[#087a42]">
                                <p className="font-medium">Customer/Agent Remarks:</p>
                                <ol className="mt-2 space-y-1.5">
                                  {customerAgentRemarks.map((remark, remarkIndex) => (
                                    <li key={`${remark}-${remarkIndex}`} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2">
                                      <span className="text-right">{remarkIndex + 1}.</span>
                                      <span>{remark}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                            <p className="mt-3 text-xs text-slate-500 font-normal">
                              Created {getRelativeTimeString(quote.createdAt)} by {quote.createdBy?.name || quote.createdByName || "joy Root"}
                            </p>

                            <div className="mt-2.5 flex flex-col items-start gap-1.5">
                              {isLatestQuote && (
                                <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                  Latest Quote
                                </span>
                              )}
                              {isAfterConversionQuote && (
                                <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-[#3b58b5] shadow-2xs">
                                  After Conversion Quote
                                </span>
                              )}
                            </div>
                          </div>

                          {/* ACTION BUTTONS TOP RIGHT */}
                          <div className="flex items-center gap-1.5 shrink-0 lg:absolute lg:right-0 lg:top-0 flex-wrap">
                            {showAcceptActions && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openAcceptModal(quote._id)}
                                  className="px-2.5 py-1.5 bg-[#15803d] text-white text-[11px] font-semibold rounded-md flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <CheckCircle2 size={13} />
                                  Accept Quote
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openRevisionModal(quote._id)}
                                  className="px-2.5 py-1.5 bg-[#b91c1c] text-white text-[11px] font-semibold rounded-md flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <RotateCcw size={13} />
                                  Request Revision
                                </button>
                              </>
                            )}

                            {showMarkupActions && (
                              <button
                                type="button"
                                onClick={() => openMarkupModal(quote)}
                                className="px-2.5 py-1.5 bg-[#3252c3] text-white text-[11px] font-semibold rounded-md flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                              >
                                Add Markup
                              </button>
                            )}

                            {canShareQuote && (
                              <button
                                type="button"
                                onClick={() => handleOpenSendModal(quote)}
                                className="px-2.5 py-1.5 border border-blue-200 bg-blue-50/80 text-[#2563eb] text-[11px] font-semibold rounded-md flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <Share2 size={13} className="text-[#2563eb]" />
                                Share
                              </button>
                            )}

                            <div className="relative" ref={threeDotsMenuRef}>
                                <button
                                  type="button"
                                  onClick={() => setShowThreeDotsMenu((prev) => !prev)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {showThreeDotsMenu && (
                                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-2xs py-1.5 z-[100] text-xs font-semibold text-slate-700">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setShowThreeDotsMenu(false);
                                        try {
                                          const url = await getClientPdfUrl(quote._id);
                                          if (url) window.open(url, "_blank");
                                        } catch (err) {
                                          toast.error("Unable to download PDF");
                                        }
                                      }}
                                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-700 font-medium transition-colors"
                                    >
                                      <FileText size={15} className="text-slate-500" />
                                      <span>Download PDF</span>
                                    </button>

                                    {canConfirmClientApproval && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowThreeDotsMenu(false);
                                          openClientApprovalModal(quote._id);
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-700 font-medium transition-colors border-t border-slate-100"
                                      >
                                        <CheckCircle2 size={15} className="text-emerald-600" />
                                        <span>Client Approved</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                          </div>
                        </div>

                        {/* TRIP SUMMARY PILL BOX AT BOTTOM OF QUOTE CARD */}
                        <div className="rounded-lg border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-700 flex flex-wrap items-center gap-2.5 shadow-2xs">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays size={14} className="text-slate-400" />
                            <span>
                              {formatDisplayDate(query?.startDate || "2026-06-11")} for {query?.numberOfNights ? query.numberOfNights + 1 : 6} Days
                            </span>
                          </div>
                          <span className="text-slate-300 font-bold">•</span>
                          <div className="flex items-center gap-1.5">
                            <Users size={14} className="text-slate-400" />
                            <span>
                              {headerPaxSummary}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. SERVICES SECTION */}
                    <div className="pt-2 space-y-4">
                      <h3 className="text-base font-bold text-slate-900">Services</h3>

                      {/* ACCOMMODATION SECTION */}
                      <div>
                        {/* Accommodation Header (Outside Card) */}
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 shrink-0">
                            <Bed size={16} />
                          </div>
                          <h3 className="font-bold text-sm text-slate-900">Accommodation</h3>
                        </div>

                        {/* Accommodation Table Card Grid */}
                        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                  <th className="py-2.5 px-4 font-semibold">Night</th>
                                  <th className="py-2.5 px-4 font-semibold">Hotel</th>
                                  <th className="py-2.5 px-4 font-semibold">Meal</th>
                                  <th className="py-2.5 px-4 font-semibold">Rooms</th>
                                  <th className="py-2.5 px-4 font-semibold text-right">Price</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 text-slate-700">
                                {(() => {
                                  const defaultHotels = [
                                    {
                                      nightLabel: "1st",
                                      dateStr: "19 Aug",
                                      hotelName: "Amari Colombo",
                                      city: "Colombo",
                                      starCount: 5,
                                      meal: "Breakfast and Dinner",
                                      room: "1 Superior City View",
                                      nights: 1,
                                      pax: "2 Pax",
                                      price: "1",
                                    },
                                    {
                                      nightLabel: "2nd",
                                      dateStr: "20 Aug",
                                      hotelName: "Grand Kandyan",
                                      city: "Kandy",
                                      starCount: 5,
                                      meal: "Breakfast and Dinner",
                                      room: "1 Deluxe Room",
                                      nights: 1,
                                      pax: "2 Pax",
                                      price: "1",
                                    },
                                    {
                                      nightLabel: "3rd",
                                      dateStr: "21 Aug",
                                      hotelName: "Grand Kandyan",
                                      city: "Kandy",
                                      starCount: 5,
                                      meal: "Breakfast and Dinner",
                                      room: "1 Deluxe Room",
                                      nights: 1,
                                      pax: "2 Pax",
                                      price: "1",
                                    },
                                    {
                                      nightLabel: "4th",
                                      dateStr: "22 Aug",
                                      hotelName: "Occidental Eden",
                                      city: "Bentota",
                                      starCount: 5,
                                      meal: "Breakfast and Dinner",
                                      room: "1 Superior Ocean View",
                                      nights: 1,
                                      pax: "2 Pax",
                                      price: "7,248.50",
                                    },
                                    {
                                      nightLabel: "5th",
                                      dateStr: "23 Aug",
                                      hotelName: "Occidental Eden",
                                      city: "Bentota",
                                      starCount: 5,
                                      meal: "Breakfast and Dinner",
                                      room: "1 Superior Ocean View",
                                      nights: 1,
                                      pax: "2 Pax",
                                      price: "7,248.50",
                                    },
                                  ];

                                  const rowsToRender = hotelServices.length > 0
                                    ? hotelServices.map((s, idx) => {
                                      const startDate = query?.startDate ? new Date(query.startDate) : new Date("2026-08-19");
                                      const currentDate = new Date(startDate);
                                      currentDate.setDate(currentDate.getDate() + idx);
                                      const nightNum = idx + 1;
                                      const nightSuffix = getOrdinalSuffix(nightNum);
                                      const stars = Number(
                                        String(s.starRating || s.hotelCategory || s.stars || "5").replace(/\D/g, "")
                                      ) || 5;
                                      const nVal = s.nights || s.numberOfNights || 1;
                                      const rCat = s.roomCategory || (query?.numberOfAdults === 1 ? "Single" : "Double");
                                      const bType = s.bedType || (String(s.title || s.name || "").toLowerCase().includes("heritage") ? "Queen" : "King");
                                      const rType = s.roomType || (String(s.title || s.name || "").toLowerCase().includes("deluxe") ? "Deluxe Room" : "Superior Room");

                                      const hAdults = Number(s.adults !== undefined && s.adults !== null ? s.adults : (query?.numberOfAdults || 0));
                                      const hChildren = Number(s.children !== undefined && s.children !== null ? s.children : (query?.numberOfChildren || 0));
                                      const hTotalPax = (hAdults > 0 || hChildren > 0) ? (hAdults + hChildren) : Number(s.pax || query?.numberOfTravelers || 2);
                                      const hPaxParts = [];
                                      if (hAdults > 0) hPaxParts.push(`${hAdults} Adult${hAdults > 1 ? 's' : ''}`);
                                      if (hChildren > 0) hPaxParts.push(`${hChildren} Child${hChildren > 1 ? 'ren' : ''}`);
                                      const hPaxDisplay = hPaxParts.length > 0 ? `${hTotalPax} Pax (${hPaxParts.join(", ")})` : `${hTotalPax} Pax`;

                                      const rCount = Number(s.rooms || 1);
                                      const directRoomNightRate = Number(s.roomPrice || s.unitPrice || s.ratePerNight || s.roomRate || s.pricePerNight || s.nightlyRate || 0);
                                      const explicitTotalPrice = Number(s.total || s.totalInInr || s.totalPrice || (s.isTotalPrice || s.isTotal ? s.price : 0));

                                      let unitRoomNightRate = 0;
                                      let itemPrice = 0;

                                      if (directRoomNightRate > 0) {
                                        unitRoomNightRate = directRoomNightRate;
                                        itemPrice = explicitTotalPrice > 0 ? explicitTotalPrice : (unitRoomNightRate * rCount * nVal);
                                      } else if (explicitTotalPrice > 0) {
                                        itemPrice = explicitTotalPrice;
                                        unitRoomNightRate = Math.round(itemPrice / (nVal * rCount));
                                      } else {
                                        unitRoomNightRate = Number(s.price || s.rate || 0);
                                        itemPrice = unitRoomNightRate * rCount * nVal;
                                      }

                                      const unitNightRate = itemPrice > 0 ? Math.round(itemPrice / nVal) : (unitRoomNightRate * rCount);

                                      let nightlyRateLabel = "/ Night";
                                      let breakdownDetailLabel = "";

                                      if (itemPrice > 0) {
                                        if (nVal > 1 && rCount > 1) {
                                          nightlyRateLabel = `₹${unitNightRate.toLocaleString("en-IN")} / Night`;
                                          breakdownDetailLabel = `([₹ ${unitRoomNightRate.toLocaleString("en-IN")} / Room / Night] × ${rCount} Rooms × ${nVal} Nights)`;
                                        } else if (nVal > 1) {
                                          nightlyRateLabel = `₹${unitNightRate.toLocaleString("en-IN")} / Night`;
                                          breakdownDetailLabel = `([₹ ${unitRoomNightRate.toLocaleString("en-IN")} / Room / Night] × ${rCount} Room${rCount > 1 ? "s" : ""} × ${nVal} Nights)`;
                                        } else if (rCount > 1) {
                                          nightlyRateLabel = `₹${unitRoomNightRate.toLocaleString("en-IN")} / Room / Night`;
                                          breakdownDetailLabel = `([₹ ${unitRoomNightRate.toLocaleString("en-IN")} / Room / Night] × ${rCount} Rooms × 1 Night)`;
                                        } else {
                                          nightlyRateLabel = `₹${unitNightRate.toLocaleString("en-IN")} / Night`;
                                          breakdownDetailLabel = `([₹ ${unitRoomNightRate.toLocaleString("en-IN")} / Room / Night] × 1 Room × 1 Night)`;
                                        }
                                      }

                                      return {
                                        nightLabel: `${nightNum}${nightSuffix}`,
                                        dateStr: currentDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
                                        hotelName: s.title || s.hotelName || s.name || "Amari Colombo",
                                        city: s.city || query?.destination || "Colombo",
                                        starCount: stars,
                                        meal: s.mealPlan || s.description || "Breakfast and Dinner",
                                        room: `${s.rooms || 1} ${rType}`,
                                        roomCategory: rCat,
                                        bedType: bType,
                                        roomType: rType,
                                        nights: nVal,
                                        pax: hPaxDisplay,
                                        nightlyRateLabel,
                                        breakdownDetailLabel,
                                        price: itemPrice > 0 ? Number(itemPrice).toLocaleString("en-IN") : "0",
                                      };
                                    })
                                    : defaultHotels;

                                  const totalAcc = rowsToRender.reduce((acc, r) => {
                                    const val = Number(String(r.price || "0").replace(/,/g, "")) || 0;
                                    return acc + val;
                                  }, 0);

                                  return (
                                    <>
                                      {rowsToRender.map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="py-3.5 px-4 align-top">
                                            <p className="font-bold text-slate-900 text-sm">{row.nightLabel}</p>
                                            <p className="text-xs text-slate-400 font-normal mt-0.5">{row.dateStr}</p>
                                          </td>
                                          <td className="py-3.5 px-4 align-top">
                                            <p className="font-bold text-slate-900 text-sm">{row.hotelName}</p>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-normal mt-0.5 flex-wrap">
                                              <span>{row.city}, {row.starCount || 5} Star</span>
                                              <div className="flex items-center gap-0.5 text-amber-400 ml-0.5">
                                                {Array.from({ length: row.starCount || 5 }).map((_, sIdx) => (
                                                  <MdStarBorderPurple500 key={sIdx} className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                ))}
                                              </div>
                                            </div>
                                            {/* Room Category, Bed Type, Room Type Badges */}
                                            <div className="flex items-center gap-1 flex-wrap text-[10.5px] mt-1.5">
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                                                <span className="text-slate-400 font-bold uppercase text-[9px]">Cat:</span> {row.roomCategory || "Double"}
                                              </span>
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                                                <span className="text-slate-400 font-bold uppercase text-[9px]">Bed:</span> {row.bedType || "King"}
                                              </span>
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                                                <span className="text-blue-400 font-bold uppercase text-[9px]">Type:</span> {row.roomType || "Superior Room"}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="py-3.5 px-4 align-top text-[11px] text-slate-500 font-normal leading-snug">
                                            {(() => {
                                              const text = String(row.meal || "");
                                              const parts = text.split(/\s*\|\s*/).filter(Boolean);
                                              if (parts.length <= 2) {
                                                return (
                                                  <p>
                                                    {parts.map((p, i) => (
                                                      <span key={i}>
                                                        {i > 0 && <span className="text-slate-400 font-medium mx-1">|</span>}
                                                        {p}
                                                      </span>
                                                    ))}
                                                  </p>
                                                );
                                              }
                                              const mid = Math.ceil(parts.length / 2);
                                              const line1Parts = parts.slice(0, mid);
                                              const line2Parts = parts.slice(mid);
                                              return (
                                                <div className="space-y-0.5">
                                                  <p>
                                                    {line1Parts.map((p, i) => (
                                                      <span key={i}>
                                                        {i > 0 && <span className="text-slate-400 font-medium mx-1">|</span>}
                                                        {p}
                                                      </span>
                                                    ))}
                                                    <span className="text-slate-400 font-medium mx-1">|</span>
                                                  </p>
                                                  <p>
                                                    {line2Parts.map((p, i) => (
                                                      <span key={i}>
                                                        {i > 0 && <span className="text-slate-400 font-medium mx-1">|</span>}
                                                        {p}
                                                      </span>
                                                    ))}
                                                  </p>
                                                </div>
                                              );
                                            })()}
                                          </td>
                                          <td className="py-3.5 px-4 align-top">
                                            <p className="font-bold text-slate-900 text-sm">{row.room}</p>
                                            <p className="text-xs text-slate-400 font-normal mt-0.5">
                                              {row.nights ? `${row.nights} Night${row.nights > 1 ? "s" : ""} • ` : "1 Night • "}{row.pax}
                                            </p>
                                          </td>
                                          <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                                            <p className="text-base font-bold text-slate-900">
                                              <span className="text-[11px] text-slate-400 font-normal uppercase mr-1">INR</span>
                                              {row.price}
                                            </p>
                                            {row.nightlyRateLabel && (
                                              <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                                                {row.nightlyRateLabel}
                                              </p>
                                            )}
                                            {row.breakdownDetailLabel && (
                                              <p className="text-[10px] font-normal text-slate-400 mt-0.5">
                                                {row.breakdownDetailLabel}
                                              </p>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Accommodation Footer Total (Standalone under table) */}
                        <div className="mt-3 flex justify-end">
                          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-2xs">
                            Total: <span className="text-[10px] text-slate-400 uppercase font-normal ml-1">INR</span>{" "}
                            <span className="font-bold text-slate-900 text-sm">
                              {Math.round(
                                hotelServices.length > 0
                                  ? hotelServices.reduce((acc, s) => {
                                      const nVal = Number(s.nights || query?.numberOfNights || 1);
                                      const rCount = Number(s.rooms || 1);
                                      const directRoomNightRate = Number(s.roomPrice || s.unitPrice || s.ratePerNight || s.roomRate || s.pricePerNight || s.nightlyRate || 0);
                                      const explicitTotalPrice = Number(s.total || s.totalInInr || s.totalPrice || (s.isTotalPrice || s.isTotal ? s.price : 0));
                                      let calcItemPrice = 0;
                                      if (directRoomNightRate > 0) {
                                        calcItemPrice = explicitTotalPrice > 0 ? explicitTotalPrice : (directRoomNightRate * rCount * nVal);
                                      } else if (explicitTotalPrice > 0) {
                                        calcItemPrice = explicitTotalPrice;
                                      } else {
                                        calcItemPrice = Number(s.price || s.rate || 0) * rCount * nVal;
                                      }
                                      return acc + calcItemPrice;
                                    }, 0)
                                  : 14500
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 1. TRANSFERS / TRANSPORTATION CARD */}
                      {(() => {
                        const allServices = Array.isArray(quote?.services) ? quote.services : [];
                        const transferServices = allServices.filter((s) => {
                          if (isHotelItem(s)) return false;
                          const cat = String(s?.type || s?.category || s?.title || s?.name || "").toLowerCase();
                          return cat.includes("transfer") || cat.includes("transport") || cat.includes("cab") || cat.includes("car") || cat.includes("drop") || cat.includes("pickup") || cat.includes("airport");
                        });

                        const defaultTransferGroups = [
                          {
                            dayLabel: "1st Day",
                            dateStr: "26 Dec 2026",
                            items: [
                              {
                                title: "Calangute North Goa Sightseeing",
                                description: "Calangute | Baga | Anjuna | Fort Aguada | 8 Hours | Driver | Fuel Included",
                                qty: "full day | 6 Pax | SUV",
                                rateBreakdown: "0",
                                price: "4,000",
                              },
                            ],
                          },
                          {
                            dayLabel: "2nd Day",
                            dateStr: "27 Dec 2026",
                            items: [
                              {
                                title: "Margao Airport South Goa Transfer",
                                description: "Goa Airport to Margao Hotel | AC Sedan | Driver Included | Meet & Greet",
                                qty: "point to point | 3 Pax | Sedan",
                                rateBreakdown: "0",
                                price: "2,400",
                              },
                            ],
                          },
                        ];

                        let displayTransferGroups = defaultTransferGroups;

                        if (transferServices.length > 0) {
                          const groupMap = {};
                          transferServices.forEach((s, sIdx) => {
                            const dateKey = s.serviceDate || s.date || `day_${sIdx}`;
                            if (!groupMap[dateKey]) {
                              const dayNum = sIdx + 1;
                              const nightSuffix = getOrdinalSuffix(dayNum);
                              const formattedDate = s.serviceDate || s.date
                                ? formatDisplayDate(s.serviceDate || s.date, { month: "short", day: "numeric", weekday: "short" })
                                : `${dayNum}${nightSuffix} Day`;

                              groupMap[dateKey] = {
                                dayLabel: `${dayNum}${nightSuffix} Day`,
                                dateStr: formattedDate,
                                items: [],
                              };
                            }

                            const usageLabel = s.transportUsageLabel || s.usageType || s.quantityLabel || s.routeType || "One Way / Airport Transfer";

                            const tAdults = Number(s.adults !== undefined && s.adults !== null ? s.adults : (query?.numberOfAdults || 0));
                            const tChildren = Number(s.children !== undefined && s.children !== null ? s.children : (query?.numberOfChildren || 0));
                            const tInfants = Number(s.infants !== undefined && s.infants !== null ? s.infants : 0);
                            const tTotalPax = (tAdults > 0 || tChildren > 0 || tInfants > 0) ? (tAdults + tChildren + tInfants) : Number(s.pax || query?.numberOfTravelers || 1);

                            const tPaxParts = [];
                            if (tAdults > 0) tPaxParts.push(`${tAdults} Adult${tAdults > 1 ? 's' : ''}`);
                            if (tChildren > 0) tPaxParts.push(`${tChildren} Child${tChildren > 1 ? 'ren' : ''}`);
                            if (tInfants > 0) tPaxParts.push(`${tInfants} Infant${tInfants > 1 ? 's' : ''}`);
                            const tPaxDisplay = tPaxParts.length > 0 ? `${tTotalPax} Pax (${tPaxParts.join(", ")})` : `${tTotalPax} Pax`;

                            const vehicleStr = s.vehicle || s.vehicleType || "Sedan";
                            const passengerCap = s.passengerCapacity || s.maxPax || s.paxCapacity || s.passengers || (vehicleStr.toUpperCase().includes("SUV") ? 6 : 4);
                            const luggageCap = s.luggageCapacity || s.maxLuggage || s.luggage || s.bags || (vehicleStr.toUpperCase().includes("SUV") ? 4 : 2);

                            groupMap[dateKey].items.push({
                              title: s.title || s.name || s.particulars || "Transfer Service",
                              description: s.description || s.particularsDetails || s.details || "",
                              pickupTime: s.pickupTime || s.time || s.selectedSlot || "",
                              usageLabel,
                              paxDisplay: tPaxDisplay,
                              vehicleStr,
                              passengerCap,
                              luggageCap,
                              rateBreakdown: s.rateBreakdown || s.notes || "",
                              price: s.price ? Number(s.price).toLocaleString("en-IN") : "0",
                            });
                          });

                          displayTransferGroups = Object.values(groupMap);
                        }

                        const transferTotal = displayTransferGroups.reduce((acc, g) => {
                          return acc + g.items.reduce((iAcc, item) => {
                            const p = Number(String(item.price || "0").replace(/,/g, "")) || 0;
                            return iAcc + p;
                          }, 0);
                        }, 0);

                        return (
                          <div className="mt-4">
                            {/* Header (Outside Card) */}
                            <div className="flex items-center gap-2.5 mb-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 shrink-0">
                                <Car size={16} />
                              </div>
                              <h3 className="font-bold text-sm text-slate-900">Transfers & Transportation</h3>
                            </div>

                            {/* Card Body Grid */}
                            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                              <div className="divide-y divide-slate-100">
                                {displayTransferGroups.map((group, gIdx) => (
                                  <div
                                    key={gIdx}
                                    className="flex flex-col sm:flex-row p-4 gap-3 sm:gap-6 hover:bg-slate-50/40 transition-colors"
                                  >
                                    {/* Left Day Column */}
                                    <div className="w-full sm:w-28 lg:w-32 shrink-0">
                                      <p className="font-bold text-slate-900 text-sm">{group.dayLabel}</p>
                                      <p className="text-xs text-slate-500 font-medium mt-0.5">{group.dateStr}</p>
                                    </div>

                                    {/* Right Items Column */}
                                    <div className="flex-1 space-y-3">
                                      {group.items.map((item, iIdx) => (
                                        <div
                                          key={iIdx}
                                          className="rounded-lg border border-slate-200/80 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                                        >
                                          {/* Left: Title & Description */}
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 text-sm leading-snug">
                                              {item.title}
                                            </h4>
                                            {item.description && (() => {
                                              const text = String(item.description || "");
                                              const parts = text.split(/\s*\|\s*/).filter(Boolean);
                                              if (parts.length <= 3) {
                                                return <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">{text}</p>;
                                              }
                                              let breakIdx = 4;
                                              for (let i = 0; i < parts.length; i++) {
                                                const p = parts[i].toLowerCase();
                                                if (p.includes("hours") || p.includes("full day") || p.includes("half day")) {
                                                  breakIdx = i + 1;
                                                  break;
                                                }
                                              }
                                              if (breakIdx >= parts.length) breakIdx = Math.ceil(parts.length / 2);
                                              const line1 = parts.slice(0, breakIdx).join(" | ") + " |";
                                              const line2 = parts.slice(breakIdx).join(" | ");
                                              return (
                                                <div className="text-xs text-slate-500 font-normal mt-1 leading-relaxed space-y-0.5">
                                                  <p>{line1}</p>
                                                  <p>{line2}</p>
                                                </div>
                                              );
                                            })()}
                                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                                              {item.pickupTime && (
                                                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 border border-amber-200">
                                                  ⏰ Pickup Time: {item.pickupTime}
                                                </span>
                                              )}
                                              {item.passengerCap && (
                                                <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 border border-slate-200">
                                                  👥 Max Pax: {item.passengerCap} Passengers
                                                </span>
                                              )}
                                              {item.luggageCap && (
                                                <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 border border-slate-200">
                                                  🧳 Luggage: {item.luggageCap} Bags
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Middle: QTY Column (Center Aligned, Fixed Width) */}
                                          <div className="text-left sm:text-center shrink-0 w-44 sm:w-56">
                                            <p className="font-bold text-slate-900 text-sm">{item.usageLabel}</p>
                                            <p className="text-xs text-slate-600 font-semibold mt-0.5">{item.paxDisplay}</p>
                                            <p className="text-[11px] text-slate-400 font-normal mt-0.5">{item.vehicleStr}</p>
                                            {item.rateBreakdown && item.rateBreakdown !== "0" && (
                                              <p className="text-[11px] text-slate-400 font-normal mt-1">
                                                {item.rateBreakdown}
                                              </p>
                                            )}
                                          </div>

                                          {/* Right: Price */}
                                          <div className="text-left sm:text-right shrink-0 whitespace-nowrap">
                                            <p className="text-sm font-bold text-slate-900">
                                              <span className="text-[10px] text-slate-400 font-normal uppercase mr-1">INR</span>
                                              {item.price}
                                            </p>
                                            <p className="text-[11px] text-slate-400 font-normal mt-0.5">/ N/A</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Transfers Footer Total (Standalone under card) */}
                            <div className="mt-3 flex justify-end">
                              <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-2xs">
                                Total: <span className="text-[10px] text-slate-400 uppercase font-normal ml-1">INR</span>{" "}
                                <span className="font-bold text-slate-900 text-sm">
                                  {Math.round(transferTotal).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 2. ACTIVITIES & SIGHTSEEING CARD */}
                      {(() => {
                        const allServices = Array.isArray(quote?.services) ? quote.services : [];
                        const activityServices = allServices.filter((s) => {
                          const cat = String(s?.type || s?.category || "").toLowerCase();
                          return cat.includes("activity") || cat.includes("sightseeing") || cat.includes("excursion") || cat.includes("tour");
                        });

                        const defaultActivityGroups = [
                          {
                            dayLabel: "1st Day",
                            dateStr: "28 Dec 2026",
                            items: [
                              {
                                title: "South Goa Beach Hopping",
                                description: "Palolem | Agonda | Cola | Private Boat | Snorkeling | Lunch Included | Full Day",
                                qty: "1D | 2 Pax",
                                rateBreakdown: "0",
                                price: "0",
                              },
                              {
                                title:
                                  "Alcazar Show with Transfers (Normal Seat) (Evening) (ADT/CHD Rate is Same)",
                                description: "Private Transfer",
                                qty: "1D | 2 Adults, 1 Child (3-12)",
                                rateBreakdown: "13,500 * 2   2,000 * 1",
                                price: "29,000",
                              },
                            ],
                          },
                          {
                            dayLabel: "2nd Day",
                            dateStr: "29 Dec 2026",
                            items: [
                              {
                                title: "Old Goa Churches Full Circuit",
                                description: "6 UNESCO Churches | Museum of Christian Art | Convent | Guide | Full Day",
                                qty: "1D | 2 Pax",
                                rateBreakdown: "0",
                                price: "0",
                              },
                            ],
                          },
                        ];

                        let displayActivityGroups = defaultActivityGroups;

                        if (activityServices.length > 0) {
                          const groupMap = {};
                          activityServices.forEach((s, sIdx) => {
                            const dateKey = s.serviceDate || s.date || `day_${sIdx}`;
                            if (!groupMap[dateKey]) {
                              const dayNum = sIdx + 1;
                              const nightSuffix = getOrdinalSuffix(dayNum);
                              const formattedDate = s.serviceDate || s.date
                                ? formatDisplayDate(s.serviceDate || s.date, { month: "short", day: "numeric", weekday: "short" })
                                : `${dayNum}${nightSuffix} Day`;

                              groupMap[dateKey] = {
                                dayLabel: `${dayNum}${nightSuffix} Day`,
                                dateStr: formattedDate,
                                items: [],
                              };
                            }

                            const queryAdults = Number(query?.numberOfAdults || 1);
                            const queryChildren = Number(query?.numberOfChildren || 0);

                            const numAdults = Number(s.adults !== undefined && s.adults !== null && s.adults !== "" ? s.adults : queryAdults);
                            const numChildren = Number(s.children !== undefined && s.children !== null && s.children !== "" ? s.children : queryChildren);
                            const numInfants = Number(s.infants !== undefined && s.infants !== null && s.infants !== "" ? s.infants : 0);
                            const hasBreakdown = (numAdults > 0 || numChildren > 0 || numInfants > 0);
                            const totalPax = hasBreakdown ? (numAdults + numChildren + numInfants) : Number(s.pax || queryAdults);

                            let paxBreakdownStr = "";
                            if (hasBreakdown) {
                              const parts = [];
                              if (numAdults > 0) parts.push(`${numAdults} Adult${numAdults > 1 ? 's' : ''}`);
                              if (numChildren > 0) parts.push(`${numChildren} Child${numChildren > 1 ? 'ren' : ''}`);
                              if (numInfants > 0) parts.push(`${numInfants} Infant${numInfants > 1 ? 's' : ''}`);
                              paxBreakdownStr = `${totalPax} Pax (${parts.join(", ")})`;
                            } else {
                              paxBreakdownStr = `${totalPax} Pax`;
                            }

                            // Format Duration
                            const rawDuration = String(s.duration || "").trim();
                            let formattedDuration = "";
                            if (rawDuration) {
                              const numDur = Number(rawDuration);
                              if (!isNaN(numDur) && numDur > 0) {
                                const hrs = numDur / 60;
                                formattedDuration = hrs >= 1 ? `${hrs % 1 === 0 ? hrs : hrs.toFixed(1)} Hours` : `${numDur} Mins`;
                              } else {
                                formattedDuration = rawDuration;
                              }
                            }

                            const openTime = s.openingTime || "";
                            const closeTime = s.closingTime || "";
                            const timingsDisplay = openTime && closeTime ? `${openTime} - ${closeTime}` : openTime;

                            const adultP = Number(s.adultPrice || s.adult_price || 0);
                            const childP = Number(s.childPrice || s.child_price || 0);

                            let calculatedItemTotal = 0;
                            if (adultP > 0 || childP > 0) {
                              calculatedItemTotal = (numAdults * adultP) + (numChildren * childP);
                            } else {
                              calculatedItemTotal = Number(s.price || s.totalPrice || s.amount || 0);
                            }

                            groupMap[dateKey].items.push({
                              title: s.title || s.name || s.particulars || "Activity / Sightseeing",
                              description: s.description || s.particularsDetails || s.details || "",
                              qty: s.quantityLabel || paxBreakdownStr,
                              tourType: s.tourType || s.tour_type || "Sharing Tour",
                              selectedSlot: s.selectedSlot || s.slot || s.time || "",
                              duration: formattedDuration,
                              operatingDays: s.operatingDays || "",
                              timings: timingsDisplay,
                              adultPrice: adultP,
                              childPrice: childP,
                              adultsCount: numAdults,
                              childrenCount: numChildren,
                              rateBreakdown: s.rateBreakdown || s.notes || "",
                              numericPrice: calculatedItemTotal,
                              price: Math.round(calculatedItemTotal).toLocaleString("en-IN"),
                            });
                          });

                          displayActivityGroups = Object.values(groupMap);
                        }

                        const activityTotal = displayActivityGroups.reduce((acc, g) => {
                          return acc + g.items.reduce((iAcc, item) => {
                            return iAcc + (item.numericPrice || Number(String(item.price || "0").replace(/,/g, "")) || 0);
                          }, 0);
                        }, 0);

                        return (
                          <div className="mt-4">
                            {/* Header (Outside Card) */}
                            <div className="flex items-center gap-2.5 mb-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 shrink-0">
                                <Target size={16} />
                              </div>
                              <h3 className="font-bold text-sm text-slate-900">Activities & Sightseeing</h3>
                            </div>

                            {/* Card Body Grid */}
                            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                              <div className="divide-y divide-slate-100">
                                {displayActivityGroups.map((group, gIdx) => (
                                  <div
                                    key={gIdx}
                                    className="flex flex-col sm:flex-row p-4 gap-3 sm:gap-6 hover:bg-slate-50/40 transition-colors"
                                  >
                                    {/* Left Day Column */}
                                    <div className="w-full sm:w-28 lg:w-32 shrink-0">
                                      <p className="font-bold text-slate-900 text-sm">{group.dayLabel}</p>
                                      <p className="text-xs text-slate-500 font-medium mt-0.5">{group.dateStr}</p>
                                    </div>

                                    {/* Right Items Column */}
                                    <div className="flex-1 space-y-3">
                                      {group.items.map((item, iIdx) => (
                                        <div
                                          key={iIdx}
                                          className="rounded-lg border border-slate-200/80 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                                        >
                                          {/* Left: Title & Description */}
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 text-sm leading-snug">
                                              {item.title}
                                            </h4>
                                            {item.description && (() => {
                                              const text = String(item.description || "");
                                              const parts = text.split(/\s*\|\s*/).filter(Boolean);
                                              if (parts.length <= 3) {
                                                return <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">{text}</p>;
                                              }
                                              let breakIdx = 4;
                                              for (let i = 0; i < parts.length; i++) {
                                                const p = parts[i].toLowerCase();
                                                if (p.includes("hours") || p.includes("full day") || p.includes("half day")) {
                                                  breakIdx = i + 1;
                                                  break;
                                                }
                                              }
                                              if (breakIdx >= parts.length) breakIdx = Math.ceil(parts.length / 2);
                                              const line1 = parts.slice(0, breakIdx).join(" | ") + " |";
                                              const line2 = parts.slice(breakIdx).join(" | ");
                                              return (
                                                <div className="text-xs text-slate-500 font-normal mt-1 leading-relaxed space-y-0.5">
                                                  <p>{line1}</p>
                                                  <p>{line2}</p>
                                                </div>
                                              );
                                            })()}
                                            {/* Rich Info Badges for Activities */}
                                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                                              {item.tourType && (
                                                <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 border border-blue-200">
                                                  ● {item.tourType}
                                                </span>
                                              )}
                                              {item.selectedSlot && (
                                                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 border border-amber-200">
                                                  ⏰ Slot: {item.selectedSlot}
                                                </span>
                                              )}
                                              {item.duration && (
                                                <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 font-semibold text-purple-800 border border-purple-200">
                                                  ⏱️ Duration: {item.duration}
                                                </span>
                                              )}
                                              {item.operatingDays && (
                                                <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 border border-slate-200">
                                                  📅 {item.operatingDays}
                                                </span>
                                              )}
                                              {item.timings && (
                                                <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 border border-slate-200">
                                                  ⌛ {item.timings}
                                                </span>
                                              )}
                                            </div>
                                            {(item.adultPrice > 0 || item.childPrice > 0) && (
                                              <div className="mt-1 text-xs font-semibold text-emerald-700">
                                                {item.adultPrice > 0 && `Adult: ₹${item.adultPrice.toLocaleString("en-IN")}`}
                                                {item.childPrice > 0 && ` | Child: ₹${item.childPrice.toLocaleString("en-IN")}`}
                                              </div>
                                            )}
                                          </div>

                                          {/* Middle: QTY Column (Center Aligned, Fixed Width) */}
                                          <div className="text-left sm:text-center shrink-0 w-36 sm:w-44">
                                            {(() => {
                                              const qtyStr = String(item.qty || "");
                                              const formattedWithDots = qtyStr.replace(/\s*\|\s*/g, " • ");
                                              const parts = formattedWithDots.split(" • ");
                                              const firstPart = parts[0] || "";
                                              const restParts = parts.slice(1).join(" • ");

                                              return (
                                                <div>
                                                  <p className="font-bold text-slate-900 text-sm">{firstPart}</p>
                                                  {restParts && (
                                                    <p className="text-xs text-slate-400 font-normal mt-0.5">{restParts}</p>
                                                  )}
                                                </div>
                                              );
                                            })()}
                                            {item.rateBreakdown && item.rateBreakdown !== "0" && (
                                              <p className="text-[11px] text-slate-400 font-normal mt-1">
                                                {item.rateBreakdown}
                                              </p>
                                            )}
                                          </div>

                                          {/* Right: Price */}
                                          <div className="text-left sm:text-right shrink-0 whitespace-nowrap">
                                            <p className="text-base font-bold text-slate-900">
                                              <span className="text-[11px] text-slate-400 font-normal uppercase mr-1">INR</span>
                                              {item.price}
                                            </p>
                                            {item.adultsCount > 0 && item.adultPrice > 0 ? (
                                              <>
                                                <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                                                  ₹{item.adultPrice.toLocaleString("en-IN")} / Person
                                                </p>
                                                <p className="text-[10px] font-normal text-slate-400 mt-0.5">
                                                  ({item.adultsCount} Adults × ₹{item.adultPrice.toLocaleString("en-IN")}{item.childrenCount > 0 && item.childPrice > 0 ? ` + ${item.childrenCount} Children × ₹${item.childPrice.toLocaleString("en-IN")}` : ""})
                                                </p>
                                              </>
                                            ) : (
                                              <p className="text-[11px] text-slate-400 font-normal mt-0.5">Total</p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Activities Footer Total (Standalone under card) */}
                            <div className="mt-3 flex justify-end">
                              <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-2xs">
                                Total: <span className="text-[10px] text-slate-400 uppercase font-normal ml-1">INR</span>{" "}
                                <span className="font-bold text-slate-900 text-sm">
                                  {Math.round(activityTotal).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* 4. INCLUSIONS & EXCLUSIONS SECTION */}
                    <div className="border-t border-slate-200 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsIncExcExpanded(!isIncExcExpanded)}
                        className="flex items-center gap-2.5 text-base sm:text-[17px] font-bold text-slate-900 cursor-pointer py-2.5 w-full text-left"
                      >
                        <ChevronRight size={18} className={`transition-transform duration-200 ${isIncExcExpanded ? "rotate-90" : ""}`} />
                        <span>Inclusions/Exclusions</span>
                      </button>

                      {isIncExcExpanded && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 pl-6">
                          {/* Inclusions */}
                          <div>
                            <div className="border-b-2 border-emerald-500 pb-1 mb-3 inline-block">
                              <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase">Inclusions</h4>
                            </div>
                            <ul className="space-y-2">
                              {(quote.inclusions?.length > 0 ? quote.inclusions : [
                                "Stay as mentioned above or in Similar hotels",
                                "Meals as mentioned in the Itinerary",
                                "Enterances only as mentioned in Itinerary",
                                "Transport as per Itinerary - Point to Point Basis",
                                "Taxes as on Date"
                              ]).map((inc, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-relaxed">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                                  <span>{inc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Exclusions */}
                          <div>
                            <div className="border-b-2 border-rose-400 pb-1 mb-3 inline-block">
                              <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase">Exclusions</h4>
                            </div>
                            <ul className="space-y-2">
                              {(quote.exclusions?.length > 0 ? quote.exclusions : [
                                "Airfare",
                                "Early Check and Late Check out charges",
                                "Personal Expenses - Room Service, Laundry, Porterage or Mini Bar etc",
                                "Hotel Security Deposit - Refundable at time of checkout",
                                "TCS and GST - 2 and 5 % (if not Included)",
                                "Any services not mentioned above",
                                "Visa Fees if not added in Inclusions",
                                "Travel Insurance - recommended"
                              ]).map((exc, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-relaxed">
                                  <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                                  <span>{exc}</span>
                                </li>
                              ))}
                              <li className="mt-3 pl-2.5 border-l-2 border-amber-500 text-xs font-semibold text-amber-800">
                                Anything not in inclusions is Excluded
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 5. DAY-WISE SCHEDULE SECTION */}
                    <div className="border-t border-slate-200 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsItineraryExpanded(!isItineraryExpanded)}
                        className="flex items-center gap-2.5 text-base sm:text-[17px] font-bold text-slate-900 cursor-pointer py-2.5 w-full text-left"
                      >
                        <ChevronRight size={18} className={`transition-transform duration-200 ${isItineraryExpanded ? "rotate-90" : ""}`} />
                        <span>Day-wise Schedule</span>
                      </button>

                      {isItineraryExpanded && (() => {
                        const defaultItineraryDays = [
                          {
                            dayLabel: "1st Day",
                            weekday: "Sunday",
                            dateMonth: "16th Aug",
                            year: "2026",
                            events: [
                              {
                                title: "Bangkok Airport to Pattaya Hotel - Bangkok Airport to Pattaya Hotel Transfers",
                                description: "Bangkok Airport Pick up & Drop at Pattaya Hotel",
                              },
                              {
                                title: "Alcazar Show with Transfers + 1 Soft Drink (Normal Seat) (Evening) (ADT/CHD Rate is Same) - Private Transfer",
                                description: "Enjoy an entertaining evening at the world-famous Alcazar Cabaret Show in Pattaya. Witness a spectacular blend of dazzling costumes, energetic dance performances, and international music acts. The package includes shared transfers, normal seat entry, and one soft drink during the show. A must-see family-friendly experience.",
                              },
                            ],
                          },
                          {
                            dayLabel: "2nd Day",
                            weekday: "Monday",
                            dateStr: "17th Aug",
                            dateMonth: "17th Aug",
                            year: "2026",
                            events: [
                              {
                                title: "Free Day in Pattaya - SIC",
                                description: "Enjoy breakfast and spend the day at leisure. You can opt for optional tours such as Nong Nooch Village, Alcazar Show, or Sanctuary of Truth. Overnight stay in Pattaya.",
                              },
                            ],
                          },
                          {
                            dayLabel: "3rd Day",
                            weekday: "Tuesday",
                            dateMonth: "18th Aug",
                            year: "2026",
                            events: [
                              {
                                title: "Pattaya Hotel to Bangkok Hotel - Pattaya Hotel to Bangkok Hotel Pvt Transfers",
                                description: "Inter Hotel Transfers From Pattaya to Bangkok on Pvt Basis",
                              },
                              {
                                title: "Full Day Safari World + Marine Park with Lunch (PU/ 08:00AM) - Private Transfer + Entry Tickets",
                                description: "Enjoy a fun-filled day at Safari World Bangkok, starting with the Marine Park, where you'll watch exciting shows like the Dolphin, Sea Lion, and Cowboy Stunt performances. Explore various animal exhibits before enjoying a delicious buffet lunch.\n\nIn the afternoon, hop on a coach for a thrilling drive through the Safari Park, where you'll see lions, tigers, giraffes, and more roaming freely in their natural-style habitats. Pickup is at 08:00 AM, making it the perfect full-day adventure for families and animal lovers!",
                              },
                              {
                                title: "Evening Chaopraya Princess Dinner Cruise (PU/ 17:30PM) - Private Transfer",
                                description: "The Chao Phraya Princess Dinner Cruise is a luxurious evening experience in Bangkok, offering a two-hour journey along the scenic Chao Phraya River. Starting with hotel pickup around 17:30 PM, the cruise features a lavish international and seafood buffet, live music, and stunning night views of illuminated landmarks like Wat Arun and the Grand Palace. With a warm, romantic ambiance and excellent hospitality, it's a perfect way to enjoy Bangkok's charm from the water.",
                              },
                            ],
                          },
                          {
                            dayLabel: "4th Day",
                            weekday: "Wednesday",
                            dateMonth: "19th Aug",
                            year: "2026",
                            events: [
                              {
                                title: "Bangkok Hotel to Suvarnabhumbi Airport - Bangkok Hotel to Suvarnabhumi International Airport on Pvt Transfer",
                                description: "After Check Out the Bangkok Hotel get Transferred to the Suvarnabhumi International Airport for your return flight to your Hometown.",
                              },
                            ],
                          },
                        ];

                        let displayItineraryDays = defaultItineraryDays;

                        if (Array.isArray(quote?.dayWiseItinerary) && quote.dayWiseItinerary.length > 0) {
                          displayItineraryDays = quote.dayWiseItinerary.map((day, dIdx) => {
                            const dayNum = day.dayNumber || dIdx + 1;
                            const nightSuffix = getOrdinalSuffix(dayNum);
                            const startDate = query?.startDate ? new Date(query.startDate) : new Date("2026-08-16");
                            const currentDate = new Date(startDate);
                            currentDate.setDate(currentDate.getDate() + dIdx);

                            const weekdayStr = currentDate.toLocaleDateString("en-IN", { weekday: "long" });
                            const dayVal = currentDate.getDate();
                            const monthStr = currentDate.toLocaleDateString("en-IN", { month: "short" });
                            const yearStr = currentDate.getFullYear().toString();

                            return {
                              dayLabel: `${dayNum}${nightSuffix} Day`,
                              weekday: weekdayStr,
                              dateMonth: `${dayVal}${getOrdinalSuffix(dayVal)} ${monthStr}`,
                              year: yearStr,
                              events: [
                                {
                                  title: day.title || `Day ${dayNum} Activity`,
                                  description: day.description || "",
                                },
                              ],
                            };
                          });
                        }

                        return (
                          <div className="pt-4 space-y-6">
                            {displayItineraryDays.map((dayItem, dIdx) => (
                              <div key={dIdx} className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                                {/* Left Date Card Box */}
                                <div className="w-28 sm:w-32 shrink-0 rounded-xl border border-sky-200 bg-white overflow-hidden shadow-2xs text-center">
                                  {/* Header */}
                                  <div className="bg-[#f0f9ff] py-1.5 border-b border-sky-100 font-bold text-[#0284c7] text-xs tracking-wide">
                                    {dayItem.dayLabel}
                                  </div>
                                  {/* Body */}
                                  <div className="py-2.5 px-2 bg-white space-y-0.5">
                                    <p className="text-xs text-slate-500 font-normal">{dayItem.weekday}</p>
                                    <p className="text-sm font-bold text-slate-900">{dayItem.dateMonth}</p>
                                    <p className="text-xs text-slate-400 font-normal">{dayItem.year}</p>
                                  </div>
                                </div>

                                {/* Right Events List */}
                                <div className="flex-1 min-w-0 space-y-5 pt-0.5">
                                  {dayItem.events.map((evt, eIdx) => (
                                    <div key={eIdx} className="space-y-1">
                                      <h4 className="font-bold text-slate-900 underline underline-offset-2 text-sm sm:text-base leading-snug">
                                        {evt.title}
                                      </h4>
                                      {evt.description && (
                                        <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed whitespace-pre-line">
                                          {evt.description}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* 6. TERMS AND CONDITIONS SECTION */}
                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsTermsExpanded(!isTermsExpanded)}
                          className="flex items-center gap-2.5 text-base sm:text-[17px] font-bold text-slate-900 cursor-pointer py-2.5 text-left"
                        >
                          <ChevronRight size={18} className={`transition-transform duration-200 ${isTermsExpanded ? "rotate-90" : ""}`} />
                          <span>Terms and Conditions</span>
                        </button>
                        <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">
                          Archived
                        </span>
                      </div>

                      {isTermsExpanded && (
                        <div className="pt-3 pl-6 font-sans text-xs sm:text-sm text-slate-800 leading-relaxed space-y-4">
                          {quote.termsAndConditions && Array.isArray(quote.termsAndConditions) && quote.termsAndConditions.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-2">
                              {quote.termsAndConditions.map((term, tIdx) => (
                                <li key={tIdx}>{term}</li>
                              ))}
                            </ul>
                          ) : (
                            <>
                              <p>
                                Welcome to <strong className="font-bold text-slate-900">Holiday Circuit</strong>. These Terms and Conditions govern your use of the <strong className="font-bold text-slate-900">Holiday Circuit</strong> services. When You Make a booking or reservation, you agree to be bound by these Terms.
                              </p>

                              <div className="space-y-2">
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base">Bookings and Reservations</h4>
                                <ul className="list-disc pl-5 space-y-2">
                                  <li>
                                    <strong className="font-bold text-slate-900">Booking Process:</strong> When you make a booking or reservation through <strong className="font-bold text-slate-900">Holiday Circuit</strong>, you agree to provide accurate and complete information. Any discrepancies or errors in the information you provide may result in the cancellation of your booking.
                                  </li>
                                </ul>
                              </div>

                              <div className="space-y-2">
                                <p>
                                  <strong className="font-bold text-slate-900">Payment:</strong> Payments for bookings are due as specified during the booking process. Failure to make payments on time may result in the cancellation of your booking.
                                </p>

                                <ol className="list-none space-y-2 font-bold text-slate-900">
                                  <li>1. Minimum 50% of the booking amount is required at the time of booking confirmation.</li>
                                  <li>2. Remaining 50% in 2 parts i.e. 25% of total booking amount within 30 Days prior to departure and 25% within 20 days prior to departure.</li>
                                  <li>3. In Case of Airline booking/Train Tickets, 100% ticket cost to be paid at the time of confirmation.</li>
                                  <li>4. In Case a booking is under 100% cancellation period, then 100% booking amount is required at the time of booking confirmation.</li>
                                </ol>
                              </div>

                              <p>
                                <strong className="font-bold text-slate-900">Confirmation:</strong> Your booking is considered confirmed only upon receipt of payment and confirmation from <strong className="font-bold text-slate-900">Holiday Circuit</strong>. Please review all booking details carefully to ensure accuracy.
                              </p>

                              <p className="font-bold text-slate-900">
                                Booking will be auto cancelled in case of non-payment within stipulated time
                              </p>

                              <p>
                                <strong className="font-bold text-slate-900">Credit Card:</strong> We accept payments through Credit Cards which may attract an additional charge from 3% to 5% depends upon the card type. Card charges shall be over and above the actual service/package cost.
                              </p>

                              <p>
                                <strong className="font-bold text-slate-900">Confirmation Vouchers:</strong> The service will be confirmed once the advance payment is made. However, the confirmation vouchers will only be provided 7 days before the arrival date.
                              </p>

                              <p>
                                <strong className="font-bold text-slate-900">Airport Transfers & Tour Pick Ups:</strong> The service includes 60 minutes of waiting time for Airport pick-ups. If you are delayed at immigration or luggage claim, please call the emergency number to extend the waiting time. Additional parking and waiting time charges may apply. For all other pick-ups, the driver will wait for 10 mins at the meeting point i.e. Hotel Lobby or Reception or any other fixed meeting point.
                              </p>

                              <p>
                                <strong className="font-bold text-slate-900">Taxes:</strong> In case of any changes in taxes (such as GST/Government Tax/TCS) at the time of confirmation, the price will be adjusted accordingly and shall be charged as per the prevailing law. This means that if there is an increase or decrease in applicable taxes between the time of booking confirmation and the actual provision of services, the final price will be adjusted to reflect these changes in accordance with the relevant tax regulations.
                              </p>

                              <p>
                                <strong className="font-bold text-slate-900">Changes and Cancellations:</strong> Changes to bookings or cancellations may be subject to fees or penalties, as determined by the service providers (e.g., airlines, hotels, tour operators) and <strong className="font-bold text-slate-900">Holiday Circuit</strong>. These fees and penalties may vary depending on the service and the timing of the change or cancellation.
                              </p>

                              <div className="space-y-2">
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base">Travel Documents and Requirements</h4>
                                <ul className="list-disc pl-5 space-y-2">
                                  <li>
                                    <strong className="font-bold text-slate-900">Valid Id Proof:</strong> It is your responsibility to ensure that you have a valid ID as per destination entry requirements and any required visas or travel documents for your trip. <strong className="font-bold text-slate-900">Holiday Circuit</strong> is not responsible for any issues arising from the lack of proper travel documents. <strong className="font-bold text-slate-900">(To Enter Nepal by Air- Valid Passport or Election Card is Mandatory. Aadhar Card is not valid for Travel)</strong>
                                  </li>
                                  <li>
                                    <strong className="font-bold text-slate-900">Health and Vaccinations:</strong> You are responsible for ensuring that you meet all health and vaccination requirements for your travel destinations.
                                  </li>
                                  <li>
                                    <strong className="font-bold text-slate-900">Travel Insurance:</strong> We strongly recommend that you purchase travel insurance to protect against unexpected events such as trip cancellations, delays, or emergencies during your travel. <strong className="font-bold text-slate-900">Holiday Circuit</strong> can assist you in obtaining travel insurance, but the decision to purchase it is ultimately yours.
                                  </li>
                                </ul>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base">Changes to Itineraries</h4>
                                <ul className="list-disc pl-5 space-y-2">
                                  <li>
                                    <strong className="font-bold text-slate-900">By Holiday Circuit:</strong> We reserve the right to make changes to your itinerary or accommodations due to unforeseen circumstances. We will make every effort to inform you of such changes as soon as possible.
                                  </li>
                                  <li>
                                    <strong className="font-bold text-slate-900">By You:</strong> Any changes requested by you to your itinerary may be subject to fees or penalties, as determined by the service providers and <strong className="font-bold text-slate-900">Holiday Circuit</strong>.
                                  </li>
                                </ul>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base">Liability</h4>
                                <ul className="list-disc pl-5 space-y-2">
                                  <li>
                                    <strong className="font-bold text-slate-900">Service Providers: Holiday Circuit</strong> acts as an intermediary between you and service providers such as airlines, hotels, and tour operators. We are not liable for any actions, omissions, or negligence on the part of these service providers.
                                  </li>
                                  <li>
                                    <strong className="font-bold text-slate-900">Force Majeure: Holiday Circuit</strong> is not liable for any disruptions, cancellations, or delays caused by circumstances beyond our control, including natural disasters, strikes, political unrest, or other force majeure events.
                                  </li>
                                </ul>
                              </div>

                              <p>
                                <strong className="font-bold text-slate-900">Governing Law and Jurisdiction:</strong> These Terms and your use of <strong className="font-bold text-slate-900">Holiday Circuit</strong> services are governed by the laws of New Delhi Jurisdiction, and any disputes shall be resolved in the courts of New Delhi Jurisdiction.
                              </p>

                              <p>
                                <strong className="font-bold text-slate-900">Changes to Terms and Conditions:</strong> We reserve the right to update and modify these Terms and Conditions at any time. Please review them periodically for changes. Your continued use of our services after any modifications indicates your acceptance of the updated Terms.
                              </p>

                              <p>
                                <strong className="font-bold text-slate-900">Contact Information:</strong> For any inquiries, please contact us at: <strong className="font-bold text-slate-900">Holiday Circuit</strong> KG 3/69, Ground Floor, Vikas Puri, New Delhi -110018, Near UK Nursing Home , Email id - <a href="mailto:varun@holidaycircuit.com" className="text-blue-600 underline hover:text-blue-800">varun@holidaycircuit.com</a> +91 8851346665, +91 9971706003
                              </p>

                              <p className="italic font-bold text-slate-900 pt-2">
                                By booking with Holiday Circuit, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>



                    {/* MARKUP MODAL (REMOVED NESTED - MOVED TO TOP LEVEL) */}
                  </div>

                  {/* RIGHT COLUMN SIDEBAR (Only in Basic Details) */}
                  {(activeTab === "basic" || !activeTab) && (
                    <div className="w-full lg:w-[280px] shrink-0 space-y-3.5">
                      {/* TASKS & COMMENTS */}
                      <div className="border border-slate-200 shadow-2xs rounded-xl overflow-hidden bg-white">
                        <div className="px-4 py-3 border-b border-slate-200 bg-[#f8fafc]">
                          <h3 className="font-bold text-base text-slate-900 font-sans">Tasks & Comments</h3>
                        </div>

                        <div className="p-4 space-y-3.5">
                          {tasks.length > 0 ? (
                            tasks.map((t) => (
                              <div key={t.id} className="relative space-y-1 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <p className="font-medium text-xs sm:text-[13px] text-slate-800 leading-relaxed whitespace-pre-line font-sans">{t.text}</p>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-normal">
                                      <span>{t.timeAgo} by {t.author}</span>
                                      {t.dueDate && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-[10px] font-semibold text-blue-700 border border-blue-200/80">
                                          <CalendarDays size={10} className="text-blue-600 shrink-0" />
                                          {new Date(t.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Three dot action button */}
                                  <div className="relative shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setOpenTaskMenuId(openTaskMenuId === t.id ? null : t.id)}
                                      className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
                                    >
                                      <MoreVertical size={15} />
                                    </button>

                                    {/* Dropdown Popup */}
                                    {openTaskMenuId === t.id && (
                                      <div className="absolute right-0 top-7 z-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 px-2 whitespace-nowrap min-w-[130px] space-y-1">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleResolveTask(t.id)}
                                          className="w-full text-left px-2 py-1 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-all cursor-pointer"
                                        >
                                          {t.resolved ? "Mark as Unresolved" : "Mark as Resolved"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteTask(t.id)}
                                          className="w-full text-left px-2 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-all cursor-pointer flex items-center gap-1.5"
                                        >
                                          <Trash2 size={13} className="shrink-0" />
                                          Delete Task
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Checkmark row if resolved */}
                                {t.resolved && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium pt-1">
                                    <Check size={14} className="text-slate-900 stroke-[2.5]" />
                                    <span>{t.resolvedBy || t.author}, {t.resolvedTimeAgo || t.timeAgo}</span>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className={`${isAddingTask ? "hidden" : "min-h-[150px] flex flex-col items-center justify-center px-4 py-4 text-center"}`}>
  <h4 className="text-base font-bold text-slate-900">All caught up!</h4>
  <p className="mt-1.5 max-w-[230px] text-xs leading-relaxed text-slate-500">
    Add comments such as follow ups, required actions etc for better trip flow
  </p>
  <button
    type="button"
    onClick={() => setIsAddingTask(true)}
    className="mt-3 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#3E63DD] shadow-2xs transition-colors hover:bg-blue-50 cursor-pointer"
  >
    Add New
  </button>
</div>
                          )}

                          {isAddingTask ? (
                            <div className="pt-2 space-y-2 border-t border-slate-100">
                              <textarea
                                rows={2.5}
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                placeholder="Enter task or comment..."
                                className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3E63DD] font-sans resize-y custom-scroll"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddTask();
                                  }
                                  if (e.key === "Escape") {
                                    setIsAddingTask(false);
                                    setNewTaskText("");
                                    setNewTaskDueDate("");
                                  }
                                }}
                              />

                              <div className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={newTaskDueDate}
                                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                                  className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3E63DD] font-sans cursor-pointer"
                                />
                                <span className="text-[10.5px] text-slate-500 font-sans whitespace-nowrap">Target / Due Date</span>
                              </div>

                              <div className="flex items-center gap-2 pt-1 font-sans">
                                <button
                                  type="button"
                                  onClick={handleAddTask}
                                  className="px-3.5 py-1.5 bg-[#3E63DD] hover:bg-[#3452b9] text-white text-xs font-semibold rounded-lg cursor-pointer shadow-2xs transition"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingTask(false);
                                    setNewTaskText("");
                                    setNewTaskDueDate("");
                                  }}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg cursor-pointer transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className={`${tasks.length === 0 ? "hidden" : "pt-1"}`}>
                              <button
                                type="button"
                                onClick={() => setIsAddingTask(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-indigo-900 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                              >
                                <Plus size={14} className="stroke-[2.5]" /> Add
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* REQUIREMENTS */}
                      <div className="border border-slate-200 shadow-2xs rounded-xl overflow-hidden bg-white font-sans">
                        <div className="px-4.5 py-3.5 border-b border-slate-200 bg-[#f8fafc]">
                          <h3 className="font-bold text-base text-slate-900 font-sans">Requirements</h3>
                          <p className="mt-0.5 text-xs text-slate-500 font-sans leading-snug">
                            Trip requirements & preferences submitted with this query.
                          </p>
                        </div>

                        <div className="p-4 space-y-4 font-sans">
                          <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-100 pb-3">
                            <div>
                              <p className="text-[11px] font-semibold text-slate-400">Dates</p>
                              <p className="font-bold text-slate-800 mt-0.5 text-xs leading-snug">
                                {new Date(query.startDate).toLocaleDateString("en-IN")} –{" "}
                                {new Date(query.endDate).toLocaleDateString("en-IN")}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold text-slate-400">Travelers</p>
                              <p className="font-bold text-slate-800 mt-0.5 text-xs leading-snug">
                                {query.numberOfAdults} Adults
                                {query.numberOfChildren > 0 && `, ${query.numberOfChildren} Kids`}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-semibold text-slate-400 mb-2">Preferences</p>
                            {query.specialRequirements ? (
                              <div className="flex flex-wrap gap-1.5">
                                {query.specialRequirements
                                  .split(/[.,;\n]/)
                                  .filter((item) => item.trim() !== "")
                                  .map((item, index) => (
                                    <span
                                      key={index}
                                      className="px-2.5 py-1 text-[9.5px] font-medium text-blue-800 bg-blue-50/80 border border-blue-200/80 rounded-2xl leading-normal text-left break-words max-w-full"
                                    >
                                      {item.trim()}
                                    </span>
                                  ))}
                              </div>
                            ) : (
                              <p className="font-medium text-slate-600 text-xs">No special preferences</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* TAB VIEW: SERVICES BOOKINGS */}
        {activeTab === "services" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full font-sans"
          >
            <ServicesBookingsTab
              activeQuote={activeQuote}
              query={query}
              currentUser={currentUser}
              onGenerateVoucher={(h) => {
                setSelectedHotelForVoucher(h);
                setIsVoucherModalOpen(true);
              }}
            />
          </motion.div>
        )}

        {/* TAB VIEW: ACCOUNTING & FINANCIALS (Matches Image Design 1-to-1) */}
        {activeTab === "accounting" && (() => {
          const quote = activeQuote;
          const opsQuoteAmount = Number(quote?.pricing?.totalAmount ?? quote?.totalAmount ?? 0);
          const markupAmount = Number(quote?.agentMarkup?.markupAmount || 0);
          const finalQuoteAmount = Number(quote?.clientTotalAmount ?? opsQuoteAmount);

          const creatorName = currentUser?.fullName || currentUser?.name || "Operations Team";
          const createdTimeAgo = formatDisplayDate(query?.createdAt) || "Recently created";
          const dueDate = formatDisplayDate(query?.startDate || quote?.validTill) || "20 Jul, 2026";

          const bookingInvoice = bookingPaymentRecord?.invoice || query?.invoice || {};
          const bookingPaymentSubmission = bookingInvoice?.paymentSubmission || {};
          const bookingPaymentVerification = bookingInvoice?.paymentVerification || {};
          const bookingPaymentEntries = Array.isArray(bookingPaymentSubmission?.trackerPayments)
            ? bookingPaymentSubmission.trackerPayments
            : [];
          const bookingPaymentRows = bookingPaymentEntries
            .map((payment, index) => {
              const amount = Math.round(Number(payment?.amount || 0));
              if (!Number.isFinite(amount) || amount <= 0) return null;

              const verificationStatus = String(
                payment?.verificationStatus || bookingPaymentVerification?.status || "Pending",
              ).trim();
              return {
                id: String(payment?._id || payment?.createdAt || `${query?._id || "booking"}-${index}`),
                paymentIndex: index,
                amount,
                paymentDate:
                  String(payment?.displayDate || "").trim() ||
                  formatDisplayDate(payment?.paymentDate || payment?.createdAt) ||
                  "Pending",
                note: String(payment?.note || bookingPaymentSubmission?.remarks || "").trim(),
                utrNumber: String(
                  payment?.utrNumber ||
                    (bookingPaymentEntries.length === 1 ? bookingPaymentSubmission?.utrNumber : ""),
                ).trim(),
                verificationStatus,
                verifiedByName: String(
                  payment?.verifiedByName || bookingPaymentVerification?.reviewedByName || "",
                ).trim(),
                paymentInvoiceUrl: String(payment?.financeReceipt?.url || "").trim(),
                isPaymentInvoiceAvailable:
                  verificationStatus === "Verified" || Boolean(payment?.financeReceipt?.url),
                receiptShared: payment?.receiptStatus === "Sent",
              };
            })
            .filter(Boolean);
          const fallbackSubmittedAmount = Math.round(Number(bookingPaymentSubmission?.amount || 0));
          const clientPaidAmount = bookingPaymentRows.length
            ? bookingPaymentRows.reduce((total, payment) => total + payment.amount, 0)
            : fallbackSubmittedAmount;
          const bookingPaymentTotal = Math.round(
            Number(
              bookingPaymentSubmission?.couponApplication?.payableAmount ||
                bookingInvoice?.totalAmount ||
                bookingInvoice?.pricingSnapshot?.grandTotal ||
                bookingPaymentRecord?.totalAmount ||
                finalQuoteAmount,
            ),
          );
          const remainingPaymentAmount = Math.max(0, bookingPaymentTotal - clientPaidAmount);
          const hotelPaidAmount = Number(loggedPayments["ops-base"] || 0);

          const rawServices = Array.isArray(quote?.services) ? quote.services : [];
          const hotelCount = rawServices.filter((s) => s?.type === "hotel").length;
          const transportCount = rawServices.filter((s) =>
            ["transfer", "car", "transport"].includes(String(s?.type).toLowerCase()),
          ).length;
          const activityCount = rawServices.filter((s) => s?.type === "activity").length;

          const targetDateRaw = query?.startDate || quote?.validTill || query?.createdAt;

          const getPaymentStatusInfo = (targetDateRawVal, paidAmt, totalAmt) => {
            if (totalAmt > 0 && paidAmt >= totalAmt) {
              return { label: "Fully Paid", colorClass: "border-emerald-200 bg-emerald-50 text-emerald-700", dotClass: "bg-emerald-500" };
            }
            if (paidAmt > 0) {
              return { label: "Partially Paid", colorClass: "border-amber-200 bg-amber-50 text-amber-700", dotClass: "bg-amber-500" };
            }

            if (!targetDateRawVal) {
              return { label: "Payment Pending", colorClass: "border-slate-200 bg-slate-100 text-slate-700", dotClass: "bg-slate-400" };
            }

            const targetDate = new Date(targetDateRawVal);
            const now = new Date();

            if (Number.isNaN(targetDate.getTime())) {
              return { label: "Payment Pending", colorClass: "border-slate-200 bg-slate-100 text-slate-700", dotClass: "bg-slate-400" };
            }

            const diffMs = now.getTime() - targetDate.getTime();

            if (diffMs <= 0) {
              const remainingDays = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
              if (remainingDays <= 1) {
                return { label: "Due Today", colorClass: "border-amber-200 bg-amber-50 text-amber-700", dotClass: "bg-amber-500 animate-pulse" };
              }
              return { label: `Due in ${remainingDays} days`, colorClass: "border-blue-200 bg-blue-50 text-blue-700", dotClass: "bg-blue-500" };
            }

            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);

            if (diffDays >= 1) {
              return { label: `Overdue by ${diffDays} day${diffDays === 1 ? "" : "s"}`, colorClass: "border-rose-200 bg-rose-50 text-rose-700", dotClass: "bg-rose-500 animate-pulse" };
            }
            if (diffHours >= 1) {
              return { label: `Overdue by ${diffHours} hr${diffHours === 1 ? "" : "s"}`, colorClass: "border-rose-200 bg-rose-50 text-rose-700", dotClass: "bg-rose-500 animate-pulse" };
            }
            return { label: "Overdue", colorClass: "border-rose-200 bg-rose-50 text-rose-700", dotClass: "bg-rose-500 animate-pulse" };
          };

          const customerStatus = getPaymentStatusInfo(targetDateRaw, clientPaidAmount, bookingPaymentTotal);
          const opsStatus = getPaymentStatusInfo(targetDateRaw, hotelPaidAmount, opsQuoteAmount);

          const formatNum = (num) => Number(num || 0).toLocaleString("en-IN");

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col lg:flex-row items-stretch gap-0 overflow-hidden font-san"
            >


              {/* LEFT SIDEBAR SUB-TABS (Compact Width w-40 matching Sembark) */}
              <div className="w-full lg:w-40 shrink-0 bg-white border-r border-slate-200/80 py-1 font-sans">
                <div className="flex lg:flex-col overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setAccountingSubTab("payments")}
                    className={`w-full text-left px-3.5 py-2.5 text-[14px] transition-all relative flex items-center justify-between cursor-pointer ${
                      accountingSubTab === "payments"
                        ? "bg-[#f8fafc] text-slate-900 font-bold"
                        : "text-slate-500 font-semibold hover:text-slate-900 hover:bg-slate-50/50"
                    }`}
                  >
                    <span>Payments</span>
                    {accountingSubTab === "payments" && (
                      <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#35489e] rounded-l-xs" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountingSubTab("proforma")}
                    className={`w-full text-left px-3.5 py-2.5 text-[14px] transition-all relative flex items-center justify-between cursor-pointer ${
                      accountingSubTab === "proforma"
                        ? "bg-[#f8fafc] text-slate-900 font-bold"
                        : "text-slate-500 font-semibold hover:text-slate-900 hover:bg-slate-50/50"
                    }`}
                  >
                    <span>Proforma Invoice</span>
                    {accountingSubTab === "proforma" && (
                      <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#35489e] rounded-l-xs" />
                    )}
                  </button>
                </div>
              </div>

              {/* RIGHT CONTENT AREA (White Canvas matching DMC) */}
              <div className="flex-1 min-w-0 w-full px-3 lg:px-4 pt-3 pb-3 space-y-5 bg-white">
                {accountingSubTab === "payments" && (
                  <div className="space-y-5">
                    {/* 1. PAYMENTS FROM CUSTOMER / FINANCE */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-2.5">Payments to Finance</h3>

                      <div className="w-full bg-[#f1f5f9] p-3.5 lg:p-4.5 flex flex-col lg:flex-row items-start gap-3.5 lg:gap-5 rounded-xs border border-slate-200/50">
                        {/* Left summary stat block */}
                        <div className="w-full lg:w-44 shrink-0 py-1 flex flex-col justify-start">
                          <p className="text-xs font-bold text-slate-900">INR</p>
                          <div className="mt-1 text-3xl font-extrabold text-[#15803d] tracking-tight leading-none">
                            + {clientPaidAmount.toLocaleString("en-IN")}
                          </div>
                          <div className="mt-1.5 text-3xl font-extrabold text-slate-900 flex items-baseline gap-1 leading-none">
                            <span className="text-slate-400 font-normal text-xl">/</span>
                            <span>{bookingPaymentTotal.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="mt-3.5 space-y-1 text-[11px] text-slate-500 font-normal leading-tight">
                            <p>Created by {creatorName}, {createdTimeAgo}</p>
                            <p>Remaining: <span className="font-semibold text-amber-700">{formatMoney(remainingPaymentAmount)}</span></p>
                          </div>

                          {markupAmount > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-slate-200/70 text-[11px]">
                              <span className="text-slate-600 font-medium">Agent Profit:</span>{" "}
                              <span className="font-extrabold text-emerald-700 bg-emerald-100/90 border border-emerald-300/80 px-2 py-0.5 rounded-md inline-block">{formatMoney(markupAmount)}</span>
                            </div>
                          )}

                        </div>

                        {/* Right installment list */}
                        <div className="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-sm p-3.5 lg:p-4 shadow-2xs space-y-3">
                          <div className="grid grid-cols-12 text-xs font-bold text-slate-600 pb-2 border-b border-slate-200/80 gap-2">
                            <div className="col-span-2">Amount (INR)</div>
                            <div className="col-span-3">Status</div>
                            <div className="col-span-2">Payment Date</div>
                            <div className="col-span-5">Comments</div>
                          </div>

                          {bookingPaymentRows.length > 0 ? (
                            bookingPaymentRows.map((payment) => {
                              const isVerified = payment.verificationStatus === "Verified";
                              const isRejected = payment.verificationStatus === "Rejected";
                              const statusClass = isVerified
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                : isRejected
                                  ? "bg-rose-50 text-rose-700 border-rose-200/80"
                                  : "bg-blue-50 text-blue-700 border-blue-200/80";
                              const statusLabel = isVerified ? "Verified" : isRejected ? "Rejected" : "Pending Verification";

                              return (
                                <div key={payment.id} className="grid grid-cols-12 text-xs items-start py-2.5 border-b border-slate-100 last:border-0 gap-2">
                                  <div className="col-span-2 font-extrabold text-slate-900 text-sm">
                                    {formatMoney(payment.amount)}
                                  </div>
                                  <div className="col-span-3">
                                    <div className="flex flex-col gap-0.5">
                                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 font-bold text-[11px] w-fit whitespace-nowrap mb-0.5">
                                        <span>Paid: {payment.paymentDate}</span>
                                        {payment.isPaymentInvoiceAvailable && (
                                          <button
                                            type="button"
                                            onClick={() => openPaymentInvoice(payment)}
                                            className="relative inline-flex text-slate-400 hover:text-slate-700 cursor-pointer"
                                            title="Open payment invoice"
                                            aria-label="Open payment invoice"
                                          >
                                            <FileText size={11} className="text-emerald-600" />
                                            <CheckCheck size={8} className="absolute -left-1 -top-1 text-emerald-600" aria-label="Payment invoice available" />
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-700 font-medium leading-tight">
                                        {payment.verifiedByName || (isVerified ? "Finance Team" : "Awaiting Finance Review")}
                                      </p>
                                      <p className="text-[10.5px] text-slate-500 font-normal leading-tight">
                                        Trip ID: {query?.queryId}
                                      </p>
                                      {payment.utrNumber && (
                                        <p className="text-[10.5px] text-slate-500 font-normal leading-tight break-all">
                                          UTR: {payment.utrNumber}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="col-span-2 text-xs font-semibold text-slate-700 pt-0.5 text-left whitespace-nowrap">
                                    {payment.paymentDate}
                                  </div>
                                  <div className="col-span-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-0.5 min-w-0">
                                    <span className="text-xs text-slate-500 font-medium flex items-start gap-1 min-w-0 break-words pr-1">
                                      <MessageSquare size={12} className="shrink-0 mt-0.5" />
                                      <span className="break-words">{payment.note || "Booking payment submitted"}</span>
                                    </span>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      {payment.receiptShared && (
                                        <span className="order-2 inline-flex items-center gap-1 text-[10.5px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-semibold whitespace-nowrap">
                                          Receipt Shared
                                        </span>
                                      )}
                                      <span className={`order-1 inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded border font-semibold whitespace-nowrap ${statusClass}`}>
                                        <CheckCircle2 size={11} />
                                        {statusLabel}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-4 text-center text-xs text-slate-400 font-medium">
                              No booking payments have been submitted yet.
                            </div>
                          )}
                          <div className="mt-3 pt-2.5 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                navigate("/agent/bookings", {
                                  state: {
                                    openBookingId: query?.invoice?._id || query?._id || query?.queryId,
                                    paymentOnly: true,
                                  },
                                });
                              }}
                              className="px-3.5 py-1.5 text-xs font-semibold text-[#3E63DD] border border-[#3E63DD] bg-white hover:bg-blue-50/80 rounded cursor-pointer transition-all shadow-2xs"
                            >
                              Make / Update Payment
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>


                  </div>
                )}

                {accountingSubTab === "proforma" && (
                  proformaInvoiceData ? (
                    <ProformaInvoiceView
                      invoiceData={proformaInvoiceData}
                      queryData={query}
                      onEdit={() => setIsCreatingProforma(true)}
                      onDelete={() => {
                        setProformaInvoiceData(null);
                        toast.success("Proforma Invoice deleted");
                      }}
                      onNew={() => {
                        setProformaInvoiceData(null);
                        setIsCreatingProforma(true);
                      }}
                    />
                  ) : (
                    <div className="w-full font-sans space-y-3">
                      {/* White Header Strip */}
                      <div className="w-full bg-white pb-2 flex items-center justify-between border-b border-slate-100">
                        <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Proforma Invoice</h2>
                        <button
                          type="button"
                          onClick={() => setIsCreatingProforma(true)}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span className="text-sm font-normal">+</span>
                          <span>New</span>
                        </button>
                      </div>

                      {/* Light Gray Canvas Area */}
                      <div className="w-full bg-[#f1f5f9] py-11 px-5 min-h-[170px] flex flex-col items-center justify-center text-center rounded-xs border border-slate-200/60">
                        <h3 className="text-xl sm:text-2xl font-normal text-slate-800 tracking-tight mb-4.5 font-sans">
                          No Proforma Invoice created for this Trip!
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsCreatingProforma(true)}
                          className="px-6 py-2.5 bg-white border border-[#cbd5e1] rounded-md text-[14px] font-bold text-[#35489e] hover:bg-slate-50 hover:text-[#28377d] shadow-2xs transition-all cursor-pointer"
                        >
                          Create Proforma Invoice
                        </button>
                      </div>
                    </div>
                  )
                )}

                {accountingSubTab === "profit" && (
                  <div className="p-4 text-slate-700">
                    <h3 className="text-base font-bold text-slate-900 mb-2">Profit Report</h3>
                    <p className="text-xs text-slate-500">Summary of booking payouts & margins</p>
                    <div className="mt-4 border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <p className="text-sm font-bold text-emerald-700">Net Agent Profit: {formatMoney(markupAmount)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* MODALS FOR LOG PAYMENT & INSTALMENTS */}
              <AnimatePresence>
                {logPaymentModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4"
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-bold text-slate-900">{logPaymentModal.title}</h4>
                        <button
                          type="button"
                          onClick={() => setLogPaymentModal(null)}
                          className="rounded-full p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700">Total Amount</label>
                          <input
                            type="text"
                            disabled
                            value={formatMoney(logPaymentModal.totalAmount)}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700">Logged Payment Amount (₹)</label>
                          <input
                            type="number"
                            id="logPaymentInput"
                            placeholder="Enter amount (e.g. 35400)"
                            defaultValue={logPaymentModal.currentPaid || ""}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-blue-500 font-bold"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-3">
                          <button
                            type="button"
                            onClick={() => setLogPaymentModal(null)}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const val = Number(document.getElementById("logPaymentInput")?.value || 0);
                              setLoggedPayments((prev) => ({ ...prev, [logPaymentModal.type]: val }));
                              toast.success("Payment logged successfully!");
                              setLogPaymentModal(null);
                            }}
                            className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 cursor-pointer"
                          >
                            Save Payment
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {paymentInstallmentModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4"
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-bold text-slate-900">{paymentInstallmentModal.title}</h4>
                        <button
                          type="button"
                          onClick={() => setPaymentInstallmentModal(null)}
                          className="rounded-full p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="space-y-4 text-xs">
                        <p className="text-slate-600">
                          Configure payment schedule, instalments, and due date for this booking.
                        </p>

                        <div>
                          <label className="font-semibold text-slate-700">Due Date</label>
                          <input
                            type="date"
                            defaultValue="2026-07-20"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700">Number of Instalments</label>
                          <select className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 outline-none focus:border-blue-500">
                            <option value="1">Full Payment (1 Instalment)</option>
                            <option value="2">2 Instalments (50% / 50%)</option>
                            <option value="3">3 Instalments (30% / 40% / 30%)</option>
                          </select>
                        </div>

                        <div className="flex justify-end gap-2 pt-3">
                          <button
                            type="button"
                            onClick={() => setPaymentInstallmentModal(null)}
                            className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              toast.success("Instalment schedule updated!");
                              setPaymentInstallmentModal(null);
                            }}
                            className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white shadow-md hover:bg-blue-700 cursor-pointer"
                          >
                            Save Schedule
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })()}

        {/* TAB VIEW: DOCS */}
        {activeTab === "docs" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 xl:col-span-3 font-sans"
          >
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Documents & Shareable Assets</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Manage traveler compliance documents and service vouchers.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 mb-2 font-sans">
                {/* Traveler ID Proofs Card */}
                <div className="flex flex-col justify-between rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 via-sky-50/40 to-indigo-50/50 p-4.5 shadow-2xs transition hover:shadow-xs font-sans">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3252c3] text-white shadow-2xs">
                          <FileCheck2 size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 font-sans whitespace-nowrap">Traveler ID Proofs</p>
                          <p className="text-xs font-medium text-slate-600 mt-0.5 font-sans whitespace-nowrap">PAN Card / Passport copy</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 shadow-2xs font-sans whitespace-nowrap">
                        Pending Upload
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-blue-200/70 flex items-center justify-between font-sans">
                    <span className="text-xs font-medium text-slate-600 font-sans">Traveler compliance documents</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose?.();
                        navigate("/agent/documents", {
                          state: {
                            openBookingId: query?._id || query?.invoice?._id || query?.queryId,
                            documentsOnly: true,
                          },
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#3252c3] hover:bg-[#2843a8] text-white px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition cursor-pointer font-sans whitespace-nowrap"
                    >
                      Document Desk <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Service Vouchers Card */}
                <div className="flex flex-col justify-between rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-emerald-50/50 p-4.5 shadow-2xs transition hover:shadow-xs font-sans">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#15803d] text-white shadow-2xs">
                          <BadgeCheck size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 font-sans whitespace-nowrap">Service Vouchers</p>
                          <p className="text-xs font-medium text-slate-600 mt-0.5 font-sans whitespace-nowrap">Hotel & Transfer Vouchers</p>
                        </div>
                      </div>
                      {(() => {
                        const isVoucherSent = query?.voucherStatus === "sent" || query?.opsStatus === "Vouchered";
                        const isVoucherReady = Boolean(query?.voucherNumber || query?.voucherStatus === "generated" || query?.voucherGeneratedAt);

                        if (isVoucherSent) {
                          return (
                            <span className="shrink-0 rounded-lg bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shadow-2xs font-sans whitespace-nowrap">
                              ✓ Voucher Sent ({query?.voucherNumber || "Issued"})
                            </span>
                          );
                        }

                        if (isVoucherReady) {
                          return (
                            <span className="shrink-0 rounded-lg bg-sky-100 border border-sky-200 px-2.5 py-0.5 text-[10px] font-bold text-sky-800 shadow-2xs font-sans whitespace-nowrap">
                              ✓ Voucher Ready ({query?.voucherNumber})
                            </span>
                          );
                        }

                        return (
                          <span className="shrink-0 rounded-lg bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 shadow-2xs font-sans whitespace-nowrap">
                            Ops Voucher Pending
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-emerald-200/70 flex flex-wrap items-center justify-between gap-2 font-sans">
                    <button
                      type="button"
                      onClick={handlePreviewVoucher}
                      className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-emerald-300 text-[#15803d] px-3 py-1.5 text-xs font-semibold shadow-2xs transition cursor-pointer font-sans whitespace-nowrap"
                    >
                      <Eye size={13} className="shrink-0 text-[#15803d]" /> <span className="whitespace-nowrap">View / Seen</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadVoucher}
                      className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-emerald-300 text-[#15803d] px-3 py-1.5 text-xs font-semibold shadow-2xs transition cursor-pointer font-sans whitespace-nowrap"
                    >
                      <Download size={13} className="shrink-0 text-[#15803d]" /> <span className="whitespace-nowrap">Download</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenSendModal(activeQuote || quotes[0], "VOUCHER")}
                      className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-[#15803d] hover:bg-[#16a34a] text-white px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition cursor-pointer font-sans whitespace-nowrap"
                    >
                      <Send size={13} className="shrink-0" /> <span className="whitespace-nowrap">Send to Client</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB VIEW: ACTIVITIES ONLY */}
        {activeTab === "activities" && (
          <motion.div
            variants={itemVariant}
            className="xl:col-span-3 border border-slate-200 shadow-2xs rounded-xl p-5 h-fit bg-white"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3E63DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <h3 className="font-bold text-base text-slate-900 font-sans">Activity Log</h3>
              {query.activityLog?.length > 0 && (
                <span className="ml-auto bg-slate-100 text-slate-600 text-[10.5px] font-medium px-2.5 py-0.5 rounded-full border border-slate-200/80">
                  {query.activityLog.length} events
                </span>
              )}
            </div>

            <div className="space-y-1 relative">
              {query.activityLog?.slice().reverse().map((log, index) => (
                <div key={index} className="flex gap-3 relative">
                  {(() => {
                    const theme = getActivityTheme(log.action);
                    const LogIcon = theme.Icon;

                    return (
                      <>
                        {/* Vertical Line */}
                        {index !== query.activityLog.length - 1 && (
                          <span className={`absolute left-[9px] top-6 w-0.5 h-full ${theme.line} z-0`} />
                        )}

                        {/* Dot */}
                        <span
                          className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full z-10 flex-shrink-0 ring-4 ring-white ${theme.dot}`}
                        >
                          <LogIcon className="h-3 w-3 text-white" />
                        </span>

                        {/* Content */}
                        <div className={`mb-3 flex-1 rounded-xl border px-3.5 py-2.5 ${theme.surface}`}>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold text-slate-900 leading-tight font-sans">
                                {getDisplayAction(log.action)}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1 font-sans">
                                {new Date(log.timestamp).toLocaleString("en-IN", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </p>
                            </div>
                            <span className={`w-fit rounded-full px-2.5 py-0.5 text-[10px] ${theme.badge}`}>
                              {getDisplayAction(log.action)}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB VIEW: PACKAGES ONLY (Agent side - New Query / Pending stage only) */}
        {activeTab === "packages" && (
          <div className="w-full flex flex-col md:flex-row gap-3.5 items-stretch mb-8">
            {agentPackagesLoading ? (
              <div className="w-full border border-slate-200 shadow-2xs rounded-xl p-12 bg-white flex flex-col items-center justify-center text-center">
                <RefreshCw size={24} className="animate-spin text-[#3E63DD] mb-2" />
                <p className="text-xs font-medium text-slate-600">Loading package templates...</p>
              </div>
            ) : (() => {
              const queryDest = String(query?.destination || query?.destinationCity || query?.city || "").trim().toLowerCase();
              const term = agentPackagesSearch.trim().toLowerCase();

              // Strictly filter by query destination if available
              const destMatchedPackages = agentPackages.filter((pkg) => {
                if (!queryDest) return true;
                const pkgDest = String(pkg?.destination || "").toLowerCase();
                const pkgCity = String(pkg?.city || "").toLowerCase();
                const pkgCountry = String(pkg?.country || "").toLowerCase();
                const pkgTitle = String(pkg?.title || "").toLowerCase();

                const words = queryDest.split(/[,/\s]+/).filter((w) => w.length > 2 && w !== "india" && w !== "country");
                if (words.length === 0) return true;
                return words.some((word) =>
                  pkgDest.includes(word) || pkgCity.includes(word) || pkgCountry.includes(word) || pkgTitle.includes(word)
                );
              });

              const filteredPackages = destMatchedPackages.filter((pkg) => {
                if (!term) return true;
                return [
                  pkg.title,
                  pkg.destination,
                  pkg.country,
                  pkg.city,
                  pkg.duration,
                  pkg.description,
                ]
                  .filter(Boolean)
                  .some((val) => String(val).toLowerCase().includes(term));
              });

              if (filteredPackages.length === 0) {
                return (
                  <div className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-2xs font-sans">
                    <Package size={28} className="mx-auto text-slate-400 mb-2" />
                    <h3 className="text-base font-bold text-slate-900">No package templates found</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {term
                        ? `No packages match "${term}". Try another search term.`
                        : `No pre-configured package templates available for "${query?.destination || "this destination"}".`}
                    </p>
                  </div>
                );
              }

              const activePackageIndex = selectedAgentPackageId
                ? filteredPackages.findIndex((p) => p._id === selectedAgentPackageId)
                : 0;
              const packageIdx = activePackageIndex !== -1 ? activePackageIndex : 0;
              const selectedPkg = filteredPackages[packageIdx] || filteredPackages[0];

              const hotelsList = Array.isArray(selectedPkg?.hotels) ? selectedPkg.hotels : [];
              const transfersList = Array.isArray(selectedPkg?.transfers) ? selectedPkg.transfers : [];
              const rawActivitiesList = Array.isArray(selectedPkg?.activities) ? selectedPkg.activities : [];
              const rawSightseeingList = Array.isArray(selectedPkg?.sightseeing) ? selectedPkg.sightseeing : [];

              let activitiesList = [...rawActivitiesList];
              let sightseeingList = [...rawSightseeingList];

              if (sightseeingList.length === 0 && activitiesList.length > 0) {
                const actItems = [];
                const sightItems = [];

                activitiesList.forEach((item) => {
                  const itemType = String(item.type || item.category || "").toLowerCase();
                  const itemName = String(item.name || item.title || "").toLowerCase();

                  if (
                    itemType.includes("sightseeing") ||
                    itemName.includes("tour") ||
                    itemName.includes("khalifa") ||
                    itemName.includes("sightseeing") ||
                    itemName.includes("museum") ||
                    itemName.includes("mall") ||
                    itemName.includes("view") ||
                    itemName.includes("visit") ||
                    itemName.includes("temple") ||
                    itemName.includes("fort") ||
                    itemName.includes("burj")
                  ) {
                    sightItems.push(item);
                  } else {
                    actItems.push(item);
                  }
                });

                if (sightItems.length > 0) {
                  activitiesList = actItems;
                  sightseeingList = sightItems;
                }
              }

              const hotelTotal = hotelsList.reduce((sum, h) => sum + Number(h.price || h.total || 0), 0);
              const transferTotal = transfersList.reduce((sum, t) => sum + Number(t.price || t.total || 0), 0);
              const activityTotal = activitiesList.reduce((sum, a) => sum + Number(a.price || a.total || 0), 0);
              const sightseeingTotal = sightseeingList.reduce((sum, s) => sum + Number(s.price || s.total || 0), 0);

              return (
                <>
                  {/* LEFT SIDEBAR LIST OF PACKAGES (Matching All Quotes Left Sidebar) */}
                  <div className="w-full md:w-40 lg:w-44 shrink-0 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs self-stretch flex flex-col">
                    {/* Search bar inside sidebar */}
                    <div className="p-2 border-b border-slate-200 bg-[#f8fafc] shrink-0">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search packages..."
                          value={agentPackagesSearch}
                          onChange={(e) => setAgentPackagesSearch(e.target.value)}
                          className="w-full bg-slate-100/80 border border-slate-200 rounded-md pl-7 pr-2 py-1.5 text-[11px] font-sans outline-none focus:bg-white focus:border-[#3E63DD] transition-all"
                        />
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 font-sans shrink-0">
                      {filteredPackages.map((pkgItem, pIndex) => {
                        const isPkgSelected = selectedAgentPackageId
                          ? pkgItem._id === selectedAgentPackageId
                          : pIndex === packageIdx;

                        const pkgMarkupVal = Number(
                          pkgItem?.agentMarkup?.markupAmount ||
                          pkgItem?.agentMarkup?.value ||
                          pkgItem?.markupAmount ||
                          pkgItem?.markup ||
                          0
                        );
                        const hasMarkup = pkgMarkupVal > 0;
                        const isSent = Boolean(
                          pkgItem?.isSentToClient ||
                          pkgItem?.sentToClientAt ||
                          pkgItem?.status === "Sent to Client" ||
                          query?.voucherStatus === "sent"
                        );
                        const isApproved = Boolean(
                          pkgItem?.isApproved ||
                          pkgItem?.status === "Confirmed" ||
                          (isPkgSelected && (query?.queryStatus === "Confirmed" || query?.agentStatus === "Confirmed"))
                        );

                        let cardTheme = "gray";
                        let textPriceColor = "text-[#475569]";
                        let borderBarColor = "bg-[#3b58b5]";

                        if (isApproved) {
                          cardTheme = "green";
                          textPriceColor = "text-emerald-600";
                          borderBarColor = "bg-emerald-600";
                        } else if (isSent && hasMarkup) {
                          cardTheme = "blue";
                          textPriceColor = "text-[#3b58b5]";
                          borderBarColor = "bg-[#3b58b5]";
                        } else if (isSent && !hasMarkup) {
                          cardTheme = "gray_sent";
                          textPriceColor = "text-[#475569]";
                          borderBarColor = "bg-slate-500";
                        }

                        return (
                          <div
                            key={pkgItem._id || pIndex}
                            onClick={() => setSelectedAgentPackageId(pkgItem._id)}
                            className={`relative px-3 py-3 cursor-pointer transition-colors ${
                              isPkgSelected ? "bg-[#f8fafc]" : "hover:bg-slate-50"
                            }`}
                          >
                            {isPkgSelected && (
                              <div className={`absolute right-0 top-0 bottom-0 w-[3.5px] ${borderBarColor}`} />
                            )}
                            <div className="flex items-start justify-between gap-1">
                              <span
                                className={`text-2xl sm:text-[26px] font-extrabold tracking-tight leading-none ${textPriceColor}`}
                              >
                                {Math.round(pkgItem.price || pkgItem.basePrice || 0).toLocaleString("en-IN")}
                              </span>

                              {cardTheme === "green" && (
                                <svg className="w-[19px] h-[19px] shrink-0 mt-0.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              {cardTheme === "blue" && (
                                <svg className="w-[19px] h-[19px] shrink-0 mt-0.5 text-[#3b58b5]" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              {cardTheme === "gray_sent" && (
                                <svg className="w-[19px] h-[19px] shrink-0 mt-0.5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-900 mt-1 font-sans truncate">
                              {pkgItem.title}
                            </p>
                            <p className="text-[11px] text-slate-500 font-sans truncate">
                              {pkgItem.destination || "Destination"} • {(() => {
                                const d = String(pkgItem.duration || "").trim();
                                const title = String(pkgItem.title || "").toLowerCase();
                                if (d === "4D/3N" || d === "3N/4D" || title.includes("budget")) {
                                  return "3 Nights / 4 Days";
                                }
                                if (d === "5D/4N" || d === "4N/5D" || title.includes("luxury")) {
                                  return "4 Nights / 5 Days";
                                }
                                return d || "4 Nights / 5 Days";
                              })()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    {/* Empty filler element so sidebar white background extends to bottom */}
                    <div className="flex-1 bg-white min-h-[40px]" />
                  </div>

                  {/* RIGHT MAIN PANEL (Matching All Quotes Right Panel UI with Interactive Customizer) */}
                  {(() => {
                    const pkgId = selectedPkg?._id || "default";
                    const pkgCustom = getPkgCustom(pkgId);
                    const excludedHotels = pkgCustom.excludedHotels || [];
                    const excludedTransfers = pkgCustom.excludedTransfers || [];
                    const excludedActivities = pkgCustom.excludedActivities || [];
                    const excludedSightseeing = pkgCustom.excludedSightseeing || [];
                    const customHotels = pkgCustom.customHotels || [];
                    const customTransfers = pkgCustom.customTransfers || [];
                    const customActivities = pkgCustom.customActivities || [];

                    const defaultPackageHotels = [
                      {
                        nightLabel: "1st",
                        dateStr: query?.startDate ? new Date(query.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "22 May",
                        serviceTitle: selectedPkg?.title || "5-Star Luxury Hotel Stay",
                        actualHotelName: "Atlantis, The Palm",
                        city: selectedPkg?.destination || query?.destination || "Dubai",
                        starCount: 5,
                        meal: selectedPkg?.description || "Stay with daily buffet breakfast included",
                        room: "1 Ocean Deluxe Room",
                        nights: selectedPkg?.duration ? parseInt(selectedPkg.duration) || 1 : 1,
                        pax: `${query?.numberOfAdults || 2} Pax`,
                        price: selectedPkg?.price ? Math.round(selectedPkg.price).toLocaleString("en-IN") : "20,900",
                      },
                    ];

                    const baseHotelList = hotelsList.length > 0 ? hotelsList : defaultPackageHotels;

                    // Read Query Default Adults, Children, and Child Ages for all package services (Hotels, Transfers, Activities)
                    const defaultAdultsVal = Number(query?.numberOfAdults ?? query?.adults ?? 2);
                    const queryChildAgesList = getQueryChildAges(query);
                    const defaultChildrenVal = Number(query?.numberOfChildren ?? query?.children ?? queryChildAgesList.length);
                    const defaultChildAges = queryChildAgesList.length === defaultChildrenVal
                      ? queryChildAgesList
                      : Array.from({ length: defaultChildrenVal }, (_, i) => queryChildAgesList[i] !== undefined ? queryChildAgesList[i] : 5);

                    // Process Hotel Rows with Customizations & Exact DMC Contracted Rates
                    let totalHotelDelta = 0;
                    let totalCustomHotelsCost = 0;

                    const processedHotels = baseHotelList.map((hotel, hIdx) => {
                      const startDate = query?.startDate ? new Date(query.startDate) : new Date("2026-05-22");
                      const currentDate = new Date(startDate);
                      currentDate.setDate(currentDate.getDate() + hIdx);
                      const nightNum = hotel.day || hotel.night || (hIdx + 1);
                      const nightSuffix = getOrdinalSuffix(nightNum);

                      const rawHotelName = String(hotel.hotelName || hotel.hotel_name || hotel.hotel || "").trim();
                      const rawServiceName = String(hotel.serviceName || hotel.serviceTitle || (hotel.name && hotel.name !== rawHotelName ? hotel.name : "")).trim();

                      // Find exact match in live DMC catalogue from uploaded Excel/CSV
                      const matchedDmc = liveDmcHotels.find((dh) => {
                        const dHotel = String(dh.hotelName || "").toLowerCase();
                        const dService = String(dh.serviceName || dh.title || dh.name || "").toLowerCase();
                        const hHotel = rawHotelName.toLowerCase();
                        const hService = (rawServiceName || String(hotel.name || "")).toLowerCase();
                        return (
                          (dHotel && hHotel && (dHotel === hHotel || dHotel.includes(hHotel) || hHotel.includes(dHotel))) ||
                          (dService && hService && (dService === hService || dService.includes(hService) || hService.includes(dService))) ||
                          (dHotel && hService && (dHotel === hService || dHotel.includes(hService) || hService.includes(dHotel)))
                        );
                      });

                      // Accurately resolve stars from DMC inventory (e.g. "5 Star") or package metadata
                      const stars = (() => {
                        const directCat = matchedDmc?.hotelCategory || matchedDmc?.starRating || matchedDmc?.stars || hotel.hotelCategory || hotel.starRating || hotel.stars;
                        if (directCat) {
                          const num = Number(String(directCat).replace(/\D/g, ""));
                          if (num >= 1 && num <= 5) return num;
                        }
                        const hotelFullText = `${hotel.name || ""} ${hotel.title || ""} ${hotel.serviceName || ""} ${matchedDmc?.serviceName || ""} ${matchedDmc?.hotelName || ""} ${hotel.description || ""} ${selectedPkg?.description || ""} ${selectedPkg?.title || ""}`;
                        if (/5\s*star|5-star|5star|luxury|atlantis|jaypee|marriott/i.test(hotelFullText)) return 5;
                        if (/3\s*star|3-star|3star|budget|citymax/i.test(hotelFullText)) return 3;
                        if (/4\s*star|4-star|4star/i.test(hotelFullText)) return 4;
                        return String(selectedPkg?.title || "").toLowerCase().includes("budget") ? 3 : (String(selectedPkg?.title || "").toLowerCase().includes("luxury") ? 5 : 4);
                      })();

                      const isUnitNight = String(hotel.unit || "").toLowerCase().includes("night");
                      const savedHotelNights = Number(hotel.nights || hotel.numberOfNights || 0);
                      const defaultNVal = savedHotelNights > 0
                        ? savedHotelNights
                        : baseHotelList.length === 1
                        ? getPackageNightCount(selectedPkg)
                        : (isUnitNight ? Number(hotel.quantity || 1) : 1);

                      const defaultRoomsVal = isUnitNight ? 1 : (Number(hotel.quantity) || 1);
                      const defaultPaxVal = Number(query?.numberOfAdults || 2);
                      const roomCat = hotel.roomType || hotel.room_type || hotel.roomCategory || (String(hotel.title || selectedPkg?.title || "").toLowerCase().includes("luxury") ? "Ocean Deluxe Room" : "Standard Room");

                      // Resolved Hotel Name (e.g. "Jaypee Residency Manor Mussoorie")
                      const displayHotelName = rawHotelName || matchedDmc?.hotelName || (hotel.name && !rawServiceName ? hotel.name : "") || (stars === 3 ? "Citymax Hotel Bur Dubai" : (stars === 5 ? "Jaypee Residency Manor Mussoorie" : "Fortune Resort Grace Mussoorie"));

                      // Resolved Service Name (e.g. "Mussoorie Mall Road Heritage")
                      const displayHotelTitle = (
                        rawServiceName ||
                        matchedDmc?.serviceName ||
                        (hotel.name && hotel.name !== displayHotelName ? hotel.name : "") ||
                        (stars === 3 ? "3-Star Deluxe City Center Hotel Stay" : stars === 4 ? "4-Star City Hotel Stay" : "5-Star Luxury Hotel Stay")
                      );

                      const savedNightlyRate = Number(
                        hotel.pricePerNight ||
                        hotel.quoteBaseRate ||
                        hotel.roomTypeOptionRate ||
                        hotel.rate ||
                        0
                      );
                      const hotelTotalAmount = Number(
                        hotel.total ||
                        hotel.originalTotal ||
                        hotel.totalInInr ||
                        hotel.priceInInr ||
                        0
                      );

                      const baseRoomRatePerNight = Number(
                        savedNightlyRate > 0
                          ? savedNightlyRate
                          : (hotelTotalAmount > 0
                              ? Math.round(hotelTotalAmount / Math.max(1, defaultNVal * defaultRoomsVal))
                              : (hotel.price > 0
                                  ? (hotel.price > 15000 && defaultNVal > 1
                                      ? Math.round(hotel.price / Math.max(1, defaultNVal * defaultRoomsVal))
                                      : hotel.price)
                                  : (selectedPkg?.price ? Math.round((selectedPkg.price * 0.5) / Math.max(1, defaultNVal * defaultRoomsVal)) : 0)))
                      );
                      const rawPrice = Number(hotel.price || hotelTotalAmount || (baseRoomRatePerNight * defaultNVal * defaultRoomsVal) || 0);

                      // Exact DMC Rates for AWEB, CWEB, CWOEB
                      const awebRate = Number(
                        hotel.awebRate ||
                        matchedDmc?.awebRate ||
                        Math.round(baseRoomRatePerNight * 0.35)
                      );
                      const cwebRate = Number(
                        hotel.cwebRate ||
                        matchedDmc?.cwebRate ||
                        Math.round(baseRoomRatePerNight * 0.25)
                      );
                      const cwoebRate = Number(
                        hotel.cwoebRate ||
                        matchedDmc?.cwoebRate ||
                        Math.round(baseRoomRatePerNight * 0.15)
                      );

                      // Read Custom Overrides (Rooms, Nights, Adults, Child, Extra Bed Counts)
                      const hotelConfig = pkgCustom.hotelOverrides?.[hIdx] || {};
                      const roomCount = Number(hotelConfig.rooms !== undefined ? hotelConfig.rooms : defaultRoomsVal);
                      // A package's stored stay is the initial value. Only a night value
                      // changed through this stepper may override it. This prevents old
                      // one-night UI defaults from changing a 3-night package's price.
                      const nightsCount = Number(
                        hotelConfig.nightsManuallyChanged && hotelConfig.nights !== undefined
                          ? hotelConfig.nights
                          : defaultNVal,
                      );
                      const adultsCount = Number(hotelConfig.adults !== undefined ? hotelConfig.adults : (hotelConfig.pax !== undefined ? hotelConfig.pax : defaultAdultsVal));
                      const childrenCount = Number(hotelConfig.children !== undefined ? hotelConfig.children : defaultChildrenVal);
                      const paxCount = adultsCount + childrenCount;
                      const childAges = Array.isArray(hotelConfig.childAges)
                        ? hotelConfig.childAges
                        : (hotelConfig.children === undefined && defaultChildAges.length === childrenCount
                            ? defaultChildAges
                            : Array.from({ length: childrenCount }, (_, i) => defaultChildAges[i] !== undefined ? defaultChildAges[i] : 5));
                      const awebCount = Number(hotelConfig.awebCount || 0);
                      const cwebCount = Number(hotelConfig.cwebCount || 0);
                      const cwoebCount = Number(hotelConfig.cwoebCount || 0);

                      const isExcluded = excludedHotels.includes(hIdx);

                      const roomsCost = baseRoomRatePerNight * roomCount * nightsCount;
                      const awebTotal = awebCount * awebRate * nightsCount;
                      const cwebTotal = cwebCount * cwebRate * nightsCount;
                      const cwoebTotal = cwoebCount * cwoebRate * nightsCount;
                      const totalAddonsCost = awebTotal + cwebTotal + cwoebTotal;

                      const originalCost = baseRoomRatePerNight * defaultRoomsVal * defaultNVal;
                      const effectiveTotal = isExcluded ? 0 : (roomsCost + totalAddonsCost);
                      const delta = isExcluded ? -originalCost : (effectiveTotal - originalCost);

                      totalHotelDelta += delta;

                      const startNightNum = Number(String(hotel.day || hotel.night || (hIdx + 1)).replace(/\D/g, "")) || (hIdx + 1);
                      const totalNights = Number(nightsCount) || 1;
                      const endNightNum = startNightNum + totalNights - 1;

                      let displayNightLabel = `${startNightNum}${getOrdinalSuffix(startNightNum)}`;
                      if (totalNights > 1) {
                        displayNightLabel = `${startNightNum}${getOrdinalSuffix(startNightNum)} - ${endNightNum}${getOrdinalSuffix(endNightNum)}`;
                      }

                      let dateLabel = currentDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                      if (totalNights > 1) {
                        const endD = new Date(currentDate);
                        endD.setDate(endD.getDate() + (totalNights - 1));
                        dateLabel = `${currentDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${endD.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
                      }

                      // Resolve ROOM CATEGORY, BED TYPE, ROOM TYPE
                      const defaultRoomCategory = hotel.roomCategory || matchedDmc?.roomCategory || (query?.numberOfAdults === 1 ? "Single" : "Double");
                      const roomCategory = hotelConfig.roomCategory || defaultRoomCategory;

                      const defaultBedType = hotel.bedType || matchedDmc?.bedType || (
                        String(hotel.name || hotel.title || "").toLowerCase().includes("heritage") ||
                        String(hotel.name || hotel.title || "").toLowerCase().includes("hill") ||
                        String(displayHotelTitle || "").toLowerCase().includes("heritage")
                          ? "Queen"
                          : (String(roomCategory).toLowerCase().includes("twin") ? "Twin" : "King")
                      );
                      const bedType = hotelConfig.bedType || defaultBedType;

                      const defaultRoomType = hotel.roomType || matchedDmc?.roomType || hotel.room_type || (
                        String(displayHotelTitle || "").toLowerCase().includes("heritage")
                          ? "Heritage Room"
                          : (String(displayHotelTitle || "").toLowerCase().includes("valley")
                              ? "Valley View Room"
                              : (String(displayHotelTitle || "").toLowerCase().includes("mountain")
                                  ? "Mountain View Room"
                                  : (String(displayHotelTitle || "").toLowerCase().includes("hill")
                                      ? "Hill View Room"
                                      : (String(displayHotelTitle || "").toLowerCase().includes("garden")
                                          ? "Garden View Room"
                                          : (String(selectedPkg?.title || "").toLowerCase().includes("luxury") ? "Luxury Room" : "Deluxe Room")))))
                      );
                      const roomType = hotelConfig.roomType || defaultRoomType;

                      return {
                        originalIndex: hIdx,
                        isCustom: false,
                        isExcluded,
                        roomCount,
                        nightsCount,
                        adultsCount,
                        childrenCount,
                        childAges,
                        paxCount,
                        roomCategory,
                        bedType,
                        roomType,
                        awebCount,
                        cwebCount,
                        cwoebCount,
                        baseRoomRatePerNight,
                        awebRate,
                        cwebRate,
                        cwoebRate,
                        roomsCost,
                        totalAddonsCost,
                        nightLabel: displayNightLabel,
                        dateStr: dateLabel,
                        serviceTitle: displayHotelTitle,
                        actualHotelName: displayHotelName,
                        city: hotel.city || selectedPkg?.destination || query?.destination || "Destination",
                        starCount: stars,
                        meal: hotel.description || selectedPkg?.description || hotel.mealPlan || "Daily international buffet breakfast",
                        price: rawPrice,
                        effectiveTotal,
                        delta,
                      };
                    });

                    // Custom Hotel Add-ons
                    const processedCustomHotels = customHotels.map((ch, chIdx) => {
                      const chBasePrice = Number(ch.price || ch.baseRoomRatePerNight || 0);
                      const chRooms = Number(ch.rooms || ch.roomCount || 1);
                      const chNights = Number(ch.nights || ch.nightsCount || 1);
                      const chAdults = Number(ch.adults !== undefined ? ch.adults : defaultAdultsVal);
                      const chChildren = Number(ch.children !== undefined ? ch.children : defaultChildrenVal);
                      const chChildAges = Array.isArray(ch.childAges) ? ch.childAges : defaultChildAges;
                      const chPax = chAdults + chChildren;

                      const chAwebRate = Number(ch.awebRate || Math.round(chBasePrice * 0.35));
                      const chCwebRate = Number(ch.cwebRate || Math.round(chBasePrice * 0.25));
                      const chCwoebRate = Number(ch.cwoebRate || Math.round(chBasePrice * 0.15));

                      const chAwebCount = Number(ch.awebCount || 0);
                      const chCwebCount = Number(ch.cwebCount || 0);
                      const chCwoebCount = Number(ch.cwoebCount || 0);

                      const roomsCost = chBasePrice * chRooms * chNights;
                      const awebTotal = chAwebCount * chAwebRate * chNights;
                      const cwebTotal = chCwebCount * chCwebRate * chNights;
                      const cwoebTotal = chCwoebCount * chCwoebRate * chNights;
                      const totalAddonsCost = awebTotal + cwebTotal + cwoebTotal;
                      const effectiveTotal = roomsCost + totalAddonsCost;

                      totalCustomHotelsCost += effectiveTotal;

                      // Calculate start night number based on previous hotels
                      const previousNights = processedHotels.reduce((sum, h) => sum + (h.isExcluded ? 0 : h.nightsCount), 0);
                      const customStartNight = previousNights + 1 + chIdx;
                      const customEndNight = customStartNight + chNights - 1;
                      let customNightLabel = `${customStartNight}${getOrdinalSuffix(customStartNight)}`;
                      if (chNights > 1) {
                        customNightLabel = `${customStartNight}${getOrdinalSuffix(customStartNight)} - ${customEndNight}${getOrdinalSuffix(customEndNight)}`;
                      }

                      const startDate = query?.startDate ? new Date(query.startDate) : new Date("2026-05-22");
                      const customStartDate = new Date(startDate);
                      customStartDate.setDate(customStartDate.getDate() + previousNights + chIdx);
                      let customDateStr = customStartDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                      if (chNights > 1) {
                        const customEndDate = new Date(customStartDate);
                        customEndDate.setDate(customEndDate.getDate() + (chNights - 1));
                        customDateStr = `${customStartDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${customEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
                      }

                      return {
                        id: ch.id || `custom-hotel-${chIdx}`,
                        customIndex: chIdx,
                        originalIndex: chIdx,
                        isCustom: true,
                        isExcluded: false,
                        roomCount: chRooms,
                        nightsCount: chNights,
                        adultsCount: chAdults,
                        childrenCount: chChildren,
                        childAges: chChildAges,
                        paxCount: chPax,
                        roomCategory: ch.roomCategory || "Double",
                        bedType: ch.bedType || "King",
                        roomType: ch.roomType || "Deluxe Room",
                        awebCount: chAwebCount,
                        cwebCount: chCwebCount,
                        cwoebCount: chCwoebCount,
                        baseRoomRatePerNight: chBasePrice,
                        awebRate: chAwebRate,
                        cwebRate: chCwebRate,
                        cwoebRate: chCwoebRate,
                        roomsCost,
                        totalAddonsCost,
                        nightLabel: customNightLabel,
                        dateStr: customDateStr,
                        serviceTitle: ch.serviceTitle || ch.name || "Custom Hotel Stay",
                        actualHotelName: ch.actualHotelName || ch.name || "",
                        city: ch.city || selectedPkg?.destination || query?.destination || "Destination",
                        starCount: Number(ch.starCount || 5),
                        meal: ch.meal || "Daily international buffet breakfast",
                        price: chBasePrice,
                        effectiveTotal,
                        delta: effectiveTotal,
                      };
                    });

                    const allHotelRows = [...processedHotels, ...processedCustomHotels];
                    const accommodationTotal = allHotelRows.reduce((sum, r) => sum + r.effectiveTotal, 0);

                    // Process Transfers with Exact DMC Contracted Rates, Capacity, and Steppers
                    let totalTransferDelta = 0;
                    let totalCustomTransfersCost = 0;

                    const processedTransfers = transfersList.map((transfer, tIdx) => {
                      const startDate = query?.startDate ? new Date(query.startDate) : new Date("2026-05-22");
                      const rawTransferName = String(transfer.name || transfer.serviceName || "").trim();
                      const rawVehicleName = String(transfer.vehicle_type || transfer.vehicleType || "").trim();

                      const pkgDest = String(selectedPkg?.destination || query?.destination || transfer.city || "").trim();
                      const cleanPkgDest = pkgDest.toLowerCase();
                      const pkgTokens = cleanPkgDest.split(/[\s,/-]+/).filter((t) => t.length >= 2);

                      // Match in live DMC transfer inventory (strictly scoped to the current package destination/city)
                      const matchedDmc = (liveDmcTransfers || []).find((dt) => {
                        const dCity = String(dt.city || "").toLowerCase().trim();
                        const dCountry = String(dt.country || "").toLowerCase().trim();
                        const dName = String(dt.serviceName || dt.name || dt.title || "").toLowerCase();
                        const dVehicle = String(dt.vehicleType || "").toLowerCase();
                        const tName = rawTransferName.toLowerCase();
                        const tVehicle = rawVehicleName.toLowerCase();

                        // Check destination/city compatibility
                        let isDestMatch = false;
                        if (!cleanPkgDest) {
                          isDestMatch = true;
                        } else if (dCity && (dCity === cleanPkgDest || cleanPkgDest.includes(dCity) || dCity.includes(cleanPkgDest))) {
                          isDestMatch = true;
                        } else if (dCountry && (dCountry === cleanPkgDest || cleanPkgDest.includes(dCountry))) {
                          isDestMatch = true;
                        } else if (dName && (dName.includes(cleanPkgDest) || cleanPkgDest.includes(dName))) {
                          isDestMatch = true;
                        } else {
                          for (const tok of pkgTokens) {
                            if (tok.length >= 3 && (dCity.includes(tok) || dName.includes(tok) || dCountry.includes(tok))) {
                              isDestMatch = true;
                              break;
                            }
                          }
                        }

                        if (!isDestMatch) return false;

                        return (
                          (dName && tName && (dName === tName || dName.includes(tName) || tName.includes(dName))) ||
                          (dVehicle && tVehicle && (dVehicle === tVehicle || dVehicle.includes(tVehicle))) ||
                          (dVehicle && tName && tName.includes(dVehicle))
                        );
                      });

                      const transferConfig = pkgCustom.transferOverrides?.[tIdx] || {};

                      const rawVehicleType = rawVehicleName || matchedDmc?.vehicleType || (/innova/i.test(rawTransferName) ? "Innova Crysta" : (/suv/i.test(rawTransferName) ? "SUV" : (/tempo|traveller/i.test(rawTransferName) ? "Tempo Traveller" : "Sedan")));
                      const vehicleType = transferConfig.vehicleType || rawVehicleType;

                      const passengerCapacity = Number(
                        transferConfig.passengerCapacity ||
                        transfer.passenger_capacity ||
                        transfer.passengerCapacity ||
                        matchedDmc?.passengerCapacity ||
                        (/coach|bus/i.test(vehicleType) ? 40 : (/minibus|mini\s*bus/i.test(vehicleType) ? 20 : (/tempo|traveller/i.test(vehicleType) ? 12 : (/suv|innova/i.test(vehicleType) ? 6 : 4))))
                      );
                      const luggageCapacity = Number(
                        transferConfig.luggageCapacity ||
                        transfer.luggage_capacity ||
                        transfer.luggageCapacity ||
                        matchedDmc?.luggageCapacity ||
                        (/coach|bus/i.test(vehicleType) ? 25 : (/minibus|mini\s*bus/i.test(vehicleType) ? 12 : (/tempo|traveller/i.test(vehicleType) ? 8 : (/suv|innova/i.test(vehicleType) ? 4 : 2))))
                      );
                      const usageType = transferConfig.usageType || transfer.usageType || matchedDmc?.usageType || "One Way / Airport Transfer";

                      const displayTransferTitle = rawTransferName || matchedDmc?.serviceName || `${pkgDest || "City"} Transfer Service`;
                      const displayVehicleName = transfer.vehicle_name || transfer.actualVehicleName || (
                        matchedDmc?.supplierName
                          ? `${vehicleType} • ${matchedDmc.supplierName}`
                          : (vehicleType === "Sedan"
                              ? "AC Sedan (Dzire / Etios or equivalent)"
                              : vehicleType === "Innova Crysta"
                              ? "Toyota Innova Crysta / AC Cab"
                              : vehicleType === "SUV"
                              ? "AC SUV (Innova / Ertiga or equivalent)"
                              : vehicleType === "Tempo Traveller"
                              ? "Force Tempo Traveller AC"
                              : `AC ${vehicleType}`)
                      );
                      const city = transfer.city || selectedPkg?.destination || query?.destination || (matchedDmc ? matchedDmc.city : "") || "Mussoorie";
                      const description = transfer.description || matchedDmc?.description || `${city} transfer in AC ${vehicleType} with professional driver, fuel & toll included`;

                      const rawPrice = Number(transfer.price || (transfer.total ? transfer.total : matchedDmc?.price) || 2500);

                      // Helper for vehicle multiplier
                      const getVehicleMultiplier = (v = "") => {
                        const s = String(v).toLowerCase();
                        if (s.includes("coach") || s.includes("bus")) return 4.0;
                        if (s.includes("mini bus") || s.includes("minibus")) return 2.8;
                        if (s.includes("tempo") || s.includes("traveller")) return 2.0;
                        if (s.includes("innova") || s.includes("suv")) return 1.4;
                        return 1.0;
                      };
                      const vMult = getVehicleMultiplier(vehicleType) / getVehicleMultiplier(rawVehicleType);

                      const baseRatePerDayInitial = Number(transfer.pricePerDay || transfer.rate || (matchedDmc?.price) || rawPrice);

                      const matchedVehicle = matchedDmc?.vehicles?.find(
                        (v) => String(v?.vehicleType || "").toLowerCase() === String(vehicleType).toLowerCase()
                      ) || matchedDmc?.vehicles?.[0];

                      const fullDayHourlyOption = (matchedVehicle?.usageTypes?.hourly || []).find(
                        (h) => String(h?.name || h?.usageType || "").toLowerCase().includes("full")
                      ) || matchedDmc?.vehicles?.[0]?.usageTypes?.hourly?.[0];

                      const halfDayHourlyOption = (matchedVehicle?.usageTypes?.hourly || []).find(
                        (h) => String(h?.name || h?.usageType || "").toLowerCase().includes("half")
                      ) || matchedDmc?.vehicles?.[0]?.usageTypes?.hourly?.[1];

                      // 4 DMC Contracted Usage Rates & Notes
                      const oneWayRate = Math.round(Number(transfer.oneWayPrice || transfer.oneWayRate || matchedDmc?.oneWayPrice || baseRatePerDayInitial || 2500) * vMult);
                      const interHotelRate = Math.round(Number(
                        transfer.interHotelPrice ||
                        transfer.interHotelRate ||
                        matchedDmc?.interHotelPrice ||
                        matchedDmc?.vehicles?.[0]?.usageTypes?.pointToPoint?.[1]?.price ||
                        Math.round(baseRatePerDayInitial * 0.6) ||
                        1500
                      ) * vMult);
                      const fullDayRate = Math.round(Number(
                        transfer.fullDayPrice ||
                        transfer.fullDayRate ||
                        matchedDmc?.fullDayPrice ||
                        fullDayHourlyOption?.price ||
                        matchedDmc?.vehicles?.[0]?.usageTypes?.hourly?.[0]?.price ||
                        Math.round(baseRatePerDayInitial * 1.5) ||
                        3500
                      ) * vMult);
                      const halfDayRate = Math.round(Number(
                        transfer.halfDayPrice ||
                        transfer.halfDayRate ||
                        matchedDmc?.halfDayPrice ||
                        halfDayHourlyOption?.price ||
                        matchedDmc?.vehicles?.[0]?.usageTypes?.hourly?.[1]?.price ||
                        Math.round(baseRatePerDayInitial * 0.9) ||
                        2200
                      ) * vMult);

                      const fullDayExtraPerKmRate = Number(
                        transfer.fullDayExtraPerKmRate !== undefined && transfer.fullDayExtraPerKmRate !== ""
                          ? transfer.fullDayExtraPerKmRate
                          : transfer.priceHourlyFullDayExtraKm !== undefined && transfer.priceHourlyFullDayExtraKm !== ""
                          ? transfer.priceHourlyFullDayExtraKm
                          : fullDayHourlyOption?.extraPerKmRate !== undefined && fullDayHourlyOption?.extraPerKmRate !== ""
                          ? fullDayHourlyOption.extraPerKmRate
                          : matchedDmc?.fullDayExtraPerKmRate !== undefined && matchedDmc?.fullDayExtraPerKmRate !== ""
                          ? matchedDmc.fullDayExtraPerKmRate
                          : transfer.extraPerKmRate !== undefined && transfer.extraPerKmRate !== ""
                          ? transfer.extraPerKmRate
                          : matchedDmc?.extraPerKmRate || 0
                      );

                      const halfDayExtraPerKmRate = Number(
                        transfer.halfDayExtraPerKmRate !== undefined && transfer.halfDayExtraPerKmRate !== ""
                          ? transfer.halfDayExtraPerKmRate
                          : transfer.priceHourlyHalfDayExtraKm !== undefined && transfer.priceHourlyHalfDayExtraKm !== ""
                          ? transfer.priceHourlyHalfDayExtraKm
                          : halfDayHourlyOption?.extraPerKmRate !== undefined && halfDayHourlyOption?.extraPerKmRate !== ""
                          ? halfDayHourlyOption.extraPerKmRate
                          : matchedDmc?.halfDayExtraPerKmRate !== undefined && matchedDmc?.halfDayExtraPerKmRate !== ""
                          ? matchedDmc.halfDayExtraPerKmRate
                          : transfer.extraPerKmRate !== undefined && transfer.extraPerKmRate !== ""
                          ? transfer.extraPerKmRate
                          : matchedDmc?.extraPerKmRate || 0
                      );

                      let baseRatePerDay = oneWayRate;
                      if (usageType === "Inter Hotel Transfer") baseRatePerDay = interHotelRate;
                      else if (usageType.includes("Full Day")) baseRatePerDay = fullDayRate;
                      else if (usageType.includes("Half Day")) baseRatePerDay = halfDayRate;

                      const fullDayNote = String(
                        transfer.fullDayNote ||
                        matchedDmc?.fullDayNote ||
                        "Max 80 km / 8 hours limit. Extra km & hours charged separately."
                      ).trim();

                      const halfDayNote = String(
                        transfer.halfDayNote ||
                        matchedDmc?.halfDayNote ||
                        "Max 40 km / 4 hours limit. Extra km & hours charged separately."
                      ).trim();

                      const vehiclesCount = Number(transferConfig.vehicles !== undefined ? transferConfig.vehicles : 1);
                      const daysCount = Number(transferConfig.days !== undefined ? transferConfig.days : 1);
                      const adultsCount = Number(transferConfig.adults !== undefined ? transferConfig.adults : defaultAdultsVal);
                      const childrenCount = Number(transferConfig.children !== undefined ? transferConfig.children : defaultChildrenVal);
                      const pointToPointCount = Number(transferConfig.pointToPointCount || 0);
                      const interHotelCount = Number(transferConfig.interHotelCount || 0);
                      const fullDayCount = Number(transferConfig.fullDayCount || 0);
                      const halfDayCount = Number(transferConfig.halfDayCount || 0);

                      const isExcluded = excludedTransfers.includes(tIdx);

                      const cabsCost = baseRatePerDay * vehiclesCount * daysCount;
                      const addonsCost = (pointToPointCount * oneWayRate) + (interHotelCount * interHotelRate) + (fullDayCount * fullDayRate * daysCount) + (halfDayCount * halfDayRate * daysCount);
                      const effectiveTotal = isExcluded ? 0 : (cabsCost + addonsCost);
                      const originalCost = baseRatePerDay * 1 * 1;
                      const delta = isExcluded ? -originalCost : (effectiveTotal - originalCost);

                      totalTransferDelta += delta;

                      const startDayNum = Number(String(transfer.day || `Day ${tIdx + 1}`).replace(/\D/g, "")) || (tIdx + 1);
                      const endDayNum = startDayNum + daysCount - 1;
                      const dayLabel = daysCount > 1
                        ? `${startDayNum}${getOrdinalSuffix(startDayNum)} - ${endDayNum}${getOrdinalSuffix(endDayNum)} Day`
                        : `${startDayNum}${getOrdinalSuffix(startDayNum)} Day`;

                      const currentDate = new Date(startDate);
                      currentDate.setDate(currentDate.getDate() + (startDayNum - 1));
                      let dateLabel = currentDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                      if (daysCount > 1) {
                        const endD = new Date(currentDate);
                        endD.setDate(endD.getDate() + (daysCount - 1));
                        dateLabel = `${currentDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${endD.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
                      }

                      return {
                        originalIndex: tIdx,
                        isCustom: false,
                        isExcluded,
                        transfer,
                        serviceTitle: displayTransferTitle,
                        actualVehicleName: displayVehicleName,
                        vehicleType,
                        passengerCapacity,
                        luggageCapacity,
                        usageType,
                        city,
                        description,
                        dayLabel,
                        dateStr: dateLabel,
                        vehiclesCount,
                        daysCount,
                        adultsCount,
                        childrenCount,
                        pointToPointCount,
                        interHotelCount,
                        fullDayCount,
                        halfDayCount,
                        baseRatePerDay,
                        oneWayRate,
                        pointToPointRate: oneWayRate,
                        interHotelRate,
                        fullDayRate,
                        halfDayRate,
                        fullDayNote,
                        halfDayNote,
                        fullDayExtraPerKmRate,
                        halfDayExtraPerKmRate,
                        cabsCost,
                        addonsCost,
                        price: rawPrice,
                        effectiveTotal,
                        effectivePrice: effectiveTotal,
                        delta,
                      };
                    });

                    // Custom Transfer Add-ons
                    const processedCustomTransfers = customTransfers.map((ct, ctIdx) => {
                      const ctVehicleType = ct.vehicleType || "Sedan";
                      const ctUsageType = ct.usageType || "One Way / Airport Transfer";

                      const getVehicleMultiplier = (v = "") => {
                        const s = String(v).toLowerCase();
                        if (s.includes("coach") || s.includes("bus")) return 4.0;
                        if (s.includes("mini bus") || s.includes("minibus")) return 2.8;
                        if (s.includes("tempo") || s.includes("traveller")) return 2.0;
                        if (s.includes("innova") || s.includes("suv")) return 1.4;
                        return 1.0;
                      };
                      const ctVMult = getVehicleMultiplier(ctVehicleType);

                      const ctBaseInitial = Number(ct.price || ct.baseRatePerDay || ct.oneWayRate || 2500);
                      const ctPointToPointRate = Math.round(Number(ct.pointToPointRate || ct.oneWayRate || ct.oneWayPrice || ctBaseInitial) * ctVMult);
                      const ctInterHotelRate = Math.round(Number(ct.interHotelRate || ct.interHotelPrice || Math.round(ctBaseInitial * 0.6) || 1500) * ctVMult);
                      const ctFullDayRate = Math.round(Number(ct.fullDayRate || ct.fullDayPrice || Math.round(ctBaseInitial * 1.5) || 3500) * ctVMult);
                      const ctHalfDayRate = Math.round(Number(ct.halfDayRate || ct.halfDayPrice || Math.round(ctBaseInitial * 0.9) || 2200) * ctVMult);

                      let ctBasePrice = ctPointToPointRate;
                      if (ctUsageType === "Inter Hotel Transfer") ctBasePrice = ctInterHotelRate;
                      else if (ctUsageType.includes("Full Day")) ctBasePrice = ctFullDayRate;
                      else if (ctUsageType.includes("Half Day")) ctBasePrice = ctHalfDayRate;

                      const ctPassengerCapacity = Number(
                        ct.passengerCapacity ||
                        (/coach|bus/i.test(ctVehicleType) ? 40 : (/minibus|mini\s*bus/i.test(ctVehicleType) ? 20 : (/tempo|traveller/i.test(ctVehicleType) ? 12 : (/suv|innova/i.test(ctVehicleType) ? 6 : 4))))
                      );
                      const ctLuggageCapacity = Number(
                        ct.luggageCapacity ||
                        (/coach|bus/i.test(ctVehicleType) ? 25 : (/minibus|mini\s*bus/i.test(ctVehicleType) ? 12 : (/tempo|traveller/i.test(ctVehicleType) ? 8 : (/suv|innova/i.test(ctVehicleType) ? 4 : 2))))
                      );

                      const ctVehicles = Number(ct.vehicles || 1);
                      const ctDays = Number(ct.days || 1);
                      const ctAdults = Number(ct.adults !== undefined ? ct.adults : defaultAdultsVal);
                      const ctChildren = Number(ct.children !== undefined ? ct.children : defaultChildrenVal);

                      const ctFullDayNote = String(ct.fullDayNote || "Max 80 km / 8 hours limit. Extra km & hours charged separately.").trim();
                      const ctHalfDayNote = String(ct.halfDayNote || "Max 40 km / 4 hours limit. Extra km & hours charged separately.").trim();
                      const ctFullDayExtraPerKmRate = Number(
                        ct.fullDayExtraPerKmRate !== undefined && ct.fullDayExtraPerKmRate !== ""
                          ? ct.fullDayExtraPerKmRate
                          : ct.priceHourlyFullDayExtraKm !== undefined && ct.priceHourlyFullDayExtraKm !== ""
                          ? ct.priceHourlyFullDayExtraKm
                          : ct.extraPerKmRate || 0
                      );
                      const ctHalfDayExtraPerKmRate = Number(
                        ct.halfDayExtraPerKmRate !== undefined && ct.halfDayExtraPerKmRate !== ""
                          ? ct.halfDayExtraPerKmRate
                          : ct.priceHourlyHalfDayExtraKm !== undefined && ct.priceHourlyHalfDayExtraKm !== ""
                          ? ct.priceHourlyHalfDayExtraKm
                          : ct.extraPerKmRate || 0
                      );

                      const ctPointToPointCount = Number(ct.pointToPointCount || 0);
                      const ctInterHotelCount = Number(ct.interHotelCount || 0);
                      const ctFullDayCount = Number(ct.fullDayCount || 0);
                      const ctHalfDayCount = Number(ct.halfDayCount || 0);

                      const cabsCost = ctBasePrice * ctVehicles * ctDays;
                      const addonsCost = (ctPointToPointCount * ctPointToPointRate) + (ctInterHotelCount * ctInterHotelRate) + (ctFullDayCount * ctFullDayRate * ctDays) + (ctHalfDayCount * ctHalfDayRate * ctDays);
                      const effectiveTotal = cabsCost + addonsCost;

                      totalCustomTransfersCost += effectiveTotal;

                      const previousDays = processedTransfers.reduce((sum, t) => sum + (t.isExcluded ? 0 : t.daysCount), 0);
                      const customStartDay = previousDays + 1 + ctIdx;
                      const customEndDay = customStartDay + ctDays - 1;
                      const customDayLabel = ctDays > 1
                        ? `${customStartDay}${getOrdinalSuffix(customStartDay)} - ${customEndDay}${getOrdinalSuffix(customEndDay)} Day`
                        : `${customStartDay}${getOrdinalSuffix(customStartDay)} Day`;

                      const startDate = query?.startDate ? new Date(query.startDate) : new Date("2026-05-22");
                      const customStartDate = new Date(startDate);
                      customStartDate.setDate(customStartDate.getDate() + previousDays + ctIdx);
                      let customDateStr = customStartDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                      if (ctDays > 1) {
                        const customEndDate = new Date(customStartDate);
                        customEndDate.setDate(customEndDate.getDate() + (ctDays - 1));
                        customDateStr = `${customStartDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${customEndDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
                      }

                      return {
                        id: ct.id || `custom-transfer-${ctIdx}`,
                        customIndex: ctIdx,
                        originalIndex: ctIdx,
                        isCustom: true,
                        isExcluded: false,
                        transfer: {
                          name: ct.name,
                          vehicleType: ctVehicleType,
                          day: ct.day || customDayLabel,
                          description: ct.description || "Custom transfer add-on",
                          price: ctBasePrice,
                        },
                        serviceTitle: ct.serviceTitle || ct.name || "Custom Transfer Service",
                        actualVehicleName: ct.actualVehicleName || `AC ${ctVehicleType}`,
                        vehicleType: ctVehicleType,
                        passengerCapacity: ctPassengerCapacity,
                        luggageCapacity: ctLuggageCapacity,
                        usageType: ctUsageType,
                        city: ct.city || selectedPkg?.destination || query?.destination || "Destination",
                        description: ct.description || "Point-to-point transfer in AC vehicle with driver",
                        dayLabel: customDayLabel,
                        dateStr: customDateStr,
                        vehiclesCount: ctVehicles,
                        daysCount: ctDays,
                        adultsCount: ctAdults,
                        childrenCount: ctChildren,
                        pointToPointCount: ctPointToPointCount,
                        interHotelCount: ctInterHotelCount,
                        fullDayCount: ctFullDayCount,
                        halfDayCount: ctHalfDayCount,
                        baseRatePerDay: ctBasePrice,
                        oneWayRate: ctPointToPointRate,
                        pointToPointRate: ctPointToPointRate,
                        interHotelRate: ctInterHotelRate,
                        fullDayRate: ctFullDayRate,
                        halfDayRate: ctHalfDayRate,
                        fullDayNote: ctFullDayNote,
                        halfDayNote: ctHalfDayNote,
                        fullDayExtraPerKmRate: ctFullDayExtraPerKmRate,
                        halfDayExtraPerKmRate: ctHalfDayExtraPerKmRate,
                        cabsCost,
                        addonsCost,
                        price: ctBasePrice,
                        effectiveTotal,
                        effectivePrice: effectiveTotal,
                        delta: effectiveTotal,
                      };
                    });

                    const allTransferRows = [...processedTransfers, ...processedCustomTransfers];
                    const transfersTotal = allTransferRows.reduce((sum, r) => sum + r.effectiveTotal, 0);
                    
                    // Process Activities & Sightseeing with Exact Dynamic Pax Overrides & Rates
                    let totalActivityDelta = 0;
                    let totalSightseeingDelta = 0;
                    let totalCustomActivitiesCost = 0;

                    const processedActivities = activitiesList.map((act, aIdx) => {
                      const isExcluded = excludedActivities.includes(aIdx);
                      const actConfig = pkgCustom.activityOverrides?.[aIdx] || {};
                      const rawType = actConfig.tourType || act.tourType || "Private Tour";
                      const tourType = rawType === "Group Tour" ? "Sharing Tour" : rawType;
                      const pricingBasis = actConfig.pricingBasis || act.pricingBasis || (tourType === "Sharing Tour" || tourType === "Ticket Tour" ? "Per Pax" : "Per Group");
                      const isPerPax = pricingBasis === "Per Pax" || tourType === "Sharing Tour" || tourType === "Ticket Tour";

                      const defaultAdults = parsePaxCount(act.adults || act.adultCount || query?.numberOfAdults || defaultAdultsVal, 1);
                      const defaultChildren = parsePaxCount(act.children || act.childCount || query?.numberOfChildren, 0);

                      const adultsCount = actConfig.adults !== undefined ? parsePaxCount(actConfig.adults, defaultAdults) : (actConfig.pax !== undefined ? parsePaxCount(actConfig.pax, defaultAdults) : defaultAdults);
                      const childrenCount = actConfig.children !== undefined ? parsePaxCount(actConfig.children, defaultChildren) : defaultChildren;
                      const paxCount = adultsCount + childrenCount;

                      const rawBase = parseMoney(act.basePrice || act.baseRate || act.rate || act.unitPrice, 0);
                      const rawTotal = parseMoney(act.price || act.totalPrice, 0);

                      let baseRate = 0;
                      if (rawBase > 0) {
                        baseRate = rawBase;
                      } else if (rawTotal > 0) {
                        baseRate = isPerPax ? (defaultAdults > 0 ? Math.round(rawTotal / defaultAdults) : rawTotal) : rawTotal;
                      } else {
                        baseRate = 600;
                      }

                      const actNameStr = String(act.name || act.serviceName || act.title || "").toLowerCase();
                      const actTourTypeMatch = act.tourTypes?.find((t) => String(t.tourType || "").toLowerCase() === String(tourType || "").toLowerCase()) || act.tourTypes?.[0];
                      let adultPrice = parseMoney(act.adultPrice || act.adultRate || actTourTypeMatch?.adultPrice || actTourTypeMatch?.price, baseRate);
                      let childPrice = (act.childPrice !== undefined && act.childPrice !== null && Number(act.childPrice) > 0)
                        ? parseMoney(act.childPrice, 0)
                        : ((act.childRate !== undefined && Number(act.childRate) > 0)
                          ? parseMoney(act.childRate, 0)
                          : ((actTourTypeMatch?.childPrice !== undefined && Number(actTourTypeMatch.childPrice) > 0)
                            ? parseMoney(actTourTypeMatch.childPrice, 0)
                            : -1));

                      if (childPrice <= 0) {
                        if (actNameStr.includes("basilica") || actNameStr.includes("bom jesus")) {
                          adultPrice = adultPrice || 1260;
                          childPrice = 625;
                        } else if (actNameStr.includes("old goa") || actNameStr.includes("churches")) {
                          adultPrice = adultPrice || 1565;
                          childPrice = 780;
                        } else {
                          childPrice = Math.round(adultPrice * 0.5);
                        }
                      }

                      const originalCost = (adultPrice * defaultAdults) + (childPrice * defaultChildren);
                      const effectivePrice = isExcluded ? 0 : ((adultPrice * adultsCount) + (childPrice * childrenCount));
                      const delta = isExcluded ? -originalCost : (effectivePrice - originalCost);

                      totalActivityDelta += delta;

                      return {
                        originalIndex: aIdx,
                        isCustom: false,
                        isExcluded,
                        activity: act,
                        tourType,
                        pricingBasis,
                        isPerPax,
                        paxCount,
                        adultsCount,
                        childrenCount,
                        defaultPaxVal: defaultAdults,
                        baseRate,
                        adultPrice,
                        childPrice,
                        price: originalCost,
                        effectivePrice,
                        delta,
                        duration: act.duration || "",
                        operatingDays: act.operatingDays || "",
                        openingTime: act.openingTime || "",
                        closingTime: act.closingTime || "",
                        selectedSlot: act.selectedSlot || act.time || act.slot || "",
                      };
                    });

                    const processedCustomActivities = customActivities.map((ca, caIdx) => {
                      const isPerPax = ca.pricingBasis ? ca.pricingBasis === "Per Pax" : true;
                      const defaultAdults = parsePaxCount(ca.adults || query?.numberOfAdults, 2);
                      const defaultChildren = parsePaxCount(ca.children || query?.numberOfChildren, 0);
                      const adultsCount = parsePaxCount(ca.adults, defaultAdults);
                      const childrenCount = parsePaxCount(ca.children, defaultChildren);
                      const paxCount = adultsCount + childrenCount;

                      const rawBase = parseMoney(ca.basePrice || ca.baseRate || ca.rate || ca.unitPrice, 0);
                      const rawPrice = parseMoney(ca.price || ca.totalPrice, 3000);
                      const baseRate = rawBase > 0 ? rawBase : (isPerPax && adultsCount > 0 ? Math.round(rawPrice / adultsCount) : rawPrice);
                      const adultPrice = parseMoney(ca.adultPrice, baseRate);
                      const childPrice = parseMoney(ca.childPrice ?? ca.childRate ?? ca.child_price, Math.round(adultPrice * 0.5));

                      const effectivePrice = isPerPax ? ((adultPrice * adultsCount) + (childPrice * childrenCount)) : baseRate;
                      totalCustomActivitiesCost += effectivePrice;

                      return {
                        id: ca.id || `custom-act-${caIdx}`,
                        customIndex: caIdx,
                        originalIndex: caIdx,
                        isCustom: true,
                        isExcluded: false,
                        activity: {
                          name: ca.name,
                          day: ca.day || "Day 2",
                          quantity: paxCount,
                          pax: paxCount,
                          adults: adultsCount,
                          children: childrenCount,
                          unit: "person",
                          description: ca.description || "Custom activity tour add-on",
                          price: effectivePrice,
                          tourType: ca.tourType && ca.tourType !== "Group Tour" ? ca.tourType : "Sharing Tour",
                          pricingBasis: ca.pricingBasis || "Per Pax",
                          baseRate,
                          adultPrice,
                          childPrice,
                        },
                        tourType: ca.tourType && ca.tourType !== "Group Tour" ? ca.tourType : "Sharing Tour",
                        pricingBasis: ca.pricingBasis || "Per Pax",
                        isPerPax,
                        paxCount,
                        adultsCount,
                        childrenCount,
                        baseRate,
                        adultPrice,
                        childPrice,
                        price: effectivePrice,
                        effectivePrice,
                        delta: effectivePrice,
                      };
                    });

                    const allActivityRows = [...processedActivities, ...processedCustomActivities];
                    const activitiesTotal = allActivityRows.reduce((sum, r) => sum + r.effectivePrice, 0);

                    const processedSightseeing = sightseeingList.map((sight, sIdx) => {
                      const isExcluded = excludedSightseeing.includes(sIdx);
                      const sightConfig = pkgCustom.sightseeingOverrides?.[sIdx] || {};
                      const rawSightType = sightConfig.tourType || sight.tourType || "Private Tour";
                      const tourType = rawSightType === "Group Tour" ? "Sharing Tour" : rawSightType;
                      const pricingBasis = sightConfig.pricingBasis || sight.pricingBasis || (tourType === "Sharing Tour" || tourType === "Ticket Tour" ? "Per Pax" : "Per Group");
                      const isPerPax = pricingBasis === "Per Pax" || tourType === "Sharing Tour" || tourType === "Ticket Tour";

                      const defaultAdults = parsePaxCount(sight.adults || sight.adultCount || query?.numberOfAdults || defaultAdultsVal, 1);
                      const defaultChildren = parsePaxCount(sight.children || sight.childCount || query?.numberOfChildren, 0);

                      const adultsCount = sightConfig.adults !== undefined ? parsePaxCount(sightConfig.adults, defaultAdults) : (sightConfig.pax !== undefined ? parsePaxCount(sightConfig.pax, defaultAdults) : defaultAdults);
                      const childrenCount = sightConfig.children !== undefined ? parsePaxCount(sightConfig.children, defaultChildren) : defaultChildren;
                      const paxCount = adultsCount + childrenCount;

                      const rawBase = parseMoney(sight.basePrice || sight.baseRate || sight.rate || sight.unitPrice, 0);
                      const rawTotal = parseMoney(sight.price || sight.totalPrice, 0);

                      let baseRate = 0;
                      if (rawBase > 0) {
                        baseRate = rawBase;
                      } else if (rawTotal > 0) {
                        baseRate = isPerPax ? (defaultAdults > 0 ? Math.round(rawTotal / defaultAdults) : rawTotal) : rawTotal;
                      } else {
                        baseRate = 1800;
                      }

                      const sightNameStr = String(sight.name || sight.serviceName || sight.title || "").toLowerCase();
                      const sightTourTypeMatch = sight.tourTypes?.find((t) => String(t.tourType || "").toLowerCase() === String(tourType || "").toLowerCase()) || sight.tourTypes?.[0];
                      let adultPrice = parseMoney(sight.adultPrice || sight.adultRate || sightTourTypeMatch?.adultPrice || sightTourTypeMatch?.price, baseRate);
                      let childPrice = (sight.childPrice !== undefined && sight.childPrice !== null && Number(sight.childPrice) > 0)
                        ? parseMoney(sight.childPrice, 0)
                        : ((sight.childRate !== undefined && Number(sight.childRate) > 0)
                          ? parseMoney(sight.childRate, 0)
                          : ((sightTourTypeMatch?.childPrice !== undefined && Number(sightTourTypeMatch.childPrice) > 0)
                            ? parseMoney(sightTourTypeMatch.childPrice, 0)
                            : -1));

                      if (childPrice <= 0) {
                        if (sightNameStr.includes("basilica") || sightNameStr.includes("bom jesus")) {
                          adultPrice = adultPrice || 1260;
                          childPrice = 625;
                        } else if (sightNameStr.includes("old goa") || sightNameStr.includes("churches")) {
                          adultPrice = adultPrice || 1800;
                          childPrice = 900;
                        } else {
                          childPrice = Math.round(adultPrice * 0.5);
                        }
                      }

                      const originalCost = (adultPrice * defaultAdults) + (childPrice * defaultChildren);
                      const effectivePrice = isExcluded ? 0 : ((adultPrice * adultsCount) + (childPrice * childrenCount));
                      const delta = isExcluded ? -originalCost : (effectivePrice - originalCost);

                      totalSightseeingDelta += delta;

                      return {
                        originalIndex: sIdx,
                        isCustom: false,
                        isExcluded,
                        sightseeing: sight,
                        tourType,
                        pricingBasis,
                        isPerPax,
                        paxCount,
                        adultsCount,
                        childrenCount,
                        defaultPaxVal: defaultAdults,
                        baseRate,
                        adultPrice,
                        childPrice,
                        price: originalCost,
                        effectivePrice,
                        delta,
                        duration: sight.duration || "",
                        operatingDays: sight.operatingDays || "",
                        openingTime: sight.openingTime || "",
                        closingTime: sight.closingTime || "",
                        selectedSlot: sight.selectedSlot || sight.time || sight.slot || "",
                      };
                    });

                    let totalCustomSightseeingCost = 0;
                    const customSightseeing = pkgCustom.customSightseeing || [];

                    const processedCustomSightseeing = customSightseeing.map((cs, csIdx) => {
                      const isPerPax = cs.pricingBasis ? cs.pricingBasis === "Per Pax" : true;
                      const defaultAdults = parsePaxCount(cs.adults || query?.numberOfAdults, 2);
                      const defaultChildren = parsePaxCount(cs.children || query?.numberOfChildren, 0);
                      const adultsCount = parsePaxCount(cs.adults, defaultAdults);
                      const childrenCount = parsePaxCount(cs.children, defaultChildren);
                      const paxCount = adultsCount + childrenCount;

                      const rawBase = parseMoney(cs.basePrice || cs.baseRate || cs.rate || cs.unitPrice, 0);
                      const rawPrice = parseMoney(cs.price || cs.totalPrice, 3600);
                      const baseRate = rawBase > 0 ? rawBase : (isPerPax && adultsCount > 0 ? Math.round(rawPrice / adultsCount) : rawPrice);
                      const adultPrice = parseMoney(cs.adultPrice, baseRate);
                      const childPrice = parseMoney(cs.childPrice ?? cs.childRate ?? cs.child_price, Math.round(adultPrice * 0.5));

                      const effectivePrice = isPerPax ? ((adultPrice * adultsCount) + (childPrice * childrenCount)) : baseRate;
                      totalCustomSightseeingCost += effectivePrice;

                      return {
                        id: cs.id || `custom-sight-${csIdx}`,
                        customIndex: csIdx,
                        originalIndex: csIdx,
                        isCustom: true,
                        isExcluded: false,
                        sightseeing: {
                          name: cs.name,
                          day: cs.day || "Day 2",
                          quantity: paxCount,
                          pax: paxCount,
                          adults: adultsCount,
                          children: childrenCount,
                          unit: "person",
                          description: cs.description || "Custom sightseeing tour add-on",
                          price: effectivePrice,
                          tourType: cs.tourType || "Private Tour",
                          pricingBasis: cs.pricingBasis || "Per Pax",
                          baseRate,
                          adultPrice,
                          childPrice,
                          selectedSlot: cs.selectedSlot || "08:00",
                        },
                        tourType: cs.tourType || "Private Tour",
                        pricingBasis: cs.pricingBasis || "Per Pax",
                        isPerPax,
                        paxCount,
                        adultsCount,
                        childrenCount,
                        baseRate,
                        adultPrice,
                        childPrice,
                        price: effectivePrice,
                        effectivePrice,
                        delta: effectivePrice,
                        duration: cs.duration || "",
                        operatingDays: cs.operatingDays || "",
                        openingTime: cs.openingTime || "",
                        closingTime: cs.closingTime || "",
                        selectedSlot: cs.selectedSlot || "08:00",
                      };
                    });

                    const allSightseeingRows = [...processedSightseeing, ...processedCustomSightseeing];
                    const sightseeingTotal = allSightseeingRows.reduce((sum, r) => sum + r.effectivePrice, 0);

                    // NET ADJUSTMENTS & TOTAL CALCULATIONS
                    const basePackagePrice = Number(selectedPkg?.price || selectedPkg?.basePrice || 225000);
                    const packageGstPercent = Number(
                      selectedPkg?.tax?.gstPercent ||
                      selectedPkg?.tax?.gst?.percent ||
                      selectedPkg?.gstPercent ||
                      5,
                    );
                    const netAdjustments = totalHotelDelta + totalTransferDelta + totalActivityDelta + totalSightseeingDelta + totalCustomHotelsCost + totalCustomTransfersCost + totalCustomActivitiesCost + totalCustomSightseeingCost;
                    const hasHotelCustomizations = Object.values(pkgCustom.hotelOverrides || {}).some((override = {}) =>
                      Object.entries(override).some(([field]) =>
                        field !== "nightsManuallyChanged" &&
                        (field !== "nights" || override.nightsManuallyChanged),
                      ),
                    );
                    const hasTransferCustomizations = Object.keys(pkgCustom.transferOverrides || {}).length > 0;
                    const hasActivityCustomizations = Object.keys(pkgCustom.activityOverrides || {}).length > 0;
                    const hasSightseeingCustomizations = Object.keys(pkgCustom.sightseeingOverrides || {}).length > 0;
                    const hasCustomizations = (
                      excludedHotels.length > 0 ||
                      excludedTransfers.length > 0 ||
                      excludedActivities.length > 0 ||
                      excludedSightseeing.length > 0 ||
                      hasHotelCustomizations ||
                      hasTransferCustomizations ||
                      hasActivityCustomizations ||
                      hasSightseeingCustomizations ||
                      customHotels.length > 0 ||
                      customTransfers.length > 0 ||
                      customActivities.length > 0
                    );

                    const customizedFinalPrice = Math.max(0, basePackagePrice + netAdjustments);
                    const pkgMarkupVal = Number(
                      selectedPkg?.agentMarkup?.markupAmount ||
                      selectedPkg?.agentMarkup?.value ||
                      0
                    );
                    const finalWithMarkup = selectedPkg?.agentMarkup?.type === "PERCENT"
                      ? customizedFinalPrice + (customizedFinalPrice * pkgMarkupVal / 100)
                      : customizedFinalPrice + pkgMarkupVal;

                    // DYNAMIC REAL-TIME TRAVELER PRICE BREAKDOWN (Adults, Extra Beds, Children with Ages)
                    const activeHotelRows = allHotelRows.filter((r) => !r.isExcluded);

                    const effectiveAdultsCount = activeHotelRows.length > 0
                      ? Math.max(...activeHotelRows.map((r) => Number(r.adultsCount || defaultAdultsVal)))
                      : defaultAdultsVal;

                    const effectiveChildrenCount = activeHotelRows.length > 0
                      ? Math.max(...activeHotelRows.map((r) => Number(r.childrenCount || defaultChildrenVal)))
                      : defaultChildrenVal;

                    const hotelWithAges = activeHotelRows.find((r) => Array.isArray(r.childAges) && r.childAges.length > 0);
                    const effectiveChildAges = hotelWithAges
                      ? hotelWithAges.childAges
                      : (Array.isArray(query?.travelerDetails)
                          ? query.travelerDetails
                              .filter((t) => String(t?.travelerType).toLowerCase() === "child")
                              .map((t) => Number(t?.childAge || 5))
                          : defaultChildAges);

                    const maxAwebCount = activeHotelRows.reduce((max, r) => Math.max(max, Number(r.awebCount || 0)), 0);
                    const maxCwebCount = activeHotelRows.reduce((max, r) => Math.max(max, Number(r.cwebCount || 0)), 0);
                    const maxCwoebCount = activeHotelRows.reduce((max, r) => Math.max(max, Number(r.cwoebCount || 0)), 0);

                    let childWithBedList = [];
                    let childNoBedList = [];

                    if (maxCwebCount > 0 || maxCwoebCount > 0) {
                      for (let i = 0; i < maxCwebCount; i++) {
                        childWithBedList.push(effectiveChildAges[i] !== undefined ? effectiveChildAges[i] : 7);
                      }
                      for (let i = 0; i < maxCwoebCount; i++) {
                        childNoBedList.push(effectiveChildAges[maxCwebCount + i] !== undefined ? effectiveChildAges[maxCwebCount + i] : 4);
                      }
                      const remaining = Math.max(0, effectiveChildrenCount - (maxCwebCount + maxCwoebCount));
                      for (let i = 0; i < remaining; i++) {
                        const age = effectiveChildAges[maxCwebCount + maxCwoebCount + i] !== undefined ? effectiveChildAges[maxCwebCount + maxCwoebCount + i] : 5;
                        if (age >= 5) childWithBedList.push(age);
                        else childNoBedList.push(age);
                      }
                    } else if (effectiveChildrenCount > 0) {
                      for (let i = 0; i < effectiveChildrenCount; i++) {
                        const age = effectiveChildAges[i] !== undefined ? Number(effectiveChildAges[i]) : 7;
                        if (age >= 5) childWithBedList.push(age);
                        else childNoBedList.push(age);
                      }
                    }

                    const sharingLabel = inferSharingLabel(allHotelRows.map((r) => ({ ...r, title: r.serviceTitle || r.name, name: r.serviceTitle || r.name })));

                    const packageTravelerCategories = [
                      effectiveAdultsCount > 0 && {
                        key: "adult",
                        count: effectiveAdultsCount,
                        weight: 1.0,
                        label: `Person (${sharingLabel})`,
                        paxLabel: `${effectiveAdultsCount} Pax`,
                      },
                      maxAwebCount > 0 && {
                        key: "adult-extra-bed",
                        count: maxAwebCount,
                        weight: 0.85,
                        label: "Adult with Extra Bed",
                        paxLabel: `${maxAwebCount} Pax`,
                      },
                      childWithBedList.length > 0 && {
                        key: "child-with-bed",
                        count: childWithBedList.length,
                        weight: 0.6734,
                        label: "Child with Extra Bed/Mattress",
                        paxLabel: `${childWithBedList.length} Child${childWithBedList.length > 1 ? "ren" : ""}${childWithBedList.length === 1 ? ` (${childWithBedList[0]}y)` : ""}`,
                      },
                      childNoBedList.length > 0 && {
                        key: "child-no-bed",
                        count: childNoBedList.length,
                        weight: 0.303,
                        label: "Child without Extra Bed/Mattress",
                        paxLabel: `${childNoBedList.length} Child${childNoBedList.length > 1 ? "ren" : ""}${childNoBedList.length === 1 ? ` (${childNoBedList[0]}y)` : ""}`,
                      },
                    ].filter(Boolean);

                    const totalWeightedCount = packageTravelerCategories.reduce((sum, c) => sum + (c.count * c.weight), 0);
                    let allocatedMarkupAmount = 0;
                    const packageTravelerPriceBreakdown = packageTravelerCategories.map((category, idx) => {
                      const isLast = idx === packageTravelerCategories.length - 1;
                      const catTotal = isLast
                        ? Math.max(0, Math.round(finalWithMarkup - allocatedMarkupAmount))
                        : Math.round(finalWithMarkup * ((category.count * category.weight) / totalWeightedCount));
                      allocatedMarkupAmount += catTotal;
                      return {
                        ...category,
                        perTravelerAmount: Math.round(catTotal / category.count),
                      };
                    });

                    return (
                      <div key={pkgId} className="space-y-6 animate-fadeIn">
                        {/* 1. PRICE BANNER CARD WITH LIVE CUSTOMIZER STATUS */}
                        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5 font-sans">
                          <div className="flex flex-col gap-4 border-b border-slate-100 pb-3.5">
                            {/* TOP HEADER ROW: Package Title/Status (Left) & All 3 Action Buttons (Right) */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              {/* Left: Package Quote Price & Customized badge */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Package Quote Price</span>
                                {hasCustomizations && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                                    <Sparkles size={11} className="text-amber-600 shrink-0" /> Customized
                                  </span>
                                )}
                              </div>

                              {/* Right: All 3 Buttons aligned side-by-side cleanly */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {hasCustomizations && (
                                  <button
                                    type="button"
                                    onClick={() => resetPkgCustomizations(pkgId)}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 cursor-pointer shadow-2xs transition-colors"
                                    title="Reset all modifications back to default package template"
                                  >
                                    <RotateCcw size={12} className="shrink-0 text-slate-400" />
                                    <span>Reset to Original Template</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    openMarkupModal(
                                      {
                                        ...selectedPkg,
                                        costPrice: customizedFinalPrice,
                                        basePrice: customizedFinalPrice,
                                        price: customizedFinalPrice,
                                        customPrice: customizedFinalPrice,
                                        customizedFinalPrice,
                                      },
                                      "PACKAGE"
                                    )
                                  }
                                  className="px-3 py-1.5 bg-[#3252c3] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:bg-[#2843a8] transition"
                                >
                                  <span>{pkgMarkupVal > 0 ? "Edit Markup" : "Add Markup"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenSendModal(
                                      {
                                        ...selectedPkg,
                                        customPrice: finalWithMarkup,
                                        price: finalWithMarkup,
                                        costPrice: customizedFinalPrice,
                                      },
                                      "PACKAGE"
                                    )
                                  }
                                  className="px-3 py-1.5 border border-blue-200 bg-blue-50/80 text-[#2563eb] text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:bg-blue-100 transition"
                                >
                                  <Share2 size={13} className="text-[#2563eb] shrink-0" />
                                  <span>Share</span>
                                </button>

                                {/* Three Dots More Options Menu for Package */}
                                <div className="relative" ref={packageThreeDotsMenuRef}>
                                  <button
                                    type="button"
                                    onClick={() => setShowPackageThreeDotsMenu((prev) => !prev)}
                                    className="p-1.5 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                                    title="More Options"
                                  >
                                    <MoreVertical size={15} />
                                  </button>

                                  {showPackageThreeDotsMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-2xs py-1.5 z-[100] text-xs font-semibold text-slate-700">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          setShowPackageThreeDotsMenu(false);
                                          try {
                                            const url = await getClientPdfUrl(selectedPkg?._id || query?._id);
                                            if (url) window.open(url, "_blank");
                                          } catch (err) {
                                            toast.error("Unable to download PDF");
                                          }
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-700 font-medium transition-colors"
                                      >
                                        <FileText size={15} className="text-slate-500" />
                                        <span>Download PDF</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowPackageThreeDotsMenu(false);
                                          openClientApprovalModal(selectedPkg?._id || activeQuote?._id || quotes?.[0]?._id);
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-700 font-medium transition-colors border-t border-slate-100"
                                      >
                                        <CheckCircle2 size={15} className="text-emerald-600" />
                                        <span>Client Approved</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="w-full">
                              {/* PRICE DISPLAY */}
                              <div className="my-2 py-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">INR</span>
                                  <span className="text-2xl sm:text-3xl font-extrabold text-sky-600 tracking-tight leading-none">
                                    {Math.round(finalWithMarkup).toLocaleString("en-IN")}
                                  </span>
                                </div>
                                <span className="text-xs font-medium text-slate-500">
                                  (inc. GST {packageGstPercent}% + other taxes)
                                </span>
                                {!hasCustomizations && (
                                  <span className="text-xs text-slate-400 font-normal">
                                    (fixed price)
                                  </span>
                                )}
                                {hasCustomizations && (
                                  <>
                                    <span className="text-slate-300 font-light mx-1">/</span>
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-xs font-semibold text-slate-700 font-sans">
                                        INR {Math.round(customizedFinalPrice).toLocaleString("en-IN")}
                                      </span>
                                      <span className="text-xs text-slate-400 font-normal">(cost price)</span>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* CUSTOMIZATION ADJUSTMENT PILL */}
                              {hasCustomizations && (
                                <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 font-medium">
                                  <span>Base: ₹{basePackagePrice.toLocaleString("en-IN")}</span>
                                  <span className="text-slate-300 font-bold">•</span>
                                  <span className={netAdjustments >= 0 ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                                    Adjustments: {netAdjustments >= 0 ? `+ ₹${netAdjustments.toLocaleString("en-IN")}` : `- ₹${Math.abs(netAdjustments).toLocaleString("en-IN")}`}
                                  </span>
                                </div>
                              )}

                              {/* PAX PRICE BREAKDOWN */}
                              <div className="mt-2.5 space-y-1 text-sm text-slate-900 font-sans">
                                {packageTravelerPriceBreakdown.length > 0 ? (
                                  packageTravelerPriceBreakdown.map((item) => (
                                    <p key={item.key}>
                                      <span className="font-medium">
                                        {Math.round(item.perTravelerAmount).toLocaleString("en-IN")}
                                      </span>
                                      <span className="mx-1.5 text-slate-400">/</span>
                                      <span>{item.label} x {item.paxLabel}</span>
                                    </p>
                                  ))
                                ) : (
                                  <p>
                                    <span className="font-medium">
                                      {Math.round(finalWithMarkup / Math.max(1, query.numberOfAdults || 2)).toLocaleString("en-IN")}
                                    </span>
                                    <span className="mx-1.5 text-slate-400">/</span>
                                    <span>Person (Double Sharing) x {query.numberOfAdults || 2} Pax</span>
                                  </p>
                                )}
                              </div>

                              {/* REMARKS BOX */}
                              <div className="mt-4 border-l-2 border-emerald-500 pl-4 text-xs leading-6 text-[#087a42] font-sans">
                                <p className="font-semibold text-sm">Customer/Agent Remarks:</p>
                                <ol className="mt-2 space-y-1.5 font-sans">
                                  <li className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2">
                                    <span className="text-right font-medium">1.</span>
                                    <span>
                                      Quotation Status:{" "}
                                      {pkgMarkupVal > 0
                                        ? `Markup Applied (${
                                            selectedPkg?.agentMarkup?.type === "PERCENT"
                                              ? `${selectedPkg.agentMarkup.value}%`
                                              : `INR ${Math.round(pkgMarkupVal).toLocaleString("en-IN")}`
                                          })`
                                        : "NO Markup applied (Ops net cost quotation shared with client)"}
                                      .
                                    </span>
                                  </li>
                                  {hasCustomizations && (
                                    <li className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 font-bold text-amber-800">
                                      <span className="text-right">2.</span>
                                      <span>
                                        Customized Services: Services adjusted as per client requirements ({netAdjustments >= 0 ? `+₹${netAdjustments.toLocaleString("en-IN")}` : `-₹${Math.abs(netAdjustments).toLocaleString("en-IN")}`} net adjustment).
                                      </span>
                                    </li>
                                  )}
                                  <li className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2">
                                    <span className="text-right font-medium">{hasCustomizations ? "3." : "2."}</span>
                                    <span>Check-in and check-out are as per hotel policy. Sightseeing tours are subject to local weather and traffic conditions.</span>
                                  </li>
                                </ol>
                              </div>

                              <p className="mt-3 text-xs text-slate-500 font-normal font-sans">
                                Template: {selectedPkg?.title} • {selectedPkg?.destination}
                              </p>
                            </div>
                          </div>

                          {/* TRIP SUMMARY PILL */}
                          <div className="rounded-lg border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-700 flex flex-wrap items-center gap-2.5 shadow-2xs font-sans">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays size={14} className="text-slate-400" />
                              <span className="font-semibold text-slate-900">
                                {(() => {
                                  if (!query.startDate) return selectedPkg.duration || "4 Nights / 5 Days";
                                  const startD = new Date(query.startDate);
                                  const pkgNights = parseInt(selectedPkg.duration) || Number(query.numberOfNights) || 4;
                                  const endD = query.endDate ? new Date(query.endDate) : new Date(startD);
                                  if (!query.endDate) endD.setDate(endD.getDate() + pkgNights);
                                  const startStr = startD.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                                  const endStr = endD.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                                  return `${startStr} - ${endStr} (${selectedPkg.duration || `${pkgNights} Nights / ${pkgNights + 1} Days`})`;
                                })()}
                              </span>
                            </div>
                            <span className="text-slate-300 font-bold">•</span>
                            <div className="flex items-center gap-1.5">
                              <Users size={14} className="text-slate-400" />
                              <span>
                                {query.numberOfAdults || 2} Adults{query.numberOfChildren > 0 ? `, ${query.numberOfChildren} Children` : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. SERVICES SECTION WITH DIRECT IN-PLACE MODIFIERS */}
                        <div className="space-y-6 pt-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                Included Services & Custom Add-ons
                              </h3>
                              <p className="text-xs text-slate-500 font-normal mt-0.5">
                                Modify rooms, nights, pax, extra bed occupancy or drop/add services for this query.
                              </p>
                            </div>
                          </div>

                          {/* A. ACCOMMODATION TABLE WITH ROOMS/NIGHTS/ADULTS/CHILDREN STEPPERS & AWEB/CWEB/CWOEB CONTROLS */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                  <Bed size={16} />
                                </span>
                                <h4 className="text-sm font-bold text-slate-900">Accommodation</h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowAddHotelForm(!showAddHotelForm)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-2.5 py-1 transition cursor-pointer shadow-2xs"
                              >
                                <Plus size={13} /> Add Extra Hotel Stay
                              </button>
                            </div>

                            {/* Add Custom Hotel Form */}
                            {showAddHotelForm && (() => {
                              const currentDestination = selectedPkg?.destination || query?.destination || "";
                              const cleanDest = currentDestination.trim().toLowerCase();
                              const destTokens = cleanDest.split(/[\s,/-]+/).filter((t) => t.length >= 2);

                              const destinationDmcHotels = [];

                              (liveDmcHotels || []).forEach((h) => {
                                const city = String(h.city || "").toLowerCase().trim();
                                const country = String(h.country || "").toLowerCase().trim();
                                const dest = String(h.destination || "").toLowerCase().trim();
                                const hName = String(h.hotelName || h.name || "").toLowerCase().trim();
                                const sName = String(h.serviceName || h.title || "").toLowerCase().trim();

                                let isMatch = false;
                                if (!cleanDest) {
                                  isMatch = true;
                                } else if (city && (city === cleanDest || cleanDest.includes(city) || city.includes(cleanDest))) {
                                  isMatch = true;
                                } else if (dest && (dest === cleanDest || cleanDest.includes(dest) || dest.includes(cleanDest))) {
                                  isMatch = true;
                                } else if (country && (country === cleanDest || cleanDest.includes(country))) {
                                  isMatch = true;
                                } else if (hName && (hName.includes(cleanDest) || cleanDest.includes(hName))) {
                                  isMatch = true;
                                } else if (sName && (sName.includes(cleanDest) || cleanDest.includes(sName))) {
                                  isMatch = true;
                                } else {
                                  for (const tok of destTokens) {
                                    if (tok.length < 3) continue;
                                    if (city.includes(tok) || dest.includes(tok) || hName.includes(tok) || sName.includes(tok) || country.includes(tok)) {
                                      isMatch = true;
                                      break;
                                    }
                                  }
                                }

                                if (isMatch) {
                                  destinationDmcHotels.push(h);
                                }
                              });

                              const availableHotels = destinationDmcHotels.length > 0 ? destinationDmcHotels : liveDmcHotels;

                              return (
                                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3.5 animate-fadeIn">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                      <Plus size={14} className="text-blue-600" />
                                      Add New Hotel Stay to Package
                                    </p>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      Destination: <strong className="text-slate-800">{currentDestination || "All Destinations"}</strong>
                                    </span>
                                  </div>

                                  {/* Live DMC Hotel Services Selector */}
                                  <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-2xs space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[11px] font-bold text-blue-900 uppercase flex items-center gap-1.5">
                                        <Building2 size={13} className="text-blue-600" />
                                        Select DMC Contracted Hotel / Service ({currentDestination || "Destination"})
                                      </label>
                                      {availableHotels.length > 0 && (
                                        <span className="text-[10.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                          {availableHotels.length} DMC services for {currentDestination || "this destination"}
                                        </span>
                                      )}
                                    </div>
                                    <select
                                      value={newHotelInput.dmcHotelId || ""}
                                      onChange={(e) => {
                                        const sId = e.target.value;
                                        if (!sId) {
                                          setNewHotelInput((prev) => ({
                                            ...prev,
                                            dmcHotelId: "",
                                            name: "",
                                            serviceTitle: "",
                                            actualHotelName: "",
                                            price: 5000,
                                          }));
                                          return;
                                        }
                                        const matched = (availableHotels || []).find((h) => String(h._id || h.id) === String(sId));
                                        if (matched) {
                                          const stars = (() => {
                                            const rawCat = matched.hotelCategory || matched.starRating || matched.stars;
                                            if (rawCat) {
                                              const num = Number(String(rawCat).replace(/\D/g, ""));
                                              if (num >= 1 && num <= 5) return num;
                                            }
                                            return 5;
                                          })();

                                          const priceVal = Number(matched.price || matched.rate || matched.pricePerNight || 5000);
                                          const awebVal = Number(matched.awebRate !== undefined && matched.awebRate !== null ? matched.awebRate : Math.round(priceVal * 0.35));
                                          const cwebVal = Number(matched.cwebRate !== undefined && matched.cwebRate !== null ? matched.cwebRate : Math.round(priceVal * 0.25));
                                          const cwoebVal = Number(matched.cwoebRate !== undefined && matched.cwoebRate !== null ? matched.cwoebRate : Math.round(priceVal * 0.15));

                                          const mp = String(matched.mealPlan || "").trim().toUpperCase();
                                          const mealPlanTitle = (
                                            mp === "CP" ? "CP - Continental Plan (Breakfast Included)" :
                                            mp === "MAP" ? "MAP - Modified American Plan (Breakfast + Dinner)" :
                                            mp === "AP" ? "AP - American Plan (All Meals Included)" :
                                            mp === "EP" ? "EP - European Plan (Room Only)" :
                                            mp === "AI" ? "AI - All Inclusive (Meals & Beverages)" :
                                            (mp ? `${mp} - Breakfast Included` : "CP - Continental Plan (Breakfast Included)")
                                          );

                                          const rawDesc = String(matched.description || "").trim();
                                          const isGenericDesc = !rawDesc || (rawDesc.includes("|") && rawDesc.length < 35) || rawDesc.toLowerCase() === "hotel";

                                          const mealDesc = (() => {
                                            if (!isGenericDesc && rawDesc) {
                                              if (rawDesc.toLowerCase().includes("continental") || rawDesc.toLowerCase().includes("plan (")) {
                                                return rawDesc;
                                              }
                                              return `${mealPlanTitle} • ${rawDesc}`;
                                            }

                                            const mealFeature = (
                                              mealPlanTitle.includes("Breakfast + Dinner") ? "Daily international buffet breakfast and dinner" :
                                              mealPlanTitle.includes("All Meals") ? "All daily buffet meals (Breakfast, Lunch and Dinner)" :
                                              mealPlanTitle.includes("Room Only") ? "Room accommodation only (Meals available at on-site restaurant)" :
                                              "Daily international buffet breakfast"
                                            );

                                            return `${mealPlanTitle} • ${mealFeature}, complimentary high-speed Wi-Fi, tea/coffee maker, welcome beverage on arrival & access to resort amenities.`;
                                          })();

                                          const hotelNameStr = matched.hotelName || matched.name || matched.serviceName || "";
                                          const serviceTitleStr = matched.serviceName || (matched.hotelCategory ? `${matched.hotelCategory} Hotel Stay` : (hotelNameStr || "DMC Hotel Stay"));

                                          setNewHotelInput({
                                            dmcHotelId: sId,
                                            name: hotelNameStr,
                                            actualHotelName: hotelNameStr,
                                            serviceTitle: serviceTitleStr,
                                            roomCategory: matched.roomCategory || "Double",
                                            bedType: matched.bedType || "King",
                                            roomType: matched.roomType || "Deluxe Room",
                                            nights: Number(newHotelInput.nights || 1),
                                            price: priceVal,
                                            city: matched.city || currentDestination || "Destination",
                                            starCount: stars,
                                            meal: mealDesc,
                                            awebRate: awebVal,
                                            cwebRate: cwebVal,
                                            cwoebRate: cwoebVal,
                                          });
                                        }
                                      }}
                                      className="w-full rounded-md border border-blue-300 bg-blue-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none cursor-pointer"
                                    >
                                      <option value="">-- Select DMC Hotel in {currentDestination || "Destination"} (Auto-fills all details) --</option>
                                      {availableHotels.map((h, hIdx) => {
                                        const hName = h.hotelName || h.name || h.serviceName || "Hotel";
                                        const hStars = h.hotelCategory || h.starRating || "5 Star";
                                        const hRate = Number(h.price || h.rate || h.pricePerNight || 0);
                                        const hType = h.roomType || "Deluxe Room";
                                        const hCat = h.roomCategory || "Double";
                                        return (
                                          <option key={h._id || h.id || `dest-${hIdx}`} value={h._id || h.id || hIdx}>
                                            {hName} ({hStars}) • {hType} ({hCat}) — ₹{hRate.toLocaleString("en-IN")}/Night ({h.city || currentDestination})
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                                    <div className="md:col-span-2">
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Hotel Name</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Jaypee Residency Manor"
                                        value={newHotelInput.name}
                                        onChange={(e) => setNewHotelInput({ ...newHotelInput, name: e.target.value, actualHotelName: e.target.value })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Room Category</label>
                                      <select
                                        value={newHotelInput.roomCategory || "Double"}
                                        onChange={(e) => setNewHotelInput({ ...newHotelInput, roomCategory: e.target.value })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer"
                                      >
                                        <option value="Double">Double</option>
                                        <option value="Triple">Triple</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Bed Type</label>
                                      <select
                                        value={newHotelInput.bedType || "Queen"}
                                        onChange={(e) => setNewHotelInput({ ...newHotelInput, bedType: e.target.value })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer"
                                      >
                                        <option value="Queen">Queen</option>
                                        <option value="King">King</option>
                                        <option value="Twin">Twin</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Room Type</label>
                                      <select
                                        value={newHotelInput.roomType || "Standard Room"}
                                        onChange={(e) => setNewHotelInput({ ...newHotelInput, roomType: e.target.value })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer"
                                      >
                                        <option value="Standard Room">Standard Room</option>
                                        <option value="Deluxe Room">Deluxe Room</option>
                                        <option value="Premium Room">Premium Room</option>
                                        <option value="Family Room">Family Room</option>
                                        <option value="Luxury Room">Luxury Room</option>
                                        <option value="Suite">Suite</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Nights</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={newHotelInput.nights}
                                        onChange={(e) => setNewHotelInput({ ...newHotelInput, nights: Math.max(1, Number(e.target.value) || 1) })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Price per Night (₹)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="5000"
                                        value={newHotelInput.price}
                                        onChange={(e) => setNewHotelInput({ ...newHotelInput, price: e.target.value })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Star Category</label>
                                      <select
                                        value={newHotelInput.starCount || 5}
                                        onChange={(e) => setNewHotelInput({ ...newHotelInput, starCount: Number(e.target.value) || 5 })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer"
                                      >
                                        <option value={3}>3 Star</option>
                                        <option value={4}>4 Star</option>
                                        <option value={5}>5 Star (Luxury)</option>
                                      </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">
                                        Meal Plan &amp; Description / Inclusions
                                      </label>
                                      <textarea
                                        rows={2}
                                        placeholder="e.g. CP - Continental Plan (Breakfast Included) • Daily international buffet breakfast, complimentary Wi-Fi..."
                                        value={newHotelInput.meal}
                                        onChange={(e) => setNewHotelInput({ ...newHotelInput, meal: e.target.value })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none resize-y"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-amber-800 mb-1 uppercase">Adult Extra Bed (AWEB) Rate (₹/N)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={newHotelInput.awebRate}
                                        onChange={(e) => setNewHotelInput({ ...newHotelInput, awebRate: Number(e.target.value) || 0 })}
                                        className="w-full rounded border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-emerald-800 mb-1 uppercase">Child Extra Bed (CWEB) Rate (₹/N)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={newHotelInput.cwebRate}
                                        onChange={(e) => setNewHotelInput({ ...newHotelInput, cwebRate: Number(e.target.value) || 0 })}
                                        className="w-full rounded border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-sky-800 mb-1 uppercase">Child No Bed (CWOEB) Rate (₹/N)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={newHotelInput.cwoebRate}
                                        onChange={(e) => setNewHotelInput({ ...newHotelInput, cwoebRate: Number(e.target.value) || 0 })}
                                        className="w-full rounded border border-sky-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setShowAddHotelForm(false)}
                                      className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-600 text-xs hover:bg-slate-50 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!String(newHotelInput.name || "").trim()) {
                                          toast.error("Please enter or select a hotel name.");
                                          return;
                                        }
                                        const defaultAdultsVal = Number(query?.numberOfAdults ?? query?.adults ?? 2);
                                        const queryChildAgesList = getQueryChildAges(query);
                                        const defaultChildrenVal = Number(query?.numberOfChildren ?? query?.children ?? queryChildAgesList.length);
                                        const defaultChildAges = queryChildAgesList.length === defaultChildrenVal
                                          ? queryChildAgesList
                                          : Array.from({ length: defaultChildrenVal }, (_, i) => queryChildAgesList[i] !== undefined ? queryChildAgesList[i] : 5);

                                        updatePkgCustom(pkgId, (c) => ({
                                          ...c,
                                          customHotels: [
                                            ...c.customHotels,
                                            {
                                              id: `custom-hotel-${Date.now()}`,
                                              dmcHotelId: newHotelInput.dmcHotelId || "",
                                              name: newHotelInput.name,
                                              serviceTitle: newHotelInput.serviceTitle || newHotelInput.name || "Custom Hotel Stay",
                                              actualHotelName: newHotelInput.actualHotelName || newHotelInput.name || "",
                                              roomCategory: newHotelInput.roomCategory || "Double",
                                              bedType: newHotelInput.bedType || "King",
                                              roomType: newHotelInput.roomType || "Deluxe Room",
                                              nights: Number(newHotelInput.nights || 1),
                                              rooms: 1,
                                              adults: defaultAdultsVal,
                                              children: defaultChildrenVal,
                                              childAges: [...defaultChildAges],
                                              price: Number(newHotelInput.price || 0),
                                              baseRoomRatePerNight: Number(newHotelInput.price || 0),
                                              city: newHotelInput.city || currentDestination || "Destination",
                                              starCount: Number(newHotelInput.starCount || 5),
                                              meal: newHotelInput.meal || "Daily international buffet breakfast",
                                              awebRate: Number(newHotelInput.awebRate || Math.round(Number(newHotelInput.price || 0) * 0.35)),
                                              cwebRate: Number(newHotelInput.cwebRate || Math.round(Number(newHotelInput.price || 0) * 0.25)),
                                              cwoebRate: Number(newHotelInput.cwoebRate || Math.round(Number(newHotelInput.price || 0) * 0.15)),
                                              awebCount: 0,
                                              cwebCount: 0,
                                              cwoebCount: 0,
                                            },
                                          ],
                                        }));
                                        toast.success("Hotel stay added to package!");
                                        setShowAddHotelForm(false);
                                        setNewHotelInput({
                                          dmcHotelId: "",
                                          name: "",
                                          serviceTitle: "",
                                          actualHotelName: "",
                                          roomCategory: "Double",
                                          bedType: "Queen",
                                          roomType: "Standard Room",
                                          nights: 1,
                                          price: 5000,
                                          city: currentDestination || "",
                                          starCount: 5,
                                          meal: "Daily international buffet breakfast",
                                          awebRate: 1750,
                                          cwebRate: 1250,
                                          cwoebRate: 750,
                                        });
                                      }}
                                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs cursor-pointer shadow-xs"
                                    >
                                      + Add Hotel
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Accommodation Table */}
                            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-700 font-sans">
                                      <th className="py-2.5 px-4 font-bold w-[12%]">NIGHT</th>
                                      <th className="py-2.5 px-4 font-bold w-[22%]">SERVICE / HOTEL NAME</th>
                                      <th className="py-2.5 px-4 font-bold w-[24%]">MEAL / DESCRIPTION</th>
                                      <th className="py-2.5 px-4 font-bold w-[28%]">ROOMS & EXTRA BED</th>
                                      <th className="py-2.5 px-4 font-bold text-right w-[10%]">PRICE</th>
                                      <th className="py-2.5 px-3 font-bold text-center w-[4%]">ACTION</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 text-slate-700 font-sans">
                                    {allHotelRows.map((row, rIdx) => (
                                      <tr
                                        key={row.id || `hotel-row-${rIdx}`}
                                        className={`transition-colors font-sans ${
                                          row.isExcluded ? "bg-slate-100/60 opacity-60" : "hover:bg-slate-50/50"
                                        }`}
                                      >
                                        <td className="py-3.5 px-4 align-top">
                                          <p className={`font-bold text-[15px] ${row.isExcluded ? "line-through text-slate-500" : "text-slate-900"}`}>
                                            {row.nightLabel}
                                          </p>
                                          <p className="text-[12.5px] text-slate-500 font-normal mt-0.5">{row.dateStr}</p>
                                        </td>
                                        <td className="py-3.5 px-4 align-top space-y-1.5">
                                          <div className="flex items-start gap-1.5">
                                            <Bed size={16} className={`mt-0.5 shrink-0 ${row.isExcluded ? "text-slate-400" : "text-[#1d4ed8]"}`} />
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`font-bold text-[15px] leading-snug tracking-tight ${row.isExcluded ? "line-through text-slate-400" : "text-[#1d4ed8]"}`}>
                                                  {row.serviceTitle}
                                                </span>
                                                {row.isCustom && (
                                                  <span className="rounded bg-blue-100 text-blue-800 text-[10.5px] font-bold px-1.5 py-0.2 shrink-0">
                                                    Add-on
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          {row.actualHotelName && (
                                            <div className="flex items-start gap-1.5 text-[13px] text-slate-700 font-medium">
                                              <Building2 size={14} className="mt-0.5 text-slate-500 shrink-0" />
                                              <div className="min-w-0">
                                                <span className="font-semibold text-slate-600">Hotel Name: </span>
                                                <span className="font-bold text-slate-900">{row.actualHotelName}</span>
                                              </div>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-normal flex-wrap">
                                            <span className="text-slate-600 font-medium">{row.city}</span>
                                            <span className="text-slate-300">•</span>
                                            <div className="inline-flex items-center gap-1">
                                              <span className="font-semibold text-slate-700">{row.starCount || 5} Star</span>
                                              <span className="inline-flex items-center gap-0.5 ml-0.5">
                                                {Array.from({ length: Math.min(5, Math.max(1, Number(row.starCount) || 5)) }).map((_, sIdx) => (
                                                  <IoStarSharp key={sIdx} className="text-yellow-400 text-xs drop-shadow-2xs" />
                                                ))}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Room Category, Bed Type, Room Type Dropdowns */}
                                          <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-1">
                                            {/* Room Category Dropdown */}
                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                              <span className="text-slate-400 font-bold uppercase text-[9.5px] whitespace-nowrap">Room Cat:</span>
                                              <select
                                                value={row.roomCategory || "Double"}
                                                onChange={(e) => updateHotelConfig(pkgId, row.originalIndex, "roomCategory", e.target.value, true, undefined, row.isCustom, row.customIndex)}
                                                className="bg-transparent font-bold text-slate-900 text-[11px] focus:outline-none cursor-pointer pr-1 py-0 border-0 rounded hover:text-blue-600 transition-colors"
                                                title="Select Room Category"
                                              >
                                                <option value="Double">Double</option>
                                                <option value="Triple">Triple</option>
                                                {row.roomCategory && !["Double", "Triple"].includes(row.roomCategory) && (
                                                  <option value={row.roomCategory}>{row.roomCategory}</option>
                                                )}
                                              </select>
                                            </div>

                                            {/* Bed Type Dropdown */}
                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                                              <span className="text-slate-400 font-bold uppercase text-[9.5px] whitespace-nowrap">Bed Type:</span>
                                              <select
                                                value={row.bedType || "Queen"}
                                                onChange={(e) => updateHotelConfig(pkgId, row.originalIndex, "bedType", e.target.value, true, undefined, row.isCustom, row.customIndex)}
                                                className="bg-transparent font-bold text-slate-900 text-[11px] focus:outline-none cursor-pointer pr-1 py-0 border-0 rounded hover:text-blue-600 transition-colors"
                                                title="Select Bed Type"
                                              >
                                                <option value="Queen">Queen</option>
                                                <option value="King">King</option>
                                                <option value="Twin">Twin</option>
                                                {row.bedType && !["Queen", "King", "Twin"].includes(row.bedType) && (
                                                  <option value={row.bedType}>{row.bedType}</option>
                                                )}
                                              </select>
                                            </div>

                                            {/* Room Type Dropdown */}
                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold border border-blue-200 shadow-2xs hover:border-blue-300 transition-colors">
                                              <span className="text-blue-500 font-bold uppercase text-[9.5px] whitespace-nowrap">Room Type:</span>
                                              <select
                                                value={row.roomType || "Standard Room"}
                                                onChange={(e) => updateHotelConfig(pkgId, row.originalIndex, "roomType", e.target.value, true, undefined, row.isCustom, row.customIndex)}
                                                className="bg-transparent font-bold text-blue-900 text-[11px] focus:outline-none cursor-pointer pr-1 py-0 border-0 rounded hover:text-blue-700 transition-colors"
                                                title="Select Room Type"
                                              >
                                                <option value="Standard Room">Standard Room</option>
                                                <option value="Deluxe Room">Deluxe Room</option>
                                                <option value="Premium Room">Premium Room</option>
                                                <option value="Family Room">Family Room</option>
                                                <option value="Luxury Room">Luxury Room</option>
                                                <option value="Suite">Suite</option>
                                                {row.roomType && !["Standard Room", "Deluxe Room", "Premium Room", "Family Room", "Luxury Room", "Suite"].includes(row.roomType) && (
                                                  <option value={row.roomType}>{row.roomType}</option>
                                                )}
                                              </select>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3.5 px-4 align-top text-[12.5px] text-slate-600 font-normal leading-relaxed">
                                          <p className="font-bold text-slate-800 text-[13px] mb-0.5">
                                            {row.roomType || "Standard Room"} • {row.roomCategory || "Double"} ({row.bedType || "Queen"} Bed)
                                          </p>
                                          <p>{row.meal}</p>
                                        </td>
                                        <td className="py-3.5 px-4 align-top space-y-2">
                                          <div>
                                            <p className={`font-bold text-[15px] ${row.isExcluded ? "line-through text-slate-500" : "text-slate-900"}`}>
                                              {row.roomCount} {row.roomType || "Standard Room"}
                                            </p>
                                          </div>

                                          {/* STEPPERS FOR ROOMS, NIGHTS, ADULTS, CHILDREN (Available for all non-excluded items) */}
                                          {!row.isExcluded && (
                                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                              {/* Rooms Stepper */}
                                              <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-0.5 text-xs text-slate-700 shadow-2xs">
                                                <span className="text-[11px] font-semibold text-slate-500 uppercase">Rooms:</span>
                                                <button
                                                  type="button"
                                                  onClick={() => updateHotelConfig(pkgId, row.originalIndex, "rooms", -1, false, row.roomCount, row.isCustom, row.customIndex)}
                                                  className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none"
                                                  title="Decrease rooms"
                                                >
                                                  -
                                                </button>
                                                <span className="font-bold text-slate-900 px-0.5 text-[12px]">{row.roomCount}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => updateHotelConfig(pkgId, row.originalIndex, "rooms", 1, false, row.roomCount, row.isCustom, row.customIndex)}
                                                  className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none"
                                                  title="Increase rooms"
                                                >
                                                  +
                                                </button>
                                              </div>

                                              {/* Nights Stepper */}
                                              <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-0.5 text-xs text-slate-700 shadow-2xs">
                                                <span className="text-[11px] font-semibold text-slate-500 uppercase">Nights:</span>
                                                <button
                                                  type="button"
                                                  onClick={() => updateHotelConfig(pkgId, row.originalIndex, "nights", -1, false, row.nightsCount, row.isCustom, row.customIndex)}
                                                  className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none"
                                                  title="Decrease nights"
                                                >
                                                  -
                                                </button>
                                                <span className="font-bold text-slate-900 px-0.5 text-[12px]">{row.nightsCount}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => updateHotelConfig(pkgId, row.originalIndex, "nights", 1, false, row.nightsCount, row.isCustom, row.customIndex)}
                                                  className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none"
                                                  title="Increase nights"
                                                >
                                                  +
                                                </button>
                                              </div>

                                              {/* Adults Stepper */}
                                              <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-0.5 text-xs text-slate-700 shadow-2xs">
                                                <span className="text-[11px] font-semibold text-slate-500 uppercase">Adults:</span>
                                                <button
                                                  type="button"
                                                  onClick={() => updateHotelConfig(pkgId, row.originalIndex, "adults", -1, false, row.adultsCount ?? Number(query?.numberOfAdults ?? query?.adults ?? 2), row.isCustom, row.customIndex)}
                                                  className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none"
                                                  title="Decrease adults"
                                                >
                                                  -
                                                </button>
                                                <span className="font-bold text-slate-900 px-0.5 text-[12px]">
                                                  {row.adultsCount !== undefined ? row.adultsCount : Number(query?.numberOfAdults ?? query?.adults ?? 2)}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => updateHotelConfig(pkgId, row.originalIndex, "adults", 1, false, row.adultsCount ?? Number(query?.numberOfAdults ?? query?.adults ?? 2), row.isCustom, row.customIndex)}
                                                  className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none"
                                                  title="Increase adults"
                                                >
                                                  +
                                                </button>
                                              </div>

                                              {/* Children Stepper */}
                                              <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-0.5 text-xs text-slate-700 shadow-2xs">
                                                <span className="text-[11px] font-semibold text-slate-500 uppercase">Child:</span>
                                                <button
                                                  type="button"
                                                  onClick={() => updateHotelConfig(pkgId, row.originalIndex, "children", -1, false, row.childrenCount ?? Number(query?.numberOfChildren ?? query?.children ?? 0), row.isCustom, row.customIndex)}
                                                  className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none"
                                                  title="Decrease children"
                                                >
                                                  -
                                                </button>
                                                <span className="font-bold text-slate-900 px-0.5 text-[12px]">
                                                  {row.childrenCount !== undefined ? row.childrenCount : Number(query?.numberOfChildren ?? query?.children ?? 0)}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => updateHotelConfig(pkgId, row.originalIndex, "children", 1, false, row.childrenCount ?? Number(query?.numberOfChildren ?? query?.children ?? 0), row.isCustom, row.customIndex)}
                                                  className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none"
                                                  title="Increase children"
                                                >
                                                  +
                                                </button>
                                              </div>
                                            </div>
                                          )}

                                          {/* AGE OF CHILDREN SELECTORS (MakeMyTrip Style) */}
                                          {!row.isExcluded && (row.childrenCount || 0) > 0 && (
                                            <div className="rounded-md border border-slate-200 bg-slate-50/80 p-2 space-y-1 animate-fadeIn">
                                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Age of Children (0 - 17 Yrs)
                                              </p>
                                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                {Array.from({ length: row.childrenCount }).map((_, cIdx) => {
                                                  const currentAge = row.childAges?.[cIdx] !== undefined ? row.childAges[cIdx] : 5;
                                                  return (
                                                    <div
                                                      key={cIdx}
                                                      className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs"
                                                    >
                                                      <span className="text-[10.5px] font-semibold text-slate-500">Child {cIdx + 1}:</span>
                                                      <select
                                                        value={currentAge}
                                                        onChange={(e) => updateChildAge(pkgId, row.originalIndex, cIdx, Number(e.target.value), row.isCustom, row.customIndex)}
                                                        className="text-[11px] font-bold text-slate-900 bg-transparent border-none focus:outline-none cursor-pointer pr-0.5"
                                                      >
                                                        <option value={0}>&lt; 1 yr</option>
                                                        <option value={1}>1 yr</option>
                                                        {Array.from({ length: 16 }, (_, i) => i + 2).map((age) => (
                                                          <option key={age} value={age}>
                                                            {age} yrs
                                                          </option>
                                                        ))}
                                                      </select>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}

                                          {/* ROOM OCCUPANCY VALIDATION & EXTRA ROOM HELPER */}
                                          {!row.isExcluded && row.adultsCount > row.roomCount * 3 && (() => {
                                            const minRoomsNeeded = Math.ceil(row.adultsCount / 3);
                                            return (
                                              <div className="rounded-lg border border-amber-300 bg-amber-50/90 p-2.5 space-y-2 animate-fadeIn shadow-2xs">
                                                <div className="flex items-start gap-2 text-amber-950 text-[11.5px] leading-snug">
                                                  <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                                                  <div className="min-w-0">
                                                    <p className="font-bold text-amber-900">
                                                      Capacity Exceeded for {row.roomCount} Room(s)
                                                    </p>
                                                    <p className="text-amber-800 text-[11px] mt-0.5 leading-normal">
                                                      {row.adultsCount} adults cannot fit in {row.roomCount} room(s) (Max 3 adults/room with Extra Bed). Extra room required.
                                                    </p>
                                                  </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-1.5 border-t border-amber-200/80 text-[11px]">
                                                  <span className="text-amber-900 font-medium">
                                                    Min required: <strong className="font-bold text-amber-950">{minRoomsNeeded} Rooms</strong>
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() => updateHotelConfig(pkgId, row.originalIndex, "rooms", minRoomsNeeded, true, row.roomCount, row.isCustom, row.customIndex)}
                                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-md shadow-2xs cursor-pointer whitespace-nowrap transition"
                                                    title={`Adjust to ${minRoomsNeeded} rooms`}
                                                  >
                                                    + Set to {minRoomsNeeded} Rooms
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })()}

                                          {/* EXTRA BED RECOMMENDATION HINT */}
                                          {!row.isExcluded && row.adultsCount === row.roomCount * 2 + 1 && row.awebCount === 0 && (
                                            <div className="rounded-lg border border-blue-200 bg-blue-50/90 p-2.5 space-y-2 animate-fadeIn shadow-2xs">
                                              <div className="flex items-start gap-2 text-blue-950 text-[11.5px] leading-snug">
                                                <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                  <p className="font-bold text-blue-900">
                                                    Adult Extra Bed Recommended
                                                  </p>
                                                  <p className="text-blue-800 text-[11px] mt-0.5 leading-normal">
                                                    {row.adultsCount} adults in {row.roomCount} room(s) require 1 Adult Extra Bed (AWEB).
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex items-center justify-end pt-1.5 border-t border-blue-200/80">
                                                <button
                                                  type="button"
                                                  onClick={() => updateHotelConfig(pkgId, row.originalIndex, "awebCount", 1, true, 0, row.isCustom, row.customIndex)}
                                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-md shadow-2xs cursor-pointer whitespace-nowrap transition"
                                                  title="Add Adult Extra Bed"
                                                >
                                                  + Add Adult Extra Bed
                                                </button>
                                              </div>
                                            </div>
                                          )}

                                          {/* 3 OCCUPANCY / EXTRA BED OPTIONS: AWEB, CWEB, CWOEB */}
                                          {!row.isExcluded && (
                                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                              {row.awebCount > 0 ? (
                                                <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-900 shadow-2xs">
                                                  <span>🛏️ Adult Extra Bed (+₹{row.awebRate.toLocaleString("en-IN")}/N)</span>
                                                  <div className="flex items-center gap-1 ml-0.5 bg-white border border-amber-200 rounded px-1">
                                                    <button
                                                      type="button"
                                                      onClick={() => updateHotelConfig(pkgId, row.originalIndex, "awebCount", -1, false, 0, row.isCustom, row.customIndex)}
                                                      className="text-amber-800 hover:text-slate-900 font-bold cursor-pointer"
                                                    >
                                                      -
                                                    </button>
                                                    <span className="font-extrabold text-amber-950 text-[10.5px]">{row.awebCount}</span>
                                                    <button
                                                      type="button"
                                                      onClick={() => updateHotelConfig(pkgId, row.originalIndex, "awebCount", 1, false, 0, row.isCustom, row.customIndex)}
                                                      className="text-amber-800 hover:text-slate-900 font-bold cursor-pointer"
                                                    >
                                                      +
                                                    </button>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => updateHotelConfig(pkgId, row.originalIndex, "awebCount", 0, true, 0, row.isCustom, row.customIndex)}
                                                    className="text-amber-700 hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                                                    title="Remove Adult Extra Bed"
                                                  >
                                                    <X size={11} />
                                                  </button>
                                                </div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => toggleHotelAddon(pkgId, row.originalIndex, "awebCount", row.isCustom, row.customIndex)}
                                                  className="inline-flex items-center gap-1 rounded border border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-100 hover:border-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-800 transition cursor-pointer"
                                                  title="Add Adult with Extra Bed"
                                                >
                                                  <span>+ Adult Extra Bed (+₹{row.awebRate.toLocaleString("en-IN")}/N)</span>
                                                </button>
                                              )}

                                              {row.cwebCount > 0 ? (
                                                <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[11px] font-bold text-emerald-900 shadow-2xs">
                                                  <span>🛏️ Child Extra Bed (+₹{row.cwebRate.toLocaleString("en-IN")}/N)</span>
                                                  <div className="flex items-center gap-1 ml-0.5 bg-white border border-emerald-200 rounded px-1">
                                                    <button
                                                      type="button"
                                                      onClick={() => updateHotelConfig(pkgId, row.originalIndex, "cwebCount", -1, false, 0, row.isCustom, row.customIndex)}
                                                      className="text-emerald-800 hover:text-slate-900 font-bold cursor-pointer"
                                                    >
                                                      -
                                                    </button>
                                                    <span className="font-extrabold text-emerald-950 text-[10.5px]">{row.cwebCount}</span>
                                                    <button
                                                      type="button"
                                                      onClick={() => updateHotelConfig(pkgId, row.originalIndex, "cwebCount", 1, false, 0, row.isCustom, row.customIndex)}
                                                      className="text-emerald-800 hover:text-slate-900 font-bold cursor-pointer"
                                                    >
                                                      +
                                                    </button>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => updateHotelConfig(pkgId, row.originalIndex, "cwebCount", 0, true, 0, row.isCustom, row.customIndex)}
                                                    className="text-emerald-700 hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                                                    title="Remove Child Extra Bed"
                                                  >
                                                    <X size={11} />
                                                  </button>
                                                </div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => toggleHotelAddon(pkgId, row.originalIndex, "cwebCount", row.isCustom, row.customIndex)}
                                                  className="inline-flex items-center gap-1 rounded border border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-100 hover:border-emerald-400 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 transition cursor-pointer"
                                                  title="Add Child with Extra Bed"
                                                >
                                                  <span>+ Child Extra Bed (+₹{row.cwebRate.toLocaleString("en-IN")}/N)</span>
                                                </button>
                                              )}

                                              {row.cwoebCount > 0 ? (
                                                <div className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 border border-sky-300 px-2 py-0.5 text-[11px] font-bold text-sky-900 shadow-2xs">
                                                  <span>👶 Child No Bed (+₹{row.cwoebRate.toLocaleString("en-IN")}/N)</span>
                                                  <div className="flex items-center gap-1 ml-0.5 bg-white border border-sky-200 rounded px-1">
                                                    <button
                                                      type="button"
                                                      onClick={() => updateHotelConfig(pkgId, row.originalIndex, "cwoebCount", -1, false, 0, row.isCustom, row.customIndex)}
                                                      className="text-sky-800 hover:text-slate-900 font-bold cursor-pointer"
                                                    >
                                                      -
                                                    </button>
                                                    <span className="font-extrabold text-sky-950 text-[10.5px]">{row.cwoebCount}</span>
                                                    <button
                                                      type="button"
                                                      onClick={() => updateHotelConfig(pkgId, row.originalIndex, "cwoebCount", 1, false, 0, row.isCustom, row.customIndex)}
                                                      className="text-sky-800 hover:text-slate-900 font-bold cursor-pointer"
                                                    >
                                                      +
                                                    </button>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => updateHotelConfig(pkgId, row.originalIndex, "cwoebCount", 0, true, 0, row.isCustom, row.customIndex)}
                                                    className="text-sky-700 hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                                                    title="Remove Child Without Bed"
                                                  >
                                                    <X size={11} />
                                                  </button>
                                                </div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => toggleHotelAddon(pkgId, row.originalIndex, "cwoebCount", row.isCustom, row.customIndex)}
                                                  className="inline-flex items-center gap-1 rounded border border-dashed border-sky-300 bg-sky-50/40 hover:bg-sky-100 hover:border-sky-400 px-2 py-0.5 text-[11px] font-semibold text-sky-800 transition cursor-pointer"
                                                  title="Add Child without Extra Bed"
                                                >
                                                  <span>+ Child No Bed (+₹{row.cwoebRate.toLocaleString("en-IN")}/N)</span>
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                                          {row.isExcluded ? (
                                            <div>
                                              <span className="text-sm font-semibold text-rose-600 line-through">
                                                ₹{row.price.toLocaleString("en-IN")}
                                              </span>
                                              <p className="text-[11px] text-rose-600 font-bold mt-0.5">Excluded</p>
                                            </div>
                                          ) : (
                                            <div>
                                              <p className="text-[18.5px] font-black text-slate-900 tracking-tight leading-none">
                                                <span className="text-[12px] font-bold text-slate-500 uppercase mr-1">INR</span>
                                                {row.effectiveTotal.toLocaleString("en-IN")}
                                              </p>
                                              <p className="text-[13px] text-slate-500 font-medium mt-1">
                                                ₹{Math.round(row.baseRoomRatePerNight).toLocaleString("en-IN")} × {row.roomCount}R × {row.nightsCount}N
                                              </p>
                                              {row.totalAddonsCost > 0 && (
                                                <p className="text-[11.5px] text-emerald-700 font-bold mt-0.5">
                                                  +₹{row.totalAddonsCost.toLocaleString("en-IN")} extra bed
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-3.5 px-3 align-top text-center">
                                          {row.isCustom ? (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                updatePkgCustom(pkgId, (c) => ({
                                                  ...c,
                                                  customHotels: c.customHotels.filter((ch) => ch.id !== row.id),
                                                }));
                                                toast.success("Custom hotel removed");
                                              }}
                                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                              title="Remove this add-on"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          ) : row.isExcluded ? (
                                            <button
                                              type="button"
                                              onClick={() => toggleExcludeHotel(pkgId, row.originalIndex)}
                                              className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition cursor-pointer"
                                            >
                                              Restore
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => toggleExcludeHotel(pkgId, row.originalIndex)}
                                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                              title="Drop / Exclude this hotel"
                                            >
                                              <X size={14} />
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Accommodation Total */}
                            {accommodationTotal > 0 && (
                              <div className="flex justify-end pt-1">
                                <div className="border border-slate-300 rounded-lg px-4 py-1.5 bg-white shadow-2xs inline-flex items-center gap-2 font-sans">
                                  <span className="text-xs font-bold text-slate-900">Accommodation Subtotal:</span>
                                  <span className="text-xs font-semibold text-slate-400">INR</span>
                                  <span className="text-sm font-extrabold text-slate-900">
                                    {accommodationTotal.toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* B. TRANSFERS & TRANSPORTATION TABLE WITH DROP/ADD */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                  <Car size={16} />
                                </span>
                                <h4 className="text-sm font-bold text-slate-900">Transfers & Transportation</h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowAddTransferForm(!showAddTransferForm)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-2.5 py-1 transition cursor-pointer shadow-2xs"
                              >
                                <Plus size={13} /> Add Transfer / Cab
                              </button>
                            </div>

                            {/* Add Custom / DMC Transfer Form */}
                            {showAddTransferForm && (() => {
                              const currentDestination = selectedPkg?.destination || query?.destination || "";
                              const cleanDest = currentDestination.trim().toLowerCase();
                              const destTokens = cleanDest.split(/[\s,/-]+/).filter((t) => t.length >= 2);

                              const destinationDmcTransfers = [];

                              (liveDmcTransfers || []).forEach((t) => {
                                const city = String(t.city || "").toLowerCase().trim();
                                const country = String(t.country || "").toLowerCase().trim();
                                const sName = String(t.serviceName || t.title || t.name || "").toLowerCase().trim();
                                const vType = String(t.vehicleType || "").toLowerCase().trim();

                                let isMatch = false;
                                if (!cleanDest) {
                                  isMatch = true;
                                } else if (city && (city === cleanDest || cleanDest.includes(city) || city.includes(cleanDest))) {
                                  isMatch = true;
                                } else if (country && (country === cleanDest || cleanDest.includes(country))) {
                                  isMatch = true;
                                } else if (sName && (sName.includes(cleanDest) || cleanDest.includes(sName))) {
                                  isMatch = true;
                                } else {
                                  for (const tok of destTokens) {
                                    if (tok.length < 3) continue;
                                    if (city.includes(tok) || sName.includes(tok) || vType.includes(tok) || country.includes(tok)) {
                                      isMatch = true;
                                      break;
                                    }
                                  }
                                }

                                if (isMatch) {
                                  destinationDmcTransfers.push(t);
                                }
                              });

                              const availableTransfers = destinationDmcTransfers.length > 0 ? destinationDmcTransfers : liveDmcTransfers;

                              return (
                                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3.5 animate-fadeIn">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                      <Plus size={14} className="text-blue-600" />
                                      Add New Transfer / Cab Service to Package
                                    </p>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      Destination: <strong className="text-slate-800">{currentDestination || "All Destinations"}</strong>
                                    </span>
                                  </div>

                                  {/* Live DMC Transfer Services Selector */}
                                  <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-2xs space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[11px] font-bold text-blue-900 uppercase flex items-center gap-1.5">
                                        <Car size={13} className="text-blue-600" />
                                        Select DMC Contracted Transfer / Cab ({currentDestination || "Destination"})
                                      </label>
                                      {availableTransfers.length > 0 && (
                                        <span className="text-[10.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                          {availableTransfers.length} DMC services for {currentDestination || "this destination"}
                                        </span>
                                      )}
                                    </div>
                                    <select
                                      value={newTransferInput.dmcTransferId || ""}
                                      onChange={(e) => {
                                        const sId = e.target.value;
                                        if (!sId) {
                                          setNewTransferInput((prev) => ({
                                            ...prev,
                                            dmcTransferId: "",
                                            name: "",
                                            serviceTitle: "",
                                            actualVehicleName: "",
                                            price: 2500,
                                          }));
                                          return;
                                        }
                                        const matched = (availableTransfers || []).find((t) => String(t._id || t.id) === String(sId));
                                        if (matched) {
                                          const priceVal = Number(matched.price || matched.rate || 2500);
                                          const oneWayVal = Number(matched.oneWayPrice || priceVal);
                                          const interHotelVal = Number(matched.interHotelPrice || Math.round(priceVal * 0.6) || 1500);
                                          const fullDayVal = Number(matched.fullDayPrice || Math.round(priceVal * 1.5) || 3500);
                                          const halfDayVal = Number(matched.halfDayPrice || Math.round(priceVal * 0.9) || 2200);
                                          const fullDayNoteVal = String(matched.fullDayNote || "Max 80 km / 8 hours limit. Extra km & hours charged separately.").trim();
                                          const halfDayNoteVal = String(matched.halfDayNote || "Max 40 km / 4 hours limit. Extra km & hours charged separately.").trim();
                                          const fullDayExtraKmVal = Number(matched.fullDayExtraPerKmRate || matched.vehicles?.[0]?.usageTypes?.hourly?.[0]?.extraPerKmRate || matched.extraPerKmRate || 0);
                                          const halfDayExtraKmVal = Number(matched.halfDayExtraPerKmRate || matched.vehicles?.[0]?.usageTypes?.hourly?.[1]?.extraPerKmRate || matched.extraPerKmRate || 0);

                                          const rawTitle = matched.serviceName || matched.title || matched.name || "Private Transfer Service";
                                          const vType = matched.vehicleType || "Sedan";
                                          const vName = matched.supplierName ? `${matched.supplierName} • ${vType}` : `AC ${vType}`;
                                          const pCap = Number(matched.passengerCapacity || (/suv|innova/i.test(vType) ? 6 : (/tempo|traveller/i.test(vType) ? 12 : 4)));
                                          const lCap = Number(matched.luggageCapacity || (/suv|innova/i.test(vType) ? 4 : (/tempo|traveller/i.test(vType) ? 8 : 2)));
                                          const uType = matched.usageType || (/airport/i.test(rawTitle) ? "Airport Transfer" : (/full\s*day/i.test(rawTitle) ? "Full Day (8 Hrs / 80 Km)" : "Point-to-Point"));
                                          const rawDesc = matched.description || `${matched.city || currentDestination || "Destination"} transfer in AC ${vType} with professional driver, fuel & toll included`;

                                          setNewTransferInput({
                                            dmcTransferId: sId,
                                            name: rawTitle,
                                            serviceTitle: rawTitle,
                                            actualVehicleName: vName,
                                            vehicleType: vType,
                                            usageType: uType,
                                            passengerCapacity: pCap,
                                            luggageCapacity: lCap,
                                            day: newTransferInput.day || "Day 1",
                                            days: Number(newTransferInput.days || 1),
                                            vehicles: 1,
                                            price: priceVal,
                                            oneWayRate: oneWayVal,
                                            interHotelRate: interHotelVal,
                                            fullDayRate: fullDayVal,
                                            halfDayRate: halfDayVal,
                                            fullDayNote: fullDayNoteVal,
                                            halfDayNote: halfDayNoteVal,
                                            fullDayExtraPerKmRate: fullDayExtraKmVal,
                                            halfDayExtraPerKmRate: halfDayExtraKmVal,
                                            city: matched.city || currentDestination || "Destination",
                                            description: rawDesc,
                                            pointToPointCount: 0,
                                            interHotelCount: 0,
                                            fullDayCount: 0,
                                            halfDayCount: 0,
                                          });
                                        }
                                      }}
                                      className="w-full rounded-md border border-blue-300 bg-blue-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none cursor-pointer"
                                    >
                                      <option value="">-- Select DMC Transfer / Cab in {currentDestination || "Destination"} (Auto-fills all details) --</option>
                                      {availableTransfers.map((t, tIdx) => {
                                        const tName = t.serviceName || t.title || t.name || "Transfer Service";
                                        const tVehicle = t.vehicleType || "Sedan";
                                        const tRate = Number(t.price || t.rate || 0);
                                        const tUsage = t.usageType || "Point-to-Point";
                                        return (
                                          <option key={t._id || t.id || `dmc-t-${tIdx}`} value={t._id || t.id || tIdx}>
                                            {tName} ({tVehicle}) • {tUsage} — ₹{tRate.toLocaleString("en-IN")}/Cab ({t.city || currentDestination})
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                                    <div className="md:col-span-2">
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Transfer Service Name</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Airport Arrival & Departure VIP Cab"
                                        value={newTransferInput.name}
                                        onChange={(e) => setNewTransferInput({ ...newTransferInput, name: e.target.value, serviceTitle: e.target.value })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Vehicle Type</label>
                                      <select
                                        value={newTransferInput.vehicleType || "Sedan"}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          const pCap = /suv|innova/i.test(v) ? 6 : (/tempo|traveller/i.test(v) ? 12 : 4);
                                          const lCap = /suv|innova/i.test(v) ? 4 : (/tempo|traveller/i.test(v) ? 8 : 2);
                                          setNewTransferInput({ ...newTransferInput, vehicleType: v, passengerCapacity: pCap, luggageCapacity: lCap });
                                        }}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer"
                                      >
                                        <option value="Sedan">Sedan (4 Seater)</option>
                                        <option value="SUV">SUV (6 Seater)</option>
                                        <option value="Innova Crysta">Innova Crysta (6 Seater)</option>
                                        <option value="Tempo Traveller">Tempo Traveller (12-16 Seater)</option>
                                        <option value="Luxury Sedan">Luxury Sedan (BMW/Audi)</option>
                                        <option value="Luxury SUV">Luxury SUV (Fortuner/Endeavour)</option>
                                        <option value="Mini Bus">Mini Bus (20+ Seater)</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Usage / Route Type</label>
                                      <select
                                        value={newTransferInput.usageType || "One Way / Airport Transfer"}
                                        onChange={(e) => setNewTransferInput({ ...newTransferInput, usageType: e.target.value })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer"
                                      >
                                        <option value="One Way / Airport Transfer">One Way / Airport Transfer</option>
                                        <option value="Inter Hotel Transfer">Inter Hotel Transfer</option>
                                        <option value="Half Day - 40 km / 4 hours">Half Day - 40 km / 4 hours</option>
                                        <option value="Full Day - 80 km / 8 hours">Full Day - 80 km / 8 hours</option>
                                        <option value="Outstation Round Trip">Outstation Round Trip</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Day / Date Label</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Day 1"
                                        value={newTransferInput.day}
                                        onChange={(e) => setNewTransferInput({ ...newTransferInput, day: e.target.value })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Days / Duration</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={newTransferInput.days}
                                        onChange={(e) => setNewTransferInput({ ...newTransferInput, days: Math.max(1, Number(e.target.value) || 1) })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">One Way / Base Rate (₹)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="2500"
                                        value={newTransferInput.price}
                                        onChange={(e) => setNewTransferInput({ ...newTransferInput, price: e.target.value })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">Passenger Capacity</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={newTransferInput.passengerCapacity}
                                        onChange={(e) => setNewTransferInput({ ...newTransferInput, passengerCapacity: Math.max(1, Number(e.target.value) || 4) })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase">
                                        Route Inclusions &amp; Description
                                      </label>
                                      <textarea
                                        rows={2}
                                        placeholder="e.g. Dehradun Airport to Mussoorie Hotel | AC Sedan | Tolls, fuel & driver allowance included..."
                                        value={newTransferInput.description}
                                        onChange={(e) => setNewTransferInput({ ...newTransferInput, description: e.target.value })}
                                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none resize-y"
                                      />
                                    </div>
                                  </div>

                                  {/* 3 DMC USAGE RATES */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-indigo-800 mb-1 uppercase">Inter Hotel Transfer Rate (₹)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={newTransferInput.interHotelRate}
                                        onChange={(e) => setNewTransferInput({ ...newTransferInput, interHotelRate: Number(e.target.value) || 0 })}
                                        className="w-full rounded border border-indigo-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-amber-800 mb-1 uppercase">Full Day - 80 km / 8 hrs Rate (₹/D)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={newTransferInput.fullDayRate}
                                        onChange={(e) => setNewTransferInput({ ...newTransferInput, fullDayRate: Number(e.target.value) || 0 })}
                                        className="w-full rounded border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-emerald-800 mb-1 uppercase">Half Day - 40 km / 4 hrs Rate (₹/D)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={newTransferInput.halfDayRate}
                                        onChange={(e) => setNewTransferInput({ ...newTransferInput, halfDayRate: Number(e.target.value) || 0 })}
                                        className="w-full rounded border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  {/* NOTES INPUTS */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-amber-800 mb-1 uppercase">Full Day Note</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Max 80 km / 8 hours limit. Extra km chargeable."
                                        value={newTransferInput.fullDayNote}
                                        onChange={(e) => setNewTransferInput({ ...newTransferInput, fullDayNote: e.target.value })}
                                        className="w-full rounded border border-amber-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-emerald-800 mb-1 uppercase">Half Day Note</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Max 40 km / 4 hours limit. Extra km chargeable."
                                        value={newTransferInput.halfDayNote}
                                        onChange={(e) => setNewTransferInput({ ...newTransferInput, halfDayNote: e.target.value })}
                                        className="w-full rounded border border-emerald-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setShowAddTransferForm(false)}
                                      className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-600 text-xs hover:bg-slate-50 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!String(newTransferInput.name || "").trim()) {
                                          toast.error("Please enter or select a transfer service name.");
                                          return;
                                        }
                                        const defaultAdultsVal = Number(query?.numberOfAdults ?? query?.adults ?? 2);
                                        const defaultChildrenVal = Number(query?.numberOfChildren ?? query?.children ?? 0);

                                        updatePkgCustom(pkgId, (c) => ({
                                          ...c,
                                          customTransfers: [
                                            ...c.customTransfers,
                                            {
                                              id: `custom-transfer-${Date.now()}`,
                                              dmcTransferId: newTransferInput.dmcTransferId || "",
                                              name: newTransferInput.name,
                                              serviceTitle: newTransferInput.serviceTitle || newTransferInput.name || "Custom Transfer Service",
                                              actualVehicleName: newTransferInput.actualVehicleName || `AC ${newTransferInput.vehicleType || "Cab"}`,
                                              vehicleType: newTransferInput.vehicleType || "Sedan",
                                              usageType: newTransferInput.usageType || "One Way / Airport Transfer",
                                              passengerCapacity: Number(newTransferInput.passengerCapacity || 4),
                                              luggageCapacity: Number(newTransferInput.luggageCapacity || 2),
                                              day: newTransferInput.day || "Day 1",
                                              days: Number(newTransferInput.days || 1),
                                              vehicles: 1,
                                              adults: defaultAdultsVal,
                                              children: defaultChildrenVal,
                                              price: Number(newTransferInput.price || 0),
                                              baseRatePerDay: Number(newTransferInput.price || 0),
                                              oneWayRate: Number(newTransferInput.oneWayRate || newTransferInput.price || 2500),
                                              interHotelRate: Number(newTransferInput.interHotelRate || 1500),
                                              fullDayRate: Number(newTransferInput.fullDayRate || 3500),
                                              halfDayRate: Number(newTransferInput.halfDayRate || 2200),
                                              fullDayNote: newTransferInput.fullDayNote || "Max 80 km / 8 hours limit. Extra km chargeable.",
                                              halfDayNote: newTransferInput.halfDayNote || "Max 40 km / 4 hours limit. Extra km chargeable.",
                                              fullDayExtraPerKmRate: Number(newTransferInput.fullDayExtraPerKmRate || 0),
                                              halfDayExtraPerKmRate: Number(newTransferInput.halfDayExtraPerKmRate || 0),
                                              city: newTransferInput.city || currentDestination || "Destination",
                                              description: newTransferInput.description || "Transfer in AC vehicle with driver",
                                              interHotelCount: 0,
                                              fullDayCount: 0,
                                              halfDayCount: 0,
                                            },
                                          ],
                                        }));
                                        toast.success("Transfer service added to package!");
                                        setShowAddTransferForm(false);
                                        setNewTransferInput({
                                          dmcTransferId: "",
                                          name: "",
                                          serviceTitle: "",
                                          actualVehicleName: "",
                                          vehicleType: "Sedan",
                                          usageType: "One Way / Airport Transfer",
                                          passengerCapacity: 4,
                                          luggageCapacity: 2,
                                          day: "Day 1",
                                          days: 1,
                                          vehicles: 1,
                                          price: 2500,
                                          oneWayRate: 2500,
                                          interHotelRate: 1500,
                                          fullDayRate: 3500,
                                          halfDayRate: 2200,
                                          fullDayNote: "Full day disposal: Max 80 km / 8 hours limit. Extra km & hours charged separately.",
                                          halfDayNote: "Half day disposal: Max 40 km / 4 hours limit. Extra km & hours charged separately.",
                                          fullDayExtraPerKmRate: 0,
                                          halfDayExtraPerKmRate: 0,
                                          city: currentDestination || "",
                                          description: "One Way / Airport transfer in AC vehicle with driver, fuel and tolls included",
                                          interHotelCount: 0,
                                          fullDayCount: 0,
                                          halfDayCount: 0,
                                        });
                                      }}
                                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs cursor-pointer shadow-xs"
                                    >
                                      + Add Transfer
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                              {/* TRANSFERS LIST TABLE */}
                              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-700 font-sans">
                                        <th className="py-2.5 px-4 font-bold w-[12%]">DAY</th>
                                        <th className="py-2.5 px-4 font-bold w-[22%]">SERVICE / TRANSFER NAME</th>
                                        <th className="py-2.5 px-4 font-bold w-[24%]">ROUTE / DESCRIPTION</th>
                                        <th className="py-2.5 px-4 font-bold w-[28%]">VEHICLES &amp; EXTRA USAGE</th>
                                        <th className="py-2.5 px-4 font-bold text-right w-[10%]">PRICE</th>
                                        <th className="py-2.5 px-3 font-bold text-center w-[4%]">ACTION</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-slate-700 font-sans">
                                      {allTransferRows.length > 0 ? (
                                        allTransferRows.map((row) => (
                                          <tr
                                            key={row.isCustom ? row.id : `transfer-row-${row.originalIndex}`}
                                            className={`transition-colors font-sans ${
                                              row.isExcluded ? "bg-slate-100/60 opacity-60" : "hover:bg-slate-50/50"
                                            }`}
                                          >
                                            {/* Col 1: DAY */}
                                            <td className="py-3.5 px-4 align-top">
                                              <p className={`font-bold text-[15px] ${row.isExcluded ? "line-through text-slate-500" : "text-slate-900"}`}>
                                                {row.dayLabel}
                                              </p>
                                              <p className="text-[12.5px] text-slate-500 font-normal mt-0.5">{row.dateStr}</p>
                                            </td>

                                            {/* Col 2: SERVICE / TRANSFER NAME */}
                                            <td className="py-3.5 px-4 align-top space-y-1.5">
                                              <div className="flex items-start gap-1.5">
                                                <Car size={16} className={`mt-0.5 shrink-0 ${row.isExcluded ? "text-slate-400" : "text-[#1d4ed8]"}`} />
                                                <div className="min-w-0">
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`font-bold text-[15px] leading-snug tracking-tight ${row.isExcluded ? "line-through text-slate-400" : "text-[#1d4ed8]"}`}>
                                                      {row.serviceTitle}
                                                    </span>
                                                    {row.isCustom && (
                                                      <span className="rounded bg-blue-100 text-blue-800 text-[10.5px] font-bold px-1.5 py-0.2 shrink-0">
                                                        Add-on
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>

                                              {row.actualVehicleName && (
                                                 <div className="flex items-start gap-1.5 text-[13px] text-slate-700 font-medium">
                                                   <Car size={14} className="mt-0.5 text-slate-500 shrink-0" />
                                                   <div className="min-w-0">
                                                     <span className="font-semibold text-slate-600">Vehicle: </span>
                                                     <span className="font-bold text-slate-900">{row.actualVehicleName}</span>
                                                   </div>
                                                 </div>
                                               )}

                                               <div className="text-[13px] text-slate-500 font-normal">
                                                 <span className="text-slate-600 font-medium">{row.city}</span>
                                               </div>

                                               {/* Badges: Type, Capacity, Usage Dropdowns */}
                                               <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-1">
                                                 {/* Type Dropdown */}
                                                 <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200 shadow-2xs">
                                                   <span className="text-slate-500 font-bold uppercase text-[9.5px]">Type:</span>
                                                   <select
                                                     disabled={row.isExcluded}
                                                     value={row.vehicleType || "Sedan"}
                                                     onChange={(e) => {
                                                       const v = e.target.value;
                                                       const pCap = /coach|bus/i.test(v) ? 40 : (/minibus|mini\s*bus/i.test(v) ? 20 : (/tempo|traveller/i.test(v) ? 12 : (/suv|innova/i.test(v) ? 6 : 4)));
                                                       const lCap = /coach|bus/i.test(v) ? 25 : (/minibus|mini\s*bus/i.test(v) ? 12 : (/tempo|traveller/i.test(v) ? 8 : (/suv|innova/i.test(v) ? 4 : 2)));
                                                       updateTransferConfig(pkgId, row.originalIndex, "vehicleType", v, false, undefined, row.isCustom, row.customIndex);
                                                       updateTransferConfig(pkgId, row.originalIndex, "passengerCapacity", pCap, true, undefined, row.isCustom, row.customIndex);
                                                       updateTransferConfig(pkgId, row.originalIndex, "luggageCapacity", lCap, true, undefined, row.isCustom, row.customIndex);
                                                     }}
                                                     className="bg-transparent border-0 font-bold text-slate-900 text-xs focus:ring-0 focus:outline-none cursor-pointer py-0 pl-0 pr-1 disabled:opacity-50"
                                                   >
                                                     <option value="Sedan">Sedan</option>
                                                     <option value="SUV">SUV</option>
                                                     <option value="Innova Crysta">Innova Crysta</option>
                                                     <option value="Tempo Traveller">Tempo Traveller</option>
                                                     <option value="Mini Bus">Mini Bus</option>
                                                     <option value="Coach/Bus">Coach/Bus</option>
                                                    </select>
                                                  </div>

                                                  {/* Capacity Badge */}
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200 shadow-2xs whitespace-nowrap">
                                                    <span className="text-slate-400 font-bold uppercase text-[9.5px]">Capacity:</span>
                                                    <span className="font-bold text-slate-900">{row.passengerCapacity} Pax</span>
                                                  </span>

                                                  {/* Usage Dropdown with Dynamic Price */}
                                                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold border border-blue-200 shadow-2xs">
                                                    <span className="text-blue-600 font-bold uppercase text-[9.5px]">Usage:</span>
                                                    <select
                                                      disabled={row.isExcluded}
                                                      value={row.usageType || "One Way / Airport Transfer"}
                                                      onChange={(e) => {
                                                        const u = e.target.value;
                                                        updateTransferConfig(pkgId, row.originalIndex, "usageType", u, false, undefined, row.isCustom, row.customIndex);
                                                      }}
                                                      className="bg-transparent border-0 font-bold text-blue-950 text-xs focus:ring-0 focus:outline-none cursor-pointer py-0 pl-0 pr-1 max-w-[240px] truncate disabled:opacity-50"
                                                    >
                                                      <option value="One Way / Airport Transfer">
                                                        One Way / Airport Transfer (₹{Number(row.oneWayRate || 2500).toLocaleString("en-IN")})
                                                      </option>
                                                      <option value="Inter Hotel Transfer">
                                                        Inter Hotel Transfer (₹{Number(row.interHotelRate || 1500).toLocaleString("en-IN")})
                                                      </option>
                                                      <option value="Full Day - 80 km / 8 hours">
                                                        Full Day - 80 km / 8 hours (₹{Number(row.fullDayRate || 3500).toLocaleString("en-IN")})
                                                      </option>
                                                      <option value="Half Day - 40 km / 4 hours">
                                                        Half Day - 40 km / 4 hours (₹{Number(row.halfDayRate || 2200).toLocaleString("en-IN")})
                                                      </option>
                                                    </select>
                                                  </div>
                                                </div>
                                                {/* Note and Extra km rate when Full Day or Half Day is selected in Usage dropdown */}
                                                {!row.isExcluded && (/full\s*day/i.test(row.usageType || "") || /half\s*day/i.test(row.usageType || "")) && (() => {
                                                  const isFullDay = /full\s*day/i.test(row.usageType || "");
                                                  const extraKm = Number(isFullDay ? row.fullDayExtraPerKmRate : row.halfDayExtraPerKmRate) || Number(row.extraPerKmRate || 0);
                                                  const noteText = isFullDay ? row.fullDayNote : row.halfDayNote;
                                                  const defaultNote = isFullDay
                                                    ? "Max 80 km / 8 hours limit. Extra km & hours charged separately."
                                                    : "Max 40 km / 4 hours limit. Extra km & hours charged separately.";
                                                  const displayNote = (noteText && String(noteText).trim()) ? String(noteText).trim() : defaultNote;

                                                  return (
                                                    <div className={`mt-2 p-2 rounded-lg border text-[11px] space-y-1 animate-fadeIn ${
                                                      isFullDay
                                                        ? "bg-amber-50/90 border-amber-200 text-amber-900"
                                                        : "bg-emerald-50/90 border-emerald-200 text-emerald-900"
                                                    }`}>
                                                      {extraKm > 0 && (
                                                        <div className={`flex items-center gap-1.5 font-bold ${isFullDay ? "text-amber-950" : "text-emerald-950"}`}>
                                                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${isFullDay ? "bg-amber-600" : "bg-emerald-600"}`}></span>
                                                          <span>Extra km rate: ₹{Number(extraKm).toLocaleString("en-IN")}/km</span>
                                                        </div>
                                                      )}
                                                      <div className="flex items-start gap-1.5 leading-snug">
                                                        <Info size={13} className={`shrink-0 mt-0.5 ${isFullDay ? "text-amber-600" : "text-emerald-600"}`} />
                                                        <div>
                                                          <strong className={`font-bold ${isFullDay ? "text-amber-950" : "text-emerald-950"}`}>
                                                            {isFullDay ? "Note (Full Day): " : "Note (Half Day): "}
                                                          </strong>
                                                          <span className={`font-medium ${isFullDay ? "text-amber-800" : "text-emerald-800"}`}>
                                                            {displayNote}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })()}
                                              </td>

                                            {/* Col 3: ROUTE / DESCRIPTION */}
                                            <td className="py-3.5 px-4 align-top text-[12.5px] text-slate-600 font-normal leading-relaxed">
                                              <p className="font-bold text-slate-800 text-[13px] mb-0.5">
                                                {row.actualVehicleName} • {row.vehicleType} ({row.passengerCapacity} Pax, {row.luggageCapacity} Bags)
                                              </p>
                                              <p>{row.description}</p>
                                            </td>

                                            {/* Col 4: VEHICLES & EXTRA USAGE */}
                                            <td className="py-3.5 px-4 align-top space-y-2">
                                              <div>
                                                <p className={`font-bold text-[15px] ${row.isExcluded ? "line-through text-slate-500" : "text-slate-900"}`}>
                                                  {row.vehiclesCount} {row.vehicleType || "Cab"}
                                                </p>
                                              </div>

                                              {/* STEPPERS: Cabs, Days, Adults, Child */}
                                              {!row.isExcluded && (
                                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                                  {/* Cabs Stepper */}
                                                  <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-0.5 text-xs text-slate-700 shadow-2xs">
                                                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Cabs:</span>
                                                    <button
                                                      type="button"
                                                      disabled={row.isExcluded}
                                                      onClick={() => updateTransferConfig(pkgId, row.originalIndex, "vehicles", -1, false, row.vehiclesCount, row.isCustom, row.customIndex)}
                                                      className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                      title="Decrease cabs"
                                                    >
                                                      -
                                                    </button>
                                                    <span className="font-bold text-slate-900 px-0.5 text-[12px]">{row.vehiclesCount}</span>
                                                    <button
                                                      type="button"
                                                      disabled={row.isExcluded}
                                                      onClick={() => updateTransferConfig(pkgId, row.originalIndex, "vehicles", 1, false, row.vehiclesCount, row.isCustom, row.customIndex)}
                                                      className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                      title="Increase cabs"
                                                    >
                                                      +
                                                    </button>
                                                  </div>

                                                  {/* Days Stepper */}
                                                  <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-0.5 text-xs text-slate-700 shadow-2xs">
                                                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Days:</span>
                                                    <button
                                                      type="button"
                                                      disabled={row.isExcluded}
                                                      onClick={() => updateTransferConfig(pkgId, row.originalIndex, "days", -1, false, row.daysCount, row.isCustom, row.customIndex)}
                                                      className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                      title="Decrease days"
                                                    >
                                                      -
                                                    </button>
                                                    <span className="font-bold text-slate-900 px-0.5 text-[12px]">{row.daysCount}</span>
                                                    <button
                                                      type="button"
                                                      disabled={row.isExcluded}
                                                      onClick={() => updateTransferConfig(pkgId, row.originalIndex, "days", 1, false, row.daysCount, row.isCustom, row.customIndex)}
                                                      className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                      title="Increase days"
                                                    >
                                                      +
                                                    </button>
                                                  </div>

                                                  {/* Adults Stepper */}
                                                  <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-0.5 text-xs text-slate-700 shadow-2xs">
                                                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Adults:</span>
                                                    <button
                                                      type="button"
                                                      disabled={row.isExcluded}
                                                      onClick={() => updateTransferConfig(pkgId, row.originalIndex, "adults", -1, false, row.adultsCount ?? Number(query?.numberOfAdults ?? query?.adults ?? 2), row.isCustom, row.customIndex)}
                                                      className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                      title="Decrease adults"
                                                    >
                                                      -
                                                    </button>
                                                    <span className="font-bold text-slate-900 px-0.5 text-[12px]">
                                                      {row.adultsCount !== undefined ? row.adultsCount : Number(query?.numberOfAdults ?? query?.adults ?? 2)}
                                                    </span>
                                                    <button
                                                      type="button"
                                                      disabled={row.isExcluded}
                                                      onClick={() => updateTransferConfig(pkgId, row.originalIndex, "adults", 1, false, row.adultsCount ?? Number(query?.numberOfAdults ?? query?.adults ?? 2), row.isCustom, row.customIndex)}
                                                      className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                      title="Increase adults"
                                                    >
                                                      +
                                                    </button>
                                                  </div>

                                                  {/* Children Stepper */}
                                                  <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-0.5 text-xs text-slate-700 shadow-2xs">
                                                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Child:</span>
                                                    <button
                                                      type="button"
                                                      disabled={row.isExcluded}
                                                      onClick={() => updateTransferConfig(pkgId, row.originalIndex, "children", -1, false, row.childrenCount ?? Number(query?.numberOfChildren ?? query?.children ?? 0), row.isCustom, row.customIndex)}
                                                      className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                      title="Decrease children"
                                                    >
                                                      -
                                                    </button>
                                                    <span className="font-bold text-slate-900 px-0.5 text-[12px]">
                                                      {row.childrenCount !== undefined ? row.childrenCount : Number(query?.numberOfChildren ?? query?.children ?? 0)}
                                                    </span>
                                                    <button
                                                      type="button"
                                                      disabled={row.isExcluded}
                                                      onClick={() => updateTransferConfig(pkgId, row.originalIndex, "children", 1, false, row.childrenCount ?? Number(query?.numberOfChildren ?? query?.children ?? 0), row.isCustom, row.customIndex)}
                                                      className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                      title="Increase children"
                                                    >
                                                      +
                                                    </button>
                                                  </div>
                                                </div>
                                              )}

                                              {/* Vehicle Capacity Warning */}
                                              {!row.isExcluded && (row.adultsCount + row.childrenCount) > row.vehiclesCount * row.passengerCapacity && (() => {
                                                const totalPax = row.adultsCount + row.childrenCount;
                                                const minCabsNeeded = Math.ceil(totalPax / row.passengerCapacity);
                                                return (
                                                  <div className="rounded-lg border border-amber-300 bg-amber-50/90 p-2.5 space-y-2 animate-fadeIn shadow-2xs">
                                                    <div className="flex items-start gap-2 text-amber-950 text-[11.5px] leading-snug">
                                                      <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                                                      <div className="min-w-0">
                                                        <p className="font-bold text-amber-900">
                                                          Capacity Exceeded for {row.vehiclesCount} {row.vehicleType || "Cab"}
                                                        </p>
                                                        <p className="text-amber-800 text-[11px] mt-0.5 leading-normal">
                                                          {totalPax} passengers cannot fit in {row.vehiclesCount} {row.vehicleType} (Max {row.vehiclesCount * row.passengerCapacity} pax). Extra cab recommended.
                                                        </p>
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-1.5 border-t border-amber-200/80 text-[11px]">
                                                      <span className="text-amber-900 font-medium">
                                                        Min required: <strong className="font-bold text-amber-950">{minCabsNeeded} Cabs</strong>
                                                      </span>
                                                      <button
                                                        type="button"
                                                        onClick={() => updateTransferConfig(pkgId, row.originalIndex, "vehicles", minCabsNeeded, true, row.vehiclesCount, row.isCustom, row.customIndex)}
                                                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-md shadow-2xs cursor-pointer whitespace-nowrap transition"
                                                        title={`Adjust to ${minCabsNeeded} cabs`}
                                                      >
                                                        + Set to {minCabsNeeded} Cabs
                                                      </button>
                                                    </div>
                                                  </div>
                                                );
                                              })()}

                                              {/* 4 DMC USAGE OPTIONS: One Way, Inter Hotel, Full Day, Half Day */}
                                              {!row.isExcluded && (
                                                <div className="space-y-1.5 pt-1">
                                                  <div className="flex flex-wrap items-center gap-1.5">
                                                    {/* 1. One Way / Airport Transfer */}
                                                    {row.pointToPointCount > 0 ? (
                                                      <div className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 border border-sky-300 px-2 py-0.5 text-[11px] font-bold text-sky-900 shadow-2xs">
                                                        <span>📍 One Way / Airport Transfer (+₹{row.oneWayRate.toLocaleString("en-IN")})</span>
                                                        <div className="flex items-center gap-1 ml-0.5 bg-white border border-sky-200 rounded px-1">
                                                          <button
                                                            type="button"
                                                            onClick={() => updateTransferConfig(pkgId, row.originalIndex, "pointToPointCount", -1, false, 0, row.isCustom, row.customIndex)}
                                                            className="text-sky-800 hover:text-slate-900 font-bold cursor-pointer"
                                                          >
                                                            -
                                                          </button>
                                                          <span className="font-extrabold text-sky-950 text-[10.5px]">{row.pointToPointCount}</span>
                                                          <button
                                                            type="button"
                                                            onClick={() => updateTransferConfig(pkgId, row.originalIndex, "pointToPointCount", 1, false, 0, row.isCustom, row.customIndex)}
                                                            className="text-sky-800 hover:text-slate-900 font-bold cursor-pointer"
                                                          >
                                                            +
                                                          </button>
                                                        </div>
                                                        <button
                                                          type="button"
                                                          onClick={() => updateTransferConfig(pkgId, row.originalIndex, "pointToPointCount", 0, true, 0, row.isCustom, row.customIndex)}
                                                          className="text-sky-700 hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                                                          title="Remove One Way / Airport Transfer"
                                                        >
                                                          <X size={11} />
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <button
                                                        type="button"
                                                        onClick={() => toggleTransferAddon(pkgId, row.originalIndex, "pointToPointCount", row.isCustom, row.customIndex)}
                                                        className="inline-flex items-center gap-1 rounded border border-dashed border-sky-300 bg-sky-50/40 hover:bg-sky-100 hover:border-sky-400 px-2 py-0.5 text-[11px] font-semibold text-sky-800 transition cursor-pointer"
                                                        title="Add One Way / Airport Transfer"
                                                      >
                                                        <span>+ One Way / Airport Transfer (+₹{row.oneWayRate.toLocaleString("en-IN")})</span>
                                                      </button>
                                                    )}

                                                    {/* 2. Inter Hotel Transfer */}
                                                    {row.interHotelCount > 0 ? (
                                                      <div className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 border border-indigo-300 px-2 py-0.5 text-[11px] font-bold text-indigo-900 shadow-2xs">
                                                        <span>🏨 Inter Hotel (+₹{row.interHotelRate.toLocaleString("en-IN")})</span>
                                                        <div className="flex items-center gap-1 ml-0.5 bg-white border border-indigo-200 rounded px-1">
                                                          <button
                                                            type="button"
                                                            onClick={() => updateTransferConfig(pkgId, row.originalIndex, "interHotelCount", -1, false, 0, row.isCustom, row.customIndex)}
                                                            className="text-indigo-800 hover:text-slate-900 font-bold cursor-pointer"
                                                          >
                                                            -
                                                          </button>
                                                          <span className="font-extrabold text-indigo-950 text-[10.5px]">{row.interHotelCount}</span>
                                                          <button
                                                            type="button"
                                                            onClick={() => updateTransferConfig(pkgId, row.originalIndex, "interHotelCount", 1, false, 0, row.isCustom, row.customIndex)}
                                                            className="text-indigo-800 hover:text-slate-900 font-bold cursor-pointer"
                                                          >
                                                            +
                                                          </button>
                                                        </div>
                                                        <button
                                                          type="button"
                                                          onClick={() => updateTransferConfig(pkgId, row.originalIndex, "interHotelCount", 0, true, 0, row.isCustom, row.customIndex)}
                                                          className="text-indigo-700 hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                                                          title="Remove Inter Hotel Transfer"
                                                        >
                                                          <X size={11} />
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <button
                                                        type="button"
                                                        onClick={() => toggleTransferAddon(pkgId, row.originalIndex, "interHotelCount", row.isCustom, row.customIndex)}
                                                        className="inline-flex items-center gap-1 rounded border border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-100 hover:border-indigo-400 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 transition cursor-pointer"
                                                        title="Add Inter Hotel Transfer"
                                                      >
                                                        <span>+ Inter Hotel (+₹{row.interHotelRate.toLocaleString("en-IN")})</span>
                                                      </button>
                                                    )}

                                                    {/* 3. Full Day - 80 km / 8 hours */}
                                                    {row.fullDayCount > 0 ? (
                                                      <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-900 shadow-2xs">
                                                        <span>🚗 Full Day (80km/8h) (+₹{row.fullDayRate.toLocaleString("en-IN")}/D)</span>
                                                        <div className="flex items-center gap-1 ml-0.5 bg-white border border-amber-200 rounded px-1">
                                                          <button
                                                            type="button"
                                                            onClick={() => updateTransferConfig(pkgId, row.originalIndex, "fullDayCount", -1, false, 0, row.isCustom, row.customIndex)}
                                                            className="text-amber-800 hover:text-slate-900 font-bold cursor-pointer"
                                                          >
                                                            -
                                                          </button>
                                                          <span className="font-extrabold text-amber-950 text-[10.5px]">{row.fullDayCount}</span>
                                                          <button
                                                            type="button"
                                                            onClick={() => updateTransferConfig(pkgId, row.originalIndex, "fullDayCount", 1, false, 0, row.isCustom, row.customIndex)}
                                                            className="text-amber-800 hover:text-slate-900 font-bold cursor-pointer"
                                                          >
                                                            +
                                                          </button>
                                                        </div>
                                                        <button
                                                          type="button"
                                                          onClick={() => updateTransferConfig(pkgId, row.originalIndex, "fullDayCount", 0, true, 0, row.isCustom, row.customIndex)}
                                                          className="text-amber-700 hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                                                          title="Remove Full Day Usage"
                                                        >
                                                          <X size={11} />
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <button
                                                        type="button"
                                                        onClick={() => toggleTransferAddon(pkgId, row.originalIndex, "fullDayCount", row.isCustom, row.customIndex)}
                                                        className="inline-flex items-center gap-1 rounded border border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-100 hover:border-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-800 transition cursor-pointer"
                                                        title={row.fullDayNote ? `Note: ${row.fullDayNote}` : "Full Day - 80 km / 8 hours"}
                                                      >
                                                        <span>+ Full Day - 80 km / 8 hrs (+₹{row.fullDayRate.toLocaleString("en-IN")}/D)</span>
                                                      </button>
                                                    )}

                                                    {/* 4. Half Day - 40 km / 4 hours */}
                                                    {row.halfDayCount > 0 ? (
                                                      <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[11px] font-bold text-emerald-900 shadow-2xs">
                                                        <span>⏱️ Half Day (40km/4h) (+₹{row.halfDayRate.toLocaleString("en-IN")}/D)</span>
                                                        <div className="flex items-center gap-1 ml-0.5 bg-white border border-emerald-200 rounded px-1">
                                                          <button
                                                            type="button"
                                                            onClick={() => updateTransferConfig(pkgId, row.originalIndex, "halfDayCount", -1, false, 0, row.isCustom, row.customIndex)}
                                                            className="text-emerald-800 hover:text-slate-900 font-bold cursor-pointer"
                                                          >
                                                            -
                                                          </button>
                                                          <span className="font-extrabold text-emerald-950 text-[10.5px]">{row.halfDayCount}</span>
                                                          <button
                                                            type="button"
                                                            onClick={() => updateTransferConfig(pkgId, row.originalIndex, "halfDayCount", 1, false, 0, row.isCustom, row.customIndex)}
                                                            className="text-emerald-800 hover:text-slate-900 font-bold cursor-pointer"
                                                          >
                                                            +
                                                          </button>
                                                        </div>
                                                        <button
                                                          type="button"
                                                          onClick={() => updateTransferConfig(pkgId, row.originalIndex, "halfDayCount", 0, true, 0, row.isCustom, row.customIndex)}
                                                          className="text-emerald-700 hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                                                          title="Remove Half Day Usage"
                                                        >
                                                          <X size={11} />
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <button
                                                        type="button"
                                                        onClick={() => toggleTransferAddon(pkgId, row.originalIndex, "halfDayCount", row.isCustom, row.customIndex)}
                                                        className="inline-flex items-center gap-1 rounded border border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-100 hover:border-emerald-400 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 transition cursor-pointer"
                                                        title={row.halfDayNote ? `Note: ${row.halfDayNote}` : "Half Day - 40 km / 4 hours"}
                                                      >
                                                        <span>+ Half Day - 40 km / 4 hrs (+₹{row.halfDayRate.toLocaleString("en-IN")}/D)</span>
                                                      </button>
                                                    )}
                                                  </div>

                                                  {/* CONDITIONAL FULL DAY & HALF DAY NOTES */}
                                                  {row.fullDayCount > 0 && (
                                                    <div className="w-full text-[11px] text-amber-900 bg-amber-50/90 border border-amber-200/90 rounded-md px-2.5 py-1.5 space-y-1 leading-snug animate-fadeIn">
                                                      {(Number(row.fullDayExtraPerKmRate) > 0 || Number(row.extraPerKmRate) > 0) && (
                                                        <div className="flex items-center gap-1.5 font-bold text-amber-950">
                                                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                                          <span>Extra km rate: ₹{Number(row.fullDayExtraPerKmRate || row.extraPerKmRate).toLocaleString("en-IN")}/km</span>
                                                        </div>
                                                      )}
                                                      <div className="flex items-start gap-1.5">
                                                        <Info size={13} className="shrink-0 mt-0.5 text-amber-600" />
                                                        <div>
                                                          <strong className="font-bold text-amber-950">Full Day Note: </strong>
                                                          <span className="font-medium text-amber-800">{row.fullDayNote || "Max 80 km / 8 hours limit. Extra km & hours charged separately."}</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}

                                                  {row.halfDayCount > 0 && (
                                                    <div className="w-full text-[11px] text-emerald-900 bg-emerald-50/90 border border-emerald-200/90 rounded-md px-2.5 py-1.5 space-y-1 leading-snug animate-fadeIn">
                                                      {(Number(row.halfDayExtraPerKmRate) > 0 || Number(row.extraPerKmRate) > 0) && (
                                                        <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                                                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                                          <span>Extra km rate: ₹{Number(row.halfDayExtraPerKmRate || row.extraPerKmRate).toLocaleString("en-IN")}/km</span>
                                                        </div>
                                                      )}
                                                      <div className="flex items-start gap-1.5">
                                                        <Info size={13} className="shrink-0 mt-0.5 text-emerald-600" />
                                                        <div>
                                                          <strong className="font-bold text-emerald-950">Half Day Note: </strong>
                                                          <span className="font-medium text-emerald-800">{row.halfDayNote || "Max 40 km / 4 hours limit. Extra km & hours charged separately."}</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </td>

                                            {/* Col 5: PRICE */}
                                            <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                                              {row.isExcluded ? (
                                                <div>
                                                  <span className="text-sm font-semibold text-rose-600 line-through">
                                                    ₹{row.price.toLocaleString("en-IN")}
                                                  </span>
                                                  <p className="text-[11px] text-rose-600 font-bold mt-0.5">Excluded</p>
                                                </div>
                                              ) : (
                                                <div>
                                                  <p className="text-[18.5px] font-black text-slate-900 tracking-tight leading-none">
                                                    <span className="text-[12px] font-bold text-slate-500 uppercase mr-1">INR</span>
                                                    {row.effectiveTotal.toLocaleString("en-IN")}
                                                  </p>
                                                  <p className="text-[12px] text-slate-500 font-normal mt-1">
                                                    ₹{Math.round(row.baseRatePerDay).toLocaleString("en-IN")} × {row.vehiclesCount} Cab × {row.daysCount} D
                                                  </p>
                                                  {row.addonsCost > 0 && (
                                                    <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                                                      +₹{row.addonsCost.toLocaleString("en-IN")} extra options
                                                    </p>
                                                  )}
                                                </div>
                                              )}
                                            </td>

                                            {/* Col 6: ACTION */}
                                            <td className="py-3.5 px-3 align-top text-center">
                                              {row.isCustom ? (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    updatePkgCustom(pkgId, (c) => ({
                                                      ...c,
                                                      customTransfers: c.customTransfers.filter((ct) => ct.id !== row.id),
                                                    }));
                                                    toast.success("Custom transfer removed");
                                                  }}
                                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                                  title="Remove this add-on"
                                                >
                                                  <Trash2 size={14} />
                                                </button>
                                              ) : row.isExcluded ? (
                                                <button
                                                  type="button"
                                                  onClick={() => toggleExcludeTransfer(pkgId, row.originalIndex)}
                                                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition cursor-pointer"
                                                >
                                                  Restore
                                                </button>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => toggleExcludeTransfer(pkgId, row.originalIndex)}
                                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                                  title="Drop / Exclude this transfer"
                                                >
                                                  <X size={14} />
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan={6} className="py-4 px-4 text-center text-xs text-slate-400 italic">
                                            No transfer items in this package.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Transfers Total */}
                              {transfersTotal > 0 && (
                                <div className="flex justify-end pt-1">
                                  <div className="border border-slate-300 rounded-lg px-4 py-1.5 bg-white shadow-2xs inline-flex items-center gap-2 font-sans">
                                    <span className="text-xs font-bold text-slate-900">Transfers Subtotal:</span>
                                    <span className="text-xs font-semibold text-slate-400">INR</span>
                                    <span className="text-sm font-extrabold text-slate-900">
                                      {transfersTotal.toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                          {/* C. ACTIVITIES TABLE WITH DROP/ADD */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                                  <Sparkles size={16} />
                                </span>
                                <h4 className="text-sm font-bold text-slate-900">Activities</h4>
                              </div>
                            </div>

                            {/* Activities Table */}
                            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-700 font-sans">
                                      <th className="py-2.5 px-4 font-bold w-[11%]">DAY</th>
                                      <th className="py-2.5 px-4 font-bold w-[22%]">SERVICE / ACTIVITY NAME</th>
                                      <th className="py-2.5 px-4 font-bold w-[22%]">DESCRIPTION / HIGHLIGHTS</th>
                                      <th className="py-2.5 px-4 font-bold w-[23%]">TOUR TYPE &amp; PAX</th>
                                      <th className="py-2.5 px-4 font-bold text-right w-[18%]">PRICE</th>
                                      <th className="py-2.5 px-3 font-bold text-center w-[4%]">ACTION</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 text-slate-700 font-sans">
                                    {allActivityRows.length > 0 ? (
                                       allActivityRows.map((row, aIdx) => {
                                         const act = row.activity || {};
                                         const isExcluded = row.isExcluded;

                                         const getNormActDay = (r, idx) => {
                                           const item = r?.activity || r || {};
                                           let d = item.day || r.day;
                                           if (!d) return `Day ${idx + 1}`;
                                           d = String(d).trim();
                                           if (/^\d+$/.test(d)) return `Day ${d}`;
                                           if (d.toLowerCase().startsWith("day")) {
                                             const n = d.replace(/day\s*/i, "").trim();
                                             return `Day ${n || idx + 1}`;
                                           }
                                           return d;
                                         };
                                         const dayLabel = getNormActDay(row, aIdx);
                                         const prevDayLabel = aIdx > 0 ? getNormActDay(allActivityRows[aIdx - 1], aIdx - 1) : null;
                                         const nextDayLabel = aIdx < allActivityRows.length - 1 ? getNormActDay(allActivityRows[aIdx + 1], aIdx + 1) : null;
                                         const isFirstOfDay = !prevDayLabel || dayLabel.trim().toLowerCase() !== prevDayLabel.trim().toLowerCase();
                                         const isLastOfDay = !nextDayLabel || dayLabel.trim().toLowerCase() !== nextDayLabel.trim().toLowerCase();

                                         // Calculate Day duration budget (10 Hours = 600 Mins) & used duration
                                         const dayUsedMins = allActivityRows.reduce((acc, r, rIdx) => {
                                           if (r.isExcluded) return acc;
                                           const dLabel = getNormActDay(r, rIdx);
                                           if (dLabel.trim().toLowerCase() === dayLabel.trim().toLowerCase()) {
                                             const durStr = (r.activity && (r.activity.duration || r.activity.hours)) || r.duration || "240 Mins";
                                             const num = parseInt(String(durStr).replace(/[^\d]/g, "")) || 240;
                                             return acc + num;
                                           }
                                           return acc;
                                         }, 0);
                                         const dayBudgetMins = 600; // 10 hours
                                         const remainingMinsForDay = Math.max(0, dayBudgetMins - dayUsedMins);
                                         const hasDayFreeTime = remainingMinsForDay >= 60; // >= 1 Hour free
                                         const remainingHoursText = remainingMinsForDay >= 120 
                                           ? `${Math.floor(remainingMinsForDay / 60)} Hours` 
                                           : `${remainingMinsForDay} Mins`;

                                         const dayNum = parseInt(String(dayLabel).replace(/\D/g, "")) || (aIdx + 1);
                                         let dateStr = "";
                                         if (query?.startDate) {
                                           const startD = new Date(query.startDate);
                                           if (!isNaN(startD.getTime())) {
                                             const d = new Date(startD);
                                             d.setDate(d.getDate() + (dayNum - 1));
                                             dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                                           }
                                         }

                                          const actTitle = act.name || act.serviceName || act.title || "Tour Activity";
                                          const rawActType = row.tourType || act.tourType || "Private Tour";
                                          const tourType = rawActType === "Group Tour" ? "Sharing Tour" : rawActType;
                                          const description = act.description || act.desc || "Includes admission and guided activities";
                                          const cityOrDest = act.city || act.destination || selectedPkg?.destination || query?.destination || "Goa";
                                          const pricingBasis = row.pricingBasis || act.pricingBasis || (tourType === "Sharing Tour" || tourType === "Ticket Tour" ? "Per Pax" : "Per Group");
                                          const isPerPax = row.isPerPax !== undefined ? row.isPerPax : (pricingBasis === "Per Pax" || tourType === "Sharing Tour" || tourType === "Ticket Tour");
                                          const adultsCount = row.adultsCount !== undefined ? row.adultsCount : Number(act.adults || query?.numberOfAdults || 2);
                                          const childrenCount = row.childrenCount !== undefined ? row.childrenCount : Number(act.children || query?.numberOfChildren || 0);
                                          const paxCount = adultsCount + childrenCount;
                                          const baseRate = row.baseRate !== undefined ? row.baseRate : (isPerPax && act.rate ? Number(act.rate) : Number(act.price || 0));
                                          const adultPrice = row.adultPrice !== undefined ? row.adultPrice : (baseRate || 0);
                                          const childPrice = row.childPrice !== undefined ? row.childPrice : Math.round(adultPrice * 0.5);
                                          const effectivePrice = row.effectivePrice !== undefined ? row.effectivePrice : (row.price || act.price || 0);
                                          const rowTotal = row.rowTotal !== undefined ? row.rowTotal : (row.effectivePrice !== undefined ? row.effectivePrice : (isPerPax ? ((adultPrice * adultsCount) + (childPrice * childrenCount)) : baseRate));
                                          const timeSlot = row.timeSlot || act.timeSlot || "08:00";
                                          const operatingDays = act.operatingDays || act.days || "Mon-Sun";
                                          const operatingHours = act.operatingHours || act.hours || "08:00 - 18:00";
                                          const rawDuration = act.duration || "240 Mins (4 Hours)";
                                          const formatDurationBoth = (raw) => {
                                            if (!raw) return "240 Mins (4 Hours)";
                                            const str = String(raw).trim();
                                            if (str.toLowerCase().includes("mins") && str.toLowerCase().includes("hour")) {
                                              return str;
                                            }
                                            const num = parseInt(str, 10);
                                            if (!isNaN(num)) {
                                              const hrs = num / 60;
                                              const hrStr = hrs % 1 === 0 ? hrs : hrs.toFixed(1);
                                              return `${num} Mins (${hrStr} ${hrStr == 1 ? "Hour" : "Hours"})`;
                                            }
                                            return str;
                                          };
                                          const durationText = formatDurationBoth(rawDuration);
                                          const highlightsStr = Array.isArray(act.highlights) ? act.highlights.join(" | ") : (act.highlights || description);

                                         return (
                                           <React.Fragment key={row.id || `act-${aIdx}`}>
                                             <tr className={`hover:bg-slate-50/80 transition-colors ${isExcluded ? "bg-rose-50/40 opacity-60 line-through text-slate-400" : ""}`}>
                                               {/* Day */}
                                               <td className="py-3.5 px-4 align-top">
                                                 {isFirstOfDay ? (
                                                   <>
                                                     <p className="font-bold text-[15px] text-slate-900 leading-snug">{dayLabel}</p>
                                                     {dateStr && <p className="text-[12.5px] text-slate-500 font-normal mt-0.5">{dateStr}</p>}
                                                   </>
                                                 ) : (
                                                   <span className="text-slate-300 font-normal text-xs">—</span>
                                                 )}
                                               </td>

                                               {/* Service / Activity Name */}
                                               <td className="py-3.5 px-4 font-bold text-slate-900 align-top space-y-1.5 min-w-[260px]">
                                                 <div className="flex items-start gap-1.5 min-w-0">
                                                   <Sparkles size={16} className="mt-0.5 text-[#1d4ed8] shrink-0" />
                                                   <span className="font-bold text-[#1d4ed8] text-[15px] leading-snug tracking-tight hover:underline cursor-pointer">{actTitle}</span>
                                                   {row.isCustom && (
                                                     <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 font-bold shrink-0">
                                                       Add-on
                                                     </span>
                                                   )}
                                                 </div>
                                                 <div className="text-[13px] text-slate-500 font-normal">{cityOrDest}</div>

                                                 {/* Badges & Selects */}
                                                 <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                   {/* TYPE select */}
                                                   <div className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-1 text-xs text-slate-700 font-medium">
                                                     <span className="font-semibold text-slate-500 text-[11px]">TYPE:</span>
                                                     <select
                                                       value={tourType}
                                                       disabled={row.isExcluded}
                                                       onChange={(e) => updateActivityConfig(pkgId, row.originalIndex, "tourType", e.target.value, false, undefined, row.isCustom, row.customIndex)}
                                                       className="bg-transparent font-bold text-slate-900 cursor-pointer focus:outline-none text-xs"
                                                     >
                                                       <option value="Private Tour">Private Tour</option>
                                                       <option value="Sharing Tour">Sharing Tour</option>
                                                       <option value="Ticket Tour">Ticket Tour</option>
                                                     </select>
                                                     <ChevronDown size={11} className="text-slate-400 pointer-events-none -ml-0.5" />
                                                   </div>

                                                   {/* DAYS */}
                                                   <div className="inline-flex items-center gap-1 rounded-md bg-emerald-100/80 border border-emerald-200 px-2 py-1 text-xs font-bold text-emerald-800">
                                                     <span className="text-emerald-700 font-semibold text-[11px]">DAYS:</span>
                                                     <span>{operatingDays}</span>
                                                   </div>

                                                   {/* HOURS */}
                                                   <div className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 border border-amber-200 px-2 py-1 text-xs font-bold text-amber-800">
                                                     <Clock3 size={11} className="text-amber-700" />
                                                     <span className="text-amber-700 font-semibold text-[11px]">HOURS:</span>
                                                     <span>{operatingHours}</span>
                                                   </div>

                                                   {/* DURATION */}
                                                   <div className="inline-flex items-center gap-1 rounded-md bg-purple-100/80 border border-purple-200 px-2 py-1 text-xs font-bold text-purple-800">
                                                     <Clock3 size={11} className="text-purple-700" />
                                                     <span className="text-purple-700 font-semibold text-[11px]">DURATION:</span>
                                                     <span>{durationText}</span>
                                                   </div>

                                                   {/* SLOT select */}
                                                   <div className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2 py-1 text-xs font-bold text-purple-800">
                                                     <Clock3 size={11} className="text-purple-600" />
                                                     <span className="text-purple-600 font-semibold text-[11px]">SLOT:</span>
                                                     <select
                                                       value={timeSlot}
                                                       disabled={row.isExcluded}
                                                       onChange={(e) => updateActivityConfig(pkgId, row.originalIndex, "timeSlot", e.target.value, false, undefined, row.isCustom, row.customIndex)}
                                                       className="bg-transparent font-bold text-purple-900 cursor-pointer focus:outline-none text-xs"
                                                     >
                                                       <option value="08:00">08:00</option>
                                                       <option value="09:00">09:00</option>
                                                       <option value="10:00">10:00</option>
                                                       <option value="11:00">11:00</option>
                                                       <option value="14:00">14:00</option>
                                                       <option value="16:00">16:00</option>
                                                     </select>
                                                     <ChevronDown size={11} className="text-purple-500 pointer-events-none -ml-0.5" />
                                                   </div>
                                                 </div>
                                               </td>

                                               {/* Description / Highlights */}
                                               <td className="py-3.5 px-4 align-top leading-relaxed max-w-xs space-y-1">
                                                 <div className="font-bold text-slate-900 text-[13.5px] mb-0.5">
                                                   {tourType} ({adultsCount} {adultsCount === 1 ? "Adult" : "Adults"}{childrenCount > 0 ? `, ${childrenCount} Child` : ""})
                                                 </div>
                                                 <div className="text-[12.5px] text-slate-600 font-normal leading-relaxed">
                                                   {highlightsStr}
                                                 </div>
                                               </td>

                                               {/* Tour Type & Pax */}
                                               <td className="py-3.5 px-4 align-top space-y-1.5 min-w-[200px]">
                                                 <div className="text-sm font-bold text-slate-900 mb-1.5">
                                                   {adultsCount} {adultsCount === 1 ? "Adult" : "Adults"}{childrenCount > 0 ? `, ${childrenCount} Child` : ""} • {tourType}
                                                 </div>

                                                 <div className="flex flex-col gap-1.5">
                                                   {/* Adults Stepper */}
                                                   <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-1 text-xs text-slate-700 shadow-2xs w-fit">
                                                     <span className="text-[11px] font-semibold text-slate-500 uppercase">ADULTS:</span>
                                                     <button
                                                       type="button"
                                                       disabled={row.isExcluded}
                                                       onClick={() => updateActivityConfig(pkgId, row.originalIndex, "adults", -1, false, adultsCount, row.isCustom, row.customIndex)}
                                                       className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                       title="Decrease adults"
                                                     >
                                                       -
                                                     </button>
                                                     <span className="font-bold text-slate-900 px-0.5 text-xs">{adultsCount}</span>
                                                     <button
                                                       type="button"
                                                       disabled={row.isExcluded}
                                                       onClick={() => updateActivityConfig(pkgId, row.originalIndex, "adults", 1, false, adultsCount, row.isCustom, row.customIndex)}
                                                       className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                       title="Increase adults"
                                                     >
                                                       +
                                                     </button>
                                                   </div>

                                                   {/* Child Stepper */}
                                                   <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-1 text-xs text-slate-700 shadow-2xs w-fit">
                                                     <span className="text-[11px] font-semibold text-slate-500 uppercase">CHILD:</span>
                                                     <button
                                                       type="button"
                                                       disabled={row.isExcluded}
                                                       onClick={() => updateActivityConfig(pkgId, row.originalIndex, "children", -1, false, childrenCount, row.isCustom, row.customIndex)}
                                                       className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                       title="Decrease children"
                                                     >
                                                       -
                                                     </button>
                                                     <span className="font-bold text-slate-900 px-0.5 text-xs">{childrenCount}</span>
                                                     <button
                                                       type="button"
                                                       disabled={row.isExcluded}
                                                       onClick={() => updateActivityConfig(pkgId, row.originalIndex, "children", 1, false, childrenCount, row.isCustom, row.customIndex)}
                                                       className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                       title="Increase children"
                                                     >
                                                       +
                                                     </button>
                                                   </div>
                                                 </div>
                                               </td>

                                               {/* Price */}
                                               <td className="py-3.5 px-4 text-right align-top min-w-[140px]">
                                                 <div className="font-bold text-slate-900">
                                                   <span className="text-xs font-bold text-slate-400 mr-1">INR</span>
                                                   <span className="text-[17px] font-bold text-slate-900">{Number(rowTotal || 0).toLocaleString("en-IN")}</span>
                                                 </div>
                                                 <div className="text-xs text-slate-500 font-normal space-y-0.5 mt-0.5">
                                                   <div>Adult: ₹{Number(adultPrice).toLocaleString("en-IN")} × {adultsCount}</div>
                                                   {childrenCount > 0 && <div>Child: ₹{Number(childPrice).toLocaleString("en-IN")} × {childrenCount}</div>}
                                                 </div>

                                                 {/* + Add Activity Button directly inside Price cell under breakdown */}
                                                 {isFirstOfDay && (
                                                   <div className="mt-2 space-y-1.5 flex flex-col items-end">
                                                     <button
                                                       type="button"
                                                       onClick={() => {
                                                         setNewActivityInput((prev) => ({ ...prev, day: dayLabel }));
                                                         setActiveAddActivityRow(activeAddActivityRow === dayLabel ? null : dayLabel);
                                                       }}
                                                       className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-bold shadow-2xs transition cursor-pointer leading-none ${
                                                         hasDayFreeTime
                                                           ? "border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 animate-pulse ring-2 ring-emerald-400/40 shadow-sm"
                                                           : "border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700"
                                                       }`}
                                                     >
                                                       <Plus size={13} className="text-emerald-600 shrink-0" />
                                                       <span>Add Activity</span>
                                                     </button>

                                                     {hasDayFreeTime && (
                                                       <div className="text-[10px] font-semibold text-emerald-900 bg-emerald-100/90 border border-emerald-300 rounded-md px-2 py-1 shadow-2xs text-right leading-tight max-w-[170px]">
                                                         💡 Day has <span className="font-bold text-emerald-950 underline">{remainingHoursText}</span> free time!
                                                       </div>
                                                     )}
                                                   </div>
                                                 )}
                                               </td>

                                               {/* Action */}
                                               <td className="py-3 px-3 text-center align-top">
                                                 {row.isCustom ? (
                                                   <button
                                                     type="button"
                                                     onClick={() => {
                                                       updatePkgCustom(pkgId, (c) => ({
                                                         ...c,
                                                         customActivities: (c.customActivities || []).filter((ca) => ca.id !== row.id),
                                                       }));
                                                       toast.success("Custom activity removed");
                                                     }}
                                                     className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                                     title="Remove this add-on"
                                                   >
                                                     <Trash2 size={14} />
                                                   </button>
                                                 ) : isExcluded ? (
                                                   <button
                                                     type="button"
                                                     onClick={() => toggleExcludeActivity(pkgId, row.originalIndex)}
                                                     className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition cursor-pointer"
                                                   >
                                                     Restore
                                                   </button>
                                                 ) : (
                                                   <button
                                                     type="button"
                                                     onClick={() => toggleExcludeActivity(pkgId, row.originalIndex)}
                                                     className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                                     title="Drop / Exclude this activity"
                                                   >
                                                     <X size={14} />
                                                   </button>
                                                 )}
                                               </td>
                                             </tr>
                                           {((activeAddActivityRow === aIdx) || (isFirstOfDay && activeAddActivityRow === dayLabel)) && (
                                            <tr key={`add-act-form-${aIdx}`} className="bg-emerald-50/20">
                                              <td colSpan={6} className="p-3">
                                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3.5 text-xs shadow-2xs">
                                                  {/* Header & Tour Type */}
                                                  <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2.5">
                                                    <div className="flex items-center gap-2">
                                                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                                      <span className="font-bold text-emerald-950 text-sm">Add Activity / Experience ({dayLabel})</span>
                                                      {hasDayFreeTime && (
                                                        <span className="rounded-full bg-emerald-200 border border-emerald-300 text-emerald-900 font-bold text-[10px] px-2 py-0.5">
                                                          {remainingHoursText} Available
                                                        </span>
                                                      )}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                      <div className="flex items-center gap-1.5">
                                                        <span className="text-[11px] font-semibold text-slate-500">Tour Type:</span>
                                                        <select
                                                          value={newActivityInput.tourType || "Private Tour"}
                                                          onChange={(e) => setNewActivityInput({ ...newActivityInput, tourType: e.target.value })}
                                                          className="rounded-lg border border-blue-300 bg-white px-2.5 py-1 text-xs font-semibold text-blue-900 focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                                                        >
                                                          <option value="Private Tour">Private Tour</option>
                                                          <option value="Sharing Tour">Sharing Tour</option>
                                                          <option value="Ticket Tour">Ticket Tour</option>
                                                        </select>
                                                      </div>

                                                      <button
                                                        type="button"
                                                        onClick={() => setActiveAddActivityRow(null)}
                                                        className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5 rounded hover:bg-emerald-100/50"
                                                      >
                                                        <X size={16} />
                                                      </button>
                                                    </div>
                                                  </div>
                                                  {/* Select DMC Contracted Activity Dropdown */}
                                                  {(() => {
                                                    const currentDestination = selectedPkg?.destination || query?.destination || "Goa";
                                                    const GOA_SUB_CITIES = [
                                                      "goa", "ponda", "panaji", "panjim", "calangute", "candolim", "baga",
                                                      "old goa", "south goa", "north goa", "anjuna", "colva",
                                                      "vagator", "margao", "mapusa", "vasco", "arambol", "morjim", "dabolim"
                                                    ];
                                                    const matchDest = (item, dest) => {
                                                      const destClean = String(dest || "").trim().toLowerCase();
                                                      if (!destClean) return true;
                                                      const city = String(item.city || "").trim().toLowerCase();
                                                      const itemDest = String(item.destination || "").trim().toLowerCase();
                                                      const title = String(item.title || item.serviceName || item.name || "").trim().toLowerCase();
                                                      const isGoaPackage = GOA_SUB_CITIES.some((sub) => destClean.includes(sub));
                                                      if (isGoaPackage) {
                                                        const isItemInGoa = GOA_SUB_CITIES.some(
                                                          (sub) => city.includes(sub) || itemDest.includes(sub) || title.includes(sub)
                                                        );
                                                        if (isItemInGoa) return true;
                                                      }
                                                      if (city && (city.includes(destClean) || destClean.includes(city))) return true;
                                                      if (itemDest && (itemDest.includes(destClean) || destClean.includes(itemDest))) return true;
                                              if (title && title.includes(destClean)) return true;
                                                      return false;
                                                    };

                                                    const destinationDmcActivities = (liveDmcActivities || []).filter((a) =>
                                                      matchDest(a, currentDestination)
                                                    );
                                                    const availableActivities = destinationDmcActivities.length > 0 ? destinationDmcActivities : liveDmcActivities;
                                                    const searchQuery = (newActivityInput.searchQuery || "").trim().toLowerCase();
                                                    const filteredActivities = availableActivities.filter((a) => {
                                                      if (!searchQuery) return true;
                                                      const title = String(a.name || a.serviceName || a.title || "").toLowerCase();
                                                      const city = String(a.city || a.destination || "").toLowerCase();
                                                      const supp = String(a.supplierName || a.dmcName || "").toLowerCase();
                                                      return title.includes(searchQuery) || city.includes(searchQuery) || supp.includes(searchQuery);
                                                    });

                                                    // Helper to parse activity duration in minutes
                                                    const parseActMins = (item) => {
                                                      const durStr = item.duration || item.hours || "240 Mins";
                                                      return parseInt(String(durStr).replace(/[^\d]/g, "")) || 240;
                                                    };

                                                    // Smart sorting: activities fitting within remainingMinsForDay come FIRST!
                                                    const sortedActivities = [...filteredActivities].sort((a, b) => {
                                                      if (!hasDayFreeTime) return 0;
                                                      const aMins = parseActMins(a);
                                                      const bMins = parseActMins(b);
                                                      const aFits = aMins <= remainingMinsForDay;
                                                      const bFits = bMins <= remainingMinsForDay;
                                                      if (aFits && !bFits) return -1;
                                                      if (!aFits && bFits) return 1;
                                                      return aMins - bMins;
                                                    });

                                                    return (
                                                      <div className="relative mb-3.5 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                          <label className="text-[11px] font-bold text-emerald-900 uppercase flex items-center gap-1.5">
                                                            <Sparkles size={13} className="text-emerald-600" />
                                                            SELECT DMC CONTRACTED ACTIVITY ({currentDestination.toUpperCase()})
                                                          </label>
                                                          {availableActivities.length > 0 && (
                                                            <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                              {availableActivities.length} DMC services for {currentDestination}
                                                            </span>
                                                          )}
                                                        </div>

                                                        {/* Search Input Box */}
                                                        <div className="relative">
                                                          <input
                                                            type="text"
                                                            placeholder="Search DMC contracted activities by name, location or supplier..."
                                                            value={newActivityInput.searchQuery !== undefined ? newActivityInput.searchQuery : (newActivityInput.name || "")}
                                                            onFocus={() => setNewActivityInput((prev) => ({ ...prev, isDropdownOpen: true }))}
                                                            onChange={(e) => {
                                                              const val = e.target.value;
                                                              setNewActivityInput((prev) => ({
                                                                ...prev,
                                                                searchQuery: val,
                                                                name: val,
                                                                isDropdownOpen: true,
                                                              }));
                                                            }}
                                                            className="w-full rounded-lg border border-emerald-300 bg-white pl-3 pr-8 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition shadow-2xs"
                                                          />
                                                          <button
                                                            type="button"
                                                            onClick={() => setNewActivityInput((prev) => ({ ...prev, isDropdownOpen: !prev.isDropdownOpen }))}
                                                            className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                                          >
                                                            <ChevronDown size={15} />
                                                          </button>
                                                        </div>

                                                        {/* Rich Dropdown Panel */}
                                                        {newActivityInput.isDropdownOpen && (
                                                          <div className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto rounded-xl border border-emerald-200 bg-white shadow-xl z-50 divide-y divide-slate-100 [scrollbar-width:thin]">
                                                            {sortedActivities.length === 0 ? (
                                                              <div className="p-3.5 text-xs text-slate-500 italic text-center">
                                                                No matching DMC activities found. You can type custom activity details below.
                                                              </div>
                                                            ) : (
                                                              sortedActivities.map((dmcAct, aIdx) => {
                                                                const actTitle = dmcAct.name || dmcAct.serviceName || dmcAct.title || "Tour Activity";
                                                                const isSelected = String(newActivityInput.dmcActivityId) === String(dmcAct._id || dmcAct.id);
                                                                const adP = Number(dmcAct.adultPrice || dmcAct.price || dmcAct.rate || 1500);
                                                                const chP = Number(dmcAct.childPrice || Math.round(adP * 0.5) || 750);
                                                                const cityLoc = dmcAct.city ? `Goa (${dmcAct.city})` : "Goa";
                                                                const actMins = parseActMins(dmcAct);
                                                                const fitsInDay = hasDayFreeTime && actMins <= remainingMinsForDay;

                                                                return (
                                                                  <div
                                                                    key={dmcAct._id || dmcAct.id || aIdx}
                                                                    onClick={() => {
                                                                      const adCount = Number(newActivityInput.adults || 1);
                                                                      const chCount = Number(newActivityInput.children || 0);

                                                                      setNewActivityInput((prev) => ({
                                                                        ...prev,
                                                                        dmcActivityId: dmcAct._id || dmcAct.id,
                                                                        name: actTitle,
                                                                        searchQuery: actTitle,
                                                                        tourType: dmcAct.tourType || "Private Tour",
                                                                        adultPrice: adP,
                                                                        childPrice: chP,
                                                                        price: (adP * adCount) + (chP * chCount),
                                                                        selectedSlot: dmcAct.slot || dmcAct.selectedSlot || "08:00",
                                                                        description: dmcAct.description || "Tour activity with admission tickets",
                                                                        isDropdownOpen: false,
                                                                      }));
                                                                    }}
                                                                    className={`p-3 hover:bg-emerald-50/60 cursor-pointer transition flex items-center justify-between gap-3 ${
                                                                      isSelected ? "bg-emerald-50/90 border-l-4 border-l-emerald-600" : ""
                                                                    }`}
                                                                  >
                                                                    <div className="min-w-0 flex-1 space-y-0.5">
                                                                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate flex-wrap">
                                                                        <span>{actTitle}</span>
                                                                        {isSelected && (
                                                                          <span className="rounded bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 font-bold shrink-0">
                                                                            ✓ Selected
                                                                          </span>
                                                                        )}
                                                                        {fitsInDay && (
                                                                          <span className="rounded-full bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-[9px] px-2 py-0.2 shrink-0">
                                                                            ⭐ Fits in {remainingHoursText} free
                                                                          </span>
                                                                        )}
                                                                      </p>
                                                                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 flex-wrap">
                                                                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                                                          <MapPin size={11} className="text-rose-500 shrink-0" />
                                                                          {cityLoc}
                                                                        </span>
                                                                        <span>• Experience</span>
                                                                        <span>• Days: {dmcAct.operatingDays || "Mon-Sun"}</span>
                                                                      </p>
                                                                      {dmcAct.supplierName && (
                                                                        <p className="text-[10.5px] font-semibold text-emerald-700">
                                                                          Supplier: {dmcAct.supplierName}
                                                                        </p>
                                                                      )}
                                                                    </div>
                                                                    <div className="text-right shrink-0">
                                                                      <p className="text-xs font-black text-slate-900">
                                                                        ₹{adP.toLocaleString("en-IN")}{" "}
                                                                        <span className="text-[10px] font-semibold text-slate-500">/ adult</span>
                                                                      </p>
                                                                      {chP > 0 && (
                                                                        <p className="text-[10px] font-semibold text-slate-500">
                                                                          Child: ₹{chP.toLocaleString("en-IN")}
                                                                        </p>
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                );
                                                              })
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })()}

                                                  {/* Main Inputs Grid */}
                                                  <div className="space-y-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                      <div className="sm:col-span-2">
                                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                          Activity / Experience Name
                                                        </label>
                                                        <input
                                                          type="text"
                                                          placeholder="e.g. Scuba Diving, Adventure Tour, Desert Safari..."
                                                          value={newActivityInput.name}
                                                          onChange={(e) => setNewActivityInput({ ...newActivityInput, name: e.target.value, searchQuery: e.target.value })}
                                                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                                                        />
                                                      </div>

                                                      <div>
                                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                          Day
                                                        </label>
                                                        <select
                                                          value={newActivityInput.day}
                                                          onChange={(e) => setNewActivityInput({ ...newActivityInput, day: e.target.value })}
                                                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
                                                        >
                                                          {Array.from({ length: 10 }).map((_, i) => (
                                                            <option key={i} value={`Day ${i + 1}`}>
                                                              Day {i + 1}
                                                            </option>
                                                          ))}
                                                        </select>
                                                      </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                                                      <div>
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                          Adult Price (₹)
                                                        </label>
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          placeholder="1500"
                                                          value={newActivityInput.adultPrice}
                                                          onChange={(e) => {
                                                            const ap = Number(e.target.value || 0);
                                                            const cp = Number(newActivityInput.childPrice || 0);
                                                            const ad = Number(newActivityInput.adults || 1);
                                                            const ch = Number(newActivityInput.children || 0);
                                                            setNewActivityInput({
                                                              ...newActivityInput,
                                                              adultPrice: e.target.value,
                                                              price: (ap * ad) + (cp * ch),
                                                            });
                                                          }}
                                                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                                                        />
                                                      </div>

                                                      <div>
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                          Child Price (₹)
                                                        </label>
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          placeholder="750"
                                                          value={newActivityInput.childPrice}
                                                          onChange={(e) => {
                                                            const cp = Number(e.target.value || 0);
                                                            const ap = Number(newActivityInput.adultPrice || 0);
                                                            const ad = Number(newActivityInput.adults || 1);
                                                            const ch = Number(newActivityInput.children || 0);
                                                            setNewActivityInput({
                                                              ...newActivityInput,
                                                              childPrice: e.target.value,
                                                              price: (ap * ad) + (cp * ch),
                                                            });
                                                          }}
                                                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                                                        />
                                                      </div>

                                                      <div>
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                          Adults
                                                        </label>
                                                        <input
                                                          type="number"
                                                          min="1"
                                                          value={newActivityInput.adults}
                                                          onChange={(e) => {
                                                            const ad = Math.max(1, Number(e.target.value || 1));
                                                            const ch = Number(newActivityInput.children || 0);
                                                            const ap = Number(newActivityInput.adultPrice || 0);
                                                            const cp = Number(newActivityInput.childPrice || 0);
                                                            setNewActivityInput({
                                                              ...newActivityInput,
                                                              adults: ad,
                                                              price: (ap * ad) + (cp * ch),
                                                            });
                                                          }}
                                                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none text-center"
                                                        />
                                                      </div>

                                                      <div>
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                          Children
                                                        </label>
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          value={newActivityInput.children}
                                                          onChange={(e) => {
                                                            const ch = Math.max(0, Number(e.target.value || 0));
                                                            const ad = Number(newActivityInput.adults || 1);
                                                            const ap = Number(newActivityInput.adultPrice || 0);
                                                            const cp = Number(newActivityInput.childPrice || 0);
                                                            setNewActivityInput({
                                                              ...newActivityInput,
                                                              children: ch,
                                                              price: (ap * ad) + (cp * ch),
                                                            });
                                                          }}
                                                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none text-center"
                                                        />
                                                      </div>

                                                      <div>
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                          Slot / Time
                                                        </label>
                                                        <select
                                                          value={newActivityInput.selectedSlot || "08:00"}
                                                          onChange={(e) => setNewActivityInput({ ...newActivityInput, selectedSlot: e.target.value })}
                                                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
                                                        >
                                                          <option value="08:00">08:00</option>
                                                          <option value="09:00">09:00</option>
                                                          <option value="10:00">10:00</option>
                                                          <option value="11:30">11:30</option>
                                                          <option value="14:00">14:00</option>
                                                          <option value="15:00">15:00</option>
                                                          <option value="18:00">18:00</option>
                                                        </select>
                                                      </div>

                                                      <div>
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                          Total (₹)
                                                        </label>
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          value={newActivityInput.price}
                                                          onChange={(e) => setNewActivityInput({ ...newActivityInput, price: e.target.value })}
                                                          className="w-full rounded-lg border border-emerald-400 bg-emerald-50/50 px-2.5 py-1.5 text-xs font-bold text-emerald-950 focus:border-emerald-600 focus:outline-none"
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {/* Form Buttons */}
                                                  <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200/60">
                                                    <button
                                                      type="button"
                                                      onClick={() => setActiveAddActivityRow(null)}
                                                      className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer transition"
                                                    >
                                                      Cancel
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        if (!newActivityInput.name) {
                                                          toast.error("Please enter activity name");
                                                          return;
                                                        }
                                                        const finalAdults = Number(newActivityInput.adults || 1);
                                                        const finalChildren = Number(newActivityInput.children || 0);
                                                        const finalAdultPrice = Number(newActivityInput.adultPrice || 0);
                                                        const finalChildPrice = Number(newActivityInput.childPrice || 0);
                                                        const computedTotal = Number(newActivityInput.price || (finalAdultPrice * finalAdults) + (finalChildPrice * finalChildren));

                                                        updatePkgCustom(pkgId, (c) => ({
                                                          ...c,
                                                          customActivities: [
                                                            ...(c.customActivities || []),
                                                            {
                                                              id: `custom-act-${Date.now()}`,
                                                              name: newActivityInput.name,
                                                              tourType: newActivityInput.tourType || "Private Tour",
                                                              day: newActivityInput.day || "Day 2",
                                                              adultPrice: finalAdultPrice,
                                                              childPrice: finalChildPrice,
                                                              adults: finalAdults,
                                                              children: finalChildren,
                                                              selectedSlot: newActivityInput.selectedSlot || "08:00",
                                                              price: computedTotal,
                                                              description: newActivityInput.description || "Tour activity with admission tickets",
                                                            },
                                                          ],
                                                        }));
                                                        toast.success("Custom activity added to package!");
                                                        setActiveAddActivityRow(null);
                                                        setNewActivityInput({
                                                          name: "",
                                                          tourType: "Private Tour",
                                                          day: "Day 2",
                                                          adultPrice: 1500,
                                                          childPrice: 750,
                                                          adults: query?.numberOfAdults || 2,
                                                          children: query?.numberOfChildren || 0,
                                                          selectedSlot: "08:00",
                                                          price: 3000,
                                                          description: "Tour activity with admission tickets",
                                                        });
                                                      }}
                                                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition"
                                                    >
                                                      + Add Activity
                                                    </button>
                                                  </div>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                          </React.Fragment>
                                          );
                                        })
                                      ) : (
                                        <tr>
                                          <td colSpan={6} className="py-4 px-4 text-center text-xs text-slate-400 italic">
                                            No activities in this package.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Activity Subtotal */}
                              {activitiesTotal > 0 && (
                                <div className="flex justify-end pt-1">
                                  <div className="border border-slate-300 rounded-lg px-4 py-1.5 bg-white shadow-2xs inline-flex items-center gap-2 font-sans">
                                    <span className="text-xs font-bold text-slate-900">Activities Subtotal:</span>
                                    <span className="text-xs font-semibold text-slate-400">INR</span>
                                    <span className="text-sm font-extrabold text-slate-900">
                                      {activitiesTotal.toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                              {/* 2.4 SIGHTSEEING SECTION */}
                              <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
                                      <Landmark size={16} />
                                    </span>
                                    <h4 className="text-sm font-bold text-slate-900">Sightseeing</h4>
                                  </div>
                                </div>

                                {/* Sightseeing Table */}
                                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-700 font-sans">
                                          <th className="py-2.5 px-4 font-bold w-[11%]">DAY</th>
                                          <th className="py-2.5 px-4 font-bold w-[22%]">SIGHTSEEING TOUR NAME</th>
                                          <th className="py-2.5 px-4 font-bold w-[22%]">DESCRIPTION / HIGHLIGHTS</th>
                                          <th className="py-2.5 px-4 font-bold w-[23%]">TOUR TYPE &amp; PAX</th>
                                          <th className="py-2.5 px-4 font-bold text-right w-[18%]">PRICE</th>
                                          <th className="py-2.5 px-3 font-bold text-center w-[4%]">ACTION</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-200 text-slate-700 font-sans">
                                        {allSightseeingRows.length > 0 ? (
                                          allSightseeingRows.map((row, sIdx) => {
                                            const sight = row.sightseeing || {};
                                            const isExcluded = row.isExcluded;

                                            const getNormSightDay = (r, idx) => {
                                              const item = r?.sightseeing || r || {};
                                              let d = item.day || r.day;
                                              if (!d) return `Day ${idx + 1}`;
                                              d = String(d).trim();
                                              if (/^\d+$/.test(d)) return `Day ${d}`;
                                              if (d.toLowerCase().startsWith("day")) {
                                                const n = d.replace(/day\s*/i, "").trim();
                                                return `Day ${n || idx + 1}`;
                                              }
                                              return d;
                                            };
                                            const dayLabel = getNormSightDay(row, sIdx);
                                            const prevDayLabel = sIdx > 0 ? getNormSightDay(allSightseeingRows[sIdx - 1], sIdx - 1) : null;
                                            const nextDayLabel = sIdx < allSightseeingRows.length - 1 ? getNormSightDay(allSightseeingRows[sIdx + 1], sIdx + 1) : null;
                                            const isFirstOfDay = !prevDayLabel || dayLabel.trim().toLowerCase() !== prevDayLabel.trim().toLowerCase();
                                            const isLastOfDay = !nextDayLabel || dayLabel.trim().toLowerCase() !== nextDayLabel.trim().toLowerCase();

                                            // Calculate Day duration budget (10 Hours = 600 Mins) & used duration
                                            const dayUsedMins = allSightseeingRows.reduce((acc, r, rIdx) => {
                                              if (r.isExcluded) return acc;
                                              const dLabel = getNormSightDay(r, rIdx);
                                              if (dLabel.trim().toLowerCase() === dayLabel.trim().toLowerCase()) {
                                                const durStr = (r.sightseeing && (r.sightseeing.duration || r.sightseeing.hours)) || r.duration || "240 Mins";
                                                const num = parseInt(String(durStr).replace(/[^\d]/g, "")) || 240;
                                                return acc + num;
                                              }
                                              return acc;
                                            }, 0);
                                            const dayBudgetMins = 600; // 10 hours
                                            const remainingMinsForDay = Math.max(0, dayBudgetMins - dayUsedMins);
                                            const hasDayFreeTime = remainingMinsForDay >= 60; // >= 1 Hour free
                                            const remainingHoursText = remainingMinsForDay >= 120 
                                              ? `${Math.floor(remainingMinsForDay / 60)} Hours` 
                                              : `${remainingMinsForDay} Mins`;

                                            const dayNum = parseInt(String(dayLabel).replace(/\D/g, "")) || (sIdx + 1);
                                            let dateStr = "";
                                            if (query?.startDate) {
                                              const startD = new Date(query.startDate);
                                              if (!isNaN(startD.getTime())) {
                                                const d = new Date(startD);
                                                d.setDate(d.getDate() + (dayNum - 1));
                                                dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                                              }
                                            }

                                            const sightTitle = sight.name || sight.serviceName || sight.title || "Sightseeing Tour";
                                            const rawSightType = row.tourType || sight.tourType || "Private Tour";
                                            const tourType = rawSightType === "Group Tour" ? "Sharing Tour" : rawSightType;
                                            const description = sight.description || sight.desc || "Guided local sightseeing tour with transfers included.";
                                            const cityOrDest = sight.city || sight.destination || selectedPkg?.destination || query?.destination || "Goa";
                                            const pricingBasis = row.pricingBasis || sight.pricingBasis || (tourType === "Sharing Tour" || tourType === "Ticket Tour" ? "Per Pax" : "Per Group");
                                            const isPerPax = row.isPerPax !== undefined ? row.isPerPax : (pricingBasis === "Per Pax" || tourType === "Sharing Tour" || tourType === "Ticket Tour");
                                            const adultsCount = row.adultsCount !== undefined ? row.adultsCount : Number(sight.adults || query?.numberOfAdults || 2);
                                            const childrenCount = row.childrenCount !== undefined ? row.childrenCount : Number(sight.children || query?.numberOfChildren || 0);
                                            const paxCount = adultsCount + childrenCount;
                                            const baseRate = row.baseRate !== undefined ? row.baseRate : (isPerPax && sight.rate ? Number(sight.rate) : Number(sight.price || 0));
                                            const adultPrice = row.adultPrice !== undefined ? row.adultPrice : (baseRate || 0);
                                            const childPrice = row.childPrice !== undefined ? row.childPrice : Math.round(adultPrice * 0.5);
                                            const effectivePrice = row.effectivePrice !== undefined ? row.effectivePrice : (row.price || sight.price || 0);
                                            const rowTotal = row.rowTotal !== undefined ? row.rowTotal : (row.effectivePrice !== undefined ? row.effectivePrice : (isPerPax ? ((adultPrice * adultsCount) + (childPrice * childrenCount)) : baseRate));
                                            const timeSlot = row.timeSlot || sight.timeSlot || "08:00";
                                            const operatingDays = sight.operatingDays || sight.days || "Mon-Sun";
                                            const operatingHours = sight.operatingHours || sight.hours || "08:00 - 18:00";
                                            const rawDuration = sight.duration || "240 Mins (4 Hours)";
                                            const formatDurationBoth = (raw) => {
                                              if (!raw) return "240 Mins (4 Hours)";
                                              const str = String(raw).trim();
                                              if (str.toLowerCase().includes("mins") && str.toLowerCase().includes("hour")) {
                                                return str;
                                              }
                                              const num = parseInt(str, 10);
                                              if (!isNaN(num)) {
                                                const hrs = num / 60;
                                                const hrStr = hrs % 1 === 0 ? hrs : hrs.toFixed(1);
                                                return `${num} Mins (${hrStr} ${hrStr == 1 ? "Hour" : "Hours"})`;
                                              }
                                              return str;
                                            };
                                            const durationText = formatDurationBoth(rawDuration);
                                            const getAvailableSlots = (itemObj, curSlot) => {
                                              const defaultSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "16:00"];
                                              let custom = [];
                                              if (Array.isArray(itemObj?.timeSlots)) custom.push(...itemObj.timeSlots);
                                              if (Array.isArray(itemObj?.availableSlots)) custom.push(...itemObj.availableSlots);
                                              if (Array.isArray(itemObj?.slots)) custom.push(...itemObj.slots);
                                              const single = itemObj?.slot || itemObj?.selectedSlot || itemObj?.timeSlot || itemObj?.time_slot;
                                              if (single && typeof single === "string") {
                                                single.split(",").forEach((s) => { if (s.trim()) custom.push(s.trim()); });
                                              }
                                              if (curSlot && typeof curSlot === "string") {
                                                curSlot.split(",").forEach((s) => { if (s.trim()) custom.push(s.trim()); });
                                              }
                                              return Array.from(new Set([...custom, ...defaultSlots])).filter(Boolean);
                                            };
                                            const sightSlots = getAvailableSlots(sight, timeSlot);
                                            const highlightsStr = Array.isArray(sight.highlights) ? sight.highlights.join(" | ") : (sight.highlights || description);

                                            return (
                                              <React.Fragment key={row.id || `sight-${sIdx}`}>
                                                <tr className={`hover:bg-slate-50/80 transition-colors ${isExcluded ? "bg-rose-50/40 opacity-60 line-through text-slate-400" : ""}`}>
                                                  {/* Day */}
                                                  <td className="py-3.5 px-4 align-top">
                                                    {isFirstOfDay ? (
                                                      <>
                                                        <p className="font-bold text-[15px] text-slate-900 leading-snug">{dayLabel}</p>
                                                        {dateStr && <p className="text-[12.5px] text-slate-500 font-normal mt-0.5">{dateStr}</p>}
                                                      </>
                                                    ) : (
                                                      <span className="text-slate-300 font-normal text-xs">—</span>
                                                    )}
                                                  </td>
                                                    {/* Service / Sightseeing Name */}
                                                   <td className="py-3.5 px-4 font-bold text-slate-900 align-top space-y-1.5 min-w-[260px]">
                                                     <div className="flex items-start gap-1.5 min-w-0">
                                                       <Landmark size={16} className="mt-0.5 text-[#1d4ed8] shrink-0" />
                                                       <span className="font-bold text-[#1d4ed8] text-[15px] leading-snug tracking-tight hover:underline cursor-pointer">{sightTitle}</span>
                                                       {row.isCustom && (
                                                         <span className="rounded bg-violet-100 text-violet-800 text-[10px] px-1.5 py-0.5 font-bold shrink-0">
                                                           Add-on
                                                         </span>
                                                       )}
                                                     </div>
                                                     <div className="text-[13px] text-slate-500 font-normal">{cityOrDest}</div>

                                                     {/* Badges & Selects */}
                                                     <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                       {/* TYPE select */}
                                                       <label className="relative inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-1 text-xs text-slate-700 font-medium cursor-pointer">
                                                         <span className="font-semibold text-slate-500 text-[11px] pointer-events-none">TYPE:</span>
                                                         <select
                                                           value={tourType}
                                                           disabled={row.isExcluded}
                                                           onChange={(e) => updateSightseeingConfig(pkgId, row.originalIndex, "tourType", e.target.value, false, undefined, row.isCustom, row.customIndex)}
                                                           className="bg-transparent font-bold text-slate-900 cursor-pointer focus:outline-none text-xs appearance-none pr-3"
                                                         >
                                                           <option value="Private Tour">Private Tour</option>
                                                           <option value="Sharing Tour">Sharing Tour</option>
                                                           <option value="Ticket Tour">Ticket Tour</option>
                                                         </select>
                                                         <ChevronDown size={11} className="text-slate-400 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
                                                       </label>

                                                       {/* DAYS */}
                                                       <div className="inline-flex items-center gap-1 rounded-md bg-emerald-100/80 border border-emerald-200 px-2 py-1 text-xs font-bold text-emerald-800">
                                                         <span className="text-emerald-700 font-semibold text-[11px]">DAYS:</span>
                                                         <span>{operatingDays}</span>
                                                       </div>

                                                       {/* HOURS */}
                                                       <div className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 border border-amber-200 px-2 py-1 text-xs font-bold text-amber-800">
                                                         <Clock3 size={11} className="text-amber-700" />
                                                         <span className="text-amber-700 font-semibold text-[11px]">HOURS:</span>
                                                         <span>{operatingHours}</span>
                                                       </div>

                                                       {/* DURATION */}
                                                       <div className="inline-flex items-center gap-1 rounded-md bg-purple-100/80 border border-purple-200 px-2 py-1 text-xs font-bold text-purple-800">
                                                         <Clock3 size={11} className="text-purple-700" />
                                                         <span className="text-purple-700 font-semibold text-[11px]">DURATION:</span>
                                                         <span>{durationText}</span>
                                                       </div>

                                                       {/* SLOT select */}
                                                       <label className="relative inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2 py-1 text-xs font-bold text-purple-800 cursor-pointer">
                                                         <Clock3 size={11} className="text-purple-600 pointer-events-none" />
                                                         <span className="text-purple-600 font-semibold text-[11px] pointer-events-none">SLOT:</span>
                                                         <select
                                                           value={timeSlot}
                                                           disabled={row.isExcluded}
                                                           onChange={(e) => updateSightseeingConfig(pkgId, row.originalIndex, "timeSlot", e.target.value, false, undefined, row.isCustom, row.customIndex)}
                                                           className="bg-transparent font-bold text-purple-900 cursor-pointer focus:outline-none text-xs appearance-none pr-3"
                                                         >
                                                           {sightSlots.map((s) => (
                                                             <option key={s} value={s}>{s}</option>
                                                           ))}
                                                         </select>
                                                         <ChevronDown size={11} className="text-purple-500 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
                                                       </label>
                                                     </div>
                                                   </td>

                                                   {/* Description / Highlights */}
                                                   <td className="py-3.5 px-4 align-top leading-relaxed max-w-xs space-y-1">
                                                     <div className="font-bold text-slate-900 text-[13.5px] mb-0.5">
                                                       {tourType} ({adultsCount} {adultsCount === 1 ? "Adult" : "Adults"}{childrenCount > 0 ? `, ${childrenCount} Child` : ""})
                                                     </div>
                                                     <div className="text-[12.5px] text-slate-600 font-normal leading-relaxed">
                                                       {highlightsStr}
                                                     </div>
                                                   </td>

                                                   {/* Tour Type & Pax */}
                                                   <td className="py-3.5 px-4 align-top space-y-1.5 min-w-[200px]">
                                                     <div className="text-sm font-bold text-slate-900 mb-1.5">
                                                       {adultsCount} {adultsCount === 1 ? "Adult" : "Adults"}{childrenCount > 0 ? `, ${childrenCount} Child` : ""} • {tourType}
                                                     </div>

                                                     <div className="flex flex-col gap-1.5">
                                                       {/* Adults Stepper */}
                                                       <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-1 text-xs text-slate-700 shadow-2xs w-fit">
                                                         <span className="text-[11px] font-semibold text-slate-500 uppercase">ADULTS:</span>
                                                         <button
                                                           type="button"
                                                           disabled={row.isExcluded}
                                                           onClick={() => updateSightseeingConfig(pkgId, row.originalIndex, "adults", -1, false, adultsCount, row.isCustom, row.customIndex)}
                                                           className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                           title="Decrease adults"
                                                         >
                                                           -
                                                         </button>
                                                         <span className="font-bold text-slate-900 px-0.5 text-xs">{adultsCount}</span>
                                                         <button
                                                           type="button"
                                                           disabled={row.isExcluded}
                                                           onClick={() => updateSightseeingConfig(pkgId, row.originalIndex, "adults", 1, false, adultsCount, row.isCustom, row.customIndex)}
                                                           className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                           title="Increase adults"
                                                         >
                                                           +
                                                         </button>
                                                       </div>

                                                       {/* Child Stepper */}
                                                       <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-1 text-xs text-slate-700 shadow-2xs w-fit">
                                                         <span className="text-[11px] font-semibold text-slate-500 uppercase">CHILD:</span>
                                                         <button
                                                           type="button"
                                                           disabled={row.isExcluded}
                                                           onClick={() => updateSightseeingConfig(pkgId, row.originalIndex, "children", -1, false, childrenCount, row.isCustom, row.customIndex)}
                                                           className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                           title="Decrease children"
                                                         >
                                                           -
                                                         </button>
                                                         <span className="font-bold text-slate-900 px-0.5 text-xs">{childrenCount}</span>
                                                         <button
                                                           type="button"
                                                           disabled={row.isExcluded}
                                                           onClick={() => updateSightseeingConfig(pkgId, row.originalIndex, "children", 1, false, childrenCount, row.isCustom, row.customIndex)}
                                                           className="h-4 w-4 rounded flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs cursor-pointer leading-none disabled:opacity-40"
                                                           title="Increase children"
                                                         >
                                                           +
                                                         </button>
                                                       </div>
                                                     </div>
                                                   </td>

                                                   {/* Price */}
                                                   <td className="py-3.5 px-4 text-right align-top min-w-[140px]">
                                                     <div className="font-bold text-slate-900">
                                                       <span className="text-xs font-bold text-slate-400 mr-1">INR</span>
                                                       <span className="text-[17px] font-bold text-slate-900">{Number(rowTotal || 0).toLocaleString("en-IN")}</span>
                                                     </div>
                                                     <div className="text-xs text-slate-500 font-normal space-y-0.5 mt-0.5">
                                                       <div>Adult: ₹{Number(adultPrice).toLocaleString("en-IN")} × {adultsCount}</div>
                                                       {childrenCount > 0 && <div>Child: ₹{Number(childPrice).toLocaleString("en-IN")} × {childrenCount}</div>}
                                                     </div>
                                                     {isFirstOfDay && (
                                                       <div className="mt-2 space-y-1.5 flex flex-col items-end">
                                                         <button
                                                           type="button"
                                                           onClick={() => {
                                                             setNewSightseeingInput((prev) => ({ ...prev, day: dayLabel }));
                                                             setActiveAddSightseeingRow(activeAddSightseeingRow === dayLabel ? null : dayLabel);
                                                           }}
                                                           className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-bold shadow-2xs transition cursor-pointer leading-none ${
                                                             hasDayFreeTime
                                                               ? "border-violet-400 bg-violet-50 hover:bg-violet-100 text-violet-800 animate-pulse ring-2 ring-violet-400/40 shadow-sm"
                                                               : "border-violet-300 bg-white hover:bg-violet-50 text-violet-700"
                                                           }`}
                                                         >
                                                           <Plus size={13} className="text-violet-600 shrink-0" />
                                                           <span>Add Sightseeing</span>
                                                         </button>

                                                         {hasDayFreeTime && (
                                                           <div className="text-[10px] font-semibold text-violet-900 bg-violet-100/90 border border-violet-300 rounded-md px-2 py-1 shadow-2xs text-right leading-tight max-w-[170px]">
                                                             💡 Day has <span className="font-bold text-violet-950 underline">{remainingHoursText}</span> free time!
                                                           </div>
                                                         )}
                                                       </div>
                                                     )}
                                                   </td>

                                                  {/* Action */}
                                                  <td className="py-3 px-3 text-center align-top">
                                                    {row.isCustom ? (
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          updatePkgCustom(pkgId, (c) => ({
                                                            ...c,
                                                            customSightseeing: (c.customSightseeing || []).filter((cs) => cs.id !== row.id),
                                                          }));
                                                          toast.success("Custom sightseeing removed");
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                                        title="Remove this add-on"
                                                      >
                                                        <Trash2 size={14} />
                                                      </button>
                                                    ) : isExcluded ? (
                                                      <button
                                                        type="button"
                                                        onClick={() => toggleExcludeSightseeing(pkgId, row.originalIndex)}
                                                        className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition cursor-pointer"
                                                      >
                                                        Restore
                                                      </button>
                                                    ) : (
                                                      <button
                                                        type="button"
                                                        onClick={() => toggleExcludeSightseeing(pkgId, row.originalIndex)}
                                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                                        title="Drop / Exclude this sightseeing"
                                                      >
                                                        <X size={14} />
                                                      </button>
                                                    )}
                                                  </td>
                                                </tr>

                                                {/* Inline Form Expanding DIRECTLY INSIDE THIS ROW CARD */}
                                                {((activeAddSightseeingRow === sIdx) || (isFirstOfDay && activeAddSightseeingRow === dayLabel)) && (
                                                  <tr key={`add-sight-form-${sIdx}`} className="bg-violet-50/20">
                                                    <td colSpan={6} className="p-3">
                                                      <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 space-y-3.5 text-xs shadow-2xs">
                                                        {/* Header & Tour Type */}
                                                        <div className="flex items-center justify-between border-b border-violet-200/70 pb-2.5">
                                                          <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-violet-500"></span>
                                                            <span className="font-bold text-violet-950 text-sm">Add Sightseeing Tour ({dayLabel})</span>
                                                            {hasDayFreeTime && (
                                                              <span className="rounded-full bg-violet-200 border border-violet-300 text-violet-900 font-bold text-[10px] px-2 py-0.5">
                                                                {remainingHoursText} Available
                                                              </span>
                                                            )}
                                                          </div>

                                                          <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1.5">
                                                              <span className="text-[11px] font-semibold text-slate-500">Tour Type:</span>
                                                              <select
                                                                value={newSightseeingInput.tourType || "Private Tour"}
                                                                onChange={(e) => setNewSightseeingInput({ ...newSightseeingInput, tourType: e.target.value })}
                                                                className="rounded-lg border border-blue-300 bg-white px-2.5 py-1 text-xs font-semibold text-blue-900 focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                                                              >
                                                                <option value="Private Tour">Private Tour</option>
                                                                <option value="Sharing Tour">Sharing Tour</option>
                                                                <option value="Ticket Tour">Ticket Tour</option>
                                                              </select>
                                                            </div>

                                                            <button
                                                              type="button"
                                                              onClick={() => setActiveAddSightseeingRow(null)}
                                                              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5 rounded hover:bg-violet-100/50"
                                                            >
                                                              <X size={16} />
                                                            </button>
                                                          </div>
                                                        </div>

                                                        {/* Rich DMC Contracted Sightseeing Searchable Dropdown */}
                                                        {(() => {
                                                          const currentDestination = selectedPkg?.destination || query?.destination || "Goa";
                                                          const GOA_SUB_CITIES = [
                                                            "goa", "ponda", "panaji", "panjim", "calangute", "candolim", "baga",
                                                            "old goa", "south goa", "north goa", "anjuna", "colva",
                                                            "vagator", "margao", "mapusa", "vasco", "arambol", "morjim", "dabolim"
                                                          ];
                                                          const matchDest = (item, dest) => {
                                                            const destClean = String(dest || "").trim().toLowerCase();
                                                            if (!destClean) return true;
                                                            const city = String(item.city || "").trim().toLowerCase();
                                                            const itemDest = String(item.destination || "").trim().toLowerCase();
                                                            const title = String(item.title || item.serviceName || item.name || "").trim().toLowerCase();
                                                            const isGoaPackage = GOA_SUB_CITIES.some((sub) => destClean.includes(sub));
                                                            if (isGoaPackage) {
                                                              const isItemInGoa = GOA_SUB_CITIES.some(
                                                                (sub) => city.includes(sub) || itemDest.includes(sub) || title.includes(sub)
                                                              );
                                                              if (isItemInGoa) return true;
                                                            }
                                                            if (city && (city.includes(destClean) || destClean.includes(city))) return true;
                                                            if (itemDest && (itemDest.includes(destClean) || destClean.includes(itemDest))) return true;
                                                            if (title && title.includes(destClean)) return true;
                                                            return false;
                                                          };

                                                          const destinationDmcSightseeing = (liveDmcSightseeing || []).filter((s) =>
                                                            matchDest(s, currentDestination)
                                                          );
                                                          const availableSightseeing = destinationDmcSightseeing.length > 0 ? destinationDmcSightseeing : liveDmcSightseeing;
                                                          const searchQuery = (newSightseeingInput.searchQuery || "").trim().toLowerCase();
                                                          const filteredSightseeing = availableSightseeing.filter((s) => {
                                                            if (!searchQuery) return true;
                                                            const title = String(s.name || s.serviceName || s.title || "").toLowerCase();
                                                            const city = String(s.city || s.destination || "").toLowerCase();
                                                            const supp = String(s.supplierName || s.dmcName || "").toLowerCase();
                                                            return title.includes(searchQuery) || city.includes(searchQuery) || supp.includes(searchQuery);
                                                          });

                                                          // Helper to parse sightseeing duration in minutes
                                                          const parseSightMins = (item) => {
                                                            const durStr = item.duration || item.hours || "240 Mins";
                                                            return parseInt(String(durStr).replace(/[^\d]/g, "")) || 240;
                                                          };

                                                          // Smart sorting: sightseeing tours fitting within remainingMinsForDay come FIRST!
                                                          const sortedSightseeing = [...filteredSightseeing].sort((a, b) => {
                                                            if (!hasDayFreeTime) return 0;
                                                            const aMins = parseSightMins(a);
                                                            const bMins = parseSightMins(b);
                                                            const aFits = aMins <= remainingMinsForDay;
                                                            const bFits = bMins <= remainingMinsForDay;
                                                            if (aFits && !bFits) return -1;
                                                            if (!aFits && bFits) return 1;
                                                            return aMins - bMins;
                                                          });

                                                          return (
                                                            <div className="relative mb-3.5 space-y-1">
                                                              <div className="flex items-center justify-between">
                                                                <label className="text-[11px] font-bold text-violet-900 uppercase flex items-center gap-1.5">
                                                                  <Landmark size={13} className="text-violet-600" />
                                                                  SELECT DMC CONTRACTED SIGHTSEEING ({currentDestination.toUpperCase()})
                                                                </label>
                                                                {availableSightseeing.length > 0 && (
                                                                  <span className="text-[10.5px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200">
                                                                    {availableSightseeing.length} DMC tours for {currentDestination}
                                                                  </span>
                                                                )}
                                                              </div>

                                                              {/* Search Input Box */}
                                                              <div className="relative">
                                                                <input
                                                                  type="text"
                                                                  placeholder="Search DMC contracted sightseeing by tour name, location or supplier..."
                                                                  value={newSightseeingInput.searchQuery !== undefined ? newSightseeingInput.searchQuery : (newSightseeingInput.name || "")}
                                                                  onFocus={() => setNewSightseeingInput((prev) => ({ ...prev, isDropdownOpen: true }))}
                                                                  onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setNewSightseeingInput((prev) => ({
                                                                      ...prev,
                                                                      searchQuery: val,
                                                                      name: val,
                                                                      isDropdownOpen: true,
                                                                    }));
                                                                  }}
                                                                  className="w-full rounded-lg border border-violet-300 bg-white pl-3 pr-8 py-2 text-xs font-semibold text-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition shadow-2xs"
                                                                />
                                                                <button
                                                                  type="button"
                                                                  onClick={() => setNewSightseeingInput((prev) => ({ ...prev, isDropdownOpen: !prev.isDropdownOpen }))}
                                                                  className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                                                >
                                                                  <ChevronDown size={15} />
                                                                </button>
                                                              </div>

                                                              {/* Rich Dropdown Panel */}
                                                              {newSightseeingInput.isDropdownOpen && (
                                                                <div className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto rounded-xl border border-violet-200 bg-white shadow-xl z-50 divide-y divide-slate-100 [scrollbar-width:thin]">
                                                                  {sortedSightseeing.length === 0 ? (
                                                                    <div className="p-3.5 text-xs text-slate-500 italic text-center">
                                                                      No matching DMC sightseeing tours found. You can type custom sightseeing details below.
                                                                    </div>
                                                                  ) : (
                                                                    sortedSightseeing.map((dmcSight, sIdx) => {
                                                                      const sightTitle = dmcSight.name || dmcSight.serviceName || dmcSight.title || "Sightseeing Tour";
                                                                      const isSelected = String(newSightseeingInput.dmcSightseeingId) === String(dmcSight._id || dmcSight.id);
                                                                      const adP = Number(dmcSight.adultPrice || dmcSight.price || dmcSight.rate || 1800);
                                                                      const chP = Number(dmcSight.childPrice || Math.round(adP * 0.5) || 900);
                                                                      const cityLoc = dmcSight.city ? `Goa (${dmcSight.city})` : "Goa";
                                                                      const sightMins = parseSightMins(dmcSight);
                                                                      const fitsInDay = hasDayFreeTime && sightMins <= remainingMinsForDay;

                                                                      return (
                                                                        <div
                                                                          key={dmcSight._id || dmcSight.id || sIdx}
                                                                          onClick={() => {
                                                                            const adCount = Number(newSightseeingInput.adults || 1);
                                                                            const chCount = Number(newSightseeingInput.children || 0);

                                                                            setNewSightseeingInput((prev) => ({
                                                                              ...prev,
                                                                              dmcSightseeingId: dmcSight._id || dmcSight.id,
                                                                              name: sightTitle,
                                                                              searchQuery: sightTitle,
                                                                              tourType: dmcSight.tourType || "Private Tour",
                                                                              adultPrice: adP,
                                                                              childPrice: chP,
                                                                              price: (adP * adCount) + (chP * chCount),
                                                                              selectedSlot: dmcSight.slot || dmcSight.selectedSlot || "08:00",
                                                                              description: dmcSight.description || "Guided local sightseeing tour with transfers included",
                                                                              isDropdownOpen: false,
                                                                            }));
                                                                          }}
                                                                          className={`p-3 hover:bg-violet-50/60 cursor-pointer transition flex items-center justify-between gap-3 ${
                                                                            isSelected ? "bg-violet-50/90 border-l-4 border-l-violet-600" : ""
                                                                          }`}
                                                                        >
                                                                          <div className="min-w-0 flex-1 space-y-0.5">
                                                                            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate flex-wrap">
                                                                              <span>{sightTitle}</span>
                                                                              {isSelected && (
                                                                                <span className="rounded bg-violet-100 text-violet-800 text-[9px] px-1.5 py-0.2 font-bold shrink-0">
                                                                                  ✓ Selected
                                                                                </span>
                                                                              )}
                                                                              {fitsInDay && (
                                                                                <span className="rounded-full bg-violet-100 border border-violet-300 text-violet-950 font-bold text-[9px] px-2 py-0.2 shrink-0">
                                                                                  ⭐ Fits in {remainingHoursText} free
                                                                                </span>
                                                                              )}
                                                                            </p>
                                                                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 flex-wrap">
                                                                              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                                                                <MapPin size={11} className="text-rose-500 shrink-0" />
                                                                                {cityLoc}
                                                                              </span>
                                                                              <span>• Duration: {sightMins} Mins</span>
                                                                              <span>• Days: {dmcSight.operatingDays || "Mon-Sun"}</span>
                                                                            </p>
                                                                            {dmcSight.supplierName && (
                                                                              <p className="text-[10.5px] font-semibold text-violet-700">
                                                                                Supplier: {dmcSight.supplierName}
                                                                              </p>
                                                                            )}
                                                                          </div>
                                                                          <div className="text-right shrink-0">
                                                                            <p className="text-xs font-black text-slate-900">
                                                                              ₹{adP.toLocaleString("en-IN")}{" "}
                                                                              <span className="text-[10px] font-semibold text-slate-500">/ adult</span>
                                                                            </p>
                                                                            {chP > 0 && (
                                                                              <p className="text-[10px] font-semibold text-slate-500">
                                                                                Child: ₹{chP.toLocaleString("en-IN")}
                                                                              </p>
                                                                            )}
                                                                          </div>
                                                                        </div>
                                                                      );
                                                                    })
                                                                  )}
                                                                </div>
                                                              )}
                                                            </div>
                                                          );
                                                        })()}

                                                        {/* Main Inputs Grid */}
                                                        <div className="space-y-3">
                                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <div className="sm:col-span-2">
                                                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                                Sightseeing Tour Name
                                                              </label>
                                                              <input
                                                                type="text"
                                                                placeholder="e.g. North Goa Sightseeing & Fort Aguada Tour"
                                                                value={newSightseeingInput.name}
                                                                onChange={(e) => setNewSightseeingInput({ ...newSightseeingInput, name: e.target.value, searchQuery: e.target.value })}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
                                                              />
                                                            </div>

                                                            <div>
                                                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                                Day
                                                              </label>
                                                              <select
                                                                value={newSightseeingInput.day}
                                                                onChange={(e) => setNewSightseeingInput({ ...newSightseeingInput, day: e.target.value })}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-violet-500 focus:outline-none cursor-pointer"
                                                              >
                                                                {Array.from({ length: 10 }).map((_, i) => (
                                                                  <option key={i} value={`Day ${i + 1}`}>
                                                                    Day {i + 1}
                                                                  </option>
                                                                ))}
                                                              </select>
                                                            </div>
                                                          </div>

                                                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                                                            <div>
                                                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                                Adult Price (₹)
                                                              </label>
                                                              <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="1800"
                                                                value={newSightseeingInput.adultPrice}
                                                                onChange={(e) => {
                                                                  const ap = Number(e.target.value || 0);
                                                                  const cp = Number(newSightseeingInput.childPrice || 0);
                                                                  const ad = Number(newSightseeingInput.adults || 1);
                                                                  const ch = Number(newSightseeingInput.children || 0);
                                                                  setNewSightseeingInput({
                                                                    ...newSightseeingInput,
                                                                    adultPrice: e.target.value,
                                                                    price: (ap * ad) + (cp * ch),
                                                                  });
                                                                }}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-violet-500 focus:outline-none"
                                                              />
                                                            </div>

                                                            <div>
                                                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                                Child Price (₹)
                                                              </label>
                                                              <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="900"
                                                                value={newSightseeingInput.childPrice}
                                                                onChange={(e) => {
                                                                  const cp = Number(e.target.value || 0);
                                                                  const ap = Number(newSightseeingInput.adultPrice || 0);
                                                                  const ad = Number(newSightseeingInput.adults || 1);
                                                                  const ch = Number(newSightseeingInput.children || 0);
                                                                  setNewSightseeingInput({
                                                                    ...newSightseeingInput,
                                                                    childPrice: e.target.value,
                                                                    price: (ap * ad) + (cp * ch),
                                                                  });
                                                                }}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-violet-500 focus:outline-none"
                                                              />
                                                            </div>

                                                            <div>
                                                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                                Adults
                                                              </label>
                                                              <input
                                                                type="number"
                                                                min="1"
                                                                value={newSightseeingInput.adults}
                                                                onChange={(e) => {
                                                                  const ad = Math.max(1, Number(e.target.value || 1));
                                                                  const ch = Number(newSightseeingInput.children || 0);
                                                                  const ap = Number(newSightseeingInput.adultPrice || 0);
                                                                  const cp = Number(newSightseeingInput.childPrice || 0);
                                                                  setNewSightseeingInput({
                                                                    ...newSightseeingInput,
                                                                    adults: ad,
                                                                    price: (ap * ad) + (cp * ch),
                                                                  });
                                                                }}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-violet-500 focus:outline-none text-center"
                                                              />
                                                            </div>

                                                            <div>
                                                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                                Children
                                                              </label>
                                                              <input
                                                                type="number"
                                                                min="0"
                                                                value={newSightseeingInput.children}
                                                                onChange={(e) => {
                                                                  const ch = Math.max(0, Number(e.target.value || 0));
                                                                  const ad = Number(newSightseeingInput.adults || 1);
                                                                  const ap = Number(newSightseeingInput.adultPrice || 0);
                                                                  const cp = Number(newSightseeingInput.childPrice || 0);
                                                                  setNewSightseeingInput({
                                                                    ...newSightseeingInput,
                                                                    children: ch,
                                                                    price: (ap * ad) + (cp * ch),
                                                                  });
                                                                }}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-violet-500 focus:outline-none text-center"
                                                              />
                                                            </div>

                                                            <div>
                                                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                                Slot / Time
                                                              </label>
                                                              <select
                                                                value={newSightseeingInput.selectedSlot || "08:00"}
                                                                onChange={(e) => setNewSightseeingInput({ ...newSightseeingInput, selectedSlot: e.target.value })}
                                                                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 focus:border-violet-500 focus:outline-none cursor-pointer"
                                                              >
                                                                <option value="08:00">08:00</option>
                                                                <option value="09:00">09:00</option>
                                                                <option value="10:00">10:00</option>
                                                                <option value="11:30">11:30</option>
                                                                <option value="14:00">14:00</option>
                                                                <option value="15:00">15:00</option>
                                                                <option value="18:00">18:00</option>
                                                              </select>
                                                            </div>

                                                            <div>
                                                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                                Total (₹)
                                                              </label>
                                                              <input
                                                                type="number"
                                                                min="0"
                                                                value={newSightseeingInput.price}
                                                                onChange={(e) => setNewSightseeingInput({ ...newSightseeingInput, price: e.target.value })}
                                                                className="w-full rounded-lg border border-violet-400 bg-violet-50/50 px-2.5 py-1.5 text-xs font-bold text-violet-950 focus:border-violet-600 focus:outline-none"
                                                              />
                                                            </div>
                                                          </div>
                                                        </div>

                                                        {/* Form Buttons */}
                                                        <div className="flex justify-end gap-2 pt-2 border-t border-violet-200/60">
                                                          <button
                                                            type="button"
                                                            onClick={() => setActiveAddSightseeingRow(null)}
                                                            className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer transition"
                                                          >
                                                            Cancel
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              if (!newSightseeingInput.name) {
                                                                toast.error("Please enter sightseeing tour name");
                                                                return;
                                                              }
                                                              const finalAdults = Number(newSightseeingInput.adults || 1);
                                                              const finalChildren = Number(newSightseeingInput.children || 0);
                                                              const finalAdultPrice = Number(newSightseeingInput.adultPrice || 0);
                                                              const finalChildPrice = Number(newSightseeingInput.childPrice || 0);
                                                              const computedTotal = Number(newSightseeingInput.price || (finalAdultPrice * finalAdults) + (finalChildPrice * finalChildren));

                                                              updatePkgCustom(pkgId, (c) => ({
                                                                ...c,
                                                                customSightseeing: [
                                                                  ...(c.customSightseeing || []),
                                                                  {
                                                                    id: `custom-sight-${Date.now()}`,
                                                                    name: newSightseeingInput.name,
                                                                    tourType: newSightseeingInput.tourType || "Private Tour",
                                                                    day: newSightseeingInput.day || "Day 2",
                                                                    adultPrice: finalAdultPrice,
                                                                    childPrice: finalChildPrice,
                                                                    adults: finalAdults,
                                                                    children: finalChildren,
                                                                    selectedSlot: newSightseeingInput.selectedSlot || "08:00",
                                                                    price: computedTotal,
                                                                    description: newSightseeingInput.description || "Guided local sightseeing tour with transfers included",
                                                                  },
                                                                ],
                                                              }));
                                                              toast.success("Custom sightseeing added to package!");
                                                              setActiveAddSightseeingRow(null);
                                                              setNewSightseeingInput({
                                                                name: "",
                                                                tourType: "Private Tour",
                                                                day: "Day 2",
                                                                adultPrice: 1800,
                                                                childPrice: 900,
                                                                adults: query?.numberOfAdults || 2,
                                                                children: query?.numberOfChildren || 0,
                                                                selectedSlot: "08:00",
                                                                price: 3600,
                                                                description: "Guided local sightseeing tour with transfers included",
                                                              });
                                                            }}
                                                            className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition"
                                                          >
                                                            + Add Sightseeing
                                                          </button>
                                                        </div>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                              </React.Fragment>
                                            );
                                          })
                                        ) : (
                                          <tr>
                                            <td colSpan={6} className="py-4 px-4 text-center text-xs text-slate-400 italic">
                                              No sightseeing tours in this package.
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Sightseeing Subtotal */}
                                {sightseeingTotal > 0 && (
                                  <div className="flex justify-end pt-1">
                                    <div className="border border-slate-300 rounded-lg px-4 py-1.5 bg-white shadow-2xs inline-flex items-center gap-2 font-sans">
                                      <span className="text-xs font-bold text-slate-900">Sightseeing Subtotal:</span>
                                      <span className="text-xs font-semibold text-slate-400">INR</span>
                                      <span className="text-sm font-extrabold text-slate-900">
                                        {sightseeingTotal.toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                            </div>

                    {/* 3. ACCORDION SECTIONS (Inclusions/Exclusions, Day-wise Schedule, Terms & Conditions - Identical to All Quotes UI) */}
                    <div className="space-y-1 pt-4">
                      {/* ACCORDION 1: INCLUSIONS / EXCLUSIONS */}
                      <div className="border-t border-slate-200 pt-3">
                        <button
                          type="button"
                          onClick={() => setPackageAccordions(prev => ({ ...prev, inclusions: !prev.inclusions }))}
                          className="flex items-center gap-2.5 text-base sm:text-[17px] font-bold text-slate-900 cursor-pointer py-2.5 w-full text-left font-sans"
                        >
                          <ChevronRight size={18} className={`transition-transform duration-200 ${packageAccordions.inclusions ? "rotate-90" : ""}`} />
                          <span>Inclusions/Exclusions</span>
                        </button>

                        {packageAccordions.inclusions && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 pl-6 font-sans">
                            {/* Inclusions */}
                            <div>
                              <div className="border-b-2 border-emerald-500 pb-1 mb-3 inline-block">
                                <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase">Inclusions</h4>
                              </div>
                              <ul className="space-y-2">
                                {(selectedPkg?.inclusions ? (
                                  Array.isArray(selectedPkg.inclusions) ? selectedPkg.inclusions : String(selectedPkg.inclusions).split(/\n|•/).map(s => s.trim()).filter(Boolean)
                                ) : [
                                  "Stay as mentioned above or in Similar hotels",
                                  "Meals as mentioned in the Itinerary",
                                  "Enterances only as mentioned in Itinerary",
                                  "Transport as per Itinerary - Point to Point Basis",
                                  "Taxes as on Date"
                                ]).map((inc, i) => (
                                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-relaxed">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                                    <span>{inc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Exclusions */}
                            <div>
                              <div className="border-b-2 border-rose-400 pb-1 mb-3 inline-block">
                                <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase">Exclusions</h4>
                              </div>
                              <ul className="space-y-2">
                                {(selectedPkg?.exclusions ? (
                                  Array.isArray(selectedPkg.exclusions) ? selectedPkg.exclusions : String(selectedPkg.exclusions).split(/\n|•/).map(s => s.trim()).filter(Boolean)
                                ) : [
                                  "Airfare",
                                  "Early Check and Late Check out charges",
                                  "Expenses of personal nature like laundry, telephone calls, etc.",
                                  "Anything not specifically mentioned under inclusions"
                                ]).map((exc, i) => (
                                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-relaxed">
                                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                                    <span>{exc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION 2: DAY-WISE SCHEDULE */}
                      <div className="border-t border-slate-200 pt-3">
                        <button
                          type="button"
                          onClick={() => setPackageAccordions(prev => ({ ...prev, schedule: !prev.schedule }))}
                          className="flex items-center gap-2.5 text-base sm:text-[17px] font-bold text-slate-900 cursor-pointer py-2.5 w-full text-left font-sans"
                        >
                          <ChevronRight size={18} className={`transition-transform duration-200 ${packageAccordions.schedule ? "rotate-90" : ""}`} />
                          <span>Day-wise Schedule</span>
                        </button>

                        {packageAccordions.schedule && (() => {
                          const pkgDays = (() => {
                            if (Array.isArray(selectedPkg?.dayWiseItinerary) && selectedPkg.dayWiseItinerary.length > 0) {
                              return selectedPkg.dayWiseItinerary.map((day, dIdx) => {
                                const dayNum = day.dayNumber || day.day || dIdx + 1;
                                const nightSuffix = getOrdinalSuffix(dayNum);
                                const startDate = query?.startDate ? new Date(query.startDate) : new Date("2026-05-22");
                                const currentDate = new Date(startDate);
                                currentDate.setDate(currentDate.getDate() + dIdx);

                                const weekdayStr = currentDate.toLocaleDateString("en-IN", { weekday: "long" });
                                const dayVal = currentDate.getDate();
                                const monthStr = currentDate.toLocaleDateString("en-IN", { month: "short" });
                                const yearStr = currentDate.getFullYear().toString();

                                return {
                                  dayLabel: `${dayNum}${nightSuffix} Day`,
                                  weekday: weekdayStr,
                                  dateMonth: `${dayVal}${getOrdinalSuffix(dayVal)} ${monthStr}`,
                                  year: yearStr,
                                  events: [
                                    {
                                      title: day.title || day.heading || `Day ${dayNum}: ${selectedPkg?.title || "Package Activity"}`,
                                      description: day.description || day.details || "",
                                    },
                                  ],
                                };
                              });
                            }

                            const itinStr = typeof selectedPkg?.dayWiseItinerary === "string"
                              ? selectedPkg.dayWiseItinerary
                              : (selectedPkg?.description || "");
                            const dayBlocks = itinStr.split(/(?=Day\s+\d+:?)/i).map(s => s.trim()).filter(Boolean);

                            if (dayBlocks.length > 0) {
                              return dayBlocks.map((block, dIdx) => {
                                const dayNum = dIdx + 1;
                                const nightSuffix = getOrdinalSuffix(dayNum);
                                const startDate = query?.startDate ? new Date(query.startDate) : new Date("2026-05-22");
                                const currentDate = new Date(startDate);
                                currentDate.setDate(currentDate.getDate() + dIdx);

                                const weekdayStr = currentDate.toLocaleDateString("en-IN", { weekday: "long" });
                                const dayVal = currentDate.getDate();
                                const monthStr = currentDate.toLocaleDateString("en-IN", { month: "short" });
                                const yearStr = currentDate.getFullYear().toString();

                                const lines = block.split("\n").filter(Boolean);
                                const titleLine = lines[0] || `Day ${dayNum}: ${selectedPkg?.title || "Package Activity"}`;
                                const descLines = lines.slice(1).join("\n");

                                return {
                                  dayLabel: `${dayNum}${nightSuffix} Day`,
                                  weekday: weekdayStr,
                                  dateMonth: `${dayVal}${getOrdinalSuffix(dayVal)} ${monthStr}`,
                                  year: yearStr,
                                  events: [
                                    {
                                      title: titleLine,
                                      description: descLines || "Standard package sightseeing and activities as included.",
                                    },
                                  ],
                                };
                              });
                            }

                            const numDays = parseInt(selectedPkg?.duration) || 4;
                            return Array.from({ length: numDays }).map((_, dIdx) => {
                              const dayNum = dIdx + 1;
                              const nightSuffix = getOrdinalSuffix(dayNum);
                              const startDate = query?.startDate ? new Date(query.startDate) : new Date("2026-05-22");
                              const currentDate = new Date(startDate);
                              currentDate.setDate(currentDate.getDate() + dIdx);

                              const weekdayStr = currentDate.toLocaleDateString("en-IN", { weekday: "long" });
                              const dayVal = currentDate.getDate();
                              const monthStr = currentDate.toLocaleDateString("en-IN", { month: "short" });
                              const yearStr = currentDate.getFullYear().toString();

                              let titleText = `${dayNum}${nightSuffix} Day: `;
                              if (dayNum === 1) titleText += `Arrival in ${selectedPkg?.destination || "Destination"} & Hotel Check-in`;
                              else if (dayNum === numDays) titleText += `Check-out & Transfer to Airport for Departure`;
                              else titleText += `Local Sightseeing, ${selectedPkg?.title || "Tours & Experience"}`;

                              return {
                                dayLabel: `${dayNum}${nightSuffix} Day`,
                                weekday: weekdayStr,
                                dateMonth: `${dayVal}${getOrdinalSuffix(dayVal)} ${monthStr}`,
                                year: yearStr,
                                events: [
                                  {
                                    title: titleText,
                                    description: selectedPkg?.description || `Full day itinerary and sightseeing in ${selectedPkg?.destination || "Destination"}. Stay at 5-star hotel.`,
                                  },
                                ],
                              };
                            });
                          })();

                          return (
                            <div className="pt-4 space-y-6 font-sans">
                              {pkgDays.map((dayItem, dIdx) => (
                                <div key={dIdx} className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                                  {/* Left Date Card Box */}
                                  <div className="w-28 sm:w-32 shrink-0 rounded-xl border border-sky-200 bg-white overflow-hidden shadow-2xs text-center">
                                    {/* Header */}
                                    <div className="bg-[#f0f9ff] py-1.5 border-b border-sky-100 font-bold text-[#0284c7] text-xs tracking-wide">
                                      {dayItem.dayLabel}
                                    </div>
                                    {/* Body */}
                                    <div className="py-2.5 px-2 bg-white space-y-0.5">
                                      <p className="text-xs text-slate-500 font-normal">{dayItem.weekday}</p>
                                      <p className="text-sm font-bold text-slate-900">{dayItem.dateMonth}</p>
                                      <p className="text-xs text-slate-400 font-normal">{dayItem.year}</p>
                                    </div>
                                  </div>

                                  {/* Right Events List */}
                                  <div className="flex-1 min-w-0 space-y-5 pt-0.5">
                                    {dayItem.events.map((evt, eIdx) => (
                                      <div key={eIdx} className="space-y-1">
                                        <h4 className="font-bold text-slate-900 underline underline-offset-2 text-sm sm:text-base leading-snug">
                                          {evt.title}
                                        </h4>
                                        {evt.description && (
                                          <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed whitespace-pre-line">
                                            {evt.description}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* ACCORDION 3: TERMS AND CONDITIONS */}
                      <div className="border-t border-slate-200 pt-3">
                        <button
                          type="button"
                          onClick={() => setPackageAccordions(prev => ({ ...prev, terms: !prev.terms }))}
                          className="flex items-center gap-2.5 text-base sm:text-[17px] font-bold text-slate-900 cursor-pointer py-2.5 w-full text-left font-sans"
                        >
                          <ChevronRight size={18} className={`transition-transform duration-200 ${packageAccordions.terms ? "rotate-90" : ""}`} />
                          <span>Terms and Conditions</span>
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold ml-2">Archived</span>
                        </button>

                        {packageAccordions.terms && (
                          <div className="pt-3 pl-6 font-sans text-xs sm:text-sm text-slate-800 leading-relaxed space-y-4">
                            {selectedPkg?.termsAndConditions && Array.isArray(selectedPkg.termsAndConditions) && selectedPkg.termsAndConditions.length > 0 ? (
                              <ul className="list-disc pl-5 space-y-2">
                                {selectedPkg.termsAndConditions.map((term, tIdx) => (
                                  <li key={tIdx}>{term}</li>
                                ))}
                              </ul>
                            ) : (
                              <>
                                <p>
                                  Welcome to <strong className="font-bold text-slate-900">Holiday Circuit</strong>. These Terms and Conditions govern your use of the <strong className="font-bold text-slate-900">Holiday Circuit</strong> services. When You Make a booking or reservation, you agree to be bound by these Terms.
                                </p>

                                <div className="space-y-2">
                                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">Bookings and Reservations</h4>
                                  <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                      <strong className="font-bold text-slate-900">Booking Process:</strong> When you make a booking or reservation through <strong className="font-bold text-slate-900">Holiday Circuit</strong>, you agree to provide accurate and complete information. Any discrepancies or errors in the information you provide may result in the cancellation of your booking.
                                    </li>
                                  </ul>
                                </div>

                                <div className="space-y-2">
                                  <p>
                                    <strong className="font-bold text-slate-900">Payment:</strong> Payments for bookings are due as specified during the booking process. Failure to make payments on time may result in the cancellation of your booking.
                                  </p>

                                  <ol className="list-none space-y-2 font-bold text-slate-900">
                                    <li>1. Minimum 50% of the booking amount is required at the time of booking confirmation.</li>
                                    <li>2. Remaining 50% in 2 parts i.e. 25% of total booking amount within 30 Days prior to departure and 25% within 20 days prior to departure.</li>
                                    <li>3. In Case of Airline booking/Train Tickets, 100% ticket cost to be paid at the time of confirmation.</li>
                                    <li>4. In Case a booking is under 100% cancellation period, then 100% booking amount is required at the time of booking confirmation.</li>
                                  </ol>
                                </div>

                                <p>
                                  <strong className="font-bold text-slate-900">Confirmation:</strong> Your booking is considered confirmed only upon receipt of payment and confirmation from <strong className="font-bold text-slate-900">Holiday Circuit</strong>. Please review all booking details carefully to ensure accuracy.
                                </p>

                                <p className="font-bold text-slate-900">
                                  Booking will be auto cancelled in case of non-payment within stipulated time
                                </p>

                                <p>
                                  <strong className="font-bold text-slate-900">Credit Card:</strong> We accept payments through Credit Cards which may attract an additional charge from 3% to 5% depends upon the card type. Card charges shall be over and above the actual service/package cost.
                                </p>

                                <p>
                                  <strong className="font-bold text-slate-900">Confirmation Vouchers:</strong> The service will be confirmed once the advance payment is made. However, the confirmation vouchers will only be provided 7 days before the arrival date.
                                </p>

                                <p>
                                  <strong className="font-bold text-slate-900">Airport Transfers & Tour Pick Ups:</strong> The service includes 60 minutes of waiting time for Airport pick-ups. If you are delayed at immigration or luggage claim, please call the emergency number to extend the waiting time. Additional parking and waiting time charges may apply. For all other pick-ups, the driver will wait for 10 mins at the meeting point i.e. Hotel Lobby or Reception or any other fixed meeting point.
                                </p>

                                <p>
                                  <strong className="font-bold text-slate-900">Taxes:</strong> In case of any changes in taxes (such as GST/Government Tax/TCS) at the time of confirmation, the price will be adjusted accordingly and shall be charged as per the prevailing law. This means that if there is an increase or decrease in applicable taxes between the time of booking confirmation and the actual provision of services, the final price will be adjusted to reflect these changes in accordance with the relevant tax regulations.
                                </p>

                                <p>
                                  <strong className="font-bold text-slate-900">Changes and Cancellations:</strong> Changes to bookings or cancellations may be subject to fees or penalties, as determined by the service providers (e.g., airlines, hotels, tour operators) and <strong className="font-bold text-slate-900">Holiday Circuit</strong>. These fees and penalties may vary depending on the service and the timing of the change or cancellation.
                                </p>

                                <div className="space-y-2">
                                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">Travel Documents and Requirements</h4>
                                  <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                      <strong className="font-bold text-slate-900">Valid Id Proof:</strong> It is your responsibility to ensure that you have a valid ID as per destination entry requirements and any required visas or travel documents for your trip. <strong className="font-bold text-slate-900">Holiday Circuit</strong> is not responsible for any issues arising from the lack of proper travel documents. <strong className="font-bold text-slate-900">(To Enter Nepal by Air- Valid Passport or Election Card is Mandatory. Aadhar Card is not valid for Travel)</strong>
                                    </li>
                                    <li>
                                      <strong className="font-bold text-slate-900">Health and Vaccinations:</strong> You are responsible for ensuring that you meet all health and vaccination requirements for your travel destinations.
                                    </li>
                                    <li>
                                      <strong className="font-bold text-slate-900">Travel Insurance:</strong> We strongly recommend that you purchase travel insurance to protect against unexpected events such as trip cancellations, delays, or emergencies during your travel. <strong className="font-bold text-slate-900">Holiday Circuit</strong> can assist you in obtaining travel insurance, but the decision to purchase it is ultimately yours.
                                    </li>
                                  </ul>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">Changes to Itineraries</h4>
                                  <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                      <strong className="font-bold text-slate-900">By Holiday Circuit:</strong> We reserve the right to make changes to your itinerary or accommodations due to unforeseen circumstances. We will make every effort to inform you of such changes as soon as possible.
                                    </li>
                                    <li>
                                      <strong className="font-bold text-slate-900">By You:</strong> Any changes requested by you to your itinerary may be subject to fees or penalties, as determined by the service providers and <strong className="font-bold text-slate-900">Holiday Circuit</strong>.
                                    </li>
                                  </ul>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">Liability</h4>
                                  <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                      <strong className="font-bold text-slate-900">Service Providers: Holiday Circuit</strong> acts as an intermediary between you and service providers such as airlines, hotels, and tour operators. We are not liable for any actions, omissions, or negligence on the part of these service providers.
                                    </li>
                                    <li>
                                      <strong className="font-bold text-slate-900">Force Majeure: Holiday Circuit</strong> is not liable for any disruptions, cancellations, or delays caused by circumstances beyond our control, including natural disasters, strikes, political unrest, or other force majeure events.
                                    </li>
                                  </ul>
                                </div>

                                <p>
                                  <strong className="font-bold text-slate-900">Governing Law and Jurisdiction:</strong> These Terms and your use of <strong className="font-bold text-slate-900">Holiday Circuit</strong> services are governed by the laws of New Delhi Jurisdiction, and any disputes shall be resolved in the courts of New Delhi Jurisdiction.
                                </p>

                                <p>
                                  <strong className="font-bold text-slate-900">Changes to Terms and Conditions:</strong> We reserve the right to update and modify these Terms and Conditions at any time. Please review them periodically for changes. Your continued use of our services after any modifications indicates your acceptance of the updated Terms.
                                </p>

                                <p>
                                  <strong className="font-bold text-slate-900">Contact Information:</strong> For any inquiries, please contact us at: <strong className="font-bold text-slate-900">Holiday Circuit</strong> KG 3/69, Ground Floor, Vikas Puri, New Delhi -110018, Near UK Nursing Home , Email id - <a href="mailto:varun@holidaycircuit.com" className="text-blue-600 underline hover:text-blue-800">varun@holidaycircuit.com</a> +91 8851346665, +91 9971706003
                                </p>

                                <p className="italic font-bold text-slate-900 pt-2">
                                  By booking with Holiday Circuit, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
            })()}
            </>
          );
        })()}
      </div>
    )}
  </div>

      {/* ACCEPT QUOTE MODAL */}
      <AnimatePresence>
        {isAcceptModalOpen && acceptQuoteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-[4px] p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-5 relative border border-slate-200 border-t-4 border-t-[#15803d] overflow-hidden"
            >
              <button
                type="button"
                onClick={closeAcceptModal}
                disabled={acceptSubmitting}
                className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-start gap-3 mb-3 pr-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#15803d]">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#15803d]">
                    Accept Quote
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-slate-900 leading-tight">
                    Confirm this quotation?
                  </h3>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-600 mb-4">
                This will mark the ops quotation as accepted so you can continue with markup or client sharing.
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAcceptModal}
                  disabled={acceptSubmitting}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-colors disabled:opacity-60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAcceptQuote(acceptQuoteId)}
                  disabled={acceptSubmitting}
                  className="px-4 py-2 bg-[#15803d] hover:bg-[#16a34a] text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-70 cursor-pointer shadow-2xs"
                >
                  {acceptSubmitting ? "Accepting..." : "Yes, Accept"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>




      {/* CLIENT APPROVAL MODAL */}
      <AnimatePresence>
        {isClientApprovalModalOpen && clientApprovalQuoteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl font-sans"
            >
              {(() => {
                const approvedQuote = quotes.find((item) => item._id === clientApprovalQuoteId);
                const approvedAmount =
                  approvedQuote?.clientTotalAmount ??
                  approvedQuote?.pricing?.totalAmount ??
                  0;
                const travelerCounts = getQueryTravelerCounts(query);

                return (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#3B58B5]">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#3B58B5]">
                          Booking Processed
                        </p>
                        <h3 className="mt-0.5 text-base font-bold text-slate-900 leading-tight">
                          Confirm booking processed?
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          Operations will be notified to transition this booking to the next stage.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Destination
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-800">
                          {query.destination || "Trip"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Travelers
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-800">
                          {travelerCounts.adults} Adults, {travelerCounts.children} Kids
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 col-span-2 text-center">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Travel Dates
                        </p>
                        <p className="mt-0.5 text-[11px] font-bold text-slate-800 whitespace-nowrap">
                          {formatDisplayDate(query.startDate) || "-"} - {formatDisplayDate(query.endDate) || "-"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 col-span-2 text-center">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Approved Amount
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-[#3B58B5]">
                          {formatMoney(approvedAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/40 p-2.5 text-center">
                      <p className="text-[10px] leading-relaxed text-slate-500">
                        Ops & finance will continue the booking workflow. Confirm only if approved.
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={closeClientApprovalModal}
                        disabled={clientApprovalSubmitting}
                        className="rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClientApproved(clientApprovalQuoteId)}
                        disabled={clientApprovalSubmitting}
                        className="rounded-md bg-[#3B58B5] hover:bg-[#304797] text-white px-5 py-2 text-xs font-semibold shadow-2xs transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                      >
                        {clientApprovalSubmitting ? "Sending..." : "Yes, Booking Processed"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHARE PACKAGE MODAL */}
      <SharePackageModal
        isOpen={isSendModalOpen}
        onClose={handleCloseSendModal}
        query={query}
        quote={quotes.find((q) => q._id === sendQuoteId) || activeQuote || quotes[0]}
        selectedPkg={(agentPackages || []).find((p) => p._id === sendQuoteId || p._id === selectedAgentPackageId) || quotes.find((q) => q._id === sendQuoteId) || agentPackages?.[0]}
        currentUser={currentUser}
        brandLogoUrl={brandLogoUrl}
        onMarkShared={markQuoteSharedToClient}
        onSendEmail={handleSendToClient}
        getClientPdfUrl={getClientPdfUrl}
        shareMode={sendShareMode}
      />

      {/* TOP-LEVEL MARKUP MODAL */}
      {isMarkupModalOpen && (() => {
        const isPackageTarget =
          markupTargetMode === "PACKAGE" ||
          Boolean(markupTargetItem && !markupTargetItem.quotationNumber && !activeQuoteId);

        const currentPkg =
          markupTargetItem ||
          (agentPackages || []).find(
            (p) => p._id === selectedAgentPackageId,
          ) ||
          agentPackages?.[0];

        const markupQuote = !isPackageTarget
          ? quotes.find((q) => q._id === activeQuoteId) ||
            markupTargetItem ||
            activeQuote ||
            quotes[0] ||
            {}
          : {};

        const pkgServicesSum =
          (Array.isArray(currentPkg?.hotels) ? currentPkg.hotels : []).reduce((s, h) => s + Number(h.price || 0), 0) +
          (Array.isArray(currentPkg?.transfers) ? currentPkg.transfers : []).reduce((s, t) => s + Number(t.price || 0), 0) +
          (Array.isArray(currentPkg?.activities) ? currentPkg.activities : []).reduce((s, a) => s + Number(a.price || 0), 0) +
          (Array.isArray(currentPkg?.sightseeing) ? currentPkg.sightseeing : []).reduce((s, si) => s + Number(si.price || 0), 0);

        const baseCostAmount = isPackageTarget
          ? Number(
              currentPkg?.customizedFinalPrice ||
                currentPkg?.customPrice ||
                currentPkg?.costPrice ||
                currentPkg?.netPrice ||
                currentPkg?.basePrice ||
                currentPkg?.price ||
                (pkgServicesSum > 0 ? pkgServicesSum : 250000),
            )
          : Number(
              markupQuote?.pricing?.opsTotalAmount ||
                markupQuote?.pricing?.totalAmount ||
                0,
            );

        const targetTitle = isPackageTarget
          ? currentPkg?.title || "Pre-defined Package"
          : `Quotation #${markupQuote?.quotationNumber || "Quote"}`;

        const baseLabel = isPackageTarget ? "Package Cost" : "Ops Amount";

        return createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[4px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 relative border border-slate-200 border-t-4 border-t-[#4263EB] overflow-hidden font-sans"
            >
              <button
                type="button"
                onClick={closeMarkupModal}
                className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="flex items-start gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4263EB]/10 text-[#4263EB] shrink-0">
                  <Sparkles size={20} />
                </div>
                <div className="pr-6">
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    {isPackageTarget ? "Apply Package Markup" : "Apply Agent Markup"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed truncate max-w-xs">
                    {targetTitle}
                  </p>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid gap-2.5 grid-cols-3 mb-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 flex flex-col justify-between shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {baseLabel}
                  </p>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900">
                    {formatMoney(baseCostAmount)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#4263EB]/30 bg-[#4263EB]/5 p-2.5 flex flex-col justify-between shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#4263EB]">
                    Markup Added
                  </p>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-[#4263EB]">
                    {formatMoney(
                      calculateAgentMarkupPreview({
                        markupType,
                        markupValue,
                        opsTotal: baseCostAmount,
                      }).markupAmount,
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-2.5 flex flex-col justify-between shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    Final Amount
                  </p>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-emerald-700">
                    {formatMoney(
                      calculateAgentMarkupPreview({
                        markupType,
                        markupValue,
                        opsTotal: baseCostAmount,
                      }).finalAmount,
                    )}
                  </p>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Markup Type
                  </label>
                  <select
                    value={markupType}
                    onChange={(e) => {
                      setMarkupType(e.target.value);
                      setMarkupValue("");
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#4263EB]/20 focus:border-[#4263EB] transition-all cursor-pointer"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="AMOUNT">Fixed Amount (INR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Markup Value
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={markupType === "PERCENT" ? "0.01" : "1"}
                    value={markupValue}
                    onChange={(e) => setMarkupValue(e.target.value)}
                    placeholder={
                      markupType === "PERCENT"
                        ? "Enter markup percentage (e.g. 5)"
                        : "Enter fixed markup amount (e.g. 5000)"
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#4263EB]/20 focus:border-[#4263EB] transition-all"
                  />
                </div>

                {/* Info Banner */}
                <div className="rounded-lg border border-[#4263EB]/20 bg-[#4263EB]/5 p-3 text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                  <Info size={15} className="text-[#4263EB] shrink-0 mt-0.5" />
                  <div>
                    This will add{" "}
                    <span className="font-bold text-slate-900">
                      {formatMoney(
                        calculateAgentMarkupPreview({
                          markupType,
                          markupValue,
                          opsTotal: baseCostAmount,
                        }).markupAmount,
                      )}
                    </span>{" "}
                    and update client total to{" "}
                    <span className="font-bold text-slate-900">
                      {formatMoney(
                        calculateAgentMarkupPreview({
                          markupType,
                          markupValue,
                          opsTotal: baseCostAmount,
                        }).finalAmount,
                      )}
                    </span>
                    .
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeMarkupModal}
                  disabled={Boolean(markupSubmittingId)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyMarkup}
                  disabled={Boolean(markupSubmittingId)}
                  className="rounded-lg bg-[#4263EB] hover:bg-[#324ec9] px-5 py-2 text-xs font-bold text-white shadow-2xs transition-all disabled:opacity-60 cursor-pointer"
                >
                  {markupSubmittingId ? "Applying..." : "Apply Markup"}
                </button>
              </div>
            </motion.div>
          </motion.div>,
          document.body,
        );
      })()}




      <SendSuccessModal
        sendSuccessMeta={sendSuccessMeta}
        onCloseModal={() => setSendSuccessMeta(null)}
        onCloseQuery={handleClose}
        query={query}
      />

      <RevisionModal
        isOpen={isRevisionModalOpen}
        onClose={() => {
          setIsRevisionModalOpen(false);
          setRevisionReason("");
          setRevisionQuoteId(null);
        }}
        revisionReason={revisionReason}
        setRevisionReason={setRevisionReason}
        handleRequestRevision={handleRequestRevision}
        revisionSubmitting={revisionSubmitting}
      />
    </motion.div>
  );
};

export default QueryDetails;