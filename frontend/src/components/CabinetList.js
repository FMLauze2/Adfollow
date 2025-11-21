import React from "react";

function CabinetList({ cabinets }) {
  return (
    <div>
      <h2>Liste des cabinets</h2>
      <ul>
        {cabinets.map((cab) => (
          <li key={cab.id_cabinet}>
            {cab.nom} — {cab.adresse}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CabinetList;
