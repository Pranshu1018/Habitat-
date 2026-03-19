// Firebase Configuration - Realtime Database
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAvDCsqy6QQhhFGw-G4U64kFy1hdAws76o",
  authDomain: "habitat-4e3cc.firebaseapp.com",
  databaseURL: "https://habitat-4e3cc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "habitat-4e3cc",
  storageBucket: "habitat-4e3cc.firebasestorage.app",
  messagingSenderId: "932650675475",
  appId: "1:932650675475:web:d241a72a663ed1178cbee6",
  measurementId: "G-QD2DY60SC8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

// authReady resolves once anonymous sign-in completes.
// All DB operations should await this before touching Firebase.
export const authReady: Promise<void> = signInAnonymously(auth)
  .then(() => { /* signed in */ })
  .catch((err) => {
    console.warn('[Firebase] Anonymous sign-in failed:', err.code, err.message);
  });

export { app, analytics, db, auth, storage };
