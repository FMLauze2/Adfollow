import React, { useEffect, useState } from "react";
import axios from "axios";

const HomePage = () => {
  const [overdueDays] = useState(7);
  const [overdueCount, setOverdueCount] = useState(0);
  const [todayRdvCount, setTodayRdvCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

        // Fetch RDV pour aujourd'hui
        const rdvRes = await axios.get("http://localhost:4000/api/rendez-vous");
        const today = new Date().toISOString().split('T')[0];
        
        const todayRdv = (rdvRes.data || []).filter(rdv => {
          if (!rdv.date_rdv) return false;
          const rdvDate = rdv.date_rdv.split('T')[0];
          const isToday = rdvDate === today;
          const notCancelled = rdv.statut !== 'Annulé'; // Compter Planifié ET Effectué
          console.log(`RDV ${rdv.id_rdv}: ${rdvDate} === ${today}? ${isToday}, Statut: ${rdv.statut}`);
          return isToday && notCancelled;
        });
        
        console.log(`Total RDV aujourd'hui (non annulés): ${todayRdv.length}`);
        setTodayRdvCount(todayRdv.length);
      } catch (e) {
        // ignore banner errors
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [overdueDays]);

  return (
    <div className="text-center py-12">
      {/* Bannières Notifications */}
      <div className="max-w-6xl mx-auto mb-6 space-y-4">
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
      </div>

      <h1 className="text-4xl font-bold mb-4 text-gray-800">Bienvenue sur Adfollow</h1>
      <p className="text-lg text-gray-600 mb-8">
        Gérez vos contrats et installations facilement
      </p>
      
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
          <h2 className="text-2xl font-semibold mb-2 text-purple-600">Praticiens</h2>
          <p className="text-gray-600 mb-4">
            Gérez la liste de vos praticiens et leurs informations.
          </p>
          <a
            href="/praticiens"
            className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded"
          >
            Gérer praticiens
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
      </div>
    </div>
  );
};

export default HomePage;
