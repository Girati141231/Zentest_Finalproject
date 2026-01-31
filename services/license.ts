import { db } from '../firebase';
import { doc, getDoc, updateDoc, runTransaction, collection, query, where, getDocs, Timestamp, setDoc } from 'firebase/firestore';
import { LicenseKey } from '../types';

export const LicenseService = {
    async redeem(key: string, userId: string): Promise<{ success: boolean; message: string; newExpiry?: number }> {
        try {
            // 1. Validate Key Format/Existence
            if (!key) throw new Error("Invalid license key");

            const keyRef = doc(db, 'licenseKeys', key);
            const userRef = doc(db, 'users', userId);

            return await runTransaction(db, async (transaction) => {
                const keyDoc = await transaction.get(keyRef);

                if (!keyDoc.exists()) {
                    // Try searching by field if ID doesn't match (optional, but ID lookup is safer/faster)
                    throw new Error("License key not found");
                }

                const keyData = keyDoc.data() as LicenseKey;

                if (keyData.isUsed) {
                    throw new Error("This license key has already been used");
                }

                // 2. Calculate New Expiry
                const userDoc = await transaction.get(userRef);
                const userData = userDoc.exists() ? userDoc.data() : {};

                const currentValidUntil = userData.validUntil?.toMillis() || 0;
                const now = Date.now();

                // If current validUntil is in the future, extend from there. Otherwise start from now.
                const baseTime = currentValidUntil > now ? currentValidUntil : now;
                const addedMillis = keyData.durationDays * 24 * 60 * 60 * 1000;
                const newValidUntilMillis = baseTime + addedMillis;
                const newValidUntil = Timestamp.fromMillis(newValidUntilMillis);

                // 3. Commit Updates
                transaction.update(keyRef, {
                    isUsed: true,
                    usedBy: userId,
                    usedByName: userData.displayName || 'Unknown User',
                    usedByEmail: userData.email || 'No Email',
                    usedAt: Timestamp.now()
                });

                transaction.set(userRef, {
                    validUntil: newValidUntil,
                    tier: 'pro' // Assuming redemption grants Pro
                }, { merge: true });

                return {
                    success: true,
                    message: `Successfully extended Pro membership by ${keyData.durationDays} days.`,
                    newExpiry: newValidUntilMillis
                };
            });

        } catch (error: any) {
            console.error("Redemption failed:", error);
            return { success: false, message: error.message || "Redemption failed" };
        }
    },

    async generateTestKey(durationDays: number = 30): Promise<string> {
        // Using simple random string for test key
        const key = 'TEST-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        const keyRef = doc(db, 'licenseKeys', key);

        await setDoc(keyRef, {
            key,
            durationDays,
            isUsed: false,
            createdAt: Date.now()
        });

        return key;
    }
};
