import React from "react";
import { ShieldAlert } from "lucide-react";
import { QUOTATION_TERMS } from "../../utils/queryDetailsHelpers";

export const QuoteTermsAndConditionsCard = ({ terms = QUOTATION_TERMS }) => {
  const activeTerms = Array.isArray(terms) && terms.length > 0 ? terms : QUOTATION_TERMS;

  return (
    <div className="mb-4 rounded-xl border border-violet-200 bg-white p-3">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
          <ShieldAlert size={14} />
        </div>
        <h4 className="font-semibold text-sm text-gray-900">Terms and Conditions</h4>
        <span className="ml-auto rounded-full border border-violet-200 bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
          {activeTerms.length} points
        </span>
      </div>

      <ol className="space-y-2">
        {activeTerms.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3"
            style={{ borderLeft: "3px solid #8b5cf6" }}
          >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700">
              {index + 1}
            </span>
            <span className="text-[13px] leading-relaxed text-slate-700">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};
