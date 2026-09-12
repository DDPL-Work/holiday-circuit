import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../utils/Api";
import {
  notificationRoles,
  managerFilterRoles,
  getNotificationEndpoint,
  getUnreadNotificationCount,
  NOTIFICATION_POLL_INTERVAL_MS,
  isDocumentVisible,
  filterNotificationsByRole,
  isMirroredNotification,
  getAdminNotificationSourceGroup,
  getDefaultNotificationLink,
  resolveNotificationLink,
  clearAllRoles,
} from "../utils/notificationHelpers";

export const useNotifications = (role, user) => {
  const navigate = useNavigate();

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
  const [localReportNotifications, setLocalReportNotifications] = useState([]);

  const hasFetchedRef = useRef(false);
  const prevUnreadRef = useRef(0);
  const bellPopFrameRef = useRef(null);
  const wrapRef = useRef(null);

  // User heartbeat
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

  const toggleExpandNotification = (id, event) => {
    event.stopPropagation();
    setExpandedNotifications((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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

  return {
    canViewNotifications,
    canUseManagerFilter,
    canViewOffers,
    canUseAdminMirrorFilters,
    openNotifications,
    setOpenNotifications,
    loadingNotifications,
    bellPop,
    bellPopKey,
    filterMode,
    setFilterMode,
    offerOpen,
    setOfferOpen,
    couponUnreadCount,
    expandedNotifications,
    baseNotifications,
    unreadCount,
    importantCount,
    adminFilterCounts,
    visibleNotifications,
    wrapRef,
    toggleExpandNotification,
    dismissNotification,
    openNotification,
    handleOpenOffers,
    bulkActionLabel,
    handleBulkAction,
  };
};
