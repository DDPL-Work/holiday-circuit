import React, { useRef } from "react";
import {
  Upload,
  Trash2,
  LoaderCircle,
} from "lucide-react";
import { getDocumentTypeMismatchMessage } from "../utils/bookingDetailsHelpers";

export function DocCard({
  traveler,
  option,
  document,
  disabled,
  loadingKey,
  removingKey,
  uploadError,
  onUpload,
  onView,
  onRemove,
  isRequired,
  tripTypeLabel,
  issue,
  verified,
  issueTitle,
  issueMessage,
}) {
  const Icon = option.icon;
  const inputRef = useRef(null);
  const uploadKey = `${traveler?._id}-${option.key}`;
  const uploading = loadingKey === uploadKey;
  const removing = removingKey === uploadKey;
  const uploaded = Boolean(document?.url);
  const hasIssue = Boolean(issue);
  const isVerified = Boolean(verified);
  const mismatchMessage = uploaded ? getDocumentTypeMismatchMessage(option.key, document) : "";
  const hasMismatch = Boolean(mismatchMessage);
  const slotStatus = hasMismatch ? "WRONG FILE" : hasIssue ? "REJECTED" : isVerified ? "VERIFIED" : uploaded ? "READY" : isRequired ? "REQUIRED" : "OPTIONAL";
  const slotStatusClassName = hasIssue
    ? "bg-red-100 text-red-700"
    : hasMismatch
      ? "bg-red-100 text-red-700"
      : isVerified
        ? "bg-emerald-100 text-emerald-700"
        : uploaded
          ? "bg-emerald-100 text-emerald-700"
          : isRequired
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-600";
  const theme = option.tone === "sky"
    ? {
      shell: "border-sky-200/80 bg-[linear-gradient(160deg,#f0f9ff_0%,#ffffff_48%,#eef6ff_100%)]",
      badge: "bg-sky-100 text-sky-700",
      iconWrap: "bg-sky-100 text-sky-700 ring-sky-200/70",
      panel: uploaded ? "border-sky-300 bg-white/90" : "border-sky-300/80 bg-sky-50/70",
      accent: "bg-sky-500",
      text: "text-sky-700",
      cta: "bg-sky-600 hover:bg-sky-700",
    }
    : {
      shell: "border-violet-200/80 bg-[linear-gradient(160deg,#f7f5ff_0%,#ffffff_48%,#fff4f7_100%)]",
      badge: "bg-violet-100 text-violet-700",
      iconWrap: "bg-violet-100 text-violet-700 ring-violet-200/70",
      panel: uploaded ? "border-violet-300 bg-white/90" : "border-violet-300/80 bg-violet-50/70",
      accent: "bg-violet-500",
      text: "text-violet-700",
      cta: "bg-violet-600 hover:bg-violet-700",
    };

  return (
    <div className={`group relative overflow-hidden rounded-[20px] border shadow-[0_18px_35px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-0.5 ${theme.shell}`}>
      <div className={`absolute left-0 top-0 h-full w-1.5 ${theme.accent}`} />
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${theme.badge}`}>{option.label}</span>
            <p className="mt-3 text-sm font-semibold text-slate-900">{traveler?.fullName || "Traveler"}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {isVerified
                ? "Operations verified this document and marked it as correct."
                : uploaded
                  ? "Document is attached and ready for review."
                  : isRequired
                    ? `${option.label} is mandatory for this ${tripTypeLabel.toLowerCase()} trip.`
                    : `${option.label} is optional for this ${tripTypeLabel.toLowerCase()} trip.`}
            </p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] ring-1 ${theme.iconWrap}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className={`mt-5 rounded-[24px] border px-4 py-4 backdrop-blur ${theme.panel}`}>
          {hasIssue ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              <p className="text-xs font-semibold">{issueTitle || "Document correction requested"}</p>
              <p className="mt-1 text-xs leading-5">
                {issueMessage || "Operations highlighted this document for correction. Please replace it and submit again."}
              </p>
            </div>
          ) : null}
          {hasMismatch ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <p className="text-xs font-semibold">Wrong document slot</p>
              <p className="mt-1 text-xs leading-5">{mismatchMessage}</p>
            </div>
          ) : null}
          {!hasIssue && isVerified ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
              <p className="text-xs font-semibold">Document verified by operations</p>
              <p className="mt-1 text-xs leading-5">
                This file has been reviewed and marked as correct on the ops side.
              </p>
            </div>
          ) : null}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Upload Slot</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {uploaded ? document.fileName || `${option.label} uploaded` : `Attach ${option.label}`}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {uploaded
                  ? "Open the file to review or replace it with an updated version."
                  : isRequired
                    ? "Accepted formats: JPG, PNG, WEBP, PDF. This file is required before submission."
                    : "Accepted formats: JPG, PNG, WEBP, PDF. You can upload this if available."}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${slotStatusClassName}`}>{slotStatus}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${isRequired ? "bg-amber-100 text-amber-700" : "border border-slate-200 bg-white text-slate-500"}`}>
                {isRequired ? "Mandatory" : "Optional"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-nowrap items-center gap-1.5 sm:gap-2">
            {uploaded ? (
              <button
                type="button"
                onClick={() => onView(document)}
                className="flex-1 min-w-0 justify-center text-center rounded-full border border-slate-200 bg-white px-2 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 truncate"
              >
                View File
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading || removing}
              className={`flex-[1.2] min-w-0 inline-flex items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] font-semibold text-white transition-colors disabled:bg-slate-300 ${theme.cta}`}
            >
              {uploading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin shrink-0" /> : <Upload className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{uploaded ? "Replace Upload" : "Upload Now"}</span>
            </button>
            {uploaded && !isVerified ? (
              <button
                type="button"
                onClick={() => onRemove(traveler, option)}
                disabled={disabled || uploading || removing}
                className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 rounded-full border border-red-200 bg-white px-2 py-2 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
              >
                {removing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin shrink-0" /> : <Trash2 className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">Remove</span>
              </button>
            ) : null}
          </div>
          {uploadError ? (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <p className="text-xs font-semibold">Upload needs attention</p>
              <p className="mt-1 text-xs leading-5">{uploadError}</p>
            </div>
          ) : null}
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(e) => onUpload(e, traveler, option)} />
        </div>
      </div>
      {uploading || removing ? <div className="absolute inset-0 flex items-center justify-center bg-white/70"><div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"><LoaderCircle className="h-4 w-4 animate-spin" />{uploading ? "Uploading..." : "Removing..."}</div></div> : null}
    </div>
  );
}
