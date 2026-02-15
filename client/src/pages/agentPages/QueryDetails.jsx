// import { useNavigate } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';


const QueryDetails = ({ query , onClose }) => {
// const navigate = useNavigate();



 const handleSubmit = () => {
    //  API call
  
    onClose();
  };



  return (
    <div className="">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <button  onClick={handleSubmit}
            className="text-lg rounded-xl px-4 py-1 border-gray-300 hover:bg-gray-100 cursor-pointer">
            <ArrowLeft className="w-5 h-5 stroke-[1.8] text-black" />
          </button>
          <div>
            <h2 className="text-xl font-semibold">{query.destination}</h2>
            <p className="text-sm text-gray-500">
              ID: {query.id} • Created on {query.createdAt}
            </p>
          </div>
        </div>

        {/* Status */}
         {query.status === "Quote Sent" && (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
            Quote Sent
          </span>
        )}
        {query.status === "Pending" && (
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">
            Pending
          </span>
        )}
        {query.status === "Revision Requested" && (
          <span className="bg-red-400 text-white px-3 py-1 rounded-full text-xs">
            Revision Requested
          </span>
        )} 
      </div>

      <div className="grid grid-cols-3 gap-5 ">
        {/* LEFT MAIN SECTION */}
        <div className="col-span-2 space-y-5 ">
          {/* Quotation Card */}
          <div className="rounded-2xl p-6 bg-[#F6F9FD] shadow-sm border border-[#BEDBFF]">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold text-lg">Quotation Received</h3>
              <span className="text-blue-600 font-bold text-xl">
                {query.price}
              </span>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Valid until {}
            </p>

            <div className="border border-[#BEDBFF] rounded-xl p-4 bg-white mb-4">
              <h4 className="font-medium mb-2">Inclusions</h4>
              <ul className="list-disc ml-5 text-xs text-gray-700 space-y-1">
                {query.inclusions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="flex gap-6">
              <button className="bg-green-600 text-sm hover:bg-green-700 text-white px-24 py-1.5 rounded-full cursor-pointer">
                Accept Quote
              </button>
              <button className="border text-sm border-[#BEDBFF] px-24 py-1.5 rounded-full cursor-pointer">
                Request Revision
              </button>
            </div>
          </div>

          {/* Requirements */}
          <div className="border border-gray-200 shadow-sm rounded-2xl p-6">
            <h3 className="font-semibold text-lg mb-4">Requirements</h3>

            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <p className="text-gray-500">Dates</p>
                <p className="font-medium ">{query.dates}</p>
              </div>

              <div>
                <p className="text-gray-500">Travelers</p>
                <p className="font-medium">{query.travelers}</p>
              </div>
            </div>

            <div className="mt-2 text-xs">
              <p className="text-gray-500">Preferences</p>
              <p className="font-medium text-xs">{query.preferences}</p>
            </div>
          </div>
        </div>

        {/* RIGHT ACTIVITY LOG */}
        <div className="border border-gray-200 shadow-sm rounded-2xl p-6 h-fit">
          <h3 className="font-semibold mb-4">Activity Log</h3>

          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
              <div>
                <p className="text-sm font-medium">Quote Sent</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-2 h-2 bg-gray-300 rounded-full mt-2"></span>
              <div>
                <p className="text-sm font-medium">Query Created</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryDetails;




// import {  useNavigate } from "react-router-dom";
// // import { queriesData } from "../../data/queriesDummyData";

// const QueryDetails = ({query}) => {
//   // const {  } = useParams();
//   const navigate = useNavigate();

//   // const query = queriesData.find((item) => item.id === id);

//   if (!query) {
//     return <p className="p-6">Query not found</p>;
//   }

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-start mb-6">
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => navigate("/agent/queries")}
//             className="text-xl"
//           >
//             ←
//           </button>
//           <div>
//             <h2 className="text-xl font-semibold">
//               {query.destination} Trip
//             </h2>
//             <p className="text-sm text-gray-500">
//               ID: {query.id} • Created on {query.createdAt}
//             </p>
//           </div>
//         </div>

//         {/* Status */}
//         <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm">
//           {query.status}
//         </span>
//       </div>

//       <div className="grid grid-cols-3 gap-6">
//         {/* LEFT MAIN SECTION */}
//         <div className="col-span-2 space-y-6">
//           {/* Quotation Card */}
//           <div className="border rounded-2xl p-6 bg-gray-50">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="font-semibold text-lg">
//                 Quotation Received
//               </h3>
//               <span className="text-blue-600 font-bold text-xl">
//                 ₹ {query.price}
//               </span>
//             </div>

//             <p className="text-sm text-gray-500 mb-4">
//               Valid until {query.validTill}
//             </p>

//             <div className="border rounded-xl p-4 bg-white mb-4">
//               <h4 className="font-medium mb-2">Inclusions</h4>
//               <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
//                 {query.inclusions.map((item, index) => (
//                   <li key={index}>{item}</li>
//                 ))}
//               </ul>
//             </div>

//             <div className="flex gap-4">
//               <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full">
//                 Accept Quote
//               </button>
//               <button className="border px-6 py-2 rounded-full">
//                 Request Revision
//               </button>
//             </div>
//           </div>

//           {/* Requirements */}
//           <div className="border rounded-2xl p-6">
//             <h3 className="font-semibold text-lg mb-4">
//               Requirements
//             </h3>

//             <div className="grid grid-cols-2 gap-6 text-sm">
//               <div>
//                 <p className="text-gray-500">Dates</p>
//                 <p className="font-medium">{query.dates}</p>
//               </div>

//               <div>
//                 <p className="text-gray-500">Travelers</p>
//                 <p className="font-medium">{query.travelers}</p>
//               </div>
//             </div>

//             <div className="mt-4 text-sm">
//               <p className="text-gray-500">Preferences</p>
//               <p className="font-medium">
//                 {query.preferences}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* RIGHT ACTIVITY LOG */}
//         <div className="border rounded-2xl p-6 h-fit">
//           <h3 className="font-semibold mb-4">Activity Log</h3>

//           <div className="space-y-4">
//             <div className="flex gap-3">
//               <span className="w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
//               <div>
//                 <p className="text-sm font-medium">Quote Sent</p>
//                 <p className="text-xs text-gray-500">
//                   2 hours ago
//                 </p>
//               </div>
//             </div>

//             <div className="flex gap-3">
//               <span className="w-2 h-2 bg-gray-300 rounded-full mt-2"></span>
//               <div>
//                 <p className="text-sm font-medium">Query Created</p>
//                 <p className="text-xs text-gray-500">
//                   5 hours ago
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default QueryDetails;
