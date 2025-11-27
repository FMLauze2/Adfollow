import React, { useState, useEffect } from "react";
import axios from "axios";

const InstallationsPage = () => {
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [typeFilter, setTypeFilter] = useState("Tous");
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    cabinet: "",
    date_rdv: "",
    heure_rdv: "",
    type_rdv: "Installation",
    adresse: "",
    code_postal: "",
    ville: "",
    praticiens: [],
    notes: ""
  });
  
  const [praticienForm, setPraticienForm] = useState({ nom: "", prenom: "" });
  
  // Modal états
  const [editingRdv, setEditingRdv] = useState(null);
  const [completeModalRdv, setCompleteModalRdv] = useState(null);
  const [grcText, setGrcText] = useState("");
  const [copiedGrc, setCopiedGrc] = useState(false);
  const [showContratForm, setShowContratForm] = useState(false);
  const [contratPrix, setContratPrix] = useState("");
  const [creatingContrat, setCreatingContrat] = useState(false);

  useEffect(() => {
    fetchRendezvous();
  }, []);

  const fetchRendezvous = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:4000/api/rendez-vous");
      setRendezvous(response.data || []);
    } catch (error) {
      console.error("Erreur chargement RDV:", error);
      alert("Erreur lors du chargement des rendez-vous");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Préparer les données avec date au format ISO sans timezone
      const submitData = {
        ...form,
        date_rdv: form.date_rdv // Garder le format YYYY-MM-DD simple
      };
      
      if (editingRdv) {
        await axios.put(`http://localhost:4000/api/rendez-vous/${editingRdv.id_rdv}`, submitData);
        alert("Rendez-vous modifié !");
      } else {
        await axios.post("http://localhost:4000/api/rendez-vous", submitData);
        alert("Rendez-vous créé !");
      }
      
      resetForm();
      fetchRendezvous();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      cabinet: "",
      date_rdv: "",
      heure_rdv: "",
      type_rdv: "Installation",
      adresse: "",
      code_postal: "",
      ville: "",
      praticiens: [],
      notes: ""
    });
    setPraticienForm({ nom: "", prenom: "" });
    setEditingRdv(null);
    setShowForm(false);
  };

  const handleFillTestData = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    setForm(prev => ({
      cabinet: prev.cabinet || "Cabinet Test RDV",
      date_rdv: prev.date_rdv || dateStr,
      heure_rdv: prev.heure_rdv || "14:00",
      type_rdv: prev.type_rdv || "Installation",
      adresse: prev.adresse || "123 Rue de Test",
      code_postal: prev.code_postal || "75001",
      ville: prev.ville || "Paris",
      praticiens: prev.praticiens.length > 0 ? prev.praticiens : [
        { nom: "Dupont", prenom: "Jean" },
        { nom: "Martin", prenom: "Sophie" }
      ],
      notes: prev.notes || "Installation complète avec formation des praticiens"
    }));
  };

  const handleEdit = (rdv) => {
    setEditingRdv(rdv);
    setForm({
      cabinet: rdv.cabinet,
      date_rdv: rdv.date_rdv ? rdv.date_rdv.split('T')[0] : '', // Extraire uniquement YYYY-MM-DD
      heure_rdv: rdv.heure_rdv || '',
      type_rdv: rdv.type_rdv,
      adresse: rdv.adresse,
      code_postal: rdv.code_postal,
      ville: rdv.ville,
      praticiens: rdv.praticiens || [],
      notes: rdv.notes || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce rendez-vous ?")) return;
    
    try {
      await axios.delete(`http://localhost:4000/api/rendez-vous/${id}`);
      alert("Rendez-vous supprimé");
      fetchRendezvous();
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleComplete = async (rdv) => {
    try {
      const response = await axios.post(`http://localhost:4000/api/rendez-vous/${rdv.id_rdv}/complete`);
      setGrcText(response.data.grcText);
      setCompleteModalRdv(rdv);
      setCopiedGrc(false);
      setShowContratForm(false);
      setContratPrix("");
      fetchRendezvous();
    } catch (error) {
      console.error("Erreur marquage effectué:", error);
      alert("Erreur lors du marquage comme effectué");
    }
  };

  const handleCreateContrat = async () => {
    if (!contratPrix || parseFloat(contratPrix) <= 0) {
      alert("Veuillez entrer un prix valide");
      return;
    }
    
    setCreatingContrat(true);
    try {
      await axios.post(
        `http://localhost:4000/api/rendez-vous/${completeModalRdv.id_rdv}/create-contrat`,
        { prix: parseFloat(contratPrix) }
      );
      alert("Contrat créé et lié au rendez-vous !");
      setCompleteModalRdv(null);
      setShowContratForm(false);
      setContratPrix("");
      fetchRendezvous();
    } catch (error) {
      console.error("Erreur création contrat:", error);
      alert(error.response?.data?.error || "Erreur lors de la création du contrat");
    } finally {
      setCreatingContrat(false);
    }
  };

  const downloadICS = async (rdv) => {
    try {
      const response = await axios.get(
        `http://localhost:4000/api/rendez-vous/${rdv.id_rdv}/ics`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RDV_${rdv.cabinet}_${rdv.date_rdv}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Erreur téléchargement ICS:", error);
      alert("Erreur lors du téléchargement du fichier");
    }
  };

  const copyGrcToClipboard = () => {
    navigator.clipboard.writeText(grcText);
    setCopiedGrc(true);
    setTimeout(() => setCopiedGrc(false), 2000);
  };

  const addPraticien = () => {
    if (!praticienForm.nom || !praticienForm.prenom) {
      alert("Veuillez remplir nom et prénom");
      return;
    }
    setForm(prev => ({
      ...prev,
      praticiens: [...prev.praticiens, { ...praticienForm }]
    }));
    setPraticienForm({ nom: "", prenom: "" });
  };

  const removePraticien = (index) => {
    setForm(prev => ({
      ...prev,
      praticiens: prev.praticiens.filter((_, i) => i !== index)
    }));
  };

  const getStatusBadge = (statut) => {
    const colors = {
      "Planifié": "bg-blue-100 text-blue-800",
      "Effectué": "bg-green-100 text-green-800",
      "Annulé": "bg-red-100 text-red-800"
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[statut] || "bg-gray-100 text-gray-800"}`}>
        {statut}
      </span>
    );
  };

  const filteredRdv = rendezvous.filter(rdv => {
    const matchesSearch = rdv.cabinet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rdv.ville.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "Tous" || rdv.statut === statusFilter;
    const matchesType = typeFilter === "Tous" || rdv.type_rdv === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Rendez-vous</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? "Annuler" : "+ Nouveau RDV"}
        </button>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Rechercher (cabinet, ville)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded flex-1 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-4 py-2 rounded"
        >
          <option value="Tous">Tous les statuts</option>
          <option value="Planifié">Planifié</option>
          <option value="Effectué">Effectué</option>
          <option value="Annulé">Annulé</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border px-4 py-2 rounded"
        >
          <option value="Tous">Tous les types</option>
          <option value="Installation">Installation</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Autre">Autre</option>
        </select>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow">
          <h3 className="text-xl font-semibold mb-4">
            {editingRdv ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cabinet *</label>
                <input
                  type="text"
                  required
                  value={form.cabinet}
                  onChange={(e) => setForm({ ...form, cabinet: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  required
                  value={form.type_rdv}
                  onChange={(e) => setForm({ ...form, type_rdv: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="Installation">Installation</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={form.date_rdv}
                  onChange={(e) => setForm({ ...form, date_rdv: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Heure *</label>
                <input
                  type="time"
                  required
                  value={form.heure_rdv}
                  onChange={(e) => setForm({ ...form, heure_rdv: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Adresse *</label>
                <input
                  type="text"
                  required
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code Postal *</label>
                <input
                  type="text"
                  required
                  value={form.code_postal}
                  onChange={(e) => setForm({ ...form, code_postal: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ville *</label>
                <input
                  type="text"
                  required
                  value={form.ville}
                  onChange={(e) => setForm({ ...form, ville: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </div>

            {/* Praticiens */}
            <div>
              <label className="block text-sm font-medium mb-2">Praticiens</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Nom"
                  value={praticienForm.nom}
                  onChange={(e) => setPraticienForm({ ...praticienForm, nom: e.target.value })}
                  className="border px-3 py-2 rounded flex-1"
                />
                <input
                  type="text"
                  placeholder="Prénom"
                  value={praticienForm.prenom}
                  onChange={(e) => setPraticienForm({ ...praticienForm, prenom: e.target.value })}
                  className="border px-3 py-2 rounded flex-1"
                />
                <button
                  type="button"
                  onClick={addPraticien}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  +
                </button>
              </div>
              <div className="space-y-1">
                {form.praticiens.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded">
                    <span>{p.prenom} {p.nom}</span>
                    <button
                      type="button"
                      onClick={() => removePraticien(i)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows="3"
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "⏳" : editingRdv ? "Modifier" : "Créer"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
              >
                Annuler
              </button>
              {!editingRdv && (
                <button
                  type="button"
                  onClick={handleFillTestData}
                  className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600"
                >
                  🧪 Données test
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Liste des RDV */}
      {loading && !showForm ? (
        <p>Chargement...</p>
      ) : (
        <div className="grid gap-4">
          {filteredRdv.map(rdv => (
            <div key={rdv.id_rdv} className="bg-white border rounded-lg p-4 shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{rdv.cabinet}</h3>
                  <p className="text-sm text-gray-600">{rdv.type_rdv}</p>
                </div>
                {getStatusBadge(rdv.statut)}
              </div>
              
              <div className="text-sm space-y-1 mb-3">
                <p><strong>📅 Date:</strong> {rdv.date_rdv.split('T')[0].split('-').reverse().join('/')} à {rdv.heure_rdv}</p>
                <p><strong>📍 Lieu:</strong> {rdv.adresse}, {rdv.code_postal} {rdv.ville}</p>
                {rdv.praticiens && rdv.praticiens.length > 0 && (
                  <p><strong>👥 Praticiens:</strong> {rdv.praticiens.map(p => `${p.prenom} ${p.nom}`).join(', ')}</p>
                )}
                {rdv.notes && <p><strong>📝 Notes:</strong> {rdv.notes}</p>}
                {rdv.id_contrat && (
                  <p className="text-green-600"><strong>📄 Contrat lié:</strong> #{rdv.id_contrat}</p>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => downloadICS(rdv)}
                  className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                >
                  📅 Télécharger .ics
                </button>
                {rdv.statut === "Planifié" && (
                  <button
                    onClick={() => handleComplete(rdv)}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    ✓ Marquer comme Effectué
                  </button>
                )}
                <button
                  onClick={() => handleEdit(rdv)}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  ✏️ Modifier
                </button>
                <button
                  onClick={() => handleDelete(rdv.id_rdv)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
          {filteredRdv.length === 0 && (
            <p className="text-gray-500 text-center py-8">Aucun rendez-vous trouvé</p>
          )}
        </div>
      )}

      {/* Modal Marquer comme Effectué */}
      {completeModalRdv && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">RDV Effectué - {completeModalRdv.cabinet}</h3>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Texte GRC à copier:</label>
                <button
                  onClick={copyGrcToClipboard}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  {copiedGrc ? "✓ Copié !" : "📋 Copier"}
                </button>
              </div>
              <textarea
                value={grcText}
                readOnly
                rows="10"
                className="w-full border px-3 py-2 rounded bg-gray-50 font-mono text-sm"
              />
            </div>

            {!completeModalRdv.id_contrat && (
              <div className="border-t pt-4 mb-4">
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={showContratForm}
                    onChange={(e) => setShowContratForm(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Créer un contrat de service pour ce RDV</span>
                </label>
                
                {showContratForm && (
                  <div className="ml-6 space-y-2">
                    <label className="block text-sm font-medium">Prix du contrat (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={contratPrix}
                      onChange={(e) => setContratPrix(e.target.value)}
                      placeholder="Ex: 1500.00"
                      className="border px-3 py-2 rounded w-full"
                    />
                    <button
                      onClick={handleCreateContrat}
                      disabled={creatingContrat}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      {creatingContrat ? "⏳ Création..." : "Créer le contrat"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setCompleteModalRdv(null)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 w-full"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallationsPage;