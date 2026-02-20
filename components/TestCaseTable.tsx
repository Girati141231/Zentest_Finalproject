import React from 'react';
import {
  Square, CheckSquare, ListOrdered, RefreshCcw, Play, Edit3, Trash2, CheckCircle2, XCircle, MessageSquare, User, ChevronRight, Target, Image, AlertTriangle, Eye, Clock, ChevronLeft, Activity
} from 'lucide-react';
import Badge from './ui/Badge';
import { TestCase } from '../types';

interface TestCaseTableProps {
  cases: TestCase[];
  selectedIds: Set<string>;
  executingId: string | null;
  activeProjectId: string | null;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onRun: (tc: TestCase) => void;
  onEdit: (tc: TestCase) => void;
  onDelete: (id: string) => void;
  onStatusUpdate: (id: string, status: 'Passed' | 'Failed') => void;
  onMessage: (tc: TestCase) => void;
  readOnly?: boolean;
  readStatus?: Record<string, number>;
  onCreate?: () => void;
}

const TestCaseTable: React.FC<TestCaseTableProps> = ({
  cases,
  selectedIds,
  executingId,
  onToggleSelect,
  onToggleSelectAll,
  onRun,
  onEdit,
  onDelete,
  onStatusUpdate,
  onMessage,
  readOnly = false,
  readStatus = {},
  onCreate
}) => {
  const [expandedSteps, setExpandedSteps] = React.useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const toggleSteps = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(expandedSteps);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedSteps(next);
  };

  const scrollGallery = (id: string, direction: 'left' | 'right') => {
    const el = document.getElementById(`gallery-${id}`);
    if (el) {
      const cardWidth = 232; // 220px (card) + 12px (gap-3)
      if (direction === 'left') {
        el.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }
  };

  const formatExpected = (text: string) => {
    if (!text) return null;
    const keywords = ['Functional:', 'UI/UX:', 'Performance:'];
    const parts = text.split(/(Functional:|UI\/UX:|Performance:)/g).filter(p => p.trim());

    if (parts.length <= 1) return <p className="text-xs text-blue-100/50 leading-relaxed font-medium">{text}</p>;

    const elements = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (keywords.includes(part)) {
        const nextContent = parts[i + 1]?.trim() || '';
        elements.push(
          <div key={i} className="mb-4 last:mb-0">
            <div className="text-white font-black text-[11px] uppercase tracking-[0.15em] mb-1.5 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
              <div className="w-1 h-3 bg-blue-500 rounded-full" />
              {part}
            </div>
            <div className="text-[13px] text-blue-100/60 leading-relaxed font-medium pl-3 border-l border-white/10 ml-0.5 whitespace-pre-wrap">{nextContent}</div>
          </div>
        );
        i++;
      } else if (i === 0) {
        elements.push(<p key={i} className="text-[13px] text-white/40 leading-relaxed font-medium mb-4 italic pl-3 border-l border-white/5">{part}</p>);
      }
    }
    return <div className="space-y-1">{elements}</div>;
  };

  return (
    <div className="w-full bg-[#050505] border border-white/5 rounded-lg shadow-2xl overflow-hidden font-sans">
      <div className="overflow-x-auto custom-scrollbar max-h-[700px]">
        <table className="w-full text-left border-collapse table-fixed min-w-[1240px]">
          <thead>
            <tr className="bg-white/[0.02] text-[10px] text-white/30 uppercase tracking-widest border-b border-white/5">
              <th className="px-6 py-5 w-[60px] text-center">
                <button onClick={onToggleSelectAll} className="hover:text-white transition-colors">
                  {cases.length > 0 && selectedIds.size === cases.length ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} className="text-white/10" />}
                </button>
              </th>
              <th className="px-6 py-5 w-[250px] font-bold">Scenario</th>
              <th className="px-6 py-5 font-bold">Test Steps</th>
              <th className="px-6 py-5 w-[110px] text-center font-bold">Priority</th>
              <th className="px-6 py-5 w-[120px] text-center font-bold">Status</th>
              <th className="px-6 py-5 w-[80px] text-center font-bold">Auto</th>
              <th className="px-6 py-5 w-[200px] font-bold">Last Updated</th>
              <th className="px-6 py-5 w-[160px] text-center font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {cases.length > 0 ? cases.map(c => {
              const isExpanded = expandedSteps.has(c.id);
              const isExecuting = executingId === c.id;

              return (
                <tr key={c.id} className={`group transition-all duration-200 ${selectedIds.has(c.id) ? 'bg-blue-500/[0.03]' : 'hover:bg-white/[0.01]'}`}>
                  <td className="px-5 py-6 text-center align-middle">
                    <button
                      onClick={() => onToggleSelect(c.id)}
                      className={`${selectedIds.has(c.id) ? 'text-blue-500 scale-110' : 'text-white/10 group-hover:text-white/30'} transition-all`}
                    >
                      {selectedIds.has(c.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>

                  <td className="px-5 py-6 align-middle">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-tight">{c.id}</span>
                        <span className="text-[10px] font-black text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20 uppercase tracking-tight">{c.module || 'GENERAL'}</span>
                      </div>
                      <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors leading-snug truncate">
                        {c.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.1em]">Round {c.round || 1}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-6 align-middle overflow-hidden">
                    <button
                      onClick={() => toggleSteps(c.id)}
                      className={`flex items-center gap-2 text-[10px] font-bold tracking-widest transition-all ${isExpanded ? 'text-blue-400 active:scale-95 mb-5' : 'text-white/40 hover:text-blue-400'}`}
                    >
                      <div className={`p-1.5 rounded-lg bg-white/5 ${isExpanded ? 'bg-blue-500/20 text-blue-400' : 'group-hover:bg-blue-500/10'}`}>
                        <ListOrdered size={14} />
                      </div>
                      <span className="uppercase">{c.steps?.length || 0} Steps Defined</span>
                      <ChevronRight size={12} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-4 max-w-xl pb-2 mt-2">
                          <div className="space-y-2 border-l-2 border-white/5 pl-4 ml-1">
                            {c.steps?.map((step, idx) => (
                              <div key={idx} className="text-xs text-white/50 flex gap-2">
                                <span className="text-white/10 font-mono shrink-0 select-none">{idx + 1}.</span>
                                <span className="leading-relaxed whitespace-normal break-words">{step}</span>
                              </div>
                            ))}
                          </div>
                          <div className="bg-blue-500/[0.04] border border-blue-500/10 rounded-lg p-4 shadow-inner">
                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
                              <Target size={14} /> EXPECTED RESULT
                            </div>
                            {formatExpected(c.expected)}
                          </div>
                          {c.actualResult && (
                            <div className={`rounded-lg p-4 border shadow-inner ${c.status === 'Passed' ? 'bg-emerald-500/[0.04] border-emerald-500/10' : 'bg-red-500/[0.04] border-red-500/10'}`}>
                              <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3 ${c.status === 'Passed' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {c.status === 'Passed' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                EXECUTION SUMMARY
                              </div>
                              <div className={`text-[13px] leading-relaxed font-bold ${c.status === 'Passed' ? 'text-emerald-300/80' : 'text-red-300/80 font-mono'}`}>
                                {c.actualResult}
                              </div>
                            </div>
                          )}

                          {/* Screenshot Carousel with Centered Controls & Perfect Alignment */}
                          {c.screenshots && c.screenshots.length > 0 && (
                            <div className="relative group/gallery border border-white/5 rounded-2xl overflow-hidden bg-black/40 p-2 mt-4 shadow-2xl">
                              {/* Gradient Overlays */}
                              <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/80 to-transparent z-10 pointer-events-none opacity-0 group-hover/gallery:opacity-100 transition-opacity" />
                              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/80 to-transparent z-10 pointer-events-none opacity-0 group-hover/gallery:opacity-100 transition-opacity" />

                              {/* Premium Navigation Buttons - Fixed Action */}
                              <button
                                type="button"
                                onClick={() => scrollGallery(c.id, 'left')}
                                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white hover:bg-white border border-white/20 rounded-full flex items-center justify-center text-black transition-all scale-0 group-hover/gallery:scale-100 shadow-[0_10px_30px_rgba(0,0,0,0.8)] active:scale-95 hover:-translate-x-1 cursor-pointer"
                              >
                                <ChevronLeft size={22} strokeWidth={3} />
                              </button>
                              <button
                                type="button"
                                onClick={() => scrollGallery(c.id, 'right')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white hover:bg-white border border-white/20 rounded-full flex items-center justify-center text-black transition-all scale-0 group-hover/gallery:scale-100 shadow-[0_10px_30px_rgba(0,0,0,0.8)] active:scale-95 hover:translate-x-1 cursor-pointer"
                              >
                                <ChevronRight size={22} strokeWidth={3} />
                              </button>

                              <div
                                id={`gallery-${c.id}`}
                                className="flex gap-3 py-4 px-[calc(50%-110px)] overflow-x-auto snap-x snap-mandatory custom-scrollbar-none scroll-smooth items-center"
                              >
                                {c.screenshots.map((s, si) => {
                                  const isFailed = s.status === 'failed';
                                  return (
                                    <div
                                      key={si}
                                      onClick={() => setSelectedImage(s.base64)}
                                      className={`w-[220px] aspect-video rounded-xl border-2 overflow-hidden cursor-zoom-in transition-all shrink-0 bg-[#0A0A0A] shadow-lg snap-center ${isFailed ? 'border-red-500 ring-4 ring-red-500/30' : 'border-white/10 hover:border-blue-500/50'}`}
                                    >
                                      <div className="relative w-full h-full group/img">
                                        <img
                                          src={s.base64}
                                          className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                                          alt={`Step ${si + 1}`}
                                          referrerPolicy="no-referrer"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-white/5"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/10"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>`;
                                          }}
                                        />

                                        {/* Centered Error Message */}
                                        {isFailed && (
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-red-900/20 backdrop-blur-[1px]">
                                            <div className="bg-red-600/90 text-[10px] font-black text-white px-4 py-1.5 rounded-full uppercase tracking-[0.25em] shadow-[0_0_30px_rgba(220,38,38,0.7)] animate-pulse border-2 border-white/20 scale-110">
                                              BUG DETECTED
                                            </div>
                                          </div>
                                        )}

                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                          <Eye size={22} className="text-white bg-black/50 p-2 rounded-full drop-shadow-xl" />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-6 align-middle text-center">
                    <Badge variant={c.priority} className="scale-90">{c.priority}</Badge>
                  </td>

                  <td className="px-6 py-6 align-middle text-center">
                    <Badge variant={c.status} className="scale-110 shadow-sm">{c.status}</Badge>
                  </td>

                  <td className="px-6 py-6 align-middle text-center">
                    {c.hasAutomation && (
                      <button
                        onClick={() => !isExecuting && onRun(c)}
                        className={`inline-flex p-2 rounded-full transition-all duration-300 ${isExecuting ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-white/5 text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 active:scale-90'} border border-transparent`}
                        title="Run Automation"
                      >
                        {isExecuting ? (
                          <RefreshCcw size={16} className="animate-spin" />
                        ) : (
                          <Play size={16} fill="currentColor" />
                        )}
                      </button>
                    )}
                  </td>

                  <td className="px-6 py-6 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-white/5 to-white/10 p-[1px] shadow-inner shrink-0">
                        <div className="w-full h-full rounded-full overflow-hidden bg-black/50 flex items-center justify-center">
                          {c.lastUpdatedByPhoto ? (
                            <img
                              src={c.lastUpdatedByPhoto}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center font-bold text-blue-400 text-[10px]">${c.lastUpdatedByName?.[0] || '?'}</div>`;
                              }}
                            />
                          ) : (
                            <User size={14} className="text-white/30" />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-white/90 truncate">{c.lastUpdatedByName || 'QA'}</span>
                        <span className="text-[10px] text-white/40 font-medium whitespace-nowrap leading-tight mt-0.5">
                          {c.timestamp ? (
                            <>
                              {new Date(c.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {' '}
                              {new Date(c.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </>
                          ) : '-'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-6 align-middle text-center">
                    <div className="flex flex-col gap-2 items-center">
                      {!readOnly && (
                        <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/5 shadow-sm">
                          <button onClick={() => onStatusUpdate(c.id, 'Passed')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-emerald-500 hover:text-white text-white/30 transition-all" title="Mark Passed"><CheckCircle2 size={16} /></button>
                          <div className="w-px h-3 bg-white/10 mx-0.5"></div>
                          <button onClick={() => onStatusUpdate(c.id, 'Failed')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500 hover:text-white text-white/30 transition-all" title="Mark Failed"><XCircle size={16} /></button>
                        </div>
                      )}
                      <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onMessage(c)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-500/20 hover:text-blue-400 text-white/50 transition-all relative" title="Comments">
                          <MessageSquare size={14} />
                          {c.commentCount && c.commentCount > (readStatus[c.id] || 0) ? (
                            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 bg-blue-500 rounded-full border-2 border-[#050505] flex items-center justify-center text-[8px] font-black text-white shadow-lg shadow-blue-500/20">
                              {c.commentCount - (readStatus[c.id] || 0) > 9 ? '9+' : c.commentCount - (readStatus[c.id] || 0)}
                            </span>
                          ) : null}
                        </button>
                        {!readOnly && (
                          <>
                            <button onClick={() => onEdit(c)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 hover:text-white text-white/50 transition-all" title="Edit"><Edit3 size={14} /></button>
                            <button onClick={() => onDelete(c.id)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-500/20 hover:text-red-400 text-white/50 transition-all" title="Delete"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={8} className="px-6 py-32 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-col items-center gap-4 text-white/30">
                      <Activity size={64} strokeWidth={0.5} />
                      <span className="text-sm uppercase tracking-[0.2em] font-light">No test scenarios found</span>
                    </div>
                    {onCreate && (
                      <button
                        onClick={onCreate}
                        className="mt-4 px-6 py-2 border border-white/20 hover:bg-white hover:text-black hover:border-white rounded-sm text-xs font-bold uppercase tracking-widest text-white/60 transition-all pointer-events-auto"
                      >
                        + Create First Scenario
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
          <img
            src={selectedImage}
            className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
            alt="Preview"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
};

export default TestCaseTable;
