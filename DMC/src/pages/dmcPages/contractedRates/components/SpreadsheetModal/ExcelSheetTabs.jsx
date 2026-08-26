import React from "react";
import { ChevronLeft, ChevronRight, FileSpreadsheet, Plus } from "lucide-react";

export const ExcelSheetTabs = ({
  availableSheets,
  activeWorkbookSheet,
  handleSwitchTab,
}) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto max-w-full">
      {/* Navigation Arrows */}
      <div className="flex items-center gap-0.5 border-r border-[#d4d4d4] pr-1.5 mr-1">
        <button
          type="button"
          disabled={availableSheets.indexOf(activeWorkbookSheet) <= 0}
          onClick={() => {
            const idx = availableSheets.indexOf(activeWorkbookSheet);
            if (idx > 0) handleSwitchTab(availableSheets[idx - 1]);
          }}
          className="p-1 rounded text-slate-600 hover:bg-[#dedbd8] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          title="Previous sheet"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          disabled={
            availableSheets.indexOf(activeWorkbookSheet) >= availableSheets.length - 1
          }
          onClick={() => {
            const idx = availableSheets.indexOf(activeWorkbookSheet);
            if (idx < availableSheets.length - 1) handleSwitchTab(availableSheets[idx + 1]);
          }}
          className="p-1 rounded text-slate-600 hover:bg-[#dedbd8] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          title="Next sheet"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-1">
        {availableSheets.map((sName) => {
          const isActive = (activeWorkbookSheet || availableSheets[0]) === sName;
          const isBlackout = sName.toLowerCase().includes("blackout");

          return (
            <button
              key={sName}
              type="button"
              onClick={() => handleSwitchTab(sName)}
              className={`px-3.5 py-1 text-xs font-semibold flex items-center gap-1.5 rounded-t transition cursor-pointer ${
                isActive
                  ? "bg-white text-slate-900 border-t-2 border-t-[#107c41] shadow-xs font-bold border-x border-[#d4d4d4]"
                  : "bg-[#e1dfdd] hover:bg-[#d8d5d2] text-slate-700 border border-transparent"
              }`}
            >
              <FileSpreadsheet
                size={13}
                className={isActive ? "text-[#107c41]" : isBlackout ? "text-rose-500" : "text-slate-500"}
              />
              <span>{sName}</span>
              {isBlackout && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-0.5"></span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-[#dedbd8] transition cursor-pointer"
          title="Add Sheet (Protected View)"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
};
