import { useEffect, useState } from "react";
import { MapPin, ArrowLeft } from "lucide-react";
import API from "../utils/Api.js";
import { motion, AnimatePresence } from "framer-motion";

const CreateNewQueries = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    numberOfAdults: 0,
    numberOfChildren: 0,
    customerBudget: 0,
    specialRequirements: "",
  });
  

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      console.log("Final Data:", formData);
      await API.post("/agent/queries", formData);
      setStep(1);
      onClose();
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };

  const stepVariant = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, x: -30, transition: { duration: 0.2, ease: "easeIn" } },
  };

   const handleClose = (e) => {
  e.stopPropagation();
  onClose();
};

  return (

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.25 }}
  className="fixed inset-0 z-50 flex items-center justify-center"
>
      {/* Overlay */}
      <motion.div
  onClick={onClose}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.25 }}
  className="absolute inset-0 bg-black/30 backdrop-blur-sm"
/>
      <motion.section
  onClick={(e) => e.stopPropagation()}
  initial={{ opacity: 0, scale: 0.95, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: 20 }}
  transition={{ duration: 0.25 }}
  className="relative w-full max-w-xl rounded-xl p-3 z-10 bg-[#f9fafb] shadow-sm border border-[#BEDBFF]"
>
        {/* Header */}
        <header className="flex items-center justify-between mb-2">
          <div
           onClick={handleClose}
            className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[1.8] text-gray-800" />
            <h2 className="text-md font-semibold">Back</h2>
          </div>

          <div>
            <p className="text-sm text-gray-500">Step {step} of 3</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {/* STEP 1 */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-xl p-6 max-w-xl mx-auto"
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold mt-1">Create New Query</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Tell us about the travel requirements.
                </p>
              </div>

              <div className="relative mb-3">
                <label className="block text-sm font-medium mb-1">Destination</label>
                <MapPin
                  size={16}
                  className="absolute left-5 top-11 -translate-y-1/2 text-gray-400"
                />
                <input
                  name="destination"
                  placeholder="maldives, paris"
                  value={formData.destination}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none "
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm flex items-center gap-1 cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-xl p-6 max-w-xl mx-auto"
            >
              <h2 className="text-xl font-semibold">Create New Query</h2>
              <p className="text-sm text-gray-500 mb-6">
                Tell us about the travel requirements.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Adults</label>
                  <input
                    type="number"
                    name="numberOfAdults"
                    value={formData.numberOfAdults}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Children</label>
                  <input
                    type="number"
                    name="numberOfChildren"
                    value={formData.numberOfChildren}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Budget per person (Optional)</label>
                <input
                  type="number"
                  name="customerBudget"
                  placeholder="e.g. 50000"
                  value={formData.customerBudget}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2 border border-gray-300 rounded-xl text-sm cursor-pointer"
                >
                  Previous
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm flex items-center gap-1 cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-xl p-6 max-w-xl mx-auto"
            >
              <h2 className="text-xl font-semibold">Create New Query</h2>
              <p className="text-sm text-gray-500 mb-6">
                Tell us about the travel requirements.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Special Preferences / Notes
                </label>
                <textarea
                  name="specialRequirements"
                  placeholder="e.g. Vegan food, Honeymoon inclusions, 5-star hotels only..."
                  value={formData.specialRequirements}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-2 text-sm py-2 border border-gray-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2 border border-gray-300 rounded-xl text-sm cursor-pointer"
                >
                  Previous
                </button>

                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm cursor-pointer"
                >
                  Submit Query →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </motion.section>
</motion.div>
  );
};

export default CreateNewQueries;