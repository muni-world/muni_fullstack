import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { loadEnvFile } from "node:process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Resolve the .env file path relative to this file's directory.
const envPath = join(__dirname, "..", "..", ".env");
// Programmatically load the .env file (synchronously)
loadEnvFile?.(envPath);
// Validate environment variables
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Missing Firebase service account credentials in environment variables");
}
// Initialize Firebase Admin
const app = initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
});
// Initialize Firestore
const db = getFirestore(app);
// Configure Firestore emulator if using emulator
if (process.env.FUNCTIONS_EMULATOR === "true") {
    db.settings({
        host: "localhost:8080",
        ssl: false,
    });
}
export { db };
//# sourceMappingURL=firebase-config.js.map