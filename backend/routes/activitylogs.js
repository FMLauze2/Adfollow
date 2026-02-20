// backend/routes/activitylogs.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/activity-logs - Récupérer les logs d'activité
 * Query params:
 *   - limit: nombre de logs à retourner (défaut 100)
 *   - offset: pagination
 *   - user: filtrer par utilisateur
 *   - entity_type: filtrer par type d'entité
 *   - action: filtrer par type d'action
 *   - start_date: date de début
 *   - end_date: date de fin
 */
router.get('/', async (req, res) => {
  try {
    const { 
      limit = 100, 
      offset = 0, 
      user, 
      entity_type, 
      action,
      start_date,
      end_date
    } = req.query;

    let query = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (user) {
      query += ` AND user_name = $${paramIndex}`;
      params.push(user);
      paramIndex++;
    }

    if (entity_type) {
      query += ` AND entity_type = $${paramIndex}`;
      params.push(entity_type);
      paramIndex++;
    }

    if (action) {
      query += ` AND action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Compter le total pour la pagination
    let countQuery = 'SELECT COUNT(*) FROM activity_logs WHERE 1=1';
    const countParams = [];
    let countIndex = 1;

    if (user) {
      countQuery += ` AND user_name = $${countIndex}`;
      countParams.push(user);
      countIndex++;
    }
    if (entity_type) {
      countQuery += ` AND entity_type = $${countIndex}`;
      countParams.push(entity_type);
      countIndex++;
    }
    if (action) {
      countQuery += ` AND action = $${countIndex}`;
      countParams.push(action);
      countIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      logs: result.rows,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Erreur récupération logs:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/activity-logs/stats - Statistiques sur les logs
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        action,
        entity_type,
        COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY action, entity_type
      ORDER BY count DESC
    `);

    const userActivity = await pool.query(`
      SELECT 
        user_name,
        COUNT(*) as action_count
      FROM activity_logs
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY user_name
      ORDER BY action_count DESC
    `);

    res.json({
      byActionAndEntity: stats.rows,
      byUser: userActivity.rows
    });
  } catch (err) {
    console.error('Erreur stats logs:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/activity-logs/entity/:type/:id - Logs pour une entité spécifique
 */
router.get('/entity/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM activity_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
      [type, id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Erreur récupération logs entité:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
