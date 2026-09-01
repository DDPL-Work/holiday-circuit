import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import API from "../../../../../utils/Api";
import toast from "react-hot-toast";

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
          const normInitial = initialTerms.join("").replace(/\\s+/g, "");
          const matchedIndex = list.findIndex((t) => {
            if (!t.content) return false;
            const normT = t.content.replace(/\\s+/g, "");
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
            {previewTerms && previewTerms.length > 0 ? (
              <div className="space-y-4">
                {previewTerms.map((term, tIdx) => (
                  <div
                    key={tIdx}
                    className="rte-content text-slate-800 text-xs sm:text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: term }}
                  />
                ))}
              </div>
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
        {initialTerms &&
        Array.isArray(initialTerms) &&
        initialTerms.length > 0 ? (
          <div className="space-y-4">
            {initialTerms.map((term, tIdx) => (
              <div
                key={tIdx}
                className="rte-content text-slate-800 text-xs sm:text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: term }}
              />
            ))}
          </div>
        ) : (
          <>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              Welcome to{" "}
              <strong className="font-bold text-slate-900">
                Holiday Circuit
              </strong>
              . These Terms and Conditions govern your use of the{" "}
              <strong className="font-bold text-slate-900">
                Holiday Circuit
              </strong>{" "}
              services. When You Make a booking or reservation, you agree to be
              bound by these Terms.
            </p>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Bookings and Reservations
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-800">
                <li>
                  <strong className="font-bold text-slate-900">
                    Booking Process:
                  </strong>{" "}
                  When you make a booking or reservation through{" "}
                  <strong className="font-bold text-slate-900">
                    Holiday Circuit
                  </strong>
                  , you agree to provide accurate and complete information. Any
                  discrepancies or errors in the information you provide may
                  result in the cancellation of your booking.
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                <strong className="font-bold text-slate-900">Payment:</strong>{" "}
                Payments for bookings are due as specified during the booking
                process. Failure to make payments on time may result in the
                cancellation of your booking.
              </p>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                <strong className="font-bold text-slate-900">
                  Cancellations and Refunds:
                </strong>{" "}
                Cancellation and refund policies vary depending on the type of
                booking. Please refer to the specific cancellation policy
                provided at the time of booking.{" "}
                <strong className="font-bold text-slate-900">
                  Holiday Circuit
                </strong>{" "}
                reserves the right to charge cancellation fees as applicable.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Intellectual Property
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-800">
                <li>
                  <strong className="font-bold text-slate-900">
                    Ownership:
                  </strong>{" "}
                  All content, trademarks, logos, and intellectual property on
                  the{" "}
                  <strong className="font-bold text-slate-900">
                    Holiday Circuit
                  </strong>{" "}
                  website and app are the property of{" "}
                  <strong className="font-bold text-slate-900">
                    Holiday Circuit
                  </strong>{" "}
                  or its licensors. You may not use, reproduce, or distribute
                  our content without prior written permission.
                </li>
              </ul>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              <strong className="font-bold text-slate-900">
                Changes to Terms and Conditions:
              </strong>{" "}
              We reserve the right to update and modify these Terms and
              Conditions at any time. Please review them periodically for
              changes. Your continued use of our services after any
              modifications indicates your acceptance of the updated Terms.
            </p>
            <p className="italic font-bold text-slate-900 pt-2 text-xs sm:text-sm">
              By booking with Holiday Circuit, you acknowledge that you have
              read, understood, and agreed to these Terms and Conditions.
            </p>
          </>
        )}
      </div>
    );
  },
);
