/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {initializeApp} from "firebase-admin/app";
import {handleNewUser} from "./authTriggers.js";
import {getRankTableData} from "./rankTableFunctions.js";

// Initialize Firebase Admin SDK
initializeApp();

export {
  handleNewUser,
  getRankTableData,
};
