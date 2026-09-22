import React, { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Search,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Check,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import API from "../utils/Api";

export default function AgentOrganizationModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const applySavedBranding = (agent) => {
    try {
      const stored =
        sessionStorage.getItem("offlineAgentOrgData") ||
        localStorage.getItem("offlineAgentOrgData");
      const savedAgent = stored ? JSON.parse(stored) : null;
      const sameAgent =
        savedAgent &&
        String(savedAgent._id || savedAgent.id) ===
          String(agent?._id || agent?.id);

      if (!sameAgent) return agent;

      return {
        ...agent,
        brandingLogo: savedAgent.brandingLogo || savedAgent.logo || agent.brandingLogo || agent.logo || "",
        logo: savedAgent.brandingLogo || savedAgent.logo || agent.logo || "",
        footerBanner:
          savedAgent.footerBanner ||
          savedAgent.footerImage ||
          agent.footerBanner ||
          agent.footerImage ||
          "",
      };
    } catch {
      return agent;
    }
  };

  const fetchTripSources = async () => {
    try {
      setLoading(true);
      const res = await API.get("/ops/manager/trip-sources");
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setSources(list);

      // Check if there is already an active agent in storage
      const activeId =
        sessionStorage.getItem("offlineAgentOrgId") ||
        localStorage.getItem("offlineAgentOrgId");
      if (activeId) {
        const found = list.find(
          (s) => String(s._id || s.id) === String(activeId)
        );
        if (found) setSelectedAgent(applySavedBranding(found));
      }
    } catch (err) {
      console.error("Failed to load agent organizations:", err);
      toast.error("Failed to fetch agent organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTripSources();
      setDropdownOpen(false);
      setSearchQuery("");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const shortName = (s.shortName || "").toLowerCase();
      const contactName = (s.contactPerson?.name || "").toLowerCase();
      const contactEmail = (s.contactPerson?.email || "").toLowerCase();
      const contactPhone = (s.contactPerson?.phone || "").toLowerCase();
      const city = (s.city || s.location || "").toLowerCase();
      return (
        name.includes(q) ||
        shortName.includes(q) ||
        contactName.includes(q) ||
        contactEmail.includes(q) ||
        contactPhone.includes(q) ||
        city.includes(q)
      );
    });
  }, [sources, searchQuery]);

  const handleSelectAgent = (agent) => {
    setSelectedAgent(applySavedBranding(agent));
    setDropdownOpen(false);
  };

  const handleBrandingImageChange = (field, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = String(reader.result || "");
      setSelectedAgent((agent) => {
        if (!agent) return agent;

        if (field === "logo") {
          return { ...agent, brandingLogo: imageUrl, logo: imageUrl };
        }

        return { ...agent, footerBanner: imageUrl, footerImage: imageUrl };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleLaunchAgentPortal = () => {
    if (!selectedAgent) {
      toast.error("Please select an Agent Organization to continue");
      return;
    }

    const agentId = String(selectedAgent._id || selectedAgent.id);
    const agentName = selectedAgent.name || "Offline Agent";

    // Save to session and local storage
    sessionStorage.setItem("offlineAgentOrgId", agentId);
    sessionStorage.setItem("offlineAgentOrgData", JSON.stringify(selectedAgent));
    localStorage.setItem("offlineAgentOrgId", agentId);
    localStorage.setItem("offlineAgentOrgData", JSON.stringify(selectedAgent));

    // Dispatch a custom storage event so all layout components re-sync immediately
    window.dispatchEvent(new Event("offlineAgentOrgChanged"));

    toast.success(`Switched to Agent Portal: ${agentName}`, {
      icon: "🏢",
    });

    onClose();
    navigate("/agent/dashboard");
  };

  const handleClearSelected = (e) => {
    e.stopPropagation();
    setSelectedAgent(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Backdrop with smooth blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[3px]"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.28)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between bg-[#1e293b] px-6 py-4.5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 ring-1 ring-blue-400/30">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Agent Organization Portal
                    </h3>
                    <span className="rounded-full bg-blue-500/25 px-2 py-0.5 text-[10.5px] font-semibold text-blue-300 border border-blue-400/30">
                      Offline Agent
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-300">
                    Select a query-source agent to view their complete Agent
                    Module &amp; workflows
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Agent Selection Input + Dropdown */}
              <div className="space-y-1.5" ref={dropdownRef}>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Select Agent Organization</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {sources.length} agent organizations available
                  </span>
                </label>

                {/* Interactive Select Box */}
                <div className="relative">
                  <div
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className={`flex items-center justify-between w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm transition cursor-pointer ${
                      dropdownOpen
                        ? "border-[#3E63DD] ring-2 ring-blue-100 shadow-xs"
                        : selectedAgent
                        ? "border-blue-300 bg-blue-50/20"
                        : "border-slate-200 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    {selectedAgent ? (
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3E63DD] text-xs font-bold text-white uppercase">
                          {(selectedAgent.name || "A").charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                            {selectedAgent.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                            {selectedAgent.contactPerson?.name ||
                              selectedAgent.contactPerson?.email ||
                              selectedAgent.city ||
                              "Query Source Agent"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearSelected}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 mr-1"
                          title="Clear selection"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <Search size={15} />
                        <span>Search or choose an agent organization...</span>
                      </div>
                    )}
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                        dropdownOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </div>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
                      >
                        {/* Search Inside Dropdown */}
                        <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                              ref={searchInputRef}
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search by agent name, contact, city, phone..."
                              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                              onClick={(e) => e.stopPropagation()}
                            />
                            {searchQuery && (
                              <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dropdown Items List */}
                        <div className="max-h-60 overflow-y-auto custom-scroll p-1.5 space-y-1">
                          {loading ? (
                            <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                              <RefreshCw size={14} className="animate-spin text-blue-600" />
                              Loading agent organizations...
                            </div>
                          ) : filteredAgents.length > 0 ? (
                            filteredAgents.map((agent) => {
                              const isSelected =
                                selectedAgent &&
                                String(selectedAgent._id || selectedAgent.id) ===
                                  String(agent._id || agent.id);
                              return (
                                <button
                                  key={agent._id || agent.id}
                                  type="button"
                                  onClick={() => handleSelectAgent(agent)}
                                  className={`flex items-start justify-between w-full rounded-lg p-2.5 text-left transition cursor-pointer ${
                                    isSelected
                                      ? "bg-blue-50/90 border border-blue-200"
                                      : "hover:bg-slate-50 border border-transparent"
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                    <div
                                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase ${
                                        isSelected
                                          ? "bg-[#3E63DD] text-white"
                                          : "bg-slate-100 text-slate-700"
                                      }`}
                                    >
                                      {(agent.name || "A").charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-bold text-slate-800 leading-tight">
                                          {agent.name}
                                        </span>
                                        {agent.shortName && (
                                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-600 uppercase">
                                            {agent.shortName}
                                          </span>
                                        )}
                                      </div>
                                      <div className="mt-1 flex items-center gap-3 text-[10.5px] text-slate-500 flex-wrap">
                                        {agent.contactPerson?.name && (
                                          <span className="flex items-center gap-1">
                                            <User size={11} className="text-slate-400" />
                                            {agent.contactPerson.name}
                                          </span>
                                        )}
                                        {agent.contactPerson?.email && (
                                          <span className="flex items-center gap-1">
                                            <Mail size={11} className="text-slate-400" />
                                            {agent.contactPerson.email}
                                          </span>
                                        )}
                                        {(agent.city || agent.location) && (
                                          <span className="flex items-center gap-1">
                                            <MapPin size={11} className="text-slate-400" />
                                            {agent.city || agent.location}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 ml-2">
                                    {agent.queryCount > 0 && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                                        <FileText size={10} />
                                        {agent.queryCount} {agent.queryCount === 1 ? "query" : "queries"}
                                      </span>
                                    )}
                                    {isSelected && (
                                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3E63DD] text-white">
                                        <Check size={12} strokeWidth={3} />
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="py-6 text-center text-xs text-slate-400">
                              No agent organizations matching "{searchQuery}"
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Selected Agent Quick Preview Card */}
              {selectedAgent && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-slate-50/40 p-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3E63DD] text-sm font-bold text-white uppercase shadow-xs">
                        {(selectedAgent.name || "A").charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-tight">
                          {selectedAgent.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Source Type:{" "}
                          <span className="font-semibold text-blue-700 uppercase">
                            {selectedAgent.sourceType || "B2B"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Contact Person
                      </span>
                      <p className="font-medium text-slate-700 truncate">
                        {selectedAgent.contactPerson?.name || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Email Address
                      </span>
                      <p className="font-medium text-slate-700 truncate">
                        {selectedAgent.contactPerson?.email || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Phone Number
                      </span>
                      <p className="font-medium text-slate-700 truncate">
                        {selectedAgent.contactPerson?.phone ||
                          (selectedAgent.contactPerson?.phones?.[0]?.number
                            ? `+${selectedAgent.contactPerson.phones[0].countryCode || "91"} ${selectedAgent.contactPerson.phones[0].number}`
                            : "N/A")}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Location / City
                      </span>
                      <p className="font-medium text-slate-700 truncate">
                        {selectedAgent.city || selectedAgent.state || selectedAgent.location || "India"}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Associated Queries
                      </span>
                      <p className="font-bold text-blue-700">
                        {selectedAgent.queryCount || 0} Queries
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 border-t border-blue-100 pt-3 sm:grid-cols-2">
                    <label className="block min-w-0">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Agent Logo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          handleBrandingImageChange("logo", event.target.files?.[0])
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none transition file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-2 file:py-0.5 file:text-[10px] file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block min-w-0">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Footer Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          handleBrandingImageChange("footer", event.target.files?.[0])
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none transition file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-2 file:py-0.5 file:text-[10px] file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                      />
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Info Note */}
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600">
                <Sparkles size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Opening the Agent Organization portal loads the full Agent Module UI
                  (Dashboard, Queries, Quotations, Payments, Documents) populated with this
                  offline onboarded agent's details and active workflows.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchAgentPortal}
                disabled={!selectedAgent}
                className="inline-flex items-center gap-2 rounded-lg bg-[#3E63DD] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#3353c7] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Open Agent Portal</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
