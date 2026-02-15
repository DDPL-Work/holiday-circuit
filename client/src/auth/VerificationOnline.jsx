import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setVerificationStatus } from "../Redux/Slice/authSlice";

export default function VerificationInProgress() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { verificationStatus } = useSelector((state) => state.auth);

  // 🔁 Auto redirect if approved
  if (verificationStatus === "approved") {
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Verification in Progress
        </h2>

        <p className="text-gray-500 text-sm mb-6">
          Current Status:{" "}
          <span className="font-medium">{verificationStatus}</span>
        </p>

        {/* Demo Approve Button */}
        <button
          onClick={() => dispatch(setVerificationStatus("approved"))}
          className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
        >
          Simulate Admin Approval
        </button>
      </div>
    </div>
  );
}
