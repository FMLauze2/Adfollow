const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET tous les devs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM equipe_devs WHERE actif = true ORDER BY nom_complet'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération devs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST créer un dev
router.post('/', async (req, res) => {
  try {
    const { initiales, nom_complet, role } = req.body;
    
    if (!initiales || !nom_complet) {
      return res.status(400).json({ error: 'Initiales et nom complet requis' });
    }
    
    const result = await pool.query(
      `INSERT INTO equipe_devs (initiales, nom_complet, role, actif)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [initiales.toUpperCase(), nom_complet, role || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ces initiales existent déjà' });
    }
    console.error('Erreur création dev:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT mettre à jour un dev
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { initiales, nom_complet, role, actif } = req.body;
    
    const result = await pool.query(
      `UPDATE equipe_devs 
       SET initiales = $1, nom_complet = $2, role = $3, actif = $4
       WHERE id_dev = $5
       RETURNING *`,
      [initiales.toUpperCase(), nom_complet, role, actif !== false, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Développeur non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ces initiales existent déjà' });
    }
    console.error('Erreur mise à jour dev:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE supprimer un dev (désactiver)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE equipe_devs SET actif = false WHERE id_dev = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Développeur non trouvé' });
    }
    
    res.json({ message: 'Développeur désactivé', dev: result.rows[0] });
  } catch (error) {
    console.error('Erreur suppression dev:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET avancements d'un report
router.get('/avancements/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const result = await pool.query(
      `SELECT a.*, d.initiales, d.nom_complet, d.role
       FROM avancement_daily a
       JOIN equipe_devs d ON a.id_dev = d.id_dev
       WHERE a.id_report = $1
       ORDER BY d.nom_complet`,
      [reportId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération avancements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST créer/mettre à jour avancements pour un report
router.post('/avancements/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { avancements } = req.body; // Array de {id_dev, hier, aujourdhui, blocages}
    
    // Supprimer les anciens avancements
    await pool.query('DELETE FROM avancement_daily WHERE id_report = $1', [reportId]);
    
    // Insérer les nouveaux
    const insertPromises = avancements.map(av => 
      pool.query(
        `INSERT INTO avancement_daily (id_report, id_dev, hier, aujourdhui, blocages)
         VALUES ($1, $2, $3, $4, $5)`,
        [reportId, av.id_dev, av.hier, av.aujourdhui, av.blocages]
      )
    );
    
    await Promise.all(insertPromises);
    
    res.json({ message: 'Avancements enregistrés' });
  } catch (error) {
    console.error('Erreur enregistrement avancements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
