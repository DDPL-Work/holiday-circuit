import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2 } from 'lucide-react';
import API from '../../../utils/Api';

const IncExcDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [preset, setPreset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreset = async () => {
      try {
        const response = await API.get(`/admin/inc-exc-presets/${id}`);
        setPreset(response.data);
      } catch (error) {
        console.error('Failed to fetch preset details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPreset();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading details...</div>;
  }

  if (!preset) {
    return <div className="p-6 text-sm text-red-500">Preset not found.</div>;
  }

  return (
    <section className="font-sans min-h-screen bg-slate-50 pb-12">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/ops/inc-exc')}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Details
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500">
            Inc/Exclusions &gt; {preset.name}
          </span>
        </div>
        <button 
          onClick={() => navigate(`/ops/inc-exc/${preset._id}/edit`)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          <Edit2 className="h-4 w-4" /> Edit
        </button>
      </div>

      {/* Header Info */}
      <div className="border-b border-gray-200 bg-white px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Name</p>
            <h1 className="text-xl font-bold text-gray-900">{preset.name}</h1>
          </div>
          
          <div className="flex gap-8">
            <div>
              <p className="text-xs text-gray-500 mb-1">Created by</p>
              <p className="text-sm">
                <span className="font-bold text-gray-900">{preset.createdBy?.name || 'System'}</span>{' '}
                <span className="text-gray-600">on {new Date(preset.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Updated by</p>
              <p className="text-sm">
                <span className="font-bold text-gray-900">{preset.updatedBy?.name || 'System'}</span>{' '}
                <span className="text-gray-600">on {new Date(preset.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="mx-auto mt-6 grid w-full grid-cols-1 gap-8 px-6 lg:grid-cols-2">
        {/* Inclusions */}
        <div>
          <h2 className="text-base font-bold text-[#2e7d32] mb-1">Inclusions</h2>
          <p className="text-xs text-gray-500 mb-4">List of inclusions in this preset</p>
          
          <ul className="space-y-4">
            {preset.inclusions?.map((inc, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-800" />
                <div className="text-sm text-gray-800">
                  {inc.category && <span className="font-semibold block mb-0.5">{inc.category}</span>}
                  <p>{inc.description}</p>
                </div>
              </li>
            ))}
            {(!preset.inclusions || preset.inclusions.length === 0) && (
              <p className="text-sm text-gray-400 italic">No inclusions added.</p>
            )}
          </ul>
        </div>

        {/* Exclusions */}
        <div>
          <h2 className="text-base font-bold text-[#c62828] mb-1">Exclusions</h2>
          <p className="text-xs text-gray-500 mb-4">List of exclusions in this preset</p>

          <ul className="space-y-4">
            {preset.exclusions?.map((exc, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-800" />
                <div className="text-sm text-gray-800">
                  {exc.category && <span className="font-semibold block mb-0.5">{exc.category}</span>}
                  <p>{exc.description}</p>
                </div>
              </li>
            ))}
            {(!preset.exclusions || preset.exclusions.length === 0) && (
              <p className="text-sm text-gray-400 italic">No exclusions added.</p>
            )}
          </ul>
          
          <p className="mt-8 text-xs text-red-500">Anything not mentioned in the inclusions is excluded.</p>
        </div>
      </div>
    </section>
  );
};

export default IncExcDetails;
