import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase-config";
import "./LeagueTable.scss";

/**
 * Interface representing manager data with added fee information
 */
interface ManagerData {
  manager: string;
  totalPar: number;
  underwriterFee: number;  // New field for the total underwriter fee
}

/**
 * LeagueTable Component
 * Displays league standings in a tabular format
 */
const LeagueTable: React.FC = () => {
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

        // Object to accumulate the total par and underwriter fees for each manager
        const managerTotals: { [key: string]: { par: number; fee: number } } = {};

        // Iterate through each document in the snapshot
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const manager = data.lead_managers?.[0] || "Unknown Manager";
          
          // Initialize the manager entry if it doesn't exist
          if (!managerTotals[manager]) {
            managerTotals[manager] = { par: 0, fee: 0 };
          }
          
          // Accumulate the par value
          managerTotals[manager].par += data.total_par || 0;
          
          // Accumulate the underwriter fee if it exists
          const underwriterFee = data.underwriter_fee?.total || 0;
          managerTotals[manager].fee += underwriterFee;
        });

        // Convert the accumulated totals into an array of ManagerData objects
        let managerArray: ManagerData[] = Object.entries(managerTotals).map(
          ([manager, totals]) => ({
            manager,
            totalPar: totals.par,
            underwriterFee: totals.fee,
          })
        );

        // Calculate the overall total par value across all managers
        const overallTotalPar = Object.values(managerTotals).reduce(
          (sum, val) => sum + val.par,
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
        <table className="league-table">
          <thead className="league-table__header">
            <tr>
              <th className="league-table__header--center">Rank</th>
              <th className="league-table__header--center">Lead Left<br />Manager</th>
              <th className="league-table__header--right">Total<br />Par Amount</th>
              <th className="league-table__header--right">Underwriter's<br />Fee Amount</th>
              <th className="league-table__header--center">Underwriter's<br />Fee %</th>

            </tr>

          </thead>


          <tbody>
            {managerData.map(({ manager, totalPar, underwriterFee }, index) => (
              <tr key={manager} className="league-table__row">
                <td className="league-table__cell league-table__cell">
                  {index + 1}
                </td>
                <td className="league-table__cell league-table__cell-manager">
                  {manager}
                </td>
                <td className="league-table__cell league-table__cell--right">
                  {"$" + totalPar.toLocaleString()}
                </td>
                <td className="league-table__cell league-table__cell--right">
                  {
                    "$" +
                    // Use Math.round() to round underwriterFee to the nearest whole number,
                    // then format it with commas using toLocaleString().
                    Math.round(underwriterFee).toLocaleString("en-US")
                  }
                </td>
                <td className="league-table__cell league-table__cell">
                  {totalPar > 0 
                    ? ((underwriterFee / totalPar) * 100).toFixed(2) + "%" 
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeagueTable; 