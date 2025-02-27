/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Import the unified Firebase Admin configuration
import {handleNewUser} from "./authTriggers.js";
import {getRankTableData} from "./rankTableFunctions.js";

export {
  handleNewUser,
  getRankTableData,
};
