import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import API from "../../../../../utils/Api";
import toast from "react-hot-toast";

const parseStructuredTerms = (rawContent) => {
  if (!rawContent) return [];
  let text = "";
  if (Array.isArray(rawContent)) {
    text = rawContent
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          return item.content || item.text || item.name || item.item || item.label || "";
        }
        return String(item || "");
      })
      .join("\n");
  } else if (typeof rawContent === "string") {
    text = rawContent;
  } else {
    text = String(rawContent || "");
  }

  // Convert HTML block tags to newlines
  text = text
    .replace(/<\/(p|li|div|h[1-6]|tr|blockquote)>/gi, "\n")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  // Split known major categories if merged
  const majorSections = [
    "Bookings and Reservations",
    "Travel Documents and Requirements",
    "Changes to Itineraries & Liability",
    "Contact Information",
    "Intellectual Property",
    "Changes to Terms and Conditions",
  ];

  majorSections.forEach((sec) => {
    const reg = new RegExp(`(^|\\s|\\.|\\n)(${sec})(:?)`, "gi");
    text = text.replace(reg, "\n\n__HEADER__$2:\n");
  });

  // Split sub-items
  const subItems = [
    "Booking Process",
    "Payment Terms",
    "Payment",
    "Confirmation",
    "Credit Card",
    "Confirmation Vouchers",
    "Airport Transfers & Tour Pick Ups",
    "Airport Transfers",
    "Taxes",
    "Changes & Cancellations",
    "Cancellations and Refunds",
    "Valid ID Proof",
    "Health & Vaccinations",
    "Travel Insurance",
    "Changes by [^:\n]+",
    "Service Providers Liability",
    "Force Majeure",
    "Governing Law",
    "Ownership",
  ];

  subItems.forEach((sub) => {
    const reg = new RegExp(`(^|\\s|\\.|\\n)(${sub}):`, "gi");
    text = text.replace(reg, "\n__SUB__$2:");
  });

  // Split payment nested items e.g. "Minimum 50%...", "Remaining 50%...", "In Case of Airline...", "If a booking is under..."
  text = text
    .replace(/(\.|\n)\s*(Minimum 50%[^\.]+?\.)/gi, "\n__NESTED__$2")
    .replace(/(\.|\n)\s*(Remaining 50%[^\.]+?\.)/gi, "\n__NESTED__$2")
    .replace(/(\.|\n)\s*(In Case of Airline[^\.]+?\.)/gi, "\n__NESTED__$2")
    .replace(/(\.|\n)\s*(If a booking is under[^\.]+?\.)/gi, "\n__NESTED__$2");

  // Split general sentences if merged after period without space
  text = text.replace(/([.!?])([A-Z0-9])/g, "$1\n$2");

  const rawLines = text
    .split("\n")
    .map((l) => l.replace(/^\d+[\.\)]\s*/, "").replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);

  let headerCount = 0;
  let nestedCount = 0;

  const items = [];
  rawLines.forEach((line) => {
    if (line.startsWith("__HEADER__")) {
      headerCount++;
      nestedCount = 0;
      const cleanLine = line.replace("__HEADER__", "").trim();
      items.push({
        type: "header",
        level: 1,
        number: headerCount,
        text: `${headerCount}. ${cleanLine.replace(/:$/, "")}:`,
        rawText: cleanLine,
      });
    } else if (line.startsWith("__SUB__")) {
      nestedCount = 0;
      const cleanLine = line.replace("__SUB__", "").trim();
      items.push({
        type: "subitem",
        level: 2,
        text: cleanLine,
        rawText: cleanLine,
      });
    } else if (line.startsWith("__NESTED__")) {
      nestedCount++;
      const cleanLine = line.replace("__NESTED__", "").trim();
      items.push({
        type: "nested",
        level: 3,
        number: nestedCount,
        text: cleanLine,
        rawText: cleanLine,
      });
    } else {
      items.push({
        type: "text",
        level: 0,
        text: line,
        rawText: line,
      });
    }
  });

  return items;
};

