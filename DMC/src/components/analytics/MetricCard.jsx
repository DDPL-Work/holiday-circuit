import { motion } from "framer-motion";

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600 bg-blue-100",
    border: "border-blue-100",
    value: "text-blue-900",
  },
  green: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600 bg-emerald-100",
    border: "border-emerald-100",
    value: "text-emerald-900",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "text-orange-600 bg-orange-100",
    border: "border-orange-100",
    value: "text-orange-900",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600 bg-purple-100",
    border: "border-purple-100",
    value: "text-purple-900",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600 bg-emerald-100",
    border: "border-emerald-100",
    value: "text-emerald-900",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600 bg-amber-100",
    border: "border-amber-100",
    value: "text-amber-900",
  },
};

export default function MetricCard({ label, value, icon: Icon, color = "blue", delay = 0 }) {
  const colors = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      whileHover={{ y: -1, boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}
      className={`flex items-center gap-2.5 rounded-xl border ${colors.border} ${colors.bg} p-2.5 sm:p-3 shadow-sm transition-all h-full min-h-[62px]`}
    >
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colors.icon}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.58rem] font-bold uppercase tracking-wider text-gray-500">
          {label}
        </p>
        <p className={`mt-0.5 text-base sm:text-lg font-extrabold leading-tight ${colors.value}`}>
          {value}
        </p>
      </div>
    </motion.div>
  );
}
