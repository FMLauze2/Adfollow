import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InstallationsSuiviPage from './InstallationsSuiviPage';

const InstallationsPage = () => {
  const [showAdvancedMode, setShowAdvancedMode] = useState(false);
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [dateFilter, setDateFilter] = useState('Tous');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickForm, setQuickForm] = useState({
    cabinet: '',
    date_rdv: '',
    heure_rdv: '',
    type_rdv: 'Installation serveur',
    ville: '',
    code_postal: ''
  });

  useEffect(() => {
    fetchRendezvous();
  }, []);

  const fetchRendezvous = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:4000/api/rendez-vous");
      setRendezvous(response.data || []);
    } catch (error) {
      console.error("Erreur chargement RDV:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPraticiens = (praticiens) => {
    if (!praticiens || !Array.isArray(praticiens) || praticiens.length === 0) return 'Aucun';
    return praticiens.map(p => `${p.prenom} ${p.nom}`).join(', ');
  };

  const getStatutBadge = (statut) => {
    const styles = {
      'Planifié': 'bg-blue-100 text-blue-800',
      'Effectué': 'bg-green-100 text-green-800',
      'Facturé': 'bg-purple-100 text-purple-800',
      'Annulé': 'bg-red-100 text-red-800'
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const handleMarkEffectue = async (rdv) => {
    // Validation praticiens
    const typeNeedsPraticiens = ["Installation serveur", "Formation", "Démo", "Autre"];
    if (typeNeedsPraticiens.includes(rdv.type_rdv)) {
      if (!rdv.praticiens || rdv.praticiens.length === 0) {
        alert("❌ Vous devez renseigner au moins un praticien.\n\nUtilisez la gestion avancée pour ajouter les praticiens.");
        return;
      }
    }

    // Validation email pour Installation serveur
    if (rdv.type_rdv === "Installation serveur") {
      if (!rdv.email || rdv.email.trim() === "") {
        alert("❌ Vous devez renseigner l'email du cabinet.\n\nUtilisez la gestion avancée pour ajouter l'email.");
        return;
      }
    }

    if (!window.confirm(`Marquer "${rdv.cabinet}" comme effectué ?`)) return;

    try {
      await axios.post(`http://localhost:4000/api/rendez-vous/${rdv.id_rdv}/complete`);
      alert("✅ RDV marqué comme effectué !");
      fetchRendezvous();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleMarkFacture = async (rdv) => {
    if (!window.confirm(`Marquer "${rdv.cabinet}" comme facturé ?`)) return;

    try {
      await axios.put(`http://localhost:4000/api/rendez-vous/${rdv.id_rdv}`, {
        ...rdv,
        statut: 'Facturé'
      });
      alert("✅ RDV marqué comme facturé !");
      fetchRendezvous();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const getWeekFromNow = () => {
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return `${weekFromNow.getFullYear()}-${String(weekFromNow.getMonth() + 1).padStart(2, '0')}-${String(weekFromNow.getDate()).padStart(2, '0')}`;
  };

  const filteredRdv = rendezvous.filter(rdv => {
    const matchesSearch = 
      rdv.cabinet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rdv.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatPraticiens(rdv.praticiens).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Tous' || rdv.statut === statusFilter;
    const matchesType = typeFilter === 'Tous' || rdv.type_rdv === typeFilter;
    
    let matchesDate = true;
    if (dateFilter === 'Aujourd\'hui') {
      matchesDate = rdv.date_rdv?.split('T')[0] === getTodayDate();
    } else if (dateFilter === '7 prochains jours') {
      const rdvDate = rdv.date_rdv?.split('T')[0];
      matchesDate = rdvDate >= getTodayDate() && rdvDate <= getWeekFromNow();
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Statistiques
  const todayRdv = rendezvous.filter(r => 
    r.date_rdv?.split('T')[0] === getTodayDate() && 
    r.statut !== 'Annulé' && 
    !r.archive
  ).length;

  const upcomingRdv = rendezvous.filter(r => {
    const rdvDate = r.date_rdv?.split('T')[0];
    return rdvDate >= getTodayDate() && 
           rdvDate <= getWeekFromNow() && 
           r.statut !== 'Annulé' && 
           !r.archive;
  }).length;

  const toInvoice = rendezvous.filter(r => r.statut === 'Effectué' && !r.archive).length;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    
    if (!quickForm.cabinet || !quickForm.date_rdv || !quickForm.heure_rdv || !quickForm.ville) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await axios.post("http://localhost:4000/api/rendez-vous", {
        ...quickForm,
        adresse: '',
        telephone: '',
        email: '',
        praticiens: [],
        notes: '',
        statut: 'Planifié'
      });
      
      alert('✅ Rendez-vous créé !');
      setShowQuickAddModal(false);
      setQuickForm({
        cabinet: '',
        date_rdv: '',
        heure_rdv: '',
        type_rdv: 'Installation serveur',
        ville: '',
        code_postal: ''
      });
      fetchRendezvous();
    } catch (error) {
      console.error('Erreur création RDV:', error);
      alert('❌ Erreur lors de la création');
    }
  };

  if (showAdvancedMode) {
    return <InstallationsSuiviPage onRetour={() => setShowAdvancedMode(false)} />;
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📅 Rendez-vous</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQuickAddModal(true)}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
          >
            ➕ Nouveau RDV
          </button>
          <button
            onClick={() => setShowAdvancedMode(true)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
          >
            ⚙️ Gestion avancée
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="🔍 Rechercher cabinet, ville, praticien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white"
          >
            <option value="Tous">📅 Toutes les dates</option>
            <option value="Aujourd'hui">📍 Aujourd'hui</option>
            <option value="7 prochains jours">📆 7 prochains jours</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Planifié">Planifié</option>
            <option value="Effectué">Effectué</option>
            <option value="Facturé">Facturé</option>
            <option value="Annulé">Annulé</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white"
          >
            <option value="Tous">Tous les types</option>
            <option value="Installation serveur">Installation serveur</option>
            <option value="Installation poste secondaire">Poste secondaire</option>
            <option value="Formation">Formation</option>
            <option value="Mise à jour">Mise à jour</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{todayRdv}</div>
          <div className="text-sm text-gray-600">RDV aujourd'hui</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{upcomingRdv}</div>
          <div className="text-sm text-gray-600">RDV 7 prochains jours</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">{toInvoice}</div>
          <div className="text-sm text-gray-600">À facturer</div>
        </div>
      </div>

      {/* Tableau des RDV */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : filteredRdv.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || statusFilter !== 'Tous' || typeFilter !== 'Tous' || dateFilter !== 'Tous'
              ? 'Aucun rendez-vous trouvé'
              : 'Aucun rendez-vous'}
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
                    Date & Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Praticiens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRdv.map((rdv) => (
                  <tr key={rdv.id_rdv} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{rdv.cabinet}</div>
                      {rdv.archive && <span className="text-xs text-gray-500">📦 Archivé</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {rdv.date_rdv ? new Date(rdv.date_rdv).toLocaleDateString('fr-FR') : '-'}
                      </div>
                      <div className="text-xs text-gray-500">{rdv.heure_rdv || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{rdv.type_rdv}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{rdv.ville}</div>
                      <div className="text-xs text-gray-500">{rdv.code_postal}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={formatPraticiens(rdv.praticiens)}>
                        {formatPraticiens(rdv.praticiens)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatutBadge(rdv.statut)}`}>
                        {rdv.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {rdv.statut === 'Planifié' && (
                          <button
                            onClick={() => handleMarkEffectue(rdv)}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-xs"
                            title="Marquer effectué"
                          >
                            ✅ Effectué
                          </button>
                        )}
                        {rdv.statut === 'Effectué' && (
                          <button
                            onClick={() => handleMarkFacture(rdv)}
                            className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-xs"
                            title="Marquer facturé"
                          >
                            💰 Facturer
                          </button>
                        )}
                        <button
                          onClick={() => setShowAdvancedMode(true)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs"
                          title="Voir détails"
                        >
                          👁️ Détails
                        </button>
                      </div>
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
        {filteredRdv.length} rendez-vous affiché{filteredRdv.length > 1 ? 's' : ''}
        {(searchTerm || statusFilter !== 'Tous' || typeFilter !== 'Tous' || dateFilter !== 'Tous') && ` sur ${rendezvous.length} total`}
      </div>

      {/* Modal ajout rapide */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">➕ Nouveau rendez-vous</h2>
              
              <form onSubmit={handleQuickAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cabinet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quickForm.cabinet}
                    onChange={(e) => setQuickForm({...quickForm, cabinet: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nom du cabinet"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={quickForm.date_rdv}
                      onChange={(e) => setQuickForm({...quickForm, date_rdv: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={quickForm.heure_rdv}
                      onChange={(e) => setQuickForm({...quickForm, heure_rdv: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de RDV <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={quickForm.type_rdv}
                    onChange={(e) => setQuickForm({...quickForm, type_rdv: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Installation serveur">Installation serveur</option>
                    <option value="Installation poste secondaire">Installation poste secondaire</option>
                    <option value="Changement de poste serveur">Changement de poste serveur</option>
                    <option value="Formation">Formation</option>
                    <option value="Export BDD">Export BDD</option>
                    <option value="Démo">Démo</option>
                    <option value="Mise à jour">Mise à jour</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={quickForm.ville}
                      onChange={(e) => setQuickForm({...quickForm, ville: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ville"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={quickForm.code_postal}
                      onChange={(e) => setQuickForm({...quickForm, code_postal: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="75001"
                      maxLength="5"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Astuce :</strong> Ce formulaire crée un RDV avec les infos essentielles. 
                    Utilisez la <strong>gestion avancée</strong> pour ajouter praticiens, adresse, email, notes, etc.
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded transition"
                  >
                    ✅ Créer le RDV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickAddModal(false);
                      setQuickForm({
                        cabinet: '',
                        date_rdv: '',
                        heure_rdv: '',
                        type_rdv: 'Installation serveur',
                        ville: '',
                        code_postal: ''
                      });
                    }}
                    className="flex-1 bg-white text-red-600 font-medium py-2 rounded hover:bg-red-50 hover:text-red-700 border border-red-300 transition"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallationsPage;
