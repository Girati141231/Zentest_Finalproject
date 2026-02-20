import {
    collection,
    addDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    doc,
    updateDoc,
    writeBatch,
    limit,
    getDocs
} from 'firebase/firestore';
import { db, isConfigured } from '../firebase';
import { Notification } from '../types';

const COLLECTION_NAME = 'notifications';

export const NotificationService = {
    // Stream notifications for a user
    getNotifications: (userId: string, callback: (notifications: Notification[]) => void) => {
        if (!isConfigured || !userId) return () => { };

        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            limit(50)
        );

        return onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[];
            // Client-side sort if Firestore orderBy is missing
            notifs.sort((a, b) => b.timestamp - a.timestamp);
            callback(notifs);
        });
    },

    // Create a new notification
    add: async (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
        if (!isConfigured) return;

        await addDoc(collection(db, COLLECTION_NAME), {
            ...notification,
            isRead: false,
            timestamp: Date.now()
        });
    },

    // Mark as read
    markRead: async (id: string) => {
        if (!isConfigured) return;
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { isRead: true });
    },

    // Mark all as read
    markAllRead: async (userId: string) => {
        if (!isConfigured) return;

        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            where('isRead', '==', false)
        );

        const snapshot = await getDocs(q);
        const batch = writeBatch(db);

        snapshot.docs.forEach((d) => {
            batch.update(d.ref, { isRead: true });
        });

        await batch.commit();
    },

    // Clear all
    clearAll: async (userId: string) => {
        if (!isConfigured) return;

        const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);

        snapshot.docs.forEach((d) => {
            batch.delete(d.ref);
        });

        await batch.commit();
    }
};
