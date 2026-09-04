import React from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Phone, CheckCircle } from 'lucide-react';

export default function SupplierPaymentModal({ supplierPaymentModal, setSupplierPaymentModal, handleCloseSupplierPaymentModal, handleSaveSupplierPayment, savingPayment }) {
  return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
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
              className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200"
            >
              {" "}
              {/* Modal Header */}{" "}
              <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                {" "}
                <div>
                  {" "}
                  <h3 className="text-sm font-bold">
                    Record Supplier Payment
                  </h3>{" "}
                  <p className="text-xs text-slate-300">
                    {" "}
                    {supplierPaymentModal.service?.serviceName} •{" "}
                    {supplierPaymentModal.supplierName}{" "}
                  </p>{" "}
                </div>{" "}
                <button
                  type="button"
                  onClick={handleCloseSupplierPaymentModal}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  {" "}
                  <X size={16} />{" "}
                </button>{" "}
              </div>{" "}
              {/* Modal Form */}{" "}
              <div className="p-5 space-y-3.5 text-xs">
                {" "}
                <div className="grid grid-cols-2 gap-3">
                  {" "}
                  <div>
                    {" "}
                    <label className="block font-semibold text-slate-700 mb-1">
                      {" "}
                      Payment Amount (INR){" "}
                      <span className="text-rose-500">*</span>{" "}
                    </label>{" "}
                    <input
                      type="number"
                      placeholder="e.g. 54000"
                      value={supplierPaymentModal.amount}
                      onChange={(e) =>
                        setSupplierPaymentModal((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="block font-semibold text-slate-700 mb-1">
                      Status
                    </label>{" "}
                    <select
                      value={supplierPaymentModal.status}
                      onChange={(e) =>
                        setSupplierPaymentModal((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {" "}
                      <option value="Paid">Paid</option>{" "}
                      <option value="Partially Paid">Partially Paid</option>{" "}
                      <option value="Pending">Pending</option>{" "}
                    </select>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="grid grid-cols-2 gap-3">
                  {" "}
                  <div>
                    {" "}
                    <label className="block font-semibold text-slate-700 mb-1">
                      Payment Date
                    </label>{" "}
                    <input
                      type="date"
                      value={supplierPaymentModal.paymentDate}
                      onChange={(e) =>
                        setSupplierPaymentModal((prev) => ({
                          ...prev,
                          paymentDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="block font-semibold text-slate-700 mb-1">
                      Due Date
                    </label>{" "}
                    <input
                      type="date"
                      value={supplierPaymentModal.dueDate}
                      onChange={(e) =>
                        setSupplierPaymentModal((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="grid grid-cols-2 gap-3">
                  {" "}
                  <div>
                    {" "}
                    <label className="block font-semibold text-slate-700 mb-1">
                      UTR / Ref Number
                    </label>{" "}
                    <input
                      type="text"
                      placeholder="e.g. UTR9988223"
                      value={supplierPaymentModal.utrNumber}
                      onChange={(e) =>
                        setSupplierPaymentModal((prev) => ({
                          ...prev,
                          utrNumber: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bank / Mode
                    </label>{" "}
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank"
                      value={supplierPaymentModal.bankName}
                      onChange={(e) =>
                        setSupplierPaymentModal((prev) => ({
                          ...prev,
                          bankName: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block font-semibold text-slate-700 mb-1">
                    Comments / Notes
                  </label>{" "}
                  <textarea
                    rows={3}
                    placeholder="Enter payment confirmation details or notes"
                    value={supplierPaymentModal.comments}
                    onChange={(e) =>
                      setSupplierPaymentModal((prev) => ({
                        ...prev,
                        comments: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />{" "}
                </div>{" "}
              </div>{" "}
              {/* Modal Footer */}{" "}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                {" "}
                <button
                  type="button"
                  onClick={handleCloseSupplierPaymentModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  {" "}
                  Cancel{" "}
                </button>{" "}
                <button
                  type="button"
                  onClick={handleSaveSupplierPayment}
                  disabled={savingSupplierPayment}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow-xs transition"
                >
                  {" "}
                  {savingSupplierPayment
                    ? "Saving..."
                    : "Save Payment Record"}{" "}
                </button>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>
  );
}
