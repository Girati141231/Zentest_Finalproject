import React, { useState, useEffect } from 'react';
import { Check, Copy, Trash2, LogOut } from 'lucide-react';
import Modal from './ui/Modal';
import { Project, COLORS, Module, ModalMode } from '../types';

interface ProjectModalsProps {
  mode: ModalMode;
  onClose: () => void;
  activeProject: Project | undefined;
  user: any;
  modules: Module[];
  onSave: (data: any) => Promise<void>;
  onJoin: (code: string) => Promise<void>;
  onDelete: (id: string, isOwner: boolean) => Promise<void>;
  onAddModule: (name: string) => Promise<void>;
  onUpdateModule: (id: string, name: string) => Promise<void>;
  onDeleteModule: (id: string) => Promise<void>;
}

const ProjectModals: React.FC<ProjectModalsProps> = ({
  mode, onClose, activeProject, user, modules, onSave, onJoin, onDelete, onAddModule, onUpdateModule, onDeleteModule
}) => {
  const [form, setForm] = useState({ name: '', color: COLORS[0] });
  const [joinCode, setJoinCode] = useState('');
  const [newModName, setNewModName] = useState('');
  const [editingModId, setEditingModId] = useState<string | null>(null);
  const [editingModName, setEditingModName] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && activeProject) {
      setForm({ name: activeProject.name, color: activeProject.color });
    } else {
      setForm({ name: '', color: COLORS[0] });
      setJoinCode('');
    }
  }, [mode, activeProject]);

  const handleCopyId = () => {
    if (activeProject) {
      navigator.clipboard.writeText(activeProject.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!form.name) return;
    await onSave(form);
    onClose();
  };

  const handleUpdateModule = async (id: string) => {
    if (!editingModName.trim()) return;
    await onUpdateModule(id, editingModName);
    setEditingModId(null);
  };

  return (
    <Modal
      isOpen={mode !== null}
      onClose={onClose}
      title={
        mode === 'create' ? "Initialize New Scope" :
          mode === 'join' ? "Join Existing Scope" :
            "Scope Configuration"
      }
    >
      {mode === 'join' ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Scope Identifier</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-sm px-4 py-3 outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all text-xs text-white font-mono placeholder:text-white/10"
              placeholder="e.g. x8Y7z9..."
            />
            <p className="text-[10px] text-white/30 italic">Obtain this code from the project owner's settings.</p>
          </div>
          <button
            onClick={() => onJoin(joinCode)}
            className="w-full bg-blue-600 text-white py-2.5 rounded-sm text-[11px] font-bold transition-all hover:bg-blue-500 uppercase tracking-widest hover:shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            Authenticate & Join
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Scope Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-sm px-3 py-2.5 outline-none focus:border-white/20 transition-all text-xs text-white"
                placeholder="Enter scope name..."
              />
              <button
                onClick={handleSave}
                className="w-full mt-4 bg-white text-black py-2.5 rounded-sm text-[11px] font-bold transition-all hover:bg-white/90 uppercase tracking-widest"
              >
                {mode === 'create' ? 'Deploy Scope' : 'Update Registry'}
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Identity Color</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-30 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {mode === 'edit' && activeProject && (
            <>
              <div className="pt-6 border-t border-white/5">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest block mb-2">Share Scope Identifier</label>
                <div className="flex items-center gap-2 bg-black p-2 rounded-sm border border-white/10 group hover:border-white/20 transition-colors">
                  <span className="text-[10px] font-mono text-white/60 truncate flex-1 px-2">{activeProject.id}</span>
                  <button onClick={handleCopyId} className="p-1.5 hover:text-emerald-400 transition-colors text-white/40">
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest block mb-3">Module Registry</label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newModName}
                    onChange={(e) => setNewModName(e.target.value)}
                    placeholder="New unit ID..."
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-sm px-3 py-2 outline-none text-xs text-white focus:border-white/20"
                  />
                  <button
                    onClick={() => { onAddModule(newModName); setNewModName(''); }}
                    className="bg-white/5 border border-white/5 px-4 rounded-sm font-bold hover:bg-white/10 hover:border-white/20 text-[10px] tracking-widest transition-all"
                  >
                    ADD UNIT
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {modules.map(m => (
                    <div key={m.id} className="flex justify-between items-center p-2.5 bg-white/[0.02] border border-white/5 rounded-sm group hover:bg-white/[0.04] transition-colors relative">
                      {editingModId === m.id ? (
                        <input
                          autoFocus
                          value={editingModName}
                          onChange={(e) => setEditingModName(e.target.value)}
                          onBlur={() => handleUpdateModule(m.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateModule(m.id)}
                          className="bg-black border border-white/20 text-[11px] font-bold text-white px-2 py-0.5 w-full outline-none"
                        />
                      ) : (
                        <span
                          className="text-[11px] truncate uppercase font-bold tracking-tight text-white/60 pl-1 cursor-pointer hover:text-white transition-colors"
                          onClick={() => { setEditingModId(m.id); setEditingModName(m.name); }}
                          title="Click to Rename"
                        >
                          {m.name}
                        </span>
                      )}
                      <button onClick={() => onDeleteModule(m.id)} className="text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 pr-1"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-red-500/10">
                <label className="text-[10px] text-red-500/40 uppercase font-bold block mb-3 italic tracking-widest">Danger Zone</label>
                {activeProject.owner === user.uid ? (
                  <button
                    onClick={() => onDelete(activeProject.id, true)}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-red-500/20 text-red-500 hover:text-white hover:bg-red-500 rounded-sm text-[11px] font-bold transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                  >
                    <Trash2 size={14} /> DELETE PROJECT PERMANENTLY
                  </button>
                ) : (
                  <button
                    onClick={() => onDelete(activeProject.id, false)}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-red-500/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 rounded-sm text-[11px] font-bold transition-all uppercase tracking-widest"
                  >
                    <LogOut size={14} /> Disconnect / Leave Scope
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ProjectModals;