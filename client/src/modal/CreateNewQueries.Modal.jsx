import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, ArrowLeft, CheckCircle2, Sparkles, X, AlertCircle, User, ChevronDown, Compass, Globe } from "lucide-react";
import API from "../utils/Api.js";
import { motion, AnimatePresence } from "framer-motion";

const childAgeOptions = Array.from({ length: 12 }, (_, index) => index + 1);

const createAdultTraveler = () => ({ fullName: "" });
const createChildTraveler = () => ({ fullName: "", age: "" });

const resizeTravelerList = (count, currentList, builder) =>
  Array.from({ length: count }, (_, index) => currentList[index] || builder());

const normalizeCountryName = (value = "") =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const countryAliasCodes = {
  america: "US",
  "britain": "GB",
  "czech republic": "CZ",
  "england": "GB",
  "holland": "NL",
  "korea": "KR",
  "laos": "LA",
  "maldives": "MV",
  "russia": "RU",
  "scotland": "GB",
  "south korea": "KR",
  "taiwan": "TW",
  "tanzania": "TZ",
  "uae": "AE",
  "u a e": "AE",
  "uk": "GB",
  "u k": "GB",
  "united kingdom": "GB",
  "united states": "US",
  "united states of america": "US",
  "usa": "US",
  "u s a": "US",
  "vietnam": "VN",
};

const buildCountryCodeLookup = () => {
  const lookup = new Map(
    Object.entries(countryAliasCodes).map(([name, code]) => [normalizeCountryName(name), code]),
  );
  const regionCodes = [
    "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
    "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
    "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
    "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
    "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
    "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
    "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
    "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
    "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
    "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
    "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
    "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
    "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
    "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
    "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
    "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
  ];
  const locales = ["en", "en-IN", "en-GB"];

  locales.forEach((locale) => {
    try {
      const displayNames = new Intl.DisplayNames([locale], { type: "region" });
      regionCodes.forEach((code) => {
        const name = displayNames.of(code);
        const normalizedName = normalizeCountryName(name);
        if (normalizedName && !lookup.has(normalizedName)) {
          lookup.set(normalizedName, code);
        }
      });
    } catch (_error) {
      // Older browsers may not support Intl.DisplayNames; fallback aliases still cover common DMC countries.
    }
  });

  return lookup;
};

const countryCodeLookup = buildCountryCodeLookup();

const getFlagImageUrlFromCountryCode = (countryCode = "") => {
  const normalizedCode = String(countryCode || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedCode)) return "";

  return `https://animated-country-flags.malith.dev/webp/${normalizedCode}.webp`;
};

