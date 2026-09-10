import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { History, ChevronRight, ChevronLeft, ArrowLeft, X, Pencil, MoreVertical, Archive } from 'lucide-react';
import API from '../../utils/Api';

// Extract plain-text lines from HTML (for diffing)
const extractLinesFromHTML = (html) => {
  if (!html) return [];
  const el = document.createElement('div');
  el.innerHTML = html;
  const lines = [];
  const processNode = (node) => {
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (['ul', 'ol'].includes(tag)) {
      node.childNodes.forEach(processNode);
    } else if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'div'].includes(tag)) {
      const text = node.textContent.trim();
      if (text) lines.push(text);
    } else if (tag === 'hr') {
      lines.push('---');
    }
  };
  el.childNodes.forEach(processNode);
  return lines;
};

// LCS-based line diff
const computeDiff = (oldLines, newLines) => {
  const m = oldLines.length, n = newLines.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oldLines[i-1] === newLines[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);
  const result = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i-1] === newLines[j-1]) {
      result.unshift({ type: 'equal', text: oldLines[i-1] }); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      result.unshift({ type: 'added', text: newLines[j-1] }); j--;
    } else {
      result.unshift({ type: 'removed', text: oldLines[i-1] }); i--;
    }
  }
  return result;
};

const TermDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [term, setTerm] = useState(null);
  const [showRevisions, setShowRevisions] = useState(false);
  const [pairIdx, setPairIdx] = useState(null); // index of older revision in current comparison pair
  const [menuOpen, setMenuOpen] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchTerm = async () => {
      try {
        const response = await API.get(`/agent/terms/${id}`);
        setTerm(response.data);
      } catch (error) {
        console.error("Failed to fetch term:", error);
      }
    };
    fetchTerm();
  }, [id]);

  // Init pairIdx to most-recent pair once term loads
  useEffect(() => {
    if (term?.revisions?.length >= 2) {
      setPairIdx(term.revisions.length - 2);
    }
  }, [term]);

  if (!term) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Term not found or loading...</p>
        <button 
          onClick={() => navigate('/agent/terms')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Go back to list
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-5 p-6 font-sans">
      <div className="flex items-center justify-between gap-2">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium min-w-0">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 hover:bg-slate-200 rounded-full transition-colors mr-1 cursor-pointer flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={16} className="text-slate-700" />
          </button>
          <button onClick={() => navigate('/agent/terms')} className="hover:text-gray-900 transition-colors cursor-pointer shrink-0">
            Terms and Conditions
          </button>
          <ChevronRight size={14} className="text-gray-400 shrink-0" />
          <span className="text-gray-900 font-semibold truncate">{term.name}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate(`/agent/terms/${id}/edit`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm cursor-pointer"
          >
            <Pencil size={13} />
            Edit
          </button>

          {/* Three-dot menu with Archive */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              onMouseEnter={() => setMenuOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm cursor-pointer"
              title="More options"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div
                onMouseLeave={() => setMenuOpen(false)}
                className="absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowArchiveModal(true);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Archive size={14} />
                  Archive
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start">
            
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Name</div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">{term.name}</h1>
              <button 
                onClick={() => setShowRevisions(!showRevisions)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                {showRevisions ? <X size={14} /> : <History size={14} />}
                <span>{showRevisions ? 'Hide Revisions' : 'View Revisions'}</span>
              </button>
            </div>

            <div className="mt-4 sm:mt-0 sm:text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Created by</div>
              <div className="flex items-center gap-2 sm:justify-end">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-sm text-slate-900">
                  <span className="font-bold">{term.by}</span> 
                  <span className="text-slate-500 font-medium ml-1">
                    on {term.on.replace('on ', '')}{term.on.includes(':') ? '' : ' 10:30 AM'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Content / Revisions Section */}
        {showRevisions ? (
          <div className="px-8 py-6">
            {term.revisions && term.revisions.length >= 2 && pairIdx !== null ? (() => {
              const idx = pairIdx;
              const oldRev = term.revisions[idx];       // older version
              const newRev = term.revisions[idx + 1];   // newer version

              const oldLines = extractLinesFromHTML(oldRev.content);
              const newLines = extractLinesFromHTML(newRev.content);
              const diff = computeDiff(oldLines, newLines);
              const deletions = diff.filter(d => d.type === 'removed').length;
              const additions = diff.filter(d => d.type === 'added').length;

              return (
                <>
                  {/* Nav: [◄ Newer Date]   [Older Date ►] */}
                  <div className="flex items-center gap-2 flex-wrap mb-5">

                    {/* Left pill: newer date + ◄ (navigate to even newer pair) */}
                    <button
                      onClick={() => idx < term.revisions.length - 2 && setPairIdx(idx + 1)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border bg-white text-blue-700 transition-colors ${idx < term.revisions.length - 2 ? 'border-slate-200 hover:bg-slate-50 cursor-pointer' : 'border-slate-200 cursor-default'}`}
                    >
                      {idx < term.revisions.length - 2 && <ChevronLeft size={13} />}
                      {idx + 1 === term.revisions.length - 1 ? 'Latest' : newRev.formattedDate}
                    </button>

                    {/* Right pill: older date + ► (navigate to older pair) */}
                    <button
                      onClick={() => idx > 0 && setPairIdx(idx - 1)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border bg-white text-blue-700 transition-colors ${idx > 0 ? 'border-slate-200 hover:bg-slate-50 cursor-pointer' : 'border-slate-200 cursor-default'}`}
                    >
                      {idx === 0 ? 'Oldest' : oldRev.formattedDate}
                      {idx > 0 && <ChevronRight size={13} />}
                    </button>
                  </div>

                  {/* Counts + author */}
                  <div className="flex items-center gap-3 text-xs mb-5 flex-wrap">
                    <span className="px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 font-bold">
                      - {deletions} Deletion{deletions !== 1 ? 's' : ''}
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-600 font-bold">
                      + {additions} Addition{additions !== 1 ? 's' : ''}
                    </span>
                    <span className="text-slate-500 font-medium">
                      by <span className="font-semibold text-slate-700">{newRev.by}</span> on {newRev.formattedDate}
                    </span>
                  </div>

                  {/* Diff lines */}
                  <div className="font-mono text-[11px] sm:text-[13px] leading-relaxed space-y-[2px] rounded-lg overflow-hidden border border-slate-100">
                    {diff.length === 0 ? (
                      <div className="px-4 py-6 text-center text-slate-400 text-xs">No differences between these versions.</div>
                    ) : diff.map((line, i) => (
                      <div
                        key={i}
                        className={`px-4 py-1.5 flex gap-4 ${
                          line.type === 'removed' ? 'bg-red-50/80 text-red-900' :
                          line.type === 'added'   ? 'bg-green-50/80 text-green-900' :
                          'text-slate-700'
                        }`}
                      >
                        <span className={`select-none font-bold w-3 shrink-0 ${
                          line.type === 'removed' ? 'text-red-400' :
                          line.type === 'added'   ? 'text-green-500' :
                          'text-slate-300'
                        }`}>
                          {line.type === 'removed' ? '-' : line.type === 'added' ? '+' : ' '}
                        </span>
                        <span className="break-words min-w-0">{line.text}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })() : (
              <div className="text-center py-12 text-sm text-slate-400">
                <History size={32} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No revision history yet.</p>
                <p className="text-xs mt-1">Edit this term to start tracking revisions.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="px-8 py-8">
            <div 
              className="rte-content text-slate-800"
              dangerouslySetInnerHTML={{ __html: term.content }}
            />
          </div>
        )}

      </div>

      {/* Archive Confirm Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
                <Archive size={22} className="text-red-500" />
              </div>
              <h2 className="text-base font-bold text-slate-900 text-center mb-1">Archive this Term?</h2>
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                <span className="font-semibold text-slate-700">{term.name}</span> will be removed from your active list. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6 pt-2">
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={archiving}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={archiving}
                onClick={async () => {
                  setArchiving(true);
                  try {
                    await API.delete(`/agent/terms/${id}`);
                    navigate('/agent/terms');
                  } catch {
                    setArchiving(false);
                    setShowArchiveModal(false);
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
              >
                {archiving ? 'Archiving…' : 'Yes, Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TermDetails;
