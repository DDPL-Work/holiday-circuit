import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronDown, PlusCircle, Flag } from "lucide-react";
import toast from "react-hot-toast";
import API from "../utils/Api";

import {
  COUNTRY_CODES,
  COUNTRY_NAMES,
  ALL_COUNTRY_NAMES,
  getStatesForCountry,
  getCitiesForLocation,
  getCountryIsoCode,
} from "../utils/geoUtils";

export { COUNTRY_CODES, COUNTRY_NAMES, ALL_COUNTRY_NAMES };

export function CountryCodeDropdown({ value = "91-IN", onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
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
        const dropdownHeight = 260;
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

  const filteredCodes = COUNTRY_CODES.filter((code) => {
    const name = COUNTRY_NAMES[code] || "";
    const q = search.trim().toLowerCase();
    return code.toLowerCase().includes(q) || name.toLowerCase().includes(q);
  });

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className={`border rounded-[6px] px-3 py-2 text-[14px] bg-white text-[#1e293b] font-medium flex items-center gap-1.5 h-[42px] hover:bg-slate-50 transition cursor-pointer min-w-[94px] justify-between ${
          isOpen
            ? "border-[#3451B2] ring-1 ring-[#3451B2]"
            : "border-[#cbd5e1]"
        }`}
      >
        <span>{value || "91-IN"}</span>
        <ChevronDown
          size={14}
          className={`text-[#64748b] transition-transform duration-150 ${
            isOpen ? "rotate-180 text-[#3451B2]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 z-[150] w-52 bg-white border border-[#cbd5e1] rounded-[6px] shadow-xl max-h-64 overflow-y-auto custom-scroll py-1 ${
            placement === "top" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {/* Quick Search */}
          <div className="p-1.5 border-b border-slate-100 sticky top-0 bg-white z-10">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country / code..."
              className="w-full text-[12.5px] border border-slate-200 rounded px-2 py-1 outline-none focus:border-[#3451B2]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {filteredCodes.map((code) => {
            const isSelected = (value || "91-IN") === code;
            const displayName = COUNTRY_NAMES[code] || code;
            return (
              <div
                key={code}
                ref={isSelected ? selectedItemRef : null}
                title={displayName}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(code);
                  setIsOpen(false);
                }}
                className={`px-3 py-1.5 text-[13px] font-medium cursor-pointer transition select-none flex items-center justify-between ${
                  isSelected
                    ? "bg-[#3451B2] text-white font-semibold"
                    : "text-[#1e293b] hover:bg-slate-100"
                }`}
              >
                <span className="font-semibold">{code}</span>
                <span
                  className={`text-[11.5px] max-w-[100px] truncate ${
                    isSelected ? "text-blue-100" : "text-[#64748b]"
                  }`}
                >
                  {displayName.split(" - ")[1] || ""}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SearchableAddressDropdown({
  label,
  value = "",
  onChange,
  options = [],
  onOptionsChange,
  placeholder = "Type to search...",
  error = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState("bottom");
  const containerRef = useRef(null);
  const selectedItemRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dropdownHeight = 220;
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

  const trimmedQuery = (value || "").trim();
  const filteredOptions = (options || []).filter((opt) =>
    opt.toLowerCase().includes(trimmedQuery.toLowerCase())
  );
  const isExactMatch = (options || []).some(
    (opt) => opt.toLowerCase() === trimmedQuery.toLowerCase()
  );

  const handleSelectOption = (opt) => {
    onChange(opt);
    setIsOpen(false);
  };

  const handleAddNewOption = (newOpt) => {
    if (onOptionsChange) {
      onOptionsChange((prev) => [
        newOpt,
        ...prev.filter((o) => o.toLowerCase() !== newOpt.toLowerCase()),
      ]);
    }
    onChange(newOpt);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none transition h-[42px] ${
          error
            ? "border-[#ef4444] focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
            : isOpen
            ? "border-[#3451B2] ring-1 ring-[#3451B2]"
            : "border-[#cbd5e1] focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2]"
        }`}
      />

      {error && (
        <div className="mt-1.5">
          <span className="inline-block bg-[#e11d48] text-white text-[12px] font-medium px-2 py-0.5 rounded">
            {error}
          </span>
        </div>
      )}

      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-[160] bg-white border border-[#cbd5e1] rounded-lg shadow-xl max-h-56 overflow-y-auto custom-scroll w-full py-1 ${
            placement === "top" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isSelected =
                (value || "").trim().toLowerCase() === opt.toLowerCase();
              return (
                <div
                  key={`${opt}-${idx}`}
                  ref={isSelected ? selectedItemRef : null}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectOption(opt);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 hover:bg-[#f1f5f9] cursor-pointer transition select-none ${
                    isSelected ? "bg-[#f8fafc]" : ""
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border inline-block shrink-0 relative flex items-center justify-center ${
                      isSelected ? "border-[#3451B2]" : "border-[#94a3b8]"
                    }`}
                  >
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3451B2]" />
                    )}
                  </span>
                  <span className="text-[13.5px] text-[#1e293b] font-normal leading-tight">
                    {opt}
                  </span>
                </div>
              );
            })
          ) : !trimmedQuery ? (
            <div className="p-3 text-center text-xs text-slate-400">
              No options available
            </div>
          ) : null}

          {/* Dynamic Add Option at the bottom */}
          {trimmedQuery && !isExactMatch && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                handleAddNewOption(trimmedQuery);
              }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#f1f5f9] cursor-pointer transition select-none text-[#1e293b] border-t border-slate-100"
            >
              <span className="w-3.5 h-3.5 rounded-full border border-[#94a3b8] inline-block shrink-0 relative" />
              <span className="text-[13.5px] text-[#1e293b] font-normal">
                Add "{trimmedQuery}"
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AddTripSourceModal({
  isOpen,
  onClose,
  initialName = "",
  onSaveSource,
}) {
  const [sourceType, setSourceType] = useState("b2b"); // "b2b" | "direct"
  const [companyName, setCompanyName] = useState(initialName || "");
  const [shortName, setShortName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Dynamic Phone Numbers in Contact Person
  const [phoneNumbers, setPhoneNumbers] = useState([
    { id: 1, countryCode: "91-IN", number: "", isPrimary: true },
  ]);

  // Address fields with dynamic list options from country-state-city
  const [countryList, setCountryList] = useState(() => ALL_COUNTRY_NAMES);
  const [stateList, setStateList] = useState(() => getStatesForCountry("India"));
  const [cityList, setCityList] = useState(() => getCitiesForLocation("India"));

  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("India");
  const [cityError, setCityError] = useState("");

  // When country changes, dynamically update state and city suggestions
  useEffect(() => {
    const states = getStatesForCountry(country || "India");
    setStateList(states);
    const cities = getCitiesForLocation(country || "India", stateRegion);
    setCityList(cities);
  }, [country]);

  // When state changes, dynamically refine city suggestions
  useEffect(() => {
    const cities = getCitiesForLocation(country || "India", stateRegion);
    setCityList(cities);
  }, [stateRegion]);

  useEffect(() => {
    if (isOpen) {
      setCompanyName(initialName || "");
      setShortName("");
      setContactName("");
      setContactEmail("");
      setPhoneNumbers([
        { id: 1, countryCode: "91-IN", number: "", isPrimary: true },
      ]);
      setCity("");
      setStateRegion("");
      setCountry("India");
      setCityError("");
    }
  }, [isOpen, initialName]);

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

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const finalName = companyName.trim();
    if (!finalName) {
      toast.error("Agency / Company Full Name is required");
      return;
    }

    const locationText =
      city.trim() || stateRegion.trim() || country.trim() || "India";

    const primaryPhoneObj =
      phoneNumbers.find((p) => p.isPrimary) || phoneNumbers[0];

    const payload = {
      name: finalName,
      shortName: shortName.trim(),
      sourceType,
      contactPerson: {
        name: contactName.trim(),
        email: contactEmail.trim().toLowerCase(),
        phones: phoneNumbers,
        phone: primaryPhoneObj?.number || "",
        countryCode: primaryPhoneObj?.countryCode || "91-IN",
      },
      location: locationText,
      city: city.trim(),
      state: stateRegion.trim(),
      country: country.trim() || "India",
    };

    try {
      setIsSubmitting(true);
      const res = await API.post("/ops/manager/trip-sources", payload);
      const savedSource = res?.data?.data || {
        ...payload,
        id: res?.data?.data?._id || Date.now().toString(),
        _id: res?.data?.data?._id || Date.now().toString(),
      };
      onSaveSource?.(savedSource);
      toast.success(res?.data?.message || `Source "${finalName}" saved successfully!`);
      onClose();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to save trip source";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMultiPhone = phoneNumbers.length > 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop with smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-[98%] max-w-[990px] bg-white rounded-md border border-[#e2e8f0] shadow-2xl flex flex-col my-auto text-slate-800"
            style={{ fontFamily: "'Inter', sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-[#e2e8f0] shrink-0">
              <h2 className="text-[18px] sm:text-[19px] font-bold text-[#0f172a] tracking-tight">
                Add Trip Source Details
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 sm:px-8 py-6 space-y-6">
              {/* Source Type Selector (2 Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: B2B Agent / Online Marketplace */}
                <div
                  onClick={() => setSourceType("b2b")}
                  className={`rounded-xl p-4.5 cursor-pointer transition select-none flex items-start gap-3.5 ${
                    sourceType === "b2b"
                      ? "border border-[#bfdbfe] bg-[#eff6ff]"
                      : "border border-[#e2e8f0] bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    <span
                      className={`w-4 h-4 rounded-full border inline-block relative ${
                        sourceType === "b2b"
                          ? "border-[#3451B2]"
                          : "border-[#94a3b8]"
                      }`}
                    >
                      {sourceType === "b2b" && (
                        <span className="w-2 h-2 rounded-full bg-[#3451B2] absolute inset-0 m-auto" />
                      )}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[14.5px] font-bold text-[#0f172a]">
                      B2B Agent / Online Marketplace
                    </h3>
                    <p className="text-[12.5px] text-[#64748b] leading-relaxed mt-1">
                      The source provides leads directly or via an Online Marketplace.
                      Accounting should be managed for both guest and the source. The
                      source acts as an agent/intermediator till the end of trip
                    </p>
                    <p className="text-[12.5px] font-semibold text-[#334155] mt-1.5">
                      Ex: ABC Holidays, Travel Triangle, Thrillophilia etc.
                    </p>
                  </div>
                </div>

                {/* Option 2: Direct / Website / Referrals / Ads / Lead Sellers */}
                <div
                  onClick={() => setSourceType("direct")}
                  className={`rounded-xl p-4.5 cursor-pointer transition select-none flex items-start gap-3.5 ${
                    sourceType === "direct"
                      ? "border border-[#bfdbfe] bg-[#eff6ff]"
                      : "border border-[#e2e8f0] bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    <span
                      className={`w-4 h-4 rounded-full border inline-block relative ${
                        sourceType === "direct"
                          ? "border-[#3451B2]"
                          : "border-[#94a3b8]"
                      }`}
                    >
                      {sourceType === "direct" && (
                        <span className="w-2 h-2 rounded-full bg-[#3451B2] absolute inset-0 m-auto" />
                      )}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[14.5px] font-bold text-[#0f172a]">
                      Direct / Website / Referrals / Ads / Lead Sellers
                    </h3>
                    <p className="text-[12.5px] text-[#64748b] leading-relaxed mt-1">
                      Leads from these sources are received directly or via portal
                      but they don't act as agent/intermediator after lead generation.
                      All the accounting should be managed for Guest only.
                    </p>
                    <p className="text-[12.5px] font-semibold text-[#334155] mt-1.5">
                      Ex: Direct Call / WhatsApp / Email, Website / Landing Pages,
                      Referrals, TripCrafters etc.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#e2e8f0] my-6" />

              {/* Section 2: Basic Details */}
              <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                <div className="w-full md:w-[260px] shrink-0">
                  <h3 className="text-[18px] font-bold text-[#0f172a] tracking-tight">
                    Basic Details
                  </h3>
                  <p className="text-[13.5px] text-[#64748b] mt-1.5 leading-relaxed">
                    Provide basic details such as name and a short name.
                  </p>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div>
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                      Agency / Company Full Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. ABC Travels"
                      className="w-full border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                    />
                  </div>

                  <div>
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                      Short Name
                    </label>
                    <input
                      type="text"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      placeholder="e.g. XYZ Travels"
                      className="w-full border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#e2e8f0] my-6" />

              {/* Section 3: Contact Person */}
              <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                <div className="w-full md:w-[260px] shrink-0">
                  <h3 className="text-[18px] font-bold text-[#0f172a] tracking-tight">
                    Contact Person
                  </h3>
                  <p className="text-[13.5px] text-[#64748b] mt-1.5 leading-relaxed">
                    Please provide the details of Contact/Enquiry Person
                  </p>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                        Name
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. John doe"
                        className="w-full border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                      />
                    </div>

                    <div>
                      <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                        Email
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. user@domain.com"
                        className="w-full border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[14px] font-semibold text-[#1e293b] mb-1.5 block">
                      Phone Number(s)
                    </label>
                    <div className="space-y-2.5">
                      {phoneNumbers.map((phone) => (
                        <div
                          key={phone.id}
                          className="flex items-center gap-2 max-w-md"
                        >
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
                              handlePhoneChange(
                                phone.id,
                                "number",
                                e.target.value
                              )
                            }
                            placeholder="e.g. 9779212232"
                            className="flex-1 min-w-0 border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-[14px] text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#3451B2] focus:ring-1 focus:ring-[#3451B2] transition h-[42px]"
                          />

                          {isMultiPhone ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryPhone(phone.id)}
                                title={
                                  phone.isPrimary
                                    ? "Primary number"
                                    : "Set as primary number"
                                }
                                className="border border-[#cbd5e1] rounded-lg w-[42px] h-[42px] flex items-center justify-center hover:bg-slate-50 cursor-pointer shrink-0 transition"
                              >
                                <Flag
                                  size={16}
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
                                title="Remove number"
                                className="border border-[#cbd5e1] rounded-lg w-[42px] h-[42px] flex items-center justify-center text-[#94a3b8] hover:text-red-500 hover:bg-slate-50 cursor-pointer shrink-0 transition"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={handleAddPhone}
                              title="Add alternative phone number"
                              className="border border-[#cbd5e1] rounded-lg w-[42px] h-[42px] flex items-center justify-center text-[#3451B2] hover:bg-slate-50 cursor-pointer shrink-0 transition"
                            >
                              <PlusCircle size={18} />
                            </button>
                          )}
                        </div>
                      ))}

                      {isMultiPhone && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleAddPhone}
                            className="text-[#3451B2] hover:underline font-semibold text-[13.5px] cursor-pointer"
                          >
                            Add More
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#e2e8f0] my-6" />

              {/* Section 4: Address */}
              <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                <div className="w-full md:w-[260px] shrink-0">
                  <h3 className="text-[18px] font-bold text-[#0f172a] tracking-tight">
                    Address
                  </h3>
                  <p className="text-[13.5px] text-[#64748b] mt-1.5 leading-relaxed">
                    Please provide address details of the business.
                  </p>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SearchableAddressDropdown
                      label="City / Town / District"
                      value={city}
                      onChange={(val) => {
                        setCity(val);
                        if (cityError) setCityError("");
                      }}
                      options={cityList}
                      onOptionsChange={setCityList}
                      placeholder="Type to search..."
                      error={cityError}
                    />

                    <SearchableAddressDropdown
                      label="State / Province / Region"
                      value={stateRegion}
                      onChange={setStateRegion}
                      options={stateList}
                      onOptionsChange={setStateList}
                      placeholder="Type to search..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SearchableAddressDropdown
                      label="Country"
                      value={country}
                      onChange={setCountry}
                      options={countryList}
                      onOptionsChange={setCountryList}
                      placeholder="Type to search..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-end justify-end sm:justify-end gap-3 px-6 sm:px-8 py-4 border-t border-[#e2e8f0] bg-slate-50/50 rounded-b-2xl shrink-0">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#3451B2] hover:bg-[#2c4499] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold px-6 py-2.5 rounded-lg shadow-sm transition cursor-pointer h-[42px] flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Details</span>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-[#475569] hover:text-[#0f172a] text-[14px] font-semibold px-4 py-2.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer h-[42px]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

