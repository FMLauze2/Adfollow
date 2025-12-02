const express = require('express');
const router = express.Router();
const pool = require('../db');
const generateICS = require('../services/ics/generateICS');

// GET tous les RDV
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM rendez_vous ORDER BY date_rdv DESC, heure_rdv DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur récupération RDV:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET un RDV par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM rendez_vous WHERE id_rdv = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RDV non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur récupération RDV:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST créer un RDV
router.post('/', async (req, res) => {
  try {
    const {
      cabinet,
      date_rdv,
      heure_rdv,
      type_rdv,
      adresse,
      code_postal,
      ville,
      praticiens,
      notes
    } = req.body;

    // Compenser le décalage timezone en ajoutant 1 jour
    const dateParts = date_rdv.split('-');
    const dateObj = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]) + 1));
    const correctedDate = dateObj.toISOString().split('T')[0];
    
    const result = await pool.query(
      `INSERT INTO rendez_vous 
       (cabinet, date_rdv, heure_rdv, type_rdv, adresse, code_postal, ville, praticiens, notes, statut, date_creation) 
       VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, 'Planifié', NOW()) 
       RETURNING *`,
      [cabinet, correctedDate, heure_rdv, type_rdv, adresse, code_postal, ville, JSON.stringify(praticiens || []), notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur création RDV:', err);
    res.status(500).json({ error: 'Erreur création RDV' });
  }
});

// PUT modifier un RDV
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cabinet,
      date_rdv,
      heure_rdv,
      type_rdv,
      adresse,
      code_postal,
      ville,
      praticiens,
      statut,
      notes,
      id_contrat
    } = req.body;

    // Construction dynamique de la requête UPDATE
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (cabinet !== undefined) {
      updates.push(`cabinet = $${paramCount++}`);
      values.push(cabinet);
    }
    if (date_rdv !== undefined) {
      // Compenser le décalage timezone en ajoutant 1 jour
      const dateParts = date_rdv.split('-');
      const dateObj = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]) + 1));
      const correctedDate = dateObj.toISOString().split('T')[0];
      updates.push(`date_rdv = $${paramCount++}::date`);
      values.push(correctedDate);
    }
    if (heure_rdv !== undefined) {
      updates.push(`heure_rdv = $${paramCount++}`);
      values.push(heure_rdv);
    }
    if (type_rdv !== undefined) {
      updates.push(`type_rdv = $${paramCount++}`);
      values.push(type_rdv);
    }
    if (adresse !== undefined) {
      updates.push(`adresse = $${paramCount++}`);
      values.push(adresse);
    }
    if (code_postal !== undefined) {
      updates.push(`code_postal = $${paramCount++}`);
      values.push(code_postal);
    }
    if (ville !== undefined) {
      updates.push(`ville = $${paramCount++}`);
      values.push(ville);
    }
    if (praticiens !== undefined) {
      updates.push(`praticiens = $${paramCount++}`);
      values.push(JSON.stringify(praticiens));
    }
    if (statut !== undefined) {
      updates.push(`statut = $${paramCount++}`);
      values.push(statut);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }
    if (id_contrat !== undefined) {
      updates.push(`id_contrat = $${paramCount++}`);
      values.push(id_contrat);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification fournie' });
    }

    // Set timezone to avoid date shifting
    await pool.query("SET TIME ZONE 'Europe/Paris'");
    
    values.push(id);
    const query = `UPDATE rendez_vous SET ${updates.join(', ')} WHERE id_rdv = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RDV non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur modification RDV:', err);
    res.status(500).json({ error: 'Erreur modification RDV' });
  }
});

// DELETE supprimer un RDV
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM rendez_vous WHERE id_rdv = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RDV non trouvé' });
    }
    
    res.json({ message: 'RDV supprimé', rdv: result.rows[0] });
  } catch (err) {
    console.error('Erreur suppression RDV:', err);
    res.status(500).json({ error: 'Erreur suppression RDV' });
  }
});

// POST marquer un RDV comme effectué et générer texte GRC
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le RDV
    const rdvResult = await pool.query('SELECT * FROM rendez_vous WHERE id_rdv = $1', [id]);
    
    if (rdvResult.rows.length === 0) {
      return res.status(404).json({ error: 'RDV non trouvé' });
    }
    
    const rdv = rdvResult.rows[0];
    
    // Marquer comme effectué
    await pool.query(
      "UPDATE rendez_vous SET statut = 'Effectué' WHERE id_rdv = $1",
      [id]
    );
    
    // Générer texte GRC
    const praticiensList = rdv.praticiens && Array.isArray(rdv.praticiens) 
      ? rdv.praticiens.map(p => `${p.prenom} ${p.nom}`).join(', ')
      : 'Non spécifié';
    
    const dateFormatted = new Date(rdv.date_rdv).toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Parser les notes pour extraire les champs spécifiques
    let notesData = {};
    let generalNotes = rdv.notes || 'Intervention réalisée avec succès.';
    try {
      const parsed = JSON.parse(rdv.notes || '{}');
      notesData = parsed.specificFields || {};
      generalNotes = parsed.generalNotes || 'Intervention réalisée avec succès.';
    } catch {
      // Si ce n'est pas du JSON, c'est une note simple
      generalNotes = rdv.notes || 'Intervention réalisée avec succès.';
    }
    
    // Construire la section des détails spécifiques
    let specificDetailsText = '';
    if (Object.keys(notesData).length > 0) {
      specificDetailsText = '\n\nDétails techniques:\n';
      for (const [key, value] of Object.entries(notesData)) {
        if (value) {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          specificDetailsText += `- ${label}: ${value}\n`;
        }
      }
    }
    
    const grcText = `Objet: ${rdv.type_rdv} - ${rdv.cabinet}

