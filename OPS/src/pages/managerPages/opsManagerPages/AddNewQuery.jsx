import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  Info,
  PlusCircle,
  MinusCircle,
  Mail,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flag,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../../utils/Api";
import AddTripSourceModal, {
  CountryCodeDropdown,
} from "../../../modal/AddTripSourceModal";

import {
  ALL_COUNTRY_NAMES,
  getPopularOriginCities,
  getPopularDestinations,
} from "../../../utils/geoUtils";

const CHILD_AGE_OPTIONS = [
  "1y",
  "2y",
  "3y",
  "4y",
  "5y",
  "6y",
  "7y",
  "8y",
  "9y",
  "10y",
  "11y",
  "12y",
  "13y",
  "14y",
  "15y",
  "16y",
  "17y",
  "18y",
];

const INITIAL_ORIGIN_CITIES = getPopularOriginCities();

const NATIONALITY_OPTIONS = ALL_COUNTRY_NAMES;

const MONTH_NAMES_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const parseDateValue = (str) => {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    dateObj: d,
  };
};

const formatDateValue = (year, month, day) => {
  return `${MONTH_NAMES_FULL[month]} ${day}, ${year}`;
};

const isPastDate = (dateStr) => {
  if (!dateStr) return false;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );
  return target < today;
};

