import logo from './logo.svg';
import './App.css';
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// Import de la navbar et des pages
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ContratFormPage from "./pages/ContratFormPage";
import ContratsSuiviPage from "./pages/ContratsSuiviPage";
import InstallationsPage from "./pages/InstallationsPage";
import HistoriquePage from "./pages/HistoriquePage";
import CalendrierPage from "./pages/CalendrierPage";
import MesStatsPage from "./pages/MesStatsPage";
import PraticiensPage from "./pages/PraticiensPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import AdminPage from "./pages/AdminPage";
import notificationManager from "./services/NotificationManager";

// Composant pour protéger les routes
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  return children;
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  // Démarrer le gestionnaire de notifications au montage
  useEffect(() => {
    if (isAuthenticated()) {
      notificationManager.start();
    }

    // Nettoyer à la fermeture
    return () => {
      notificationManager.stop();
    };
  }, [isAuthenticated]);

  return (
    <>
      {isAuthenticated() && <Navbar />}
      <div style={{ padding: isAuthenticated() ? "20px" : "0" }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/contrats" element={<ProtectedRoute><ContratsSuiviPage /></ProtectedRoute>} />
          <Route path="/contrats/nouveau" element={<ProtectedRoute><ContratFormPage /></ProtectedRoute>} />
          <Route path="/historique" element={<ProtectedRoute><HistoriquePage /></ProtectedRoute>} />
          <Route path="/calendrier" element={<ProtectedRoute><CalendrierPage /></ProtectedRoute>} />
          <Route path="/mes-stats" element={<ProtectedRoute><MesStatsPage /></ProtectedRoute>} />
          <Route path="/installations" element={<ProtectedRoute><InstallationsPage /></ProtectedRoute>} />
          <Route path="/praticiens" element={<ProtectedRoute><PraticiensPage /></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute><KnowledgeBasePage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (    
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>   
  );
}

export default App;
