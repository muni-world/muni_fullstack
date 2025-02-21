/**
 * TestTable Component
 * This component fetches test authentication data from the Firebase Cloud Functions emulator
 * and displays it in a table. It demonstrates how to properly connect to the local emulator
 * to handle CORS issues during development.
 */

import React, { useEffect, useState } from "react";
import { httpsCallable, getFunctions, connectFunctionsEmulator } from "firebase/functions";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

/**
 * Interface describing the expected structure of the cloud function's response.
 * Think of this as a blueprint telling TypeScript exactly what fields to expect.
 */
interface TestAuthResponse {
  success: boolean;
  userType: string;
  data: any[]; // Replace "any" with a more specific type if available.
}

/**
 * Interface representing a row of test data.
 */
interface TestDataRow {
  issuer: string;
  total_par?: number;
  underwriters_fee_total?: number;
}

// Get a reference to the Firebase Functions instance.
const functions = getFunctions();

// When running locally, connect to the functions emulator to avoid CORS issues.
// This tells Firebase to target the local endpoint (http://localhost:5001) instead of production.
if (process.env.NODE_ENV === "development")
{
  connectFunctionsEmulator(functions, "localhost", 5001);
}

/**
 * Create the callable cloud function with the expected response type.
 * With this, TypeScript now knows that the function will return data adhering to TestAuthResponse.
 */
const testAuthData = httpsCallable<{}, TestAuthResponse>(
  functions,
  "testAuthData"
);

/**
 * TestTable Component that displays test authentication subscription data in a table.
 *
 * Depending on the user's subscription status, the table columns are:
 * - Unauthenticated: Displays Issuer only.
 * - Authenticated (free): Displays Issuer and Total Par.
 * - Subscriber: Displays Issuer, Total Par, and Underwriters Fee Total.
 */
const TestTable: React.FC = () =>
{
  // State to store table rows.
  const [rows, setRows] = useState<TestDataRow[]>([]);
  // State to store the user type returned by the cloud function.
  const [userType, setUserType] = useState<string>("unauthenticated");
  // State to indicate if data is loading.
  const [loading, setLoading] = useState<boolean>(true);
  // State to store any error messages.
  const [error, setError] = useState<string | null>(null);

  /**
   * useEffect hook to fetch test data when the component mounts.
   * It's like placing an order when you sit down and waiting for the food to be served.
   */
  useEffect(() =>
  {
    /**
     * Async function to call the cloud function and update the component state.
     */
    const fetchData = async () =>
    {
      try
      {
        // Call the cloud function.
        const result = await testAuthData();
        // Check if the response contains the expected data and success flag.
        if (result.data && result.data.success)
        {
          // Update state based on the response.
          setUserType(result.data.userType);
          setRows(result.data.data);
        }
        else
        {
          // If the response is not valid, set an error message.
          setError("No data returned");
        }
      }
      catch (err: any)
      {
        // Log the error and update the error state.
        console.error("Error fetching test data:", err);
        setError(err.message || "Error fetching data");
      }
      finally
      {
        // Stop the loading spinner.
        setLoading(false);
      }
    };

    // Initiate the fetch when the component is mounted.
    fetchData();
  }, []);

  // Show a loading message if data is still being fetched.
  if (loading)
  {
    return <Typography variant="h6">Loading data...</Typography>;
  }

  // If there was an error fetching the data, display the error.
  if (error)
  {
    return <Typography variant="h6" color="error">Error: {error}</Typography>;
  }

  // Build table headers dynamically based on the user type.
  let headers: string[] = ["Issuer"];
  if (userType === "free" || userType === "subscriber")
  {
    headers.push("Total Par");
  }
  if (userType === "subscriber")
  {
    headers.push("Underwriters Fee Total");
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableCell key={header}>
                <strong>{header}</strong>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.issuer}</TableCell>
              {(userType === "free" || userType === "subscriber") && (
                <TableCell>{row.total_par !== undefined ? row.total_par : "-"}</TableCell>
              )}
              {userType === "subscriber" && (
                <TableCell>
                  {row.underwriters_fee_total !== undefined ? row.underwriters_fee_total : "-"}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TestTable;
