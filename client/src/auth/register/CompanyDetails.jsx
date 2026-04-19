import toast from "react-hot-toast";

export default function CompanyDetails({ form, setForm, next }) {
  const gstPattern = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

  const normalizePhone = (value) => {
    const digits = value.replace(/\D/g, "");

    if (digits.length === 12 && digits.startsWith("91")) {
      return digits.slice(2);
    }

    return digits;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const companyName = form.companyName?.trim();
    const gstNumber = form.gstNumber?.trim().toUpperCase();
    const phone = normalizePhone(form.phone || "");

    if (!companyName || !gstNumber || !phone) {
      toast.error("Please fill all company details");
      return;
    }

    if (!gstPattern.test(gstNumber)) {
      toast.error("Enter a valid GST number");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }

    setForm({
      ...form,
      companyName,
      gstNumber,
      phone,
    });

    toast.success("Company details saved");
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

        <form onSubmit={handleSubmit} className="space-y-3">
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
              onChange={(e) =>
                setForm({
                  ...form,
                  gstNumber: e.target.value.toUpperCase().replace(/\s/g, ""),
                })
              }
              placeholder="22AAAAA0000A1Z5"
              className="w-full text-sm mt-1 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none"
              maxLength={15}
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
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value.replace(/[^\d+\-\s]/g, ""),
                })
              }
              placeholder="+91 98765-43210"
              className="w-full text-sm mt-1 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none"
              inputMode="numeric"
              maxLength={16}
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
