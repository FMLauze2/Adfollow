// components/ContratsList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ContratsList = () => {
  const [contrats, setContrats] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:4000/api/contrats")
      .then(res => setContrats(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="space-y-4">
      {contrats.map((c) => (
        <div key={c.id} className="border p-4 rounded-lg shadow-sm bg-white">
          <h3 className="font-semibold text-lg">{c.cabinet}</h3>
          <p className="text-gray-600">{c.ville} ({c.code_postal})</p>
          <p className="text-sm text-gray-700">
            Praticiens : {c.praticiens.join(', ')}
          </p>
          <p className="text-sm mt-1">Prix : {c.prix} €</p>
        </div>
      ))}
    </div>
  );
};

export default ContratsList;
