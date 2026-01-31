import React, { useState, useEffect } from 'react';
import { XCircle, Code2, Play, FileJson, Sparkles } from 'lucide-react';
import Modal from './ui/Modal';
import AlertModal from './ui/AlertModal';
import { TestCase, Module, Priority, Status, PRIORITIES, STATUSES } from '../types';
import { generatePlaywrightScript } from '../utils/automationGenerator';

interface TestCaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId: string | null;
  modules: Module[];
  editingCase: TestCase | null;
  onSave: (data: Partial<TestCase>, isNew: boolean) => Promise<void>;
  onRun?: (testCase: TestCase) => Promise<boolean>;
}

const DEFAULT_FORM: Partial<TestCase> = {
  title: '',
  module: '',
  priority: 'Medium',
  status: 'Pending',
  steps: [''],
  expected: '',
  script: '',
  hasAutomation: false,
  automationSteps: []
};

const TestCaseForm: React.FC<TestCaseFormProps> = ({
  isOpen, onClose, activeProjectId, modules, editingCase, onSave, onRun
}) => {
  const [activeTab, setActiveTab] = useState<'doc' | 'auto'>('doc');
  const [form, setForm] = useState<Partial<TestCase>>(DEFAULT_FORM);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (editingCase) {
      setForm({ ...editingCase });
    } else {
      setForm({ ...DEFAULT_FORM, module: modules[0]?.name || '' });
    }
    setActiveTab('doc');
    setShowJsonInput(false);
    setJsonInput('');
  }, [isOpen, editingCase, modules]);

  const handleSave = async (silent = false, statusOverride?: Status) => {
    if (!form.title) {
      if (!silent) setAlertConfig({ message: "Verification Required: Please enter a 'Scenario Title' in the General Info tab before committing.", type: 'error' });
      setActiveTab('doc');
      return false;
    }
    if (!activeProjectId) {
      if (!silent) setAlertConfig({ message: "Error: No active project context found.", type: 'error' });
      return false;
    }

    const data = {
      ...form,
      status: statusOverride || form.status,
      projectId: activeProjectId,
      hasAutomation: !!(form.script && form.script.length > 0)
    };
    await onSave(data, !editingCase);
    if (!silent) onClose();
    return true;
  };

  const handleRun = async () => {
    if (onRun) {
      // Prepare current state
      const currentCase = {
        ...(editingCase || {}),
        ...form,
        id: editingCase?.id || `TEMP-${Date.now()}`
      } as TestCase;

      const success = await onRun(currentCase);

      if (success) {
        setForm(prev => ({ ...prev, status: 'Passed' }));
        // Call save with 'Passed' status explicitly to avoid stale state issues
        const saved = await handleSave(true, 'Passed');
        if (saved) onClose();
      } else {
        setForm(prev => ({ ...prev, status: 'Failed' }));
      }
    }
  };

  const updateSteps = (idx: number, val: string) => {
    const ns = [...(form.steps || [])];
    ns[idx] = val;
    setForm({ ...form, steps: ns });
  };

  const removeStep = (idx: number) => {
    setForm({ ...form, steps: form.steps?.filter((_, i) => i !== idx) });
  };

  const handleImportJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array of steps.");

      const generatedCode = generatePlaywrightScript(parsed);

      // --- Smart Metadata Extraction ---
      const firstStep = parsed[0] || {};
      const lastStep = parsed[parsed.length - 1] || {};

      // 1. Better Title
      let smartTitle = "New Automation Scenario";
      try {
        const url = new URL(firstStep.url || 'https://app.local');
        const hostname = url.hostname.replace('www.', '');
        smartTitle = `Verify User Flow on ${hostname} `;

        // Contextual title refinement
        const hasLogin = parsed.some((s: any) => JSON.stringify(s).toLowerCase().includes('login') || JSON.stringify(s).toLowerCase().includes('password'));
        const hasAdmin = parsed.some((s: any) => JSON.stringify(s).toLowerCase().includes('admin'));
        const hasCart = parsed.some((s: any) => JSON.stringify(s).toLowerCase().includes('cart') || JSON.stringify(s).toLowerCase().includes('checkout'));

        if (hasLogin) smartTitle = `Verify Authentication & Login - ${hostname} `;
        if (hasAdmin) smartTitle = `Verify Administrative Access - ${hostname} `;
        if (hasCart) smartTitle = `Verify E - commerce Checkout Flow - ${hostname} `;
      } catch (e) { /* fallback to default */ }

      // 2. Generate Human Readable Steps
      const humanSteps = parsed.map((s: any, i: number) => {
        const action = s.type === 'CLICK' ? 'Click' : 'Input data into';
        let target = s.text && s.text !== 'No text' ? s.text : (s.placeholder || s.name || s.id || s.tagName);
        if (target && target.length > 50) target = target.substring(0, 47) + '...';
        return `${action} ${target || 'element'} `;
      }).filter((s: string) => s.trim().length > 0);

      // 3. Estimate Priority
      let priority: any = 'Medium';
      const criticalKeywords = ['login', 'password', 'pay', 'checkout', 'admin', 'delete', 'secure', 'auth'];
      if (parsed.some((s: any) => criticalKeywords.some(k => JSON.stringify(s).toLowerCase().includes(k)))) {
        priority = 'Critical';
      } else if (parsed.length > 10) {
        priority = 'High';
      }

      // 4. Expected result
      const expected = `All ${parsed.length} automated steps should execute without errors, validating the path on ${firstStep.url || 'the target application'}.`;

      // 5. Intelligent Module Matching
      let module = form.module || '';
      if (modules.length > 0) {
        const matchedModule = modules.find(m =>
          smartTitle.toLowerCase().includes(m.name.toLowerCase()) ||
          (firstStep.url && firstStep.url.toLowerCase().includes(m.name.toLowerCase()))
        );
        module = matchedModule ? matchedModule.name : (module || modules[0].name);
      }

      setForm({
        ...form,
        title: smartTitle,
        steps: humanSteps.length > 0 ? humanSteps : ['Execute automated script'],
        priority,
        expected,
        module,
        script: generatedCode,
        automationSteps: parsed,
        hasAutomation: true,
        status: 'Pending'
      });

      setShowJsonInput(false);
      setJsonInput('');
    } catch (e: any) {
      setAlertConfig({ message: "Invalid JSON: " + e.message, type: 'error' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCase ? `Modify ${editingCase.id} ` : 'Create Scenario'}
      footer={
        <div className="flex gap-3">
          <button onClick={() => handleSave()} className="bg-white text-black px-8 py-2.5 rounded-sm text-xs font-bold hover:bg-white/90 transition-all uppercase tracking-widest shadow-lg">
            Commit Changes
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-white/5 mb-2">
          <div className="flex gap-6">
            <button onClick={() => setActiveTab('doc')} className={`pb - 2 text - [11px] font - bold uppercase tracking - wider transition - all border - b - 2 ${activeTab === 'doc' ? 'text-white border-white' : 'text-white/30 border-transparent hover:text-white/60'} `}>General Info</button>
            <button onClick={() => setActiveTab('auto')} className={`pb - 2 text - [11px] font - bold uppercase tracking - wider transition - all border - b - 2 ${activeTab === 'auto' ? 'text-white border-white' : 'text-white/30 border-transparent hover:text-white/60'} `}>Automation Hub</button>
          </div>
          {activeTab === 'auto' && form.hasAutomation && (
            <button
              onClick={handleRun}
              className="flex items-center gap-2 px-4 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] mb-2"
            >
              <Play size={12} fill="currentColor" /> RUN SCRIPT
            </button>
          )}
        </div>

        {activeTab === 'doc' ? (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Scenario Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-sm px-3 py-2 outline-none focus:border-white/20 transition-all text-xs text-white" placeholder="Verify user can..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Module</label>
                  <select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none cursor-pointer text-xs text-white appearance-none focus:border-white/20">
                    <option value="">Unassigned</option>
                    {modules.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Round</label>
                  <input type="number" min="1" value={form.round || 1} onChange={(e) => setForm({ ...form, round: parseInt(e.target.value) })} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none text-xs text-white focus:border-white/20 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none cursor-pointer text-xs text-white appearance-none focus:border-white/20">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2 outline-none cursor-pointer text-xs text-white appearance-none focus:border-white/20">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Execution Steps Sequence</label>
                <button onClick={() => setForm({ ...form, steps: [...(form.steps || []), ''] })} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider">+ Add Node</button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar bg-white/[0.01] p-2 rounded border border-white/5">
                {form.steps?.map((s, i) => (
                  <div key={i} className="flex gap-2 group">
                    <span className="w-6 text-white/20 pt-2 text-[10px] text-center font-mono select-none">{String(i + 1).padStart(2, '0')}</span>
                    <input type="text" value={s} onChange={(e) => updateSteps(i, e.target.value)} className="flex-1 bg-transparent border-b border-white/5 group-hover:border-white/10 px-2 py-1.5 outline-none text-xs transition-all text-white focus:border-blue-500/50 focus:bg-white/[0.02]" placeholder="Step description..." />
                    <button onClick={() => removeStep(i)} className="text-white/5 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"><XCircle size={14} /></button>
                  </div>
                ))}
                {(!form.steps || form.steps.length === 0) && <div className="text-center py-4 text-white/10 text-xs italic">No steps defined.</div>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Expected Success Criteria</label>
              <input type="text" value={form.expected} onChange={(e) => setForm({ ...form, expected: e.target.value })} className="w-full bg-blue-500/[0.05] border border-blue-500/20 rounded-sm px-3 py-2.5 outline-none text-blue-100 text-xs placeholder-blue-300/30" placeholder="Final result expectations..." />
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest flex items-center gap-2">
                  <Code2 size={12} className="text-emerald-500" /> Automation Logic Core (JS/TS)
                </label>
                <p className="text-[10px] text-white/10 font-medium italic">High-performance Playwright execution engine.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowJsonInput(!showJsonInput)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/60 hover:text-white transition-all border border-white/5"
                >
                  <FileJson size={12} /> {showJsonInput ? 'CANCEL' : 'IMPORT JSON'}
                </button>
              </div>
            </div>

            {showJsonInput && (
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full h-32 bg-[#0a0a0a] border border-blue-500/30 rounded-sm p-3 font-mono text-[10px] text-blue-400 outline-none focus:border-blue-500 transition-all placeholder:text-blue-900"
                  placeholder="Paste steps JSON here... [ { 'type': 'CLICK', ... }, ... ]"
                />
                <button
                  onClick={handleImportJSON}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={12} /> Generate Automation Logic
                </button>
              </div>
            )}

            <div className="relative group flex-1 min-h-0">
              <textarea
                value={form.script}
                onChange={(e) => setForm({ ...form, script: e.target.value })}
                className="w-full h-80 bg-[#000000] border border-white/10 rounded-sm p-4 font-mono text-[11px] text-emerald-500/90 outline-none focus:border-emerald-500/30 custom-scrollbar leading-relaxed resize-none shadow-inner group-hover:border-white/20 transition-all"
                placeholder={`// Write automation script here\n\nconst verify = async () => {\n  await page.click('#submit');\n  return expect(page).toHaveText('Success');\n}`}
              />
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-[8px] font-bold text-emerald-500/60 flex items-center gap-1">
                  <Code2 size={10} /> JS/PLAYWRIGHT
                </div>
              </div>
            </div >
          </div >
        )}
      </div >
      <AlertModal
        isOpen={!!alertConfig}
        onClose={() => setAlertConfig(null)}
        message={alertConfig?.message || ''}
        type={alertConfig?.type}
      />
    </Modal >
  );
};

export default TestCaseForm;
