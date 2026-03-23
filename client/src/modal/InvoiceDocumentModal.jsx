import React from 'react';
import { FileText, Download } from 'lucide-react';

const InvoiceDocumentModal = ({ invoice, onClose }) => {
  // Safety check: if there is no invoice data, don't render anything
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Invoice Documents</h2>
            <p className="text-sm text-slate-500 mt-1">{invoice.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-slate-600 hover:bg-gray-50 rounded-full text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-6">
          {/* Payment Details Box */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Payment Details</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Party Name:</span>
                <span className="font-medium text-slate-900">{invoice.party}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">UTR Number:</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono">{invoice.utr}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Bank Name:</span>
                <span className="font-medium text-slate-900">{invoice.bank}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-yellow-500">{invoice.amount}</span>
              </div>
            </div>
          </div>

          {/* Uploaded Documents List */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Uploaded Documents</h3>
            <div className="flex flex-col gap-3">
              {/* File 1 */}
              <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">Invoice_Receipt.pdf</span>
                    <span className="text-xs text-slate-400">245 KB</span>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-lg text-xs font-medium transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default InvoiceDocumentModal;