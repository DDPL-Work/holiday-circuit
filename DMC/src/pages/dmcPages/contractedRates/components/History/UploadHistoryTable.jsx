import React from "react";
import {
  FileSpreadsheet,
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Trash2,
} from "lucide-react";

export const UploadHistoryTable = ({
  paginatedUploads,
  viewLoading,
  handleViewData,
  handleDownload,
  handleDelete,
  activeTab,
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-[11px] border-b border-gray-200">
            <th className="text-left px-2 py-3.5 font-bold rounded-l-lg whitespace-nowrap">File Name</th>
            <th className="text-center px-2 py-3.5 font-bold whitespace-nowrap">Category</th>
            <th className="text-center px-2 py-3.5 font-bold whitespace-nowrap">Uploaded By</th>
            <th className="text-center px-2 py-3.5 font-bold whitespace-nowrap">Date</th>
            <th className="text-center px-2 py-3.5 font-bold whitespace-nowrap">Records</th>
            <th className="text-center px-2 py-3.5 font-bold whitespace-nowrap">Status</th>
            <th className="text-end px-3 py-3.5 font-bold rounded-r-lg whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUploads.length > 0 ? (
            paginatedUploads.map((item, index) => (
              <tr
                key={item._id || index}
                className="bg-white border-b border-gray-200 rounded-xl shadow-xs hover:bg-gray-100 transition"
              >
                <td className="px-2 py-4 font-medium text-[12px] whitespace-nowrap truncate max-w-[170px]">
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="text-green-500 shrink-0" size={16} />
                    <span className="truncate" title={item.fileName}>{item.fileName}</span>
                  </div>
                </td>
                <td className="text-center px-2 py-4 whitespace-nowrap">
                  <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize">
                    {String(item.category || "").toLowerCase() === "sightseeing" ? "Activity" : item.category}
                  </span>
                </td>
                <td className="text-center px-2 py-4 text-[12px] text-gray-600 whitespace-nowrap font-medium">
                  {item.uploadedBy}
                </td>
                <td className="text-center px-2 py-4 whitespace-nowrap">
                  <div className="flex items-center text-[11px] justify-center gap-1.5 text-gray-600">
                    <Calendar size={13} className="text-slate-400" />
                    <span>{new Date(item.updatedAt).toLocaleDateString('en-GB')}</span>
                  </div>
                </td>
                <td className="text-center px-2 py-4 font-semibold text-gray-750 text-[12px] whitespace-nowrap">
                  {item.records}
                </td>
                <td className="text-center px-2 py-4 whitespace-nowrap">
                  {item.status === "success" ? (
                    <CheckCircle className="text-green-500 mx-auto" size={16} />
                  ) : (
                    <AlertCircle className="text-yellow-500 mx-auto" size={16} />
                  )}
                </td>
                <td className="text-end px-3 py-4 text-xs whitespace-nowrap">
                  <div className="flex justify-end items-center gap-3">
                    <Eye
                      size={16}
                      onClick={() => !viewLoading && handleViewData(item._id)}
                      className={`${viewLoading ? "cursor-not-allowed text-blue-300" : "cursor-pointer text-blue-500 hover:text-blue-600"} transition-colors`}
                      title={viewLoading ? "Loading sheet data" : "Show Sheet Data"}
                    />
                    <Download
                      size={16}
                      onClick={() => handleDownload(item._id, item.fileName)}
                      className="cursor-pointer text-slate-500 hover:text-slate-800 transition-colors"
                      title="Download File"
                    />
                    <Trash2
                      size={16}
                      onClick={() => handleDelete(item._id)}
                      className="cursor-pointer text-red-500 hover:text-red-600 transition-colors"
                      title="Delete Upload"
                    />
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-gray-100 rounded-2xl">
                    <FileSpreadsheet size={28} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">No uploads found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activeTab === "all"
                        ? "Upload your first service file to get started."
                        : `No ${activeTab} uploads yet. Try uploading a ${activeTab} file.`}
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
