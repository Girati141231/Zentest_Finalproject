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
  QueryConstraint,
  increment,
  getDoc
} from 'firebase/firestore';
import { db, appId, isConfigured } from '../firebase';
import { Project, Module, TestCase, APITestCase, Comment } from '../types';
import { NotificationService } from './NotificationService';

// Paths
const PUBLIC_DATA_PATH = ['artifacts', appId, 'public', 'data'];
const USER_DATA_PATH = (uid: string) => ['artifacts', appId, 'users', uid, 'myProjects'];
// Helper to join path segments
const getProjectMembersCollection = (projectId: string) =>
  collection(db, ...['artifacts', appId, 'public', 'data', 'projects', projectId, 'members']);
// Or just use join if spread is issue
const getProjectMemberDoc = (projectId: string, uid: string) =>
  doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId, 'members', uid);

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

    // Generate standardized 8-char invite code
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 1. Create in Public Data
    const projectRef = await addDoc(collection(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'projects'), {
      ...data,
      owner: uid,
      inviteCode,
      createdAt: serverTimestamp()
    });

    // 2. Link to User's "My Projects"
    await setDoc(doc(db, USER_DATA_PATH(uid)[0], USER_DATA_PATH(uid)[1], USER_DATA_PATH(uid)[2], USER_DATA_PATH(uid)[3], USER_DATA_PATH(uid)[4], projectRef.id), {
      joinedAt: Date.now(),
      role: 'owner'
    });

    // 3. Add to Project Members Collection
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectRef.id, 'members', uid), {
      uid,
      role: 'owner',
      joinedAt: Date.now(),
    });

    return projectRef.id;
  },

  // Professional discovery mechanism
  getProjectPreview: async (inviteCode: string): Promise<Project | null> => {
    if (!isConfigured) return null;
    const q = query(
      collection(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'projects'),
      where('inviteCode', '==', inviteCode.trim().toUpperCase()),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Project;
  },

  // User joining a project via invite code
  join: async (inviteCode: string, user: any) => {
    if (!isConfigured) { await delay(500); return; }

    const project = await ProjectService.getProjectPreview(inviteCode);
    if (!project) throw new Error("Invalid invitation code");

    const projectId = project.id;

    const targetRole = project.owner === user.uid ? 'owner' : 'viewer';

    // 1. Add to My Projects
    await setDoc(doc(db, USER_DATA_PATH(user.uid)[0], USER_DATA_PATH(user.uid)[1], USER_DATA_PATH(user.uid)[2], USER_DATA_PATH(user.uid)[3], USER_DATA_PATH(user.uid)[4], projectId), {
      joinedAt: Date.now(),
      role: targetRole
    });

    // 2. Add to Project Members
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId, 'members', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: targetRole,
      joinedAt: Date.now()
    });

    // 3. Notify Owner
    if (project.owner && project.owner !== user.uid) {
      await NotificationService.add({
        userId: project.owner,
        projectId,
        title: 'New Project Member',
        message: `${user.displayName || 'Someone'} joined via invite code.`,
        type: 'request',
        userPhoto: user.photoURL
      });
    }

    return projectId;
  },

  resetInviteCode: async (projectId: string) => {
    if (!isConfigured) return;
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const ref = doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'projects', projectId);
    await updateDoc(ref, { inviteCode: newCode });
    return newCode;
  },

  getMembers: (projectId: string, callback: (members: any[]) => void) => {
    if (!isConfigured) { callback([]); return () => { }; }
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'projects', projectId, 'members'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => d.data()));
    });
  },

  updateMemberRole: async (projectId: string, memberId: string, newRole: string) => {
    if (!isConfigured) { await delay(300); return; }

    // 1. Update in Project Members
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId, 'members', memberId), { role: newRole });

    // 2. Update in User's My Projects
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', memberId, 'myProjects', projectId), { role: newRole });
    } catch (e) {
      console.warn("Could not update user's private project role copy:", e);
    }
  },

  kickMember: async (projectId: string, memberId: string) => {
    if (!isConfigured) await delay(300);

    // 1. Remove from Project Members
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId, 'members', memberId));

    // 2. Remove from User's My Projects
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', memberId, 'myProjects', projectId));
    } catch (e) {
      console.warn("Could not remove from user's private list:", e);
    }
  },

  syncMemberProfile: async (projectId: string, user: any) => {
    if (!isConfigured) return;
    const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId, 'members', user.uid);
    // Silent update, no await needed usually but better to be safe
    // We only update if data is different? Or just always update on open?
    // Always update is safer to catch any drift, it's cheap enough.
    try {
      await updateDoc(memberRef, {
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: user.email
      });
    } catch (e) {
      // Ignore if doc doesn't exist (viewer who hasn't been added properly? or just fails)
      console.log("Sync profile silent fail:", e);
    }
  },

  updatePresence: async (projectId: string, uid: string) => {
    if (!isConfigured) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId, 'members', uid), {
        lastSeen: Date.now(),
        isOnline: true
      });
    } catch (e) {
      // Ignore presence update errors to avoid spamming logs
    }
  },

  requestAccess: async (projectId: string, uid: string) => {
    if (!isConfigured) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId, 'members', uid), {
      accessRequested: true
    });
  },

  resolveAccessRequest: async (projectId: string, uid: string, approved: boolean) => {
    if (!isConfigured) return;
    const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId, 'members', uid);

    if (approved) {
      // Approve: Update role to editor and remove request flag
      await updateDoc(memberRef, {
        role: 'editor',
        accessRequested: false // or use deleteField() if prefer cleaner db
      });
      // Also update user's private copy if possible
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'users', uid, 'myProjects', projectId), { role: 'editor' });
      } catch (e) {
        console.warn("Could not update user's private project role copy (resolve):", e);
      }

      // Notify User
      await NotificationService.add({
        userId: uid,
        projectId,
        title: 'Access Approved',
        message: 'Your request for edit access has been approved!',
        type: 'system'
      });
    } else {
      // Deny: Just remove the request flag
      await updateDoc(memberRef, {
        accessRequested: false
      });
    }
  },

  update: async (id: string, data: Partial<Project>) => {
    if (!isConfigured) { await delay(300); return; }
    const ref = doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'projects', id);
    await updateDoc(ref, data);
  },

  leave: async (id: string, uid: string) => {
    if (!isConfigured) { await delay(300); return; }
    // 1. Remove from My Projects
    await deleteDoc(doc(db, USER_DATA_PATH(uid)[0], USER_DATA_PATH(uid)[1], USER_DATA_PATH(uid)[2], USER_DATA_PATH(uid)[3], USER_DATA_PATH(uid)[4], id));

    // 2. Remove from Project Members
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', id, 'members', uid));
  },

  delete: async (id: string) => {
    if (!isConfigured) { await delay(300); return; }
    // Delete the project document
    await deleteDoc(doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'projects', id));
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

  updateStatus: async (id: string, status: string, user: any, extraData: any = {}) => {
    if (!isConfigured) { await delay(200); return; }
    await updateDoc(doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'apiTestCases', id), {
      status,
      ...extraData,
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

    // 1. Add Comment
    await addDoc(collection(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'comments'), comment);

    // 2. Increment Count on Parent
    const parentCollection = comment.testCaseId.startsWith('API-') ? 'apiTestCases' : 'testCases';
    const parentRef = doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], parentCollection, comment.testCaseId);
    await updateDoc(parentRef, {
      commentCount: increment(1)
    });
  },

  delete: async (id: string, testCaseId: string) => { // Updated signature to cleanup easier if we wanted, but logic below handles it via lookup
    // Actually we kept signature compatible but logic inside does the lookup.
    if (!isConfigured) { await delay(300); return; }
    const ref = doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'comments', id);

    // 1. Get comment to know parent
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Comment;

    // 2. Delete
    await deleteDoc(ref);

    // 3. Decrement Parent
    if (data.testCaseId) {
      const parentCollection = data.testCaseId.startsWith('API-') ? 'apiTestCases' : 'testCases';
      const parentRef = doc(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], parentCollection, data.testCaseId);
      await updateDoc(parentRef, {
        commentCount: increment(-1)
      });
    }
  }
};

