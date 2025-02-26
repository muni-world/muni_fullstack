/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {handleNewUser} from "./authTriggers.js";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getAuth} from "firebase-admin/auth";
import {db} from "./adminConfig.js";

const auth = getAuth();

// Helper function to format numbers
const formatNumber = (value: number): string => {
  return value.toLocaleString("en-US", {maximumFractionDigits: 0});
};

// Type definitions for security rules
type UserRole = "unauthenticated" | "authenticated" | "subscriber";

interface BaseManagerData {
  leadLeftManager: string;
  aggregatePar: string;
}

interface AuthenticatedManagerData extends BaseManagerData {
  aggregateUnderwriterFee: string;
  deals?: Deal[];
}

interface ManagerTotals {
  leadLeftManager: string;
  aggregatePar: number;
  aggregateUnderwriterFee: number;
  deals: Deal[];
}

// Simple interface with only the fields we need
interface Deal {
  series_name_obligor: string;
  total_par: number;
  emma_os_url?: string;
  underwriter_fee?: { total: number };
  lead_managers?: string[];
}

// Helper function to check if manager data is authenticated
function isAuthenticatedData(data: BaseManagerData | AuthenticatedManagerData): data is AuthenticatedManagerData {
  return "aggregateUnderwriterFee" in data;
}

/**
 * Aggregates deal data by lead left manager (first in lead_managers array)
 */
function aggregateDealsData(
  snapshot: FirebaseFirestore.QuerySnapshot,
  role: UserRole
): BaseManagerData[] | AuthenticatedManagerData[] {
  // First, let's add some debug logging
  console.log("Processing data for role:", role);

  const managerTotals: Record<string, ManagerTotals> = {};

  snapshot.forEach((doc) => {
    const dealData = doc.data() as Deal;
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
  console.log("Pre-processing totals for first manager:",
    Object.values(managerTotals)[0]);

  // Convert to array and sort
  const processedData = Object.values(managerTotals)
    .sort((a, b) => b.aggregatePar - a.aggregatePar)
    .map((manager): BaseManagerData | AuthenticatedManagerData => {
      if (role === "unauthenticated") {
        return {
          leadLeftManager: manager.leadLeftManager,
          aggregatePar: formatNumber(manager.aggregatePar),
        };
      }

      return {
        leadLeftManager: manager.leadLeftManager,
        aggregatePar: formatNumber(manager.aggregatePar),
        aggregateUnderwriterFee: formatNumber(manager.aggregateUnderwriterFee),
        deals: manager.deals,
      };
    });

  // Debug log after processing
  console.log("Processed data for first manager:", processedData[0]);

  // During processing
  const firstManager = processedData[0];
  console.log(`Processing ${firstManager.leadLeftManager}:`, {
    aggregatePar: firstManager.aggregatePar,
    ...(isAuthenticatedData(firstManager) && {
      aggregateFees: firstManager.aggregateUnderwriterFee,
    }),
  });

  return processedData;
}

const filterDealsData = (deal: Deal, role: UserRole): Deal => {
  const baseData: Deal = {
    series_name_obligor: deal.series_name_obligor,
    total_par: deal.total_par,
    emma_os_url: deal.emma_os_url || undefined,
    lead_managers: deal.lead_managers,
  };

  // Public users only get basic deal info
  if (role === "unauthenticated") {
    return baseData;
  }

  // Authenticated users get underwriter fee aggregates
  if (role === "authenticated") {
    return {
      ...baseData,
      underwriter_fee: {total: deal.underwriter_fee?.total || 0},
    };
  }

  // Subscribers get everything
  return {
    ...baseData,
    underwriter_fee: deal.underwriter_fee,
  };
};

// Cloud Function: Public Data
export const getPublicLeagueData = onCall(async () => {
  try {
    const dealsSnapshot = await db.collection("deals").get();
    const aggregatedData = aggregateDealsData(dealsSnapshot, "unauthenticated");
    return aggregatedData;
  } catch (error) {
    throw new HttpsError("internal", "Something went wrong");
  }
});

// Cloud Function: Authenticated User Data
export const getAuthenticatedLeagueData = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  try {
    const dealsSnapshot = await db.collection("deals").get();
    // Make sure we're explicitly passing 'authenticated' as the role
    const data = aggregateDealsData(dealsSnapshot, "authenticated");
    console.log("Authenticated data sample:", data[0]); // Debug log
    return data;
  } catch (error) {
    console.error("Error in getAuthenticatedLeagueData:", error);
    throw new HttpsError("internal", "Something went wrong");
  }
});

// Cloud Function: Subscriber Data
export const getSubscriberLeagueData = onCall(async (request) => {
  // In v2, auth info is in request.auth instead of context.auth
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  try {
    const user = await auth.getUser(request.auth.uid);
    // Verify subscription status - you'll need to implement this check
    if (!user.customClaims?.subscriber) {
      throw new HttpsError("permission-denied", "Subscription required");
    }

    const dealsSnapshot = await db.collection("deals").get();
    return aggregateDealsData(dealsSnapshot, "subscriber");
  } catch (error) {
    throw new HttpsError("internal", "Something went wrong");
  }
});

export {handleNewUser};

export {testAuthSubscriptionData} from "./testAuthSubscriptionData.js";
