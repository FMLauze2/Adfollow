import React, { useState, useEffect } from 'react';

// Ce composant gère la recherche rapide et la création de RDV
const RechercheSimpleRDV = ({ rdvList, onCreateRdv, sortOptions, onSortChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState(sortOptions[0]?.value || 'date');

  // Filtrage des RDV selon le terme de recherche
  const filteredRdv = rdvList.filter(rdv => {
    if (!searchTerm) return true;
    return (
      (rdv.cabinet && rdv.cabinet.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rdv.email && rdv.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rdv.adresse && rdv.adresse.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Tri des RDV selon le type choisi
  const sortedRdv = [...filteredRdv].sort((a, b) => {
    if (sortType === 'date') {
      return new Date(b.date_rdv) - new Date(a.date_rdv);
    } else if (sortType === 'nom') {
      return a.cabinet.localeCompare(b.cabinet);
    }
    return 0;
  });

  return (
    <div>
      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Recherche rapide..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="border rounded px-2 py-1 mr-2"
        />
        <select
          value={sortType}
          onChange={e => {
            setSortType(e.target.value);
            onSortChange && onSortChange(e.target.value);
          }}
          className="border rounded px-2 py-1"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <ul>
        {sortedRdv.map((rdv, idx) => (
          <li key={rdv.id_rdv || idx} className="border-b py-2">
            <span>{rdv.cabinet} - {rdv.date_rdv}</span>
            {Array.isArray(rdv.praticiens) && rdv.praticiens.length > 0 && (
              <div className="text-xs text-gray-600 mt-1">
                Praticiens : {rdv.praticiens.map((p, i) => `${p.prenom} ${p.nom}`).join(', ')}
              </div>
            )}
          </li>
        ))}
      </ul>
      <button
        className="bg-orange-500 text-white px-4 py-2 rounded mt-4"
        onClick={onCreateRdv}
      >
        Nouveau RDV
      </button>
    </div>
  );
};

export default RechercheSimpleRDV;
