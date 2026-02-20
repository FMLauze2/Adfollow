import React, { useState, useEffect, useRef } from 'react';

/**
 * Composant d'autocomplétion pour Code Postal et Ville
 * Utilise l'API geo.api.gouv.fr pour les données françaises
 * 
 * Props:
 * - codePostal: valeur du code postal
 * - ville: valeur de la ville
 * - onCodePostalChange: callback(newValue)
 * - onVilleChange: callback(newValue)
 * - required: boolean (optionnel)
 */
const VilleCodePostalInput = ({ 
  codePostal, 
  ville, 
  onCodePostalChange, 
  onVilleChange,
  required = false 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingCP, setIsLoadingCP] = useState(false);
  const [isLoadingVille, setIsLoadingVille] = useState(false);
  const suggestionsRef = useRef(null);

  // Fermer les suggestions si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche par code postal
  const searchByCodePostal = async (cp) => {
    if (!cp || cp.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoadingCP(true);
    try {
      const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom,code,codesPostaux&format=json&geometry=centre`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const results = data.map(commune => ({
          ville: commune.nom,
          codePostal: commune.codesPostaux[0] || cp,
          allCodes: commune.codesPostaux
        }));
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Erreur recherche code postal:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingCP(false);
    }
  };

  // Recherche par nom de ville
  const searchByVille = async (villeQuery) => {
    if (!villeQuery || villeQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoadingVille(true);
    try {
      const response = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(villeQuery)}&fields=nom,code,codesPostaux&format=json&geometry=centre&limit=10`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const results = [];
        data.forEach(commune => {
          // Si plusieurs codes postaux pour une ville, créer une entrée par code
          if (commune.codesPostaux && commune.codesPostaux.length > 0) {
            commune.codesPostaux.forEach(cp => {
              results.push({
                ville: commune.nom,
                codePostal: cp,
                allCodes: commune.codesPostaux
              });
            });
          }
        });
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Erreur recherche ville:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingVille(false);
    }
  };

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (codePostal && codePostal.length >= 2) {
        searchByCodePostal(codePostal);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [codePostal]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ville && ville.length >= 2 && suggestions.length === 0) {
        searchByVille(ville);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [ville]);

  const handleSelectSuggestion = (suggestion) => {
    onCodePostalChange(suggestion.codePostal);
    onVilleChange(suggestion.ville);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleCodePostalInput = (e) => {
    const value = e.target.value;
    onCodePostalChange(value);
    if (value.length >= 2) {
      searchByCodePostal(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleVilleInput = (e) => {
    const value = e.target.value;
    onVilleChange(value);
    if (value.length >= 2) {
      searchByVille(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 relative" ref={suggestionsRef}>
      {/* Code Postal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Code Postal {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={codePostal}
          onChange={handleCodePostalInput}
          onFocus={() => codePostal.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="75001"
          required={required}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isLoadingCP && (
          <p className="text-xs text-gray-500 mt-1">🔍 Recherche...</p>
        )}
      </div>

      {/* Ville */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ville {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={ville}
          onChange={handleVilleInput}
          onFocus={() => ville.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Paris"
          required={required}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isLoadingVille && (
          <p className="text-xs text-gray-500 mt-1">🔍 Recherche...</p>
        )}
      </div>

      {/* Liste des suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.codePostal}-${suggestion.ville}-${index}`}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{suggestion.ville}</span>
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {suggestion.codePostal}
                </span>
              </div>
              {suggestion.allCodes && suggestion.allCodes.length > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  Autres CP: {suggestion.allCodes.filter(cp => cp !== suggestion.codePostal).join(', ')}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VilleCodePostalInput;
