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
    onMessage
}) => {
    return (
        <div className="border border-white/10 rounded-sm overflow-hidden bg-[#050505]">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-white/[0.02] text-[10px] text-white/30 uppercase tracking-widest border-b border-white/10">
                        <th className="px-4 py-3 w-10 text-center">
                            <button onClick={onToggleSelectAll} className="hover:text-white transition-colors">
                                {cases.length > 0 && selectedIds.size === cases.length ? <CheckSquare size={16} /> : <Square size={16} className="opacity-30" />}
                            </button>
                        </th>
                        <th className="px-4 py-3 font-bold w-28">ID</th>
                        <th className="px-4 py-3 font-bold w-20">Method</th>
                        <th className="px-4 py-3 font-bold">Endpoint / Description</th>
                        <th className="px-4 py-3 font-bold w-32">Module</th>
                        <th className="px-4 py-3 font-bold w-16 text-center">Round</th>
                        <th className="px-4 py-3 font-bold w-24">Status</th>
                        <th className="px-4 py-3 font-bold w-16 text-center">Run</th>
                        <th className="px-4 py-3 font-bold w-36 border-l border-white/5">Update By</th>
                        <th className="px-4 py-3 w-40 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {cases.length > 0 ? cases.map(c => (
                        <tr key={c.id} className={`hover:bg-white/[0.03] group transition-all ${selectedIds.has(c.id) ? 'bg-white/[0.04]' : ''}`}>
                            <td className="px-4 py-3 text-center">
                                <button onClick={() => onToggleSelect(c.id)} className={`${selectedIds.has(c.id) ? 'text-blue-500' : 'text-white/10'} hover:text-blue-400 transition-colors`}>
                                    {selectedIds.has(c.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                </button>
                            </td>
                            <td className="px-4 py-4 text-white/30 font-mono text-[10px] font-bold">{c.id}</td>
                            <td className="px-4 py-4">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${METHOD_COLORS[c.method] || 'text-white/50'}`}>
                                    {c.method}
                                </span>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-white text-sm font-medium truncate max-w-[200px] group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                        <Globe size={12} className="text-white/20" /> {c.url}
                                    </div>
                                    {c.title && (
                                        <div className="text-[10px] text-white/40 truncate max-w-[200px] border-l border-white/10 pl-3">
                                            {c.title}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-4 py-3"><Badge>{c.module || 'Unassigned'}</Badge></td>
                            <td className="px-4 py-3 text-center text-xs font-mono text-white/50">{c.round || 1}</td>
                            <td className="px-4 py-3"><Badge variant={c.status}>{c.status}</Badge></td>
                            <td className="px-4 py-3 text-center">
                                {executingId === c.id || (executingId === 'bulk' && selectedIds.has(c.id)) ? (
                                    <RefreshCcw size={14} className="animate-spin text-blue-500 m-auto" />
                                ) : (
                                    <button
                                        onClick={() => onRun(c)}
                                        className="p-1.5 hover:bg-emerald-500/20 hover:text-emerald-400 text-white/20 rounded transition-all m-auto"
                                        title="Run API Request"
                                    >
                                        <Wifi size={14} fill="currentColor" />
                                    </button>
                                )}
                            </td>
                            <td className="px-4 py-4 text-[11px] text-white/40 border-l border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                        {c.lastUpdatedByPhoto ? (
                                            <img src={c.lastUpdatedByPhoto} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={12} className="text-white/30" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold truncate max-w-[80px] text-white/70">{c.lastUpdatedByName || '-'}</span>
                                        <span className="text-[9px] text-white/20">
                                            {c.timestamp ? new Date(c.timestamp).toLocaleString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : '-'}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-center gap-2">
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

                                    <button
                                        onClick={() => onMessage(c)}
                                        className="flex items-center justify-center w-8 h-8 rounded-full border border-white/5 bg-white/[0.02] text-white/60 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20 transition-all shadow-sm"
                                        title="Comments"
                                    >
                                        <MessageSquare size={14} />
                                    </button>

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
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={10} className="px-4 py-24 text-center">
                                <div className="flex flex-col items-center gap-3 opacity-20">
                                    <Activity size={48} strokeWidth={1} />
                                    <span className="text-xs uppercase tracking-widest font-bold">
                                        {activeProjectId ? "No API Tests Found" : "Select or Create a Scope"}
                                    </span>
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
