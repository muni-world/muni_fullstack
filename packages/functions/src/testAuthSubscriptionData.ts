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
import { db } from "./adminConfig.js";

/**
 * Interface for each data row returned.
 */
interface TestDataRow {
  issuer: string;
  total_par?: number;
  underwriters_fee_total?: number;
}

/**
 * Callable Cloud Function to test authentication and subscription data.
 * Firebase Functions v2 automatically apply CORS headers when using onCall.
 * The addition of { ingressSettings: "ALLOW_ALL" } ensures that requests
 * from any origin (e.g. from localhost:3000 during development) are allowed.
 */
export const testAuthSubscriptionData = onCall(
  { ingressSettings: "ALLOW_ALL" },
  async (request) => {
    try {
      let userType = "unauthenticated";

      if (request.auth) {
        const userDoc = await db
          .collection("users")
          .doc(request.auth.uid)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          userType = userData && userData.userType === "subscriber" ? "subscriber" : "free";
        } else {
          userType = "free";
        }
      }

      const dealsSnapshot = await db.collection("deals").get();
      const result: TestDataRow[] = [];

      dealsSnapshot.forEach((doc) => {
        const deal = doc.data();

        if (!deal.issuer) return;

        const row: TestDataRow = { issuer: deal.issuer };

        if (userType === "free" || userType === "subscriber") {
          row.total_par =
            typeof deal.total_par === "number" ? deal.total_par : Number(deal.total_par || 0);
        }

        if (userType === "subscriber") {
          row.underwriters_fee_total =
            typeof deal.underwriter_fee?.total === "number"
              ? deal.underwriter_fee.total
              : Number(deal.underwriter_fee?.total || 0);
        }

        result.push(row);
      });

      return {
        success: true,
        userType,
        data: result,
      };
    } catch (error) {
      console.error("Error:", error);
      throw new HttpsError("internal", "Something went wrong");
    }
  }
);