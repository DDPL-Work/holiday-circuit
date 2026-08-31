import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Users,
  MapPin,
  FileBadge2,
  BadgePercent,
  AlertCircle,
  LoaderCircle,
  Check,
} from "lucide-react";
import { DocCard } from "./DocCard";
import {
  docOptions,
  getInitials,
  statusTone,
} from "../utils/bookingDetailsHelpers";

export const TravelerDocsDeskTab = ({
  item,
  isInternationalTrip,
  travelers,
  tripTypeLabel,
  requiredDocCount,
  totalRequiredDocSlots,
  docProgress,
  travelerVerification,
  allDocsReady,
  isTravelerDocumentsVerifiedComplete,
  travelerIssuesList,
  booking,
  hasStructuredDocumentIssues,
  documentPortalContext,
  hasDocumentTypeMismatch,
  travelersWithStatus,
  requiredDocKeys,
  documentIssues,
  verifiedDocuments,
  documentIssueTitle,
  documentIssueMessage,
  docsUnlocked,
  uploadingKey,
  removingKey,
  documentUploadErrors,
  handleUploadDoc,
  handleView,
  handleRemoveDoc,
  handleOpenSubmitDocsConfirm,
  submittingDocs,
}) => {
  return (
    <motion.section variants={item} className="mt-3 overflow-hidden rounded-[10px] bg-white">
      <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_rgba(255,255,255,0.96)_38%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_52%,_#f6fffb_100%)] px-3.5 py-4">
        <div className="flex flex-col gap-3">
          <div className="w-full">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 ring-1 ring-sky-500/20">
                    <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sky-500 text-[8px] font-bold text-white">
                      ✓
                    </div>
                    <span className="text-[10px] font-semibold text-sky-700">Traveler Documents</span>
                  </div>
                </div>
                <h2 className="text-[22px] font-bold tracking-[-0.03em] text-slate-900">Traveler Documentation Desk</h2>
              </div>
            </div>
            <p className="mt-4 max-w-[800px] text-xs leading-7 text-slate-800">
              {isInternationalTrip
                ? "This is an international trip, so every traveler must upload both Passport and PAN Card before submission."
                : "This is a domestic trip, so every traveler must upload at least one PAN Card. Passport is optional, and you can still upload both if available."}
            </p>
            <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Travelers", value: travelers.length, icon: <Users className="h-3.5 w-3.5" />, color: "border-sky-400 text-sky-700 bg-sky-100 text-sky-600", bar: "bg-sky-400" },
                { label: "Trip Type", value: tripTypeLabel, icon: <MapPin className="h-3.5 w-3.5" />, color: "border-violet-400 text-violet-700 bg-violet-100 text-violet-600", bar: "bg-violet-400" },
                { label: "Required Docs", value: `${requiredDocCount}/${totalRequiredDocSlots || 0}`, icon: <FileBadge2 className="h-3.5 w-3.5" />, color: "border-amber-400 text-amber-700 bg-amber-100 text-amber-600", bar: "bg-amber-400" },
                { label: "Completion", value: `${docProgress}%`, icon: <BadgePercent className="h-3.5 w-3.5" />, color: "border-emerald-400 text-emerald-700 bg-emerald-100 text-emerald-600", bar: "bg-emerald-400" },
              ].map(({ label, value, icon, color, bar }) => (
                <div key={label} className="group relative flex min-h-[120px] flex-col overflow-hidden rounded-[22px] border border-white/70 bg-white/90 px-4 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <div className={`flex min-h-[42px] items-center gap-2 border-l-4 ${color.split(" ")[0]} pl-3`}>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-2xl ${color.split(" ").slice(2).join(" ")}`}>{icon}</span>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${color.split(" ")[1]}`}>{label}</p>
                  </div>
                  <p className="mt-auto pt-4 text-[24px] font-bold leading-none text-slate-900 lg:text-[26px]">{value}</p>
                  <div className={`absolute bottom-0 left-4 right-4 h-1 origin-left scale-x-0 rounded-full ${bar} transition-transform duration-300 group-hover:scale-x-100`} />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusTone(travelerVerification?.status || "Draft")}`}>{travelerVerification?.status || "Draft"}</span>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${allDocsReady ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-slate-200 bg-slate-50 text-slate-600"}`}>
                {allDocsReady ? "Submission Ready" : "Uploads In Progress"}
              </span>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                <span>Desk Progress</span>
                <span>{docProgress}%</span>
              </div>
              <div className="relative h-2.5 overflow-visible rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#1e3a8a_0%,#6366f1_100%)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${docProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <motion.div
                  className="group absolute top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer rounded-full border-[3px] border-indigo-600 bg-white shadow-[0_0_12px_rgba(99,102,241,0.6)] hover:scale-110 transition-transform duration-200"
                  initial={{ left: "calc(2% - 8px)", opacity: 0 }}
                  animate={{ left: `calc(${Math.max(2, docProgress)}% - 8px)`, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <div className={`pointer-events-none absolute bottom-full mb-2.5 whitespace-nowrap rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100 z-20 ${docProgress > 85 ? "right-[-10px]" : docProgress < 15 ? "left-[-10px]" : "left-1/2 -translate-x-1/2"}`}>
                    <div className="flex flex-col items-start gap-1.5 text-left text-xs font-semibold text-white">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-700 pb-1 w-full">
                        <div className="flex items-center gap-1.5">
                          {isTravelerDocumentsVerifiedComplete ? (
                            <Check className="h-3 w-3 text-emerald-400 stroke-[3] shrink-0" />
                          ) : (
                            <span className={`h-1.5 w-1.5 rounded-full ${travelerIssuesList.length > 0 ? "bg-rose-500 animate-ping" : "bg-indigo-400 animate-pulse"}`} />
                          )}
                          <span className="text-slate-300 font-bold uppercase tracking-wider text-[9px]">Traveler Desk</span>
                        </div>
                        {isTravelerDocumentsVerifiedComplete && (
                          <span className="text-[8px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/30">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-white mt-0.5">Client: <span className="font-semibold text-slate-200">{booking?.customerName || booking?.clientName || booking?.travelerDetails?.[0]?.fullName || "Traveler"}</span></p>
                      <p className="text-[10px] text-slate-300">Uploads: <span className="font-bold text-indigo-300">{requiredDocCount}</span> of <span className="font-bold text-slate-400">{totalRequiredDocSlots || 0}</span></p>

                      {travelerIssuesList.length > 0 && (
                        <div className="mt-1.5 border-t border-slate-800 pt-1.5 w-full flex flex-col gap-1 font-sans">
                          <span className="text-[9px] font-extrabold uppercase tracking-wide text-rose-400 flex items-center gap-1">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Active Document Issues
                          </span>
                          {travelerIssuesList.map((ti) => (
                            <p key={ti.name} className="text-[10px] leading-4 text-rose-300 font-medium whitespace-normal max-w-[200px]">
                              • <span className="font-bold text-rose-400">{ti.name}</span>: Rejected <span className="font-bold text-white underline decoration-rose-500/60">{ti.issues}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`absolute -bottom-1.5 h-3 w-3 rotate-45 border-b border-r border-slate-700 bg-slate-900 ${docProgress > 85 ? "right-[14px]" : docProgress < 15 ? "left-[14px]" : "left-1/2 -translate-x-1/2"}`}></div>
                  </div>
                </motion.div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-[12px] leading-6 text-slate-500">
              <p>1. Complete traveler document uploads first for this booking.</p>
              <p>2. {isInternationalTrip ? "Passport and PAN Card are both mandatory for each traveler." : "PAN Card is mandatory for each traveler. Passport remains optional."}</p>
              <p>3. Once uploads are ready, continue with payment update for finance verification.</p>
              {!isInternationalTrip ? <p>4. Optional passports can still be uploaded for a more complete traveler file set.</p> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 py-6">
        {!hasStructuredDocumentIssues && (documentPortalContext?.issueSummary || travelerVerification?.rejectionReason) ? <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800"><p className="font-semibold">{travelerVerification?.rejectionReason || "Document corrections requested"}</p><p className="mt-1 leading-6">{documentPortalContext?.issueSummary || travelerVerification?.rejectionRemarks || "Please update the highlighted files and submit again."}</p></div> : null}
        {hasDocumentTypeMismatch ? (
          <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <p className="font-semibold">Wrong document slot detected</p>
            <p className="mt-1 leading-6">Remove or replace the highlighted file before submitting traveler documents.</p>
          </div>
        ) : !allDocsReady ? <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700">Upload all required traveler documents first. Payment update should be completed only after this desk is ready.</div> : null}

        <div className="mt-6 space-y-6">
          {travelersWithStatus.length > 0 ? travelersWithStatus.map((traveler) => (
            <div key={traveler?._id || traveler?.fullName} className="overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] shadow-sm">
              <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_100%)] px-5 py-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-900 text-sm font-bold text-white shadow-[0_14px_26px_rgba(15,23,42,0.16)]">
                      {getInitials(traveler?.fullName)}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-900">{traveler?.fullName || "Traveler"}</p>
                      <p className="mt-1 text-sm text-slate-500">{traveler?.travelerType || "Adult"} traveler document desk</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">{traveler.requiredReadyCount}/{requiredDocKeys.length} required ready</span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${traveler.isDocDeskComplete ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-amber-200 bg-amber-50 text-amber-700"}`}>
                      {traveler.isDocDeskComplete ? "Desk Complete" : "Action Needed"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-[12px] text-slate-600">
                  {docOptions.map((option) => {
                    const ready = Boolean(traveler.docs?.[option.key]?.url);
                    const isRequired = requiredDocKeys.includes(option.key);
                    return (
                      <span key={`${traveler?._id}-${option.key}-summary`} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${ready ? "bg-emerald-100 text-emerald-700" : isRequired ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-white text-slate-500 border border-slate-200"}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${ready ? "bg-emerald-500" : "bg-slate-300"}`} />
                        {option.label} {isRequired ? "(Required)" : "(Optional)"}
                      </span>
                    );
                  })}
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  {docOptions.map((option) => {
                    const matchedIssue = documentIssues.find((issue) => {
                      const issueTravelerId = String(issue?.travelerId || "").trim();
                      const issueTravelerName = String(issue?.travelerName || "").trim().toLowerCase();
                      const issueDocumentKey = String(issue?.documentKey || "").trim();
                      const travelerId = String(traveler?._id || "").trim();
                      const travelerName = String(traveler?.fullName || "").trim().toLowerCase();
                      return issueDocumentKey === option.key && ((issueTravelerId && travelerId && issueTravelerId === travelerId) || (issueTravelerName && travelerName && issueTravelerName === travelerName));
                    });
                    const matchedVerifiedDocument = verifiedDocuments.find((verifiedDocument) => {
                      const verifiedTravelerId = String(verifiedDocument?.travelerId || "").trim();
                      const verifiedTravelerName = String(verifiedDocument?.travelerName || "").trim().toLowerCase();
                      const verifiedDocumentKey = String(verifiedDocument?.documentKey || "").trim();
                      const travelerId = String(traveler?._id || "").trim();
                      const travelerName = String(traveler?.fullName || "").trim().toLowerCase();
                      return verifiedDocumentKey === option.key && ((verifiedTravelerId && travelerId && verifiedTravelerId === travelerId) || (verifiedTravelerName && travelerName && verifiedTravelerName === travelerName));
                    });
                    return (
                      <DocCard
                        key={`${traveler?._id}-${option.key}`}
                        traveler={traveler}
                        option={option}
                        document={traveler.docs?.[option.key]}
                        disabled={!docsUnlocked}
                        loadingKey={uploadingKey}
                        removingKey={removingKey}
                        uploadError={documentUploadErrors[`${traveler?._id}-${option.key}`] || ""}
                        onUpload={handleUploadDoc}
                        onView={handleView}
                        onRemove={handleRemoveDoc}
                        isRequired={requiredDocKeys.includes(option.key)}
                        tripTypeLabel={tripTypeLabel}
                        issue={matchedIssue}
                        verified={matchedVerifiedDocument}
                        issueTitle={documentIssueTitle}
                        issueMessage={documentIssueMessage}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )) : <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">No traveler records are available for this booking yet.</div>}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[9px] text-red-700 shadow-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="leading-5">
              <span className="font-semibold uppercase tracking-[0.14em] text-red-600">Note:</span>{" "}
              {isInternationalTrip
                ? "Submit to operations only after every traveler has both Passport and PAN Card uploaded."
                : "Submit to operations only after every traveler has a PAN Card uploaded. Passport remains optional for domestic trips."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenSubmitDocsConfirm}
            disabled={!docsUnlocked || !allDocsReady || hasDocumentTypeMismatch || submittingDocs || travelers.length === 0}
            className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-[25px] bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.28)] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {submittingDocs ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />}
            Submit Traveler Documents
          </button>
        </div>
      </div>
    </motion.section>
  );
};
