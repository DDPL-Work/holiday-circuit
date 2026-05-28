import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {LayoutGrid,FileQuestionMark,CircleCheckBig,FileText,Wallet,Users,FilePlus2,ClipboardList,Settings,LogOut,ChevronLeft,Box,X,
  TicketPercent,
} from "lucide-react";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { GrUserManager } from "react-icons/gr";
import { RiTeamFill } from "react-icons/ri";
import { GiTeamDowngrade } from "react-icons/gi";
import { FaFileInvoice } from "react-icons/fa6";
import { VscGraph } from "react-icons/vsc";
import { BsMicrosoftTeams } from "react-icons/bs";
import { useEffect, useRef, useState } from "react";
import { MdOutlineVerifiedUser } from "react-icons/md";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { AnimatePresence, motion } from "framer-motion";
import ProfileSettingsModal from "../../modal/ProfileSettingsModal";

const menuConfig = {
  agent: [
    { label: "Dashboard", path: "/agent/dashboard", icon: LayoutGrid },
    { label: "Queries", path: "/agent/queries", icon: FileQuestionMark },
    { label: "Active Bookings", path: "/agent/bookings", icon: FilePlus2 },
    { label: "Document Portal", path: "/agent/documents", icon: CircleCheckBig },
    { label: "Finances", path: "/agent/finance", icon: Wallet },
    { label: "Asset Library", path: "/agent/assets", icon: FileText },
  ],
  admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutGrid },
    { label: "Super Admin", path: "/admin/superAdminDashboard", hash: "#overview", icon: MdOutlineDashboardCustomize },
    { label: "Discount", path: "/admin/discount", icon: TicketPercent },
    { label: "Finance Dashboard", path: "/finance/dashboard", icon: Wallet },
    { label: "Advanced Analytics", path: "/finance/advancedAnalytics", icon: ClipboardList },
    { label: "Users Management", path: "/admin/user-management", hash: "#users-management", icon: Users },
    { label: "Contracted Rates", path: "/dmc/contractedRates", icon: Box },
    { label: "Booking Management", path: "/ops/bookings-management", icon: ClipboardList },
    { label: "Order Acceptance", path: "/ops/order-acceptance", icon: CircleCheckBig },
    { label: "Voucher Management", path: "/ops/voucher-management", icon: FileText },
    { label: "Fulfillment", path: "/dmc/confirmation", icon: CircleCheckBig },
    { label: "Payment Verification", path: "/finance/paymentVerification", icon: CircleCheckBig },
    { label: "Internal Invoice", path: "/finance/internalInvoice", icon: FilePlus2 },
  ],
  operations: [
    { label: "OPS Dashboard", path: "/ops/dashboard", icon: LayoutGrid },
    { label: "Booking Management", path: "/ops/bookings-management", icon: ClipboardList },
    { label: "Order Acceptance", path: "/ops/order-acceptance", icon: CircleCheckBig },
    { label: "Voucher Management", path: "/ops/voucher-management", icon: FileText },
  ],
  dmc_partner: [
    { label: "DMC Dashboard", path: "/dmc/dashboard", icon: LayoutGrid },
    { label: "Contracted Rates", path: "/dmc/contractedRates", icon: Box },
    { label: "Fulfillment", path: "/dmc/confirmation", icon: CircleCheckBig },
  ],
  finance_partner: [
    { label: "Finance Dashboard", path: "/finance/dashboard", icon: LayoutGrid },
    { label: "Advanced Analytics", path: "/finance/advancedAnalytics", icon: VscGraph },
    { label: "Payment Verification", path: "/finance/paymentVerification", icon: MdOutlineVerifiedUser },
    { label: "Internal Invoice", path: "/finance/internalInvoice", icon: FaFileInvoice },
  ],
  operation_manager: [
    { label: "OPS Manager", path: "/operationManager/operationManagerDashboard", icon: GrUserManager },
    { label: "All Team Queries", path: "/operationManager/allTeamQueries", icon: RiTeamFill },
    { label: "My Team", path: "/operationManager/myTeam", icon: BsMicrosoftTeams },
  ],
  finance_manager: [
    { label: "Finance Manager", path: "/financeManager/financeManagerDashboard", icon: GrUserManager },
    { label: "All Transactions", path: "/financeManager/allTeamTransaction", icon: RiTeamFill },
    { label: "Internal DMC Invoice", path: "/financeManager/internalDmcInvoice", icon: FaFileInvoice },
    { label: "My Finance Team", path: "/financeManager/myFinanceTeam", icon: BsMicrosoftTeams },
  ],
};

