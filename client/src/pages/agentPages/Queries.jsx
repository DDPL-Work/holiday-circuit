import { Search, Plus } from "lucide-react";
import { useState } from "react";
import CreateNewQueries from "../../modal/CreateNewQueries.Modal";
import { queriesData } from "../../data/queriesDummyData.js";
import QueryDetails from "./QueryDetails.jsx";

const Queries = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openQueryDetails, setOpenQueryDetails] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);

  // Query Details view
  if (openQueryDetails) {
    return <QueryDetails onClose={() => setOpenQueryDetails(false)} query={selectedQuery}/>;
  }


  return (
    <section className="space-y-6">
      {!openModal && (
        <>
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Queries</h1>
              <p className="text-sm text-gray-500">
                Manage your travel requirements and quotes.
              </p>
            </div>

            <button
              onClick={() => setOpenModal(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
            >
              <Plus size={16} />
              Create Query
            </button>
          </header>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search queries..."
              className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm border-gray-300 focus:outline-none"
            />
          </div>

          {/* Table */}
          <div className="bg-white shadow-sm rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b-gray-200 border-b">
                <tr>
                  <th className="text-left px-6 py-3">Query ID</th>
                  <th className="text-left px-6 py-3">Destination</th>
                  <th className="text-left px-6 py-3">Dates</th>
                  <th className="text-left px-6 py-3">Pax</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3">Quote Price</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {/* Row 1 */}
                {queriesData.map((query) => (
                  <tr
                    key={query.id}
                    onClick={() => {
                      setSelectedQuery(query);
                    }}
                  >
                    <td className="px-6 py-4 font-medium">{query.id}</td>
                    <td className="px-6 py-4">{query.destination}</td>
                    <td className="px-6 py-4">{query.dates}</td>
                    <td className="px-6 py-4">{query.travelers}</td>

                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {query.price ? query.price : "-"}
                    </td>
                    <td
                      className=""
                      onClick={() => setOpenQueryDetails(true)}
                    >
                      <span className="text-sm text-blue-600 rounded-lg px-2 py-2  border-gray-300 hover:bg-gray-100 cursor-pointer">View</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL */}
      {openModal && <CreateNewQueries onClose={() => setOpenModal(false)} />}
    </section>
  );
};

export default Queries;
