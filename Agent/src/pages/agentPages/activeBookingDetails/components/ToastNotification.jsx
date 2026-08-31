import React from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export const ToastNotification = ({ feedback, onClose }) => {
  if (!feedback) return null;
  const tone = feedback.type === "error" ? "border-red-200 bg-red-50 text-red-700" : feedback.type === "warning" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const Icon = feedback.type === "error" || feedback.type === "warning" ? AlertCircle : CheckCircle2;
  return (
    <div className="fixed right-4 top-4 z-[70] w-full max-w-sm">
      <div className={`rounded-2xl border px-4 py-3 shadow-xl ${tone}`}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/80 p-1.5 flex items-center justify-center shrink-0 shadow-sm">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] leading-none">{feedback.title}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-current/60 transition-colors hover:bg-white/60 hover:text-current flex items-center justify-center shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {feedback.message && (
            <div className="pl-10">
              <p className="text-[10px] leading-normal font-medium">{feedback.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
