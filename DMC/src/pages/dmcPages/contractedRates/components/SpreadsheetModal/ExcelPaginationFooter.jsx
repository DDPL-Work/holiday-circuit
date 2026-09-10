import React from "react";
import { ZoomOut, ZoomIn } from "lucide-react";
import { ExcelSheetTabs } from "./ExcelSheetTabs";

export const ExcelPaginationFooter = ({
  availableSheets,
  activeWorkbookSheet,
  handleSwitchTab,
  filteredSheetRowsLength,
  sheetPage,
  totalSheetPages,
  setSheetPage,
  zoomLevel,
  setZoomLevel,
}) => {
  return (
    <div className="bg-[#f3f2f1] border-t border-[#d4d4d4] px-2 py-1 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs select-none shadow-xs shrink-0">
      {/* Left side: Sheet Navigation & Tabs */}
      <ExcelSheetTabs
        availableSheets={availableSheets}
        activeWorkbookSheet={activeWorkbookSheet}
        handleSwitchTab={handleSwitchTab}
      />

      {/* Right side: Status, Pagination & Zoom Controls */}
      <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-600">
        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Ready</span>
        </div>

        <span className="text-slate-300">|</span>

        {/* Row Counter & Pagination */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">
            {filteredSheetRowsLength} rows
            {totalSheetPages > 1 && ` (Pg ${sheetPage}/${totalSheetPages})`}
          </span>

          {totalSheetPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSheetPage((prev) => Math.max(prev - 1, 1))}
                disabled={sheetPage === 1}
                className="px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setSheetPage((prev) => Math.min(prev + 1, totalSheetPages))}
                disabled={sheetPage === totalSheetPages}
                className="px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <span className="text-slate-300">|</span>

        {/* Zoom Slider */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.max(prev - 10, 75))}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#dedbd8] transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>
          <input
            type="range"
            min={75}
            max={125}
            step={5}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-16 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#107c41]"
          />
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.min(prev + 10, 125))}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#dedbd8] transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(100)}
            className="text-[10.5px] font-mono font-bold text-slate-700 hover:text-[#107c41] px-1 cursor-pointer"
            title="Reset Zoom to 100%"
          >
            {zoomLevel}%
          </button>
        </div>
      </div>
    </div>
  );
};
