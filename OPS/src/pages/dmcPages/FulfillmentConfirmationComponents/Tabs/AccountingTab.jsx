import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FileText,
  RefreshCw,
  MessageSquare,
  CheckCircle,
  Maximize2,
  Copy,
  FileSpreadsheet,
} from "lucide-react";
import ProformaInvoiceView from "../../../../components/accounting/ProformaInvoiceView";

export default function AccountingTab({
  accountingSubTab,
  setAccountingSubTab,
  customerPaidAmount,
  customerTotalAmount,
  selectedQuery,
  formatTimeAgo,
  customerInstallments,
  formatServiceDate,
  navigate: propNavigate,
  referenceServices,
  getServiceKey,
  getResolvedServiceDisplayTotal,
  serviceTypeLabel,
  handleOpenSupplierPaymentModal,
  proformaInvoiceData,
  setIsCreatingProforma,
  setProformaInvoiceData,
  handleProfitRefresh,
  profitRefreshing,
  handleProfitCopyToClipboard,
  handleProfitExcelExport,
}) {
  const defaultNavigate = useNavigate();
  const navigate = propNavigate || defaultNavigate;

  return (
    <motion.div
      key="accounting-tab-panel"
      initial={{
        opacity: 0,
        y: 10,
        scale: 0.995,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: -8,
        scale: 0.995,
      }}
      transition={{
        duration: 0.22,
        ease: "easeOut",
      }}
      className="mt-2 mb-2"
    >
      <div className="flex flex-col lg:flex-row items-stretch gap-0 overflow-hidden font-sans bg-white">
        {/* LEFT SUB-SIDEBAR NAVIGATION (Compact Width w-40 matching Sembark) */}
        <div className="w-full lg:w-40 shrink-0 bg-white border-r border-slate-200/80 py-1 font-sans">
          <div className="flex lg:flex-col overflow-x-auto">
            <button
              type="button"
              onClick={() => setAccountingSubTab("payments")}
              className={`w-full text-left px-3.5 py-2.5 text-[14px] transition-all relative flex items-center justify-between cursor-pointer ${
                accountingSubTab === "payments"
                  ? "bg-[#f8fafc] text-slate-900 font-bold"
                  : "text-slate-500 font-semibold hover:text-slate-900 hover:bg-slate-50/50"
              }`}
            >
              <span>Payments</span>
              {accountingSubTab === "payments" && (
                <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#35489e] rounded-l-xs" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setAccountingSubTab("proforma")}
              className={`w-full text-left px-3.5 py-2.5 text-[14px] transition-all relative flex items-center justify-between cursor-pointer ${
                accountingSubTab === "proforma"
                  ? "bg-[#f8fafc] text-slate-900 font-bold"
                  : "text-slate-500 font-semibold hover:text-slate-900 hover:bg-slate-50/50"
              }`}
            >
              <span>Proforma Invoice</span>
              {accountingSubTab === "proforma" && (
                <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#35489e] rounded-l-xs" />
              )}
            </button>
          </div>
        </div>

        {/* RIGHT CONTENT AREA (White Canvas with Light Gray Inner Section Blocks matching Image 1) */}
        <div className="flex-1 min-w-0 w-full px-3 lg:px-4 pt-3 pb-3 space-y-5 bg-white">
          {accountingSubTab === "payments" && (
            <div className="space-y-5 font-sans">
              {/* SECTION 1: PAYMENTS FROM FINANCE */}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2.5">
                  Payments from Finance
                </h3>
                {/* Light Gray Section Wrapper matching Image 1 */}
                <div className="w-full bg-[#f1f5f9] p-3.5 lg:p-4.5 flex flex-col lg:flex-row items-start gap-3.5 lg:gap-5 rounded-xs border border-slate-200/50">
                  {/* Left summary stat block */}
                  <div className="w-full lg:w-44 shrink-0 py-1 flex flex-col justify-start">
                    <p className="text-xs font-bold text-slate-900">INR</p>
                    <div className="mt-1 text-3xl font-extrabold text-[#15803d] tracking-tight leading-none">
                      + {customerPaidAmount.toLocaleString("en-IN")}
                    </div>
                    <div className="mt-1.5 text-3xl font-extrabold text-slate-900 flex items-baseline gap-1 leading-none">
                      <span className="text-slate-400 font-normal text-xl">/</span>
                      <span>{customerTotalAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="mt-3.5 space-y-1 text-[11px] text-slate-500 font-normal leading-tight">
                      <p>
                        Created by{" "}
                        {selectedQuery?.agentName &&
                        !selectedQuery.agentName.includes("DDLC")
                          ? selectedQuery.agentName
                          : "Finance Team"}
                        , {formatTimeAgo(selectedQuery?.createdAt)}
                      </p>
                      <p>
                        Last Updated {formatTimeAgo(selectedQuery?.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Right Installment list */}
                  <div className="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-sm p-3.5 lg:p-4 shadow-2xs space-y-3">
                    <div className="grid grid-cols-12 text-xs font-bold text-slate-600 pb-2 border-b border-slate-200/80 gap-2">
                      <div className="col-span-2">Amount (INR)</div>
                      <div className="col-span-3">Status</div>
                      <div className="col-span-2">Due Date</div>
                      <div className="col-span-5">Comments</div>
                    </div>
                    {customerInstallments.length > 0 ? (
                      customerInstallments.map((inst, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 text-xs items-start py-2.5 border-b border-slate-100 last:border-0 gap-2"
                        >
                          <div className="col-span-2 font-extrabold text-slate-900 text-sm">
                            ₹{Number(inst.amount || 0).toLocaleString("en-IN")}
                          </div>
                          <div className="col-span-3">
                            <div className="flex flex-col gap-0.5">
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 text-[11px] w-fit whitespace-nowrap mb-0.5">
                                <span>
                                  Paid:{" "}
                                  {formatServiceDate(
                                    inst.paymentDate || inst.createdAt,
                                  )}
                                </span>
                                <FileText
                                  size={11}
                                  className="text-slate-400 cursor-pointer hover:text-slate-700"
                                />
                                <RefreshCw
                                  size={11}
                                  className="text-slate-400 cursor-pointer hover:text-slate-700"
                                />
                              </div>
                              <p className="text-[11px] text-slate-700 font-medium leading-tight">
                                {inst.paidByName &&
                                !inst.paidByName.includes("DDLC")
                                  ? inst.paidByName
                                  : "Finance Team"}
                              </p>
                              <p className="text-[10.5px] text-slate-500 font-normal leading-tight">
                                Trip ID: {selectedQuery?.queryId}
                              </p>
                              {inst.utrNumber && (
                                <p className="text-[10.5px] text-slate-500 font-normal leading-tight break-all">
                                  UTR: {inst.utrNumber}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2 text-xs font-semibold text-slate-700 pt-0.5 text-left whitespace-nowrap">
                            {formatServiceDate(
                              inst.dueDate || inst.paymentDate,
                            )}
                          </div>
                          <div className="col-span-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-0.5 min-w-0">
                            <span className="text-xs text-slate-500 font-medium flex items-start gap-1 min-w-0 break-words pr-1">
                              <MessageSquare
                                size={12}
                                className="shrink-0 mt-0.5"
                              />
                              <span className="break-words">
                                {inst.financeNotes ||
                                  "Payout confirmed by finance"}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 font-semibold shrink-0 whitespace-nowrap">
                              <CheckCircle
                                size={11}
                                className="text-emerald-600"
                              />
                              Verified
                              <Maximize2
                                size={10}
                                className="text-slate-400 cursor-pointer"
                              />
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-xs text-slate-400 font-medium">
                        No customer payment installments received yet.
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* SECTION 2: PAYMENTS TO HOTELS & SUPPLIERS */}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2.5">
                  Payments to Hotels & Other Services Suppliers
                </h3>
                <div className="space-y-4">
                  {referenceServices && referenceServices.length > 0 ? (
                    referenceServices.map((service, sIndex) => {
                      const sKey = getServiceKey(service);
                      const supplierPayRecord = (
                        selectedQuery?.existingConfirmation?.supplierPayments ||
                        []
                      ).find(
                        (sp) =>
                          sp.serviceKey === sKey ||
                          sp.serviceName === service.serviceName,
                      );
                      const installments =
                        supplierPayRecord?.installments || [];
                      const serviceTotalCost = Number(
                        getResolvedServiceDisplayTotal(service) ||
                          service.total ||
                          0,
                      );
                      const servicePaidAmount = installments.reduce(
                        (sum, inst) => sum + Number(inst.amount || 0),
                        0,
                      );
                      const supplierName =
                        service.supplierName ||
                        service.dmcName ||
                        supplierPayRecord?.supplierName ||
                        "Yatra Vacations";
                      return (
                        <div
                          key={sIndex}
                          className="w-full bg-[#f1f5f9] p-3.5 lg:p-4.5 rounded-xs space-y-3.5 border border-slate-200/50"
                        >
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900">
                              {service.serviceName || "Service"}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {service.city ||
                                selectedQuery?.destination ||
                                "Delhi"}{" "}
                              • {serviceTypeLabel(service.type)}
                              {service.starRating
                                ? ` • ${service.starRating}`
                                : ""}
                              {service.confirmationNumber
                                ? ` • #${service.confirmationNumber}`
                                : ""}
                              {service.voucherNumber
                                ? ` • BCNF: ${service.voucherNumber}`
                                : ""}
                            </p>
                            <p className="text-xs font-semibold text-slate-600 mt-0.5">
                              Supplier :{" "}
                              <span className="text-blue-600 font-bold">
                                {supplierName}
                              </span>
                            </p>
                          </div>
                          <div className="flex flex-col lg:flex-row items-start gap-3.5 lg:gap-5">
                            <div className="w-full lg:w-44 shrink-0 py-1 flex flex-col justify-start">
                              <p className="text-xs font-bold text-slate-900">
                                INR
                              </p>
                              <div className="mt-1 text-3xl font-extrabold text-[#15803d] tracking-tight leading-none">
                                + {servicePaidAmount.toLocaleString("en-IN")}
                              </div>
                              <div className="mt-1.5 text-3xl font-extrabold text-slate-900 flex items-baseline gap-1 leading-none">
                                <span className="text-slate-400 font-normal text-xl">
                                  /
                                </span>
                                <span>
                                  {serviceTotalCost.toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div className="mt-3.5 space-y-1 text-[11px] text-slate-500 font-normal leading-tight">
                                <p>Created by DMC Partner</p>
                                <p>
                                  Last Updated{" "}
                                  {formatTimeAgo(
                                    supplierPayRecord?.updatedAt ||
                                      selectedQuery?.updatedAt,
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-sm p-3.5 lg:p-4 shadow-2xs space-y-3">
                              <div className="grid grid-cols-12 text-xs font-bold text-slate-600 pb-2 border-b border-slate-200/80 gap-2">
                                <div className="col-span-2">Amount (INR)</div>
                                <div className="col-span-3">Status</div>
                                <div className="col-span-2">Due Date</div>
                                <div className="col-span-5">Comments</div>
                              </div>
                              {installments.length > 0 ? (
                                installments.map((inst, iIdx) => (
                                  <div
                                    key={iIdx}
                                    className="grid grid-cols-12 text-xs items-start py-2.5 border-b border-slate-100 last:border-0 gap-2"
                                  >
                                    <div className="col-span-2 font-extrabold text-slate-900 text-sm">
                                      ₹
                                      {Number(inst.amount || 0).toLocaleString(
                                        "en-IN",
                                      )}
                                    </div>
                                    <div className="col-span-3">
                                      <div className="flex flex-col gap-0.5">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 text-[11px] w-fit whitespace-nowrap mb-0.5">
                                          <span>
                                            Paid:{" "}
                                            {formatServiceDate(
                                              inst.paymentDate,
                                            )}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium leading-tight">
                                          DMC → {supplierName}
                                        </p>
                                        {inst.utrNumber && (
                                          <p className="text-[10.5px] text-slate-500 font-normal leading-tight break-all">
                                            UTR: {inst.utrNumber}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-span-2 text-xs font-semibold text-slate-700 pt-0.5 text-left whitespace-nowrap">
                                      {formatServiceDate(
                                        inst.dueDate || inst.paymentDate,
                                      )}
                                    </div>
                                    <div className="col-span-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-0.5 min-w-0">
                                      <span className="text-xs text-slate-500 font-medium flex items-start gap-1 min-w-0 break-words pr-1">
                                        <MessageSquare
                                          size={12}
                                          className="shrink-0 mt-0.5"
                                        />
                                        <span className="break-words">
                                          {inst.comments || "Paid to Supplier"}
                                        </span>
                                      </span>
                                      <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 font-semibold shrink-0 whitespace-nowrap">
                                        <CheckCircle
                                          size={11}
                                          className="text-emerald-600"
                                        />
                                        Verified by {inst.verifiedBy || "DMC"}
                                        <Maximize2
                                          size={10}
                                          className="text-slate-400 cursor-pointer"
                                        />
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="py-3 text-center text-xs text-slate-400 font-medium">
                                  No supplier payment installments recorded yet.
                                </div>
                              )}
                              <div className="mt-3 pt-2.5 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenSupplierPaymentModal(
                                      service,
                                      supplierName,
                                      serviceTotalCost,
                                    )
                                  }
                                  className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50/80 rounded cursor-pointer transition-all shadow-2xs"
                                >
                                  Record / Update Supplier Payment
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-[#f1f5f9] text-center text-xs text-slate-500 rounded border border-slate-200/50">
                      No services found for supplier payment tracking.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {accountingSubTab === "proforma" &&
            (proformaInvoiceData ? (
              <ProformaInvoiceView
                invoiceData={proformaInvoiceData}
                queryData={selectedQuery}
                onEdit={() => setIsCreatingProforma(true)}
                onDelete={() => {
                  setProformaInvoiceData(null);
                  toast.success("Proforma Invoice deleted");
                }}
                onNew={() => {
                  setProformaInvoiceData(null);
                  setIsCreatingProforma(true);
                }}
              />
            ) : (
              <div className="w-full font-sans space-y-3">
                {/* White Header Strip */}
                <div className="w-full bg-white pb-2 flex items-center justify-between border-b border-slate-100">
                  <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
                    Proforma Invoice
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsCreatingProforma(true)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="text-sm font-normal">+</span>
                    <span>New</span>
                  </button>
                </div>
                {/* Light Gray Canvas Area */}
                <div className="w-full bg-[#f1f5f9] py-11 px-5 min-h-[170px] flex flex-col items-center justify-center text-center rounded-xs border border-slate-200/60">
                  <h3 className="text-xl sm:text-2xl font-normal text-slate-800 tracking-tight mb-4.5 font-sans">
                    No Proforma Invoice created for this Trip!
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreatingProforma(true)}
                    className="px-6 py-2.5 bg-white border border-[#cbd5e1] rounded-md text-[14px] font-bold text-[#35489e] hover:bg-slate-50 hover:text-[#28377d] shadow-2xs transition-all cursor-pointer"
                  >
                    Create Proforma Invoice
                  </button>
                </div>
              </div>
            ))}

          {accountingSubTab === "profit" &&
            (() => {
              const prPricing = selectedQuery?.quotationPricing || {};
              const prMarkup = prPricing.opsMarkup || {};
              const prTax = prPricing.tax || {};
              const prGst = prTax.gst || {};
              const prTcs = prTax.tcs || {};
              const prCharges = prPricing.opsCharges || {};
              const prAgentMarkup = selectedQuery?.agentMarkup || {};
              const costBase = Number(
                prPricing.baseAmount || prPricing.subTotal || 0,
              );
              const markupAmount = Number(prMarkup.amount || 0);
              const serviceCharge = Number(prCharges.serviceCharge || 0);
              const handlingFee = Number(prCharges.handlingFee || 0);
              const totalTaxAmount = Number(prTax.totalTax || 0);
              const gstAmount = Number(prGst.amount || 0);
              const tcsAmount = Number(prTcs.amount || 0);
              const tourismFee = Number(prTax.tourismFee?.amount || 0);
              const totalTax = gstAmount + tcsAmount + tourismFee;
              const pkgAmount = Number(
                selectedQuery?.packagePrice || prPricing.totalAmount || 0,
              );
              const dmcCost = Number(selectedQuery?.dmcCostTotal || 0);
              const agentRevenue = Number(
                selectedQuery?.agentRevenueTotal || pkgAmount || 0,
              );
              const netProfit = agentRevenue > 0 ? agentRevenue - dmcCost : 0;
              const profitPercent =
                agentRevenue > 0
                  ? Math.round((netProfit / agentRevenue) * 10000) / 100
                  : 0;
              const hotelServices = (referenceServices || []).filter(
                (s) => String(s.type || "").toLowerCase() === "hotel",
              );
              const transportServices = (referenceServices || []).filter((s) =>
                ["transfer", "transport", "car"].includes(
                  String(s.type || "").toLowerCase(),
                ),
              );
              const activityServices = (referenceServices || []).filter(
                (s) => String(s.type || "").toLowerCase() === "activity",
              );
              const sightseeingServices = (referenceServices || []).filter(
                (s) => String(s.type || "").toLowerCase() === "sightseeing",
              );
              const flightServices = (referenceServices || []).filter(
                (s) => String(s.type || "").toLowerCase() === "flight",
              );
              const hotelTotal = hotelServices.reduce(
                (sum, s) => sum + Number(s.total || 0),
                0,
              );
              const transportTotal = transportServices.reduce(
                (sum, s) => sum + Number(s.total || 0),
                0,
              );
              const activityTotal = activityServices.reduce(
                (sum, s) => sum + Number(s.total || 0),
                0,
              );
              const sightseeingTotal = sightseeingServices.reduce(
                (sum, s) => sum + Number(s.total || 0),
                0,
              );
              const flightTotal = flightServices.reduce(
                (sum, s) => sum + Number(s.total || 0),
                0,
              );
              const allBookingsTotal =
                hotelTotal +
                transportTotal +
                activityTotal +
                sightseeingTotal +
                flightTotal;
              const taxAppliedOn = costBase + markupAmount;
              const agentTrackerPayments =
                selectedQuery?.agentInvoice?.trackerPayments || [];
              const agentReceived = agentTrackerPayments.reduce(
                (sum, p) => sum + Number(p.amount || 0),
                0,
              );
              const agentDue = pkgAmount - agentReceived;
              const noServices =
                !referenceServices || referenceServices.length === 0;
              const renderServiceBookingTable = (services, label) => {
                if (!services || services.length === 0) return null;
                const svcTotal = services.reduce(
                  (sum, s) => sum + Number(s.total || 0),
                  0,
                );
                const svcPaid = services.reduce((sum, s) => {
                  const t = Number(s.total || 0);
                  const p = Number(
                    s.amountPaid ?? s.paidAmount ?? s.payoutAmount ?? 0,
                  );
                  return sum + Math.min(p, t > 0 ? t : p);
                }, 0);
                const svcDue = svcTotal - svcPaid;
                return (
                  <>
                    {services.map((svc, idx) => {
                      const svcPaidAmt = Number(
                        svc.amountPaid ??
                          svc.paidAmount ??
                          svc.payoutAmount ??
                          0,
                      );
                      const svcTotalAmt = Number(svc.total || 0);
                      const svcDueAmt =
                        svcTotalAmt - Math.min(svcPaidAmt, svcTotalAmt);
                      return (
                        <tr
                          key={idx}
                          className="text-center border-b border-slate-200"
                        >
                          <td className="py-1 px-1 border-r border-slate-300">
                            {formatServiceDate(
                              svc.checkInDate || svc.serviceDate,
                            )}
                          </td>
                          <td className="py-1 px-1 border-r border-slate-300">
                            {formatServiceDate(
                              svc.checkOutDate || svc.serviceEndDate,
                            )}
                          </td>
                          <td className="py-1 px-1 border-r border-slate-300 font-bold text-slate-900">
                            {svc.serviceName || svc.title || label}
                          </td>
                          <td className="py-1 px-1 border-r border-slate-300">
                            {svc.nights || svc.days || "-"}
                          </td>
                          <td className="py-1 px-1 border-r border-slate-300 font-semibold">
                            {svc.supplierName || svc.dmcName || "-"}
                          </td>
                          <td className="py-1 px-1 border-r border-slate-300">
                            {svc.currency || "INR"}
                          </td>
                          <td className="py-1 px-1 border-r border-slate-300">
                            {Number(svc.price || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-1 px-1 border-r border-slate-300 font-bold bg-[#22d3ee] text-slate-950">
                            ₹{svcTotalAmt.toLocaleString("en-IN")}
                          </td>
                          <td className="py-1 px-1 border-r border-slate-300 font-bold">
                            ₹
                            {Math.min(svcPaidAmt, svcTotalAmt).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                          <td className="py-1 px-1">
                            ₹{svcDueAmt.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="text-center font-bold">
                      <td
                        colSpan={6}
                        className="py-1 px-1 border-r border-slate-300 text-end font-bold text-slate-700"
                      >
                        Total {label}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-300">
                        ₹{svcTotal.toLocaleString("en-IN")}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-300">
                        ₹{svcTotal.toLocaleString("en-IN")}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-300"></td>
                      <td className="py-1 px-1 border-r border-slate-300 bg-[#22d3ee] text-slate-950">
                        ₹{svcTotal.toLocaleString("en-IN")}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-300">
                        ₹{svcPaid.toLocaleString("en-IN")}
                      </td>
                      <td className="py-1 px-1">
                        ₹{svcDue.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </>
                );
              };
              return (
                <div className="space-y-5 font-sans">
                  {/* Top Summary Stat Bar */}
                  <div className="bg-white border border-slate-200/90 rounded-sm p-4 shadow-2xs">
                    {noServices ? (
                      <div className="text-center text-xs text-slate-400 font-medium py-3">
                        No data available
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-slate-100 text-xs">
                        <div className="px-3">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Package Amount
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            INR{" "}
                            <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                              {pkgAmount.toLocaleString("en-IN")}
                            </span>
                          </p>
                        </div>
                        <div className="px-3">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Bookings
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            INR{" "}
                            <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                              {allBookingsTotal.toLocaleString("en-IN")}
                            </span>
                          </p>
                          <p className="text-[9.5px] text-slate-400 mt-0.5">
                            {hotelTotal > 0 &&
                              `Hotels: INR ${hotelTotal.toLocaleString("en-IN")}`}
                            {hotelTotal > 0 && transportTotal > 0 && " | "}
                            {transportTotal > 0 &&
                              `Transport: INR ${transportTotal.toLocaleString("en-IN")}`}
                            {hotelTotal > 0 &&
                              transportTotal > 0 &&
                              activityTotal > 0 &&
                              " | "}
                            {activityTotal > 0 &&
                              `Activities: INR ${activityTotal.toLocaleString("en-IN")}`}
                            {allBookingsTotal === 0 && "No bookings"}
                          </p>
                        </div>
                        <div className="px-3">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Estm. Tax (inc.)
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            INR{" "}
                            <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                              {totalTax.toLocaleString("en-IN")}
                            </span>
                          </p>
                        </div>
                        <div className="px-3">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Estm. Profit
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            INR{" "}
                            <span
                              className={`text-base font-extrabold block mt-0.5 ${netProfit >= 0 ? "text-slate-900" : "text-red-600"}`}
                            >
                              {netProfit.toLocaleString("en-IN")}
                            </span>
                          </p>
                        </div>
                        <div className="px-3">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Estm. Profit %
                          </p>
                          <p
                            className={`text-base font-extrabold mt-2 ${profitPercent >= 0 ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {profitPercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profit Report Header Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <h3 className="text-base font-bold text-slate-900">
                      Profit Report
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={handleProfitRefresh}
                        disabled={profitRefreshing}
                        className={`p-1.5 rounded border border-slate-200 bg-white cursor-pointer transition-all ${profitRefreshing ? "text-blue-500 animate-spin" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        <RefreshCw
                          size={13}
                          className={profitRefreshing ? "animate-spin" : ""}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={handleProfitCopyToClipboard}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Copy size={13} /> Copy to Clipboard
                      </button>
                      <button
                        type="button"
                        onClick={handleProfitExcelExport}
                        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded font-bold hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <FileSpreadsheet
                          size={13}
                          className="text-emerald-600"
                        />{" "}
                        Excel
                      </button>
                    </div>
                  </div>

                  {/* Structured Profit Report Excel Sheet Container */}
                  <div className="bg-white border border-slate-300 rounded-sm overflow-hidden shadow-2xs space-y-3 p-3">
                    {/* SECTION 1: TRIP DETAILS */}
                    <div className="border border-slate-300 rounded-xs overflow-hidden">
                      <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                        Trip Details
                      </div>
                      <div className="overflow-x-auto">
                        {noServices ? (
                          <div className="py-4 text-center text-xs text-slate-400 font-medium">
                            No data available
                          </div>
                        ) : (
                          <table className="w-full border-collapse text-[10.5px] text-slate-800 font-sans">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Trip ID
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Destinations
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Start Date
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  End Date
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Duration
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Adults
                                </th>
                                <th className="py-1 px-1.5 font-medium">
                                  Children
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="text-center font-semibold">
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {selectedQuery?.queryId || "-"}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {selectedQuery?.destination || "-"}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {formatServiceDate(selectedQuery?.startDate)}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {formatServiceDate(selectedQuery?.endDate)}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {selectedQuery?.duration || "-"}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {selectedQuery?.numberOfAdults || 0}
                                </td>
                                <td className="py-1 px-1.5">
                                  {selectedQuery?.numberOfChildren || 0}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* SECTION 2: SOURCE AND GUEST DETAILS */}
                    <div className="border border-slate-300 rounded-xs overflow-hidden">
                      <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                        Source and Guest Details
                      </div>
                      <div className="overflow-x-auto">
                        {noServices ? (
                          <div className="py-4 text-center text-xs text-slate-400 font-medium">
                            No data available
                          </div>
                        ) : (
                          <table className="w-full border-collapse text-[10.5px] text-slate-800 font-sans">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Source Name
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Source Contact
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Ref ID
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Guest Name
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Guest Contact
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Sales Team
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Resv. Team
                                </th>
                                <th className="py-1 px-1.5 font-medium">
                                  Ops. Team
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="text-center">
                                <td className="py-1 px-1.5 border-r border-slate-300 font-semibold">
                                  {selectedQuery?.agentName || "Direct Query"}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {selectedQuery?.agentInvoice?.invoiceNumber ||
                                    "-"}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {selectedQuery?.queryId || "-"}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300 font-bold text-slate-900">
                                  {selectedQuery?.customerName ||
                                    selectedQuery?.travelerDetails?.[0]
                                      ?.fullName ||
                                    "-"}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300 font-semibold">
                                  {selectedQuery?.clientEmail ||
                                    selectedQuery?.customerPhone ||
                                    "-"}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {selectedQuery?.agentName || "-"}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {selectedQuery?.agentName || "-"}
                                </td>
                                <td className="py-1 px-1.5">
                                  {selectedQuery?.agentName || "-"}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* SECTION 3: LATEST QUOTE DETAILS */}
                    <div className="border border-slate-300 rounded-xs overflow-hidden">
                      <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                        Latest Quote Details
                      </div>
                      <div className="overflow-x-auto">
                        {noServices && !prPricing.totalAmount ? (
                          <div className="py-4 text-center text-xs text-slate-400 font-medium">
                            No data available
                          </div>
                        ) : (
                          <table className="w-full border-collapse text-[10.5px] text-slate-800 font-sans">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Rounding: 1
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Cost (INR)
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Markup
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Taxes ({prGst.percent || 0}% applied)
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Total (INR)
                                </th>
                                <th className="py-1 px-1.5 font-medium">
                                  Final Package Price (INR)
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="text-center border-b border-slate-200">
                                <td className="py-1 px-1.5 border-r border-slate-300 font-bold text-slate-700">
                                  Sub-Total
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                  {costBase.toLocaleString("en-IN")}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {markupAmount.toLocaleString("en-IN")}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {totalTax.toLocaleString("en-IN")}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                  {(
                                    costBase +
                                    markupAmount +
                                    totalTax
                                  ).toLocaleString("en-IN")}
                                </td>
                                <td className="py-1 px-1.5 font-bold bg-[#84cc16] text-black">
                                  {pkgAmount.toLocaleString("en-IN")}
                                </td>
                              </tr>
                              <tr className="text-center font-bold">
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  Total
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {costBase.toLocaleString("en-IN")}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {markupAmount.toLocaleString("en-IN")}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {totalTax.toLocaleString("en-IN")}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300">
                                  {(
                                    costBase +
                                    markupAmount +
                                    totalTax
                                  ).toLocaleString("en-IN")}
                                </td>
                                <td className="py-1 px-1.5 bg-[#84cc16] text-black">
                                  {pkgAmount.toLocaleString("en-IN")}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* SECTION 4: TRIP CONVERSION DETAILS */}
                    <div className="border border-slate-300 rounded-xs overflow-hidden">
                      <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                        Trip Conversion Details
                      </div>
                      <div className="overflow-x-auto">
                        {noServices ? (
                          <div className="py-4 text-center text-xs text-slate-400 font-medium">
                            No data available
                          </div>
                        ) : (
                          <table className="w-full border-collapse text-[10.5px] text-slate-800 font-sans">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Converted On
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Currency
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Total
                                </th>
                                <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                  Received
                                </th>
                                <th className="py-1 px-1.5 font-medium">Due</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="text-center">
                                <td className="py-1 px-1.5 border-r border-slate-300 font-semibold">
                                  {formatServiceDate(
                                    selectedQuery?.quotationCreatedAt ||
                                      selectedQuery?.createdAt,
                                  )}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                  {prPricing.currency || "INR"}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                  {pkgAmount.toLocaleString("en-IN")}
                                </td>
                                <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                  {agentReceived.toLocaleString("en-IN")}
                                </td>
                                <td className="py-1 px-1.5 font-bold text-slate-700">
                                  {agentDue.toLocaleString("en-IN")}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* SECTION 5: HOTEL RESERVATION BOOKINGS */}
                    {hotelServices.length > 0 && (
                      <div className="border border-slate-300 rounded-xs overflow-hidden">
                        <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                          Hotel Reservation Bookings
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-[10px] text-slate-800 font-sans">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Check In
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Check Out
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Hotel
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Nights
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Supplier
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Curr
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Quoted
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Booked
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Status
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Net Payable
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Net Paid
                                </th>
                                <th className="py-1 px-1 font-medium">
                                  Net Due
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {renderServiceBookingTable(hotelServices, "Hotel")}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* SECTION 5b: TRANSPORT RESERVATION BOOKINGS */}
                    {transportServices.length > 0 && (
                      <div className="border border-slate-300 rounded-xs overflow-hidden">
                        <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                          Transport Reservation Bookings
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-[10px] text-slate-800 font-sans">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Travel Date
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  End Date
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Service
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Days
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Supplier
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Curr
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Quoted
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Booked
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Status
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Net Payable
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Net Paid
                                </th>
                                <th className="py-1 px-1 font-medium">
                                  Net Due
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {renderServiceBookingTable(
                                transportServices,
                                "Transport",
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* SECTION 5c: ACTIVITY RESERVATION BOOKINGS */}
                    {activityServices.length > 0 && (
                      <div className="border border-slate-300 rounded-xs overflow-hidden">
                        <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                          Activity Reservation Bookings
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-[10px] text-slate-800 font-sans">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Travel Date
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  End Date
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Activity
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Days
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Supplier
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Curr
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Quoted
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Booked
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Status
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Net Payable
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Net Paid
                                </th>
                                <th className="py-1 px-1 font-medium">
                                  Net Due
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {renderServiceBookingTable(
                                activityServices,
                                "Activity",
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* SECTION 5d: SIGHTSEEING RESERVATION BOOKINGS */}
                    {sightseeingServices.length > 0 && (
                      <div className="border border-slate-300 rounded-xs overflow-hidden">
                        <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                          Sightseeing Reservation Bookings
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-[10px] text-slate-800 font-sans">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Travel Date
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  End Date
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Sightseeing
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Days
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Supplier
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Curr
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Quoted
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Booked
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Status
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Net Payable
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Net Paid
                                </th>
                                <th className="py-1 px-1 font-medium">
                                  Net Due
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {renderServiceBookingTable(
                                sightseeingServices,
                                "Sightseeing",
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* SECTION 5e: FLIGHT RESERVATION BOOKINGS */}
                    {flightServices.length > 0 && (
                      <div className="border border-slate-300 rounded-xs overflow-hidden">
                        <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                          Flight Reservation Bookings
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-[10px] text-slate-800 font-sans">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Travel Date
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  End Date
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Flight
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Pax
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Supplier
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Curr
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Quoted
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Booked
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Status
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Net Payable
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                  Net Paid
                                </th>
                                <th className="py-1 px-1 font-medium">
                                  Net Due
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {renderServiceBookingTable(
                                flightServices,
                                "Flight",
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* No services message */}
                    {noServices && (
                      <div className="border border-slate-300 rounded-xs overflow-hidden">
                        <div className="py-8 text-center text-xs text-slate-400 font-medium">
                          No data available
                        </div>
                      </div>
                    )}

                    {/* SECTION 6: COMPONENT BOOKING PRICES */}
                    <div className="border border-slate-300 rounded-xs overflow-hidden">
                      <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                        Component Booking Prices
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[10.5px] text-slate-800 font-sans">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                Hotels
                              </th>
                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                Transports
                              </th>
                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                Activities
                              </th>
                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                Sightseeing
                              </th>
                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                Flights
                              </th>
                              <th className="py-1 px-1.5 font-medium">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-center font-bold">
                              <td className="py-1 px-1.5 border-r border-slate-300">
                                {hotelTotal > 0 ? (
                                  `₹${hotelTotal.toLocaleString("en-IN")}`
                                ) : (
                                  <span className="text-slate-400 font-normal">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300">
                                {transportTotal > 0 ? (
                                  `₹${transportTotal.toLocaleString("en-IN")}`
                                ) : (
                                  <span className="text-slate-400 font-normal">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300">
                                {activityTotal > 0 ? (
                                  `₹${activityTotal.toLocaleString("en-IN")}`
                                ) : (
                                  <span className="text-slate-400 font-normal">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300">
                                {sightseeingTotal > 0 ? (
                                  `₹${sightseeingTotal.toLocaleString("en-IN")}`
                                ) : (
                                  <span className="text-slate-400 font-normal">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300">
                                {flightTotal > 0 ? (
                                  `₹${flightTotal.toLocaleString("en-IN")}`
                                ) : (
                                  <span className="text-slate-400 font-normal">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="py-1 px-1.5 bg-[#22d3ee] text-slate-950 font-bold">
                                ₹{allBookingsTotal.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* SECTION 7: BREAKUP (IN INR) */}
                    <div className="border border-slate-300 rounded-xs overflow-hidden">
                      <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                        Breakup (in INR)
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[10.5px] text-slate-800 font-sans">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                Component
                              </th>
                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                Payable
                              </th>
                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                Markup
                              </th>
                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                Tax Applied On
                              </th>
                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                Tax %
                              </th>
                              <th className="py-1 px-1.5 border-r border-slate-300 font-medium">
                                Tax Amount
                              </th>
                              <th className="py-1 px-1.5 font-medium">
                                Collectable
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-center border-b border-slate-200 font-semibold">
                              <td className="py-1 px-1.5 border-r border-slate-300 font-bold text-slate-700">
                                Sub-Total
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                {dmcCost.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                {markupAmount.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300 text-slate-600">
                                cost + markup
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300 font-bold">
                                {prGst.percent || 0}%
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300">
                                {totalTax.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1 px-1.5 font-bold">
                                {pkgAmount.toLocaleString("en-IN")}
                              </td>
                            </tr>
                            <tr className="text-center font-bold">
                              <td className="py-1 px-1.5 border-r border-slate-300">
                                Total
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300">
                                ₹{dmcCost.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300">
                                ₹{markupAmount.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300 font-medium text-slate-600">
                                cost + markup
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300">
                                {prGst.percent || 0}%
                              </td>
                              <td className="py-1 px-1.5 border-r border-slate-300">
                                ₹{totalTax.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1 px-1.5">
                                ₹{pkgAmount.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* SECTION 8: PROFIT AFTER BOOKINGS */}
                    <div className="border border-slate-300 rounded-xs overflow-hidden">
                      <div className="bg-[#cbd5e1] py-1 px-3 text-[11px] font-bold text-slate-900 border-b border-slate-300">
                        Profit after Bookings
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[10px] text-slate-800 font-sans">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-center text-slate-700">
                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                Curr
                              </th>
                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                Net Payable
                              </th>
                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                Markup
                              </th>
                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                Tax Applied On
                              </th>
                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                Net Tax %
                              </th>
                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                Net Tax
                              </th>
                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                Net Collectable
                              </th>
                              <th className="py-1 px-1 border-r border-slate-300 font-medium">
                                Net Profit
                              </th>
                              <th className="py-1 px-1 font-medium">
                                Net Profit %
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="text-center font-bold">
                              <td className="py-1 px-1 border-r border-slate-300">
                                {prPricing.currency || "INR"}
                              </td>
                              <td className="py-1 px-1 border-r border-slate-300 bg-[#22d3ee] text-slate-950">
                                {dmcCost.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1 px-1 border-r border-slate-300">
                                {markupAmount.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1 px-1 border-r border-slate-300 text-slate-600 font-medium">
                                cost + markup
                              </td>
                              <td className="py-1 px-1 border-r border-slate-300 text-slate-600 font-medium">
                                {totalTax > 0 ? "exc." : "inc."}
                              </td>
                              <td className="py-1 px-1 border-r border-slate-300">
                                {totalTax.toLocaleString("en-IN")}
                              </td>
                              <td className="py-1 px-1 border-r border-slate-300 bg-[#84cc16] text-black">
                                {pkgAmount.toLocaleString("en-IN")}
                              </td>
                              <td
                                className={`py-1 px-1 border-r border-slate-300 ${netProfit >= 0 ? "bg-[#f43f5e] text-white" : "bg-red-100 text-red-700"}`}
                              >
                                {netProfit.toLocaleString("en-IN")}
                              </td>
                              <td
                                className={`${profitPercent >= 0 ? "text-emerald-600" : "text-red-600"}`}
                              >
                                {profitPercent.toFixed(2)}%
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    </motion.div>
  );
}
