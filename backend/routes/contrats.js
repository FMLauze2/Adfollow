// backend/routes/contrats.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { generateContratPDF } = require('../services/pdf/generateContratPDF');



// GET all contrats
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contrats ORDER BY id_contrat');
    res.json(result.rows);
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
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Erreur lors de la récupération du contrat');
    }
  });

    // POST create new contrat
  router.post('/', async (req, res) => {
    try {
      let { cabinet, adresse, code_postal, ville, praticiens, prix, date_envoi, date_reception } = req.body;

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
        `INSERT INTO contrats (cabinet, adresse, code_postal, ville, praticiens, prix, date_envoi, date_reception, date_creation)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
        [cabinet, adresse, code_postal, ville, JSON.stringify(praticiens), prix, date_envoi || null, date_reception || null]
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



// PUT /api/contrats/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { date_envoi, date_reception } = req.body;

  // Vérification simple
  if (!id) return res.status(400).json({ error: 'id manquant' });

  try {
    await pool.query(
      `UPDATE contrats
       SET date_envoi = $1, date_reception = $2
       WHERE id_contrat = $3`,
      [date_envoi || null, date_reception || null, id]
    );
    res.json({ message: 'Contrat mis à jour' });
  } catch (err) {
    console.error('Erreur update contrat:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du contrat' });
  }
});

// DELETE /api/contrats/:id - supprimer un contrat
router.delete('/:id', async (req, res) => {
  const contratId = req.params.id;

  try {
    // On supprime le contrat dans la base
    await pool.query('DELETE FROM contrats WHERE id = $1', [contratId]);

    res.status(200).json({ message: 'Contrat supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression contrat :', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du contrat' });
  }
});


module.exports = router;
