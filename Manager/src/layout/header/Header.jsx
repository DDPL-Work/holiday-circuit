import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Info,
  LoaderCircle,
  Menu,
  X,
  Gift,
  LogOut,
  Settings,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import logo from "../../assets/logo img.png";
import ExclusiveOfferModal from "../../modal/ExclusiveOfferModal.jsx";
import ProfileSettingsModal from "../../modal/ProfileSettingsModal";
import API from "../../utils/Api";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "../../redux/slices/authSlice";
import {
  getMenusForRole,
  getItemTarget,
  isItemActive,
} from "../navConfig";

const notificationRoles = new Set([
  "admin",
  "operation_manager",
  "finance_manager",
  "operations",
  "finance_partner",
  "dmc_partner",
  "agent",
]);

const managerFilterRoles = new Set([
  "admin",
  "operation_manager",
  "finance_manager",
  "operations",
]);

const clearAllRoles = new Set([
  "admin",
  "operation_manager",
  "finance_manager",
  "operations",
  "finance_partner",
  "dmc_partner",
  "agent",
]);

const isCouponNotification = (notification) =>
  notification?.meta?.kind === "coupon" ||
  Boolean(notification?.meta?.couponId) ||
  notification?.title === "New Coupon Shared";

const getNotificationEndpoint = (role) =>
  role === "agent" || role === "dmc_partner"
    ? "/agent/notifications"
    : "/admin/notifications";

const getUnreadNotificationCount = (notifications = []) =>
  notifications.filter((notification) => !notification?.isRead).length;

const notificationBurstDots = [
  { key: "top", className: "left-1/2 top-1.5", tx: "0px", ty: "-16px", color: "#60a5fa" },
  { key: "top-right", className: "right-1.5 top-2.5", tx: "12px", ty: "-12px", color: "#facc15" },
  { key: "right", className: "right-1 top-1/2", tx: "16px", ty: "0px", color: "#34d399" },
  { key: "bottom-right", className: "right-2 bottom-1.5", tx: "12px", ty: "12px", color: "#fb7185" },
  { key: "bottom", className: "left-1/2 bottom-1", tx: "0px", ty: "16px", color: "#a78bfa" },
  { key: "left", className: "left-1 top-1/2", tx: "-16px", ty: "0px", color: "#38bdf8" },
];

const NOTIFICATION_POLL_INTERVAL_MS = 10000;

const isDocumentVisible = () =>
  typeof document === "undefined" || document.visibilityState === "visible";

const notificationRouteAllowlist = {
  admin: [
    "/admin/dashboard",
    "/admin/superAdminDashboard",
    "/admin/bookings-management",
    "/admin/user-management",
    "/ops/create-package",
  ],
  operation_manager: [
    "/operationManager/operationManagerDashboard",
    "/operationManager/allTeamQueries",
    "/operationManager/myTeam",
    "/ops/bookings-management",
    "/ops/order-acceptance",
    "/ops/dashboard",
    "/ops/create-package",
  ],
  finance_manager: [
    "/financeManager/financeManagerDashboard",
    "/financeManager/allTeamTransaction",
    "/financeManager/internalDmcInvoice",
    "/financeManager/myFinanceTeam",
  ],
  operations: [
    "/ops/dashboard",
    "/ops/bookings-management",
    "/ops/order-acceptance",
    "/ops/quotation-builder",
    "/ops/voucher-management",
    "/ops/create-package",
  ],
  finance_partner: [
    "/finance/dashboard",
    "/finance/advancedAnalytics",
    "/finance/paymentVerification",
    "/finance/internalInvoice",
  ],
  dmc_partner: [
    "/dmc/dashboard",
    "/dmc/contractedRates",
    "/dmc/confirmation",
  ],
  agent: [
    "/agent/dashboard",
    "/agent/queries",
    "/agent/bookings",
    "/agent/documents",
    "/agent/finance",
    "/agent/assets",
  ],
};

const legacyNotificationPathMap = {
  "/dmc/internalInvoice": "/dmc/confirmation",
  "/agent/invoices": "/agent/finance",
  "/agent/invoice": "/agent/finance",
  "/finance/internal-invoice": "/finance/internalInvoice",
  "/finance/internalInvoices": "/finance/internalInvoice",
  "/financeManager/allTeamTransactions": "/financeManager/allTeamTransaction",
};

