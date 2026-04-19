import { Loader2, Upload } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function KycVerification({ form, setForm, next, back, submit }) {
  const [gstCert, setGstCert] = useState(null);
  const [businessLicense, setBusinessLicense] = useState(null);
  const [uploading, setUploading] = useState({
    gstCert: false,
    businessLicense: false,
  });

  const handleFileUpload = async (field, file, setter) => {
    if (!file) return;

    setUploading((prev) => ({
      ...prev,
      [field]: true,
    }));

    await new Promise((resolve) => setTimeout(resolve, 800));

    setter(file);
    setForm({
      ...form,
      documents: [...(form.documents || []), file],
    });

    setUploading((prev) => ({
      ...prev,
      [field]: false,
    }));
  };

  const handleSubmit = () => {
    if (uploading.gstCert || uploading.businessLicense) {
      toast.error("Please wait for documents to finish uploading");
      return;
    }

    if (!gstCert || !businessLicense) {
      toast.error("Please upload both documents");
      return;
    }

    toast.success("KYC documents uploaded successfully");
    submit();
    next();
  };

  const uploadBox =
    "rounded-xl p-6 text-center cursor-pointer hover:border-black transition";

  return (
    <div className="w-full flex items-center justify-center px-3">
      <div className="w-full bg-white rounded-2xl p-6">
        {/* Step Indicator */}
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-semibold">
            ✓
          </div>

          <div className="flex-1 h-1 bg-blue-900 mx-2 rounded" />

          <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white text-sm font-semibold">
            2
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-800">KYC Verification</h2>
        <p className="text-sm text-gray-500 mb-5">
          Upload required documents to verify your business
        </p>

        {/* GST Certificate */}
        <p className="text-sm font-medium text-gray-700 mb-2">
          GST Certificate
        </p>
        <div className="mb-3 border border-gray-300 rounded-2xl">
          <label
            className={`${uploadBox} ${
              uploading.gstCert ? "pointer-events-none opacity-70" : ""
            }`}
          >
            <input
              type="file"
              className="hidden"
              onChange={(e) =>
                handleFileUpload("gstCert", e.target.files[0], setGstCert)
              }
            />
            {uploading.gstCert ? (
              <Loader2 className="mx-auto mb-2 text-blue-900 animate-spin" size={18} />
            ) : (
              <Upload className="mx-auto mb-2 text-gray-400" size={18} />
            )}
            <p className="text-sm text-green-600">
              {uploading.gstCert
                ? "Uploading GST certificate..."
                : gstCert
                ? gstCert.name
                : "Drag & drop or click to upload"}
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
          <label
            className={`${uploadBox} ${
              uploading.businessLicense ? "pointer-events-none opacity-70" : ""
            }`}
          >
            <input
              type="file"
              className="hidden"
              onChange={(e) =>
                handleFileUpload(
                  "businessLicense",
                  e.target.files[0],
                  setBusinessLicense
                )
              }
            />
            {uploading.businessLicense ? (
              <Loader2 className="mx-auto mb-2 text-blue-900 animate-spin" size={18} />
            ) : (
              <Upload className="mx-auto mb-2 text-gray-400" size={18} />
            )}
            <p className="text-sm text-green-600">
              {uploading.businessLicense
                ? "Uploading business license..."
                : businessLicense
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
            className="text-sm text-black hover:bg-gray-100 rounded-2xl px-2 py-1.5 cursor-pointer"
          >
            ← Back
          </button>

          <button
            onClick={handleSubmit}
            disabled={uploading.gstCert || uploading.businessLicense}
            className="px-5 py-2 rounded-xl text-sm text-white transition cursor-pointer bg-black hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading.gstCert || uploading.businessLicense
              ? "Uploading..."
              : "Submit for Verification"}
          </button>
        </div>
      </div>
    </div>
  );
}
