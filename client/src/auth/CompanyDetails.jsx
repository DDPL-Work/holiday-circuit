import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { saveCompanyDetails } from "../Redux/Slice/authSlice";

export default function CompanyDetails() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [companyData, setCompanyData] = useState({
    name: "",
    gstNumber: "",
    phone: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ Save to Redux
    dispatch(saveCompanyDetails(companyData));

    // ✅ Navigate to KYC
    navigate("/register/kyc");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={companyData.name}
              onChange={(e) =>
                setCompanyData({ ...companyData, name: e.target.value })
              }
              placeholder="Travel World Pvt Ltd"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
          </div>

          {/* GST Number */}
          <div>
            <label className="block text-sm font-medium mb-1">GST Number</label>
            <input
              type="text"
              value={companyData.gstNumber}
              onChange={(e) =>
                setCompanyData({ ...companyData, gstNumber: e.target.value })
              }
              placeholder="22AAAAA0000A1Z5"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
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
              value={companyData.phone}
              onChange={(e) =>
                setCompanyData({ ...companyData, phone: e.target.value })
              }
              placeholder="+91 98765 43210"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-blue-900 text-white px-6 py-2 rounded-xl hover:bg-blue-800 transition"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
