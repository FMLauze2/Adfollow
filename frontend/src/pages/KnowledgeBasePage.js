import React, { useState, useEffect } from "react";
import axios from "axios";

function KnowledgeBasePage() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titre: "",
    contenu: "",
    categorie: "Technique",
    tags: "",
    auteur: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({
    "Matériel": true,
    "Mise à jour": true,
    "Medoc": true,
    "Tables & Bases": true,
    "Infrastructure": true,
    "Autre": true
  });

  // Structure hiérarchique des catégories
  const categoryGroups = {
    "Matériel": [
      "Lecteur de carte vitale",
      "Imprimante",
      "Scanner"
    ],
    "Mise à jour": [],
    "Medoc": [
      { label: "Facturation", subcategories: [
        "Medoc - Facturation",
        "Medoc - Comptabilité",
        "Medoc - Télétransmission",
        "Medoc - Rejets",
        "Medoc - FSE",
        "Medoc - SCOR"
      ]},
      { label: "Dossier patient", subcategories: [
        "Medoc - Ordonnances",
        "Medoc - Prescriptions",
        "Medoc - Biologies",
        "Medoc - Dictée vocales"
      ]},
      { label: "Autres", subcategories: [
        "Medoc - Courrier",
        "Medoc - Mode visite",
        "Medoc - Agenda"
      ]},
      { label: "Messagerie", subcategories: [
        "Medoc - Messagerie interne",
        "Medoc - Messagerie sécurisée"
      ]}
    ],
    "Tables & Bases": [
      "TBL CCAM & règlementaires",
      "Bases médicamenteuses"
    ],
    "Infrastructure": [
      "Réseau",
      "Windows",
      "Antivirus"
    ],
    "Autre": []
  };

  // Liste plate pour le formulaire
  const categoriesPredef = [
    "Lecteur de carte vitale",
    "Imprimante",
    "Scanner",
    "Mise à jour",
    "Medoc - Facturation",
    "Medoc - Comptabilité",
    "Medoc - Télétransmission",
    "Medoc - Rejets",
    "Medoc - FSE",
    "Medoc - SCOR",
    "Medoc - Ordonnances",
    "Medoc - Prescriptions",
    "Medoc - Biologies",
    "Medoc - Dictée vocales",
    "Medoc - Courrier",
    "Medoc - Mode visite",
    "Medoc - Agenda",
    "Medoc - Messagerie interne",
    "Medoc - Messagerie sécurisée",
    "TBL CCAM & règlementaires",
    "Bases médicamenteuses",
    "Réseau",
    "Windows",
    "Antivirus",
    "Autre"
  ];

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, searchQuery, selectedCategory]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:4000/api/knowledge");
      setArticles(response.data || []);
    } catch (error) {
      console.error("Erreur chargement articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/knowledge/meta/categories");
      setCategories(response.data || []);
    } catch (error) {
      console.error("Erreur chargement catégories:", error);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    if (selectedCategory !== "Toutes") {
      filtered = filtered.filter(a => a.categorie === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.titre.toLowerCase().includes(query) ||
        a.contenu.toLowerCase().includes(query) ||
        (a.tags && a.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    setFilteredArticles(filtered);
  };

  const handleViewArticle = async (article) => {
    try {
      const response = await axios.get(`http://localhost:4000/api/knowledge/${article.id_article}`);
      setSelectedArticle(response.data);
      setShowModal(true);
    } catch (error) {
      console.error("Erreur chargement article:", error);
    }
  };

  const handleMarkHelpful = async (id) => {
    try {
      await axios.post(`http://localhost:4000/api/knowledge/${id}/helpful`);
      fetchArticles();
      if (selectedArticle && selectedArticle.id_article === id) {
        setSelectedArticle({ ...selectedArticle, utile: selectedArticle.utile + 1 });
      }
    } catch (error) {
      console.error("Erreur marquage utile:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };

      if (editingId) {
        await axios.put(`http://localhost:4000/api/knowledge/${editingId}`, data);
        alert("Article modifié !");
      } else {
        await axios.post("http://localhost:4000/api/knowledge", data);
        alert("Article créé !");
      }

      resetForm();
      fetchArticles();
      fetchCategories();
    } catch (error) {
      console.error("Erreur sauvegarde article:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleEdit = (article) => {
    setFormData({
      titre: article.titre,
      contenu: article.contenu,
      categorie: article.categorie,
      tags: article.tags ? article.tags.join(', ') : '',
      auteur: article.auteur || ''
    });
    setEditingId(article.id_article);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet article ?")) return;

    try {
      await axios.delete(`http://localhost:4000/api/knowledge/${id}`);
      alert("Article supprimé");
      fetchArticles();
      fetchCategories();
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setFormData({
      titre: "",
      contenu: "",
      categorie: "Technique",
      tags: "",
      auteur: ""
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getCategoryIcon = (categorie) => {
    const icons = {
      // Matériel
      "Lecteur de carte vitale": "💳",
      "Imprimante": "🖨️",
      "Scanner": "📄",
      
      // Mises à jour
      "Mise à jour": "🔄",
      
      // Medoc - Facturation
      "Medoc - Facturation": "💰",
      "Medoc - Comptabilité": "📊",
      "Medoc - Télétransmission": "📡",
      "Medoc - Rejets": "❌",
      "Medoc - FSE": "🧾",
      "Medoc - SCOR": "🔐",
      
      // Medoc - Dossier patient
      "Medoc - Ordonnances": "📝",
      "Medoc - Prescriptions": "💊",
      "Medoc - Biologies": "🧪",
      "Medoc - Dictée vocales": "🎤",
      
      // Medoc - Autres
      "Medoc - Courrier": "✉️",
      "Medoc - Mode visite": "🚗",
      "Medoc - Agenda": "📅",
      
      // Medoc - Messagerie
      "Medoc - Messagerie interne": "💬",
      "Medoc - Messagerie sécurisée": "🔒",
      
      // Tables et références
      "TBL CCAM & règlementaires": "📋",
      "Bases médicamenteuses": "💊",
      
      // Infrastructure
      "Réseau": "🌐",
      "Windows": "🪟",
      "Antivirus": "🛡️",
      
      // Divers
      "Autre": "📌"
    };
    return icons[categorie] || "📄";
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📚 Base de connaissances</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? "✕ Fermer" : "➕ Nouvel article"}
        </button>
      </div>

      {/* Formulaire création/édition */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Modifier l'article" : "Nouvel article"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  required
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Ex: Résoudre erreur connexion HFSQL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie *</label>
                  <select
                    value={formData.categorie}
                    onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                    required
                    className="w-full border px-3 py-2 rounded"
                  >
                    {categoriesPredef.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Auteur</label>
                  <input
                    type="text"
                    value={formData.auteur}
                    onChange={(e) => setFormData({ ...formData, auteur: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags (séparés par virgule)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Ex: HFSQL, réseau, erreur connexion"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contenu * (Markdown supporté)</label>
                <textarea
                  value={formData.contenu}
                  onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                  required
                  rows="12"
                  className="w-full border px-3 py-2 rounded font-mono text-sm"
                  placeholder="Décrivez le problème, la solution, les étapes..."
                />
              </div>

              <div className="flex gap-2 justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      titre: "Test - Configuration HFSQL Client/Serveur",
                      contenu: `# Problème
Erreur de connexion au serveur HFSQL lors de l'accès aux bases de données.

## Symptômes
- Message d'erreur : "Impossible de se connecter au serveur"
- Timeout après 30 secondes
- Les postes clients ne peuvent pas accéder aux données

## Solution

### Étape 1 : Vérifier le pare-feu
1. Ouvrir le Pare-feu Windows
2. Vérifier que le port 4900 (défaut HFSQL) est ouvert
3. Créer une règle entrante si nécessaire

### Étape 2 : Vérifier le service HFSQL
1. Ouvrir services.msc
2. Rechercher "HFSQL Server"
3. Vérifier qu'il est démarré
4. Redémarrer si nécessaire

### Étape 3 : Configuration réseau
- IP du serveur : 192.168.1.100
- Port : 4900
- Base de données : MEDOC_DATA

## Commandes utiles
\`\`\`
netstat -an | findstr 4900
telnet 192.168.1.100 4900
\`\`\`

## Temps d'intervention estimé
15-30 minutes`,
                      categorie: "Réseau",
                      tags: "HFSQL, réseau, connexion, dépannage",
                      auteur: "Support Technique"
                    });
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                >
                  🧪 Remplir avec test
                </button>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                  >
                    {editingId ? "Modifier" : "Créer"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Layout avec sidebar */}
      <div className="flex gap-6">
        {/* Sidebar catégories */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-lg p-4 sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Catégories</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory("Toutes")}
                className={`w-full text-left px-3 py-2 rounded transition text-sm ${
                  selectedCategory === "Toutes"
                    ? "bg-blue-500 text-white font-semibold"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                📚 Toutes ({articles.length})
              </button>

              {/* Groupes de catégories avec dropdowns */}
              {Object.entries(categoryGroups).map(([groupName, groupContent]) => {
                const groupCategories = Array.isArray(groupContent) && groupContent.length > 0 && typeof groupContent[0] === 'string'
                  ? groupContent
                  : [];
                
                const hasSubgroups = Array.isArray(groupContent) && groupContent.some(item => typeof item === 'object');
                
                // Calculer le nombre total d'articles dans ce groupe
                const groupCount = categories
                  .filter(cat => {
                    if (groupCategories.includes(cat.categorie)) return true;
                    if (hasSubgroups) {
                      return groupContent.some(subgroup => 
                        typeof subgroup === 'object' && subgroup.subcategories?.includes(cat.categorie)
                      );
                    }
                    return false;
                  })
                  .reduce((sum, cat) => sum + cat.count, 0);

                return (
                  <div key={groupName} className="mb-2">
                    {/* Titre du groupe */}
                    <button
                      onClick={() => toggleGroup(groupName)}
                      className="w-full text-left px-3 py-2 rounded transition text-sm font-semibold hover:bg-gray-100 text-gray-800 flex items-center justify-between"
                    >
                      <span>
                        {groupName === "Matériel" && "🖥️"}
                        {groupName === "Mise à jour" && "🔄"}
                        {groupName === "Medoc" && "⚕️"}
                        {groupName === "Tables & Bases" && "📋"}
                        {groupName === "Infrastructure" && "🌐"}
                        {groupName === "Autre" && "📌"}
                        {" "}{groupName} {groupCount > 0 && `(${groupCount})`}
                      </span>
                      <span className="text-xs">{expandedGroups[groupName] ? "▼" : "▶"}</span>
                    </button>

                    {/* Contenu du groupe */}
                    {expandedGroups[groupName] && (
                      <div className="ml-3 mt-1 space-y-1">
                        {/* Catégories directes */}
                        {groupCategories.map(cat => {
                          const categoryData = categories.find(c => c.categorie === cat);
                          const count = categoryData ? categoryData.count : 0;
                          return (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`w-full text-left px-3 py-2 rounded transition text-sm ${
                                selectedCategory === cat
                                  ? "bg-blue-500 text-white font-semibold"
                                  : "hover:bg-gray-100 text-gray-700"
                              }`}
                            >
                              {getCategoryIcon(cat)} {cat} ({count})
                            </button>
                          );
                        })}

                        {/* Sous-groupes (pour Medoc) */}
                        {hasSubgroups && groupContent.map(subgroup => {
                          if (typeof subgroup !== 'object') return null;
                          
                          const subgroupCount = categories
                            .filter(cat => subgroup.subcategories?.includes(cat.categorie))
                            .reduce((sum, cat) => sum + cat.count, 0);

                          return (
                            <div key={subgroup.label} className="ml-2">
                              <div className="font-medium text-xs text-gray-600 px-3 py-1 mt-2">
                                {subgroup.label} {subgroupCount > 0 && `(${subgroupCount})`}
                              </div>
                              {subgroup.subcategories?.map(cat => {
                                const categoryData = categories.find(c => c.categorie === cat);
                                const count = categoryData ? categoryData.count : 0;
                                return (
                                  <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`w-full text-left px-3 py-2 rounded transition text-sm ${
                                      selectedCategory === cat
                                        ? "bg-blue-500 text-white font-semibold"
                                        : "hover:bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {getCategoryIcon(cat)} {cat.replace('Medoc - ', '')} ({count})
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1">
          {/* Barre de recherche */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Rechercher dans les articles..."
              className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Liste des articles */}
          {loading ? (
            <p className="text-center py-8">Chargement...</p>
          ) : filteredArticles.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <p className="text-gray-500 text-lg">Aucun article trouvé</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-blue-500 hover:text-blue-700"
                >
                  Réinitialiser la recherche
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredArticles.map(article => (
                <div
                  key={article.id_article}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 cursor-pointer" onClick={() => handleViewArticle(article)}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getCategoryIcon(article.categorie)}</span>
                        <h3 className="text-xl font-bold text-gray-800 hover:text-blue-600">
                          {article.titre}
                        </h3>
                      </div>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {article.contenu.substring(0, 200)}...
                      </p>

                      <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">{article.categorie}</span>
                        {article.tags && article.tags.map((tag, i) => (
                          <span key={i} className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                        <span>👁️ {article.vues} vues</span>
                        <span>👍 {article.utile} utile(s)</span>
                        {article.auteur && <span>✍️ {article.auteur}</span>}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(article)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(article.id_article)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal article complet */}
      {showModal && selectedArticle && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{getCategoryIcon(selectedArticle.categorie)}</span>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedArticle.titre}</h2>
                </div>
                <div className="flex gap-3 text-sm text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">{selectedArticle.categorie}</span>
                  <span>👁️ {selectedArticle.vues} vues</span>
                  <span>👍 {selectedArticle.utile} utile(s)</span>
                  {selectedArticle.auteur && <span>✍️ {selectedArticle.auteur}</span>}
                  <span>📅 {new Date(selectedArticle.date_creation).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {selectedArticle.tags && selectedArticle.tags.length > 0 && (
              <div className="flex gap-2 mb-4">
                {selectedArticle.tags.map((tag, i) => (
                  <span key={i} className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="prose max-w-none mb-6">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                {selectedArticle.contenu}
              </pre>
            </div>

            <div className="flex gap-3 justify-end border-t pt-4">
              <button
                onClick={() => handleMarkHelpful(selectedArticle.id_article)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                👍 Cet article m'a aidé
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
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

export default KnowledgeBasePage;
