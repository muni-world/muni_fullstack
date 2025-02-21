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
import * as admin from "firebase-admin";

// Initialize Firebase Admin if it hasn't been already.
if (!admin.apps.length)
{
  admin.initializeApp();
}

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
 *
 * @param {object} request - The request object containing the client's data and auth info.
 * @returns {Promise<{success: boolean, userType: string, data: TestDataRow[]}>} The response object with status, user type, and the data array.
 * @throws {HttpsError} Throws an error if data fetching fails.
 */
export const testAuthSubscriptionData = onCall(async (request) =>
{
  // Determine user's subscription status.
  // If no auth info exists, user is considered unauthenticated.
  let userType: string = "unauthenticated";

  try
  {
    // Check if the request has valid authentication data.
    if (request.auth)
    {
      // If authenticated, fetch the user's document from the "users" collection.
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(request.auth.uid)
        .get();
      if (userDoc.exists)
      {
        const userData = userDoc.data();
        // Only "free" or "subscriber" are valid types.
        // Default to "free" unless the user's type is "subscriber".
        userType = userData && userData.userType === "subscriber" ? "subscriber" : "free";
      }
      else
      {
        userType = "free";
      }
    }

    // Query the "deals" collection.
    const dealsSnapshot = await admin.firestore().collection("deals").get();
    const result: TestDataRow[] = [];

    // Process each document in the snapshot.
    dealsSnapshot.forEach((doc) =>
    {
      const deal = doc.data();

      // Basic validation: check if the "issuer" field exists.
      if (!deal.issuer)
      {
        return;
      }

      // Create a row with the issuer field.
      const row: TestDataRow = {
        issuer: deal.issuer,
      };

      // For authenticated users (free or subscriber), include total_par.
      if (userType === "free" || userType === "subscriber")
      {
        row.total_par =
          typeof deal.total_par === "number"
            ? deal.total_par
            : Number(deal.total_par || 0);
      }

      // For subscribers, include underwriters_fee_total.
      if (userType === "subscriber")
      {
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
  catch (error)
  {
    // Log the error to the console and throw an HttpsError.
    console.error("Error fetching data:", error);
    throw new HttpsError("internal", "Error fetching data");
  }
}); 