const parseCountryFromDestinationLabel = (label = "") => {
  const parts = String(label || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 1 ? parts[parts.length - 1] : "";
};

const getDestinationCountry = (option = {}) =>
  String(option?.country || "").trim() || parseCountryFromDestinationLabel(option?.label);

const getCountryCode = (country = "") => {
  const normalizedCountry = normalizeCountryName(country);
  if (!normalizedCountry) return "";

  return countryCodeLookup.get(normalizedCountry) || "";
};

const getCountryFlagUrl = (country = "") => getFlagImageUrlFromCountryCode(getCountryCode(country));

const getTodayDateString = () => {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

const CreateNewQueries = ({ onClose, onCreated, queryToEdit = null, isOpsView = false }) => {
  const [step, setStep] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [formData, setFormData] = useState({
    destination: "",
    clientEmail: "",
    startDate: "",
    endDate: "",
    numberOfAdults: 1,
    numberOfChildren: 0,
    customerBudget: 0,
    hotelCategory: "",
    transportRequired: false,
    sightseeingRequired: false,
    specialRequirements: "",
    adultTravelers: [createAdultTraveler()],
    childTravelers: [],
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formAlert, setFormAlert] = useState(null);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [destinationsLoading, setDestinationsLoading] = useState(false);
  const [destinationLoadError, setDestinationLoadError] = useState("");
  const [destinationDropdownOpen, setDestinationDropdownOpen] = useState(false);
  const [destinationSearch, setDestinationSearch] = useState("");
  const [selectedDestinationOptionId, setSelectedDestinationOptionId] = useState("");
  const [destinationDropdownPosition, setDestinationDropdownPosition] = useState(null);
  const [hotelCategoryOptions, setHotelCategoryOptions] = useState([]);
  const [hotelRequired, setHotelRequired] = useState(false);
  const closeTimeoutRef = useRef(null);
  const destinationDropdownRef = useRef(null);
  const destinationMenuRef = useRef(null);
  const todayDate = getTodayDateString();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (queryToEdit) {
      const adults = (queryToEdit.travelerDetails || [])
        .filter((t) => t.travelerType === "Adult")
        .map((t) => ({ fullName: t.fullName }));
      
      const children = (queryToEdit.travelerDetails || [])
        .filter((t) => t.travelerType === "Child")
        .map((t) => ({ fullName: t.fullName, age: t.childAge || "" }));

      setFormData({
        destination: queryToEdit.destination || "",
        clientEmail: queryToEdit.clientEmail || "",
        startDate: queryToEdit.startDate ? new Date(queryToEdit.startDate).toISOString().slice(0, 10) : "",
        endDate: queryToEdit.endDate ? new Date(queryToEdit.endDate).toISOString().slice(0, 10) : "",
        numberOfAdults: queryToEdit.numberOfAdults || adults.length || 1,
        numberOfChildren: queryToEdit.numberOfChildren || children.length || 0,
        customerBudget: queryToEdit.customerBudget || 0,
        hotelCategory: queryToEdit.hotelCategory || "",
        transportRequired: Boolean(queryToEdit.transportRequired),
        sightseeingRequired: Boolean(queryToEdit.sightseeingRequired),
        specialRequirements: queryToEdit.specialRequirements || "",
        adultTravelers: adults.length > 0 ? adults : [createAdultTraveler()],
        childTravelers: children,
      });
      setHotelRequired(Boolean(queryToEdit.hotelCategory));
      setSelectedDestinationOptionId("");
    }
  }, [queryToEdit]);

  useEffect(() => {
    let isMounted = true;

    const loadHotelRateDestinations = async () => {
      setDestinationsLoading(true);
      setDestinationLoadError("");

      try {
        const response = await API.get("/agent/hotel-rate-destinations");
        if (!isMounted) return;

        setDestinationOptions(Array.isArray(response?.data?.destinations) ? response.data.destinations : []);
        setHotelCategoryOptions(
          Array.isArray(response?.data?.hotelCategories) ? response.data.hotelCategories : [],
        );
      } catch (error) {
        console.error("Unable to load hotel rate destinations", error?.response?.data || error.message);
        if (isMounted) {
          setDestinationLoadError("Unable to load destinations");
          setDestinationOptions([]);
          setHotelCategoryOptions([]);
        }
      } finally {
        if (isMounted) {
          setDestinationsLoading(false);
        }
      }
    };

    loadHotelRateDestinations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!destinationDropdownOpen) return undefined;

    const handleOutsideClick = (event) => {
      const clickedControl = destinationDropdownRef.current?.contains(event.target);
      const clickedMenu = destinationMenuRef.current?.contains(event.target);

      if (!clickedControl && !clickedMenu) {
        setDestinationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [destinationDropdownOpen]);

  useEffect(() => {
    if (!destinationDropdownOpen) {
      setDestinationDropdownPosition(null);
      return undefined;
    }

    const updateDropdownPosition = () => {
      const rect = destinationDropdownRef.current?.getBoundingClientRect();
      if (!rect) return;

      setDestinationDropdownPosition({
        left: rect.left,
        top: rect.bottom + 6,
        width: rect.width,
      });
    };

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [destinationDropdownOpen]);

  const resetForm = () => {
    setFormData({
      destination: "",
      clientEmail: "",
      startDate: "",
      endDate: "",
      numberOfAdults: 1,
      numberOfChildren: 0,
      customerBudget: 0,
      hotelCategory: "",
      transportRequired: false,
      sightseeingRequired: false,
      specialRequirements: "",
      adultTravelers: [createAdultTraveler()],
      childTravelers: [],
    });
    setHotelRequired(false);
    setFormAlert(null);
    setSelectedDestinationOptionId("");
    setStep(1);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (formAlert) setFormAlert(null);

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    if (name === "numberOfAdults") {
      const nextCount = Math.max(1, Number(value || 1));
      setFormData((prev) => ({
        ...prev,
        numberOfAdults: nextCount,
        adultTravelers: resizeTravelerList(nextCount, prev.adultTravelers, createAdultTraveler),
      }));
      return;
    }

    if (name === "numberOfChildren") {
      const nextCount = Math.max(0, Number(value || 0));
      setFormData((prev) => ({
        ...prev,
        numberOfChildren: nextCount,
        childTravelers: resizeTravelerList(nextCount, prev.childTravelers, createChildTraveler),
      }));
      return;
    }

    if (name === "startDate") {
      setFormData((prev) => ({
        ...prev,
        startDate: value,
        endDate: prev.endDate && prev.endDate < value ? "" : prev.endDate,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleHotelCategoryChange = (category, checked) => {
    if (formAlert) setFormAlert(null);
    setFormData((prev) => {
      let categories = prev.hotelCategory ? prev.hotelCategory.split(",").map((c) => c.trim()) : [];
      if (checked) {
        if (!categories.includes(category)) {
          categories.push(category);
        }
      } else {
        categories = categories.filter((c) => c !== category);
      }
      return {
        ...prev,
        hotelCategory: categories.join(", "),
      };
    });
  };

  const handleTravelerChange = (travelerType, index, field, value) => {
    if (formAlert) setFormAlert(null);
    setFormData((prev) => {
      const targetKey = travelerType === "child" ? "childTravelers" : "adultTravelers";
      const updatedTravelers = [...prev[targetKey]];
      updatedTravelers[index] = {
        ...updatedTravelers[index],
        [field]: value,
      };

      return {
        ...prev,
        [targetKey]: updatedTravelers,
      };
    });
  };

  const validateTravelerStep = () => {
    const missingChildIndex = formData.childTravelers.findIndex(
      (traveler) => !Number(traveler.age),
    );

    if (missingChildIndex !== -1) {
      setFormAlert({
        title: "Child Age Required",
        message: `Please select the age for Child ${missingChildIndex + 1}.`,
      });
      return false;
    }

    return true;
  };

  const buildTravelerPayload = () => [
    ...Array.from({ length: Number(formData.numberOfAdults || 0) }, (_, index) => ({
      fullName:
        String(formData.adultTravelers[index]?.fullName || "").trim() ||
        `Adult Traveler ${index + 1}`,
      travelerType: "Adult",
      documentType: "Passport",
    })),
    ...formData.childTravelers.map((traveler, index) => ({
      fullName: String(traveler.fullName || "").trim() || `Child ${index + 1}`,
      travelerType: "Child",
      childAge: Number(traveler.age),
      documentType: "Passport",
    })),
  ];

  const handleSubmit = async () => {
    if (!String(formData.destination || "").trim()) {
      setFormAlert({
        title: "Destination Required",
        message: "Please select a destination before submitting the query.",
      });
      setStep(1);
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setFormAlert({
        title: "Travel Dates Required",
        message: "Please select both start date and end date before submitting the query.",
      });
      setStep(1);
      return;
    }

    if (!queryToEdit && formData.startDate < todayDate) {
      setFormAlert({
        title: "Invalid Start Date",
        message: "Start date can only be today or a future date.",
      });
      setStep(1);
      return;
    }

    if (formData.endDate <= formData.startDate) {
      setFormAlert({
        title: "Invalid End Date",
        message: "End date must be later than start date.",
      });
      setStep(1);
      return;
    }

    if (!String(formData.specialRequirements || "").trim()) {
      setFormAlert({
        title: "Requirement Required",
        message: "Please enter your detailed requirement before submitting the query.",
      });
      setStep(3);
      return;
    }

    try {
      const payload = {
        ...formData,
        travelerDetails: buildTravelerPayload(),
      };

      const response = queryToEdit
        ? await API.put(
            isOpsView
              ? `/ops/manager/queries/${queryToEdit._id}`
              : `/agent/queries/${queryToEdit._id}`,
            payload,
          )
        : await API.post("/agent/queries", payload);
      onCreated?.(response?.data?.query);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error(error.response?.data || error.message);
      window.alert(error?.response?.data?.message || "Unable to save query right now.");
    }
  };

  const closeModal = (shouldReset = false) => {
    setFormAlert(null);
    setShowSuccessPopup(false);
    setIsModalVisible(false);

    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      if (shouldReset) {
        resetForm();
      }
      onClose?.();
    }, 260);
  };

  const handlePopupClose = () => {
    closeModal(true);
  };

  const stepVariant = {
    hidden: { opacity: 0, x: 18 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0,
      x: -14,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    },
  };

  const handleClose = (e) => {
    e?.stopPropagation?.();
    closeModal();
  };

  const destinationValueSet = new Set(
    destinationOptions.map((option) => String(option?.label || `${option?.city || ""}, ${option?.country || ""}`).trim()),
  );
  const destinationPlaceholder = destinationsLoading
    ? "Loading destinations..."
    : destinationLoadError || "Select destination";
  const normalizedDestinationSearch = destinationSearch.trim().toLowerCase();
  const destinationItems = [
    ...(formData.destination && !destinationValueSet.has(String(formData.destination).trim())
      ? [
          {
            label: formData.destination,
            city: String(formData.destination || "").split(",")[0]?.trim() || formData.destination,
            country: parseCountryFromDestinationLabel(formData.destination),
          },
        ]
      : []),
    ...destinationOptions,
  ]
    .map((option) => {
      const label = String(option?.label || `${option?.city || ""}, ${option?.country || ""}`).trim();
      const country = getDestinationCountry({ ...option, label });

      return {
        ...option,
        label,
        country,
        flagUrl: getCountryFlagUrl(country),
      };
    })
    .filter((option) => option.label)
    .map((option, index) => ({
      ...option,
      optionKey: String(option?._id || `fallback-${index}-${option.label}`),
    }));
  const visibleDestinationItems = destinationItems
    .map((option, index) => {
      const city = String(option?.city || "").toLowerCase();
      const country = String(option?.country || "").toLowerCase();
      const label = String(option?.label || "").toLowerCase();
      let rank = 0;

      if (normalizedDestinationSearch) {
        if (city.startsWith(normalizedDestinationSearch) || country.startsWith(normalizedDestinationSearch)) {
          rank = 1;
        } else if (label.includes(normalizedDestinationSearch)) {
          rank = 2;
        } else {
          rank = -1;
        }
      }

      return { ...option, index, rank };
    })
    .filter((option) => option.rank >= 0)
    .sort((left, right) => {
      if (!normalizedDestinationSearch) return left.index - right.index;
      if (left.rank !== right.rank) return left.rank - right.rank;
      return left.label.localeCompare(right.label);
    });
  const selectedDestinationItem = destinationItems.find(
    (option) => String(option?.label || "").trim().toLowerCase() === String(formData.destination || "").trim().toLowerCase(),
  );
  const selectedDestinationFlagUrl = getCountryFlagUrl(
    getDestinationCountry(selectedDestinationItem || { label: formData.destination }),
  );
  const selectedHotelCategories = formData.hotelCategory
    ? formData.hotelCategory.split(",").map((category) => category.trim()).filter(Boolean)
    : [];
  const hotelCategoryItems = Array.from(
    new Set([
      ...selectedHotelCategories,
      ...hotelCategoryOptions.map((category) => String(category || "").trim()).filter(Boolean),
    ]),
  );
  const adultCount = Number(formData.numberOfAdults || 0);
  const childCount = Number(formData.numberOfChildren || 0);
  const childAgeLabel = formData.childTravelers
    .map((traveler, index) => {
      const age = Number(traveler.age || 0);
      return age > 0 ? `Child ${index + 1}: ${age} yrs` : "";
    })
    .filter(Boolean)
    .join(", ");
  const passengerMixLabel =
    [
      adultCount > 0 ? `${adultCount} Adult${adultCount === 1 ? "" : "s"}` : "",
      childCount > 0 ? `${childCount} ${childCount === 1 ? "Child" : "Children"}` : "",
    ]
      .filter(Boolean)
      .join(", ") || "Traveler count pending";
  const requestedServices = [
    hotelRequired ? "Hotel" : "",
    formData.transportRequired ? "Transport" : "",
    formData.sightseeingRequired ? "Sightseeing" : "",
  ].filter(Boolean);
  const budgetPerPerson = Number(formData.customerBudget || 0);
  const stayPreferenceLabel = hotelRequired
    ? selectedHotelCategories.length
      ? selectedHotelCategories.join(", ")
      : "Hotel required, category open"
    : "Hotel not requested";
  const serviceFocusLabel = requestedServices.length
    ? requestedServices.join(" + ")
    : "Requirement note based plan";
  const travelProfileRows = [
    {
      label: "Passenger Mix",
      value: childAgeLabel ? `${passengerMixLabel} | ${childAgeLabel}` : passengerMixLabel,
      badge: "PAX",
      badgeClass: "border-blue-100/70 bg-blue-50 text-blue-700",
    },
    {
      label: "Stay & Services",
      value: `${stayPreferenceLabel} | ${serviceFocusLabel}`,
      badge: "Plan",
      badgeClass: "border-emerald-100/70 bg-emerald-50 text-emerald-700",
    },
    {
      label: "Budget & Notes",
      value:
        budgetPerPerson > 0
          ? `INR ${Math.round(budgetPerPerson).toLocaleString("en-IN")} / person`
          : "Budget not shared",
      badge: String(formData.specialRequirements || "").trim() ? "Notes" : "Open",
      badgeClass: "border-slate-200 bg-slate-50 text-slate-600",
    },
  ];

  const handleDestinationSelect = (option) => {
    if (formAlert) setFormAlert(null);
    setFormData((prev) => ({
      ...prev,
      destination: option.label,
    }));
    setSelectedDestinationOptionId(option.optionKey);
    setDestinationSearch("");
    setDestinationDropdownOpen(false);
  };

  const renderDestinationSelect = ({ compact = false } = {}) => (
    <div ref={destinationDropdownRef} className="relative z-30">
      {selectedDestinationFlagUrl ? (
        <span className={`absolute left-3 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center ${compact ? "" : "sm:left-4"}`}>
          <img
            src={selectedDestinationFlagUrl}
            alt=""
            className="h-[13px] w-[20px] object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </span>
      ) : (
        <MapPin
          size={16}
          className={`absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400 ${compact ? "" : "sm:left-4"}`}
        />
      )}
      <input
        name="destination"
        value={formData.destination}
        placeholder={destinationPlaceholder}
        autoComplete="off"
        onFocus={() => {
          setDestinationDropdownOpen(true);
          setDestinationSearch("");
        }}
        onChange={(event) => {
          if (formAlert) setFormAlert(null);
          setSelectedDestinationOptionId("");
          setDestinationSearch(event.target.value);
          setDestinationDropdownOpen(true);
          setFormData((prev) => ({
            ...prev,
            destination: event.target.value,
          }));
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setDestinationDropdownOpen(false);
          }
          if (event.key === "Enter") {
            event.preventDefault();
            setDestinationDropdownOpen(false);
          }
        }}
        className={`w-full rounded-full border border-gray-300 bg-white pl-9 pr-9 text-left focus:outline-none focus:border-gray-400 transition duration-150 ${
          compact ? "py-1.5 text-sm" : "py-1.5 sm:pl-10"
        }`}
      />
      <ChevronDown
        size={16}
        onClick={() => {
          setDestinationSearch("");
          setDestinationDropdownOpen((prev) => !prev);
        }}
        className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition ${
          destinationDropdownOpen ? "rotate-180" : ""
        }`}
      />
      {destinationDropdownOpen && !destinationsLoading && destinationDropdownPosition && createPortal(
        <div
          ref={destinationMenuRef}
          style={{
            left: destinationDropdownPosition.left,
            top: destinationDropdownPosition.top,
            width: destinationDropdownPosition.width,
          }}
          className="fixed z-[80] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15"
        >
          <div className="modal-transparent-scroll max-h-60 overflow-y-auto py-1">
          {visibleDestinationItems.length ? (
            visibleDestinationItems.map((option) => (
              <button
                type="button"
                key={option.optionKey}
                onClick={() => handleDestinationSelect(option)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-100 ${
                  selectedDestinationOptionId === option.optionKey ? "bg-slate-900 text-white hover:bg-slate-900" : "text-slate-800"
                }`}
              >
                <span className="flex h-5 w-6 shrink-0 items-center justify-center">
                  {option.flagUrl ? (
                    <img
                      src={option.flagUrl}
                      alt=""
                      className="h-[13px] w-[20px] object-contain"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <MapPin size={14} className="text-slate-400" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate" title={option.label}>
                  {option.label}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">
              No destinations found
            </div>
          )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {isModalVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:px-4 sm:py-6"
          >
            <motion.div
              onClick={() => closeModal()}
              initial={{ opacity: 0, backdropFilter: "blur(0px)", WebkitBackdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)", WebkitBackdropFilter: "blur(0px)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-0 bg-black/30"
            />

            <motion.section
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.97, y: 26 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985, y: 18 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`relative z-10 flex max-h-[calc(100vh-20px)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/95 p-4 shadow-2xl sm:max-h-[calc(100vh-32px)] sm:p-4.5 ${isOpsView ? 'max-w-[460px]' : 'max-w-[520px]'}`}
            >
            <div className="relative -mx-4 -mt-4 mb-4 bg-gradient-to-r from-black via-[#000814] to-[#001f54] px-5 py-4 text-white sm:-mx-5 sm:-mt-5 sm:mb-5 shadow-md">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white transition bg-transparent border-none outline-none p-0 cursor-pointer font-medium"
                >
                  <ArrowLeft className="h-5 w-5 stroke-[2]" />
                  <span className="text-sm font-semibold">Back</span>
                </button>
                <div className="text-right">
                  <h3 className="text-sm font-bold tracking-wide uppercase text-slate-300">
                    {queryToEdit ? "Edit Query" : "New Query"}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Step {step} of 3</p>
                </div>
              </div>
            </div>

          <AnimatePresence>
            {formAlert && (
              <motion.div
                initial={{ opacity: 0, y: -10, x: 20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -10, x: 20 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="pointer-events-none fixed top-4 right-4 z-[100] w-auto max-w-max px-4 sm:px-0"
              >
                <div className="pointer-events-auto rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.98)_0%,rgba(254,243,199,0.96)_100%)] px-3.5 py-2.5 shadow-[0_16px_40px_rgba(120,53,15,0.18)]">
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-xl bg-amber-100 text-amber-700 shrink-0 flex items-center justify-center animate-pulse">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700 whitespace-nowrap">
                        {formAlert.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-amber-900/95 whitespace-nowrap">
                        {formAlert.message}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormAlert(null)}
                      className="h-6 w-6 rounded-full text-amber-500 transition hover:bg-white/60 hover:text-amber-700 shrink-0 flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="custom-scroll flex-1 overflow-y-auto pr-1 flex flex-col">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full bg-transparent shadow-none flex-1 flex flex-col"
                >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-2 text-indigo-600 shadow-sm border border-indigo-100">
                    {queryToEdit ? <Compass className="h-5 w-5 animate-[spin_8s_linear_infinite]" /> : <Globe className="h-5 w-5 text-indigo-500 animate-[spin_12s_linear_infinite]" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{queryToEdit ? "Edit Query" : "Create New Query"}</h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Tell us about the travel requirements.
                    </p>
                  </div>
                </div>

                <div className={`${isOpsView ? "" : "relative"} mb-3`}>
                  <label className="mb-1 block text-sm font-medium">Destination</label>
                  {renderDestinationSelect({ compact: isOpsView })}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      min={queryToEdit ? undefined : todayDate}
                      className="w-full rounded-full border border-gray-300 px-4.5 py-1.5 focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      min={formData.startDate || (queryToEdit ? undefined : todayDate)}
                      className="w-full rounded-full border border-gray-300 px-4.5 py-1.5 focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      if (!String(formData.destination || "").trim()) {
                        setFormAlert({
                          title: "Destination Required",
                          message: "Please select a destination before moving ahead.",
                        });
                        return;
                      }

                      if (!formData.startDate || !formData.endDate) {
                        setFormAlert({
                          title: "Travel Dates Required",
                          message: "Please select both start date and end date before moving ahead.",
                        });
                        return;
                      }

                      if (!queryToEdit && formData.startDate < todayDate) {
                        setFormAlert({
                          title: "Invalid Start Date",
                          message: "Start date can only be today or a future date.",
                        });
                        return;
                      }

                      if (formData.endDate <= formData.startDate) {
                        setFormAlert({
                          title: "Invalid End Date",
                          message: "End date must be later than start date.",
                        });
                        return;
                      }

                      setFormAlert(null);
                      setStep(2);
                    }}
                    className="flex cursor-pointer items-center gap-1 rounded-full bg-gradient-to-r from-black to-[#001d3d] hover:from-[#000814] hover:to-[#003566] px-6 py-1.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] duration-150"
                  >
                    Next →
                  </button>
                </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full bg-transparent shadow-none flex-1 flex flex-col"
                >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-2 text-indigo-600 shadow-sm border border-indigo-100">
                    {queryToEdit ? <Compass className="h-5 w-5 animate-[spin_8s_linear_infinite]" /> : <Globe className="h-5 w-5 text-indigo-500 animate-[spin_12s_linear_infinite]" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{queryToEdit ? "Edit Query" : "Create New Query"}</h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Tell us about the travel requirements.
                    </p>
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Adults</label>
                    <input
                      type="number"
                      min="1"
                      name="numberOfAdults"
                      value={formData.numberOfAdults}
                      onChange={handleChange}
                      className="w-full rounded-full border border-gray-300 px-4 py-1.5 focus:outline-none focus:border-gray-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Children</label>
                    <input
                      type="number"
                      min="0"
                      name="numberOfChildren"
                      value={formData.numberOfChildren}
                      onChange={handleChange}
                      className="w-full rounded-full border border-gray-300 px-4 py-1.5 focus:outline-none focus:border-gray-400 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <AnimatePresence initial={false}>
                    {Number(formData.numberOfChildren || 0) > 0 && (
                      <motion.div
                        key="child-traveler-details"
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                          <p className="text-sm font-semibold text-slate-800">Child Traveler Details</p>
                          <div className="mt-2.5 grid gap-2">
                            {formData.childTravelers.map((traveler, index) => (
                              <div
                                key={`child-${index}`}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/60 bg-white px-3.5 py-1.5 shadow-sm"
                              >
                                <span className="text-sm font-medium text-slate-700">
                                  Child {index + 1} Age
                                </span>
                                <select
                                  value={traveler.age}
                                  onChange={(e) => handleTravelerChange("child", index, "age", e.target.value)}
                                  className="rounded-full border border-gray-300 px-4 py-1 text-sm focus:outline-none focus:border-gray-400 bg-white text-slate-800 cursor-pointer min-w-[120px]"
                                >
                                  <option value="">Select Age</option>
                                  {childAgeOptions.map((age) => (
                                    <option key={age} value={age}>
                                      {age} Years
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mb-3 mt-1.5">
                  <label className="mb-1 block text-sm font-medium">Budget per person (Optional)</label>
                  <input
                    type="number"
                    name="customerBudget"
                    placeholder="e.g. 50000"
                    value={formData.customerBudget}
                    onChange={handleChange}
                    className="w-full rounded-full border border-gray-300 px-4 py-1.5 focus:outline-none focus:border-gray-400 text-sm"
                  />
                </div>

                <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
                    <input
                      type="checkbox"
                      name="hotelRequired"
                      checked={hotelRequired}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setHotelRequired(checked);
                        setFormData((prev) => ({ ...prev, hotelCategory: "" }));
                      }}
                      className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                    />
                    Hotel Required
                  </label>

                  <AnimatePresence initial={false}>
                    {hotelRequired && (
                      <motion.div
                        key="hotel-category-select"
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                            Hotel Category
                          </label>
                          {hotelCategoryItems.length ? (
                          <div className="flex flex-wrap gap-4">
                            {hotelCategoryItems.map((category) => {
                              const isSelected = selectedHotelCategories.includes(category);
                              return (
                                <label
                                  key={category}
                                  className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => handleHotelCategoryChange(category, e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                                  />
                                  {category}
                                </label>
                              );
                            })}
                          </div>
                          ) : (
                            <p className="text-sm text-slate-500">
                              No hotel categories found from the DMC hotel list.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid gap-3 sm:grid-cols-2 pt-1">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                      <input
                        type="checkbox"
                        name="transportRequired"
                        checked={formData.transportRequired}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                      />
                      Transport Required
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                      <input
                        type="checkbox"
                        name="sightseeingRequired"
                        checked={formData.sightseeingRequired}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                      />
                      Sightseeing Required
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => {
                      setFormAlert(null);
                      setStep(1);
                    }}
                    className="cursor-pointer rounded-full border border-gray-300 bg-white hover:bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-700 transition active:scale-[0.98] duration-150"
                  >
                    Previous
                  </button>

                  <button
                    onClick={() => {
                      if (!validateTravelerStep()) return;
                      setFormAlert(null);
                      setStep(3);
                    }}
                    className="flex cursor-pointer items-center gap-1 rounded-full bg-gradient-to-r from-black to-[#001d3d] hover:from-[#000814] hover:to-[#003566] px-6 py-1.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] duration-150"
                  >
                    Next →
                  </button>
                </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full bg-transparent shadow-none flex-1 flex flex-col"
                >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-2 text-indigo-600 shadow-sm border border-indigo-100">
                    {queryToEdit ? <Compass className="h-5 w-5 animate-[spin_8s_linear_infinite]" /> : <Globe className="h-5 w-5 text-indigo-500 animate-[spin_12s_linear_infinite]" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{queryToEdit ? "Edit Query" : "Create New Query"}</h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Tell us about the travel requirements.
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium">
                    Detailed Requirement <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="specialRequirements"
                    placeholder="e.g. Detailed itinerary, preferred hotel chain, specific sightseeing spots, flight details, meal requests..."
                    value={formData.specialRequirements}
                    onChange={handleChange}
                    rows={5}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>

                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => {
                      setFormAlert(null);
                      setStep(2);
                    }}
                    className="cursor-pointer rounded-full border border-gray-300 bg-white hover:bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-700 transition active:scale-[0.98] duration-150"
                  >
                    Previous
                  </button>

                  <button
                    onClick={handleSubmit}
                    className="cursor-pointer rounded-full bg-gradient-to-r from-black to-[#001d3d] hover:from-[#000814] hover:to-[#003566] px-6 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] duration-150"
                  >
                    {queryToEdit ? "Save Changes →" : "Submit Query →"}
                  </button>
                </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-2xl animate-scale-in"
            >
              <div className="relative bg-gradient-to-r from-[#107c41] via-[#0e4e2c] to-[#0b1e36] px-6 py-5 text-white">
                <button
                  onClick={handlePopupClose}
                  className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white transition hover:bg-white/20"
                >
                  <X size={15} />
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm backdrop-blur-md">
                    <CheckCircle2 size={22} className="text-emerald-100" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-100/80">
                      {queryToEdit ? "Query Updated" : "Query Submitted"}
                    </p>
                    <h3 className="text-base font-bold leading-tight">
                      {queryToEdit ? "Travel Query Updated" : "Travel Query Created Successfully"}
                    </h3>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-emerald-50/85 font-medium leading-relaxed">
                  {queryToEdit
                    ? "Your query details have been updated successfully and will be processed shortly."
                    : "Your request is now in the pipeline and will move into ops processing shortly."}
                </p>
              </div>

              <div className="px-6 py-5">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-slate-100/50 px-2.5 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Destination</p>
                    <p className="mt-1 text-xs font-bold text-slate-900 truncate" title={formData.destination}>
                      {formData.destination || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-slate-100/50 px-2.5 py-2 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Dates</p>
                    <p className="mt-1 text-xs font-bold text-slate-900 whitespace-nowrap">
                      {formatDate(formData.startDate)} - {formatDate(formData.endDate)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-slate-100/50 px-2.5 py-2 text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Travellers</p>
                    <p className="mt-1 text-xs font-bold text-slate-900">
                      {Number(formData.numberOfAdults || 0) + Number(formData.numberOfChildren || 0)} PAX
                    </p>
                  </div>
                </div>

                {/* TRIP PROFILE SUMMARY */}
                <div className="mt-3 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                  <div className="mb-1.5 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <User size={13} className="text-slate-500" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Travel Profile Summary</p>
                  </div>
                  <div className="space-y-1.5">
                    {travelProfileRows.map((item) => (
                      <div key={item.label} className="flex min-h-[32px] items-center justify-between gap-3 rounded-xl px-1.5 text-xs">
                        <span className="min-w-0">
                          <span className="block text-[8.5px] font-bold uppercase tracking-wider text-slate-400">
                            {item.label}
                          </span>
                          <span className="block max-w-[360px] truncate font-semibold leading-5 text-slate-800" title={item.value}>
                            {item.value}
                          </span>
                        </span>
                        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-bold ${item.badgeClass}`}>
                          {item.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 px-3.5 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 rounded-lg bg-gradient-to-tr from-emerald-100 to-teal-100 p-1.5 text-emerald-700 shadow-sm">
                      <Sparkles size={13} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900 leading-tight">
                        {queryToEdit ? "Information" : "Next Step"}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-emerald-800/90">
                        {queryToEdit
                          ? "The operations team will be notified of the updates and adapt the itinerary/quotation if required."
                          : "Ops team will review availability, prepare pricing, and move this query forward for quotation."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-3.5">
                  <button
                    onClick={handlePopupClose}
                    className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4.5 py-1.5 text-xs font-semibold text-slate-700 transition active:scale-95 duration-150 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={handlePopupClose}
                    className="rounded-xl bg-gradient-to-r from-[#107c41] via-[#0e4e2c] to-[#0b1e36] px-5 py-2 text-xs font-bold text-white transition hover:opacity-95 shadow-[0_2px_8px_rgba(16,124,65,0.25)] active:scale-95 duration-150 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateNewQueries;
