//  import { FileQuestionMark,  CircleCheckBig , Wallet, ArrowUpRight} from "lucide-react";

// const AgentDashboard = () => {

//   return (
//     <section className="space-y-3 ">
//       {/* PAGE TITLE */}
//       <header>
//         <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
//         <p className="text-xs text-gray-500">
//           Overview of your travel agency performance.
//         </p>
//       </header>

//       {/* STATS CARDS */}
//       <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {/* Total Queries */}
//         <article className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
//           <div>
//             <p className="text-sm text-gray-500">Total Queries</p>
//             <h2 className="text-xl font-semibold">1,284</h2>
//             <p className="text-xs text-green-600 mt-1">+12% from last month</p>
//           </div>
//           <div className="p-2 rounded-full bg-blue-100">
//             <FileQuestionMark className="text-blue-600 w-4 h-4" />
//           </div>
//         </article>

//         {/* Active Bookings */}
//         <article className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
//           <div>
//             <p className="text-sm text-gray-500">Active Bookings</p>
//             <h2 className="text-xl font-semibold">42</h2>
//             <p className="text-xs text-green-600 mt-1">+4 new today</p>
//           </div>
//           <div className="p-2 rounded-full bg-green-100">
//             < CircleCheckBig className="text-green-600 w-4 h-4" />
//           </div>
//         </article>

//         {/* Wallet Balance */}
//       <article className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
//           <div>
//             <p className="text-sm text-gray-500">Wallet Balance</p>
//             <h2 className="text-xl font-semibold">₹ 48,200</h2>
//             <p className="text-xs text-gray-500 mt-1">
//               Commission pending: ₹12k
//             </p>
//           </div>
//           <div className="p-2 rounded-full bg-yellow-100">
//             <Wallet className="text-yellow-600 w-4 h-4" />
//           </div>
//         </article>
//       </section>

//       {/* LOWER SECTION */}
//       <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//         {/* Recent Activity */}
//         <article className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
//           <h3 className="font-medium text-xl mb-4">Recent Activity</h3>

//           <ul className="space-y-4 text-xs">
//             <li className="flex justify-between items-center">
//               <div>
//                 <p className="font-medium">Quote Sent for Bali Package</p>
//                 <p className="text-xs text-gray-500">
//                   Rahul Sharma · 2 hours ago
//                 </p>
//               </div>
//               <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
//                 Pending
//               </span>
//             </li>

//             <li className="flex justify-between items-center">
//               <div>
//                 <p className="font-medium">Booking Confirmed: Maldives</p>
//                 <p className="text-xs text-gray-500">
//                   Priya Singh · 5 hours ago
//                 </p>
//               </div>
//               <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
//                 Confirmed
//               </span>
//             </li>

//             <li className="flex justify-between items-center">
//               <div>
//                 <p className="font-medium">New Query: Europe Trip (12 Pax)</p>
//                 <p className="text-xs text-gray-500">
//                   Corporate Tech Ltd · 1 day ago
//                 </p>
//               </div>
//               <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
//                 New
//               </span>
//             </li>

//             <li className="flex justify-between items-center">
//               <div>
//                 <p className="font-medium">Commission Received</p>
//                 <p className="text-xs text-gray-500">System · 1 day ago</p>
//               </div>
//               <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
//                 Confirmed
//               </span>
//             </li>
//           </ul>
//         </article>

//         {/* Quick Actions */}
//         <article className="bg-white p-6 rounded-xl shadow-sm">
//           <h3 className="font-medium text-xl mb-4">Quick Actions</h3>

//           <div className="space-y-3">
//             <button className="w-full flex justify-between items-center px-4 py-2 border rounded-xl border-gray-300 text-xs hover:bg-gray-100">
//               Create New Query
//               <span><ArrowUpRight className="w-4 h-4 stroke-[1.8] text-gray-500"/></span>
//             </button>

//             <button className="w-full flex justify-between items-center px-4 py-2 border rounded-xl border-gray-300 text-xs hover:bg-gray-100">
//               Upload Passport
//               <span><ArrowUpRight className="w-4 h-4 stroke-[1.8] text-gray-500"/></span>
//             </button>

//             <button className="w-full flex justify-between items-center px-4 py-2 border rounded-xl border-gray-300 text-xs hover:bg-gray-100">
//               Check Wallet History
//               <span className=""><ArrowUpRight className="w-4 h-4 stroke-[1.8] text-gray-500"/></span>
//             </button>
//           </div>

