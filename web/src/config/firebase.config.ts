import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "AIzaSyAFZiechFyN9A4nmfMlLJ_udflX6MJj1P8",
//   authDomain: "challenge-broadcast-tecuc.firebaseapp.com",
//   projectId: "challenge-broadcast-tecuc",
//   storageBucket: "challenge-broadcast-tecuc.firebasestorage.app",
//   messagingSenderId: "871702511490",
//   appId: "1:871702511490:web:810e5cf3745edf4ac9599b",
//   measurementId: "G-HPS6DTY3W0"
// }

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);
export const db = getFirestore(app);

if (import.meta.env.VITE_USE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
