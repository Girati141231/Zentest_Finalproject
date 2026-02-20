import React from 'react';
import {
    Square, CheckSquare, RefreshCcw, Play, Edit3, Trash2, Globe, Wifi, Activity, CheckCircle2, XCircle, MessageSquare, User
} from 'lucide-react';
import Badge from './ui/Badge';
import { APITestCase } from '../types';

interface APITableProps {
    cases: APITestCase[];
    selectedIds: Set<string>;
    executingId: string | null;
    activeProjectId: string | null;
    onToggleSelect: (id: string) => void;
    onToggleSelectAll: () => void;
    onRun: (tc: APITestCase) => void;
    onEdit: (tc: APITestCase) => void;
    onDelete: (id: string) => void;
    onStatusUpdate: (id: string, status: 'Passed' | 'Failed') => void;
    onMessage: (tc: APITestCase) => void;
    readOnly?: boolean;
    readStatus?: Record<string, number>;
    onCreate?: () => void;
}

const METHOD_COLORS = {
    GET: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    POST: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    PUT: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    DELETE: 'text-red-400 bg-red-500/10 border-red-500/20',
    PATCH: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
};

const APITable: React.FC<APITableProps> = ({
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
    const [expandedDetails, setExpandedDetails] = React.useState<Set<string>>(new Set());

    const toggleDetails = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const next = new Set(expandedDetails);
        if (next.has(id)) next.delete(id); else next.add(id);
        setExpandedDetails(next);
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
                        <th className="px-6 py-5 w-[250px] font-bold">Scenario Details</th>
                        <th className="px-6 py-5 font-bold">Endpoint Details</th>
                        <th className="px-6 py-5 w-[110px] text-center font-bold">Priority</th>
                        <th className="px-6 py-5 w-[120px] text-center font-bold">Status</th>
                        <th className="px-6 py-5 w-[80px] text-center font-bold">Auto</th>
                        <th className="px-6 py-5 w-[200px] font-bold">Last Audit</th>
                        <th className="px-6 py-5 w-[160px] text-center font-bold">Actions</th>
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

                            {/* Scenario Details (ID, Module, Method, Title) */}
                            <td className="px-5 py-6 align-middle">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-tight">{c.id}</span>
                                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tight">{c.module || 'GENERAL'}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tight border ${METHOD_COLORS[c.method as keyof typeof METHOD_COLORS] || 'text-white/50 bg-white/5 border-white/10'}`}>
                                            {c.method}
                                        </span>
                                    </div>
                                    <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors leading-snug truncate">
                                        {c.title}
                                    </div>
                                </div>
                            </td>

                            {/* Endpoint & Details */}
                            <td className="px-6 py-6 align-middle">
                                <div className="flex flex-col gap-3 group/details">
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <div className="font-mono text-[10px] text-white/50 truncate max-w-[400px]" title={c.url}>
                                            {c.url}
                                        </div>
                                    </div>

                                    {/* Toggle Toggle */}
                                    <div
                                        onClick={(e) => toggleDetails(c.id, e)}
                                        className="flex items-center gap-2 text-[10px] font-bold text-white/40 cursor-pointer w-fit hover:text-blue-400 transition-colors uppercase tracking-widest"
                                    >
                                        <Activity size={12} />
                                        <span>{expandedDetails.has(c.id) ? 'Hide Request Details' : 'View Request Details'}</span>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedDetails.has(c.id) && (
                                        <div className="animate-in slide-in-from-top-2 fade-in duration-300 space-y-3 mt-1 bg-black/40 rounded border border-white/5 p-4">
                                            {c.headers && c.headers.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Headers</div>
                                                    <div className="grid gap-1">
                                                        {c.headers.map((h, i) => (
                                                            <div key={i} className="text-[10px] font-mono flex gap-2">
                                                                <span className="text-blue-400">{h.key}:</span>
                                                                <span className="text-white/60">{h.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {c.body && (
                                                <div className="space-y-1.5">
                                                    <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Request Body</div>
                                                    <pre className="text-[10px] font-mono text-white/60 bg-white/[0.02] p-2 rounded border border-white/5 overflow-x-auto">
                                                        {typeof c.body === 'string' ? c.body : JSON.stringify(c.body, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </td>

                            {/* Priority */}
                            <td className="px-6 py-6 align-middle text-center">
                                <Badge variant={c.priority} className="scale-90">{c.priority}</Badge>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-6 align-middle text-center">
                                <Badge variant={c.status} className="scale-110 shadow-sm">{c.status}</Badge>
                            </td>

                            {/* Run Button */}
                            <td className="px-6 py-6 align-middle text-center">
                                {executingId === c.id || (executingId === 'bulk' && selectedIds.has(c.id)) ? (
                                    <div className="inline-flex p-2 rounded-full bg-blue-500/20 text-blue-400 animate-pulse border border-blue-500/10">
                                        <RefreshCcw size={16} className="animate-spin" />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onRun(c)}
                                        className="inline-flex p-2 rounded-full bg-white/5 text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20 active:scale-90"
                                        title="Run API Request"
                                    >
                                        <Wifi size={16} fill="currentColor" />
                                    </button>
                                )}
                            </td>

                            {/* Audit */}
                            <td className="px-6 py-6 align-middle">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-white/5 to-white/10 p-[1px] shadow-inner">
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
                                    <div>
                                        <div className="text-xs font-medium text-white/90">{c.lastUpdatedByName || 'System'}</div>
                                        <div className="text-[10px] text-white/40 font-medium whitespace-nowrap leading-tight mt-0.5">
                                            {c.timestamp ? (
                                                <>
                                                    {new Date(c.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    {' '}
                                                    {new Date(c.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </>
                                            ) : '-'}
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
                                            {c.commentCount && c.commentCount > (readStatus[c.id] || 0) ? (
                                                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 bg-blue-500 rounded-full border-2 border-[#050505] flex items-center justify-center text-[8px] font-black text-white shadow-lg shadow-blue-500/20">
                                                    {c.commentCount - (readStatus[c.id] || 0) > 9 ? '9+' : c.commentCount - (readStatus[c.id] || 0)}
                                                </span>
                                            ) : null}
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
                                        <Activity size={64} strokeWidth={0.5} />
                                        <span className="text-sm uppercase tracking-[0.2em] font-light">No API Tests Found</span>
                                    </div>
                                    {onCreate && (
                                        <button
                                            onClick={onCreate}
                                            className="mt-4 px-6 py-2 border border-white/20 hover:bg-white hover:text-black hover:border-white rounded-sm text-xs font-bold uppercase tracking-widest text-white/60 transition-all pointer-events-auto"
                                        >
                                            + Create First API Test
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default APITable;
