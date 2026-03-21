import {
  Shield,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function DMCDashboard() {
  return (
    <div className="p-1.5 bg-gray-50 min-h-screen">
      {/* Header */}

      <div className="mb-5">
        <h1 className="text-xl font-semibold">Dmc Dashboard</h1>
        <p className="text-sm text-gray-500">Monday, March 9, 2026</p>
      </div>

      {/*=================== Access Level Card ========================================== */}

      <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-100 rounded-xl">
            <Shield size={20} />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">Your Access Level</h2>

              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-xl border">
                DMC Partner
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              External partner with restricted access
            </p>

            <div className="mt-4">
              <p className="text-xs text-gray-600 mb-2">PERMISSIONS</p>
 
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Upload contracted rates (bulk upload)
                </li>

                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Enter confirmation numbers
                </li>

                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  Update fulfillment status
                </li>

                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  View assigned bookings only
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/*=================================== Stats Cards ============================================== */}

      <div className="grid grid-cols-4 gap-2 mb-6">

        {/* Card 1 */}
        <div className="bg-white border border-gray-300 shadow-sm rounded-xl p-3 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Pending Queries</p>
            <h3 className="text-xl font-semibold">24</h3>
            <p className="text-xs text-green-600">+12% from last week</p>
          </div>

          <div className="bg-purple-100 p-2 rounded-lg">
            <Clock className="text-purple-600" />
          </div>
        </div>

        {/* Card 2 */}

        <div className="bg-white border border-gray-300 shadow-sm rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Active Bookings</p>
            <h3 className="text-xl font-semibold">156</h3>
            <p className="text-xs text-green-600">+8% from last week</p>
          </div>

          <div className="bg-blue-100 p-2 rounded-lg">
            <CheckCircle className="text-blue-600" />
          </div>
        </div>

        {/* Card 3 */}

        <div className="bg-white border border-gray-300 shadow-sm rounded-xl p-3 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Vouchers Generated</p>
            <h3 className="text-xl font-semibold">89</h3>
            <p className="text-xs text-green-600">+15% from last week</p>
          </div>

          <div className="bg-green-100 p-2 rounded-lg">
            <FileText className="text-green-600" />
          </div>
        </div>

        {/* Card 4 */}

        <div className="bg-white border border-gray-300 shadow-sm rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Pending Actions</p>
            <h3 className="text-xl font-semibold">12</h3>
            <p className="text-xs text-red-500">-5% from last week</p>
          </div>

          <div className="bg-orange-100 p-2 rounded-lg">
            <AlertCircle className="text-orange-600" />
          </div>
        </div>
      </div>


      {/*================================ Bottom Section =========================== */}

      <div className="grid grid-cols-3 gap-6">

        {/*----------------- Recent Activity------------------ */}

        <div className="col-span-2 bg-white border border-gray-300 shadow-sm rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

          <Activity
            title="New Query"
            badge="New"
            color="bg-purple-100 text-purple-600"
            company="Travel World Pvt Ltd → Bali"
            time="5 min ago"
          />

          <Activity
            title="Booking Accepted"
            badge="Accepted"
            color="bg-blue-100 text-blue-600"
            company="Globe Tours → Dubai"
            time="15 min ago"
          />

          <Activity
            title="Voucher Generated"
            badge="Vouchered"
            color="bg-green-100 text-green-600"
            company="Sky Travels → Maldives"
            time="32 min ago"
          />

          <Activity
            title="Confirmation Entered"
            badge="Confirmed"
            color="bg-cyan-100 text-cyan-600"
            company="Wanderlust Holidays → Paris"
            time="1 hr ago"
          />

          <Activity
            title="New Query"
            badge="New"
            color="bg-purple-100 text-purple-600"
            company="Dream Vacations → Switzerland"
            time="2 hrs ago"
          />
        </div>


        {/*=================================== Team Performance ================================== */}

        <div className="bg-white border border-gray-300 shadow-sm rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">Team Performance</h2>

          <Progress
            title="Queries Handled"
            value="89%"
            width="89%"
            color="bg-blue-600"
          />

          <Progress
            title="Avg. Response Time"
            value="2.4h"
            width="70%"
            color="bg-green-600"
          />

          <Progress
            title="Vouchers/Day"
            value="18"
            width="65%"
            color="bg-purple-600"
          />
        </div>
      </div>
    </div>
  );
}

function Activity({ title, badge, color, company, time }) {

  return (
    <div className="flex justify-between items-center border border-gray-300 shadow-sm rounded-xl p-4 mb-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium">{title}</p>
          <span className={`text-xs px-2 py-1 rounded-full ${color}`}>
            {badge}
          </span>
        </div>
        <p className="text-sm text-gray-500">{company}</p>
      </div>
      <p className="text-xs text-gray-400">{time}</p>
    </div>
  );
}

function Progress({ title, value, width, color }) {

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm mb-1">
        <span>{title}</span>
        <span className="text-gray-500">{value}</span>
      </div>

      <div className="w-full bg-gray-200 h-2 rounded-full">
        <div
          className={`${color} h-2 rounded-full`}
          style={{ width: width }}
        ></div>
      </div>
    </div>
  );
}


