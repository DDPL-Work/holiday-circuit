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
                  isQuotationBuilder ? "text-slate-300" : "text-slate-500"
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
                    isQuotationBuilder ? "text-slate-300" : "text-slate-500"
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
  );
};

export default NotificationDropdown;
