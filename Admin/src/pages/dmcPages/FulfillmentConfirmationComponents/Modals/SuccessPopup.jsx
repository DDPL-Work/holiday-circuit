import React from 'react';
import { ShieldCheck, Sparkles, X } from 'lucide-react';

export default function SuccessPopup({ successPopup, setSuccessPopup }) {
  if (!successPopup?.open) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
          {" "}
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            {" "}
            <div className="relative bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-black px-6 py-7 text-white">
              {" "}
              <button
                onClick={() =>
                  setSuccessPopup((prev) => ({
                    ...prev,
                    open: false,
                  }))
                }
                className="absolute right-4 top-4 rounded-full bg-white/15 p-1.5 text-white transition hover:bg-white/25"
              >
                {" "}
                <X size={16} />{" "}
              </button>{" "}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                {" "}
                {successPopup.status === "submitted" ? (
                  <ShieldCheck size={28} />
                ) : (
                  <Sparkles size={28} />
                )}{" "}
              </div>{" "}
              <p className="text-[11px] uppercase tracking-[0.25em] text-blue-100/90">
                {" "}
                Confirmation Saved{" "}
              </p>{" "}
              <h3 className="mt-2 text-2xl font-semibold leading-tight">
                {" "}
                {successPopup.status === "submitted"
                  ? "Confirmation Submitted Successfully"
                  : "Draft Saved Successfully"}{" "}
              </h3>{" "}
              <p className="mt-2 text-sm text-white/85">
                {" "}
                Your service confirmation has been recorded and is ready for the
                next fulfillment step.{" "}
              </p>{" "}
            </div>{" "}
            <div className="px-6 py-5">
              {" "}
              <div className="grid grid-cols-2 gap-3">
                {" "}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  {" "}
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    {" "}
                    Query{" "}
                  </p>{" "}
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {" "}
                    {successPopup.queryId || "-"}{" "}
                  </p>{" "}
                </div>{" "}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  {" "}
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    {" "}
                    Services{" "}
                  </p>{" "}
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {" "}
                    {successPopup.serviceCount} Added{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-blue-950">
                {" "}
                {successPopup.status === "submitted"
                  ? "The confirmation entry is now ready for voucher mapping and downstream ops tracking."
                  : "You can continue editing this draft and submit it once final confirmation numbers are ready."}{" "}
              </div>{" "}
              <div className="mt-5 flex justify-end gap-3">
                {" "}
                <button
                  onClick={() =>
                    setSuccessPopup((prev) => ({
                      ...prev,
                      open: false,
                    }))
                  }
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700"
                >
                  {" "}
                  Close{" "}
                </button>{" "}
                <button
                  onClick={() =>
                    setSuccessPopup((prev) => ({
                      ...prev,
                      open: false,
                    }))
                  }
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  {" "}
                  Continue{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>
  );
}
