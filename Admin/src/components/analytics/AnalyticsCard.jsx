import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TimeFilters from "./TimeFilters";
import MetricCard from "./MetricCard";

const now = new Date();
const currentWeekIndex = Math.floor((now.getDate() - 1) / 7);

const defaultFilters = {
  timeRange: "weekly",
  selectedYear: now.getFullYear(),
  selectedMonth: now.getMonth(),
  selectedWeek: currentWeekIndex,
};

export default function AnalyticsCard({
  title,
  subtitle,
  metrics,
  accentGradient,
  accentColor,
  headerIcon: HeaderIcon,
  baseZIndex = "z-10",
  onFilterChange,
  className = "",
}) {
  const [filters, setFilters] = useState(defaultFilters);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(defaultFilters);
    }
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex flex-col rounded-[18px] border border-gray-100 bg-white shadow-sm transition-all duration-200 overflow-visible relative ${
        isPickerOpen ? "z-40 shadow-md" : baseZIndex
      } ${className}`}
    >
      {/* Header */}
      <div
        className="rounded-t-[18px] px-2.5 py-1.5 overflow-hidden"
        style={{ background: accentGradient }}
      >
        <div className="flex items-center gap-2">
          {HeaderIcon && (
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 shadow-sm">
              <HeaderIcon className="h-3.5 w-3.5 text-gray-700" />
            </div>
          )}
          <div>
            <h3 className="text-[0.78rem] font-bold text-gray-900 leading-tight">{title}</h3>
            <p className="text-[0.58rem] text-gray-500 leading-tight">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Filters bar - overflow visible so dropdown popovers float out smoothly */}
      <div className="border-b border-gray-100 bg-gray-50/60 px-2.5 py-1 overflow-visible relative z-20">
        <TimeFilters
          filters={filters}
          onChange={handleFilterChange}
          accentColor={accentColor}
          onOpenChange={setIsPickerOpen}
        />
      </div>

      {/* Metrics */}
      <div className={`flex-1 grid grid-cols-1 gap-2 p-2.5 ${metrics.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"} rounded-b-[18px] items-stretch`}>
        {metrics.map((metric, idx) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
            delay={idx * 0.06}
          />
        ))}
      </div>
    </motion.div>
  );
}