const normalizeNotificationLink = (link = "") => {
  const rawLink = String(link || "").trim();
  if (!rawLink) return "";

  const [pathAndQuery = "", hash = ""] = rawLink.split("#");
  const [pathname = "", query = ""] = pathAndQuery.split("?");
  const normalizedPathname = pathname
    ? pathname.startsWith("/")
      ? pathname
      : `/${pathname}`
    : "";

  const mappedPathname =
    legacyNotificationPathMap[normalizedPathname] || normalizedPathname;

  return `${mappedPathname}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
};

const extractNotificationPathname = (link = "") => {
  const normalizedLink = normalizeNotificationLink(link);
  return normalizedLink.split("?")[0].split("#")[0];
};

const isAllowedNotificationRoute = (role, link = "") => {
  const pathname = extractNotificationPathname(link);
  if (!pathname) return false;

  const allowedRoutes = notificationRouteAllowlist[role] || [];
  return allowedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
};

const formatNotificationTimeAgo = (value) => {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const diffInMinutes = Math.max(
    0,
    Math.floor((Date.now() - parsed.getTime()) / 60000),
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

  const hours = Math.floor(diffInMinutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
};

const formatNotificationTimestamp = (value) => {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getContextualNotificationLink = (role, notification) => {
  const title = String(notification?.title || "").toLowerCase();

  if (
    notification?.category === "Finance Report" ||
    title.includes("finance report")
  ) {
    return role === "finance_manager"
      ? "/finance/manager-dashboard"
      : "/finance/internalInvoice";
  }

  if (
    role === "dmc_partner" &&
    (notification?.meta?.internalInvoiceId ||
      title.includes("internal invoice"))
  ) {
    return "/dmc/confirmation";
  }

  if (
    role === "agent" &&
    (notification?.meta?.invoiceId ||
      title.includes("payment verified") ||
      title.includes("payment rejected"))
  ) {
    return "/agent/finance";
  }

  if (role === "finance_partner" && notification?.meta?.internalInvoiceId) {
    return "/finance/internalInvoice";
  }

  return "";
};

const resolveNotificationLink = (role, notification, fallbackLink) => {
  const contextualLink = getContextualNotificationLink(role, notification);
  const rawLink = normalizeNotificationLink(notification?.link);
  const safeFallbackLink = normalizeNotificationLink(fallbackLink);

  if (isAllowedNotificationRoute(role, rawLink)) {
    return rawLink;
  }

  if (contextualLink) {
    return contextualLink;
  }

  if (isAllowedNotificationRoute(role, safeFallbackLink)) {
    return safeFallbackLink;
  }

  return fallbackLink;
};

const filterNotificationsByRole = (role, notifications = []) => {
  if (role === "agent") {
    return notifications.filter(
      (notification) => !isCouponNotification(notification),
    );
  }

  return notifications;
};

const isMirroredNotification = (notification) =>
  Boolean(notification?.meta?.mirroredForAdmin);

const getNotificationSourceRole = (notification) =>
  String(notification?.meta?.notificationSourceRole || "")
    .trim()
    .toLowerCase();

const getAdminNotificationSourceGroup = (notification) => {
  if (!isMirroredNotification(notification)) {
    return "direct";
  }

  const sourceRole = getNotificationSourceRole(notification);

  if (sourceRole === "agent") return "agent";
  if (["operations", "operation_manager"].includes(sourceRole)) return "ops";
  if (["finance_partner", "finance_manager"].includes(sourceRole))
    return "finance";

  return "other";
};

const getAdminNotificationSourceLabel = (notification) => {
  if (!isMirroredNotification(notification)) {
    return "Admin Alert";
  }

  const sourceRole = getNotificationSourceRole(notification);

  if (sourceRole === "agent") return "From Agent";
  if (sourceRole === "operations") return "From Ops";
  if (sourceRole === "operation_manager") return "From Ops Manager";
  if (sourceRole === "finance_partner") return "From Finance";
  if (sourceRole === "finance_manager") return "From Finance Manager";

  return "Team Update";
};

const isContractedRateNotification = (notification) =>
  String(notification?.title || "")
    .toLowerCase()
    .includes("contracted rate") ||
  Boolean(
    notification?.meta?.changeReasonLabel || notification?.meta?.changeReasonNote,
  );

const adminNotificationFilters = [
  { key: "all", label: "All" },
  { key: "direct", label: "Admin Alerts" },
  { key: "mirrored", label: "Team Updates" },
  { key: "agent", label: "Agent Updates" },
  { key: "ops", label: "Ops Updates" },
  { key: "finance", label: "Finance Updates" },
];

const getDefaultNotificationLink = (role) => {
  if (role === "admin") return "/admin/superAdminDashboard#agent-approvals";
  if (role === "finance_manager") return "/financeManager/financeManagerDashboard";
  if (role === "operation_manager")
    return "/operationManager/operationManagerDashboard";
  if (role === "operations") return "/ops/bookings-management";
  if (role === "finance_partner") return "/finance/dashboard";
  if (role === "dmc_partner") return "/dmc/dashboard";
  return "/agent/dashboard";
};

const getNotificationCopy = (role) => {
  if (role === "admin") {
    return {
      title: "Executive Alerts",
      subtitle: "Approvals and platform alerts for the admin desk",
    };
  }

  if (role === "finance_manager") {
    return {
      title: "Executive Alerts",
      subtitle: "Important updates for Ops and Finance managers",
    };
  }

  if (role === "operation_manager") {
    return {
      title: "Executive Alerts",
      subtitle: "Important updates for Ops and Finance managers",
    };
  }

  if (role === "operations") {
    return {
      title: "Ops Notifications",
      subtitle: "Client approvals and next invoice actions",
    };
  }

  if (role === "finance_partner") {
    return {
      title: "Finance Notifications",
      subtitle: "Internal invoice alerts and payment workflow updates",
    };
  }

  if (role === "dmc_partner") {
    return {
      title: "Partner Alerts",
      subtitle: "Assigned booking updates and action requests",
    };
  }

  return {
    title: "Notifications",
    subtitle: "Booking and service updates for your dashboard",
  };
};

const getWorkspaceBranding = (user = null) => {
  const isAgent = user?.role === "agent";

  return {
    logo: isAgent ? String(user?.brandingLogo || "").trim() : "",
    name: isAgent
      ? String(user?.brandingName || "Holiday Circuit").trim()
      : "Holiday Circuit",
  };
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const workspaceBranding = getWorkspaceBranding(user);

  const role = user?.role || "";
  const isQuotationBuilder = location.pathname === "/ops/quotation-builder";
  const canViewNotifications = notificationRoles.has(role);
  const canUseManagerFilter = managerFilterRoles.has(role);
  const canViewOffers = role === "agent";
  const canUseAdminMirrorFilters = role === "admin";

  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [expandedNotifications, setExpandedNotifications] = useState({});
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [bellPop, setBellPop] = useState(false);
  const [bellPopKey, setBellPopKey] = useState(0);
  const [filterMode, setFilterMode] = useState("all");
  const [offerOpen, setOfferOpen] = useState(false);
  const [couponUnreadCount, setCouponUnreadCount] = useState(0);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const mobileNavRef = useRef(null);

  const menus = useMemo(() => getMenusForRole(role, user), [role, user]);

  const getAgentWorkspaceBranding = (usr = {}) => ({
    name: usr?.brandingName || usr?.companyName || usr?.name || "Holiday Circuit",
    logo: usr?.brandingLogo || "",
  });

  useEffect(() => {
    if (!user?._id && !user?.id) return undefined;

    const sendUserHeartbeat = async () => {
      try {
        await API.post("/auth/heartbeat");
      } catch (err) {
        // silent ping fail
      }
    };

    sendUserHeartbeat();
    const intervalId = window.setInterval(sendUserHeartbeat, 30000); // 30s live activity ping

    return () => window.clearInterval(intervalId);
  }, [user]);

  const agentWorkspaceBranding = getAgentWorkspaceBranding(user);
  const primaryIdentity =
    role === "agent"
      ? agentWorkspaceBranding.name
      : user?.companyName || user?.name || "Holiday Circuit";
  const avatarLetter = (primaryIdentity || "H").charAt(0).toUpperCase();
  const profileImage = user?.profileImage || "";

  const toggleExpandNotification = (id, event) => {
    event.stopPropagation();
    setExpandedNotifications((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [localReportNotifications, setLocalReportNotifications] = useState([]);

  const loadLocalReports = () => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("finance_reports_history") || "[]",
      );
      const mapped = stored.map((report) => ({
        _id: report.id,
        id: report.id,
        type: "info",
        title: report.title || "Exported Finance Report",
        message: `${report.title} exported with ${report.totalItems || report.items?.length || 0} items from ${report.source || "Finance Desk"} on ${report.generatedAt}. Available in Finance Manager Hub for download.`,
        createdAt: report.generatedAt,
        isRead: false,
        category: "Finance Report",
        link:
          role === "finance_manager"
            ? "/finance/manager-dashboard"
            : "/finance/internalInvoice",
      }));
      setLocalReportNotifications(mapped);
    } catch (e) {
      console.warn("Could not load local report notifications:", e);
    }
  };

  useEffect(() => {
    loadLocalReports();

    const handleReportSubmitted = () => loadLocalReports();
    window.addEventListener("finance-report-submitted", handleReportSubmitted);
    window.addEventListener("storage", handleReportSubmitted);

    return () => {
      window.removeEventListener(
        "finance-report-submitted",
        handleReportSubmitted,
      );
      window.removeEventListener("storage", handleReportSubmitted);
    };
  }, [role]);

  const hasFetchedRef = useRef(false);
  const prevUnreadRef = useRef(0);
  const bellPopFrameRef = useRef(null);
  const wrapRef = useRef(null);

  const baseNotifications = useMemo(() => {
    const roleFiltered = filterNotificationsByRole(role, notifications);
    if (["finance_manager", "admin", "finance_partner"].includes(role)) {
      return [...localReportNotifications, ...roleFiltered];
    }
    return roleFiltered;
  }, [notifications, localReportNotifications, role]);

  const unreadCount = useMemo(
    () => getUnreadNotificationCount(baseNotifications),
    [baseNotifications],
  );

  const importantCount = useMemo(
    () =>
      baseNotifications.filter(
        (notification) => notification.type === "warning" && !notification.isRead,
      ).length,
    [baseNotifications],
  );

  const adminFilterCounts = useMemo(
    () => ({
      direct: baseNotifications.filter(
        (notification) => !isMirroredNotification(notification),
      ).length,
      mirrored: baseNotifications.filter((notification) =>
        isMirroredNotification(notification),
      ).length,
      agent: baseNotifications.filter(
        (notification) =>
          getAdminNotificationSourceGroup(notification) === "agent",
      ).length,
      ops: baseNotifications.filter(
        (notification) =>
          getAdminNotificationSourceGroup(notification) === "ops",
      ).length,
      finance: baseNotifications.filter(
        (notification) =>
          getAdminNotificationSourceGroup(notification) === "finance",
      ).length,
    }),
    [baseNotifications],
  );

  const visibleNotifications = useMemo(() => {
    let source = baseNotifications;

    if (canUseAdminMirrorFilters) {
      if (filterMode === "direct") {
        source = baseNotifications.filter(
          (notification) => !isMirroredNotification(notification),
        );
      } else if (filterMode === "mirrored") {
        source = baseNotifications.filter((notification) =>
          isMirroredNotification(notification),
        );
      } else if (["agent", "ops", "finance"].includes(filterMode)) {
        source = baseNotifications.filter(
          (notification) =>
            getAdminNotificationSourceGroup(notification) === filterMode,
        );
      }
    } else if (canUseManagerFilter && filterMode === "important") {
      source = baseNotifications.filter(
        (notification) => notification.type === "warning",
      );
    }

    return [...source].sort((a, b) => {
      const createdAtDiff =
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (createdAtDiff !== 0) return createdAtDiff;
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      if (a.type !== b.type) {
        if (a.type === "warning") return -1;
        if (b.type === "warning") return 1;
      }
      return 0;
    });
  }, [
    baseNotifications,
    canUseAdminMirrorFilters,
    canUseManagerFilter,
    filterMode,
  ]);

  const notificationCopy = getNotificationCopy(role);
  const defaultNotificationLink = getDefaultNotificationLink(role);

  const fetchNotifications = async (silent = false) => {
    if (!canViewNotifications) return;

    try {
      if (!silent) setLoadingNotifications(true);

      const { data } = await API.get(getNotificationEndpoint(role), {
        skipGlobalLoader: true,
      });
      const nextNotifications = data?.notifications || [];
      const nextVisibleNotifications = filterNotificationsByRole(
        role,
        nextNotifications,
      );
      const nextUnreadCount =
        getUnreadNotificationCount(nextVisibleNotifications);

      if (hasFetchedRef.current && nextUnreadCount > prevUnreadRef.current) {
        if (bellPopFrameRef.current) {
          window.cancelAnimationFrame(bellPopFrameRef.current);
        }
        setBellPop(false);
        setBellPopKey((current) => current + 1);
        bellPopFrameRef.current = window.requestAnimationFrame(() => {
          setBellPop(true);
          bellPopFrameRef.current = null;
        });
      }

      prevUnreadRef.current = nextUnreadCount;
      hasFetchedRef.current = true;
      setNotifications(nextNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      if (!silent) setLoadingNotifications(false);
    }
  };

  const fetchCouponUnreadCount = async () => {
    if (!canViewOffers) return 0;

    try {
      const { data } = await API.get("/agent/coupons", {
        skipGlobalLoader: true,
      });
      const nextUnreadCount = Number(data?.data?.unreadCount || 0);
      setCouponUnreadCount(nextUnreadCount);
      return nextUnreadCount;
    } catch (error) {
      console.error("Failed to fetch coupon notifications", error);
      return 0;
    }
  };

  const dismissNotification = async (id) => {
    try {
      const isLocal = localReportNotifications.some(
        (item) => item._id === id || item.id === id,
      );

      if (isLocal) {
        setLocalReportNotifications((prev) =>
          prev.filter((item) => item._id !== id && item.id !== id),
        );
        try {
          const stored = JSON.parse(
            localStorage.getItem("finance_reports_history") || "[]",
          );
          const updated = stored.filter(
            (item) => item.id !== id && item._id !== id,
          );
          localStorage.setItem("finance_reports_history", JSON.stringify(updated));
          window.dispatchEvent(new Event("finance-report-submitted"));
        } catch (e) {
          console.warn(
            "Could not update local report history on dismiss:",
            e,
          );
        }
        return;
      }

      await API.delete(`${getNotificationEndpoint(role)}/${id}`, {
        skipGlobalLoader: true,
      });
      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== id),
      );
    } catch (error) {
      console.error("Failed to dismiss notification", error);
      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== id),
      );
      setLocalReportNotifications((prev) =>
        prev.filter((notification) => notification._id !== id),
      );
    }
  };

  const markAllRead = async () => {
    try {
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
      setLocalReportNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
      prevUnreadRef.current = 0;
      setBellPop(false);
      setOpenNotifications(false);

      if (canViewNotifications) {
        await API.patch(`${getNotificationEndpoint(role)}/read-all`, null, {
          skipGlobalLoader: true,
        });
      }

      if (canViewOffers) {
        setCouponUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark notifications read", error);
    }
  };

  const clearVisibleNotifications = async () => {
    try {
      setLocalReportNotifications([]);
      try {
        localStorage.removeItem("finance_reports_history");
        window.dispatchEvent(new Event("finance-report-submitted"));
      } catch (e) {
        console.warn("Could not clear local report history:", e);
      }

      if (canViewNotifications) {
        await Promise.all(
          baseNotifications
            .filter((n) => !String(n._id || n.id).startsWith("report-"))
            .map((notification) =>
              API.delete(
                `${getNotificationEndpoint(role)}/${notification._id}`,
                { skipGlobalLoader: true },
              ),
            ),
        );
      }

      setNotifications((prev) =>
        prev.filter(
          (notification) =>
            !baseNotifications.some(
              (item) => item._id === notification._id,
            ),
        ),
      );
      prevUnreadRef.current = 0;
      setBellPop(false);
      setOpenNotifications(false);
    } catch (error) {
      console.error("Failed to clear notifications", error);
      setLocalReportNotifications([]);
      setNotifications([]);
      setOpenNotifications(false);
    }
  };

  const openNotification = (notification) => {
    setOpenNotifications(false);
    const link = resolveNotificationLink(role, notification, defaultNotificationLink);
    navigate(link, {
      state: notification?.meta
        ? { notificationMeta: notification.meta }
        : undefined,
    });
  };

  const handleOpenOffers = async () => {
    const latestCouponUnreadCount = await fetchCouponUnreadCount();
    setOfferOpen(true);

    if (!latestCouponUnreadCount) return;

    setCouponUnreadCount(0);

    try {
      await API.patch("/agent/coupons/read", null, {
        skipGlobalLoader: true,
      });
    } catch (error) {
      console.error("Failed to mark coupon notifications as read", error);
    }
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    localStorage.clear();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    setOpenNotifications(false);
    setNotifications([]);
    setFilterMode("all");
    setCouponUnreadCount(0);
    hasFetchedRef.current = false;
    prevUnreadRef.current = 0;
  }, [role]);

  useEffect(() => {
    if (!openNotifications) return undefined;

    const onDown = (event) => {
      if (!wrapRef.current) return;
      if (wrapRef.current.contains(event.target)) return;
      setOpenNotifications(false);
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openNotifications]);

  useEffect(() => {
    if (!canViewNotifications) return;
    fetchNotifications(true);
  }, [canViewNotifications, role]);

  useEffect(() => {
    if (!canViewNotifications) return undefined;

    const interval = window.setInterval(() => {
      if (!isDocumentVisible()) return;
      fetchNotifications(true);
    }, NOTIFICATION_POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [canViewNotifications, role]);

  useEffect(() => {
    if (!canViewOffers) return;
    fetchCouponUnreadCount();
  }, [canViewOffers]);

  useEffect(() => {
    if (!openNotifications) return;
    if (canViewNotifications) {
      fetchNotifications(false);
    }
    if (canViewOffers) {
      fetchCouponUnreadCount();
    }
  }, [openNotifications, canViewNotifications, canViewOffers, role]);

  useEffect(() => {
    if (!canViewNotifications && !canViewOffers) return undefined;

    const handleForegroundRefresh = () => {
      if (!isDocumentVisible()) return;
      if (canViewNotifications) {
        fetchNotifications(true);
      }
      if (canViewOffers) {
        fetchCouponUnreadCount();
      }
    };

    document.addEventListener("visibilitychange", handleForegroundRefresh);
    window.addEventListener("focus", handleForegroundRefresh);
    return () => {
      document.removeEventListener("visibilitychange", handleForegroundRefresh);
      window.removeEventListener("focus", handleForegroundRefresh);
    };
  }, [canViewNotifications, canViewOffers, role]);

  useEffect(() => {
    if (!bellPop) return undefined;

    const timeout = window.setTimeout(() => setBellPop(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [bellPop]);

  useEffect(
    () => () => {
      if (bellPopFrameRef.current) {
        window.cancelAnimationFrame(bellPopFrameRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

  const getNotificationMeta = (type) => {
    if (type === "warning") {
      return { Icon: AlertCircle, iconClass: "text-rose-600", dot: "bg-rose-500" };
    }

    if (type === "success") {
      return {
        Icon: CheckCircle2,
        iconClass: "text-emerald-600",
        dot: "bg-emerald-500",
      };
    }

    return { Icon: Info, iconClass: "text-blue-600", dot: "bg-blue-500" };
  };

  const bulkActionLabel = clearAllRoles.has(role)
    ? baseNotifications.length
      ? "Clear all"
      : ""
    : unreadCount
      ? "Mark all read"
      : "";

  const handleBulkAction = clearAllRoles.has(role)
    ? clearVisibleNotifications
    : markAllRead;

  const renderNavItems = (isMobile = false) => {
    if (isMobile) {
      return menus.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(item, location);
        return (
          <NavLink
            key={`${item.path}${item.hash || item.label}`}
            to={getItemTarget(item)}
            onClick={() => setMobileNavOpen(false)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-[#3E63DD] text-white shadow-[0_8px_16px_rgba(62,99,221,0.3)]"
                : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Icon size={15} />
            <span>{item.label}</span>
          </NavLink>
        );
      });
    }

    if (menus.length > 4) {
      const visibleCount = 4;
      const visibleMenus = menus.slice(0, visibleCount);
      const overflowMenus = menus.slice(visibleCount);
      const isOverflowActive = overflowMenus.some((item) => isItemActive(item, location));

      return (
        <>
          {visibleMenus.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item, location);
            return (
              <NavLink
                key={`${item.path}${item.hash || item.label}`}
                to={getItemTarget(item)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-[#3E63DD] text-white shadow-[0_8px_16px_rgba(62,99,221,0.3)]"
                    : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div
            className="relative"
            onMouseEnter={() => setMoreDropdownOpen(true)}
            onMouseLeave={() => setMoreDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                isOverflowActive || moreDropdownOpen
                  ? "bg-[#3E63DD] text-white shadow-[0_8px_16px_rgba(62,99,221,0.3)]"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span>More</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${moreDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {moreDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-1 z-50 min-w-[210px] rounded-2xl border border-white/10 bg-[#0F172A] p-2 shadow-2xl backdrop-blur-xl"
                >
                  <div className="space-y-1">
                    {overflowMenus.map((item) => {
                      const Icon = item.icon;
                      const active = isItemActive(item, location);
                      return (
                        <NavLink
                          key={`${item.path}${item.hash || item.label}`}
                          to={getItemTarget(item)}
                          onClick={() => setMoreDropdownOpen(false)}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] font-medium transition-all duration-150 ${
                            active
                              ? "bg-[#3E63DD] text-white shadow-sm"
                              : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                          }`}
                        >
                          <Icon size={14} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      );
    }

    return menus.map((item) => {
      const Icon = item.icon;
      const active = isItemActive(item, location);
      return (
        <NavLink
          key={`${item.path}${item.hash || item.label}`}
          to={getItemTarget(item)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
            active
              ? "bg-[#3E63DD] text-white shadow-[0_8px_16px_rgba(62,99,221,0.3)]"
              : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          <Icon size={14} />
          <span>{item.label}</span>
        </NavLink>
      );
    });
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

      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              ref={mobileNavRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-[4.5rem] left-0 right-0 z-50 max-h-[calc(100vh-4.5rem)] overflow-y-auto border-b border-white/10 bg-[#0F172A] lg:hidden custom-scroll"
            >
              <nav className="space-y-1 p-3">{renderNavItems(true)}</nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header className="h-[4.5rem] border-b border-white/10 bg-[#0F172A] px-3 sm:px-5">
        <div className="flex h-full items-center gap-2 sm:gap-3">
          <div className="flex h-full items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <div className="flex h-full cursor-pointer items-center px-2 sm:px-4">
              <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-0.5 shadow-inner ring-1 ring-black/5">
                <img
                  src={workspaceBranding.logo || logo}
                  alt={workspaceBranding.name || "Logo"}
                  className={`h-full w-full object-contain ${
                    workspaceBranding.logo ? "scale-[1.15]" : "scale-[1.4]"
                  }`}
                />
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-2.5 sm:gap-3.5 ml-auto mr-3 shrink-0">
            {renderNavItems(false)}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {canViewOffers ? (
              <button
                type="button"
                onClick={handleOpenOffers}
                className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Offers"
                title="Offers"
              >
                <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
                {couponUnreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-[1.25rem] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {couponUnreadCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            {canViewNotifications ? (
              <div className="relative" ref={wrapRef}>
                <button
                  type="button"
                  onClick={() => {
                    const next = !openNotifications;
                    setOpenNotifications(next);

                    if (next) {
                      setFilterMode("all");
                    }
                  }}
                  className={`relative flex h-9 w-9 sm:h-10 sm:w-10 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition duration-300 hover:bg-white/10 ${
                    bellPop
                      ? "scale-110 -translate-y-0.5 shadow-[0_0_0_5px_rgba(59,130,246,0.16),0_14px_28px_rgba(15,23,42,0.35)]"
                      : ""
                  }`}
                  aria-label="Notifications"
                  title="Notifications"
                >
                  {bellPop && unreadCount > 0 ? (
                    <span key={bellPopKey} className="absolute inset-0">
                      <span
                        className="absolute inset-0 rounded-2xl border border-sky-300/70"
                        style={{
                          animation:
                            "notification-burst-ring 720ms ease-out forwards",
                        }}
                      />
                      <span
                        className="absolute inset-0 rounded-2xl border border-cyan-200/40"
                        style={{
                          animation:
                            "notification-burst-ring 980ms ease-out forwards",
                        }}
                      />
                      <span className="absolute inset-0 rounded-2xl bg-blue-400/20 animate-ping" />
                      {notificationBurstDots.map((dot) => (
                        <span
                          key={dot.key}
                          className={`absolute h-1.5 w-1.5 rounded-full ${dot.className}`}
                          style={{
                            backgroundColor: dot.color,
                            boxShadow: `0 0 12px ${dot.color}`,
                            animation:
                              "notification-burst-dot 780ms ease-out forwards",
                            "--tx": dot.tx,
                            "--ty": dot.ty,
                          }}
                        />
                      ))}
                    </span>
                  ) : null}
                  <Bell
                    className={`relative h-4 w-4 sm:h-5 sm:w-5 ${
                      bellPop && unreadCount > 0 ? "text-blue-300" : ""
                    }`}
                    style={
                      bellPop && unreadCount > 0
                        ? {
                            animation:
                              "notification-bell-swing 760ms cubic-bezier(0.22, 1, 0.36, 1)",
                          }
                        : undefined
                    }
                  />
                  {unreadCount > 0 ? (
                    <span
                      className={`absolute -right-1 -top-1 min-w-[1.25rem] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white ${
                        bellPop ? "animate-pulse" : ""
                      }`}
                      style={
                        bellPop
                          ? {
                              animation:
                                "notification-badge-pop 520ms cubic-bezier(0.34, 1.56, 0.64, 1), pulse 1s ease-in-out infinite",
                            }
                          : undefined
                      }
                    >
                      {unreadCount}
                    </span>
                  ) : null}
                </button>

                {openNotifications ? (
                  <div
                    className={`absolute right-0 top-12 z-50 w-[min(92vw,22.5rem)] overflow-hidden rounded-2xl border shadow-2xl ${
                      isQuotationBuilder ? "" : "border-slate-200 bg-white"
                    }`}
                    style={
                      isQuotationBuilder
                        ? {
                            background:
                              "linear-gradient(135deg, rgba(15,23,42,0.72) 0%, rgba(30,41,59,0.58) 100%)",
                            borderColor: "rgba(255,255,255,0.16)",
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            boxShadow:
                              "0 24px 80px rgba(2,6,23,0.42), inset 0 1px 0 rgba(255,255,255,0.12)",
                          }
                        : undefined
                    }
                  >
                    <div
                      className={`flex items-start gap-3 border-b px-4 py-3 ${
                        isQuotationBuilder
                          ? ""
                          : "border-slate-100 bg-gradient-to-br from-slate-50 via-white to-white"
                      }`}
                      style={
                        isQuotationBuilder
                          ? {
                              borderColor: "rgba(255,255,255,0.08)",
                              background:
                                "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                            }
                          : undefined
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            isQuotationBuilder ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {notificationCopy.title}
                        </p>
                        <p
                          className={`mt-0.5 text-xs ${
                            isQuotationBuilder
                              ? "text-slate-300"
                              : "text-slate-500"
                          }`}
                        >
                          {notificationCopy.subtitle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenNotifications(false)}
                        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition ${
                          isQuotationBuilder
                            ? "text-slate-200 hover:text-white"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                        style={
                          isQuotationBuilder
                            ? {
                                borderColor: "rgba(255,255,255,0.14)",
                                background: "rgba(255,255,255,0.05)",
                              }
                            : undefined
                        }
                        aria-label="Close notifications"
                        title="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-3">
                      {canUseAdminMirrorFilters ? (
                        <div className="ml-auto flex items-center gap-2">
                          <span
                            className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                              isQuotationBuilder
                                ? "text-slate-300"
                                : "text-slate-500"
                            }`}
                          >
                            View
                          </span>
                          <select
                            value={filterMode}
                            onChange={(event) => setFilterMode(event.target.value)}
                            className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition ${
                              isQuotationBuilder
                                ? "border-white/10 bg-white/8 text-white"
                                : "border-slate-200 bg-white text-slate-700"
                            }`}
                            style={
                              isQuotationBuilder
                                ? {
                                    background: "rgba(255,255,255,0.08)",
                                    color: "#fff",
                                  }
                                : undefined
                            }
                          >
                            {adminNotificationFilters.map((filter) => {
                              const countSuffix =
                                filter.key === "all"
                                  ? baseNotifications.length
                                  : adminFilterCounts[filter.key] || 0;

                              return (
                                <option key={filter.key} value={filter.key}>
                                  {filter.label}
                                  {countSuffix ? ` (${countSuffix})` : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      ) : canUseManagerFilter ? (
                        <div
                          className="flex items-center gap-1 rounded-xl p-1"
                          style={
                            isQuotationBuilder
                              ? { background: "rgba(255,255,255,0.08)" }
                              : { background: "#f1f5f9" }
                          }
                        >
                          <button
                            type="button"
                            onClick={() => setFilterMode("all")}
                            className={`cursor-pointer rounded-xl px-3 py-1 text-xs font-semibold transition ${
                              filterMode === "all"
                                ? isQuotationBuilder
                                  ? "text-white shadow-sm"
                                  : "bg-white text-slate-900 shadow-sm"
                                : isQuotationBuilder
                                  ? "text-slate-300 hover:text-white"
                                  : "text-slate-600 hover:text-slate-900"
                            }`}
                            style={
                              filterMode === "all" && isQuotationBuilder
                                ? { background: "rgba(255,255,255,0.14)" }
                                : undefined
                            }
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterMode("important")}
                            className={`cursor-pointer rounded-xl px-3 py-1 text-xs font-semibold transition ${
                              filterMode === "important"
                                ? isQuotationBuilder
                                  ? "text-white shadow-sm"
                                  : "bg-white text-slate-900 shadow-sm"
                                : isQuotationBuilder
                                  ? "text-slate-300 hover:text-white"
                                  : "text-slate-600 hover:text-slate-900"
                            }`}
                            style={
                              filterMode === "important" && isQuotationBuilder
                                ? { background: "rgba(255,255,255,0.14)" }
                                : undefined
                            }
                            title="Only warning notifications"
                          >
                            Important
                            {importantCount ? ` (${importantCount})` : ""}
                          </button>
                        </div>
                      ) : null}

                      {bulkActionLabel ? (
                        <button
                          type="button"
                          onClick={handleBulkAction}
                          className={`ml-auto cursor-pointer text-xs font-semibold transition hover:underline ${
                            isQuotationBuilder
                              ? "text-sky-400 hover:text-sky-300"
                              : "text-blue-600 hover:text-blue-700"
                          }`}
                        >
                          {bulkActionLabel}
                        </button>
                      ) : null}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto px-1 pb-4 pt-0 custom-scroll">
                      {loadingNotifications ? (
                        <div
                          className={`flex items-center justify-center py-12 ${
                            isQuotationBuilder ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          <LoaderCircle className="h-6 w-6 animate-spin" />
                        </div>
                      ) : visibleNotifications.length === 0 ? (
                        <div
                          className={`rounded-2xl px-4 py-6 text-center text-xs ${
                            isQuotationBuilder
                              ? "text-slate-300"
                              : "bg-slate-50 text-slate-500"
                          }`}
                          style={
                            isQuotationBuilder
                              ? { background: "rgba(255,255,255,0.06)" }
                              : undefined
                          }
                        >
                          No notifications right now.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {visibleNotifications.map((notification) => {
                            const { Icon, iconClass, dot } = getNotificationMeta(
                              notification?.type,
                            );
                            const timeLabel = formatNotificationTimeAgo(
                              notification?.createdAt,
                            );
                            const timestampLabel = formatNotificationTimestamp(
                              notification?.createdAt,
                            );
                            const sourceLabel =
                              getAdminNotificationSourceLabel(notification);
                            const rateReasonLabel = String(
                              notification?.meta?.changeReasonLabel || "",
                            ).trim();
                            const rateReasonNote = String(
                              notification?.meta?.changeReasonNote || "",
                            ).trim();
                            const rateFields = Array.isArray(
                              notification?.meta?.rateSensitiveFields,
                            )
                              ? notification.meta.rateSensitiveFields.filter(
                                  Boolean,
                                )
                              : [];
                            const isExpanded = Boolean(
                              expandedNotifications[notification._id],
                            );
                            const messageText = notification?.message || "";
                            const isLongText = messageText.length > 90;
                            const hasMetadata = Boolean(
                              rateReasonLabel ||
                                rateReasonNote ||
                                rateFields.length ||
                                notification?.meta?.revisionReason ||
                                (notification?.meta?.source ===
                                  "ops_order_acceptance" &&
                                  notification?.meta?.note),
                            );
                            const isExpandable = isLongText || hasMetadata;

                            return (
                              <button
                                type="button"
                                key={notification._id}
                                onClick={() => openNotification(notification)}
                                className={`w-full cursor-pointer rounded-xl border px-3 py-2.5 text-left transition ${
                                  isQuotationBuilder
                                    ? ""
                                    : notification?.isRead
                                      ? "border-slate-100 bg-slate-50"
                                      : "border-blue-100 bg-white hover:border-blue-200 hover:bg-blue-50"
                                }`}
                                style={
                                  isQuotationBuilder
                                    ? {
                                        borderColor: notification?.isRead
                                          ? "rgba(255,255,255,0.08)"
                                          : "rgba(125,211,252,0.3)",
                                        background: notification?.isRead
                                          ? "rgba(255,255,255,0.04)"
                                          : "rgba(255,255,255,0.1)",
                                      }
                                    : undefined
                                }
                              >
                                <div className="flex items-start gap-2.5">
                                  <div
                                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                                      isQuotationBuilder ? "" : "bg-white"
                                    }`}
                                    style={
                                      isQuotationBuilder
                                        ? {
                                            background: "rgba(255,255,255,0.14)",
                                          }
                                        : undefined
                                    }
                                  >
                                    <Icon className={`h-4 w-4 ${iconClass}`} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start gap-1.5">
                                      <div
                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`}
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p
                                          className={`truncate text-xs font-semibold ${
                                            isQuotationBuilder
                                              ? "text-white"
                                              : "text-slate-900"
                                          }`}
                                        >
                                          {notification?.title || "Notification"}
                                        </p>
                                        <p
                                          className={`mt-1 text-xs leading-5 ${
                                            isExpandable && !isExpanded
                                              ? "line-clamp-2"
                                              : ""
                                          } ${
                                            isQuotationBuilder
                                              ? "text-slate-300"
                                              : "text-slate-600"
                                          }`}
                                          style={{ wordBreak: "break-word" }}
                                        >
                                          {messageText}
                                        </p>
                                        {isExpanded && (
                                          <>
                                            {rateReasonLabel || rateReasonNote ? (
                                              <p
                                                className={`mt-1.5 rounded-lg px-2.5 py-2 text-xs leading-5 font-semibold ${
                                                  isQuotationBuilder
                                                    ? "bg-amber-300/10 text-amber-100"
                                                    : "bg-amber-50 text-amber-800"
                                                }`}
                                              >
                                                Reason:{" "}
                                                {[rateReasonLabel, rateReasonNote]
                                                  .filter(Boolean)
                                                  .join(" - ")}
                                              </p>
                                            ) : null}
                                            {notification?.meta?.revisionReason ? (
                                              <p
                                                className={`mt-1.5 rounded-lg px-2.5 py-2 text-xs leading-5 font-semibold ${
                                                  isQuotationBuilder
                                                    ? "bg-rose-300/10 text-rose-200"
                                                    : "bg-rose-50 text-rose-800"
                                                }`}
                                              >
                                                Revision Remark:{" "}
                                                {notification.meta.revisionReason}
                                              </p>
                                            ) : null}
                                            {rateFields.length ? (
                                              <p
                                                className={`mt-1 text-[11px] font-semibold ${
                                                  isQuotationBuilder
                                                    ? "text-slate-300"
                                                    : "text-slate-500"
                                                }`}
                                              >
                                                Changed fields:{" "}
                                                {rateFields.join(", ")}
                                              </p>
                                            ) : null}
                                            {notification?.meta?.source ===
                                              "ops_order_acceptance" &&
                                            notification?.meta?.note ? (
                                              <p
                                                className={`mt-1 text-xs leading-5 font-medium ${
                                                  isQuotationBuilder
                                                    ? "text-amber-200"
                                                    : "text-amber-700"
                                                }`}
                                              >
                                                Ops Team Note:{" "}
                                                {notification.meta.note}
                                              </p>
                                            ) : null}
                                          </>
                                        )}
                                        {isExpandable && (
                                          <button
                                            type="button"
                                            onClick={(e) =>
                                              toggleExpandNotification(
                                                notification._id,
                                                e,
                                              )
                                            }
                                            className={`mt-1 inline-flex items-center text-[10px] font-bold ${
                                              isQuotationBuilder
                                                ? "text-sky-400 hover:text-sky-300"
                                                : "text-blue-600 hover:text-blue-700"
                                            }`}
                                          >
                                            {isExpanded
                                              ? "Read Less"
                                              : "Read More"}
                                          </button>
                                        )}
                                        {timeLabel || timestampLabel ? (
                                          <p className="mt-2 text-[11px] font-medium text-slate-400">
                                            {role === "admin"
                                              ? `${sourceLabel} • `
                                              : ""}
                                            {timeLabel || "Recently"}
                                            {timestampLabel
                                              ? ` • ${timestampLabel}`
                                              : ""}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                  <span
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      dismissNotification(notification._id);
                                    }}
                                    className={`rounded-full p-1 text-slate-400 ${
                                      isQuotationBuilder
                                        ? "hover:text-white"
                                        : "hover:bg-white hover:text-slate-700"
                                    }`}
                                    style={
                                      isQuotationBuilder
                                        ? {
                                            background: "rgba(255,255,255,0.04)",
                                          }
                                        : undefined
                                    }
                                    title="Dismiss"
                                    role="button"
                                  >
                                    <X className="h-4 w-4" />
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
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
          </div>
        </div>
      </header>

      <ProfileSettingsModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
      />

      {canViewOffers ? (
        <ExclusiveOfferModal
          open={offerOpen}
          onClose={() => setOfferOpen(false)}
        />
      ) : null}

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
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-rose-600" />

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
                <LogOut size={20} className="stroke-[2.5]" />
              </div>

              <h3 className="text-base font-bold text-white mb-1.5">
                Confirm Log Out
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Are you sure you want to log out of Holiday Circuit?
              </p>

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

export default Header;
