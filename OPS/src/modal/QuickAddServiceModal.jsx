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
        color: "text-blue-400",
        type: "hotel",
        nights: qty,
      };
    }

    if (category === "Transport / Transfer") {
      return {
        icon: <GiCityCar />,
        color: "text-purple-400",
        type: "transfer",
        days: qty,
        serviceType: "One Way",
      };
    }

    if (category === "Sightseeing") {
      return {
        icon: <GiModernCity />,
        color: "text-blue-400",
        type: "sightseeing",
        pax: Number(qty || 1),
        tourType: "Group Tour",
        pricingBasis: "Per Pax",
        maxPax: "N/A (Shared Group)",
      };
    }

    return {
      icon: <GiModernCity />,
      color: "text-green-400",
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

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-[3px]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-[374px] overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
          >
            <div className="border-b border-gray-100 bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                      <Plus size={14} />
                    </div>
                    <div>
                      <h2 className="text-[14px] font-semibold text-gray-900">
                        Quick Add Service
                      </h2>
                      <p className="mt-0.5 text-[10px] text-gray-500">
                        Add a custom service to the quotation.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-full border border-gray-200 bg-gray-50 p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  onClick={closeModal}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">
                    Service Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50"
                  >
                    <option>Activity / Experience</option>
                    <option>Sightseeing</option>
                    <option>Hotel / Accommodation</option>
                    <option>Transport / Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Yacht Booking, City Tour, etc."
                    className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50 placeholder:text-gray-400"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    placeholder="Service details and inclusions..."
                    className="h-[68px] w-full rounded-[12px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50 placeholder:text-gray-400"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-gray-700">
                      Base Rate *
                    </label>
                    <input
                      type="number"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-gray-700">
                      Quantity (Pax / Nights / Days)
                    </label>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                    <option value="EUR">EUR</option>
                    <option value="THB">THB</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
                <button
                  onClick={handleAddService}
                  disabled={savingService}
                  className="flex-1 rounded-[12px] bg-yellow-400 py-2.5 text-[11px] font-semibold text-gray-900 shadow-sm transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingService ? "Saving..." : "Add Service"}
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-[12px] border border-gray-200 bg-white py-2.5 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
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
