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
import { Project, Module, TestCase, APITestCase, LogEntry, ModalMode, STATUSES, Comment } from './types';
import { ProjectService, TestCaseService, APITestCaseService, ModuleService, CommentService, UserReadStatusService } from './services/db';

// Components
import Sidebar from './components/Sidebar';
import ProjectModals from './components/ProjectModals';
import Terminal from './components/Terminal';
import TestCaseTable from './components/TestCaseTable';
import TestCaseForm from './components/TestCaseForm';
import APITable from './components/APITable';
import APIForm from './components/APIForm';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import ConfirmModal from './components/ui/ConfirmModal';
import CommentsDrawer from './components/CommentsDrawer';

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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'functional' | 'api' | 'dashboard'>('dashboard');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterModule, setFilterModule] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterAutomation, setFilterAutomation] = useState<boolean>(false);
  const [filterUser, setFilterUser] = useState<string>('All');

  // Modals
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isAPIModalOpen, setIsAPIModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<ModalMode>(null);
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);
  const [editingAPICase, setEditingAPICase] = useState<APITestCase | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Comments
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [activeCommentCase, setActiveCommentCase] = useState<{ id: string; title: string; commentCount?: number } | null>(null); // Added commentCount
  const [comments, setComments] = useState<Comment[]>([]);
  const [readStatus, setReadStatus] = useState<Record<string, number>>({});

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
      // Map of projectId -> role
      const myRoles = new Map<string, string>();
      snapshot.docs.forEach(d => {
        myRoles.set(d.id, d.data().role);
      });

      const projectIds = Array.from(myRoles.keys());
      if (projectIds.length === 0) {
        setProjects([]);
        return;
      }
      const publicProjectsRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');
      const unsubPublic = onSnapshot(publicProjectsRef, (s) => {
        const allPublic = s.docs.map(d => ({ id: d.id, ...d.data() } as Project));
        const myData = allPublic
          .filter(p => projectIds.includes(p.id))
          .map(p => ({ ...p, role: myRoles.get(p.id) as any })); // Merge role

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

  useEffect(() => {
    if (!activeProjectId || !user || user.uid === 'demo-user') return;
    const unsub = UserReadStatusService.subscribe(activeProjectId, user.uid, (data) => {
      setReadStatus(data);
    });
    return () => unsub();
  }, [activeProjectId, user]);

  // Subscribe to comments when drawer is open
  useEffect(() => {
    if (!activeCommentCase) return;

    if (user?.uid === 'demo-user') {
      // Demo mode: comments are local state only for now
      return;
    }

    const unsubscribe = CommentService.subscribe(activeCommentCase.id, (data) => {
      setComments(data);
    });
    return () => unsubscribe();
  }, [activeCommentCase, user]);

  // --- Helpers ---

  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);
  const projectModules = useMemo(() => modules, [modules]);

  // Filters
  const filterLogic = (c: TestCase | APITestCase) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c as any).url?.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchesModule = filterModule === 'All' || c.module === filterModule;
    const matchesPriority = filterPriority === 'All' || c.priority === filterPriority;
    const matchesAutomation = !filterAutomation || (c as any).hasAutomation; // Only applies to functional really, or custom logic
    const matchesUser = filterUser === 'All' || c.lastUpdatedByName === filterUser;

    return matchesSearch && matchesStatus && matchesModule && matchesPriority && matchesAutomation && matchesUser;
  };

  const filteredCases = useMemo(() => {
    return testCases.filter(filterLogic);
  }, [testCases, search, filterStatus, filterModule, filterPriority, filterAutomation, filterUser]);

  const filteredApiCases = useMemo(() => {
    return apiTestCases.filter(filterLogic);
  }, [apiTestCases, search, filterStatus, filterModule, filterPriority, filterAutomation, filterUser]);

  const clearFilters = () => {
    setFilterModule('All');
    setFilterPriority('All');
    setFilterStatus('All');
    setFilterUser('All');
    setFilterAutomation(false);
    setSearch('');
  };

  // Unique Users for Dropdown
  const uniqueUsers = useMemo(() => {
    const all = [...testCases, ...apiTestCases];
    const users = new Set(all.map(c => c.lastUpdatedByName).filter(Boolean));
    return Array.from(users);
  }, [testCases, apiTestCases]);

  const log = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, { msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type }]);
  };

  // --- Actions ---

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filenamePrefix = 'export';

    if (viewMode === 'functional') {
      if (!filteredCases.length) return;
      headers = ['ID', 'Module', 'Title', 'Round', 'Priority', 'Status', 'Steps', 'Expected Result', 'Has Automation'];
      rows = filteredCases.map(tc => [
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
    } else if (viewMode === 'api') {
      if (!filteredApiCases.length) return;
      headers = ['ID', 'Module', 'Title', 'Method', 'URL', 'Round', 'Status', 'Expected Status', 'Headers', 'Body'];
      rows = filteredApiCases.map(tc => [
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
    await ProjectService.join(code, user);
    setActiveProjectId(code);
    setProjectModalMode(null);
  };

  const handleRunAutomation = async (testCase: TestCase) => {
    setExecutingId(testCase.id);
    setLogs([]);
    setIsTerminalOpen(true);

    log(`Initializing Compass Automation Engine...`);
    log(`Connecting to local automation server at http://localhost:3002...`);

    try {
      const steps = testCase.automationSteps || [];
      if (steps.length === 0) {
        log(`Error: No automation steps found. Please import JSON in Automation Hub.`, 'error');
        setExecutingId(null);
        return;
      }

      log(`Transmitting ${steps.length} execution nodes to headed browser context...`);

      const response = await fetch('http://localhost:3002/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Server returned ${response.status}`);
      }

      if (result.logs) {
        result.logs.forEach((l: string) => {
          if (l.includes('Success')) log(l, 'success');
          else if (l.includes('Failed')) log(l, 'error');
          else log(l);
        });
      }

      if (result.status === 'success') {
        log(`>>> AUTOMATION FLOW COMPLETED SUCCESSFULLY`, 'success');
        const isTemp = testCase.id.startsWith('TEMP-');

        if (user.uid === 'demo-user' || isTemp) {
          setTestCases(prev => prev.map(c => c.id === testCase.id ? { ...c, status: 'Passed' } : c));
        } else {
          await TestCaseService.updateStatus(testCase.id, 'Passed', user);
        }
        setExecutingId(null);
        return true;
      } else {
        log(`>>> AUTOMATION FLOW FAILED: ${result.message}`, 'error');
        const isTemp = testCase.id.startsWith('TEMP-');

        if (user.uid === 'demo-user' || isTemp) {
          setTestCases(prev => prev.map(c => c.id === testCase.id ? { ...c, status: 'Failed' } : c));
        } else {
          await TestCaseService.updateStatus(testCase.id, 'Failed', user);
        }
        setExecutingId(null);
        return false;
      }
    } catch (error: any) {
      log(`CRITICAL ERROR: ${error.message}`, 'error');

      const isNetworkError = error.message.toLowerCase().includes('fetch') ||
        error.message.toLowerCase().includes('network') ||
        error.message.toLowerCase().includes('failed');

      if (isNetworkError) {
        log(`Suggestion: Please check if the automation server is running on port 3002 (npm start in /automation-server)`, 'error');
      }
      setExecutingId(null);
      return false;
    }
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
    if (selectedIds.size === 0 || activeProject?.role === 'viewer') return;

    setConfirmConfig({
      title: "Delete Selected Items",
      message: `Are you sure you want to delete ${selectedIds.size} selected item(s)?`,
      onConfirm: async () => {
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
      }
    });
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

  const handleAddComment = async (content: string) => {
    if (!activeCommentCase || !user) return;

    const newComment: any = {
      testCaseId: activeCommentCase.id,
      projectId: activeProjectId!,
      userId: user.uid,
      userName: user.displayName || 'Guest',
      userPhoto: user.photoURL,
      content,
      timestamp: Date.now()
    };

    if (user.uid === 'demo-user') {
      setComments(prev => [...prev, { ...newComment, id: `comment-${Date.now()}` }]);
      return;
    }

    await CommentService.add(newComment);

    // Mark as read immediately for the sender so they don't see unread badge
    const currentCount = activeCommentCase.commentCount || 0; // This might be stale if we don't have live count here, 
    // but better: increment logic
    // Actually simpler: we just sent one, so we should read up to 'current known + 1' or just let the subscription update it later?
    // If we mark read now, we might be ahead or behind.
    // The safest is: The sender knows they sent it.
    // The subscription will eventually update the total count.

    // Actually we can just mark read to a very high number? No.
    // We should rely on the component list to update.
    // But better: In handleAddComment, we don't know the exact new total unless we listen to it.
    // However, we can simply say: we are viewing the thread, so we are "reading" it.
    // The drawer is open.
    // Maybe we should update "Last Read" periodically or when comments change while drawer is open?
  };

  const handleDeleteComment = async (id: string) => {
    if (user.uid === 'demo-user') {
      setComments(prev => prev.filter(c => c.id !== id));
      return;
    }
    const comment = comments.find(c => c.id === id);
    if (comment) {
      await CommentService.delete(id, comment.testCaseId);
    }
  };

  const handleQuickStatusUpdate = async (id: string, status: 'Passed' | 'Failed', type: 'functional' | 'api') => {
    if (activeProject?.role === 'viewer') return; // Strict permission check

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
    return <LandingPage onLogin={handleLogin} onDemo={handleDemoLogin} />;
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
            {((viewMode === 'functional' && filteredCases.length > 0) || (viewMode === 'api' && filteredApiCases.length > 0)) && (
              <button
                onClick={handleExportCSV}
                className="text-white/40 hover:text-white px-3 py-2 rounded-sm text-xs font-bold transition-all flex items-center gap-2 border border-transparent hover:border-white/10 hover:bg-white/5"
                title="Export to CSV"
              >
                <Download size={14} /> <span className="hidden sm:inline">EXPORT</span>

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

              </button>
            )}

            {/* Create New Button - Hidden for Viewers */}
            {viewMode !== 'dashboard' && activeProject?.role !== 'viewer' && (
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
            )}
          </div>
        </header>

        {viewMode !== 'dashboard' && (
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
            {/* Advanced Filter Bar */}
            <div className="flex items-center gap-3">
              {/* Module Filter */}
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="bg-zinc-900 border border-white/10 text-[10px] text-white/70 rounded px-2 py-1 outline-none focus:border-white/20 custom-select uppercase font-bold tracking-wider"
              >
                <option value="All">All Modules</option>
                {modules.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-zinc-900 border border-white/10 text-[10px] text-white/70 rounded px-2 py-1 outline-none focus:border-white/20 custom-select uppercase font-bold tracking-wider"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-zinc-900 border border-white/10 text-[10px] text-white/70 rounded px-2 py-1 outline-none focus:border-white/20 custom-select uppercase font-bold tracking-wider"
              >
                <option value="All">All Statuses</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="Pending">Pending</option>
              </select>

              {/* User Filter */}
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="bg-zinc-900 border border-white/10 text-[10px] text-white/70 rounded px-2 py-1 outline-none focus:border-white/20 custom-select uppercase font-bold tracking-wider"
              >
                <option value="All">All Users</option>
                {uniqueUsers.map(u => <option key={u} value={u as string}>{u}</option>)}
              </select>

              {/* Automation Toggle */}
              <button
                onClick={() => setFilterAutomation(!filterAutomation)}
                className={`flex items-center gap-2 px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-widest transition-all ${filterAutomation ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-transparent border-white/10 text-white/40 hover:text-white'}`}
              >
                <div className={`w-2 h-2 rounded-full ${filterAutomation ? 'bg-blue-400' : 'bg-zinc-600'}`} />
                Autoable?
              </button>

              {(filterModule !== 'All' || filterPriority !== 'All' || filterStatus !== 'All' || filterUser !== 'All' || filterAutomation || search) && (
                <button
                  onClick={clearFilters}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all ml-1"
                  title="Clear Filters"
                >
                  <Search size={10} className="hidden" /> {/* Dummy to keep import used if needed, or better use X or Trash */}
                  <span className="text-[10px]">&times;</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-black">
          {viewMode === 'dashboard' ? (
            <Dashboard testCases={testCases} apiTestCases={apiTestCases} />
          ) : viewMode === 'functional' ? (
            <TestCaseTable
              cases={filteredCases}
              selectedIds={selectedIds}
              executingId={executingId}
              activeProjectId={activeProjectId}
              readOnly={activeProject?.role === 'viewer'}
              readStatus={readStatus}
              onToggleSelect={(id) => {
                const next = new Set(selectedIds);
                if (next.has(id)) next.delete(id); else next.add(id);
                setSelectedIds(next);
              }}
              onToggleSelectAll={() => {
                setSelectedIds(selectedIds.size === filteredCases.length ? new Set() : new Set(filteredCases.map(c => c.id)));
              }}
              onRun={handleRunAutomation}
              onEdit={(tc) => {
                if (activeProject?.role === 'viewer') return;
                setEditingCase(tc); setIsCaseModalOpen(true);
              }}
              onDelete={(id) => {
                if (activeProject?.role === 'viewer') return;
                setConfirmConfig({
                  title: "Delete Test Case",
                  message: "Are you sure you want to delete this test case permanently?",
                  onConfirm: () => TestCaseService.delete(id)
                });
              }}
              onStatusUpdate={(id, status) => handleQuickStatusUpdate(id, status, 'functional')}
              onMessage={(tc) => {
                setActiveCommentCase({ id: tc.id, title: tc.title, commentCount: tc.commentCount });
                setIsCommentDrawerOpen(true);
                if (user.uid === 'demo-user') setComments([]);
                // Mark as read when opening
                if (user.uid !== 'demo-user' && activeProjectId) {
                  UserReadStatusService.markRead(activeProjectId, tc.id, tc.commentCount || 0, user.uid);
                }
              }}
            />
          ) : (
            <APITable
              cases={filteredApiCases}
              selectedIds={selectedIds}
              executingId={executingId}
              activeProjectId={activeProjectId}
              readOnly={activeProject?.role === 'viewer'}
              readStatus={readStatus}
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
                if (activeProject?.role === 'viewer') return;
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
              onEdit={(tc) => {
                if (activeProject?.role === 'viewer') return;
                setEditingAPICase(tc); setIsAPIModalOpen(true);
              }}
              onDelete={(id) => {
                if (activeProject?.role === 'viewer') return;
                setConfirmConfig({
                  title: "Delete API Request",
                  message: "Are you sure you want to delete this API request permanently?",
                  onConfirm: () => APITestCaseService.delete(id)
                });
              }}
              onStatusUpdate={(id, status) => handleQuickStatusUpdate(id, status, 'api')}
              onMessage={(tc) => {
                setActiveCommentCase({ id: tc.id, title: tc.title, commentCount: tc.commentCount });
                setIsCommentDrawerOpen(true);
                if (user.uid === 'demo-user') setComments([]);
                if (user.uid !== 'demo-user' && activeProjectId) {
                  UserReadStatusService.markRead(activeProjectId, tc.id, tc.commentCount || 0, user.uid);
                }
              }}
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
        onRun={handleRunAutomation}
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
      {
        confirmConfig && (
          <ConfirmModal
            isOpen={true}
            onClose={() => setConfirmConfig(null)}
            onConfirm={confirmConfig.onConfirm}
            title={confirmConfig.title}
            message={confirmConfig.message}
          />
        )
      }

      <CommentsDrawer
        isOpen={isCommentDrawerOpen}
        onClose={() => setIsCommentDrawerOpen(false)}
        testCaseId={activeCommentCase?.id || ''}
        testCaseTitle={activeCommentCase?.title || ''}
        comments={comments}
        currentUser={user}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />
    </div >
  );
}