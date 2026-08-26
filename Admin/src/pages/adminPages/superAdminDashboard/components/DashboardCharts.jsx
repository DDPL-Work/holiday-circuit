import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BarChart3, Clock } from "lucide-react";
import {
  AnimatedBar,
  CustomTooltipGreen,
  CustomTooltipBlue,
  formatPlainNumber,
} from "../utils/dashboardHelpers";

export const DashboardCharts = ({
  agentPerformanceData = [],
  teamEfficiencyData = [],
  agentAxis,
  efficiencyAxis,
}) => {
  return (
    <div style={{ padding: "0 16px" }}>
      <div id="finance-dashboard" className="scroll-mt-5" />
      <div id="advanced-analytics" className="scroll-mt-5" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 16 }}>
        {/* Agent Performance */}
        <div
          style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}
          className="transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: "#ecfdf5", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart3 size={14} color="#059669" />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Agent Performance</p>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Revenue by Agent (in ₹)</p>
            </div>
            <span style={{ padding: "4px 8px", borderRadius: 8, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap" }}>
              +12.4% growth
            </span>
          </div>
          <div style={{ width: "100%", height: 210, marginTop: 14 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentPerformanceData} barSize={24} margin={{ top: 8, right: 6, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="agentRevenueGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                <XAxis dataKey="name" height={36} tickMargin={8} tick={{ fontSize: 10.5, fontWeight: 500, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1", strokeWidth: 1 }} tickLine={false} interval={0} />
                <YAxis width={40} tickMargin={8} domain={[0, agentAxis.max]} ticks={agentAxis.ticks} tick={{ fontSize: 10.5, fontWeight: 500, fill: "#94a3b8" }} axisLine={{ stroke: "#cbd5e1", strokeWidth: 1 }} tickLine={false} tickFormatter={formatPlainNumber} />
                <Tooltip content={<CustomTooltipGreen />} cursor={{ fill: "rgba(16,185,129,0.04)" }} />
                <Bar dataKey="revenue" fill="url(#agentRevenueGradient)" shape={<AnimatedBar />} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Efficiency */}
        <div
          style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}
          className="transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={14} color="#2563eb" />
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Team Efficiency</p>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Average time to process a quote (in hours)</p>
            </div>
            <span style={{ padding: "4px 8px", borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap" }}>
              Lower is better
            </span>
          </div>
          <div style={{ width: "100%", height: 210, marginTop: 14 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamEfficiencyData} barSize={32} margin={{ top: 8, right: 6, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="teamEfficiencyGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                <XAxis dataKey="name" height={36} tickMargin={8} tick={{ fontSize: 10.5, fontWeight: 500, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1", strokeWidth: 1 }} tickLine={false} interval={0} />
                <YAxis width={32} tickMargin={8} tick={{ fontSize: 10.5, fontWeight: 500, fill: "#94a3b8" }} axisLine={{ stroke: "#cbd5e1", strokeWidth: 1 }} tickLine={false} domain={[0, efficiencyAxis.max]} ticks={efficiencyAxis.ticks} />
                <Tooltip content={<CustomTooltipBlue />} cursor={{ fill: "rgba(37,99,235,0.04)" }} />
                <Bar dataKey="hours" fill="url(#teamEfficiencyGradient)" shape={<AnimatedBar />} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
