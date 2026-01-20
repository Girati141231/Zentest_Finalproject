import React, { useState, useMemo, useEffect } from 'react';
import {
  Play, Search, LogIn, CheckSquare, Eye, AlertCircle, Download, Activity, Globe, Trash2, LayoutDashboard
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
import { Project, Module, TestCase, APITestCase, LogEntry, ModalMode, STATUSES } from './types';
import { ProjectService, TestCaseService, APITestCaseService, ModuleService } from './services/db';

// Components
import Sidebar from './components/Sidebar';
import ProjectModals from './components/ProjectModals';
import Terminal from './components/Terminal';
import TestCaseTable from './components/TestCaseTable';
import TestCaseForm from './components/TestCaseForm';
import APITable from './components/APITable';
import APIForm from './components/APIForm';
import Dashboard from './components/Dashboard';

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

const MOCK_API_CASES: APITestCase[] = [
  { id: 'API-5001', projectId: 'demo-1', title: 'Get User Profile', module: 'Authentication', priority: 'High', status: 'Passed', method: 'GET', url: 'https://api.zentest.dev/v1/me', headers: [{ key: 'Authorization', value: 'Bearer token' }], expectedStatus: 200, expectedBody: '{ "id": "123", "name": "John" }', timestamp: Date.now() },
  { id: 'API-5002', projectId: 'demo-1', title: 'Create New Order', module: 'Checkout', priority: 'Critical', status: 'Pending', method: 'POST', url: 'https://api.zentest.dev/v1/orders', headers: [{ key: 'Content-Type', value: 'application/json' }], body: '{ "items": ["A", "B"] }', expectedStatus: 201, timestamp: Date.now() }
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
  const [apiTestCases, setApiTestCases] = useState<APITestCase[]>([]);

  // UI
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'functional' | 'api' | 'dashboard'>('dashboard');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Modals
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isAPIModalOpen, setIsAPIModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<ModalMode>(null);
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);
  const [editingAPICase, setEditingAPICase] = useState<APITestCase | null>(null);

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
      setApiTestCases([]);
      return;
    }

    if (!isConfigured || user.uid === 'demo-user') {
      setModules(MOCK_MODULES.filter(m => m.projectId === activeProjectId));
      setTestCases(MOCK_CASES.filter(c => c.projectId === activeProjectId));
      setApiTestCases(MOCK_API_CASES.filter(c => c.projectId === activeProjectId));
      return;
    }

    // Optimized: Server-side filtering using 'where'
    const modulesRef = collection(db, 'artifacts', appId, 'public', 'data', 'modules');
    const modulesQuery = query(modulesRef, where('projectId', '==', activeProjectId));

    const casesRef = collection(db, 'artifacts', appId, 'public', 'data', 'testCases');
    const casesQuery = query(casesRef, where('projectId', '==', activeProjectId));

    const apiRef = collection(db, 'artifacts', appId, 'public', 'data', 'apiTestCases');
    const apiQuery = query(apiRef, where('projectId', '==', activeProjectId));

    const unsubModules = onSnapshot(modulesQuery, (s) => {
      setModules(s.docs.map(d => ({ id: d.id, ...d.data() } as Module)));
    });

    const unsubCases = onSnapshot(casesQuery, (s) => {
      setTestCases(s.docs.map(d => ({ id: d.id, ...d.data() } as TestCase)));
    });

    const unsubAPI = onSnapshot(apiQuery, (s) => {
      setApiTestCases(s.docs.map(d => ({ id: d.id, ...d.data() } as APITestCase)));
    });

    return () => { unsubModules(); unsubCases(); unsubAPI(); };
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
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filenamePrefix = 'export';

    if (viewMode === 'functional') {
      if (!testCases.length) return;
      headers = ['ID', 'Module', 'Title', 'Round', 'Priority', 'Status', 'Steps', 'Expected Result', 'Has Automation'];
      rows = testCases.map(tc => [
        tc.id,
        tc.module || 'Unassigned',
        `"${tc.title.replace(/"/g, '""')}"`,
        tc.round || 1,
        tc.priority,
        tc.status,
        `"${(tc.steps || []).filter(s => s && s.trim()).map((s, i) => `${i + 1}. ${s}`).join('\n').replace(/"/g, '""')}"`,
        `"${(tc.expected || '').replace(/"/g, '""')}"`,
        tc.hasAutomation ? 'Yes' : 'No'
      ]);
      filenamePrefix = 'functional';
    } else {
      if (!apiTestCases.length) return;
      headers = ['ID', 'Module', 'Title', 'Method', 'URL', 'Round', 'Status', 'Expected Status', 'Headers', 'Body'];
      rows = apiTestCases.map(tc => [
        tc.id,
        tc.module || 'Unassigned',
        `"${tc.title.replace(/"/g, '""')}"`,
        tc.method,
        `"${tc.url.replace(/"/g, '""')}"`,
        tc.round || 1,
        tc.status,
        tc.expectedStatus,
        `"${(tc.headers || []).map(h => `${h.key}: ${h.value}`).join('\n').replace(/"/g, '""')}"`,
        `"${(tc.body || '').replace(/"/g, '""')}"`
      ]);
      filenamePrefix = 'api';
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeProject?.name || 'export'}_${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
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

  const handleLogout = () => {
    if (isConfigured && user?.uid !== 'demo-user') {
      signOut(auth);
    } else {
      setUser(null);
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

    setExecutingId(null);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (user.uid === 'demo-user') {
      if (viewMode === 'functional') {
        setTestCases(prev => prev.filter(c => !selectedIds.has(c.id)));
      } else {
        setApiTestCases(prev => prev.filter(c => !selectedIds.has(c.id)));
      }
      setSelectedIds(new Set());
      return;
    }

    const idsToDelete = Array.from(selectedIds) as string[];
    if (viewMode === 'functional') {
      await Promise.all(idsToDelete.map(id => TestCaseService.delete(id)));
    } else {
      await Promise.all(idsToDelete.map(id => APITestCaseService.delete(id)));
    }
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

  const handleAPICaseSave = async (data: Partial<APITestCase>, isNew: boolean) => {
    if (user.uid === 'demo-user') {
      if (isNew) {
        const newTC = { ...data, id: `API-${Math.floor(Math.random() * 10000)}`, timestamp: Date.now() } as APITestCase;
        setApiTestCases(prev => [...prev, newTC]);
      } else {
        setApiTestCases(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c));
      }
      return;
    }
    await APITestCaseService.save(data, isNew, user);
  };

  const handleQuickStatusUpdate = async (id: string, status: 'Passed' | 'Failed', type: 'functional' | 'api') => {
    if (user.uid === 'demo-user') {
      if (type === 'functional') {
        setTestCases(prev => prev.map(c => c.id === id ? { ...c, status, timestamp: Date.now(), lastUpdatedBy: 'demo-user', lastUpdatedByName: 'Guest User' } : c));
      } else {
        setApiTestCases(prev => prev.map(c => c.id === id ? { ...c, status, timestamp: Date.now(), lastUpdatedBy: 'demo-user', lastUpdatedByName: 'Guest User' } : c));
      }
      return;
    }

    if (type === 'functional') {
      await TestCaseService.updateStatus(id, status, user);
    } else {
      await APITestCaseService.updateStatus(id, status, user);
    }
  };

  // --- Render ---

  if (authLoading) return <div className="h-screen bg-black flex items-center justify-center text-white font-mono text-xs animate-pulse">BOOTING KERNEL...</div>;

  if (!user) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/5 blur-[100px]"></div>
        <div className="z-10 bg-[#0a0a0a] p-8 rounded-lg border border-white/10 shadow-2xl w-[320px] flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="p-3 bg-white/5 rounded-full mb-2">
            <Activity size={32} className="text-white" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-white tracking-tight">ZEN<span className="text-white/40">TEST</span></h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Test Management OS</p>
          </div>
          <button onClick={handleLogin} className="w-full bg-white text-black font-bold py-2.5 rounded text-xs hover:bg-white/90 transition-all flex items-center justify-center gap-2 active:scale-95 mt-2">
            <LogIn size={14} /> SIGN IN WITH GOOGLE
          </button>
          <button onClick={handleDemoLogin} className="w-full bg-white/5 text-white/60 font-bold py-2.5 rounded text-xs hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95 border border-white/5">
            ENTER DEMO MODE
          </button>
        </div>
        <div className="absolute bottom-6 text-[10px] text-white/20 font-mono tracking-widest">Running v2.4.0-stable</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-white/20">

      <Sidebar
        user={user}
        activeProjectId={activeProjectId}
        projects={projects}
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
        onProjectSelect={setActiveProjectId}
        onLogout={handleLogout}
        onCreateProject={() => setProjectModalMode('create')}
        onJoinProject={() => setProjectModalMode('join')}
        onSettings={() => setProjectModalMode('edit')}
      />

      <main className="flex-1 flex flex-col transition-all duration-300">

        <header className="h-14 border-b border-white/10 bg-[#050505]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-sm tracking-wide flex items-center gap-2">
              {activeProject?.name || 'SELECT A PROJECT'}
            </h2>
            {user.uid === 'demo-user' && <span className="bg-amber-500/20 text-amber-500 text-[9px] px-2 py-0.5 rounded-full border border-amber-500/30 font-bold uppercase tracking-widest">Preview Mode</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/5 p-1 rounded-sm flex items-center border border-white/10 mr-4">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-white text-black shadow-md' : 'text-white/40 hover:text-white'}`}
              >
                <LayoutDashboard size={12} /> Overview
              </button>
              <div className="w-px h-3 bg-white/10 mx-1"></div>
              <button
                onClick={() => setViewMode('functional')}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 ${viewMode === 'functional' ? 'bg-white text-black shadow-md' : 'text-white/40 hover:text-white'}`}
              >
                <CheckSquare size={12} /> Functional
              </button>
              <button
                onClick={() => setViewMode('api')}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 ${viewMode === 'api' ? 'bg-white text-black shadow-md' : 'text-white/40 hover:text-white'}`}
              >
                <Globe size={12} /> API Tests
              </button>
            </div>
            {((viewMode === 'functional' && testCases.length > 0) || (viewMode === 'api' && apiTestCases.length > 0)) && (
              <button
                onClick={handleExportCSV}
                className="text-white/40 hover:text-white px-3 py-2 rounded-sm text-xs font-bold transition-all flex items-center gap-2 border border-transparent hover:border-white/10 hover:bg-white/5"
                title="Export to CSV"
              >
                <Download size={14} /> <span className="hidden sm:inline">EXPORT</span>
              </button>
            )}
            {selectedIds.size > 0 && (
              <>
                <button onClick={handleBulkDelete} className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-sm text-xs font-bold hover:bg-red-500/20 transition-all flex items-center gap-2 animate-in slide-in-from-right-4 shadow-lg shadow-red-900/10">
                  <Trash2 size={14} /> DELETE ({selectedIds.size})
                </button>
                <button onClick={handleBulkRun} className="bg-emerald-600 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-emerald-500 transition-all flex items-center gap-2 animate-in slide-in-from-right-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <Play size={14} fill="white" /> EXECUTE ({selectedIds.size})
                </button>
              </>
            )}
            <button
              disabled={!activeProjectId}
              onClick={() => {
                if (viewMode === 'functional') {
                  setEditingCase(null); setIsCaseModalOpen(true);
                } else {
                  setEditingAPICase(null); setIsAPIModalOpen(true);
                }
              }}
              className="bg-white text-black px-4 py-2 rounded-sm text-xs font-bold hover:bg-white/90 transition-all active:scale-95 disabled:opacity-20 shadow-lg"
            >
              + NEW {viewMode === 'functional' ? 'CASE' : 'API'}
            </button>
          </div>
        </header>

        <div className="h-12 border-b border-white/10 flex items-center px-6 gap-4 bg-[#050505]">
          <div className="relative flex-1 max-w-md group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
            <input
              type="text"
              placeholder="Search cases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-sm pl-9 pr-3 py-1.5 text-xs text-white focus:bg-white/[0.06] focus:border-white/10 transition-all outline-none"
            />
          </div>
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          <div className="flex items-center gap-2">
            {['All', 'Passed', 'Failed', 'Pending'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`text-[10px] px-3 py-1 rounded-sm font-bold uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-white text-black' : 'text-white/30 hover:text-white'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-black">
          {viewMode === 'dashboard' ? (
            <Dashboard testCases={testCases} apiTestCases={apiTestCases} />
          ) : viewMode === 'functional' ? (
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
              onStatusUpdate={(id, status) => handleQuickStatusUpdate(id, status, 'functional')}
            />
          ) : (
            <APITable
              cases={apiTestCases.filter(c =>
                (c.title.toLowerCase().includes(search.toLowerCase()) || c.url.toLowerCase().includes(search.toLowerCase())) &&
                (filterStatus === 'All' || c.status === filterStatus)
              )}
              selectedIds={selectedIds}
              executingId={executingId}
              activeProjectId={activeProjectId}
              onToggleSelect={(id) => {
                const next = new Set(selectedIds);
                if (next.has(id)) next.delete(id); else next.add(id);
                setSelectedIds(next);
              }}
              onToggleSelectAll={() => {
                const filtered = apiTestCases.filter(c => c.projectId === activeProjectId); // Simple filter for now
                setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map(c => c.id)));
              }}
              onRun={async (tc) => {
                setExecutingId(tc.id);
                log(`Sending ${tc.method} request to ${tc.url}...`);
                await new Promise(r => setTimeout(r, 1000)); // Simulate request
                const success = Math.random() > 0.2;
                if (success) {
                  log(`Response: 200 OK`, 'success');
                  if (user.uid !== 'demo-user') await APITestCaseService.updateStatus(tc.id, 'Passed', user);
                } else {
                  log(`Response: 500 Server Error`, 'error');
                  if (user.uid !== 'demo-user') await APITestCaseService.updateStatus(tc.id, 'Failed', user);
                }
                setExecutingId(null);
              }}
              onEdit={(tc) => { setEditingAPICase(tc); setIsAPIModalOpen(true); }}
              onDelete={(id) => APITestCaseService.delete(id)}
              onStatusUpdate={(id, status) => handleQuickStatusUpdate(id, status, 'api')}
            />
          )}
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

      <APIForm
        isOpen={isAPIModalOpen}
        onClose={() => setIsAPIModalOpen(false)}
        activeProjectId={activeProjectId}
        modules={projectModules}
        editingCase={editingAPICase}
        onSave={handleAPICaseSave}
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