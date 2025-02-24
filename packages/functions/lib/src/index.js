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
 * Aggregates deal data by lead manager
 * @param {FirebaseFirestore.QuerySnapshot} snapshot - Firestore query snapshot containing deal data
 * @param {UserRole} role - User's access role (unauthenticated/authenticated/subscriber)
 * @return {Array<{
 *   leadLeftManager: string,
 *   totalPar: string,
 *   underwriterFee: string,
 *   deals: Array<Deal>
 * }>} Sorted and formatted array of manager totals
 */
function aggregateDealsData(snapshot, role) {
    const managerTotals = {};
    snapshot.forEach((doc) => {
        const dealData = doc.data();
        const leadLeftManager = dealData.lead_managers?.[0] || "Unknown Manager";
        if (!managerTotals[leadLeftManager]) {
            managerTotals[leadLeftManager] = {
                leadLeftManager,
                totalPar: 0,
                underwriterFee: 0,
                deals: [],
            };
        }
        const filteredDeal = filterDealsData(dealData, role);
        managerTotals[leadLeftManager].totalPar += dealData.total_par || 0;
        managerTotals[leadLeftManager].underwriterFee += dealData.underwriter_fee?.total || 0;
        managerTotals[leadLeftManager].deals.push(filteredDeal);
    });
    return Object.values(managerTotals)
        .sort((a, b) => b.totalPar - a.totalPar)
        .map((manager) => ({
        ...manager,
        totalPar: formatNumber(manager.totalPar),
        underwriterFee: formatNumber(manager.underwriterFee),
    }));
}
const filterDealsData = (deal, role) => {
    const baseData = {
        series_name_obligor: deal.series_name_obligor,
        total_par: deal.total_par,
        emma_os_url: deal.emma_os_url || undefined,
        lead_managers: deal.lead_managers,
    };
    if (role === "authenticated") {
        return {
            ...baseData,
            underwriter_fee: { total: deal.underwriter_fee?.total || 0 },
        };
    }
    if (role === "subscriber") {
        return {
            ...baseData,
            underwriter_fee: deal.underwriter_fee,
        };
    }
    return baseData;
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
    // In v2, auth info is in request.auth instead of context.auth
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    try {
        const dealsSnapshot = await db.collection("deals").get();
        return aggregateDealsData(dealsSnapshot, "authenticated");
    }
    catch (error) {
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