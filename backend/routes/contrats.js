// backend/routes/contrats.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

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

    const result = await pool.query(
      `INSERT INTO contrats (cabinet, adresse, code_postal, ville, praticiens, prix, date_envoi, date_reception, date_creation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
      [cabinet, adresse, code_postal, ville, JSON.stringify(praticiens), prix, date_envoi || null, date_reception || null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Erreur lors de la création du contrat' });
  }
});

// PUT update contrat
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cabinet,
      adresse,
      code_postal,
      ville,
      praticiens,
      prix,
      date_envoi,
      date_reception
    } = req.body;

    const result = await pool.query(
      `UPDATE contrats
       SET cabinet=$1, adresse=$2, code_postal=$3, ville=$4, praticiens=$5, prix=$6, date_envoi=$7, date_reception=$8
       WHERE id_contrat=$9
       RETURNING *`,
      [cabinet, adresse, code_postal, ville, praticiens, prix, date_envoi || null, date_reception || null, id]
    );

    res.json({ message: 'Contrat mis à jour', contrat: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur lors de la mise à jour du contrat');
  }
});

// DELETE contrat
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM contrats WHERE id_contrat=$1', [id]);
    res.json({ message: 'Contrat supprimé' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur lors de la suppression du contrat');
  }
});

module.exports = router;
