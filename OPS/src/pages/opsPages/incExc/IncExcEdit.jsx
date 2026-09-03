import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X, MapPin, ChevronDown, Check } from 'lucide-react';
import API from '../../../utils/Api';
import toast from 'react-hot-toast';

const PREDEFINED_DESTINATIONS = {
  Domestic: [
    { label: "Hotels Only", city: "Hotels Only", country: "India" },
    { label: "Jammu & Kashmir", city: "Jammu & Kashmir", country: "India" },
    { label: "North East", city: "North East", country: "India" },
    { label: "Goa", city: "Goa", country: "India" },
    { label: "Andamans", city: "Andamans", country: "India" },
    { label: "Kerala", city: "Kerala", country: "India" },
  ],
  International: [
    { label: "Thailand", city: "Thailand", country: "Thailand" },
    { label: "UAE", city: "UAE", country: "United Arab Emirates" },
    { label: "Indonesia", city: "Indonesia", country: "Indonesia" },
    { label: "Sri Lanka", city: "Sri Lanka", country: "Sri Lanka" },
    { label: "Nepal", city: "Nepal", country: "Nepal" },
    { label: "Singapore", city: "Singapore", country: "Singapore" },
    { label: "Malaysia", city: "Malaysia", country: "Malaysia" },
    { label: "Vietnam", city: "Vietnam", country: "Vietnam" },
    { label: "Europe", city: "Europe", country: "Europe" },
  ],
};

const normalizeCountryName = (value = "") =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const countryAliasCodes = {
  america: "US", britain: "GB", england: "GB", holland: "NL",
  korea: "KR", laos: "LA", maldives: "MV", russia: "RU",
  scotland: "GB", taiwan: "TW", tanzania: "TZ", uae: "AE",
  "u a e": "AE", uk: "GB", "u k": "GB", "united kingdom": "GB",
  "united states": "US", usa: "US", "u s a": "US", vietnam: "VN",
  india: "IN", thailand: "TH", indonesia: "ID", "sri lanka": "LK",
  nepal: "NP", singapore: "SG", malaysia: "MY", "united arab emirates": "AE",
  france: "FR", italy: "IT", switzerland: "CH", spain: "ES", germany: "DE",
  turkey: "TR", egypt: "EG", japan: "JP", australia: "AU",
};

const getCountryFlagUrl = (country = "") => {
  const norm = normalizeCountryName(country);
  const code = countryAliasCodes[norm] || "";
  if (code) return `https://animated-country-flags.malith.dev/webp/${code.toUpperCase()}.webp`;
  return "";
};

const IncExcEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [destinationCategory, setDestinationCategory] = useState('');
  const [destination, setDestination] = useState('');
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
        setDestination(preset.destination || '');
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

  const filteredDestinations = destinationOptions.filter((opt) => {
    const label = opt?.label || `${opt?.city || ''}, ${opt?.country || ''}`;
    return label.toLowerCase().includes(destinationSearch.toLowerCase());
  });

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
        name,
        destinationCategory: destinationCategory || '',
        destination: destination.trim(),
        inclusions: validInclusions,
        exclusions: validExclusions
      });
      toast.success('Preset updated successfully');
      navigate(`/ops/inc-exc/${id}`);
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
          onClick={() => navigate(`/ops/inc-exc/${id}`)}
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
                    setDestination('');
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

            {/* Destination Dropdown based on Category */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 flex items-center justify-between">
                <span>Destination</span>
                {destination && (
                  <button
                    type="button"
                    onClick={() => { setDestination(''); setDestinationSearch(''); }}
                    className="text-xs text-blue-600 hover:underline font-normal"
                  >
                    Clear
                  </button>
                )}
              </label>

              {destinationCategory === "Domestic" || destinationCategory === "International" ? (
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" />
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">Select destination</option>
                    {(PREDEFINED_DESTINATIONS[destinationCategory] || []).map((dest) => (
                      <option key={dest.label} value={dest.label}>{dest.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              ) : (
                <div className="relative" ref={destDropdownRef}>
                  <div 
                    onClick={() => setIsDestDropdownOpen(!isDestDropdownOpen)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm cursor-pointer hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {destination && getCountryFlagUrl(destination) ? (
                        <img src={getCountryFlagUrl(destination)} alt="" className="h-[13px] w-[20px] object-contain shrink-0" />
                      ) : (
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <span className={destination ? "text-slate-900 font-medium truncate" : "text-gray-400 truncate"}>
                        {destination || "Select or search destination..."}
                      </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDestDropdownOpen ? "rotate-180" : ""}`} />
                  </div>

                  {isDestDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                      <input
                        type="text"
                        placeholder="Search or enter custom destination..."
                        value={destinationSearch}
                        onChange={(e) => setDestinationSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                        autoFocus
                      />
                      
                      <div className="mt-2 max-h-48 overflow-y-auto space-y-0.5 text-xs">
                        {destinationSearch.trim() && !filteredDestinations.some(d => (d.label || d.city || '').toLowerCase() === destinationSearch.trim().toLowerCase()) && (
                          <div
                            onClick={() => {
                              setDestination(destinationSearch.trim());
                              setIsDestDropdownOpen(false);
                            }}
                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-600 cursor-pointer font-medium"
                          >
                            <span>Use "{destinationSearch.trim()}"</span>
                            <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded text-blue-700">Custom</span>
                          </div>
                        )}
                        
                        {filteredDestinations.map((opt, idx) => {
                          const label = opt?.label || `${opt?.city || ''}, ${opt?.country || ''}`;
                          const country = opt?.country || '';
                          const flag = getCountryFlagUrl(country);
                          const isSelected = destination.toLowerCase() === label.toLowerCase() || destination.toLowerCase() === (opt.city || '').toLowerCase();
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                setDestination(opt.city || opt.label || label);
                                setDestinationSearch('');
                                setIsDestDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {flag ? (
                                  <img src={flag} alt="" className="h-[13px] w-[20px] object-contain shrink-0" />
                                ) : (
                                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                )}
                                <span>{label}</span>
                              </div>
                              {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                            </div>
                          );
                        })}

                        {filteredDestinations.length === 0 && !destinationSearch.trim() && (
                          <div className="px-3 py-3 text-center text-gray-400 text-xs">
                            No destinations available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                onClick={() => navigate(`/ops/inc-exc/${id}`)}
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
