import React from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  BookOpen,
  Users,
  Clock,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  BadgeCheck,
} from "lucide-react";

export const roleAppearance = {
  "Super Admin": { color: "#7c3aed", bg: "#f5f3ff" },
  "Ops Team": { color: "#1d4ed8", bg: "#eff6ff" },
  "Finance Team": { color: "#6d28d9", bg: "#f5f3ff" },
  "Operation Manager": { color: "#0284c7", bg: "#e0f2fe" },
  "Finance Manager": { color: "#b45309", bg: "#fffbeb" },
  "DMC Partner": { color: "#b45309", bg: "#fffbeb" },
};

export const statCardMeta = {
  revenue: { icon: DollarSign, iconBg: "#dcfce7", iconColor: "#16a34a" },
  bookings: { icon: BookOpen, iconBg: "#dbeafe", iconColor: "#2563eb" },
  users: { icon: Users, iconBg: "#f3e8ff", iconColor: "#7c3aed" },
  time: { icon: Clock, iconBg: "#fef3c7", iconColor: "#d97706" },
};

export const statCardToneMap = {
  revenue: { badgeBg: "#ecfdf3", badgeBorder: "#bbf7d0", badgeText: "#15803d" },
  bookings: { badgeBg: "#eff6ff", badgeBorder: "#bfdbfe", badgeText: "#2563eb" },
  users: { badgeBg: "#faf5ff", badgeBorder: "#e9d5ff", badgeText: "#9333ea" },
  time: { badgeBg: "#fffbeb", badgeBorder: "#fde68a", badgeText: "#b45309" },
};

export const statCardStyles = {
  revenue: {
    gradient: "linear-gradient(135deg, rgba(220, 252, 231, 0.4) 0%, rgba(255, 255, 255, 0.95) 100%)",
    borderColor: "#e2e8f0",
    borderBottom: "4px solid #16a34a",
    shadow: "0 4px 12px rgba(22, 163, 74, 0.04)",
  },
  bookings: {
    gradient: "linear-gradient(135deg, rgba(219, 234, 254, 0.4) 0%, rgba(255, 255, 255, 0.95) 100%)",
    borderColor: "#e2e8f0",
    borderBottom: "4px solid #2563eb",
    shadow: "0 4px 12px rgba(37, 99, 235, 0.04)",
  },
  users: {
    gradient: "linear-gradient(135deg, rgba(243, 232, 255, 0.4) 0%, rgba(255, 255, 255, 0.95) 100%)",
    borderColor: "#e2e8f0",
    borderBottom: "4px solid #7c3aed",
    shadow: "0 4px 12px rgba(124, 58, 237, 0.04)",
  },
  time: {
    gradient: "linear-gradient(135deg, rgba(254, 243, 199, 0.4) 0%, rgba(255, 255, 255, 0.95) 100%)",
    borderColor: "#e2e8f0",
    borderBottom: "4px solid #d97706",
    shadow: "0 4px 12px rgba(217, 119, 6, 0.04)",
  },
};

