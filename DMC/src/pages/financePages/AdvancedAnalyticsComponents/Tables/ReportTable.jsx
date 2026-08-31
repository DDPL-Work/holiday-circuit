import React from "react";

export default function ReportTable({ columns = [], rows = [], loading }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm bg-white">
      <div className="overflow-x-auto finance-transparent-scrollbar">
        <table className="min-w-full divide-y divide-slate-150 text-xs">
          <thead className="bg-gradient-to-r from-slate-50 via-slate-50/50 to-white">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 font-extrabold uppercase tracking-wider text-slate-600 text-[10px] border-b border-slate-200/60 whitespace-nowrap"
                  style={{ textAlign: column.align || "left" }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm font-semibold text-slate-400"
                >
                  {loading ? "Loading report..." : "No report data available"}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={`${row.destination || row.label || rowIndex}-${rowIndex}`}
                  className="hover:bg-gradient-to-r hover:from-blue-50/20 hover:to-transparent transition-all duration-150"
                >
                  {columns.map((column) => {
                    const val = row[column.key];

                    // Add some highlight styles to specific columns like Conversion or Margin
                    let textClass = "text-slate-700 font-semibold";
                    if (column.align === "right") {
                      textClass = "text-slate-800 font-bold font-mono";
                    } else if (column.align === "center") {
                      textClass = "text-slate-800 font-bold font-mono";
                    }

                    // Let's color-code non-zero values beautifully
                    const isMarginOrConversion =
                      column.key === "conversionPercent" || column.key === "marginPercent";
                    const numericVal = Number(val || 0);

                    if (isMarginOrConversion) {
                      if (numericVal > 50) {
                        textClass = "text-emerald-600 font-black";
                      } else if (numericVal > 0) {
                        textClass = "text-blue-600 font-black";
                      } else {
                        textClass = "text-slate-400 font-medium";
                      }
                    }

                    return (
                      <td
                        key={column.key}
                        className={`px-4 py-3 align-middle whitespace-nowrap ${textClass}`}
                        style={{ textAlign: column.align || "left" }}
                      >
                        {loading ? (
                          <span className="text-slate-300">...</span>
                        ) : column.render ? (
                          column.render(row)
                        ) : (
                          row[column.key]
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
