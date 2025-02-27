import * as admin from "firebase-admin";
import {onCall} from "firebase-functions/v2/https";
import {DecodedIdToken} from "firebase-admin/auth";

/**
 * Interface for the deals collection document
 */
interface Deal {
  counsels: string[];
  sector: string;
  method: string;
  issuer: string;
  lead_managers: string[];
  co_managers: string[];
  date: string;
  series_name_obligor: string;
  state: string;
  total_par: number;
  underwriter_fee?: {
    total: number | null;
    scrape_success: boolean;
  };
}

/**
 * Interface for the aggregated data in the rank table
 */
interface RankTableRow {
  rank: number;
  leadLeftManager: string;
  aggregatePar: number;
  avgUnderwriterFeeAmount: number | null;
  avgUnderwriterFeePercentage: number | null;
  deals: Deal[];
  visibilityInfo?: {
    avgUnderwriterFeeAmount?: "need_free" | "need_premium";
    avgUnderwriterFeePercentage?: "need_free" | "need_premium";
    fullDealList?: "need_premium";
  };
}

/**
 * Determines the user type based on the authentication record
 *
 * Note on Firebase v1/v2 Usage:
 * - We're using Firebase Functions v2 for the HTTP callable function (onCall)
 * - However, auth-related types still come from v1 because Firebase Functions v2
 *   doesn't yet support auth types/triggers as of 2025-02-27
 * - DecodedIdToken from v1 contains the structure for custom claims we set on users
 *
 * @param auth - The authentication data containing token with custom claims
 *              The token.claims.userType is a custom claim we set when users register/upgrade
 * @returns The user's type (guest, free, or premium)
 */
async function getUserType(auth: { token: DecodedIdToken } | undefined): Promise<"guest" | "free" | "premium"> {
  // Check if we have auth data and our custom userType claim
  if (!auth?.token?.claims?.userType) {
    return "guest";
  }

  const userType = auth.token.claims.userType;
  if (userType === "free" || userType === "premium") {
    return userType;
  }

  return "guest";
}

/**
 * Aggregates deal data by lead left manager and applies visibility rules based on user type
 * @param deals - Array of deals to aggregate
 * @param userType - Type of user requesting the data
 * @returns Array of aggregated data rows
 */
function aggregateDeals(deals: Deal[], userType: "guest" | "free" | "premium"): RankTableRow[] {
  // Group deals by lead left manager (first manager in the lead_managers array)
  const groupedDeals = deals.reduce((acc, deal) => {
    const leadLeftManager = deal.lead_managers[0] || "Unknown";
    if (!acc[leadLeftManager]) {
      acc[leadLeftManager] = [];
    }
    acc[leadLeftManager].push(deal);
    return acc;
  }, {} as { [key: string]: Deal[] });

  // Calculate aggregates for each lead left manager
  const aggregatedData = Object.entries(groupedDeals).map(([leadLeftManager, deals]) => {
    // Sort deals by date (most recent first)
    const sortedDeals = [...deals].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate aggregates
    const aggregatePar = deals.reduce((sum, deal) => sum + deal.total_par, 0);

    const dealsWithFees = deals.filter((deal) =>
      deal.underwriter_fee?.total !== null && deal.underwriter_fee?.total !== undefined
    );

    const avgUnderwriterFeeAmount = dealsWithFees.length > 0 ?
      dealsWithFees.reduce((sum, deal) => sum + (deal.underwriter_fee?.total || 0), 0) / dealsWithFees.length :
      null;

    const avgUnderwriterFeePercentage = dealsWithFees.length > 0 && avgUnderwriterFeeAmount ?
      (avgUnderwriterFeeAmount / (aggregatePar / dealsWithFees.length)) * 100 :
      null;

    // Apply visibility rules based on user type
    const visibilityInfo: RankTableRow["visibilityInfo"] = {};

    if (userType === "guest") {
      visibilityInfo.avgUnderwriterFeeAmount = "need_free";
      visibilityInfo.avgUnderwriterFeePercentage = "need_free";
      visibilityInfo.fullDealList = "need_premium";
    } else if (userType === "free") {
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
export const getRankTableData = onCall(async (request) => {
  try {
    // Get user type directly from auth token
    const userType = await getUserType(request.auth);

    const dealsSnapshot = await admin.firestore()
      .collection("deals")
      .orderBy("date", "desc")
      .get();

    const deals = dealsSnapshot.docs.map((doc) => doc.data() as Deal);
    const aggregatedData = aggregateDeals(deals, userType);

    return {success: true, data: aggregatedData};
  } catch (error) {
    console.error("Error in getRankTableData:", error);
    return {
      success: false,
      error: "Failed to fetch rank table data",
    };
  }
});
