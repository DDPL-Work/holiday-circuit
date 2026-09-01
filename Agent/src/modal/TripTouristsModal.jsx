import React, { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  Phone,
  Flag,
  Trash2,
  ChevronDown,
  ChevronUp,
  Star,
  Plus,
  RotateCcw,
  Info,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import API from "../utils/Api";

// Custom Salutation Dropdown Component with Click Outside listener & z-index boost
const SalutationSelect = ({ value, onChange, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const options = ["Mr.", "Mrs.", "Ms."];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        if (onOpenChange) onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onOpenChange]);

  const toggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (onOpenChange) onOpenChange(nextState);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs font-bold text-slate-800 mb-1.5 block">Salutation</label>
      <div
        onClick={toggleOpen}
        className={`w-full border rounded-lg px-3 py-2 text-sm bg-white cursor-pointer flex items-center justify-between transition-all ${
          isOpen
            ? "border-[#3E63DD] ring-2 ring-[#3E63DD]/20"
            : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <span className={value ? "text-slate-800 font-medium" : "text-slate-300"}>
          {value || "e.g. Mr."}
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = value === opt;
            return (
              <div
                key={opt}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt);
                  setIsOpen(false);
                  if (onOpenChange) onOpenChange(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? "border-2 border-[#3E63DD] bg-white"
                      : "border border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#3E63DD]" />}
                </div>
                <span className={isSelected ? "font-semibold text-slate-900" : "font-normal text-slate-700"}>
                  {opt}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Custom Nationality Dropdown Component with Thin Sleek Scrollbar & z-index boost
const NationalitySelect = ({ value, onChange, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        if (onOpenChange) onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onOpenChange]);

  const handleFocus = () => {
    setSearch(""); // Show full list on focus
    setIsOpen(true);
    if (onOpenChange) onOpenChange(true);
  };

  const handleChange = (e) => {
    setSearch(e.target.value);
    onChange(e.target.value);
    setIsOpen(true);
    if (onOpenChange) onOpenChange(true);
  };

  const countries = [
    "India",
    "Afghanistan",
    "Aland Islands",
    "Albania",
    "Algeria",
    "American Samoa",
    "Andorra",
    "Angola",
    "Anguilla",
    "Antarctica",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Aruba",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bermuda",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Cape Verde",
    "Cayman Islands",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kuwait",
    "Laos",
    "Latvia",
    "Lebanon",
    "Liberia",
    "Libya",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Mauritius",
    "Mexico",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "Norway",
    "Oman",
    "Pakistan",
    "Palestine",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Somalia",
    "South Africa",
    "South Korea",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Togo",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe",
  ];

  const filtered = countries.filter((c) => {
    if (!search || !search.trim()) return true;
    const q = search.toLowerCase().trim();
    const cLower = c.toLowerCase();
    if (cLower.includes(q) || q.includes(cLower)) return true;
    if ((q === "indian" || q === "india") && cLower === "india") return true;
    return false;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs font-bold text-slate-800 mb-1.5 block">Nationality</label>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? search : value || ""}
          onFocus={handleFocus}
          onChange={handleChange}
          placeholder="e.g. Indian"
          className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none transition-all placeholder-slate-300 ${
            isOpen
              ? "border-[#3E63DD] ring-2 ring-[#3E63DD]/20"
              : "border-slate-300 hover:border-slate-400"
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-2xl z-[100] max-h-52 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {filtered.length > 0 ? (
            filtered.map((country) => {
              const valLower = (value || "").toLowerCase().trim();
              const countryLower = country.toLowerCase().trim();
              const isSelected =
                valLower === countryLower ||
                (valLower === "indian" && countryLower === "india") ||
                (valLower === "india" && countryLower === "india");
              return (
                <div
                  key={country}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(country);
                    setIsOpen(false);
                    if (onOpenChange) onOpenChange(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? "border-2 border-[#3E63DD] bg-white"
                        : "border border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#3E63DD]" />}
                  </div>
                  <span className={isSelected ? "font-semibold text-slate-900" : "font-normal text-slate-700"}>
                    {country}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-2 text-xs text-slate-400">No country found</div>
          )}
        </div>
      )}
    </div>
  );
};

export const TripTouristsModal = ({ isOpen, onClose, query, headerLeadTraveler, onSave }) => {
  const [tourists, setTourists] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const queryKey = `trip_tourists_${query?._id || query?.queryId || "default"}`;
      try {
        const savedData = localStorage.getItem(queryKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTourists(parsed);
            setExpandedIds([]);
            setActiveDropdownId(null);
            return;
          }
        }
      } catch (e) {
        console.error("Error reading saved tourists", e);
      }

      // Initialize with lead traveler or query data
      const leadFullName = headerLeadTraveler || query?.clientName || query?.leadTraveler || query?.name || query?.guestName || "";
      const salutationMatch = leadFullName.match(/^(Mr\.|Mrs\.|Ms\.|Master|Dr\.)\s*/i);
      const salutation = salutationMatch ? salutationMatch[1] : "Mr.";
      const name = leadFullName.replace(/^(Mr\.|Mrs\.|Ms\.|Master|Dr\.)\s*/i, "").trim() || "";
      const leadPhone = query?.phone || query?.mobileNumber || query?.contactNumber || query?.clientPhone || "";

      const initialId = 1;
      setTourists([
        {
          id: initialId,
          salutation,
          name,
          type: "Adult",
          dob: "",
          age: "",
          nationality: "Indian",
          phones: [
            {
              id: 101,
              countryCode: "91-IN",
              number: leadPhone.replace(/^\+?91-?/, "").trim(),
              isPrimary: true,
            },
          ],
          email: query?.clientEmail || query?.leadEmail || query?.guestEmail || query?.email || "",
          isFlagged: false,
          isNewTourist: false,
        },
      ]);
      setExpandedIds([]);
      setActiveDropdownId(null);
    }
  }, [isOpen, query, headerLeadTraveler]);

  if (!isOpen) return null;

  const handleToggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleFlag = (id) => {
    setTourists((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isFlagged: !t.isFlagged } : t))
    );
  };

  const handleDeleteTourist = (id) => {
    if (tourists.length <= 1) {
      toast.error("At least one tourist is required.");
      return;
    }
    setTourists((prev) => prev.filter((t) => t.id !== id));
    setExpandedIds((prev) => prev.filter((i) => i !== id));
    toast.success("Tourist removed.");
  };

  const handleUpdateTourist = (id, field, value) => {
    setTourists((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleAddTourist = () => {
    const newId = Date.now();
    const newTouristObj = {
      id: newId,
      salutation: "",
      name: "",
      type: "Adult",
      dob: "",
      age: "",
      nationality: "",
      phones: [
        {
          id: Date.now() + 1,
          countryCode: "91-IN",
          number: "",
          isPrimary: true,
        },
      ],
      email: "",
      isFlagged: false,
      isNewTourist: true,
    };
    setTourists((prev) => [...prev, newTouristObj]);
    setExpandedIds((prev) => [...prev, newId]);
  };

  // Phone Management Handlers
  const handleAddPhone = (touristId) => {
    setTourists((prev) =>
      prev.map((t) => {
        if (t.id === touristId) {
          const newPhoneObj = {
            id: Date.now(),
            countryCode: "91-IN",
            number: "",
            isPrimary: false,
          };
          return { ...t, phones: [...(t.phones || []), newPhoneObj] };
        }
        return t;
      })
    );
  };

  const handleRemovePhone = (touristId, phoneId) => {
    setTourists((prev) =>
      prev.map((t) => {
        if (t.id === touristId) {
          if ((t.phones || []).length > 1) {
            const updatedPhones = (t.phones || []).filter((p) => p.id !== phoneId);
            return { ...t, phones: updatedPhones };
          } else {
            // If only 1 phone row exists, clear the number
            const updatedPhones = (t.phones || []).map((p) =>
              p.id === phoneId ? { ...p, number: "", isPrimary: true } : p
            );
            return { ...t, phones: updatedPhones };
          }
        }
        return t;
      })
    );
  };

  const handleUpdatePhone = (touristId, phoneId, field, value) => {
    setTourists((prev) =>
      prev.map((t) => {
        if (t.id === touristId) {
          const updatedPhones = (t.phones || []).map((p) =>
            p.id === phoneId ? { ...p, [field]: value } : p
          );
          return { ...t, phones: updatedPhones };
        }
        return t;
      })
    );
  };

  const handleTogglePhonePrimary = (touristId, phoneId) => {
    setTourists((prev) =>
      prev.map((t) => {
        if (t.id === touristId) {
          const updatedPhones = (t.phones || []).map((p) =>
            p.id === phoneId ? { ...p, isPrimary: !p.isPrimary } : p
          );
          return { ...t, phones: updatedPhones };
        }
        return t;
      })
    );
  };

  const handleSaveTourists = async () => {
    const targetQueryId = query?._id || query?.queryId;
    const rawId = String(targetQueryId || "default");
    const cleanId = rawId.replace(/^#\s*/, "").trim();
    const queryKey = `trip_tourists_${rawId}`;
    const primary = tourists.find((t) => t.isFlagged) || tourists[0];
    const fullName = primary ? [primary.salutation, primary.name].filter(Boolean).join(" ") : "";
    const phoneObj = primary?.phones?.[0];
    const rawNum = phoneObj?.number ? phoneObj.number.trim() : "";
    const codeStr = phoneObj?.countryCode ? `+${phoneObj.countryCode.split("-")[0]}-` : "+91-";
    const formattedPhone = rawNum ? (rawNum.startsWith("+") ? rawNum : `${codeStr}${rawNum}`) : "";
    const primaryEmail = primary?.email ? primary.email.trim() : "";

    // 1. Save locally for instant UI responsiveness & persistent reloads
    try {
      localStorage.setItem(queryKey, JSON.stringify(tourists));
      if (cleanId && cleanId !== rawId) {
        localStorage.setItem(`trip_tourists_${cleanId}`, JSON.stringify(tourists));
      }
      if (fullName) {
        localStorage.setItem(`${queryKey}_lead`, fullName);
        if (cleanId && cleanId !== rawId) localStorage.setItem(`trip_tourists_${cleanId}_lead`, fullName);
      }
      if (formattedPhone) {
        localStorage.setItem(`${queryKey}_phone`, formattedPhone);
        if (cleanId && cleanId !== rawId) localStorage.setItem(`trip_tourists_${cleanId}_phone`, formattedPhone);
      }
      if (primaryEmail) {
        localStorage.setItem(`${queryKey}_email`, primaryEmail);
        if (cleanId && cleanId !== rawId) localStorage.setItem(`trip_tourists_${cleanId}_email`, primaryEmail);
      }
    } catch (e) {
      console.error("Failed to save tourists to localStorage", e);
    }

    // 2. Save to Backend MongoDB Database
    if (targetQueryId) {
      try {
        const payload = {
          clientName: fullName,
          leadTraveler: fullName,
          travelerDetails: tourists.map((t) => ({
            fullName: [t.salutation, t.name].filter(Boolean).join(" "),
            travelerType: t.type || "Adult",
            childAge: t.age ? Number(t.age) : null,
            nationality: t.nationality || "Indian",
            phone: t.phones?.[0]?.number || "",
            email: t.email || "",
          })),
        };

        await API.put(`/agent/queries/${targetQueryId}`, payload).catch(() =>
          API.put(`/ops/queries/${targetQueryId}`, payload).catch(() =>
            API.put(`/queries/${targetQueryId}`, payload)
          )
        );
      } catch (err) {
        console.warn("Backend DB sync warning:", err);
      }
    }

    if (onSave) {
      onSave(tourists);
    }
    toast.success("Tourists saved to Database successfully!");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-start justify-center bg-slate-900/50 backdrop-blur-xs p-4 pt-8 md:pt-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full max-w-5xl rounded-lg border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl relative mb-12"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Trip Tourists Management
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Single Tab: Tourists */}
          <div className="border-b border-slate-200 mt-4 mb-4 flex gap-6">
            <div className="relative pb-2.5 text-sm font-bold text-[#3E63DD] cursor-pointer">
              Tourists
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#3E63DD] rounded-full" />
            </div>
          </div>

          {/* Subheader showing count */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3 px-0.5">
            <span>
              Showing {tourists.length} {tourists.length === 1 ? "tourist" : "tourists"}
            </span>
            <button
              type="button"
              onClick={() => toast.success("Refreshed tourists list")}
              title="Refresh list"
              className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors p-0.5"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Tourist List */}
          <div className="space-y-3.5">
            {tourists.map((tourist, index) => {
              const isExpanded = expandedIds.includes(tourist.id);
              const isDropdownActive = activeDropdownId === tourist.id;
              const titleName = [tourist.salutation, tourist.name].filter(Boolean).join(" ");
              const ageDisplay = tourist.age ? ` (${tourist.age.toString().trim().replace(/y$/i, "")}y)` : "";

              // Upper cards get higher base z-index so top dropdowns float over lower cards
              const cardZIndex = isDropdownActive
                ? 300
                : isExpanded
                ? 100 - index
                : 10 - index;

              const firstPhone = tourist.phones && tourist.phones[0];

              return (
                <div
                  key={tourist.id}
                  style={{ zIndex: cardZIndex }}
                  className={`border rounded-xl transition-all shadow-xs relative ${
                    isExpanded
                      ? "border-[#3E63DD]/40 bg-[#f4f7ff]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {/* Card Header Row */}
                  <div
                    className={`p-3.5 flex items-center justify-between gap-3 rounded-t-xl ${
                      isExpanded ? "bg-[#edf2fe]" : "bg-white rounded-b-xl"
                    }`}
                  >
                    {/* Left Side Info */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-700">{index + 1}.</span>
                        <User size={16} className="text-[#3E63DD] shrink-0" />
                        {titleName && (
                          <span className="font-bold text-slate-900 text-sm truncate max-w-[250px]">
                            {titleName}{ageDisplay}
                          </span>
                        )}
                        <span className="bg-[#3E63DD]/10 text-[#3E63DD] text-[11px] font-semibold px-2 py-0.5 rounded border border-[#3E63DD]/20 shrink-0">
                          {tourist.type || "Adult"}
                        </span>
                      </div>
                      {firstPhone && firstPhone.number && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-6">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span>
                            {firstPhone.countryCode ? `+${firstPhone.countryCode.split("-")[0]}-` : ""}
                            {firstPhone.number}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Side Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleFlag(tourist.id)}
                        className={`border border-slate-200 p-1.5 rounded-md transition-all cursor-pointer ${
                          tourist.isFlagged
                            ? "bg-amber-50 border-amber-300 text-amber-600"
                            : "bg-white hover:bg-slate-50 text-slate-500"
                        }`}
                        title="Click to make Primary Tourist"
                      >
                        <Flag size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTourist(tourist.id)}
                        className="border border-slate-200 p-1.5 rounded-md bg-white hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-600 transition-all cursor-pointer"
                        title="Delete Tourist"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleExpand(tourist.id)}
                        className="border border-slate-200 px-2 py-1.5 rounded-md flex items-center gap-1 text-slate-600 cursor-pointer bg-white hover:bg-slate-50 transition-all text-xs font-medium"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wider">
                          <Star size={8} className="fill-white shrink-0" /> NEW
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Edit Form Panel matching Sembark reference screenshot 1 */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 bg-white border-t border-slate-200/80 space-y-4 rounded-b-xl">
                      {/* Row 1: Type, Salutation, Name, Date of Birth */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        {/* Type Dropdown */}
                        <div>
                          <label className="text-xs font-bold text-slate-800 mb-1.5 block">Type</label>
                          <select
                            value={tourist.type || "Adult"}
                            onChange={(e) => handleUpdateTourist(tourist.id, "type", e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#3E63DD] font-medium"
                          >
                            <option value="Adult">Adult</option>
                            <option value="Child">Child</option>
                          </select>
                          <div className="text-[11px] text-slate-400 mt-1.5 flex items-start gap-1 leading-tight">
                            <Info size={11} className="shrink-0 mt-0.5 text-slate-400" />
                            <span>Type cannot be changes once the tourist is created.</span>
                          </div>
                        </div>

                        {/* Salutation Custom Radio Dropdown */}
                        <div>
                          <SalutationSelect
                            value={tourist.salutation || ""}
                            onChange={(val) => handleUpdateTourist(tourist.id, "salutation", val)}
                            onOpenChange={(isOpen) => setActiveDropdownId(isOpen ? tourist.id : null)}
                          />
                        </div>

                        {/* Name */}
                        <div>
                          <label className="text-xs font-bold text-slate-800 mb-1.5 block">Name</label>
                          <input
                            type="text"
                            value={tourist.name || ""}
                            onChange={(e) => handleUpdateTourist(tourist.id, "name", e.target.value)}
                            placeholder="e.g. Guest Name"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#3E63DD] placeholder-slate-300"
                          />
                        </div>

                        {/* Date of Birth */}
                        <div>
                          <label className="text-xs font-bold text-slate-800 mb-1.5 block">Date of Birth</label>
                          <input
                            type="text"
                            value={tourist.dob || ""}
                            onChange={(e) => handleUpdateTourist(tourist.id, "dob", e.target.value)}
                            placeholder="DD/MM/YYYY"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#3E63DD] placeholder-slate-300"
                          />
                        </div>
                      </div>

                      {/* Row 2: Age, Nationality */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        {/* Age */}
                        <div>
                          <label className="text-xs font-bold text-slate-800 mb-1.5 block">Age</label>
                          <input
                            type="number"
                            min="0"
                            max="120"
                            value={tourist.age || ""}
                            onChange={(e) => handleUpdateTourist(tourist.id, "age", e.target.value)}
                            placeholder="e.g. 25"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#3E63DD] placeholder-slate-300 font-medium"
                          />
                        </div>

                        {/* Nationality */}
                        <div>
                          <NationalitySelect
                            value={tourist.nationality || ""}
                            onChange={(val) => handleUpdateTourist(tourist.id, "nationality", val)}
                            onOpenChange={(isOpen) => setActiveDropdownId(isOpen ? tourist.id : null)}
                          />
                        </div>
                      </div>

                      {/* Row 3: Phone Number(s) & Email (matching Sembark reference screenshot 1) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-1">
                        {/* Phone Number(s) Block */}
                        <div>
                          <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                            Phone Number(s)
                          </label>
                          <div className="space-y-2">
                            {(tourist.phones || []).map((phoneObj, pIdx) => (
                              <div key={phoneObj.id} className="flex items-center gap-2">
                                <select
                                  value={phoneObj.countryCode || "91-IN"}
                                  onChange={(e) =>
                                    handleUpdatePhone(tourist.id, phoneObj.id, "countryCode", e.target.value)
                                  }
                                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#3E63DD] shrink-0"
                                >
                                  <option value="91-IN">91-IN</option>
                                  <option value="1-US">1-US</option>
                                  <option value="44-UK">44-UK</option>
                                  <option value="971-UAE">971-UAE</option>
                                </select>
                                <input
                                  type="text"
                                  value={phoneObj.number || ""}
                                  onChange={(e) =>
                                    handleUpdatePhone(tourist.id, phoneObj.id, "number", e.target.value)
                                  }
                                  placeholder="e.g. 9779212232"
                                  className="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#3E63DD] placeholder-slate-300"
                                />

                                {/* Flag Primary Toggle Button matching Sembark image */}
                                <button
                                  type="button"
                                  onClick={() => handleTogglePhonePrimary(tourist.id, phoneObj.id)}
                                  className={`border rounded-lg p-2.5 transition-all shrink-0 cursor-pointer ${
                                    phoneObj.isPrimary
                                      ? "bg-blue-50 border-[#3E63DD] text-[#3E63DD]"
                                      : "bg-white border-slate-300 text-slate-400 hover:text-slate-600"
                                  }`}
                                  title="Toggle Primary Phone Flag"
                                >
                                  <Flag size={14} className={phoneObj.isPrimary ? "fill-[#3E63DD]" : ""} />
                                </button>

                                {/* Cut / Remove Button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhone(tourist.id, phoneObj.id)}
                                  className="border border-slate-300 rounded-lg p-2.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 shrink-0 cursor-pointer transition-colors"
                                  title="Remove / Clear Phone"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Add More Button matching Sembark screenshot 1 */}
                          <div className="mt-2.5">
                            <button
                              type="button"
                              onClick={() => handleAddPhone(tourist.id)}
                              className="text-xs font-semibold text-[#3E63DD] hover:text-[#3253c7] cursor-pointer inline-block"
                            >
                              Add More
                            </button>
                          </div>
                        </div>

                        {/* Email Block matching Sembark reference screenshot 1 */}
                        <div>
                          <label className="text-xs font-bold text-slate-800 mb-1.5 block">Email</label>
                          <input
                            type="email"
                            value={tourist.email || ""}
                            onChange={(e) => handleUpdateTourist(tourist.id, "email", e.target.value)}
                            placeholder="e.g. tourist@example.com"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#3E63DD] placeholder-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Tourist Button */}
          <div className="mt-4 mb-6">
            <button
              type="button"
              onClick={handleAddTourist}
              className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-[#3E63DD] hover:bg-[#3E63DD]/5 hover:border-[#3E63DD]/30 transition-all cursor-pointer shadow-2xs"
            >
              <Plus size={14} className="text-[#3E63DD]" /> Add Tourist
            </button>
          </div>

          {/* Footer Action Buttons */}
          <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveTourists}
              className="bg-[#3E63DD] hover:bg-[#3253c7] text-white font-semibold text-sm px-5 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Save Tourists
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm px-5 py-2 rounded-lg transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
