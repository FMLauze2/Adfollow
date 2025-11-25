import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={styles.nav}>
      <h2 style={styles.logo}>AdFollow</h2>
      <div style={styles.links}>
        <Link style={styles.link} to="/suivi-contrats">Contrats</Link>
        <Link style={styles.link} to="/praticiens">Praticiens</Link>
        <Link style={styles.link} to="/installations">Installations</Link>
        <Link style={styles.link} to="/praticiens">Praticiens</Link>        
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
