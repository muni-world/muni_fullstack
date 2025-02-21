import { auth, db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";

/**
 * User types supported by the application
 */
export type UserType = "free" | "authenticated" | "subscriber";

/**
 * Checks if a user has subscriber access
 * @param userId - The Firebase user ID to check
 * @returns Promise<boolean> - True if user has subscriber access
 */
export const checkUserSubscription = async (userId: string): Promise<boolean> => {
  try {
    // Get user document from Firestore
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) {
      console.error("User document not found");
      return false;
    }

    const userData = userDoc.data();
    return userData.userType === "subscriber";
  } 
  catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
};

/**
 * Gets the user's access level
 * @param userId - The Firebase user ID to check
 * @returns Promise<UserType> - The user's access level
 */
export const getUserAccessLevel = async (userId: string): Promise<UserType> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) {
      return "free";
    }

    const userData = userDoc.data();
    return userData.userType as UserType;
  } 
  catch (error) {
    console.error("Error getting user access level:", error);
    return "free";
  }
}; 