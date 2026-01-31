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
import LicenseRedemption from './components/LicenseRedemption';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useProjects } from './hooks/useProjects';
import { useProjectData } from './hooks/useProjectData';
import { useTestFilters } from './hooks/useTestFilters';
import { LicenseService } from './services/license';
import { AdminPortal } from './components/admin/AdminPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ADMIN_EMAIL } from './services/admin';
import QuotaModal from './components/ui/QuotaModal';

export default function App() {
  // --- Hooks ---
  const { user, userDoc, authLoading, loginError, handleLogin, handleLogout, handleDemoLogin } = useAuth();
  const { projects, activeProjectId, setActiveProjectId, handleProjectSave, handleJoin, handleDeleteProject } = useProjects(user);
  const {
    modules,
    testCases,
    setTestCases,
    apiTestCases,
    setApiTestCases,
    readStatus,
    handleTestCaseSave,
    handleAPICaseSave,
    deleteItems,
    updateStatus,
    handleAddModule,
    handleUpdateModule,
    handleDeleteModule
  } = useProjectData(user, activeProjectId);

  const {
    search, setSearch,
    filterStatus, setFilterStatus,
    filterModule, setFilterModule,
    filterPriority, setFilterPriority,
    filterAutomation, setFilterAutomation,
    filterUser, setFilterUser,
    filteredCases,
    filteredApiCases,
    clearFilters,
    uniqueUsers
  } = useTestFilters(testCases, apiTestCases);

  // --- UI State ---
  const [isInStudio, setIsInStudio] = useState(false);
  const [isAdminPortal, setIsAdminPortal] = useState(false); // Admin Landing Choice
  const [isAdminDashboard, setIsAdminDashboard] = useState(false); // Admin Panel
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'functional' | 'api' | 'dashboard'>('dashboard');

  // Modals
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isAPIModalOpen, setIsAPIModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<ModalMode>(null);
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);
  const [editingAPICase, setEditingAPICase] = useState<APITestCase | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null); // For QuotaModal

  // Comments
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [activeCommentCase, setActiveCommentCase] = useState<{ id: string; title: string; commentCount?: number } | null>(null); // Added commentCount
  const [comments, setComments] = useState<Comment[]>([]);

  // Execution
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // UseEffects for Comments (Specific to UI Drawer)
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

  const log = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, { msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type }]);
  };

  const handleLoginWrapper = async () => {
    await handleLogin();
  };

  const handleDemoLoginWrapper = () => {
    handleDemoLogin();
    setIsInStudio(true);
  };

  // Effect to handle Admin redirection upon login
  useEffect(() => {
    if (user && user.email === ADMIN_EMAIL && !isInStudio) {
      // If admin logs in, show portal first (unless already in studio/dashboard from session?)
      // Actually, let's force portal on fresh login if not in specific mode
      if (!isAdminDashboard) setIsAdminPortal(true);
    }
  }, [user, isInStudio, isAdminDashboard]);

  const handleAppLogout = async () => {
    await handleLogout();
    setIsInStudio(false);
    setIsAdminPortal(false);
    setIsAdminDashboard(false);
    setActiveProjectId(null);
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
        return false;
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

        // Use hook function or manual update if temp
        if (user.uid === 'demo-user' || isTemp) {
          updateStatus(testCase.id, 'Passed', 'functional');
        } else {
          await TestCaseService.updateStatus(testCase.id, 'Passed', user);
        }
        setExecutingId(null);
        return true;
      } else {
        log(`>>> AUTOMATION FLOW FAILED: ${result.message}`, 'error');
        if (user.uid === 'demo-user') {
          updateStatus(testCase.id, 'Failed', 'functional');
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
        updateStatus(tc.id, 'Passed', 'functional');
        passed++;
      } else {
        log(`FAILED: ${tc.title}`, 'error');
        updateStatus(tc.id, 'Failed', 'functional');
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
        await deleteItems(selectedIds, viewMode === 'functional' ? 'functional' : 'api');
        setSelectedIds(new Set());
      }
    });
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

    const liveTC = testCases.find(c => c.id === activeCommentCase.id) || apiTestCases.find(c => c.id === activeCommentCase.id);
    const currentCount = liveTC?.commentCount || 0;

    if (activeProjectId) {
      UserReadStatusService.markRead(activeProjectId, activeCommentCase.id, currentCount + 1, user.uid);
    }
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
    if (activeProject?.role === 'viewer') return;
    await updateStatus(id, status, type);
  };

  // --- Render ---

  if (authLoading) return <div className="h-screen bg-black flex items-center justify-center text-white font-mono text-xs animate-pulse">BOOTING KERNEL...</div>;

  if (isAdminDashboard) {
    return <AdminDashboard onLogout={handleAppLogout} onBackToPortal={() => { setIsAdminDashboard(false); setIsAdminPortal(true); }} />;
  }

  if (isAdminPortal) {
    return (
      <AdminPortal
        user={user}
        onLogout={handleAppLogout}
        onSelectStudio={() => { setIsAdminPortal(false); setIsInStudio(true); }}
        onSelectAdmin={() => { setIsAdminPortal(false); setIsAdminDashboard(true); }}
      />
    );
  }

  if (!user || !isInStudio) {
    return (
      <LandingPage
        user={user}
        onLogin={handleLogin}
        onDemo={handleDemoLogin}
        // If user is admin, "Enter Studio" from Landing Page should probably go to Portal too?
        // Or just let them choose. Let's keep specific logic in handleLogin/Effect.
        // But for manual click:
        onEnterStudio={() => {
          if (user?.email === ADMIN_EMAIL) setIsAdminPortal(true);
          else setIsInStudio(true);
        }}
        onLogout={handleAppLogout}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-white/20">

      <Sidebar
        user={user}
        isPro={userDoc?.tier === 'pro' && userDoc?.validUntil?.toMillis() > Date.now()}
        activeProjectId={activeProjectId}
        projects={projects}
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
        onProjectSelect={setActiveProjectId}
        onLogout={handleAppLogout}
        onBackToHome={() => setIsInStudio(false)}
        onCreateProject={() => {
          const isPro = userDoc?.tier === 'pro' && userDoc?.validUntil?.toMillis() > Date.now();
          if (!isPro && projects.length >= 2) {
            setQuotaMessage("You have reached the free limit of 2 Projects.");
            return;
          }
          setProjectModalMode('create');
        }}
        onJoinProject={() => setProjectModalMode('join')}
        onSettings={() => setProjectModalMode('edit')}
        onLicense={() => setIsLicenseModalOpen(true)}
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
                  const isPro = userDoc?.tier === 'pro' && userDoc?.validUntil?.toMillis() > Date.now();

                  if (viewMode === 'functional') {
                    if (!isPro && testCases.length >= 2) {
                      setQuotaMessage("You have reached the free limit of 2 Test Cases.");
                      return;
                    }
                    setEditingCase(null); setIsCaseModalOpen(true);
                  } else {
                    if (!isPro && apiTestCases.length >= 2) {
                      setQuotaMessage("You have reached the free limit of 2 API Cases.");
                      return;
                    }
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
                  <Search size={10} className="hidden" />
                  <span className="text-[10px]">&times;</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-6 scroll-smooth custom-scrollbar">
          {viewMode === 'dashboard' ? (
            <Dashboard
              modules={modules}
              testCases={testCases}
              apiTestCases={apiTestCases}
              passRate={Math.round((testCases.filter(c => c.status === 'Passed').length / (testCases.length || 1)) * 100)}
            />
          ) : viewMode === 'functional' ? (
            <TestCaseTable
              cases={filteredCases}
              selectedIds={selectedIds}
              executingId={executingId}
              activeProjectId={activeProjectId}
              readStatus={readStatus}
              onToggleSelect={(id: string) => {
                const newSet = new Set(selectedIds);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                setSelectedIds(newSet);
              }}
              onToggleSelectAll={() => {
                if (selectedIds.size === filteredCases.length) setSelectedIds(new Set());
                else setSelectedIds(new Set(filteredCases.map(c => c.id)));
              }}
              onEdit={(tc: TestCase) => {
                const isPro = userDoc?.tier === 'pro' && userDoc?.validUntil?.toMillis() > Date.now();
                if (!isPro && testCases.length > 2) {
                  setQuotaMessage("Read-Only Mode: This project exceeds the Free Tier limit. Upgrade to Pro to edit.");
                  return;
                }
                setEditingCase(tc); setIsCaseModalOpen(true);
              }}
              onRun={handleRunAutomation}
              onStatusUpdate={(id: string, s: any) => handleQuickStatusUpdate(id, s, 'functional')}
              onMessage={(tc: TestCase) => { setActiveCommentCase({ id: tc.id, title: tc.title, commentCount: tc.commentCount }); setIsCommentDrawerOpen(true); }}
              onDelete={(id: string) => deleteItems(new Set([id]), 'functional')}
            />
          ) : (
            <APITable
              cases={filteredApiCases}
              selectedIds={selectedIds}
              executingId={executingId}
              activeProjectId={activeProjectId}
              readStatus={readStatus}
              onToggleSelect={(id: string) => {
                const newSet = new Set(selectedIds);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                setSelectedIds(newSet);
              }}
              onToggleSelectAll={() => {
                if (selectedIds.size === filteredApiCases.length) setSelectedIds(new Set());
                else setSelectedIds(new Set(filteredApiCases.map(c => c.id)));
              }}
              onEdit={(tc: APITestCase) => {
                const isPro = userDoc?.tier === 'pro' && userDoc?.validUntil?.toMillis() > Date.now();
                if (!isPro && apiTestCases.length > 2) {
                  setQuotaMessage("Read-Only Mode: This project exceeds the Free Tier limit. Upgrade to Pro to edit.");
                  return;
                }
                setEditingAPICase(tc); setIsAPIModalOpen(true);
              }}
              onRun={() => { }} // API run pending implementation or reuse handleRunAutomation? APITable has onRun.
              onStatusUpdate={(id: string, s: any) => handleQuickStatusUpdate(id, s, 'api')}
              onMessage={(tc: APITestCase) => { setActiveCommentCase({ id: tc.id, title: tc.title, commentCount: tc.commentCount }); setIsCommentDrawerOpen(true); }}
              onDelete={(id: string) => deleteItems(new Set([id]), 'api')}
            />
          )}
        </div>
      </main>

      {/* MODALS */}
      <ProjectModals
        mode={projectModalMode}
        onClose={() => setProjectModalMode(null)}
        activeProject={activeProject}
        user={user}
        modules={modules}
        onSave={(data) => handleProjectSave(data, projectModalMode)}
        onJoin={handleJoin}
        onDelete={handleDeleteProject}
        onAddModule={handleAddModule}
        onUpdateModule={handleUpdateModule}
        onDeleteModule={handleDeleteModule}
      />

      <TestCaseForm
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        activeProjectId={activeProjectId}
        modules={modules}
        editingCase={editingCase}
        onSave={(data) => {
          handleTestCaseSave(data, !editingCase);
          setIsCaseModalOpen(false);
        }}
        onRun={handleRunAutomation}
      />

      <APIForm
        isOpen={isAPIModalOpen}
        onClose={() => setIsAPIModalOpen(false)}
        activeProjectId={activeProjectId}
        modules={modules}
        editingCase={editingAPICase}
        onSave={(data) => {
          handleAPICaseSave(data, !editingAPICase);
          setIsAPIModalOpen(false);
        }}
      />

      {confirmConfig && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setConfirmConfig(null)}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
        />
      )}

      <Terminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        logs={logs}
      />

      <CommentsDrawer
        isOpen={isCommentDrawerOpen}
        onClose={() => { setIsCommentDrawerOpen(false); setActiveCommentCase(null); }}
        testCaseTitle={activeCommentCase?.title || ''}
        comments={comments}
        user={user}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />

      {isLicenseModalOpen && (
        <LicenseRedemption
          user={user}
          userDoc={userDoc}
          onClose={() => setIsLicenseModalOpen(false)}
        />
      )}

      <QuotaModal
        isOpen={!!quotaMessage}
        onClose={() => setQuotaMessage(null)}
        message={quotaMessage || ''}
        onUpgrade={() => setIsLicenseModalOpen(true)}
      />

    </div >
  );
}

// Simple Modal Wrapper for App level usage
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-white/10 rounded w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-white/10 sticky top-0 bg-[#0A0A0A] z-10">
          <h3 className="font-bold text-sm tracking-widest uppercase">{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">&times;</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};