"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAuthSubscriptionData = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin if it hasn't been already.
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Callable Cloud Function to test authentication and subscription data.
 *
 * @param {object} request - The request object containing the client's data and auth info.
 * @returns {Promise<{success: boolean, userType: string, data: TestDataRow[]}>} The response object with status, user type, and the data array.
 * @throws {HttpsError} Throws an error if data fetching fails.
 */
exports.testAuthSubscriptionData = (0, https_1.onCall)(async (request) => {
    // Determine user's subscription status.
    // If no auth info exists, user is considered unauthenticated.
    let userType = "unauthenticated";
    try {
        // Check if the request has valid authentication data.
        if (request.auth) {
            // If authenticated, fetch the user's document from the "users" collection.
            const userDoc = await admin
                .firestore()
                .collection("users")
                .doc(request.auth.uid)
                .get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                // Only "free" or "subscriber" are valid types.
                // Default to "free" unless the user's type is "subscriber".
                userType = userData && userData.userType === "subscriber" ? "subscriber" : "free";
            }
            else {
                userType = "free";
            }
        }
        // Query the "deals" collection.
        const dealsSnapshot = await admin.firestore().collection("deals").get();
        const result = [];
        // Process each document in the snapshot.
        dealsSnapshot.forEach((doc) => {
            const deal = doc.data();
            // Basic validation: check if the "issuer" field exists.
            if (!deal.issuer) {
                return;
            }
            // Create a row with the issuer field.
            const row = {
                issuer: deal.issuer,
            };
            // For authenticated users (free or subscriber), include total_par.
            if (userType === "free" || userType === "subscriber") {
                row.total_par =
                    typeof deal.total_par === "number"
                        ? deal.total_par
                        : Number(deal.total_par || 0);
            }
            // For subscribers, include underwriters_fee_total.
            if (userType === "subscriber") {
                row.underwriters_fee_total =
                    typeof deal.underwriter_fee_total === "number"
                        ? deal.underwriter_fee_total
                        : Number(deal.underwriter_fee_total || 0);
            }
            // Add the row to the result array.
            result.push(row);
        });
        // Return a success response containing the userType and retrieved data.
        return {
            success: true,
            userType: userType,
            data: result,
        };
    }
    catch (error) {
        // Log the error to the console and throw an HttpsError.
        console.error("Error fetching data:", error);
        throw new https_1.HttpsError("internal", "Error fetching data");
    }
});
//# sourceMappingURL=testAuthSubscriptionData.js.map