import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
/**
 * Determines the user type based on the authentication record
 * @param userId - The user's ID from Firebase Auth
 * @returns The user's type (guest, free, or premium)
 */
async function getUserType(userId) {
    if (!userId) {
        return "guest";
    }
    try {
        const userDoc = await admin.firestore()
            .collection("users")
            .doc(userId)
            .get();
        if (!userDoc.exists) {
            return "guest";
        }
        const userData = userDoc.data();
        return userData?.userType || "guest";
    }
    catch (error) {
        console.error("Error fetching user type:", error);
        return "guest";
    }
}
/**
 * Aggregates deal data by lead left manager and applies visibility rules based on user type
 * @param deals - Array of deals to aggregate
 * @param userType - Type of user requesting the data
 * @returns Array of aggregated data rows
 */
function aggregateDeals(deals, userType) {
    // Group deals by lead left manager (first manager in the lead_managers array)
    const groupedDeals = deals.reduce((acc, deal) => {
        const leadLeftManager = deal.lead_managers[0] || "Unknown";
        if (!acc[leadLeftManager]) {
            acc[leadLeftManager] = [];
        }
        acc[leadLeftManager].push(deal);
        return acc;
    }, {});
    // Calculate aggregates for each lead left manager
    const aggregatedData = Object.entries(groupedDeals).map(([leadLeftManager, deals]) => {
        // Sort deals by date (most recent first)
        const sortedDeals = [...deals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        // Calculate aggregates
        const aggregatePar = deals.reduce((sum, deal) => sum + deal.total_par, 0);
        const dealsWithFees = deals.filter((deal) => deal.underwriter_fee?.total !== null && deal.underwriter_fee?.total !== undefined);
        const avgUnderwriterFeeAmount = dealsWithFees.length > 0 ?
            dealsWithFees.reduce((sum, deal) => sum + (deal.underwriter_fee?.total || 0), 0) / dealsWithFees.length :
            null;
        const avgUnderwriterFeePercentage = dealsWithFees.length > 0 && avgUnderwriterFeeAmount ?
            (avgUnderwriterFeeAmount / (aggregatePar / dealsWithFees.length)) * 100 :
            null;
        // Apply visibility rules based on user type
        const visibilityInfo = {};
        if (userType === "guest") {
            visibilityInfo.avgUnderwriterFeeAmount = "need_free";
            visibilityInfo.avgUnderwriterFeePercentage = "need_free";
            visibilityInfo.fullDealList = "need_premium";
        }
        else if (userType === "free") {
            visibilityInfo.fullDealList = "need_premium";
        }
        return {
            leadLeftManager,
            aggregatePar,
            avgUnderwriterFeeAmount: userType === "guest" ? null : avgUnderwriterFeeAmount,
            avgUnderwriterFeePercentage: userType === "guest" ? null : avgUnderwriterFeePercentage,
            deals: sortedDeals,
            visibilityInfo: Object.keys(visibilityInfo).length > 0 ? visibilityInfo : undefined,
        };
    });
    // Sort by aggregate par amount and add rank
    return aggregatedData
        .sort((a, b) => b.aggregatePar - a.aggregatePar)
        .map((row, index) => ({
        ...row,
        rank: index + 1,
    }));
}
/**
 * Cloud function to get rank table data
 * Future extensibility: Add parameters for filtering by date range, sector, state, etc.
 */
export const getRankTableData = functions.https.onCall(async (data, context) => {
    try {
        // Get user type
        const userType = await getUserType(context?.auth?.uid);
        // Get all deals
        // Future extensibility: Add query parameters for filtering
        const dealsSnapshot = await admin.firestore()
            .collection("deals")
            .orderBy("date", "desc")
            .get();
        const deals = dealsSnapshot.docs.map((doc) => doc.data());
        // Aggregate deals and apply visibility rules
        const aggregatedData = aggregateDeals(deals, userType);
        return { success: true, data: aggregatedData };
    }
    catch (error) {
        console.error("Error in getRankTableData:", error);
        return {
            success: false,
            error: "Failed to fetch rank table data",
        };
    }
});
//# sourceMappingURL=rankTableFunctions.js.map