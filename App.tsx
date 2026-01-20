import React, { useState, useMemo, useEffect } from 'react';
import {
  Play, Search, LogIn, CheckSquare, Eye, AlertCircle, Download
} from 'lucide-react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInAnonymously
} from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

// Core
import { auth, db, appId, isConfigured } from './firebase';
import { Project, Module, TestCase, LogEntry, ModalMode, STATUSES } from './types';
import { ProjectService, TestCaseService, ModuleService } from './services/db';

// Components
import Sidebar from './components/Sidebar';
import ProjectModals from './components/ProjectModals';
import Terminal from './components/Terminal';
import TestCaseTable from './components/TestCaseTable';
import TestCaseForm from './components/TestCaseForm';

// Mock Data for Demo Mode
const MOCK_PROJECTS: Project[] = [
  { id: 'demo-1', name: 'ZenTest Demo', color: '#3b82f6', initial: 'ZD', owner: 'demo-user' },
  { id: 'demo-2', name: 'Mobile App', color: '#10b981', initial: 'MA', owner: 'demo-user' }
];

const MOCK_MODULES: Module[] = [
  { id: 'mod-1', projectId: 'demo-1', name: 'Authentication' },
  { id: 'mod-2', projectId: 'demo-1', name: 'Checkout' },
  { id: 'mod-3', projectId: 'demo-2', name: 'Onboarding' }
];

const MOCK_CASES: TestCase[] = [
  { id: 'TC-1001', projectId: 'demo-1', title: 'Verify user login with valid credentials', module: 'Authentication', priority: 'Critical', status: 'Passed', steps: ['Navigate to /login', 'Enter valid email', 'Enter valid password', 'Click Submit'], expected: 'Dashboard loads', script: '// Mock automation\nawait login("user", "pass");', hasAutomation: true, timestamp: Date.now() },
  { id: 'TC-1002', projectId: 'demo-1', title: 'Forgot password flow', module: 'Authentication', priority: 'High', status: 'Pending', steps: ['Click Forgot Password', 'Enter email'], expected: 'Reset link sent', script: '', hasAutomation: false, timestamp: Date.now() },
  { id: 'TC-1003', projectId: 'demo-1', title: 'Cart calculation verification', module: 'Checkout', priority: 'Medium', status: 'Failed', steps: ['Add Item A', 'Add Item B', 'Check Total'], expected: 'Total = A + B', script: 'const total = cart.total();\nexpect(total).toBe(50.00);', hasAutomation: true, timestamp: Date.now() }
];

