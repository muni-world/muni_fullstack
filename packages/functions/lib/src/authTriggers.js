"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNewUser = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
exports.handleNewUser = (0, firestore_1.onDocumentCreated)("users/{user_id}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    try {
        await snapshot.ref.update({
            join_date: firestore_2.FieldValue.serverTimestamp(),
            user_type: "free",
        });
    }
    catch (error) {
        console.error("Error initializing user document:", error);
    }
});
//# sourceMappingURL=authTriggers.js.map