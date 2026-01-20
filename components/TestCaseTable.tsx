import React from 'react';
import {
  Square, CheckSquare, ListOrdered, RefreshCcw, Play, Edit3, Trash2, CheckCircle2, XCircle
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
  onStatusUpdate
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
            <th className="px-4 py-3 font-bold">Scenario</th>
            <th className="px-4 py-3 font-bold w-32">Steps</th>
            <th className="px-4 py-3 font-bold w-32">Module</th>
            <th className="px-4 py-3 font-bold w-16 text-center">Round</th>
            <th className="px-4 py-3 font-bold w-24">Priority</th>
            <th className="px-4 py-3 font-bold w-24">Status</th>
            <th className="px-4 py-3 font-bold w-16 text-center">Auto</th>
            <th className="px-4 py-3 font-bold w-32 border-l border-white/5">Update By</th>
            <th className="px-4 py-3 w-32 text-center">Actions</th>
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
              <td className="px-4 py-3 text-white/30 font-mono text-[11px] font-bold">{c.id}</td>
              <td className="px-4 py-3">
                <div className="text-white/90 font-medium max-w-[250px] truncate group-hover:text-white transition-colors text-xs">
                  {c.title}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-white/50 text-[11px]">
                    <ListOrdered size={12} className="text-white/20" />
                    <span>{c.steps?.filter(s => s.trim()).length || 0} Steps</span>
                  </div>
                  <div className="text-[10px] text-white/20 truncate max-w-[120px] italic">
                    {c.steps?.[0] ? `1. ${c.steps[0]}` : 'No sequence'}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><Badge>{c.module || 'Unassigned'}</Badge></td>
              <td className="px-4 py-3 text-center text-xs font-mono text-white/50">{c.round || 1}</td>
              <td className="px-4 py-3"><Badge variant={c.priority}>{c.priority}</Badge></td>
              <td className="px-4 py-3"><Badge variant={c.status}>{c.status}</Badge></td>
              <td className="px-4 py-3 text-center">
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
              <td className="px-4 py-3 text-[10px] text-white/40 border-l border-white/5">
                <div className="flex flex-col">
                  <span className="font-bold truncate max-w-[100px]">{c.lastUpdatedByName || '-'}</span>
                  <span className="text-white/20">{c.timestamp ? new Date(c.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onStatusUpdate(c.id, 'Passed')}
                    className="flex items-center justify-center w-7 h-7 rounded border border-transparent text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                    title="Mark Passed"
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <button
                    onClick={() => onStatusUpdate(c.id, 'Failed')}
                    className="flex items-center justify-center w-7 h-7 rounded border border-transparent text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Mark Failed"
                  >
                    <XCircle size={14} />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <button
                    onClick={() => onEdit(c)}
                    className="flex items-center justify-center w-7 h-7 rounded border border-transparent text-white/30 hover:text-blue-400 hover:border-blue-400/20 hover:bg-blue-400/10 transition-all"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="flex items-center justify-center w-7 h-7 rounded border border-transparent text-white/10 hover:text-red-500 hover:border-red-500/20 hover:bg-red-500/5 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={9} className="px-4 py-24 text-center">
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
    </div>
  );
};

export default TestCaseTable;
