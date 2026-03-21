import { ShieldCheck } from "lucide-react";

export default function VerificationInProgress() {


  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center border border-gray-200">
         {/* ICON */}
        <div className="flex justify-center mb-6">
          <div className="h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-yellow-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Verification in Progress
        </h2>
        <p className="mb-2">Our team is currently reviewing your documents. This usually takes 24-48 hours.</p>

        <p className="text-gray-500 text-sm mb-6">
          Current Status:{" "}
          <span className="font-medium"></span>
        </p>

        {/* Demo Approve Button */}
        <div
          className="w-full bg-sky-50 text-black py-2 rounded-lg flex flex-col gap-3 shadow-sm"
        >
          <p className="text-sm text-gray-500">Demo Mode Control:</p>
          <p className=" font-semibold">Simulate Admin Approval</p>
        </div>
      </div>
    </div>
  );
}
