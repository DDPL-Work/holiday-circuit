import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  statCardMeta,
  statCardToneMap,
  statCardStyles,
} from "../utils/dashboardHelpers";

export const StatCardsGrid = ({ statCards = [], isDashboardLoading = false }) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginTop: 28, padding: "0 16px" }}>
      {statCards.map((s) => {
        const meta = statCardMeta[s.iconKey] || statCardMeta.users;
        const tone = statCardToneMap[s.iconKey] || statCardToneMap.users;
        const style = statCardStyles[s.iconKey] || statCardStyles.users;
        const Icon = meta.icon;
        return (
          <motion.div
            key={s.label}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            style={{
              background: style.gradient,
              border: `1px solid ${style.borderColor}`,
              borderBottom: style.borderBottom,
              borderRadius: 20,
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 125,
              boxShadow: style.shadow,
              cursor: "default",
            }}
            className="transition-all duration-300 hover:shadow-lg"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: meta.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <Icon size={18} color={meta.iconColor} />
                </span>
                <span
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#64748b",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {s.label}
                </span>
              </div>
              {s.sub ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 8,
                    border: `1px solid ${tone.badgeBorder}`,
                    background: tone.badgeBg,
                    color: tone.badgeText,
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={11} />
                  {s.sub}
                </span>
              ) : null}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", marginTop: 12 }}>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                {isDashboardLoading ? "--" : s.value}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
