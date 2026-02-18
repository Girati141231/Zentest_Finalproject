import React from 'react';
import {
  Square, CheckSquare, ListOrdered, RefreshCcw, Play, Edit3, Trash2, CheckCircle2, XCircle, MessageSquare, User, ChevronDown, ChevronRight, Target, Image, AlertTriangle, Eye, ChevronLeft
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
}

const TestCaseTable: React.FC<TestCaseTableProps> = ({
  cases,
  selectedIds,
  executingId,
  activeProjectId,
  onToggleSelect,
  onToggleSelectAll,
  onRun,
  onEdit,
  onDelete,
  onStatusUpdate,
  onMessage,
  readOnly = false,
  readStatus = {}
}) => {
  const [expandedSteps, setExpandedSteps] = React.useState<Set<string>>(new Set());
  const [expandedEvidence, setExpandedEvidence] = React.useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const scrollEvidence = (id: string, direction: 'left' | 'right') => {
    const el = document.getElementById(`scroll-evidence-${id}`);
    if (el) {
      const scrollAmount = 300;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const toggleSteps = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(expandedSteps);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedSteps(next);
  };

  const toggleEvidence = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedEvidence);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedEvidence(next);
  };

  return (
    <div className="border border-white/10 rounded-sm overflow-x-auto bg-[#050505] custom-scrollbar">
      <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
        <thead>
          <tr className="bg-white/[0.02] text-[10px] text-white/30 uppercase tracking-widest border-b border-white/10">
            <th className="px-4 py-4 w-[45px] text-center">
              <button onClick={onToggleSelectAll} className="hover:text-white transition-colors">
                {cases.length > 0 && selectedIds.size === cases.length ? <CheckSquare size={16} /> : <Square size={16} className="opacity-30" />}
              </button>
            </th>
            <th className="px-4 py-3 font-bold w-[220px]">Identifer & Scenario</th>
            <th className="px-4 py-3 font-bold">Sequence & Expected Outcome</th>
            <th className="px-4 py-3 font-bold w-[90px]">Priority</th>
            <th className="px-4 py-3 font-bold w-[60px] text-center">Auto</th>
            <th className="px-4 py-3 font-bold w-[90px] text-center">Status</th>
            <th className="px-4 py-3 font-bold w-[180px] text-center">Audit</th>
            <th className="px-4 py-3 w-[140px] text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {cases.length > 0 ? cases.map(c => (
            <tr key={c.id} className={`hover:bg-white/[0.03] group transition-all ${selectedIds.has(c.id) ? 'bg-white/[0.04]' : ''}`}>
              <td className="px-4 py-4 text-center align-top">
                <button onClick={() => onToggleSelect(c.id)} className={`${selectedIds.has(c.id) ? 'text-blue-500' : 'text-white/10'} hover:text-blue-400 transition-colors`}>
                  {selectedIds.has(c.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm font-bold tracking-tight flex-wrap">
                    <span className="text-blue-400">{c.id}</span>
                    <span className="w-[1px] h-2 bg-white/10"></span>
                    <span className="text-emerald-500 uppercase text-[10px]">{c.module || 'GENERAL'}</span>
                    <span className="w-[1px] h-2 bg-white/10"></span>
                    <span className="text-white/40">RD:{c.round || 1}</span>
                  </div>
                  <div className="text-white text-sm font-medium max-w-[300px] truncate group-hover:text-blue-400 transition-colors">
                    {c.title}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="flex flex-col gap-2 group/steps max-w-4xl">
                  <div
                    className="flex items-center gap-2 text-white/50 text-xs group-hover/steps:text-white transition-colors cursor-pointer w-fit"
                    onClick={() => toggleSteps(c.id)}
                  >
                    <ListOrdered size={14} className="text-white/20 group-hover/steps:text-blue-400 transition-colors" />
                    <span className="font-bold">{c.steps?.filter(s => s.trim()).length || 0} Steps</span>
                    {expandedSteps.has(c.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} className="opacity-0 group-hover/steps:opacity-100 transition-opacity" />}
                  </div>

                  {expandedSteps.has(c.id) && c.steps && c.steps.length > 0 && (
                    <div className="pl-6 flex flex-col gap-1 animate-in slide-in-from-top-1 fade-in duration-200">
                      {c.steps.filter(s => s.trim()).map((step, i) => (
                        <div key={i} className="text-[10px] text-white/70 leading-relaxed flex gap-2">
                          <span className="text-white/20 select-none">{i + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}

                      {/* Expected Result Section */}
                      {c.expected && (
                        <div className="mt-2 py-2 px-3 bg-blue-500/5 border border-blue-500/20 rounded flex flex-col gap-1.5 border-dashed">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-400/80 uppercase tracking-widest">
                            <Target size={10} />
                            <span>Expected Result</span>
                          </div>
                          <div className="text-[10px] text-white/70 leading-relaxed pl-3 border-l border-blue-500/30 space-y-1">
                            {c.expected.split('\n').map((line, idx) => {
                              const [label, ...rest] = line.split(':');
                              const content = rest.join(':');
                              return (
                                <div key={idx} className="leading-normal">
                                  {content ? (
                                    <>
                                      <span className="font-black text-white mr-1.5">{label}:</span>
                                      <span className="text-white/60">{content}</span>
                                    </>
                                  ) : (
                                    <span>{line}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Actual Result Section (Only if exists) */}
                      {c.actualResult && (
                        <div className={`mt-2 py-2 px-3 border rounded flex flex-col gap-1.5 ${c.status === 'Failed' ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                          <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${c.status === 'Failed' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {c.status === 'Failed' ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                            <span>Actual Result Analysis</span>
                          </div>
                          <div className="text-[10px] text-white/80 leading-relaxed pl-3 border-l border-current opacity-70 font-medium">
                            {c.actualResult}
                          </div>
                          {c.status === 'Failed' && (
                            <div className="mt-1 pl-3 text-[9px] text-red-400/60 break-all bg-red-500/5 p-1.5 rounded-sm border border-red-500/10">
                              DEBUG_LOG: {c.actualResult.includes(':') ? c.actualResult.split(':').pop()?.trim() : 'Unexpected interruption in execution flow.'}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Visual Evidence Gallery */}
                      {c.screenshots && c.screenshots.length > 0 && (
                        <div className="mt-2">
                          <button
                            onClick={(e) => toggleEvidence(c.id, e)}
                            className="flex items-center gap-2 text-[9px] font-black text-white/40 hover:text-white transition-colors uppercase tracking-widest"
                          >
                            <Image size={12} />
                            {expandedEvidence.has(c.id) ? 'Hide Visual Evidence' : `View Visual Evidence (${c.screenshots.length} Steps)`}
                          </button>

                          {expandedEvidence.has(c.id) && (
                            <div className="relative group/gallery mt-3">
                              {/* Left Control */}
                              <button
                                onClick={() => scrollEvidence(c.id, 'left')}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-12 bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-black/80 rounded-r-md"
                              >
                                <ChevronLeft size={20} />
                              </button>

                              <div
                                id={`scroll-evidence-${c.id}`}
                                className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-300 max-w-full scroll-smooth"
                              >
                                {c.screenshots.map((shot, sIdx) => (
                                  <div key={sIdx} className="flex-shrink-0 flex flex-col gap-1.5">
                                    <div
                                      onClick={() => setSelectedImage(shot.base64)}
                                      className={`relative w-48 aspect-video rounded-sm overflow-hidden border-2 transition-all hover:scale-105 cursor-zoom-in group/img ${shot.status === 'failed' ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-white/10 hover:border-white/20'}`}
                                    >
                                      <img src={shot.base64} alt={`Step ${shot.stepIndex + 1}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye size={20} className="text-white" />
                                      </div>
                                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded-[2px] text-[8px] font-bold text-white/80 border border-white/10">
                                        STEP {shot.stepIndex + 1}
                                      </div>
                                      {shot.status === 'failed' && (
                                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                          <AlertTriangle size={24} className="text-red-500 drop-shadow-lg" />
                                        </div>
                                      )}
                                    </div>
                                    <div className={`text-[8px] font-bold uppercase tracking-wider text-center ${shot.status === 'failed' ? 'text-red-500' : 'text-white/30'}`}>
                                      {shot.status === 'failed' ? 'CRITICAL FAILURE' : `Action Completed`}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Right Control */}
                              <button
                                onClick={() => scrollEvidence(c.id, 'right')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-12 bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-black/80 rounded-l-md"
                              >
                                <ChevronRight size={20} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {!expandedSteps.has(c.id) && (
                    <div className="text-[10px] text-white/20 truncate max-w-[120px] italic pl-6">
                      {c.steps?.[0] ? `1. ${c.steps[0]}...` : 'No sequence'}
                    </div>
                  )}
                </div>
              </td>

              <td className="px-4 py-4 align-top">
                <Badge variant={c.priority}>{c.priority}</Badge>
              </td>
              <td className="px-4 py-4 align-top text-center">
                {c.hasAutomation && (
                  executingId === c.id || (executingId === 'bulk' && selectedIds.has(c.id)) ? (
                    <RefreshCcw size={14} className="animate-spin text-blue-500 m-auto" />
                  ) : (
                    <button
                      onClick={() => onRun(c)}
                      className="p-1.5 hover:bg-emerald-500/20 hover:text-emerald-400 text-white/20 rounded transition-all m-auto"
                      title="Run Automation"
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                  )
                )}
              </td>
              <td className="px-4 py-4 align-top text-center">
                <Badge variant={c.status}>{c.status}</Badge>
              </td>
              <td className="px-4 py-4 align-top border-l border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    {c.lastUpdatedByPhoto ? (
                      <img src={c.lastUpdatedByPhoto} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className="text-white/40" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white/90 leading-tight">
                      {c.lastUpdatedByName || 'System'}
                    </span>
                    <span className="text-[10px] text-white/50 tracking-tight">
                      {c.timestamp ? new Date(c.timestamp).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      }).replace(',', '') : '-'}
                    </span>
                  </div>
                </div>
              </td>
              <td className="pl-4 pr-10 py-4 align-top text-center">
                <div className="flex items-center justify-center gap-2">
                  {!readOnly && (
                    <>
                      <button
                        onClick={() => onStatusUpdate(c.id, 'Passed')}
                        className="flex items-center justify-center w-7 h-7 rounded border border-transparent text-white/50 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                        title="Mark Passed"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => onStatusUpdate(c.id, 'Failed')}
                        className="flex items-center justify-center w-7 h-7 rounded border border-transparent text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Mark Failed"
                      >
                        <XCircle size={16} />
                      </button>
                      <div className="w-px h-4 bg-white/5 mx-1"></div>
                    </>
                  )}

                  <button
                    onClick={() => onMessage(c)}
                    className="relative flex items-center justify-center w-8 h-8 rounded-full border border-white/5 bg-white/[0.02] text-white/60 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20 transition-all shadow-sm"
                    title="Comments"
                  >
                    <MessageSquare size={14} />
                    {(() => {
                      const total = c.commentCount || 0;
                      const read = readStatus[c.id] || 0;
                      const unread = total - read;

                      return unread > 0 ? (
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-[#050505] shadow-sm">
                          {unread}
                        </span>
                      ) : null;
                    })()}
                  </button>

                  {!readOnly && (
                    <>
                      <button
                        onClick={() => onEdit(c)}
                        className="flex items-center justify-center w-7 h-7 rounded border border-transparent text-white/60 hover:text-white transition-all"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => onDelete(c.id)}
                        className="flex items-center justify-center w-7 h-7 rounded border border-transparent text-white/50 hover:text-red-500 hover:border-red-500/20 hover:bg-red-500/5 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={8} className="px-4 py-24 text-center">
                <div className="flex flex-col items-center gap-3 opacity-20">
                  <Square size={48} strokeWidth={1} />
                  <span className="text-xs uppercase tracking-widest font-bold">
                    {activeProjectId ? "No Records Found" : "Select or Create a Scope"}
                  </span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Image Modal - Moved outside loop */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
            <XCircle size={32} />
          </button>
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Enlarged Proof"
              className="max-w-full max-h-full object-contain rounded-[4px] shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCaseTable;
