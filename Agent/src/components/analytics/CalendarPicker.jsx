import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getWeeksInMonth(year, monthIndex) {
  const safeYear = year || new Date().getFullYear();
  const safeMonth = monthIndex !== undefined ? monthIndex : new Date().getMonth();
  const monthShort = MONTHS_SHORT[safeMonth];
  const lastDay = new Date(safeYear, safeMonth + 1, 0).getDate();
  const weeks = [];
  let weekNum = 1;

  for (let day = 1; day <= lastDay; day += 7) {
    const end = Math.min(day + 6, lastDay);
    weeks.push({
      weekNum,
      label: `Week ${weekNum}`,
      rangeStr: `${day} ${monthShort} - ${end} ${monthShort}`,
      fullText: `Week ${weekNum} (${day} ${monthShort} - ${end} ${monthShort})`,
      start: day,
      end,
    });
    weekNum++;
  }
  return weeks;
}

// -------------------------------------------------------------
// 1. Month Calendar Picker Grid (with Year Navigation Arrows)
// -------------------------------------------------------------
function MonthCalendarGrid({
  selectedMonth,
  selectedYear,
  onSelect,
  accentColor = "#4f46e5",
}) {
  const currentActualYear = new Date().getFullYear();
  const [navYear, setNavYear] = useState(selectedYear || currentActualYear);

  useEffect(() => {
    if (selectedYear) {
      setNavYear(selectedYear);
    }
  }, [selectedYear]);

  return (
    <div className="w-[240px] p-2 select-none">
      {/* Year Navigation Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setNavYear((y) => y - 1)}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors flex items-center gap-0.5 text-[0.65rem] font-bold"
          title="Previous Year"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>{navYear - 1}</span>
        </button>

        <div className="text-[0.82rem] font-extrabold text-gray-900 px-2.5 py-0.5 rounded-md bg-indigo-50/80 text-indigo-700">
          {navYear}
        </div>

        <button
          type="button"
          onClick={() => setNavYear((y) => y + 1)}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors flex items-center gap-0.5 text-[0.65rem] font-bold"
          title="Next Year"
        >
          <span>{navYear + 1}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 12 Months Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {MONTHS_SHORT.map((m, i) => {
          const isSelected = selectedMonth === i && selectedYear === navYear;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onSelect(i, navYear)}
              className={`rounded-lg px-2 py-2 text-[0.7rem] font-bold transition-all ${
                isSelected
                  ? "text-white shadow-md scale-105"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
              style={isSelected ? { background: accentColor } : undefined}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. Year Calendar Picker Grid (with Decade Navigation)
// -------------------------------------------------------------
function YearCalendarGrid({
  selectedYear,
  onSelect,
  accentColor = "#4f46e5",
}) {
  const currentActualYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState(
    selectedYear ? Math.floor(selectedYear / 9) * 9 : Math.floor(currentActualYear / 9) * 9
  );

  const years = [];
  for (let y = startYear; y < startYear + 9; y++) {
    years.push(y);
  }

  return (
    <div className="w-[220px] p-2 select-none">
      {/* Range Navigation Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setStartYear((s) => s - 9)}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          title="Past Years"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-[0.78rem] font-bold text-gray-800">
          {startYear} – {startYear + 8}
        </div>

        <button
          type="button"
          onClick={() => setStartYear((s) => s + 9)}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          title="Future Years"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 9 Years Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {years.map((y) => {
          const isSelected = selectedYear === y;
          const isCurrent = y === currentActualYear;
          return (
            <button
              key={y}
              type="button"
              onClick={() => onSelect(y)}
              className={`rounded-lg px-2 py-2 text-[0.7rem] font-bold transition-all ${
                isSelected
                  ? "text-white shadow-md scale-105"
                  : isCurrent
                  ? "border border-indigo-400 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              style={isSelected ? { background: accentColor } : undefined}
            >
              {y}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. Week Calendar Picker Grid (shows Week 1 (1 Jul - 7 Jul))
// -------------------------------------------------------------
function WeekCalendarGrid({
  year,
  month,
  selectedWeek,
  onSelect,
  accentColor = "#4f46e5",
}) {
  const safeYear = year || new Date().getFullYear();
  const safeMonth = month !== undefined ? month : new Date().getMonth();
  const weeks = getWeeksInMonth(safeYear, safeMonth);

  return (
    <div className="w-[240px] p-2 select-none">
      <div className="text-[0.72rem] font-extrabold text-gray-700 pb-2 mb-2 border-b border-gray-100 flex items-center justify-between">
        <span>Weeks for {MONTHS_FULL[safeMonth]}</span>
        <span className="text-gray-400 font-semibold">{safeYear}</span>
      </div>

      <div className="flex flex-col gap-1">
        {weeks.map((w, i) => {
          const isSelected = selectedWeek === i;
          return (
            <button
              key={w.label}
              type="button"
              onClick={() => onSelect(i)}
              className={`w-full text-left rounded-lg px-3 py-2 text-[0.7rem] font-semibold transition-all ${
                isSelected
                  ? "text-white shadow-md font-bold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              style={isSelected ? { background: accentColor } : undefined}
            >
              {w.fullText}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Main Calendar Picker Component (Month, Year, Week Popovers)
// -------------------------------------------------------------
export default function CalendarPicker({
  type = "month", // "month" | "year" | "week"
  selectedMonth,
  selectedYear,
  selectedWeek,
  onSelectMonth,
  onSelectYear,
  onSelectWeek,
  placeholder = "Select",
  accentColor = "#4f46e5",
  onOpenStateChange,
  showLabelPrefix = true,
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState("down");
  const ref = useRef(null);

  const toggleOpen = (state) => {
    const newState = state !== undefined ? state : !open;
    setOpen(newState);
    if (onOpenStateChange) onOpenStateChange(newState);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        toggleOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Auto-detect available viewport space (Flip ONLY when near bottom edge of screen)
  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < 140 && spaceAbove > spaceBelow) {
        setDirection("up");
      } else {
        setDirection("down");
      }
    }
  }, [open]);

  // Compute button display text
  const displayText = (() => {
    if (type === "month") {
      if (selectedMonth !== undefined) {
        const monthText = selectedYear
          ? `${MONTHS_FULL[selectedMonth]} ${selectedYear}`
          : MONTHS_FULL[selectedMonth];
        return showLabelPrefix ? `Month: ${monthText}` : monthText;
      }
      return showLabelPrefix ? `Month: ${placeholder}` : placeholder;
    }

    if (type === "year") {
      if (selectedYear) return showLabelPrefix ? `Year: ${selectedYear}` : String(selectedYear);
      return showLabelPrefix ? `Year: ${placeholder}` : placeholder;
    }

    if (type === "week") {
      if (selectedWeek !== undefined && selectedMonth !== undefined) {
        const weeks = getWeeksInMonth(selectedYear, selectedMonth);
        const w = weeks[selectedWeek];
        return w ? w.fullText : `Week ${selectedWeek + 1}`;
      }
      return placeholder || "Week";
    }

    return placeholder;
  })();

  const hasValue =
    (type === "month" && selectedMonth !== undefined) ||
    (type === "year" && selectedYear) ||
    (type === "week" && selectedWeek !== undefined);

  const isUp = direction === "up";

  return (
    <div ref={ref} className="relative inline-block text-left z-30">
      <button
        type="button"
        onClick={() => toggleOpen()}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.68rem] font-bold transition-all shadow-sm ${
          hasValue
            ? "border-indigo-300 bg-white text-indigo-950 shadow-indigo-100"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <Calendar className="h-3.5 w-3.5 shrink-0 text-indigo-600 opacity-80" />
        <span className="truncate max-w-[200px]">{displayText}</span>
        <ChevronRight
          className={`h-3 w-3 shrink-0 text-gray-500 transition-transform duration-200 ${
            open ? "rotate-90 text-indigo-600" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: isUp ? -4 : 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isUp ? -4 : 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute left-0 z-50 rounded-xl border border-gray-200 bg-white shadow-2xl overflow-visible ${
              isUp ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top"
            }`}
          >
            {type === "month" && (
              <MonthCalendarGrid
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onSelect={(m, y) => {
                  if (onSelectMonth) onSelectMonth(m, y);
                  toggleOpen(false);
                }}
                accentColor={accentColor}
              />
            )}

            {type === "year" && (
              <YearCalendarGrid
                selectedYear={selectedYear}
                onSelect={(y) => {
                  if (onSelectYear) onSelectYear(y);
                  toggleOpen(false);
                }}
                accentColor={accentColor}
              />
            )}

            {type === "week" && (
              <WeekCalendarGrid
                year={selectedYear}
                month={selectedMonth}
                selectedWeek={selectedWeek}
                onSelect={(w) => {
                  if (onSelectWeek) onSelectWeek(w);
                  toggleOpen(false);
                }}
                accentColor={accentColor}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
