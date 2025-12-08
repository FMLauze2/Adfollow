const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET tous les sprints
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sprints ORDER BY date_debut DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération sprints:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET sprints actifs (en cours)
router.get('/actifs', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM sprints WHERE statut = 'en_cours' ORDER BY date_debut DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération sprints actifs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET un sprint par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM sprints WHERE id_sprint = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sprint non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération sprint:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST créer un sprint
router.post('/', async (req, res) => {
  try {
    const { numero, date_debut, date_fin, objectif, statut } = req.body;
    
    if (!numero || !date_debut || !date_fin) {
      return res.status(400).json({ error: 'Numéro, date de début et date de fin requis' });
    }
    
    const result = await pool.query(
      `INSERT INTO sprints (numero, date_debut, date_fin, objectif, statut)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [numero, date_debut, date_fin, objectif || null, statut || 'en_cours']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Violation de contrainte unique
      return res.status(400).json({ error: 'Ce numéro de sprint existe déjà' });
    }
    console.error('Erreur création sprint:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT mettre à jour un sprint
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, date_debut, date_fin, objectif, statut } = req.body;
    
    const result = await pool.query(
      `UPDATE sprints 
       SET numero = $1, date_debut = $2, date_fin = $3, objectif = $4, 
           statut = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id_sprint = $6
       RETURNING *`,
      [numero, date_debut, date_fin, objectif, statut, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sprint non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ce numéro de sprint existe déjà' });
    }
    console.error('Erreur mise à jour sprint:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE supprimer un sprint
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si des daily reports utilisent ce sprint
    const checkReports = await pool.query(
      'SELECT COUNT(*) FROM daily_reports WHERE id_sprint = $1',
      [id]
    );
    
    if (parseInt(checkReports.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer ce sprint car il est utilisé par des comptes rendus' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM sprints WHERE id_sprint = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sprint non trouvé' });
    }
    
    res.json({ message: 'Sprint supprimé', sprint: result.rows[0] });
  } catch (error) {
    console.error('Erreur suppression sprint:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
