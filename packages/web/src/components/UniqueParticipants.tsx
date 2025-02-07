import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase-config";

/**
 * Interface for storing unique participant lists
 */
interface ParticipantLists {
  leadManagers: string[];
  counsels: string[];
  coManagers: string[];
  municipalAdvisors: string[];
  underwritersAdvisors: string[];
}

/**
 * Component that displays unique participants from all deals
 */
const UniqueParticipants: React.FC = () => {
  const [participants, setParticipants] = useState<ParticipantLists>({
    leadManagers: [],
    counsels: [],
    coManagers: [],
    municipalAdvisors: [],
    underwritersAdvisors: [],
  });

  useEffect(() => {
    const fetchUniqueParticipants = async () => {
      try {
        const dealsRef = collection(db, "deals");
        const querySnapshot = await getDocs(dealsRef);

        // Sets to store unique values
        const uniqueParticipants = {
          leadManagers: new Set<string>(),
          counsels: new Set<string>(),
          coManagers: new Set<string>(),
          municipalAdvisors: new Set<string>(),
          underwritersAdvisors: new Set<string>(),
        };

        // Process each document
        querySnapshot.forEach((doc) => {
          const data = doc.data();

          // Add all items from each array field to respective sets
          data.lead_managers?.forEach((manager: string) => 
            uniqueParticipants.leadManagers.add(manager));
          data.counsels?.forEach((counsel: string) => 
            uniqueParticipants.counsels.add(counsel));
          data.co_managers?.forEach((manager: string) => 
            uniqueParticipants.coManagers.add(manager));
          data.municipal_advisors?.forEach((advisor: string) => 
            uniqueParticipants.municipalAdvisors.add(advisor));
          data.underwriters_advisors?.forEach((advisor: string) => 
            uniqueParticipants.underwritersAdvisors.add(advisor));
        });

        // Convert sets to sorted arrays
        setParticipants({
          leadManagers: Array.from(uniqueParticipants.leadManagers).sort(),
          counsels: Array.from(uniqueParticipants.counsels).sort(),
          coManagers: Array.from(uniqueParticipants.coManagers).sort(),
          municipalAdvisors: Array.from(uniqueParticipants.municipalAdvisors).sort(),
          underwritersAdvisors: Array.from(uniqueParticipants.underwritersAdvisors).sort(),
        });
      }
      catch (error) {
        console.error("Error fetching unique participants:", error);
      }
    };

    fetchUniqueParticipants();
  }, []);

  /**
   * Helper function to render a list section
   */
  const renderList = (title: string, items: string[]) => (
    <div style={{ marginBottom: "2rem" }}>
      <h3>{title} ({items.length})</h3>
      <textarea
        value={items.join("\n")}
        readOnly
        rows={Math.min(items.length + 1, 10)}
        style={{
          width: "100%",
          padding: "8px",
          marginTop: "8px",
          fontFamily: "monospace",
        }}
      />
    </div>
  );

  return (
    <div style={{ width: "80%", margin: "2rem auto" }}>
      <h2>Unique Participants Lists</h2>
      {renderList("Lead Managers", participants.leadManagers)}
      {renderList("Counsels", participants.counsels)}
      {renderList("Co-Managers", participants.coManagers)}
      {renderList("Municipal Advisors", participants.municipalAdvisors)}
      {renderList("Underwriters Advisors", participants.underwritersAdvisors)}
    </div>
  );
};

export default UniqueParticipants; 