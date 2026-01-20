import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

declare global {
  interface Window {
    __firebase_config?: any;
    __app_id?: string;
  }
}

const getFirebaseConfig = () => {
  // Check for injected config first (useful for specific deployments)
  if (window.__firebase_config) {
    return typeof window.__firebase_config === 'string' 
      ? JSON.parse(window.__firebase_config) 
      : window.__firebase_config;
  }

  // Use the provided production configuration
  return {
    apiKey: "AIzaSyA-bmsxiuy9_xlHXUiOXLNFRvfAK8N2UBE",
    authDomain: "tester-app-2768b.firebaseapp.com",
    projectId: "tester-app-2768b",
    storageBucket: "tester-app-2768b.firebasestorage.app",
    messagingSenderId: "1096428156038",
    appId: "1:1096428156038:web:9df87b24523692eaff8d07",
    measurementId: "G-6LNX2MD9VL"
  };
};

const firebaseConfig = getFirebaseConfig();

// Helper to check if we are using a real config or the dummy one
export const isConfigured = !firebaseConfig.apiKey.includes("DummyKey");

export const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'zentest-compact-shared';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export { auth, db };