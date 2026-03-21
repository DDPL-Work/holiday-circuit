import {
  FileText,
  Upload,
  Plus,
  Calendar,
  CheckCircle,
  AlertCircle,
  Phone,
  Building2,
  Trash2
} from "lucide-react";
import { useState } from "react";
import InternalInvoice from "./InternalInvoice";
import { RotatingLines } from "react-loader-spinner";
export default function FulfillmentConfirmation() {
   const [activeTab, setActiveTab] = useState("confirmation");
    const [files, setFiles] = useState({
    supplier: null,
    voucher: null,
    terms: null
  });

  const [loading, setLoading] = useState({
    supplier: false,
    voucher: false,
    terms: false
  });

    const [services, setServices] = useState([
     {
       type: "Hotel",
       serviceName: "",
       date: "",
       status: "Confirmed",
       confirmationNumber: "",
       voucher: "",
       emergency: ""
     }
   ]);
   
   const addService = () => {
     setServices([
       ...services,
       {
         type: "Hotel",
         serviceName: "",
         date: "",
         status: "Confirmed",
         confirmationNumber: "",
         voucher: "",
         emergency: ""
       }
     ]);
   };

   const removeService = (index) => {
  const updated = services.filter((_, i) => i !== index);
  setServices(updated);
};



  const handleFile = (type, file) => {

    setLoading(prev => ({ ...prev, [type]: true }));

    setTimeout(() => {
      setFiles(prev => ({ ...prev, [type]: file.name }));
      setLoading(prev => ({ ...prev, [type]: false }));
    }, 1500);

  };
   
  return (
    <>
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Top Title */}
      <div className="mb-4">
        <h1 className="text-lg font-semibold">
          Fulfillment & Confirmation Entry
        </h1>
        <p className="text-sm text-gray-500">
          DMC Partner: Enter service confirmations and internal invoice details
        </p>
      </div>

    
      <div className="bg-sky-50 border border-gray-200 shadow rounded-lg p-4 flex justify-between items-center mb-4">
        <div>
          <p className="font-medium text-sm">QRY-2026-0234</p>
          <p className="text-xs text-gray-600">
            Travel World Pvt Ltd • Bali, Indonesia • 4 PAX • 7N/8D
          </p>
        </div>

        <button className="bg-blue-600 text-white text-xs px-3 py-1 rounded-xl">
          In Fulfillment
        </button>
      </div>

      {/* Step Tabs */}
      <div className="flex items-center p-3 bg-gray-200 rounded-full h-8 mb-6 overflow-hidden text-xs">

     <button
  onClick={() => setActiveTab("confirmation")}
  className={`flex-1 flex justify-center items-center gap-2 rounded-2xl py-1  cursor-pointer ${
    activeTab === "confirmation"
      ? "bg-white font-medium shadow-sm"
      : "text-gray-600"
  }`}
>Confirmation Entry</button>

        <button
  onClick={() => setActiveTab("invoice")}
  className={`flex-1 flex justify-center items-center rounded-2xl py-1 gap-2 cursor-pointer ${
    activeTab === "invoice"
      ? "bg-white font-medium shadow-sm"
      : "text-gray-600"
  }`}
> $ Internal Invoice</button>
</div>

{/*============================================== Active Tab ===================================================*/}

   {activeTab === "confirmation" && (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm  transition-all duration-300 ease-in-out animate-fade">

        {/* Header */}
        <div className="p-4  border-b border-gray-300 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={18} />
            Service Confirmation & Emergency Support Details
          </h2>

          <button onClick={addService} className="flex items-center gap-2 border border-gray-400 rounded-xl px-3 py-1 text-sm cursor-pointer">
            <Plus size={16} />
            Add Service
          </button>
        </div>

{/*============================================= Service Details ======================================= */}

<div className=" p-5 ">
<p className="text-sm text-gray-500 mb-3">Service Details</p>

 {services.map((service, index) => (

<div key={index} className="border border-gray-400 rounded-3xl p-5 flex flex-col mb-4 relative">
              
  {services.length > 1 && (
    <button
      onClick={() => removeService(index)}
      className="absolute top-4 right-4 text-red-500 hover:text-red-700 cursor-pointer"
    >
      <Trash2 size={16} />
    </button>
  )}
            <div className="flex items-center gap-2 mb-4 text-sm font-medium">
              <div className="bg-blue-100 p-2 rounded">
                <Building2 size={14} />
              </div>

              <span>Service 1</span>

              <span className="text-xs text-gray-500">HOTEL</span>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-4 gap-4 mb-4">

              <div>
                <label className="text-xs text-gray-500">Type *</label>
                <select className="w-full border border-gray-400  rounded-xl p-2 text-sm outline-none">
                  <option>Hotel</option>
                  <option>Flight</option>
                  <option>Transport</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500">Service Name *</label>
                <input
                  className="w-full border border-gray-400  rounded-xl p-2 text-sm outline-none"
                  placeholder="e.g. Grand Hyatt Bali"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Service Date *</label>

                <div className="flex items-center border border-gray-400  rounded-xl p-2">
                  <input
                    className="flex-1 outline-none text-sm"
                    placeholder="dd-mm-yyyy"
                  />
                  <Calendar size={16} className="text-gray-400" />
                </div>

              </div>

              <div>
                <label className="text-xs text-gray-500">Status *</label>
                <select className="w-full border border-gray-400  rounded-xl p-2 outline-none text-sm bg-green-100">
                  <option>Confirmed</option>
                </select>
              </div>

            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-4 mb-4">

              <div className="mt-0.5">
                <label className="text-xs flex items-center gap-1 text-gray-600">
                  <AlertCircle size={14} className="text-red-500" />
                  Confirmation Number <span className="text-red-500">*</span> 
                </label>

                <input
                  className="w-full border border-gray-300 rounded-xl p-2 text-xs mt-1 "
                  placeholder="e.g. HTL-ABC-12345"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">
                  Voucher Reference <span className="text-red-500">*</span>
                </label>

                <input
                  className="w-full border border-gray-300 rounded-xl p-2 text-xs"
                  placeholder="e.g. VCH-2026-0234"
                />
              </div>

            </div>

            {/* Emergency Contact */}
            <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4 flex gap-3">

              <Phone size={18} className="text-yellow-600 mt-1" />

              <div className="flex-1">

                <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                  Emergency Contact Details (24/7 Local Support) *
                </label>

                <textarea
                  rows="3"
                  className="w-full border border-gray-300 rounded-xl p-2 text-xs mt-2 outline-none "
                  placeholder="Enter contact name, phone number, and alternate contact Example: John Doe - +62-812-3456-7890 (Primary) | +62-812-3456-7890 (Backup)"
                />

              </div>

            </div>

          </div>
            ))}

{/*================================== Upload Vault ================================================*/}
  <div className="mt-6">
      <p className="text-sm text-gray-500 mb-3">
        Document Upload Vault
      </p>

      <div className="grid grid-cols-3 gap-4">

        {/* Supplier */}
        <div className="border-2 border-dashed flex flex-col items-center border-blue-300 rounded-lg p-6 text-center bg-blue-50">

          {loading.supplier ? (
            <RotatingLines
              width="30"
              strokeColor="#3b82f6"
              strokeWidth="4"
              animationDuration="0.75"
              className="text-center"
            />
          ) : (
            <Upload className="mx-auto mb-2 text-blue-500" />
          )}

          <p className="text-sm font-medium">
            Upload Supplier Confirmation
          </p>

          <p className="text-xs text-gray-400 mb-2">
            PDF, Word, Excel accepted
          </p>

          {files.supplier && (
            <p className="text-xs text-green-600 mb-2">
              {files.supplier}
            </p>
          )}

          <input
            type="file"
            className="hidden"
            id="supplierUpload"
            onChange={(e) => handleFile("supplier", e.target.files[0])}
          />

          <button
            onClick={() =>
              document.getElementById("supplierUpload").click()
            }
            className="mt-1 text-xs border border-gray-300 rounded-xl px-3 py-1 bg-white"
          >
            Choose File
          </button>
        </div>


        {/* Voucher */}
        <div className="border-2 border-dashed flex flex-col items-center border-green-300 rounded-lg p-6 text-center bg-green-50">

          {loading.voucher ? (
            <RotatingLines
              width="30"
              strokeColor="#22c55e"
              strokeWidth="4"
              animationDuration="0.75"
            />
          ) : (
            <Upload className="mx-auto mb-2 text-green-500" />
          )}

          <p className="text-sm font-medium">
            Upload Voucher Reference
          </p>

          <p className="text-xs text-gray-400 mb-2">
            PDF, Word, Excel accepted
          </p>

          {files.voucher && (
            <p className="text-xs text-green-600 mb-2">
              {files.voucher}
            </p>
          )}

          <input
            type="file"
            className="hidden"
            id="voucherUpload"
            onChange={(e) => handleFile("voucher", e.target.files[0])}
          />

          <button
            onClick={() =>
              document.getElementById("voucherUpload").click()
            }
            className="mt-1 text-xs border border-gray-300 rounded-xl px-3 py-1 bg-white"
          >
            Choose File
          </button>
        </div>


        {/* Terms */}
        <div className="border-2 border-dashed flex flex-col items-center border-purple-300 rounded-lg p-6 text-center bg-purple-50">

          {loading.terms ? (
            <RotatingLines
              width="30"
              strokeColor="#a855f7"
              strokeWidth="4"
              animationDuration="0.75"
            />
          ) : (
            <Upload className="mx-auto mb-2 text-purple-500" />
          )}

          <p className="text-sm font-medium">
            Upload Terms & Conditions
          </p>

          <p className="text-xs text-gray-400 mb-2">
            PDF, Word, Excel accepted
          </p>

          {files.terms && (
            <p className="text-xs text-green-600 mb-2">
              {files.terms}
            </p>
          )}

          <input
            type="file"
            className="hidden"
            id="termsUpload"
            onChange={(e) => handleFile("terms", e.target.files[0])}
          />

          <button
            onClick={() =>
              document.getElementById("termsUpload").click()
            }
            className="mt-1 text-xs border border-gray-300 rounded-xl px-3 py-1 bg-white"
          >
            Choose File
          </button>
        </div>

      </div>
    </div>


 </div>

      {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t">
        
     {/* Bottom Note */}
        <p className="text-xs text-red-500 px-5 pb-3  mt-3"> 
          * All mandatory fields (*) must be completed before submission
        </p>

        <div className="flex gap-4">
          <button className="border border-gray-300 px-4 py-2 rounded-xl text-sm bg-white cursor-pointer">
            Save as Draft
          </button>

          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm cursor-pointer">
            <CheckCircle size={16} />
            Submit Confirmation
          </button>

           </div>

        </div>
   
      </div>
   )}

{activeTab === "invoice" && (
  <div className="transition-all duration-300 ease-in-out animate-fade">
    <InternalInvoice />
  </div>
)}

    </div>
</>
  );
}