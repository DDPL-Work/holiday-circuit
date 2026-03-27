import { FileQuestionMark, CircleCheckBig, Wallet, ArrowUpRight, Bell, X, CheckCircle2, AlertCircle, Info, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

/* ===== Animations ===== */
const containerVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* ===== Notification Data ===== */
const NOTIFICATIONS = [
  { id: 1, type: "success", title: "Booking Confirmed", message: "Maldives package for Priya Singh is confirmed.", time: "Just now" },
  { id: 2, type: "info", title: "New Query Received", message: "Europe Trip (12 Pax) from Corporate Tech Ltd.", time: "2 min ago" },
  { id: 3, type: "warning", title: "Quote Expiring Soon", message: "Bali package quote expires in 2 hours.", time: "10 min ago" },
  { id: 4, type: "success", title: "Commission Credited", message: "₹3,200 added to your wallet.", time: "1 hr ago" },
  { id: 5, type: "info", title: "Document Uploaded", message: "Passport for Rahul Sharma verified.", time: "3 hr ago" },
];

const notifConfig = {
  success: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-100", dot: "bg-green-500", bar: "bg-green-500" },
  info:    { icon: Info,          color: "text-blue-600",  bg: "bg-blue-50",  border: "border-blue-100",  dot: "bg-blue-500",  bar: "bg-blue-500"  },
  warning: { icon: AlertCircle,   color: "text-yellow-600",bg: "bg-yellow-50",border: "border-yellow-100",dot: "bg-yellow-500",bar: "bg-yellow-400"},
};

/* ===== Notification Panel ===== */
const NotificationPanel = ({ notifications, onDismiss, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -8, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -8, scale: 0.96 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
  >
    {/* Header */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-gray-700" />
        <span className="font-semibold text-sm text-gray-900">Notifications</span>
        {notifications.length > 0 && (
          <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {notifications.length}
          </span>
        )}
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>

    {/* List */}
    <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
      <AnimatePresence initial={false}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Bell className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">No notifications</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const cfg = notifConfig[notif.type];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
              >
                {/* left color dot */}
                <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />

                <div className={`p-1.5 rounded-lg ${cfg.bg} flex-shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900">{notif.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-2.5 h-2.5 text-gray-400" />
                    <span className="text-[10px] text-gray-400">{notif.time}</span>
                  </div>
                </div>

                <button
                  onClick={() => onDismiss(notif.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-gray-500 flex-shrink-0 mt-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>

    {/* Footer */}
    {notifications.length > 0 && (
      <div className="px-4 py-2.5 border-t border-gray-100">
        <button
          onClick={() => notifications.forEach((n) => onDismiss(n.id))}
          className="text-[11px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Clear all
        </button>
      </div>
    )}
  </motion.div>
);

/* ===== Main Component ===== */
const AgentDashboard = () => {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [open, setOpen] = useState(false);

  const dismiss = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <motion.section
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-3 p-3"
    >
      {/* PAGE TITLE + BELL */}
      <motion.header variants={cardVariant} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500">Overview of your travel agency performance.</p>
        </div>

        {/* Bell */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen((v) => !v)}
            className="relative bg-white border border-gray-200 shadow-sm rounded-full p-2.5 flex items-center justify-center"
          >
            <Bell className="w-4 h-4 text-gray-600" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {open && (
              <NotificationPanel
                notifications={notifications}
                onDismiss={dismiss}
                onClose={() => setOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* STATS CARDS */}
      <motion.section variants={containerVariant} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.article variants={cardVariant} whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Total Queries</p>
            <h2 className="text-xl font-semibold">1,284</h2>
            <p className="text-xs text-green-600 mt-1">+12% from last month</p>
          </div>
          <div className="p-2 rounded-full bg-blue-100">
            <FileQuestionMark className="text-blue-600 w-4 h-4" />
          </div>
        </motion.article>

        <motion.article variants={cardVariant} whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Active Bookings</p>
            <h2 className="text-xl font-semibold">42</h2>
            <p className="text-xs text-green-600 mt-1">+4 new today</p>
          </div>
          <div className="p-2 rounded-full bg-green-100">
            <CircleCheckBig className="text-green-600 w-4 h-4" />
          </div>
        </motion.article>

        <motion.article variants={cardVariant} whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Wallet Balance</p>
            <h2 className="text-xl font-semibold">₹ 48,200</h2>
            <p className="text-xs text-gray-500 mt-1">Commission pending: ₹12k</p>
          </div>
          <div className="p-2 rounded-full bg-yellow-100">
            <Wallet className="text-yellow-600 w-4 h-4" />
          </div>
        </motion.article>
      </motion.section>

      {/* LOWER SECTION */}
      <motion.section variants={containerVariant} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.article variants={cardVariant} className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-medium text-xl mb-4">Recent Activity</h3>
          <ul className="space-y-4 text-xs">
            <li className="flex justify-between items-center">
              <div>
                <p className="font-medium">Quote Sent for Bali Package</p>
                <p className="text-xs text-gray-500">Rahul Sharma · 2 hours ago</p>
              </div>
              <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Pending</span>
            </li>
            <li className="flex justify-between items-center">
              <div>
                <p className="font-medium">Booking Confirmed: Maldives</p>
                <p className="text-xs text-gray-500">Priya Singh · 5 hours ago</p>
              </div>
              <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">Confirmed</span>
            </li>
            <li className="flex justify-between items-center">
              <div>
                <p className="font-medium">New Query: Europe Trip (12 Pax)</p>
                <p className="text-xs text-gray-500">Corporate Tech Ltd · 1 day ago</p>
              </div>
              <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">New</span>
            </li>
            <li className="flex justify-between items-center">
              <div>
                <p className="font-medium">Commission Received</p>
                <p className="text-xs text-gray-500">System · 1 day ago</p>
              </div>
              <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">Confirmed</span>
            </li>
          </ul>
        </motion.article>

        <motion.article variants={cardVariant} className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-medium text-xl mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {["Create New Query", "Upload Passport", "Check Wallet History"].map((action, i) => (
              <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full flex justify-between items-center px-4 py-2 border rounded-xl border-gray-300 text-xs hover:bg-gray-100">
                {action}
                <ArrowUpRight className="w-4 h-4 stroke-[1.8] text-gray-500" />
              </motion.button>
            ))}
          </div>
          <div className="mt-6 text-xs text-gray-500">
            <p className="font-medium text-black mb-1">Pro Tip</p>
            <p className="font-normal mb-3 text-[8px]">Complete your KYC verification to unlock higher withdrawal limits and premium support.</p>
          </div>
        </motion.article>
      </motion.section>
    </motion.section>
  );
};

export default AgentDashboard;