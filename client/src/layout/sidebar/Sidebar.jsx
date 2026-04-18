import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {LayoutGrid,FileQuestionMark,CircleCheckBig,FileText,Wallet,Users,FilePlus2,ClipboardList,Settings,LogOut,ChevronLeft,Box,X,
} from "lucide-react";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { GrUserManager } from "react-icons/gr";
import { RiTeamFill } from "react-icons/ri";
import { GiTeamDowngrade } from "react-icons/gi";
import { FaFileInvoice } from "react-icons/fa6";
import { VscGraph } from "react-icons/vsc";
import { BsMicrosoftTeams } from "react-icons/bs";
import { useEffect, useState } from "react";
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
    {
      label: "Document Portal",
      path: "/agent/documents",
      icon: CircleCheckBig,
    },
    { label: "Finances", path: "/agent/finance", icon: Wallet },
    { label: "Asset Library", path: "/agent/assets", icon: FileText },
  ],
  admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutGrid },
    { label: "Super Admin Dashboard", path: "/admin/superAdminDashboard", hash: "#overview", icon: MdOutlineDashboardCustomize },
    { label: "Finance Dashboard", path: "/finance/dashboard", icon: Wallet },
    { label: "Advanced Analytics", path: "/finance/advancedAnalytics", icon: ClipboardList },
    { label: "Users Management", path: "/admin/superAdminDashboard", hash: "#users-management", icon: Users },
    { label: "Contracted Rates Dashboard", path: "/dmc/contractedRates", icon: Box },
    { label: "Booking Management Hub", path: "/ops/bookings-management", icon: ClipboardList },
    { label: "Order Acceptance", path: "/ops/order-acceptance", icon: CircleCheckBig },
    { label: "Voucher Management", path: "/ops/voucher-management", icon: FileText },
    { label: "Fulfillment & Confirmation", path: "/dmc/confirmation", icon: CircleCheckBig },
    { label: "Payment Verification", path: "/finance/paymentVerification", icon: CircleCheckBig },
    { label: "Internal Invoice", path: "/finance/internalInvoice", icon: FilePlus2 },
   
  ],
  operations: [
    { label: "OPS Dashboard", path: "/ops/dashboard", icon: LayoutGrid },
    {label: "Booking Management Hub",path: "/ops/bookings-management",icon: ClipboardList,},
    {label: "Order Acceptance",path: "/ops/order-acceptance", icon: CircleCheckBig,},
    {label: "Voucher Management",path: "/ops/voucher-management", icon: FileText,},
  ],
  dmc_partner: [
    {label: "DMC Dashboard", path: "/dmc/dashboard", icon: LayoutGrid },
    {label: "Contracted Rates Dashboard",path: "/dmc/contractedRates",icon: Box,},
    {label: "Fulfillment & Confirmation",path: "/dmc/confirmation",icon: CircleCheckBig,},
  ],
  finance_partner: [
    {label: "Finance Dashboard", path: "/finance/dashboard", icon: LayoutGrid },
    {label: "Advanced Analytics", path: "/finance/advancedAnalytics", icon: VscGraph 
 },
    {label: "Payment Verification",path: "/finance/paymentVerification",icon: MdOutlineVerifiedUser 
,},
    {label: "Internal Invoice",path: "/finance/internalInvoice",icon: FaFileInvoice
,},
  ],
 operation_manager: [
    {label: "OPS Manager Dashboard", path: "/operationManager/operationManagerDashboard", icon:GrUserManager },
    {label: "All Team Queries", path: "/operationManager/allTeamQueries", icon: RiTeamFill },
    {label: "My Team",path: "/operationManager/myTeam",icon:BsMicrosoftTeams
},
  ],
  finance_manager: [
    {label: "Finance Manager Dashboard", path: "/financeManager/financeManagerDashboard", icon:GrUserManager },
    {label: "All Team Transaction", path: "/financeManager/allTeamTransaction", icon: RiTeamFill  },
    {label: "Internal DMC Invoice",path: "/financeManager/internalDmcInvoice",icon: FaFileInvoice },
    {label: "My Finance Team",path: "/financeManager/myFinanceTeam",icon:BsMicrosoftTeams
},
  ],

};

