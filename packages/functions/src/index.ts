/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";

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
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data associated with the event");
      return null;
    }
    
    const userData = snapshot.data() as UserData;
    console.info("New user created:", userData);
    return null;
  }
);
