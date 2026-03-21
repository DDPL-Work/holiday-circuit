import { Upload } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function KycVerification({ form, setForm, next, back, submit }) {
  const [gstCert, setGstCert] = useState(null);
  const [businessLicense, setBusinessLicense] = useState(null);

  const handleSubmit = () => {
    if (!gstCert || !businessLicense) {
      toast.error("Please upload both documents");
      return;
    }
    toast.success("KYC documents uploaded successfully");
    submit(); // API hit
    next();
  };

  const uploadBox =
    "rounded-xl p-6 text-center cursor-pointer hover:border-black transition";

  return (
    <div className=" w-full flex items-center justify-center px-3">
      <div className="w-full bg-white rounded-2xl p-6">
        {/* Step Indicator */}
        <div className="flex items-center mb-6">
          {/* Left completed dot */}
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
            ✓
          </div>

          {/* Solid line */}
          <div className="flex-1 h-0.5 bg-black mx-3" />

          {/* Current step dot */}
          <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-white text-xs">
            2
          </div>
        </div>
        <h2 className="text-lg font-bold text-gray-800 ">KYC Verification</h2>
        <p className="text-sm text-gray-500 mb-5">
          Upload required documents to verify your business
        </p>

        {/* GST Certificate */}
        <p className="text-sm font-medium text-gray-700 mb-2">
          GST Certificate
        </p>
        <div className="mb-3 border border-gray-300 rounded-2xl">
          <label className={uploadBox}>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                setGstCert(file);

                setForm({
                  ...form,
                  documents: [...(form.documents || []), file], // ✅ FILE
                });
              }}
            />
            <Upload className="mx-auto mb-2 text-gray-400" size={18} />
            <p className="text-sm text-green-600">
              {gstCert ? gstCert.name : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, JPG, PNG up to 10MB
            </p>
          </label>
        </div>

        {/* Business License */}
        <p className="text-sm font-medium text-gray-700 mb-2">
          Business License
        </p>
        <div className="mb-3 border border-gray-300 rounded-2xl">
          <label className={uploadBox}>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                setBusinessLicense(file);

                setForm({
                  ...form,
                  documents: [...(form.documents || []), file], // ✅ FILE
                });
              }}
            />
            <Upload className="mx-auto mb-2 text-gray-400" size={18} />
            <p className="text-sm text-green-600">
              {businessLicense
                ? businessLicense.name
                : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, JPG, PNG up to 10MB
            </p>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={back}
            className="text-sm text-black hover:bg-gray-100  rounded-2xl px-2 py-1.5 cursor-pointer"
          >
            ← Back
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl text-sm text-white transition cursor-pointer bg-black hover:bg-gray-900 "
          >
            Submit for Verification
          </button>
        </div>
      </div>
    </div>
  );
}
