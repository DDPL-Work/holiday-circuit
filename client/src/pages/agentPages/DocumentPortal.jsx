import { Eye, Upload, ShieldCheck,  ShieldAlert, Clock } from "lucide-react";

const DocumentPortal = () => {
  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Portal</h1>
          <p className="text-sm text-gray-500">
            Securely upload and manage traveler documents.
          </p>
        </div>

        <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2">
          <Upload size={16} />
          Bulk Upload
        </button>
      </header>

      {/* Table Card */}
      <div className="bg-white shadow-sm rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">Traveler Documents</h2>
          <p className="text-sm text-gray-500">
            Passports and Visas for upcoming trips.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500 border-b-gray-200 border-b">
              <tr>
                <th className="text-left py-3">Traveler Name</th>
                <th className="text-left py-3">Booking Ref</th>
                <th className="text-left py-3">Passport Status</th>
                <th className="text-left py-3">Visa Status</th>
                <th className="text-right py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {/* Row 1 */}
              <tr>
                <td className="py-4 font-medium">Rahul Sharma</td>
                <td className="py-4">
                  <span className="border border-gray-300 px-2 py-1 rounded-xl text-xs">
                    Q-1001
                  </span>
                </td>
                <td className="py-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs flex w-fit items-center gap-1">
                    <ShieldCheck size={12} />
                    Verified
                  </span>
                </td>
                <td className="py-4 text-gray-500">Pending</td>
                <td className="py-4 text-right flex items-end justify-end">
                  <button className="flex items-center gap-1 text-slate-800 text-sm">
                    <Eye size={16} /> View
                  </button>
                </td>
              </tr>

              {/* Row 2 */}
              <tr>
                <td className="py-4 font-medium">Anjali Sharma</td>
                <td className="py-4">
                  <span className="border border-gray-300 px-2 py-1 rounded-xl text-xs">
                    Q-1001
                  </span>
                </td>
                <td className="py-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs flex w-fit items-center gap-1">
                    <ShieldCheck size={12} />
                    Verified
                  </span>
                </td>
                <td className="py-4 text-gray-500">Pending</td>
                <td className="py-4 text-right flex items-end justify-end">
                  <button className="flex items-center gap-1 text-slate-800 text-sm">
                    <Eye size={16} /> View
                  </button>
                </td>
              </tr>

              {/* Row 3 */}
              <tr>
                <td className="py-4 font-medium">John Doe</td>
                <td className="py-4">
                  <span className="border border-gray-300 px-2 py-1 rounded-xl text-xs">
                    Q-1002
                  </span>
                </td>
                <td className="py-4">
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs flex w-fit items-center gap-1">
                     <ShieldAlert size={12} />
                    Missing
                  </span>
                </td>
                <td className="py-4 text-gray-500">Not Started</td>
                <td className="py-4 text-right flex items-end justify-end">
                  <button className="border border-gray-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer hover:bg-gray-100 ">
                    <Upload size={14} />
                    Upload
                  </button>
                </td>
              </tr>

              {/* Row 4 */}
              <tr>
                <td className="py-4 font-medium">Jane Doe</td>
                <td className="py-4">
                  <span className="border border-gray-300 px-2 py-1 rounded-xl text-xs">
                    Q-1002
                  </span>
                </td>
                <td className="py-4">
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs flex w-fit items-center gap-1">
                       <Clock size={12} />
                    Reviewing
                  </span>
                </td>
                <td className="py-4 text-gray-500">Not Started</td>
                <td className="py-4 flex items-end justify-end text-right">
                  <button className="flex items-center gap-1 text-slate-800 text-sm">
                    <Eye size={16} /> View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
        <ShieldCheck size={18} />
        <p>
          <strong>Security Note:</strong> All documents are encrypted at rest.
          Please ensure passports are scanned clearly in color (JPG/PDF format).
        </p>
      </div>
    </section>
  );
};

export default DocumentPortal;
