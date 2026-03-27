import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  FileQuestionMark,
  CircleCheckBig,
  FileText,
  Wallet,
  ArrowDownToLine,
  Users,
  FilePlus2,
  ClipboardList,
  Settings,
  LogOut,
  ChevronLeft,
  Box,
} from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { motion, AnimatePresence } from "framer-motion";

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
    { label: "Agent Management", path: "/admin/agents", icon: Users },
    { label: "Queries", path: "/admin/queries", icon: ClipboardList },
    { label: "Quotations", path: "/admin/quotations", icon: FilePlus2 },
    { label: "Rate Contracts", path: "/admin/contracts", icon: Settings },
    { label: "Invoices & Payments", path: "/admin/invoices", icon: Wallet },
  ],
  operations: [
    { label: "OPS Dashboard", path: "/ops/dashboard", icon: LayoutGrid },
    {
      label: "Booking Management Hub",
      path: "/ops/bookings-management",
      icon: ClipboardList,
    },
    {
      label: "Order Acceptance",
      path: "/ops/order-acceptance",
      icon: CircleCheckBig,
    },
    {
      label: "Voucher Management",
      path: "/ops/voucher-management",
      icon: FileText,
    },
  ],
  dmc_partner: [
    {label: "DMC Dashboard", path: "/dmc/dashboard", icon: LayoutGrid },
    {label: "Contracted Rates Dashboard",path: "/dmc/contractedRates",icon: Box,},
    {label: "Confirmation Number Entry",path: "/dmc/confirmation",icon: CircleCheckBig,},
  ],
  finance_partner: [
    {label: "DMC Dashboard", path: "/finance/dashboard", icon: LayoutGrid },
    {label: "Payment Verification",path: "/finance/paymentVerification",icon: Box,},
    {label: "Internal Invoice",path: "/finance/internalInvoice",icon: CircleCheckBig,},
  ]
};

const Sidebar = ({ user }) => {
  const [collapsed, setCollapsed] = useState(false);
  const menus = menuConfig[user.role] || [];
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all duration-300
     ${isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"}`;

  // Framer Motion variants
  const sidebarVariants = {
    expanded: {
      width: 236,
      transition: { type: "spring", stiffness: 200, damping: 23 },
    },
    collapsed: {
      width: 80,
      transition: { type: "spring", stiffness: 200, damping: 23 },
    },
  };

  const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

  const menuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  };

  return (
    <motion.aside
      className="h-full bg-gray-900 flex flex-col justify-between  border-t border-gray-800"
      variants={sidebarVariants}
      animate={collapsed ? "collapsed" : "expanded"}
    >
      {/* COLLAPSE BUTTON */}
      <div className="flex justify-end ">
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white"
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-300 cursor-pointer ${collapsed ? "rotate-180" : ""}`}
          />
        </motion.button>
      </div>

      {/* MENU */}
      <motion.nav
<<<<<<< HEAD
  className="p-3 space-y-1.5 mb-30"
=======
  className="p-4 flex-1 space-y-2 mb-45"
>>>>>>> 02945470360c15fc6709a6f8dddab5df6f31154e
  variants={containerVariants}
  initial="hidden"
  animate={collapsed ? "hidden" : "visible"}
>
        <AnimatePresence>
          {menus.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.path}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={menuItemVariants}
              >
                <NavLink to={item.path} className={linkClass}>
                  <Icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.nav>

      {/* PROFILE SECTION */}
      <motion.div
        className="p-4 border border-gray-800 "
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm">
            {user.name?.charAt(0).toUpperCase()}
          </div>

          {!collapsed && (
            <div>
              <p className="text-sm text-white font-medium">{user.name}</p>
              <p className="text-xs text-gray-400">
                {user.role === "agent"
                  ? user.companyName
                  : user.role === "admin"
                    ? "System Administrator"
                    : user.role === "dmc_partner"
                      ? "DMC Team"
                      : "Operations Team"}
              </p>
            </div>
          )}
        </div>

        <motion.button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 w-full"
          whileTap={{ scale: 0.97 }}
        >
          <LogOut size={16} />
          {!collapsed && <span>Log Out</span>}
        </motion.button>
      </motion.div>
    </motion.aside>
  );
};

export default Sidebar;
