import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DailyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [filterSprint, setFilterSprint] = useState('');
  
  const [form, setForm] = useState({
    date_report: new Date().toISOString().split('T')[0],
    sprint_numero: '',
    sprint_date_debut: '',
    sprint_date_fin: '',
    user_stories: '',
    blocages: '',
    points_positifs: '',
    actions_demain: '',
    notes: ''
  });

  useEffect(() => {
    fetchReports();
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
      if (editingReport) {
        await axios.put(`http://localhost:4000/api/dailyreports/${editingReport.id_report}`, form);
        alert('Compte rendu mis à jour !');
      } else {
        await axios.post('http://localhost:4000/api/dailyreports', form);
        alert('Compte rendu créé !');
      }
      
      resetForm();
      fetchReports();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setForm({
      date_report: report.date_report.split('T')[0],
      sprint_numero: report.sprint_numero || '',
      sprint_date_debut: report.sprint_date_debut ? report.sprint_date_debut.split('T')[0] : '',
      sprint_date_fin: report.sprint_date_fin ? report.sprint_date_fin.split('T')[0] : '',
      user_stories: report.user_stories || '',
      blocages: report.blocages || '',
      points_positifs: report.points_positifs || '',
      actions_demain: report.actions_demain || '',
      notes: report.notes || ''
    });
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
      date_report: new Date().toISOString().split('T')[0],
      sprint_numero: '',
      sprint_date_debut: '',
      sprint_date_fin: '',
      user_stories: '',
      blocages: '',
      points_positifs: '',
      actions_demain: '',
      notes: ''
    });
    setEditingReport(null);
    setShowForm(false);
  };

  const filteredReports = filterSprint
    ? reports.filter(r => r.sprint_numero?.includes(filterSprint))
    : reports;

  const sprints = [...new Set(reports.map(r => r.sprint_numero).filter(Boolean))];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          📊 Comptes Rendus Daily
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setForm({
                date_report: new Date().toISOString().split('T')[0],
                sprint_numero: 'Sprint 23',
                sprint_date_debut: '2025-12-02',
                sprint_date_fin: '2025-12-15',
                user_stories: 'US#156 - Ajout système de notifications persistantes\nUS#157 - Création module comptes rendus daily\nUS#158 - Amélioration système de checklists',
                blocages: 'Attente validation design pour le module stats\nProblème de performance sur les requêtes de notifications',
                points_positifs: 'Bonne progression sur le sprint\nÉquipe réactive et motivée\nNouvelles fonctionnalités bien reçues par les utilisateurs',
                actions_demain: 'Finaliser la génération automatique de contrats\nCommencer US#159 - Dashboard statistiques\nRéunion de planning à 10h',
                notes: 'Demo client prévue vendredi\nPoint technique à faire avec l\'équipe dev sur l\'architecture des notifications'
              });
              setShowForm(true);
            }}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            title="Pré-remplir avec des données de test"
          >
            🧪 Test
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {showForm ? '✕ Annuler' : '+ Nouveau Daily'}
          </button>
        </div>
      </div>

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
              <option key={sprint} value={sprint}>{sprint}</option>
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
                  onChange={(e) => setForm({ ...form, date_report: e.target.value })}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sprint (ex: Sprint 23)
                </label>
                <input
                  type="text"
                  value={form.sprint_numero}
                  onChange={(e) => setForm({ ...form, sprint_numero: e.target.value })}
                  placeholder="Sprint 23"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date début sprint
                </label>
                <input
                  type="date"
                  value={form.sprint_date_debut}
                  onChange={(e) => setForm({ ...form, sprint_date_debut: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date fin sprint
                </label>
                <input
                  type="date"
                  value={form.sprint_date_fin}
                  onChange={(e) => setForm({ ...form, sprint_date_fin: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                📋 User Stories traitées
              </label>
              <textarea
                value={form.user_stories}
                onChange={(e) => setForm({ ...form, user_stories: e.target.value })}
                rows="4"
                placeholder="US#123 - Ajout fonctionnalité X&#10;US#124 - Correction bug Y"
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                🚧 Blocages rencontrés
              </label>
              <textarea
                value={form.blocages}
                onChange={(e) => setForm({ ...form, blocages: e.target.value })}
                rows="3"
                placeholder="Problème API, attente validation..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ✅ Points positifs
              </label>
              <textarea
                value={form.points_positifs}
                onChange={(e) => setForm({ ...form, points_positifs: e.target.value })}
                rows="3"
                placeholder="Bonne progression, équipe motivée..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                📅 Actions prévues pour demain
              </label>
              <textarea
                value={form.actions_demain}
                onChange={(e) => setForm({ ...form, actions_demain: e.target.value })}
                rows="3"
                placeholder="Continuer US#125, réunion planning..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                📝 Notes diverses
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows="3"
                placeholder="Remarques, informations complémentaires..."
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
                    {new Date(report.date_report).toLocaleDateString('fr-FR', {
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                {report.user_stories && (
                  <div>
                    <strong className="text-gray-700 dark:text-gray-300">📋 User Stories:</strong>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{report.user_stories}</p>
                  </div>
                )}
                {report.blocages && (
                  <div>
                    <strong className="text-gray-700 dark:text-gray-300">🚧 Blocages:</strong>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{report.blocages}</p>
                  </div>
                )}
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
                  Daily du {new Date(viewingReport.date_report).toLocaleDateString('fr-FR', {
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
              {viewingReport.user_stories && (
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">📋 User Stories traitées</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewingReport.user_stories}</p>
                </div>
              )}

              {viewingReport.blocages && (
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">🚧 Blocages rencontrés</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewingReport.blocages}</p>
                </div>
              )}

              {viewingReport.points_positifs && (
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">✅ Points positifs</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewingReport.points_positifs}</p>
                </div>
              )}

              {viewingReport.actions_demain && (
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">📅 Actions prévues pour demain</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewingReport.actions_demain}</p>
                </div>
              )}

              {viewingReport.notes && (
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">📝 Notes diverses</h3>
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
    </div>
  );
};

export default DailyReportsPage;
