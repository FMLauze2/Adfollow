const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all praticiens
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM praticien ORDER BY id_praticien');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
  }
});

// GET praticien by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM praticien WHERE id_praticien=$1', [id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// POST new praticien
router.post('/', async (req, res) => {
  try {
    const { nom, prenom, ldap_id, cabinet_id, email, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO praticien (nom, prenom, ldap_id, cabinet_id, email, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [nom, prenom, ldap_id, cabinet_id, email, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// PUT update praticien
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, ldap_id, cabinet_id, email, notes } = req.body;
    const result = await pool.query(
      'UPDATE praticien SET nom=$1, prenom=$2, ldap_id=$3, cabinet_id=$4, email=$5, notes=$6 WHERE id_praticien=$7 RETURNING *',
      [nom, prenom, ldap_id, cabinet_id, email, notes, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// DELETE praticien
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM praticien WHERE id_praticien=$1', [id]);
    res.json({ message: 'Praticien deleted' });
  } catch (err) {
    console.error(err.message);
  }
});

module.exports = router;
