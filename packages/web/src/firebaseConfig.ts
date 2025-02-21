// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

/**
 * Firebase configuration object
 * Contains the necessary credentials and settings for Firebase initialization
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBIrT2vge5A4UGTHwFLF9pU0H9Yx1hN3yE",
  authDomain: "muni-b3209.firebaseapp.com",
  projectId: "muni-b3209",
  storageBucket: "muni-b3209.firebasestorage.app",
  messagingSenderId: "677615931506",
  appId: "1:677615931506:web:15d11b6b5a4cc1925ef2eb",
  measurementId: "G-HWYNDE4STV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

// Emulator connection control
const USE_EMULATORS = process.env.REACT_APP_USE_EMULATORS === "true";

if (USE_EMULATORS || process.env.NODE_ENV === "development") {
  connectFirestoreEmulator(db, "localhost", 8080);
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFunctionsEmulator(functions, "localhost", 5001);
  
  console.log("🔥 Using Firebase emulators");
} else {
  console.log("🚀 Connected to production Firebase services");
}

// Export initialized services
export { db, auth, functions };
export default app;