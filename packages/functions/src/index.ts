/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import {onDocumentCreated, DocumentSnapshot} from "firebase-functions/v2/firestore";

// Example HTTP function
export const helloWorld = onRequest((request, response) => {
  console.info("Hello logs!", {structuredData: true});
  response.json({message: "Hello from Firebase!"});
});

// Define the interface for your user data structure
interface UserData {
  // Add your user properties here, for example:
  name?: string;
  email?: string;
  createdAt?: string;
}

// Example Firestore trigger function
export const onUserCreated = onDocumentCreated("users/{userId}", 
  (event) => {
    const snapshot = event.data as DocumentSnapshot<UserData>;
    const userData = snapshot.data();
    console.info("New user created:", userData);
    return null;
  }
);
