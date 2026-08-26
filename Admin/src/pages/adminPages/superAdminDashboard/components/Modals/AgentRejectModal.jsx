import React from "react";
import { motion } from "framer-motion";
import { XCircle, Building2, Users, Mail, Phone, BadgeCheck } from "lucide-react";

export const AgentRejectModal = ({
  agentRejectDialogUser,
  agentRejectReason,
  setAgentRejectReason,
  closeAgentRejectDialog,
  handleAgentReview,
  agentReviewActionId,
}) => {
  if (!agentRejectDialogUser) return null;

  return (
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
        <div style={{ padding: "12px 18px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "linear-gradient(135deg, #fff1f2, #ffffff 60%)", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#fee2e2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <XCircle size={14} color="#be123c" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Reject registration</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>The reason below will be emailed to the agent so they can correct the submission.</p>
            </div>
          </div>
          <button type="button" onClick={closeAgentRejectDialog} style={{ width: 28, height: 28, borderRadius: 999, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>×</button>
        </div>
        <div style={{ padding: "14px 18px" }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: "10px 12px", background: "#f8fafc", marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 9.5, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Registration</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <Building2 size={13} color="#2563eb" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {agentRejectDialogUser?.companyName || "Agent registration"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", marginTop: 8, paddingTop: 8, borderTop: "1px dashed #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                <Users size={11} color="#64748b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {agentRejectDialogUser?.name || "-"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                <Mail size={11} color="#64748b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {agentRejectDialogUser?.email || "-"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                <Phone size={11} color="#64748b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {agentRejectDialogUser?.phone || "-"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                <BadgeCheck size={11} color="#64748b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  GST: {agentRejectDialogUser?.gstNumber || "-"}
                </span>
              </div>
            </div>
          </div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Rejection reason <span style={{ color: "#dc2626" }}>*</span></label>
          <textarea
            value={agentRejectReason}
            onChange={(e) => setAgentRejectReason(e.target.value)}
            placeholder="Example: GST number mismatched with document, business license unreadable..."
            rows={3}
            style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 12.5, color: "#0f172a", resize: "none" }}
          />
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>Be specific so the agent can resubmit without another delay.</p>
        </div>
        <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #f1f5f9" }}>
          <button type="button" onClick={closeAgentRejectDialog} style={{ height: 32, padding: "0 18px", borderRadius: 999, border: "1px solid #cbd5e1", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", cursor: "pointer", fontWeight: 700, color: "#475569", fontSize: 12, transition: "all 0.2s ease" }}>Cancel</button>
          <button
            type="button"
            onClick={() => handleAgentReview(agentRejectDialogUser, "rejected", agentRejectReason)}
            disabled={agentReviewActionId === agentRejectDialogUser.id || !String(agentRejectReason || "").trim()}
            style={{ height: 32, padding: "0 18px", borderRadius: 999, border: "none", background: agentReviewActionId === agentRejectDialogUser.id ? "#fee2e2" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", cursor: agentReviewActionId === agentRejectDialogUser.id ? "not-allowed" : "pointer", fontWeight: 800, color: agentReviewActionId === agentRejectDialogUser.id ? "#991b1b" : "#fff", fontSize: 12, transition: "all 0.2s ease" }}
          >
            {agentReviewActionId === agentRejectDialogUser.id ? "Sending..." : "Reject Registration"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
