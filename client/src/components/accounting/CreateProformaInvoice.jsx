import React, { useState } from "react";
import { ArrowLeft, Pencil, Phone, Mail, CreditCard, Plus, X } from "lucide-react";
// import toast from "react-hot-toast";

const CreateProformaInvoice = ({ onClose, onSave, queryData = {} }) => {
  const [hideTaxBreakup, setHideTaxBreakup] = useState(false);
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [bankAccount, setBankAccount] = useState("LEELA YESBANK - **0221 - INR");
  const [dueDate, setDueDate] = useState("July 30, 2026");
  const [overview, setOverview] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [termsConditions, setTermsConditions] = useState("Invoice TnC");
  const [confirmed, setConfirmed] = useState(false);

  const queryId = queryData?.queryId || queryData?.id || "4121824";
  const customerName = queryData?.clientName || queryData?.name || queryData?.buyerName || "Sen Destination";
  const destination = queryData?.destination || "Colombo, Srilanka";
  const numDays = queryData?.duration || "2N,3D";
  const pax = queryData?.pax || "2A";
  const totalPkgPrice = Number(queryData?.totalAmount || queryData?.finalQuoteAmount || queryData?.packagePrice || 69000);

  const [items, setItems] = useState([
    {
      particularText: `Trip#: ${queryId}\n${destination} Tour Package\nMr. Michal Zeman - 03 Aug 2026 - ${numDays} - ${pax}`,
      hsnSac: "",
      qty: 1,
      baseAmount: totalPkgPrice,
      applyTax: true,
      taxName: "Taxes",
      taxPercentage: 0,
    },
  ]);

  const sellerDetails = {
    name: "Holiday Circuit - A unit of Leela Travels",
    address: "KG 3/69, Ground Floor, Vikas Puri, Near UK Nursing Home",
    cityState: "Delhi, Delhi",
    countryZip: "India, 110018",
    phone: "+91-885146665",
    email: "varun@holidaycircuit.com",
    pan: "ABAPW1816B",
    gst: "07ABAPW1816B3ZZ",
    msme: "UDYAM-DL-10-0079437",
    tan: "DELV30189F",
  };

  const buyerDetails = {
    name: customerName,
    address: queryData?.clientAddress || "Colombo Sri Lanka, Sri Lanka",
    country: queryData?.clientCountry || "Sri Lanka",
    phone: queryData?.clientPhone || "+94-717819657",
    email: queryData?.clientEmail || "anushka@sendestinations.com",
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        particularText: "",
        hsnSac: "",
        qty: 1,
        baseAmount: 0,
        applyTax: false,
        taxName: "Taxes",
        taxPercentage: 0,
      },
    ]);
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => {
      const base = item.qty * item.baseAmount;
      const tax = item.applyTax ? (base * item.taxPercentage) / 100 : 0;
      return sum + base + tax;
    }, 0);
  };

  const handleSave = () => {
    if (!confirmed) {
      alert("Please confirm that all details of this proforma invoice are correct.");
      return;
    }
    if (onSave) {
      onSave({
        items,
        placeOfSupply,
        bankAccount,
        dueDate,
        overview,
        specialNotes,
        termsConditions,
        grandTotal: calculateGrandTotal(),
      });
    }
    if (onClose) onClose();
  };

  return (
    <div className="w-full min-h-screen bg-white font-sans text-slate-800">
      {/* Top Bar with Back Icon & Title - Edge-to-Edge */}
      <div className="w-full bg-white border-b border-slate-200/90 px-6 py-3.5 flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer text-slate-700"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create New Proforma Invoice</h1>
      </div>

      {/* Main Form Content */}
      <div className="w-full px-4 lg:px-6 py-5 space-y-5">
        {/* Section 1: Invoice Options */}
      <div className="bg-[#f1f5f9] rounded-lg p-4 border border-slate-200/60 space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Options</p>
        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-900 select-none">
          <input
            type="checkbox"
            checked={hideTaxBreakup}
            onChange={(e) => setHideTaxBreakup(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Hide Tax Breakup</span>
        </label>
      </div>

      {/* Section 2: Proforma Invoice Header & Seller/Buyer Details */}
      <div className="bg-white rounded-lg border border-slate-200/80 p-5 space-y-4 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900 text-center">Proforma Invoice</h2>

        <div className="bg-[#f8fafc] rounded-lg border border-slate-200/70 p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Seller Details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-slate-900">Seller Billing/Address Details</h3>
              <Pencil className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>
            <p className="text-xs font-bold text-slate-800">{sellerDetails.name}</p>
            <p className="text-xs italic text-slate-600">{sellerDetails.address}</p>
            <p className="text-xs italic text-slate-600">{sellerDetails.cityState}</p>
            <p className="text-xs italic text-slate-600">{sellerDetails.countryZip}</p>

            <div className="pt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{sellerDetails.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{sellerDetails.email}</span>
              </div>
            </div>

            <div className="pt-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Billing Details</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-700 space-y-0.5 pl-5">
                <p>PAN: {sellerDetails.pan}</p>
                <p>GST: {sellerDetails.gst}</p>
                <p>MSME REG NO : {sellerDetails.msme}</p>
                <p>TAN NO - {sellerDetails.tan}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Buyer Details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-slate-900">Buyer Billing/Address Details</h3>
              <Pencil className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>
            <p className="text-xs font-bold text-slate-800">{buyerDetails.name}</p>
            <p className="text-xs italic text-slate-600">{buyerDetails.address}</p>
            <p className="text-xs italic text-slate-600">{buyerDetails.country}</p>

            <div className="pt-3 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{buyerDetails.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{buyerDetails.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Place of Supply, Bank Account, Due Date */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1">Place of Supply</label>
          <input
            type="text"
            placeholder="Type to search..."
            value={placeOfSupply}
            onChange={(e) => setPlaceOfSupply(e.target.value)}
            className="w-full border border-slate-200 rounded px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1">
            Bank Account <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            className="w-full border border-slate-200 rounded px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="LEELA YESBANK - **0221 - INR">LEELA YESBANK - **0221 - INR</option>
            <option value="HDFC BANK - **1452 - INR">HDFC BANK - **1452 - INR</option>
            <option value="ICICI BANK - **9821 - INR">ICICI BANK - **9821 - INR</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1">Due Date</label>
          <input
            type="text"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-slate-200 rounded px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Overview */}
      <div>
        <label className="block text-xs font-bold text-slate-900 mb-1">Overview</label>
        <textarea
          rows={3}
          placeholder="eg. Darjeeling Tour Package - 27 Oct 2025 - 6N, 7D - 2A, 3 Children (10y, 9y, 8y)"
          value={overview}
          onChange={(e) => setOverview(e.target.value)}
          className="w-full border border-slate-200 rounded p-3 text-xs bg-white focus:outline-none focus:border-blue-500 resize-y"
        />
      </div>

      {/* Particulars Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Particulars</h3>

        <div className="border border-slate-200 rounded-md overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3 w-8">#</th>
                <th className="p-3">Particular</th>
                <th className="p-3 w-20">Qty</th>
                <th className="p-3 w-72">Base Amount Per Qty (INR)</th>
                <th className="p-3 w-48 text-right">Total (INR)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-slate-200/70 align-top">
                  <td className="p-3 font-semibold text-slate-700">{index + 1}</td>
                  <td className="p-3 space-y-2">
                    <textarea
                      rows={4}
                      value={item.particularText}
                      onChange={(e) => handleItemChange(index, "particularText", e.target.value)}
                      className="w-full border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-[11px]">HSN/SAC</span>
                      <input
                        type="text"
                        placeholder="e.g. 998555"
                        value={item.hsnSac}
                        onChange={(e) => handleItemChange(index, "hsnSac", e.target.value)}
                        className="border border-slate-200 rounded px-2.5 py-1 text-xs w-36 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, "qty", Number(e.target.value))}
                      className="border border-slate-200 rounded px-2.5 py-1 text-xs w-16 text-center focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="p-3 space-y-3">
                    <input
                      type="number"
                      value={item.baseAmount}
                      onChange={(e) => handleItemChange(index, "baseAmount", Number(e.target.value))}
                      className="border border-slate-200 rounded px-2.5 py-1.5 text-xs w-full focus:outline-none focus:border-blue-500 font-semibold"
                    />

                    {/* Tax Section inline */}
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200/60 space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.applyTax}
                          onChange={(e) => handleItemChange(index, "applyTax", e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Apply Tax on Base Amount</span>
                      </label>

                      {item.applyTax && (
                        <div className="space-y-2 pt-1">
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
                            <span>Tax Name</span>
                            <span>Percentage</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.taxName}
                              onChange={(e) => handleItemChange(index, "taxName", e.target.value)}
                              className="border border-slate-200 rounded px-2 py-1 text-xs w-full bg-white focus:outline-none focus:border-blue-500"
                            />
                            <div className="flex items-center gap-1 w-24 shrink-0">
                              <input
                                type="number"
                                value={item.taxPercentage}
                                onChange={(e) => handleItemChange(index, "taxPercentage", Number(e.target.value))}
                                className="border border-slate-200 rounded px-2 py-1 text-xs w-full text-center bg-white focus:outline-none focus:border-blue-500"
                              />
                              <span className="text-xs text-slate-500">%</span>
                            </div>
                            <button type="button" className="text-slate-400 hover:text-slate-600">
                              <Plus className="w-4 h-4" />
                            </button>
                            <button type="button" className="text-slate-400 hover:text-rose-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 space-y-2 text-right">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-700">Total Base Amount</p>
                      <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 font-semibold inline-block min-w-[90px]">
                        {(item.qty * item.baseAmount).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-700">Taxes</p>
                      <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 font-semibold inline-block min-w-[90px]">
                        {item.applyTax ? ((item.qty * item.baseAmount * item.taxPercentage) / 100).toLocaleString("en-IN") : "0"}
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-base font-bold text-slate-900">
                        {((item.qty * item.baseAmount) + (item.applyTax ? (item.qty * item.baseAmount * item.taxPercentage) / 100 : 0)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={addItem}
            className="px-3.5 py-1.5 bg-white border border-blue-200 text-[#2563eb] hover:bg-blue-50 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Total Summary Bar */}
      <div className="bg-[#f0f4f9] rounded-md p-4 flex justify-end items-center my-4">
        <div className="text-right">
          <span className="text-lg font-bold text-slate-900">
            Total: <span className="text-xs font-semibold text-slate-500">INR</span> {calculateGrandTotal().toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Special Notes & Terms and Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1">
            Special Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Any special notes here"
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            className="w-full border border-slate-200 rounded p-3 text-xs bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1">Terms and Conditions</label>
          <textarea
            rows={3}
            value={termsConditions}
            onChange={(e) => setTermsConditions(e.target.value)}
            className="w-full border border-slate-200 rounded p-3 text-xs bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Yellow Alert Box */}
      <div className="bg-[#fffbeb] border border-amber-200 rounded-md p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-900">
          Please cross check all the details and correct it if something is not as per rules and regulations.
        </p>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-900 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
          />
          <span>I confirm that all the details of this proforma invoice are correct</span>
        </label>
      </div>

      {/* Footer Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 bg-[#2563eb] text-white hover:bg-blue-700 rounded-md text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          Save Details
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-md text-sm font-semibold transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);
};

export default CreateProformaInvoice;