export const permColor = {
  Edit: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  View: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  Export: { bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" },
  Override: { bg: "#eef2ff", color: "#4338ca", border: "#c7d2fe" },
  Delete: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  "Manage Users": { bg: "#ecfeff", color: "#0f766e", border: "#a5f3fc" },
  "Manage Booking": { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "Approve Payments": { bg: "#ecfccb", color: "#3f6212", border: "#bef264" },
  "Reject Payment": { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
  "Submit Invoice": { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  "System Config": { bg: "#f8fafc", color: "#475569", border: "#cbd5e1" },
};

export const getPermissionAppearance = (permission) =>
  permColor[permission] || { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };

export const getStatusAppearance = (status) => {
  if (status === "Deleted") {
    return {
      background: "#fff1f2",
      borderColor: "#fecaca",
      textColor: "#be123c",
      Icon: Trash2,
      iconColor: "#be123c",
    };
  }

  if (status === "Active") {
    return {
      background: "#f0fdf4",
      borderColor: "#bbf7d0",
      textColor: "#16a34a",
      Icon: Eye,
      iconColor: "#16a34a",
    };
  }

  return {
    background: "#fef2f2",
    borderColor: "#fecaca",
    textColor: "#dc2626",
    Icon: EyeOff,
    iconColor: "#dc2626",
  };
};

export const getAgentReviewStatusMeta = (status) => {
  if (status === "approve") {
    return {
      label: "Approved",
      background: "#ecfdf3",
      borderColor: "#bbf7d0",
      textColor: "#15803d",
      Icon: CheckCircle2,
    };
  }

  if (status === "rejected") {
    return {
      label: "Rejected",
      background: "#fff1f2",
      borderColor: "#fecdd3",
      textColor: "#be123c",
      Icon: XCircle,
    };
  }

  return {
    label: "Pending Review",
    background: "#fffbeb",
    borderColor: "#fcd34d",
    textColor: "#d97706",
    Icon: Clock,
  };
};

export const getOverrideStatusMeta = (status = "Open") => {
  if (status === "Overridden" || status === "Resolved") {
    return { bg: "#ecfdf3", border: "#bbf7d0", color: "#15803d" };
  }
  if (status === "Rejected") {
    return { bg: "#fff1f2", border: "#fecdd3", color: "#be123c" };
  }
  return { bg: "#fff7ed", border: "#fed7aa", color: "#c2410c" };
};

export const filterAgentApprovalRows = (rows = [], filter = "pending") => {
  if (filter === "all") return rows;
  return rows.filter((row) => row.status === filter);
};

export const formatDateTime = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatOverviewDate = (value = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const getInitials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "HC";

export const formatCurrency = (value = 0) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

export const getBookingPaymentMeta = (status = "") => {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (normalizedStatus === "verified" || normalizedStatus === "paid") {
    return {
      label: "Verified",
      Icon: BadgeCheck,
      background: "#f0f0f4",
      borderColor: "#bbf7d0",
      textColor: "#15803d",
      iconColor: "#16a34a",
    };
  }
  return {
    label: "Pending",
    Icon: Clock,
    background: "#fffbeb",
    borderColor: "#fde68a",
    textColor: "#b45309",
    iconColor: "#d97706",
  };
};

export const getNiceChartStep = (maxValue, segments = 4) => {
  if (!maxValue || maxValue <= 0) return 1;
  const roughStep = maxValue / segments;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  let niceFactor = 1;
  if (normalized <= 1) niceFactor = 1;
  else if (normalized <= 1.5) niceFactor = 1.5;
  else if (normalized <= 2) niceFactor = 2;
  else if (normalized <= 2.5) niceFactor = 2.5;
  else if (normalized <= 5) niceFactor = 5;
  else niceFactor = 10;
  return niceFactor * magnitude;
};

export const buildAxisTicks = (values = [], minimumMax = 0, segments = 4) => {
  const rawMax = Math.max(minimumMax, ...values.map((value) => Number(value) || 0));
  if (rawMax <= 0) {
    return { max: Math.max(minimumMax, 1), ticks: [0, Math.max(minimumMax, 1)] };
  }
  const step = getNiceChartStep(rawMax, segments);
  const max = Math.max(minimumMax, Math.ceil(rawMax / step) * step);
  const ticks = [];
  for (let tick = 0; tick <= max; tick += step) {
    ticks.push(Number(tick.toFixed(2)));
  }
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return { max, ticks };
};

export const formatPlainNumber = (value = 0) => {
  const num = Number(value || 0);
  if (num >= 100000) {
    return `${(num / 100000).toFixed(1).replace(".0", "")} L`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(".0", "")} k`;
  }
  return num.toString();
};

export const getRoundedBarPath = (x, y, width, height, radius = 8) => {
  const safeHeight = Math.max(height, 0);
  const r = Math.min(radius, safeHeight, width / 2);
  const bottom = y + safeHeight;
  return [
    `M${x},${bottom}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${bottom}`,
    "Z",
  ].join(" ");
};

export const AnimatedBar = (props) => {
  const { x, y, width, height, fill, index = 0 } = props;
  if (!height || height <= 0) return null;
  const collapsedY = y + height;
  const collapsedPath = getRoundedBarPath(x, collapsedY, width, 0, 8);
  const expandedPath = getRoundedBarPath(x, y, width, height, 8);
  return (
    <motion.path
      d={expandedPath}
      fill={fill}
      initial={{ d: collapsedPath, opacity: 0.45 }}
      animate={{ d: expandedPath, opacity: 1 }}
      transition={{ duration: 0.75, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
    />
  );
};

export const CustomTooltipGreen = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(4px)",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "10px 14px",
          fontSize: 12,
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.03)"
        }}
      >
        <p style={{ margin: 0, fontWeight: 605, color: "#475569" }}>{label}</p>
        <p style={{ margin: "4px 0 0", color: "#10b981", fontWeight: 700, fontSize: 13 }}>
          ₹{payload[0].value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
};

export const CustomTooltipBlue = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(4px)",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "10px 14px",
          fontSize: 12,
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.03)"
        }}
      >
        <p style={{ margin: 0, fontWeight: 605, color: "#475569" }}>{label}</p>
        <p style={{ margin: "4px 0 0", color: "#3b82f6", fontWeight: 700, fontSize: 13 }}>
          {payload[0].value} hours
        </p>
      </div>
    );
  }
  return null;
};
