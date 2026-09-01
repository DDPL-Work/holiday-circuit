import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor';
import API from '../../utils/Api';

const EditTerm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTerm = async () => {
      try {
        const response = await API.get(`/admin/terms/${id}`);
        setName(response.data.name || '');
        setContent(response.data.content || '');
      } catch (error) {
        console.error('Failed to load term for editing:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTerm();
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a name for the terms and conditions.');
      return;
    }

    setSaving(true);
    try {
      await API.put(`/admin/terms/${id}`, { name, content });
      navigate(`/admin/terms-conditions/${id}`);
    } catch (error) {
      console.error('Failed to update term:', error);
      alert('Failed to update terms and conditions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
    );
  }

  return (
    <section className="space-y-5 p-6 font-sans">
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-slate-200 rounded-full transition-colors mr-1 cursor-pointer flex items-center justify-center"
        >
          <ArrowLeft size={16} className="text-slate-700" />
        </button>
        <button onClick={() => navigate('/admin/terms-conditions')} className="hover:text-gray-900 transition-colors cursor-pointer">
          Terms and Conditions
        </button>
        <ChevronRight size={14} className="text-gray-400" />
        <button onClick={() => navigate(`/admin/terms-conditions/${id}`)} className="hover:text-gray-900 transition-colors cursor-pointer truncate max-w-[160px]">
          {name || 'Details'}
        </button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-900 font-semibold">Edit</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Name
          </label>
          <input
            type="text"
            placeholder="Destination/Region Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500 placeholder-slate-400 transition-colors"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Terms and Conditions Text
          </label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>

        <p className="text-[11px] text-slate-500 font-medium mb-8 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
          <span className="font-bold text-slate-700">Note:</span> Please avoid using your business name in Terms and Conditions. Business signature along with contact details will be automatically added to the itinerary.
        </p>

        <div className="border-t border-slate-200 pt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#3f67d4] hover:bg-[#3252a8] text-white rounded-lg text-xs font-bold shadow-md transition-all focus:outline-none disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            onClick={() => navigate(`/admin/terms-conditions/${id}`)}
            className="px-5 py-2.5 text-slate-600 text-xs font-bold hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </section>
  );
};

export default EditTerm;
