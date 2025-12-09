import React, { useState, useEffect } from 'react';

// Ce composant gère la recherche avancée et l'affichage détaillé des RDV
const RechercheAvanceeRDV = ({ rdvList, filters, onFilterChange, sortOptions, onSortChange, onEffectue, onFacturer, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState(sortOptions[0]?.value || 'date');
  const [activeFilters, setActiveFilters] = useState(filters || {});

  // Filtrage avancé des RDV
  const filteredRdv = rdvList.filter(rdv => {
    let match = true;
    if (searchTerm) {
      match = (
        (rdv.cabinet && rdv.cabinet.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rdv.email && rdv.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rdv.adresse && rdv.adresse.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rdv.ville && rdv.ville.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rdv.type_rdv && rdv.type_rdv.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    // Application des filtres avancés
    Object.keys(activeFilters).forEach(key => {
      if (activeFilters[key] && rdv[key] !== activeFilters[key]) {
        match = false;
      }
    });
    return match;
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

  // Gestion du changement de filtre
  const handleFilterChange = (key, value) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onFilterChange && onFilterChange(newFilters);
  };

  return (
    <div>
      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Recherche avancée..."
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
      <div className="mb-4">
        {/* Exemple de filtres avancés */}
        <label className="mr-2">Praticien:</label>
        <input
          type="text"
          value={activeFilters.praticien || ''}
          onChange={e => handleFilterChange('praticien', e.target.value)}
          className="border rounded px-2 py-1 mr-2"
        />
        <label className="mr-2">Statut:</label>
        <input
          type="text"
          value={activeFilters.statut || ''}
          onChange={e => handleFilterChange('statut', e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>
      <ul>
        {sortedRdv.map((rdv, idx) => (
          <li key={rdv.id_rdv || idx} className="border-b py-2">
            <div><strong>{rdv.cabinet}</strong> - {rdv.date_rdv} {rdv.heure_rdv}</div>
            <div>Email: {rdv.email}</div>
            <div>Adresse: {rdv.adresse}, {rdv.code_postal} {rdv.ville}</div>
            {Array.isArray(rdv.praticiens) && rdv.praticiens.length > 0 && (
              <div className="text-xs text-gray-600 mt-1">
                Praticiens : {rdv.praticiens.map((p, i) => `${p.prenom} ${p.nom}`).join(', ')}
              </div>
            )}
            <div>Type: {rdv.type_rdv}</div>
            <div>Statut: {rdv.statut}</div>
            <div className="mt-2 flex gap-2">
              <button className="bg-green-500 text-white px-2 py-1 rounded text-xs" onClick={() => onEffectue && onEffectue(rdv)}>Effectué</button>
              <button className="bg-purple-500 text-white px-2 py-1 rounded text-xs" onClick={() => onFacturer && onFacturer(rdv)}>Facturer</button>
              <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs" onClick={() => onEdit && onEdit(rdv)}>Modifier</button>
              <button className="bg-red-500 text-white px-2 py-1 rounded text-xs" onClick={() => onDelete && onDelete(rdv)}>Supprimer</button>
            </div>
          </li>
        ))}
      </ul>
    </div> 
  );
};

export default RechercheAvanceeRDV;
