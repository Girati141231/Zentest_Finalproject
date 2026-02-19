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
  onCreate?: () => void;
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
  readStatus = {},
  onCreate
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
      <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
        <thead>
          <tr className="bg-white/[0.02] text-[10px] text-white/30 uppercase tracking-widest border-b border-white/5">
            <th className="px-6 py-5 w-[60px] text-center">
              <button onClick={onToggleSelectAll} className="hover:text-white transition-colors">
                {cases.length > 0 && selectedIds.size === cases.length ? <CheckSquare size={18} /> : <Square size={18} className="opacity-30" />}
              </button>
            </th>
            <th className="px-6 py-5 font-bold w-[300px]">Scenario Details</th>
            <th className="px-6 py-5 font-bold">Execution Steps</th>
            <th className="px-6 py-5 font-bold w-[100px] text-center">Priority</th>
            <th className="px-6 py-5 font-bold w-[80px] text-center">Auto</th>
            <th className="px-6 py-5 font-bold w-[110px] text-center">Status</th>
            <th className="px-6 py-5 font-bold w-[200px]">Last Audit</th>
            <th className="px-6 py-5 w-[160px] text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {cases.length > 0 ? cases.map(c => (
            <tr key={c.id} className={`hover:bg-white/[0.02] group transition-all duration-200 ${selectedIds.has(c.id) ? 'bg-blue-500/[0.03]' : ''}`}>
              {/* Checkbox */}
              <td className="px-6 py-6 text-center align-middle">
                <button
                  onClick={() => onToggleSelect(c.id)}
                  className={`${selectedIds.has(c.id) ? 'text-blue-500 scale-110' : 'text-white/10 hover:text-white/40'} transition-all`}
                >
                  {selectedIds.has(c.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
              </td>

              {/* Identifier & Scenario */}
              <td className="px-6 py-6 align-middle">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                      {c.id}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-wider bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                      {c.module || 'GENERAL'}
                    </span>
                  </div>
                  <div className="text-white/90 text-[15px] font-medium leading-snug group-hover:text-blue-300 transition-colors">
                    {c.title}
                  </div>
                  {c.round && (
                    <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
                      ROUND {c.round}
                    </div>
                  )}
                </div>
              </td>

              {/* Steps (Expandable) */}
              <td className="px-6 py-6 align-middle">
                <div className="flex flex-col gap-3 group/steps">
                  {/* Toggle Header */}
                  <div
                    className="flex items-center gap-2 text-white/40 text-xs cursor-pointer w-fit p-1 -ml-1 rounded hover:bg-white/5 transition-all"
                    onClick={() => toggleSteps(c.id)}
                  >
                    <div className={`p-1 rounded ${expandedSteps.has(c.id) ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/30'} transition-colors`}>
                      <ListOrdered size={14} />
                    </div>
                    <span className="font-semibold">{c.steps?.filter(s => s.trim()).length || 0} Steps Defined</span>
                    <ChevronRight size={12} className={`transition-transform duration-300 ${expandedSteps.has(c.id) ? 'rotate-90 text-blue-400' : 'opacity-50'}`} />
                  </div>

                  {/* Expanded Content */}
                  {expandedSteps.has(c.id) && (
                    <div className="pl-2 animate-in slide-in-from-top-2 fade-in duration-300 space-y-4 border-l-2 border-white/5 ml-2.5 py-1">
                      {/* Steps List */}
                      {c.steps && c.steps.length > 0 && (
                        <div className="space-y-2">
                          {c.steps.filter(s => s.trim()).map((step, i) => (
                            <div key={i} className="flex gap-3 text-sm text-white/70 leading-relaxed">
                              <span className="text-white/10 font-mono text-xs select-none mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Expected Result */}
                      {c.expected && (
                        <div className="bg-blue-500/5 rounded-md p-3 border border-blue-500/10">
                          <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">
                            <Target size={12} />
                            <span>Expectation</span>
                          </div>
                          <div className="text-xs text-blue-100/70 leading-relaxed pl-1">
                            {c.expected}
                          </div>
                        </div>
                      )}

                      {/* Actual Result */}
                      {c.actualResult && (
                        <div className={`rounded-md p-3 border ${c.status === 'Failed' ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                          <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-2 ${c.status === 'Failed' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {c.status === 'Failed' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                            <span>Execution Result</span>
                          </div>
                          <div className="text-xs text-white/80 leading-relaxed pl-1">
                            {c.actualResult}
                          </div>
                        </div>
                      )}

                      {/* Evidence Button */}
                      {c.screenshots && c.screenshots.length > 0 && (
                        <button
                          onClick={(e) => toggleEvidence(c.id, e)}
                          className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-purple-400 transition-colors uppercase tracking-widest mt-2"
                        >
                          <Image size={14} />
                          {expandedEvidence.has(c.id) ? 'Hide Evidence Gallery' : `View ${c.screenshots.length} Screenshots`}
                        </button>
                      )}

                      {/* Gallery */}
                      {expandedEvidence.has(c.id) && c.screenshots && (
                        <div className="relative group/gallery mt-3 p-3 bg-black/40 rounded-lg border border-white/5">
                          {/* ... (Keep Gallery Logic Logic mostly same but clearer) ... */}
                          <div id={`scroll-evidence-${c.id}`} className="flex gap-3 overflow-x-auto custom-scrollbar scroll-smooth">
                            {c.screenshots.map((shot, sIdx) => (
                              <div key={sIdx} onClick={() => setSelectedImage(shot.base64)} className="relative group/img cursor-zoom-in shrink-0">
                                <div className={`w-32 aspect-video rounded overflow-hidden border ${shot.status === 'failed' ? 'border-red-500/50' : 'border-white/10 group-hover/img:border-white/30'} transition-all`}>
                                  <img src={shot.base64} className="w-full h-full object-cover" />
                                </div>
                                {shot.status === 'failed' && <div className="absolute top-1 right-1 text-red-500"><AlertTriangle size={12} fill="currentColor" /></div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Collapsed Preview */}
                  {!expandedSteps.has(c.id) && (
                    <div className="text-xs text-white/20 italic pl-1 truncate max-w-[200px]">
                      {c.steps?.[0] ? `${c.steps[0]}...` : ''}
                    </div>
                  )}
                </div>
              </td>

              {/* Priority */}
              <td className="px-6 py-6 align-middle text-center">
                <Badge variant={c.priority} className="scale-110 shadow-sm">{c.priority}</Badge>
              </td>

              {/* Auto */}
              <td className="px-6 py-6 align-middle text-center">
                {c.hasAutomation ? (
                  <div className={`inline-flex p-2 rounded-full ${executingId === c.id ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-white/5 text-white/40 group-hover:text-blue-400 group-hover:bg-blue-500/10'} transition-all cursor-pointer`} onClick={() => !executingId && onRun(c)}>
                    {executingId === c.id ? <RefreshCcw size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                  </div>
                ) : (
                  <div className="w-8 h-8 mx-auto rounded-full bg-white/[0.02] flex items-center justify-center opacity-20">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                  </div>
                )}
              </td>

              {/* Status */}
              <td className="px-6 py-6 align-middle text-center">
                <Badge variant={c.status} className="scale-110 shadow-sm">{c.status}</Badge>
              </td>

              {/* Audit */}
              <td className="px-6 py-6 align-middle">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-white/5 to-white/10 p-[1px] shadow-inner">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black/50 flex items-center justify-center">
                      {c.lastUpdatedByPhoto ? <img src={c.lastUpdatedByPhoto} className="w-full h-full object-cover" /> : <User size={14} className="text-white/30" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white/90">{c.lastUpdatedByName || 'System'}</div>
                    <div className="text-[10px] text-white/40 font-mono mt-0.5">
                      {c.timestamp ? new Date(c.timestamp).toLocaleDateString('en-GB') : '-'}
                    </div>
                  </div>
                </div>
              </td>

              {/* Actions */}
              <td className="px-6 py-6 align-middle text-center">
                <div className="flex flex-col gap-2 items-center">
                  {!readOnly && (
                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/5 shadow-sm">
                      <button onClick={() => onStatusUpdate(c.id, 'Passed')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-emerald-500 hover:text-white text-white/30 transition-all"><CheckCircle2 size={16} /></button>
                      <div className="w-px h-3 bg-white/10 mx-0.5"></div>
                      <button onClick={() => onStatusUpdate(c.id, 'Failed')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500 hover:text-white text-white/30 transition-all"><XCircle size={16} /></button>
                    </div>
                  )}

                  <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onMessage(c)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-500/20 hover:text-blue-400 text-white/50 transition-all relative">
                      <MessageSquare size={14} />
                      {c.commentCount && c.commentCount > (readStatus[c.id] || 0) ? <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-blue-500 border border-black"></span> : null}
                    </button>
                    {!readOnly && (
                      <>
                        <button onClick={() => onEdit(c)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 hover:text-white text-white/50 transition-all"><Edit3 size={14} /></button>
                        <button onClick={() => onDelete(c.id)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-500/20 hover:text-red-400 text-white/50 transition-all"><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>
              </td>

            </tr>
          )) : (
            <tr>
              <td colSpan={8} className="px-6 py-32 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-col items-center gap-4 text-white/30">
                    <Square size={64} strokeWidth={0.5} />
                    <span className="text-sm uppercase tracking-[0.2em] font-light">No Test Cases Found</span>
                  </div>
                  {onCreate && (
                    <button
                      onClick={onCreate}
                      className="mt-4 px-6 py-2 border border-white/20 hover:bg-white hover:text-black hover:border-white rounded-sm text-xs font-bold uppercase tracking-widest text-white/60 transition-all pointer-events-auto"
                    >
                      + Create First Case
                    </button>
                  )}
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
