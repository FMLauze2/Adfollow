import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContratsPage = () => {
  const [contrats, setContrats] = useState([]);
  const [formData, setFormData] = useState({
    cabinet: '',
    adresse: '',
    code_postal: '',
    ville: '',
    praticiens: '',
    prix: '',
    date_envoi: '',
    date_reception: '',
  });

  // Récupérer les contrats existants
  const fetchContrats = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/contrats');
      setContrats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContrats();
  }, []);

  // Gestion des changements dans le formulaire
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Convertir praticiens en JSON
      const dataToSend = {
        ...formData,
        praticiens: JSON.parse(formData.praticiens), // attendre un tableau JSON en string
      };

      const res = await axios.post('http://localhost:4000/api/contrats', dataToSend);
      alert('Contrat créé avec succès !');
      setFormData({
        cabinet: '',
        adresse: '',
        code_postal: '',
        ville: '',
        praticiens: '',
        prix: '',
        date_envoi: '',
        date_reception: '',
      });
      fetchContrats(); // mettre à jour la liste
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création du contrat. Vérifie le format de praticiens (ex: ["Dr X","Dr Y"])');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Créer un contrat de service</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Cabinet :</label>
          <input name="cabinet" value={formData.cabinet} onChange={handleChange} required />
        </div>
        <div>
          <label>Adresse :</label>
          <input name="adresse" value={formData.adresse} onChange={handleChange} required />
        </div>
        <div>
          <label>Code postal :</label>
          <input name="code_postal" value={formData.code_postal} onChange={handleChange} required />
        </div>
        <div>
          <label>Ville :</label>
          <input name="ville" value={formData.ville} onChange={handleChange} required />
        </div>
        <div>
          <label>Praticiens (JSON array) :</label>
          <input
            name="praticiens"
            value={formData.praticiens}
            onChange={handleChange}
            placeholder='Ex: ["Dr X","Dr Y"]'
            required
          />
        </div>
        <div>
          <label>Prix :</label>
          <input
            name="prix"
            type="number"
            step="0.01"
            value={formData.prix}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Date d'envoi :</label>
          <input
            name="date_envoi"
            type="date"
            value={formData.date_envoi}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Date de réception :</label>
          <input
            name="date_reception"
            type="date"
            value={formData.date_reception}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Valider</button>
      </form>

      <h3>Liste des contrats</h3>
      <ul>
        {contrats.map((c) => (
          <li key={c.id_contrat}>
            {c.cabinet} - {c.ville} - Praticiens: {c.praticiens.join(', ')} - Prix: {c.prix}€
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContratsPage;