export const UserReadStatusService = {
  subscribe: (projectId: string, uid: string, callback: (readCounts: Record<string, number>) => void) => {
    if (!isConfigured) { callback({}); return () => { }; }
    const ref = doc(db, 'artifacts', appId, 'users', uid, 'projectReadStatus', projectId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Record<string, number>);
      } else {
        callback({});
      }
    });
  },

  markRead: async (projectId: string, testCaseId: string, count: number, uid: string) => {
    if (!isConfigured) return;
    const ref = doc(db, 'artifacts', appId, 'users', uid, 'projectReadStatus', projectId);
    // Use setDoc with merge to update just this key
    await setDoc(ref, {
      [testCaseId]: count
    }, { merge: true });
  }
};

export const ExecutionHistoryService = {
  add: async (entry: Omit<import('../types').ExecutionHistory, 'id'>) => {
    if (!isConfigured) return;
    try {
      await addDoc(collection(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'executionLogs'), {
        ...entry,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error("Failed to save execution log:", e);
    }
  },

  list: async (testCaseId: string) => {
    if (!isConfigured) return [];
    try {
      const q = query(
        collection(db, PUBLIC_DATA_PATH[0], PUBLIC_DATA_PATH[1], PUBLIC_DATA_PATH[2], PUBLIC_DATA_PATH[3], 'executionLogs'),
        where('testCaseId', '==', testCaseId)
      );
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as import('../types').ExecutionHistory));
      return logs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error("Failed to load history:", e);
      return [];
    }
  }
};
