import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import API from '../../../utils/Api';

const IncExcList = () => {
  const navigate = useNavigate();
  const [presets, setPresets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const response = await API.get('/admin/inc-exc-presets');
        setPresets(response.data || []);
      } catch (error) {
        console.error('Failed to fetch presets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPresets();
  }, []);

  const uniqueDestinations = useMemo(() => {
    const destSet = new Set();
    presets.forEach(p => {
      if (p.destination && p.destination.trim()) {
        destSet.add(p.destination.trim());
      }
    });
    return Array.from(destSet).sort();
  }, [presets]);

  const filteredPresets = presets.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.destination && p.destination.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDest = selectedDestination === 'ALL' || 
      (p.destination && p.destination.toLowerCase() === selectedDestination.toLowerCase());
    return matchesSearch && matchesDest;
  });

  return (
    <section className="space-y-5 p-6 font-sans">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inc/Exclusion Presets</h1>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Destination Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-3 pr-8 text-xs text-slate-700 focus:outline-none sm:min-w-[160px] cursor-pointer"
            >
              <option value="ALL">All Destinations</option>
              {uniqueDestinations.map(dest => (
                <option key={dest} value={dest}>{dest}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-4 text-xs focus:outline-none sm:min-w-[240px]"
            />
          </div>
          
          <button 
            onClick={() => navigate('/admin/inc-exc-presets/create')}
            className="rounded-xl border border-blue-200 px-4 py-2 text-xs font-medium text-blue-600 bg-white hover:bg-blue-50 cursor-pointer shadow-sm transition-colors"
          >
            Add New
          </button>
        </div>
      </header>

      <div className="text-xs text-gray-500 flex items-center justify-between">
        <span>Showing 1 - {filteredPresets.length} of {filteredPresets.length} Items</span>
        {selectedDestination !== 'ALL' && (
          <button
            onClick={() => setSelectedDestination('ALL')}
            className="text-xs text-blue-600 hover:underline cursor-pointer"
          >
            Reset Filter ({selectedDestination})
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-b-gray-200 bg-white text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Preset Name</th>
                <th className="px-4 py-3 text-left font-semibold">Destination</th>
                <th className="px-4 py-3 text-left font-semibold">Items</th>
                <th className="px-4 py-3 text-left font-semibold">Created By</th>
                <th className="px-4 py-3 text-left font-semibold">Created On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr>
                 <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-400">
                   Loading...
                 </td>
               </tr>
              ) : filteredPresets.length > 0 ? (
                filteredPresets.map((preset) => (
                  <tr 
                    key={preset._id} 
                    className="transition-colors hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/admin/inc-exc-presets/${preset._id}`)}
                  >
                    <td className="px-4 py-4 font-medium text-[#007b9a]">
                      {preset.name}
                    </td>
                    <td className="px-4 py-4">
                      {preset.destination ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {preset.destinationCategory && (
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {preset.destinationCategory}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
                            {preset.destination}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">General / All</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-600 font-medium">
                      <span className="text-emerald-700 font-semibold">{preset.inclusions?.length || 0} Inc</span>
                      {' • '}
                      <span className="text-rose-700 font-semibold">{preset.exclusions?.length || 0} Exc</span>
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
                  <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-400">
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
