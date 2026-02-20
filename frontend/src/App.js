import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
// Import de la navbar et des pages
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FeatureFlagProvider } from "./contexts/FeatureFlagContext";
import { useTheme } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import ToastContainer from "./components/ToastContainer";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ContratFormPage from "./pages/ContratFormPage";
import ContratsPage from "./pages/ContratsPage";
import InstallationsSuiviPage from "./pages/InstallationsSuiviPage";
import HistoriquePage from "./pages/HistoriquePage";
import CalendrierPage from "./pages/CalendrierPage";
import MesStatsPage from "./pages/MesStatsPage";
import PraticiensPage from "./pages/PraticiensPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import AdminPage from "./pages/AdminPage";
import notificationManager from "./services/NotificationManager";

// Import de la page de backup non utilisée
// import InstallationsPage_backup from "./pages/InstallationsPage_backup";

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
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

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

  // Raccourcis clavier globaux
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K ou Cmd+K : Ouvrir la recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      
      // Ctrl+N : Nouveau RDV
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        navigate('/installations');
      }

      // Ctrl+Shift+C : Nouveau contrat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        navigate('/contrats/nouveau');
      }

      // Ctrl+H : Accueil
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        navigate('/');
      }
    };

    if (isAuthenticated()) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isAuthenticated, navigate]);

  const { flags } = require("./contexts/FeatureFlagContext").useFeatureFlags();
  
  return (
    <>
      <ToastContainer />
      {isAuthenticated() && <Navbar searchOpen={searchOpen} setSearchOpen={setSearchOpen} />}
      <div style={{ padding: isAuthenticated() ? "20px" : "0", minHeight: "calc(100vh - 140px)" }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/contrats" element={<ProtectedRoute><ContratsPage /></ProtectedRoute>} />
          <Route path="/contrats/nouveau" element={<ProtectedRoute><ContratFormPage /></ProtectedRoute>} />
          <Route path="/historique" element={<ProtectedRoute><HistoriquePage /></ProtectedRoute>} />
          <Route path="/calendrier" element={<ProtectedRoute><CalendrierPage /></ProtectedRoute>} />
          <Route path="/mes-stats" element={<ProtectedRoute><MesStatsPage /></ProtectedRoute>} />
          <Route path="/installations" element={<ProtectedRoute><InstallationsSuiviPage /></ProtectedRoute>} />
          <Route path="/praticiens" element={<ProtectedRoute><PraticiensPage /></ProtectedRoute>} />
          {flags?.knowledge_base !== false && (
            <Route path="/knowledge" element={<ProtectedRoute><KnowledgeBasePage /></ProtectedRoute>} />
          )}
          {/* Ajoute ici d'autres routes conditionnelles si besoin */}
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
        <FeatureFlagProvider>
          <AppContent />
        </FeatureFlagProvider>
      </AuthProvider>
    </Router>   
  );
}

export default App;