//           <div className="mt-6 text-xs text-gray-500">
//             <p className="font-medium text-black mb-1">Pro Tip</p>
//             <p className="font-normal mb-3 text-[8px]">
//               Complete your KYC verification to unlock higher withdrawal limits
//               and premium support.
//             </p>
//           </div>
//         </article>
//       </section>
//     </section>
//   );
// };

// export default AgentDashboard;


import {
  FileQuestionMark,
  CircleCheckBig,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";

/* ===== Animations (sirf add kiya gaya hai) ===== */
const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};
/* ============================================= */

const AgentDashboard = () => {
  return (
    <motion.section
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {/* PAGE TITLE */}
      <motion.header variants={cardVariant}>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs text-gray-500">
          Overview of your travel agency performance.
        </p>
      </motion.header>

      {/* STATS CARDS */}
      <motion.section
        variants={containerVariant}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Total Queries */}
        <motion.article
          variants={cardVariant}
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center"
        >
          <div>
            <p className="text-sm text-gray-500">Total Queries</p>
            <h2 className="text-xl font-semibold">1,284</h2>
            <p className="text-xs text-green-600 mt-1">
              +12% from last month
            </p>
          </div>
          <div className="p-2 rounded-full bg-blue-100">
            <FileQuestionMark className="text-blue-600 w-4 h-4" />
          </div>
        </motion.article>

        {/* Active Bookings */}
        <motion.article
          variants={cardVariant}
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center"
        >
          <div>
            <p className="text-sm text-gray-500">Active Bookings</p>
            <h2 className="text-xl font-semibold">42</h2>
            <p className="text-xs text-green-600 mt-1">+4 new today</p>
          </div>
          <div className="p-2 rounded-full bg-green-100">
            <CircleCheckBig className="text-green-600 w-4 h-4" />
          </div>
        </motion.article>

        {/* Wallet Balance */}
        <motion.article
          variants={cardVariant}
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center"
        >
          <div>
            <p className="text-sm text-gray-500">Wallet Balance</p>
            <h2 className="text-xl font-semibold">₹ 48,200</h2>
            <p className="text-xs text-gray-500 mt-1">
              Commission pending: ₹12k
            </p>
          </div>
          <div className="p-2 rounded-full bg-yellow-100">
            <Wallet className="text-yellow-600 w-4 h-4" />
          </div>
        </motion.article>
      </motion.section>

      {/* LOWER SECTION */}
      <motion.section
        variants={containerVariant}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Recent Activity */}
        <motion.article
          variants={cardVariant}
          className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm"
        >
          <h3 className="font-medium text-xl mb-4">Recent Activity</h3>

          <ul className="space-y-4 text-xs">
            <li className="flex justify-between items-center">
              <div>
                <p className="font-medium">Quote Sent for Bali Package</p>
                <p className="text-xs text-gray-500">
                  Rahul Sharma · 2 hours ago
                </p>
              </div>
              <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                Pending
              </span>
            </li>

            <li className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  Booking Confirmed: Maldives
                </p>
                <p className="text-xs text-gray-500">
                  Priya Singh · 5 hours ago
                </p>
              </div>
              <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
                Confirmed
              </span>
            </li>

            <li className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  New Query: Europe Trip (12 Pax)
                </p>
                <p className="text-xs text-gray-500">
                  Corporate Tech Ltd · 1 day ago
                </p>
              </div>
              <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                New
              </span>
            </li>

            <li className="flex justify-between items-center">
              <div>
                <p className="font-medium">Commission Received</p>
                <p className="text-xs text-gray-500">
                  System · 1 day ago
                </p>
              </div>
              <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
                Confirmed
              </span>
            </li>
          </ul>
        </motion.article>

        {/* Quick Actions */}
        <motion.article
          variants={cardVariant}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <h3 className="font-medium text-xl mb-4">Quick Actions</h3>

          <div className="space-y-3">
            {[
              "Create New Query",
              "Upload Passport",
              "Check Wallet History",
            ].map((action, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full flex justify-between items-center px-4 py-2 border rounded-xl border-gray-300 text-xs hover:bg-gray-100"
              >
                {action}
                <ArrowUpRight className="w-4 h-4 stroke-[1.8] text-gray-500" />
              </motion.button>
            ))}
          </div>

          <div className="mt-6 text-xs text-gray-500">
            <p className="font-medium text-black mb-1">Pro Tip</p>
            <p className="font-normal mb-3 text-[8px]">
              Complete your KYC verification to unlock higher withdrawal
              limits and premium support.
            </p>
          </div>
        </motion.article>
      </motion.section>
    </motion.section>
  );
};

export default AgentDashboard;