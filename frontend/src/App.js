import logo from './logo.svg';
import './App.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Import de la navbar et des pages
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ContratFormPage from "./pages/ContratFormPage";
import ContratsSuiviPage from "./pages/ContratsSuiviPage";
import InstallationsPage from "./pages/InstallationsPage";
import HistoriquePage from "./pages/HistoriquePage";
import PraticiensPage from "./pages/PraticiensPage";

function App() {
  return (    
    <Router>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/contrats" element={<ContratsSuiviPage />} />
          <Route path="/contrats/nouveau" element={<ContratFormPage />} />
          <Route path="/historique" element={<HistoriquePage />} />
          <Route path="/installations" element={<InstallationsPage />} />
          <Route path="/praticiens" element={<PraticiensPage />} />
        </Routes>
      </div>
    </Router>   
  );
}

export default App;
