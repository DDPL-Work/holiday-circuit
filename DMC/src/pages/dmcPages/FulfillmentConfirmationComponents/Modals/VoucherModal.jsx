import React from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Phone, CheckCircle, RefreshCw } from 'lucide-react';

export default function VoucherModal({
  activeVoucherService,
  setActiveVoucherService,
  setShowVoucherModal,
  files,
  handleFile,
  handleSubmitVoucherModal,
  issuingVoucher = false,
}) {
  return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            {" "}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              {" "}
              {/* Modal Header */}{" "}
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                {" "}
                <div className="flex items-center gap-2.5">
                  {" "}
                  <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                    {" "}
                    <FileText size={16} />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="text-sm font-bold">
                      Service Confirmation & Emergency Support
                    </h3>{" "}
                    <p className="text-[11px] text-slate-300">
                      {" "}
                      {activeVoucherService?.serviceName ||
                        "Selected Booking Service"}{" "}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  {" "}
                  <X size={16} />{" "}
                </button>{" "}
              </div>{" "}
              {/* Modal Body (Compact, No Vertical Scroll) */}{" "}
              <div className="p-4 space-y-3 text-xs">
                {" "}
                {/* Row 1: Type, Service Name, Service Date */}{" "}
                <div className="grid grid-cols-3 gap-3">
                  {" "}
                  <div>
                    {" "}
                    <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                      Service Type *
                    </label>{" "}
                    <input
                      type="text"
                      readOnly
                      value={activeVoucherService?.type || "Hotel"}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold outline-none"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                      Service Name *
                    </label>{" "}
                    <input
                      type="text"
                      value={activeVoucherService?.serviceName || ""}
                      onChange={(e) =>
                        setActiveVoucherService((prev) => ({
                          ...prev,
                          serviceName: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium outline-none focus:border-blue-500"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                      Service Date *
                    </label>{" "}
                    <input
                      type="date"
                      value={activeVoucherService?.serviceDate || ""}
                      onChange={(e) =>
                        setActiveVoucherService((prev) => ({
                          ...prev,
                          serviceDate: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium outline-none focus:border-blue-500"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                {/* Row 2: Status, Confirmation Number (CNF), Voucher Reference */}{" "}
                <div className="grid grid-cols-3 gap-3">
                  {" "}
                  <div>
                    {" "}
                    <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                      Booking Status *
                    </label>{" "}
                    <select
                      value={activeVoucherService?.status || "Confirmed"}
                      onChange={(e) =>
                        setActiveVoucherService((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50/50 outline-none"
                    >
                      {" "}
                      <option value="Confirmed">Confirmed</option>{" "}
                      <option value="Re-Confirmed">Re-Confirmed</option>{" "}
                      <option value="Pending">Pending</option>{" "}
                    </select>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                      Confirmation No (CNF) *
                    </label>{" "}
                    <input
                      type="text"
                      value={activeVoucherService?.confirmationNumber || ""}
                      onChange={(e) =>
                        setActiveVoucherService((prev) => ({
                          ...prev,
                          confirmationNumber: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                      placeholder="CNF-17241"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                      Voucher Reference
                    </label>{" "}
                    <input
                      type="text"
                      value={activeVoucherService?.voucherNumber || ""}
                      onChange={(e) =>
                        setActiveVoucherService((prev) => ({
                          ...prev,
                          voucherNumber: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                      placeholder="VCH-88219"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                {/* Row 3: Emergency Support */}{" "}
                <div>
                  {" "}
                  <label className="font-semibold text-slate-700 text-[11px] flex items-center gap-1 mb-1">
                    {" "}
                    <Phone size={12} className="text-amber-600" /> Emergency
                    Contact Details (24/7 Local Support) *{" "}
                  </label>{" "}
                  <textarea
                    rows={2}
                    value={activeVoucherService?.emergency || ""}
                    onChange={(e) =>
                      setActiveVoucherService((prev) => ({
                        ...prev,
                        emergency: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:border-blue-500 bg-amber-50/30"
                    placeholder="Enter local DMC support contact details..."
                  />{" "}
                </div>{" "}
                {/* Row 4: Compact Document Upload Vault (Fixed & Slim - Fits Modal) */}{" "}
                <div>
                  {" "}
                  <p className="font-bold text-slate-800 text-[11px] mb-1.5">
                    Document Upload Vault
                  </p>{" "}
                  <div className="grid grid-cols-3 gap-2.5">
                    {" "}
                    {/* Supplier Confirmation */}{" "}
                    <div className="flex items-center justify-between border border-dashed border-blue-300 rounded-xl p-2 bg-blue-50/40">
                      {" "}
                      <div className="min-w-0 pr-1">
                        {" "}
                        <p className="text-[11px] font-bold text-slate-800 truncate">
                          Supplier Confirmation
                        </p>{" "}
                        <p className="text-[9.5px] text-slate-500 truncate">
                          {files.supplier ? files.supplier.name : "PDF / Word"}
                        </p>{" "}
                      </div>{" "}
                      <label className="shrink-0 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-2xs">
                        {" "}
                        Choose{" "}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            handleFile("supplier", e.target.files[0])
                          }
                        />{" "}
                      </label>{" "}
                    </div>{" "}
                    {/* Voucher Reference */}{" "}
                    <div className="flex items-center justify-between border border-dashed border-emerald-300 rounded-xl p-2 bg-emerald-50/40">
                      {" "}
                      <div className="min-w-0 pr-1">
                        {" "}
                        <p className="text-[11px] font-bold text-slate-800 truncate">
                          Voucher Reference
                        </p>{" "}
                        <p className="text-[9.5px] text-slate-500 truncate">
                          {files.voucher ? files.voucher.name : "PDF / Word"}
                        </p>{" "}
                      </div>{" "}
                      <label className="shrink-0 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-2xs">
                        {" "}
                        Choose{" "}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            handleFile("voucher", e.target.files[0])
                          }
                        />{" "}
                      </label>{" "}
                    </div>{" "}
                    {/* Terms & Conditions */}{" "}
                    <div className="flex items-center justify-between border border-dashed border-purple-300 rounded-xl p-2 bg-purple-50/40">
                      {" "}
                      <div className="min-w-0 pr-1">
                        {" "}
                        <p className="text-[11px] font-bold text-slate-800 truncate">
                          Terms & Conditions
                        </p>{" "}
                        <p className="text-[9.5px] text-slate-500 truncate">
                          {files.terms ? files.terms.name : "PDF / Word"}
                        </p>{" "}
                      </div>{" "}
                      <label className="shrink-0 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-2xs">
                        {" "}
                        Choose{" "}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            handleFile("terms", e.target.files[0])
                          }
                        />{" "}
                      </label>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              {/* Modal Footer */}{" "}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                {" "}
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-xl bg-white hover:bg-slate-100 cursor-pointer"
                >
                  {" "}
                  Cancel{" "}
                </button>{" "}
                <button
                  type="button"
                  disabled={issuingVoucher}
                  onClick={handleSubmitVoucherModal}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {" "}
                  {issuingVoucher ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle size={14} />
                  )}{" "}
                  {issuingVoucher ? "Saving & Issuing..." : "Generate & Issue Voucher"}{" "}
                </button>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>
  );
}
