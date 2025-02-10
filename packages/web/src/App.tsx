import React from "react";
import { LeagueTable } from "./components/Tables";
import UniqueParticipants from "./components/UniqueParticipants";
import "./App.css";


const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Healthcare Municipal Bond Issuance 2025</h1>
      </header>
      <main>
        <LeagueTable />
        <UniqueParticipants />
      </main>
    </div>

  );
};

export default App; 