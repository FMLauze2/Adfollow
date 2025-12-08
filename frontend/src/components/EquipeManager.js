import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EquipeManager = ({ onClose }) => {
  const [devs, setDevs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDev, setEditingDev] = useState(null);
  const [form, setForm] = useState({
    initiales: '',
    nom_complet: '',
    role: ''
  });

  useEffect(() => {
    fetchDevs();
  }, []);

  const fetchDevs = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/equipe');
      setDevs(response.data);
    } catch (error) {
      console.error('Erreur chargement équipe:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingDev) {
        await axios.put(`http://localhost:4000/api/equipe/${editingDev.id_dev}`, {
          ...form,
          actif: true
        });
        alert('Développeur mis à jour !');
      } else {
        await axios.post('http://localhost:4000/api/equipe', form);
        alert('Développeur ajouté !');
      }
      
      setForm({ initiales: '', nom_complet: '', role: '' });
      setEditingDev(null);
      setShowForm(false);
      fetchDevs();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (dev) => {
    setEditingDev(dev);
    setForm({
      initiales: dev.initiales,
      nom_complet: dev.nom_complet,
      role: dev.role || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Désactiver ce développeur ?')) return;
    
    try {
      await axios.delete(`http://localhost:4000/api/equipe/${id}`);
      alert('Développeur désactivé !');
      fetchDevs();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            👥 Gestion de l'Équipe
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ✕
          </button>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? '✕ Annuler' : '+ Ajouter un développeur'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Initiales *
                </label>
                <input
                  type="text"
                  value={form.initiales}
                  onChange={(e) => setForm({ ...form, initiales: e.target.value.toUpperCase() })}
                  placeholder="JD"
                  maxLength="10"
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-white uppercase"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={form.nom_complet}
                  onChange={(e) => setForm({ ...form, nom_complet: e.target.value })}
                  placeholder="Jean Dupont"
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rôle
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Développeur Full Stack"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {editingDev ? '💾 Mettre à jour' : '✓ Ajouter'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingDev(null);
                  setForm({ initiales: '', nom_complet: '', role: '' });
                }}
                className="bg-white text-red-600 border border-red-300 px-4 py-2 rounded hover:bg-red-50"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {devs.map((dev) => (
            <div
              key={dev.id_dev}
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                  {dev.initiales}
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">
                    {dev.nom_complet}
                  </div>
                  {dev.role && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {dev.role}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(dev)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(dev.id_dev)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          
          {devs.length === 0 && (
            <p className="text-center text-gray-500 py-8">Aucun développeur dans l'équipe</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-white text-red-600 px-6 py-3 rounded hover:bg-red-50 hover:text-red-700 border border-red-300 font-semibold"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default EquipeManager;
