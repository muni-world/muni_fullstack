import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { dealsData } from "./testData.js";
// Initialize Firebase Admin using environment variables
initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Fix newline formatting
    }),
    projectId: "muni-b3209",
});
const db = getFirestore();
// Add emulator configuration
if (process.env.FUNCTIONS_EMULATOR === "true") {
    db.settings({
        host: "localhost:8080",
        ssl: false
    });
}
/**
 * Seeds the Firestore emulator with test data.
 * This function goes through each sample deal in dealsData and writes it
 * to a document in the "deals" collection.
 */
async function seedFirestore() {
    try {
        const batch = db.batch();
        dealsData.forEach((deal, index) => {
            const docRef = db.collection("deals").doc(`deal${index + 1}`);
            console.log(`📝 Adding deal ${index + 1}:`, deal); // Log each deal being added
            batch.set(docRef, deal);
        });
        const commitResult = await batch.commit();
        console.log("🔍 Commit result:", commitResult); // Log the commit result
        console.log("✅ Test data has been seeded successfully!");
    }
    catch (error) {
        console.error("❌ Error seeding test data:", error);
        process.exit(1); // Exit with error code 1 on failure
    }
    finally {
        // After seeding, exit the process.
        process.exit(0);
    }
}
seedFirestore();
