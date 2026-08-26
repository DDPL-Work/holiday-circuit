import React from "react";
import {
  FileSpreadsheet,
  Search,
  X,
  Layers,
  Download,
  Maximize2,
  Minimize2,
} from "lucide-react";

export const ExcelRibbonHeader = ({
  selectedSheet,
  activeWorkbookSheet,
  sheetSearchQuery,
  setSheetSearchQuery,
  currentSheetData,
  handleDownload,
  isMaximized,
  setIsMaximized,
  onClose,
}) => {
  return (
    <div className="bg-gradient-to-r from-[#0d4f2b] via-[#107c41] to-[#0e5c32] text-white px-4 py-2.5 flex items-center justify-between shadow-md select-none shrink-0">
      <div className="flex items-center gap-3 shrink-0">
        <div className="p-1.5 bg-white/15 rounded-lg border border-white/20 shadow-inner flex items-center justify-center">
          <FileSpreadsheet size={20} className="text-white drop-shadow" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3
              className="text-sm font-bold tracking-wide text-white drop-shadow-sm max-w-[320px] truncate"
              title={selectedSheet.fileName}
            >
              {selectedSheet.fileName}
            </h3>
            <span className="bg-emerald-950/40 text-emerald-100 border border-emerald-400/30 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Protected View
            </span>
          </div>
          <p className="text-[10px] text-emerald-100/80 font-medium tracking-wide">
            Category: <span className="font-bold text-white capitalize">{selectedSheet.category || "Hotel"}</span> • Spreadsheet Live Preview
          </p>
        </div>
      </div>

      {/* Search Bar in Ribbon */}
      <div className="flex-1 max-w-md mx-4 relative">
        <div className="pointer-events-none absolute left-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-emerald-100/70">
          <Search size={13} />
        </div>
        <input
          type="text"
          value={sheetSearchQuery}
          onChange={(e) => setSheetSearchQuery(e.target.value)}
          placeholder={`Search in ${activeWorkbookSheet || "spreadsheet"}...`}
          className="w-full rounded-lg border border-white/25 bg-white/15 py-1 pl-9 pr-8 text-xs text-white placeholder-emerald-100/50 shadow-inner outline-none transition-all duration-200 focus:border-white focus:bg-white/25 focus:ring-2 focus:ring-white/10"
        />
        {sheetSearchQuery && (
          <button
            type="button"
            onClick={() => setSheetSearchQuery("")}
            className="absolute right-2 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
            title="Clear Search"
          >
            <X size={10} />
          </button>
        )}
      </div>

      {/* Right controls: Records badge, Download, Fullscreen, Close */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:inline-flex items-center gap-1 bg-black/20 text-emerald-100 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-white/10">
          <Layers size={12} className="text-emerald-300" />
          {currentSheetData?.rows?.length || 0} Records
        </span>

        <button
          type="button"
          onClick={() => handleDownload(selectedSheet.uploadId, selectedSheet.fileName)}
          className="p-1.5 rounded-lg bg-black/20 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
          title="Download Excel File"
        >
          <Download size={15} />
        </button>

        <button
          type="button"
          onClick={() => setIsMaximized(!isMaximized)}
          className="p-1.5 rounded-lg bg-black/20 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
          title={isMaximized ? "Restore Window" : "Maximize Window"}
        >
          {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-black/20 hover:bg-rose-600 text-white transition-all duration-200 active:scale-95 cursor-pointer"
          title="Close Spreadsheet"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
