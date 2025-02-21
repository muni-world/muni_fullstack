import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";

export const handleNewUser = onDocumentCreated("users/{userId}", 
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    try {
      await snapshot.ref.update({
        joinDate: FieldValue.serverTimestamp(),
        userType: "free"
      });
    } catch (error) {
      console.error("Error initializing user document:", error);
    }
  }
);
