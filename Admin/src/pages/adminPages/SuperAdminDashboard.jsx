import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import AddNewUserModal from "../../modal/AddNewUserModal";
import API from "../../utils/Api";

import {
  roleAppearance,
  filterAgentApprovalRows,
  formatOverviewDate,
  getInitials,
  getAgentReviewStatusMeta,
  buildAxisTicks,
} from "./superAdminDashboard/utils/dashboardHelpers";

import { SuperAdminHeader } from "./superAdminDashboard/components/SuperAdminHeader";
import { StatCardsGrid } from "./superAdminDashboard/components/StatCardsGrid";
import { BookingTrendsCard } from "./superAdminDashboard/components/BookingTrendsCard";
import { DashboardCharts } from "./superAdminDashboard/components/DashboardCharts";
import { AgentApprovalDeskModal } from "./superAdminDashboard/components/AgentApprovalDeskModal";
import { AdminEscalationDesk } from "./superAdminDashboard/components/AdminEscalationDesk";
import { OverrideDisputeDesk } from "./superAdminDashboard/components/OverrideDisputeDesk";
import { UserManagementTable } from "./superAdminDashboard/components/UserManagementTable";
import { MasterBookingsTable } from "./superAdminDashboard/components/MasterBookingsTable";

import { DeleteUserModal } from "./superAdminDashboard/components/Modals/DeleteUserModal";
import { AgentRejectModal } from "./superAdminDashboard/components/Modals/AgentRejectModal";
import { EscalationReplyModal } from "./superAdminDashboard/components/Modals/EscalationReplyModal";
import { OverrideResolutionModal } from "./superAdminDashboard/components/Modals/OverrideResolutionModal";
import { BookingTrendsModal } from "./superAdminDashboard/components/Modals/BookingTrendsModal";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useSelector((state) => state.auth.user);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isBookingTrendsModalOpen, setIsBookingTrendsModalOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
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
  const [bookingPage, setBookingPage] = useState(1);
  const bookingItemsPerPage = 5;
  const [userActionId, setUserActionId] = useState("");
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState({ id: "", status: "" });
  const [deleteDialogUser, setDeleteDialogUser] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [escalationReply, setEscalationReply] = useState("");
  const [escalationActionId, setEscalationActionId] = useState("");
  const [selectedOverrideCase, setSelectedOverrideCase] = useState(null);
  const [overrideDecision, setOverrideDecision] = useState("approve");
  const [overrideNote, setOverrideNote] = useState("");
  const [overrideActionId, setOverrideActionId] = useState("");

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
    setBookingPage(1);
  }, [dashboardData]);

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
    if (!deleteDialogUser && !agentRejectDialogUser && !selectedEscalation && !selectedOverrideCase) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [deleteDialogUser, agentRejectDialogUser, selectedEscalation, selectedOverrideCase]);

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
    setIsAgentDeskOpen(true);
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
      const { data } = await API.delete(`/admin/managed-users/${id}`, { data: { reason } });
      setUserList((prev) => prev.filter((user) => user.id !== id));
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

  const closeOverrideDialog = () => {
    setSelectedOverrideCase(null);
    setOverrideDecision("approve");
    setOverrideNote("");
  };

  const openOverrideDialog = (entry, decision = "approve") => {
    setSelectedOverrideCase(entry);
    setOverrideDecision(decision);
    setOverrideNote("");
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

  const handleSubmitOverrideResolution = async () => {
    const trimmedNote = overrideNote.trim();

    if (!selectedOverrideCase?.targetType || !selectedOverrideCase?.targetId) {
      toast.error("Override case details are missing.");
      return;
    }

    if (!trimmedNote) {
      toast.error("Please add a resolution note.");
      return;
    }

    try {
      setOverrideActionId(selectedOverrideCase.id || selectedOverrideCase.targetId);
      const { data } = await API.patch(
        `/admin/override-cases/${selectedOverrideCase.targetType}/${selectedOverrideCase.targetId}/resolve`,
        {
          decision: overrideDecision,
          resolutionNote: trimmedNote,
        },
      );
      toast.success(data?.message || "Override resolved successfully");
      closeOverrideDialog();
      await fetchDashboardData();
      await fetchAgentApprovals(true);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to resolve override right now.");
    } finally {
      setOverrideActionId("");
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
  const bookingTrends = superAdminData.bookingTrends || null;
  const agentPerformanceData = superAdminData.agentPerformance || [];
  const teamEfficiencyData = superAdminData.teamEfficiency || [];
  const bookingRows = superAdminData.masterBookings || [];
  const totalBookingPages = Math.ceil(bookingRows.length / bookingItemsPerPage) || 1;
  const bookingStartIndex = (bookingPage - 1) * bookingItemsPerPage;
  const paginatedBookingRows = bookingRows.slice(bookingStartIndex, bookingStartIndex + bookingItemsPerPage);
  const overrideRows = Array.isArray(superAdminData.overrideCases) ? superAdminData.overrideCases : [];
  const openOverrideCount = Number(superAdminData.overrideSummary?.open || overrideRows.filter((entry) => entry.status === "Open").length);
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

  return (
    <>
      <div
        id="overview"
        className="scroll-mt-5"
        style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f8fafc", minHeight: "100%", width: "100%", padding: "12px 0px" }}
      >
        <SuperAdminHeader
          showHeader={showHeader}
          setShowHeader={setShowHeader}
          overviewDateLabel={overviewDateLabel}
          currentRoleLabel={currentRoleLabel}
          openAgentDesk={openAgentDesk}
          isAgentDeskOpen={isAgentDeskOpen}
          agentQueueLabel={agentQueueLabel}
          agentQueueNote={agentQueueNote}
          pendingAgentApprovals={pendingAgentApprovals}
        />

        <StatCardsGrid
          statCards={statCards}
          isDashboardLoading={isDashboardLoading}
        />

        <BookingTrendsCard
          bookingTrends={bookingTrends}
          isLoading={isDashboardLoading}
          onOpenDetails={() => setIsBookingTrendsModalOpen(true)}
        />

        <DashboardCharts
          agentPerformanceData={agentPerformanceData}
          teamEfficiencyData={teamEfficiencyData}
          agentAxis={agentAxis}
          efficiencyAxis={efficiencyAxis}
        />

        <AgentApprovalDeskModal
          isAgentDeskOpen={isAgentDeskOpen}
          setIsAgentDeskOpen={setIsAgentDeskOpen}
          totalAgentApprovals={totalAgentApprovals}
          pendingAgentApprovals={pendingAgentApprovals}
          agentApprovalSummary={agentApprovalSummary}
          fetchAgentApprovals={fetchAgentApprovals}
          agentApprovalFilter={agentApprovalFilter}
          setAgentApprovalFilter={setAgentApprovalFilter}
          isAgentApprovalsLoading={isAgentApprovalsLoading}
          filteredAgentApprovals={filteredAgentApprovals}
          selectedAgent={selectedAgent}
          selectedAgentId={selectedAgentId}
          setSelectedAgentId={setSelectedAgentId}
          selectedAgentStatusMeta={selectedAgentStatusMeta}
          setAgentRejectReason={setAgentRejectReason}
          setAgentRejectDialogUser={setAgentRejectDialogUser}
          agentReviewActionId={agentReviewActionId}
          handleAgentReview={handleAgentReview}
        />

        <AdminEscalationDesk
          adminEscalationRows={adminEscalationRows}
          openQuotationBuilder={openQuotationBuilder}
          setSelectedEscalation={setSelectedEscalation}
          setEscalationReply={setEscalationReply}
        />

        <OverrideDisputeDesk
          overrideRows={overrideRows}
          openOverrideCount={openOverrideCount}
          openOverrideDialog={openOverrideDialog}
        />

        <UserManagementTable
          userList={userList}
          activeUserCount={activeUserCount}
          inactiveUserCount={inactiveUserCount}
          deletedUserCount={deletedUserCount}
          isUsersLoading={isUsersLoading}
          pendingStatusUpdate={pendingStatusUpdate}
          isBusyAction={isBusyAction}
          setEditingUser={setEditingUser}
          setIsAddUserModalOpen={setIsAddUserModalOpen}
          handleToggleUserStatus={handleToggleUserStatus}
          setDeleteReason={setDeleteReason}
          setDeleteDialogUser={setDeleteDialogUser}
        />

        <MasterBookingsTable
          bookingRows={bookingRows}
          paginatedBookingRows={paginatedBookingRows}
          pendingBookingCount={pendingBookingCount}
          verifiedBookingCount={verifiedBookingCount}
          bookingPage={bookingPage}
          setBookingPage={setBookingPage}
          totalBookingPages={totalBookingPages}
          bookingStartIndex={bookingStartIndex}
          bookingItemsPerPage={bookingItemsPerPage}
        />
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

        {selectedOverrideCase ? (
          <OverrideResolutionModal
            selectedOverrideCase={selectedOverrideCase}
            closeOverrideDialog={closeOverrideDialog}
            overrideActionId={overrideActionId}
            overrideDecision={overrideDecision}
            setOverrideDecision={setOverrideDecision}
            overrideNote={overrideNote}
            setOverrideNote={setOverrideNote}
            handleSubmitOverrideResolution={handleSubmitOverrideResolution}
          />
        ) : null}

        {selectedEscalation ? (
          <EscalationReplyModal
            selectedEscalation={selectedEscalation}
            escalationReply={escalationReply}
            setEscalationReply={setEscalationReply}
            closeEscalationDialog={closeEscalationDialog}
            handleSubmitEscalationReply={handleSubmitEscalationReply}
            escalationActionId={escalationActionId}
          />
        ) : null}

        {agentRejectDialogUser ? (
          <AgentRejectModal
            agentRejectDialogUser={agentRejectDialogUser}
            agentRejectReason={agentRejectReason}
            setAgentRejectReason={setAgentRejectReason}
            closeAgentRejectDialog={closeAgentRejectDialog}
            handleAgentReview={handleAgentReview}
            agentReviewActionId={agentReviewActionId}
          />
        ) : null}

        {deleteDialogUser ? (
          <DeleteUserModal
            deleteDialogUser={deleteDialogUser}
            deleteReason={deleteReason}
            setDeleteReason={setDeleteReason}
            closeDeleteDialog={closeDeleteDialog}
            handleDeleteUser={handleDeleteUser}
            isBusyAction={isBusyAction}
          />
        ) : null}

        {isBookingTrendsModalOpen ? (
          <BookingTrendsModal
            isOpen={isBookingTrendsModalOpen}
            onClose={() => setIsBookingTrendsModalOpen(false)}
            bookingTrends={bookingTrends}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
