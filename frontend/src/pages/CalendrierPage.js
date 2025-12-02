import React, { useState, useEffect } from "react";
import axios from "axios";

function CalendrierPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rdvList, setRdvList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRdv();
  }, []);

  const fetchRdv = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:4000/api/rendez-vous");
      setRdvList(response.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des RDV:", error);
    } finally {
      setLoading(false);
    }
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
    
    const dateString = date.toISOString().split('T')[0];
    
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
                className={`h-32 border rounded-lg p-2 overflow-y-auto ${
                  isToday ? 'bg-blue-50 border-blue-400 border-2' : 'bg-white border-gray-200'
                }`}
              >
                {/* Numéro du jour */}
                <div className={`text-right font-semibold mb-1 ${
                  isToday ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {dayNumber}
                </div>

                {/* RDV du jour */}
                <div className="space-y-1">
                  {rdvForDay.slice(0, 3).map(rdv => (
                    <div
                      key={rdv.id_rdv}
                      onClick={() => handleRdvClick(rdv)}
                      className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition"
                      style={{
                        backgroundColor: rdv.statut === 'Planifié' ? '#DBEAFE' : 
                                       rdv.statut === 'Effectué' ? '#D1FAE5' :
                                       rdv.statut === 'Facturé' ? '#FEF3C7' : '#FEE2E2',
                        color: '#1F2937'
                      }}
                      title={`${rdv.heure_rdv} - ${rdv.cabinet}`}
                    >
                      <div className="font-semibold truncate">{rdv.heure_rdv}</div>
                      <div className="truncate">{rdv.cabinet}</div>
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
        <div className="mt-6 flex justify-center gap-4 text-sm">
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
            <div className="w-4 h-4 bg-red-200 rounded"></div>
            <span>Annulé</span>
          </div>
        </div>
      </div>

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
              <h3 className="text-2xl font-bold text-gray-800">{selectedRdv.type_rdv}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="font-semibold">Cabinet:</span> {selectedRdv.cabinet}
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

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendrierPage;
