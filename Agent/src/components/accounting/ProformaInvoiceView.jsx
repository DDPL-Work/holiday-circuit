import React from "react";
import { ArrowLeft, Pencil, RotateCw, Copy, FileText, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

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
  const queryId = invoiceData?.queryId || queryData?.queryId || queryData?.id || "4121824";
  const customerName = invoiceData?.buyerName || queryData?.clientName || queryData?.name || "Sen Destination";
  const buyerAddress = invoiceData?.buyerAddress || queryData?.clientAddress || "Colombo Sri Lanka, Sri Lanka";
  const buyerPhone = invoiceData?.buyerPhone || queryData?.clientPhone || "+94-717819657";
  const buyerEmail = invoiceData?.buyerEmail || queryData?.clientEmail || "anushka@sendestinations.com";

  const issueDate = invoiceData?.issueDate || "02 Aug, 2026";
  const dueDate = invoiceData?.dueDate || "30 Jul, 2026";

  const items = invoiceData?.items || [
    {
      particularText: `Trip#: ${queryId}\nColombo,Srilanka Tour Package\nMr. Michal Zeman - 03 Aug 2026 - 2N,3D - 2A`,
      baseAmount: 69000,
      applyTax: true,
      taxPercentage: 0,
    },
  ];

  const grandTotal = items.reduce((sum, item) => {
    const base = Number(item.baseAmount || 0);
    const tax = item.applyTax ? (base * Number(item.taxPercentage || 0)) / 100 : 0;
    return sum + base + tax;
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
        {/* Dark Red Banner */}
        <div className="w-full bg-[#b91c1c] text-white text-center font-extrabold tracking-wider text-xs sm:text-sm py-2 uppercase">
          PROFORMA INVOICE
        </div>

        {/* Header Info: Logo & Dates */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="h-12 flex items-center">
              <span className="text-2xl font-black italic tracking-tighter text-slate-900 border-b-2 border-rose-600 pb-0.5">
                HC <span className="text-xs font-semibold not-italic text-slate-500">Holiday Circuit</span>
              </span>
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

        {/* Seller & Buyer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
          {/* Seller */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SELLER</p>
            <h3 className="text-sm font-bold text-slate-900">Holiday Circuit - A unit of Leela Travels</h3>
            <p className="text-slate-600 italic leading-relaxed">
              KG 3/69, Ground Floor, Vikas Puri, Landmark: Near UK Nursing Home
            </p>
            <p className="text-slate-600 italic">Delhi, Delhi, India - 110018</p>
            <p className="text-slate-700 font-semibold pt-1">+91-885146665 • varun@holidaycircuit.com</p>
            <div className="pt-2 text-slate-800 font-medium space-y-0.5 text-[11px]">
              <p>PAN: <span className="font-bold">ABAPW1816B</span></p>
              <p>GST: <span className="font-bold">07ABAPW1816B3ZZ</span></p>
              <p>MSME REG NO : <span className="font-bold">UDYAM-DL-10-0079437</span></p>
              <p>TAN NO - <span className="font-bold">DELV30189F</span></p>
            </div>
          </div>

          {/* Buyer */}
          <div className="sm:text-right space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">BUYER (BILL TO)</p>
            <h3 className="text-sm font-bold text-slate-900">{customerName}</h3>
            <p className="text-slate-600 italic leading-relaxed">{buyerAddress}</p>
            <p className="text-slate-700 font-semibold pt-1">Phone: {buyerPhone}</p>
            <p className="text-slate-700 font-semibold">Email: {buyerEmail}</p>
          </div>
        </div>

        {/* Particulars Table */}
        <div className="w-full border border-rose-200/80 rounded-xs overflow-hidden pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#fee2e2]/50 border-b border-rose-200 text-rose-900 font-extrabold uppercase text-[11px]">
                <th className="py-2.5 px-3 w-16 text-center border-r border-rose-200">S.NO.</th>
                <th className="py-2.5 px-4 border-r border-rose-200">PARTICULARS</th>
                <th className="py-2.5 px-4 w-44 text-right">AMOUNT (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100 text-slate-800 font-medium">
              {items.map((item, idx) => {
                const base = Number(item.baseAmount || 0);
                const tax = item.applyTax ? (base * Number(item.taxPercentage || 0)) / 100 : 0;
                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <td className="py-3 px-3 text-center align-top border-r border-rose-100 font-bold">{idx + 1}.</td>
                      <td className="py-3 px-4 align-top border-r border-rose-100 whitespace-pre-line leading-relaxed">
                        {item.particularText}
                      </td>
                      <td className="py-3 px-4 align-top text-right font-bold border-rose-100">
                        INR {base.toLocaleString("en-IN")}.00
                      </td>
                    </tr>
                    {item.applyTax && (
                      <tr className="bg-slate-50/50 text-[11px] text-slate-600">
                        <td className="border-r border-rose-100"></td>
                        <td className="py-1.5 px-4 border-r border-rose-100 italic">
                          Taxes @ {Number(item.taxPercentage || 0).toFixed(2)} %
                        </td>
                        <td className="py-1.5 px-4 text-right font-semibold">
                          INR {tax.toLocaleString("en-IN")}.00
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              <tr className="bg-slate-50 font-bold border-t-2 border-rose-200 text-slate-900">
                <td colSpan={2} className="py-3 px-4 text-right border-r border-rose-200 text-xs uppercase font-extrabold">
                  Total (INR)
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-sm text-slate-900">
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
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              INR: {numberToWords(grandTotal)}
            </p>
          </div>
          <div className="text-slate-400 font-bold text-xs sm:text-right">
            E. & O.E.
          </div>
        </div>

        {/* Seller's Bank Details */}
        <div className="pt-3 border-t border-rose-200/80 space-y-1 text-xs">
          <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">SELLER'S BANK DETAILS</p>
          <div className="text-slate-700 space-y-0.5 leading-relaxed">
            <p>Bank Name: <span className="font-bold text-slate-900">LEELA TRAVELS</span></p>
            <p>A/c Holder Name: <span className="font-semibold">Leela Travels</span></p>
            <p>A/c No. <span className="font-semibold">051727000000221</span></p>
            <p>IFSC: <span className="font-semibold">YESB0000517</span></p>
            <p>Branch: <span className="font-semibold">DWARKA</span></p>
          </div>
        </div>

        {/* Terms and Conditions Section */}
        <div className="w-full border border-rose-200/80 rounded-xs overflow-hidden mt-4">
          <div className="w-full bg-[#fee2e2]/70 text-[#991b1b] text-center font-bold py-1.5 text-xs">
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
