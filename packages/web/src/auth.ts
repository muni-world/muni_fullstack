import { auth, db } from "./firebaseConfig";
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
    // Convert email to lowercase like making all text small letters
    const normalizedEmail = email.toLowerCase();

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail, // Use lowercase version for auth
      password
    );
    
    // Reference to the user's document
    const userDocRef = doc(db, "users", userCredential.user.uid);
    
    // Set initial user document
    await setDoc(userDocRef, {
      firstName,
      lastName,
      email: normalizedEmail
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