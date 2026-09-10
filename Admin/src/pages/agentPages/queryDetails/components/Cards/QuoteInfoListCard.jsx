import React from "react";

export const QuoteInfoListCard = ({
  title,
  items = [],
  tone = "slate",
  emptyLabel = "No items provided",
  icon = null,
}) => {
  const tones = {
    emerald: {
      border: "border-emerald-200",
      shell: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      itemBorder: "border-l-[3px] border-emerald-500",
    },
    rose: {
      border: "border-rose-200",
      shell: "bg-rose-50",
      iconBg: "bg-rose-100",
      iconText: "text-rose-700",
      badge: "bg-rose-100 text-rose-700 border border-rose-200",
      itemBorder: "border-l-[3px] border-rose-500",
    },
    sky: {
      border: "border-sky-200",
      shell: "bg-sky-50",
      iconBg: "bg-sky-100",
      iconText: "text-sky-700",
      badge: "bg-sky-100 text-sky-700 border border-sky-200",
      itemBorder: "border-l-[3px] border-sky-500",
    },
    slate: {
      border: "border-gray-200",
      shell: "bg-gray-50",
      iconBg: "bg-gray-100",
      iconText: "text-gray-700",
      badge: "bg-gray-100 text-gray-700 border border-gray-200",
      itemBorder: "border-l-[3px] border-gray-400",
    },
  };

  const currentTone = tones[tone] || tones.slate;
  const normalizedItems = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <div className={`mb-4 rounded-xl border bg-white p-3 ${currentTone.border}`}>
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${currentTone.iconBg} ${currentTone.iconText}`}>
          {icon}
        </div>
        <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
        <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${currentTone.badge}`}>
          {normalizedItems.length} item{normalizedItems.length === 1 ? "" : "s"}
        </span>
      </div>

      {normalizedItems.length ? (
        <ul className="space-y-2">
          {normalizedItems.map((item, idx) => (
            <li
              key={`${title}-${idx}`}
              className={`rounded-xl border border-gray-200 bg-gray-50 p-3 ${currentTone.itemBorder}`}
            >
              <span className="text-[13px] leading-relaxed text-slate-800">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className={`rounded-xl border border-dashed p-3 text-sm italic ${currentTone.shell} ${currentTone.border} text-gray-500`}>
          {emptyLabel}
        </div>
      )}
    </div>
  );
};
