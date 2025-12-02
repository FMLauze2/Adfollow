import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <h2 style={styles.logo}>
        <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>
          AdFollow
        </Link>
      </h2>
      <div style={styles.links}>
        <Link style={styles.link} to="/contrats">Contrats</Link>
        <Link style={styles.link} to="/contrats/nouveau">Nouveau contrat</Link>
        <Link style={styles.link} to="/historique">Historique</Link>
        <Link style={styles.link} to="/calendrier">Calendrier</Link>
        <Link style={styles.link} to="/mes-stats">Mes Stats</Link>
        <Link style={styles.link} to="/installations">Rendez-vous</Link>
        <Link style={styles.link} to="/knowledge">📚 Base de connaissances</Link>
        
        {/* Admin link (visible uniquement pour les admins) */}
        {user && user.role === 'admin' && (
          <Link style={styles.link} to="/admin">⚙️ Administration</Link>
        )}
        
        {/* Info utilisateur */}
        {user && (
          <span style={{ ...styles.link, cursor: 'default', opacity: 0.8 }}>
            👤 {user.prenom || user.username}
          </span>
        )}
        
        {/* Bouton Dark Mode */}
        <button
          onClick={toggleTheme}
          style={styles.themeToggle}
          title={darkMode ? "Mode clair" : "Mode sombre"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

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
