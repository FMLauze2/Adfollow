import React, { useEffect, useState } from "react";
import api from "../api/Api";
import CabinetList from "../components/CabinetList";

function CabinetsPage() {
  const [cabinets, setCabinets] = useState([]);

  useEffect(() => {
    api.get("/cabinets")
      .then((res) => setCabinets(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Gestion des Cabinets</h1>
      <CabinetList cabinets={cabinets} />
    </div>
  );
}

export default CabinetsPage;
