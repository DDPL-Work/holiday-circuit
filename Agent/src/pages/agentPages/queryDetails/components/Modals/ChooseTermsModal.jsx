import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import API from "../../../../../utils/Api";
import toast from "react-hot-toast";

export const ChooseTermsModal = ({ isOpen, onClose, onUpdate, quotationId, isPackageTemplate }) => {
  const [termsList, setTermsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTermIndex, setSelectedTermIndex] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchTerms();
    }
  }, [isOpen]);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const res = await API.get("/agent/terms");
      if (Array.isArray(res.data)) {
        setTermsList(res.data);
      } else if (res.data?.success || res.data?.data || res.data?.terms) {
        setTermsList(res.data.data || res.data.terms || []);
      }
    } catch (err) {
      toast.error("Failed to fetch terms and conditions.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (selectedTermIndex === null) {
      toast.error("Please select a term to apply.");
      return;
    }
    
    const selectedTermContent = termsList[selectedTermIndex]?.content;
    if (!selectedTermContent) return;

    // Convert string to array by splitting on newlines
    const termsArray = selectedTermContent.split("\n").filter(t => t.trim() !== "");

    try {
      setSaving(true);
      const endpoint = isPackageTemplate 
        ? `/agent/packages/${quotationId}/terms`
        : `/agent/quotations/${quotationId}/terms`;
        
      const res = await API.put(endpoint, {
        termsAndConditions: termsArray
      });

      if (res.data?.success) {
        toast.success("Terms updated successfully.");
        onUpdate(termsArray); // Update parent state
        onClose();
      }
    } catch (err) {
      toast.error("Failed to update terms.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-[4px] p-4 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white w-full max-w-lg rounded-xl shadow-2xl relative border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Choose Terms & Conditions</h3>
              <p className="text-xs leading-relaxed text-slate-500 mt-1">Select one of your saved templates for this quotation.</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mb-3" />
                <p className="text-xs font-medium">Loading terms...</p>
              </div>
            ) : termsList.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                <p>You haven't created any terms and conditions yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {termsList.map((term, idx) => (
                  <div
                    key={term._id || idx}
                    onClick={() => setSelectedTermIndex(idx)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      selectedTermIndex === idx
                        ? "border-[#0f172a] bg-slate-50 ring-1 ring-[#0f172a]"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <h4 className="font-semibold text-sm text-slate-900">{term.name}</h4>
                    {selectedTermIndex === idx && <CheckCircle className="text-[#0f172a]" size={18} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={saving || selectedTermIndex === null}
              className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-70 cursor-pointer shadow-2xs flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Updating..." : "Update Terms"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

