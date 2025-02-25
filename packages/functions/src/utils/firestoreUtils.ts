import { Timestamp } from "firebase-admin/firestore";

/**
 * Converts a date string in the format "YYYY-MM-DD HH:mm:ss.SSSSSS+00:00" to a Firestore Timestamp
 * @param dateString - The date string to convert
 * @returns Firestore Timestamp object
 */
export const convertDateStringToTimestamp = (dateString: string): Timestamp => {
  // Parse the date string to get milliseconds
  const date = new Date(dateString);
  
  // Convert to Firestore Timestamp
  return Timestamp.fromDate(date);
};

/**
 * Recursively processes an object to convert date strings to Firestore Timestamps
 * @param obj - The object to process
 * @returns Processed object with Firestore Timestamps
 */
export const processFirestoreData = (obj: any): any => {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  // If array, process each element
  if (Array.isArray(obj)) {
    return obj.map(item => processFirestoreData(item));
  }

  // Process object
  const processed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Check if the key indicates a date field
    if (
      typeof value === "string" && 
      (key.includes("date") || key.includes("Date")) &&
      /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(value)
    ) {
      processed[key] = convertDateStringToTimestamp(value);
    }
    // Recursively process nested objects
    else if (value && typeof value === "object") {
      processed[key] = processFirestoreData(value);
    }
    // Keep other values as is
    else {
      processed[key] = value;
    }
  }

  return processed;
}; 