import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AvancementEquipe = ({ reportId, onSave, initialData = [] }) => {
  const [devs, setDevs] = useState([]);
  const [avancements, setAvancements] = useState([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchDevs();
  }, []);

  useEffect(() => {
    if (devs.length > 0 && !initialized) {
      // Créer une carte des avancements existants par id_dev
      const existingAvancementsMap = {};
      if (initialData && initialData.length > 0) {
        initialData.forEach(av => {
          existingAvancementsMap[av.id_dev] = av;
        });
      }

      // Fusionner tous les devs avec les avancements existants
      const mergedAvancements = devs.map(dev => {
        const existing = existingAvancementsMap[dev.id_dev];
        return {
          id_dev: dev.id_dev,
          initiales: dev.initiales,
          nom_complet: dev.nom_complet,
          hier: existing?.hier || '',
          aujourdhui: existing?.aujourdhui || '',
          blocages: existing?.blocages || ''
        };
      });

      setAvancements(mergedAvancements);
      setInitialized(true);
    }
  }, [devs, initialData, initialized]);

  useEffect(() => {
    // Notifier le parent à chaque changement
    if (avancements.length > 0) {
      const filledAvancements = avancements.filter(av => 
        av.hier || av.aujourdhui || av.blocages
      );
      onSave(filledAvancements);
    }
  }, [avancements]);

  const fetchDevs = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/equipe');
      setDevs(response.data);
    } catch (error) {
      console.error('Erreur chargement équipe:', error);
    }
  };

  const updateAvancement = (id_dev, field, value) => {
    setAvancements(prev => 
      prev.map(av => 
        av.id_dev === id_dev 
          ? { ...av, [field]: value }
          : av
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg text-gray-800 dark:text-white">
          👥 Avancement par développeur
        </h3>
      </div>

      {avancements.map((av) => (
        <div 
          key={av.id_dev}
          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              {av.initiales}
            </div>
            <div className="font-semibold text-gray-800 dark:text-white">
              {av.nom_complet}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                ✅ Hier
              </label>
              <textarea
                value={av.hier}
                onChange={(e) => updateAvancement(av.id_dev, 'hier', e.target.value)}
                rows="2"
                placeholder="Ce qui a été fait hier..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                🎯 Aujourd'hui
              </label>
              <textarea
                value={av.aujourdhui}
                onChange={(e) => updateAvancement(av.id_dev, 'aujourdhui', e.target.value)}
                rows="2"
                placeholder="Ce qui est prévu aujourd'hui..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                🚧 Blocages
              </label>
              <textarea
                value={av.blocages}
                onChange={(e) => updateAvancement(av.id_dev, 'blocages', e.target.value)}
                rows="2"
                placeholder="Difficultés rencontrées..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      ))}

      {devs.length === 0 && (
        <p className="text-center text-gray-500 py-4 text-sm">
          Aucun développeur dans l'équipe. Ajoutez-en un pour commencer.
        </p>
      )}
    </div>
  );
};

export default AvancementEquipe;
