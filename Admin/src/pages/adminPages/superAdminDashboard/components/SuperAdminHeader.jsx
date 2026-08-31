import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, UserPlus, Download, Shield } from "lucide-react";
import superAdminBadge from "../../../../assets/super-admin-badge.jpg";

export const SuperAdminHeader = ({
  showHeader,
  setShowHeader,
  overviewDateLabel,
  currentRoleLabel,
  openAgentDesk,
  isAgentDeskOpen,
  agentQueueLabel,
  agentQueueNote,
  pendingAgentApprovals,
}) => {
  return (
    <div style={{ background: "transparent", marginBottom: 16 }}>
      <AnimatePresence>
        {showHeader && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -30 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px 8px 16px",
              borderBottom: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 605, color: "#0f172a" }}>Super Admin Dashboard</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>{overviewDateLabel}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>Logged in as</p>
                <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{currentRoleLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowHeader(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  borderRadius: "50%",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fee2e2";
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#94a3b8";
                }}
                aria-label="Close header"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: "16px 16px 0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img
              src={superAdminBadge}
              alt="Super admin badge"
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                objectFit: "cover",
                border: "2px solid #fcd34d",
                boxShadow: "0 8px 20px rgba(245, 158, 11, 0.15)",
                background: "#fff",
              }}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: "21px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Super Admin Dashboard</h1>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                Complete oversight and control of Holiday Circuit operations
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginLeft: "auto" }}>
            <button
              type="button"
              onClick={openAgentDesk}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 38,
                minHeight: 38,
                padding: "0 14px",
                borderRadius: "10px",
                border: "none",
                background: isAgentDeskOpen
                  ? "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)"
                  : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#ffffff",
                cursor: "pointer",
                position: "relative",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
                transition: "all 0.2s ease",
              }}
              title={`${agentQueueLabel}. ${agentQueueNote}`}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserPlus size={13} color="#ffffff" />
              </span>
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: 7.5, color: "#e0e7ff", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Agent Queue</p>
                <p style={{ margin: "1px 0 0", fontSize: 11, fontWeight: 650, color: "#ffffff" }}>{pendingAgentApprovals ? `${pendingAgentApprovals} pending` : "Queue clear"}</p>
              </div>
              <span
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: "6px",
                  padding: "0 5px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9.5,
                  fontWeight: 700,
                  background: "#ef4444",
                  color: "#ffffff",
                  boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
                }}
              >
                {pendingAgentApprovals || 0}
              </span>
            </button>

            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 38,
                padding: "0 16px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
                color: "#fff",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.2)",
                transition: "all 0.2s ease",
              }}
            >
              <Download size={13} />
              Export Report
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 38,
                minHeight: 38,
                padding: "0 14px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "8px",
                  background: "#faf5ff",
                  border: "1px solid #e9d5ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={13} color="#9333ea" />
              </span>
              <div>
                <p style={{ margin: 0, fontSize: 7.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Access Level</p>
                <p style={{ margin: "1px 0 0", fontSize: 11, fontWeight: 650, color: "#7c3aed" }}>{currentRoleLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
