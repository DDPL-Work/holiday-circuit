import React from "react";

export const UploadCategoryTabs = ({
  tabs,
  activeTab,
  setActiveTab,
  getTabCount,
}) => {
  return (
    <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = getTabCount(tab.id);
        const TabIcon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <TabIcon size={13} className={isActive ? "text-emerald-600" : "text-slate-400"} />
            <span>{tab.label}</span>
            <span
              className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isActive ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
