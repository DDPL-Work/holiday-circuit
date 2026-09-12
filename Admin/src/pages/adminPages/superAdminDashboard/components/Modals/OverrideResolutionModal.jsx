import React from "react";
import { motion } from "framer-motion";
import { Shield, X, Send } from "lucide-react";

export const OverrideResolutionModal = ({
  selectedOverrideCase,
  closeOverrideDialog,
  overrideActionId,
  overrideDecision,
  setOverrideDecision,
  overrideNote,
  setOverrideNote,
  handleSubmitOverrideResolution,
}) => {
  if (!selectedOverrideCase) return null;

  return (
    <motion.div
      key="admin-override-dialog"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) closeOverrideDialog(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        style={{ width: "min(460px, calc(100vw - 32px))", borderRadius: 16, background: "#fff", border: "1px solid rgba(226,232,240,0.9)", boxShadow: "0 20px 50px rgba(15,23,42,0.18)", overflow: "hidden" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #ffffff 100%)", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#e0e7ff", border: "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Shield size={14} color="#4338ca" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.14em", color: "#4338ca", textTransform: "uppercase" }}>Super Admin Override</p>
              <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{selectedOverrideCase.reference}</h3>
              <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "#64748b", fontWeight: 500 }}>{selectedOverrideCase.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeOverrideDialog}
            disabled={Boolean(overrideActionId)}
            style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: overrideActionId ? "not-allowed" : "pointer" }}
          >
            <X size={14} color="#64748b" />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ borderRadius: 12, border: "1px solid #dbeafe", background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)", padding: "10px 12px" }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.10em" }}>Case details</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#0f172a", lineHeight: 1.5, fontWeight: 500 }}>{selectedOverrideCase.description || "No details shared."}</p>
            <p style={{ margin: "4px 0 0", fontSize: 10.5, color: "#64748b", fontWeight: 500 }}>{selectedOverrideCase.sourceModule} • Raised by {selectedOverrideCase.requestedByName || "System"}</p>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Decision</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { value: "approve", label: "Approve / Override" },
                { value: "reject", label: "Reject" },
                { value: "resolve", label: "Resolve Note" },
              ]
                .filter((item) =>
                  item.value !== "resolve" ||
                  !["agent_approval", "payment_verification"].includes(selectedOverrideCase.targetType),
                )
                .map((item) => {
                  const isSelected = overrideDecision === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setOverrideDecision(item.value)}
                      style={{
                        height: 32,
                        padding: "0 12px",
                        borderRadius: 8,
                        border: isSelected ? "none" : "1px solid #e2e8f0",
                        background: isSelected
                          ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                          : "#fff",
                        color: isSelected ? "#fff" : "#475569",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: isSelected ? "0 4px 10px rgba(99, 102, 241, 0.2)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Resolution note</label>
            <textarea
              value={overrideNote}
              onChange={(event) => setOverrideNote(event.target.value)}
              placeholder="Write the Super Admin decision reason, approval basis, or dispute resolution note..."
              rows={3}
              style={{ width: "100%", minHeight: 80, borderRadius: 12, border: "1px solid #cbd5e1", padding: "10px 12px", fontSize: 12, outline: "none", resize: "vertical", color: "#0f172a", lineHeight: 1.5 }}
            />
          </div>

          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              onClick={closeOverrideDialog}
              disabled={Boolean(overrideActionId)}
              style={{ height: 34, padding: "0 14px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 700, cursor: overrideActionId ? "not-allowed" : "pointer" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitOverrideResolution}
              disabled={Boolean(overrideActionId)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 34,
                padding: "0 14px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: overrideActionId ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.15)",
              }}
            >
              <Send size={12} />
              {overrideActionId ? "Saving..." : "Save Decision"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