const renderStructuredTermsContent = (terms) => {
  const items = parseStructuredTerms(terms);
  if (!items.length) {
    return (
      <div className="space-y-3 font-sans text-xs sm:text-sm text-slate-800 leading-relaxed">
        <p>
          Welcome to <strong className="font-bold text-slate-900">Holiday Circuit</strong>. These Terms and Conditions govern your use of the Holiday Circuit services. When You Make a booking or reservation, you agree to be bound by these Terms.
        </p>
        <h4 className="font-bold text-slate-900 text-sm sm:text-base pt-2">1. Bookings and Reservations:</h4>
        <div className="flex items-start gap-2 pl-4">
          <span className="text-slate-400 text-base leading-none select-none">•</span>
          <p className="flex-1"><strong className="font-semibold text-slate-900">Booking Process:</strong> When you make a booking through Holiday Circuit, you agree to provide accurate and complete information.</p>
        </div>
        <div className="flex items-start gap-2 pl-4">
          <span className="text-slate-400 text-base leading-none select-none">•</span>
          <p className="flex-1"><strong className="font-semibold text-slate-900">Payment Terms:</strong> Payments are due as specified during booking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 font-sans text-xs sm:text-sm text-slate-800 leading-relaxed">
      {items.map((item, idx) => {
        if (item.type === "header") {
          return (
            <h4 key={idx} className="font-bold text-slate-900 text-sm sm:text-base pt-2 border-b border-slate-100 pb-1">
              {item.text}
            </h4>
          );
        }
        if (item.type === "subitem") {
          const colonIdx = item.rawText.indexOf(":");
          if (colonIdx > 0 && colonIdx < 40) {
            const label = item.rawText.slice(0, colonIdx + 1);
            const rest = item.rawText.slice(colonIdx + 1);
            return (
              <div key={idx} className="flex items-start gap-2 pl-3 sm:pl-4">
                <span className="text-slate-400 text-base leading-none select-none shrink-0">•</span>
                <p className="flex-1">
                  <strong className="font-semibold text-slate-900">{label}</strong>
                  {rest}
                </p>
              </div>
            );
          }
          return (
            <div key={idx} className="flex items-start gap-2 pl-3 sm:pl-4">
              <span className="text-slate-400 text-base leading-none select-none shrink-0">•</span>
              <p className="flex-1">{item.rawText}</p>
            </div>
          );
        }
        if (item.type === "nested") {
          return (
            <div key={idx} className="flex items-start gap-2 pl-7 sm:pl-9 text-slate-700 text-xs sm:text-[13px]">
              <span className="font-semibold text-slate-900 shrink-0">{item.number}.</span>
              <p className="flex-1">{item.rawText}</p>
            </div>
          );
        }
        return (
          <p key={idx} className="text-slate-800">
            {item.rawText}
          </p>
        );
      })}
    </div>
  );
};

export const InlineTermsEditor = forwardRef(
  ({ initialTerms = [], quotationId, isPackageTemplate, onUpdate }, ref) => {
    const [isEditing, setIsEditing] = useState(false);

    useImperativeHandle(ref, () => ({
      startEditing: () => setIsEditing(true),
    }));
    const [termsList, setTermsList] = useState([]);
    const [loadingTerms, setLoadingTerms] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedTermIndex, setSelectedTermIndex] = useState("");
    const [previewTerms, setPreviewTerms] = useState(initialTerms);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsDropdownOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch terms when edit mode is toggled on
    useEffect(() => {
      if (isEditing && termsList.length === 0) {
        fetchTerms();
      }
    }, [isEditing]);

    const fetchTerms = async () => {
      try {
        setLoadingTerms(true);
        const res = await API.get("/agent/terms");
        let list = [];
        if (Array.isArray(res.data)) {
          list = res.data;
        } else if (res.data?.success || res.data?.data || res.data?.terms) {
          list = res.data.data || res.data.terms || [];
        }
        setTermsList(list);

        if (initialTerms && initialTerms.length > 0) {
          const normInitial = (Array.isArray(initialTerms) ? initialTerms.join("") : String(initialTerms)).replace(/\s+/g, "");
          const matchedIndex = list.findIndex((t) => {
            if (!t.content) return false;
            const normT = t.content.replace(/\s+/g, "");
            return normInitial === normT;
          });
          if (matchedIndex !== -1) {
            setSelectedTermIndex(matchedIndex);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch terms and conditions.");
      } finally {
        setLoadingTerms(false);
      }
    };

    const handleSelectTerm = (val) => {
      setSelectedTermIndex(val);
      setIsDropdownOpen(false);
      if (val === "") {
        setPreviewTerms(initialTerms);
      } else {
        const termObj = termsList[Number(val)];
        if (termObj?.content) {
          const termsArray = termObj.content
            .split("\n")
            .filter((t) => t.trim() !== "");
          setPreviewTerms(termsArray);
        } else {
          setPreviewTerms([]);
        }
      }
    };

    const handleSave = async () => {
      if (selectedTermIndex === "") {
        toast.error("Please select a term to apply.");
        return;
      }

      try {
        setSaving(true);
        const endpoint = isPackageTemplate
          ? `/agent/packages/${quotationId}/terms`
          : `/agent/quotations/${quotationId}/terms`;

        const res = await API.put(endpoint, {
          termsAndConditions: previewTerms,
        });

        if (res.data?.success) {
          toast.success("Terms updated successfully.");
          if (onUpdate) onUpdate(previewTerms);
          setIsEditing(false);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to update terms.");
      } finally {
        setSaving(false);
      }
    };

    const handleCancel = () => {
      setIsEditing(false);
      setSelectedTermIndex("");
      setPreviewTerms(initialTerms);
    };

    if (isEditing) {
      return (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80" ref={dropdownRef}>
            <div
              onClick={() => !loadingTerms && setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm outline-none ${
                loadingTerms
                  ? "opacity-70 cursor-not-allowed"
                  : "cursor-pointer hover:border-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              }`}
            >
              <span
                className={
                  selectedTermIndex === "" ? "text-slate-500" : "text-slate-900"
                }
              >
                {selectedTermIndex === "" ? "Select Terms" : termsList[selectedTermIndex]?.name}
              </span>
              <div className="flex items-center text-slate-500">
                {loadingTerms ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </div>
            </div>

            {isDropdownOpen && !loadingTerms && (
              <div className="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-y-auto">
                <div className="py-1">
                  {termsList.map((term, idx) => (
                    <div
                      key={term._id || idx}
                      onClick={() => handleSelectTerm(idx)}
                      className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 transition-colors border-t border-slate-100 ${
                        selectedTermIndex === idx
                          ? "bg-slate-50 font-semibold text-blue-600"
                          : "text-slate-700"
                      }`}
                    >
                      {term.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            {previewTerms && (Array.isArray(previewTerms) ? previewTerms.length > 0 : String(previewTerms).trim()) ? (
              renderStructuredTermsContent(previewTerms)
            ) : (
              <p className="text-sm text-slate-500 italic">
                No terms selected or content is empty.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving || selectedTermIndex === ""}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save Details
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {renderStructuredTermsContent(initialTerms)}
      </div>
    );
  },
);
