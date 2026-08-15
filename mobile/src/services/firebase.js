import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth,
  initializeAuth, 
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";
import AsyncStorage from "../utils/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBbfBEy1-Byh-w6aug1jsjAW6xui4yQzQw",
  authDomain: "mantraai-a20c2.firebaseapp.com",
  projectId: "mantraai-a20c2",
  storageBucket: "mantraai-a20c2.firebasestorage.app",
  messagingSenderId: "1043411058142",
  appId: "1:1043411058142:web:2e0abfee452a5e14b4b14f"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with native AsyncStorage persistence, handling hot-reload duplication safely
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}

export {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
};
