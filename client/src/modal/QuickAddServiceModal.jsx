import { X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GiCityCar, GiModernCity } from "react-icons/gi";
import { LiaHotelSolid } from "react-icons/lia";
import { useState } from "react";

export default function QuickAddService({ showModal, setShowModal, addCustomService }) {
const [category,setCategory] = useState("Activity / Experience");
const [name,setName] = useState("");
const [desc,setDesc] = useState("");
const [rate,setRate] = useState(0);
const [qty,setQty] = useState(1);


const getServiceData = () => {

 if(category === "Hotel / Accommodation"){

   return {
     icon:<LiaHotelSolid />,
     color:"text-blue-400",
     type:"hotel",
     nights:qty
   };

 }

 if(category === "Transport / Transfer"){

   return {
     icon:<GiCityCar />,
     color:"text-purple-400",
     type:"car",
     days:qty,
     serviceType:"One Way"
   };

 }

 return {
   icon:<GiModernCity />,
   color:"text-green-400",
   type:"pax",
   pax:qty
 };

};

const handleAddService = () => {

  const serviceData = getServiceData();

  addCustomService({
    title: name,
    desc: desc,
    rate: Number(rate),
    custom: true,
    ...serviceData
  });

  // reset form
  setName("");
  setDesc("");
  setRate(0);
  setQty(1);

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
          className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4"
        >

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
           className="w-full max-w-lg max-h-[90vh]  bg-[#1c1b1bd0] border border-yellow-500/40 rounded-3xl p-7 shadow-xl"
          >

            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Plus className="text-yellow-400" size={18} />
                <h2 className="text-lg font-semibold text-white">
                  Quick Add Service
                </h2>
              </div>

              <X
                className="text-gray-400 cursor-pointer hover:text-white"
                size={18}
                onClick={closeModal}
              />
            </div>

            <p className="text-gray-400 text-sm mb-5">
              Add a custom service to the quotation.
            </p>

            {/* Service Category */}
            <div className="mb-3">
              <label className="text-sm text-gray-300 mb-1 block">
                Service Category
              </label>

              <select  value={category}
 onChange={(e)=>setCategory(e.target.value)} className="w-full bg-[#161414f3] text-xs border border-yellow-400 rounded-xl px-3 py-2 text-white outline-none cursor-pointer">
                <option>Activity / Experience</option>
                <option>Hotel / Accommodation</option>
                <option>Transport / Transfer</option>
              </select>
            </div>

            {/* Service Name */}
            <div className="mb-4">
              <label className="text-sm text-gray-300 mb-1 block">
                Service Name *
              </label>

              <input
                type="text"
                placeholder="e.g., Yacht Booking, Gala Dinner, etc."
                className="w-full bg-[#0f0f0f] border border-gray-700 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-yellow-400"  value={name}
 onChange={(e)=>setName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="mb-2">
              <label className="text-sm text-gray-300 mb-1 block">
                Description
              </label>

              <textarea
                placeholder="Service details and inclusions..."
                className="w-full bg-[#111010c8] border border-gray-700 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-yellow-400 h-24"  value={desc}
 onChange={(e)=>setDesc(e.target.value)}
              />
            </div>

            {/* Rate + Quantity */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  Base Rate (₹) *
                </label>

                <input
                  type="number"
                  defaultValue="0"
                  className="w-full bg-[#0f0f0f] border text-white border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400"  value={rate}
 onChange={(e)=>setRate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  Quantity
                </label>

                <input
                  type="number"
                  defaultValue="1"
                  className="w-full bg-[#0f0f0f] border text-white border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400"  value={qty}
 onChange={(e)=>setQty(e.target.value)}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button onClick={handleAddService} className="flex-1 bg-yellow-400 text-black font-semibold py-1.5 rounded-xl hover:bg-yellow-500 cursor-pointer">
                Add Service
              </button>

              <button
                onClick={closeModal}
                className="flex-1 bg-gray-300 text-black font-semibold py-1.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}