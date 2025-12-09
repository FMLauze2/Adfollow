const express = require('express');
const router = express.Router();
const pool = require('../db');

// Récupérer tous les comptes rendus (triés par date décroissante) avec info sprint et avancements
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT dr.id_report, dr.date_report::text as date_report, dr.id_sprint, 
              dr.objectifs_jour, dr.blocages, dr.notes, dr.created_at, dr.updated_at,
              s.numero as sprint_numero, s.date_debut as sprint_date_debut, 
              s.date_fin as sprint_date_fin, s.objectif as sprint_objectif
       FROM daily_reports dr
       LEFT JOIN sprints s ON dr.id_sprint = s.id_sprint
       ORDER BY dr.date_report DESC`
    );
    
    // Récupérer les avancements pour chaque report
    for (let report of result.rows) {
      const avancements = await pool.query(
        `SELECT a.*, d.initiales, d.nom_complet, d.role
         FROM avancement_daily a
         JOIN equipe_devs d ON a.id_dev = d.id_dev
         WHERE a.id_report = $1
         ORDER BY d.nom_complet`,
        [report.id_report]
      );
      report.avancements = avancements.rows;
    }
    
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
      'SELECT id_report, date_report::text as date_report, id_sprint, objectifs_jour, blocages, notes, created_at, updated_at FROM daily_reports WHERE date_report::date = $1::date',
      [date]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compte rendu non trouvé' });
    }
    
    const report = result.rows[0];
    
    // Récupérer les avancements
    const avancements = await pool.query(
      `SELECT a.*, d.initiales, d.nom_complet, d.role
       FROM avancement_daily a
       JOIN equipe_devs d ON a.id_dev = d.id_dev
       WHERE a.id_report = $1
       ORDER BY d.nom_complet`,
      [report.id_report]
    );
    report.avancements = avancements.rows;
    
    res.json(report);
  } catch (error) {
    console.error('Erreur récupération daily report:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les "aujourd'hui" de la veille d'une date donnée pour pré-remplir le "hier"
router.get('/yesterday-today/:date', async (req, res) => {
  try {
    const { date } = req.params; // Format YYYY-MM-DD
    
    console.log('Recherche des données de la veille pour le rapport du:', date);
    
    // Utiliser PostgreSQL pour calculer la date de la veille - beaucoup plus fiable !
    const reportResult = await pool.query(
      `SELECT id_report, date_report 
       FROM daily_reports 
       WHERE date_report::date = ($1::date - INTERVAL '1 day')::date`,
      [date]
    );
    
    if (reportResult.rows.length === 0) {
      console.log('Aucun rapport trouvé pour la veille de', date);
      return res.json([]); // Pas de rapport veille, retourner tableau vide
    }
    
    const reportId = reportResult.rows[0].id_report;
    console.log('Rapport trouvé:', reportResult.rows[0].date_report);
    
    // Récupérer les "aujourd'hui" de la veille pour chaque dev
    const avancements = await pool.query(
      `SELECT a.id_dev, a.aujourdhui as hier, d.nom_complet, d.initiales, d.role
       FROM avancement_daily a
       JOIN equipe_devs d ON a.id_dev = d.id_dev
       WHERE a.id_report = $1
       ORDER BY d.nom_complet`,
      [reportId]
    );
    
    console.log(`${avancements.rows.length} avancements trouvés`);
    res.json(avancements.rows);
  } catch (error) {
    console.error('Erreur récupération yesterday-today:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les comptes rendus d'un sprint
router.get('/sprint/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT dr.id_report, dr.date_report::text as date_report, dr.id_sprint, 
              dr.objectifs_jour, dr.blocages, dr.notes, dr.created_at, dr.updated_at,
              s.numero as sprint_numero, s.date_debut as sprint_date_debut, 
              s.date_fin as sprint_date_fin, s.objectif as sprint_objectif
       FROM daily_reports dr
       LEFT JOIN sprints s ON dr.id_sprint = s.id_sprint
       WHERE dr.id_sprint = $1 
       ORDER BY dr.date_report DESC`,
      [id]
    );
    
    // Récupérer les avancements pour chaque report
    for (let report of result.rows) {
      const avancements = await pool.query(
        `SELECT a.*, d.initiales, d.nom_complet, d.role
         FROM avancement_daily a
         JOIN equipe_devs d ON a.id_dev = d.id_dev
         WHERE a.id_report = $1
         ORDER BY d.nom_complet`,
        [report.id_report]
      );
      report.avancements = avancements.rows;
    }
    
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
      id_sprint,
      objectifs_jour,
      blocages,
      notes,
      avancements
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
        date_report, id_sprint, objectifs_jour, blocages, notes
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [date_report, id_sprint || null, objectifs_jour, blocages, notes]
    );

    const reportId = result.rows[0].id_report;

    // Insérer les avancements
    if (avancements && avancements.length > 0) {
      const insertPromises = avancements.map(av => 
        pool.query(
          `INSERT INTO avancement_daily (id_report, id_dev, hier, aujourdhui, blocages)
           VALUES ($1, $2, $3, $4, $5)`,
          [reportId, av.id_dev, av.hier, av.aujourdhui, av.blocages]
        )
      );
      await Promise.all(insertPromises);
    }

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
      id_sprint,
      objectifs_jour,
      blocages,
      notes,
      avancements
    } = req.body;

    const result = await pool.query(
      `UPDATE daily_reports SET
        date_report = $1,
        id_sprint = $2,
        objectifs_jour = $3,
        blocages = $4,
        notes = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id_report = $6
      RETURNING *`,
      [date_report, id_sprint || null, objectifs_jour, blocages, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compte rendu non trouvé' });
    }

    // Supprimer les anciens avancements
    await pool.query('DELETE FROM avancement_daily WHERE id_report = $1', [id]);

    // Insérer les nouveaux avancements
    if (avancements && avancements.length > 0) {
      const insertPromises = avancements.map(av => 
        pool.query(
          `INSERT INTO avancement_daily (id_report, id_dev, hier, aujourdhui, blocages)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, av.id_dev, av.hier, av.aujourdhui, av.blocages]
        )
      );
      await Promise.all(insertPromises);
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
