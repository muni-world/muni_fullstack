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
  apiKey: "AIzaSyBfVNmAgdUOaczJs0QSbJggaW3IykSKs6w",
  authDomain: "muni-b3209.firebaseapp.com",
  projectId: "muni-b3209",
  storageBucket: "muni-b3209.firebasestorage.app",
  messagingSenderId: "677615931506",
  appId: "1:677615931506:web:e7dd82988bd697c65ef2eb",
  measurementId: "G-B1W901R5H7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get service instances
const auth = getAuth(app);
const functions = getFunctions(app);
const firestore = getFirestore(app);

// Connect to emulators in development
if (process.env.NODE_ENV === "development") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectFirestoreEmulator(firestore, "localhost", 8080);
}

// Export initialized services
export { auth, functions, firestore };
export default app;