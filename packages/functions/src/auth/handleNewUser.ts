import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {FieldValue} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";

const handleNewUser = onDocumentCreated("users/{user_id}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const userId = event.params.user_id;
    // Set default joinDate and userType in Firestore
    try {
      await snapshot.ref.update({
        joinDate: FieldValue.serverTimestamp(),
        userType: "free",
      });
    } catch (error) {
      console.error("Error updating Firestore user document:", error);
      return;
    }

    // Update custom claims for the new user
    try {
      const auth = getAuth();
      await auth.setCustomUserClaims(userId, {userType: "free"});
      // Revoke refresh tokens so the client gets a new token sooner.
      await auth.revokeRefreshTokens(userId);
      console.log(`Custom claims set and tokens revoked for user: ${userId}`);
    } catch (error) {
      console.error("Error setting custom user claims:", error);
    }
  }
);

export default handleNewUser;
