const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET tous les feature flags
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM feature_flags ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur récupération feature flags:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET un feature flag spécifique
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await pool.query('SELECT * FROM feature_flags WHERE name = $1', [name]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feature flag non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur récupération feature flag:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT mettre à jour un feature flag
router.put('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { enabled, description } = req.body;
    
    const result = await pool.query(
      'UPDATE feature_flags SET enabled = $1, description = $2, updated_at = NOW() WHERE name = $3 RETURNING *',
      [enabled, description, name]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feature flag non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur mise à jour feature flag:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
