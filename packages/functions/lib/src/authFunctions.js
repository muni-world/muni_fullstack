import { onCall } from "firebase-functions/v2/https";
import { db } from "./firebase-config.js";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
export const setUserType = onCall(async (request) => {
    // Ensure user is authenticated
    if (!request.auth) {
        throw new Error("Unauthorized");
    }
    const { userType } = request.data;
    const uid = request.auth.uid;
    // Validate userType
    if (!["free", "premium"].includes(userType)) {
        throw new Error("Invalid user type");
    }
    try {
        // Set the custom claim
        const auth = getAuth();
        await auth.setCustomUserClaims(uid, { userType });
        // Optionally update Firestore user document
        await db.collection("users").doc(uid).set({
            userType,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        return { success: true };
    }
    catch (error) {
        console.error("Error setting user type:", error);
        throw new Error("Failed to set user type");
    }
});
export const upgradeToPremium = onCall(async (request) => {
    // Ensure user is authenticated
    if (!request.auth) {
        throw new Error("Unauthorized");
    }
    const uid = request.auth.uid;
    try {
        // 1. Update custom claims
        const auth = getAuth();
        await auth.setCustomUserClaims(uid, { userType: "premium" });
        // 2. Update user document
        await db.collection("users").doc(uid).set({
            userType: "premium",
            upgradedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        // 3. Force token refresh
        // This is important! It makes the new claims available immediately
        await auth.revokeRefreshTokens(uid);
        return { success: true };
    }
    catch (error) {
        console.error("Error upgrading user:", error);
        throw new Error("Failed to upgrade user");
    }
});
//# sourceMappingURL=authFunctions.js.map