// pages/ContratsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ContratsSuiviPage from './ContratsSuiviPage';

const ContratsPage = () => {
  const [showAdvancedMode, setShowAdvancedMode] = useState(false);
  const [contrats, setContrats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchContrats();
  }, []);

  const fetchContrats = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:4000/api/contrats");
      setContrats(res.data || []);
    } catch (err) {
      console.error("Erreur chargement contrats:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPraticiens = (praticiens) => {
    if (!praticiens || !Array.isArray(praticiens)) return 'Aucun';
    
    return praticiens.map(p => {
      if (typeof p === 'object' && p.prenom && p.nom) {
        return `${p.prenom} ${p.nom}`;
      } else if (typeof p === 'string') {
        return p;
      }
      return '';
    }).filter(Boolean).join(', ') || 'Aucun';
  };

  const getStatutBadge = (statut) => {
    const styles = {
      'En cours': 'bg-blue-100 text-blue-800',
      'Signé': 'bg-green-100 text-green-800',
      'Résilié': 'bg-red-100 text-red-800',
      'En attente': 'bg-yellow-100 text-yellow-800'
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const filteredContrats = contrats.filter(c => 
    c.cabinet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatPraticiens(c.praticiens).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showAdvancedMode) {
    return <ContratsSuiviPage onRetour={() => setShowAdvancedMode(false)} />;
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📋 Liste des contrats</h1>
        <button
          onClick={() => setShowAdvancedMode(true)}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
        >
          ⚙️ Gestion avancée
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <input
          type="text"
          placeholder="🔍 Rechercher par cabinet, ville ou praticien..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{contrats.length}</div>
          <div className="text-sm text-gray-600">Total contrats</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">
            {contrats.filter(c => c.statut === 'Envoyé' && !c.date_reception).length}
          </div>
          <div className="text-sm text-gray-600">En attente de retour</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {contrats.filter(c => c.date_reception !== null).length}
          </div>
          <div className="text-sm text-gray-600">Reçus</div>
        </div>
      </div>

      {/* Tableau des contrats */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : filteredContrats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'Aucun contrat trouvé' : 'Aucun contrat'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cabinet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Praticiens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date envoi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date réception
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContrats.map((contrat) => (
                  <tr key={contrat.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{contrat.cabinet}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{contrat.ville}</div>
                      <div className="text-xs text-gray-500">{contrat.code_postal}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={formatPraticiens(contrat.praticiens)}>
                        {formatPraticiens(contrat.praticiens)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{contrat.prix} €</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatutBadge(contrat.statut)}`}>
                        {contrat.statut || 'Non défini'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contrat.date_envoi ? new Date(contrat.date_envoi).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contrat.date_reception ? new Date(contrat.date_reception).toLocaleDateString('fr-FR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        {filteredContrats.length} contrat{filteredContrats.length > 1 ? 's' : ''} affiché{filteredContrats.length > 1 ? 's' : ''}
        {searchTerm && ` sur ${contrats.length} total`}
      </div>
    </div>
  );
};

export default ContratsPage;
