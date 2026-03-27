import { Wallet, Clock, TrendingUp, Download } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
};

const Finance = () => {
  const transactions = [
    {
      id: "TXN-8842",
      date: "12 Feb 2026",
      description: "Booking Commission (Q-1001)",
      amount: "+ ₹ 12,400",
      amountColor: "text-green-600",
      status: "Pending",
      statusColor: "bg-yellow-100 text-yellow-700"
    },
    {
      id: "TXN-8839",
      date: "10 Feb 2026",
      description: "Wallet Top-up (UTR: 998877)",
      amount: "+ ₹ 50,000",
      amountColor: "text-green-600",
      status: "Success",
      statusColor: "bg-green-100 text-green-700"
    },
    {
      id: "TXN-8812",
      date: "05 Feb 2026",
      description: "Booking Payment (Q-0992)",
      amount: "- ₹ 1,20,000",
      amountColor: "text-red-600",
      status: "Success",
      statusColor: "bg-green-100 text-green-700"
    }
  ];

  return (
    <motion.section className="space-y-3 p-3" variants={container} initial="hidden" animate="visible">
      {/* Header */}
      <motion.header variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finance</h1>
          <p className="text-sm text-gray-500">
            Manage your wallet, payments, and commissions.
          </p>
        </div>

        <div className="flex gap-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="border px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <Download size={16} />
            Statement
          </motion.button>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs">
            + Add Funds
          </motion.button>
        </div>
      </motion.header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.article variants={item} whileHover={{ y: -4 }} className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-300">Current Balance</p>
            <Wallet size={20} />
          </div>
          <h2 className="text-2xl font-semibold mt-3">₹ 48,200</h2>
        </motion.article>

        <motion.article variants={item} whileHover={{ y: -4 }} className="bg-white shadow-sm p-6 rounded-xl">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Pending Commissions</p>
            <Clock className="text-orange-500" size={20} />
          </div>
          <h2 className="text-2xl font-semibold text-orange-600 mt-3">₹ 12,400</h2>
        </motion.article>

        <motion.article variants={item} whileHover={{ y: -4 }} className="bg-white shadow-sm p-6 rounded-xl">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Total Earnings</p>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <h2 className="text-2xl font-semibold text-green-600 mt-3">₹ 8,45,000</h2>
        </motion.article>
      </div>

      {/* Transaction History */}
      <motion.div variants={item} className="bg-white shadow-sm rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-gray-500 border-b border-b-gray-200">
              <tr>
                <th className="text-left py-3">Transaction ID</th>
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Description</th>
                <th className="text-right py-3">Amount</th>
                <th className="text-right py-3">Status</th>
              </tr>
            </thead>

            <motion.tbody variants={container} initial="hidden" animate="visible" className="divide-y divide-gray-200">
              {transactions.map((txn, idx) => (
                <motion.tr key={idx} variants={item} whileHover={{ scale: 1.0001 }}>
                  <td className="py-4 text-blue-600">{txn.id}</td>
                  <td className="py-4">{txn.date}</td>
                  <td className="py-4">{txn.description}</td>
                  <td className={`py-4 text-right ${txn.amountColor}`}>{txn.amount}</td>
                  <td className="py-4 text-right">
                    <span className={`px-3 py-1 rounded-full text-xs ${txn.statusColor}`}>
                      {txn.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default Finance;