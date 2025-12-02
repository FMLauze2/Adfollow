import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
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
        <Link style={styles.link} to="/installations">Installations</Link>
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
  },
  link: {
    color: "#fff",
    textDecoration: "none",
  },
}; 

export default Navbar;
