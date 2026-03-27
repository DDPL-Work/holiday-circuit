import {FileText, Upload,Plus,Calendar,CheckCircle,AlertCircle,Phone,Building2,Trash2} from "lucide-react";
import { useState } from "react";
import InternalInvoice from "./InternalInvoice";
import { RotatingLines } from "react-loader-spinner";
import API from "../../utils/Api.js"
export default function FulfillmentConfirmation () {

   const [services, setServices] = useState([
     {
       type: "Hotel",
       serviceName: "",
       serviceDate: "", 
       status: "Confirmed",
       confirmationNumber: "",
       voucherNumber: "",
       emergency: ""
     }
   ]);

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

   const addService = () => {
     setServices([
       ...services,
       {
         type: "Hotel",
         serviceName: "",
         serviceDate: "",
         status: "Confirmed",
         confirmationNumber: "",
         voucherNumber: "",
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
    setFiles(prev => ({ ...prev, [type]: file }));
    setLoading(prev => ({ ...prev, [type]: false }));
    }, 1500);
  };


  const handleChange = (index, field, value) => {
  const updated = [...services];
  updated[index][field] = value;
  setServices(updated);
};

const handleSubmit = async (finalStatus) => {
  try {
    // ✅ 1. Basic Validation
    if (!files.supplier) {
      return alert("Supplier Confirmation PDF is mandatory ❌");
    }

    for (let i = 0; i < services.length; i++) {
      const s = services[i];

      if (
        !s.type ||
        !s.serviceName ||
        !s.serviceDate ||
        !s.status ||
        !s.confirmationNumber ||
        !s.voucherNumber ||
        !s.emergency
      ) {
        return alert(`Please fill all fields in Service ${i + 1} ❌`);
      }
    }

    // ✅ 2. FormData
    const formData = new FormData();
    formData.append("queryId", "QRY-1020");
    formData.append("services", JSON.stringify(services));
    formData.append(
      "emergencyContact",
      JSON.stringify(services.map((s) => s.emergency))
    );
    formData.append("status", finalStatus);
    // ✅ IMPORTANT: send actual FILE (not name)
    formData.append("supplierConfirmation", files.supplier);
    if (files.voucher)
      formData.append("voucherReference", files.voucher);
    if (files.terms)
      formData.append("termsConditions", files.terms);
    // ✅ 3. API call
    const res = await API.post("/dmc/confirmation", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Confirmation:", res.data);
    alert("Saved Successfully ✅");

  } catch (err) {
    console.error(err);
    alert("Error ❌");
  }
};

  const getStatusColor = (status) => {
  switch (status) {
    case "Confirmed":
      return "bg-green-100 text-green-700 border-green-400";
    case "Pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-400";
    case "Waitlisted":
      return "bg-red-100 text-red-700 border-red-400";
    default:
      return "bg-gray-100";
  }
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

{/*============================================== Active Tab ===========================================*/}

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

<div key={index} className="border border-gray-300 rounded-3xl p-5 flex flex-col mb-4 relative">
              
  {services.length > 1 && (
    <button
      onClick={() => removeService(index)}
      className="absolute top-4 right-4 text-red-500 hover:text-red-700 cursor-pointer"
    >
      <Trash2 size={16} />
    </button>
  )}
            <div className="flex items-center gap-2 mb-4 text-sm font-medium">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Building2 size={14} />
              </div>

              <span>Service {index + 1}</span>

              <span className="text-[10px] text-green-600 bg-[#DBFCE7] border border-green-400 px-4 rounded-2xl">{service.type.toUpperCase()}</span>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-4 items-center gap-4 mb-4">

              <div>
                <label className="text-xs text-gray-500">Type *</label>
                <select  value={service.type} onChange={(e) => handleChange(index, "type", e.target.value)} className="w-full border border-gray-300  rounded-2xl p-1.5 text-xs outline-none">
                  <option>Hotel</option>
                  <option>Flight</option>
                  <option>Transport</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500">Service Name *</label>
                <input
                 value={service.serviceName} onChange={(e) => handleChange(index, "serviceName", e.target.value)}
                  className="w-full border border-gray-300  rounded-2xl p-1.5 text-xs outline-none"
                  placeholder="e.g. Grand Hyatt Bali"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Service Date *</label>

                <div className="flex items-center border border-gray-300  rounded-2xl p-1.5">
                  <input
                   type="date"value={service.serviceDate} onChange={(e) => handleChange(index, "serviceDate", e.target.value)}
                    className="flex-1 outline-none text-xs"
                    placeholder="dd-mm-yyyy"
                  />
                  
                </div>

              </div>

              <div>
  <label className="text-xs text-gray-500">Status *</label>

  <select
   value={service.status} onChange={(e) => handleChange(index, "status", e.target.value)}
   className={`w-full border border-gray-300 rounded-2xl p-1.5 outline-none text-xs transition-all duration-200 ${getStatusColor(service.status)}`}
    >
    <option>Confirmed</option>
    <option>Pending</option>
    <option>Waitlisted</option>
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

                <input value={service.confirmationNumber} onChange={(e) => handleChange(index, "confirmationNumber", e.target.value)}
                  className="w-full border border-gray-300 rounded-2xl p-2 pl-3 text-xs mt-1 outline-none"
                  placeholder="e.g. HTL-ABC-12345"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">
                  Voucher Reference <span className="text-red-500">*</span>
                </label>

                <input
                 value={service.voucher} onChange={(e) => handleChange(index, "voucherNumber", e.target.value)}
                  className="w-full border border-gray-300 rounded-2xl p-2 pl-3 text-xs outline-none"
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
                  value={service.emergency} onChange={(e) => handleChange(index, "emergency", e.target.value)}
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
              {files.supplier.name}
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
              {files.voucher.name}
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
             {files.terms.name}
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
        <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-300">
        
     {/* Bottom Note */}
        <p className="text-xs text-red-500 px-5 pb-3  mt-3"> 
          * All mandatory fields (*) must be completed before submission
        </p>

        <div className="flex gap-4">
          <button onClick={() => handleSubmit("draft")} className="border border-gray-300 px-4 py-2 rounded-xl text-sm bg-white cursor-pointer">
            Save as Draft
          </button>

          <button onClick={() => handleSubmit("submitted")} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm cursor-pointer">
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