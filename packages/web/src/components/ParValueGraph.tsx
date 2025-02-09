import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase-config";

/**
 * Interface representing manager data.
 */
interface ManagerData {
  manager: string;
  totalPar: number;
}

/**
 * React component that fetches and displays manager par values.
 *
 * This component retrieves deal data from Firestore, aggregates total par
 * values for each manager, filters and sorts the results (excluding "Unknown Manager"
 * when its total is zero), and finally displays both the detailed table of managers
 * and the overall total par value.
 */
const ParValueGraph: React.FC = () => {
  // State to store the array of manager data.
  const [managerData, setManagerData] = useState<ManagerData[]>([]);
  // State to store the overall total par value across all managers.
  const [totalPar, setTotalPar] = useState<number>(0);

  /**
   * Sorts the manager data in descending order according to totalPar
   * and filters out "Unknown Manager" if its total par is zero.
   *
   * @param data - Array of ManagerData objects to process.
   * @returns A filtered and sorted array of ManagerData.
   */
  const sortDataDescending = (data: ManagerData[]): ManagerData[] => {
    return [...data]
      .sort((a, b) => b.totalPar - a.totalPar)
      .filter((item) => !(item.manager === "Unknown Manager" && item.totalPar === 0));
  };

  // useEffect hook to fetch deal data from Firestore once when the component mounts.
  useEffect(() => {
    /**
     * Asynchronously fetches par values for each manager from the "deals" collection,
     * aggregates par values, filters and sorts the manager data, and updates component state.
     */
    const fetchParValues = async () => {
      try {
        // Get a reference to the "deals" collection.
        const dealsRef = collection(db, "deals");
        // Retrieve all documents within the collection.
        const querySnapshot = await getDocs(dealsRef);
        
        // Debug: Log the number of documents found.
        console.log("Documents found:", querySnapshot.size);

        // Object to accumulate the total par for each manager.
        const managerTotals: { [key: string]: number } = {};

        // Iterate through each document in the snapshot.
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Retrieve the first lead manager if available, otherwise default to "Unknown Manager".
          const manager = data.lead_managers?.[0] || "Unknown Manager";
          // Accumulate the par value for the manager.
          managerTotals[manager] = (managerTotals[manager] || 0) + (data.total_par || 0);
        });

        // Convert the accumulated totals into an array of ManagerData objects.
        let managerArray: ManagerData[] = Object.entries(managerTotals).map(
          ([manager, totalPar]) => ({
            manager,
            totalPar,
          })
        );

        // Calculate the overall total par value across all managers.
        const overallTotalPar = Object.values(managerTotals).reduce(
          (sum, val) => sum + val,
          0
        );

        // Sort the array in descending order and filter out "Unknown Manager" with a zero total.
        managerArray = sortDataDescending(managerArray);

        // Update the state with the processed manager data and overall total par.
        setManagerData(managerArray);
        setTotalPar(overallTotalPar);

        // Debug: Log the overall total par value.
        console.log("Total par value across all managers:", overallTotalPar);
      }
      catch (error) {
        console.error("Error fetching par values:", error);
      }
    };

    fetchParValues();
  }, []);

  // Render the component UI.
  return (
    <div style={{ width: "80%", margin: "0 auto" }}>
      <div>
        <h3>{"Total Par Issued: $" + totalPar.toLocaleString()}</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Rank</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Lead Left Manager</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Total Par Amount</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Underwriter's Fee Amount</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Underwriter's Fee %</th>
            </tr>
          </thead>
          <tbody>
            {managerData.map(({ manager, totalPar }, index) => (
              <tr key={manager}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {index + 1}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {manager}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {"$" + totalPar.toLocaleString()}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {"-"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {"-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParValueGraph; 