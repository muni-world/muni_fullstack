/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { handleNewUser } from "./authTriggers";
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const auth = getAuth();

// Helper function to format numbers
const formatNumber = (value: number): string => {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
};

// Type definitions for security rules
type UserRole = "unauthenticated" | "authenticated" | "subscriber";

// Base data filtering function
const filterDealsData = (deal: any, role: UserRole) => {
  const baseData = {
    seriesNameObligor: deal.series_name_obligor,
    totalPar: deal.total_par,
    emmaOsUrl: deal.emma_os_url || null,
  };

  if (role === "authenticated") {
    return {
      ...baseData,
      underwriterFee: { total: deal.underwriter_fee?.total },
    };
  }

  if (role === "subscriber") {
    return {
      ...baseData,
      underwriterFee: deal.underwriter_fee,
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
  } catch (error) {
    res.status(500).json({ success: false, error: "Data access denied" });
  }
});

// Cloud Function: Authenticated User Data
export const getAuthenticatedLeagueData = onCall(async (request) => {
  // In v2, auth info is in request.auth instead of context.auth
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  try {
    const dealsSnapshot = await db.collection("deals").get();
    return aggregateDealsData(dealsSnapshot, "authenticated");
  } catch (error) {
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

// Shared aggregation logic
function aggregateDealsData(snapshot: FirebaseFirestore.QuerySnapshot, role: UserRole) {
  const managerTotals: Record<string, any> = {};

  snapshot.forEach(doc => {
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
    .map(leadLeftManager => ({
      ...leadLeftManager,
      totalPar: formatNumber(leadLeftManager.totalPar),
      underwriterFee: formatNumber(leadLeftManager.underwriterFee),
    }));
}

export { handleNewUser };