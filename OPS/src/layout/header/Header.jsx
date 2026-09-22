import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Gift, LogOut } from "lucide-react";
import logo from "../../assets/logo img.png";
import ExclusiveOfferModal from "../../modal/ExclusiveOfferModal.jsx";
import ProfileSettingsModal from "../../modal/ProfileSettingsModal";
import AgentOrganizationModal from "../../modal/AgentOrganizationModal";
import { logout as logoutAction } from "../../redux/slices/authSlice";
import { getMenusForRole } from "../navConfig";

import { getWorkspaceBranding } from "./utils/notificationHelpers";
import { useNotifications } from "./hooks/useNotifications";
import DesktopNav from "./components/DesktopNav";
import MobileNav from "./components/MobileNav";
import NotificationDropdown from "./components/NotificationDropdown";
import LogoutConfirmModal from "./components/LogoutConfirmModal";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const role = user?.role || "";
  const isQuotationBuilder = location.pathname === "/ops/quotation-builder";
  const workspaceBranding = getWorkspaceBranding(user);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [agentOrgModalOpen, setAgentOrgModalOpen] = useState(false);
  const [offlineAgent, setOfflineAgent] = useState(null);

  useEffect(() => {
    const syncOfflineAgent = () => {
      try {
        const stored =
          sessionStorage.getItem("offlineAgentOrgData") ||
          localStorage.getItem("offlineAgentOrgData");
        setOfflineAgent(stored ? JSON.parse(stored) : null);
      } catch {
        setOfflineAgent(null);
      }
    };

    syncOfflineAgent();
    window.addEventListener("offlineAgentOrgChanged", syncOfflineAgent);
    window.addEventListener("storage", syncOfflineAgent);

    return () => {
      window.removeEventListener("offlineAgentOrgChanged", syncOfflineAgent);
      window.removeEventListener("storage", syncOfflineAgent);
    };
  }, []);

  const isOfflineAgentActive =
    Boolean(
      sessionStorage.getItem("offlineAgentOrgId") ||
        localStorage.getItem("offlineAgentOrgId"),
    ) && location.pathname.startsWith("/agent");

  const menus = useMemo(
    () => getMenusForRole(role, user, isOfflineAgentActive),
    [role, user, isOfflineAgentActive],
  );

  const notificationsProps = useNotifications(role, user);

  const getAgentWorkspaceBranding = (usr = {}) => ({
    name: usr?.brandingName || usr?.companyName || usr?.name || "Holiday Circuit",
    logo: usr?.brandingLogo || "",
  });

  const agentWorkspaceBranding = getAgentWorkspaceBranding(user);
  const offlineAgentLogo =
    offlineAgent?.brandingLogo || offlineAgent?.logo || "";
  const headerBranding =
    isOfflineAgentActive && offlineAgentLogo
      ? {
          name: offlineAgent?.brandingName || offlineAgent?.name || "Agent Organization",
          logo: offlineAgentLogo,
        }
      : workspaceBranding;
  const primaryIdentity =
    role === "agent"
      ? agentWorkspaceBranding.name
      : user?.companyName || user?.name || "Holiday Circuit";
  const avatarLetter = (primaryIdentity || "H").charAt(0).toUpperCase();
  const profileImage = user?.profileImage || "";

  const handleLogout = () => {
    dispatch(logoutAction());
    localStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <>
      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 5px;
          height: 5px;
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: transparent;
        }
        .custom-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        @keyframes notification-bell-swing {
          0% { transform: rotate(0deg) scale(0.92); }
          14% { transform: rotate(-18deg) scale(1.06); }
          28% { transform: rotate(16deg) scale(1.1); }
          42% { transform: rotate(-12deg) scale(1.04); }
          58% { transform: rotate(10deg) scale(1.02); }
          74% { transform: rotate(-6deg) scale(1); }
          100% { transform: rotate(0deg) scale(1); }
        }

        @keyframes notification-burst-ring {
          0% { opacity: 0.55; transform: scale(0.62); }
          100% { opacity: 0; transform: scale(1.72); }
        }

        @keyframes notification-burst-dot {
          0% { opacity: 0; transform: translate(0, 0) scale(0.2); }
          18% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(1); }
        }

        @keyframes notification-badge-pop {
          0% { transform: scale(0.58); }
          40% { transform: scale(1.16); }
          100% { transform: scale(1); }
        }
      `}</style>

      <header className="h-[4.5rem] border-b border-white/10 bg-[#0F172A] px-3 sm:px-5">
        <div className="flex h-full items-center justify-between gap-2 sm:gap-3 w-full">
          <div className="flex h-full items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex h-full cursor-pointer items-center px-2 sm:px-4">
              <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-0.5 shadow-inner ring-1 ring-black/5">
                <img
                  src={headerBranding.logo || logo}
                  alt={headerBranding.name || "Logo"}
                  className={`h-full w-full object-contain ${
                    headerBranding.logo ? "scale-[1.15]" : "scale-[1.4]"
                  }`}
                />
              </div>
            </div>
          </div>

          <DesktopNav
            menus={menus}
            onOpenAgentOrgModal={() => setAgentOrgModalOpen(true)}
          />

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {notificationsProps.canViewOffers ? (
              <button
                type="button"
                onClick={notificationsProps.handleOpenOffers}
                className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Offers"
                title="Offers"
              >
                <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
                {notificationsProps.couponUnreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-[1.25rem] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {notificationsProps.couponUnreadCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            {notificationsProps.canViewNotifications ? (
              <NotificationDropdown
                role={role}
                isQuotationBuilder={isQuotationBuilder}
                {...notificationsProps}
              />
            ) : null}

            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="relative flex h-9 w-9 sm:h-10 sm:w-10 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 overflow-hidden shrink-0"
              aria-label="Profile Settings"
              title={primaryIdentity}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-full w-full object-cover rounded-2xl"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-bold text-white">
                  {avatarLetter}
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:border-red-400/20 hover:bg-red-500/10"
              title="Log Out"
            >
              <LogOut className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </button>

            <MobileNav
              menus={menus}
              mobileNavOpen={mobileNavOpen}
              setMobileNavOpen={setMobileNavOpen}
              onOpenAgentOrgModal={() => setAgentOrgModalOpen(true)}
            />
          </div>
        </div>
      </header>

      <AgentOrganizationModal
        isOpen={agentOrgModalOpen}
        onClose={() => setAgentOrgModalOpen(false)}
      />

      <ProfileSettingsModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
      />

      {notificationsProps.canViewOffers ? (
        <ExclusiveOfferModal
          open={notificationsProps.offerOpen}
          onClose={() => notificationsProps.setOfferOpen(false)}
        />
      ) : null}

      <LogoutConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </>
  );
};

export default Header;
