import { useEffect, useState } from "react";
import { MapPin, ArrowLeft,} from "lucide-react";

const CreateNewQueries = ({ onClose }) => {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    adults: 2,
    children: 0,
    budget: "",
    notes: "",
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

  const handleSubmit = () => {
    console.log("Final Data:", formData);
    //  API call
    // navigate("/queries");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        onClick={onClose}
        className=" absolute inset-0 bg-black/30 backdrop-blur-sm"
      />
      <section className="relative bg-white w-full max-w-xl rounded-xl shadow-sm p-3 z-10 ">
        {/* Header */}
        <header className="flex items-center justify-between mb-2  ">
          <div className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded-xl cursor-pointer ">
            <ArrowLeft className="w-5 h-5 stroke-[1.8] text-gray-800" />
            <h2 className="text-md font-semibold">Back</h2>
          </div>

          <div>
            <p className="text-sm text-gray-500">Step {step} of 3</p>
          </div>
        </header>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white rounded-xl p-6 max-w-xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mt-1">Create New Query</h2>
              <p className="text-sm text-gray-500 mt-1">
                Tell us about the travel requirements.
              </p>
            </div>

            {/* Destination */}
            <div className="relative mb-3">
              <label className="block text-sm font-medium mb-1">
                Destination
              </label>
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

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm flex items-center gap-1 cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white rounded-xl p-6 max-w-xl mx-auto">
            <h2 className="text-xl font-semibold">Create New Query</h2>
            <p className="text-sm text-gray-500 mb-6">
              Tell us about the travel requirements.
            </p>

            {/* Adults & Children */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Adults</label>
                <input
                  type="number"
                  name="adults"
                  value={formData.adults}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Children
                </label>
                <input
                  type="number"
                  name="children"
                  value={formData.children}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Budget */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                Budget per person (Optional)
              </label>
              <input
                name="budget"
                placeholder="e.g. 50000"
                value={formData.budget}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Actions */}
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
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="bg-white rounded-xl p-6 max-w-xl mx-auto">
           <h2 className="text-xl font-semibold">Create New Query</h2>
            <p className="text-sm text-gray-500 mb-6">
              Tell us about the travel requirements.
            </p>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                Special Preferences / Notes
              </label>
              <textarea
                name="notes"
                placeholder="e.g. Vegan food, Honeymoon inclusions, 5-star hotels only..."
                value={formData.notes}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none"
              />
            </div>

            {/* Actions */}
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
          </div>
        )}

      </section>
    </div>
  );
};

export default CreateNewQueries;
