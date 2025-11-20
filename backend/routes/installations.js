const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all installations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM installations ORDER BY id_installation');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
  }
});

// POST new installation
router.post('/', async (req, res) => {
  try {
    const { cabinet_id, date_installation, logiciel, materiel, tickets_associes, statut, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO installations (cabinet_id, date_installation, logiciel, materiel, tickets_associes, statut, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [cabinet_id, date_installation, logiciel, materiel, tickets_associes, statut, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// PUT update installation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cabinet_id, date_installation, logiciel, materiel, tickets_associes, statut, notes } = req.body;
    const result = await pool.query(
      'UPDATE installations SET cabinet_id=$1, date_installation=$2, logiciel=$3, materiel=$4, tickets_associes=$5, statut=$6, notes=$7 WHERE id_installation=$8 RETURNING *',
      [cabinet_id, date_installation, logiciel, materiel, tickets_associes, statut, notes, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// DELETE installation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM installations WHERE id_installation=$1', [id]);
    res.json({ message: 'Installation deleted' });
  } catch (err) {
    console.error(err.message);
  }
});

module.exports = router;
