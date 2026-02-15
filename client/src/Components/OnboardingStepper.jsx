export default function OnboardingStepper({ step }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-center gap-4">

        {/* Step 1 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold 
            ${step >= 1 ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}>
            1
          </div>
        </div>

        <div className={`h-1 w-20 ${step >= 2 ? "bg-black" : "bg-gray-200"}`} />

        {/* Step 2 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold 
            ${step >= 2 ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}>
            2
          </div>
        </div>

      </div>
    </div>
  );
}
