import React from "react";

export const ActionPillButton = ({
  label,
  icon,
  onClick,
  disabled = false,
  tone = "slate",
  className = "",
}) => {
  const tones = {
    sky: "bg-gradient-to-r from-[#2563eb] to-[#4f46e5] hover:from-[#1d4ed8] hover:to-[#4338ca] shadow-[0_4px_14px_rgba(79,70,229,0.35)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.45)] transition-all duration-300 transform hover:-translate-y-0.5",
    rose: "bg-gradient-to-r from-[#f43f5e] to-[#ec4899] hover:from-[#e11d48] hover:to-[#db2777] shadow-[0_4px_14px_rgba(244,63,94,0.35)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.45)] transition-all duration-300 transform hover:-translate-y-0.5",
    emerald: "bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.45)] transition-all duration-300 transform hover:-translate-y-0.5",
    slate: "bg-gradient-to-r from-[#475569] to-[#334155] hover:from-[#334155] hover:to-[#1e293b] shadow-[0_4px_14px_rgba(71,85,105,0.35)] hover:shadow-[0_6px_20px_rgba(71,85,105,0.45)] transition-all duration-300 transform hover:-translate-y-0.5",
  };

  const shellStyle = tones[tone] || tones.slate;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-full px-6 py-3 shadow-2xl text-white transition-all duration-200 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${shellStyle} ${className}`}
    >
      <span className="flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5">
        {icon}
      </span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};
