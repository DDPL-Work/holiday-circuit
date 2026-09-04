import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, RefreshCcw, FileText } from 'lucide-react';
import API from '../../utils/Api';

const Terms = () => {
  const navigate = useNavigate();
  const [terms, setTerms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await API.get('/agent/terms');
        setTerms(response.data);
      } catch (error) {
        console.error('Failed to fetch terms:', error);
      }
    };
    fetchTerms();
  }, []);

  
  const filteredTerms = terms.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));


  return (
    <section className="space-y-5 p-6 font-sans">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terms and Conditions</h1>
          <p className="text-sm text-gray-500">
            Manage your terms, conditions, and policies.
          </p>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search TnC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-4 text-xs focus:outline-none sm:min-w-[240px]"
            />
          </div>
          
          <button 
            onClick={() => navigate('/agent/terms/create')}
            className="rounded-xl border border-transparent px-4 py-2 text-xs font-medium bg-[#3f67d4] hover:bg-[#3252a8] text-white cursor-pointer shadow-sm transition-colors"
          >
            Add TnC
          </button>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-b-gray-300 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Name</th>
                <th className="px-4 py-2.5 text-left font-medium">Created By</th>
                <th className="px-4 py-2.5 text-left font-medium">Creation Date</th>
                <th className="px-4 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTerms.length > 0 ? (
                filteredTerms.map((term) => (
                  <tr 
                    key={term.id} 
                    className="transition-colors hover:bg-[#F9FAFB]"
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 whitespace-nowrap">{term.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{term.by}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {term.on.startsWith('on ') ? term.on : `on ${term.on}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/agent/terms/${term.id}`)}
                        className="rounded-lg bg-[#3f67d4] hover:bg-[#3252a8] px-4 py-1.5 text-xs font-medium text-white cursor-pointer shadow-sm transition-all duration-200"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-400">
                    No terms and conditions found.
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

export default Terms;