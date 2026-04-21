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
    "cursor-pointer rounded-xl p-6 text-center transition hover:border-black";

  return (
    <div className="flex w-full items-center justify-center px-3">
      <div className="w-full rounded-2xl bg-white p-6">
        <RegisterStepper currentStep={3} isActive={isActive} />

        <h2 className="text-lg font-bold text-gray-800">KYC Verification</h2>
        <p className="mb-5 text-sm text-gray-500">
          Upload required documents to verify your business
        </p>

        <p className="mb-2 text-sm font-medium text-gray-700">GST Certificate</p>
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

        <p className="mb-2 text-sm font-medium text-gray-700">Business License</p>
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
            className="cursor-pointer rounded-2xl px-2 py-1.5 text-sm text-black hover:bg-gray-100"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading.gstCert || uploading.businessLicense}
            className="cursor-pointer rounded-xl bg-black px-5 py-2 text-sm text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
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
