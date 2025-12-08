import logo from './logo.svg';
import './App.css';
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// Import de la navbar et des pages
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ContratFormPage from "./pages/ContratFormPage";
import ContratsPage from "./pages/ContratsPage";
import InstallationsPage from "./pages/InstallationsPage";
import HistoriquePage from "./pages/HistoriquePage";
import CalendrierPage from "./pages/CalendrierPage";
import MesStatsPage from "./pages/MesStatsPage";
import PraticiensPage from "./pages/PraticiensPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import AdminPage from "./pages/AdminPage";
import DailyReportsPage from "./pages/DailyReportsPage";
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

// Composant Footer
function Footer() {
  const { darkMode, toggleTheme } = useTheme();
  
  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-white py-4 mt-8">
      <div className="container mx-auto px-4 flex justify-center items-center gap-6">
        <a href="/historique" className="hover:text-blue-400 transition-colors">
          📜 Historique
        </a>
        <a href="/mes-stats" className="hover:text-blue-400 transition-colors">
          📊 Mes Stats
        </a>
        <button
          onClick={toggleTheme}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg transition-all text-xl"
          title={darkMode ? "Mode clair" : "Mode sombre"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        <span className="text-gray-400">© 2025 AdFollow</span>
      </div>
    </footer>
  );
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
      <div style={{ padding: isAuthenticated() ? "20px" : "0", minHeight: "calc(100vh - 140px)" }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/contrats" element={<ProtectedRoute><ContratsPage /></ProtectedRoute>} />
          <Route path="/contrats/nouveau" element={<ProtectedRoute><ContratFormPage /></ProtectedRoute>} />
          <Route path="/historique" element={<ProtectedRoute><HistoriquePage /></ProtectedRoute>} />
          <Route path="/calendrier" element={<ProtectedRoute><CalendrierPage /></ProtectedRoute>} />
          <Route path="/mes-stats" element={<ProtectedRoute><MesStatsPage /></ProtectedRoute>} />
          <Route path="/installations" element={<ProtectedRoute><InstallationsPage /></ProtectedRoute>} />
          <Route path="/praticiens" element={<ProtectedRoute><PraticiensPage /></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute><KnowledgeBasePage /></ProtectedRoute>} />
          <Route path="/dailyreports" element={<ProtectedRoute><DailyReportsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        </Routes>
      </div>
      {isAuthenticated() && <Footer />}
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
