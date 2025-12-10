import React, { useEffect, useMemo, useState } from 'react';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/format';

// Ce composant gère la recherche avancée et l'affichage détaillé des RDV
const RechercheAvanceeRDV = ({ rdvList, filters, onFilterChange, sortOptions, onSortChange, onEffectue, onFacturer, onEdit, onDelete, loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [sortType, setSortType] = useState(sortOptions[0]?.value || 'date');
  const [activeFilters, setActiveFilters] = useState(filters || {});

  // Persistance filtres/recherche
  useEffect(() => {
    const saved = localStorage.getItem('rdv_avance_filters');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.searchTerm) setSearchTerm(parsed.searchTerm);
      if (parsed.sortType) setSortType(parsed.sortType);
      if (parsed.activeFilters) setActiveFilters(parsed.activeFilters);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rdv_avance_filters', JSON.stringify({ searchTerm, sortType, activeFilters }));
  }, [searchTerm, sortType, activeFilters]);

  // Debounce recherche
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Filtrage avancé des RDV
  const filteredRdv = useMemo(() => rdvList.filter(rdv => {
    let match = true;
    if (debouncedTerm) {
      match = (
        (rdv.cabinet && rdv.cabinet.toLowerCase().includes(debouncedTerm.toLowerCase())) ||
        (rdv.email && rdv.email.toLowerCase().includes(debouncedTerm.toLowerCase())) ||
        (rdv.adresse && rdv.adresse.toLowerCase().includes(debouncedTerm.toLowerCase())) ||
        (rdv.ville && rdv.ville.toLowerCase().includes(debouncedTerm.toLowerCase())) ||
        (rdv.type_rdv && rdv.type_rdv.toLowerCase().includes(debouncedTerm.toLowerCase()))
      );
    }
    // Application des filtres avancés
    Object.keys(activeFilters).forEach(key => {
      if (activeFilters[key] && rdv[key] !== activeFilters[key]) {
        match = false;
      }
    });
    return match;
  }), [rdvList, debouncedTerm, activeFilters]);

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
          aria-label="Rechercher un rendez-vous"
          className="border rounded px-2 py-1 mr-2"
        />
        <select
          value={sortType}
          onChange={e => {
            setSortType(e.target.value);
            onSortChange && onSortChange(e.target.value);
          }}
          aria-label="Trier les rendez-vous"
          className="border rounded px-2 py-1"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="mb-4 flex gap-2 flex-wrap items-center">
        <label className="text-sm text-gray-700">Praticien</label>
        <input
          type="text"
          value={activeFilters.praticien || ''}
          onChange={e => handleFilterChange('praticien', e.target.value)}
          aria-label="Filtrer par praticien"
          className="border rounded px-2 py-1"
        />
        <label className="text-sm text-gray-700">Statut</label>
        <input
          type="text"
          value={activeFilters.statut || ''}
          onChange={e => handleFilterChange('statut', e.target.value)}
          aria-label="Filtrer par statut"
          className="border rounded px-2 py-1"
        />
      </div>

      <div className="space-y-3" role="list" aria-busy={loading}>
        {loading && (
          <div className="animate-pulse space-y-3" aria-hidden="true">
            {[1,2,3].map(i => (
              <div key={i} className="bg-gray-100 h-24 rounded" />
            ))}
          </div>
        )}

        {!loading && sortedRdv.map((rdv, idx) => (
          <div
            key={rdv.id_rdv || idx}
            className="border rounded-lg p-4 bg-white shadow-sm"
            role="listitem"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-lg">{rdv.cabinet}</div>
                <div className="text-sm text-gray-600">📅 {formatDate(rdv.date_rdv)} {rdv.heure_rdv && `à ${rdv.heure_rdv}`}</div>
                <div className="text-sm text-gray-600">📍 {rdv.adresse}, {rdv.code_postal} {rdv.ville}</div>
              </div>
              <StatusBadge value={rdv.statut} />
            </div>
            <div className="text-sm text-gray-700 mt-2">Type: {rdv.type_rdv}</div>
            {rdv.email && <div className="text-sm text-gray-700">✉️ {rdv.email}</div>}
            {Array.isArray(rdv.praticiens) && rdv.praticiens.length > 0 && (
              <div className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                Praticiens : {rdv.praticiens.map((p, i) => `${p.prenom} ${p.nom}`).join(', ')}
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <button className="bg-green-500 text-white px-2 py-1 rounded text-xs" aria-label={`Marquer ${rdv.cabinet} comme effectué`} onClick={() => onEffectue && onEffectue(rdv)}>Effectué</button>
              <button className="bg-purple-500 text-white px-2 py-1 rounded text-xs" aria-label={`Marquer ${rdv.cabinet} comme facturé`} onClick={() => onFacturer && onFacturer(rdv)}>Facturer</button>
              <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs" aria-label={`Modifier le rendez-vous ${rdv.cabinet}`} onClick={() => onEdit && onEdit(rdv)}>Modifier</button>
              <button className="bg-red-500 text-white px-2 py-1 rounded text-xs" aria-label={`Supprimer le rendez-vous ${rdv.cabinet}`} onClick={() => onDelete && onDelete(rdv)}>Supprimer</button>
            </div>
          </div>
        ))}

        {!loading && sortedRdv.length === 0 && (
          <div className="text-center text-gray-500 py-6" aria-live="polite">Aucun rendez-vous trouvé</div>
        )}
      </div>
    </div> 
  );
};

export default RechercheAvanceeRDV;
