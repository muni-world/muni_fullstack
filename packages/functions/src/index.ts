/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Import and initialize Firebase Admin first
import "./firebase-config.js";

// Then import your functions
import auth from "./auth/index.js";
import {getRankTableData} from "./rankTableFunctions.js";

export {
  auth,
  getRankTableData,
};

