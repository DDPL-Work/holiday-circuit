import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

export default function SegmentedPicker({
  options,
  value,
  onChange,
  accentColor = "#4f46e5",
  onOpenStateChange,
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

      // Only flip upward if space below is less than 120px and space above is greater
      if (spaceBelow < 120 && spaceAbove > spaceBelow) {
        setDirection("up");
      } else {
        setDirection("down");
      }
    }
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const isUp = direction === "up";

  return (
    <div ref={ref} className="relative inline-block text-left z-30">
      <button
        type="button"
        onClick={() => toggleOpen()}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[0.68rem] font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
      >
        <span>{selected?.label || "Select"}</span>
        <ChevronRight
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: isUp ? -4 : 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isUp ? -4 : 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute left-0 z-50 min-w-[130px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl ${
              isUp ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top"
            }`}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  toggleOpen(false);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-[0.68rem] font-semibold transition-all ${
                  value === opt.value
                    ? "text-white shadow-md font-bold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={value === opt.value ? { background: accentColor } : undefined}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
