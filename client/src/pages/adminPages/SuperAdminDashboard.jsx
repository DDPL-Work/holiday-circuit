import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  DollarSign,
  Wallet,
  BookOpen,
  Building2,
  CheckCircle2,
  Users,
  Clock,
  TrendingUp,
  UserPlus,
  Download,
  BarChart3,
  Edit2,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  Shield,
  X,
  XCircle,
} from "lucide-react";
import AddNewUserModal from "../../modal/AddNewUserModal";
import API from "../../utils/Api";
import superAdminBadge from "../../assets/super-admin-badge.jpg";


const roleAppearance = {
  "Super Admin": { color: "#7c3aed", bg: "#f5f3ff" },
  "Ops Team": { color: "#1d4ed8", bg: "#eff6ff" },
  "Finance Team": { color: "#6d28d9", bg: "#f5f3ff" },
  "Operation Manager": { color: "#0284c7", bg: "#e0f2fe" },
  "Finance Manager": { color: "#b45309", bg: "#fffbeb" },
  "DMC Partner": { color: "#b45309", bg: "#fffbeb" },
};

const statCardMeta = {
  revenue: { icon: DollarSign, iconBg: "#dcfce7", iconColor: "#16a34a" },
  bookings: { icon: BookOpen, iconBg: "#dbeafe", iconColor: "#2563eb" },
  users: { icon: Users, iconBg: "#f3e8ff", iconColor: "#7c3aed" },
  time: { icon: Clock, iconBg: "#fef3c7", iconColor: "#d97706" },
};

const statCardToneMap = {
  revenue: { badgeBg: "#ecfdf3", badgeBorder: "#bbf7d0", badgeText: "#15803d" },
  bookings: { badgeBg: "#eff6ff", badgeBorder: "#bfdbfe", badgeText: "#2563eb" },
  users: { badgeBg: "#faf5ff", badgeBorder: "#e9d5ff", badgeText: "#9333ea" },
  time: { badgeBg: "#fffbeb", badgeBorder: "#fde68a", badgeText: "#b45309" },
};

const _bookings = [
  {
    id: "BK-2024-001",
    agent: "Travel Experts India",
    amount: "₹1,25,000",
    paymentStatus: "Pending",
    dmc: "Bali Paradise DMC",
  },
  {
    id: "BK-2024-002",
    agent: "Wanderlust Tours",
    amount: "₹85,000",
    paymentStatus: "Verified",
    dmc: "Dubai Luxury Partners",
  },
  {
    id: "BK-2024-003",
    agent: "Global Adventures",
    amount: "₹2,00,000",
    paymentStatus: "Pending",
    dmc: "Maldives Dream DMC",
  },
];

const _statCards = [
  {
    label: "Total Revenue",
    value: "₹24.8L",
    sub: "+4.6% vs last month",
    icon: DollarSign,
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
  },
  {
    label: "Active Bookings",
    value: "47",
    sub: "+8% vs last month",
    icon: BookOpen,
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
  },
  {
    label: "Active Users",
    value: "23",
    sub: "+1 vs last month",
    icon: Users,
    iconBg: "#f3e8ff",
    iconColor: "#7c3aed",
  },
  {
    label: "Avg Processing Time",
    value: "4.2h",
    sub: "+0.6% vs last month",
    icon: Clock,
    iconBg: "#fef3c7",
    iconColor: "#d97706",
  },
];

