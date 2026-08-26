import React from "react";
import { Copy, RefreshCw, FileText, CheckCircle2, Mail } from "lucide-react";

export const SharePackageSidebar = ({
  showIncExc,
  setShowIncExc,
  showPriceBreakup,
  setShowPriceBreakup,
  hideTotalPrice,
  setHideTotalPrice,
  removeItinerary,
  setRemoveItinerary,
  removeTerms,
  setRemoveTerms,
  removeTransport,
  setRemoveTransport,
  isPdfMode,
  setIsPdfMode,
  similarHotelWord,
  setSimilarHotelWord,
  isVoucherMode,
  isPackageMode,
  handleCopyLink,
  handleRefreshPreview,
  handleDownloadPdf,
  handleOpenSendEmailModal,
  copiedLink,
  isGeneratingPdf,
}) => {
  return (
    <div className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/50 p-5 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
            Options & Toggles
          </h4>
          <div className="space-y-2.5">
            {!isVoucherMode && (
              <>
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <span>Show Inclusions / Exclusions</span>
                  <input
                    type="checkbox"
                    checked={showIncExc}
                    onChange={(e) => setShowIncExc(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <span>Show Price Breakup</span>
                  <input
                    type="checkbox"
                    checked={showPriceBreakup}
                    onChange={(e) => setShowPriceBreakup(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <span>Hide Total Price</span>
                  <input
                    type="checkbox"
                    checked={hideTotalPrice}
                    onChange={(e) => setHideTotalPrice(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <span>Remove Day Itinerary</span>
                  <input
                    type="checkbox"
                    checked={removeItinerary}
                    onChange={(e) => setRemoveItinerary(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <span>Remove Terms & Conditions</span>
                  <input
                    type="checkbox"
                    checked={removeTerms}
                    onChange={(e) => setRemoveTerms(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <span>Remove Transport Section</span>
                  <input
                    type="checkbox"
                    checked={removeTransport}
                    onChange={(e) => setRemoveTransport(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <span>Add "or Similar" to Hotels</span>
                  <input
                    type="checkbox"
                    checked={similarHotelWord}
                    onChange={(e) => setSimilarHotelWord(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </>
            )}

            <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700 cursor-pointer select-none pt-1">
              <span>Optimized PDF Layout</span>
              <input
                type="checkbox"
                checked={isPdfMode}
                onChange={(e) => setIsPdfMode(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="pt-6 space-y-2">
        {!isVoucherMode && (
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-sm"
          >
            {copiedLink ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Copy size={15} />}
            <span>{copiedLink ? "Link Copied!" : "Copy Quotation Link"}</span>
          </button>
        )}

        <button
          onClick={handleRefreshPreview}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-sm"
        >
          <RefreshCw size={15} />
          <span>Refresh Preview</span>
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-900 active:scale-95 transition cursor-pointer shadow-sm disabled:opacity-50"
        >
          <FileText size={15} />
          <span>{isGeneratingPdf ? "Generating PDF..." : "Download PDF Document"}</span>
        </button>

        <button
          onClick={handleOpenSendEmailModal}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-95 transition cursor-pointer shadow-md"
        >
          <Mail size={15} />
          <span>Send via Email</span>
        </button>
      </div>
    </div>
  );
};

export default SharePackageSidebar;
