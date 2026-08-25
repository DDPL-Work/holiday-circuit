import { Loader2, Upload } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import RegisterStepper from "./RegisterStepper.jsx";

export default function KycVerification({ back, submit, isActive = false }) {
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

    setUploading((prev) => ({
      ...prev,
      [field]: false,
    }));
  };

  const handleSubmit = async () => {
    if (uploading.gstCert || uploading.businessLicense) {
      toast.error("Please wait for documents to finish uploading");
      return;
    }

    if (!gstCert || !businessLicense) {
      toast.error("Please upload both documents");
      return;
    }

    const isRegistered = await submit([gstCert, businessLicense]);

    if (isRegistered) {
      toast.success("KYC documents uploaded successfully");
    }
  };

  const uploadBox =
    "cursor-pointer rounded-xl p-3 sm:p-5 text-center transition hover:border-black";

  return (
    <div className="w-full">
      <div className="w-full rounded-2xl p-2 sm:p-7">
        <RegisterStepper currentStep={3} isActive={isActive} />

        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">KYC Verification</h2>
        <p className="mb-5 text-xs sm:text-sm text-slate-500">
          Upload required documents to verify your business
        </p>

        <p className="mb-1.5 text-xs sm:text-sm font-semibold text-slate-700">GST Certificate</p>
        <div className="mb-3 rounded-2xl border border-gray-300">
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
              <Loader2 className="mx-auto mb-2 animate-spin text-blue-900" size={18} />
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
            <p className="mt-1 text-xs text-gray-400">PDF, JPG, PNG up to 10MB</p>
          </label>
        </div>

        <p className="mb-1.5 text-xs sm:text-sm font-semibold text-slate-700">Business License</p>
        <div className="mb-3 rounded-2xl border border-gray-300">
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
              <Loader2 className="mx-auto mb-2 animate-spin text-blue-900" size={18} />
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
            <p className="mt-1 text-xs text-gray-400">PDF, JPG, PNG up to 10MB</p>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={back}
            className="cursor-pointer rounded-2xl px-2 py-1.5 text-sm text-slate-800 hover:bg-black/5"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading.gstCert || uploading.businessLicense}
            className="cursor-pointer rounded-xl bg-gradient-to-r from-[#0f2d5a] to-[#0a0f1d] px-5 py-2 text-sm text-white transition hover:from-[#153e7a] hover:to-[#020617] hover:shadow-[0_4px_10px_rgba(15,45,90,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
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
