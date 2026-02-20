import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

import { useFeatureFlags } from "../contexts/FeatureFlagContext";
import NotificationBell from "./NotificationBell";
import GlobalSearch from "./GlobalSearch";

const Navbar = ({ searchOpen, setSearchOpen }) => {
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [localSearchOpen, setLocalSearchOpen] = useState(false);

  // Utiliser le state externe si fourni, sinon le state local
  const isSearchOpen = searchOpen !== undefined ? searchOpen : localSearchOpen;
  const handleSearchToggle = setSearchOpen || setLocalSearchOpen;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { flags } = useFeatureFlags();

  return (
    <>
      <GlobalSearch isOpen={isSearchOpen} onClose={() => handleSearchToggle(false)} />
      
      <nav style={styles.nav}>
        <h2 style={styles.logo}>
          <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>
            AdFollow
          </Link>
        </h2>
        <div style={styles.links}>
          {/* Bouton de recherche */}
          <button
            onClick={() => handleSearchToggle(true)}
            style={styles.searchButton}
            title="Recherche globale (Ctrl+K)"
          >
            🔍 Rechercher
          </button>
          
          <Link style={styles.link} to="/installations">Rendez-vous</Link>
          <Link style={styles.link} to="/calendrier">Calendrier</Link>
          <Link style={styles.link} to="/contrats">Contrats</Link>
          {flags?.daily_reports !== false && (
            <Link style={styles.link} to="/dailyreports">📊 Daily Reports</Link>
          )}
          {flags?.knowledge_base !== false && (
            <Link style={styles.link} to="/knowledge">📚 Base de connaissances</Link>
          )}
          {/* Admin link (visible uniquement pour les admins) */}
          {user && user.role === 'admin' && (
            <Link style={styles.link} to="/admin">⚙️ Administration</Link>
          )}
          {/* Notifications */}
          <NotificationBell />
          {/* Info utilisateur */}
          {user && (
            <span style={{ ...styles.link, cursor: 'default', opacity: 0.8 }}>
              👤 {user.prenom || user.username}
            </span>
          )}
          {/* Bouton Déconnexion */}
          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            title="Se déconnecter"
          >
            🚪 Déconnexion
          </button>
        </div>
    </nav>
    </>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 20px",
    backgroundColor: "#282c34",
    color: "#fff",
    alignItems: "center",
  },
  logo: {
    margin: 0,
  },
  links: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
  },
  searchButton: {
    background: "rgba(255, 255, 255, 0.15)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "6px",
    padding: "6px 12px",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  themeToggle: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "20px",
    cursor: "pointer",
    transition: "background 0.3s",
  },
  logoutButton: {
    background: "rgba(255, 0, 0, 0.2)",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    color: "#fff",
    cursor: "pointer",
    transition: "background 0.3s",
  }
}; 

export default Navbar;
