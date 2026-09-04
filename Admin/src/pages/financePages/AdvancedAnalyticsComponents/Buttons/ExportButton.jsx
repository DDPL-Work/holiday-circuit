import React from "react";

export default function ExportButton({
  icon,
  label,
  color,
  onClick,
  disabled,
  loading,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-xs font-semibold transition-all duration-350 ease-out transform whitespace-nowrap shrink-0 ${
        disabled
          ? "cursor-not-allowed opacity-50 shadow-none"
          : "hover:scale-[1.02] active:scale-95 cursor-pointer"
      } ${color}`}
    >
      {React.createElement(icon, { className: "w-3.5 h-3.5 shrink-0" })}
      {loading ? "Preparing..." : label}
    </button>
  );
}
