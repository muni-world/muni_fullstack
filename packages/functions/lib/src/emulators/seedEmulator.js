import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { processFirestoreData } from "../utils/firestoreUtils.js";
import * as fs from "fs";
import * as path from "path";
// Get the equivalent of __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Initialize Firebase Admin using environment variables
const app = initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    projectId: "muni-b3209",
});
const db = getFirestore(app);
// Configure emulator in development
if (process.env.FUNCTIONS_EMULATOR === "true") {
    db.settings({
        host: "localhost:8080",
        ssl: false,
    });
}
/**
 * Seeds the Firestore emulator with test data from firestore-data.json
 * Processes any timestamp fields and preserves document IDs
 */
async function seedFirestore() {
    try {
        const firestoreDataPath = path.join(dirname(dirname(__dirname)), // go up two levels from lib/src/emulators to src
        'src', 'emulators', 'firestore-data.json');
        const firestoreData = JSON.parse(fs.readFileSync(firestoreDataPath, "utf8"));
        // Process each collection
        for (const [collectionName, documents] of Object.entries(firestoreData)) {
            console.log(`📝 Processing collection: ${collectionName}`);
            // Process each document
            const documentPromises = Object.entries(documents).map(async ([docId, docData]) => {
                if (typeof docData === "object" && docData !== null) {
                    const processedData = processFirestoreData(docData);
                    const docRef = db.collection(collectionName).doc(docId);
                    try {
                        await docRef.set(processedData);
                        console.log(`✅ Document written: ${collectionName}/${docId}`);
                    }
                    catch (error) {
                        console.error(`❌ Failed to write ${collectionName}/${docId}:`, error);
                    }
                }
            });
            await Promise.all(documentPromises);
        }
        console.log("✅ Database seeded successfully!");
    }
    catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
    process.exit(0);
}
seedFirestore();
//# sourceMappingURL=seedEmulator.js.map