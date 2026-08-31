import React from "react";
import { ShieldCheck, FileSpreadsheet, Star, Save, Edit, X } from "lucide-react";
import { getColumnLetter } from "../../utils/contractedRatesHelpers";

export const ExcelGridView = ({
  currentSheetData,
  editingRowIndex,
  isRateChangeReasonRequired,
  currentRateSensitiveChanges,
  rateChangeReasonType,
  setRateChangeReasonType,
  rateChangeReasonOptions,
  rateChangeReasonNote,
  setRateChangeReasonNote,
  zoomLevel,
  sheetColumns,
  selectedCell,
  showSheetActions,
  hasGroupedHeaders,
  paginatedSheetRows,
  sheetSearchQuery,
  editRowData,
  handleCellChange,
  handleCellClick,
  saveEditedRow,
  cancelEditingRow,
  startEditingRow,
}) => {
  return (
    <>
      {/* 3. OPTIONAL SHEET BANNER (FOR BLACKOUT DATES OR SPECIAL SHEETS) */}
      {currentSheetData?.bannerTitle && (
        <div className="bg-gradient-to-r from-rose-900/90 via-red-800/90 to-rose-900/90 text-white px-4 py-2 flex items-center justify-between border-b border-rose-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🚫</span>
            <div>
              <h4 className="text-xs font-bold tracking-wide uppercase">{currentSheetData.bannerTitle}</h4>
              {currentSheetData.bannerSubtitle && (
                <p className="text-[10.5px] text-rose-100">{currentSheetData.bannerSubtitle}</p>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full">
            Blackout Notice Active
          </span>
        </div>
      )}

      {/* 4. RATE CHANGE REASON VALIDATION ALERT (DURING EDIT) */}
      {editingRowIndex !== null && (
        <div
          className={`border-b p-3 shadow-xs shrink-0 ${
            isRateChangeReasonRequired ? "border-amber-300 bg-amber-50" : "border-slate-300 bg-white"
          }`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p
                className={`text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${
                  isRateChangeReasonRequired ? "text-amber-700" : "text-slate-700"
                }`}
              >
                <ShieldCheck size={14} className={isRateChangeReasonRequired ? "text-amber-600" : "text-slate-500"} />
                Rate Change Audit Validation
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {isRateChangeReasonRequired
                  ? `Reason is mandatory because rate-sensitive inventory fields changed: ${currentRateSensitiveChanges.join(", ")}.`
                  : "You are editing this spreadsheet row. Modify cell values and click Save to sync."}
              </p>
            </div>

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
              <select
                value={rateChangeReasonType}
                onChange={(e) => setRateChangeReasonType(e.target.value)}
                disabled={!isRateChangeReasonRequired}
                className={`h-8 rounded border px-3 text-xs font-semibold outline-none ${
                  isRateChangeReasonRequired
                    ? "border-amber-400 bg-white text-slate-800 focus:border-amber-600"
                    : "border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                <option value="">Select reason</option>
                {rateChangeReasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={rateChangeReasonNote}
                onChange={(e) => setRateChangeReasonNote(e.target.value)}
                disabled={!isRateChangeReasonRequired}
                placeholder="Example: supplier blackout surcharge for event dates / limited inventory"
                className={`h-8 rounded border px-3 text-xs font-semibold outline-none ${
                  isRateChangeReasonRequired
                    ? "border-amber-400 bg-white text-slate-800 placeholder-slate-400 focus:border-amber-600"
                    : "border-slate-200 bg-slate-50 text-slate-400 placeholder-slate-300"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. EXCEL SPREADSHEET GRID */}
      <div className="flex-1 overflow-auto bg-white relative custom-scroll">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top left",
            width: `${100 / (zoomLevel / 100)}%`,
          }}
          className="transition-transform duration-100 ease-out"
        >
          <table className="min-w-max border-collapse text-[11px] font-sans w-full bg-white select-none">
            {/* THEAD: Column Letters & Dark Navy Header */}
            <thead className="sticky top-0 z-30">
              {/* Row 1: Column Letters (A, B, C, D, E...) */}
              <tr className="bg-[#f3f2f1] text-[#595959] text-[10px] font-bold border-b border-[#d4d4d4]">
                <th className="w-12 text-center bg-[#e1dfdd] border-r border-[#d4d4d4] select-none py-1">#</th>
                {sheetColumns.map((column, colIdx) => {
                  const colLetter = getColumnLetter(colIdx);
                  const isColActive = selectedCell.col === colIdx;
                  return (
                    <th
                      key={`col-letter-${colIdx}`}
                      className={`px-3 py-1 text-center border-r border-[#d4d4d4] select-none font-mono ${
                        isColActive ? "bg-[#d1fae5] text-[#065f46] font-extrabold" : "bg-[#f3f2f1]"
                      }`}
                    >
                      {colLetter}
                    </th>
                  );
                })}
                {showSheetActions && (
                  <th className="px-3 py-1 text-center border-r border-[#d4d4d4] bg-[#f3f2f1] font-mono text-[#595959]">
                    {getColumnLetter(sheetColumns.length)}
                  </th>
                )}
              </tr>

              {/* Row 2: Dark Navy Header Row */}
              {hasGroupedHeaders ? (
                currentSheetData.headerRows.map((headerRow, headerRowIndex) => (
                  <tr
                    key={`header-row-${headerRowIndex}`}
                    className="bg-[#0f2438] text-white border-b border-[#0b1e36]"
                  >
                    <th className="w-12 bg-[#091829] border-r border-slate-700 py-2 text-center text-slate-400 font-mono text-[10px] select-none">
                      {headerRowIndex + 1}
                    </th>
                    {headerRow.map((headerCell, cellIndex) => (
                      <th
                        key={`${headerRowIndex}-${cellIndex}-${headerCell.label}`}
                        colSpan={headerCell.colSpan || 1}
                        rowSpan={headerCell.rowSpan || 1}
                        className={`px-3 py-2 text-center text-white font-bold border-r border-slate-700 uppercase tracking-wider bg-[#0f2438] select-none whitespace-nowrap ${
                          headerCell.rowSpan ? "align-middle" : ""
                        }`}
                      >
                        {headerCell.label}
                      </th>
                    ))}
                    {headerRowIndex === 0 && showSheetActions && (
                      <th
                        rowSpan={currentSheetData.headerRows.length}
                        className="px-3 py-2 text-center text-white font-bold min-w-[120px] bg-[#0f2438] select-none whitespace-nowrap border-r border-slate-700"
                      >
                        Actions
                      </th>
                    )}
                  </tr>
                ))
              ) : (
                <tr className="bg-[#0f2438] text-white border-b border-[#0b1e36]">
                  <th className="w-12 bg-[#091829] border-r border-slate-700 py-2 text-center text-slate-400 font-mono text-[10px] select-none">
                    1
                  </th>
                  {sheetColumns.map((column) => {
                    const isDesc =
                      column.isDesc || String(column.label || column.key || "").toLowerCase().includes("desc");
                    const isDate =
                      column.isDate ||
                      /valid\s*from|valid\s*to|start\s*date|end\s*date|date/i.test(String(column.label || column.key || ""));
                    const isNumeric =
                      !isDate &&
                      (column.numeric ||
                      /rate|price|amount|capacity|count|#|id/i.test(String(column.label || column.key || "")));
                    return (
                      <th
                        key={column.key}
                        className={`px-3 py-2 font-bold border-r border-slate-700 uppercase tracking-wider bg-[#0f2438] text-white select-none whitespace-nowrap ${
                          isNumeric ? "text-right" : isDate ? "text-center" : "text-left"
                        } ${isDesc ? "min-w-[340px] max-w-[460px]" : isDate ? "min-w-[130px]" : "min-w-[120px]"}`}
                      >
                        {column.label || column.key}
                      </th>
                    );
                  })}
                  {showSheetActions && (
                    <th className="px-3 py-2 text-center text-white font-bold min-w-[110px] bg-[#0f2438] select-none whitespace-nowrap border-r border-slate-700">
                      Actions
                    </th>
                  )}
                </tr>
              )}
            </thead>

            {/* TBODY: Data Rows with Excel Grid */}
            <tbody>
              {paginatedSheetRows.length ? (
                paginatedSheetRows.map((row, index) => {
                  const originalIndex = row.originalIndex !== undefined ? row.originalIndex : index;
                  const isEditing = editingRowIndex === originalIndex;
                  const headerOffset = hasGroupedHeaders ? (currentSheetData.headerRows.length + 1) : 2;
                  const excelRowNumber = originalIndex + headerOffset;
                  const isRowSelected = selectedCell.row === excelRowNumber;

                  return (
                    <tr
                      key={row._id || originalIndex}
                      className={`border-b border-[#d4d4d4] hover:bg-slate-50 transition-colors ${
                        isEditing ? "bg-blue-50/40" : index % 2 === 1 ? "bg-[#fbfbfb]" : "bg-white"
                      }`}
                    >
                      {/* Left Row Number Gutter */}
                      <td
                        className={`w-12 border-r border-b border-[#d4d4d4] text-center font-mono text-[10px] select-none py-1.5 ${
                          isRowSelected
                            ? "bg-[#d1fae5] text-[#065f46] font-extrabold border-r-[#107c41]"
                            : "bg-[#f3f2f1] text-[#595959]"
                        }`}
                      >
                        {excelRowNumber}
                      </td>

                      {/* Data Cells */}
                      {sheetColumns.map((column, colIdx) => {
                        const header = column.key;
                        const isMergedCol = Boolean(column.isGroupedMerged);
                        const isMergedGroup = isMergedCol && !sheetSearchQuery && row.groupRowIndex !== undefined;

                        // Skip cell if spanned from above
                        if (isMergedGroup && row.groupRowIndex > 0) {
                          return null;
                        }

                        let cellVal = row[header] !== undefined ? row[header] : "";
                        if (String(header).toLowerCase().includes("vehicletype")) {
                          cellVal = String(cellVal || "").replace(/[^\x20-\x7E]/g, "").trim();
                        }
                        const isDesc =
                          column.isDesc || String(column.label || header || "").toLowerCase().includes("desc");
                        const isDate =
                          column.isDate ||
                          /valid\s*from|valid\s*to|start\s*date|end\s*date|date/i.test(String(column.label || header || ""));
                        const isNumeric =
                          !isDate &&
                          (column.numeric ||
                          /rate|price|amount|pax|capacity|count|id|#|no/i.test(String(column.label || header || "")));
                        const isSelected = selectedCell.row === excelRowNumber && selectedCell.col === colIdx;

                        // Format cell value: Date vs Numeric vs Text
                        let displayValue = String(cellVal || "");
                        if (isDate) {
                          if (cellVal instanceof Date && !isNaN(cellVal.getTime())) {
                            displayValue = cellVal.toISOString().split("T")[0];
                          } else if (typeof cellVal === "string" && /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(cellVal.trim())) {
                            displayValue = cellVal.trim();
                          } else {
                            const rawNum = typeof cellVal === "number" ? cellVal : (!isNaN(Number(cellVal)) && /^\d{5}$/.test(String(cellVal).trim()) ? Number(cellVal) : null);
                            if (rawNum && rawNum > 25569 && rawNum < 60000) {
                              const utcDays = rawNum - 25569;
                              const d = new Date(utcDays * 86400 * 1000);
                              const year = d.getUTCFullYear();
                              const month = String(d.getUTCMonth() + 1).padStart(2, "0");
                              const day = String(d.getUTCDate()).padStart(2, "0");
                              displayValue = `${year}-${month}-${day}`;
                            } else if (typeof cellVal === "string") {
                              displayValue = cellVal.trim();
                            }
                          }
                        } else if (isNumeric) {
                          if (typeof cellVal === "number" && !isNaN(cellVal)) {
                            displayValue = cellVal.toLocaleString("en-IN");
                          } else if (!isNaN(Number(cellVal)) && String(cellVal).trim() !== "") {
                            displayValue = Number(cellVal).toLocaleString("en-IN");
                          }
                        }

                        const rowSpan = isMergedGroup && row.groupRowIndex === 0 ? (row.groupRowSpan || 5) : 1;

                        return (
                          <td
                            key={header}
                            rowSpan={rowSpan > 1 ? rowSpan : undefined}
                            onClick={() =>
                              handleCellClick(originalIndex, colIdx, header, column.label, displayValue || cellVal)
                            }
                            className={`px-3 py-1.5 border-r border-b border-[#d4d4d4] font-medium transition-colors cursor-cell ${
                              rowSpan > 1 ? "align-middle bg-white font-semibold" : ""
                            } ${
                              isSelected
                                ? "relative outline outline-2 outline-[#107c41] -outline-offset-1 bg-emerald-50/40 z-10 font-bold text-slate-950"
                                : ""
                            } ${
                              isDesc
                                ? "min-w-[340px] max-w-[460px] whitespace-normal break-words py-2 leading-relaxed text-left align-top text-slate-700"
                                : isNumeric
                                ? "text-right font-mono text-slate-900 whitespace-nowrap"
                                : isDate
                                ? "text-center font-mono text-slate-800 whitespace-nowrap"
                                : "whitespace-nowrap text-slate-800 text-left"
                            }`}
                          >
                            {isEditing ? (
                              isDesc ? (
                                <textarea
                                  rows={2}
                                  value={editRowData[header] !== undefined ? editRowData[header] : ""}
                                  onChange={(e) => handleCellChange(header, e.target.value)}
                                  className="w-full border border-blue-500 px-2 py-1 text-[11px] rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-400 min-h-[50px]"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={editRowData[header] !== undefined ? editRowData[header] : ""}
                                  onChange={(e) => handleCellChange(header, e.target.value)}
                                  className="w-full border border-blue-500 px-2 py-0.5 text-[11px] rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                              )
                            ) : (
                              <span>
                                {header === "Hotel Category" && cellVal ? (
                                  (() => {
                                    const valStr = String(cellVal || "").trim();
                                    const match = valStr.match(/(\d+)/);
                                    const starCount = match ? Math.min(Math.max(parseInt(match[1], 10), 1), 7) : 0;
                                    if (starCount > 0) {
                                      return (
                                        <span className="inline-flex items-center gap-1.5 py-0.5 whitespace-nowrap" title={displayValue}>
                                          <span className="inline-flex items-center gap-0.5">
                                            {Array.from({ length: starCount }).map((_, sIdx) => (
                                              <Star key={sIdx} size={11} className="text-amber-400 fill-amber-400 shrink-0" />
                                            ))}
                                          </span>
                                          <span className="text-slate-800 font-medium">{displayValue}</span>
                                        </span>
                                      );
                                    }
                                    return <span>{displayValue}</span>;
                                  })()
                                ) : (
                                  displayValue
                                )}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Row Actions Column */}
                      {showSheetActions && (
                        <td className="px-3 py-1.5 border-r border-b border-[#d4d4d4] text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEditedRow(originalIndex)}
                                  className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-xs px-2 py-0.5 rounded text-[10.5px] font-bold active:scale-95 duration-150 cursor-pointer"
                                  title="Save Changes"
                                >
                                  <Save size={11} />
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditingRow}
                                  className="inline-flex items-center gap-1 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-xs px-2 py-0.5 rounded text-[10.5px] font-bold active:scale-95 duration-150 cursor-pointer"
                                  title="Cancel"
                                >
                                  <X size={11} />
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEditingRow(originalIndex, row)}
                                className="inline-flex items-center gap-1 bg-gradient-to-r from-[#0b1e36] to-[#107c41] hover:from-[#132d52] hover:to-[#16914d] text-white shadow-xs px-2.5 py-1 rounded text-[10.5px] font-bold active:scale-95 duration-150 cursor-pointer"
                                title="Edit Row"
                              >
                                <Edit size={11} />
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={sheetColumns.length + (showSheetActions ? 2 : 1)}
                    className="px-4 py-16 text-center text-sm text-slate-400 font-semibold"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileSpreadsheet size={32} className="text-slate-300" />
                      <p className="text-slate-500">
                        {sheetSearchQuery.trim()
                          ? `No matching records found for "${sheetSearchQuery}" in ${currentSheetData?.sheetName || "this sheet"}.`
                          : "No spreadsheet records found in this sheet."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
