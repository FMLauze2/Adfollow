import React, { useState, useEffect } from "react";
import ImportICS from "../components/ImportICS";
import VilleCodePostalInput from "../components/VilleCodePostalInput";
import api from "../api/Api";
import { showError, showSuccess } from "../utils/toast";
import { getChecklistForType } from "../utils/checklists";
import { getCachedRdv, setCachedRdv } from "../services/rdvCache";

const InstallationsSuiviPage = ({ onRetour }) => {
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [typeFilter, setTypeFilter] = useState("Tous");
  const [cabinetHistoryModal, setCabinetHistoryModal] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    cabinet: "",
    date_rdv: "",
    heure_rdv: "",
    type_rdv: "Installation serveur",
    adresse: "",
    code_postal: "",
    ville: "",
    telephone: "",
    email: "",
    praticiens: [],
    notes: ""
  });
  const [specificFields, setSpecificFields] = useState({});
  const [praticienForm, setPraticienForm] = useState({ nom: "", prenom: "" });
  const [editingRdv, setEditingRdv] = useState(null);
  const [completeModalRdv, setCompleteModalRdv] = useState(null);
  const [treatmentModalRdv, setTreatmentModalRdv] = useState(null);
  const [treatmentForm, setTreatmentForm] = useState({
    specificFields: {},
    praticiens: [],
    notes: "",
    checklist: []
  });
  const [grcText, setGrcText] = useState("");
  const [copiedGrc, setCopiedGrc] = useState(false);
  const [copiedRdvId, setCopiedRdvId] = useState(null);
  const [showContratForm, setShowContratForm] = useState(false);
  const [contratPrix, setContratPrix] = useState("");
  const [creatingContrat, setCreatingContrat] = useState(false);
  const [showImportICS, setShowImportICS] = useState(false);
  const [previewGrcModal, setPreviewGrcModal] = useState(null);
  const [previewGrcText, setPreviewGrcText] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rdvPerPage = 10;
  const [infosManquantesModal, setInfosManquantesModal] = useState({ open: false, rdv: null });
  const [sortOption, setSortOption] = useState("date_desc");

  const fetchRendezvous = async (force = false) => {
    setLoading(true);
    try {
      const cacheKey = showArchived ? "rdv_suivi_archived" : "rdv_suivi_active";

      if (!force) {
        const cached = getCachedRdv(cacheKey);
        if (cached) {
          setRendezvous(cached);
          setLoading(false);
          return;
        }
      }

      const url = showArchived ? "/rendez-vous?includeArchived=true" : "/rendez-vous";
      const response = await api.get(url);
      const data = response.data || [];
      setCachedRdv(cacheKey, data);
      setRendezvous(data);
    } catch (error) {
      console.error("Erreur chargement RDV:", error);
      showError("Erreur lors du chargement des rendez-vous");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRendezvous();
  }, [showArchived]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const traiterRdvId = urlParams.get("traiter");
    const newRdv = urlParams.get("new");

    if (traiterRdvId && rendezvous.length > 0) {
      const rdv = rendezvous.find((r) => r.id_rdv === parseInt(traiterRdvId, 10));
      if (rdv) {
        setTreatmentModalRdv(rdv);
        window.history.replaceState({}, "", "/installations");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    // Support pour ?new=1 afin d'ouvrir le formulaire de création
    if (newRdv === "1") {
      setShowForm(true);
      window.history.replaceState({}, "", "/installations");
    }
  }, [rendezvous]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, showArchived]);

  useEffect(() => {
    if (!treatmentModalRdv) return;

    let parsedSpecificFields = {};
    let parsedNotes = "";
    let savedChecklist = [];
    let parsedPraticiens = [];

    try {
      const notesData = JSON.parse(treatmentModalRdv.notes || "{}");
      parsedSpecificFields = notesData.specificFields || {};
      parsedNotes = notesData.generalNotes || "";
      savedChecklist = notesData.checklist || [];
    } catch {
      parsedNotes = treatmentModalRdv.notes || "";
    }

    // Normaliser les praticiens (peut être stocké en string JSON)
    if (Array.isArray(treatmentModalRdv.praticiens)) {
      parsedPraticiens = treatmentModalRdv.praticiens;
    } else if (typeof treatmentModalRdv.praticiens === "string") {
      try {
        const asArray = JSON.parse(treatmentModalRdv.praticiens);
        parsedPraticiens = Array.isArray(asArray) ? asArray : [];
      } catch {
        parsedPraticiens = [];
      }
    }

    const baseChecklist = getChecklistForType(treatmentModalRdv.type_rdv);
    const checklist = savedChecklist.length > 0 ? savedChecklist : baseChecklist;

    setTreatmentForm({
      specificFields: parsedSpecificFields,
      praticiens: parsedPraticiens,
      notes: parsedNotes,
      checklist: checklist
    });
  }, [treatmentModalRdv?.id_rdv, treatmentModalRdv?.notes, treatmentModalRdv?.praticiens, treatmentModalRdv?.type_rdv]);

  const handleArchiveRdv = async (idRdv) => {
    if (!window.confirm("Archiver ce rendez-vous ? Il sera masqué de la vue principale.")) return;
    
    try {
      await api.post(`/rendez-vous/archive/${idRdv}`);
      showSuccess("RDV archivé");
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur archivage:", error);
      showError("Erreur lors de l'archivage");
    }
  };

  const handleUnarchiveRdv = async (idRdv) => {
    try {
      await api.post(`/rendez-vous/unarchive/${idRdv}`);
      showSuccess("RDV restauré");
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur désarchivage:", error);
      showError("Erreur lors de la restauration");
    }
  };

  const handleAutoArchive = async () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthName = firstDayOfMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    const confirmMsg = `Archiver automatiquement tous les RDV effectués et facturés avant ${monthName} ?\n\n` +
                       `(Les installations complètes sans contrat de service seront préservées)`;
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const response = await api.post("/rendez-vous/auto-archive");
      
      showSuccess(`${response.data.archived} RDV archivé(s)`);
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur auto-archivage:", error);
      showError("Erreur lors de l'archivage automatique");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation stricte uniquement pour les installations
    const installationTypes = [
      "Installation serveur",
      "Installation poste secondaire",
      "Changement de poste serveur"
    ];
        if (installationTypes.includes(form.type_rdv)) {
          // Validation stricte : tous les champs string doivent être non vides, praticiens doit être un array non vide
          if (!form.email || typeof form.email !== "string" || form.email.trim() === "" ||
              !form.adresse || typeof form.adresse !== "string" || form.adresse.trim() === "" ||
              !form.code_postal || typeof form.code_postal !== "string" || form.code_postal.trim() === "" ||
              !form.ville || typeof form.ville !== "string" || form.ville.trim() === "" ||
              !Array.isArray(form.praticiens) || form.praticiens.length === 0) {
            showError("Merci de remplir Email, Adresse, Code Postal, Ville et Praticiens.");
            return;
          }
    }
    setLoading(true);
    
    try {
      // Construire les notes avec champs spécifiques en JSON
      const notesData = {
        specificFields: specificFields || {},
        generalNotes: form.notes || ""
      };
      
      // Préparer les données avec date au format ISO sans timezone
      const submitData = {
        ...form,
        date_rdv: form.date_rdv, // Garder le format YYYY-MM-DD simple
        notes: JSON.stringify(notesData),
        praticiens: form.praticiens || []
      };
      
      if (editingRdv) {
        await api.put(`/rendez-vous/${editingRdv.id_rdv}`, submitData);
        showSuccess("Rendez-vous modifié");
      } else {
        await api.post("/rendez-vous", submitData);
        showSuccess("Rendez-vous créé");
      }
      
      resetForm();
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur:", error);
      showError("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      cabinet: "",
      date_rdv: "",
      heure_rdv: "",
      type_rdv: "Installation serveur",
      adresse: "",
      code_postal: "",
      ville: "",
      telephone: "",
      email: "",
      praticiens: [],
      notes: ""
    });
    setSpecificFields({});
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
    
    // Parser les notes pour extraire les champs spécifiques
    let parsedNotes = "";
    let parsedSpecificFields = {};
    try {
      const notesData = JSON.parse(rdv.notes || "{}");
      parsedSpecificFields = notesData.specificFields || {};
      parsedNotes = notesData.generalNotes || "";
    } catch {
      parsedNotes = rdv.notes || "";
    }
    
    setForm({
      cabinet: rdv.cabinet,
      date_rdv: rdv.date_rdv ? rdv.date_rdv.split('T')[0] : '', // Extraire uniquement YYYY-MM-DD
      heure_rdv: rdv.heure_rdv || '',
      type_rdv: rdv.type_rdv,
      adresse: rdv.adresse,
      code_postal: rdv.code_postal,
      ville: rdv.ville,
      telephone: rdv.telephone || '',
      email: rdv.email || '',
      praticiens: rdv.praticiens || [],
      notes: parsedNotes
    });
    setSpecificFields(parsedSpecificFields);
    setShowForm(true);
    
    // Remonter automatiquement en haut pour voir le formulaire
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleDuplicate = (rdv) => {
    // Dupliquer un RDV existant
    let parsedNotes = '';
    let parsedSpecificFields = {};
    
    try {
      const notesData = JSON.parse(rdv.notes || '{}');
      parsedSpecificFields = notesData.specificFields || {};
      parsedNotes = notesData.generalNotes || '';
    } catch {
      parsedNotes = rdv.notes || '';
    }
    
    setEditingRdv(null); // Pas d'édition, c'est une création
    setForm({
      cabinet: rdv.cabinet,
      date_rdv: '', // Laisser vide pour nouvelle date
      heure_rdv: rdv.heure_rdv,
      type_rdv: rdv.type_rdv,
      adresse: rdv.adresse,
      code_postal: rdv.code_postal,
      ville: rdv.ville,
      telephone: rdv.telephone || '',
      email: rdv.email || '',
      praticiens: rdv.praticiens || [],
      notes: parsedNotes
    });
    setSpecificFields(parsedSpecificFields);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Convertit une chaîne "Prenom Nom, Autre" en tableau d'objets {prenom, nom}
  const parsePraticiensInput = (value) => {
    return value
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const [prenom, ...rest] = part.split(' ');
        return { prenom: prenom || '', nom: rest.join(' ') || '' };
      });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce rendez-vous ?")) return;
    
    try {
      await api.delete(`/rendez-vous/${id}`);
      showSuccess("Rendez-vous supprimé");
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur suppression:", error);
      showError("Erreur lors de la suppression");
    }
  };

  const handleComplete = async (rdv) => {
    // Pour les types avec checklist (ex: Formation), on force le passage par la modale de traitement
    // afin de ne pas perdre la checklist et les champs spécifiques avant de marquer comme effectué.
    const hasChecklist = getChecklistForType(rdv.type_rdv).length > 0;
    if (hasChecklist) {
      setTreatmentModalRdv(rdv);
      showError("Passe par 'Traiter' pour cocher/sauvegarder la checklist avant de marquer comme effectué.");
      return;
    }

    // Validation praticiens pour les installations
    const typeNeedsPraticiens = ["Installation serveur", "Formation", "Démo"];

    // Normaliser praticiens (peut être une string JSON)
    let praticiensParsed = [];
    if (Array.isArray(rdv.praticiens)) {
      praticiensParsed = rdv.praticiens;
    } else if (typeof rdv.praticiens === "string") {
      try {
        const parsed = JSON.parse(rdv.praticiens);
        praticiensParsed = Array.isArray(parsed) ? parsed : [];
      } catch {
        praticiensParsed = [];
      }
    }

    if (typeNeedsPraticiens.includes(rdv.type_rdv)) {
      if (!praticiensParsed || praticiensParsed.length === 0) {
        showError("Ajoutez au moins un praticien avant de marquer comme effectué.");
        return;
      }
    }
        
    // Validation email obligatoire pour Installation serveur
    if (rdv.type_rdv === "Installation serveur") {
      if (!rdv.email || typeof rdv.email !== "string" || rdv.email.trim() === "") {
        showError("Renseignez l'email du cabinet avant de marquer comme effectué.");
        return;
      }
    }
    
    try {
      const response = await api.post(`/rendez-vous/${rdv.id_rdv}/complete`);
      setGrcText(response.data.grcText);
      setCompleteModalRdv(rdv);
      setCopiedGrc(false);
      setShowContratForm(false);
      setContratPrix("");
      showSuccess("RDV marqué comme effectué");
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur marquage effectué:", error);
      showError("Erreur lors du marquage comme effectué");
    }
  };

  const handleFacturer = async (id) => {
    let praticiensParsed = [];
    // Trouver le RDV pour validation
    const rdv = rendezvous.find(r => r.id_rdv === id);
    if (rdv) {
      // Normaliser les praticiens (peuvent être stockés en JSON string)
      if (Array.isArray(rdv.praticiens)) {
        praticiensParsed = rdv.praticiens;
      } else if (typeof rdv.praticiens === "string") {
        try {
          const parsed = JSON.parse(rdv.praticiens);
          praticiensParsed = Array.isArray(parsed) ? parsed : [];
        } catch {
          praticiensParsed = [];
        }
      }

      const typeNeedsPraticiens = ["Installation serveur", "Formation", "Démo"];
      if (typeNeedsPraticiens.includes(rdv.type_rdv)) {
        if (!praticiensParsed || praticiensParsed.length === 0) {
          showError("Ajoutez au moins un praticien avant de facturer.");
          return;
        }
      }
      
      // Validation email obligatoire pour Installation serveur
      if (rdv.type_rdv === "Installation serveur") {
        if (!rdv.email || rdv.email.trim() === "") {
          showError("Renseignez l'email du cabinet avant de facturer.");
          return;
        }
        
        // Remplace la logique de création de contrat dans handleFacturer
        if (!rdv.id_contrat) {
          const createContrat = window.confirm("⚠️ Aucun contrat de service n'a été créé pour cette installation.\n\nVoulez-vous créer un contrat avant de facturer ?");
          if (createContrat) {
            const prix = prompt("Entrez le prix du contrat (€):");
            if (prix && parseFloat(prix) > 0) {
              await handleCreateContratWithCheck(rdv, prix);
              return; // On arrête ici pour attendre la complétion
            } else {
              return; // Annuler la facturation si pas de prix valide
            }
          }
        }
      }
    }
    
    if (!window.confirm("Marquer ce rendez-vous comme facturé ?")) return;
    
    try {
      // S'assurer que les praticiens sont bien enregistrés avant facturation
      if (rdv) {
        await api.put(`/rendez-vous/${id}`, { praticiens: praticiensParsed });
      }

      await api.post(`/rendez-vous/${id}/facturer`);
      showSuccess("Rendez-vous marqué comme facturé");
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur marquage facturé:", error);
      showError("Erreur lors du marquage comme facturé");
    }
  };

  const handleReplanifier = async (id) => {
    if (!window.confirm("Remettre ce rendez-vous à l'état 'Planifié' ?")) return;
    
    try {
      await api.post(`/rendez-vous/${id}/replanifier`);
      showSuccess("Rendez-vous remis à l'état Planifié");
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur replanification:", error);
      showError("Erreur lors de la replanification");
    }
  };

  const handleCreateContrat = async () => {
    if (!contratPrix || parseFloat(contratPrix) <= 0) {
      showError("Veuillez entrer un prix valide");
      return;
    }
    
    setCreatingContrat(true);
    try {
      await api.post(
        `/rendez-vous/${completeModalRdv.id_rdv}/create-contrat`,
        { prix: parseFloat(contratPrix) }
      );
      showSuccess("Contrat créé et lié au rendez-vous");
      setCompleteModalRdv(null);
      setShowContratForm(false);
      setContratPrix("");
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur création contrat:", error);
      showError(error.response?.data?.error || "Erreur lors de la création du contrat");
    } finally {
      setCreatingContrat(false);
    }
  };

  const handleRegenerateContrat = async (rdv) => {
    if (!window.confirm("Êtes-vous sûr de vouloir régénérer le contrat ?\n\nCela va recréer le PDF avec les informations actuelles du RDV.")) return;
    
    try {
      await api.post(
        `/rendez-vous/${rdv.id_rdv}/regenerate-contrat`
      );
      showSuccess("Contrat régénéré");
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur régénération contrat:", error);
      showError(error.response?.data?.error || "Erreur lors de la régénération du contrat");
    }
  };

  const downloadICS = async (rdv) => {
    try {
      const response = await api.get(
        `/rendez-vous/${rdv.id_rdv}/ics`,
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
      showError("Erreur lors du téléchargement du fichier");
    }
  };

  const copyGrcToClipboard = () => {
    navigator.clipboard.writeText(grcText);
    setCopiedGrc(true);
    setTimeout(() => setCopiedGrc(false), 2000);
  };

  const generateGrcText = (rdv) => {
    let notesData = {};
    try {
      notesData = JSON.parse(rdv.notes || '{}');
    } catch {
      notesData = { specificFields: {}, generalNotes: rdv.notes || '' };
    }

    const specificFields = notesData.specificFields || {};
    const generalNotes = notesData.generalNotes || rdv.notes || '';
    const checklist = notesData.checklist || [];

    let text = `RDV du ${rdv.date_rdv.split('T')[0].split('-').reverse().join('/')} à ${rdv.heure_rdv}\n`;
    text += `Cabinet: ${rdv.cabinet}\n`;
    text += `Type: ${rdv.type_rdv}\n`;
    text += `Adresse: ${rdv.adresse}, ${rdv.code_postal} ${rdv.ville}\n\n`;

    // Parser les praticiens si nécessaire (peut être une string JSON)
    let praticiens = rdv.praticiens;
    if (typeof praticiens === 'string') {
      try {
        praticiens = JSON.parse(praticiens);
      } catch {
        praticiens = [];
      }
    }

    if (praticiens && Array.isArray(praticiens) && praticiens.length > 0) {
      text += `Praticiens:\n`;
      praticiens.forEach(p => {
        if (typeof p === 'object' && p.prenom && p.nom) {
          text += `- ${p.prenom} ${p.nom}\n`;
        } else if (typeof p === 'string') {
          text += `- ${p}\n`;
        }
      });
      text += `\n`;
    }

    if (Object.keys(specificFields).length > 0) {
      text += `Détails techniques:\n`;
      for (const [key, value] of Object.entries(specificFields)) {
        if (value) {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          text += `- ${label}: ${value}\n`;
        }
      }
      text += `\n`;
    }

    // Afficher la checklist si elle existe
    if (checklist.length > 0) {
      text += `Checklist d'intervention:\n`;
      checklist.forEach(item => {
        const status = item.checked ? '✓' : '☐';
        text += `${status} ${item.label}\n`;
      });
      text += `\n`;
    }

    if (generalNotes) {
      text += `Notes:\n${generalNotes}`;
    }

    return text;
  };

  const copyGrcTextFromRdv = (rdv) => {
    const text = generateGrcText(rdv);
    setPreviewGrcText(text);
    setPreviewGrcModal(rdv);
    setCopiedRdvId(null);
  };

  const copyPreviewGrcToClipboard = () => {
    navigator.clipboard.writeText(previewGrcText);
    setCopiedRdvId(previewGrcModal?.id_rdv);
    setTimeout(() => setCopiedRdvId(null), 2000);
  };

  const addPraticien = () => {
    if (!praticienForm.nom || !praticienForm.prenom) {
      showError("Veuillez remplir nom et prénom");
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

  // Définition des champs spécifiques par type de RDV
  // Champs essentiels à saisir lors de la prise de RDV (Section 1)
  const getEssentialFieldsForType = (type) => {
    switch (type) {
      case "Installation serveur":
        return [
          { name: "nb_postes_secondaires", label: "Nombre de postes secondaires prévus", type: "number" }
        ];
      case "Installation poste secondaire":
        return [];
      case "Changement de poste serveur":
        return [];
      case "Formation":
        return [
          { name: "module_formation", label: "Module de formation", type: "text" },
          { name: "nb_participants", label: "Nombre de participants", type: "number" }
        ];
      case "Export BDD":
        return [
          { name: "format_export", label: "Format d'export souhaité", type: "text" }
        ];
      case "Mise à jour":
        return [
          { name: "version_cible", label: "Version ciblée", type: "text" }
        ];
      case "Démo":
        return [
          { name: "logiciel_metier", label: "Logiciel métier actuel du cabinet", type: "text" }
        ];
      case "Autre":
        return [
          { name: "type_intervention", label: "Type d'intervention", type: "text" }
        ];
      default:
        return [];
    }
  };

  // Champs détaillés à compléter lors de l'intervention (Section 2)
  const getDetailedFieldsForType = (type) => {
    switch (type) {
      case "Installation serveur":
        return [
          { name: "nom_poste_serveur", label: "Nom du poste serveur", type: "text" },
          { name: "type_poste_serveur", label: "Type de poste serveur", type: "text" },
          { name: "nb_lecteurs_carte", label: "Nombre de lecteurs de carte", type: "number" },
          { name: "type_lecteurs_carte", label: "Type de lecteurs de carte", type: "text" },
          { name: "fournisseur_lecteur", label: "Fournisseur lecteur de carte", type: "text" }
        ];
      case "Installation poste secondaire":
        return [
          { name: "nom_poste_serveur", label: "Nom du poste serveur", type: "text" },
          { name: "nom_poste_secondaire", label: "Nom du poste secondaire", type: "text" },
          { name: "type_poste", label: "Type de poste", type: "text" }
        ];
      case "Changement de poste serveur":
        return [
          { name: "nom_ancien_serveur", label: "Nom de l'ancien serveur", type: "text" },
          { name: "nom_nouveau_serveur", label: "Nom du nouveau serveur", type: "text" },
          { name: "type_nouveau_serveur", label: "Type du nouveau serveur", type: "text" },
          { name: "version_ancien_serveur", label: "Version de l'ancien serveur", type: "text" }
        ];
      case "Formation":
        return [
          { name: "duree_prevue", label: "Durée prévue (heures)", type: "number" },
          { name: "duree_reelle", label: "Durée réelle (heures)", type: "number" }
        ];
      case "Export BDD":
        return [
          { name: "type_donnees", label: "Type de données exportées", type: "text" },
          { name: "taille_export", label: "Taille de l'export (Mo)", type: "number" }
        ];
      case "Mise à jour":
        return [
          { name: "version_base", label: "Version installée de base", type: "text" },
          { name: "nb_postes", label: "Nombre de postes mis à jour", type: "number" }
        ];
      case "Démo":
        return [
          { name: "fonctionnalites", label: "Fonctionnalités démontrées", type: "text" }
        ];
      case "Autre":
        return [
          { name: "description", label: "Description de l'intervention", type: "text" }
        ];
      default:
        return [];
    }
  };

  // Vérifier si le type de RDV doit afficher la section praticiens
  const shouldShowPraticiens = (type) => {
    const typesWithoutPraticiens = [
      "Installation poste secondaire",
      "Changement de poste serveur",
      "Mise à jour",
      "Export BDD"
    ];
    return !typesWithoutPraticiens.includes(type);
  };

  // Handler pour changer le type de RDV et réinitialiser les champs spécifiques
  const handleTypeChange = (newType) => {
    setForm({ ...form, type_rdv: newType });
    setSpecificFields({});
  };

  const handleChangeStatut = async (idRdv, newStatut) => {
    try {
      await api.put(`/rendez-vous/${idRdv}/statut`, { statut: newStatut });
      showSuccess("Statut mis à jour");
      fetchRendezvous(true);
    } catch (error) {
      console.error("Erreur changement statut:", error);
      showError("Erreur lors du changement de statut");
    }
  };

  const getStatusBadge = (rdv) => {
    const colors = {
      "Planifié": "bg-blue-100 text-blue-800 hover:bg-blue-200",
      "Effectué": "bg-green-100 text-green-800 hover:bg-green-200",
      "Facturé": "bg-purple-100 text-purple-800 hover:bg-purple-200 font-bold",
      "Annulé": "bg-red-100 text-red-800 hover:bg-red-200"
    };
    
    return (
      <select
        value={rdv.statut}
        onChange={(e) => handleChangeStatut(rdv.id_rdv, e.target.value)}
        className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer border-0 ${colors[rdv.statut] || "bg-gray-100 text-gray-800"}`}
        style={{ 
          appearance: 'none',
          backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.3rem center',
          backgroundSize: '1em 1em',
          paddingRight: '1.5rem'
        }}
      >
        <option value="Planifié" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>Planifié</option>
        <option value="Effectué" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Effectué</option>
        <option value="Facturé" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8' }}>Facturé</option>
        <option value="Annulé" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Annulé</option>
      </select>
    );
  };

  const filteredRdv = rendezvous.filter(rdv => {
    const matchesSearch = (rdv.cabinet ? rdv.cabinet.toLowerCase() : "").includes(searchTerm.toLowerCase()) ||
               (rdv.ville ? rdv.ville.toLowerCase() : "").includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "Tous" || rdv.statut === statusFilter;
    const matchesType = typeFilter === "Tous" || rdv.type_rdv === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const sortRdv = (list) => {
    const getDateValue = (value) => {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    };

    const sorted = [...list];
    switch (sortOption) {
      case "date_desc":
        sorted.sort((a, b) => getDateValue(b.date_rdv) - getDateValue(a.date_rdv));
        break;
      case "date_asc":
        sorted.sort((a, b) => getDateValue(a.date_rdv) - getDateValue(b.date_rdv));
        break;
      case "creation_desc":
        sorted.sort((a, b) => getDateValue(b.date_creation || b.created_at) - getDateValue(a.date_creation || a.created_at));
        break;
      case "creation_asc":
        sorted.sort((a, b) => getDateValue(a.date_creation || a.created_at) - getDateValue(b.date_creation || b.created_at));
        break;
      case "cabinet_az":
        sorted.sort((a, b) => (a.cabinet || "").localeCompare(b.cabinet || ""));
        break;
      case "cabinet_za":
        sorted.sort((a, b) => (b.cabinet || "").localeCompare(a.cabinet || ""));
        break;
      case "statut":
        sorted.sort((a, b) => (a.statut || "").localeCompare(b.statut || ""));
        break;
      case "type":
        sorted.sort((a, b) => (a.type_rdv || "").localeCompare(b.type_rdv || ""));
        break;
      default:
        break;
    }
    return sorted;
  };

  const sortedRdv = sortRdv(filteredRdv);

  // Nouvelle fonction pour vérifier et compléter les infos avant création de contrat
  const handleCreateContratWithCheck = async (rdv, prix) => {
    // Vérifie les champs obligatoires
    const champs = ['adresse', 'code_postal', 'ville'];
    const manquants = champs.filter(champ => !rdv[champ] || rdv[champ].trim() === '');
    if (manquants.length > 0) {
      setInfosManquantesModal({ open: true, rdv: { ...rdv, prix } });
      return;
    }
    // Si tout est OK, crée le contrat
    try {
      await api.post(
        `/rendez-vous/${rdv.id_rdv}/create-contrat`,
        { prix: parseFloat(prix), adresse: rdv.adresse, code_postal: rdv.code_postal, ville: rdv.ville }
      );
      showSuccess('Contrat créé avec succès');
      fetchRendezvous(true);
    } catch (error) {
      console.error('Erreur création contrat:', error);
      showError(error.response?.data?.error || 'Erreur lors de la création du contrat');
    }
  };

  return (
    <div className="p-6">
      {/* Formulaire simplifié - Prise de RDV uniquement */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow">
          <h3 className="text-xl font-semibold mb-4">
            {editingRdv ? "Modifier le rendez-vous" : "📅 Prise de rendez-vous"}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Remplissez uniquement les informations nécessaires à la prise de rendez-vous. Les détails d'intervention seront complétés après.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ...tous les champs du formulaire... */}
          </form>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Rendez-vous</h2>
        <div className="flex gap-2">
          {onRetour && (
            <button
              onClick={onRetour}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition flex items-center gap-2"
            >
              ← Retour à la liste simple
            </button>
          )}
          <button
            disabled
            className="bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed flex items-center gap-2 opacity-60"
            title="Fonctionnalité temporairement désactivée"
          >
            📥 Importer ICS
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showImportICS) setShowImportICS(false);
            }}
            className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-semibold transition ${showForm ? 'bg-red-500 hover:bg-red-600' : ''}`}
          >
            {showForm ? "Annuler" : "+ Nouveau RDV"}
          </button>
        </div>
      </div>

      {/* La liste avancée est déjà affichée via le formulaire et le composant principal, on retire le doublon ici. */}

      {/* Import ICS Component */}
      {showImportICS && <ImportICS />}

      {/* Section d'archivage */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-gray-700 dark:text-gray-300">📦 Gestion des archives</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoArchive}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded font-semibold transition"
            >
              🗄️ Archiver mois précédent
            </button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          💡 Archive automatiquement tous les RDV <strong>effectués et facturés</strong> du mois précédent (sauf installations complètes sans contrat).
          <br />
          ⚙️ L'archivage se fait aussi automatiquement chaque nuit à minuit.
        </p>
      </div>

      {/* Filtres rapides */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            setSearchTerm('');
            setStatusFilter('Tous');
            setTypeFilter('Tous');
            // Scroll vers le premier RDV d'aujourd'hui
            setTimeout(() => {
              const todayRdv = document.querySelector(`[data-date="${today}"]`);
              if (todayRdv) todayRdv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }}
          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded text-sm transition"
        >
          📅 Aujourd'hui
        </button>
        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('Tous');
            setTypeFilter('Tous');
            // Filtrage semaine se fera dans le filtre côté rendu
          }}
          className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded text-sm transition"
        >
          📆 Cette semaine
        </button>
        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('Tous');
            setTypeFilter('Tous');
          }}
          className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-2 rounded text-sm transition"
        >
          📊 Ce mois
        </button>
        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('Effectué');
            setTypeFilter('Tous');
          }}
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm transition"
        >
          💰 À facturer
        </button>
        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('Tous');
            setTypeFilter('Tous');
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded text-sm transition"
        >
          ↺ Réinitialiser
        </button>
      </div>

      {/* Filtres avancés */}
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
          <option value="Facturé">Facturé</option>
          <option value="Annulé">Annulé</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border px-4 py-2 rounded"
        >
          <option value="Tous">Tous les types</option>
          <option value="Installation serveur">Installation serveur</option>
          <option value="Installation poste secondaire">Installation poste secondaire</option>
          <option value="Changement de poste serveur">Changement de poste serveur</option>
          <option value="Formation">Formation</option>
          <option value="Export BDD">Export BDD</option>
          <option value="Démo">Démo</option>
          <option value="Mise à jour">Mise à jour</option>
          <option value="Autre">Autre</option>
        </select>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="border px-4 py-2 rounded"
        >
          <option value="date_desc">Date du RDV ↓</option>
          <option value="date_asc">Date du RDV ↑</option>
          <option value="creation_desc">Création ↓</option>
          <option value="creation_asc">Création ↑</option>
          <option value="cabinet_az">Cabinet A→Z</option>
          <option value="cabinet_za">Cabinet Z→A</option>
          <option value="statut">Statut</option>
          <option value="type">Type</option>
        </select>
      </div>

      {/* Formulaire simplifié - Prise de RDV uniquement */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow">
          <h3 className="text-xl font-semibold mb-4">
            {editingRdv ? "Modifier le rendez-vous" : "📅 Prise de rendez-vous"}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Remplissez uniquement les informations nécessaires à la prise de rendez-vous. Les détails d'intervention seront complétés après.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {form.type_rdv === 'Autre' ? 'Nom du rendez-vous *' : 'Nom du cabinet *'}
                </label>
                <input
                  type="text"
                  required
                  value={form.cabinet}
                  onChange={(e) => setForm({ ...form, cabinet: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                  placeholder={form.type_rdv === 'Autre' ? 'Nom du rendez-vous...' : 'Cabinet médical...'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  required
                  value={form.type_rdv}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="Installation serveur">Installation serveur</option>
                  <option value="Installation poste secondaire">Installation poste secondaire</option>
                  <option value="Changement de poste serveur">Changement de poste serveur</option>
                  <option value="Formation">Formation</option>
                  <option value="Export BDD">Export BDD</option>
                  <option value="Démo">Démo</option>
                  <option value="Mise à jour">Mise à jour</option>
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
              {/* Champs dynamiques pour installation complète */}
              {(form.type_rdv === 'Installation serveur' || form.type_rdv === 'Installation poste secondaire' || form.type_rdv === 'Changement de poste serveur') && <>
                <div>
                  <label className="block text-sm font-medium mb-1">Email <span className="text-red-500 font-normal">*</span></label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`w-full border px-3 py-2 rounded ${form.email === '' ? 'border-red-500' : ''}`}
                    placeholder="contact@cabinet.fr"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Adresse <span className="text-red-500 font-normal">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    className={`w-full border px-3 py-2 rounded ${form.adresse === '' ? 'border-red-500' : ''}`}
                    placeholder="12 rue de la Santé"
                  />
                </div>
                
                <div className="col-span-2">
                  <VilleCodePostalInput
                    codePostal={form.code_postal}
                    ville={form.ville}
                    onCodePostalChange={(value) => setForm({ ...form, code_postal: value })}
                    onVilleChange={(value) => setForm({ ...form, ville: value })}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Praticiens <span className="text-red-500 font-normal">*</span></label>
                  <input
                    type="text"
                    required
                    value={Array.isArray(form.praticiens)
                      ? form.praticiens.map(p => `${p.prenom || ''} ${p.nom || ''}`.trim()).filter(Boolean).join(', ')
                      : (form.praticiens || '')}
                    onChange={e => setForm({ ...form, praticiens: parsePraticiensInput(e.target.value) })}
                    className={`w-full border px-3 py-2 rounded ${(!Array.isArray(form.praticiens) || form.praticiens.length === 0) ? 'border-red-500' : ''}`}
                    placeholder="Dr Dupont, Dr Martin..."
                  />
                </div>
              </>}
              {/* Champ téléphone toujours présent */}
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone <span className="text-gray-500 font-normal">(optionnel)</span></label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={
                  loading ||
                  ((form.type_rdv === 'Installation serveur' || form.type_rdv === 'Installation poste secondaire' || form.type_rdv === 'Changement de poste serveur') &&
                    (!form.email || typeof form.email !== "string" || form.email.trim() === "" ||
                     !form.adresse || typeof form.adresse !== "string" || form.adresse.trim() === "" ||
                     !form.code_postal || typeof form.code_postal !== "string" || form.code_postal.trim() === "" ||
                     !form.ville || typeof form.ville !== "string" || form.ville.trim() === "" ||
                     !Array.isArray(form.praticiens) || form.praticiens.length === 0))
                }
                className={`bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 disabled:opacity-50 ${
                  (form.type_rdv === 'Installation serveur' || form.type_rdv === 'Installation poste secondaire' || form.type_rdv === 'Changement de poste serveur') &&
                  (!form.email || typeof form.email !== "string" || form.email.trim() === "" ||
                   !form.adresse || typeof form.adresse !== "string" || form.adresse.trim() === "" ||
                   !form.code_postal || typeof form.code_postal !== "string" || form.code_postal.trim() === "" ||
                   !form.ville || typeof form.ville !== "string" || form.ville.trim() === "" ||
                   !Array.isArray(form.praticiens) || form.praticiens.length === 0) ? 'cursor-not-allowed' : ''
                }`}
              >
                {loading ? "⏳" : editingRdv ? "Modifier" : "Créer"}
              </button>
              {(form.type_rdv === 'Installation serveur' || form.type_rdv === 'Installation poste secondaire' || form.type_rdv === 'Changement de poste serveur') &&
                (!form.email || typeof form.email !== "string" || form.email.trim() === "" ||
                 !form.adresse || typeof form.adresse !== "string" || form.adresse.trim() === "" ||
                 !form.code_postal || typeof form.code_postal !== "string" || form.code_postal.trim() === "" ||
                 !form.ville || typeof form.ville !== "string" || form.ville.trim() === "" ||
                 !Array.isArray(form.praticiens) || form.praticiens.length === 0) && (
                  <span className="text-red-500 text-sm mt-2">Veuillez remplir tous les champs obligatoires : Email, Adresse, Code Postal, Ville et Praticiens.</span>
              )}
              <button
                type="button"
                onClick={resetForm}
                className="bg-white text-red-600 px-6 py-2 rounded hover:bg-red-50 hover:text-red-700 border border-red-300 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des RDV */}
      {loading && !showForm ? (
        <p>Chargement...</p>
      ) : (
        <>
        <div className="grid gap-4">
          {sortedRdv.slice((currentPage - 1) * rdvPerPage, currentPage * rdvPerPage).map(rdv => (
            <div 
              key={rdv.id_rdv} 
              className={`border rounded-lg p-4 shadow ${
                rdv.archive 
                  ? 'bg-gray-100 dark:bg-gray-700 border-gray-400 opacity-75' 
                  : 'bg-white dark:bg-gray-800'
              }`}
              data-date={rdv.date_rdv.split('T')[0]}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 
                      className="text-lg font-semibold text-gray-800 dark:text-gray-200 hover:text-gray-600 cursor-pointer flex items-center gap-2"
                      onClick={() => setCabinetHistoryModal(rdv.cabinet)}
                      title="Voir l'historique de ce cabinet"
                    >
                      {rdv.cabinet}
                      <span className="text-xs text-gray-400 hover:text-gray-600">📂</span>
                    </h3>
                    {rdv.archive && (
                      <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded font-semibold">
                        📦 ARCHIVÉ
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{rdv.type_rdv}</p>
                </div>
                {getStatusBadge(rdv)}
              </div>
              
              <div className="text-sm space-y-1 mb-3">
                <p><strong>📅 Date:</strong> {rdv.date_rdv.split('T')[0].split('-').reverse().join('/')} à {rdv.heure_rdv}</p>
                <p><strong>📍 Lieu:</strong> {rdv.adresse}, {rdv.code_postal} {rdv.ville}</p>
                {(() => {
                  // Parser praticiens si nécessaire
                  let praticiens = rdv.praticiens;
                  if (typeof praticiens === 'string') {
                    try {
                      praticiens = JSON.parse(praticiens);
                    } catch {
                      praticiens = [];
                    }
                  }
                  
                  return praticiens && Array.isArray(praticiens) && praticiens.length > 0 && (
                    <p><strong>👥 Praticiens:</strong> {praticiens.map(p => {
                      if (typeof p === 'object' && p.prenom && p.nom) {
                        return `${p.prenom} ${p.nom}`;
                      } else if (typeof p === 'string') {
                        return p;
                      }
                      return '';
                    }).filter(Boolean).join(', ')}</p>
                  );
                })()}
                {rdv.id_contrat && (
                  <p className="text-green-600"><strong>📄 Contrat lié:</strong> #{rdv.id_contrat}</p>
                )}
                
                {/* Notes formatées avec champs spécifiques et checklist */}
                {rdv.notes && (() => {
                  try {
                    const notesData = JSON.parse(rdv.notes);
                    const hasSpecificFields = notesData.specificFields && Object.keys(notesData.specificFields).length > 0;
                    const hasGeneralNotes = notesData.generalNotes && notesData.generalNotes.trim();
                    const hasChecklist = notesData.checklist && notesData.checklist.length > 0;
                    
                    if (!hasSpecificFields && !hasGeneralNotes && !hasChecklist) return null;
                    
                    return (
                      <div className="mt-2 border-t pt-2">
                        <div className="max-h-40 overflow-y-auto bg-gray-50 rounded p-2 space-y-2">
                          {/* Champs spécifiques */}
                          {hasSpecificFields && (
                            <div>
                              <p className="font-semibold text-xs text-gray-700 mb-1">⚙️ Informations techniques:</p>
                              <ul className="text-xs space-y-0.5 ml-3">
                                {Object.entries(notesData.specificFields).map(([key, value]) => (
                                  value && <li key={key} className="text-gray-700">• <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {value}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Notes générales */}
                          {hasGeneralNotes && (
                            <div>
                              <p className="font-semibold text-xs text-gray-700 mb-1">📝 Notes:</p>
                              <p className="text-xs text-gray-600 whitespace-pre-line ml-3">{notesData.generalNotes}</p>
                            </div>
                          )}
                          
                          {/* Checklist */}
                          {hasChecklist && (
                            <div>
                              <p className="font-semibold text-xs text-gray-700 mb-1">✓ Checklist ({notesData.checklist.filter(c => c.checked).length}/{notesData.checklist.length}):</p>
                              <ul className="text-xs space-y-0.5 ml-3">
                                {notesData.checklist.map(item => (
                                  <li key={item.id} className={item.checked ? "text-green-700" : "text-gray-500"}>
                                    {item.checked ? "✓" : "○"} {item.label}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } catch (e) {
                    // Si les notes ne sont pas au format JSON, afficher en texte brut
                    return <p className="mt-2 text-xs text-gray-600 max-h-20 overflow-y-auto"><strong>📝 Notes:</strong> {rdv.notes}</p>;
                  }
                })()}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2 flex-wrap items-center">
                  <button
                    onClick={() => downloadICS(rdv)}
                    className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                  >
                    📅 Télécharger .ics
                  </button>
                  <button
                    onClick={() => copyGrcTextFromRdv(rdv)}
                    className="bg-cyan-500 text-white px-3 py-1 rounded text-sm hover:bg-cyan-600"
                  >
                    📋 Texte GRC
                  </button>
                  {rdv.statut === "Planifié" && (
                    <button
                      onClick={() => handleComplete(rdv)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      ✓ Marquer comme Effectué
                    </button>
                  )}
                  {rdv.statut === "Effectué" && (
                    <>
                      <button
                        onClick={() => handleFacturer(rdv.id_rdv)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                      >
                        💰 Marquer comme Facturé
                      </button>
                      <button
                        onClick={() => handleReplanifier(rdv.id_rdv)}
                        className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                      >
                        ↩️ Replanifier
                      </button>
                    </>
                  )}
                  {rdv.id_contrat ? (
                    <button
                      onClick={() => handleRegenerateContrat(rdv)}
                      className="bg-pink-500 text-white px-3 py-1 rounded text-sm hover:bg-pink-600"
                      title="Régénérer le contrat avec les données actuelles"
                    >
                      🔄 Régénérer contrat
                    </button>
                  ) : (
                    rdv.statut === "Facturé" && rdv.type_rdv === "Installation serveur" && (
                      <button
                        onClick={async () => {
                          const prix = prompt("Prix du contrat (€) :");
                          if (!prix || parseFloat(prix) <= 0) return;
                          await handleCreateContratWithCheck(rdv, prix);
                        }}
                        className="bg-pink-500 text-white px-3 py-1 rounded text-sm hover:bg-pink-600"
                        title="Créer le contrat de service pour cette installation"
                      >
                        📄 Générer contrat
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setTreatmentModalRdv(rdv)}
                    className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                    title="Traiter l'intervention - Compléter les détails"
                  >
                    🔧 Traiter
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap items-center justify-end text-xs">
                  <button
                    onClick={() => handleDuplicate(rdv)}
                    className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded hover:bg-slate-200"
                  >
                    📋 Dupliquer
                  </button>
                  <button
                    onClick={() => handleEdit(rdv)}
                    className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded hover:bg-slate-200"
                  >
                    ✏️ Modifier
                  </button>
                  {rdv.archive ? (
                    <button
                      onClick={() => handleUnarchiveRdv(rdv.id_rdv)}
                      className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded hover:bg-slate-200"
                    >
                      📂 Restaurer
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchiveRdv(rdv.id_rdv)}
                      className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded hover:bg-slate-200"
                    >
                      📦 Archiver
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(rdv.id_rdv)}
                    className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded hover:bg-slate-200"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
          {sortedRdv.length === 0 && (
            <p className="text-gray-500 text-center py-8">Aucun rendez-vous trouvé</p>
          )}
        </div>
        
        {/* Pagination */}
        {sortedRdv.length > rdvPerPage && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded"
            >
              ← Précédent
            </button>
            <span className="text-sm font-medium text-gray-700">
              Page {currentPage} / {Math.ceil(sortedRdv.length / rdvPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(Math.ceil(sortedRdv.length / rdvPerPage), currentPage + 1))}
              disabled={currentPage === Math.ceil(sortedRdv.length / rdvPerPage)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded"
            >
              Suivant →
            </button>
          </div>
        )}
        </>
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

            {!completeModalRdv.id_contrat && completeModalRdv.type_rdv === 'Installation serveur' && (
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
              className="bg-white text-red-600 px-4 py-2 rounded hover:bg-red-50 hover:text-red-700 border border-red-300 w-full"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal Historique par cabinet */}
      {cabinetHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">📂 Historique - {cabinetHistoryModal}</h3>
              <button
                onClick={() => setCabinetHistoryModal(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              {rendezvous
                .filter(rdv => rdv.cabinet === cabinetHistoryModal)
                .sort((a, b) => new Date(b.date_rdv) - new Date(a.date_rdv))
                .map(rdv => (
                  <div key={rdv.id_rdv} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{rdv.type_rdv}</h4>
                        <p className="text-sm text-gray-600">
                          {rdv.date_rdv.split('T')[0].split('-').reverse().join('/')} à {rdv.heure_rdv}
                        </p>
                      </div>
                      {getStatusBadge(rdv)}
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <p><strong>📍</strong> {rdv.ville}</p>
                      {(() => {
                        // Parser praticiens si nécessaire
                        let praticiens = rdv.praticiens;
                        if (typeof praticiens === 'string') {
                          try {
                            praticiens = JSON.parse(praticiens);
                          } catch {
                            praticiens = [];
                          }
                        }
                        
                        return praticiens && Array.isArray(praticiens) && praticiens.length > 0 && (
                          <p><strong>👥</strong> {praticiens.map(p => {
                            if (typeof p === 'object' && p.prenom && p.nom) {
                              return `${p.prenom} ${p.nom}`;
                            } else if (typeof p === 'string') {
                              return p;
                            }
                            return '';
                          }).filter(Boolean).join(', ')}</p>
                        );
                      })()}
                      {rdv.notes && (
                        <p className="text-gray-700 mt-2">
                          <strong>📝 Notes:</strong> {rdv.notes.length > 100 ? rdv.notes.substring(0, 100) + '...' : rdv.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          handleEdit(rdv);
                          setCabinetHistoryModal(null);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => {
                          handleDuplicate(rdv);
                          setCabinetHistoryModal(null);
                        }}
                        className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600"
                      >
                        📋 Dupliquer
                      </button>
                    </div>
                  </div>
                ))}
              
              {rendezvous.filter(rdv => rdv.cabinet === cabinetHistoryModal).length === 0 && (
                <p className="text-gray-500 text-center py-8">Aucun RDV trouvé pour ce cabinet</p>
              )}
            </div>

            <button
              onClick={() => setCabinetHistoryModal(null)}
              className="bg-white text-red-600 px-4 py-2 rounded hover:bg-red-50 hover:text-red-700 border border-red-300 w-full mt-4"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal Prévisualisation Texte GRC */}
      {previewGrcModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Texte GRC - {previewGrcModal.cabinet}</h3>
              <button
                onClick={() => setPreviewGrcModal(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Texte à copier:</label>
                <button
                  onClick={copyPreviewGrcToClipboard}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  {copiedRdvId === previewGrcModal.id_rdv ? "✓ Copié !" : "📋 Copier"}
                </button>
              </div>
              <textarea
                value={previewGrcText}
                readOnly
                rows="15"
                className="w-full border px-3 py-2 rounded bg-gray-50 font-mono text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPreviewGrcModal(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Traitement RDV - Complétion des détails d'intervention */}
      {treatmentModalRdv && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              🔧 Traitement de l'intervention - {treatmentModalRdv.cabinet}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Complétez les informations détaillées de l'intervention avant de la facturer
            </p>

            <div className="space-y-6">
              {/* Informations de base (lecture seule) */}
              <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">📋 Informations du RDV</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <div><strong>Type:</strong> {treatmentModalRdv.type_rdv}</div>
                  <div><strong>Date:</strong> {new Date(treatmentModalRdv.date_rdv).toLocaleDateString('fr-FR')}</div>
                  <div><strong>Heure:</strong> {treatmentModalRdv.heure_rdv}</div>
                  <div><strong>Téléphone:</strong> {treatmentModalRdv.telephone || 'Non renseigné'}</div>
                  <div className="col-span-2"><strong>Email:</strong> {treatmentModalRdv.email || 'Non renseigné'}</div>
                  <div className="col-span-2"><strong>Adresse:</strong> {treatmentModalRdv.adresse || 'Non renseignée'}, {treatmentModalRdv.code_postal} {treatmentModalRdv.ville}</div>
                </div>
              </div>

              {/* Champs spécifiques selon le type */}
              {getDetailedFieldsForType(treatmentModalRdv.type_rdv).length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-3">⚙️ Informations techniques - {treatmentModalRdv.type_rdv}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {getDetailedFieldsForType(treatmentModalRdv.type_rdv).map(field => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          value={treatmentForm.specificFields[field.name] || ''}
                          onChange={(e) => setTreatmentForm({
                            ...treatmentForm,
                            specificFields: { ...treatmentForm.specificFields, [field.name]: e.target.value }
                          })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                          placeholder={field.label}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Praticiens */}
              {shouldShowPraticiens(treatmentModalRdv.type_rdv) && (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-3">👨‍⚕️ Praticiens</h3>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Nom"
                      value={praticienForm.nom}
                      onChange={(e) => setPraticienForm({ ...praticienForm, nom: e.target.value })}
                      className="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded flex-1 dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Prénom"
                      value={praticienForm.prenom}
                      onChange={(e) => setPraticienForm({ ...praticienForm, prenom: e.target.value })}
                      className="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded flex-1 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (praticienForm.nom && praticienForm.prenom) {
                          setTreatmentForm({
                            ...treatmentForm,
                            praticiens: [...treatmentForm.praticiens, { ...praticienForm }]
                          });
                          setPraticienForm({ nom: '', prenom: '' });
                        }
                      }}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      + Ajouter
                    </button>
                  </div>
                  <div className="space-y-2">
                    {treatmentForm.praticiens.map((p, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                        <span className="text-gray-800 dark:text-gray-200">{p.prenom} {p.nom}</span>
                        <button
                          type="button"
                          onClick={() => setTreatmentForm({
                            ...treatmentForm,
                            praticiens: treatmentForm.praticiens.filter((_, index) => index !== i)
                          })}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist */}
              {treatmentForm.checklist && treatmentForm.checklist.length > 0 && (
                <div className="border rounded-lg p-4" style={{ backgroundColor: '#D1FAE5', borderColor: '#10B981' }}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold" style={{ color: '#065F46', fontSize: '18px' }}>
                      ✅ Checklist - {treatmentModalRdv.type_rdv}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const allChecked = treatmentForm.checklist.every(item => item.checked);
                        const updatedChecklist = treatmentForm.checklist.map(item => ({
                          ...item,
                          checked: !allChecked
                        }));
                        setTreatmentForm({ ...treatmentForm, checklist: updatedChecklist });
                      }}
                      className="px-3 py-1 rounded text-sm font-medium transition"
                      style={{
                        backgroundColor: treatmentForm.checklist.every(item => item.checked) ? '#EF4444' : '#10B981',
                        color: '#FFFFFF'
                      }}
                      title={treatmentForm.checklist.every(item => item.checked) ? 'Tout décocher' : 'Tout cocher'}
                    >
                      {treatmentForm.checklist.every(item => item.checked) ? '☐ Tout décocher' : '✓ Tout cocher'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {treatmentForm.checklist.map((item, index) => (
                      <label 
                        key={index} 
                        className="flex items-center gap-3 p-3 rounded cursor-pointer"
                        style={{ 
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #10B981'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.checked || false}
                          onChange={(e) => {
                            const updatedChecklist = [...treatmentForm.checklist];
                            updatedChecklist[index] = { ...item, checked: e.target.checked };
                            setTreatmentForm({ ...treatmentForm, checklist: updatedChecklist });
                          }}
                          className="w-5 h-5"
                        />
                        <span 
                          className="flex-1"
                          style={{ 
                            color: '#000000',
                            textDecoration: item.checked ? 'line-through' : 'none',
                            fontWeight: '500',
                            fontSize: '15px'
                          }}
                        >
                          {item.label || item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3" style={{ color: '#065F46', fontWeight: 'bold', fontSize: '14px' }}>
                    Progression: {treatmentForm.checklist.filter(item => item.checked).length} / {treatmentForm.checklist.length}
                  </div>
                </div>
              )}

              {/* Notes générales */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <h3 className="font-bold text-gray-800 dark:text-white mb-3">📝 Notes de l'intervention</h3>
                <textarea
                  value={treatmentForm.notes}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
                  rows="4"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                  placeholder="Notes complémentaires sur l'intervention..."
                />
              </div>

              {/* Génération de contrat pour Installation serveur */}
              {treatmentModalRdv.type_rdv === 'Installation serveur' && !treatmentModalRdv.id_contrat && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-bold text-blue-900 mb-3">📄 Contrat de service</h3>
                  <p className="text-sm text-blue-700 mb-3">Créer un contrat de service pour cette installation</p>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-blue-900 mb-1">Prix du contrat (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={contratPrix}
                        onChange={(e) => setContratPrix(e.target.value)}
                        placeholder="Ex: 240.00"
                        className="w-full border border-blue-300 rounded px-3 py-2"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!contratPrix || parseFloat(contratPrix) <= 0) {
                          showError('Veuillez entrer un prix valide');
                          return;
                        }
                        setCreatingContrat(true);
                        try {
                          await api.post(
                                `/rendez-vous/${treatmentModalRdv.id_rdv}/create-contrat`,
                            { prix: parseFloat(contratPrix) }
                          );
                              showSuccess('Contrat créé avec succès');
                          setContratPrix('');
                          fetchRendezvous();
                        } catch (error) {
                          console.error('Erreur:', error);
                              showError(error.response?.data?.error || 'Erreur lors de la création du contrat');
                        }
                        setCreatingContrat(false);
                      }}
                      disabled={creatingContrat}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {creatingContrat ? '⏳' : '📄 Générer contrat'}
                    </button>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    // Sauvegarder les modifications du traitement
                    try {
                      const updatedNotes = JSON.stringify({
                        specificFields: treatmentForm.specificFields,
                        generalNotes: treatmentForm.notes,
                        checklist: treatmentForm.checklist
                      });
                      
                      await api.put(`/rendez-vous/${treatmentModalRdv.id_rdv}`, {
                        praticiens: treatmentForm.praticiens,
                        notes: updatedNotes
                      });
                      
                      showSuccess('Détails de l\'intervention sauvegardés');
                      setTreatmentModalRdv(null);
                      fetchRendezvous(true);
                    } catch (error) {
                      console.error('Erreur sauvegarde:', error);
                      showError('Erreur lors de la sauvegarde');
                    }
                  }}
                  className="flex-1 bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition font-semibold"
                >
                  💾 Sauvegarder les détails
                </button>
                <button
                  onClick={async () => {
                    // Marquer comme effectué et sauvegarder
                    try {
                      const updatedNotes = JSON.stringify({
                        specificFields: treatmentForm.specificFields,
                        generalNotes: treatmentForm.notes,
                        checklist: treatmentForm.checklist
                      });
                      
                      await api.put(`/rendez-vous/${treatmentModalRdv.id_rdv}`, {
                        statut: 'Effectué',
                        praticiens: treatmentForm.praticiens,
                        notes: updatedNotes
                      });
                      
                      showSuccess('Intervention marquée comme effectuée');
                      setTreatmentModalRdv(null);
                      fetchRendezvous(true);
                    } catch (error) {
                      console.error('Erreur:', error);
                      showError('Erreur lors de la sauvegarde');
                    }
                  }}
                  className="flex-1 bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition font-semibold"
                >
                  ✓ Marquer comme Effectué
                </button>
                <button
                  onClick={() => {
                    setTreatmentModalRdv(null);
                    setTreatmentForm({ specificFields: {}, praticiens: [], notes: '', checklist: [] });
                  }}
                  className="bg-white text-red-600 px-6 py-3 rounded hover:bg-red-50 hover:text-red-700 border border-red-300 transition font-semibold"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour compléter les infos manquantes lors de la création de contrat */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${showContratForm ? '' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-bold mb-4">Compléter les informations manquantes</h2>
          <form onSubmit={e => {
            e.preventDefault();
            handleCreateContrat();
          }} className="space-y-3">
            <label className="block">
              Adresse :
              <input name="adresse" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} required className="border px-2 py-1 rounded w-full" />
            </label>
            
            <VilleCodePostalInput
              codePostal={form.code_postal}
              ville={form.ville}
              onCodePostalChange={(value) => setForm({ ...form, code_postal: value })}
              onVilleChange={(value) => setForm({ ...form, ville: value })}
              required
            />

            <div className="flex gap-2 mt-4">
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Valider</button>
              <button type="button" onClick={() => setShowContratForm(false)} className="bg-gray-300 px-4 py-2 rounded">Annuler</button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer avec option archives */}
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-t-2 border-gray-300 dark:border-gray-700">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 rounded font-medium transition ${
              showArchived 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {showArchived ? '👁️ Voir les RDV actifs' : '📦 Voir les RDV archivés'}
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {showArchived ? `${sortedRdv.length} RDV archivé(s)` : `${sortedRdv.length} RDV actif(s)`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InstallationsSuiviPage;