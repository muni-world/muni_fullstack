import { auth, db } from "./firebase-config";
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

/**
 * Sign up a new user with email and password
 * @param email - User's email
 * @param password - User's password
 * @param firstName - User's first name
 * @param lastName - User's last name
 */
export const signUp = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      email, 
      password
    );
    
    // Reference to the user's document
    const userDocRef = doc(db, "users", userCredential.user.uid);
    
    // Set initial user document
    await setDoc(userDocRef, {
      firstName,
      lastName,
      userType: "free", // Will be validated by security rules
      joinDate: new Date() // Will be overwritten by Cloud Function
    });

    console.log("User created successfully:", userCredential.user.uid);
  } catch (error) {
    console.error("Error in signup process:", error);
    throw error;
  }
};

/**
 * Log in an existing user with email and password
 * @param email - User's email
 * @param password - User's password
 */
export const logIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential.user);
  } catch (error) {
    console.error("Error logging in:", error);
    throw error; // Added error throwing
  }
};

/**
 * Log out the current user
 */
export const logOut = async () => {
  try {
    await signOut(auth);
    console.log("User logged out");
  } catch (error) {
    console.error("Error logging out:", error);
    throw error; // Added error throwing
  }
}; 