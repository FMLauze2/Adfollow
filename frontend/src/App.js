import logo from './logo.svg';
import './App.css';
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Import de la navbar et des pages
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ContratFormPage from "./pages/ContratFormPage";
import ContratsSuiviPage from "./pages/ContratsSuiviPage";
import InstallationsPage from "./pages/InstallationsPage";
import HistoriquePage from "./pages/HistoriquePage";
import CalendrierPage from "./pages/CalendrierPage";
import MesStatsPage from "./pages/MesStatsPage";
import PraticiensPage from "./pages/PraticiensPage";
import notificationManager from "./services/NotificationManager";

function App() {
  // Démarrer le gestionnaire de notifications au montage
  useEffect(() => {
    notificationManager.start();

    // Nettoyer à la fermeture
    return () => {
      notificationManager.stop();
    };
  }, []);

  return (    
    <Router>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/contrats" element={<ContratsSuiviPage />} />
          <Route path="/contrats/nouveau" element={<ContratFormPage />} />
          <Route path="/historique" element={<HistoriquePage />} />
          <Route path="/calendrier" element={<CalendrierPage />} />
          <Route path="/mes-stats" element={<MesStatsPage />} />
          <Route path="/installations" element={<InstallationsPage />} />
          <Route path="/praticiens" element={<PraticiensPage />} />
        </Routes>
      </div>
    </Router>   
  );
}

export default App;
