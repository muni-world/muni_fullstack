import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";

export const handleNewUser = onDocumentCreated("users/{user_id}", 
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    try {
      await snapshot.ref.update({
        join_date: FieldValue.serverTimestamp(),
        user_type: "free"
      });
    } catch (error) {
      console.error("Error initializing user document:", error);
    }
  }
);
