import {
  FileText,
  Plus,
  Trash2
} from "lucide-react";
import { useState } from "react";

export default function InternalInvoice() {
     const [items, setItems] = useState([
    {
      type: "Hotel",
      service: "",
      currency: "INR",
      qty: 1,
      rate: "",
      subtotal: "",
      tax: ""
    }
  ]);

  const addItem = () => {
    setItems([
      ...items,
      {
        type: "Hotel",
        service: "",
        currency: "INR",
        qty: 1,
        rate: "",
        subtotal: "",
        tax: ""
      }
    ]);
  };

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === "qty" || field === "rate") {
      updated[index].subtotal =
        updated[index].qty * updated[index].rate || 0;
    }

    setItems(updated);
  };
  return (

    <div className="bg-white rounded-xl border border-gray-200 shadow mt-4">

      {/* Header */}
      <div className="p-6 border-b border-gray-300">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <FileText size={18} />
          Internal Invoice Details (DMC to System)
        </h2>

        <p className="text-xs text-gray-500 mt-1">
          Enter your invoice details for internal accounting
        </p>
      </div>

      <div className="p-4">

        {/* Top Inputs */}
        <div className="grid grid-cols-4 gap-4 mb-6">

          <div>
            <label className="text-xs text-gray-500 ">Supplier Name <span className="text-red-600">*</span></label>
            <input
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              placeholder="DMC Company Name"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Invoice Number <span className="text-red-600">*</span></label>
            <input
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              placeholder="INV-2026-0001"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Invoice Date <span className="text-red-600">*</span></label>
            <input type="date"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              placeholder="dd-mm-yyyy"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Due Date <span className="text-red-600">*</span></label>
            <input type="date"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              placeholder="dd-mm-yyyy"
            />
          </div>

        </div>

        {/* Itemized Service Table */}
        <div className="border border-gray-300 rounded-lg mb-6 shadow">

          <div className="flex justify-between items-center border-b border-gray-300 p-3">

            <p className="text-sm font-medium">
              Itemized Service Table
            </p>

            <button onClick={addItem} className="flex items-center gap-1 text-sm border border-gray-400 rounded-xl px-2 py-1">
              <Plus size={14} />
              Add Line Item
            </button>

          </div>

          {/* Table Head */}
          <div className="grid grid-cols-7 text-center gap-3 p-3 text-xs text-gray-500 border-b border-gray-300">

            <span>Type</span>
            <span>Service Name</span>
            <span>Currency</span>
            <span>Quantity</span>
            <span>Net Rate</span>
            <span>Subtotal</span>
            <span>Tax</span>
            <span></span>

          </div>

         {/*========================= Dynamic Rows ==================================== */}

          {items.map((item, index) => (
          <div className="grid grid-cols-7 gap-6 p-4">

            <select className="border border-gray-300 rounded-xl p-2 text-sm outline-none" value={item.type}
                onChange={(e) =>
                  handleChange(index, "type", e.target.value)
                }>
                <option>Hotel</option>
                <option>Transport</option>
                <option>Activity</option>
            </select>

            <input
              className="border border-gray-300 rounded-xl p-2 text-xs outline-none"
              placeholder="Service name"
            />

            <select className="border border-gray-300 rounded-xl p-2 text-sm outline-none" value={item.currency}
                onChange={(e) =>
                  handleChange(index, "currency", e.target.value)
                }>
              <option>INR</option>
              <option>USD</option>
            </select>

            <input
              className="border border-gray-300 rounded-xl p-2 text-sm outline-none"
              defaultValue="1"
              value={item.qty}
                type="number"
                onChange={(e) =>
                  handleChange(index, "qty", e.target.value)
                }
            />

            <input
              className="border border-gray-300 rounded-xl p-2 text-sm outline-none"
              placeholder="0.00"
               value={item.rate}
                onChange={(e) =>
                  handleChange(index, "rate", e.target.value)
                }
            />

            <input
              className="border border-gray-300 rounded-xl p-2 text-sm outline-none"
              placeholder="0.00"
                value={item.subtotal}
                readOnly
            />

            <input
              className="border border-gray-300 rounded-xl p-2 text-sm outline-none"
              placeholder="0.00"
              value={item.tax}
                onChange={(e) =>
                  handleChange(index, "tax", e.target.value)
                }
            />

               {/* Delete Button */}
    {items.length > 1 && (
      <button
        onClick={() => removeItem(index)}
        className="text-red-500 cursor-pointer flex items-center justify-center"
      >
        <Trash2 size={16} />
      </button>
    )}

          </div>

        ))}

        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-2 gap-6">

          {/* Tax Config */}
          <div>

            <p className="text-sm font-medium mb-3">
              Tax Configuration
            </p>

            <div className="space-y-3">

              <div className="flex items-center gap-3">

                <label className="text-xs w-28">GST Rate (%)</label>

                <input
                  className="border border-gray-400 rounded-lg  p-2 text-sm w-20"
                  defaultValue="5"
                />

                <span className="text-xs text-gray-400">
                  Auto-calculated on subtotal
                </span>

              </div>

              <div className="flex items-center gap-3">

                <label className="text-xs w-28">TCS Rate (%)</label>

                <input
                  className="border border-gray-400 rounded-lg  p-2 text-sm w-20"
                  defaultValue="0.1"
                />

                <span className="text-xs text-gray-400">
                  Tax Collected at Source
                </span>

              </div>

              <div className="flex items-center gap-3">

                <label className="text-xs w-28">Other Tax</label>

                <input
                  className="border border-gray-400 rounded-lg p-2 text-sm w-20"
                  defaultValue="0"
                />

                <span className="text-xs text-gray-400">
                  Fixed amount
                </span>

              </div>

            </div>

          </div>

          {/* Invoice Summary */}
          <div className="border border-gray-300 rounded-xl p-4 bg-sky-50">

            <p className="text-sm font-medium mb-4">
              Invoice Summary
            </p>

            <div className="space-y-2 text-sm">

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹0</span>
              </div>

              <div className="flex justify-between text-blue-600">
                <span>GST (5%)</span>
                <span>+ ₹0</span>
              </div>

              <div className="flex justify-between text-blue-600">
                <span>TCS (0.1%)</span>
                <span>+ ₹0</span>
              </div>

              <div className="flex justify-between text-blue-600">
                <span>Other Tax</span>
                <span>+ ₹0</span>
              </div>

              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total Tax</span>
                <span>₹0</span>
              </div>

              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Grand Total</span>
                <span>₹0</span>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-4 border-t">

        <button className="border px-4 py-2 rounded-xl text-sm cursor-pointer">
          Save as Draft
        </button>

        <button className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm cursor-pointer">
          Generate Internal Invoice
        </button>

      </div>

    </div>
  );
}