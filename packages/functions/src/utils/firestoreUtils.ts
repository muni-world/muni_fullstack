import {Timestamp} from "firebase-admin/firestore";

export type FirestoreData = {
  [key: string]: string | number | boolean | null | Timestamp | FirestoreData | FirestoreData[];
};

/**
 * Converts a date string in the format "YYYY-MM-DD HH:mm:ss.SSSSSS+00:00" to a Firestore Timestamp. used when seeding emulator firestore data
 * @param {string} dateString - The date string to convert
 * @returns {Timestamp} Firestore Timestamp object
 */
export const convertDateStringToTimestamp = (dateString: string): Timestamp => {
  // Parse the date string to get milliseconds
  const date = new Date(dateString);

  // Convert to Firestore Timestamp
  return Timestamp.fromDate(date);
};

/**
 * Recursively processes an object to convert date strings to Firestore Timestamps
 * @param {FirestoreData} obj - The object to process
 * @returns {FirestoreData | FirestoreData[]} Processed object with Firestore Timestamps
 */
export const processFirestoreData = (obj: FirestoreData): FirestoreData | FirestoreData[] => {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  // If array, process each element
  if (Array.isArray(obj)) {
    return obj.map((item) => processFirestoreData(item as FirestoreData)) as FirestoreData[];
  }

  // Process object
  const processed: FirestoreData = {};
  for (const [key, value] of Object.entries(obj)) {
    // Check if the key indicates a date field
    if (
      typeof value === "string" &&
      (key.includes("date") || key.includes("Date")) &&
      /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(value)
    ) {
      processed[key] = convertDateStringToTimestamp(value);
    } else if (value && typeof value === "object") { // Recursively process nested objects
      processed[key] = processFirestoreData(value as FirestoreData);
    } else { // Keep other values as is
      processed[key] = value;
    }
  }

  return processed;
};
