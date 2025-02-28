import { onCall } from "firebase-functions/v2/https";
import { db } from "./firebase-config.js";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
export const setUserType = onCall(async (request) => {
    if (!request.auth)
        throw new Error("Unauthorized");
    const uid = request.auth.uid;
    const { userType } = request.data;
    console.log("Setting userType:", {
        uid,
        currentClaims: request.auth.token.claims,
        newUserType: userType,
    });
    try {
        const auth = getAuth();
        // Set claims with verification
        await auth.setCustomUserClaims(uid, { userType });
        console.log("Claims set - verifying...");
        // Immediate verification
        const user = await auth.getUser(uid);
        console.log("Verified claims:", user.customClaims);
        // Optionally update Firestore user document
        await db.collection("users").doc(uid).set({
            userType,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        // Force token refresh client-side
        await auth.revokeRefreshTokens(uid);
        console.log("Tokens revoked and claims updated for:", uid);
        return {
            success: true,
            requiresTokenRefresh: true,
        };
    }
    catch (error) {
        console.error("Full error context:", {
            uid,
            userType,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
    }
});
//# sourceMappingURL=authFunctions.js.map