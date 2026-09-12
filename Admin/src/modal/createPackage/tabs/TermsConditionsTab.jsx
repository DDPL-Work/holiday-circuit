import React, { useState, useEffect } from "react";
import { ShieldCheck, FileText, Sparkles, RefreshCw, BookOpen, AlertCircle } from "lucide-react";
import API from "../../../utils/Api.js";
import toast from "react-hot-toast";

const DEFAULT_STANDARD_TNC = `1. Bookings and Reservations:
• Booking Process: When you make a booking or reservation through Holiday Circuit, you agree to provide accurate and complete information. Any discrepancies or errors in the information provided may result in cancellation.

2. Payment Terms:
• Minimum 50% of the booking amount is required at the time of booking confirmation.
• Remaining 50% in 2 parts: 25% within 30 days prior to departure and 25% within 20 days prior to departure.
• 100% ticket cost to be paid at the time of confirmation for flight/train bookings.
• 100% payment required if booking is under cancellation period.

3. Confirmation & Auto-Cancellation:
• Your booking is considered confirmed only upon receipt of payment and confirmation voucher.
• Booking will be auto-cancelled in case of non-payment within the stipulated timeline.

4. Transfers & Sightseeing Tours:
• Service includes 60 minutes waiting time for airport pickups. For all other pickups, driver will wait 10 minutes at the hotel lobby.
• Sightseeing tours are subject to local weather and traffic conditions.

5. Travel Documents & ID Proof:
• Valid ID proof (Passport/Election Card/Aadhar) as required by destination entry regulations is mandatory for all travelers.
• Travel insurance is strongly recommended for all destinations.`;

export const TermsConditionsTab = ({
  termsAndConditions,
  setTermsAndConditions,
}) => {
  const [adminTerms, setAdminTerms] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        let res = null;
        try {
          res = await API.get("/admin/terms");
        } catch (err) {
          res = await API.get("/ops/terms");
        }
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data?.terms)
          ? res.data.terms
          : [];
        setAdminTerms(list);
      } catch (e) {
        console.warn("Unable to load TnC templates", e);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleApplyTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const matched = adminTerms.find(
      (t) => String(t.id || t._id) === String(templateId)
    );
    if (matched && matched.content) {
      // Strip HTML tags if content has HTML
      const plainText = String(matched.content)
        .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
        .replace(/<br\s*[\/]?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();

      setTermsAndConditions(plainText || matched.content);
      toast.success(`Loaded "${matched.name}" template`);
    }
  };

  const handleLoadDefaultStandard = () => {
    setTermsAndConditions(DEFAULT_STANDARD_TNC);
    setSelectedTemplateId("");
    toast.success("Standard package terms loaded");
  };

  const handleClear = () => {
    setTermsAndConditions("");
    setSelectedTemplateId("");
  };

  // Convert terms string or array into string value for textarea
  const stringValue = Array.isArray(termsAndConditions)
    ? termsAndConditions.join("\n")
    : String(termsAndConditions || "");

  const lineCount = stringValue
    ? stringValue.split("\n").filter((l) => l.trim().length > 0).length
    : 0;

  return (
    <div className="space-y-4 pt-1 font-sans">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-2">
        <div>
          <p className="text-xs sm:text-sm text-slate-900 font-bold flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-blue-600" />
            8. Package Terms & Conditions
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Attach official terms, cancellation policies, and booking guidelines for this package template.
          </p>
        </div>

        {lineCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold self-start sm:self-auto">
            <FileText size={13} />
            {lineCount} rule point{lineCount === 1 ? "" : "s"} added
          </span>
        )}
      </div>

      {/* Preset / Template Selector Bar */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
              <Sparkles size={13} className="text-blue-600" />
              <span>Load from Saved Template (Admin / OPS):</span>
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleApplyTemplate(e.target.value)}
              disabled={loadingTemplates}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            >
              <option value="">
                {loadingTemplates
                  ? "Loading templates..."
                  : adminTerms.length === 0
                  ? "-- No saved templates found --"
                  : "-- Choose a Saved TnC Template --"}
              </option>
              {adminTerms.map((term) => (
                <option key={term.id || term._id} value={term.id || term._id}>
                  {term.name} ({term.by || "Admin"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1 md:pt-4 shrink-0">
            <button
              type="button"
              onClick={handleLoadDefaultStandard}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
            >
              <BookOpen size={13} className="text-blue-600" />
              <span>Standard Default</span>
            </button>
            {stringValue.trim().length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 hover:border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Text Editor Area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800">
            Terms & Conditions Text / Policy Points
          </label>
          <span className="text-[11px] text-slate-400 font-medium">
            You can type custom bullet points or numbered clauses
          </span>
        </div>

        <textarea
          rows="12"
          placeholder="Enter package terms and conditions, cancellation policy, payment milestones, child policies, etc..."
          value={stringValue}
          onChange={(e) => setTermsAndConditions(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white p-3.5 text-xs text-slate-900 leading-relaxed placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition shadow-2xs font-mono"
        />
      </div>

      {/* Info helper note */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-start gap-2.5 text-xs text-slate-600">
        <AlertCircle size={15} className="text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>Note:</strong> These Terms & Conditions will be saved with this package template. When an Agent adds or shares this package, these custom terms will be displayed dynamically. Agents can also customize them with their agency branding.
        </span>
      </div>
    </div>
  );
};

export default TermsConditionsTab;
