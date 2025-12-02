const express = require('express');
const router = express.Router();
const db = require('../db');

// Récupérer tous les todos (avec filtre par date optionnel)
router.get('/', async (req, res) => {
  try {
    const { date, date_debut, date_fin } = req.query;
    
    let query = 'SELECT * FROM todos WHERE 1=1';
    let params = [];
    
    if (date) {
      query += ' AND date_todo = $1';
      params.push(date);
    } else if (date_debut && date_fin) {
      query += ' AND date_todo BETWEEN $1 AND $2';
      params.push(date_debut, date_fin);
    }
    
    query += ' ORDER BY ordre ASC, id_todo ASC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération todos:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouveau todo
router.post('/', async (req, res) => {
  try {
    const { texte, date_todo, id_utilisateur } = req.body;
    
    if (!texte || !date_todo) {
      return res.status(400).json({ error: 'Texte et date requis' });
    }
    
    const result = await db.query(
      'INSERT INTO todos (texte, date_todo, id_utilisateur) VALUES ($1, $2, $3) RETURNING *',
      [texte, date_todo, id_utilisateur || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur création todo:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un todo (texte, date, ordre)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { texte, date_todo, ordre } = req.body;
    
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (texte !== undefined) {
      updates.push(`texte = $${paramCount}`);
      params.push(texte);
      paramCount++;
    }
    
    if (date_todo !== undefined) {
      updates.push(`date_todo = $${paramCount}`);
      params.push(date_todo);
      paramCount++;
    }
    
    if (ordre !== undefined) {
      updates.push(`ordre = $${paramCount}`);
      params.push(ordre);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification fournie' });
    }
    
    params.push(id);
    const query = `UPDATE todos SET ${updates.join(', ')} WHERE id_todo = $${paramCount} RETURNING *`;
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur modification todo:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Toggle completed (cocher/décocher)
router.post('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `UPDATE todos 
       SET completed = NOT completed,
           date_completion = CASE WHEN NOT completed THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE id_todo = $1 
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur toggle todo:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un todo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM todos WHERE id_todo = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo non trouvé' });
    }
    
    res.json({ message: 'Todo supprimé' });
  } catch (error) {
    console.error('Erreur suppression todo:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Reporter les todos non terminés d'une date vers une nouvelle date
router.post('/report-incomplete', async (req, res) => {
  try {
    const { date_source, date_destination } = req.body;
    
    if (!date_source || !date_destination) {
      return res.status(400).json({ error: 'Dates source et destination requises' });
    }
    
    const result = await db.query(
      'UPDATE todos SET date_todo = $1 WHERE date_todo = $2 AND completed = false RETURNING *',
      [date_destination, date_source]
    );
    
    res.json({ 
      message: `${result.rows.length} todo(s) reporté(s)`,
      todos: result.rows 
    });
  } catch (error) {
    console.error('Erreur report todos:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction automatique : reporter tous les todos non terminés des jours passés vers aujourd'hui
router.post('/auto-report-past', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await db.query(
      'UPDATE todos SET date_todo = $1 WHERE date_todo < $1 AND completed = false RETURNING *',
      [today]
    );
    
    res.json({ 
      message: `${result.rows.length} todo(s) ancien(s) reporté(s) à aujourd'hui`,
      todos: result.rows 
    });
  } catch (error) {
    console.error('Erreur auto-report todos:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
