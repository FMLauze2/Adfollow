import React, { useState } from 'react';
import axios from 'axios';

const ContratsForm = () => {
  const [cabinet, setCabinet] = useState('');
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [praticiensInput, setPraticiensInput] = useState(''); // saisie utilisateur
  const [prix, setPrix] = useState('');
  const [dateEnvoi, setDateEnvoi] = useState('');
  const [dateReception, setDateReception] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Transformer la saisie en tableau JS
    const praticiensArray = praticiensInput
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0); // éviter les éléments vides

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
      const response = await axios.post('http://localhost:4000/api/contrats', newContrat);
      alert('Contrat créé avec succès !');
      console.log(response.data);

      // Reset formulaire
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
    }
  };

  return (
    <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md space-y-4"
      >
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Cabinet</label>
          <input
            type="text"
            value={cabinet}
            onChange={e => setCabinet(e.target.value)}
            required
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Adresse</label>
          <input
            type="text"
            value={adresse}
            onChange={e => setAdresse(e.target.value)}
            required
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Code Postal</label>
          <input
            type="text"
            value={codePostal}
            onChange={e => setCodePostal(e.target.value)}
            required
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Ville</label>
          <input
            type="text"
            value={ville}
            onChange={e => setVille(e.target.value)}
            required
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Date d'envoi</label>
          <input
            type="date"
            value={dateEnvoi}
            onChange={e => setDateEnvoi(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Date de réception</label>
          <input
            type="date"
            value={dateReception}
            onChange={e => setDateReception(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Valider
        </button>
      </form>

  );
};

export default ContratsForm;
