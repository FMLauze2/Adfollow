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
  }
});

// POST new contrat
router.post('/', async (req, res) => {
  try {
    const { cabinet_id, date_envoi, date_reception, statut, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO contrats (cabinet_id, date_envoi, date_reception, statut, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [cabinet_id, date_envoi, date_reception, statut, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// PUT update contrat
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cabinet_id, date_envoi, date_reception, statut, notes } = req.body;
    const result = await pool.query(
      'UPDATE contrats SET cabinet_id=$1, date_envoi=$2, date_reception=$3, statut=$4, notes=$5 WHERE id_contrat=$6 RETURNING *',
      [cabinet_id, date_envoi, date_reception, statut, notes, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// DELETE contrat
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM contrats WHERE id_contrat=$1', [id]);
    res.json({ message: 'Contrat deleted' });
  } catch (err) {
    console.error(err.message);
  }
});

module.exports = router;
