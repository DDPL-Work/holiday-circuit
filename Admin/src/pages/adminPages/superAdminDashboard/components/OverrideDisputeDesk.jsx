import React from "react";
import { Shield, AlertTriangle, CheckCircle2, XCircle, Send } from "lucide-react";
import { getOverrideStatusMeta } from "../utils/dashboardHelpers";

export const OverrideDisputeDesk = ({
  overrideRows = [],
  openOverrideCount = 0,
  openOverrideDialog,
}) => {
  return (
    <div style={{ padding: "0 16px" }}>
      <div
        style={{
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
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eef2ff", border: "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={16} color="#4338ca" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Override & Dispute Desk</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Universal Super Admin decisions across ops, agents, finance, and DMC invoices</p>
            </div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", fontSize: 12, fontWeight: 600 }}>
            <AlertTriangle size={12} />
            {openOverrideCount} open
          </span>
        </div>

        <div style={{ padding: 20 }}>
          {overrideRows.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {overrideRows.map((entry) => {
                const statusMeta = getOverrideStatusMeta(entry.status);
                const isClosed = entry.status !== "Open";
                return (
                  <div
                    key={`${entry.targetType}-${entry.targetId}-${entry.status}`}
                    style={{ border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: 14, padding: 16 }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 220, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{entry.reference}</p>
                          <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 6, background: statusMeta.bg, border: `1px solid ${statusMeta.border}`, color: statusMeta.color, fontSize: 11, fontWeight: 700 }}>
                            {entry.status}
                          </span>
                          <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 6, background: "#eff6ff", color: "#1d4ed8", fontSize: 11, fontWeight: 700 }}>
                            {entry.sourceModule}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: "#0f172a", fontWeight: 700 }}>{entry.title}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{entry.description || "No dispute details shared."}</p>
                        <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94a3b8" }}>
                          Raised by {entry.requestedByName || "System"} • {entry.requestedAtLabel || "recently"}
                        </p>
                        {isClosed && entry.resolutionNote ? (
                          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                            Resolution: {entry.resolutionNote}
                          </p>
                        ) : null}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {isClosed ? (
                          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                            {entry.resolvedByName ? `By ${entry.resolvedByName}` : "Resolved"}
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => openOverrideDialog(entry, "approve")}
                              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #bbf7d0", background: "#ecfdf3", color: "#15803d", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                            >
                              <CheckCircle2 size={12} />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => openOverrideDialog(entry, "reject")}
                              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #fecdd3", background: "#fff1f2", color: "#be123c", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                            >
                              <XCircle size={12} />
                              Reject
                            </button>
                            {!["agent_approval", "payment_verification"].includes(entry.targetType) ? (
                              <button
                                type="button"
                                onClick={() => openOverrideDialog(entry, "resolve")}
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                              >
                                <Send size={12} />
                                Resolve
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>No override or dispute cases right now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