const Sidebar = ({ user, mobileOpen = false, onMobileClose = () => {} }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const menus = menuConfig[user.role] || [];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const roleConfig = {
    agent: {
      label: "Travel Agent",
      subtitle: user.companyName || "Agent Workspace",
      ring: "from-blue-500 to-cyan-400",
      badge: "border-blue-400/20 bg-blue-500/15 text-blue-100",
      panel: "from-slate-900 via-slate-900 to-blue-950",
    },
    admin: {
      label: "System Admin",
      subtitle: "Platform Control",
      ring: "from-amber-400 to-orange-500",
      badge: "border-amber-400/20 bg-amber-500/15 text-amber-100",
      panel: "from-slate-900 via-slate-900 to-orange-950",
    },
    operations: {
      label: "Operations Team",
      subtitle: "Booking Control Desk",
      ring: "from-violet-500 to-fuchsia-500",
      badge: "border-violet-400/20 bg-violet-500/15 text-violet-100",
      panel: "from-slate-900 via-slate-900 to-violet-950",
    },
    operation_manager: {
      label: "Operation Manager",
      subtitle: "Ops Command Center",
      ring: "from-sky-500 to-cyan-400",
      badge: "border-sky-400/20 bg-sky-500/15 text-sky-100",
      panel: "from-slate-900 via-slate-900 to-sky-950",
    },
    dmc_partner: {
      label: "DMC Partner",
      subtitle: user.companyName || "Fulfillment Desk",
      ring: "from-emerald-500 to-teal-400",
      badge: "border-emerald-400/20 bg-emerald-500/15 text-emerald-100",
      panel: "from-slate-900 via-slate-900 to-emerald-950",
    },
    finance_partner: {
      label: "Finance Partner",
      subtitle: user.companyName || "Finance Desk",
      ring: "from-pink-500 to-rose-400",
      badge: "border-pink-400/20 bg-pink-500/15 text-pink-100",
      panel: "from-slate-900 via-slate-900 to-rose-950",
    },
    finance_manager: {
      label: "Finance Manager",
      subtitle: "Finance Command Center",
      ring: "from-amber-500 to-orange-400",
      badge: "border-amber-400/20 bg-amber-500/15 text-amber-100",
      panel: "from-slate-900 via-slate-900 to-amber-950",
    },
  };

  const activeRole = roleConfig[user.role] || {
    label: "Workspace User",
    subtitle: user.companyName || "Holiday Circuit",
    ring: "from-slate-500 to-slate-300",
    badge: "border-slate-400/20 bg-slate-500/15 text-slate-100",
    panel: "from-slate-900 via-slate-900 to-slate-800",
  };

  const primaryIdentity = user.companyName || user.name || "Holiday Circuit";
  const avatarLetter = (user.name || user.companyName || "H").charAt(0).toUpperCase();
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
      if (!nextIsMobile) {
        onMobileClose();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onMobileClose]);

  const getItemTarget = (item) =>
    item.hash ? { pathname: item.path, hash: item.hash } : item.path;

  const isItemActive = (item) => {
    if (location.pathname !== item.path) return false;
    if (!item.hash) return true;
    if (!location.hash) return item.hash === "#overview";
    return location.hash === item.hash;
  };

  const getLinkClass = (isActive) =>
    `group relative flex rounded-xl text-sm transition-all duration-200 ${
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

  // Framer Motion variants
  const sidebarVariants = {
    expanded: {
      width: 240,
      transition: { duration: 0.28, ease: "easeOut" },
    },
    collapsed: {
      width: 80,
      transition: { duration: 0.28, ease: "easeOut" },
    },
    mobileOpen: {
      x: 0,
      transition: { duration: 0.28, ease: "easeOut" },
    },
    mobileClosed: {
      x: -320,
      transition: { duration: 0.28, ease: "easeOut" },
    },
  };

  const collapsibleTextVariants = {
    expanded: {
      width: "auto",
      opacity: 1,
      display: "block",
      transition: { duration: 0.28, ease: "easeOut" },
    },
    collapsed: {
      width: 0,
      opacity: 0,
      transition: { duration: 0.28, ease: "easeOut" },
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
        } flex flex-col justify-between overflow-x-hidden border-t border-gray-800 bg-gray-900`}
        variants={sidebarVariants}
        animate={
          isMobileViewport
            ? mobileOpen
              ? "mobileOpen"
              : "mobileClosed"
            : effectiveCollapsed
              ? "collapsed"
              : "expanded"
        }
        style={isMobileViewport ? { width: 280 } : undefined}
      >
      {/* COLLAPSE BUTTON */}
      <div className="flex justify-end px-2 pt-2">
        <motion.button
          onClick={() => {
            if (isMobileViewport) {
              onMobileClose();
              return;
            }
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
      <motion.nav className="sidebar-scrollbar flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-2">
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
                  : "items-start gap-3 px-2.5 py-2.5"
              }`}
              onClick={() => {
                if (isMobileViewport) onMobileClose();
              }}
            >
              <span className={getIconWrapClass(isActive)}>
                <Icon size={16} className="shrink-0" />
              </span>
              <motion.span
                initial={false}
                variants={collapsibleTextVariants}
                animate={effectiveCollapsed ? "collapsed" : "expanded"}
                className="overflow-hidden whitespace-nowrap text-[13px] leading-5"
              >
                {item.label}
              </motion.span>
            </NavLink>
          );
        })}
      </motion.nav>

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
              {/* Hover Overlay Settings Icon */}
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/40 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100">
                <Settings size={18} className="text-white drop-shadow-md transition-transform duration-500 hover:rotate-90" />
              </div>
            </div>

            <motion.div
              initial={false}
              variants={collapsibleTextVariants}
              animate={effectiveCollapsed ? "collapsed" : "expanded"}
              className="overflow-hidden"
            >
                <div className="w-[136px]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{primaryIdentity}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-300">{user.name}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${activeRole.badge}`}>
                      {activeRole.label}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] uppercase tracking-[0.16em] text-slate-400">Workspace</p>
                      <p className="truncate text-xs text-slate-200">{activeRole.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-white/6 px-2 py-1 text-[10px] text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                      Active
                    </div>
                  </div>
                </div>
            </motion.div>
          </div>
        </button>

        <motion.button
          onClick={handleLogout}
          title={effectiveCollapsed ? "Log Out" : undefined}
          className={`mt-3 flex w-full items-center rounded-2xl border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-gray-200 transition-all duration-300 hover:border-red-400/20 hover:bg-red-500/10 hover:text-white ${
            effectiveCollapsed ? "justify-center" : "gap-2"
          }`}
          whileTap={{ scale: 0.97 }}
        >
          <LogOut size={16} />
          <motion.span
            initial={false}
            variants={collapsibleTextVariants}
            animate={effectiveCollapsed ? "collapsed" : "expanded"}
            className="overflow-hidden whitespace-nowrap"
          >
            Log Out
          </motion.span>
        </motion.button>
      </motion.div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
