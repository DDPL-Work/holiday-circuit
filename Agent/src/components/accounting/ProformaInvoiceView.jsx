import React from "react";
import { useSelector } from "react-redux";
import { ArrowLeft, Pencil, RotateCw, Copy, FileText, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { resolveClientDetails } from "./CreateProformaInvoice";

// Utility to convert numbers to English words (e.g. 69000 -> Sixty-Nine Thousand Only)
const numberToWords = (num) => {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  };

  const val = Math.round(Number(num || 0));
  if (val === 0) return "Zero Only";
  return `${inWords(val)} Only`;
};

const ProformaInvoiceView = ({ invoiceData = {}, onEdit, onDelete, onNew, queryData = {} }) => {
  const { user } = useSelector((state) => state.auth || {});

  const queryId = invoiceData?.queryId || queryData?.queryId || queryData?.id || "4310346";
  
  const sellerDetails = invoiceData?.sellerDetails || {
    name: invoiceData?.sellerName || queryData?.sellerName || "DDLC Company Pvt. Ltd.",
    address: invoiceData?.sellerAddress || queryData?.sellerAddress || "KG 3/69, Ground Floor, Vikas Puri",
    cityState: invoiceData?.sellerCityState || queryData?.sellerCityState || "New Delhi, Delhi",
    countryZip: invoiceData?.sellerCountryZip || queryData?.sellerCountryZip || "India, 110018",
    phone: invoiceData?.sellerPhone || queryData?.sellerPhone || "9368825518",
    email: invoiceData?.sellerEmail || queryData?.sellerEmail || "joy@gmail.com",
    pan: invoiceData?.sellerPan || queryData?.sellerPan || "ABAPW1816B",
    gst: invoiceData?.sellerGst || queryData?.sellerGst || "07ABAPW1816B3ZZ",
    msme: invoiceData?.sellerMsme || queryData?.sellerMsme || "UDYAM-DL-10-0079437",
    tan: invoiceData?.sellerTan || queryData?.sellerTan || "DELV30189F",
  };

  const sellerLogo =
    invoiceData?.sellerLogo ||
    invoiceData?.logo ||
    queryData?.brandingLogo ||
    queryData?.agentLogo ||
    queryData?.agent?.brandingLogo ||
    queryData?.agent?.brandLogoUrl ||
    queryData?.agent?.logo ||
    queryData?.sellerLogo ||
    (user?.role === "agent" ? (user?.brandingLogo || user?.brandLogoUrl || user?.logo) : "") ||
    user?.brandingLogo ||
    user?.brandLogoUrl ||
    user?.logo ||
    "";

  const clientInfo = resolveClientDetails(queryData);
  const clientLeadName = invoiceData?.buyerName && invoiceData?.buyerName !== "Carma Tours" ? invoiceData.buyerName : (clientInfo.name || "Client");
  const clientLeadPhone = invoiceData?.buyerPhone || clientInfo.phone || "";
  const clientLeadEmail = invoiceData?.buyerEmail || clientInfo.email || "";
  const clientLeadAddress = invoiceData?.buyerAddress || clientInfo.address || "";
  const clientLeadCountry = invoiceData?.buyerCountry || clientInfo.country || "India";

  const buyerDetails = invoiceData?.buyerDetails || {
    name: clientLeadName,
    address: clientLeadAddress,
    country: clientLeadCountry,
    phone: clientLeadPhone,
    email: clientLeadEmail,
  };

  const bankDetails = invoiceData?.bankDetails || {
    bankName: invoiceData?.bankName || queryData?.bankName || "",
    branchName: invoiceData?.branchName || queryData?.branchName || "",
    accountHolderName: invoiceData?.accountHolderName || queryData?.accountHolderName || "",
    accountNumber: invoiceData?.accountNumber || queryData?.accountNumber || "",
    ifscCode: invoiceData?.ifscCode || queryData?.ifscCode || "",
  };

  const hasBankDetails = Boolean(
    bankDetails?.bankName ||
    bankDetails?.branchName ||
    bankDetails?.accountHolderName ||
    bankDetails?.accountNumber ||
    bankDetails?.ifscCode
  );

  const issueDate = invoiceData?.issueDate || "02 Aug, 2026";
  const dueDate = invoiceData?.dueDate || "30 Jul, 2026";
  const overview = invoiceData?.overview || queryData?.overview || "";

  const extractQuotationAmount = (data) => {
    if (!data) return 0;
    const candidates = [
      data?.headerPackageAmount,
      data?.clientTotalAmount,
      data?.quotationAmount,
      data?.quotation,
      data?.quoteAmount,
      data?.activeQuote?.clientTotalAmount,
      data?.activeQuote?.pricing?.totalAmount,
      data?.activeQuote?.pricing?.subTotal,
      data?.activeQuote?.pricing?.grandTotal,
      data?.activeQuote?.totalAmount,
      data?.totalAmount,
      data?.finalQuoteAmount,
      data?.packagePrice,
      data?.pkgPrice,
      data?.pricing?.grandTotal,
      data?.pricing?.totalAmount,
      data?.pricing?.subTotal,
      data?.costing?.agentCost,
      data?.costing?.totalCost,
      data?.costing?.grandTotal,
      data?.costing?.total,
      data?.amount,
      data?.price,
      data?.cost,
    ];

    for (const cand of candidates) {
      const cleaned = String(cand || "").replace(/[^0-9.]/g, "");
      const parsed = Number(cleaned);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    if (Array.isArray(data?.quotes) && data.quotes.length > 0) {
      for (const q of data.quotes) {
        const cleaned = String(q?.clientTotalAmount || q?.pricing?.totalAmount || q?.pricing?.subTotal || q?.totalAmount || "").replace(/[^0-9.]/g, "");
        const qAmt = Number(cleaned);
        if (!isNaN(qAmt) && qAmt > 0) return qAmt;
      }
    }

    return 0;
  };

  const extractedPrice = extractQuotationAmount(queryData);
  const defaultBaseAmount = extractedPrice > 0 ? extractedPrice : 160000;

  const items = invoiceData?.items || [
    {
      particularText: `Trip#: ${queryId}\nIndia Tour Package\n${buyerDetails.name} - 04 Oct 2026 - 4N,5D - 8A`,
      qty: 1,
      baseAmount: defaultBaseAmount,
      applyTax: true,
      taxType: "percentage",
      taxes: [{ id: 1, name: "GST", value: 0 }],
    },
  ];

  const calculateItemBase = (item) => {
    return Number(item.qty || 1) * Number(item.baseAmount || 0);
  };

  const getItemTaxesList = (item) => {
    if (!item.applyTax) return [];
    if (Array.isArray(item.taxes) && item.taxes.length > 0) {
      return item.taxes;
    }
    if (item.taxPercentage !== undefined || item.taxName) {
      return [{ id: 1, name: item.taxName || "GST", value: Number(item.taxPercentage || 0) }];
    }
    return [];
  };

  const calculateSingleTax = (item, tax) => {
    if (!item.applyTax) return 0;
    const base = calculateItemBase(item);
    const val = Number(tax.value ?? tax.taxPercentage ?? 0);
    if (item.taxType === "amount") {
      return val;
    }
    return (base * val) / 100;
  };

  const calculateItemTotalTaxes = (item) => {
    const taxList = getItemTaxesList(item);
    return taxList.reduce((sum, tax) => sum + calculateSingleTax(item, tax), 0);
  };

  const grandTotal = invoiceData?.grandTotal ?? items.reduce((sum, item) => {
    return sum + calculateItemBase(item) + calculateItemTotalTaxes(item);
  }, 0);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Invoice link copied to clipboard");
  };

  return (
    <div className="w-full font-sans space-y-4 text-slate-800">
      {/* Top Header Strip */}
      <div className="w-full bg-white pb-2 flex items-center justify-between border-b border-slate-100">
        <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Proforma Invoice</h2>
        <button
          type="button"
          onClick={onNew}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="text-sm font-normal">+</span>
          <span>New</span>
        </button>
      </div>

      {/* Info & Action Toolbar Bar */}
      <div className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-md p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-6 text-xs text-slate-600 font-medium">
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Created By</span>
            <span className="font-bold text-slate-900 text-xs">You</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Created On</span>
            <span className="font-bold text-slate-900 text-xs">a few seconds ago</span>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.success("Refreshed invoice view")}
            className="p-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 rounded-md cursor-pointer transition-colors shadow-2xs"
            title="Refresh"
          >
            <RotateCw size={14} />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 rounded-md cursor-pointer transition-colors shadow-2xs"
            title="Copy URL"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-3 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs rounded-md flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <FileText size={14} />
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 bg-[#eff6ff] border border-blue-200 text-[#2563eb] hover:bg-blue-100 font-bold text-xs rounded-md flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <Pencil size={13} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 bg-white border border-slate-200/90 hover:bg-rose-50 text-rose-500 rounded-md cursor-pointer transition-colors shadow-2xs"
            title="Delete Invoice"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Main A4 Template Render */}
      <div className="w-full bg-white border border-slate-200/90 shadow-md rounded-xs p-6 lg:p-8 space-y-6 font-sans">
        {/* Dark Teal Banner */}
        <div className="w-full bg-[#0f766e] text-white text-center font-extrabold tracking-wider text-xs sm:text-sm py-2 uppercase">
          PROFORMA INVOICE
        </div>

        {/* Header Info: Agent's Branding Logo alone & Dates */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="min-h-[4.5rem] flex items-center">
              {sellerLogo ? (
                <img
                  src={sellerLogo}
                  alt={sellerDetails.name || "Agent Branding Logo"}
                  className="h-16 sm:h-20 max-h-24 w-auto object-contain max-w-[260px]"
                />
              ) : (
                <span className="text-2xl font-black italic tracking-tighter text-slate-900 border-b-2 border-[#0f766e] pb-0.5">
                  {sellerDetails.name}
                </span>
              )}
            </div>
          </div>
          <div className="text-xs font-bold text-slate-800 space-y-1 sm:text-right">
            <div className="flex sm:justify-end gap-3">
              <span className="text-slate-400 font-semibold">Issue Date</span>
              <span className="text-slate-900">{issueDate}</span>
            </div>
            <div className="flex sm:justify-end gap-3">
              <span className="text-slate-400 font-semibold">Due Date</span>
              <span className="text-slate-900">{dueDate}</span>
            </div>
            <div className="flex sm:justify-end gap-3">
              <span className="text-slate-400 font-semibold">Trip ID</span>
              <span className="text-slate-900">{queryId}</span>
            </div>
          </div>
        </div>

        {/* Seller & Buyer Grid (Plain Text, No Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
          {/* Seller (Main Agent) */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SELLER</p>
            <h3 className="text-sm font-bold text-slate-900">{sellerDetails.name}</h3>
            <p className="text-slate-600 italic leading-relaxed">{sellerDetails.address}</p>
            <p className="text-slate-600 italic">{sellerDetails.cityState} {sellerDetails.countryZip}</p>
            <p className="text-slate-700 font-semibold pt-1">{sellerDetails.phone} • {sellerDetails.email}</p>
            <div className="pt-2 text-slate-800 font-medium space-y-0.5 text-[11px]">
              <p>PAN: <span className="font-bold">{sellerDetails.pan}</span></p>
              <p>GST: <span className="font-bold">{sellerDetails.gst}</span></p>
              <p>MSME REG NO : <span className="font-bold">{sellerDetails.msme}</span></p>
              <p>TAN NO - <span className="font-bold">{sellerDetails.tan}</span></p>
            </div>
          </div>

          {/* Buyer (Agent's Client) */}
          <div className="sm:text-right space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">BUYER (BILL TO)</p>
            <h3 className="text-sm font-bold text-slate-900">{buyerDetails.name}</h3>
            <p className="text-slate-600 italic leading-relaxed">{buyerDetails.address}</p>
            <p className="text-slate-600 italic">{buyerDetails.country}</p>
            <p className="text-slate-700 font-semibold pt-1">Phone: {buyerDetails.phone}</p>
            <p className="text-slate-700 font-semibold">Email: {buyerDetails.email}</p>
          </div>
        </div>

        {/* Overview Section */}
        {overview && overview.trim() && (
          <div className="pt-3.5 pb-1 border-t border-slate-200 text-xs">
            <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-1">OVERVIEW</p>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed font-normal">{overview.trim()}</p>
          </div>
        )}

        {/* Particulars Table */}
        <div className="w-full border border-teal-200/80 rounded-xs overflow-hidden pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#e6fffb]/70 border-b border-[#7dd3c7] text-[#0f766e] font-extrabold uppercase text-[11px]">
                <th className="py-2.5 px-3 w-16 text-center border-r border-[#7dd3c7]/60">S.NO.</th>
                <th className="py-2.5 px-4 border-r border-[#7dd3c7]/60">PARTICULARS</th>
                <th className="py-2.5 px-4 w-44 text-right">AMOUNT (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-100 text-slate-800 font-medium">
              {items.map((item, idx) => {
                const base = calculateItemBase(item);
                const taxesList = getItemTaxesList(item);

                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <td className="py-3 px-3 text-center align-top border-r border-teal-100 font-bold">{idx + 1}.</td>
                      <td className="py-3 px-4 align-top border-r border-teal-100 whitespace-pre-line leading-relaxed">
                        {item.particularText}
                      </td>
                      <td className="py-3 px-4 align-top text-right font-bold border-teal-100">
                        INR {base.toLocaleString("en-IN")}.00
                      </td>
                    </tr>
                    {taxesList.map((tax, tIdx) => {
                      const taxAmt = calculateSingleTax(item, tax);
                      const isPercent = item.taxType !== "amount";
                      return (
                        <tr key={tIdx} className="bg-slate-50/50 text-[11px] text-slate-600">
                          <td className="border-r border-teal-100"></td>
                          <td className="py-1.5 px-4 border-r border-teal-100 italic">
                            {tax.name || "GST"} {isPercent ? `@ ${Number(tax.value ?? tax.taxPercentage ?? 0).toFixed(2)} %` : ""}
                          </td>
                          <td className="py-1.5 px-4 text-right font-semibold">
                            INR {taxAmt.toLocaleString("en-IN")}.00
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              <tr className="bg-slate-50 font-bold border-t-2 border-[#7dd3c7] text-slate-900">
                <td colSpan={2} className="py-3 px-4 text-right border-r border-[#7dd3c7]/60 text-xs uppercase font-extrabold">
                  Total (INR)
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-sm text-[#0f766e]">
                  INR {grandTotal.toLocaleString("en-IN")}.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount Chargeable In Words & E. & O.E. */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AMOUNT CHARGEABLE (IN WORDS)</p>
            <p className="text-sm font-extrabold text-[#0f766e] mt-0.5">
              INR: {numberToWords(grandTotal)}
            </p>
          </div>
          <div className="text-slate-400 font-bold text-xs sm:text-right">
            E. & O.E.
          </div>
        </div>

        {/* Seller's Bank Details (Only shown if filled in Create Proforma Form) */}
        {hasBankDetails && (
          <div className="pt-3 border-t border-teal-200/80 space-y-1 text-xs">
            <p className="text-[11px] font-bold text-[#0f766e] uppercase tracking-wider">SELLER'S BANK DETAILS</p>
            <div className="text-slate-700 space-y-0.5 leading-relaxed">
              {(bankDetails.bankName || bankDetails.branchName) && (
                <p>Bank Name: <span className="font-bold text-slate-900">{bankDetails.bankName || bankDetails.branchName}</span></p>
              )}
              {bankDetails.branchName && bankDetails.bankName && bankDetails.branchName !== bankDetails.bankName && (
                <p>Branch: <span className="font-semibold">{bankDetails.branchName}</span></p>
              )}
              {bankDetails.accountHolderName && (
                <p>A/c Holder Name: <span className="font-semibold">{bankDetails.accountHolderName}</span></p>
              )}
              {bankDetails.accountNumber && (
                <p>A/c No. <span className="font-semibold">{bankDetails.accountNumber}</span></p>
              )}
              {bankDetails.ifscCode && (
                <p>IFSC: <span className="font-semibold">{bankDetails.ifscCode}</span></p>
              )}
            </div>
          </div>
        )}

        {/* Terms and Conditions Section */}
        <div className="w-full border border-teal-200/80 rounded-xs overflow-hidden mt-4">
          <div className="w-full bg-[#e6fffb]/70 text-[#0f766e] text-center font-bold py-1.5 text-xs">
            Terms and Conditions
          </div>
          <div className="p-4 text-xs text-slate-700 space-y-1.5 font-medium leading-relaxed bg-white">
            <p>1. Balance payment to be cleared before travel</p>
            <p>2. Cancellation as per supplier policy; service charges non-refundable</p>
            <p>3. Amendments subject to availability & extra cost</p>
            <p>4. No refund for no-show / unused services</p>
            <p>5. Guests must carry valid travel documents</p>
            <p>6. Not liable for delays, cancellations, or unforeseen events</p>
            <p>7. All disputes are subject to Delhi jurisdiction only</p>
          </div>
        </div>

        {/* Computer Generated Document Notice */}
        <div className="text-center pt-6 pb-2 text-[11px] text-slate-400 font-medium italic border-t border-slate-100">
          This is a computer generated document. No signature required.
        </div>
      </div>
    </div>
  );
};

export default ProformaInvoiceView;
