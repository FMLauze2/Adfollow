import React, { useEffect, useState } from "react";
import axios from "axios";

const HomePage = () => {
  const [overdueDays] = useState(7);
  const [overdueCount, setOverdueCount] = useState(0);
  const [todayRdvCount, setTodayRdvCount] = useState(0);
  const [upcomingRdv, setUpcomingRdv] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rendezvous, setRendezvous] = useState([]);
  const [hasDailyReport, setHasDailyReport] = useState(true);
  
  // Recherche globale
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ contrats: [], rdv: [] });
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Todo list du jour
  const [todayTodos, setTodayTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [loadingTodos, setLoadingTodos] = useState(false);

  // Fermer les résultats en cliquant dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch contrats pour les retards
        const contratsRes = await axios.get("http://localhost:4000/api/contrats");
        const count = (contratsRes.data || []).reduce((acc, c) => {
          if (c.statut === 'Envoyé' && !c.date_reception && c.date_envoi) {
            const days = Math.floor((Date.now() - new Date(c.date_envoi).getTime()) / (1000*60*60*24));
            return acc + (days > overdueDays ? 1 : 0);
          }
          return acc;
        }, 0);
        setOverdueCount(count);

        // Fonction locale pour obtenir la date du jour sans décalage UTC
        const getTodayDate = () => {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Fetch RDV et todos pour aujourd'hui
        const today = getTodayDate();
        
        const todosRes = await axios.get(`http://localhost:4000/api/todos?date=${today}`);
        setTodayTodos(todosRes.data || []);

        // Vérifier si un daily report existe pour aujourd'hui
        const dailyRes = await axios.get(`http://localhost:4000/api/dailyreports/date/${today}`);
        setHasDailyReport(dailyRes.data && dailyRes.data.id_report);

        // Inclure tous les RDV (y compris archivés) pour les statistiques
        const rdvRes = await axios.get("http://localhost:4000/api/rendez-vous?includeArchived=true");
        setRendezvous(rdvRes.data || []);
        
        const todayRdv = (rdvRes.data || []).filter(rdv => {
          if (!rdv.date_rdv) return false;
          const rdvDate = rdv.date_rdv.split('T')[0];
          const isToday = rdvDate === today;
          const notCancelled = rdv.statut !== 'Annulé';
          const notArchived = !rdv.archive; // Exclure les archivés des stats du jour
          return isToday && notCancelled && notArchived;
        });
        
        setTodayRdvCount(todayRdv.length);

        // Fetch RDV à venir (prochains 14 jours, non annulés, non archivés)
        const upcoming = (rdvRes.data || [])
          .filter(rdv => {
            if (!rdv.date_rdv || rdv.statut === 'Annulé' || rdv.archive) return false;
            const rdvDate = new Date(rdv.date_rdv.split('T')[0]);
            const todayDate = new Date(today);
            const in14Days = new Date(todayDate);
            in14Days.setDate(in14Days.getDate() + 14);
            return rdvDate >= todayDate && rdvDate <= in14Days;
          })
          .sort((a, b) => {
            const dateA = new Date(a.date_rdv + 'T' + a.heure_rdv);
            const dateB = new Date(b.date_rdv + 'T' + b.heure_rdv);
            return dateA - dateB;
          });
        setUpcomingRdv(upcoming);
      } catch (e) {
        // ignore banner errors
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [overdueDays]);

  const handleSearch = async (query) => {
    if (query.trim().length < 2) return;
    
    setSearching(true);
    try {
      const [contratsRes, rdvRes] = await Promise.all([
        axios.get("http://localhost:4000/api/contrats"),
        axios.get("http://localhost:4000/api/rendez-vous?includeArchived=true")
      ]);

      const searchLower = query.toLowerCase().trim();

      // Recherche dans les contrats
      const matchedContrats = (contratsRes.data || []).filter(contrat => {
        const cabinetMatch = contrat.cabinet?.toLowerCase().includes(searchLower);
        const villeMatch = contrat.ville?.toLowerCase().includes(searchLower);
        const cpMatch = contrat.code_postal?.includes(searchLower);
        const praticienMatch = contrat.praticiens?.some(p => {
          if (typeof p === 'string') return p.toLowerCase().includes(searchLower);
          return `${p.prenom} ${p.nom}`.toLowerCase().includes(searchLower);
        });
        return cabinetMatch || villeMatch || cpMatch || praticienMatch;
      }).slice(0, 5); // Limiter à 5 résultats

      // Recherche dans les RDV
      const matchedRdv = (rdvRes.data || []).filter(rdv => {
        const cabinetMatch = rdv.cabinet?.toLowerCase().includes(searchLower);
        const villeMatch = rdv.ville?.toLowerCase().includes(searchLower);
        const cpMatch = rdv.code_postal?.includes(searchLower);
        const typeMatch = rdv.type_rdv?.toLowerCase().includes(searchLower);
        const praticienMatch = rdv.praticiens?.some(p => 
          `${p.prenom} ${p.nom}`.toLowerCase().includes(searchLower)
        );
        return cabinetMatch || villeMatch || cpMatch || typeMatch || praticienMatch;
      }).slice(0, 5); // Limiter à 5 résultats

      setSearchResults({ contrats: matchedContrats, rdv: matchedRdv });
      setShowResults(true);
    } catch (error) {
      console.error("Erreur recherche:", error);
    } finally {
      setSearching(false);
    }
  };

  const getTodayDateLocal = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchTodayTodos = async () => {
    const today = getTodayDateLocal();
    try {
      const todosRes = await axios.get(`http://localhost:4000/api/todos?date=${today}`);
      setTodayTodos(todosRes.data || []);
    } catch (error) {
      console.error("Erreur chargement todos:", error);
    }
  };

  const addTodo = async () => {
    if (!newTodoText.trim()) return;
    
    try {
      const today = getTodayDateLocal();
      await axios.post("http://localhost:4000/api/todos", {
        texte: newTodoText,
        date_todo: today
      });
      setNewTodoText('');
      fetchTodayTodos();
    } catch (error) {
      console.error("Erreur création todo:", error);
    }
  };

  const toggleTodo = async (id) => {
    try {
      await axios.post(`http://localhost:4000/api/todos/${id}/toggle`);
      fetchTodayTodos();
    } catch (error) {
      console.error("Erreur toggle todo:", error);
    }
  };

  const deleteTodo = async (id) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    
    try {
      await axios.delete(`http://localhost:4000/api/todos/${id}`);
      fetchTodayTodos();
    } catch (error) {
      console.error("Erreur suppression todo:", error);
    }
  };

  return (
    <div className="text-center py-12">
      {/* Bannières Notifications */}
      <div className="max-w-6xl mx-auto mb-6 space-y-4">
        {/* Bannière Daily Report manquant */}
        {!loading && !hasDailyReport && (
          <div className="rounded border border-orange-300 bg-orange-50 text-left p-4 flex items-center justify-between">
            <div>
              <p className="text-orange-800 font-semibold">
                📝 Compte rendu quotidien non saisi
              </p>
              <p className="text-orange-700 text-sm">N'oublie pas de remplir ton daily report du jour.</p>
            </div>
            <a
              href="/dailyreports"
              className="ml-4 inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded"
            >
              Saisir le daily
            </a>
          </div>
        )}

        {/* Bannière RDV du jour */}
        {!loading && todayRdvCount > 0 && (
          <div className="rounded border border-blue-300 bg-blue-50 text-left p-4 flex items-center justify-between">
            <div>
              <p className="text-blue-800 font-semibold">
                📅 {todayRdvCount} rendez-vous aujourd'hui
              </p>
              <p className="text-blue-700 text-sm">Planifiés et effectués du jour.</p>
            </div>
            <a
              href="/installations"
              className="ml-4 inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
            >
              Voir les RDV
            </a>
          </div>
        )}

        {/* Bannière Contrats en retard */}
        {!loading && overdueCount > 0 && (
          <div className="rounded border border-red-300 bg-red-50 text-left p-4 flex items-center justify-between">
            <div>
              <p className="text-red-800 font-semibold">
                {overdueCount} contrat(s) envoyés sans réception depuis plus de {overdueDays} jours
              </p>
              <p className="text-red-700 text-sm">Pense à relancer ou à saisir la date de réception.</p>
            </div>
            <a
              href={`/contrats?overdue=1&days=${overdueDays}`}
              className="ml-4 inline-block bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded"
            >
              Voir les retards
            </a>
          </div>
        )}

        {/* Bannière RDV à facturer */}
        {!loading && rendezvous.filter(r => r.statut === 'Effectué' && !r.archive).length > 0 && (
          <div className="rounded border border-purple-300 bg-purple-50 text-left p-4 flex items-center justify-between">
            <div>
              <p className="text-purple-800 font-semibold">
                💰 {rendezvous.filter(r => r.statut === 'Effectué' && !r.archive).length} rendez-vous à facturer
              </p>
              <p className="text-purple-700 text-sm">Des RDV effectués sont en attente de facturation.</p>
            </div>
            <a
              href="/installations"
              className="ml-4 inline-block bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded"
            >
              Voir les RDV
            </a>
          </div>
        )}
      </div>

      <h1 className="text-4xl font-bold mb-4 text-gray-800">Bienvenue sur Adfollow</h1>
      <p className="text-lg text-gray-600 mb-4">
        Gérez vos contrats et installations facilement
      </p>

      {/* Barre de recherche globale */}
      <div className="max-w-3xl mx-auto mb-8 relative search-container">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim().length >= 2) {
                handleSearch(e.target.value);
              } else {
                setShowResults(false);
                setSearchResults({ contrats: [], rdv: [] });
              }
            }}
            onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
            placeholder="🔍 Rechercher un cabinet, praticien, ville, code postal..."
            className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 shadow-lg"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {/* Résultats de recherche */}
        {showResults && (searchResults.contrats.length > 0 || searchResults.rdv.length > 0) && (
          <div className="absolute w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-[500px] overflow-y-auto z-50 text-left">
            {/* Contrats */}
            {searchResults.contrats.length > 0 && (
              <div className="p-4 border-b">
                <h3 className="font-bold text-blue-600 mb-3">📄 Contrats ({searchResults.contrats.length})</h3>
                <div className="space-y-2">
                  {searchResults.contrats.map(contrat => (
                    <a
                      key={contrat.id_contrat}
                      href="/contrats"
                      className="block p-3 hover:bg-blue-50 rounded transition"
                      onClick={() => setShowResults(false)}
                    >
                      <div className="font-semibold text-gray-800">{contrat.cabinet}</div>
                      <div className="text-sm text-gray-600">
                        {contrat.ville} · {contrat.prix}€ · 
                        <span className={`ml-1 ${contrat.statut === 'Signé' ? 'text-green-600' : 'text-orange-600'}`}>
                          {contrat.statut}
                        </span>
                      </div>
                      {contrat.praticiens && contrat.praticiens.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          👥 {contrat.praticiens.map(p => typeof p === 'string' ? p : `${p.prenom} ${p.nom}`).join(', ')}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* RDV */}
            {searchResults.rdv.length > 0 && (
              <div className="p-4">
                <h3 className="font-bold text-green-600 mb-3">📅 Rendez-vous ({searchResults.rdv.length})</h3>
                <div className="space-y-2">
                  {searchResults.rdv.map(rdv => (
                    <a
                      key={rdv.id_rdv}
                      href="/installations"
                      className="block p-3 hover:bg-green-50 rounded transition"
                      onClick={() => setShowResults(false)}
                    >
                      <div className="font-semibold text-gray-800">{rdv.cabinet}</div>
                      <div className="text-sm text-gray-600">
                        {rdv.type_rdv} · {rdv.ville} · {rdv.date_rdv.split('T')[0].split('-').reverse().join('/')} à {rdv.heure_rdv}
                      </div>
                      <span className={`inline-block text-xs px-2 py-1 rounded mt-1 ${
                        rdv.statut === 'Planifié' ? 'bg-blue-100 text-blue-800' :
                        rdv.statut === 'Effectué' ? 'bg-green-100 text-green-800' :
                        rdv.statut === 'Facturé' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {rdv.statut}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {searchResults.contrats.length === 0 && searchResults.rdv.length === 0 && searchQuery.trim().length >= 2 && (
              <div className="p-6 text-center text-gray-500">
                Aucun résultat trouvé pour "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Badges visuels rapides */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-lg">
            <div className="text-3xl font-bold">{todayRdvCount}</div>
            <div className="text-sm opacity-90">RDV aujourd'hui</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow-lg">
            <div className="text-3xl font-bold">{upcomingRdv.length}</div>
            <div className="text-sm opacity-90">RDV prochains 14j</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-4 shadow-lg">
            <div className="text-3xl font-bold">{rendezvous.filter(r => r.statut === 'Effectué' && !r.archive).length}</div>
            <div className="text-sm opacity-90">À facturer</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow-lg">
            <div className="text-3xl font-bold">{rendezvous.length}</div>
            <div className="text-sm opacity-90">Total RDV</div>
            <div className="text-xs opacity-75 mt-1">{rendezvous.filter(r => r.archive).length} archivés</div>
          </div>
        </div>
      )}

      {/* Todo List du jour */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">📝 Ma liste du jour</h2>
            <a 
              href="/calendrier" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Voir calendrier →
            </a>
          </div>

          {/* Formulaire ajout todo */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="Ajouter une tâche pour aujourd'hui..."
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addTodo}
                disabled={!newTodoText.trim()}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ➕ Ajouter
              </button>
            </div>
          </div>

          {/* Liste des todos */}
          {loadingTodos ? (
            <p className="text-center text-gray-500 py-4">Chargement...</p>
          ) : todayTodos.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucune tâche pour aujourd'hui</p>
          ) : (
            <div className="space-y-2">
              {todayTodos.map(todo => (
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
                    className={`flex-1 text-left ${
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
          {todayTodos.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <p className="mb-1">
                  <strong>{todayTodos.filter(t => t.completed).length}</strong> sur <strong>{todayTodos.length}</strong> tâche(s) complétée(s)
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${todayTodos.length > 0 ? (todayTodos.filter(t => t.completed).length / todayTodos.length) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-2 text-blue-600">Contrats</h2>
          <p className="text-gray-600 mb-4">
            Consultez et gérez vos contrats, suivez les dates d'envoi et de réception.
          </p>
          <a
            href="/contrats"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Aller aux contrats
          </a>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-2 text-green-600">Ajouter un contrat</h2>
          <p className="text-gray-600 mb-4">
            Créez un nouveau contrat et générez automatiquement le PDF.
          </p>
          <a
            href="/contrats/nouveau"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded"
          >
            Nouveau contrat
          </a>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-2 text-purple-600">Historique</h2>
          <p className="text-gray-600 mb-4">
            Consultez l'historique complet de tous vos contrats et RDV.
          </p>
          <a
            href="/historique"
            className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded"
          >
            Voir l'historique
          </a>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-2 text-orange-600">Installations</h2>
          <p className="text-gray-600 mb-4">
            Suivez les installations et leur status.
          </p>
          <a
            href="/installations"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded"
          >
            Gérer installations
          </a>
        </div>

        <div className="bg-white p-6 rounded shadow border-2 border-indigo-300">
          <h2 className="text-2xl font-semibold mb-2 text-indigo-600">➕ Nouveau RDV</h2>
          <p className="text-gray-600 mb-4">
            Créez rapidement un nouveau rendez-vous.
          </p>
          <a
            href="/installations?new=1"
            className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded"
          >
            Créer un RDV
          </a>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-2 text-teal-600">📊 Daily Report</h2>
          <p className="text-gray-600 mb-4">
            Saisissez votre compte rendu quotidien de sprint.
          </p>
          <a
            href="/dailyreports"
            className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded"
          >
            Comptes rendus
          </a>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-2 text-pink-600">📚 Base de connaissances</h2>
          <p className="text-gray-600 mb-4">
            Accédez aux guides et documentations techniques.
          </p>
          <a
            href="/knowledge"
            className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded"
          >
            Voir la base
          </a>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-2 text-cyan-600">📅 Calendrier</h2>
          <p className="text-gray-600 mb-4">
            Visualisez tous vos rendez-vous dans un calendrier.
          </p>
          <a
            href="/calendrier"
            className="inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 px-4 rounded"
          >
            Voir le calendrier
          </a>
        </div>
      </div>

      {/* RDV du jour */}
      {!loading && (() => {
        const today = getTodayDateLocal();
        const todayRdvList = rendezvous.filter(rdv => {
          if (!rdv.date_rdv || rdv.statut === 'Annulé') return false;
          return rdv.date_rdv.split('T')[0] === today;
        });
        
        return todayRdvList.length > 0 && (
          <div className="max-w-6xl mx-auto mt-12">
            <h2 className="text-2xl font-bold mb-6 text-left dark:text-white">🔔 Rendez-vous du jour</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayRdvList.map(rdv => (
                <div 
                  key={rdv.id_rdv} 
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border-2 ${
                    rdv.archive 
                      ? 'border-gray-400 opacity-60' 
                      : 'border-blue-500 dark:border-blue-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                        {rdv.archive && <span>📦</span>}
                        {rdv.cabinet}
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{rdv.type_rdv}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${
                      rdv.statut === 'Planifié' ? 'bg-blue-500 text-white' : 
                      rdv.statut === 'Effectué' ? 'bg-green-500 text-white' : 
                      'bg-purple-500 text-white'
                    }`}>
                      {rdv.statut}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-800 dark:text-gray-200">
                    <p className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                      ⏰ Aujourd'hui à {rdv.heure_rdv}
                    </p>
                    {rdv.ville && <p className="text-sm">📍 {rdv.ville}</p>}
                    {rdv.adresse && <p className="text-xs text-gray-600 dark:text-gray-400">{rdv.adresse}</p>}
                    {rdv.telephone && <p className="text-xs">📞 {rdv.telephone}</p>}
                    {rdv.email && <p className="text-xs">✉️ {rdv.email}</p>}
                    {rdv.praticiens && rdv.praticiens.length > 0 && (
                      <p className="text-sm">
                        👥 {rdv.praticiens.map(p => `${p.prenom} ${p.nom}`).join(', ')}
                      </p>
                    )}
                  </div>
                  
                  <a
                    href="/installations"
                    className="mt-3 block text-center text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded"
                  >
                    Voir détails →
                  </a>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Calendrier des RDV à venir */}
      {!loading && upcomingRdv.length > 0 && (
        <div className="max-w-6xl mx-auto mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-left">📅 Prochains rendez-vous (14 jours)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingRdv.map(rdv => {
              const rdvDate = new Date(rdv.date_rdv.split('T')[0]);
              const dateStr = rdvDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
              const isToday = rdv.date_rdv.split('T')[0] === getTodayDateLocal();
              
              return (
                <div 
                  key={rdv.id_rdv} 
                  className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                    isToday ? 'border-blue-500 bg-blue-50' : 
                    rdv.statut === 'Planifié' ? 'border-green-500' : 'border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{rdv.cabinet}</h3>
                      <p className="text-xs text-gray-600">{rdv.type_rdv}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      rdv.statut === 'Planifié' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rdv.statut}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-700">
                    <p className="flex items-center gap-2">
                      <span className={isToday ? 'font-bold text-blue-600' : ''}>
                        🗓️ {dateStr} à {rdv.heure_rdv}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600">📍 {rdv.ville}</p>
                    {rdv.praticiens && rdv.praticiens.length > 0 && (
                      <p className="text-xs text-gray-600">
                        👥 {rdv.praticiens.map(p => `${p.prenom} ${p.nom}`).join(', ')}
                      </p>
                    )}
                  </div>
                  
                  <a
                    href="/installations"
                    className="mt-3 block text-center text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded"
                  >
                    Voir détails →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
