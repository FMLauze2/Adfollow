import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EquipeManager from '../components/EquipeManager';
import AvancementEquipe from '../components/AvancementEquipe';

const DailyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [filterSprint, setFilterSprint] = useState('');
  const [showEquipeManager, setShowEquipeManager] = useState(false);
  const [avancements, setAvancements] = useState([]);
  
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [form, setForm] = useState({
    date_report: getTodayDate(),
    id_sprint: '',
    equipe_avancement: '',
    objectifs_jour: '',
    blocages: '',
    notes: ''
  });

  const [sprintForm, setSprintForm] = useState({
    numero: '',
    date_debut: '',
    date_fin: '',
    objectif: '',
    statut: 'en_cours'
  });

  useEffect(() => {
    fetchReports();
    fetchSprints();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:4000/api/dailyreports');
      setReports(response.data);
    } catch (error) {
      console.error('Erreur chargement reports:', error);
      alert('Erreur lors du chargement des comptes rendus');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...form,
        avancements: avancements
      };
      
      if (editingReport) {
        await axios.put(`http://localhost:4000/api/dailyreports/${editingReport.id_report}`, data);
        alert('Compte rendu mis à jour !');
      } else {
        await axios.post('http://localhost:4000/api/dailyreports', data);
        alert('Compte rendu créé !');
      }
      
      resetForm();
      fetchReports();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = async (report) => {
    setEditingReport(report);
    const reportDate = report.date_report; // Plus besoin de split car le backend retourne déjà au bon format
    setForm({
      date_report: reportDate,
      id_sprint: report.id_sprint || '',
      objectifs_jour: report.objectifs_jour || '',
      blocages: report.blocages || '',
      notes: report.notes || ''
    });
    
    // Charger les données de la veille pour cette date
    const yesterdayData = await loadYesterdayData(reportDate);
    
    // Si des avancements existent déjà, fusionner avec les données de la veille
    if (report.avancements && report.avancements.length > 0) {
      // Créer une map des données de la veille
      const yesterdayMap = {};
      yesterdayData.forEach(item => {
        yesterdayMap[item.id_dev] = item.hier;
      });
      
      // Fusionner : garder les données existantes mais pré-remplir les "hier" vides
      const merged = report.avancements.map(av => ({
        ...av,
        hier: av.hier || yesterdayMap[av.id_dev] || '' // Pré-remplir seulement si vide
      }));
      setAvancements(merged);
    } else {
      // Pas d'avancements existants, utiliser les données de la veille
      setAvancements(yesterdayData);
    }
    
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce compte rendu ?')) return;
    
    try {
      await axios.delete(`http://localhost:4000/api/dailyreports/${id}`);
      alert('Compte rendu supprimé !');
      fetchReports();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setForm({
      date_report: getTodayDate(),
      id_sprint: '',
      objectifs_jour: '',
      blocages: '',
      notes: ''
    });
    setAvancements([]);
    setEditingReport(null);
    setShowForm(false);
  };

  const loadYesterdayData = async (reportDate) => {
    try {
      // Récupérer tous les devs de l'équipe
      const devsResponse = await axios.get('http://localhost:4000/api/equipe');
      const allDevs = devsResponse.data;
      
      // Récupérer les données de la veille par rapport à la date du rapport
      const yesterdayResponse = await axios.get(`http://localhost:4000/api/dailyreports/yesterday-today/${reportDate}`);
      const yesterdayData = yesterdayResponse.data || [];
      
      // Créer une map pour accès rapide aux données d'hier
      const yesterdayMap = {};
      yesterdayData.forEach(item => {
        yesterdayMap[item.id_dev] = item.hier; // Le "aujourd'hui" d'hier
      });
      
      // Créer les avancements pour tous les devs avec pré-remplissage du "hier"
      const prefilled = allDevs.map(dev => ({
        id_dev: dev.id_dev,
        nom_complet: dev.nom_complet,
        initiales: dev.initiales,
        role: dev.role,
        hier: yesterdayMap[dev.id_dev] || '', // Pré-remplir avec le "aujourd'hui" d'hier s'il existe
        aujourdhui: '',
        blocages: ''
      }));
      
      return prefilled;
    } catch (error) {
      console.error('Erreur chargement données de la veille:', error);
      return [];
    }
  };

  const openNewReportForm = async () => {
    resetForm();
    const todayDate = getTodayDate();
    const prefilled = await loadYesterdayData(todayDate);
    setAvancements(prefilled);
    setShowForm(true);
  };

  const fetchSprints = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/sprints');
      setSprints(response.data);
    } catch (error) {
      console.error('Erreur chargement sprints:', error);
    }
  };

  const handleSprintSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('http://localhost:4000/api/sprints', sprintForm);
      alert('Sprint créé !');
      setSprintForm({
        numero: '',
        date_debut: '',
        date_fin: '',
        objectif: '',
        statut: 'en_cours'
      });
      setShowSprintForm(false);
      fetchSprints();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.error || 'Erreur lors de la création du sprint');
    }
  };

  const filteredReports = filterSprint
    ? reports.filter(r => r.id_sprint === parseInt(filterSprint))
    : reports;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          📊 Comptes Rendus Daily
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEquipeManager(true)}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            👥 Gérer l'équipe
          </button>
          <button
            onClick={() => setShowSprintForm(!showSprintForm)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            {showSprintForm ? '✕ Annuler' : '+ Nouveau Sprint'}
          </button>
          <button
            onClick={() => {
              // Trouver le premier sprint actif pour le test
              const activeSprint = sprints.find(s => s.statut === 'en_cours');
              setForm({
                date_report: getTodayDate(),
                id_sprint: activeSprint?.id_sprint || '',
                equipe_avancement: `JD - Jean Dupont
✅ Hier : Travail sur US#156 - système notifications (80% complété)
🎯 Aujourd'hui : Finaliser US#156 + Tests unitaires
🚧 Blocages : RAS

ML - Marie Leblanc
✅ Hier : Debug modal traitement RDV, fix mode sombre
🎯 Aujourd'hui : Commencer US#157 - checklists interventions
🚧 Blocages : Attente specs détaillées pour checklist ambulanciers

PT - Paul Tremblay
✅ Hier : Génération PDF contrats - template finalisé
🎯 Aujourd'hui : Intégration génération auto dans workflow
🚧 Blocages : Problème performance sur requêtes complexes`,
                objectifs_jour: `🎯 US#156 - Notifications persistantes (Jean) - Finalisation
🎯 US#157 - Checklists interventions (Marie) - Démarrage
🎯 US#158 - Génération contrats auto (Paul) - Intégration
📊 Objectif : 3 US complétées cette semaine`,
                blocages: `⚠️ Attente validation PO sur format checklist ambulanciers
⚠️ Performance requêtes notifications à optimiser (index à ajouter)
🔴 Démo client vendredi - pression sur les délais`,
                notes: `✅ Démo prévue vendredi 14h avec le client
✅ Sprint Review vendredi 16h
📋 Préparer slides présentation pour démo
💡 Envisager ajout cache Redis pour améliorer perfs`
              });
              setShowForm(true);
            }}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            title="Pré-remplir avec des données de test"
          >
            🧪 Test
          </button>
          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                openNewReportForm();
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {showForm ? '✕ Annuler' : '+ Nouveau Daily'}
          </button>
        </div>
      </div>

      {/* Formulaire Sprint */}
      {showSprintForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Nouveau Sprint
          </h2>
          
          <form onSubmit={handleSprintSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Numéro du sprint *
                </label>
                <input
                  type="text"
                  value={sprintForm.numero}
                  onChange={(e) => setSprintForm({ ...sprintForm, numero: e.target.value })}
                  placeholder="Sprint 23"
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Statut
                </label>
                <select
                  value={sprintForm.statut}
                  onChange={(e) => setSprintForm({ ...sprintForm, statut: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                >
                  <option value="en_cours">En cours</option>
                  <option value="termine">Terminé</option>
                  <option value="archive">Archivé</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de début *
                </label>
                <input
                  type="date"
                  value={sprintForm.date_debut}
                  onChange={(e) => setSprintForm({ ...sprintForm, date_debut: e.target.value })}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de fin *
                </label>
                <input
                  type="date"
                  value={sprintForm.date_fin}
                  onChange={(e) => setSprintForm({ ...sprintForm, date_fin: e.target.value })}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Objectif du sprint
              </label>
              <textarea
                value={sprintForm.objectif}
                onChange={(e) => setSprintForm({ ...sprintForm, objectif: e.target.value })}
                rows="3"
                placeholder="Objectif principal de ce sprint..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
              >
                Créer le sprint
              </button>
              <button
                type="button"
                onClick={() => setShowSprintForm(false)}
                className="bg-white text-red-600 border border-red-300 px-6 py-2 rounded hover:bg-red-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filtrer par sprint
          </label>
          <select
            value={filterSprint}
            onChange={(e) => setFilterSprint(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Tous les sprints</option>
            {sprints.map(sprint => (
              <option key={sprint.id_sprint} value={sprint.id_sprint}>
                {sprint.numero} ({new Date(sprint.date_debut).toLocaleDateString()} - {new Date(sprint.date_fin).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            {editingReport ? 'Modifier le compte rendu' : 'Nouveau compte rendu'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date du daily *
                </label>
                <input
                  type="date"
                  value={form.date_report}
                  onChange={async (e) => {
                    const newDate = e.target.value;
                    setForm({ ...form, date_report: newDate });
                    
                    // Recharger automatiquement les données de la veille pour cette nouvelle date
                    if (newDate) {
                      const yesterdayData = await loadYesterdayData(newDate);
                      
                      if (editingReport) {
                        // En mode édition : fusionner avec les données existantes
                        const yesterdayMap = {};
                        yesterdayData.forEach(item => {
                          yesterdayMap[item.id_dev] = item.hier;
                        });
                        
                        const merged = avancements.map(av => ({
                          ...av,
                          hier: yesterdayMap[av.id_dev] || av.hier || ''
                        }));
                        setAvancements(merged);
                      } else {
                        // Nouveau rapport : remplacer complètement
                        setAvancements(yesterdayData);
                      }
                    }
                  }}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sprint
                </label>
                <select
                  value={form.id_sprint}
                  onChange={(e) => setForm({ ...form, id_sprint: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Aucun sprint</option>
                  {sprints.filter(s => s.statut === 'en_cours').map(sprint => (
                    <option key={sprint.id_sprint} value={sprint.id_sprint}>
                      {sprint.numero} ({new Date(sprint.date_debut).toLocaleDateString()} - {new Date(sprint.date_fin).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <AvancementEquipe 
                reportId={editingReport?.id_report}
                onSave={(data) => setAvancements(data)}
                initialData={avancements}
                key={`${form.date_report}-${editingReport?.id_report || 'new'}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                🎯 Objectifs & User Stories du jour
              </label>
              <textarea
                value={form.objectifs_jour}
                onChange={(e) => setForm({ ...form, objectifs_jour: e.target.value })}
                rows="5"
                placeholder="🎯 US#156 - Notifications persistantes (Jean) - Finalisation&#10;🎯 US#157 - Checklists interventions (Marie) - Démarrage&#10;📊 Objectif : 3 US complétées cette semaine"
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                🚧 Blocages & Risques
              </label>
              <textarea
                value={form.blocages}
                onChange={(e) => setForm({ ...form, blocages: e.target.value })}
                rows="4"
                placeholder="⚠️ Attente validation PO...&#10;⚠️ Problème de performance...&#10;🔴 Démo client vendredi - pression délais"
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                📝 Notes & Décisions
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows="4"
                placeholder="✅ Démo prévue vendredi&#10;📋 Préparer slides&#10;💡 Idées d'amélioration..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 font-semibold"
              >
                {editingReport ? '💾 Mettre à jour' : '✓ Créer le compte rendu'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-white text-red-600 px-6 py-3 rounded hover:bg-red-50 hover:text-red-700 border border-red-300 transition font-semibold"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des comptes rendus */}
      {loading ? (
        <p className="text-center text-gray-500 py-8">Chargement...</p>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => (
            <div
              key={report.id_report}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {new Date(report.date_report + 'T12:00:00').toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  {report.sprint_numero && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                      🏃 {report.sprint_numero}
                      {report.sprint_date_debut && report.sprint_date_fin && (
                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                          ({new Date(report.sprint_date_debut).toLocaleDateString('fr-FR')} - {new Date(report.sprint_date_fin).toLocaleDateString('fr-FR')})
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingReport(report)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    👁️ Voir
                  </button>
                  <button
                    onClick={() => handleEdit(report)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(report.id_report)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Aperçu */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {/* Avancements équipe */}
                {report.avancements && report.avancements.length > 0 && (
                  <div>
                    <strong className="text-gray-700 dark:text-gray-300 text-sm">👥 Avancement de l'équipe:</strong>
                    <div className="mt-2 space-y-2">
                      {report.avancements.map((av) => (
                        <div key={av.id_avancement} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">
                              {av.initiales}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-gray-800 dark:text-white">{av.nom_complet}</div>
                              {av.role && <div className="text-xs text-gray-500 dark:text-gray-400">{av.role}</div>}
                            </div>
                          </div>
                          <div className="space-y-1 text-xs ml-9">
                            {av.hier && (
                              <div>
                                <span className="font-medium text-green-700 dark:text-green-400">✅ Hier : </span>
                                <span className="text-gray-700 dark:text-gray-300">{av.hier}</span>
                              </div>
                            )}
                            {av.aujourdhui && (
                              <div>
                                <span className="font-medium text-blue-700 dark:text-blue-400">🎯 Aujourd'hui : </span>
                                <span className="text-gray-700 dark:text-gray-300">{av.aujourdhui}</span>
                              </div>
                            )}
                            {av.blocages && (
                              <div>
                                <span className="font-medium text-red-700 dark:text-red-400">🚧 Blocages : </span>
                                <span className="text-gray-700 dark:text-gray-300">{av.blocages}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Objectifs et blocages */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {report.objectifs_jour && (
                    <div>
                      <strong className="text-gray-700 dark:text-gray-300">🎯 Objectifs:</strong>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 whitespace-pre-line">{report.objectifs_jour}</p>
                    </div>
                  )}
                  {report.blocages && (
                    <div>
                      <strong className="text-gray-700 dark:text-gray-300">🚧 Blocages:</strong>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 whitespace-pre-line">{report.blocages}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredReports.length === 0 && (
            <p className="text-center text-gray-500 py-8">Aucun compte rendu trouvé</p>
          )}
        </div>
      )}

      {/* Modal détail */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Daily du {new Date(viewingReport.date_report + 'T12:00:00').toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h2>
                {viewingReport.sprint_numero && (
                  <p className="text-blue-600 dark:text-blue-400 font-medium mt-2">
                    🏃 {viewingReport.sprint_numero}
                  </p>
                )}
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Avancements par développeur */}
              {viewingReport.avancements && viewingReport.avancements.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-3">👥 Avancement de l'équipe</h3>
                  <div className="space-y-3">
                    {viewingReport.avancements.map((av) => (
                      <div key={av.id_avancement} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                            {av.initiales}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 dark:text-white">{av.nom_complet}</div>
                            {av.role && <div className="text-xs text-gray-600 dark:text-gray-400">{av.role}</div>}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm ml-11">
                          {av.hier && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">✅ Hier : </span>
                              <span className="text-gray-600 dark:text-gray-400">{av.hier}</span>
                            </div>
                          )}
                          {av.aujourdhui && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">🎯 Aujourd'hui : </span>
                              <span className="text-gray-600 dark:text-gray-400">{av.aujourdhui}</span>
                            </div>
                          )}
                          {av.blocages && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">🚧 Blocages : </span>
                              <span className="text-gray-600 dark:text-gray-400">{av.blocages}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingReport.objectifs_jour && (
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">🎯 Objectifs & User Stories</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewingReport.objectifs_jour}</p>
                </div>
              )}

              {viewingReport.blocages && (
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">🚧 Blocages & Risques</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewingReport.blocages}</p>
                </div>
              )}

              {viewingReport.notes && (
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">📝 Notes & Décisions</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewingReport.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setViewingReport(null)}
              className="mt-6 w-full bg-white text-red-600 px-6 py-3 rounded hover:bg-red-50 hover:text-red-700 border border-red-300 font-semibold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal gestion équipe */}
      {showEquipeManager && (
        <EquipeManager onClose={() => setShowEquipeManager(false)} />
      )}
    </div>
  );
};

export default DailyReportsPage;
