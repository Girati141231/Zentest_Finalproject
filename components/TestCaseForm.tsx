import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import Modal from './ui/Modal';
import { TestCase, Module, PRIORITIES, STATUSES } from '../types';

interface TestCaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId: string | null;
  modules: Module[];
  editingCase: TestCase | null;
  onSave: (data: Partial<TestCase>, isNew: boolean) => Promise<void>;
}

const DEFAULT_FORM: Partial<TestCase> = {
  title: '',
  module: '',
  priority: 'Medium',
  status: 'Pending',
  steps: [''],
  expected: '',
  script: '',
  hasAutomation: false
};

const TestCaseForm: React.FC<TestCaseFormProps> = ({
  isOpen, onClose, activeProjectId, modules, editingCase, onSave
}) => {
  const [activeTab, setActiveTab] = useState<'doc' | 'auto'>('doc');
  const [form, setForm] = useState<Partial<TestCase>>(DEFAULT_FORM);

  useEffect(() => {
    if (editingCase) {
      setForm({ ...editingCase });
    } else {
      setForm({ ...DEFAULT_FORM, module: modules[0]?.name || '' });
    }
    setActiveTab('doc');
  }, [isOpen, editingCase, modules]);

  const handleSave = async () => {
    if (!form.title || !activeProjectId) return;
    const data = { 
      ...form, 
      projectId: activeProjectId,
      hasAutomation: !!(form.script && form.script.length > 0)
    };
    await onSave(data, !editingCase);
    onClose();
  };

  const updateSteps = (idx: number, val: string) => {
    const ns = [...(form.steps || [])];
    ns[idx] = val;
    setForm({ ...form, steps: ns });
  };

  const removeStep = (idx: number) => {
    setForm({ ...form, steps: form.steps?.filter((_, i) => i !== idx) });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingCase ? `Modify ${editingCase.id}` : 'Create Scenario'}
      footer={
        <button onClick={handleSave} className="bg-white text-black px-8 py-2.5 rounded-sm text-xs font-bold hover:bg-white/90 transition-all uppercase tracking-widest shadow-lg">
          Commit Changes
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex gap-6 border-b border-white/5 mb-2">
          <button onClick={() => setActiveTab('doc')} className={`pb-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'doc' ? 'text-white border-white' : 'text-white/30 border-transparent hover:text-white/60'}`}>General Info</button>
          <button onClick={() => setActiveTab('auto')} className={`pb-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'auto' ? 'text-white border-white' : 'text-white/30 border-transparent hover:text-white/60'}`}>Automation Hub</button>
        </div>

        {activeTab === 'doc' ? (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Scenario Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-sm px-3 py-2 outline-none focus:border-white/20 transition-all text-xs text-white" placeholder="Verify user can..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Module</label>
                <select value={form.module} onChange={(e) => setForm({...form, module: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none cursor-pointer text-xs text-white appearance-none focus:border-white/20">
                  <option value="">Unassigned</option>
                  {modules.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value as any})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none cursor-pointer text-xs text-white appearance-none focus:border-white/20">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Status</label>
                <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value as any})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none cursor-pointer text-xs text-white appearance-none focus:border-white/20">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Execution Steps Sequence</label>
                <button onClick={() => setForm({...form, steps: [...(form.steps || []), '']})} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider">+ Add Node</button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar bg-white/[0.01] p-2 rounded border border-white/5">
                {form.steps?.map((s, i) => (
                  <div key={i} className="flex gap-2 group">
                    <span className="w-6 text-white/20 pt-2 text-[10px] text-center font-mono select-none">{String(i+1).padStart(2, '0')}</span>
                    <input type="text" value={s} onChange={(e) => updateSteps(i, e.target.value)} className="flex-1 bg-transparent border-b border-white/5 group-hover:border-white/10 px-2 py-1.5 outline-none text-xs transition-all text-white focus:border-blue-500/50 focus:bg-white/[0.02]" placeholder="Step description..." />
                    <button onClick={() => removeStep(i)} className="text-white/5 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"><XCircle size={14}/></button>
                  </div>
                ))}
                {(!form.steps || form.steps.length === 0) && <div className="text-center py-4 text-white/10 text-xs italic">No steps defined.</div>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Expected Success Criteria</label>
              <input type="text" value={form.expected} onChange={(e) => setForm({...form, expected: e.target.value})} className="w-full bg-blue-500/[0.05] border border-blue-500/20 rounded-sm px-3 py-2.5 outline-none text-blue-100 text-xs placeholder-blue-300/30" placeholder="Final result expectations..." />
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">
            <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest block">Automation Logic Core (JS/TS)</label>
            <textarea 
              value={form.script} 
              onChange={(e) => setForm({...form, script: e.target.value})}
              className="w-full h-80 bg-[#000000] border border-white/10 rounded-sm p-4 font-mono text-[11px] text-emerald-500/90 outline-none focus:border-emerald-500/30 custom-scrollbar leading-relaxed resize-none shadow-inner"
              placeholder={`// Write automation script here\n\nconst verify = async () => {\n  await page.click('#submit');\n  return expect(page).toHaveText('Success');\n}`}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TestCaseForm;
