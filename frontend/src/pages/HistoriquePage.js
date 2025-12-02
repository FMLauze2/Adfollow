import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const HistoriquePage = () => {
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tous"); // Tous, Contrats, RDV
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [statusFilter, setStatusFilter] = useState([]);
  const [typeRdvFilter, setTypeRdvFilter] = useState([]);
  const [showGraphs, setShowGraphs] = useState(false);
  const [rdvList, setRdvList] = useState([]);

  useEffect(() => {
    fetchHistorique();
  }, []);

  const fetchHistorique = async () => {
    setLoading(true);
    try {
      const [contratsRes, rdvRes] = await Promise.all([
        axios.get("http://localhost:4000/api/contrats"),
        axios.get("http://localhost:4000/api/rendez-vous")
      ]);

      setRdvList(rdvRes.data || []);

      // Transformer les contrats en entrées d'historique
      const contratsHistory = (contratsRes.data || []).map(c => ({
        id: `contrat-${c.id_contrat}`,
        type: "Contrat",
        action: c.statut === "Signé" ? "Contrat signé" : c.statut === "Envoyé" ? "Contrat envoyé" : "Contrat créé",
        cabinet: c.cabinet,
        details: `${c.ville} - ${c.prix}€`,
        date: c.date_reception || c.date_envoi || c.date_creation,
        statut: c.statut,
        typeRdv: null,
        icon: "📄"
      }));

      // Transformer les RDV en entrées d'historique
      const rdvHistory = (rdvRes.data || []).map(r => ({
        id: `rdv-${r.id_rdv}`,
        type: "RDV",
        action: `${r.type_rdv}`,
        cabinet: r.cabinet,
        details: `${r.ville} - ${r.date_rdv.split('T')[0].split('-').reverse().join('/')} à ${r.heure_rdv}`,
        date: r.date_creation,
        statut: r.statut,
        typeRdv: r.type_rdv,
        icon: r.statut === "Facturé" ? "💰" : r.statut === "Effectué" ? "✅" : r.statut === "Planifié" ? "📅" : "❌"
      }));

      // Fusionner et trier par date décroissante
      const allHistory = [...contratsHistory, ...rdvHistory].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });

      setHistorique(allHistory);
    } catch (error) {
      console.error("Erreur chargement historique:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = historique.filter(item => {
    // Filtre par type (Tous/Contrat/RDV)
    const matchesFilter = filter === "Tous" || item.type === filter;
    
    // Filtre recherche textuelle
    const matchesSearch = item.cabinet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre par plage de dates
    let matchesDateRange = true;
    if (dateRange.start || dateRange.end) {
      const itemDate = new Date(item.date);
      if (dateRange.start) {
        matchesDateRange = matchesDateRange && itemDate >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59); // Inclure toute la journée de fin
        matchesDateRange = matchesDateRange && itemDate <= endDate;
      }
    }
    
    // Filtre par statuts multiples
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(item.statut);
    
    // Filtre par types de RDV
    const matchesTypeRdv = typeRdvFilter.length === 0 || 
                           (item.typeRdv && typeRdvFilter.includes(item.typeRdv));
    
    return matchesFilter && matchesSearch && matchesDateRange && matchesStatus && matchesTypeRdv;
  });

  // Calculs pour les graphiques
  const getRdvByMonth = () => {
    const monthCounts = {};
    rdvList.forEach(rdv => {
      const date = new Date(rdv.date_rdv);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });
    
    const sortedMonths = Object.keys(monthCounts).sort();
    return {
      labels: sortedMonths.map(m => {
        const [year, month] = m.split('-');
        return new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      }),
      data: sortedMonths.map(m => monthCounts[m])
    };
  };

  const getStatusDistribution = () => {
    const statusCounts = {};
    rdvList.forEach(rdv => {
      statusCounts[rdv.statut] = (statusCounts[rdv.statut] || 0) + 1;
    });
    return {
      labels: Object.keys(statusCounts),
      data: Object.values(statusCounts)
    };
  };

  const getTypeRdvDistribution = () => {
    const typeCounts = {};
    rdvList.forEach(rdv => {
      typeCounts[rdv.type_rdv] = (typeCounts[rdv.type_rdv] || 0) + 1;
    });
    
    // Trier par fréquence décroissante
    const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    return {
      labels: sorted.map(([type]) => type),
      data: sorted.map(([, count]) => count)
    };
  };

  const rdvByMonthData = getRdvByMonth();
  const statusDistData = getStatusDistribution();
  const typeRdvDistData = getTypeRdvDistribution();

  const toggleStatus = (status) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleTypeRdv = (type) => {
    setTypeRdvFilter(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const resetFilters = () => {
    setDateRange({ start: "", end: "" });
    setStatusFilter([]);
    setTypeRdvFilter([]);
    setSearchTerm("");
    setFilter("Tous");
  };

  const allStatuses = ["Planifié", "Effectué", "Facturé", "Annulé", "Brouillon", "Envoyé", "Signé", "Reçu"];
  const allTypeRdv = ["Installation serveur", "Installation poste secondaire", "Changement de poste serveur", 
                      "Formation", "Export BDD", "Démo", "Mise à jour", "Autre"];

  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (statut) => {
    const colors = {
      "Brouillon": "bg-gray-100 text-gray-800",
      "Envoyé": "bg-orange-100 text-orange-800",
      "Signé": "bg-green-100 text-green-800",
      "Reçu": "bg-green-100 text-green-800",
      "Planifié": "bg-blue-100 text-blue-800",
      "Effectué": "bg-green-100 text-green-800",
      "Facturé": "bg-purple-100 text-purple-800 font-bold",
      "Annulé": "bg-red-100 text-red-800"
    };
    return colors[statut] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📜 Historique</h1>
        <button
          onClick={() => setShowGraphs(!showGraphs)}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          {showGraphs ? "📊 Masquer graphiques" : "📈 Afficher graphiques"}
        </button>
      </div>

      {/* Graphiques */}
      {showGraphs && !loading && (
        <div className="mb-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RDV par mois */}
            <div className="bg-white border rounded-lg p-4 shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">📅 RDV par mois</h3>
              <Line
                data={{
                  labels: rdvByMonthData.labels,
                  datasets: [{
                    label: 'Nombre de RDV',
                    data: rdvByMonthData.data,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>

            {/* Distribution des statuts */}
            <div className="bg-white border rounded-lg p-4 shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">📊 Statuts RDV</h3>
              <Doughnut
                data={{
                  labels: statusDistData.labels,
                  datasets: [{
                    data: statusDistData.data,
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(34, 197, 94, 0.8)',
                      'rgba(234, 179, 8, 0.8)',
                      'rgba(239, 68, 68, 0.8)',
                      'rgba(168, 85, 247, 0.8)',
                      'rgba(236, 72, 153, 0.8)'
                    ]
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          {/* Types de RDV les plus fréquents */}
          <div className="bg-white border rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">🔧 Types de RDV populaires</h3>
            <Bar
              data={{
                labels: typeRdvDistData.labels,
                datasets: [{
                  label: 'Nombre',
                  data: typeRdvDistData.data,
                  backgroundColor: 'rgba(34, 197, 94, 0.7)',
                  borderColor: 'rgba(34, 197, 94, 1)',
                  borderWidth: 1
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Filtres avancés */}
      <div className="bg-white border rounded-lg p-4 mb-6 shadow">
        <h3 className="font-semibold mb-3 text-gray-700">🔍 Filtres avancés</h3>
        
        {/* Barre de recherche et filtre type */}
        <div className="flex gap-4 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] border px-4 py-2 rounded"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border px-4 py-2 rounded bg-white"
          >
            <option value="Tous">Tous les événements</option>
            <option value="Contrat">Contrats uniquement</option>
            <option value="RDV">RDV uniquement</option>
          </select>
          <button
            onClick={fetchHistorique}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            🔄 Actualiser
          </button>
        </div>

        {/* Plage de dates */}
        <div className="flex gap-4 mb-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">Date début</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">Date fin</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>

        {/* Filtres par statuts */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">Filtrer par statut:</label>
          <div className="flex gap-2 flex-wrap">
            {allStatuses.map(status => (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`px-3 py-1 rounded text-sm transition ${
                  statusFilter.includes(status)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Filtres par types de RDV */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">Filtrer par type de RDV:</label>
          <div className="flex gap-2 flex-wrap">
            {allTypeRdv.map(type => (
              <button
                key={type}
                onClick={() => toggleTypeRdv(type)}
                className={`px-3 py-1 rounded text-sm transition ${
                  typeRdvFilter.includes(type)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Bouton réinitialiser */}
        <button
          onClick={resetFilters}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
        >
          ↺ Réinitialiser tous les filtres
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {historique.filter(h => h.type === "Contrat").length}
          </div>
          <div className="text-sm text-gray-600">Contrats totaux</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {historique.filter(h => h.type === "RDV").length}
          </div>
          <div className="text-sm text-gray-600">RDV totaux</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {historique.filter(h => h.statut === "Facturé").length}
          </div>
          <div className="text-sm text-gray-600">RDV facturés</div>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Chargement de l'historique...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aucun événement trouvé
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item, index) => (
            <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-4">
                {/* Icône */}
                <div className="text-3xl flex-shrink-0">
                  {item.icon}
                </div>
                
                {/* Contenu */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mr-2 ${
                        item.type === "Contrat" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}>
                        {item.type}
                      </span>
                      <span className="font-semibold text-gray-800">{item.cabinet}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.statut)}`}>
                      {item.statut}
                    </span>
                  </div>
                  
                  <div className="text-gray-700 mb-1">{item.action}</div>
                  <div className="text-sm text-gray-500">{item.details}</div>
                  <div className="text-xs text-gray-400 mt-2">
                    🕐 {formatDate(item.date)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoriquePage;
