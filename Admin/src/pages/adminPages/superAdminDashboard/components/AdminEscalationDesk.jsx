import React from "react";
import { AlertTriangle, Clock, FileText, Send } from "lucide-react";

export const AdminEscalationDesk = ({
  adminEscalationRows = [],
  openQuotationBuilder,
  setSelectedEscalation,
  setEscalationReply,
}) => {
  return (
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
  );
};
