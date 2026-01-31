import { useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from 'firebase/auth';
import { auth, isConfigured, db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [userDoc, setUserDoc] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [loginError, setLoginError] = useState<string | null>(null);

    useEffect(() => {
        const initAuth = async () => {
            // ... existing init logic if any
        };
        initAuth();

        if (isConfigured) {
            return onAuthStateChanged(auth, (u) => {
                setUser(u);
                if (!u) {
                    setUserDoc(null);
                    setAuthLoading(false);
                }
            });
        } else {
            setAuthLoading(false);
        }
    }, []);

    // Sync User Profile Data (Subscription)


    // Sync User Profile Data (Subscription)
    useEffect(() => {
        if (!user || !user.uid) {
            if (!user) setUserDoc(null);
            return;
        }

        if (user.uid === 'demo-user') {
            setUserDoc({ tier: 'pro', validUntil: { toMillis: () => Date.now() + 86400000 * 30 } });
            setAuthLoading(false); // Ensure loading stops
            return;
        }

        const userRef = doc(db, 'users', user.uid);

        // Sync auth profile to Firestore
        setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: Date.now()
        }, { merge: true }).catch(err => console.error("Profile sync failed", err));

        const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                setUserDoc(doc.data());
            } else {
                setUserDoc({}); // No doc yet
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDemoLogin = () => {
        setUser({ uid: 'demo-user', displayName: 'Guest User', photoURL: null, email: 'guest@zentest.local' });
        // Loading state handled in effect
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

    return {
        user,
        userDoc,
        authLoading,
        loginError,
        handleLogin,
        handleLogout,
        handleDemoLogin
    };
};
