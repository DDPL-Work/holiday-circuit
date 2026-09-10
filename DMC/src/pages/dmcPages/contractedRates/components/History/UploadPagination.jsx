import React from "react";

export const UploadPagination = ({
  startIndex,
  itemsPerPage,
  filteredUploadsLength,
  currentPage,
  setCurrentPage,
  totalPages,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:flex-row mt-3 rounded-b-xl">
      <span className="text-xs font-medium text-gray-500">
        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUploadsLength)} of {filteredUploadsLength} entries
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {Array.from({ length: totalPages }).map((_, index) => {
            if (
              totalPages > 5 &&
              index !== 0 &&
              index !== totalPages - 1 &&
              Math.abs(currentPage - 1 - index) > 1
            ) {
              if (index === 1 && currentPage > 3) {
                return <span key={index} className="px-1 text-gray-400">...</span>;
              }
              if (index === totalPages - 2 && currentPage < totalPages - 2) {
                return <span key={index} className="px-1 text-gray-400">...</span>;
              }
              return null;
            }

            return (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                  currentPage === index + 1
                    ? "bg-slate-900 text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};
