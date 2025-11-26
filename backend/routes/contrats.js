// backend/routes/contrats.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { generateContratPDF } = require('../services/pdf/generateContratPDF');



// GET all contrats
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contrats ORDER BY id_contrat');
    
    // Ajouter le statut calculé à chaque contrat
    const contratsAvecStatut = result.rows.map(contrat => {
      let statut = 'Brouillon';
      if (contrat.date_reception) {
        statut = 'Reçu';
      } else if (contrat.date_envoi) {
        statut = 'Envoyé';
      }
      return { ...contrat, statut };
    });
    
    res.json(contratsAvecStatut);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur lors de la récupération des contrats');
  }
});

  // GET contrat by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM contrats WHERE id_contrat = $1', [id]);
      
      if (result.rows.length > 0) {
        const contrat = result.rows[0];
        // Ajouter le statut calculé
        let statut = 'Brouillon';
        if (contrat.date_reception) {
          statut = 'Reçu';
        } else if (contrat.date_envoi) {
          statut = 'Envoyé';
        }
        res.json({ ...contrat, statut });
      } else {
        res.status(404).json({ error: 'Contrat non trouvé' });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Erreur lors de la récupération du contrat');
    }
  });

    // POST create new contrat
  router.post('/', async (req, res) => {
    try {
      let { cabinet, adresse, code_postal, ville, praticiens, prix, email, date_envoi, date_reception } = req.body;

      // Convertir praticiens en JSON si ce n'est pas déjà
      if (!Array.isArray(praticiens)) {
        try {
          praticiens = JSON.parse(praticiens);
        } catch (err) {
          return res.status(400).json({ message: 'Champ praticiens invalide. Doit être un tableau JSON.' });
        }
      }

      // Insertion du contrat
      const result = await pool.query(
        `INSERT INTO contrats (cabinet, adresse, code_postal, ville, praticiens, prix, email, date_envoi, date_reception, date_creation)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *`,
        [cabinet, adresse, code_postal, ville, JSON.stringify(praticiens), prix, email || null, date_envoi || null, date_reception || null]
      );

      const contratCree = result.rows[0];

      // Génération du PDF
      try {
        const pdfPath = await generateContratPDF(contratCree);
        contratCree.pdf_path = pdfPath; // on peut stocker le chemin dans la réponse
      } catch (pdfErr) {
        console.error('Erreur génération PDF:', pdfErr);
        // On continue quand même, PDF non critique
      }

      res.json(contratCree);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Erreur lors de la création du contrat' });
    }
  });



