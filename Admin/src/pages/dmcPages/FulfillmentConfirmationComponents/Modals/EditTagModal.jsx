import React from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Phone, CheckCircle } from 'lucide-react';

export default function EditTagModal({ editTagModal, setEditTagModal, handleCloseEditTagModal, handleSaveTagComments, savingTag, showTagDropdown, setShowTagDropdown }) {
  return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            {" "}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              {" "}
              {/* Header */}{" "}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                {" "}
                <h3 className="font-bold text-slate-900 text-sm">
                  Edit Tag/Comments
                </h3>{" "}
                <button
                  type="button"
                  onClick={handleCloseEditTagModal}
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  {" "}
                  <X size={16} />{" "}
                </button>{" "}
              </div>{" "}
              {/* Body */}{" "}
              <div className="p-5 space-y-4">
                {" "}
                <div>
                  {" "}
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {" "}
                    Select Tag{" "}
                    <span className="text-slate-400 font-normal">
                      (optional)
                    </span>{" "}
                  </label>{" "}
                  <div className="relative">
                    {" "}
                    <input
                      type="text"
                      placeholder="Type to search..."
                      value={editTagModal.tag}
                      onClick={() => setShowTagDropdown(true)}
                      onFocus={() => setShowTagDropdown(true)}
                      onChange={(e) => {
                        setEditTagModal((prev) => ({
                          ...prev,
                          tag: e.target.value,
                        }));
                        setShowTagDropdown(true);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 bg-white cursor-pointer"
                    />{" "}
                    {showTagDropdown && (
                      <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden py-1 divide-y divide-slate-50">
                        {" "}
                        {[
                          "Pending Reconfirmation",
                          "Payment due for Confirmation",
                          "Reconfirmed",
                        ]
                          .filter((opt) =>
                            opt
                              .toLowerCase()
                              .includes((editTagModal.tag || "").toLowerCase()),
                          )
                          .map((option) => (
                            <label
                              key={option}
                              onClick={() => {
                                setEditTagModal((prev) => ({
                                  ...prev,
                                  tag: option,
                                }));
                                setShowTagDropdown(false);
                              }}
                              className={`flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${editTagModal.tag === option ? "bg-slate-50 font-semibold text-slate-900" : "text-slate-700"}`}
                            >
                              {" "}
                              <input
                                type="radio"
                                name="selectTagOption"
                                checked={editTagModal.tag === option}
                                onChange={() => {
                                  setEditTagModal((prev) => ({
                                    ...prev,
                                    tag: option,
                                  }));
                                  setShowTagDropdown(false);
                                }}
                                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0"
                              />{" "}
                              <span className="text-xs text-slate-800">
                                {option}
                              </span>{" "}
                            </label>
                          ))}{" "}
                      </div>
                    )}{" "}
                  </div>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {" "}
                    Any Comments{" "}
                    <span className="text-slate-400 font-normal">
                      (optional)
                    </span>{" "}
                  </label>{" "}
                  <textarea
                    rows={4}
                    placeholder="Provide any additional comments if necessary"
                    value={editTagModal.comments}
                    onChange={(e) =>
                      setEditTagModal((prev) => ({
                        ...prev,
                        comments: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 resize-y"
                  />{" "}
                </div>{" "}
              </div>{" "}
              {/* Footer */}{" "}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-start gap-2.5">
                {" "}
                <button
                  type="button"
                  onClick={handleSaveTagComments}
                  disabled={savingTag}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0066cc] hover:bg-blue-700 rounded-lg cursor-pointer shadow-xs transition"
                >
                  {" "}
                  {savingTag ? "Saving..." : "Save"}{" "}
                </button>{" "}
                <button
                  type="button"
                  onClick={handleCloseEditTagModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer shadow-xs transition"
                >
                  {" "}
                  Cancel{" "}
                </button>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>
  );
}
