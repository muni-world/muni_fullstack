import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin once
const app = initializeApp({
  projectId: "muni-b3209",
});

// Get Firestore instance
const db = getFirestore(app);

// Add emulator configuration if needed
if (process.env.FUNCTIONS_EMULATOR === "true") {
  db.settings({
    host: "localhost:8080",
    ssl: false,
  });
}

export { db }; 