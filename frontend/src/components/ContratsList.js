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

  const formatPraticiens = (praticiens) => {
    // Gérer les différents formats possibles
    if (!praticiens) return 'Aucun';
    
    // Si c'est une string JSON, la parser d'abord
    let praticiensList = praticiens;
    if (typeof praticiens === 'string') {
      try {
        praticiensList = JSON.parse(praticiens);
      } catch (e) {
        // Si c'est une simple string, la retourner
        return praticiens || 'Aucun';
      }
    }
    
    // Vérifier que c'est un tableau
    if (!Array.isArray(praticiensList)) {
      // Si c'est un objet, convertir ses valeurs en array
      if (typeof praticiensList === 'object') {
        praticiensList = Object.values(praticiensList);
      } else {
        return 'Aucun';
      }
    }
    
    // Filtrer les éléments vides
    if (praticiensList.length === 0) return 'Aucun';
    
    // Formater chaque praticien
    return praticiensList.map(p => {
      if (typeof p === 'object' && p.prenom && p.nom) {
        return `${p.prenom} ${p.nom}`;
      } else if (typeof p === 'object' && (p.nom || p.prenom)) {
        // Concaténer nom et prenom s'ils existent
        return [p.prenom, p.nom].filter(Boolean).join(' ');
      } else if (typeof p === 'string') {
        return p.trim();
      }
      return '';
    }).filter(Boolean).join(', ') || 'Aucun';
  };

  return (
    <div className="space-y-4">
      {contrats.map((c) => (
        <div key={c.id} className="border p-4 rounded-lg shadow-sm bg-white">
          <h3 className="font-semibold text-lg">{c.cabinet}</h3>
          <p className="text-gray-600">{c.ville} ({c.code_postal})</p>
          <p className="text-sm text-gray-700">
            Praticiens : {formatPraticiens(c.praticiens)}
          </p>
          <p className="text-sm mt-1">Prix : {c.prix} €</p>
        </div>
      ))}
    </div>
  );
};

export default ContratsList;
