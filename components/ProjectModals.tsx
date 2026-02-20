import React, { useState, useEffect } from 'react';
import { Check, Copy, Trash2, LogOut, Upload, X, RotateCcw } from 'lucide-react';
import Modal from './ui/Modal';
import ConfirmModal from './ui/ConfirmModal';
import AlertModal from './ui/AlertModal';
import { Project, COLORS, Module, ModalMode, ProjectMember } from '../types';
import { ProjectService } from '../services/db';

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
  const [form, setForm] = useState({ name: '', color: COLORS[0], photoURL: '' });
  const [joinCode, setJoinCode] = useState('');
  const [discoveredProject, setDiscoveredProject] = useState<Project | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [newModName, setNewModName] = useState('');
  const [editingModId, setEditingModId] = useState<string | null>(null);
  const [editingModName, setEditingModName] = useState('');
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);

  useEffect(() => {
    if (mode === 'edit' && activeProject?.id) {
      const unsub = ProjectService.getMembers(activeProject.id, (data) => {
        const sorted = data.sort((a, b) => {
          if (a.role === 'owner') return -1;
          if (b.role === 'owner') return 1;
          return a.displayName.localeCompare(b.displayName);
        });
        setMembers(sorted);

        if (user && user.uid !== 'demo-user') {
          const me = data.find(m => m.uid === user.uid);
          if (me && (me.photoURL !== user.photoURL || me.displayName !== user.displayName)) {
            ProjectService.syncMemberProfile(activeProject.id, user);
          }
        }
      });
      return () => { if (unsub) unsub(); };
    }
  }, [mode, activeProject, user]);

  useEffect(() => {
    if (mode === 'edit' && activeProject) {
      setForm({ name: activeProject.name, color: activeProject.color, photoURL: activeProject.photoURL || '' });
    } else {
      setForm({ name: '', color: COLORS[0], photoURL: '' });
      setJoinCode('');
      setDiscoveredProject(null);
    }
  }, [mode, activeProject]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (mode === 'join' && joinCode.length >= 6) {
        setIsSearching(true);
        try {
          const project = await ProjectService.getProjectPreview(joinCode);
          setDiscoveredProject(project);
        } catch (error) {
          setDiscoveredProject(null);
        } finally {
          setIsSearching(false);
        }
      } else {
        setDiscoveredProject(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [joinCode, mode]);

  const handleResetInviteCode = async () => {
    if (!activeProject?.id) return;
    setConfirmConfig({
      title: 'Reset Invitation Code?',
      message: 'The current code will stop working immediately. People with the old code will no longer be able to join.',
      onConfirm: async () => {
        await ProjectService.resetInviteCode(activeProject.id);
        setAlertConfig({ message: 'Invitation code has been refreshed.', type: 'success' });
        setConfirmConfig(null);
      }
    });
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      setAlertConfig({ message: "Image is too large (max 500KB).", type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, photoURL: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <Modal
      isOpen={mode !== null}
      onClose={onClose}
      maxWidth={(mode === 'create' || mode === 'join') ? "max-w-4xl" : "max-w-2xl"}
      title={
        mode === 'create' ? "Create New Project" :
          mode === 'join' ? "Join Project" :
            "Project Settings"
      }
    >
      {mode === 'join' ? (
        <div className="flex flex-col lg:flex-row gap-8 relative min-h-[350px]">
          <div className="absolute -inset-20 opacity-[0.06] blur-[120px] pointer-events-none transition-colors duration-1000 ease-out rounded-full"
            style={{ backgroundColor: discoveredProject?.color || '#3b82f6' }} />

          <div className="flex-1 space-y-6 z-10 flex flex-col justify-center">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em]">Invitation Code</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-sm px-4 py-4 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.05] transition-all text-lg font-mono font-bold text-white placeholder:text-white/5 tracking-[0.2em]"
                    placeholder="ZEN-XXXX"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-white/20 italic">Ask the owner for the 8-character invitation code.</p>
              </div>
              <button
                onClick={() => onJoin(joinCode)}
                disabled={!discoveredProject || isSearching}
                className={`w-full py-4 rounded-sm text-xs font-bold transition-all uppercase tracking-[0.25em] shadow-xl active:scale-[0.98] ${discoveredProject ? 'bg-blue-600 text-white hover:bg-blue-500 px-8' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}`}
                style={{ boxShadow: discoveredProject ? `0 10px 30px -10px #2563eb66` : 'none' }}
              >
                {isSearching ? 'Verifying...' : 'Authenticate & Join'}
              </button>
            </div>
          </div>

          <div className="w-full lg:w-[320px] flex flex-col z-10">
            <label className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em] mb-4">Workspace Preview</label>
            <div className={`flex-1 rounded-xl border transition-all duration-500 flex flex-col items-center justify-center text-center p-6 ${discoveredProject ? 'bg-gradient-to-b from-white/[0.08] to-transparent border-white/20 shadow-2xl' : 'bg-white/[0.02] border-white/5 opacity-50'}`}>
              {discoveredProject ? (
                <>
                  <div className="w-20 h-20 rounded-2xl mb-6 relative overflow-hidden p-0.5" style={{ background: `linear-gradient(135deg, ${discoveredProject.color}, ${discoveredProject.color}dd)`, boxShadow: `0 0 40px -10px ${discoveredProject.color}80` }}>
                    <div className="w-full h-full bg-[#0a0a0a] rounded-[14px] flex items-center justify-center overflow-hidden">
                      {discoveredProject.photoURL ? <img src={discoveredProject.photoURL} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-3xl font-bold text-white/40">{discoveredProject.name?.[0]?.toUpperCase()}</span>}
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2 tracking-tight">{discoveredProject.name}</h4>
                  <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: discoveredProject.color }} />
                    <span className="text-[9px] text-white/50 uppercase font-black tracking-widest">Validated ID</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 opacity-10">
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-white flex items-center justify-center"><Check size={32} /></div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Enter valid code</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : mode === 'create' ? (
        <div className="flex flex-col lg:flex-row gap-8 relative min-h-[400px]">
          <div className="absolute -inset-20 opacity-[0.08] blur-[120px] pointer-events-none transition-colors duration-1000 rounded-full" style={{ backgroundColor: form.color }} />
          <div className="flex-1 space-y-8 z-10">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Project Name</label>
                <input type="text" value={form.name} autoFocus onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-sm px-4 py-3 outline-none focus:border-indigo-500/50 transition-all text-sm text-white" placeholder="Enter name..." />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Brand Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c: string) => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-4 ring-offset-[#0a0a0a]' : 'opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Workspace Cover</label>
                <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-dashed border-white/10 rounded-sm hover:border-white/20 transition-colors cursor-pointer" onClick={() => document.getElementById('project-upload-c')?.click()}>
                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                    {form.photoURL ? <img src={form.photoURL} className="w-full h-full object-cover" /> : <Upload size={20} className="text-white/20" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-white/60">Upload Cover</p>
                    <p className="text-[9px] text-white/20 uppercase tracking-tighter">Max 500KB</p>
                  </div>
                  <input id="project-upload-c" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
              </div>
            </div>
            <button onClick={handleSave} disabled={!form.name.trim()} className={`w-full py-4 rounded-sm text-xs font-bold transition-all uppercase tracking-[0.2em] shadow-xl ${form.name.trim() ? 'bg-white text-black hover:bg-zinc-200' : 'bg-white/5 text-white/10 cursor-not-allowed'}`} style={{ boxShadow: form.name.trim() ? `0 10px 30px -10px ${form.color}66` : 'none' }}>Create Project</button>
          </div>
          <div className="w-full lg:w-[320px] flex flex-col z-10">
            <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-4">Preview</label>
            <div className="flex-1 rounded-xl bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="w-20 h-20 rounded-2xl mb-6 relative overflow-hidden p-0.5" style={{ background: `linear-gradient(135deg, ${form.color}, ${form.color}dd)`, boxShadow: `0 0 40px -10px ${form.color}80` }}>
                <div className="w-full h-full bg-[#0a0a0a] rounded-[14px] flex items-center justify-center overflow-hidden">
                  {form.photoURL ? <img src={form.photoURL} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-3xl font-bold text-white/40">{form.name?.[0]?.toUpperCase() || 'Z'}</span>}
                </div>
              </div>
              <h4 className="text-lg font-bold text-white mb-2 tracking-tight line-clamp-1">{form.name || "Project Name"}</h4>
              <div className="flex items-center gap-2 mb-6"><div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: form.color }} /><span className="text-[10px] text-white/40 uppercase font-bold tracking-widest italic">Live Preview</span></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Invitation Code</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/[0.05] border border-white/10 rounded-sm px-3 py-2.5 text-xs text-blue-400 font-mono font-bold tracking-widest flex items-center justify-between">
                    {activeProject?.inviteCode || 'N/A'}
                    <button onClick={() => { if (activeProject?.inviteCode) { navigator.clipboard.writeText(activeProject.inviteCode); setAlertConfig({ message: 'Copied!', type: 'success' }); } }} className="ml-2 text-white/20 hover:text-white p-1 hover:bg-white/5 rounded transition-all"><Copy size={12} /></button>
                  </div>
                  <button onClick={handleResetInviteCode} className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-white/40 hover:text-white transition-all group" title="Reset Code"><RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /></button>
                </div>
                <p className="text-[9px] text-white/20">Members join using this code.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Branding</label>
                <div className="flex flex-col gap-4 p-4 bg-white/[0.02] border border-white/10 rounded-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg border border-white/10 flex items-center justify-center bg-white/5 overflow-hidden relative group cursor-pointer" onClick={() => document.getElementById('p-image-edit')?.click()}>
                      {form.photoURL ? <img src={form.photoURL} className="w-full h-full object-cover" /> : <Upload size={16} className="text-white/20" />}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Upload size={14} className="text-white" /></div>
                      <input id="p-image-edit" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </div>
                    <div className="flex-1">
                      <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-transparent border-b border-white/10 text-sm font-bold text-white outline-none focus:border-white/30 transition-all pb-1" placeholder="Project Name" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c: string) => (
                      <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-1 ring-white ring-offset-2 ring-offset-[#0a0a0a]' : 'opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={handleSave} className="w-full py-3 bg-white text-black rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all font-sans">Update Settings</button>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest block">Team Management</label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {members.map((member) => (
                  <div key={member.uid} className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 rounded-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-500/20 overflow-hidden flex items-center justify-center">
                        {member.photoURL ? <img src={member.photoURL} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-blue-400">{member.displayName?.[0]}</span>}
                      </div>
                      <div className="flex flex-col"><span className="text-[11px] font-bold text-white/90">{member.displayName} {member.uid === user.uid && "(You)"}</span><span className="text-[9px] text-white/40">{member.role}</span></div>
                    </div>
                    {activeProject?.owner === user.uid && member.role !== 'owner' && (
                      <button onClick={() => ProjectService.kickMember(activeProject!.id, member.uid)} className="text-white/10 hover:text-red-500 transition-colors"><X size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-red-500/10 opacity-50 hover:opacity-100 transition-opacity">
            <button onClick={() => { if (activeProject?.owner === user.uid) onDelete(activeProject!.id, true); else onDelete(activeProject!.id, false); }} className="w-full py-3 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all">
              {activeProject?.owner === user.uid ? "Destroy Project Permanently" : "Leave Project"}
            </button>
          </div>
        </div>
      )}

      {confirmConfig && <ConfirmModal isOpen={true} onClose={() => setConfirmConfig(null)} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} />}
      <AlertModal isOpen={!!alertConfig} onClose={() => setAlertConfig(null)} message={alertConfig?.message || ''} type={alertConfig?.type} />
    </Modal>
  );
};

export default ProjectModals;