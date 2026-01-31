import { db } from '../firebase';
import {
    collection, doc, getDocs, getDoc, setDoc, updateDoc, writeBatch,
    query, where, orderBy, Timestamp, runTransaction
} from 'firebase/firestore';
import { LicenseKey, User } from '../types';

export const ADMIN_EMAIL = 'zentest48@gmail.com';

export const AdminService = {
    // --- License Management ---

    async generateKey(durationDays: number, count: number = 1): Promise<void> {
        const batch = writeBatch(db);

        for (let i = 0; i < count; i++) {
            const key = 'KEY-' + Math.random().toString(36).substring(2, 6).toUpperCase() +
                '-' + Math.random().toString(36).substring(2, 6).toUpperCase() +
                '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

            const keyRef = doc(db, 'licenseKeys', key);
            batch.set(keyRef, {
                key,
                durationDays,
                isUsed: false,
                createdAt: Date.now()
            });
        }

        await batch.commit();
    },

    async getAllKeys(): Promise<LicenseKey[]> {
        const q = query(collection(db, 'licenseKeys'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => d.data() as LicenseKey);
    },

    // --- User Management ---

    async getAllUsers(): Promise<User[]> {
        const q = query(collection(db, 'users'), orderBy('lastLogin', 'desc')); // Order by last login if available
        // Note: lastLogin was just added, so some users might not have it. orderBy might exclude them?
        // Let's just getAll first without strict order if indexes are tricky, or order by something else.
        // Actually, let's just use simple getDocs for now to be safe.
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    },

    async searchUser(emailOrUid: string): Promise<any | null> {
        // Try by UID first
        const docRef = doc(db, 'users', emailOrUid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }

        // Try by users (Assuming we stored email in user doc? We might not have. 
        // If not, we can only really search by UID unless we index emails.)
        // Note: The current App implementation doesn't explicitly save email to 'users' collection 
        // unless added manually. Default 'users' doc likely only has tier info.
        // We should probably rely on UID for now, or update App to store email.
        return null;
    },

    async updateUserTier(uid: string, newTier: 'free' | 'pro'): Promise<void> {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            tier: newTier,
            // If setting to free, we should probably clear validity? Or just let it expire?
            // If setting to Pro manually, we might want to give a default duration or just rely on manual extension.
            // For now, let's just toggle the flag. If setting to free, validUntil should realistically be now.
            ...(newTier === 'free' ? { validUntil: Timestamp.now() } : {})
        });
    },

    async extendUserSubscription(uid: string, daysToAdd: number): Promise<void> {
        const userRef = doc(db, 'users', uid);

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const userData = userDoc.exists() ? userDoc.data() : {};

            const currentValidUntil = userData.validUntil?.toMillis() || 0;
            const now = Date.now();
            const baseTime = currentValidUntil > now ? currentValidUntil : now;

            const addedMillis = daysToAdd * 24 * 60 * 60 * 1000;
            const newValidUntil = Timestamp.fromMillis(baseTime + addedMillis);

            transaction.set(userRef, {
                validUntil: newValidUntil,
                tier: 'pro'
            }, { merge: true });
        });
    },

    async revokeKey(key: string): Promise<void> {
        const keyRef = doc(db, 'licenseKeys', key);
        await updateDoc(keyRef, {
            isUsed: false,
            usedBy: null,
            usedByName: null,
            usedByEmail: null,
            usedAt: null
        });
    }
};
