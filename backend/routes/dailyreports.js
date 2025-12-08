const express = require('express');
const router = express.Router();
const pool = require('../db');

// Récupérer tous les comptes rendus (triés par date décroissante)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM daily_reports ORDER BY date_report DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération daily reports:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un compte rendu par date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const result = await pool.query(
      'SELECT * FROM daily_reports WHERE date_report = $1',
      [date]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compte rendu non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération daily report:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les comptes rendus d'un sprint
router.get('/sprint/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    const result = await pool.query(
      'SELECT * FROM daily_reports WHERE sprint_numero = $1 ORDER BY date_report DESC',
      [numero]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération daily reports du sprint:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouveau compte rendu
router.post('/', async (req, res) => {
  try {
    const {
      date_report,
      sprint_numero,
      sprint_date_debut,
      sprint_date_fin,
      user_stories,
      blocages,
      points_positifs,
      actions_demain,
      notes
    } = req.body;

    // Vérifier si un rapport existe déjà pour cette date
    const existing = await pool.query(
      'SELECT id_report FROM daily_reports WHERE date_report = $1',
      [date_report]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Un compte rendu existe déjà pour cette date' });
    }

    const result = await pool.query(
      `INSERT INTO daily_reports (
        date_report, sprint_numero, sprint_date_debut, sprint_date_fin,
        user_stories, blocages, points_positifs, actions_demain, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        date_report, sprint_numero, sprint_date_debut, sprint_date_fin,
        user_stories, blocages, points_positifs, actions_demain, notes
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur création daily report:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un compte rendu
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date_report,
      sprint_numero,
      sprint_date_debut,
      sprint_date_fin,
      user_stories,
      blocages,
      points_positifs,
      actions_demain,
      notes
    } = req.body;

    const result = await pool.query(
      `UPDATE daily_reports SET
        date_report = $1,
        sprint_numero = $2,
        sprint_date_debut = $3,
        sprint_date_fin = $4,
        user_stories = $5,
        blocages = $6,
        points_positifs = $7,
        actions_demain = $8,
        notes = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id_report = $10
      RETURNING *`,
      [
        date_report, sprint_numero, sprint_date_debut, sprint_date_fin,
        user_stories, blocages, points_positifs, actions_demain, notes, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compte rendu non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour daily report:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un compte rendu
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM daily_reports WHERE id_report = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compte rendu non trouvé' });
    }

    res.json({ message: 'Compte rendu supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression daily report:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
