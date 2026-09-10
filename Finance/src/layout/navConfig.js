import {
  LayoutGrid,
  FileQuestionMark,
  CircleCheckBig,
  FileText,
  Wallet,
  Users,
  FilePlus2,
  ClipboardList,
  Box,
  TicketPercent,
  PackagePlus,
} from "lucide-react";
import { MdOutlineDashboardCustomize, MdOutlineVerifiedUser } from "react-icons/md";
import { GrUserManager } from "react-icons/gr";
import { RiTeamFill } from "react-icons/ri";
import { FaFileInvoice } from "react-icons/fa6";
import { VscGraph } from "react-icons/vsc";
import { BsMicrosoftTeams } from "react-icons/bs";

const menuConfig = {
  agent: [
    { label: "Dashboard", path: "/agent/dashboard", icon: LayoutGrid },
    { label: "Queries", path: "/agent/queries", icon: FileQuestionMark },
    { label: "Booking Payments", path: "/agent/bookings", icon: FilePlus2 },
    // { label: "Document Portal", path: "/agent/documents", icon: CircleCheckBig },
    // { label: "Finances", path: "/agent/finance", icon: Wallet },
  ],
  admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutGrid },
    { label: "Super Admin", path: "/admin/superAdminDashboard", hash: "#overview", icon: MdOutlineDashboardCustomize },
    { label: "Discount", path: "/admin/discount", icon: TicketPercent },
    { label: "Finance Dashboard", path: "/finance/dashboard", icon: Wallet },
    { label: "Advanced Analytics", path: "/finance/advancedAnalytics", icon: ClipboardList },
    { label: "Users Management", path: "/admin/user-management", hash: "#users-management", icon: Users },
    { label: "Bulk Service Upload", path: "/dmc/contractedRates", icon: Box },
    { label: "Booking Management", path: "/ops/bookings-management", icon: ClipboardList },
    { label: "Order Acceptance", path: "/ops/order-acceptance", icon: CircleCheckBig },
    { label: "Create Package", path: "/ops/create-package", icon: PackagePlus },
    { label: "Voucher Management", path: "/ops/voucher-management", icon: FileText },
    { label: "Booking Confirmation", path: "/dmc/confirmation", icon: CircleCheckBig },
    { label: "Payment Verification", path: "/finance/paymentVerification", icon: CircleCheckBig },
    { label: "Internal Invoice", path: "/finance/internalInvoice", icon: FilePlus2 },
  ],
  operations: [
    { label: "OPS Dashboard", path: "/ops/dashboard", icon: LayoutGrid },
    { label: "Booking Management", path: "/ops/bookings-management", icon: ClipboardList },
    { label: "Order Acceptance", path: "/ops/order-acceptance", icon: CircleCheckBig },
    { label: "Create Package", path: "/ops/create-package", icon: PackagePlus },
    { label: "Voucher Management", path: "/ops/voucher-management", icon: FileText },
  ],
  dmc_partner: [
    { label: "DMC Dashboard", path: "/dmc/dashboard", icon: LayoutGrid },
    { label: "Bulk Service Upload", path: "/dmc/contractedRates", icon: Box },
    { label: "Booking Confirmation", path: "/dmc/confirmation", icon: CircleCheckBig },
    { label: "Bulk Settlement", path: "/dmc/settlement", icon: Wallet },
  ],
  finance_partner: [
    { label: "Finance Dashboard", path: "/finance/dashboard", icon: LayoutGrid },
    // { label: "Advanced Analytics", path: "/finance/advancedAnalytics", icon: VscGraph },
    { label: "Payment Verification", path: "/finance/paymentVerification", icon: MdOutlineVerifiedUser },
    { label: "Internal Invoice", path: "/finance/internalInvoice", icon: FaFileInvoice },
  ],
  operation_manager: [
    { label: "OPS Manager", path: "/operationManager/operationManagerDashboard", icon: GrUserManager },
    { label: "All Team Queries", path: "/operationManager/allTeamQueries", icon: RiTeamFill },
    { label: "My Team", path: "/operationManager/myTeam", icon: BsMicrosoftTeams },
  ],
  finance_manager: [
    { label: "Finance Manager", path: "/financeManager/financeManagerDashboard", icon: GrUserManager },
    { label: "Advanced Analytics", path: "/financeManager/advancedAnalytics", icon: VscGraph },
    { label: "All Transactions", path: "/financeManager/allTeamTransaction", icon: RiTeamFill },
    { label: "Internal DMC Invoice", path: "/financeManager/internalDmcInvoice", icon: FaFileInvoice },
    { label: "My Finance Team", path: "/financeManager/myFinanceTeam", icon: BsMicrosoftTeams },
  ],
};

export const getMenusForRole = (role, user = null) => {
  const baseMenus = menuConfig[role] ? [...menuConfig[role]] : [];

  if (user && role !== "admin") {
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    const hasDiscountPermission =
      permissions.includes("Manage Discounts") ||
      permissions.includes("Discounts & Coupons") ||
      permissions.includes("Discount");

    if (hasDiscountPermission && !baseMenus.some((m) => m.path === "/admin/discount")) {
      baseMenus.push({
        label: "Discount",
        path: "/admin/discount",
        icon: TicketPercent,
      });
    }
  }

  return baseMenus;
};

export const getItemTarget = (item) =>
  item.hash ? { pathname: item.path, hash: item.hash } : item.path;

export const isItemActive = (item, location) => {
  if (location.pathname !== item.path) return false;
  if (!item.hash) return true;
  if (!location.hash) return item.hash === "#overview";
  return location.hash === item.hash;
};

export const getSubBadgeStyle = (color) => {
  switch (color) {
    case "orange":
      return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    case "sky":
      return "bg-sky-500/20 text-sky-400 border border-sky-500/30";
    case "emerald":
      return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    case "rose":
      return "bg-rose-500/20 text-rose-400 border border-rose-500/30";
    case "indigo":
      return "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30";
    default:
      return "bg-slate-800/80 text-slate-400 border border-slate-700/50";
  }
};

export default menuConfig;
