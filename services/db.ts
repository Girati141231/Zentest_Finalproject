import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  getDocs,
  limit,
  orderBy,
  QueryConstraint
} from 'firebase/firestore';
import { db, appId, isConfigured } from '../firebase';
import { Project, TestCase, Module, APITestCase, Comment } from '../types';

// Paths
const PUBLIC_DATA_PATH = ['artifacts', appId, 'public', 'data'];
const USER_DATA_PATH = (uid: string) => ['artifacts', appId, 'users', uid, 'myProjects'];

// Helper to simulate delay in Demo Mode
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate sequential ID
const getNextId = async (collectionName: string, projectId: string, prefix: string = 'TC-'): Promise<string> => {
  if (!isConfigured) return `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const q = query(
      collection(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], collectionName),
      where('projectId', '==', projectId),
      //      orderBy('id', 'desc'), // Removing orderBy id because it might require a composite index which we can't easily set up here.
      // Instead, we'll fetch all matching IDs and sort in memory. Ideally, use a counter document.
      // Given the scale, client-side sorting of ID strings is acceptable risks for now, 
      // BUT string sort "TC-10" < "TC-2". We need numeric sort.
    );

    // Better approach without composite index: fetch all for project, parse, find max.
    // NOTE: For large datasets this is bad, but for a simple project tool it's fine.
    const querySnapshot = await getDocs(q);

    let maxNum = 0;
    querySnapshot.forEach((doc) => {
      const id = doc.id;
      if (id.startsWith(prefix)) {
        const numPart = parseInt(id.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error("Error generating ID:", error);
    // Fallback to random if something fails
    return `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
  }
};


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
      lastUpdatedByPhoto: user?.photoURL || null,
      timestamp
    };

    if (isNew) {
      // const idStr = `TC-${Math.floor(1000 + Math.random() * 9000)}`;
      const idStr = await getNextId('testCases', data.projectId || '');
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
      lastUpdatedByPhoto: user?.photoURL || null,
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

export const APITestCaseService = {
  save: async (data: Partial<APITestCase>, isNew: boolean, user: any) => {
    if (!isConfigured) { await delay(400); return; }
    const timestamp = Date.now();
    const audit = {
      lastUpdatedBy: user?.uid,
      lastUpdatedByName: user?.displayName || 'Unknown',
      lastUpdatedByPhoto: user?.photoURL || null,
      timestamp
    };

    if (isNew) {
      // const idStr = `API-${Math.floor(1000 + Math.random() * 9000)}`;
      // User requested TC-XXXX format for API as well, independent sequence
      const idStr = await getNextId('apiTestCases', data.projectId || '');
      const payload = { ...data, id: idStr, ...audit };
      await setDoc(doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'apiTestCases', idStr), payload);
    } else {
      if (!data.id) return;
      const payload = { ...data, ...audit };
      await updateDoc(doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'apiTestCases', data.id), payload);
    }
  },

  delete: async (id: string) => {
    if (!isConfigured) { await delay(300); return; }
    await deleteDoc(doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'apiTestCases', id));
  },

  updateStatus: async (id: string, status: string, user: any) => {
    if (!isConfigured) { await delay(200); return; }
    await updateDoc(doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'apiTestCases', id), {
      status,
      timestamp: Date.now(),
      lastUpdatedBy: user?.uid,
      lastUpdatedByName: user?.displayName || 'Unknown',
      lastUpdatedByPhoto: user?.photoURL || null
    });
  }
};

export const CommentService = {
  subscribe: (testCaseId: string, callback: (comments: Comment[]) => void) => {
    if (!isConfigured) { callback([]); return () => { }; }
    const q = query(
      collection(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'comments'),
      where('testCaseId', '==', testCaseId)
    );
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      // Sort by timestamp asc
      comments.sort((a, b) => a.timestamp - b.timestamp);
      callback(comments);
    });
  },

  add: async (comment: Omit<Comment, 'id'>) => {
    if (!isConfigured) { await delay(300); return; }
    await addDoc(collection(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'comments'), comment);
  },

  delete: async (id: string) => {
    if (!isConfigured) { await delay(300); return; }
    const ref = doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'comments', id);
    await deleteDoc(ref);
  }
};
