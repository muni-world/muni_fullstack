import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";

/**
 * Handles the userType change event.
 * wont run if the userType is the same as the before data.
 * will not run if the userType is undefined because it will have been set by the onDocumentCreated trigger.
 * @param event - The event object.
 */
const handleUserTypeChange = onDocumentUpdated("users/{user_id}",
  async (event) => {
    // Add guard clause to ensure event data is defined
    if (!event.data || !event.data.before || !event.data.after) {
      console.warn("Incomplete event data, skipping update. Usertype custome claim will not be updated, this will affect data accessible");
      return;
    }
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Check if the userType actually changed.
    if (beforeData.userType === afterData.userType) {
      return;
    }

    const userId = event.params.user_id;

    // Prevents this function running in addition to the onDocumentCreated trigger.
    if (beforeData.userType === undefined && afterData.userType === "free") {
      // Likely the automatic assignment from onDocumentCreated; ignore.
      return;
    }

    try {
      const auth = getAuth();
      await auth.setCustomUserClaims(userId, {userType: afterData.userType});
      // Revoke tokens to force a refresh.
      await auth.revokeRefreshTokens(userId);
      console.log(`Custom claims updated for user: ${userId} to ${afterData.userType}`);

      // Update an "updatedAt" field
      await event.data.after.ref.update({
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating custom claims on userType change:", error);
    }
  }
);

export default handleUserTypeChange;
