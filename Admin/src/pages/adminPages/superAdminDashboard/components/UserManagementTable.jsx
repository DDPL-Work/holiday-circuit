import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Edit2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  getPermissionAppearance,
  getStatusAppearance,
} from "../utils/dashboardHelpers";

export const UserManagementTable = ({
  userList = [],
  activeUserCount = 0,
  inactiveUserCount = 0,
  deletedUserCount = 0,
  isUsersLoading = false,
  pendingStatusUpdate,
  isBusyAction,
  setEditingUser,
  setIsAddUserModalOpen,
  handleToggleUserStatus,
  setDeleteReason,
  setDeleteDialogUser,
}) => {
  return (
    <div style={{ padding: "0 16px" }}>
      <div id="users-management" className="scroll-mt-5" />
      <div id="queries" className="scroll-mt-5" />
      <div id="quotations" className="scroll-mt-5" />
      <div
        style={{
          background: "#fff",
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
                        ].map(({ key, Icon, title, onClick, disabled }) => {
                          const ActionIcon = Icon;
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
    </div>
  );
};
