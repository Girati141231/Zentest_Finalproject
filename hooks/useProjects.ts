import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, appId, isConfigured } from '../firebase';
import { Project, ModalMode } from '../types';
import { ProjectService } from '../services/db';

const MOCK_PROJECTS: Project[] = [
    { id: 'demo-1', name: 'ZenTest Demo', color: '#3b82f6', initial: 'ZD', owner: 'demo-user' },
    { id: 'demo-2', name: 'Mobile App', color: '#10b981', initial: 'MA', owner: 'demo-user' }
];

export const useProjects = (user: any) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    // Modals state helper inside App or keep here? 
    // Maybe keep modal state in App.tsx but actions here?
    // Let's keep data logic here.

    useEffect(() => {
        if (!user) return;

        if (!isConfigured || user.uid === 'demo-user') {
            setProjects(MOCK_PROJECTS);
            setActiveProjectId(MOCK_PROJECTS[0].id);
            return;
        }

        const myProjectsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'myProjects');
        const unsubMyProjects = onSnapshot(myProjectsRef, (snapshot) => {
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
                    .map(p => ({
                        ...p,
                        role: p.owner === user.uid ? 'owner' : (myRoles.get(p.id) as any)
                    }));

                setProjects(myData);
                // Only auto-select if no active project or active one is gone
                if (myData.length > 0) {
                    setActiveProjectId((prev: string | null) => {
                        const stillExists = myData.find(p => p.id === prev);
                        return stillExists ? prev : myData[0].id;
                    });
                } else {
                    setActiveProjectId(null);
                }
            });
            return () => unsubPublic();
        });
        return () => unsubMyProjects();
    }, [user]);

    const handleProjectSave = async (data: any, projectModalMode: ModalMode) => {
        if (!user) return;
        const initial = data.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
        const payload = { ...data, initial };

        if (user.uid === 'demo-user') {
            if (projectModalMode === 'edit' && activeProjectId) {
                setProjects((prev: Project[]) => prev.map((p: Project) => p.id === activeProjectId ? { ...p, ...payload } : p));
            } else {
                const newId = `demo-new-${Date.now()}`;
                setProjects((prev: Project[]) => [...prev, { ...payload, id: newId, owner: 'demo-user', color: payload.color || '#fff' }]);
                setActiveProjectId(newId);
            }
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
        const joinedId = await ProjectService.join(code, user);
        if (joinedId) setActiveProjectId(joinedId);
    };

    const handleDeleteProject = async (id: string, isOwner: boolean) => {
        if (user.uid === 'demo-user') {
            setProjects((prev: Project[]) => prev.filter((p: Project) => p.id !== id));
            if (activeProjectId === id) setActiveProjectId(null);
            return;
        }

        if (isOwner) {
            await ProjectService.delete(id);
        } else {
            await ProjectService.leave(id, user.uid);
        }
        if (activeProjectId === id) setActiveProjectId(null);
    };

    return {
        projects,
        setProjects, // Exposed for demo mode manipulations if needed, or internalize
        activeProjectId,
        setActiveProjectId,
        handleProjectSave,
        handleJoin,
        handleDeleteProject
    };
};
