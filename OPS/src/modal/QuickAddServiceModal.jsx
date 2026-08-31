import { X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GiCityCar, GiModernCity } from "react-icons/gi";
import { LiaHotelSolid } from "react-icons/lia";
import { useState } from "react";

export default function QuickAddService({
  showModal,
  setShowModal,
  addCustomService,
  savingService = false,
}) {
  const [category, setCategory] = useState("Activity / Experience");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [rate, setRate] = useState(0);
  const [qty, setQty] = useState(1);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("INR");

  const getServiceData = () => {
    if (category === "Hotel / Accommodation") {
      return {
        icon: <LiaHotelSolid />,
        color: "text-blue-600",
        type: "hotel",
        nights: qty,
      };
    }

    if (category === "Transport / Transfer") {
      return {
        icon: <GiCityCar />,
        color: "text-purple-600",
        type: "transfer",
        days: qty,
        serviceType: "One Way",
      };
    }

    if (category === "Sightseeing") {
      return {
        icon: <GiModernCity />,
        color: "text-blue-600",
        type: "sightseeing",
        pax: Number(qty || 1),
        tourType: "Group Tour",
        pricingBasis: "Per Pax",
        maxPax: "N/A (Shared Group)",
      };
    }

    return {
      icon: <GiModernCity />,
      color: "text-emerald-600",
      type: "activity",
      pax: Number(qty || 1),
    };
  };

  const handleAddService = async () => {
    if (!name.trim()) return;
    if (!Number(rate)) return;

    const serviceData = getServiceData();

    await addCustomService({
      title: name,
      desc,
      rate: Number(rate),
      city,
      country,
      currency,
      custom: true,
      ...serviceData,
    });

    setName("");
    setDesc("");
    setRate(0);
    setQty(1);
    setCity("");
    setCountry("");
    setCurrency("INR");
    setShowModal(false);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const inputStyle = "w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-900 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs";

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs"
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="w-full max-w-[390px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl text-slate-900 font-sans"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="border-b border-gray-200 bg-slate-50 px-4 py-3.5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-100 text-amber-700 shadow-2xs">
                    <Plus size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Quick Add Service
                    </h2>
                    <p className="mt-0.5 text-[10.5px] text-slate-500">
                      Add a custom service to the quotation.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer shadow-2xs"
                  onClick={closeModal}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3.5">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Service Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputStyle}
                  >
                    <option>Activity / Experience</option>
                    <option>Sightseeing</option>
                    <option>Hotel / Accommodation</option>
                    <option>Transport / Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Yacht Booking, City Tour, etc."
                    className={inputStyle}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Service details and inclusions..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[11px] font-medium text-slate-900 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs min-h-[72px] resize-y"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      Base Rate *
                    </label>
                    <input
                      type="number"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      className={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      Quantity (Pax / Nights / Days)
                    </label>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={inputStyle}
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                    <option value="EUR">EUR</option>
                    <option value="THB">THB</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2.5 border-t border-gray-100 pt-3">
                <button
                  onClick={handleAddService}
                  disabled={savingService}
                  className="flex-1 rounded-lg bg-amber-500 py-2 text-[11px] font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 shadow-xs cursor-pointer"
                >
                  {savingService ? "Saving..." : "Add Service"}
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-gray-50 shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

