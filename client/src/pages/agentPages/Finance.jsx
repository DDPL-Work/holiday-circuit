import { Wallet, Clock, TrendingUp,Download } from "lucide-react";

const Finance = () => {

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finance</h1>
          <p className="text-sm text-gray-500">
            Manage your wallet, payments, and commissions.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="border px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Download size={16} />
            Statement
          </button>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">
            + Add Funds
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Balance */}
        <article className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-300">Current Balance</p>
            <Wallet size={20} />
          </div>
          <h2 className="text-2xl font-semibold mt-3">₹ 48,200</h2>
        </article>

        {/* Pending Commissions */}
        <article className="bg-white shadow-md p-6 rounded-xl">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Pending Commissions</p>
            <Clock className="text-orange-500" size={20} />
          </div>
          <h2 className="text-2xl font-semibold text-orange-600 mt-3">
            ₹ 12,400
          </h2>
        </article>

        {/* Total Earnings */}
        <article className="bg-white shadow-md p-6 rounded-xl">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Total Earnings</p>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <h2 className="text-2xl font-semibold text-green-600 mt-3">
            ₹ 8,45,000
          </h2>
        </article>
      </div>

      {/* Transaction History */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Transaction History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500 border-b border-b-gray-200">
              <tr>
                <th className="text-left py-3">Transaction ID</th>
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Description</th>
                <th className="text-right py-3">Amount</th>
                <th className="text-right py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-4 text-blue-600">TXN-8842</td>
                <td className="py-4">12 Feb 2026</td>
                <td className="py-4">
                  Booking Commission (Q-1001)
                </td>
                <td className="py-4 text-right text-green-600">
                  + ₹ 12,400
                </td>
                <td className="py-4 text-right">
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">
                    Pending
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-4 text-blue-600">TXN-8839</td>
                <td className="py-4">10 Feb 2026</td>
                <td className="py-4">
                  Wallet Top-up (UTR: 998877)
                </td>
                <td className="py-4 text-right text-green-600">
                  + ₹ 50,000
                </td>
                <td className="py-4 text-right">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                    Success
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-4 text-blue-600">TXN-8812</td>
                <td className="py-4">05 Feb 2026</td>
                <td className="py-4">
                  Booking Payment (Q-0992)
                </td>
                <td className="py-4 text-right text-red-600">
                  - ₹ 1,20,000
                </td>
                <td className="py-4 text-right">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                    Success
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Finance;
