import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { saveKycDetails } from "../Redux/Slice/authSlice";
import OnboardingStepper from "../Components/OnboardingStepper";

export default function KycVerification() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [businessProof, setBusinessProof] = useState(null);
  const [ownerId, setOwnerId] = useState(null);

  const handleSubmit = () => {
    if (!businessProof || !ownerId) return;

    // ✅ SAVE KYC IN REDUX
    dispatch(
      saveKycDetails({
        businessProofName: businessProof.name,
        ownerIdName: ownerId.name,
      })
    );

    navigate("/register/verify");
  };

  const uploadBoxStyle =
    "border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-black transition";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-xl bg-white shadow-md rounded-2xl p-8">

        <OnboardingStepper step={2} />

        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          KYC Verification
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          Upload the required documents for verification.
        </p>

        {/* Business Proof Upload */}
        <label className={uploadBoxStyle}>
          <input
            type="file"
            className="hidden"
            onChange={(e) => setBusinessProof(e.target.files[0])}
          />
          <p className="text-sm text-gray-600 font-medium">
            {businessProof
              ? businessProof.name
              : "Upload Business Registration Proof"}
          </p>
        </label>

        {/* Owner ID Upload */}
        <label className={`${uploadBoxStyle} mt-4 block`}>
          <input
            type="file"
            className="hidden"
            onChange={(e) => setOwnerId(e.target.files[0])}
          />
          <p className="text-sm text-gray-600 font-medium">
            {ownerId
              ? ownerId.name
              : "Upload Owner Government ID"}
          </p>
        </label>

        {/* Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-black transition"
          >
            Back
          </button>

          <button
            onClick={handleSubmit}
            disabled={!businessProof || !ownerId}
            className={`px-6 py-2 rounded-lg text-white transition
              ${
                businessProof && ownerId
                  ? "bg-black hover:bg-gray-800"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
          >
            Submit
          </button>
        </div>

      </div>
    </div>
  );
}