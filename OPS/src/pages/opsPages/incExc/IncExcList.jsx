import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import API from '../../../utils/Api';


const IncExcList = () => {
  const navigate = useNavigate();
  const [presets, setPresets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const response = await API.get('/admin/inc-exc-presets');
        setPresets(response.data);
      } catch (error) {
        console.error('Failed to fetch presets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPresets();
  }, []);

  const filteredPresets = presets.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="space-y-5 p-6 font-sans">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inc/Exclusion Presets</h1>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-4 text-xs focus:outline-none sm:min-w-[240px]"
            />
          </div>
          
          <button 
            onClick={() => navigate('/ops/inc-exc/create')}
            className="rounded-xl border border-blue-200 px-4 py-2 text-xs font-medium text-blue-600 bg-white hover:bg-blue-50 cursor-pointer shadow-sm transition-colors"
          >
            Add New
          </button>
        </div>
      </header>

      <div className="text-xs text-gray-500 flex items-center gap-2">
        Showing 1 - {filteredPresets.length} of {filteredPresets.length} Items 
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-b-gray-200 bg-white text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Created By</th>
                <th className="px-4 py-3 text-left font-semibold">Created On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr>
                 <td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-400">
                   Loading...
                 </td>
               </tr>
              ) : filteredPresets.length > 0 ? (
                filteredPresets.map((preset) => (
                  <tr 
                    key={preset._id} 
                    className="transition-colors hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/ops/inc-exc/${preset._id}`)}
                  >
                    <td className="px-4 py-4 font-medium text-[#007b9a]">
                      {preset.name}
                    </td>
                    <td className="px-4 py-4 text-gray-600 font-medium">
                      {preset.createdBy?.name || "Admin"}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      on {new Date(preset.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-sm text-gray-400">
                    No presets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default IncExcList;