const getAgentWorkspaceBranding = (user = {}) => ({
  name: user?.brandingName || user?.companyName || user?.name || "Holiday Circuit",
  logo: user?.brandingLogo || "",
});

const Sidebar = ({ user, mobileOpen = false, onMobileClose = () => {} }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [navNeedsScroll, setNavNeedsScroll] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navRef = useRef(null);
  const menus = menuConfig[user.role] || [];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const roleConfig = {
    agent: {
      label: "Travel Agent",
      sidebarLabel: "Travel Agent",
      subtitle: user.brandingName || user.companyName || "Agent Workspace",
      ring: "from-blue-500 to-cyan-400",
      badge: "border-blue-400/20 bg-blue-500/15 text-blue-100",
      panel: "from-slate-900 via-slate-900 to-blue-950",
    },
    admin: {
      label: "System Admin",
      sidebarLabel: "Admin",
      subtitle: "Platform Control",
      ring: "from-amber-400 to-orange-500",
      badge: "border-amber-400/20 bg-amber-500/15 text-amber-100",
      panel: "from-slate-900 via-slate-900 to-orange-950",
    },
    operations: {
      label: "Operations Team",
      sidebarLabel: "Ops Team",
      subtitle: "Booking Control Desk",
      ring: "from-violet-500 to-fuchsia-500",
      badge: "border-violet-400/20 bg-violet-500/15 text-violet-100",
      panel: "from-slate-900 via-slate-900 to-violet-950",
    },
    operation_manager: {
      label: "Operation Manager",
      sidebarLabel: "Ops Manager",
      subtitle: "Ops Command Center",
      ring: "from-sky-500 to-cyan-400",
      badge: "border-sky-400/20 bg-sky-500/15 text-sky-100",
      panel: "from-slate-900 via-slate-900 to-sky-950",
    },
    dmc_partner: {
      label: "DMC Partner",
      sidebarLabel: "DMC Partner",
      subtitle: user.companyName || "Fulfillment Desk",
      ring: "from-emerald-500 to-teal-400",
      badge: "border-emerald-400/20 bg-emerald-500/15 text-emerald-100",
      panel: "from-slate-900 via-slate-900 to-emerald-950",
    },
    finance_partner: {
      label: "Finance Partner",
      sidebarLabel: "Finance",
      subtitle: user.companyName || "Finance Desk",
      ring: "from-pink-500 to-rose-400",
      badge: "border-pink-400/20 bg-pink-500/15 text-pink-100",
      panel: "from-slate-900 via-slate-900 to-rose-950",
    },
    finance_manager: {
      label: "Finance Manager",
      sidebarLabel: "Finance Mgr",
      subtitle: "Finance Command Center",
      ring: "from-amber-500 to-orange-400",
      badge: "border-amber-400/20 bg-amber-500/15 text-amber-100",
      panel: "from-slate-900 via-slate-900 to-amber-950",
    },
  };

  const activeRole = roleConfig[user.role] || {
    label: "Workspace User",
    sidebarLabel: "Workspace",
    subtitle: user.companyName || "Holiday Circuit",
    ring: "from-slate-500 to-slate-300",
    badge: "border-slate-400/20 bg-slate-500/15 text-slate-100",
    panel: "from-slate-900 via-slate-900 to-slate-800",
  };

  const agentWorkspaceBranding = getAgentWorkspaceBranding(user);
  const primaryIdentity =
    user.role === "agent"
      ? agentWorkspaceBranding.name
      : user.companyName || user.name || "Holiday Circuit";
  const avatarLetter = (primaryIdentity || "H").charAt(0).toUpperCase();
  const profileImage = user.profileImage || "";
  const effectiveCollapsed = !isMobileViewport && collapsed;

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 768;
      setIsMobileViewport(nextIsMobile);
      if (!nextIsMobile) onMobileClose();
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onMobileClose]);

  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return undefined;

    const updateScrollState = () => {
      const overflowAmount = navElement.scrollHeight - navElement.clientHeight;
      setNavNeedsScroll(overflowAmount > 20);
    };

    updateScrollState();

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });

    resizeObserver.observe(navElement);
    if (navElement.firstElementChild) {
      resizeObserver.observe(navElement.firstElementChild);
    }

    window.addEventListener("resize", updateScrollState);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [menus.length, effectiveCollapsed, isMobileViewport]);

  const getItemTarget = (item) =>
    item.hash ? { pathname: item.path, hash: item.hash } : item.path;

  const isItemActive = (item) => {
    if (location.pathname !== item.path) return false;
    if (!item.hash) return true;
    if (!location.hash) return item.hash === "#overview";
    return location.hash === item.hash;
  };

  const getLinkClass = (isActive) =>
    `group relative flex items-center rounded-xl text-sm transition-all duration-200 ${
      isActive
        ? "bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.28)]"
        : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
    }`;

  const getIconWrapClass = (isActive) =>
    `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-white/15 text-white"
        : "bg-slate-800/90 text-slate-400 group-hover:bg-slate-800 group-hover:text-blue-300"
    }`;

  const sidebarVariants = {
    expanded: { width: 245, transition: { duration: 0.28, ease: "easeOut" } },
    collapsed: { width: 80, transition: { duration: 0.28, ease: "easeOut" } },
    mobileOpen: { x: 0, transition: { duration: 0.28, ease: "easeOut" } },
    mobileClosed: { x: -320, transition: { duration: 0.28, ease: "easeOut" } },
  };

  const labelVariants = {
    expanded: {
      opacity: 1,
      width: "auto",
      transition: { duration: 0.22, ease: "easeOut" },
    },
    collapsed: {
      opacity: 0,
      width: 0,
      transition: { duration: 0.18, ease: "easeIn" },
      transitionEnd: { display: "none" },
    },
  };

  return (
    <>
      <ProfileSettingsModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
      />

      <AnimatePresence>
        {isMobileViewport && mobileOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        className={`${
          isMobileViewport
            ? "fixed inset-y-0 left-0 z-50 h-screen border-r border-gray-800"
            : "relative h-full border-r border-gray-800"
        } grid grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border-t border-gray-800 bg-gray-900`}
        variants={sidebarVariants}
        animate={
          isMobileViewport
            ? mobileOpen ? "mobileOpen" : "mobileClosed"
            : effectiveCollapsed ? "collapsed" : "expanded"
        }
        style={isMobileViewport ? { width: 280 } : undefined}
      >
        {/* COLLAPSE BUTTON */}
        <div className="flex justify-end px-2 pt-2">
          <motion.button
            onClick={() => {
              if (isMobileViewport) { onMobileClose(); return; }
              setCollapsed(!effectiveCollapsed);
            }}
            className="text-gray-400 hover:text-white"
            whileTap={{ scale: 0.95 }}
          >
            {isMobileViewport ? (
              <X size={18} className="cursor-pointer" />
            ) : (
              <ChevronLeft
                size={18}
                className={`transition-transform duration-300 cursor-pointer ${effectiveCollapsed ? "rotate-180" : ""}`}
              />
            )}
          </motion.button>
        </div>

        {/* MENU */}
        <nav
          ref={navRef}
          className={`min-h-0 space-y-0.5 overflow-x-hidden px-2.5 pb-2 pt-1 ${
            navNeedsScroll
              ? "sidebar-scrollbar overflow-y-auto"
              : "hide-scrollbar overflow-y-hidden"
          }`}
        >
          {menus.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            return (
              <NavLink
                key={`${item.path}${item.hash || item.label}`}
                to={getItemTarget(item)}
                title={effectiveCollapsed ? item.label : undefined}
                className={`${getLinkClass(isActive)} ${
                  effectiveCollapsed
                    ? "justify-center px-0 py-2.5"
                    : "gap-2.5 px-2 py-2"
                }`}
                onClick={() => { if (isMobileViewport) onMobileClose(); }}
              >
                {/* Icon — vertically centered with text */}
                <span className={`${getIconWrapClass(isActive)} shrink-0 self-center`}>
                  <Icon size={15} className="shrink-0" />
                </span>

                {/* Label — single line, truncate if too long */}
                {!effectiveCollapsed && (
                  <motion.span
                    initial={false}
                    variants={labelVariants}
                    animate={effectiveCollapsed ? "collapsed" : "expanded"}
                    className="min-w-0 flex-1 self-center truncate text-[12.5px] leading-5 overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* PROFILE SECTION */}
        <motion.div
          className="border-t border-gray-800/90 bg-[#0f1729] p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            title={effectiveCollapsed ? primaryIdentity : undefined}
            className={`group w-full overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br ${activeRole.panel} text-left shadow-[0_12px_32px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/30 hover:shadow-[0_8px_32px_rgba(59,130,246,0.2)] ${
              effectiveCollapsed ? "cursor-pointer px-2 py-3" : "cursor-pointer px-3 py-3"
            }`}
          >
            <div className={`flex items-center ${effectiveCollapsed ? "justify-center" : "gap-3"}`}>
              <div className="relative shrink-0">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-11 w-11 rounded-2xl object-cover shadow-lg transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${activeRole.ring} text-sm font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-105`}>
                    {avatarLetter}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/40 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100">
                  <Settings size={18} className="text-white drop-shadow-md transition-transform duration-500 hover:rotate-90" />
                </div>
              </div>

              {!effectiveCollapsed && (
                <motion.div
                  initial={false}
                  variants={labelVariants}
                  animate={effectiveCollapsed ? "collapsed" : "expanded"}
                  className="min-w-0 flex-1 overflow-hidden"
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-1.5 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{primaryIdentity}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-300">{user.name}</p>
                    </div>
                    <span
                      className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-center text-[10px] font-semibold leading-tight ${activeRole.badge}`}
                      title={activeRole.label}
                    >
                      {activeRole.sidebarLabel || activeRole.label}
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-1.5 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] uppercase tracking-[0.16em] text-slate-400">Workspace</p>
                      <p className="truncate text-xs text-slate-200">{activeRole.subtitle}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/6 px-2 py-1 text-[10px] text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                      <span className="whitespace-nowrap">Active</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </button>

          <motion.button
            onClick={() => setShowLogoutConfirm(true)}
            title={effectiveCollapsed ? "Log Out" : undefined}
            className={`mt-3 flex w-full items-center rounded-2xl border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-gray-200 transition-all duration-300 hover:border-red-400/20 hover:bg-red-500/10 hover:text-white ${
              effectiveCollapsed ? "justify-center" : "gap-2"
            }`}
            whileTap={{ scale: 0.97 }}
          >
            <LogOut size={16} />
            {!effectiveCollapsed && (
              <motion.span
                initial={false}
                variants={labelVariants}
                animate={effectiveCollapsed ? "collapsed" : "expanded"}
                className="overflow-hidden whitespace-nowrap"
              >
                Log Out
              </motion.span>
            )}
          </motion.button>
        </motion.div>
      </motion.aside>

      {/* Custom Premium Log Out Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutConfirm(false)}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center relative overflow-hidden"
            >
              {/* Top red warning border line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-rose-600" />
              
              {/* Alert Logout Circle Bubble */}
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
                <LogOut size={20} className="stroke-[2.5]" />
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-white mb-1.5">
                Confirm Log Out
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Are you sure you want to log out of Holiday Circuit?
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 py-2.5 hover:bg-slate-700 hover:text-white transition-all active:scale-95 duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                  }}
                  className="rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-650 hover:to-rose-700 text-xs font-bold text-white py-2.5 shadow-[0_2px_10px_rgba(239,68,68,0.25)] transition-all active:scale-95 duration-150 cursor-pointer"
                >
                  Yes, Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
