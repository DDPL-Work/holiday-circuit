import React from "react";
import { X, Check } from "lucide-react";

export const ExcelFormulaBar = ({
  selectedCell,
  editingRowIndex,
  cancelEditingRow,
  setSelectedCell,
  saveEditedRow,
  formulaInputRef,
  handleFormulaBarChange,
}) => {
  return (
    <div className="bg-[#f3f2f1] border-b border-[#d4d4d4] px-3 py-1.5 flex items-center gap-2 text-xs select-none shadow-2xs shrink-0">
      {/* Name Box (Address) */}
      <div className="w-20 bg-white border border-[#d1d5db] rounded-xs px-2 py-0.5 text-center font-mono font-bold text-slate-800 text-[11px] shadow-2xs flex items-center justify-between">
        <span>{selectedCell ? `${selectedCell.colLetter}${selectedCell.row}` : "A1"}</span>
        <span className="text-[9px] text-slate-400">▾</span>
      </div>

      {/* Function Icons */}
      <div className="flex items-center gap-0.5 border-r border-[#d4d4d4] pr-2">
        <button
          type="button"
          onClick={() => {
            if (editingRowIndex !== null) cancelEditingRow();
            else setSelectedCell((prev) => ({ ...prev, value: "" }));
          }}
          className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
          title="Cancel edit"
        >
          <X size={13} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (editingRowIndex !== null) saveEditedRow(editingRowIndex);
          }}
          className="p-0.5 text-slate-400 hover:text-emerald-600 rounded transition cursor-pointer"
          title="Enter / Commit"
        >
          <Check size={13} />
        </button>
        <span className="font-serif italic font-bold text-slate-500 text-sm px-1.5 select-none" title="Insert Function">
          fx
        </span>
      </div>

      {/* Formula Text Input */}
      <input
        ref={formulaInputRef}
        type="text"
        value={selectedCell?.value !== undefined ? String(selectedCell.value) : ""}
        onChange={(e) => handleFormulaBarChange(e.target.value)}
        placeholder="Formula / cell value"
        className="flex-1 bg-white border border-[#d1d5db] rounded-xs px-2.5 py-0.5 text-[11px] font-sans text-slate-900 shadow-2xs outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all"
      />

      {selectedCell?.label && (
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-1 shrink-0">
          Col: {selectedCell.label}
        </span>
      )}
    </div>
  );
};
