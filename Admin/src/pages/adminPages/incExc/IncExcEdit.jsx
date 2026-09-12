import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X, MapPin, ChevronDown } from 'lucide-react';
import API from '../../../utils/Api';
import toast from 'react-hot-toast';

const PREDEFINED_DESTINATIONS = {
  Domestic: [
    "Hotels Only",
    "Jammu & Kashmir",
    "North East",
    "Goa",
    "Andamans",
    "Kerala",
  ],
  International: [
    "Thailand",
    "UAE",
    "Indonesia",
    "Sri Lanka",
    "Nepal",
    "Singapore",
    "Malaysia",
    "Vietnam",
    "Europe",
  ],
};

const IncExcEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [destinationCategory, setDestinationCategory] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [destinationSearch, setDestinationSearch] = useState('');
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState(false);
  const destDropdownRef = useRef(null);

  const [inclusions, setInclusions] = useState([
    { category: '', description: '' }
  ]);
  const [exclusions, setExclusions] = useState([
    { category: '', description: '' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchPreset = async () => {
      try {
        const response = await API.get(`/admin/inc-exc-presets/${id}`);
        const preset = response.data;
        setName(preset.name || '');
        setDestinationCategory(preset.destinationCategory || '');
        if (Array.isArray(preset.destinations) && preset.destinations.length > 0) {
          setSelectedDestinations(preset.destinations);
        } else if (preset.destination && typeof preset.destination === 'string') {
          const splitDests = preset.destination.split(',').map(s => s.trim()).filter(Boolean);
          setSelectedDestinations(splitDests);
        } else {
          setSelectedDestinations([]);
        }

        if (preset.inclusions && preset.inclusions.length > 0) {
          setInclusions(preset.inclusions);
        }
        if (preset.exclusions && preset.exclusions.length > 0) {
          setExclusions(preset.exclusions);
        }
      } catch (error) {
        console.error('Failed to fetch preset details:', error);
        toast.error('Failed to load preset');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchPreset();
  }, [id]);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await API.get('/agent/hotel-rate-destinations');
        const list = Array.isArray(response?.data?.destinations) ? response.data.destinations : [];
        setDestinationOptions(list);
      } catch (err) {
        console.error('Failed to load destinations:', err);
      }
    };
    fetchDestinations();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (destDropdownRef.current && !destDropdownRef.current.contains(event.target)) {
        setIsDestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Compile available destination options based on selected category (Only city names, no countries)
  const availableDestinations = useMemo(() => {
    if (destinationCategory === 'Domestic') {
      return PREDEFINED_DESTINATIONS.Domestic;
    } else if (destinationCategory === 'International') {
      return PREDEFINED_DESTINATIONS.International;
    } else {
      // Other or custom
      const uniqueNames = new Set();
      destinationOptions.forEach(opt => {
        const cityName = opt?.city || opt?.label;
        if (cityName && typeof cityName === 'string' && cityName.trim()) {
          uniqueNames.add(cityName.trim());
        }
      });
      return Array.from(uniqueNames);
    }
  }, [destinationCategory, destinationOptions]);

  const filteredDestinations = useMemo(() => {
    if (!destinationSearch.trim()) return availableDestinations;
    const q = destinationSearch.toLowerCase().trim();
    return availableDestinations.filter((name) =>
      name.toLowerCase().includes(q)
    );
  }, [availableDestinations, destinationSearch]);

  const toggleDestination = (destName) => {
    const trimmed = destName.trim();
    if (!trimmed) return;
    if (selectedDestinations.includes(trimmed)) {
      setSelectedDestinations(selectedDestinations.filter(d => d !== trimmed));
    } else {
      setSelectedDestinations([...selectedDestinations, trimmed]);
    }
  };

  const handleSelectAll = () => {
    const newSet = new Set([...selectedDestinations, ...filteredDestinations]);
    setSelectedDestinations(Array.from(newSet));
  };

  const handleDeselectAll = () => {
    const removeSet = new Set(filteredDestinations.map(d => d.toLowerCase()));
    setSelectedDestinations(selectedDestinations.filter(d => !removeSet.has(d.toLowerCase())));
  };

  const handleAddCustomDestination = () => {
    if (!destinationSearch.trim()) return;
    const custom = destinationSearch.trim();
    if (!selectedDestinations.includes(custom)) {
      setSelectedDestinations([...selectedDestinations, custom]);
    }
    setDestinationSearch('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Preset Name is required');
      return;
    }

    const validInclusions = inclusions.filter(inc => inc.description.trim() !== '');
    const validExclusions = exclusions.filter(exc => exc.description.trim() !== '');

    setLoading(true);
    try {
      await API.put(`/admin/inc-exc-presets/${id}`, {
        name: name.trim(),
        destinationCategory: destinationCategory || '',
        destinations: selectedDestinations,
        destination: selectedDestinations.join(', '),
        inclusions: validInclusions,
        exclusions: validExclusions
      });
      toast.success('Preset updated successfully');
      navigate(`/admin/inc-exc-presets/${id}`);
    } catch (error) {
      console.error('Failed to update preset:', error);
      toast.error(error.response?.data?.message || 'Failed to update preset');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading editor...</div>;
  }

  return (
    <section className="font-sans min-h-screen bg-slate-50 pb-12">
      {/* Top Navigation Bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
        <button 
          onClick={() => navigate(`/admin/inc-exc-presets/${id}`)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Edit Inclusion/Exclusion Group
        </button>
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-500">
          Inc/Exclusions &gt; Edit
        </span>
      </div>

      <div className="mx-auto mt-6 w-full px-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Preset Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. Goa Standard Package, Dubai 5N6D"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Destination Category Dropdown */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Destination Category</label>
              <div className="relative">
                <select
                  value={destinationCategory}
                  onChange={(e) => {
                    const category = e.target.value;
                    setDestinationCategory(category);
                    setSelectedDestinations([]);
                    setDestinationSearch('');
                  }}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select category</option>
                  <option value="Domestic">Domestic</option>
                  <option value="International">International</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Destination Multi-Select Dropdown with matching UI */}
            <div className="relative" ref={destDropdownRef}>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 flex items-center justify-between">
                <span>Destination</span>
                {selectedDestinations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDestinations([])}
                    className="text-xs text-blue-600 hover:underline font-normal cursor-pointer"
                  >
                    Clear ({selectedDestinations.length})
                  </button>
                )}
              </label>

              {/* Trigger Input matching Category dropdown */}
              <div className="relative">
                <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                
                <div
                  onClick={() => setIsDestDropdownOpen(!isDestDropdownOpen)}
                  className="w-full h-[38px] rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm cursor-pointer flex items-center overflow-hidden hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                >
                  {selectedDestinations.length === 0 ? (
                    <span className="text-gray-500 truncate">Select destination</span>
                  ) : (
                    <span className="text-gray-900 font-medium truncate">
                      {selectedDestinations.join(', ')}
                    </span>
                  )}
                </div>

                <ChevronDown 
                  size={16} 
                  className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${
                    isDestDropdownOpen ? "rotate-180" : ""
                  }`} 
                />
              </div>

              {/* Dropdown Options matching screenshot UI */}
              {isDestDropdownOpen && (
                <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  {/* Search for Other or when list is long */}
                  {destinationCategory === 'Other' && (
                    <div className="p-2 border-b border-gray-100">
                      <input
                        type="text"
                        placeholder="Search or add custom city..."
                        value={destinationSearch}
                        onChange={(e) => setDestinationSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                        autoFocus
                      />
                    </div>
                  )}

                  {/* Select All / Deselect All header */}
                  {availableDestinations.length > 1 && (
                    <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-50 border-b border-gray-100 text-xs">
                      <span className="text-[11px] text-gray-500">
                        {selectedDestinations.length} selected
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAll();
                          }}
                          className="text-[11px] font-medium text-blue-600 hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeselectAll();
                          }}
                          className="text-[11px] font-medium text-gray-500 hover:underline cursor-pointer"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of cities with checkboxes */}
                  <div 
                    className="max-h-56 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
                  >
                    {destinationSearch.trim() &&
                      !availableDestinations.some(
                        (d) => d.toLowerCase() === destinationSearch.trim().toLowerCase()
                      ) && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddCustomDestination();
                          }}
                          className="flex items-center justify-between px-3.5 py-2 hover:bg-blue-50 text-blue-600 text-sm cursor-pointer font-medium border-b border-gray-100"
                        >
                          <span>+ Add "{destinationSearch.trim()}"</span>
                        </div>
                      )}

                    {filteredDestinations.map((destName, idx) => {
                      const isChecked = selectedDestinations.includes(destName);

                      return (
                        <div
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDestination(destName);
                          }}
                          className={`flex items-center gap-2.5 px-3.5 py-2 text-sm cursor-pointer transition-colors select-none ${
                            isChecked
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "hover:bg-slate-50 text-gray-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                          />
                          <span>{destName}</span>
                        </div>
                      );
                    })}

                    {filteredDestinations.length === 0 && !destinationSearch.trim() && (
                      <div className="px-3.5 py-3 text-center text-gray-400 text-xs">
                        No destinations available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
                onClick={() => navigate(`/admin/inc-exc-presets/${id}`)}
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

export default IncExcEdit;
