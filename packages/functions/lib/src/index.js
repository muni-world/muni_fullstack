"use strict";
/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNewUser = exports.getSubscriberLeagueData = exports.getAuthenticatedLeagueData = exports.getPublicLeagueData = void 0;
const authTriggers_1 = require("./authTriggers");
Object.defineProperty(exports, "handleNewUser", { enumerable: true, get: function () { return authTriggers_1.handleNewUser; } });
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
// Initialize Firebase Admin
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const auth = (0, auth_1.getAuth)();
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
        var _a, _b;
        const dealData = doc.data();
        const leadLeftManager = ((_a = dealData.lead_managers) === null || _a === void 0 ? void 0 : _a[0]) || "Unknown Manager";
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
        managerTotals[leadLeftManager].underwriterFee += ((_b = dealData.underwriter_fee) === null || _b === void 0 ? void 0 : _b.total) || 0;
        managerTotals[leadLeftManager].deals.push(filteredDeal);
    });
    return Object.values(managerTotals)
        .sort((a, b) => b.totalPar - a.totalPar)
        .map((manager) => (Object.assign(Object.assign({}, manager), { totalPar: formatNumber(manager.totalPar), underwriterFee: formatNumber(manager.underwriterFee) })));
}
const filterDealsData = (deal, role) => {
    var _a;
    const baseData = {
        series_name_obligor: deal.series_name_obligor,
        total_par: deal.total_par,
        emma_os_url: deal.emma_os_url || undefined,
        lead_managers: deal.lead_managers,
    };
    if (role === "authenticated") {
        return Object.assign(Object.assign({}, baseData), { underwriter_fee: { total: ((_a = deal.underwriter_fee) === null || _a === void 0 ? void 0 : _a.total) || 0 } });
    }
    if (role === "subscriber") {
        return Object.assign(Object.assign({}, baseData), { underwriter_fee: deal.underwriter_fee });
    }
    return baseData;
};
// Cloud Function: Public Data
exports.getPublicLeagueData = (0, https_1.onRequest)(async (req, res) => {
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
exports.getAuthenticatedLeagueData = (0, https_1.onCall)(async (request) => {
    // In v2, auth info is in request.auth instead of context.auth
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    try {
        const dealsSnapshot = await db.collection("deals").get();
        return aggregateDealsData(dealsSnapshot, "authenticated");
    }
    catch (error) {
        throw new https_1.HttpsError("internal", "Something went wrong");
    }
});
// Cloud Function: Subscriber Data
exports.getSubscriberLeagueData = (0, https_1.onCall)(async (request) => {
    var _a;
    // In v2, auth info is in request.auth instead of context.auth
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    try {
        const user = await auth.getUser(request.auth.uid);
        // Verify subscription status - you'll need to implement this check
        if (!((_a = user.customClaims) === null || _a === void 0 ? void 0 : _a.subscriber)) {
            throw new https_1.HttpsError("permission-denied", "Subscription required");
        }
        const dealsSnapshot = await db.collection("deals").get();
        return aggregateDealsData(dealsSnapshot, "subscriber");
    }
    catch (error) {
        throw new https_1.HttpsError("internal", "Something went wrong");
    }
});
//# sourceMappingURL=index.js.map