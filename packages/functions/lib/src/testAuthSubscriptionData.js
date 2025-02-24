/**
 * This Cloud Function retrieves test data from the "deals" collection based on the user's
 * authentication status and subscription status.
 *
 * Unauthenticated users: Returns rows with { issuer }
 * Authenticated (free): Returns rows with { issuer, total_par }
 * Subscribers: Returns rows with { issuer, total_par, underwriters_fee_total }
 *
 * In production, this connection points to your live Firestore database.
 * Use environment variables (e.g. REACT_APP_USE_EMULATORS) to control emulator usage.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
// Initialize Firebase Admin if it hasn't been already.
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Callable Cloud Function to test authentication and subscription data.
 * Firebase Functions v2 automatically apply CORS headers when using onCall.
 * The addition of { ingressSettings: "ALLOW_ALL" } ensures that requests
 * from any origin (e.g. from localhost:3000 during development) are allowed.
 */
export const testAuthSubscriptionData = onCall({ ingressSettings: "ALLOW_ALL" }, async (request) => {
    try {
        let userType = "unauthenticated";
        // Access auth via request.auth (Firebase v2 style)
        if (request.auth) {
            const userDoc = await admin
                .firestore()
                .collection("users")
                .doc(request.auth.uid)
                .get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                // Determine user type: if 'subscriber', then use that; otherwise default to 'free'
                userType = userData && userData.userType === "subscriber" ? "subscriber" : "free";
            }
            else {
                userType = "free";
            }
        }
        // Query the "deals" collection.
        const dealsSnapshot = await admin.firestore().collection("deals").get();
        const result = [];
        // Process each document.
        dealsSnapshot.forEach((doc) => {
            const deal = doc.data();
            // Skip documents without an issuer.
            if (!deal.issuer)
                return;
            const row = { issuer: deal.issuer };
            // Include total_par for free or subscriber users.
            if (userType === "free" || userType === "subscriber") {
                row.total_par =
                    typeof deal.total_par === "number" ? deal.total_par : Number(deal.total_par || 0);
            }
            // Include underwriters_fee_total for subscribers.
            if (userType === "subscriber") {
                row.underwriters_fee_total =
                    typeof deal.underwriters_fee_total === "number"
                        ? deal.underwriters_fee_total
                        : Number(deal.underwriters_fee_total || 0);
            }
            result.push(row);
        });
        // Return the success response.
        return {
            success: true,
            userType,
            data: result,
        };
    }
    catch (error) {
        console.error("Error:", error);
        throw new HttpsError("internal", "Something went wrong");
    }
});
//# sourceMappingURL=testAuthSubscriptionData.js.map