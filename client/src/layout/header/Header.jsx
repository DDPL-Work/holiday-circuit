import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, AlertCircle, Info, Menu, X, Gift } from "lucide-react";
import logo from "../../assets/logo img.png";
import ExclusiveOfferModal from "../../modal/ExclusiveOfferModal.jsx";
import API from "../../utils/Api";

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

const clearAllRoles = new Set(["finance_partner", "dmc_partner"]);

const isCouponNotification = (notification) =>
  notification?.meta?.kind === "coupon" ||
  Boolean(notification?.meta?.couponId) ||
  notification?.title === "New Coupon Shared";

const getNotificationEndpoint = (role) =>
  role === "agent" || role === "dmc_partner" ? "/agent/notifications" : "/admin/notifications";

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

const notificationRouteAllowlist = {
  admin: [
    "/admin/dashboard",
    "/admin/superAdminDashboard",
    "/admin/bookings-management",
    "/admin/user-management",
  ],
  operation_manager: [
    "/operationManager/operationManagerDashboard",
    "/operationManager/allTeamQueries",
    "/operationManager/myTeam",
    "/ops/bookings-management",
    "/ops/order-acceptance",
    "/ops/dashboard",
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

  const mappedPathname = legacyNotificationPathMap[normalizedPathname] || normalizedPathname;

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
  return allowedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
};

const formatNotificationTimeAgo = (value) => {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const diffInMinutes = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 60000));

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
    role === "dmc_partner" &&
    (notification?.meta?.internalInvoiceId || title.includes("internal invoice"))
  ) {
    return "/dmc/confirmation";
  }

  if (
    role === "agent" &&
    (notification?.meta?.invoiceId || title.includes("payment verified") || title.includes("payment rejected"))
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
    return notifications.filter((notification) => !isCouponNotification(notification));
  }

  return notifications;
};