Cabinet: ${rdv.cabinet}
Adresse: ${rdv.adresse}, ${rdv.code_postal} ${rdv.ville}
Date intervention: ${dateFormatted} à ${rdv.heure_rdv}
Praticien(s): ${praticiensList}

Type d'intervention: ${rdv.type_rdv}${specificDetailsText}

Compte-rendu:
${generalNotes}

Statut: Effectué`;
    
    res.json({ 
      message: 'RDV marqué comme effectué',
      grcText 
    });
  } catch (err) {
    console.error('Erreur marquage RDV effectué:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST marquer un RDV comme facturé
router.post('/:id/facturer', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Marquer comme facturé
    const result = await pool.query(
      "UPDATE rendez_vous SET statut = 'Facturé' WHERE id_rdv = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RDV non trouvé' });
    }
    
    res.json({ 
      message: 'RDV marqué comme facturé',
      rdv: result.rows[0]
    });
  } catch (err) {
    console.error('Erreur marquage RDV facturé:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST remettre un RDV à l'état Planifié
router.post('/:id/replanifier', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Remettre à Planifié
    const result = await pool.query(
      "UPDATE rendez_vous SET statut = 'Planifié' WHERE id_rdv = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RDV non trouvé' });
    }
    
    res.json({ 
      message: 'RDV remis à l\'état Planifié',
      rdv: result.rows[0]
    });
  } catch (err) {
    console.error('Erreur replanification RDV:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT changer manuellement le statut d'un RDV
router.put('/:id/statut', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    
    // Vérifier que le statut est valide
    const statutsValides = ['Planifié', 'Effectué', 'Facturé', 'Annulé'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    
    const result = await pool.query(
      'UPDATE rendez_vous SET statut = $1 WHERE id_rdv = $2 RETURNING *',
      [statut, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RDV non trouvé' });
    }
    
    res.json({ 
      message: `Statut modifié en '${statut}'`,
      rdv: result.rows[0]
    });
  } catch (err) {
    console.error('Erreur changement statut RDV:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST créer un contrat à partir d'un RDV
router.post('/:id/create-contrat', async (req, res) => {
  try {
    const { id } = req.params;
    const { prix } = req.body;
    
    if (!prix || prix <= 0) {
      return res.status(400).json({ error: 'Prix invalide' });
    }
    
    // Récupérer le RDV
    const rdvResult = await pool.query('SELECT * FROM rendez_vous WHERE id_rdv = $1', [id]);
    
    if (rdvResult.rows.length === 0) {
      return res.status(404).json({ error: 'RDV non trouvé' });
    }
    
    const rdv = rdvResult.rows[0];
    
    // Vérifier qu'il n'y a pas déjà un contrat lié
    if (rdv.id_contrat) {
      return res.status(400).json({ error: 'Un contrat existe déjà pour ce RDV' });
    }
    
    // Créer le contrat avec les données du RDV
    const contratResult = await pool.query(
      `INSERT INTO contrats 
       (cabinet, adresse, code_postal, ville, praticiens, prix, date_envoi, date_creation) 
       VALUES ($1, $2, $3, $4, $5, $6, NULL, NOW()) 
       RETURNING *`,
      [
        rdv.cabinet,
        rdv.adresse,
        rdv.code_postal,
        rdv.ville,
        JSON.stringify(rdv.praticiens || []),
        prix
      ]
    );
    
    const nouveauContrat = contratResult.rows[0];
    
    // Parser les praticiens si nécessaire (PostgreSQL retourne JSONB comme objet déjà parsé normalement)
    if (typeof nouveauContrat.praticiens === 'string') {
      nouveauContrat.praticiens = JSON.parse(nouveauContrat.praticiens);
    }
    
    // Générer le PDF du contrat
    const { generateContratPDF } = require('../services/pdf/generateContratPDF');
    await generateContratPDF(nouveauContrat);
    
    // Lier le contrat au RDV
    await pool.query(
      'UPDATE rendez_vous SET id_contrat = $1 WHERE id_rdv = $2',
      [nouveauContrat.id_contrat, id]
    );
    
    res.status(201).json({ 
      message: 'Contrat créé et lié au RDV',
      contrat: nouveauContrat
    });
  } catch (err) {
    console.error('Erreur création contrat depuis RDV:', err);
    res.status(500).json({ error: 'Erreur création contrat' });
  }
});

// GET télécharger fichier .ics pour un RDV
router.get('/:id/ics', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le RDV
    const result = await pool.query('SELECT * FROM rendez_vous WHERE id_rdv = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RDV non trouvé' });
    }
    
    const rdv = result.rows[0];
    
    // Générer le fichier ICS
    const icsContent = generateICS(rdv);
    
    // Envoyer le fichier
    const cabinetSafe = rdv.cabinet.replace(/[^a-z0-9]/gi, '_');
    
    // Formatter la date pour le nom de fichier
    let dateSafe;
    if (typeof rdv.date_rdv === 'string') {
      dateSafe = rdv.date_rdv.split('T')[0];
    } else {
      const d = new Date(rdv.date_rdv);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      dateSafe = `${year}-${month}-${day}`;
    }
    
    const filename = `RDV_${cabinetSafe}_${dateSafe}.ics`;
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
    res.send(icsContent);
  } catch (err) {
    console.error('Erreur génération ICS:', err);
    res.status(500).json({ error: 'Erreur génération fichier ICS' });
  }
});

module.exports = router;
