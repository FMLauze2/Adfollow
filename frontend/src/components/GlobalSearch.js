// frontend/src/components/GlobalSearch.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ rdv: [], contrats: [], cabinets: [], knowledge: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus automatique à l'ouverture
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Recherche avec debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults({ rdv: [], contrats: [], cabinets: [], knowledge: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:4000/api/search?q=${encodeURIComponent(query)}`);
        setResults(response.data);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Erreur recherche:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Calculer le nombre total de résultats
  const allResults = [
    ...results.rdv,
    ...results.contrats,
    ...results.cabinets,
    ...results.knowledge
  ];

  // Navigation clavier
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      handleSelectResult(allResults[selectedIndex]);
    }
  };

  const handleSelectResult = (result) => {
    navigate(result._url);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl mx-4">
        {/* Barre de recherche */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher un cabinet, RDV, contrat, article..."
              className="flex-1 text-lg outline-none bg-transparent dark:text-white"
            />
            {loading && <span className="text-sm text-gray-500">Recherche...</span>}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
            >
              ESC
            </button>
          </div>
        </div>

        {/* Résultats */}
        <div className="max-h-96 overflow-y-auto p-4">
          {query.length < 2 && (
            <p className="text-center text-gray-500 py-8">
              Tapez au moins 2 caractères pour rechercher
            </p>
          )}

          {query.length >= 2 && allResults.length === 0 && !loading && (
            <p className="text-center text-gray-500 py-8">
              Aucun résultat trouvé pour "{query}"
            </p>
          )}

          {/* RDV */}
          {results.rdv.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-sm text-gray-600 dark:text-gray-400 mb-2">
                📅 Rendez-vous ({results.rdv.length})
              </h3>
              {results.rdv.map((rdv, idx) => (
                <div
                  key={`rdv-${rdv.id_rdv}`}
                  onClick={() => handleSelectResult(rdv)}
                  className={`p-3 rounded cursor-pointer mb-1 ${
                    selectedIndex === allResults.indexOf(rdv)
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium dark:text-white">{rdv._label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(rdv._date).toLocaleDateString('fr-FR')} à {rdv.heure_rdv} • {rdv.ville}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contrats */}
          {results.contrats.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-sm text-gray-600 dark:text-gray-400 mb-2">
                📄 Contrats ({results.contrats.length})
              </h3>
              {results.contrats.map((contrat) => (
                <div
                  key={`contrat-${contrat.id_contrat}`}
                  onClick={() => handleSelectResult(contrat)}
                  className={`p-3 rounded cursor-pointer mb-1 ${
                    selectedIndex === allResults.indexOf(contrat)
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium dark:text-white">{contrat._label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {contrat.prix}€ • {contrat.statut} • {contrat.ville}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cabinets */}
          {results.cabinets.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-sm text-gray-600 dark:text-gray-400 mb-2">
                🏥 Cabinets ({results.cabinets.length})
              </h3>
              {results.cabinets.map((cabinet) => (
                <div
                  key={`cabinet-${cabinet.cabinet}`}
                  onClick={() => handleSelectResult(cabinet)}
                  className={`p-3 rounded cursor-pointer mb-1 ${
                    selectedIndex === allResults.indexOf(cabinet)
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium dark:text-white">{cabinet._label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {cabinet._location} • {cabinet.adresse}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Base de connaissances */}
          {results.knowledge.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-sm text-gray-600 dark:text-gray-400 mb-2">
                📚 Base de connaissances ({results.knowledge.length})
              </h3>
              {results.knowledge.map((article) => (
                <div
                  key={`knowledge-${article.id}`}
                  onClick={() => handleSelectResult(article)}
                  className={`p-3 rounded cursor-pointer mb-1 ${
                    selectedIndex === allResults.indexOf(article)
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium dark:text-white">{article._label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {article._category}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {article._preview}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer avec raccourcis */}
        <div className="border-t dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 flex gap-4">
          <span>↑↓ Naviguer</span>
          <span>↵ Sélectionner</span>
          <span>ESC Fermer</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
