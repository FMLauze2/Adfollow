import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

const Navbar = () => {
  const { darkMode, toggleTheme } = useTheme();

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
        <Link style={styles.link} to="/installations">Installations</Link>
        
        {/* Bouton Dark Mode */}
        <button
          onClick={toggleTheme}
          style={styles.themeToggle}
          title={darkMode ? "Mode clair" : "Mode sombre"}
        >
          {darkMode ? "☀️" : "🌙"}
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
  }
}; 

export default Navbar;
