import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  BookOpen,
  CheckCircle2,
  X,
} from "lucide-react";

export const BookingTrendsModal = ({
  isOpen,
  onClose,
  bookingTrends,
}) => {
  if (!isOpen || !bookingTrends) return null;

  const [activeTab, setActiveTab] = useState("monthly"); // "monthly" | "quarterly"

  const { monthlyComparison, quarterlyComparison, monthlyTrendData = [], quarterlyTrendData = [] } = bookingTrends;

  const totalThisYearMonthly = monthlyTrendData.reduce((sum, item) => sum + (item.thisYear || 0), 0);
  const totalLastYearMonthly = monthlyTrendData.reduce((sum, item) => sum + (item.lastYear || 0), 0);
  const totalThisYearRevenue = monthlyTrendData.reduce((sum, item) => sum + (item.thisYearRevenue || 0), 0);
  const totalLastYearRevenue = monthlyTrendData.reduce((sum, item) => sum + (item.lastYearRevenue || 0), 0);

  const overallGrowth = totalLastYearMonthly === 0
    ? (totalThisYearMonthly > 0 ? 100 : 0)
    : Number((((totalThisYearMonthly - totalLastYearMonthly) / totalLastYearMonthly) * 100).toFixed(1));

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  return (
    <motion.div
      key="booking-trends-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 20px",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{
          width: "min(1180px, calc(100vw - 32px))",
          maxHeight: "90vh",
          borderRadius: 12,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header - Matching Create Package Modal Header */}
        <div
          style={{
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563eb",
                flexShrink: 0,
              }}
            >
              <TrendingUp size={18} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                  Booking Trends & YoY Analysis
                </h3>
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    color: "#047857",
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}
                >
                  Super Admin View
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748b" }}>
                Comprehensive comparison with Last Year Same Month and Same Quarter
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
              transition: "all 0.15s",
            }}
            className="hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={16} />
          </button>
        </div>

        {/* Top KPI Cards & Tab Switcher Bar */}
        <div style={{ padding: "14px 20px 0", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          {/* Top metric pills */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                }}
              >
                <BookOpen size={16} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#64748b" }}>Total Bookings (YTD)</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{totalThisYearMonthly}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>vs {totalLastYearMonthly} (LY)</span>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#059669",
                }}
              >
                <IndianRupee size={16} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#64748b" }}>Booking Revenue (YTD)</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{formatINR(totalThisYearRevenue)}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: overallGrowth >= 0 ? "#ecfdf5" : "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: overallGrowth >= 0 ? "#059669" : "#dc2626",
                }}
              >
                {overallGrowth >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#64748b" }}>YoY Volume Growth</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: overallGrowth >= 0 ? "#059669" : "#dc2626",
                    }}
                  >
                    {overallGrowth > 0 ? `+${overallGrowth}%` : `${overallGrowth}%`}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>vs last year</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation - Matching Create Package Modal Tab Style */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              type="button"
              onClick={() => setActiveTab("monthly")}
              style={{
                padding: "8px 14px",
                borderRadius: "6px 6px 0 0",
                border: "1px solid",
                borderColor: activeTab === "monthly" ? "#e2e8f0 #e2e8f0 #ffffff" : "transparent",
                borderTop: activeTab === "monthly" ? "2px solid #2563eb" : "2px solid transparent",
                background: activeTab === "monthly" ? "#ffffff" : "transparent",
                fontWeight: activeTab === "monthly" ? 700 : 600,
                fontSize: 12.5,
                color: activeTab === "monthly" ? "#2563eb" : "#64748b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                position: "relative",
                bottom: -1,
              }}
            >
              <Calendar size={14} />
              Month-by-Month (YoY Same Month)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("quarterly")}
              style={{
                padding: "8px 14px",
                borderRadius: "6px 6px 0 0",
                border: "1px solid",
                borderColor: activeTab === "quarterly" ? "#e2e8f0 #e2e8f0 #ffffff" : "transparent",
                borderTop: activeTab === "quarterly" ? "2px solid #2563eb" : "2px solid transparent",
                background: activeTab === "quarterly" ? "#ffffff" : "transparent",
                fontWeight: activeTab === "quarterly" ? 700 : 600,
                fontSize: 12.5,
                color: activeTab === "quarterly" ? "#2563eb" : "#64748b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                position: "relative",
                bottom: -1,
              }}
            >
              <Layers size={14} />
              Quarter-by-Quarter (YoY Same Quarter)
            </button>
          </div>
        </div>

        {/* Modal Body / Wide Table Content */}
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
          {activeTab === "monthly" ? (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    Monthly Comparison Breakdown (12 Months)
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748b" }}>
                    Compare each month's bookings & revenue against the same month of the previous year
                  </p>
                </div>
                <div
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#1d4ed8",
                  }}
                >
                  Active: {monthlyComparison?.currentMonthLabel || "This Month"} ({monthlyComparison?.growthPercent > 0 ? `+${monthlyComparison.growthPercent}%` : `${monthlyComparison?.growthPercent}%`} YoY)
                </div>
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700 }}>
                      <th style={{ padding: "9px 12px" }}>Month</th>
                      <th style={{ padding: "9px 12px" }}>This Year Bookings</th>
                      <th style={{ padding: "9px 12px" }}>Last Year Same Month</th>
                      <th style={{ padding: "9px 12px" }}>YoY Volume Change</th>
                      <th style={{ padding: "9px 12px" }}>This Year Revenue</th>
                      <th style={{ padding: "9px 12px" }}>Last Year Revenue</th>
                      <th style={{ padding: "9px 12px", textAlign: "right" }}>Growth Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyTrendData.map((row) => {
                      const isUp = row.growthPercent >= 0;
                      const diff = (row.thisYear || 0) - (row.lastYear || 0);
                      return (
                        <tr
                          key={row.month}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            background: row.isCurrentMonth ? "#f0fdf4" : "transparent",
                          }}
                        >
                          <td style={{ padding: "9px 12px", fontWeight: 700, color: "#0f172a" }}>
                            {row.month}
                            {row.isCurrentMonth ? (
                              <span
                                style={{
                                  marginLeft: 6,
                                  padding: "2px 5px",
                                  borderRadius: 4,
                                  background: "#dcfce7",
                                  color: "#15803d",
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                }}
                              >
                                CURRENT
                              </span>
                            ) : null}
                          </td>
                          <td style={{ padding: "9px 12px", fontWeight: 700, color: "#1e293b" }}>
                            {row.thisYear}
                          </td>
                          <td style={{ padding: "9px 12px", color: "#64748b" }}>
                            {row.lastYear}
                          </td>
                          <td style={{ padding: "9px 12px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 2,
                                fontWeight: 700,
                                color: isUp ? "#15803d" : "#dc2626",
                              }}
                            >
                              {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                              {diff >= 0 ? `+${diff}` : `${diff}`} ({row.growthPercent > 0 ? `+${row.growthPercent}%` : `${row.growthPercent}%`})
                            </span>
                          </td>
                          <td style={{ padding: "9px 12px", fontWeight: 600, color: "#0f172a" }}>
                            {formatINR(row.thisYearRevenue)}
                          </td>
                          <td style={{ padding: "9px 12px", color: "#64748b" }}>
                            {formatINR(row.lastYearRevenue)}
                          </td>
                          <td style={{ padding: "9px 12px", textAlign: "right" }}>
                            <span
                              style={{
                                padding: "2px 7px",
                                borderRadius: 4,
                                background: isUp ? "#ecfdf5" : "#fef2f2",
                                border: isUp ? "1px solid #bbf7d0" : "1px solid #fecaca",
                                color: isUp ? "#15803d" : "#dc2626",
                                fontSize: 10.5,
                                fontWeight: 700,
                              }}
                            >
                              {isUp ? "Growing" : "Declining"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    Quarterly Comparison Breakdown
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748b" }}>
                    Compare performance across Q1, Q2, Q3, Q4 against the same quarter last year
                  </p>
                </div>
                <div
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#1d4ed8",
                  }}
                >
                  Active: {quarterlyComparison?.currentQuarterLabel || "This Quarter"} ({quarterlyComparison?.growthPercent > 0 ? `+${quarterlyComparison.growthPercent}%` : `${quarterlyComparison?.growthPercent}%`} YoY)
                </div>
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700 }}>
                      <th style={{ padding: "9px 12px" }}>Quarter</th>
                      <th style={{ padding: "9px 12px" }}>This Year Bookings</th>
                      <th style={{ padding: "9px 12px" }}>Last Year Same Quarter</th>
                      <th style={{ padding: "9px 12px" }}>YoY Volume Change</th>
                      <th style={{ padding: "9px 12px" }}>This Year Revenue</th>
                      <th style={{ padding: "9px 12px" }}>Last Year Revenue</th>
                      <th style={{ padding: "9px 12px", textAlign: "right" }}>Growth Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarterlyTrendData.map((row) => {
                      const isUp = row.growthPercent >= 0;
                      const diff = (row.thisYear || 0) - (row.lastYear || 0);
                      return (
                        <tr
                          key={row.quarter}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            background: row.isCurrentQuarter ? "#eff6ff" : "transparent",
                          }}
                        >
                          <td style={{ padding: "9px 12px", fontWeight: 700, color: "#0f172a" }}>
                            {row.label}
                            {row.isCurrentQuarter ? (
                              <span
                                style={{
                                  marginLeft: 6,
                                  padding: "2px 5px",
                                  borderRadius: 4,
                                  background: "#dbeafe",
                                  color: "#1d4ed8",
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                }}
                              >
                                ACTIVE
                              </span>
                            ) : null}
                          </td>
                          <td style={{ padding: "9px 12px", fontWeight: 700, color: "#1e293b" }}>
                            {row.thisYear}
                          </td>
                          <td style={{ padding: "9px 12px", color: "#64748b" }}>
                            {row.lastYear}
                          </td>
                          <td style={{ padding: "9px 12px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 2,
                                fontWeight: 700,
                                color: isUp ? "#15803d" : "#dc2626",
                              }}
                            >
                              {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                              {diff >= 0 ? `+${diff}` : `${diff}`} ({row.growthPercent > 0 ? `+${row.growthPercent}%` : `${row.growthPercent}%`})
                            </span>
                          </td>
                          <td style={{ padding: "9px 12px", fontWeight: 600, color: "#0f172a" }}>
                            {formatINR(row.thisYearRevenue)}
                          </td>
                          <td style={{ padding: "9px 12px", color: "#64748b" }}>
                            {formatINR(row.lastYearRevenue)}
                          </td>
                          <td style={{ padding: "9px 12px", textAlign: "right" }}>
                            <span
                              style={{
                                padding: "2px 7px",
                                borderRadius: 4,
                                background: isUp ? "#ecfdf5" : "#fef2f2",
                                border: isUp ? "1px solid #bbf7d0" : "1px solid #fecaca",
                                color: isUp ? "#15803d" : "#dc2626",
                                fontSize: 10.5,
                                fontWeight: 700,
                              }}
                            >
                              {isUp ? "Growing" : "Declining"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <p style={{ margin: 0, fontSize: 11.5, color: "#64748b" }}>
            Data synchronized automatically with live Booking & Quotation records
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 34,
              padding: "0 16px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#0f172a",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            className="hover:bg-slate-100"
          >
            Close Breakdown
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
