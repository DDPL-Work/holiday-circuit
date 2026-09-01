import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import API from '../../../utils/Api';
import toast from 'react-hot-toast';

const IncExcCreate = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  
  const [inclusions, setInclusions] = useState([
    { category: '', description: '' }
  ]);
  const [exclusions, setExclusions] = useState([
    { category: '', description: '' }
  ]);
  
  const [loading, setLoading] = useState(false);

  const handleAddInclusion = () => {
    setInclusions([...inclusions, { category: '', description: '' }]);
  };

  const handleRemoveInclusion = (index) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  const handleInclusionChange = (index, field, value) => {
    const newInclusions = [...inclusions];
    newInclusions[index][field] = value;
    setInclusions(newInclusions);
  };

  const handleAddExclusion = () => {
    setExclusions([...exclusions, { category: '', description: '' }]);
  };

  const handleRemoveExclusion = (index) => {
    setExclusions(exclusions.filter((_, i) => i !== index));
  };

  const handleExclusionChange = (index, field, value) => {
    const newExclusions = [...exclusions];
    newExclusions[index][field] = value;
    setExclusions(newExclusions);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Preset Name is required');
      return;
    }

    // Filter out completely empty items
    const validInclusions = inclusions.filter(inc => inc.description.trim() !== '');
    const validExclusions = exclusions.filter(exc => exc.description.trim() !== '');

    setLoading(true);
    try {
      await API.post('/admin/inc-exc-presets', {
        name,
        inclusions: validInclusions,
        exclusions: validExclusions
      });
      toast.success('Preset created successfully');
      navigate('/ops/inc-exc');
    } catch (error) {
      console.error('Failed to create preset:', error);
      toast.error(error.response?.data?.message || 'Failed to create preset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="font-sans min-h-screen bg-slate-50 pb-12">
      {/* Top Navigation Bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
        <button 
          onClick={() => navigate('/ops/inc-exc')}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> New Inclusion/Exclusion Group
        </button>
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-500">
          Inc/Exclusions &gt; New
        </span>
      </div>

      <div className="mx-auto mt-6 w-full px-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          
          <div className="mb-8">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Preset Name</label>
            <input
              type="text"
              placeholder="e.g. Hotels Only, Package Type etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            
            {/* Inclusions Section */}
            <div>
              <h2 className="text-base font-bold text-[#2e7d32] mb-1">Inclusions</h2>
              <p className="text-xs text-gray-500 mb-4">List of inclusions in this preset</p>
              
              <div className="space-y-4">
                {inclusions.map((inc, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="Select or create category (Optional)"
                        value={inc.category}
                        onChange={(e) => handleInclusionChange(index, 'category', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={inc.description}
                        onChange={(e) => handleInclusionChange(index, 'description', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    {inclusions.length > 1 && (
                      <button 
                        onClick={() => handleRemoveInclusion(index)}
                        className="mt-2 text-gray-400 hover:text-red-500 h-fit"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleAddInclusion}
                className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-[#3f67d4] hover:bg-blue-100 cursor-pointer transition-colors"
              >
                Add More
              </button>
            </div>

            {/* Exclusions Section */}
            <div>
              <h2 className="text-base font-bold text-[#c62828] mb-1">Exclusions</h2>
              <p className="text-xs text-gray-500 mb-4">List of exclusions in this preset</p>
              
              <div className="space-y-4">
                {exclusions.map((exc, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="Select or create category (Optional)"
                        value={exc.category}
                        onChange={(e) => handleExclusionChange(index, 'category', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={exc.description}
                        onChange={(e) => handleExclusionChange(index, 'description', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    {exclusions.length > 1 && (
                      <button 
                        onClick={() => handleRemoveExclusion(index)}
                        className="mt-2 text-gray-400 hover:text-red-500 h-fit"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddExclusion}
                className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-[#3f67d4] hover:bg-blue-100 cursor-pointer transition-colors"
              >
                Add More
              </button>

              <p className="mt-8 text-xs text-red-500">Anything not mentioned in the inclusions is excluded.</p>
            </div>
          </div>
          
          <div className="mt-12 border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400 mb-4">Note: Drag and drop items in the list to change their order. (Coming soon)</p>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="rounded-lg bg-[#3f67d4] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#3252a8] disabled:opacity-50 cursor-pointer transition-colors shadow-sm"
              >
                {loading ? 'Saving...' : 'Save Details'}
              </button>
              <button
                onClick={() => navigate('/ops/inc-exc')}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default IncExcCreate;