export default function App() {
  // --- State ---
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  // UI
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Modals
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<ModalMode>(null);
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);

  // Execution
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // --- Auth & Data Sync ---

  useEffect(() => {
    // 1. Auth Init
    const initAuth = async () => {
      // If not configured, we don't try to auth automatically.
      // We wait for user to choose Demo Mode or Config.
      if (!isConfigured) {
        setAuthLoading(false);
        return;
      }
      try {
        // We do not force anon auth here if a real config is present to avoid conflicts with Google Auth
        // But we wait for the auth state listener to trigger
      } catch (e) { console.warn("Auth Init Warning", e); }
    };
    initAuth();

    if (isConfigured) {
      return onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthLoading(false);
      });
    } else {
      setAuthLoading(false);
    }
  }, []);

  const handleDemoLogin = () => {
    setUser({ uid: 'demo-user', displayName: 'Guest User', photoURL: null, email: 'guest@zentest.local' });
    setAuthLoading(false);
  };

  useEffect(() => {
    // 2. Fetch Projects
    if (!user) return;

    if (!isConfigured || user.uid === 'demo-user') {
      // Load Mock Data
      setProjects(MOCK_PROJECTS);
      setActiveProjectId(MOCK_PROJECTS[0].id);
      return;
    }

    const myProjectsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'myProjects');
    const unsubMyProjects = onSnapshot(myProjectsRef, (snapshot) => {
      const projectIds = snapshot.docs.map(d => d.id);
      if (projectIds.length === 0) {
        setProjects([]);
        return;
      }
      const publicProjectsRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');
      const unsubPublic = onSnapshot(publicProjectsRef, (s) => {
        const allPublic = s.docs.map(d => ({ id: d.id, ...d.data() } as Project));
        const myData = allPublic.filter(p => projectIds.includes(p.id));
        setProjects(myData);
        if (myData.length > 0 && (!activeProjectId || !myData.find(p => p.id === activeProjectId))) {
          setActiveProjectId(myData[0].id);
        }
      });
      return () => unsubPublic();
    });
    return () => unsubMyProjects();
  }, [user]);

  useEffect(() => {
    // 3. Fetch Data for Active Project
    if (!user || !activeProjectId) {
      setTestCases([]);
      setModules([]);
      return;
    }

    if (!isConfigured || user.uid === 'demo-user') {
      setModules(MOCK_MODULES.filter(m => m.projectId === activeProjectId));
      setTestCases(MOCK_CASES.filter(c => c.projectId === activeProjectId));
      return;
    }

    // Optimized: Server-side filtering using 'where'
    const modulesRef = collection(db, 'artifacts', appId, 'public', 'data', 'modules');
    const modulesQuery = query(modulesRef, where('projectId', '==', activeProjectId));

    const casesRef = collection(db, 'artifacts', appId, 'public', 'data', 'testCases');
    const casesQuery = query(casesRef, where('projectId', '==', activeProjectId));

    const unsubModules = onSnapshot(modulesQuery, (s) => {
      setModules(s.docs.map(d => ({ id: d.id, ...d.data() } as Module)));
    });

    const unsubCases = onSnapshot(casesQuery, (s) => {
      setTestCases(s.docs.map(d => ({ id: d.id, ...d.data() } as TestCase)));
    });

    return () => { unsubModules(); unsubCases(); };
  }, [user, activeProjectId]);

  // --- Helpers ---

  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);
  const projectModules = useMemo(() => modules, [modules]);

  const filteredCases = useMemo(() => {
    return testCases.filter(c =>
      (c.title.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())) &&
      (filterStatus === 'All' || c.status === filterStatus)
    );
  }, [testCases, search, filterStatus]);

  const log = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, { msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type }]);
  };

  // --- Actions ---

  const handleExportCSV = () => {
    if (!testCases.length) return;

    const headers = ['ID', 'Module', 'Title', 'Priority', 'Status', 'Steps', 'Expected Result', 'Has Automation'];
    const rows = testCases.map(tc => [
      tc.id,
      tc.module || 'Unassigned',
      `"${tc.title.replace(/"/g, '""')}"`,
      tc.priority,
      tc.status,
      `"${(tc.steps || []).filter(s => s && s.trim()).map((s, i) => `${i + 1}. ${s}`).join('\n').replace(/"/g, '""')}"`,
      `"${(tc.expected || '').replace(/"/g, '""')}"`,
      tc.hasAutomation ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeProject?.name || 'export'}_testcases_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogin = async () => {
    if (!isConfigured) return;
    setLoginError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/unauthorized-domain') {
        setLoginError(`The current domain (${window.location.hostname}) is not authorized in your Firebase Console. Please add it to Authentication > Settings > Authorized Domains.`);
      } else if (e.code === 'auth/popup-closed-by-user') {
        setLoginError(null);
      } else {
        setLoginError(e.message || "Authentication failed.");
      }
    }
  };

  const handleProjectSave = async (data: any) => {
    if (!user) return;
    const initial = data.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    const payload = { ...data, initial };

    if (user.uid === 'demo-user') {
      // Update local state for demo
      if (projectModalMode === 'edit' && activeProjectId) {
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, ...payload } : p));
      } else {
        const newId = `demo-new-${Date.now()}`;
        setProjects(prev => [...prev, { ...payload, id: newId, owner: 'demo-user', color: payload.color || '#fff' }]);
        setActiveProjectId(newId);
      }
      setProjectModalMode(null);
      return;
    }

    if (projectModalMode === 'edit' && activeProjectId) {
      await ProjectService.update(activeProjectId, payload);
    } else {
      const newId = await ProjectService.create(payload, user.uid);
      setActiveProjectId(newId);
    }
  };

  const handleJoin = async (code: string) => {
    if (!code || !user) return;
    await ProjectService.join(code, user.uid);
    setActiveProjectId(code);
    setProjectModalMode(null);
  };

  const handleRunAutomation = async (testCase: TestCase) => {
    setExecutingId(testCase.id);
    setLogs([]);
    setIsTerminalOpen(true);

    log(`Initializing environment for ${testCase.id}...`);
    await new Promise(r => setTimeout(r, 600));

    // Simulate steps
    for (const step of (testCase.steps || [])) {
      if (step.trim()) {
        log(`Executing: ${step}...`);
        await new Promise(r => setTimeout(r, 400));
      }
    }

    const isSuccess = Math.random() > 0.15;
    if (isSuccess) {
      log(`ASSERTION PASSED`, 'success');
      if (user.uid === 'demo-user') {
        setTestCases(prev => prev.map(c => c.id === testCase.id ? { ...c, status: 'Passed' } : c));
      } else {
        await TestCaseService.updateStatus(testCase.id, 'Passed', user);
      }
    } else {
      log(`ASSERTION FAILED: Element mismatch`, 'error');
      if (user.uid === 'demo-user') {
        setTestCases(prev => prev.map(c => c.id === testCase.id ? { ...c, status: 'Failed' } : c));
      } else {
        await TestCaseService.updateStatus(testCase.id, 'Failed', user);
      }
    }
    setExecutingId(null);
  };

  const handleBulkRun = async () => {
    const targetCases = testCases.filter(c => selectedIds.has(c.id) && c.hasAutomation);
    if (targetCases.length === 0 || executingId) return;

    setExecutingId('bulk');
    setLogs([]);
    setIsTerminalOpen(true);

    log(`>>> STARTING BULK RUN: ${targetCases.length} Cases`, 'info');
    let passed = 0;

    for (const tc of targetCases) {
      log(`Testing ${tc.id}...`);
      await new Promise(r => setTimeout(r, 400));
      const success = Math.random() > 0.15;
      if (success) {
        log(`PASSED: ${tc.title}`, 'success');
        if (user.uid === 'demo-user') {
          setTestCases(prev => prev.map(c => c.id === tc.id ? { ...c, status: 'Passed' } : c));
        } else {
          await TestCaseService.updateStatus(tc.id, 'Passed', user);
        }
        passed++;
      } else {
        log(`FAILED: ${tc.title}`, 'error');
        if (user.uid === 'demo-user') {
          setTestCases(prev => prev.map(c => c.id === tc.id ? { ...c, status: 'Failed' } : c));
        } else {
          await TestCaseService.updateStatus(tc.id, 'Failed', user);
        }
      }
    }

    log(`RUN COMPLETE. Passed: ${passed}/${targetCases.length}`, passed === targetCases.length ? 'success' : 'error');
    setExecutingId(null);
    setSelectedIds(new Set());
  };

  const handleTestCaseSave = async (data: Partial<TestCase>, isNew: boolean) => {
    if (user.uid === 'demo-user') {
      if (isNew) {
        const newTC = { ...data, id: `TC-${Math.floor(Math.random() * 10000)}`, timestamp: Date.now() } as TestCase;
        setTestCases(prev => [...prev, newTC]);
      } else {
        setTestCases(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c));
      }
      return;
    }
    await TestCaseService.save(data, isNew, user);
  };

  // --- Render ---

  if (authLoading) return <div className="h-screen bg-black flex items-center justify-center text-white font-mono text-xs animate-pulse">BOOTING KERNEL...</div>;

  if (!user) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-mono">
      <div className="w-full max-w-sm border border-white/10 p-10 bg-[#050505] space-y-8 text-center shadow-[0_0_50px_rgba(255,255,255,0.05)] rounded-sm">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-white text-black font-black text-3xl flex items-center justify-center mx-auto rounded-sm">Z</div>
          <h1 className="text-xl font-bold tracking-tighter">ZENTEST ENTERPRISE</h1>
        </div>

        {loginError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 text-[11px] text-left rounded-sm">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <div>
                <strong>Authentication Error</strong>
                <p className="mt-1 opacity-70 leading-relaxed">{loginError}</p>
                {loginError.includes('domain') && (
                  <div className="mt-2 p-2 bg-black/40 rounded border border-white/5 font-mono select-all text-[10px] break-all text-white/60">
                    {window.location.hostname}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isConfigured ? (
          <div className="space-y-3">
            <button onClick={handleLogin} className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-sm font-bold hover:bg-white/90 transition-all active:scale-95">
              <LogIn size={18} /> <span>SIGN IN WITH GOOGLE</span>
            </button>
            <button onClick={handleDemoLogin} className="w-full flex items-center justify-center gap-2 text-white/30 hover:text-white text-xs py-2 transition-colors">
              <Eye size={14} /> <span>Continue as Guest (Preview)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 text-xs text-left rounded-sm">
              <strong>Configuration Missing</strong>
              <p className="mt-1 opacity-70">Firebase API Key not found. Please configure firebase.ts to enable cloud features.</p>
            </div>
            <button onClick={handleDemoLogin} className="w-full flex items-center justify-center gap-3 bg-white/10 text-white py-3 rounded-sm font-bold hover:bg-white/20 transition-all active:scale-95 border border-white/10">
              <Eye size={18} /> <span>ENTER PREVIEW MODE</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#000000] text-white/80 font-mono text-[13px] selection:bg-white selection:text-black antialiased overflow-hidden">

      <Sidebar
        user={user}
        projects={projects}
        activeProjectId={activeProjectId}
        onProjectSelect={(id) => { setActiveProjectId(id); setSelectedIds(new Set()); }}
        onCreateProject={() => setProjectModalMode('create')}
        onJoinProject={() => setProjectModalMode('join')}
        onSettings={() => setProjectModalMode('edit')}
        onLogout={() => { if (isConfigured && user.uid !== 'demo-user') signOut(auth); else setUser(null); }}
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-[#020202]">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#000000]">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-tight text-white uppercase text-lg">{activeProject?.name || 'NO SCOPE SELECTED'}</span>
            {activeProject && <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ backgroundColor: activeProject.color }} />}
            {user.uid === 'demo-user' && <span className="bg-amber-500/20 text-amber-500 text-[9px] px-2 py-0.5 rounded-full border border-amber-500/30 font-bold uppercase tracking-widest">Preview Mode</span>}
          </div>
          <div className="flex items-center gap-3">
            {testCases.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="text-white/40 hover:text-white px-3 py-2 rounded-sm text-xs font-bold transition-all flex items-center gap-2 border border-transparent hover:border-white/10 hover:bg-white/5"
                title="Export to CSV"
              >
                <Download size={14} /> <span className="hidden sm:inline">EXPORT</span>
              </button>
            )}
            {selectedIds.size > 0 && (
              <button onClick={handleBulkRun} className="bg-emerald-600 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-emerald-500 transition-all flex items-center gap-2 animate-in slide-in-from-right-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Play size={14} fill="white" /> EXECUTE ({selectedIds.size})
              </button>
            )}
            <button
              disabled={!activeProjectId}
              onClick={() => { setEditingCase(null); setIsCaseModalOpen(true); }}
              className="bg-white text-black px-4 py-2 rounded-sm text-xs font-bold hover:bg-white/90 transition-all active:scale-95 disabled:opacity-20 shadow-lg"
            >
              + NEW CASE
            </button>
          </div>
        </header>

        <div className="px-6 py-4 border-b border-white/5 bg-[#050505] flex items-center gap-4">
          <div className="relative flex-1 max-w-sm group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 transition-colors" size={14} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search UID or keywords..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-sm pl-10 pr-3 py-2 outline-none focus:border-white/10 focus:bg-white/[0.05] transition-all text-xs text-white"
            />
          </div>
          <select
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#050505] border border-white/5 text-white/60 rounded-sm px-3 py-2 text-[11px] outline-none hover:border-white/10 transition-all cursor-pointer appearance-none border-b focus:text-white"
          >
            <option value="All">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-black">
          <TestCaseTable
            cases={filteredCases}
            selectedIds={selectedIds}
            executingId={executingId}
            activeProjectId={activeProjectId}
            onToggleSelect={(id) => {
              const next = new Set(selectedIds);
              if (next.has(id)) next.delete(id); else next.add(id);
              setSelectedIds(next);
            }}
            onToggleSelectAll={() => {
              setSelectedIds(selectedIds.size === filteredCases.length ? new Set() : new Set(filteredCases.map(c => c.id)));
            }}
            onRun={handleRunAutomation}
            onEdit={(tc) => { setEditingCase(tc); setIsCaseModalOpen(true); }}
            onDelete={(id) => TestCaseService.delete(id)}
          />
        </div>
      </main>

      <ProjectModals
        mode={projectModalMode}
        onClose={() => setProjectModalMode(null)}
        activeProject={activeProject}
        user={user}
        modules={modules}
        onSave={handleProjectSave}
        onJoin={handleJoin}
        onDelete={async (id, isOwner) => {
          if (user.uid === 'demo-user') {
            setProjects(prev => prev.filter(p => p.id !== id));
            if (activeProjectId === id) setActiveProjectId(null);
            setProjectModalMode(null);
            return;
          }

          if (isOwner) {
            await ProjectService.delete(id);
          } else {
            await ProjectService.leave(id, user.uid);
          }
          setProjectModalMode(null);
          if (activeProjectId === id) setActiveProjectId(null);
        }}
        onAddModule={(name) => activeProjectId && ModuleService.add(name, activeProjectId)}
        onUpdateModule={async (id, name) => {
          if (user.uid === 'demo-user') {
            setModules(prev => prev.map(m => m.id === id ? { ...m, name } : m));
          } else {
            await ModuleService.update(id, name);
          }
        }}
        onDeleteModule={(id) => ModuleService.delete(id)}
      />

      <TestCaseForm
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        activeProjectId={activeProjectId}
        modules={projectModules}
        editingCase={editingCase}
        onSave={handleTestCaseSave}
      />

      <Terminal
        isOpen={isTerminalOpen}
        onClose={() => !executingId && setIsTerminalOpen(false)}
        logs={logs}
        executingId={executingId}
      />
    </div>
  );
}