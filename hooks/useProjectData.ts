import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, appId, isConfigured } from '../firebase';
import { TestCase, APITestCase, Module, Comment, Project } from '../types';
import { TestCaseService, APITestCaseService, CommentService, UserReadStatusService, ModuleService } from '../services/db';

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

export const useProjectData = (user: any, activeProjectId: string | null) => {
    const [modules, setModules] = useState<Module[]>([]);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [apiTestCases, setApiTestCases] = useState<APITestCase[]>([]);
    const [readStatus, setReadStatus] = useState<Record<string, number>>({});
    const [comments, setComments] = useState<Comment[]>([]);

    useEffect(() => {
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

        const modulesQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'modules'), where('projectId', '==', activeProjectId));
        const casesQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'testCases'), where('projectId', '==', activeProjectId));
        const apiQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'apiTestCases'), where('projectId', '==', activeProjectId));

        const opts = { includeMetadataChanges: true };
        const unsubModules = onSnapshot(modulesQuery, opts, (s: any) => setModules(s.docs.map((d: any) => ({ id: d.id, ...d.data() } as Module))));
        const unsubCases = onSnapshot(casesQuery, opts, (s: any) => setTestCases(s.docs.map((d: any) => ({ id: d.id, ...d.data() } as TestCase))));
        const unsubAPI = onSnapshot(apiQuery, opts, (s: any) => setApiTestCases(s.docs.map((d: any) => ({ id: d.id, ...d.data() } as APITestCase))));

        return () => { unsubModules(); unsubCases(); unsubAPI(); };
    }, [user, activeProjectId]);

    useEffect(() => {
        if (!activeProjectId || !user || user.uid === 'demo-user') return;
        const unsub = UserReadStatusService.subscribe(activeProjectId, user.uid, setReadStatus);
        return () => unsub();
    }, [activeProjectId, user]);

    // Actions
    const handleTestCaseSave = async (data: Partial<TestCase>, isNew: boolean) => {
        const audit = {
            lastUpdatedBy: user?.uid,
            lastUpdatedByName: user?.displayName || 'Unknown',
            lastUpdatedByPhoto: user?.photoURL || null,
            timestamp: Date.now()
        };
        const payload = { ...data, ...audit };

        // auto-create module if it doesn't exist
        if (data.module && data.module.trim() !== '' && !modules.some(m => m.name.toLowerCase() === data.module!.toLowerCase())) {
            await handleAddModule(data.module);
        }

        // Optimistic Update
        if (!isNew && data.id) {
            setTestCases((prev: TestCase[]) => prev.map(c => c.id === data.id ? { ...c, ...payload } as TestCase : c));
        }

        if (user.uid === 'demo-user') {
            if (isNew) {
                setTestCases((prev: TestCase[]) => [...prev, { ...payload, id: `TC-${Math.floor(Math.random() * 10000)}` } as TestCase]);
            }
            return;
        }
        await TestCaseService.save(payload, isNew, user);
    };

    const handleAPICaseSave = async (data: Partial<APITestCase>, isNew: boolean) => {
        const audit = {
            lastUpdatedBy: user?.uid,
            lastUpdatedByName: user?.displayName || 'Unknown',
            lastUpdatedByPhoto: user?.photoURL || null,
            timestamp: Date.now()
        };
        const payload = { ...data, ...audit };

        // auto-create module if it doesn't exist
        if (data.module && data.module.trim() !== '' && !modules.some(m => m.name.toLowerCase() === data.module!.toLowerCase())) {
            await handleAddModule(data.module);
        }

        // Optimistic Update
        if (!isNew && data.id) {
            setApiTestCases((prev: APITestCase[]) => prev.map(c => c.id === data.id ? { ...c, ...payload } as APITestCase : c));
        }

        if (user.uid === 'demo-user') {
            if (isNew) {
                setApiTestCases((prev: APITestCase[]) => [...prev, { ...payload, id: `API-${Math.floor(Math.random() * 10000)}` } as APITestCase]);
            }
            return;
        }
        await APITestCaseService.save(payload, isNew, user);
    };

    const deleteItems = async (ids: Set<string>, viewMode: 'functional' | 'api') => {
        const idsToDelete = Array.from(ids);
        if (user.uid === 'demo-user') {
            if (viewMode === 'functional') setTestCases((prev: TestCase[]) => prev.filter(c => !ids.has(c.id)));
            else setApiTestCases((prev: APITestCase[]) => prev.filter(c => !ids.has(c.id)));
            return;
        }
        if (viewMode === 'functional') await Promise.all(idsToDelete.map(id => TestCaseService.delete(id)));
        else await Promise.all(idsToDelete.map(id => APITestCaseService.delete(id)));
    };

    const updateStatus = async (id: string, status: 'Passed' | 'Failed', type: 'functional' | 'api', extraData: any = {}) => {
        // Optimistic Update
        const update = { status, ...extraData, timestamp: Date.now(), lastUpdatedBy: user?.uid, lastUpdatedByName: user?.displayName || 'Guest' };
        if (type === 'functional') {
            setTestCases((prev: TestCase[]) => prev.map(c => c.id === id ? { ...c, ...update } as TestCase : c));
        } else {
            setApiTestCases((prev: APITestCase[]) => prev.map(c => c.id === id ? { ...c, ...update } : c));
        }

        if (user.uid === 'demo-user') return;

        if (type === 'functional') await TestCaseService.updateStatus(id, status, user);
        else await APITestCaseService.updateStatus(id, status, user, extraData);
    };

    const handleAddModule = async (name: string) => {
        if (!activeProjectId) return;
        if (user.uid === 'demo-user') {
            setModules((prev: Module[]) => [...prev, { id: `mod-${Date.now()}`, projectId: activeProjectId, name }]);
            return;
        }
        await ModuleService.add(name, activeProjectId);
    };

    const handleUpdateModule = async (id: string, name: string) => {
        if (user.uid === 'demo-user') {
            setModules((prev: Module[]) => prev.map(m => m.id === id ? { ...m, name } : m));
            return;
        }
        await ModuleService.update(id, name);
    };

    const handleDeleteModule = async (id: string) => {
        if (user.uid === 'demo-user') {
            setModules((prev: Module[]) => prev.filter(m => m.id !== id));
            return;
        }
        await ModuleService.delete(id);
    };


    const allModules = useMemo(() => {
        const list = [...modules];
        const existingNames = new Set(modules.map(m => m.name.toLowerCase()));

        const discoveredNames = new Set<string>();
        // Always suggest 'General' as it's the system default fallback
        discoveredNames.add('General');

        [...testCases, ...apiTestCases].forEach(tc => {
            if (tc.module && tc.module.trim() !== '') {
                discoveredNames.add(tc.module.trim());
            }
        });

        discoveredNames.forEach(name => {
            if (!existingNames.has(name.toLowerCase())) {
                const isGeneral = name.toLowerCase() === 'general';
                list.push({
                    id: isGeneral ? 'default-general' : `discovered-${name}`,
                    name,
                    projectId: activeProjectId || ''
                } as Module);
            }
        });

        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [modules, testCases, apiTestCases, activeProjectId]);


    return {
        modules,
        allModules,
        testCases,
        setTestCases, // Exposed for automation / bulk run updates
        apiTestCases,
        setApiTestCases, // Exposed
        readStatus,
        handleTestCaseSave,
        handleAPICaseSave,
        deleteItems,
        updateStatus,
        handleAddModule,
        handleUpdateModule,
        handleDeleteModule
    };
};
