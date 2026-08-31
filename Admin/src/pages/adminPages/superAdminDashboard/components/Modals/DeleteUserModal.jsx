import React from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

export const DeleteUserModal = ({
  deleteDialogUser,
  deleteReason,
  setDeleteReason,
  closeDeleteDialog,
  handleDeleteUser,
  isBusyAction,
}) => {
  if (!deleteDialogUser) return null;

  return (
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
  );
};