const getDefaultNotificationLink = (role) => {
  if (role === "admin") return "/admin/superAdminDashboard#agent-approvals";
  if (role === "finance_manager") return "/financeManager/financeManagerDashboard";
  if (role === "operation_manager") return "/operationManager/operationManagerDashboard";
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

const Header = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const role = user?.role || "";
  const isQuotationBuilder = location.pathname === "/ops/quotation-builder";
  const canViewNotifications = notificationRoles.has(role);
  const canUseManagerFilter = managerFilterRoles.has(role);
  const canViewOffers = role === "agent";

  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [bellPop, setBellPop] = useState(false);
  const [filterMode, setFilterMode] = useState("all");
  const [offerOpen, setOfferOpen] = useState(false);
  const [couponUnreadCount, setCouponUnreadCount] = useState(0);

  const hasFetchedRef = useRef(false);
  const prevUnreadRef = useRef(0);
  const wrapRef = useRef(null);

  const baseNotifications = useMemo(
    () => filterNotificationsByRole(role, notifications),
    [notifications, role],
  );

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

  const visibleNotifications = useMemo(() => {
    const source =
      canUseManagerFilter && filterMode === "important"
        ? baseNotifications.filter((notification) => notification.type === "warning")
        : baseNotifications;

    return [...source].sort((a, b) => {
      const createdAtDiff = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (createdAtDiff !== 0) return createdAtDiff;
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      if (a.type !== b.type) {
        if (a.type === "warning") return -1;
        if (b.type === "warning") return 1;
      }
      return 0;
    });
  }, [baseNotifications, canUseManagerFilter, filterMode]);

  const notificationCopy = getNotificationCopy(role);
  const defaultNotificationLink = getDefaultNotificationLink(role);

  const fetchNotifications = async (silent = false) => {
    if (!canViewNotifications) return;

    try {
      if (!silent) setLoadingNotifications(true);

      const { data } = await API.get(getNotificationEndpoint(role));
      const nextNotifications = data?.notifications || [];
      const nextVisibleNotifications = filterNotificationsByRole(role, nextNotifications);
      const nextUnreadCount = getUnreadNotificationCount(nextVisibleNotifications);

      if (hasFetchedRef.current && nextUnreadCount > prevUnreadRef.current) {
        setBellPop(true);
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
    if (!canViewOffers) return;

    try {
      const { data } = await API.get("/agent/coupons");
      setCouponUnreadCount(Number(data?.data?.unreadCount || 0));
    } catch (error) {
      console.error("Failed to fetch coupon notifications", error);
    }
  };

  const dismissNotification = async (id) => {
    try {
      await API.delete(`${getNotificationEndpoint(role)}/${id}`);
      setNotifications((prev) => prev.filter((notification) => notification._id !== id));
    } catch (error) {
      console.error("Failed to dismiss notification", error);
    }
  };

  const markAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
      prevUnreadRef.current = 0;
      setBellPop(false);
      setOpenNotifications(false);

      await API.patch(`${getNotificationEndpoint(role)}/read-all`);

      if (canViewOffers) {
        setCouponUnreadCount(0);
      }
    } catch (error) {
      fetchNotifications(true);
      console.error("Failed to mark notifications read", error);
    }
  };

  const clearVisibleNotifications = async () => {
    try {
      await Promise.all(
        baseNotifications.map((notification) =>
          API.delete(`${getNotificationEndpoint(role)}/${notification._id}`),
        ),
      );

      setNotifications((prev) =>
        prev.filter((notification) => !baseNotifications.some((item) => item._id === notification._id)),
      );
      prevUnreadRef.current = 0;
      setBellPop(false);
      setOpenNotifications(false);
    } catch (error) {
      console.error("Failed to clear notifications", error);
    }
  };

  const openNotification = (notification) => {
    setOpenNotifications(false);
    const link = resolveNotificationLink(role, notification, defaultNotificationLink);
    navigate(link, {
      state: notification?.meta ? { notificationMeta: notification.meta } : undefined,
    });
  };

  const handleOpenOffers = async () => {
    setOfferOpen(true);

    if (!couponUnreadCount) return;

    setCouponUnreadCount(0);

    try {
      await API.patch("/agent/coupons/read");
    } catch (error) {
      console.error("Failed to mark coupon notifications as read", error);
    }
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
      fetchNotifications(true);
    }, 25000);

    return () => window.clearInterval(interval);
  }, [canViewNotifications, role]);

  useEffect(() => {
    if (!canViewOffers) return;
    fetchCouponUnreadCount();
  }, [canViewOffers]);

  useEffect(() => {
    if (!canViewOffers) return undefined;

    const interval = window.setInterval(() => {
      fetchCouponUnreadCount();
    }, 25000);

    return () => window.clearInterval(interval);
  }, [canViewOffers]);

  useEffect(() => {
    if (!bellPop) return undefined;

    const timeout = window.setTimeout(() => setBellPop(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [bellPop]);

  useEffect(() => {
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const getNotificationMeta = (type) => {
    if (type === "warning") {
      return { Icon: AlertCircle, iconClass: "text-rose-600", dot: "bg-rose-500" };
    }

    if (type === "success") {
      return { Icon: CheckCircle2, iconClass: "text-emerald-600", dot: "bg-emerald-500" };
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

  const handleBulkAction = clearAllRoles.has(role) ? clearVisibleNotifications : markAllRead;

  return (
    <>
      <style>{`
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
      <header className="h-16 border-b border-slate-800 bg-gray-900 pl-3 pr-3 sm:pr-5 md:pl-0 lg:pr-8">
        <div className="flex h-full items-center justify-between gap-3">
          <div className="flex h-full items-center gap-3 md:gap-0">
            <button
              type="button"
              onClick={onMenuToggle}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="group flex h-full cursor-pointer items-center gap-3 px-4 transition-all duration-300 sm:w-60 md:pl-5 md:pr-4">
              <div className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-inner ring-1 ring-black/5 transition-transform duration-500">
                <img src={logo} alt="Logo" className="h-7 w-auto object-contain sm:h-8" />
              </div>
              <div className="hidden min-w-0 flex-1 sm:block">
                <p className="truncate bg-linear-to-r from-white to-slate-300 bg-clip-text text-[15px] font-bold tracking-wide text-transparent">
                  Holiday Circuit
                </p>
                <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.2em] text-sky-400">
                  Workspace
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canViewOffers ? (
              <button
                type="button"
                onClick={handleOpenOffers}
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Offers"
                title="Offers"
              >
                <Gift className="h-5 w-5" />
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
                      fetchNotifications(false);
                    }
                  }}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition duration-300 hover:bg-white/10 ${
                    bellPop
                      ? "scale-110 -translate-y-0.5 shadow-[0_0_0_5px_rgba(59,130,246,0.16),0_14px_28px_rgba(15,23,42,0.35)]"
                      : ""
                  }`}
                  aria-label="Notifications"
                  title="Notifications"
                >
                  {bellPop && unreadCount > 0 ? (
                    <>
                      <span
                        className="absolute inset-0 rounded-2xl border border-sky-300/70"
                        style={{ animation: "notification-burst-ring 720ms ease-out forwards" }}
                      />
                      <span
                        className="absolute inset-0 rounded-2xl border border-cyan-200/40"
                        style={{ animation: "notification-burst-ring 980ms ease-out forwards" }}
                      />
                      <span className="absolute inset-0 rounded-2xl bg-blue-400/20 animate-ping" />
                      {notificationBurstDots.map((dot) => (
                        <span
                          key={dot.key}
                          className={`absolute h-1.5 w-1.5 rounded-full ${dot.className}`}
                          style={{
                            backgroundColor: dot.color,
                            boxShadow: `0 0 12px ${dot.color}`,
                            animation: "notification-burst-dot 780ms ease-out forwards",
                            "--tx": dot.tx,
                            "--ty": dot.ty,
                          }}
                        />
                      ))}
                    </>
                  ) : null}
                  <Bell
                    className={`relative h-5 w-5 ${
                      bellPop && unreadCount > 0 ? "text-blue-300" : ""
                    }`}
                    style={
                      bellPop && unreadCount > 0
                        ? { animation: "notification-bell-swing 760ms cubic-bezier(0.22, 1, 0.36, 1)" }
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
                          ? { animation: "notification-badge-pop 520ms cubic-bezier(0.34, 1.56, 0.64, 1), pulse 1s ease-in-out infinite" }
                          : undefined
                      }
                    >
                      {unreadCount}
                    </span>
                  ) : null}
                </button>

                {openNotifications ? (
                  <div
                    className={`absolute right-0 top-12 z-50 w-[min(92vw,26rem)] overflow-hidden rounded-3xl border shadow-2xl ${
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
                            isQuotationBuilder ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {notificationCopy.subtitle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenNotifications(false)}
                        className={`flex h-9 w-9 items-center justify-center rounded-2xl border transition ${
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
                      {canUseManagerFilter ? (
                        <div
                          className="flex items-center gap-1 rounded-2xl p-1"
                          style={
                            isQuotationBuilder
                              ? { background: "rgba(255,255,255,0.08)" }
                              : { background: "#f1f5f9" }
                          }
                        >
                          <button
                            type="button"
                            onClick={() => setFilterMode("all")}
                            className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
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
                            className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
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
                            Important{importantCount ? ` (${importantCount})` : ""}
                          </button>
                        </div>
                      ) : null}

                      {bulkActionLabel ? (
                        <button
                          type="button"
                          onClick={handleBulkAction}
                          className={`ml-auto text-xs font-semibold ${
                            isQuotationBuilder
                              ? "text-sky-300 hover:text-sky-200"
                              : "text-blue-600 hover:text-blue-700"
                          }`}
                        >
                          {bulkActionLabel}
                        </button>
                      ) : null}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto p-4 pt-0 custom-scroll">
                      {loadingNotifications ? (
                        <div
                          className={`rounded-2xl px-4 py-6 text-center text-xs ${
                            isQuotationBuilder
                              ? "text-slate-300"
                              : "bg-slate-50 text-slate-500"
                          }`}
                          style={
                            isQuotationBuilder ? { background: "rgba(255,255,255,0.06)" } : undefined
                          }
                        >
                          Loading notifications...
                        </div>
                      ) : visibleNotifications.length === 0 ? (
                        <div
                          className={`rounded-2xl px-4 py-6 text-center text-xs ${
                            isQuotationBuilder
                              ? "text-slate-300"
                              : "bg-slate-50 text-slate-500"
                          }`}
                          style={
                            isQuotationBuilder ? { background: "rgba(255,255,255,0.06)" } : undefined
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
                            const timeLabel = formatNotificationTimeAgo(notification?.createdAt);
                            const timestampLabel = formatNotificationTimestamp(notification?.createdAt);

                            return (
                              <button
                                type="button"
                                key={notification._id}
                                onClick={() => openNotification(notification)}
                                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
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
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl shadow-sm ${
                                      isQuotationBuilder ? "" : "bg-white"
                                    }`}
                                    style={
                                      isQuotationBuilder
                                        ? { background: "rgba(255,255,255,0.14)" }
                                        : undefined
                                    }
                                  >
                                    <Icon className={`h-4 w-4 ${iconClass}`} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start gap-2">
                                      <div className={`mt-1.5 h-2 w-2 rounded-full ${dot}`} />
                                      <div className="min-w-0 flex-1">
                                        <p
                                          className={`truncate text-xs font-semibold ${
                                            isQuotationBuilder ? "text-white" : "text-slate-900"
                                          }`}
                                        >
                                          {notification?.title || "Notification"}
                                        </p>
                                        <p
                                          className={`mt-1 line-clamp-2 text-xs leading-5 ${
                                            isQuotationBuilder ? "text-slate-300" : "text-slate-600"
                                          }`}
                                        >
                                          {notification?.message || ""}
                                        </p>
                                        {(timeLabel || timestampLabel) ? (
                                          <p className="mt-2 text-[11px] font-medium text-slate-400">
                                            {timeLabel || "Recently"}
                                            {timestampLabel ? ` • ${timestampLabel}` : ""}
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
                                        ? { background: "rgba(255,255,255,0.04)" }
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
          </div>
        </div>
      </header>

      {canViewOffers ? (
        <ExclusiveOfferModal open={offerOpen} onClose={() => setOfferOpen(false)} />
      ) : null}
    </>
  );
};

export default Header;
