import React, { useState, useEffect } from 'react';
import api from '../api/Api';
import InstallationsSuiviPage from './InstallationsSuiviPage';
import RechercheSimpleRDV from '../components/RechercheSimpleRDV';
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from '../utils/toast';
import { getCachedRdv, setCachedRdv } from '../services/rdvCache';

const InstallationsPage = () => {
    const [sortOption, setSortOption] = useState("date_desc");
    const navigate = useNavigate();

    const sortRdv = (rdvList) => {
      const sorted = [...rdvList];
      switch (sortOption) {
        case "date_asc":
          sorted.sort((a, b) => new Date(a.date_rdv) - new Date(b.date_rdv));
          break;
        case "date_desc":
          sorted.sort((a, b) => new Date(b.date_rdv) - new Date(a.date_rdv));
          break;
        case "cabinet_az":
          sorted.sort((a, b) => (a.cabinet || "").localeCompare(b.cabinet || ""));
          break;
        case "cabinet_za":
          sorted.sort((a, b) => (b.cabinet || "").localeCompare(a.cabinet || ""));
          break;
        case "statut":
          sorted.sort((a, b) => (a.statut || "").localeCompare(b.statut || ""));
          break;
        case "type":
          sorted.sort((a, b) => (a.type_rdv || "").localeCompare(b.type_rdv || ""));
          break;
        default:
          break;
      }
      return sorted;
    };

    const applyOptimisticUpdate = (id, updates) => {
      setRendezvous((prev) => prev.map((rdv) => rdv.id_rdv === id ? { ...rdv, ...updates } : rdv));
    };

    const removeOptimistic = (id) => {
      setRendezvous((prev) => prev.filter((rdv) => rdv.id_rdv !== id));
    };
  const [showAdvancedMode, setShowAdvancedMode] = useState(false);
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading] = useState(true);
    // Les filtres sont maintenant gérés dans le composant RechercheSimpleRDV
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickForm, setQuickForm] = useState({
    cabinet: '',
    date_rdv: '',
    heure_rdv: '',
    type_rdv: 'Installation serveur',
    ville: '',
    code_postal: '',
    adresse: '',
    email: '',
    telephone: '',
    praticiens: '', // Saisie sous forme de texte, conversion en array à l'envoi
    notes: ''
  });

  useEffect(() => {
    fetchRendezvous();
  }, []);

  const fetchRendezvous = async (force = false) => {
    setLoading(true);
    try {
      const cacheKey = 'rdv_simple_all';
      if (!force) {
        const cached = getCachedRdv(cacheKey);
        if (cached) {
          setRendezvous(cached);
          setLoading(false);
          return;
        }
      }

      const response = await api.get("/rendez-vous");
      const data = response.data || [];
      setCachedRdv(cacheKey, data);
      setRendezvous(data);
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
    const typeNeedsPraticiens = ["Installation serveur", "Formation", "Démo"];
    if (typeNeedsPraticiens.includes(rdv.type_rdv)) {
      if (!rdv.praticiens || rdv.praticiens.length === 0) {
        showError("Ajoutez au moins un praticien (gestion avancée si besoin)");
        return;
      }
    }

    // Validation email pour Installation serveur
    if (rdv.type_rdv === "Installation serveur") {
      if (!rdv.email || rdv.email.trim() === "") {
        showError("Renseignez l'email du cabinet (gestion avancée)");
        return;
      }
    }

    if (!window.confirm(`Marquer "${rdv.cabinet}" comme effectué ?`)) return;

    const previous = rendezvous;
    applyOptimisticUpdate(rdv.id_rdv, { statut: 'Effectué' });
    try {
      await api.post(`/rendez-vous/${rdv.id_rdv}/complete`);
      showSuccess("RDV marqué comme effectué");
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur:", error);
      showError("Erreur lors de la mise à jour");
      setRendezvous(previous);
    }
  };

  const handleMarkFacture = async (rdv) => {
    if (!window.confirm(`Marquer "${rdv.cabinet}" comme facturé ?`)) return;

    const previous = rendezvous;
    applyOptimisticUpdate(rdv.id_rdv, { statut: 'Facturé' });
    try {
      await api.put(`/rendez-vous/${rdv.id_rdv}`, {
        ...rdv,
        statut: 'Facturé'
      });
      showSuccess("RDV marqué comme facturé");
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur:", error);
      showError("Erreur lors de la mise à jour");
      setRendezvous(previous);
    }
  };

  const handleDelete = async (id) => {
    const previous = rendezvous;
    removeOptimistic(id);
    try {
      await api.delete(`/rendez-vous/${id}`);
      showSuccess("Rendez-vous supprimé");
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur:", error);
      showError("Erreur lors de la suppression");
      setRendezvous(previous);
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

  // Filtrage géré par le composant RechercheSimpleRDV

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
      showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await api.post("/rendez-vous", {
        ...quickForm,
        praticiens: quickForm.praticiens
          ? quickForm.praticiens.split(',').map(p => {
              const [prenom, nom] = p.trim().split(' ');
              return { prenom: prenom || '', nom: nom || '' };
            })
          : [],
        statut: 'Planifié'
      });
      
      showSuccess('Rendez-vous créé');
      setShowQuickAddModal(false);
      setQuickForm({
        cabinet: '',
        date_rdv: '',
        heure_rdv: '',
        type_rdv: 'Installation serveur',
        ville: '',
        code_postal: ''
      });
      fetchRendezvous(true);
    } catch (error) {
      console.error('Erreur création RDV:', error);
      showError('Erreur lors de la création');
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

        {/* Recherche rapide RDV */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <RechercheSimpleRDV
            rdvList={rendezvous}
            loading={loading}
            onCreateRdv={() => setShowQuickAddModal(true)}
            sortOptions={[{ value: 'date', label: 'Date' }, { value: 'nom', label: 'Nom' }]}
            onSortChange={setSortOption}
            onEffectue={handleMarkEffectue}
            onFacturer={handleMarkFacture}
            onEdit={(rdv) => navigate('/installations/suivi', { state: { editRdv: rdv } })}
            onDelete={(rdv) => window.confirm(`Supprimer le RDV de ${rdv.cabinet} ?`) && handleDelete(rdv.id_rdv)}
          />
        </div>

        {/* Modal ajout rapide */}
        {showQuickAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">➕ Nouveau rendez-vous</h2>
                {/* ...existing code... */}
                <form onSubmit={handleQuickAdd} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom du cabinet *</label>
                      <input type="text" value={quickForm.cabinet} onChange={e => setQuickForm({...quickForm, cabinet: e.target.value})} required className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Nom du cabinet..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type de RDV *</label>
                      <select value={quickForm.type_rdv} onChange={e => setQuickForm({...quickForm, type_rdv: e.target.value})} required className="w-full border border-gray-300 rounded px-3 py-2">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <input type="date" value={quickForm.date_rdv} onChange={e => setQuickForm({...quickForm, date_rdv: e.target.value})} required className="w-full border border-gray-300 rounded px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
                      <input type="time" value={quickForm.heure_rdv} onChange={e => setQuickForm({...quickForm, heure_rdv: e.target.value})} required className="w-full border border-gray-300 rounded px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                      <input type="text" value={quickForm.adresse} onChange={e => setQuickForm({...quickForm, adresse: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="12 rue de la Santé" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                      <input type="text" value={quickForm.code_postal} onChange={e => setQuickForm({...quickForm, code_postal: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="75001" maxLength="5" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                      <input type="text" value={quickForm.ville} onChange={e => setQuickForm({...quickForm, ville: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Paris" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={quickForm.email} onChange={e => setQuickForm({...quickForm, email: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="contact@cabinet.fr" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input type="tel" value={quickForm.telephone} onChange={e => setQuickForm({...quickForm, telephone: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="06 12 34 56 78" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Praticiens (séparés par virgule)</label>
                      <input type="text" value={quickForm.praticiens} onChange={e => setQuickForm({...quickForm, praticiens: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Jean Dupont, Sophie Martin" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                      <textarea value={quickForm.notes} onChange={e => setQuickForm({...quickForm, notes: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Ajouter une note ou description..." rows={2} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded transition">✅ Créer le RDV</button>
                    <button type="button" onClick={() => { setShowQuickAddModal(false); setQuickForm({ cabinet: '', date_rdv: '', heure_rdv: '', type_rdv: 'Installation serveur', ville: '', code_postal: '', adresse: '', email: '', telephone: '', praticiens: '', notes: '' }); }} className="flex-1 bg-white text-red-600 font-medium py-2 rounded hover:bg-red-50 hover:text-red-700 border border-red-300 transition">Annuler</button>
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
