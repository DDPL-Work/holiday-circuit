import {
  FileQuestionMark,
  Clock,
  CalendarCheck,
  CalendarClock,
} from "lucide-react";
import AnalyticsCard from "./AnalyticsCard";

export default function PerformanceAnalytics({
  dashboard,
  loadingDashboard,
  onQueryFilterChange,
}) {
  const formatNumber = (value) => Math.round(Number(value || 0)).toLocaleString("en-IN");

  const queryMetrics = [
    {
      label: "Past Queries",
      value: loadingDashboard ? "..." : formatNumber(dashboard?.summary?.pastQueries),
      icon: Clock,
      color: "blue",
    },
    {
      label: "Present Queries",
      value: loadingDashboard ? "..." : formatNumber(dashboard?.summary?.presentQueries ?? dashboard?.summary?.totalQueries),
      icon: CalendarCheck,
      color: "green",
    },
    {
      label: "Future Queries",
      value: loadingDashboard ? "..." : formatNumber(dashboard?.summary?.futureQueries),
      icon: CalendarClock,
      color: "orange",
    },
  ];

  return (
    <div className="flex flex-col relative z-10 overflow-visible h-full">
      {/* Query Analytics */}
      <AnalyticsCard
        title="Query Analytics"
        subtitle="Track query performance"
        headerIcon={FileQuestionMark}
        accentGradient="linear-gradient(135deg, rgba(219, 234, 254, 0.6) 0%, rgba(238, 242, 255, 0.8) 100%)"
        accentColor="#4f46e5"
        metrics={queryMetrics}
        baseZIndex="z-20"
        onFilterChange={onQueryFilterChange}
        className="h-full flex-1"
      />
    </div>
  );
}
