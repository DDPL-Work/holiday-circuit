import { Bell, LoaderCircle, X } from "lucide-react";
import {
  notificationBurstDots,
  adminNotificationFilters,
  getNotificationCopy,
  getNotificationMeta,
  getAdminNotificationSourceLabel,
  formatNotificationTimeAgo,
  formatNotificationTimestamp,
} from "../utils/notificationHelpers";

export const NotificationDropdown = ({
  role,
  isQuotationBuilder = false,
  openNotifications = false,
  setOpenNotifications,
  loadingNotifications = false,
  bellPop = false,
  bellPopKey = 0,
  filterMode = "all",
  setFilterMode,
  expandedNotifications = {},
  baseNotifications = [],
  unreadCount = 0,
  importantCount = 0,
  adminFilterCounts = {},
  visibleNotifications = [],
  canUseAdminMirrorFilters = false,
  canUseManagerFilter = false,
  wrapRef,
  toggleExpandNotification,
  dismissNotification,
  openNotification,
  bulkActionLabel = "",
  handleBulkAction,
}) => {
  const notificationCopy = getNotificationCopy(role);

  return (
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
        className={`relative flex h-9 w-9 sm:h-10 sm:w-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition duration-200 hover:bg-white/20 ${
          bellPop
            ? "scale-105 shadow-[0_0_0_4px_rgba(59,130,246,0.16)]"
            : ""
        }`}
        aria-label="Notifications"
        title="Notifications"
      >
        {bellPop && unreadCount > 0 ? (
          <span key={bellPopKey} className="absolute inset-0">
            <span
              className="absolute inset-0 rounded-xl border border-sky-300/70"
              style={{
                animation:
                  "notification-burst-ring 720ms ease-out forwards",
              }}
            />
            <span
              className="absolute inset-0 rounded-xl border border-cyan-200/40"
              style={{
                animation:
                  "notification-burst-ring 980ms ease-out forwards",
              }}
            />
            <span className="absolute inset-0 rounded-xl bg-blue-400/20 animate-ping" />
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
            className={`absolute -right-1 -top-1 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs ${
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
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-[60] bg-slate-950/20 backdrop-blur-sm sm:hidden" 
            onClick={(e) => {
              e.stopPropagation();
              setOpenNotifications(false);
            }} 
          />
          <div
            className="fixed inset-y-0 right-0 z-[60] flex w-[85vw] max-w-sm flex-col overflow-hidden border border-slate-200/90 bg-white shadow-xl transition-transform sm:absolute sm:bottom-auto sm:top-12 sm:h-auto sm:w-[23rem] sm:rounded-xl sm:flex-none"
          >
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:rounded-t-xl">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {notificationCopy.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {notificationCopy.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenNotifications(false)}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shadow-2xs"
                aria-label="Close notifications"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100/80 bg-white">
              {canUseAdminMirrorFilters ? (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    View
                  </span>
                  <select
                    value={filterMode}
                    onChange={(event) => setFilterMode(event.target.value)}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-400"
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
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setFilterMode("all")}
                    className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      filterMode === "all"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode("important")}
                    className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      filterMode === "important"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
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
                  className="ml-auto cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 transition hover:underline"
                >
                  {bulkActionLabel}
                </button>
              ) : null}
            </div>

            {/* Notification items list */}
            <div className="flex-1 overflow-y-auto px-3 py-3 custom-scroll sm:max-h-[380px] sm:flex-none">
              {loadingNotifications ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <LoaderCircle className="h-6 w-6 animate-spin" />
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div className="rounded-lg bg-slate-50 border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                  No notifications right now.
                </div>
              ) : (
                <div className="space-y-2">
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
                      ? notification.meta.rateSensitiveFields.filter(Boolean)
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
                      <div
                        key={notification._id}
                        onClick={() => openNotification(notification)}
                        className={`group w-full cursor-pointer rounded-lg border p-2.5 text-left transition-colors shadow-2xs ${
                          notification?.isRead
                            ? "border-slate-200/70 bg-white hover:bg-slate-50/80 hover:border-slate-300"
                            : "border-blue-100 bg-blue-50/40 hover:bg-blue-50/80 hover:border-blue-200"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                            <Icon className={`h-4 w-4 ${iconClass}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-1.5">
                              <div
                                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-slate-900">
                                  {notification?.title || "Notification"}
                                </p>
                                <p
                                  className={`mt-0.5 text-xs leading-5 text-slate-600 ${
                                    isExpandable && !isExpanded
                                      ? "line-clamp-2"
                                      : ""
                                  }`}
                                  style={{ wordBreak: "break-word" }}
                                >
                                  {messageText}
                                </p>
                                {isExpanded && (
                                  <div className="mt-2 space-y-1.5">
                                    {rateReasonLabel || rateReasonNote ? (
                                      <p className="rounded-md bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 text-xs leading-5 font-medium text-amber-900">
                                        Reason:{" "}
                                        {[rateReasonLabel, rateReasonNote]
                                          .filter(Boolean)
                                          .join(" - ")}
                                      </p>
                                    ) : null}
                                    {notification?.meta?.revisionReason ? (
                                      <p className="rounded-md bg-rose-50 border border-rose-200/80 px-2.5 py-1.5 text-xs leading-5 font-medium text-rose-900">
                                        Revision Remark:{" "}
                                        {notification.meta.revisionReason}
                                      </p>
                                    ) : null}
                                    {rateFields.length ? (
                                      <p className="text-[11px] font-medium text-slate-500">
                                        Changed fields:{" "}
                                        {rateFields.join(", ")}
                                      </p>
                                    ) : null}
                                    {notification?.meta?.source ===
                                      "ops_order_acceptance" &&
                                    notification?.meta?.note ? (
                                      <p className="text-xs leading-5 font-medium text-amber-800">
                                        Ops Team Note:{" "}
                                        {notification.meta.note}
                                      </p>
                                    ) : null}
                                  </div>
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
                                    className="mt-1 inline-flex items-center text-[10.5px] font-semibold text-blue-600 hover:text-blue-700"
                                  >
                                    {isExpanded
                                      ? "Read Less"
                                      : "Read More"}
                                  </button>
                                )}
                                {timeLabel || timestampLabel ? (
                                  <p className="mt-1.5 text-[10.5px] font-medium text-slate-400">
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
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              dismissNotification(notification._id);
                            }}
                            className="rounded-md p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Dismiss"
                            aria-label="Dismiss notification"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default NotificationDropdown;