const permColor = {
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

const getPermissionAppearance = (permission) =>
  permColor[permission] || { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };

const getStatusAppearance = (status) => {
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

const getAgentReviewStatusMeta = (status) => {
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
    background: "#eff6ff",
    borderColor: "#bfdbfe",
    textColor: "#1d4ed8",
    Icon: Clock,
  };
};

const filterAgentApprovalRows = (rows = [], filter = "pending") => {
  if (filter === "all") return rows;
  return rows.filter((row) => row.status === filter);
};

const formatDateTime = (value) => {
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

const formatOverviewDate = (value = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getInitials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "HC";

const formatCurrency = (value = 0) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getBookingPaymentMeta = (status = "") => {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (normalizedStatus === "verified" || normalizedStatus === "paid") {
    return {
      label: "Verified",
      Icon: BadgeCheck,
      background: "#f0fdf4",
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

const getNiceChartStep = (maxValue, segments = 4) => {
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

const buildAxisTicks = (values = [], minimumMax = 0, segments = 4) => {
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

const formatPlainNumber = (value = 0) => Number(value || 0).toLocaleString("en-IN");

const formatCompactNumber = (value = 0) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));

const formatCompactCurrency = (value = 0) => `₹${formatCompactNumber(value)}`;

const getRoundedBarPath = (x, y, width, height, radius = 6) => {
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

const AnimatedBar = (props) => {
  const { x, y, width, height, fill, index = 0 } = props;
  if (!height || height <= 0) return null;
  const collapsedY = y + height;
  const collapsedPath = getRoundedBarPath(x, collapsedY, width, 0, 6);
  const expandedPath = getRoundedBarPath(x, y, width, height, 6);
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

const CustomTooltipGreen = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        <p style={{ margin: 0, fontWeight: 600, color: "#0f172a" }}>{label}</p>
        <p style={{ margin: "4px 0 0", color: "#16a34a", fontWeight: 500 }}>
          Revenue : ₹{payload[0].value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
};

const CustomTooltipBlue = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        <p style={{ margin: 0, fontWeight: 600, color: "#0f172a" }}>{label}</p>
        <p style={{ margin: "4px 0 0", color: "#2563eb", fontWeight: 500 }}>
          Avg Time : {payload[0].value}h
        </p>
      </div>
    );
  }
  return null;
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [agentApprovalRows, setAgentApprovalRows] = useState([]);
  const [agentApprovalSummary, setAgentApprovalSummary] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [isAgentApprovalsLoading, setIsAgentApprovalsLoading] = useState(true);
  const [agentApprovalFilter, setAgentApprovalFilter] = useState("pending");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [agentReviewActionId, setAgentReviewActionId] = useState("");
  const [agentRejectDialogUser, setAgentRejectDialogUser] = useState(null);
  const [agentRejectReason, setAgentRejectReason] = useState("");
  const [isAgentDeskOpen, setIsAgentDeskOpen] = useState(false);
  const [userList, setUserList] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userActionId, setUserActionId] = useState("");
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState({ id: "", status: "" });
  const [deleteDialogUser, setDeleteDialogUser] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [escalationReply, setEscalationReply] = useState("");
  const [escalationActionId, setEscalationActionId] = useState("");
  const location = useLocation();
  const currentUser = useSelector((state) => state.auth.user);

  const mapApiUserToRow = (user) => {
    const roleName = user.roleLabel || user.role || "Super Admin";
    const appearance = roleAppearance[roleName] || { color: "#475569", bg: "#f8fafc" };
    return {
      id: user.id,
      initials: getInitials(user.name),
      profileImage:
        user.profileImage || user.avatar || user.avatarUrl || user.photo ||
        user.image || user.profilePic || user.profile_picture || user.profile?.image || "",
      name: user.name,
      email: user.email,
      role: roleName,
      roleColor: appearance.color,
      roleBg: appearance.bg,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      status: user.isDeleted ? "Deleted" : (user.accountStatus || "Active"),
      isDeleted: Boolean(user.isDeleted),
      deletionReason: user.deletionReason || "",
      deletedAt: user.deletedAt || null,
      phone: user.phone || "",
      employeeId: user.employeeId || "",
      department: user.department || "",
      designation: user.designation || "",
      manager: user.manager || "",
      accessExpiry: user.accessExpiry || "",
    };
  };

  const fetchManagedUsers = async () => {
    try {
      setIsUsersLoading(true);
      const { data } = await API.get("/admin/managed-users");
      setUserList((data?.users || []).map(mapApiUserToRow));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load users");
      setUserList([]);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const fetchAgentApprovals = async (silent = false) => {
    try {
      if (!silent) setIsAgentApprovalsLoading(true);
      const { data } = await API.get("/admin/agent-approvals");
      const nextRows = Array.isArray(data?.agents) ? data.agents : [];
      setAgentApprovalRows(nextRows);
      setAgentApprovalSummary({
        pending: Number(data?.summary?.pending || 0),
        approved: Number(data?.summary?.approved || 0),
        rejected: Number(data?.summary?.rejected || 0),
      });
      setSelectedAgentId((currentId) => {
        if (nextRows.some((row) => row.id === currentId)) return currentId;
        return nextRows.find((row) => row.status === "pending")?.id || nextRows[0]?.id || "";
      });
    } catch (error) {
      if (!silent) toast.error(error?.response?.data?.message || "Failed to load agent approvals");
      setAgentApprovalRows([]);
      setAgentApprovalSummary({ pending: 0, approved: 0, rejected: 0 });
      setSelectedAgentId("");
    } finally {
      if (!silent) setIsAgentApprovalsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setIsDashboardLoading(true);
      const { data } = await API.get("/admin/dashboard");
      setDashboardData(data?.data || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load dashboard");
      setDashboardData(null);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  useEffect(() => {
    fetchManagedUsers();
    fetchAgentApprovals();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    setUserList((prev) =>
      prev.map((entry) => {
        if (entry.id !== currentUser.id) return entry;
        const syncedRow = mapApiUserToRow({
          ...entry,
          ...currentUser,
          roleLabel: entry.role,
          profileImage:
            currentUser.profileImage || currentUser.avatar || currentUser.avatarUrl ||
            currentUser.photo || currentUser.image || currentUser.profilePic ||
            currentUser.profile_picture || currentUser.profile?.image || entry.profileImage || "",
        });
        return { ...entry, ...syncedRow };
      }),
    );
  }, [currentUser]);

  useEffect(() => {
    const notifiedAgentId = location.state?.notificationMeta?.agentId || "";
    const notifiedQueryId = location.state?.notificationMeta?.queryId || "";
    if (location.hash === "#agent-approvals" || notifiedAgentId) setIsAgentDeskOpen(true);
    if (notifiedAgentId) {
      setAgentApprovalFilter("pending");
      setSelectedAgentId(notifiedAgentId);
    }
    const sectionId = location.hash
      ? location.hash.replace("#", "")
      : notifiedQueryId
        ? "queries"
        : "";
    if (!sectionId) return;
    const target = document.getElementById(sectionId);
    if (!target) return;
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash, location.state]);

  useEffect(() => {
    const intervalId = window.setInterval(() => { fetchAgentApprovals(true); }, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!deleteDialogUser && !agentRejectDialogUser && !selectedEscalation) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [deleteDialogUser, agentRejectDialogUser, selectedEscalation]);

  useEffect(() => {
    const filteredRows = filterAgentApprovalRows(agentApprovalRows, agentApprovalFilter);
    if (!filteredRows.length) {
      setSelectedAgentId(agentApprovalRows[0]?.id || "");
      return;
    }
    if (!filteredRows.some((row) => row.id === selectedAgentId)) {
      setSelectedAgentId(filteredRows[0]?.id || "");
    }
  }, [agentApprovalRows, agentApprovalFilter, selectedAgentId]);

  const handleCreateUser = async (newUser) => {
    const { data } = await API.post("/admin/managed-users", newUser);
    const createdUser = mapApiUserToRow(data.user);
    setUserList((prev) => [createdUser, ...prev.filter((user) => user.id !== createdUser.id)]);
    fetchDashboardData();
    toast.success(data?.message || "User created successfully");
    return data;
  };

  const handleUpdateUser = async (updatedUser) => {
    const { id, ...payload } = updatedUser || {};
    const { data } = await API.patch(`/admin/managed-users/${id}`, payload);
    const nextUser = mapApiUserToRow(data.user);
    setUserList((prev) => prev.map((user) => (user.id === nextUser.id ? nextUser : user)));
    fetchDashboardData();
    toast.success(data?.message || "User updated successfully");
    return data;
  };

  const handleToggleUserStatus = async (user) => {
    if (user?.isDeleted) { toast.error("Deleted users cannot be updated."); return; }
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";
    try {
      setUserActionId(user.id);
      setPendingStatusUpdate({ id: user.id, status: nextStatus });
      const { data } = await API.patch(`/admin/managed-users/${user.id}/status`, { accountStatus: nextStatus });
      setUserList((prev) =>
        prev.map((entry) => (entry.id === user.id ? mapApiUserToRow(data.user) : entry)),
      );
      fetchDashboardData();
      toast.success(data?.message || `User marked as ${nextStatus.toLowerCase()}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update user status");
    } finally {
      setPendingStatusUpdate({ id: "", status: "" });
      setUserActionId("");
    }
  };

  const closeDeleteDialog = () => { setDeleteDialogUser(null); setDeleteReason(""); };
  const closeAgentRejectDialog = () => { setAgentRejectDialogUser(null); setAgentRejectReason(""); };

  const openAgentDesk = () => {
    setIsAgentDeskOpen((current) => {
      const next = !current;
      if (next) {
        window.requestAnimationFrame(() => {
          document.getElementById("agent-approvals")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return next;
    });
  };

  const handleAgentReview = async (agent, status, reason = "") => {
    if (!agent?.id) return;
    const nextReason = String(reason || "").trim();
    if (status === "rejected" && !nextReason) {
      toast.error("Please add a rejection reason before sending it back.");
      return;
    }
    try {
      setAgentReviewActionId(agent.id);
      const { data } = await API.patch(`/admin/agent-approvals/${agent.id}/review`, {
        status,
        rejectionReason: nextReason,
        reason: nextReason,
      });
      toast.success(data?.message || (status === "approve" ? "Agent approved successfully" : "Agent rejected successfully"));
      closeAgentRejectDialog();
      await fetchAgentApprovals();
      fetchDashboardData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to review this registration right now.");
    } finally {
      setAgentReviewActionId("");
    }
  };

  const handleDeleteUser = async (id, reasonInput) => {
    try {
      setUserActionId(id);
      const reason = String(reasonInput ?? deleteReason ?? "").trim();
      if (!reason) { toast.error("Please add the deletion reason."); return; }
      const { data } = await API.delete(`/admin/managed-users/${id}`, { data: { reason } });
      if (data?.user) {
        setUserList((prev) =>
          prev.map((user) => (user.id === id ? mapApiUserToRow(data.user) : user)),
        );
      }
      fetchDashboardData();
      toast.success(data?.message || "User deleted successfully");
      closeDeleteDialog();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
    } finally {
      setUserActionId("");
    }
  };

  const closeEscalationDialog = () => {
    setSelectedEscalation(null);
    setEscalationReply("");
  };

  const openQuotationBuilder = (query) => {
    if (!query?.builderState?._id) {
      toast.error("Query details are incomplete for quotation editing.");
      return;
    }

    navigate("/ops/quotation-builder", { state: query.builderState });
  };

  const handleSubmitEscalationReply = async () => {
    const trimmedReply = escalationReply.trim();

    if (!trimmedReply) {
      toast.error("Please write a reply for operations.");
      return;
    }

    if (!selectedEscalation?.id) {
      toast.error("Escalation details are missing.");
      return;
    }

    try {
      setEscalationActionId(selectedEscalation.id);
      const { data } = await API.patch(`/admin/queries/${selectedEscalation.id}/reply-to-ops`, {
        reply: trimmedReply,
      });
      toast.success(data?.message || "Reply sent to ops successfully");
      closeEscalationDialog();
      await fetchDashboardData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to send reply right now.");
    } finally {
      setEscalationActionId("");
    }
  };

  const isBusyAction = (id) => userActionId === id;
  const managerOptions = userList
    .filter((u) => u?.role === "Operation Manager" || u?.role === "Finance Manager")
    .map((u) => ({ name: u?.name || "", role: u?.role || "", department: u?.department || "" }))
    .filter((u) => u.name);
  const filteredAgentApprovals = filterAgentApprovalRows(agentApprovalRows, agentApprovalFilter);
  const selectedAgent =
    filteredAgentApprovals.find((agent) => agent.id === selectedAgentId) ||
    filteredAgentApprovals[0] ||
    null;
  const selectedAgentStatusMeta = getAgentReviewStatusMeta(selectedAgent?.status);
  const superAdminData = dashboardData?.superAdmin || {};
  const statCards = superAdminData.statCards || [];
  const agentPerformanceData = superAdminData.agentPerformance || [];
  const teamEfficiencyData = superAdminData.teamEfficiency || [];
  const bookingRows = superAdminData.masterBookings || [];
  const pendingBookingCount = bookingRows.filter((entry) => String(entry?.paymentStatus || "").trim().toLowerCase() === "pending").length;
  const verifiedBookingCount = bookingRows.filter((entry) => {
    const status = String(entry?.paymentStatus || "").trim().toLowerCase();
    return status === "verified" || status === "paid";
  }).length;
  const activeUserCount = userList.filter((entry) => entry.status === "Active").length;
  const inactiveUserCount = userList.filter((entry) => entry.status === "Inactive").length;
  const deletedUserCount = userList.filter((entry) => entry.status === "Deleted").length;
  const pendingAgentApprovals = Number(agentApprovalSummary.pending || 0);
  const adminEscalationRows = Array.isArray(dashboardData?.queries)
    ? dashboardData.queries.filter((entry) => entry.adminCoordinationStatus === "pending_admin_reply")
    : [];
  const totalAgentApprovals =
    pendingAgentApprovals +
    Number(agentApprovalSummary.approved || 0) +
    Number(agentApprovalSummary.rejected || 0);
  const currentRoleLabel = currentUser?.roleLabel || currentUser?.role || "Super Admin";
  const overviewDateLabel = formatOverviewDate();
  const agentQueueLabel = pendingAgentApprovals
    ? `${pendingAgentApprovals} pending approval${pendingAgentApprovals > 1 ? "s" : ""}`
    : "Queue is under control";
  const agentQueueNote = pendingAgentApprovals
    ? "New registrations are waiting for KYC and GST review."
    : "No new agent registrations are waiting for admin action.";
  const agentAxis = buildAxisTicks(agentPerformanceData.map((entry) => entry.revenue), 0, 4);
  const efficiencyAxis = buildAxisTicks(teamEfficiencyData.map((entry) => entry.hours), 8, 4);
  const totalAgentRevenue = agentPerformanceData.reduce((sum, entry) => sum + Number(entry?.revenue || 0), 0);
  const topAgentEntry = agentPerformanceData.reduce(
    (best, entry) => {
      const nextValue = Number(entry?.revenue || 0);
      const bestValue = Number(best?.revenue || 0);
      return nextValue > bestValue ? entry : best;
    },
    agentPerformanceData[0] || null,
  );
  const averageTeamHours = teamEfficiencyData.length
    ? teamEfficiencyData.reduce((sum, entry) => sum + Number(entry?.hours || 0), 0) / teamEfficiencyData.length
    : 0;
  const fastestTeamEntry = teamEfficiencyData.reduce(
    (best, entry) => {
      const nextValue = Number(entry?.hours || 0);
      const bestValue = Number(best?.hours ?? Number.POSITIVE_INFINITY);
      return nextValue < bestValue ? entry : best;
    },
    null,
  );

  return (
    <>
    <div
      id="overview"
      className="scroll-mt-5"
      style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f8fafc", minHeight: "100%", width: "100%" }}
    >
      {/* ── Overview Card ── */}
      <div
        style={{
          background: "#fff",
          // border: "1px solid #e2e8f0",
          // borderRadius: 20,
          overflow: "hidden",
          // boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
          marginBottom: 16,
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Super Admin Dashboard</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{overviewDateLabel}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Logged in as</p>
            <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{currentRoleLabel}</p>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          {/* Title + buttons row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src={superAdminBadge}
                alt="Super admin badge"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  objectFit: "cover",
                  border: "1px solid #fcd34d",
                  boxShadow: "0 8px 20px rgba(245, 158, 11, 0.18)",
                  background: "#fff",
                }}
              />
              <div>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Super Admin Dashboard</h1>
                <p style={{ margin: "6px 0 0", fontSize: 8, color: "#64748b", maxWidth: 480 }}>
                  Complete oversight and control of Holiday Circuit operations
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {/* Agent queue button */}
              <button
                type="button"
                onClick={openAgentDesk}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 48,
                  padding: "0 14px",
                  borderRadius: 14,
                  border: `1px solid ${isAgentDeskOpen ? "#93c5fd" : "#dbeafe"}`,
                  background: isAgentDeskOpen ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                  position: "relative",
                }}
                title={`${agentQueueLabel}. ${agentQueueNote}`}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: isAgentDeskOpen ? "#dbeafe" : "#eff6ff",
                    border: `1px solid ${isAgentDeskOpen ? "#93c5fd" : "#bfdbfe"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserPlus size={15} color="#2563eb" />
                </span>
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.14em" }}>Agent Queue</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{agentQueueLabel}</p>
                </div>
                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    borderRadius: 999,
                    padding: "0 6px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    background: pendingAgentApprovals ? "#fee2e2" : "#f0fdf4",
                    color: pendingAgentApprovals ? "#b91c1c" : "#15803d",
                  }}
                >
                  {pendingAgentApprovals || 0}
                </span>
              </button>

              {/* Export button — green, matches screenshot */}
              <button
                type="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  minHeight: 42,
                  padding: "0 18px",
                  borderRadius: 12,
                  border: "none",
                  background: "#16a34a",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Download size={14} />
                Export Report
              </button>

              {/* Access Level chip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 48,
                  padding: "0 14px",
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "#faf5ff",
                    border: "1px solid #e9d5ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={15} color="#9333ea" />
                </span>
                <div>
                  <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.14em" }}>Access Level</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: "#7c3aed" }}>{currentRoleLabel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 20 }}>
            {statCards.map((s) => {
              const meta = statCardMeta[s.iconKey] || statCardMeta.users;
              const tone = statCardToneMap[s.iconKey] || statCardToneMap.users;
              const Icon = meta.icon;
              return (
                <div
                  key={s.label}
                  style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{s.label}</p>
                      <p style={{ margin: "6px 0 0", fontSize: 25 , fontWeight: 600, color: "#0f172a", lineHeight: 1 }}>
                        {isDashboardLoading ? "--" : s.value}
                      </p>
                    </div>
                    <span
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: meta.iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={20} color={meta.iconColor} />
                    </span>
                  </div>
                  {s.sub ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        width: "fit-content",
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: `1px solid ${tone.badgeBorder}`,
                        background: tone.badgeBg,
                        color: tone.badgeText,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      <TrendingUp size={11} />
                      {s.sub}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Charts row */}
          <div id="finance-dashboard" className="scroll-mt-5" />
          <div id="advanced-analytics" className="scroll-mt-5" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
            {/* Agent Performance */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: "#dcfce7", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BarChart3 size={14} color="#16a34a" />
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Agent Performance</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Revenue by Agent (in ₹)</p>
                </div>
                <span style={{ padding: "5px 10px", borderRadius: 999, background: "#ecfdf3", border: "1px solid #bbf7d0", color: "#15803d", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                  +12.4% growth
                </span>
              </div>
              <div style={{ borderRadius: 12, padding: 14, border: "1px solid #e2e8f0", background: "#f8fdf9" }}>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={agentPerformanceData} barSize={32} margin={{ top: 8, right: 6, left: 8, bottom: 8 }}>
                    <defs>
                      <linearGradient id="agentRevenueGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 5" stroke="#dbe7f3" vertical={false} />
                    <XAxis dataKey="name" height={50} angle={-12} textAnchor="end" tickMargin={10} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis width={62} tickMargin={10} domain={[0, agentAxis.max]} ticks={agentAxis.ticks} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={formatPlainNumber} />
                    <Tooltip content={<CustomTooltipGreen />} cursor={{ fill: "rgba(34,197,94,0.07)" }} />
                    <Bar dataKey="revenue" fill="url(#agentRevenueGradient)" shape={<AnimatedBar />} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Team Efficiency */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: "#dbeafe", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Clock size={14} color="#2563eb" />
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Team Efficiency</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Average time to process a quote (in hours)</p>
                </div>
                <span style={{ padding: "5px 10px", borderRadius: 999, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                  Lower is better
                </span>
              </div>
              <div style={{ borderRadius: 12, padding: 14, border: "1px solid #e2e8f0", background: "#f8fbff" }}>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={teamEfficiencyData} barSize={42} margin={{ top: 8, right: 6, left: 8, bottom: 8 }}>
                    <defs>
                      <linearGradient id="teamEfficiencyGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 5" stroke="#dbe7f3" vertical={false} />
                    <XAxis dataKey="name" height={42} tickMargin={8} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis width={44} tickMargin={10} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, efficiencyAxis.max]} ticks={efficiencyAxis.ticks} />
                    <Tooltip content={<CustomTooltipBlue />} cursor={{ fill: "rgba(59,130,246,0.07)" }} />
                    <Bar dataKey="hours" fill="url(#teamEfficiencyGradient)" shape={<AnimatedBar />} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Agent Approvals ── */}
      <div id="agent-approvals" className="scroll-mt-5" />
      <AnimatePresence initial={false}>
        {isAgentDeskOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              background: "#fff",
               border: "1px solid #e2e8f0",
               borderRadius: 20,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "16px 20px",
                gap: 16,
                flexWrap: "wrap",
                borderBottom: "1px solid #eef2ff",
                background: "#f8fbff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 14, background: "#dbeafe", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BadgeCheck size={16} color="#1d4ed8" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Agent Approval Queue</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                    Compliance review for KYC, GST, and business proof before portal access goes live
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <span style={{ padding: "4px 10px", borderRadius: 999, background: "#e0f2fe", color: "#0369a1", fontSize: 11, fontWeight: 700 }}>
                      {totalAgentApprovals} total cases
                    </span>
                    <span style={{ padding: "4px 10px", borderRadius: 999, background: pendingAgentApprovals ? "#fee2e2" : "#ecfdf3", color: pendingAgentApprovals ? "#b91c1c" : "#15803d", fontSize: 11, fontWeight: 700 }}>
                      {pendingAgentApprovals ? `${pendingAgentApprovals} need review` : "No pending review"}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={fetchAgentApprovals}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #dbeafe", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <RefreshCw size={12} /> Refresh Queue
                </button>
                <button
                  type="button"
                  onClick={() => setIsAgentDeskOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <EyeOff size={12} /> Close Queue
                </button>
              </div>
            </div>

            <div style={{ padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { title: "Needs Review", value: agentApprovalSummary.pending, tone: { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" } },
                  { title: "Activated", value: agentApprovalSummary.approved, tone: { bg: "#ecfdf3", border: "#bbf7d0", color: "#15803d" } },
                  { title: "Returned", value: agentApprovalSummary.rejected, tone: { bg: "#fff1f2", border: "#fecdd3", color: "#be123c" } },
                ].map((item) => (
                  <div key={item.title} style={{ padding: 16, borderRadius: 16, border: `1px solid ${item.tone.border}`, background: item.tone.bg }}>
                    <p style={{ margin: 0, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>{item.title}</p>
                    <p style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 700, color: item.tone.color }}>
                      {isAgentApprovalsLoading ? "--" : item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0,1fr)", gap: 16, alignItems: "stretch" }}>
                {/* Left list */}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 18, background: "#fbfdff", overflow: "hidden" }}>
                  <div style={{ padding: 12, borderBottom: "1px solid #e2e8f0", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[{ key: "pending", label: "Pending" }, { key: "approve", label: "Approved" }, { key: "rejected", label: "Rejected" }, { key: "all", label: "All" }].map((filter) => {
                      const isActive = agentApprovalFilter === filter.key;
                      return (
                        <button
                          key={filter.key}
                          type="button"
                          onClick={() => setAgentApprovalFilter(filter.key)}
                          style={{ height: 32, padding: "0 12px", borderRadius: 999, border: `1px solid ${isActive ? "#c7d2fe" : "#e2e8f0"}`, background: isActive ? "#eef2ff" : "#fff", color: isActive ? "#4338ca" : "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="custom-scroll" style={{ maxHeight: 600, overflowY: "auto", padding: 10 }}>
                    {isAgentApprovalsLoading ? (
                      <div style={{ padding: 28, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading agent requests...</div>
                    ) : filteredAgentApprovals.length ? filteredAgentApprovals.map((agent) => {
                      const statusMeta = getAgentReviewStatusMeta(agent.status);
                      const StatusIcon = statusMeta.Icon;
                      const isSelected = selectedAgent?.id === agent.id;
                      return (
                        <motion.button
                          key={agent.id}
                          type="button"
                          whileHover={{ y: -1 }}
                          onClick={() => setSelectedAgentId(agent.id)}
                          style={{ width: "100%", textAlign: "left", padding: 12, borderRadius: 16, border: `1px solid ${isSelected ? "#bfdbfe" : "#e2e8f0"}`, background: isSelected ? "#eff6ff" : "#fff", cursor: "pointer", marginBottom: 8 }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{agent.companyName || agent.name || "Agency registration"}</p>
                              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>{agent.name || "Agent contact"}</p>
                            </div>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 999, border: `1px solid ${statusMeta.borderColor}`, background: statusMeta.background, color: statusMeta.textColor, flexShrink: 0 }}>
                              <StatusIcon size={11} />
                              <span style={{ fontSize: 10, fontWeight: 700 }}>{statusMeta.label}</span>
                            </div>
                          </div>
                          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569" }}>
                              <Mail size={12} color="#94a3b8" />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{agent.email}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569" }}>
                              <Clock size={12} color="#94a3b8" />
                              <span>Submitted {formatDateTime(agent.submittedAt)}</span>
                            </div>
                          </div>
                        </motion.button>
                      );
                    }) : (
                      <div style={{ padding: 24, textAlign: "center" }}>
                        <FileText size={20} color="#94a3b8" />
                        <p style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>No registrations in this view</p>
                        <p style={{ margin: "5px 0 0", fontSize: 12, color: "#94a3b8" }}>New agent submissions will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right detail */}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 20, background: "#fff", minHeight: 480, overflow: "hidden" }}>
                  {selectedAgent ? (
                    <>
                      <div style={{ padding: 18, borderBottom: "1px solid #eef2ff", background: "#f8fbff" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
                          <div>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <div style={{ width: 38, height: 38, borderRadius: 12, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Building2 size={17} color="#2563eb" />
                              </div>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, border: `1px solid ${selectedAgentStatusMeta.borderColor}`, background: selectedAgentStatusMeta.background, color: selectedAgentStatusMeta.textColor }}>
                                <selectedAgentStatusMeta.Icon size={12} />
                                <span style={{ fontSize: 10, fontWeight: 700 }}>{selectedAgentStatusMeta.label}</span>
                              </div>
                            </div>
                            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{selectedAgent.companyName || "Agency registration"}</p>
                            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.6, maxWidth: 500 }}>
                              Review the submitted KYC pack, validate GST and contact details, then decide whether this agency can enter the Holiday Circuit workspace.
                            </p>
                          </div>
                          <div style={{ padding: 12, borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", minWidth: 200 }}>
                            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Submitted</p>
                            <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{formatDateTime(selectedAgent.submittedAt)}</p>
                            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b" }}>Reviewed by {selectedAgent.reviewedBy || "Awaiting admin"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="custom-scroll" style={{ maxHeight: 480, overflowY: "auto", padding: 18 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                          {[
                            { label: "Primary contact", value: selectedAgent.name || "-", icon: Users },
                            { label: "Email address", value: selectedAgent.email || "-", icon: Mail },
                            { label: "Phone number", value: selectedAgent.phone || "-", icon: Phone },
                            { label: "GST number", value: selectedAgent.gstNumber || "-", icon: BadgeCheck },
                          ].map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <div key={item.label} style={{ padding: 14, borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                  <ItemIcon size={13} color="#64748b" />
                                  <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>{item.label}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a", wordBreak: "break-word" }}>{item.value}</p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Documents */}
                        <div style={{ padding: 16, borderRadius: 18, border: "1px solid #e2e8f0", background: "#f8fafc", marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <div>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Submitted documents</p>
                              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b" }}>Open each file and confirm it matches the registration details.</p>
                            </div>
                            <span style={{ padding: "5px 10px", borderRadius: 999, background: "#fff", border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
                              {selectedAgent.documents?.length || 0} files
                            </span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {(selectedAgent.documents || []).length ? (selectedAgent.documents || []).map((document) => (
                              <div key={document.id} style={{ padding: 14, borderRadius: 16, border: "1px solid #dbeafe", background: "#fff" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 34, height: 34, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FileText size={14} color="#1d4ed8" />
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#0f172a" }}>{document.label}</p>
                                    <p style={{ margin: "3px 0 0", fontSize: 10, color: "#64748b" }}>Click to verify uploaded proof</p>
                                  </div>
                                </div>
                                <a href={document.url} target="_blank" rel="noreferrer" style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", textDecoration: "none", fontSize: 11, fontWeight: 600 }}>
                                  <ExternalLink size={12} /> Open document
                                </a>
                              </div>
                            )) : (
                              <div style={{ gridColumn: "1/-1", padding: 16, borderRadius: 16, border: "1px dashed #cbd5e1", background: "#fff" }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>No documents available</p>
                                <p style={{ margin: "5px 0 0", fontSize: 11, color: "#64748b" }}>Ask the agent to re-submit the registration if mandatory files are missing.</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedAgent.status === "rejected" ? (
                          <div style={{ padding: 14, borderRadius: 16, border: "1px solid #fecdd3", background: "#fff1f2", marginBottom: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <AlertTriangle size={14} color="#be123c" />
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#9f1239" }}>Rejection reason shared with agent</p>
                            </div>
                            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#881337", lineHeight: 1.7 }}>{selectedAgent.rejectionReason || "No reason captured."}</p>
                          </div>
                        ) : null}

                        {/* Action row */}
                        <div style={{ padding: 16, borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Review decision</p>
                            <p style={{ margin: "5px 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                              Approval sends login-ready confirmation on email. Rejection sends the correction reason back to the agent.
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: 10 }}>
                            <button
                              type="button"
                              onClick={() => { setAgentRejectReason(selectedAgent.rejectionReason || ""); setAgentRejectDialogUser(selectedAgent); }}
                              disabled={agentReviewActionId === selectedAgent.id || selectedAgent.status !== "pending"}
                              style={{ minHeight: 42, minWidth: 140, padding: "0 16px", borderRadius: 12, border: "1px solid #fecaca", background: "#fff1f2", color: "#be123c", fontWeight: 700, cursor: agentReviewActionId === selectedAgent.id || selectedAgent.status !== "pending" ? "not-allowed" : "pointer", opacity: agentReviewActionId === selectedAgent.id || selectedAgent.status !== "pending" ? 0.6 : 1 }}
                            >
                              Reject with Reason
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAgentReview(selectedAgent, "approve")}
                              disabled={agentReviewActionId === selectedAgent.id || selectedAgent.status !== "pending"}
                              style={{ minHeight: 42, minWidth: 140, padding: "0 16px", borderRadius: 12, border: "1px solid #86efac", background: agentReviewActionId === selectedAgent.id ? "#bbf7d0" : "#16a34a", color: "#fff", fontWeight: 700, cursor: agentReviewActionId === selectedAgent.id || selectedAgent.status !== "pending" ? "not-allowed" : "pointer", opacity: selectedAgent.status !== "pending" ? 0.7 : 1 }}
                            >
                              {agentReviewActionId === selectedAgent.id ? "Updating..." : "Approve Agent"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ minHeight: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
                      <div style={{ maxWidth: 320 }}>
                        <BadgeCheck size={22} color="#94a3b8" />
                        <p style={{ margin: "12px 0 0", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>No agent selected</p>
                        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>Choose a registration request from the review queue to inspect documents and take action.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── User Management ── */}
      <div id="users-management" className="scroll-mt-5" />
      <div id="queries" className="scroll-mt-5" />
      <div id="quotations" className="scroll-mt-5" />
      <div
        style={{
          display: "none",
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff1f2", border: "1px solid #ffe4e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={16} color="#e11d48" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Admin Escalation Desk</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Action required for escalated queries</p>
            </div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", fontSize: 12, fontWeight: 600 }}>
            <Clock size={12} />
            {adminEscalationRows.length} pending
          </span>
        </div>

        <div style={{ padding: 20 }}>
          {adminEscalationRows.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {adminEscalationRows.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{entry.queryId}</p>
                        <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 6, background: "#fff1f2", color: "#e11d48", fontSize: 11, fontWeight: 600 }}>
                          Pending Reply
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "#334155", fontWeight: 500 }}>{entry.name} • {entry.destination}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b" }}>Stage: {entry.opsStatusLabel || "Unknown"}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{entry.time}</span>
                      <button
                        type="button"
                        onClick={() => openQuotationBuilder(entry)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "0.2s" }}
                      >
                        <FileText size={12} />
                        Open Builder
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedEscalation(entry); setEscalationReply(""); }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "0.2s" }}
                      >
                        <Send size={12} />
                        Reply
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", padding: 12 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Ops Note</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#1e293b", lineHeight: 1.5 }}>{entry.opsEscalationNote || "No note shared."}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>No pending escalations.</p>
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          // border: "1px solid #e2e8f0",
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={17} color="#2563eb" />
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>User Management</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Manage agency staff and permissions</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Total", value: userList.length, bg: "#eff6ff", border: "#bfdbfe", color: "#2563eb" },
              { label: "Active", value: activeUserCount, bg: "#ecfdf3", border: "#bbf7d0", color: "#15803d" },
              { label: "Inactive", value: inactiveUserCount, bg: "#fff7ed", border: "#fed7aa", color: "#c2410c" },
              { label: "Deleted", value: deletedUserCount, bg: "#fff1f2", border: "#fecdd3", color: "#be123c" },
            ].map((item) => (
              <span
                key={item.label}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, border: `1px solid ${item.border}`, background: item.bg, color: item.color, fontSize: 12, fontWeight: 600 }}
              >
                {item.label}: {item.value}
              </span>
            ))}
            <button
              type="button"
              onClick={() => { setEditingUser(null); setIsAddUserModalOpen(true); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, border: "none", background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <UserPlus size={14} />
              Add New User
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="custom-scroll" style={{ overflowX: "auto", overflowY: "hidden", paddingBottom: 8 }}>
          <table style={{ width: "100%", minWidth: 1100, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                {["Team Member", "Role", "Contact", "Permissions", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isUsersLoading ? (
                <tr><td colSpan={6} style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>Loading users...</td></tr>
              ) : userList.length ? userList.map((user) => {
                const isStatusUpdating = pendingStatusUpdate.id === user.id;
                const displayStatus = isStatusUpdating ? pendingStatusUpdate.status : user.status;
                const statusAppearance = getStatusAppearance(displayStatus);
                const StatusIcon = statusAppearance.Icon;
                const visiblePermissions = user.permissions.slice(0, 3);
                const extraPermissions = Math.max(0, user.permissions.length - visiblePermissions.length);

                return (
                  <tr key={user.id} style={{ borderBottom: "1px solid #E0E0E0", verticalAlign: "middle" }}>
                    {/* Team Member */}
                    <td style={{ padding: "5px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: user.roleBg, border: `1px solid ${user.roleColor}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: user.roleColor, flexShrink: 0, overflow: "hidden" }}>
                          {user.profileImage
                            ? <img src={user.profileImage} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : user.initials}
                        </div>
                        <div style={{ minWidth: 120 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{user.name}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{user.employeeId || user.department || "Holiday Circuit"}</p>
                          {user.status === "Deleted" && user.deletionReason ? (
                            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#e11d48", lineHeight: 1.5 }}>Reason: {user.deletionReason}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: "12px 18px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, border: `1px solid ${user.roleColor}22`, background: user.roleBg, color: user.roleColor, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                        <Shield size={11} />
                        {user.role}
                      </span>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>{user.designation || user.department || "Portal access"}</p>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>
                        <Mail size={13} color="#94a3b8" />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{user.email}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                        <Phone size={12} color="#94a3b8" />
                        <span>{user.phone || "No phone added"}</span>
                      </div>
                    </td>

                    {/* Permissions */}
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {visiblePermissions.length ? visiblePermissions.map((permission) => {
                          const pa = getPermissionAppearance(permission);
                          return (
                            <span key={permission} style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 999, border: `1px solid ${pa.border}`, background: pa.bg, color: pa.color, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                              {permission}
                            </span>
                          );
                        }) : <span style={{ fontSize: 12, color: "#94a3b8" }}>No permissions assigned</span>}
                        {extraPermissions ? (
                          <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 999, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: 11, fontWeight: 600 }}>
                            +{extraPermissions} more
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 18px" }}>
                      <motion.div
                        layout
                        animate={{ scale: isStatusUpdating ? [1, 1.04, 1] : 1, opacity: isStatusUpdating ? 0.9 : 1 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, border: `1px solid ${statusAppearance.borderColor}`, background: statusAppearance.background }}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={displayStatus}
                            initial={{ opacity: 0, y: 4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.96 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px" }}
                          >
                            <StatusIcon size={12} color={statusAppearance.iconColor} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: statusAppearance.textColor }}>{displayStatus}</span>
                          </motion.div>
                        </AnimatePresence>
                      </motion.div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {[
                          { key: "edit", Icon: Edit2, title: "Edit", disabled: user.isDeleted, onClick: () => { setEditingUser(user); setIsAddUserModalOpen(true); } },
                          { key: "toggle-status", Icon: RefreshCw, title: displayStatus === "Active" ? "Mark Inactive" : "Mark Active", disabled: user.isDeleted, onClick: () => handleToggleUserStatus(user) },
                          { key: "delete", Icon: Trash2, title: "Delete", disabled: user.isDeleted, onClick: () => { setDeleteReason(""); setDeleteDialogUser(user); } },
                        ].map(({ key, Icon: ActionIcon, title, onClick, disabled }) => {
                          const isBusy = !disabled && Boolean(onClick) && isBusyAction(user.id);
                          const isStatusAction = key === "toggle-status";
                          return (
                            <motion.button
                              key={key}
                              type="button"
                              title={title}
                              whileHover={disabled ? undefined : { y: -1, scale: 1.04 }}
                              whileTap={disabled ? undefined : { scale: 0.93 }}
                              transition={{ type: "spring", stiffness: 320, damping: 22 }}
                              onClick={disabled ? undefined : onClick}
                              disabled={disabled || isBusy}
                              style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: disabled ? "#f8fafc" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1 }}
                            >
                              <motion.span
                                animate={isStatusAction && isBusy ? { rotate: 360 } : { rotate: 0 }}
                                transition={isStatusAction && isBusy ? { duration: 0.8, ease: "linear", repeat: Infinity } : { duration: 0.2 }}
                                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                              >
                                <ActionIcon size={13} color={disabled ? "#cbd5e1" : "#94a3b8"} />
                              </motion.span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>No team members found yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Master Controls — Bookings ── */}
      <div id="contracted-rates" className="scroll-mt-5" />
      <div id="booking-management" className="scroll-mt-5" />
      <div id="order-acceptance" className="scroll-mt-5" />
      <div id="voucher-management" className="scroll-mt-5" />
      <div id="fulfillment-confirmation" className="scroll-mt-5" />
      <div id="payment-verification" className="scroll-mt-5" />
      <div id="internal-invoice" className="scroll-mt-5" />
      <div id="rate-contracts" className="scroll-mt-5" />
      <div id="invoices-payments" className="scroll-mt-5" />
      <div
        style={{
          background: "#fff",
          // border: "1px solid #e2e8f0",
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarDays size={17} color="#2563eb" />
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Master Controls - Bookings</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Track booking payments and mapped DMC partners</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 600 }}>
              <FileText size={12} /> {bookingRows.length} live bookings
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, border: "1px solid #fde68a", background: "#fffbeb", color: "#b45309", fontSize: 12, fontWeight: 600 }}>
              <Clock size={12} /> {pendingBookingCount} pending
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", fontSize: 12, fontWeight: 600 }}>
              <BadgeCheck size={12} /> {verifiedBookingCount} verified
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="custom-scroll" style={{ overflowX: "auto", overflowY: "hidden", paddingBottom: 8 }}>
          <table style={{ width: "100%", minWidth: 780, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                {["Booking Ref", "Agent", "Amount", "Payment Status", "DMC Partner"].map((h) => (
                  <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookingRows.length ? bookingRows.map((booking, index) => {
                const paymentMeta = getBookingPaymentMeta(booking.paymentStatus);
                const PaymentIcon = paymentMeta.Icon;
                return (
                  <tr key={booking.id || index} style={{ borderBottom: "1px solid #E0E0E0", verticalAlign: "middle" }}>
                    <td style={{ padding: "12px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 34, height: 34, borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <FileText size={14} color="#2563eb" />
                        </span>
                        <div style={{ minWidth: 90 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>{booking.id}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>Booking reference</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#475569", flexShrink: 0 }}>
                          {getInitials(booking.agent)}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{booking.agent}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>Agent account</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 34, height: 34, borderRadius: 10, background: "#ecfdf3", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Wallet size={14} color="#16a34a" />
                        </span>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                            {typeof booking.amount === "number" ? formatCurrency(booking.amount) : booking.amount}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>Total payable</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999, border: `1px solid ${paymentMeta.borderColor}`, background: paymentMeta.background, color: paymentMeta.textColor, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                        <PaymentIcon size={12} color={paymentMeta.iconColor} />
                        {paymentMeta.label}
                      </span>
                      <p style={{ margin: "3px 0 0", fontSize: 10, color: "#94a3b8" }}>Finance checkpoint</p>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 34, height: 34, borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Building2 size={14} color="#b45309" />
                        </span>
                        <div style={{ minWidth: 120 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{booking.dmc || "-"}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>Mapped fulfillment partner</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>No booking records available yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <AnimatePresence initial={false}>
      {isAddUserModalOpen ? (
        <AddNewUserModal
          mode={editingUser ? "edit" : "create"}
          initialUser={editingUser}
          managerOptions={managerOptions}
          onClose={() => { setIsAddUserModalOpen(false); setEditingUser(null); }}
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
        />
      ) : null}

      {selectedEscalation ? (
        <motion.div
          key="admin-escalation-dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeEscalationDialog(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            style={{ width: "min(620px, calc(100vw - 32px))", borderRadius: 18, background: "#fff", border: "1px solid rgba(226,232,240,0.9)", boxShadow: "0 30px 80px rgba(15,23,42,0.28)", overflow: "hidden" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, background: "linear-gradient(135deg, #fff7ed, #ffffff 60%)", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "#ffedd5", border: "1px solid #fdba74", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Send size={16} color="#c2410c" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: "#c2410c", textTransform: "uppercase" }}>Admin Reply</p>
                  <h3 style={{ margin: "8px 0 0", fontSize: 20, lineHeight: 1.2, color: "#0f172a" }}>{selectedEscalation.queryId}</h3>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>{selectedEscalation.name} - {selectedEscalation.destination}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEscalationDialog}
                disabled={Boolean(escalationActionId)}
                style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: escalationActionId ? "not-allowed" : "pointer" }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <div style={{ padding: 18 }}>
              <div style={{ borderRadius: 16, border: "1px solid #fed7aa", background: "#fff7ed", padding: 14 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.12em" }}>Latest ops note</p>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "#0f172a", lineHeight: 1.7 }}>{selectedEscalation.opsEscalationNote || "No note shared."}</p>
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "#64748b" }}>{selectedEscalation.opsEscalationBy || "Operations"}</p>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Reply for ops</label>
                <textarea
                  value={escalationReply}
                  onChange={(event) => setEscalationReply(event.target.value)}
                  placeholder="Write the admin decision, approval, or instruction for the assigned ops team member..."
                  rows={6}
                  style={{ width: "100%", minHeight: 140, borderRadius: 16, border: "1px solid #cbd5e1", padding: "12px 14px", fontSize: 13, outline: "none", resize: "vertical", color: "#0f172a" }}
                />
              </div>

              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={closeEscalationDialog}
                  disabled={Boolean(escalationActionId)}
                  style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 700, cursor: escalationActionId ? "not-allowed" : "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitEscalationReply}
                  disabled={Boolean(escalationActionId)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, border: "none", background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: escalationActionId ? "not-allowed" : "pointer" }}
                >
                  <Send size={14} />
                  {escalationActionId ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}

      {agentRejectDialogUser ? (
        <motion.div
          key="agent-reject-dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeAgentRejectDialog(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            style={{ width: "min(540px, calc(100vw - 32px))", borderRadius: 18, background: "#fff", border: "1px solid rgba(226,232,240,0.9)", boxShadow: "0 30px 80px rgba(15,23,42,0.28)", overflow: "hidden" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, background: "linear-gradient(135deg, #fff1f2, #ffffff 60%)", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "#fee2e2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <XCircle size={16} color="#be123c" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Reject registration</p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>The reason below will be emailed to the agent so they can correct the submission.</p>
                </div>
              </div>
              <button type="button" onClick={closeAgentRejectDialog} style={{ width: 34, height: 34, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: "#64748b", fontSize: 16 }}>×</button>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, background: "#f8fafc", marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Registration</p>
                <p style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{agentRejectDialogUser?.companyName || agentRejectDialogUser?.name || "Agent registration"}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#475569" }}>{agentRejectDialogUser?.email || ""}</p>
              </div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Rejection reason <span style={{ color: "#dc2626" }}>*</span></label>
              <textarea
                value={agentRejectReason}
                onChange={(e) => setAgentRejectReason(e.target.value)}
                placeholder="Example: GST number mismatched with document, business license unreadable..."
                rows={4}
                style={{ width: "100%", marginTop: 8, padding: "12px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 13, color: "#0f172a", resize: "none" }}
              />
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#94a3b8" }}>Be specific so the agent can resubmit without another delay.</p>
            </div>
            <div style={{ padding: 18, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #f1f5f9" }}>
              <button type="button" onClick={closeAgentRejectDialog} style={{ height: 40, padding: "0 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 700, color: "#0f172a" }}>Cancel</button>
              <button
                type="button"
                onClick={() => handleAgentReview(agentRejectDialogUser, "rejected", agentRejectReason)}
                disabled={agentReviewActionId === agentRejectDialogUser.id || !String(agentRejectReason || "").trim()}
                style={{ height: 40, padding: "0 14px", borderRadius: 12, border: "1px solid #fecaca", background: agentReviewActionId === agentRejectDialogUser.id ? "#fee2e2" : "#ef4444", cursor: agentReviewActionId === agentRejectDialogUser.id ? "not-allowed" : "pointer", fontWeight: 800, color: agentReviewActionId === agentRejectDialogUser.id ? "#991b1b" : "#fff" }}
              >
                {agentReviewActionId === agentRejectDialogUser.id ? "Sending..." : "Reject Registration"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}

      {deleteDialogUser ? (
        <motion.div
          key="delete-user-dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeDeleteDialog(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            style={{ width: "min(520px, calc(100vw - 32px))", borderRadius: 18, background: "#fff", border: "1px solid rgba(226,232,240,0.9)", boxShadow: "0 30px 80px rgba(15,23,42,0.28)", overflow: "hidden" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, background: "linear-gradient(135deg, #fff1f2, #ffffff 60%)", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "#fee2e2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Trash2 size={16} color="#be123c" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Confirm account removal</p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>This will revoke access immediately. The reason will be emailed to the user.</p>
                </div>
              </div>
              <button type="button" onClick={closeDeleteDialog} style={{ width: 34, height: 34, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: "#64748b", fontSize: 16 }}>×</button>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, background: "#f8fafc", marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Target user</p>
                <p style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{deleteDialogUser?.name || "User"}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#475569" }}>{deleteDialogUser?.email || ""}</p>
              </div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Deletion reason <span style={{ color: "#dc2626" }}>*</span></label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Example: Account created by mistake, role changed, or no longer part of the team..."
                rows={4}
                style={{ width: "100%", marginTop: 8, padding: "12px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 13, color: "#0f172a", resize: "none" }}
              />
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#94a3b8" }}>Keep it short and clear. This note will be visible in the admin log and sent to the user.</p>
            </div>
            <div style={{ padding: 18, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #f1f5f9" }}>
              <button type="button" onClick={closeDeleteDialog} style={{ height: 40, padding: "0 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 700, color: "#0f172a" }}>Cancel</button>
              <button
                type="button"
                onClick={() => handleDeleteUser(deleteDialogUser.id, deleteReason)}
                disabled={isBusyAction(deleteDialogUser.id) || !String(deleteReason || "").trim()}
                style={{ height: 40, padding: "0 14px", borderRadius: 12, border: "1px solid #fecaca", background: isBusyAction(deleteDialogUser.id) ? "#fee2e2" : "#ef4444", cursor: isBusyAction(deleteDialogUser.id) ? "not-allowed" : "pointer", fontWeight: 800, color: isBusyAction(deleteDialogUser.id) ? "#991b1b" : "#fff" }}
              >
                {isBusyAction(deleteDialogUser.id) ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
    </>
  );
}
