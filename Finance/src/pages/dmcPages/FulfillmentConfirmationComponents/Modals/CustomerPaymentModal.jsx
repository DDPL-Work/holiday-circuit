import React from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Phone, CheckCircle } from 'lucide-react';
import { formatServiceDate } from '../utils';

export default function CustomerPaymentModal({ 
  selectedQuery, 
  setShowCustomerPaymentModal 
}) {
  const customerTotalAmount = Number(selectedQuery?.packagePrice || selectedQuery?.quotationPricing?.totalAmount || 0);
  const customerInstallments = selectedQuery?.agentInvoice?.trackerPayments || [];
  const customerPaidAmount = customerInstallments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

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
              className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200"
            >
              {" "}
              <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                {" "}
                <div>
                  {" "}
                  <h3 className="text-sm font-bold">
                    Customer Payment & Finance Payout Breakdown
                  </h3>{" "}
                  <p className="text-xs text-slate-300">
                    Query ID: {selectedQuery?.queryId}
                  </p>{" "}
                </div>{" "}
                <button
                  type="button"
                  onClick={() => setShowCustomerPaymentModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  {" "}
                  <X size={16} />{" "}
                </button>{" "}
              </div>{" "}
              <div className="p-5 space-y-4 text-xs">
                {" "}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {" "}
                  <div>
                    {" "}
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Total Booking Price
                    </p>{" "}
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">
                      {" "}
                      ₹{customerTotalAmount.toLocaleString("en-IN")}{" "}
                    </p>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Total Paid Received
                    </p>{" "}
                    <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                      {" "}
                      ₹{customerPaidAmount.toLocaleString("en-IN")}{" "}
                    </p>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Balance Due
                    </p>{" "}
                    <p className="text-base font-extrabold text-amber-600 mt-0.5">
                      {" "}
                      ₹
                      {Math.max(
                        0,
                        customerTotalAmount - customerPaidAmount,
                      ).toLocaleString("en-IN")}{" "}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h4 className="font-bold text-slate-900 mb-2">
                    Finance Team Installments / Payout Chunks
                  </h4>{" "}
                  {customerInstallments.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {" "}
                      {customerInstallments.map((inst, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                        >
                          {" "}
                          <div>
                            {" "}
                            <p className="font-bold text-slate-900">
                              ₹
                              {Number(inst.amount || 0).toLocaleString("en-IN")}
                            </p>{" "}
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {" "}
                              Date:{" "}
                              {formatServiceDate(
                                inst.paymentDate || inst.createdAt,
                              )}{" "}
                              • Paid by:{" "}
                              {inst.paidByName || "Finance Team"}{" "}
                            </p>{" "}
                            {inst.utrNumber && (
                              <p className="text-[10.5px] text-slate-400">
                                UTR: {inst.utrNumber}{" "}
                                {inst.bankName ? `(${inst.bankName})` : ""}
                              </p>
                            )}{" "}
                          </div>{" "}
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[10.5px]">
                            {" "}
                            {inst.status || "Verified Paid"}{" "}
                          </span>{" "}
                        </div>
                      ))}{" "}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">
                      No payout installments logged by Finance Team yet.
                    </p>
                  )}{" "}
                </div>{" "}
              </div>{" "}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                {" "}
                <button
                  type="button"
                  onClick={() => setShowCustomerPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  {" "}
                  Close{" "}
                </button>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>
  );
}
