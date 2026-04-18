import {
  Shield,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  Bell,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import API from "../../utils/Api";

const notifConfig = {
  success: { color: "text-green-600", bg: "bg-green-50", dot: "bg-green-500" },
  info: { color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" },
  warning: { color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
};

const getTimeAgo = (date) => {
  const now = new Date();
  const created = new Date(date);
  const diffInMinutes = Math.floor((now - created) / 60000);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
  return `${Math.floor(diffInMinutes / 1440)} day ago`;
};

const NotificationPanel = ({
  notifications,
  loadingNotifications,
  onDismiss,
  onClose,
  onClearAll,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -8, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -8, scale: 0.96 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
  >
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-gray-700" />
        <span className="text-sm font-semibold text-gray-900">Notifications</span>
        {notifications.length > 0 && (
          <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {notifications.length}
          </span>
        )}
      </div>
      <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
        <X className="h-4 w-4" />
      </button>
    </div>

    <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
      {loadingNotifications ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <p className="text-xs">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <Bell className="mb-2 h-8 w-8 opacity-30" />
          <p className="text-xs">No notifications yet</p>
        </div>
      ) : (
        notifications.map((notification) => {
          const cfg = notifConfig[notification.type] || notifConfig.info;

          return (
            <div
              key={notification._id}
              className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <div className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${cfg.dot}`} />
              <div className={`flex-shrink-0 rounded-lg p-1.5 ${cfg.bg}`}>
                <Bell className={`h-3.5 w-3.5 ${cfg.color}`} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900">{notification.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                  {notification.message}
                </p>
                <p className="mt-1 text-[10px] text-gray-400">
                  {getTimeAgo(notification.createdAt)}
                </p>
              </div>

              <button
                onClick={() => onDismiss(notification._id)}
                className="mt-0.5 flex-shrink-0 text-gray-300 opacity-0 transition-opacity hover:text-gray-500 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })
      )}
    </div>

    {notifications.length > 0 && (
      <div className="border-t border-gray-100 px-4 py-2.5">
        <button
          onClick={onClearAll}
          className="text-[11px] font-medium text-blue-600 transition-colors hover:text-blue-800"
        >
          Clear all
        </button>
      </div>
    )}
  </motion.div>
);

export default function DMCDashboard() {
  const [notifications, setNotifications] = useState([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const { data } = await API.get("/agent/notifications");
      setNotifications(data?.notifications || []);
    } catch (error) {
      console.error("Failed to fetch DMC notifications", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = useMemo(() => {
    const unread = notifications.filter((notification) => !notification.isRead).length;
    return unread || notifications.length;
  }, [notifications]);

  const dismissNotification = async (id) => {
    try {
      await API.delete(`/agent/notifications/${id}`);
      setNotifications((prev) => prev.filter((notification) => notification._id !== id));
    } catch (error) {
      console.error("Failed to delete DMC notification", error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await Promise.all(
        notifications.map((notification) =>
          API.delete(`/agent/notifications/${notification._id}`),
        ),
      );
      setNotifications([]);
    } catch (error) {
      console.error("Failed to clear DMC notifications", error);
    }
  };

  const toggleNotifications = async () => {
    const nextValue = !openNotifications;
    setOpenNotifications(nextValue);

    if (nextValue) {
      await fetchNotifications();
    }
  };

  return (
    <div className="p-1.5 bg-gray-50 min-h-screen">
      {/* Header */}

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Dmc Dashboard</h1>
          <p className="text-sm text-gray-500">Monday, March 9, 2026</p>
        </div>

        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="relative flex items-center justify-center rounded-full border border-gray-200 bg-white p-2.5 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Bell className="h-4 w-4 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {openNotifications && (
              <NotificationPanel
                notifications={notifications}
                loadingNotifications={loadingNotifications}
                onDismiss={dismissNotification}
                onClose={() => setOpenNotifications(false)}
                onClearAll={clearAllNotifications}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/*=================== Access Level Card ========================================== */}

      <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-100 rounded-xl">
            <Shield size={20} />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">Your Access Level</h2>

              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-xl border">
                DMC Partner
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              External partner with restricted access
            </p>

            <div className="mt-4">
              <p className="text-xs text-gray-600 mb-2">PERMISSIONS</p>
 
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Upload contracted rates (bulk upload)
                </li>

                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Enter confirmation numbers
                </li>

                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Update fulfillment status
                </li>

                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  View assigned bookings only
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/*=================================== Stats Cards ============================================== */}

      <div className="grid grid-cols-4 gap-2 mb-6">

        {/* Card 1 */}
        <div className="bg-white border border-gray-300 shadow-sm rounded-xl p-3 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Pending Queries</p>
            <h3 className="text-xl font-semibold">24</h3>
            <p className="text-xs text-green-600">+12% from last week</p>
          </div>

          <div className="bg-purple-100 p-2 rounded-lg">
            <Clock className="text-purple-600" />
          </div>
        </div>

        {/* Card 2 */}

        <div className="bg-white border border-gray-300 shadow-sm rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Active Bookings</p>
            <h3 className="text-xl font-semibold">156</h3>
            <p className="text-xs text-green-600">+8% from last week</p>
          </div>

          <div className="bg-blue-100 p-2 rounded-lg">
            <CheckCircle className="text-blue-600" />
          </div>
        </div>

        {/* Card 3 */}

        <div className="bg-white border border-gray-300 shadow-sm rounded-xl p-3 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Vouchers Generated</p>
            <h3 className="text-xl font-semibold">89</h3>
            <p className="text-xs text-green-600">+15% from last week</p>
          </div>

          <div className="bg-green-100 p-2 rounded-lg">
            <FileText className="text-green-600" />
          </div>
        </div>

        {/* Card 4 */}

        <div className="bg-white border border-gray-300 shadow-sm rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Pending Actions</p>
            <h3 className="text-xl font-semibold">12</h3>
            <p className="text-xs text-red-500">-5% from last week</p>
          </div>

          <div className="bg-orange-100 p-2 rounded-lg">
            <AlertCircle className="text-orange-600" />
          </div>
        </div>
      </div>


      {/*================================ Bottom Section =========================== */}

      <div className="grid grid-cols-3 gap-6">

        {/*----------------- Recent Activity------------------ */}

        <div className="col-span-2 bg-white border border-gray-300 shadow-sm rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

          <Activity
            title="New Query"
            badge="New"
            color="bg-purple-100 text-purple-600"
            company="Travel World Pvt Ltd → Bali"
            time="5 min ago"
          />

          <Activity
            title="Booking Accepted"
            badge="Accepted"
            color="bg-blue-100 text-blue-600"
            company="Globe Tours → Dubai"
            time="15 min ago"
          />

          <Activity
            title="Voucher Generated"
            badge="Vouchered"
            color="bg-green-100 text-green-600"
            company="Sky Travels → Maldives"
            time="32 min ago"
          />

          <Activity
            title="Confirmation Entered"
            badge="Confirmed"
            color="bg-cyan-100 text-cyan-600"
            company="Wanderlust Holidays → Paris"
            time="1 hr ago"
          />

          <Activity
            title="New Query"
            badge="New"
            color="bg-purple-100 text-purple-600"
            company="Dream Vacations → Switzerland"
            time="2 hrs ago"
          />
        </div>


        {/*=================================== Team Performance ================================== */}

        <div className="bg-white border border-gray-300 shadow-sm rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">Team Performance</h2>

          <Progress
            title="Queries Handled"
            value="89%"
            width="89%"
            color="bg-blue-600"
          />

          <Progress
            title="Avg. Response Time"
            value="2.4h"
            width="70%"
            color="bg-green-600"
          />

          <Progress
            title="Vouchers/Day"
            value="18"
            width="65%"
            color="bg-purple-600"
          />
        </div>
      </div>
    </div>
  );
}

function Activity({ title, badge, color, company, time }) {

  return (
    <div className="flex justify-between items-center border border-gray-300 shadow-sm rounded-xl p-4 mb-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium">{title}</p>
          <span className={`text-xs px-2 py-1 rounded-full ${color}`}>
            {badge}
          </span>
        </div>
        <p className="text-sm text-gray-500">{company}</p>
      </div>
      <p className="text-xs text-gray-400">{time}</p>
    </div>
  );
}

function Progress({ title, value, width, color }) {

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm mb-1">
        <span>{title}</span>
        <span className="text-gray-500">{value}</span>
      </div>

      <div className="w-full bg-gray-200 h-2 rounded-full">
        <div
          className={`${color} h-2 rounded-full`}
          style={{ width: width }}
        ></div>
      </div>
    </div>
  );
}


