// import { Search, Filter } from "lucide-react";
// import { useState } from "react";
// import ActiveBookingDetails from './ActiveBookingDetails.jsx'



// const ActiveBookings = () => {
//   const [openActiveBookingDetails, setActiveBookingDetails] = useState(false);
//   const [selectedActiveBooking, setselectedActiveBooking] = useState(null);

//  if (openActiveBookingDetails) {
//     return <ActiveBookingDetails onClose={() =>setActiveBookingDetails(false)} query={selectedActiveBooking}/>;
//   }


//   return (
//     <section className="space-y-5">
//       {/* Header */}
//       <header className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold">Active Bookings</h1>
//           <p className="text-sm text-gray-500">
//             Manage your confirmed trips, payments, and traveler documents.
//           </p>
//         </div>

//         <div className="flex items-center gap-3">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search bookings..."
//               className="pl-9 pr-4 py-2 border rounded-xl text-xs border-gray-300  focus:outline-none"
//             />
//           </div>

//           <button className="border rounded-xl p-2 border-gray-300 hover:bg-gray-100 ">
//             <Filter size={16} />
//           </button>
//         </div>
//       </header>

//       {/* Table */}
//       <div className="bg-white shadow-sm rounded-xl overflow-hidden">
//         <table className="w-full text-xs">
//           <thead className="bg-gray-50 text-gray-500 border-b-gray-200 border-b">
//             <tr>
//               <th className="text-left px-6 py-3">Booking ID</th>
//               <th className="text-left px-6 py-3">Destination</th>
//               <th className="text-left px-6 py-3">Travel Dates</th>
//               <th className="text-left px-6 py-3">Pax</th>
//               <th className="text-left px-6 py-3">Status</th>
//               <th className="text-right px-6 py-3">Action</th>
//             </tr>
//           </thead>

//           <tbody className="divide-y divide-gray-200">
//             {/* Row 1 */}
//             <tr>
//               <td className="px-6 py-4 font-medium">BK-2026-001</td>
//               <td className="px-6 py-4">Maldives Luxury Escape</td>
//               <td className="px-6 py-4">12 Dec - 18 Dec 2026</td>
//               <td className="px-6 py-4">2</td>
//               <td className="px-6 py-4">
//                 <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
//                   Awaiting Documents
//                 </span>
//               </td>
//               <td className="px-6 py-4 text-right">
//                 <button className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs">
//                   Manage
//                 </button>
//               </td>
//             </tr>

//             {/* Row 2 */}
//             <tr>
//               <td className="px-6 py-4 font-medium">BK-2026-002</td>
//               <td className="px-6 py-4">Dubai Family Fun</td>
//               <td className="px-6 py-4">24 Jan - 29 Jan 2027</td>
//               <td className="px-6 py-4">4</td>
//               <td className="px-6 py-4">
//                 <span className="bg-red-400 text-white px-3 py-1 rounded-full text-xs font-medium">
//                   Payment Pending
//                 </span>
//               </td>
//               <td className="px-6 py-4 text-right">
//                 <button className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs">
//                   Manage
//                 </button>
//               </td>
//             </tr>

//             {/* Row 3 */}
//             <tr>
//               <td className="px-6 py-4 font-medium">BK-2026-003</td>
//               <td className="px-6 py-4">Swiss Alps Tour</td>
//               <td className="px-6 py-4">10 Feb - 18 Feb 2027</td>
//               <td className="px-6 py-4">2</td>
//               <td className="px-6 py-4">
//                 <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium">
//                   Confirmed
//                 </span>
//               </td>
//               <td className="px-6 py-4 text-right">
//                 <button className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs">
//                   Manage
//                 </button>
//               </td>
//             </tr>
//           </tbody>
//         </table>
//       </div>
//     </section>
//   );
// };

// export default ActiveBookings;


import { Search, Filter } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import ActiveBookingDetails from "./ActiveBookingDetails.jsx";
import { activeBookingsData } from "../../data/activeBookingsDummyData.js";

/* ================= Animations ================= */
const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};
/* ============================================== */

const ActiveBookings = () => {
  const [openActiveBookingDetails, setOpenActiveBookingDetails] =
    useState(false);
  const [selectedActiveBooking, setSelectedActiveBooking] = useState(null);

  // Details view
  if (openActiveBookingDetails) {
    return (
      <ActiveBookingDetails
        onClose={() => setOpenActiveBookingDetails(false)}
        booking={selectedActiveBooking}
      />
    );
  }

  return (
    <motion.section
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-5 p-3"
    >
      {/* Header */}
      <motion.header
        variants={itemVariant}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Active Bookings</h1>
          <p className="text-sm text-gray-500">
            Manage your confirmed trips, payments, and traveler documents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.div variants={itemVariant} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              className="pl-9 pr-4 py-2 border rounded-xl text-xs border-gray-300 focus:outline-none"
            />
          </motion.div>

          <motion.button
            variants={itemVariant}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="border rounded-xl p-2 border-gray-300 hover:bg-gray-100"
          >
            <Filter size={16} />
          </motion.button>
        </div>
      </motion.header>

      {/* Table */}
      <motion.div
        variants={itemVariant}
        className="bg-white shadow-sm rounded-xl overflow-hidden"
      >
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 border-b border-b-gray-300">
            <tr>
              <th className="text-left px-6 py-3">Booking ID</th>
              <th className="text-left px-6 py-3">Destination</th>
              <th className="text-left px-6 py-3">Travel Dates</th>
              <th className="text-left px-6 py-3">Pax</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-right px-6 py-3">Action</th>
            </tr>
          </thead>

          <motion.tbody
            variants={containerVariant}
            initial="hidden"
            animate="visible"
            className="divide-y divide-gray-200"
          >
            {activeBookingsData.map((booking) => (
              <motion.tr
                key={booking.id}
                variants={itemVariant}
                whileHover={{ backgroundColor: "#F9FAFB" }}
              >
                <td className="px-6 py-4 font-medium">{booking.id}</td>
                <td className="px-6 py-4">{booking.destination}</td>
                <td className="px-6 py-4">{booking.dates}</td>
                <td className="px-6 py-4">{booking.travelers}</td>

                <td className="px-6 py-4">
                  {booking.status === "Awaiting Documents" && (
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                      Awaiting Documents
                    </span>
                  )}

                  {booking.status === "Payment Pending" && (
                    <span className="bg-red-400 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Payment Pending
                    </span>
                  )}

                  {booking.status === "Confirmed" && (
                    <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium">
                      Confirmed
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedActiveBooking(booking);
                      setOpenActiveBookingDetails(true);
                    }}
                    className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs"
                  >
                    Manage
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </motion.div>
    </motion.section>
  );
};

export default ActiveBookings;