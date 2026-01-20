import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, appId, isConfigured } from '../firebase';
import { Project, TestCase, Module } from '../types';

// Paths
const PUBLIC_DATA_PATH = ['artifacts', appId, 'public', 'data'];
const USER_DATA_PATH = (uid: string) => ['artifacts', appId, 'users', uid, 'myProjects'];

// Helper to simulate delay in Demo Mode
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ProjectService = {
  create: async (data: Partial<Project>, uid: string) => {
    if (!isConfigured) {
      await delay(500);
      return `demo-project-${Date.now()}`;
    }

    // 1. Create in Public Data
    const projectRef = await addDoc(collection(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'projects'), {
      ...data,
      owner: uid,
      createdAt: serverTimestamp()
    });

    // 2. Link to User's "My Projects"
    await setDoc(doc(db, USER_DATA_PATH(uid)[0], USER_DATA_PATH(uid)[1], USER_DATA_PATH(uid)[2], USER_DATA_PATH(uid)[3], USER_DATA_PATH(uid)[4], projectRef.id), {
      joinedAt: Date.now(),
      role: 'owner'
    });

    return projectRef.id;
  },

  join: async (projectId: string, uid: string) => {
    if (!isConfigured) { await delay(500); return; }
    await setDoc(doc(db, USER_DATA_PATH(uid)[0], USER_DATA_PATH(uid)[1], USER_DATA_PATH(uid)[2], USER_DATA_PATH(uid)[3], USER_DATA_PATH(uid)[4], projectId), {
      joinedAt: Date.now(),
      role: 'member'
    });
  },

  update: async (id: string, data: Partial<Project>) => {
    if (!isConfigured) { await delay(300); return; }
    const ref = doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'projects', id);
    await updateDoc(ref, data);
  },

  leave: async (id: string, uid: string) => {
    if (!isConfigured) { await delay(300); return; }
    await deleteDoc(doc(db, USER_DATA_PATH(uid)[0], USER_DATA_PATH(uid)[1], USER_DATA_PATH(uid)[2], USER_DATA_PATH(uid)[3], USER_DATA_PATH(uid)[4], id));
  },

  delete: async (id: string) => {
    if (!isConfigured) { await delay(300); return; }
    // Delete the project document
    await deleteDoc(doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'projects', id));

    // Note: In a real production app, you would use a Cloud Function to handle cascading deletes 
    // of modules and test cases to ensure data integrity and security.
    // For this client-side implementation, we rely on the client to clean up or just leave orphaned data 
    // which is acceptable for this scale.
  }
};

export const TestCaseService = {
  save: async (data: Partial<TestCase>, isNew: boolean, user: any) => {
    if (!isConfigured) { await delay(400); return; }
    const timestamp = Date.now();
    const audit = {
      lastUpdatedBy: user?.uid,
      lastUpdatedByName: user?.displayName || 'Unknown',
      timestamp
    };

    if (isNew) {
      const idStr = `TC-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = { ...data, id: idStr, ...audit };
      await setDoc(doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'testCases', idStr), payload);
    } else {
      if (!data.id) return;
      const payload = { ...data, ...audit };
      await updateDoc(doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'testCases', data.id), payload);
    }
  },

  delete: async (id: string) => {
    if (!isConfigured) { await delay(300); return; }
    await deleteDoc(doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'testCases', id));
  },

  updateStatus: async (id: string, status: string, user: any) => {
    if (!isConfigured) { await delay(200); return; }
    await updateDoc(doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'testCases', id), {
      status,
      lastUpdatedBy: user?.uid,
      lastUpdatedByName: user?.displayName || 'Unknown',
      timestamp: Date.now()
    });
  }
};

export const ModuleService = {
  add: async (name: string, projectId: string) => {
    if (!isConfigured) { await delay(300); return; }
    await addDoc(collection(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'modules'), {
      projectId,
      name
    });
  },

  update: async (id: string, name: string) => {
    if (!isConfigured) { await delay(300); return; }
    await updateDoc(doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'modules', id), { name });
  },

  delete: async (id: string) => {
    if (!isConfigured) { await delay(300); return; }
    await deleteDoc(doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'modules', id));
  }
};
