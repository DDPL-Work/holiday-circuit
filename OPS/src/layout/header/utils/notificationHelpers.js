import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export const notificationRoles = new Set([
  "admin",
  "operation_manager",
  "finance_manager",
  "operations",
  "finance_partner",
  "dmc_partner",
  "agent",
]);

export const managerFilterRoles = new Set([
  "admin",
  "operation_manager",
  "finance_manager",
  "operations",
]);

export const clearAllRoles = new Set([
  "admin",
  "operation_manager",
  "finance_manager",
  "operations",
  "finance_partner",
  "dmc_partner",
  "agent",
]);

export const isCouponNotification = (notification) =>
  notification?.meta?.kind === "coupon" ||
  Boolean(notification?.meta?.couponId) ||
  notification?.title === "New Coupon Shared";

export const getNotificationEndpoint = (role) =>
  role === "agent" || role === "dmc_partner"
    ? "/agent/notifications"
    : "/admin/notifications";

export const getUnreadNotificationCount = (notifications = []) =>
  notifications.filter((notification) => !notification?.isRead).length;

export const notificationBurstDots = [
  { key: "top", className: "left-1/2 top-1.5", tx: "0px", ty: "-16px", color: "#60a5fa" },
  { key: "top-right", className: "right-1.5 top-2.5", tx: "12px", ty: "-12px", color: "#facc15" },
  { key: "right", className: "right-1 top-1/2", tx: "16px", ty: "0px", color: "#34d399" },
  { key: "bottom-right", className: "right-2 bottom-1.5", tx: "12px", ty: "12px", color: "#fb7185" },
  { key: "bottom", className: "left-1/2 bottom-1", tx: "0px", ty: "16px", color: "#a78bfa" },
  { key: "left", className: "left-1 top-1/2", tx: "-16px", ty: "0px", color: "#38bdf8" },
];

export const NOTIFICATION_POLL_INTERVAL_MS = 10000;

export const isDocumentVisible = () =>
  typeof document === "undefined" || document.visibilityState === "visible";

export const notificationRouteAllowlist = {
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

export const legacyNotificationPathMap = {
  "/dmc/internalInvoice": "/dmc/confirmation",
  "/agent/invoices": "/agent/finance",
  "/agent/invoice": "/agent/finance",
  "/finance/internal-invoice": "/finance/internalInvoice",
  "/finance/internalInvoices": "/finance/internalInvoice",
  "/financeManager/allTeamTransactions": "/financeManager/allTeamTransaction",
};

export const normalizeNotificationLink = (link = "") => {
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

export const extractNotificationPathname = (link = "") => {
  const normalizedLink = normalizeNotificationLink(link);
  return normalizedLink.split("?")[0].split("#")[0];
};

export const isAllowedNotificationRoute = (role, link = "") => {
  const pathname = extractNotificationPathname(link);
  if (!pathname) return false;

  const allowedRoutes = notificationRouteAllowlist[role] || [];
  return allowedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
};

export const formatNotificationTimeAgo = (value) => {
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

export const formatNotificationTimestamp = (value) => {
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

export const getContextualNotificationLink = (role, notification) => {
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

export const resolveNotificationLink = (role, notification, fallbackLink) => {
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

export const filterNotificationsByRole = (role, notifications = []) => {
  if (role === "agent") {
    return notifications.filter(
      (notification) => !isCouponNotification(notification),
    );
  }

  return notifications;
};

export const isMirroredNotification = (notification) =>
  Boolean(notification?.meta?.mirroredForAdmin);

export const getNotificationSourceRole = (notification) =>
  String(notification?.meta?.notificationSourceRole || "")
    .trim()
    .toLowerCase();

export const getAdminNotificationSourceGroup = (notification) => {
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

export const getAdminNotificationSourceLabel = (notification) => {
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

export const isContractedRateNotification = (notification) =>
  String(notification?.title || "")
    .toLowerCase()
    .includes("contracted rate") ||
  Boolean(
    notification?.meta?.changeReasonLabel || notification?.meta?.changeReasonNote,
  );

export const adminNotificationFilters = [
  { key: "all", label: "All" },
  { key: "direct", label: "Admin Alerts" },
  { key: "mirrored", label: "Team Updates" },
  { key: "agent", label: "Agent Updates" },
  { key: "ops", label: "Ops Updates" },
  { key: "finance", label: "Finance Updates" },
];

export const getDefaultNotificationLink = (role) => {
  if (role === "admin") return "/admin/superAdminDashboard#agent-approvals";
  if (role === "finance_manager") return "/financeManager/financeManagerDashboard";
  if (role === "operation_manager")
    return "/operationManager/operationManagerDashboard";
  if (role === "operations") return "/ops/bookings-management";
  if (role === "finance_partner") return "/finance/dashboard";
  if (role === "dmc_partner") return "/dmc/dashboard";
  return "/agent/dashboard";
};

export const getNotificationCopy = (role) => {
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

export const getWorkspaceBranding = (user = null) => {
  const isAgent = user?.role === "agent";

  return {
    logo: isAgent ? String(user?.brandingLogo || "").trim() : "",
    name: isAgent
      ? String(user?.brandingName || "Holiday Circuit").trim()
      : "Holiday Circuit",
  };
};

export const getNotificationMeta = (type) => {
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
