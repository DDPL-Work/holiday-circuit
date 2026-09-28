import React, { useState, useEffect } from "react";
import {
  Building2,
  RefreshCw,
  LogOut,
  Mail,
  Phone,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

export default function AgentOrgActiveBanner({ onOpenSwitchModal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeAgent, setActiveAgent] = useState(null);

  const loadActiveAgent = () => {
    try {
      const stored =
        sessionStorage.getItem("offlineAgentOrgData") ||
        localStorage.getItem("offlineAgentOrgData");
      if (stored) {
        setActiveAgent(JSON.parse(stored));
      } else {
        const storedId =
          sessionStorage.getItem("offlineAgentOrgId") ||
          localStorage.getItem("offlineAgentOrgId");
        if (storedId) {
          setActiveAgent({ _id: storedId, name: "Offline Agent Org" });
        } else {
          setActiveAgent(null);
        }
      }
    } catch {
      setActiveAgent(null);
    }
  };

  useEffect(() => {
    loadActiveAgent();

    const handleStorageChange = () => {
      loadActiveAgent();
    };

    window.addEventListener("offlineAgentOrgChanged", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("offlineAgentOrgChanged", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleExitAgentMode = () => {
    sessionStorage.removeItem("offlineAgentOrgId");
    sessionStorage.removeItem("offlineAgentOrgData");
    localStorage.removeItem("offlineAgentOrgId");
    localStorage.removeItem("offlineAgentOrgData");
    setActiveAgent(null);

    window.dispatchEvent(new Event("offlineAgentOrgChanged"));

    toast.success("Exited Agent Organization mode. Returned to Manager Dashboard.");
    navigate("/operationManager/operationManagerDashboard");
  };

  const isAgentRoute = location.pathname.startsWith("/agent");

  if (!activeAgent || !isAgentRoute) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-2 shadow-md border-b border-blue-700/40">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/30 text-blue-300 ring-1 ring-blue-400/40">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-[11px] font-medium text-blue-200 uppercase tracking-wider bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/30">
              Agent Org View
            </span>
            <span className="text-xs font-bold text-white truncate">
              {activeAgent.name || "Agent Organization"}
            </span>
            {activeAgent.contactPerson?.name && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-blue-200">
                • {activeAgent.contactPerson.name}
              </span>
            )}
            {activeAgent.contactPerson?.phone && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-blue-300">
                <Phone size={11} /> {activeAgent.contactPerson.phone}
              </span>
            )}
            {(activeAgent.city || activeAgent.location) && (
              <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-blue-300">
                <MapPin size={11} /> {activeAgent.city || activeAgent.location}
              </span>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSwitchModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11.5px] font-semibold text-white transition cursor-pointer border border-white/15"
            title="Switch to another Agent Organization"
          >
            <RefreshCw size={12} />
            <span>Switch Agent</span>
          </button>

          <button
            type="button"
            onClick={handleExitAgentMode}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 px-2.5 py-1 text-[11.5px] font-semibold text-white transition cursor-pointer shadow-xs border border-rose-500/40"
            title="Return to Manager Dashboard"
          >
            <LogOut size={12} />
            <span>Exit to Manager</span>
          </button>
        </div>
      </div>
    </div>
  );
}
