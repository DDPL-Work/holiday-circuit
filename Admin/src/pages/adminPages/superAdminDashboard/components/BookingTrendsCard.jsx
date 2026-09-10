import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  BookOpen,
  Maximize2,
  Activity,
} from "lucide-react";
import { formatPlainNumber } from "../utils/dashboardHelpers";

export const BookingTrendsCard = ({
  bookingTrends,
  isLoading = false,
  onOpenDetails,
}) => {
  const [viewMode, setViewMode] = useState("monthly"); // "monthly" | "quarterly"
  const [metricType, setMetricType] = useState("volume"); // "volume" | "revenue"

  const monthlyComparison = bookingTrends?.monthlyComparison || {
    currentMonthLabel: "Current Month",
    lastYearSameMonthLabel: "Last Year Same Month",
    currentMonthBookings: 0,
    lastYearSameMonthBookings: 0,
    currentMonthRevenue: 0,
    lastYearSameMonthRevenue: 0,
    growthPercent: 0,
    momGrowthPercent: 0,
    revenueGrowthPercent: 0,
    trend: "neutral",
  };

  const quarterlyComparison = bookingTrends?.quarterlyComparison || {
    currentQuarterLabel: "Current Quarter",
    lastYearSameQuarterLabel: "Last Year Same Quarter",
    currentQuarterBookings: 0,
    lastYearSameQuarterBookings: 0,
    currentQuarterRevenue: 0,
    lastYearSameQuarterRevenue: 0,
    growthPercent: 0,
    qoqGrowthPercent: 0,
    revenueGrowthPercent: 0,
    trend: "neutral",
  };

  const monthlyTrendData = bookingTrends?.monthlyTrendData || [];
  const quarterlyTrendData = bookingTrends?.quarterlyTrendData || [];

  const isMonthly = viewMode === "monthly";
  const activeComparison = isMonthly ? monthlyComparison : quarterlyComparison;
  const rawChartData = isMonthly ? monthlyTrendData : quarterlyTrendData;

  const chartData = rawChartData.map((item) => ({
    name: item.month || item.quarter || item.label,
    fullLabel: item.fullLabel || item.label,
    current: metricType === "volume" ? (item.thisYear || 0) : (item.thisYearRevenue || 0),
    previous: metricType === "volume" ? (item.lastYear || 0) : (item.lastYearRevenue || 0),
    growth: metricType === "volume" ? item.growthPercent : item.revenueGrowthPercent,
    isCurrent: Boolean(item.isCurrentMonth || item.isCurrentQuarter),
  }));

  const currentVal = metricType === "volume"
    ? (isMonthly ? monthlyComparison.currentMonthBookings : quarterlyComparison.currentQuarterBookings)
    : (isMonthly ? monthlyComparison.currentMonthRevenue : quarterlyComparison.currentQuarterRevenue);

  const previousVal = metricType === "volume"
    ? (isMonthly ? monthlyComparison.lastYearSameMonthBookings : quarterlyComparison.lastYearSameQuarterBookings)
    : (isMonthly ? monthlyComparison.lastYearSameMonthRevenue : quarterlyComparison.lastYearSameQuarterRevenue);

  const growthPercent = metricType === "volume"
    ? activeComparison.growthPercent
    : activeComparison.revenueGrowthPercent;

  const secondaryGrowthPercent = isMonthly
    ? activeComparison.momGrowthPercent
    : activeComparison.qoqGrowthPercent;

  const isGrowthPositive = (growthPercent || 0) >= 0;

  const formatDisplayValue = (val) => {
    if (metricType === "revenue") {
      return `₹${Number(val || 0).toLocaleString("en-IN")}`;
    }
    return Number(val || 0).toLocaleString("en-IN");
  };

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const currentItem = payload.find((p) => p.dataKey === "current");
      const previousItem = payload.find((p) => p.dataKey === "previous");
      const currentValNum = currentItem?.value || 0;
      const previousValNum = previousItem?.value || 0;
      const diff = currentValNum - previousValNum;
      const diffPct = previousValNum === 0 ? (currentValNum > 0 ? 100 : 0) : Number((((diff) / previousValNum) * 100).toFixed(1));

      return (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(6px)",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "12px 16px",
            fontSize: 12,
            boxShadow: "0 15px 30px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            minWidth: 190,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{label}</p>
            <span
              style={{
                padding: "2px 6px",
                borderRadius: 4,
                background: diffPct >= 0 ? "#ecfdf5" : "#fef2f2",
                color: diffPct >= 0 ? "#15803d" : "#dc2626",
                fontSize: 10.5,
                fontWeight: 700,
              }}
            >
              {diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`} YoY
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
                This Year:
              </span>
              <strong style={{ color: "#0f172a" }}>
                {metricType === "revenue" ? `₹${Number(currentValNum).toLocaleString("en-IN")}` : currentValNum}
              </strong>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8" }} />
                Last Year (Same):
              </span>
              <strong style={{ color: "#64748b" }}>
                {metricType === "revenue" ? `₹${Number(previousValNum).toLocaleString("en-IN")}` : previousValNum}
              </strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: "0 16px", marginTop: 20 }}>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          overflow: "hidden",
          transition: "all 0.3s ease",
        }}
        className="hover:shadow-[0_10px_28px_rgba(0,0,0,0.05)]"
      >
        {/* Header - Agent Matching Styling with Gradient & Icon */}
        <div
          style={{
            padding: "14px 18px",
            background: "linear-gradient(135deg, rgba(239, 246, 255, 0.7) 0%, rgba(240, 253, 244, 0.6) 50%, #ffffff 100%)",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)",
              }}
            >
              <Activity size={17} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                  Booking Trends (Last Year Same Month & Same Quarter)
                </h3>
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: isGrowthPositive ? "#ecfdf5" : "#fef2f2",
                    border: isGrowthPositive ? "1px solid #a7f3d0" : "1px solid #fecaca",
                    color: isGrowthPositive ? "#047857" : "#dc2626",
                    fontSize: 10.5,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {isGrowthPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {growthPercent > 0 ? `+${growthPercent}%` : `${growthPercent}%`} YoY
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748b" }}>
                Compare current period conversion and booking momentum with previous year identical timeframes
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* View Mode Switcher (Monthly vs Quarterly) */}
            <div
              style={{
                display: "inline-flex",
                background: "#f1f5f9",
                padding: 3,
                borderRadius: 10,
                border: "1px solid #e2e8f0",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("monthly")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: viewMode === "monthly" ? "#ffffff" : "transparent",
                  color: viewMode === "monthly" ? "#1d4ed8" : "#64748b",
                  fontWeight: viewMode === "monthly" ? 700 : 500,
                  fontSize: 11.5,
                  cursor: "pointer",
                  boxShadow: viewMode === "monthly" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s ease",
                }}
              >
                <Calendar size={13} />
                Same Month (YoY)
              </button>
              <button
                type="button"
                onClick={() => setViewMode("quarterly")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: viewMode === "quarterly" ? "#ffffff" : "transparent",
                  color: viewMode === "quarterly" ? "#1d4ed8" : "#64748b",
                  fontWeight: viewMode === "quarterly" ? 700 : 500,
                  fontSize: 11.5,
                  cursor: "pointer",
                  boxShadow: viewMode === "quarterly" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s ease",
                }}
              >
                <Layers size={13} />
                Same Quarter (YoY)
              </button>
            </div>

            {/* Metric Switcher (Volume vs Revenue) */}
            <div
              style={{
                display: "inline-flex",
                background: "#f1f5f9",
                padding: 3,
                borderRadius: 10,
                border: "1px solid #e2e8f0",
              }}
            >
              <button
                type="button"
                onClick={() => setMetricType("volume")}
                style={{
                  padding: "5px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: metricType === "volume" ? "#ffffff" : "transparent",
                  color: metricType === "volume" ? "#0f172a" : "#64748b",
                  fontWeight: metricType === "volume" ? 700 : 500,
                  fontSize: 11.5,
                  cursor: "pointer",
                  boxShadow: metricType === "volume" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                Bookings
              </button>
              <button
                type="button"
                onClick={() => setMetricType("revenue")}
                style={{
                  padding: "5px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: metricType === "revenue" ? "#ffffff" : "transparent",
                  color: metricType === "revenue" ? "#0f172a" : "#64748b",
                  fontWeight: metricType === "revenue" ? 700 : 500,
                  fontSize: 11.5,
                  cursor: "pointer",
                  boxShadow: metricType === "revenue" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                Revenue
              </button>
            </div>

            {/* Detailed Modal Trigger Button */}
            {onOpenDetails ? (
              <button
                type="button"
                onClick={onOpenDetails}
                style={{
                  padding: "6px 12px",
                  borderRadius: 10,
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  fontWeight: 700,
                  fontSize: 11.5,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  transition: "all 0.2s",
                }}
                className="hover:bg-blue-100"
              >
                <Maximize2 size={13} />
                Breakdown Table
              </button>
            ) : null}
          </div>
        </div>

        {/* 4 Mini Highlight KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            padding: "14px 18px 6px",
            background: "#ffffff",
          }}
        >
          {/* Card 1: Current Period */}
          <div
            style={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, rgba(239, 246, 255, 0.5) 0%, #ffffff 100%)",
              padding: "10px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {isMonthly ? monthlyComparison.currentMonthLabel : quarterlyComparison.currentQuarterLabel}
              </span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 19, fontWeight: 800, color: "#0f172a" }}>
                {isLoading ? "..." : formatDisplayValue(currentVal)}
              </span>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                {metricType === "volume" ? "active bookings" : "volume"}
              </span>
            </div>
          </div>

          {/* Card 2: Last Year Same Period */}
          <div
            style={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, rgba(241, 245, 249, 0.5) 0%, #ffffff 100%)",
              padding: "10px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {isMonthly ? monthlyComparison.lastYearSameMonthLabel : quarterlyComparison.lastYearSameQuarterLabel}
              </span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8" }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 19, fontWeight: 800, color: "#475569" }}>
                {isLoading ? "..." : formatDisplayValue(previousVal)}
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>baseline last year</span>
            </div>
          </div>

          {/* Card 3: YoY Growth */}
          <div
            style={{
              borderRadius: 8,
              border: isGrowthPositive ? "1px solid #bbf7d0" : "1px solid #fecaca",
              background: isGrowthPositive
                ? "linear-gradient(135deg, rgba(236, 253, 245, 0.6) 0%, #ffffff 100%)"
                : "linear-gradient(135deg, rgba(254, 242, 242, 0.6) 0%, #ffffff 100%)",
              padding: "10px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {isMonthly ? "YoY Same Month Growth" : "YoY Same Quarter Growth"}
              </span>
              {isGrowthPositive ? <TrendingUp size={14} color="#15803d" /> : <TrendingDown size={14} color="#dc2626" />}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  color: isGrowthPositive ? "#15803d" : "#dc2626",
                }}
              >
                {isLoading ? "..." : (growthPercent > 0 ? `+${growthPercent}%` : `${growthPercent}%`)}
              </span>
              <span style={{ fontSize: 11, color: isGrowthPositive ? "#15803d" : "#dc2626", fontWeight: 600 }}>
                {isGrowthPositive ? "positive trajectory" : "downward variance"}
              </span>
            </div>
          </div>

          {/* Card 4: MoM / QoQ Sequential Change */}
          <div
            style={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, #ffffff 100%)",
              padding: "10px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {isMonthly ? "Sequential (MoM)" : "Sequential (QoQ)"}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>
                vs {isMonthly ? monthlyComparison.previousMonthLabel : quarterlyComparison.previousQuarterLabel}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  color: (secondaryGrowthPercent || 0) >= 0 ? "#1d4ed8" : "#e11d48",
                }}
              >
                {isLoading ? "..." : (secondaryGrowthPercent > 0 ? `+${secondaryGrowthPercent}%` : `${secondaryGrowthPercent}%`)}
              </span>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                {isMonthly ? "vs previous month" : "vs previous quarter"}
              </span>
            </div>
          </div>
        </div>

        {/* Recharts Dual-Bar Comparison Graph */}
        <div style={{ padding: "10px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
              {isMonthly ? "12-Month Comparison (This Year vs Last Year Same Month)" : "4-Quarter Comparison (This Year vs Last Year Same Quarter)"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, fontWeight: 600 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#1e293b" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#2563eb" }} />
                This Year (Current)
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#cbd5e1" }} />
                Last Year (Same Period)
              </span>
            </div>
          </div>

          <div style={{ width: "100%", height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 4 }}
                barGap={4}
              >
                <defs>
                  <linearGradient id="currentYearTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="lastYearTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#94a3b8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10.5, fontWeight: 500, fill: "#94a3b8" }}
                  axisLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                  tickLine={false}
                  tickFormatter={metricType === "revenue" ? formatPlainNumber : undefined}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "rgba(37,99,235,0.03)" }} />
                <Bar
                  dataKey="current"
                  name="This Year"
                  fill="url(#currentYearTrendGradient)"
                  radius={[6, 6, 0, 0]}
                  barSize={isMonthly ? 18 : 36}
                />
                <Bar
                  dataKey="previous"
                  name="Last Year"
                  fill="url(#lastYearTrendGradient)"
                  radius={[6, 6, 0, 0]}
                  barSize={isMonthly ? 18 : 36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
