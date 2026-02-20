import React, { useState, useEffect } from "react";
import axios from "axios";
import VilleCodePostalInput from "../components/VilleCodePostalInput";

function CalendrierPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rdvList, setRdvList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [draggedRdv, setDraggedRdv] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRdv, setNewRdv] = useState({
    cabinet: '',
    date_rdv: '',
    heure_rdv: '',
    type_rdv: 'Installation serveur',
    ville: '',
    code_postal: '',
    adresse: '',
    email: '',
    telephone: '',
    praticiens: '',
    notes: ''
  });
  
  // Todo list
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTodoPanel, setShowTodoPanel] = useState(false);
  const [showDayView, setShowDayView] = useState(false);
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [loadingTodos, setLoadingTodos] = useState(false);

  useEffect(() => {
    fetchRdv();
    autoReportPastTodos();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchTodosForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchRdv = async () => {
    setLoading(true);
    try {
      // Inclure les RDV archivés dans le calendrier
      const response = await axios.get("http://localhost:4000/api/rendez-vous?includeArchived=true");
      setRdvList(response.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des RDV:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodosForDate = async (date) => {
    setLoadingTodos(true);
    try {
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const response = await axios.get(`http://localhost:4000/api/todos?date=${dateString}`);
      setTodos(response.data || []);
    } catch (error) {
      console.error("Erreur chargement todos:", error);
    } finally {
      setLoadingTodos(false);
    }
  };

  const autoReportPastTodos = async () => {
    try {
      await axios.post("http://localhost:4000/api/todos/auto-report-past");
    } catch (error) {
      console.error("Erreur auto-report todos:", error);
    }
  };

  const addTodo = async () => {
    if (!newTodoText.trim() || !selectedDate) return;
    
    try {
      const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      await axios.post("http://localhost:4000/api/todos", {
        texte: newTodoText,
        date_todo: dateString
      });
      setNewTodoText('');
      fetchTodosForDate(selectedDate);
    } catch (error) {
      console.error("Erreur création todo:", error);
      alert("Erreur lors de la création de la tâche");
    }
  };

  const toggleTodo = async (id) => {
    try {
      await axios.post(`http://localhost:4000/api/todos/${id}/toggle`);
      fetchTodosForDate(selectedDate);
    } catch (error) {
      console.error("Erreur toggle todo:", error);
    }
  };

  const deleteTodo = async (id) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    
    try {
      await axios.delete(`http://localhost:4000/api/todos/${id}`);
      fetchTodosForDate(selectedDate);
    } catch (error) {
      console.error("Erreur suppression todo:", error);
    }
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setShowTodoPanel(true);
  };

  // Navigation entre les mois
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obtenir les jours du mois
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    
    // Jours vides avant le premier jour du mois
    const firstDayOfWeek = firstDay.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Lundi = 0
    
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    
    // Jours du mois
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Obtenir les RDV pour une date donnée
  const getRdvForDate = (date) => {
    if (!date) return [];
    
    // Formater la date localement sans conversion timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return rdvList.filter(rdv => {
      const rdvDate = rdv.date_rdv.split('T')[0];
      return rdvDate === dateString;
    });
  };

  // Afficher les détails d'un RDV
  const handleRdvClick = (rdv) => {
    setSelectedRdv(rdv);
    setShowModal(true);
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'Planifié': return 'bg-blue-100 text-blue-800';
      case 'Effectué': return 'bg-green-100 text-green-800';
      case 'Facturé': return 'bg-yellow-100 text-yellow-800 font-bold';
      case 'Annulé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Gestion du drag & drop
  const handleDragStart = (e, rdv) => {
    e.stopPropagation();
    setDraggedRdv(rdv);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetDate) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedRdv || !targetDate) return;

    try {
      // Formater la date cible
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const newDateString = `${year}-${month}-${day}`;

      // Appeler l'API pour déplacer le RDV
      const response = await axios.put(`http://localhost:4000/api/rendez-vous/${draggedRdv.id_rdv}/move`, {
        date_rdv: newDateString
      });

      console.log('✅ RDV déplacé:', response.data);

      // Recharger les RDV
      await fetchRdv();
      
      alert(`✅ RDV "${draggedRdv.cabinet}" déplacé au ${targetDate.toLocaleDateString('fr-FR')}`);
    } catch (error) {
      console.error('❌ Erreur déplacement RDV:', error);
      alert('❌ Erreur lors du déplacement du RDV: ' + (error.response?.data?.error || error.message));
    } finally {
      setDraggedRdv(null);
    }
  };

  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Chargement du calendrier...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📅 Calendrier des RDV</h1>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                // Pré-remplir la date si une case est déjà sélectionnée
                setNewRdv(prev => ({
                  ...prev,
                  date_rdv: selectedDate
                    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
                    : prev.date_rdv
                }));
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center gap-2"
            >
              ➕ Nouveau RDV
            </button>
            <button
              onClick={previousMonth}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              ← Mois précédent
            </button>
            
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
            >
              Aujourd'hui
            </button>
            
            <button
              onClick={nextMonth}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Mois suivant →
            </button>
          </div>
        </div>

        {/* Nom du mois */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700 capitalize">{monthName}</h2>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-32 bg-gray-50 rounded-lg"></div>;
            }

            const rdvForDay = getRdvForDate(date);
            const isToday = date.getTime() === today.getTime();
            const dayNumber = date.getDate();

            return (
              <div
                key={index}
                className={`h-32 border rounded-lg p-2 overflow-y-auto cursor-pointer hover:shadow-md transition ${
                  isToday ? 'bg-blue-50 border-blue-400 border-2' : 'bg-white border-gray-200'
                } ${draggedRdv ? 'hover:bg-green-50 hover:border-green-400' : ''}`}
                onClick={() => {
                  setSelectedDate(date);
                  setShowDayView(true);
                  setShowTodoPanel(true);
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, date)}
              >
                {/* Numéro du jour */}
                <div className={`flex justify-between items-start mb-1 ${
                  isToday ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  <span className="text-lg">📝</span>
                  <span className="font-semibold">{dayNumber}</span>
                </div>

                {/* RDV du jour */}
                <div className="space-y-1">
                  {rdvForDay.slice(0, 3).map(rdv => (
                    <div
                      key={rdv.id_rdv}
                      draggable
                      onDragStart={(e) => handleDragStart(e, rdv)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRdvClick(rdv);
                      }}
                      className={`text-xs p-1 rounded cursor-move hover:opacity-80 transition ${
                        rdv.archive ? 'opacity-60 border border-gray-400' : ''
                      } ${draggedRdv?.id_rdv === rdv.id_rdv ? 'opacity-50 scale-95' : ''}`}
                      style={{
                        backgroundColor: rdv.archive ? '#E5E7EB' :
                                       rdv.statut === 'Planifié' ? '#DBEAFE' : 
                                       rdv.statut === 'Effectué' ? '#D1FAE5' :
                                       rdv.statut === 'Facturé' ? '#FEF3C7' : '#FEE2E2',
                        color: '#1F2937'
                      }}
                      title={`${rdv.heure_rdv} - ${rdv.cabinet}${rdv.archive ? ' (Archivé)' : ''} - Glisser pour déplacer`}
                    >
                      <div className="font-semibold truncate flex items-center gap-1">
                        {rdv.archive && <span>📦</span>}
                        {rdv.heure_rdv}
                      </div>
                      <div className="truncate">
                        {rdv.cabinet}
                        {rdv.type_rdv ? ` · ${rdv.type_rdv}` : ''}
                      </div>
                    </div>
                  ))}
                  
                  {rdvForDay.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{rdvForDay.length - 3} autre{rdvForDay.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="mt-6 flex justify-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 rounded"></div>
            <span>Planifié</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 rounded"></div>
            <span>Effectué</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 rounded"></div>
            <span>Facturé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded border border-gray-400"></div>
            <span>📦 Archivé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 rounded"></div>
            <span>Annulé</span>
          </div>
        </div>
      </div>

      {/* Panneau latéral Todo List */}
      {showTodoPanel && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50"
             onClick={() => setShowTodoPanel(false)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl"
               onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 z-10">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-gray-800">📝 Todo List</h2>
                <button
                  onClick={() => setShowTodoPanel(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="p-4">
              {/* Formulaire ajout todo */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                    placeholder="Nouvelle tâche..."
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addTodo}
                    disabled={!newTodoText.trim()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ➕
                  </button>
                </div>
              </div>

              {/* Liste des todos */}
              {loadingTodos ? (
                <p className="text-center text-gray-500 py-4">Chargement...</p>
              ) : todos.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucune tâche pour ce jour</p>
              ) : (
                <div className="space-y-2">
                  {todos.map(todo => (
                    <div
                      key={todo.id_todo}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                        todo.completed 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id_todo)}
                        className="w-5 h-5 cursor-pointer accent-green-500"
                      />
                      <span
                        className={`flex-1 ${
                          todo.completed 
                            ? 'text-gray-500 line-through' 
                            : 'text-gray-800'
                        }`}
                      >
                        {todo.texte}
                      </span>
                      <button
                        onClick={() => deleteTodo(todo.id_todo)}
                        className="text-red-500 hover:text-red-700 text-lg"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Statistiques */}
              {todos.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <p className="mb-1">
                      <strong>{todos.filter(t => t.completed).length}</strong> sur <strong>{todos.length}</strong> tâche(s) complétée(s)
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${todos.length > 0 ? (todos.filter(t => t.completed).length / todos.length) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal détails RDV */}
      {showModal && selectedRdv && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-gray-800">{selectedRdv.type_rdv}</h3>
                {selectedRdv.archive && (
                  <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded font-semibold">
                    📦 ARCHIVÉ
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">Cabinet:</span>
                <span>{selectedRdv.cabinet}</span>
                {selectedRdv.type_rdv && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {selectedRdv.type_rdv}
                  </span>
                )}
              </div>
              <div>
                <span className="font-semibold">Date:</span> {new Date(selectedRdv.date_rdv).toLocaleDateString('fr-FR')}
              </div>
              <div>
                <span className="font-semibold">Heure:</span> {selectedRdv.heure_rdv}
              </div>
              <div>
                <span className="font-semibold">Lieu:</span> {selectedRdv.adresse}, {selectedRdv.code_postal} {selectedRdv.ville}
              </div>
              {selectedRdv.telephone && (
                <div>
                  <span className="font-semibold">Téléphone:</span> {selectedRdv.telephone}
                </div>
              )}
              {selectedRdv.email && (
                <div>
                  <span className="font-semibold">Email:</span> {selectedRdv.email}
                </div>
              )}
              <div>
                <span className="font-semibold">Statut:</span>{' '}
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedRdv.statut)}`}>
                  {selectedRdv.statut}
                </span>
              </div>
              {selectedRdv.notes && (
                <div>
                  <span className="font-semibold">Notes:</span>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">{selectedRdv.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  window.location.href = `/installations?traiter=${selectedRdv.id_rdv}`;
                }}
                className="px-4 py-2 bg-purple-500 text-white hover:bg-purple-600 rounded-lg transition"
              >
                🔧 Traiter ce RDV
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-300 rounded-lg transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création RDV */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">➕ Nouveau rendez-vous</h2>
                <p className="text-sm text-gray-600">Ajoutez un RDV sans quitter le calendrier.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            <form
              className="p-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();

                if (!newRdv.cabinet || !newRdv.date_rdv || !newRdv.heure_rdv || !newRdv.ville) {
                  alert('Veuillez renseigner cabinet, date, heure et ville');
                  return;
                }

                try {
                  const payload = {
                    ...newRdv,
                    praticiens: newRdv.praticiens
                      ? newRdv.praticiens.split(',').map(p => {
                          const [prenom, nom] = p.trim().split(' ');
                          return { prenom: prenom || '', nom: nom || '' };
                        })
                      : [],
                    statut: 'Planifié'
                  };

                  await axios.post('http://localhost:4000/api/rendez-vous', payload);
                  await fetchRdv();
                  alert('Rendez-vous créé');
                  setShowCreateModal(false);
                  setNewRdv({
                    cabinet: '',
                    date_rdv: '',
                    heure_rdv: '',
                    type_rdv: 'Installation serveur',
                    ville: '',
                    code_postal: '',
                    adresse: '',
                    email: '',
                    telephone: '',
                    praticiens: '',
                    notes: ''
                  });
                } catch (error) {
                  console.error('Erreur création RDV:', error);
                  alert('Erreur lors de la création du RDV');
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cabinet *</label>
                  <input
                    type="text"
                    value={newRdv.cabinet}
                    onChange={(e) => setNewRdv({...newRdv, cabinet: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={newRdv.type_rdv}
                    onChange={(e) => setNewRdv({...newRdv, type_rdv: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newRdv.date_rdv}
                    onChange={(e) => setNewRdv({...newRdv, date_rdv: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
                  <input
                    type="time"
                    value={newRdv.heure_rdv}
                    onChange={(e) => setNewRdv({...newRdv, heure_rdv: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={newRdv.adresse}
                    onChange={(e) => setNewRdv({...newRdv, adresse: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <VilleCodePostalInput
                  codePostal={newRdv.code_postal}
                  ville={newRdv.ville}
                  onCodePostalChange={(value) => setNewRdv({...newRdv, code_postal: value})}
                  onVilleChange={(value) => setNewRdv({...newRdv, ville: value})}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newRdv.email}
                    onChange={(e) => setNewRdv({...newRdv, email: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={newRdv.telephone}
                    onChange={(e) => setNewRdv({...newRdv, telephone: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Praticiens (séparés par virgule)</label>
                  <input
                    type="text"
                    value={newRdv.praticiens}
                    onChange={(e) => setNewRdv({...newRdv, praticiens: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Jean Dupont, Marie Martin"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newRdv.notes}
                    onChange={(e) => setNewRdv({...newRdv, notes: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white text-gray-700 hover:bg-gray-100 border rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Créer le RDV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Vue Jour Complète */}
      {showDayView && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDayView(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  📅 {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={() => setShowDayView(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">×</button>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">🗓️ Rendez-vous du jour</h3>
              {getRdvForDate(selectedDate).length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucun rendez-vous ce jour</p>
              ) : (
                <div className="space-y-3">
                  {getRdvForDate(selectedDate).map(rdv => (
                    <div
                      key={rdv.id_rdv}
                      onClick={() => {
                        setShowDayView(false);
                        handleRdvClick(rdv);
                      }}
                      className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition ${
                        rdv.archive ? 'opacity-70 border-gray-400' : ''
                      }`}
                      style={{
                        backgroundColor: rdv.archive ? '#E5E7EB' :
                                       rdv.statut === 'Planifié' ? '#DBEAFE' : 
                                       rdv.statut === 'Effectué' ? '#D1FAE5' :
                                       rdv.statut === 'Facturé' ? '#FEF3C7' : '#FEE2E2',
                        borderLeft: `4px solid ${
                          rdv.archive ? '#9CA3AF' :
                          rdv.statut === 'Planifié' ? '#3B82F6' : 
                          rdv.statut === 'Effectué' ? '#10B981' :
                          rdv.statut === 'Facturé' ? '#F59E0B' : '#EF4444'
                        }`,
                        color: '#1F2937'
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-xl font-bold flex items-center gap-2" style={{color: '#1F2937'}}>
                            {rdv.archive && <span className="text-sm">📦</span>}
                            {rdv.heure_rdv}
                          </div>
                          <div className="text-sm" style={{color: '#6B7280'}}>{rdv.type_rdv}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(rdv.statut)}`}>
                            {rdv.statut}
                          </span>
                          {rdv.archive && (
                            <span className="bg-gray-500 text-white text-xs px-2 py-0.5 rounded">
                              Archivé
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-semibold mb-1 flex flex-wrap items-center gap-1" style={{color: '#1F2937'}}>
                        <span className="truncate">{rdv.cabinet}</span>
                        {rdv.type_rdv && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            {rdv.type_rdv}
                          </span>
                        )}
                      </div>
                      {(rdv.adresse || rdv.ville) && (
                        <div className="text-sm" style={{color: '#4B5563'}}>📍 {rdv.adresse}, {rdv.code_postal} {rdv.ville}</div>
                      )}
                      {rdv.telephone && (
                        <div className="text-sm" style={{color: '#4B5563'}}>📞 {rdv.telephone}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendrierPage;