function CustomDatePicker({
  value = "",
  onChange,
  placeholder = "September 1, 2026",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState("bottom");
  const dropdownRef = useRef(null);

  const parsed = parseDateValue(value);
  const today = new Date();

  const [viewYear, setViewYear] = useState(
    parsed ? parsed.year : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    parsed ? parsed.month : today.getMonth()
  );

  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const dropdownHeight = 310;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          setPlacement("top");
        } else {
          setPlacement("bottom");
        }
      }
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const handlePrevMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (year, month, day, e) => {
    e.preventDefault();
    e.stopPropagation();
    const formatted = formatDateValue(year, month, day);
    onChange(formatted);
    setIsOpen(false);
  };

  // Generate days grid
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days = [];

  // Trailing previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    days.push({
      day,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    days.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete grid
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    days.push({
      day: i,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
    });
  }

  const isSelected = (cell) => {
    if (!parsed) return false;
    return (
      parsed.year === cell.year &&
      parsed.month === cell.month &&
      parsed.day === cell.day
    );
  };

  const isToday = (cell) => {
    return (
      today.getFullYear() === cell.year &&
      today.getMonth() === cell.month &&
      today.getDate() === cell.day
    );
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          const p = parseDateValue(e.target.value);
          if (p) {
            setViewYear(p.year);
            setViewMonth(p.month);
          }
        }}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none transition h-[42px] cursor-pointer ${
          isOpen
            ? "border-[#3451B2] ring-1 ring-[#3451B2]"
            : "border-[#cbd5e1]"
        }`}
      />

      {isOpen && (
        <div
          className={`absolute left-0 z-50 bg-white border border-[#cbd5e1] rounded-xl shadow-xl p-4 w-[285px] sm:w-[295px] select-none ${
            placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {/* Header: Month Year + Prev/Next Controls */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[14.5px] font-bold text-[#1e293b] tracking-tight">
              {MONTH_NAMES_SHORT[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1 text-[#475569]">
              <button
                type="button"
                onMouseDown={handlePrevMonth}
                className="p-1 hover:bg-slate-100 rounded-md transition cursor-pointer text-[#475569] hover:text-[#1e293b]"
                title="Previous month"
              >
                <ChevronLeft size={16} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onMouseDown={handleNextMonth}
                className="p-1 hover:bg-slate-100 rounded-md transition cursor-pointer text-[#475569] hover:text-[#1e293b]"
                title="Next month"
              >
                <ChevronRight size={16} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 text-center mb-1.5">
            {DAYS_OF_WEEK.map((dw) => (
              <span
                key={dw}
                className="text-[12px] font-medium text-[#64748b] py-1"
              >
                {dw}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {days.map((cell, idx) => {
              const selected = isSelected(cell);
              const todayCell = isToday(cell);

              let cellClasses =
                "h-8 w-8 mx-auto flex items-center justify-center text-[13px] transition cursor-pointer rounded-[6px] ";

              if (selected) {
                cellClasses +=
                  "bg-[#3451B2] text-white font-semibold shadow-xs";
              } else if (todayCell) {
                cellClasses +=
                  "bg-[#f1f5f9] text-[#1e293b] font-semibold hover:bg-slate-200";
              } else if (!cell.isCurrentMonth) {
                cellClasses +=
                  "text-[#94a3b8] hover:bg-slate-100 font-normal";
              } else {
                cellClasses +=
                  "text-[#1e293b] hover:bg-slate-100 font-medium";
              }

              return (
                <div
                  key={idx}
                  onMouseDown={(e) =>
                    handleSelectDay(cell.year, cell.month, cell.day, e)
                  }
                  className={cellClasses}
                >
                  {cell.day}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ChildAgeDropdown({ value = "", onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState("bottom"); // "bottom" | "top"
  const dropdownRef = useRef(null);
  const selectedItemRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const dropdownHeight = 240;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          setPlacement("top");
        } else {
          setPlacement("bottom");
        }
      }
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "instant",
      });
    }
  }, [isOpen]);

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`border rounded-[6px] px-2.5 py-2 text-[14px] bg-white text-[#1e293b] font-medium flex items-center justify-between gap-1.5 h-[42px] hover:bg-slate-50 transition cursor-pointer min-w-[68px] ${
          isOpen
            ? "border-[#3451B2] ring-1 ring-[#3451B2]"
            : "border-[#cbd5e1]"
        }`}
      >
        <span className="min-w-[20px] text-left">{value || ""}</span>
        <ChevronDown
          size={14}
          className={`text-[#64748b] shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-[#3451B2]" : ""
          }`}
        />
      </button>

      {/* Tooltip when age is empty */}
      {!value && !isOpen && (
        <div className="absolute top-full left-0 mt-1 z-40 bg-white border border-slate-700 text-[11.5px] text-slate-800 px-2 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none">
          Inputs without age will be auto-discarded.
        </div>
      )}

      {isOpen && (
        <div
          className={`absolute left-0 z-[150] w-full min-w-[72px] bg-white border border-[#cbd5e1] rounded-[6px] shadow-xl max-h-56 overflow-y-auto custom-scroll py-1 ${
            placement === "top" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {CHILD_AGE_OPTIONS.map((age) => {
            const isSelected = value === age;
            return (
              <div
                key={age}
                ref={isSelected ? selectedItemRef : null}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(age);
                  setIsOpen(false);
                }}
                className={`px-3 py-1.5 text-[13.5px] font-medium cursor-pointer transition select-none text-center ${
                  isSelected
                    ? "bg-[#3451B2] text-white font-semibold"
                    : "text-[#1e293b] hover:bg-slate-100"
                }`}
              >
                <span>{age}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const SALUTATION_OPTIONS = ["Mr.", "Mrs.", "Ms."];

export default function AddNewQuery() {
  const navigate = useNavigate();

  // Dynamic Query Sources from DB
  const [sources, setSources] = useState([]);
  const [selectedSourceObj, setSelectedSourceObj] = useState(null);

  const [querySource, setQuerySource] = useState("");
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const sourceDropdownRef = useRef(null);

  const [referenceId, setReferenceId] = useState("");
  const [salesTeam, setSalesTeam] = useState("You");
  const [tags, setTags] = useState("");

  // Fetch saved trip sources on mount
  useEffect(() => {
    const fetchTripSources = async () => {
      try {
        const res = await API.get("/ops/manager/trip-sources");
        if (res?.data?.data && Array.isArray(res.data.data)) {
          setSources(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load trip sources", err);
      }
    };
    fetchTripSources();
  }, []);

  // Destination & Duration
  const [destinationsList, setDestinationsList] = useState(() =>
    getPopularDestinations()
  );
  const [destination, setDestination] = useState("");
  const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] =
    useState(false);
  const destinationDropdownRef = useRef(null);
  const [startDate, setStartDate] = useState("");
  const [nights, setNights] = useState(1);
  const [adults, setAdults] = useState(1);
  const [childrenAges, setChildrenAges] = useState([]);
  const [foc, setFoc] = useState(0);

  // Guest Details
  const [salutation, setSalutation] = useState("");
  const [isSalutationOpen, setIsSalutationOpen] = useState(false);
  const salutationRef = useRef(null);

  const [guestName, setGuestName] = useState("");

  // Dynamic Phone Numbers
  const [phoneNumbers, setPhoneNumbers] = useState([
    { id: 1, countryCode: "91-IN", number: "", isPrimary: true },
  ]);

  // Dynamic Email & Location
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");

  const [showLocation, setShowLocation] = useState(false);
  const [originCities, setOriginCities] = useState(INITIAL_ORIGIN_CITIES);
  const [originCity, setOriginCity] = useState("");
  const [isOriginDropdownOpen, setIsOriginDropdownOpen] = useState(false);
  const originDropdownRef = useRef(null);

  const [nationality, setNationality] = useState("");
  const [isNationalityDropdownOpen, setIsNationalityDropdownOpen] =
    useState(false);
  const nationalityDropdownRef = useRef(null);

  // Comments
  const [comments, setComments] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sourceDropdownRef.current &&
        !sourceDropdownRef.current.contains(e.target)
      ) {
        setIsSourceDropdownOpen(false);
      }
      if (
        destinationDropdownRef.current &&
        !destinationDropdownRef.current.contains(e.target)
      ) {
        setIsDestinationDropdownOpen(false);
      }
      if (
        salutationRef.current &&
        !salutationRef.current.contains(e.target)
      ) {
        setIsSalutationOpen(false);
      }
      if (
        originDropdownRef.current &&
        !originDropdownRef.current.contains(e.target)
      ) {
        setIsOriginDropdownOpen(false);
      }
      if (
        nationalityDropdownRef.current &&
        !nationalityDropdownRef.current.contains(e.target)
      ) {
        setIsNationalityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter sources
  const filteredSources = sources.filter((s) => {
    const q = querySource.trim().toLowerCase();
    if (!q) return true;
    const nameMatch = s.name?.toLowerCase().includes(q);
    const locMatch =
      s.location?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q);
    return nameMatch || locMatch;
  });

  const isExactMatch = sources.some(
    (s) => s.name?.toLowerCase() === querySource.trim().toLowerCase()
  );

  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [modalInitialName, setModalInitialName] = useState("");

  const handleOpenAddSourceModal = (nameToAdd) => {
    const trimmed = nameToAdd?.trim() || "";
    setModalInitialName(trimmed);
    setIsAddSourceModalOpen(true);
    setIsSourceDropdownOpen(false);
  };

  const handleSaveModalSource = (newSource) => {
    setSources((prev) => [newSource, ...prev]);
    setQuerySource(newSource.name);
    setSelectedSourceObj(newSource);
  };

  const handleSelectSource = (source) => {
    setQuerySource(source.name);
    setSelectedSourceObj(source);
    setIsSourceDropdownOpen(false);
  };

  // Filter destinations
  const filteredDestinations = destinationsList.filter((dest) => {
    const q = destination.trim().toLowerCase();
    if (!q) return true;
    return dest.toLowerCase().includes(q);
  });

  const isExactDestinationMatch = destinationsList.some(
    (d) => d.trim().toLowerCase() === destination.trim().toLowerCase()
  );

  const handleSelectDestination = (dest) => {
    setDestination(dest);
    setIsDestinationDropdownOpen(false);
  };

  const handleAddDestination = (newDest) => {
    const trimmed = newDest.trim();
    if (!trimmed) return;
    if (!destinationsList.includes(trimmed)) {
      setDestinationsList((prev) => [trimmed, ...prev]);
    }
    setDestination(trimmed);
    setIsDestinationDropdownOpen(false);
  };

  // Filter origin cities
  const filteredOriginCities = originCities.filter((city) => {
    const q = originCity.trim().toLowerCase();
    if (!q) return true;
    return city.toLowerCase().includes(q);
  });

  const isExactOriginMatch = originCities.some(
    (c) => c.trim().toLowerCase() === originCity.trim().toLowerCase()
  );

  const handleSelectOrigin = (city) => {
    setOriginCity(city);
    setIsOriginDropdownOpen(false);
  };

  const handleAddOrigin = (newCity) => {
    const trimmed = newCity.trim();
    if (!trimmed) return;
    if (!originCities.includes(trimmed)) {
      setOriginCities((prev) => [trimmed, ...prev]);
    }
    setOriginCity(trimmed);
    setIsOriginDropdownOpen(false);
  };

  // Filter nationalities
  const filteredNationalities = NATIONALITY_OPTIONS.filter((nat) => {
    const q = nationality.trim().toLowerCase();
    if (!q) return true;
    return nat.toLowerCase().includes(q);
  });

  const handleSelectNationality = (nat) => {
    setNationality(nat);
    setIsNationalityDropdownOpen(false);
  };

  // Helper for night/day label
  const nightsNum = parseInt(nights, 10) || 0;
  const daysNum = nightsNum + 1;
  const durationLabel = `${nightsNum} Night${nightsNum === 1 ? "" : "s"}, ${daysNum} Days`;

  // Children with Ages handlers
  const handleAddChild = () => {
    setChildrenAges((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), age: "" },
    ]);
  };

  const handleRemoveChild = () => {
    setChildrenAges((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, prev.length - 1);
    });
  };

  const handleChildAgeChange = (id, newAge) => {
    setChildrenAges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, age: newAge } : c))
    );
  };

  // Phone number handlers
  const handleAddPhone = () => {
    setPhoneNumbers((prev) => [
      ...prev,
      {
        id: Date.now(),
        countryCode: "91-IN",
        number: "",
        isPrimary: false,
      },
    ]);
  };

  const handleRemovePhone = (id) => {
    setPhoneNumbers((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length > 0 && !filtered.some((p) => p.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSetPrimaryPhone = (id) => {
    setPhoneNumbers((prev) =>
      prev.map((p) => ({
        ...p,
        isPrimary: p.id === id,
      }))
    );
  };

  const handlePhoneChange = (id, field, value) => {
    setPhoneNumbers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!querySource.trim()) {
      toast.error("Query Source is required");
      return;
    }
    if (!destination.trim()) {
      toast.error("Destination is required");
      return;
    }
    if (!startDate.trim()) {
      toast.error("Start Date is required");
      return;
    }

    const parsedStart = new Date(startDate);
    if (isNaN(parsedStart.getTime())) {
      toast.error("Please select a valid start date");
      return;
    }

    const nightsCount = parseInt(nights, 10) || 1;
    const parsedEnd = new Date(parsedStart);
    parsedEnd.setDate(parsedEnd.getDate() + nightsCount);

    const primaryPhoneObj =
      phoneNumbers.find((p) => p.isPrimary) || phoneNumbers[0];

    const matchedSource =
      selectedSourceObj ||
      sources.find(
        (s) => s.name?.toLowerCase() === querySource.trim().toLowerCase()
      );

    const payload = {
      tripSource: matchedSource?._id || matchedSource?.id || null,
      querySource: querySource.trim(),
      querySourceType: matchedSource?.sourceType || "b2b",
      referenceId: referenceId.trim(),
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      guestDetails: {
        salutation: salutation.trim(),
        name: guestName.trim() || "Guest",
        phone: primaryPhoneObj?.number || "",
        phoneNumbers: phoneNumbers.map((p) => ({
          countryCode: p.countryCode || "91-IN",
          number: p.number || "",
          isPrimary: Boolean(p.isPrimary),
        })),
        email: email.trim().toLowerCase(),
        originCity: originCity.trim(),
        nationality: nationality.trim() || "India",
      },
      destination: destination.trim(),
      startDate: parsedStart,
      endDate: parsedEnd,
      nights: nightsCount,
      numberOfAdults: parseInt(adults, 10) || 1,
      numberOfChildren: childrenAges.length,
      childrenAges: childrenAges.map((c) => ({
        id: String(c.id),
        age: String(c.age || ""),
      })),
      foc: parseInt(foc, 10) || 0,
      salesTeam: salesTeam || "You",
      comments: comments.trim(),
      specialRequirements: comments.trim(),
    };

    try {
      setIsSubmitting(true);
      const res = await API.post("/ops/manager/queries", payload);
      toast.success(res?.data?.message || "Query created successfully!");
      navigate("/operationManager/allTeamQueries");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to create query";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/operationManager/operationManagerDashboard");
  };

  const isMultiPhoneOrExpanded =
    phoneNumbers.length > 1 || showEmail || showLocation;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        .add-query-wrapper,
        .add-query-wrapper *,
        .add-query-wrapper input,
        .add-query-wrapper select,
        .add-query-wrapper textarea,
        .add-query-wrapper button,
        .add-query-wrapper p,
        .add-query-wrapper span,
        .add-query-wrapper label,
        .add-query-wrapper h2 {
          font-family: 'Inter', sans-serif !important;
        }
      `}</style>
      <div
        className="add-query-wrapper min-h-full bg-[#f8fafc] py-2.5 px-3.5 sm:px-"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="max-w-6xl  p- sm:p- text-slate-800">
          <form onSubmit={handleSave} className="space-y-0">
            {/* ================= SECTION 1: QUERY SOURCE ================= */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-12 pb-8">
              {/* Left Header */}
              <div className="w-full md:w-[320px] shrink-0">
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-6 h-6 text-[#0f172a] shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 15 5 15" />
                    <polyline points="19 15 17 15" />
                  </svg>
                  <h2 className="text-[20px] font-bold text-[#0f172a] tracking-tight">
                    Query Source
                  </h2>
                </div>
                <p className="text-[14px] text-[#64748b] font-normal leading-relaxed mt-2">
                  Please specify the query source, e.g., whether it came via B2B
                  or from another source.
                </p>
              </div>

              {/* Right Inputs */}
              <div className="flex-1 space-y-4">
                  {/* Field 1: Query Source with Searchable & Dynamic Dropdown */}
                <div className="relative max-w-[465px]" ref={sourceDropdownRef}>
                  <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                    Query Source
                  </label>
                  <input
                    type="text"
                    value={querySource}
                    onChange={(e) => {
                      setQuerySource(e.target.value);
                      setIsSourceDropdownOpen(true);
                    }}
                    onFocus={() => setIsSourceDropdownOpen(true)}
                    onClick={() => setIsSourceDropdownOpen(true)}
                    placeholder="Type to search..."
                    className="w-full border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                  />

                  {/* Dropdown Menu */}
                  {isSourceDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-[#cbd5e1] rounded-lg shadow-lg max-h-64 overflow-y-auto custom-scroll w-full">
                      {/* Dynamic Add New Source Option */}
                      {querySource.trim() && !isExactMatch && (
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleOpenAddSourceModal(querySource);
                          }}
                          className="flex items-start gap-3 px-3.5 py-2.5 hover:bg-[#f1f5f9] cursor-pointer transition border-b border-slate-100 select-none bg-blue-50/30"
                        >
                          <span className="w-4 h-4 rounded-full border border-[#3451B2] inline-block shrink-0 mt-0.5 relative">
                            <span className="w-2 h-2 rounded-full bg-[#3451B2] absolute inset-0 m-auto"></span>
                          </span>
                          <div>
                            <p className="text-[14px] font-semibold text-[#3451B2]">
                              Add new Source "{querySource.trim()}"
                            </p>
                            <p className="text-[12px] text-slate-400">
                              Click to create and select this source
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Filtered Existing Sources List */}
                      {filteredSources.length > 0 ? (
                        filteredSources.map((source) => {
                          const isSelected =
                            querySource.trim().toLowerCase() ===
                            source.name.toLowerCase();
                          return (
                            <div
                              key={source.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectSource(source);
                              }}
                              className={`flex items-start gap-3 px-3.5 py-2.5 hover:bg-[#f1f5f9] cursor-pointer transition select-none ${
                                isSelected ? "bg-[#f8fafc]" : ""
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full border inline-block shrink-0 mt-0.5 relative ${
                                  isSelected
                                    ? "border-[#3451B2]"
                                    : "border-[#94a3b8]"
                                }`}
                              >
                                {isSelected && (
                                  <span className="w-2 h-2 rounded-full bg-[#3451B2] absolute inset-0 m-auto"></span>
                                )}
                              </span>
                              <div>
                                <p className="text-[14px] font-semibold text-[#0f172a]">
                                  {source.name}
                                </p>
                                <p className="text-[12px] text-[#64748b]">
                                  {source.location}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : !querySource.trim() ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No sources available
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Row 2: Reference ID & Sales Team */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                  <div className="sm:col-span-8">
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                      Reference ID{" "}
                      <span className="text-[#94a3b8] font-normal text-[13px] ml-1">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      placeholder="1231231"
                      className="w-full border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                    />
                    <p className="text-[13px] text-[#94a3b8] font-normal mt-1">
                      A custom id for your reference regarding the query
                    </p>
                  </div>

                  {/* <div className="sm:col-span-4">
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                      Sales Team
                    </label>
                    <button
                      type="button"
                      onClick={() => {}}
                      className="border border-[#cbd5e1] bg-white rounded-lg px-4 py-2 text-[14px] font-medium text-[#3451B2] flex items-center justify-between gap-3 hover:bg-slate-50 shadow-2xs cursor-pointer h-[42px] min-w-[85px] transition"
                    >
                      <span className="font-semibold">{salesTeam}</span>
                      <Pencil size={14} className="text-[#3451B2]" />
                    </button>
                  </div> */}

                </div>

                {/* Row 3: Tags */}
                <div>
                  <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                    Tags{" "}
                    <span className="text-[#94a3b8] font-normal text-[13px] ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Search & select tags(s)..."
                    className="w-full border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[#e2e8f0] my-8" />

            {/* ================= SECTION 2: DESTINATION AND DURATION ================= */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-12 py-2 pb-8">
              {/* Left Header */}
              <div className="w-full md:w-[320px] shrink-0">
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-6 h-6 text-[#0f172a] shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  </svg>
                  <h2 className="text-[20px] font-bold text-[#0f172a] tracking-tight">
                    Destination and Duration
                  </h2>
                </div>
                <p className="text-[14px] text-[#64748b] font-normal leading-relaxed mt-2">
                  Please provide basic details such as destination, duration etc.
                  along with number of adults and children with ages
                </p>
              </div>

              {/* Right Inputs */}
              <div className="flex-1 space-y-4">
                {/* Row 1: Destinations, Start Date, No. of Nights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                  <div>
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                      Destinations
                    </label>
                    <div className="relative" ref={destinationDropdownRef}>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => {
                          setDestination(e.target.value);
                          setIsDestinationDropdownOpen(true);
                        }}
                        onFocus={() => setIsDestinationDropdownOpen(true)}
                        onClick={() => setIsDestinationDropdownOpen(true)}
                        placeholder="Type to search..."
                        className={`w-full border rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none transition h-[42px] ${
                          isDestinationDropdownOpen
                            ? "border-[#3451B2] ring-1 ring-[#3451B2]"
                            : "border-[#cbd5e1] focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2]"
                        }`}
                      />

                      {/* Dropdown Menu */}
                      {isDestinationDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-[#cbd5e1] rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scroll w-full py-1">
                          {filteredDestinations.slice(0, 60).map((dest, idx) => {
                            const isSelected =
                              destination.trim().toLowerCase() ===
                              dest.toLowerCase();
                            return (
                              <div
                                key={`${dest}-${idx}`}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectDestination(dest);
                                }}
                                className={`flex items-center gap-2.5 px-3 py-2 hover:bg-[#f1f5f9] cursor-pointer transition select-none ${
                                  isSelected ? "bg-[#f8fafc]" : ""
                                }`}
                              >
                                <span
                                  className={`w-3.5 h-3.5 rounded-full border inline-block shrink-0 relative flex items-center justify-center ${
                                    isSelected
                                      ? "border-[#3451B2]"
                                      : "border-[#94a3b8]"
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#3451B2]" />
                                  )}
                                </span>
                                <span className="text-[13.5px] text-[#1e293b] font-normal leading-tight">
                                  {dest}
                                </span>
                              </div>
                            );
                          })}

                          {/* Dynamic Add Destination Option */}
                          {destination.trim() && !isExactDestinationMatch && (
                            <div
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleAddDestination(destination);
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#f1f5f9] cursor-pointer transition select-none text-[#1e293b] border-t border-slate-100"
                            >
                              <span className="w-3.5 h-3.5 rounded-full border border-[#94a3b8] inline-block shrink-0 relative" />
                              <span className="text-[13.5px] text-[#1e293b] font-normal">
                                Add "{destination.trim()}"
                              </span>
                            </div>
                          )}

                          {filteredDestinations.length === 0 &&
                            !destination.trim() && (
                              <div className="p-3 text-center text-xs text-slate-400">
                                No destinations available
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                      Start Date
                    </label>
                    <CustomDatePicker
                      value={startDate}
                      onChange={(val) => setStartDate(val)}
                      placeholder="September 1, 2026"
                    />
                    {isPastDate(startDate) && (
                      <p className="text-[13px] text-[#b45309] font-normal mt-1.5 leading-tight">
                        You have selected a past date.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                      No. of Nights
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={nights}
                      onChange={(e) => setNights(e.target.value)}
                      className="w-full border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                    />
                    <p className="text-[14px] font-medium text-[#475569] mt-1.5">
                      {durationLabel}
                    </p>
                  </div>
                </div>

                {/* Row 2: No. of Adults, Add Children and their Ages, Total FOC */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                  <div>
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                      No. of Adults
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={adults}
                      onChange={(e) => setAdults(e.target.value)}
                      className="w-full border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                    />
                  </div>

                  <div>
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                      Add Children and their Ages
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {childrenAges.length === 0 ? (
                        <button
                          type="button"
                          onClick={handleAddChild}
                          title="Add child"
                          className="border border-[#cbd5e1] rounded-lg h-[42px] px-3.5 flex items-center justify-center text-[#3451B2] hover:bg-slate-50 cursor-pointer min-w-[42px] transition"
                        >
                          <PlusCircle size={18} className="text-[#3451B2]" />
                        </button>
                      ) : (
                        <>
                          {childrenAges.map((child) => (
                            <ChildAgeDropdown
                              key={child.id}
                              value={child.age}
                              onChange={(age) =>
                                handleChildAgeChange(child.id, age)
                              }
                            />
                          ))}

                          <button
                            type="button"
                            onClick={handleAddChild}
                            title="Add child"
                            className="border border-[#cbd5e1] rounded-lg w-[42px] h-[42px] flex items-center justify-center text-[#3451B2] hover:bg-slate-50 cursor-pointer shrink-0 transition"
                          >
                            <PlusCircle size={18} className="text-[#3451B2]" />
                          </button>

                          <button
                            type="button"
                            onClick={handleRemoveChild}
                            title="Remove last child"
                            className="border border-[#cbd5e1] rounded-lg w-[42px] h-[42px] flex items-center justify-center text-[#3451B2] hover:bg-slate-50 cursor-pointer shrink-0 transition"
                          >
                            <MinusCircle size={18} className="text-[#3451B2]" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 flex items-center gap-1">
                      Total FOC{" "}
                      <span
                        className="inline-flex items-center text-[#94a3b8] cursor-help ml-1"
                        title="Free of Charge"
                      >
                        <Info size={14} />
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={foc}
                      onChange={(e) => setFoc(e.target.value)}
                      className="w-full border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#e2e8f0] my-8" />

            {/* ================= SECTION 3: GUEST DETAILS ================= */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-12 py-2 pb-8">
              {/* Left Header */}
              <div className="w-full md:w-[320px] shrink-0">
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-6 h-6 text-[#0f172a] shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <circle cx="8" cy="10" r="2" />
                    <path d="M14 10h4M14 14h4M6 16c0-1.5 1.5-2 2-2s2 .5 2 2" />
                  </svg>
                  <h2 className="text-[20px] font-bold text-[#0f172a] tracking-tight">
                    Guest Details
                  </h2>
                </div>
                <p className="text-[14px] text-[#64748b] font-normal leading-relaxed mt-2">
                  Please provide name and phone number(s).
                </p>
              </div>

              {/* Right Inputs */}
              <div className="flex-1 space-y-4">
                {/* Row 1: Salutation & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-4 relative" ref={salutationRef}>
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                      Salutation
                    </label>
                    <input
                      type="text"
                      value={salutation}
                      onChange={(e) => {
                        setSalutation(e.target.value);
                        setIsSalutationOpen(true);
                      }}
                      onFocus={() => setIsSalutationOpen(true)}
                      onClick={() => setIsSalutationOpen(true)}
                      placeholder="e.g. Mr."
                      className={`w-full border rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none transition h-[42px] ${
                        isSalutationOpen
                          ? "border-[#3451B2] ring-1 ring-[#3451B2]"
                          : "border-[#cbd5e1]"
                      }`}
                    />

                    {isSalutationOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-[#cbd5e1] rounded-md shadow-lg py-1">
                        {SALUTATION_OPTIONS.map((item) => {
                          const isSelected =
                            salutation.trim().toLowerCase() ===
                            item.toLowerCase();
                          return (
                            <div
                              key={item}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSalutation(item);
                                setIsSalutationOpen(false);
                              }}
                              className={`flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#f1f5f9] cursor-pointer transition select-none ${
                                isSelected ? "bg-slate-50" : ""
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded-full border inline-block shrink-0 relative ${
                                  isSelected
                                    ? "border-[#3451B2]"
                                    : "border-[#94a3b8]"
                                }`}
                              >
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#3451B2] absolute inset-0 m-auto" />
                                )}
                              </span>
                              <span className="text-[13.5px] font-medium text-[#1e293b]">
                                {item}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-8">
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                      Name
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Anoop Rai"
                      className="w-full border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                    />
                  </div>
                </div>

                {/* Row 2: Phone Number(s) & Optional Email */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Left Side: Phone Numbers */}
                  <div className={showEmail ? "md:col-span-6 space-y-2.5" : "md:col-span-12 space-y-2.5"}>
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                      Phone Number(s)
                    </label>

                    {phoneNumbers.map((phone) => (
                      <div key={phone.id} className="flex items-center gap-2">
                        <CountryCodeDropdown
                          value={phone.countryCode}
                          onChange={(code) =>
                            handlePhoneChange(phone.id, "countryCode", code)
                          }
                        />

                        <input
                          type="text"
                          value={phone.number}
                          onChange={(e) =>
                            handlePhoneChange(phone.id, "number", e.target.value)
                          }
                          placeholder="e.g. 9779212232"
                          className="flex-1 min-w-0 border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                        />

                        {/* If multiple phone rows or expanded mode: show flag and remove button */}
                        {isMultiPhoneOrExpanded ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryPhone(phone.id)}
                              title={
                                phone.isPrimary
                                  ? "Primary phone number"
                                  : "Set as primary phone number"
                              }
                              className="border border-[#cbd5e1] rounded-lg w-[42px] h-[42px] flex items-center justify-center hover:bg-slate-50 cursor-pointer shrink-0 transition"
                            >
                              <Flag
                                size={15}
                                className={
                                  phone.isPrimary
                                    ? "fill-[#3451B2] text-[#3451B2]"
                                    : "text-[#94a3b8] hover:text-[#475569]"
                                }
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemovePhone(phone.id)}
                              title="Remove phone number"
                              className="border border-[#cbd5e1] rounded-lg w-[42px] h-[42px] flex items-center justify-center text-[#3451B2] hover:text-red-500 hover:bg-slate-50 cursor-pointer shrink-0 transition"
                            >
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          /* Initial unexpanded single phone row action buttons */
                          <>
                            <button
                              type="button"
                              onClick={handleAddPhone}
                              title="Add phone number"
                              className="border border-[#cbd5e1] rounded-lg w-[42px] h-[42px] flex items-center justify-center text-[#3451B2] hover:bg-slate-50 cursor-pointer shrink-0 transition"
                            >
                              <PlusCircle size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowEmail(true)}
                              title="Add email"
                              className="border border-[#cbd5e1] rounded-lg w-[42px] h-[42px] flex items-center justify-center text-[#3451B2] hover:bg-slate-50 cursor-pointer shrink-0 transition"
                            >
                              <Mail size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowLocation(true)}
                              title="Add location"
                              className="border border-[#cbd5e1] rounded-lg w-[42px] h-[42px] flex items-center justify-center text-[#3451B2] hover:bg-slate-50 cursor-pointer shrink-0 transition"
                            >
                              <MapPin size={17} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Add More Link & missing action triggers when expanded */}
                    {isMultiPhoneOrExpanded && (
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleAddPhone}
                          className="border border-[#cbd5e1] rounded-[6px] px-3.5 py-1 text-[#3451B2] hover:text-blue-700 font-semibold text-[13.5px] hover:bg-slate-50 transition cursor-pointer"
                        >
                          Add More
                        </button>

                        {!showEmail && (
                          <button
                            type="button"
                            onClick={() => setShowEmail(true)}
                            className="text-[13.5px] text-[#64748b] hover:text-[#3451B2] flex items-center gap-1 cursor-pointer ml-2 transition"
                          >
                            <Mail size={14} /> + Email
                          </button>
                        )}

                        {!showLocation && (
                          <button
                            type="button"
                            onClick={() => setShowLocation(true)}
                            className="text-[13.5px] text-[#64748b] hover:text-[#3451B2] flex items-center gap-1 cursor-pointer ml-2 transition"
                          >
                            <MapPin size={14} /> + Location
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Email field when toggled open */}
                  {showEmail && (
                    <div className="md:col-span-6 space-y-1.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[14px] font-semibold text-[#1e293b] block">
                          Email{" "}
                          <span className="text-[#94a3b8] font-normal text-[13px] ml-1">
                            (optional)
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowEmail(false)}
                          title="Close Email input"
                          className="text-[#94a3b8] hover:text-red-500 cursor-pointer transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@domain.com"
                        className="w-full border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                      />
                    </div>
                  )}
                </div>

                {/* Row 3: Origin City/State & Nationality (Shown when showLocation is true) */}
                {showLocation && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Origin City/State Dropdown */}
                    <div className="relative" ref={originDropdownRef}>
                      <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                        Origin City/State
                      </label>
                      <input
                        type="text"
                        value={originCity}
                        onChange={(e) => {
                          setOriginCity(e.target.value);
                          setIsOriginDropdownOpen(true);
                        }}
                        onFocus={() => setIsOriginDropdownOpen(true)}
                        onClick={() => setIsOriginDropdownOpen(true)}
                        placeholder="e.g. City, State, Country"
                        className={`w-full border rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none transition h-[42px] ${
                          isOriginDropdownOpen
                            ? "border-[#3451B2] ring-1 ring-[#3451B2]"
                            : "border-[#cbd5e1]"
                        }`}
                      />

                      {isOriginDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-[#cbd5e1] rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scroll py-1 w-full">
                          {filteredOriginCities.map((city) => {
                            const isSelected =
                              originCity.trim().toLowerCase() ===
                              city.toLowerCase();
                            return (
                              <div
                                key={city}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectOrigin(city);
                                }}
                                className={`flex items-start gap-3 px-3.5 py-2 hover:bg-[#f1f5f9] cursor-pointer transition select-none ${
                                  isSelected ? "bg-slate-50" : ""
                                }`}
                              >
                                <span
                                  className={`w-3.5 h-3.5 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                                    isSelected
                                      ? "border-[#3451B2]"
                                      : "border-[#94a3b8]"
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#3451B2]" />
                                  )}
                                </span>
                                <span className="text-[13.5px] text-[#1e293b] font-normal leading-snug">
                                  {city}
                                </span>
                              </div>
                            );
                          })}

                          {/* Add custom typed origin option if not exact match */}
                          {originCity.trim() && !isExactOriginMatch && (
                            <div
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleAddOrigin(originCity);
                              }}
                              className="flex items-center gap-3 px-3.5 py-2 hover:bg-[#f1f5f9] cursor-pointer transition select-none border-t border-slate-100 bg-blue-50/20"
                            >
                              <span className="w-3.5 h-3.5 rounded-full border border-[#94a3b8] shrink-0 flex items-center justify-center" />
                              <span className="text-[13.5px] text-[#3451B2] font-semibold">
                                Add "{originCity.trim()}"
                              </span>
                            </div>
                          )}

                          {filteredOriginCities.length === 0 && !originCity.trim() && (
                            <div className="p-3 text-center text-xs text-slate-400">
                              No suggestions available
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Nationality Dropdown with Close [X] Button */}
                    <div className="relative" ref={nationalityDropdownRef}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[14px] font-semibold text-[#1e293b] block">
                          Nationality
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowLocation(false)}
                          title="Close Location inputs"
                          className="text-[#94a3b8] hover:text-red-500 cursor-pointer transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={nationality}
                        onChange={(e) => {
                          setNationality(e.target.value);
                          setIsNationalityDropdownOpen(true);
                        }}
                        onFocus={() => setIsNationalityDropdownOpen(true)}
                        onClick={() => setIsNationalityDropdownOpen(true)}
                        placeholder="e.g. Indian"
                        className={`w-full border rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none transition h-[42px] ${
                          isNationalityDropdownOpen
                            ? "border-[#3451B2] ring-1 ring-[#3451B2]"
                            : "border-[#cbd5e1]"
                        }`}
                      />

                      {isNationalityDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-[#cbd5e1] rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scroll py-1 w-full">
                          {filteredNationalities.length > 0 ? (
                            filteredNationalities.map((nat) => {
                              const isSelected =
                                nationality.trim().toLowerCase() ===
                                nat.toLowerCase();
                              return (
                                <div
                                  key={nat}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectNationality(nat);
                                  }}
                                  className={`flex items-center gap-3 px-3.5 py-2 hover:bg-[#f1f5f9] cursor-pointer transition select-none ${
                                    isSelected ? "bg-slate-50" : ""
                                  }`}
                                >
                                  <span
                                    className={`w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center ${
                                      isSelected
                                        ? "border-[#3451B2]"
                                        : "border-[#94a3b8]"
                                    }`}
                                  >
                                    {isSelected && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#3451B2]" />
                                    )}
                                  </span>
                                  <span className="text-[13.5px] text-[#1e293b] font-normal">
                                    {nat}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-3 text-center text-xs text-slate-400">
                              No nationalities found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Row 4: Info Banner (Exact #3451B2 theme) */}
                <div className="border border-[#3451B2]/20 bg-[#eff4ff] rounded-md px-4 py-3 flex items-center gap-3 mt-4">
                  <Info size={18} className="text-[#3451B2] shrink-0 stroke-[2.2]" />
                  <span className="text-[14px] text-[#3451B2] font-normal leading-relaxed">
                    Enter a name, phone number or email address to check for
                    existing tourist profiles.
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#e2e8f0] my-8" />

            {/* ================= SECTION 4: COMMENTS OR NOTES ================= */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-12 py-2 pb-8">
              {/* Left Header */}
              <div className="w-full md:w-[320px] shrink-0">
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-6 h-6 text-[#0f172a] shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <h2 className="text-[20px] font-bold text-[#0f172a] tracking-tight">
                    Comments or Notes
                  </h2>
                </div>
                <p className="text-[14px] text-[#64748b] font-normal leading-relaxed mt-2">
                  Please provide any comments or notes regarding this query which
                  may be useful for sales process.
                </p>
              </div>

              {/* Right Inputs */}
              <div className="flex-1">
                <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                  Comments{" "}
                  <span className="text-[#94a3b8] font-normal text-[13px] ml-1">
                    (optional)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Only 5 star hotels"
                  className="w-full border border-[#cbd5e1] rounded-lg p-3 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition resize-y min-h-[95px]"
                />
              </div>
            </div>

            <div className="border-t border-[#e2e8f0] my-8" />

            {/* ================= SECTION 5: ACTION BUTTONS ================= */}
            <div className="flex items-end justify-start sm:justify-end gap-4 pt-4 pb-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#3451B2] hover:bg-[#2c4499] text-white text-[14px] font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50 h-[42px]"
              >
                {isSubmitting ? "Saving..." : "Save Details"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="text-[#475569] hover:text-[#0f172a] text-[14px] font-semibold px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-all duration-150 cursor-pointer h-[42px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <AddTripSourceModal
        isOpen={isAddSourceModalOpen}
        onClose={() => setIsAddSourceModalOpen(false)}
        initialName={modalInitialName}
        onSaveSource={handleSaveModalSource}
      />
    </>
  );
}
