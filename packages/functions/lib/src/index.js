/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { handleNewUser } from "./authTriggers.js";
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { db } from "./adminConfig.js";
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
        const dealData = doc.data();
        const leadLeftManager = dealData.lead_managers?.[0] || "Unknown Manager";
        if (!managerTotals[leadLeftManager]) {
            managerTotals[leadLeftManager] = {
                leadLeftManager,
                aggregatePar: 0,
                aggregateUnderwriterFee: 0,
                deals: [],
            };
        }
        managerTotals[leadLeftManager].aggregatePar += dealData.total_par || 0;
        // Make sure we're correctly adding the underwriter fee
        if (dealData.underwriter_fee?.total) {
            managerTotals[leadLeftManager].aggregateUnderwriterFee += dealData.underwriter_fee.total;
        }
        // Only add deals for subscribers
        if (role === "subscriber") {
            managerTotals[leadLeftManager].deals.push(filterDealsData(dealData, role));
        }
    });
    // Debug log before processing
    console.log("Pre-processing totals for first manager:", Object.values(managerTotals)[0]);
    // Convert to array and sort
    const processedData = Object.values(managerTotals)
        .sort((a, b) => b.aggregatePar - a.aggregatePar)
        .map((manager) => {
        // Base object with common fields
        const baseData = {
            leadLeftManager: manager.leadLeftManager,
            aggregatePar: formatNumber(manager.aggregatePar),
        };
        // Add underwriter fee based on role
        if (role === "unauthenticated") {
            return {
                ...baseData,
                aggregateUnderwriterFee: null,
            };
        }
        else {
            // For authenticated and subscriber users
            return {
                ...baseData,
                aggregateUnderwriterFee: formatNumber(manager.aggregateUnderwriterFee),
            };
        }
    });
    // Debug log after processing
    console.log("Processed data for first manager:", processedData[0]);
    console.log("Manager data before processing:", processedData);
    // During processing
    console.log(`Processing ${processedData[0].leadLeftManager}:`, {
        totalPar: processedData[0].aggregatePar,
        totalFees: processedData[0].aggregateUnderwriterFee,
    });
    return processedData;
}
const filterDealsData = (deal, role) => {
    const baseData = {
        series_name_obligor: deal.series_name_obligor,
        total_par: deal.total_par,
        emma_os_url: deal.emma_os_url || undefined,
        lead_managers: deal.lead_managers,
    };
    // Public users only get basic deal info
    if (role === "unauthenticated") {
        return baseData;
    }
    // Authenticated users get underwriter fee totals
    if (role === "authenticated") {
        return {
            ...baseData,
            underwriter_fee: { total: deal.underwriter_fee?.total || 0 },
        };
    }
    // Subscribers get everything
    return {
        ...baseData,
        underwriter_fee: deal.underwriter_fee,
    };
};
// Cloud Function: Public Data
export const getPublicLeagueData = onRequest(async (req, res) => {
    try {
        const dealsSnapshot = await db.collection("deals").get();
        const aggregatedData = aggregateDealsData(dealsSnapshot, "unauthenticated");
        res.status(200).json({ success: true, data: aggregatedData });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Data access denied" });
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
//# sourceMappingURL=index.js.map