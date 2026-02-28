import React, { useState, useEffect } from 'react';
import { XCircle, Code2, Play, FileJson, Sparkles, Folder, FileCode, RotateCcw, Trash2, FolderOpen, CheckCircle2, Copy, Check, Key } from 'lucide-react';
import Modal from './ui/Modal';
import AlertModal from './ui/AlertModal';
import { TestCase, Module, Priority, Status, PRIORITIES, STATUSES } from '../types';

interface TestCaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId: string | null;
  modules: Module[];
  editingCase: TestCase | null;
  onSave: (data: Partial<TestCase>, isNew: boolean) => Promise<void>;
  onRun?: (testCase: TestCase) => Promise<any>;
  onAlert?: (message: string, type: 'info' | 'success' | 'error') => void;
  user: any;
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
  isOpen, onClose, activeProjectId, modules, editingCase, onSave, onRun, onAlert, user
}) => {
  const [activeTab, setActiveTab] = useState<'doc' | 'auto'>('doc');
  const [form, setForm] = useState<Partial<TestCase>>(DEFAULT_FORM);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Automation Library States
  const [library, setLibrary] = useState<any[]>([]);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<string>>(new Set());
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isEditingJson, setIsEditingJson] = useState(false);
  const [isBrowsingLibrary, setIsBrowsingLibrary] = useState(false);
  const [rawJson, setRawJson] = useState('');
  const [originalJson, setOriginalJson] = useState('');
  const [copied, setCopied] = useState(false);
  const [stagedScript, setStagedScript] = useState<any | null>(null);
  // NEW: Track which library script is being edited
  const [editingLibraryId, setEditingLibraryId] = useState<string | null>(null);

  useEffect(() => {
    if (editingCase) {
      setForm({ ...editingCase });
    } else {
      setForm({ ...DEFAULT_FORM, module: modules[0]?.name || '' });
    }
    setActiveTab('doc');
  }, [isOpen, editingCase, modules]);

  useEffect(() => {
    if (isOpen && activeProjectId) {
      fetchLibrary();
    }
  }, [isOpen, activeProjectId]);

  const fetchLibrary = async () => {
    if (!activeProjectId) return;
    setIsLoadingLibrary(true);
    try {
      const response = await fetch(`http://localhost:3002/list-automation/${activeProjectId}`);
      const data = await response.json();

      // Small artificial delay so the user can see the spin animation
      await new Promise(r => setTimeout(r, 600));
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setLibrary(data);
      } else {
        console.warn('Library data is not an array:', data);
        setLibrary([]);
      }
    } catch (e) {
      console.error('Failed to fetch library', e);
      setLibrary([]);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const generateSmartDocumentation = (autoSteps: any[], scenarioName: string) => {
    // 1. Generate Thai human-readable steps
    const readableSteps = (autoSteps || []).map((s: any, i: number) => {
      if (i === 0 && s.url) return `เข้าหน้าเว็บ: ${s.url}`;
      if (s.type === 'CLICK') return `กดปุ่ม [${s.text && s.text !== 'No text' ? s.text : s.tagName}]`;
      if (s.type === 'INPUT') return `พิมพ์คำว่า "${s.value}" ในช่อง [${s.placeholder || s.tagName}]`;
      if (s.type === 'KEYDOWN' && s.key === 'Enter') return `กดปุ่ม Enter`;
      if (s.type === 'SCROLL') return `เลื่อนหน้าจอลงเพื่อหาปุ่มหรือข้อมูลที่ต้องการ`;
      if (s.type === 'ASSERT_URL') return `เช็คว่าหน้าเว็บเปลี่ยนไปเป็นหน้า: ${s.value}`;
      if (s.type === 'ASSERT_VISIBLE') return `หน้าจอต้องโชว์ข้อมูล: [${s.text || s.placeholder || s.tagName}]`;
      return `${s.type}: ปฏิบัติขั้นตอนที่ ${i + 1}`;
    });

    // 2. Assess Priority (Thai/English Keywords)
    let assessedPriority: Priority = 'Medium';
    const name = (scenarioName || '').toLowerCase();
    const highKeywords = /login|pay|checkout|register|critical|submit|order|ชำระเงิน|ตะกร้า|สมัคร|เข้าสู่ระบบ|สำคัญ/;
    const lowKeywords = /ui|visual|color|font|text|สี|ฟอนต์|หน้าตา|ความสวยงาม/;

    if (name.match(highKeywords) || (autoSteps?.length > 10)) {
      assessedPriority = 'High';
    } else if (name.match(lowKeywords)) {
      assessedPriority = 'Low';
    }

    // 3. Generate Structured Expected Result
    const cleanName = scenarioName.replace(/^TC-\d+-?/, '').replace(/_/g, ' ').trim() || 'การทำงานที่กำหนด';
    const lastAssert = [...(autoSteps || [])].reverse().find(s => s.type?.startsWith('ASSERT_'));

    let functionalExp = "";
    const lowerName = cleanName.toLowerCase();

    if (lowerName.includes('login') || lowerName.includes('เข้าสู่ระบบ')) {
      functionalExp = "เข้าระบบได้สำเร็จ และข้อมูลผู้ใช้ต้องแสดงขึ้นมาถูกต้องตามสิทธิ์";
    } else if (lastAssert?.type === 'ASSERT_URL') {
      const pageName = lastAssert.value.split('/').pop() || 'หน้าถัดไป';
      functionalExp = `หน้าจอต้องเปลี่ยนไปเป็นหน้า [${pageName}] และแสดงเนื้อหาได้ครบถ้วนไม่ค้าง`;
    } else if (lastAssert?.text) {
      functionalExp = `ต้องเห็นข้อความ "${lastAssert.text}" ปรากฏบนหน้าจอเพื่อยืนยันว่าทำรายการสำเร็จ`;
    } else {
      functionalExp = `ทุกขั้นตอนใน [${cleanName}] ต้องทำงานได้ราบรื่นจนจบ และไม่มีข้อความแจ้งเตือนผิดพลาด`;
    }

    const uiUxExp = "หน้าตาเว็บต้องอ่านง่าย ปุ่มกดแล้วตอบสนองทันที และไม่มีตัวหนังสือหรือรูปภาพทับซ้อนกัน";
    const performanceExp = "หน้าเว็บต้องโหลดข้อมูลขึ้นมาให้เห็นครบภายใน 2 วินาที ไม่ปล่อยให้รอหมุนค้างนาน";

    const expectedResult = `Functional: ${functionalExp}\nUI/UX: ${uiUxExp}\nPerformance: ${performanceExp}`;

    return {
      steps: readableSteps,
      priority: assessedPriority,
      expected: expectedResult
    };
  };

  const applySmartAssertions = (steps: any[], name: string) => {
    const finalSteps = [...(steps || [])];
    const scenarioName = name || 'Scenario';
    const lowerName = scenarioName.toLowerCase();
    const isLogin = lowerName.includes('login') ||
      finalSteps.some((s: any) => s.name === 'password' || s.placeholder?.toLowerCase().includes('password'));

    // Detect if this is a "Negative Test" (Expect failure)
    const isNegativeTest = lowerName.includes('fail') || lowerName.includes('error') || lowerName.includes('invalid') || lowerName.includes('ผิด') || lowerName.includes('ไม่ถูกต้อง');

    // FIX: If Negative Test, remove any existing ASSERT_URL at the end because it's likely a false positive from the Recorder
    if (isNegativeTest) {
      const lastStep = finalSteps[finalSteps.length - 1];
      if (lastStep && lastStep.type === 'ASSERT_URL') {
        finalSteps.pop(); // Remove the misleading URL check
      }
    }

    const hasAssertion = finalSteps.some((s: any) => s.type?.startsWith('ASSERT_'));

    if (isLogin && finalSteps.length > 0) {
      if (isNegativeTest) {
        if (!hasAssertion) {
          finalSteps.push({
            type: 'ASSERT_TEXT',
            value: 'Username and password do not match',
            note: 'Triple Check Rule 2: Failure validation'
          });
        }
      } else {
        // TRIPLE CHECK UPGRADE: Inject both URL and specific Logout text for maximum reliability
        if (!hasAssertion) {
          // 1. URL Check
          const lastUrl = finalSteps.find((s: any) => s.url)?.url;
          const newUrl = (lastUrl && lastUrl.includes('saucedemo'))
            ? 'https://www.saucedemo.com/inventory.html'
            : (lastUrl ? new URL(lastUrl).origin + '/dashboard' : 'https://flower-for-you-admin.vercel.app/dashboard');

          finalSteps.push({
            type: 'ASSERT_URL',
            value: newUrl,
            note: 'Triple Check Rule 1: URL Validation'
          });

          // 2. Text Check (Looking for Logout or Dashboard)
          const logoutText = (lastUrl && lastUrl.includes('admin')) ? 'ออกจากระบบ' : 'Logout';
          finalSteps.push({
            type: 'ASSERT_TEXT',
            value: logoutText,
            note: 'Triple Check Rule 2: Dashboard Presence Validation'
          });
        }
      }
    }
    return finalSteps;
  };

  const handleStageScript = (auto: any) => {
    setStagedScript(auto);
    setIsEditingJson(false); // Close editor when clicking a card
  };

  const handleConfirmSelect = async () => {
    if (!stagedScript) return;

    const finalSteps = applySmartAssertions(stagedScript.steps, stagedScript.scenarioName);
    const { steps: readableSteps, priority, expected } = generateSmartDocumentation(finalSteps, stagedScript.scenarioName);

    const matchedModule = modules.find(m => m.name.toLowerCase() === (stagedScript.folderName || '').toLowerCase());

    const updatedData = {
      ...form,
      automationSteps: finalSteps,
      hasAutomation: true,
      title: stagedScript.scenarioName,
      steps: readableSteps,
      priority: priority,
      expected: expected,
      // Auto-assign module if it exists in the project
      module: matchedModule ? matchedModule.name : (form.module || 'General')
    };

    setForm(updatedData);

    if (editingCase && activeProjectId) {
      await onSave({ ...updatedData, projectId: activeProjectId }, false);
      onAlert?.(`Synced with latest script: ${stagedScript.scenarioName}`, 'success');
    }

    setStagedScript(null);
    setIsEditingJson(false);
    setIsBrowsingLibrary(false);
  };

  // NEW: Track which library script is being edited and its original name
  const [editingLibraryName, setEditingLibraryName] = useState<string | null>(null);

  const handleEditScript = (auto: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // NEW: Capture ID and Name if editing a library item
    if (auto && auto.id) {
      setEditingLibraryId(auto.id);
      setEditingLibraryName(auto.scenarioName); // Keep original name!
    } else {
      setEditingLibraryId(null);
      setEditingLibraryName(null);
    }

    const sourceSteps = auto?.steps || form.automationSteps || [];
    const injected = applySmartAssertions(sourceSteps, auto?.scenarioName || form.title || '');
    const jsonString = JSON.stringify(injected, null, 2);
    setRawJson(jsonString);
    setOriginalJson(jsonString);
    setIsEditingJson(true);
  };

  const handleSaveJson = async () => {
    try {
      const parsed = JSON.parse(rawJson);
      // Use original name if available, otherwise fallback to form title
      const targetName = editingLibraryName || form.title || 'Scenario';

      const injected = applySmartAssertions(parsed, targetName);
      const { steps: readable, expected } = generateSmartDocumentation(injected, targetName);

      // NEW: If editing a library script, update it on the server!
      if (editingLibraryId) {
        try {
          const response = await fetch(`http://localhost:3002/automation/${editingLibraryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            // Send back the ORIGINAL name (or updated logic if we allow renaming later)
            body: JSON.stringify({ steps: injected, scenarioName: targetName })
          });

          if (response.ok) {
            onAlert?.("Library Script Updated Successfully!", 'success');
            fetchLibrary(); // Refresh the list
          } else {
            console.error("Failed to update library script");
            onAlert?.("Failed to update script on server (Local update only).", 'error');
          }
        } catch (serverErr) {
          console.error("Network error updating script", serverErr);
        }
      }

      setForm(prev => ({
        ...prev,
        automationSteps: injected,
        steps: (!prev.steps || prev.steps.length <= 1 || prev.hasAutomation) ? readable : prev.steps,
        expected: expected
      }));

      setIsEditingJson(false);
      setEditingLibraryId(null); // Clear editing state
      if (!editingLibraryId) onAlert?.("Script modifications applied (Local).", 'success');
    } catch (e) {
      onAlert?.("Invalid JSON format. Please verify step syntax.", 'error');
    }
  };

  const handleToggleLibrarySelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedLibraryIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedLibraryIds(next);
  };

  const handleBatchDeploy = async () => {
    if (selectedLibraryIds.size === 0) return;

    setIsExecuting(true);
    try {
      const selectedScripts = library.filter(item => selectedLibraryIds.has(item.id));

      for (const auto of selectedScripts) {
        const { steps, priority, expected } = generateSmartDocumentation(auto.steps, auto.scenarioName);
        const folderMatch = modules.find(m => m.name.toLowerCase() === (auto.folderName || '').toLowerCase());

        const data: Partial<TestCase> = {
          title: auto.scenarioName,
          module: folderMatch ? folderMatch.name : (form.module || modules[0]?.name || 'General'),
          priority,
          status: 'Pending',
          steps,
          expected,
          hasAutomation: true,
          automationSteps: auto.steps,
          projectId: activeProjectId!,
        };
        await onSave(data, true);
        // Small delay to prevent ID clobbering if firestore is slow to index
        await new Promise(r => setTimeout(r, 400));
      }

      const count = selectedLibraryIds.size;
      setSelectedLibraryIds(new Set());
      onClose(); // Close form first
      onAlert?.(`Success: ${count} Scenarios deployed to Scope table.`, 'success');
    } catch (e) {
      onAlert?.("Error during batch deployment.", 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDeleteLibraryScript = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this script from the library?')) return;

    try {
      const response = await fetch(`http://localhost:3002/automation/${id}`, { method: 'DELETE' });
      if (response.ok) {
        onAlert?.("Script deleted from library.", 'success');
        fetchLibrary();
      } else {
        const errData = await response.json().catch(() => ({}));
        onAlert?.(`Failed to delete: ${errData.error || 'Server error'}`, 'error');
      }
    } catch (e) {
      onAlert?.("Network error during deletion. Ensure automation-server is running.", 'error');
    }
  };

  const handleCopyId = () => {
    if (activeProjectId) {
      navigator.clipboard.writeText(activeProjectId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Safe reduction with array check
  const groupedLibrary = Array.isArray(library) ? library.reduce((acc: any, item: any) => {
    const folder = item.folderName || 'General';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(item);
    return acc;
  }, {}) : {};

  const handleSave = async (silent = false, statusOverride?: Status) => {
    if (!form.title) {
      if (!silent) onAlert?.("Verification Required: Please enter a 'Scenario Title' in the General Info tab before committing.", 'error');
      setActiveTab('doc');
      return false;
    }
    if (!activeProjectId) {
      if (!silent) onAlert?.("Error: No active project context found.", 'error');
      return false;
    }

    let currentData = { ...form };

    // If terminal editing, sync before saving
    if (isEditingJson) {
      try {
        const parsed = JSON.parse(rawJson);
        const injected = applySmartAssertions(parsed, currentData.title || '');
        const { steps: readable } = generateSmartDocumentation(injected, currentData.title || 'Scenario');
        currentData = {
          ...currentData,
          automationSteps: injected,
          steps: (!currentData.steps || currentData.steps.length <= 1 || currentData.hasAutomation) ? readable : currentData.steps
        };
      } catch (e) {
        onAlert?.("Commit Aborted: JSON Syntax Error. Please fix or click Save Modifications.", 'error');
        return false;
      }
    }

    const data = {
      ...currentData,
      status: statusOverride || currentData.status,
      projectId: activeProjectId,
    };
    await onSave(data, !editingCase);
    if (!silent) onClose();
    return true;
  };

  const handleRun = async () => {
    if (onRun) {
      setIsExecuting(true);
      try {
        // ALWAYS apply smart assertions before running to ensure upgrades happen
        let sourceSteps = form.automationSteps || [];
        if (isEditingJson) {
          try {
            sourceSteps = JSON.parse(rawJson);
          } catch (e) {
            onAlert?.("Run Aborted: JSON Syntax Error in editor window.", 'error');
            return;
          }
        }

        const currentSteps = applySmartAssertions(sourceSteps, form.title || '');

        // Sync back to form state so the UI reflects the upgrade
        setForm(prev => ({ ...prev, automationSteps: currentSteps }));

        const currentCase = {
          ...(editingCase || {}),
          ...form,
          automationSteps: currentSteps,
          id: editingCase?.id || `TEMP-${Date.now()}`
        } as TestCase;

        const runResult = await onRun(currentCase);
        const nextRound = (form.round || 1) + 1;

        if (runResult && (runResult === true || runResult.status === 'success')) {
          const hasAssertion = currentSteps.some((s: any) => s.type.startsWith('ASSERT_'));
          if (!hasAssertion) {
            onAlert?.("Notice: Script passed interactions, but no ASSERTIONS were found to verify results.", 'info');
          }
          // Auto-fill documentation if missing when passed
          const { steps, priority, expected } = generateSmartDocumentation(currentSteps, form.title || 'Scenario');

          const finalData = {
            ...form,
            round: nextRound,
            automationSteps: currentSteps, // Sync the latest steps
            status: 'Passed' as Status,
            screenshots: runResult.screenshots || [], // CAPTURE SCREENSHOTS HERE
            actualResult: runResult.message || 'ระบบทำงานได้ถูกต้องตามขั้นตอนที่กำหนด',
            steps: (!form.steps || form.steps.length <= 1 || form.hasAutomation) ? steps : form.steps,
            priority: (form.priority === 'Medium') ? priority : form.priority,
            expected: expected
          };

          setForm(finalData);
          await onSave({ ...finalData, projectId: activeProjectId! }, !editingCase);
          onClose();
        } else if (runResult && runResult.status === 'failed') {
          const failedData = {
            ...form,
            status: 'Failed' as Status,
            round: nextRound,
            automationSteps: currentSteps,
            screenshots: runResult.screenshots || [], // CAPTURE SCREENSHOTS HERE
            actualResult: `เกิดข้อผิดพลาด: ${runResult.message || 'ไม่สามารถดำเนินการตามขั้นตอนได้'}`,
            projectId: activeProjectId!
          };
          setForm(failedData);
          // Also save the failure status and current steps to the database
          await onSave(failedData, !editingCase);
        }
      } finally {
        setIsExecuting(false);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
      title={editingCase ? `Modify ${editingCase.id}` : 'New Scenario'}
      footer={
        <div className="flex gap-3">
          {(activeTab === 'auto' && (isBrowsingLibrary || !form.hasAutomation) && stagedScript) ? (
            <button
              onClick={handleConfirmSelect}
              className="bg-blue-600 text-white px-10 py-2.5 rounded-sm text-xs font-bold hover:bg-blue-500 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] animate-pulse"
            >
              Confirm & Select: {stagedScript.scenarioName}
            </button>
          ) : (
            <button onClick={() => handleSave()} className="bg-white text-black px-8 py-2.5 rounded-sm text-xs font-bold hover:bg-white/90 transition-all uppercase tracking-widest shadow-lg">
              Save Scenario
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-white/5 mb-2">
          <div className="flex gap-6">
            <button onClick={() => setActiveTab('doc')} className={`pb-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'doc' ? 'text-white border-white' : 'text-white/30 border-transparent hover:text-white/60'}`}>Details</button>
            <button onClick={() => setActiveTab('auto')} className={`pb-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'auto' ? 'text-white border-white' : 'text-white/30 border-transparent hover:text-white/60'}`}>Automation</button>
          </div>

        </div>

        {activeTab === 'doc' ? (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 uppercase font-bold tracking-widest">Test Case Title</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm pl-10 pr-4 py-2.5 outline-none text-sm text-white focus:border-white/20 transition-all placeholder:text-white/20"
                    placeholder="e.g. User Login Validation"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 uppercase font-bold tracking-widest">Module</label>
                  <div className="relative group/select">
                    <input
                      type="text"
                      value={form.module}
                      onFocus={() => { setShowModuleDropdown(true); setIsTyping(false); }}
                      onBlur={() => setTimeout(() => setShowModuleDropdown(false), 200)}
                      onChange={(e) => { setForm({ ...form, module: e.target.value }); setIsTyping(true); }}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2.5 outline-none text-sm text-white focus:border-blue-500/50 transition-all pr-8"
                      placeholder="Select or type..."
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 transition-colors">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                    {showModuleDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-[#0f0f0f] border border-white/10 rounded-sm shadow-2xl z-[100] max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                        {modules
                          .filter(m => !isTyping || !form.module || m.name.toLowerCase().includes(form.module.toLowerCase()))
                          .map(m => (
                            <div
                              key={m.id}
                              onClick={() => { setForm({ ...form, module: m.name }); setShowModuleDropdown(false); }}
                              className="px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-none"
                            >
                              {m.name}
                            </div>
                          ))}
                        {modules.filter(m => !isTyping || !form.module || m.name.toLowerCase().includes(form.module.toLowerCase())).length === 0 && (
                          <div className="px-3 py-3 text-[10px] text-white/20 italic">No matches found. Press Enter to create new.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 uppercase font-bold tracking-widest">Round</label>
                  <input type="number" min="1" value={form.round || 1} onChange={(e) => setForm({ ...form, round: parseInt(e.target.value) })} className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2.5 outline-none text-sm text-white focus:border-white/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 uppercase font-bold tracking-widest">Priority</label>
                  <div className="relative group/select">
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2.5 outline-none cursor-pointer text-sm text-white appearance-none focus:border-blue-500/50 transition-all pr-8"
                    >
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover/select:text-white/40 transition-colors">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1">
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 uppercase font-bold tracking-widest">Status</label>
                <div className="relative group/select">
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm px-3 py-2.5 outline-none cursor-pointer text-sm text-white appearance-none focus:border-blue-500/50 transition-all pr-8"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover/select:text-white/40 transition-colors">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-white/50 uppercase font-bold tracking-widest">Test Steps</label>
                <button onClick={() => setForm({ ...form, steps: [...(form.steps || []), ''] })} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider">+ Add Step</button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar bg-white/[0.01] p-2 rounded border border-white/5">
                {form.steps?.map((s, i) => (
                  <div key={i} className="flex gap-2 group">
                    <span className="w-6 text-white/20 pt-2 text-[10px] text-center select-none">{String(i + 1).padStart(2, '0')}</span>
                    <input type="text" value={s} onChange={(e) => updateSteps(i, e.target.value)} className="flex-1 bg-transparent border-b border-white/5 group-hover:border-white/10 px-2 py-1.5 outline-none text-sm transition-all text-white focus:border-blue-500/50 focus:bg-white/[0.02]" placeholder="Step description..." />
                    <button onClick={() => removeStep(i)} className="text-white/5 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"><XCircle size={14} /></button>
                  </div>
                ))}
                {(!form.steps || form.steps.length === 0) && <div className="text-center py-4 text-white/10 text-xs italic">No steps defined.</div>}
              </div>
            </div>

            <div className="space-y-1.5 flex-1 h-full flex flex-col">
              <label className="text-xs text-white/50 uppercase font-bold tracking-widest">Description / Pre-conditions</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full flex-1 bg-[#0a0a0a] border border-white/10 rounded-sm px-4 py-3 outline-none text-sm text-white focus:border-white/20 transition-all resize-none custom-scrollbar placeholder:text-white/20 leading-relaxed"
                placeholder="Describe the test case..."
              />
            </div>

            {form.actualResult && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                <label className="text-xs text-white/50 uppercase font-bold tracking-widest flex items-center gap-2">
                  Actual Result
                  <span className={`px-1.5 py-0.5 rounded-[2px] text-[8px] font-black uppercase ${form.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{form.status}</span>
                </label>
                <div className={`p-3 rounded-sm border ${form.status === 'Passed' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-100/70' : 'bg-red-500/5 border-red-500/20 text-red-100/70'} text-xs leading-relaxed italic`}>
                  {form.actualResult}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Simplified Key Section for extension */}
            {!form.hasAutomation && activeProjectId && (
              <div className="flex flex-col gap-2 mb-3">
                <div className="bg-purple-600/5 border border-purple-500/20 p-4 rounded-lg flex items-center justify-between shadow-lg shadow-purple-900/5">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Key size={12} className="text-purple-400" />
                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Connection Key (Account)</span>
                    </div>
                    <p className="text-[10px] text-white/70 font-medium mb-1.5">
                      Paste this in <span className="text-purple-400 font-bold">Extension Settings</span> to sync <span className="text-white/40 ml-1">(ใส่ในส่วนตั้งค่าของ Extension เพื่อเชื่อมต่อ)</span>
                    </p>
                    <div className="flex">
                      <span className="text-[12px] font-mono text-white/90 bg-white/5 px-2 py-1 rounded border border-white/5 tracking-wider">
                        {user?.uid}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user?.uid);
                      onAlert?.("Connection Key copied! Paste this in the Extension Settings.", "success");
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-[10px] font-black transition-all border border-purple-500/30 uppercase tracking-widest shadow-xl shadow-purple-900/20 active:scale-95"
                  >
                    <Copy size={12} /> COPY KEY
                  </button>
                </div>
              </div>
            )}

            {(!form.hasAutomation || isEditingJson || isBrowsingLibrary) ? (
              <div className="flex gap-8 h-[500px]">
                <div className="w-[320px] shrink-0 border-r border-white/10 pr-6 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black text-white/30 tracking-widest uppercase">Automation Library</span>
                    <button
                      onClick={fetchLibrary}
                      className="text-white/20 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoadingLibrary}
                    >
                      <RotateCcw size={12} className={isLoadingLibrary ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  {Object.entries(groupedLibrary).map(([folder, items]: [string, any]) => (
                    <div key={folder} className="mb-4">
                      <div className="flex items-center gap-2 text-white/40 mb-2 font-black text-[10px] tracking-wide">
                        <Folder size={12} className="text-blue-500" /> {folder.toUpperCase()}
                      </div>
                      <div className="space-y-1 pl-1">
                        {items.map((item: any) => (
                          <div
                            key={item.id}
                            className={`group/item flex flex-col border rounded-lg p-3 mb-3 transition-all ${stagedScript?.id === item.id ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]' : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'}`}
                          >
                            <div className="flex items-start gap-3 mb-3">
                              {!editingCase && (
                                <button
                                  onClick={(e) => handleToggleLibrarySelection(item.id, e)}
                                  className={`shrink-0 mt-1 w-5 h-5 rounded border transition-all flex items-center justify-center ${selectedLibraryIds.has(item.id) ? 'bg-blue-600 border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'border-white/20 hover:border-white/40 bg-transparent'}`}
                                >
                                  <Check size={12} strokeWidth={4} className={selectedLibraryIds.has(item.id) ? 'text-white' : 'text-transparent'} />
                                </button>
                              )}

                              <button
                                onClick={() => handleStageScript(item)}
                                className="flex-1 min-w-0 text-left"
                              >
                                <div className={`text-[11px] font-bold truncate transition-colors ${stagedScript?.id === item.id ? 'text-blue-400' : 'text-white/90 group-hover/item:text-blue-400'}`}>{item.scenarioName}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${stagedScript?.id === item.id ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-500/10 text-blue-400/70 border-blue-500/10'}`}>{item.steps?.length || 0} steps</span>
                                  {item.folderName && <span className="text-[9px] text-white/20 uppercase tracking-tighter">{item.folderName}</span>}
                                </div>
                              </button>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                              <button
                                onClick={(e) => handleEditScript(item, e)}
                                className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-blue-500/5 hover:bg-blue-500/20 text-blue-400 rounded transition-all border border-blue-500/10 text-[9px] font-bold uppercase tracking-wider"
                              >
                                <Code2 size={12} /> Edit Script
                              </button>
                              <button
                                onClick={(e) => handleDeleteLibraryScript(item.id, e)}
                                className="px-3 py-1.5 bg-red-500/5 hover:bg-red-500/20 text-red-500 rounded transition-all border border-red-500/10"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {!editingCase && selectedLibraryIds.size > 0 && (
                    <button
                      onClick={handleBatchDeploy}
                      disabled={isExecuting}
                      className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-xl shadow-blue-900/20 animate-in slide-in-from-bottom-2 duration-300"
                    >
                      {isExecuting ? 'DEPLOYING...' : `BATCH DEPLOY (${selectedLibraryIds.size})`}
                    </button>
                  )}
                </div>
                {isEditingJson ? (
                  <div className="flex-1 flex flex-col gap-3 animate-in fade-in slide-in-from-right-2 duration-300 min-h-0">
                    <div className="flex items-center justify-between shrink-0 h-9">
                      <span className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-2 tracking-widest">
                        <Code2 size={14} /> JSON Script Editor
                      </span>
                      <div className="flex items-center gap-4">
                        {rawJson !== originalJson && (
                          <button
                            onClick={handleSaveJson}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-4 py-1.5 rounded shadow-lg shadow-blue-500/20 uppercase tracking-widest animate-in fade-in zoom-in-95 duration-200"
                          >
                            SAVE MODIFICATIONS
                          </button>
                        )}
                        <button onClick={() => setIsEditingJson(false)} className="text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-widest">Cancel</button>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                      <textarea
                        value={rawJson}
                        onChange={(e) => setRawJson(e.target.value)}
                        className="absolute inset-0 w-full h-full bg-[#050505] border border-blue-500/20 rounded-lg p-4 text-[10px] text-blue-300 outline-none focus:border-blue-500/50 transition-all custom-scrollbar resize-none shadow-inner leading-relaxed"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 py-10">
                    <FolderOpen size={40} className="mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest max-w-[200px]">Select a script to view configuration or click Edit to modify JSON</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-4 rounded">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                    <div>
                      <div className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest">Automation Attached</div>
                      <div className="text-sm font-black text-white">{form.automationSteps?.length} Operational Steps</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRun}
                      disabled={isExecuting}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      <Play size={12} fill="currentColor" /> {isExecuting ? 'EXECUTING...' : 'RUN SCRIPT'}
                    </button>
                    <button
                      onClick={() => setIsBrowsingLibrary(true)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-sm text-[10px] font-bold transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest"
                    >
                      Manage Script
                    </button>
                    <button onClick={() => setForm({ ...form, automationSteps: [], hasAutomation: false })} className="p-2 border border-white/10 text-white/20 hover:text-red-500 transition-all rounded-sm" title="Clear Automation"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="border border-white/5 rounded overflow-hidden max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-white/5">
                      <tr className="border-b border-white/10 text-white/20 font-black uppercase tracking-widest">
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Target</th>
                        <th className="p-3 text-right">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Array.isArray(form.automationSteps) && form.automationSteps.map((s, i) => (
                        <tr key={i} className="hover:bg-white/[0.01]">
                          <td className="p-3 text-white/20 text-center">{i + 1}</td>
                          <td className="p-3 text-blue-400 font-bold uppercase">{s.type}</td>
                          <td className="p-3 text-white/70">{s.type === 'INPUT' ? `Type: "${s.value}"` : (s.text && s.text !== 'No text' ? s.text : s.tagName)}</td>
                          <td className="p-3 text-right">
                            <div className="w-2 h-2 rounded-full border border-white/5 ml-auto opacity-20" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TestCaseForm;
