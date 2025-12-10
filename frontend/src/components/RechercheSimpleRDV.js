import React, { useEffect, useMemo, useState } from 'react';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/format';

// Ce composant gère la recherche rapide et l'affichage simple des RDV
const RechercheSimpleRDV = ({ rdvList, onCreateRdv, sortOptions, onSortChange, onEffectue, onFacturer, onEdit, onDelete, loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState(sortOptions[0]?.value || 'date_desc');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Persistance du filtre
  useEffect(() => {
    const saved = localStorage.getItem('rdv_simple_filters');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.searchTerm) setSearchTerm(parsed.searchTerm);
      if (parsed.sortType) setSortType(parsed.sortType);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rdv_simple_filters', JSON.stringify({ searchTerm, sortType }));
  }, [searchTerm, sortType]);

  // Debounce recherche
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Filtrage des RDV selon le terme de recherche
  const filteredRdv = useMemo(() => rdvList.filter(rdv => {
    if (!debouncedTerm) return true;
    return (
      (rdv.cabinet && rdv.cabinet.toLowerCase().includes(debouncedTerm.toLowerCase())) ||
      (rdv.email && rdv.email.toLowerCase().includes(debouncedTerm.toLowerCase())) ||
      (rdv.ville && rdv.ville.toLowerCase().includes(debouncedTerm.toLowerCase())) ||
      (rdv.type_rdv && rdv.type_rdv.toLowerCase().includes(debouncedTerm.toLowerCase()))
    );
  }), [rdvList, debouncedTerm]);

  // Tri des RDV selon le type choisi
  const getDateValue = (value) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const sortedRdv = [...filteredRdv].sort((a, b) => {
    switch (sortType) {
      case 'date_desc':
        return getDateValue(b.date_rdv) - getDateValue(a.date_rdv);
      case 'date_asc':
        return getDateValue(a.date_rdv) - getDateValue(b.date_rdv);
      case 'creation_desc':
        return getDateValue(b.date_creation || b.created_at) - getDateValue(a.date_creation || a.created_at);
      case 'creation_asc':
        return getDateValue(a.date_creation || a.created_at) - getDateValue(b.date_creation || b.created_at);
      case 'cabinet_az':
        return (a.cabinet || '').localeCompare(b.cabinet || '');
      case 'cabinet_za':
        return (b.cabinet || '').localeCompare(a.cabinet || '');
      case 'statut':
        return (a.statut || '').localeCompare(b.statut || '');
      default:
        return 0;
    }
  });

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Rechercher (cabinet, ville, type)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          aria-label="Rechercher un rendez-vous"
          className="flex-1 border border-gray-300 rounded px-4 py-2"
        />
        <select
          value={sortType}
          onChange={e => {
            setSortType(e.target.value);
            onSortChange && onSortChange(e.target.value);
          }}
          aria-label="Trier les rendez-vous"
          className="border border-gray-300 rounded px-4 py-2"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3" role="list" aria-busy={loading}>
        {loading && (
          <div className="animate-pulse space-y-3" aria-hidden="true">
            {[1,2,3].map(i => (
              <div key={i} className="bg-gray-100 h-20 rounded" />
            ))}
          </div>
        )}
        {!loading && sortedRdv.map((rdv, idx) => (
          <div
            key={rdv.id_rdv || idx}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            role="listitem"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">{rdv.cabinet}</h3>
                <p className="text-sm text-gray-600">
                  📅 {formatDate(rdv.date_rdv)} {rdv.heure_rdv && `à ${rdv.heure_rdv}`}
                </p>
              </div>
              <div>
                <StatusBadge value={rdv.statut} />
              </div>
            </div>

            <div className="text-sm text-gray-700 mb-2">
              <p>📍 {rdv.ville || 'Ville non renseignée'}</p>
              <p>🏷️ {rdv.type_rdv}</p>
              {rdv.email && <p>✉️ {rdv.email}</p>}
            </div>

            {Array.isArray(rdv.praticiens) && rdv.praticiens.length > 0 && (
              <div className="text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                👥 Praticiens : {rdv.praticiens.map((p, i) => `${p.prenom} ${p.nom}`).join(', ')}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              {rdv.statut === 'Planifié' && (
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition"
                  aria-label={`Marquer ${rdv.cabinet} comme effectué`}
                  onClick={() => onEffectue && onEffectue(rdv)}
                >
                  ✅ Effectué
                </button>
              )}
              {rdv.statut === 'Effectué' && (
                <button
                  className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600 transition"
                  aria-label={`Marquer ${rdv.cabinet} comme facturé`}
                  onClick={() => onFacturer && onFacturer(rdv)}
                >
                  💰 Facturer
                </button>
              )}
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition"
                aria-label={`Modifier le rendez-vous ${rdv.cabinet}`}
                onClick={() => onEdit && onEdit(rdv)}
              >
                ✏️ Modifier
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition"
                aria-label={`Supprimer le rendez-vous ${rdv.cabinet}`}
                onClick={() => onDelete && onDelete(rdv)}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

        {!loading && sortedRdv.length === 0 && (
        <div className="text-center text-gray-500 py-8" aria-live="polite">
          Aucun rendez-vous trouvé
        </div>
      )}
    </div>
  );
};

export default RechercheSimpleRDV;
