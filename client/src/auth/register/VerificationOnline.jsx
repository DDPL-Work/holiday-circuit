import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function VerificationInProgress() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center border border-gray-200">
        <div className="mb-6 flex justify-start">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="flex justify-center mb-6">
          <div className="h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-yellow-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Verification in Progress
        </h2>
        <p className="mb-2">
          Our team is currently reviewing your documents. This usually takes
          24-48 hours.
        </p>

        <p className="text-gray-500 text-sm mb-6">
          Current Status: <span className="font-medium">Under Review</span>
        </p>

        <div className="w-full bg-sky-50 text-black py-2 rounded-lg flex flex-col gap-3 shadow-sm mb-4">
          <p className="text-sm text-gray-500">Demo Mode Control:</p>
          <p className="font-semibold">Simulate Admin Approval</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You will be able to log in only after your account is approved by
          admin.
        </div>
      </div>
    </div>
  );
}
