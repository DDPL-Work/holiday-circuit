import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  RefreshCw,
  X,
  Mail,
  Clock,
  FileText,
  Building2,
  Users,
  Phone,
  ExternalLink,
  Download,
  AlertTriangle,
} from "lucide-react";
import {
  getAgentReviewStatusMeta,
  formatDateTime,
} from "../utils/dashboardHelpers";

export const AgentApprovalDeskModal = ({
  isAgentDeskOpen,
  setIsAgentDeskOpen,
  totalAgentApprovals,
  pendingAgentApprovals,
  agentApprovalSummary,
  fetchAgentApprovals,
  agentApprovalFilter,
  setAgentApprovalFilter,
  isAgentApprovalsLoading,
  filteredAgentApprovals,
  selectedAgent,
  selectedAgentId,
  setSelectedAgentId,
  selectedAgentStatusMeta,
  setAgentRejectReason,
  setAgentRejectDialogUser,
  agentReviewActionId,
  handleAgentReview,
}) => {
  return (
    <>
      <div id="agent-approvals" className="scroll-mt-5" />
      <AnimatePresence initial={false}>
        {isAgentDeskOpen ? (
          <motion.div
            key="agent-approvals-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999,
              background: "rgba(15,23,42,0.55)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsAgentDeskOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              style={{
                width: "min(1200px, calc(100vw - 32px))",
                height: "min(680px, calc(100vh - 40px))",
                display: "flex",
                flexDirection: "column",
                borderRadius: 20,
                background: "#fff",
                border: "1px solid rgba(226,232,240,0.9)",
                borderTop: "6px solid #2563eb",
                boxShadow: "0 30px 80px rgba(15,23,42,0.28)",
                overflow: "hidden",
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  gap: 16,
                  flexWrap: "wrap",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 14, background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BadgeCheck size={18} color="#60a5fa" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#ffffff" }}>Agent Approval Queue</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                      Compliance review for KYC, GST, and business proof before portal access goes live
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                      <span style={{ padding: "4px 10px", borderRadius: 999, background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.25)", color: "#60a5fa", fontSize: 11, fontWeight: 700 }}>
                        {totalAgentApprovals} total cases
                      </span>
                      <span style={{ padding: "4px 10px", borderRadius: 999, background: pendingAgentApprovals ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)", border: pendingAgentApprovals ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid rgba(16, 185, 129, 0.25)", color: pendingAgentApprovals ? "#fca5a5" : "#34d399", fontSize: 11, fontWeight: 700 }}>
                        {pendingAgentApprovals ? `${pendingAgentApprovals} need review` : "No pending review"}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    type="button"
                    onClick={fetchAgentApprovals}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <RefreshCw size={12} /> Refresh Queue
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAgentDeskOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "#94a3b8",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16, flexShrink: 0 }}>
                  {[
                    { title: "Needs Review", value: agentApprovalSummary.pending, tone: { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" } },
                    { title: "Activated", value: agentApprovalSummary.approved, tone: { bg: "#ecfdf3", border: "#bbf7d0", color: "#15803d" } },
                    { title: "Returned", value: agentApprovalSummary.rejected, tone: { bg: "#fff1f2", border: "#fecdd3", color: "#be123c" } },
                  ].map((item) => (
                    <div key={item.title} style={{ padding: "12px 16px", borderRadius: 16, border: `1px solid ${item.tone.border}`, background: item.tone.bg }}>
                      <p style={{ margin: 0, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>{item.title}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, color: item.tone.color }}>
                        {isAgentApprovalsLoading ? "--" : item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: 16, overflow: "hidden", alignItems: "stretch" }}>
                  {/* Left list */}
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 18, background: "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
                    <div style={{ padding: 10, borderBottom: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, flexShrink: 0 }}>
                      {[{ key: "pending", label: "Pending" }, { key: "approve", label: "Approved" }, { key: "rejected", label: "Rejected" }, { key: "all", label: "All" }].map((filter) => {
                        const isActive = agentApprovalFilter === filter.key;
                        const filterGradients = {
                          pending: {
                            gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            shadow: "0 2px 8px rgba(245, 158, 11, 0.3)"
                          },
                          approve: {
                            gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            shadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
                          },
                          rejected: {
                            gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                            shadow: "0 2px 8px rgba(239, 68, 68, 0.3)"
                          },
                          all: {
                            gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                            shadow: "0 2px 8px rgba(99, 102, 241, 0.3)"
                          }
                        };
                        const styleMeta = filterGradients[filter.key] || {
                          gradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                          shadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
                        };
                        return (
                          <motion.button
                            key={filter.key}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setAgentApprovalFilter(filter.key)}
                            style={{
                              height: 26,
                              borderRadius: 999,
                              border: isActive ? "none" : "1px solid #cbd5e1",
                              background: isActive ? styleMeta.gradient : "#fff",
                              color: isActive ? "#fff" : "#475569",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              boxShadow: isActive ? styleMeta.shadow : "none",
                              transition: "all 0.2s ease",
                              textAlign: "center",
                              whiteSpace: "nowrap",
                              width: "100%",
                            }}
                          >
                            {filter.label}
                          </motion.button>
                        );
                      })}
                    </div>
                    <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: 10 }}>
                      {isAgentApprovalsLoading ? (
                        <div style={{ padding: 28, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading agent requests...</div>
                      ) : filteredAgentApprovals.length ? filteredAgentApprovals.map((agent) => {
                        const statusMeta = getAgentReviewStatusMeta(agent.status);
                        const StatusIcon = statusMeta.Icon;
                        const isSelected = selectedAgent?.id === agent.id;
                        
                        const statusColors = {
                          pending: "#d97706",
                          approve: "#16a34a",
                          rejected: "#ef4444",
                        };
                        const statusBgColors = {
                          pending: "#fffbeb",
                          approve: "#f0fdf4",
                          rejected: "#fff1f2",
                        };
                        const statusUnselectedBorderColors = {
                          pending: "#fcd34d",
                          approve: "#bbf7d0",
                          rejected: "#fecdd3",
                        };
                        
                        const activeColor = statusColors[agent.status] || "#d97706";
                        const activeBgColor = statusBgColors[agent.status] || "#fffbeb";
                        const inactiveBorderColor = statusUnselectedBorderColors[agent.status] || "#cbd5e1";
                        
                        return (
                          <motion.div
                            key={agent.id}
                            whileHover={{ y: -1 }}
                            onClick={() => setSelectedAgentId(agent.id)}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: 12,
                              borderRadius: 16,
                              border: `1px solid ${isSelected ? activeColor : inactiveBorderColor}`,
                              background: isSelected ? activeBgColor : "#fff",
                              cursor: "pointer",
                              marginBottom: 8,
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 12,
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", height: 20, marginTop: 2, flexShrink: 0 }}>
                              <motion.div
                                animate={{
                                  backgroundColor: isSelected ? activeColor : "#ffffff",
                                  borderColor: isSelected ? activeColor : inactiveBorderColor,
                                  scale: isSelected ? [1, 1.15, 1] : 1
                                }}
                                transition={{ duration: 0.2 }}
                                style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: 6,
                                  border: "2px solid",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAgentId(agent.id);
                                }}
                              >
                                {isSelected && (
                                  <motion.svg
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    width="11"
                                    height="9"
                                    viewBox="0 0 11 9"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <motion.path
                                      d="M1.5 4.5L4 7L9.5 1.5"
                                      stroke="#ffffff"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      initial={{ pathLength: 0 }}
                                      animate={{ pathLength: 1 }}
                                      transition={{ duration: 0.2, ease: "easeOut" }}
                                    />
                                  </motion.svg>
                                )}
                              </motion.div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
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
                            </div>
                          </motion.div>
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
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 20, background: "#fff", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {selectedAgent ? (
                      <>
                        <div style={{ padding: "10px 16px", borderBottom: "1px solid #eef2ff", background: "#f8fbff", flexShrink: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <Building2 size={13} color="#2563eb" />
                                </div>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, border: `1px solid ${selectedAgentStatusMeta.borderColor}`, background: selectedAgentStatusMeta.background, color: selectedAgentStatusMeta.textColor }}>
                                  <selectedAgentStatusMeta.Icon size={11} />
                                  <span style={{ fontSize: 9.5, fontWeight: 700 }}>{selectedAgentStatusMeta.label}</span>
                                </div>
                              </div>
                              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedAgent.companyName || "Agency registration"}</p>
                              <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748b", lineHeight: 1.4, maxWidth: 480, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                Review the submitted KYC pack, validate GST and contact details, then decide whether this agency can enter the Holiday Circuit workspace.
                              </p>
                            </div>
                            <div style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", minWidth: 140, flexShrink: 0 }}>
                              <p style={{ margin: 0, fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Submitted</p>
                              <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{formatDateTime(selectedAgent.submittedAt)}</p>
                              <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748b" }}>Reviewed by {selectedAgent.reviewedBy || "Awaiting admin"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: 18 }}>
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
                              <span style={{ padding: "5px 10px", borderRadius: 999, background: "#fff", border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600, color: "#0f172a", flexShrink: 0 }}>
                                {selectedAgent.documents?.length || 0} files
                              </span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                              {(selectedAgent.documents || []).length ? (selectedAgent.documents || []).map((document) => (
                                <div key={document.id} style={{ padding: 14, borderRadius: 16, border: "1px solid #dbeafe", background: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <FileText size={14} color="#1d4ed8" />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{document.label}</p>
                                      <p style={{ margin: "3px 0 0", fontSize: 10, color: "#64748b" }}>Click to verify uploaded proof</p>
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                    <a
                                      href={document.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 5,
                                        height: 26,
                                        padding: "0 12px",
                                        borderRadius: 999,
                                        border: "1px solid #bfdbfe",
                                        background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                                        color: "#1d4ed8",
                                        textDecoration: "none",
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        transition: "all 0.2s ease"
                                      }}
                                    >
                                      <ExternalLink size={11} /> Open
                                    </a>
                                    <a
                                      href={document.url}
                                      download
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 5,
                                        height: 26,
                                        padding: "0 12px",
                                        borderRadius: 999,
                                        border: "1px solid #bbf7d0",
                                        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                                        color: "#15803d",
                                        textDecoration: "none",
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        transition: "all 0.2s ease"
                                      }}
                                    >
                                      <Download size={11} /> Download
                                    </a>
                                  </div>
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
                                style={{ height: 32, minHeight: 32, minWidth: 140, padding: "0 20px", borderRadius: 999, border: "1px solid #fecaca", background: agentReviewActionId === selectedAgent.id || selectedAgent.status !== "pending" ? "#fee2e2" : "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", color: "#be123c", fontSize: 12, fontWeight: 700, cursor: agentReviewActionId === selectedAgent.id || selectedAgent.status !== "pending" ? "not-allowed" : "pointer", opacity: agentReviewActionId === selectedAgent.id || selectedAgent.status !== "pending" ? 0.6 : 1, transition: "all 0.2s ease" }}
                              >
                                Reject with Reason
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAgentReview(selectedAgent, "approve")}
                                disabled={agentReviewActionId === selectedAgent.id || selectedAgent.status !== "pending"}
                                style={{ height: 32, minHeight: 32, minWidth: 140, padding: "0 20px", borderRadius: 999, border: "none", background: agentReviewActionId === selectedAgent.id ? "#bbf7d0" : selectedAgent.status !== "pending" ? "#cbd5e1" : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: agentReviewActionId === selectedAgent.id || selectedAgent.status !== "pending" ? "not-allowed" : "pointer", opacity: selectedAgent.status !== "pending" ? 0.7 : 1, transition: "all 0.2s ease" }}
                              >
                                {agentReviewActionId === selectedAgent.id ? "Updating..." : "Approve Agent"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
