import toast from "react-hot-toast";


export default function CompanyDetails({ form, setForm, next, }) {

const handleSubmit = (e) => {
  e.preventDefault()
    // ✅ Validation
    if (!form.companyName || !form.gstNumber || !form.phone) {
      toast.error("Please fill all company details");
      return;
    }
    toast.success("Company details saved")
    next();
  };

  return (
    <div className="w-full h-screen min-h-screen flex items-center justify-center px-4 ">
      <div className="w-full max-w-xl bg-white rounded-2xl p-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center w-full">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-900 text-white text-sm font-semibold">
              1
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-2 rounded"></div>
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-sm font-semibold">
              2
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-1">Company Details</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Tell us about your travel agency
        </p>

        <form onSubmit={handleSubmit}  className="space-y-3">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Company Name
            </label>
            <input
              type="text"
               value={form.companyName || ""}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="Travel World Pvt Ltd"
              className="w-full text-sm mt-1 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none"
              required
            />
          </div>

          {/* GST Number */}
          <div>
            <label className="block text-sm font-medium mb-1">GST Number</label>
            <input
              type="text"
              value={form.gstNumber || ""}
              onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
              placeholder="GST.22AAAAA0000A1Z5"
              className="w-full text-sm mt-1 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Contact Number
            </label>
            <input
              type="tel"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765-43210"
              className="w-full text-sm mt-1 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-blue-900 text-white px-4 py-2 rounded-xl hover:bg-blue-800 transition cursor-pointer"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
