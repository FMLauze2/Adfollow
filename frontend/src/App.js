import logo from './logo.svg';
import './App.css';
import React from "react";
import CabinetsPage from "./pages/CabinetPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Import de la navbar et des pages
import Navbar from "./components/Navbar";
import ContratsPage from "./pages/ContratsPage";
import InstallationsPage from "./pages/InstallationsPage";
import PraticiensPage from "./pages/PraticiensPage";

function App() {
  return (    
    <Router>
    <Navbar />
      <div style={{ padding: "20px" }}>
        <Routes>
          <Route path="/" element={<ContratsPage />} />
          <Route path="/installations" element={<InstallationsPage />} />
          <Route path="/praticiens" element={<PraticiensPage />} />
        </Routes>
      </div>
    </Router>   
  );
}

export default App;
