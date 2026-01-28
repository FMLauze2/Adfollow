// Checklists prédéfinies par type de RDV
export const RDV_CHECKLISTS = {
  "Installation serveur": [
    // Installation
    { id: 1, label: "[INSTALLATION] Regex exécutées", required: true },
    { id: 2, label: "[INSTALLATION] Port 4900 entrant ouvert", required: true },
    { id: 3, label: "[INSTALLATION] Utilisateur Medoc créé", required: true },
    { id: 4, label: "[INSTALLATION] Archive de Médoc décompressée", required: true },
    { id: 5, label: "[INSTALLATION] Répertoire MEDOC Installations partagé", required: true },
    { id: 6, label: "[INSTALLATION] Répertoire CRIP Informatique partagé", required: true },
    { id: 7, label: "[INSTALLATION] API_SV installée", required: true },
    { id: 8, label: "[INSTALLATION] Structure créée", required: true },
    { id: 9, label: "[INSTALLATION] Première CPS lue", required: true },
    { id: 10, label: "[INSTALLATION] HFCS = 1", required: true },
    { id: 11, label: "[INSTALLATION] BAL Santé créée", required: true },
    { id: 12, label: "[INSTALLATION] Médoc First configuré", required: false, optional: true },
    { id: 13, label: "[INSTALLATION] Interfaçage avec logiciel métier effectué", required: false, optional: true },
    // Formation
    { id: 14, label: "[FORMATION] Préparer les supports de formation", required: true },
    { id: 15, label: "[FORMATION] Présenter les fonctionnalités principales", required: true },
    { id: 16, label: "[FORMATION] Démonstration pratique", required: true },
    { id: 17, label: "[FORMATION] Exercices pratiques avec l'utilisateur", required: true },
    { id: 18, label: "[FORMATION] Répondre aux questions", required: true },
    { id: 19, label: "[FORMATION] Remettre la documentation", required: true }
  ],

  "Installation complète": [
    // Installation serveur
    { id: 1, label: "[INSTALLATION] Regex exécutées", required: true },
    { id: 2, label: "[INSTALLATION] Port 4900 entrant ouvert", required: true },
    { id: 3, label: "[INSTALLATION] Utilisateur Medoc créé", required: true },
    { id: 4, label: "[INSTALLATION] Archive de Médoc décompressée", required: true },
    { id: 5, label: "[INSTALLATION] Répertoire MEDOC Installations partagé", required: true },
    { id: 6, label: "[INSTALLATION] Répertoire CRIP Informatique partagé", required: true },
    { id: 7, label: "[INSTALLATION] API_SV installée", required: true },
    { id: 8, label: "[INSTALLATION] Structure créée", required: true },
    { id: 9, label: "[INSTALLATION] Première CPS lue", required: true },
    { id: 10, label: "[INSTALLATION] HFCS = 1", required: true },
    { id: 11, label: "[INSTALLATION] BAL Santé créée", required: true },
    { id: 12, label: "[INSTALLATION] Médoc First configuré", required: false, optional: true },
    { id: 13, label: "[INSTALLATION] Interfaçage avec logiciel métier effectué", required: false, optional: true },
    // Formation
    { id: 14, label: "[FORMATION] Préparer les supports de formation", required: true },
    { id: 15, label: "[FORMATION] Présenter les fonctionnalités principales", required: true },
    { id: 16, label: "[FORMATION] Démonstration pratique", required: true },
    { id: 17, label: "[FORMATION] Exercices pratiques avec l'utilisateur", required: true },
    { id: 18, label: "[FORMATION] Répondre aux questions", required: true },
    { id: 19, label: "[FORMATION] Remettre la documentation", required: true }
  ],
  
  "Installation poste secondaire": [
    { id: 1, label: "Install.exe lancé via le partage", required: true },
    { id: 2, label: "API_SV installées", required: true },
    { id: 3, label: "Lecteur configuré", required: false, optional: true }
  ],
  
  "Changement de poste serveur": [
    { id: 1, label: "Données de l'ancien serveur copiées", required: true },
    { id: 2, label: "Médoc (version proche) réinstallé sur le nouveau serveur", required: true },
    { id: 3, label: "Données accessibles sur le nouveau serveur", required: true },
    { id: 4, label: "Coupure service HFSQL", required: true },
    { id: 5, label: "Injection des données dans la BDD créée", required: true },
    { id: 6, label: "Rallumage du service HFSQL", required: true },
    { id: 7, label: "Vérification cohérence données affichées", required: true },
    { id: 8, label: "Raccordements des .ini des postes secondaires", required: true }
  ],
  
  "Formation": [
    { id: 1, label: "Préparer les supports de formation" },
    { id: 2, label: "Présenter les fonctionnalités principales" },
    { id: 3, label: "Démonstration pratique" },
    { id: 4, label: "Exercices pratiques avec l'utilisateur" },
    { id: 5, label: "Répondre aux questions" },
    { id: 6, label: "Remettre la documentation" }
  ],
  
  "Export BDD": [
    { id: 1, label: "Vérifier l'espace disque disponible" },
    { id: 2, label: "Lancer l'export de la base de données" },
    { id: 3, label: "Vérifier l'intégrité de l'export" },
    { id: 4, label: "Compresser le fichier export" },
    { id: 5, label: "Transférer sur support externe ou cloud" },
    { id: 6, label: "Confirmer la réception avec le client" }
  ],
  
  "Démo": [
    { id: 1, label: "Préparer l'environnement de démo" },
    { id: 2, label: "Présenter les avantages du logiciel" },
    { id: 3, label: "Démonstration des fonctionnalités clés" },
    { id: 4, label: "Répondre aux questions" },
    { id: 5, label: "Remettre la documentation commerciale" }
  ],
  
  "Mise à jour": [
    { id: 1, label: "Faire une sauvegarde complète avant MAJ" },
    { id: 2, label: "Vérifier les prérequis de la mise à jour" },
    { id: 3, label: "Lancer la mise à jour" },
    { id: 4, label: "Vérifier que la MAJ s'est bien déroulée" },
    { id: 5, label: "Tester les fonctionnalités principales" },
    { id: 6, label: "Informer l'utilisateur des nouveautés" }
  ],
  
  "Autre": [
    { id: 1, label: "Identifier le problème" },
    { id: 2, label: "Appliquer la solution" },
    { id: 3, label: "Tester et valider" },
    { id: 4, label: "Documenter l'intervention" }
  ]
};

// Fonction pour obtenir la checklist d'un type de RDV
export const getChecklistForType = (typeRdv) => {
  return RDV_CHECKLISTS[typeRdv] || [];
};

// Fonction pour calculer le pourcentage de complétion
export const getChecklistProgress = (checklist) => {
  if (!checklist || checklist.length === 0) return 0;
  const completed = checklist.filter(item => item.checked).length;
  return Math.round((completed / checklist.length) * 100);
};
