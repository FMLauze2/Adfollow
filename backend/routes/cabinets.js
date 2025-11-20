const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all cabinets
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cabinet ORDER BY id_cabinet');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
  }
});

// GET a cabinet by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM cabinet WHERE id_cabinet = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// POST new cabinet
router.post('/', async (req, res) => {
  try {
    const { nom, ldap_id, adresse, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO cabinet (nom, ldap_id, adresse, notes) VALUES ($1,$2,$3,$4) RETURNING *',
      [nom, ldap_id, adresse, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// PUT update cabinet
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, ldap_id, adresse, notes } = req.body;
    const result = await pool.query(
      'UPDATE cabinet SET nom=$1, ldap_id=$2, adresse=$3, notes=$4 WHERE id_cabinet=$5 RETURNING *',
      [nom, ldap_id, adresse, notes, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// DELETE cabinet
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cabinet WHERE id_cabinet=$1', [id]);
    res.json({ message: 'Cabinet deleted' });
  } catch (err) {
    console.error(err.message);
  }
});

module.exports = router;
