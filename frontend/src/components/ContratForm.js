// components/ContratsForm.js
import React, { useState } from 'react';
import axios from 'axios';

const ContratsForm = () => {
  const [cabinet, setCabinet] = useState('');
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [praticiensInput, setPraticiensInput] = useState('');
  const [prix, setPrix] = useState('');
  const [dateEnvoi, setDateEnvoi] = useState('');
  const [dateReception, setDateReception] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const praticiensArray = praticiensInput
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const newContrat = {
      cabinet,
      adresse,
      code_postal: codePostal,
      ville,
      praticiens: praticiensArray,
      prix: parseFloat(prix),
      date_envoi: dateEnvoi || null,
      date_reception: dateReception || null
    };

    try {
      await axios.post('http://localhost:4000/api/contrats', newContrat);
      alert('Contrat créé avec succès !');

      setCabinet('');
      setAdresse('');
      setCodePostal('');
      setVille('');
      setPraticiensInput('');
      setPrix('');
      setDateEnvoi('');
      setDateReception('');

    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création du contrat');
    } finally {
      setLoading(false);
    }
  };

  const handleFillTestData = (e) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    setCabinet('Cabinet Test');
    setAdresse('123 Rue de Test');
    setCodePostal('75000');
    setVille('Paris');
    setPraticiensInput('Dr. Dupont, Dr. Martin, Dr. Leclerc');
    setPrix('1500.00');
    setDateEnvoi(today);
    setDateReception(tomorrow);
  };

  return (
    <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md space-y-4"
      >
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .spinner {
            animation: spin 1s linear infinite;
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
          }
        `}</style>
        
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Cabinet</label>
          <input
            type="text"
            value={cabinet}
            onChange={e => setCabinet(e.target.value)}
            required
            disabled={loading}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Adresse</label>
          <input
            type="text"
            value={adresse}
            onChange={e => setAdresse(e.target.value)}
            required
            disabled={loading}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Code Postal</label>
          <input
            type="text"
            value={codePostal}
            onChange={e => setCodePostal(e.target.value)}
            required
            disabled={loading}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Ville</label>
          <input
            type="text"
            value={ville}
            onChange={e => setVille(e.target.value)}
            required
            disabled={loading}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">
            Praticiens (séparés par des virgules)
          </label>
          <input
            type="text"
            value={praticiensInput}
            onChange={e => setPraticiensInput(e.target.value)}
            required
            disabled={loading}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Prix (€)</label>
          <input
            type="number"
            step="0.01"
            value={prix}
            onChange={e => setPrix(e.target.value)}
            required
            disabled={loading}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Date d'envoi</label>
          <input
            type="date"
            value={dateEnvoi}
            onChange={e => setDateEnvoi(e.target.value)}
            disabled={loading}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Date de réception</label>
          <input
            type="date"
            value={dateReception}
            onChange={e => setDateReception(e.target.value)}
            disabled={loading}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleFillTestData}
            disabled={loading}
            className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded shadow transition"
          >
            📝 Test
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 font-semibold py-2 px-4 rounded shadow text-white flex items-center justify-center gap-2 transition ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Génération du PDF en cours...
              </>
            ) : (
              'Valider'
            )}
          </button>
        </div>
      </form>
  );
};

export default ContratsForm;
