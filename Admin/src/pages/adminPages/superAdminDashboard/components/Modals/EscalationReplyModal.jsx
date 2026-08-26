import React from "react";
import { motion } from "framer-motion";
import { Send, X } from "lucide-react";

export const EscalationReplyModal = ({
  selectedEscalation,
  escalationReply,
  setEscalationReply,
  closeEscalationDialog,
  handleSubmitEscalationReply,
  escalationActionId,
}) => {
  if (!selectedEscalation) return null;

  return (
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
  );
};
