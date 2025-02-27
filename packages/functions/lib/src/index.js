/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { handleNewUser } from "./authTriggers.js";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { db } from "./adminConfig.js";
import * as admin from "firebase-admin";
import { getRankTableData } from "./rankTableFunctions.js";
const auth = getAuth();
// Helper function to format numbers
const formatNumber = (value) => {
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
};
/**
 * Aggregates deal data by lead left manager (first in lead_managers array)
 */
function aggregateDealsData(snapshot, role) {
    // First, let's add some debug logging
    console.log("Processing data for role:", role);
    const managerTotals = {};
    snapshot.forEach((doc) => {
        const rawDealData = doc.data();
        console.log("Processing raw deal:", rawDealData.series_name_obligor);
        // Map the raw deal data to our expected format with fallbacks for missing data
        const dealData = {
            series_name_obligor: rawDealData.series_name_obligor || "Unknown Series",
            total_par: rawDealData.total_par || 0,
            emma_os_url: rawDealData.emma_os_url,
            underwriter_fee: {
                total: rawDealData.underwriter_fee?.total || 0,
            },
            lead_managers: rawDealData.lead_managers || [],
        };
        const leadLeftManager = (rawDealData.lead_managers || [])[0] || "Unknown Manager";
        console.log(`Processing for manager: ${leadLeftManager}`);
        if (!managerTotals[leadLeftManager]) {
            managerTotals[leadLeftManager] = {
                leadLeftManager,
                aggregatePar: 0,
                aggregateUnderwriterFee: 0,
                deals: [],
            };
        }
        managerTotals[leadLeftManager].aggregatePar += dealData.total_par;
        // Add underwriter fee with fallback
        managerTotals[leadLeftManager].aggregateUnderwriterFee += dealData.underwriter_fee?.total || 0;
        // Only add deals for subscribers
        if (role === "subscriber") {
            console.log(`Adding deal to ${leadLeftManager}'s deals array:`, dealData.series_name_obligor);
            const subscriberDeal = {
                ...dealData,
                // Add additional fields for subscribers with fallbacks
                os_type: rawDealData.os_type || "Unknown",
                co_managers: rawDealData.co_managers || [],
                counsels: rawDealData.counsels || [],
                municipal_advisors: rawDealData.municipal_advisors || [],
                underwriters_advisors: rawDealData.underwriters_advisors || [],
            };
            managerTotals[leadLeftManager].deals.push(subscriberDeal);
        }
    });
    // Debug log before processing
    const firstManager = Object.values(managerTotals)[0];
    if (firstManager) {
        console.log("Pre-processing totals for first manager:", {
            manager: firstManager.leadLeftManager,
            aggregatePar: firstManager.aggregatePar,
            aggregateUnderwriterFee: firstManager.aggregateUnderwriterFee,
            dealsCount: firstManager.deals.length,
        });
    }
    // Convert to array and sort
    const processedData = Object.values(managerTotals)
        .sort((a, b) => b.aggregatePar - a.aggregatePar)
        .map((manager) => {
        if (role === "unauthenticated") {
            return {
                leadLeftManager: manager.leadLeftManager,
                aggregatePar: formatNumber(manager.aggregatePar),
            };
        }
        // For authenticated users, include fee but no deals
        if (role === "authenticated") {
            return {
                leadLeftManager: manager.leadLeftManager,
                aggregatePar: formatNumber(manager.aggregatePar),
                aggregateUnderwriterFee: formatNumber(manager.aggregateUnderwriterFee),
            };
        }
        // For subscribers, include everything including deals
        return {
            leadLeftManager: manager.leadLeftManager,
            aggregatePar: formatNumber(manager.aggregatePar),
            aggregateUnderwriterFee: formatNumber(manager.aggregateUnderwriterFee),
            deals: manager.deals,
        };
    });
    // Debug log after processing
    if (processedData.length > 0) {
        console.log("Processed data for first manager:", JSON.stringify(processedData[0], null, 2));
    }
    return processedData;
}
// Cloud Function: Public Data
export const getPublicLeagueData = onCall(async () => {
    console.log("getPublicLeagueData called");
    try {
        console.log("Fetching deals from Firestore...");
        const dealsSnapshot = await db.collection("deals").get();
        console.log(`Found ${dealsSnapshot.size} deals in the database`);
        if (dealsSnapshot.empty) {
            console.warn("No deals found in the database");
            return [];
        }
        // Log a sample of raw data to verify structure
        if (dealsSnapshot.size > 0) {
            const sampleDeal = dealsSnapshot.docs[0].data();
            console.log("Sample raw deal data:", JSON.stringify(sampleDeal));
        }
        console.log("Aggregating deals data...");
        try {
            const aggregatedData = aggregateDealsData(dealsSnapshot, "unauthenticated");
            console.log(`Processed ${aggregatedData.length} managers`);
            if (aggregatedData.length > 0) {
                console.log("Sample of first manager:", JSON.stringify(aggregatedData[0]));
            }
            else {
                console.warn("No managers found after aggregation");
            }
            return aggregatedData;
        }
        catch (aggregationError) {
            console.error("Error during data aggregation:", aggregationError);
            throw new HttpsError("internal", `Data aggregation failed: ${aggregationError instanceof Error ? aggregationError.message : "Unknown aggregation error"}`);
        }
    }
    catch (error) {
        // Log the full error object for debugging
        console.error("Full error object in getPublicLeagueData:", error);
        // Check if it's a Firestore error
        if (error && typeof error === "object" && "code" in error) {
            const firestoreError = error;
            console.error("Firestore error details:", {
                code: firestoreError.code,
                message: firestoreError.message,
            });
        }
        throw new HttpsError("internal", error instanceof Error ?
            `Database operation failed: ${error.message}` :
            "Unknown database error occurred");
    }
});
// Cloud Function: Authenticated User Data
export const getAuthenticatedLeagueData = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    try {
        const dealsSnapshot = await db.collection("deals").get();
        // Make sure we're explicitly passing 'authenticated' as the role
        const data = aggregateDealsData(dealsSnapshot, "authenticated");
        console.log("Authenticated data sample:", data[0]); // Debug log
        return data;
    }
    catch (error) {
        console.error("Error in getAuthenticatedLeagueData:", error);
        throw new HttpsError("internal", "Something went wrong");
    }
});
// Cloud Function: Subscriber Data
export const getSubscriberLeagueData = onCall(async (request) => {
    // In v2, auth info is in request.auth instead of context.auth
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    try {
        const user = await auth.getUser(request.auth.uid);
        // Verify subscription status - you'll need to implement this check
        if (!user.customClaims?.subscriber) {
            throw new HttpsError("permission-denied", "Subscription required");
        }
        const dealsSnapshot = await db.collection("deals").get();
        return aggregateDealsData(dealsSnapshot, "subscriber");
    }
    catch (error) {
        throw new HttpsError("internal", "Something went wrong");
    }
});
export { handleNewUser };
export { testAuthSubscriptionData } from "./testAuthSubscriptionData.js";
// Initialize Firebase Admin
admin.initializeApp();
// Export the functions
export { getRankTableData, };
//# sourceMappingURL=index.js.map