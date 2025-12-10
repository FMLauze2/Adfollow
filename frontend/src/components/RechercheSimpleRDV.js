import React, { useState } from 'react';

// Ce composant gère la recherche rapide et l'affichage simple des RDV
const RechercheSimpleRDV = ({ rdvList, onCreateRdv, sortOptions, onSortChange, onEffectue, onFacturer, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState(sortOptions[0]?.value || 'date');

  // Fonction pour formater la date au format français
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Fonction pour obtenir le badge coloré du statut
  const getStatutBadge = (statut) => {
    const styles = {
      'Planifié': 'bg-blue-100 text-blue-800',
      'Effectué': 'bg-green-100 text-green-800',
      'Facturé': 'bg-purple-100 text-purple-800',
      'Annulé': 'bg-red-100 text-red-800'
    };
    const className = styles[statut] || 'bg-gray-100 text-gray-800';
    return <span className={`${className} px-2 py-1 rounded text-xs font-medium`}>{statut}</span>;
  };

  // Filtrage des RDV selon le terme de recherche
  const filteredRdv = rdvList.filter(rdv => {
    if (!searchTerm) return true;
    return (
      (rdv.cabinet && rdv.cabinet.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rdv.email && rdv.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rdv.ville && rdv.ville.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rdv.type_rdv && rdv.type_rdv.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Tri des RDV selon le type choisi
  const sortedRdv = [...filteredRdv].sort((a, b) => {
    if (sortType === 'date') {
      return new Date(b.date_rdv) - new Date(a.date_rdv);
    } else if (sortType === 'nom') {
      return (a.cabinet || '').localeCompare(b.cabinet || '');
    }
    return 0;
  });

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Rechercher (cabinet, ville, type)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-4 py-2"
        />
        <select
          value={sortType}
          onChange={e => {
            setSortType(e.target.value);
            onSortChange && onSortChange(e.target.value);
          }}
          className="border border-gray-300 rounded px-4 py-2"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {sortedRdv.map((rdv, idx) => (
          <div key={rdv.id_rdv || idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">{rdv.cabinet}</h3>
                <p className="text-sm text-gray-600">
                  📅 {formatDate(rdv.date_rdv)} {rdv.heure_rdv && `à ${rdv.heure_rdv}`}
                </p>
              </div>
              <div>
                {getStatutBadge(rdv.statut)}
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
                  onClick={() => onEffectue && onEffectue(rdv)}
                >
                  ✅ Effectué
                </button>
              )}
              {rdv.statut === 'Effectué' && (
                <button
                  className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600 transition"
                  onClick={() => onFacturer && onFacturer(rdv)}
                >
                  💰 Facturer
                </button>
              )}
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition"
                onClick={() => onEdit && onEdit(rdv)}
              >
                ✏️ Modifier
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition"
                onClick={() => onDelete && onDelete(rdv)}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {sortedRdv.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          Aucun rendez-vous trouvé
        </div>
      )}
    </div>
  );
};

export default RechercheSimpleRDV;
