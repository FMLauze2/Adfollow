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

const MesStatsPage = () => {
  const [rdvList, setRdvList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('mois'); // mois, annee, tout

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const rdvRes = await axios.get("http://localhost:4000/api/rendez-vous");
      setRdvList(rdvRes.data || []);
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer par période
  const getFilteredRdv = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return rdvList.filter(rdv => {
      const rdvDate = new Date(rdv.date_rdv);
      if (selectedPeriod === 'mois') {
        return rdvDate.getFullYear() === currentYear && rdvDate.getMonth() === currentMonth;
      } else if (selectedPeriod === 'annee') {
        return rdvDate.getFullYear() === currentYear;
      }
      return true; // tout
    });
  };

  const filteredRdv = getFilteredRdv();

  // KPIs principaux
  const totalRdv = filteredRdv.length;
  const rdvEffectues = filteredRdv.filter(r => r.statut === 'Effectué' || r.statut === 'Facturé').length;
  const rdvFactures = filteredRdv.filter(r => r.statut === 'Facturé').length;
  const tauxFacturation = rdvEffectues > 0 ? ((rdvFactures / rdvEffectues) * 100).toFixed(1) : 0;

  // Evolution RDV par mois (12 derniers mois)
  const getLast12MonthsData = () => {
    const monthCounts = {};
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[key] = 0;
    }

    rdvList.forEach(rdv => {
      const rdvDate = new Date(rdv.date_rdv);
      const key = `${rdvDate.getFullYear()}-${String(rdvDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthCounts.hasOwnProperty(key)) {
        monthCounts[key]++;
      }
    });

    return {
      labels: Object.keys(monthCounts).map(k => {
        const [year, month] = k.split('-');
        return new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      }),
      data: Object.values(monthCounts)
    };
  };

  // Répartition par type
  const getTypeDistribution = () => {
    const typeCounts = {};
    filteredRdv.forEach(rdv => {
      typeCounts[rdv.type_rdv] = (typeCounts[rdv.type_rdv] || 0) + 1;
    });
    return {
      labels: Object.keys(typeCounts),
      data: Object.values(typeCounts)
    };
  };

  // Top 5 cabinets
  const getTopCabinets = () => {
    const cabinetCounts = {};
    rdvList.forEach(rdv => {
      cabinetCounts[rdv.cabinet] = (cabinetCounts[rdv.cabinet] || 0) + 1;
    });
    const sorted = Object.entries(cabinetCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      labels: sorted.map(([name]) => name),
      data: sorted.map(([, count]) => count)
    };
  };

  // RDV par jour de la semaine
  const getWeekdayDistribution = () => {
    const weekdayCounts = { 'Lun': 0, 'Mar': 0, 'Mer': 0, 'Jeu': 0, 'Ven': 0, 'Sam': 0, 'Dim': 0 };
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    filteredRdv.forEach(rdv => {
      const date = new Date(rdv.date_rdv);
      const dayName = dayNames[date.getDay()];
      weekdayCounts[dayName]++;
    });

    return {
      labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      data: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => weekdayCounts[day])
    };
  };

  // Records
  const getRecords = () => {
    // RDV par jour
    const dayGroups = {};
    rdvList.forEach(rdv => {
      const dateKey = rdv.date_rdv.split('T')[0];
      dayGroups[dateKey] = (dayGroups[dateKey] || 0) + 1;
    });
    const maxDay = Math.max(...Object.values(dayGroups), 0);

    // RDV par semaine
    const weekGroups = {};
    rdvList.forEach(rdv => {
      const date = new Date(rdv.date_rdv);
      const weekKey = getWeekNumber(date);
      weekGroups[weekKey] = (weekGroups[weekKey] || 0) + 1;
    });
    const maxWeek = Math.max(...Object.values(weekGroups), 0);

    // Type le plus fréquent
    const typeCounts = {};
    rdvList.forEach(rdv => {
      typeCounts[rdv.type_rdv] = (typeCounts[rdv.type_rdv] || 0) + 1;
    });
    const mostFrequentType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    // RDV le plus rapide (Planifié → Facturé)
    let fastestDays = Infinity;
    rdvList.forEach(rdv => {
      if (rdv.statut === 'Facturé' && rdv.date_creation && rdv.date_rdv) {
        const created = new Date(rdv.date_creation);
        const completed = new Date(rdv.date_rdv);
        const days = Math.floor((completed - created) / (1000 * 60 * 60 * 24));
        if (days < fastestDays && days >= 0) {
          fastestDays = days;
        }
      }
    });

    return {
      maxDay,
      maxWeek,
      mostFrequentType: mostFrequentType ? mostFrequentType[0] : 'N/A',
      fastestDays: fastestDays === Infinity ? 'N/A' : fastestDays
    };
  };

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return `${d.getUTCFullYear()}-W${Math.ceil((((d - yearStart) / 86400000) + 1) / 7)}`;
  };

  const last12MonthsData = getLast12MonthsData();
  const typeDistData = getTypeDistribution();
  const topCabinetsData = getTopCabinets();
  const weekdayData = getWeekdayDistribution();
  const records = getRecords();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📊 Mes Statistiques</h1>

      {/* Sélecteur de période */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setSelectedPeriod('mois')}
          className={`px-4 py-2 rounded-lg transition ${
            selectedPeriod === 'mois' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Ce mois
        </button>
        <button
          onClick={() => setSelectedPeriod('annee')}
          className={`px-4 py-2 rounded-lg transition ${
            selectedPeriod === 'annee' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Cette année
        </button>
        <button
          onClick={() => setSelectedPeriod('tout')}
          className={`px-4 py-2 rounded-lg transition ${
            selectedPeriod === 'tout' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tout
        </button>
        <button
          onClick={fetchData}
          className="ml-auto bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow">
          <div className="text-3xl font-bold text-blue-600">{totalRdv}</div>
          <div className="text-sm text-gray-600">RDV total</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow">
          <div className="text-3xl font-bold text-green-600">{rdvEffectues}</div>
          <div className="text-sm text-gray-600">RDV effectués</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow">
          <div className="text-3xl font-bold text-yellow-600">{rdvFactures}</div>
          <div className="text-sm text-gray-600">RDV facturés</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 shadow">
          <div className="text-3xl font-bold text-purple-600">{tauxFacturation}%</div>
          <div className="text-sm text-gray-600">Taux facturation</div>
        </div>
      </div>

      {/* Records & Fun stats */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-lg p-6 mb-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">🏆 Mes Records</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-3xl font-bold">{records.maxDay}</div>
            <div className="text-sm opacity-90">RDV en 1 jour</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{records.maxWeek}</div>
            <div className="text-sm opacity-90">RDV en 1 semaine</div>
          </div>
          <div>
            <div className="text-xl font-bold truncate">{records.mostFrequentType}</div>
            <div className="text-sm opacity-90">Type le plus fréquent</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{records.fastestDays}</div>
            <div className="text-sm opacity-90">Jours (RDV le + rapide)</div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Evolution 12 mois */}
        <div className="bg-white border rounded-lg p-4 shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">📈 Evolution 12 derniers mois</h3>
          <Line
            data={{
              labels: last12MonthsData.labels,
              datasets: [{
                label: 'RDV',
                data: last12MonthsData.data,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } }
            }}
          />
        </div>

        {/* Répartition par type */}
        <div className="bg-white border rounded-lg p-4 shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">🔧 Répartition par type</h3>
          <Doughnut
            data={{
              labels: typeDistData.labels,
              datasets: [{
                data: typeDistData.data,
                backgroundColor: [
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(34, 197, 94, 0.8)',
                  'rgba(234, 179, 8, 0.8)',
                  'rgba(239, 68, 68, 0.8)',
                  'rgba(168, 85, 247, 0.8)',
                  'rgba(236, 72, 153, 0.8)',
                  'rgba(14, 165, 233, 0.8)',
                  'rgba(251, 146, 60, 0.8)'
                ]
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: 'bottom' } }
            }}
          />
        </div>

        {/* Top cabinets */}
        <div className="bg-white border rounded-lg p-4 shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">🏢 Top 5 cabinets</h3>
          <Bar
            data={{
              labels: topCabinetsData.labels,
              datasets: [{
                label: 'RDV',
                data: topCabinetsData.data,
                backgroundColor: 'rgba(168, 85, 247, 0.7)',
                borderColor: 'rgba(168, 85, 247, 1)',
                borderWidth: 1
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
              }
            }}
          />
        </div>

        {/* RDV par jour semaine */}
        <div className="bg-white border rounded-lg p-4 shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">📅 RDV par jour de la semaine</h3>
          <Bar
            data={{
              labels: weekdayData.labels,
              datasets: [{
                label: 'RDV',
                data: weekdayData.data,
                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
              }
            }}
          />
        </div>
      </div>

      {/* Info période */}
      <div className="text-center text-sm text-gray-500">
        Période affichée : {
          selectedPeriod === 'mois' ? 'Ce mois' :
          selectedPeriod === 'annee' ? 'Cette année' : 'Toutes les données'
        } ({filteredRdv.length} RDV)
      </div>
    </div>
  );
};

export default MesStatsPage;
