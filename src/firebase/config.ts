// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC89qmWcGkC24d0L6tI7IsQHFeuI91jTSI",
  authDomain: "verified-resumes.firebaseapp.com",
  projectId: "verified-resumes",
  storageBucket: "verified-resumes.firebasestorage.app",
  messagingSenderId: "64952394225",
  appId: "1:64952394225:web:c4f098aefd20f54d2d6450",
  measurementId: "G-13081P35Q0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (only in browser)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, analytics };
export default app;