// PUT /api/contrats/:id - modifier un contrat complet
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  let { cabinet, adresse, code_postal, ville, praticiens, prix, email, date_envoi, date_reception } = req.body;

  if (!id) return res.status(400).json({ error: 'id manquant' });

  try {
    // Récupérer l'ancien nom du cabinet pour supprimer l'ancien PDF
    const fs = require('fs');
    const path = require('path');
    const oldContratResult = await pool.query('SELECT cabinet FROM contrats WHERE id_contrat = $1', [id]);
    let oldCabinet = null;
    if (oldContratResult.rows.length > 0) {
      oldCabinet = oldContratResult.rows[0].cabinet;
    }

    // Convertir praticiens en JSON si ce n'est pas déjà
    if (praticiens && !Array.isArray(praticiens)) {
      try {
        praticiens = JSON.parse(praticiens);
      } catch (err) {
        return res.status(400).json({ message: 'Champ praticiens invalide. Doit être un tableau JSON.' });
      }
    }

    // Construire la requête dynamiquement selon les champs fournis
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (cabinet !== undefined) {
      updates.push(`cabinet = $${paramIndex++}`);
      values.push(cabinet);
    }
    if (adresse !== undefined) {
      updates.push(`adresse = $${paramIndex++}`);
      values.push(adresse);
    }
    if (code_postal !== undefined) {
      updates.push(`code_postal = $${paramIndex++}`);
      values.push(code_postal);
    }
    if (ville !== undefined) {
      updates.push(`ville = $${paramIndex++}`);
      values.push(ville);
    }
    if (praticiens !== undefined) {
      updates.push(`praticiens = $${paramIndex++}`);
      values.push(JSON.stringify(praticiens));
    }
    if (prix !== undefined) {
      updates.push(`prix = $${paramIndex++}`);
      values.push(prix);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email || null);
    }
    if (date_envoi !== undefined) {
      updates.push(`date_envoi = $${paramIndex++}`);
      values.push(date_envoi || null);
    }
    if (date_reception !== undefined) {
      updates.push(`date_reception = $${paramIndex++}`);
      values.push(date_reception || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à modifier' });
    }

    values.push(id);
    const query = `UPDATE contrats SET ${updates.join(', ')} WHERE id_contrat = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);
    const contratModifie = result.rows[0];

    // Déterminer si on doit régénérer le PDF (seulement si les données du contrat ont changé, pas les dates)
    const shouldRegeneratePdf = cabinet !== undefined || adresse !== undefined || 
                                 code_postal !== undefined || ville !== undefined || 
                                 praticiens !== undefined || prix !== undefined;

    if (shouldRegeneratePdf) {
      // Si le cabinet a changé, supprimer l'ancien PDF
      if (oldCabinet && cabinet && oldCabinet !== cabinet) {
        const oldCabinetSafe = oldCabinet.replace(/[^a-z0-9_\-\s]/gi, '').replace(/\s+/g, '_');
        const oldPdfPath = path.join(__dirname, '..', 'services', 'pdf', 'uploads', 'contrats', `Contrat_de_services_${oldCabinetSafe}.pdf`);
        
        if (fs.existsSync(oldPdfPath)) {
          fs.unlinkSync(oldPdfPath);
          console.log(`Ancien PDF supprimé: ${oldPdfPath}`);
        }
      }

      // Régénérer le PDF avec les nouvelles données
      try {
        const pdfPath = await generateContratPDF(contratModifie);
        contratModifie.pdf_path = pdfPath;
        console.log(`PDF régénéré: ${pdfPath}`);
      } catch (pdfErr) {
        console.error('Erreur régénération PDF:', pdfErr);
        // On continue quand même
      }
    }

    // Ajouter le statut calculé avant de renvoyer
    let statut = 'Brouillon';
    if (contratModifie.date_reception) {
      statut = 'Reçu';
    } else if (contratModifie.date_envoi) {
      statut = 'Envoyé';
    }

    res.json({ ...contratModifie, statut });
  } catch (err) {
    console.error('Erreur update contrat:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du contrat' });
  }
});

// DELETE /api/contrats/:id - supprimer un contrat
router.delete('/:id', async (req, res) => {
  const contratId = req.params.id;

  try {
    // Supprimer le PDF associé (récupérer le nom du cabinet depuis la DB)
    const fs = require('fs');
    const path = require('path');
    
    // Récupérer le contrat pour avoir le nom du cabinet
    const contratResult = await pool.query('SELECT cabinet FROM contrats WHERE id_contrat = $1', [contratId]);
    if (contratResult.rows.length > 0) {
      const cabinet = contratResult.rows[0].cabinet;
      const cabinetSafe = cabinet.replace(/[^a-z0-9_\-\s]/gi, '').replace(/\s+/g, '_');
      const pdfPath = path.join(__dirname, '..', 'services', 'pdf', 'uploads', 'contrats', `Contrat_de_services_${cabinetSafe}.pdf`);
      
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        console.log(`PDF supprimé: ${pdfPath}`);
      }
    }

    // Supprimer le contrat dans la base
    await pool.query('DELETE FROM contrats WHERE id_contrat = $1', [contratId]);

    res.status(200).json({ message: 'Contrat supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression contrat :', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du contrat' });
  }
});


module.exports = router;
