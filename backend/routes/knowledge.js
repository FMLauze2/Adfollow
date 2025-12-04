const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');

// Récupérer tous les articles (avec filtres optionnels)
router.get('/', async (req, res) => {
  try {
    const { categorie, search, archived } = req.query;
    
    let query = 'SELECT * FROM knowledge_base WHERE 1=1';
    let params = [];
    let paramCount = 1;
    
    if (archived !== undefined) {
      query += ` AND archived = $${paramCount}`;
      params.push(archived === 'true');
      paramCount++;
    } else {
      query += ' AND archived = false';
    }
    
    if (categorie) {
      query += ` AND categorie = $${paramCount}`;
      params.push(categorie);
      paramCount++;
    }
    
    if (search) {
      query += ` AND (
        titre ILIKE $${paramCount} OR 
        contenu ILIKE $${paramCount} OR
        $${paramCount + 1} = ANY(tags)
      )`;
      params.push(`%${search}%`, search);
      paramCount += 2;
    }
    
    query += ' ORDER BY date_modification DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération articles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un article par ID et incrémenter les vues
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Incrémenter le compteur de vues
    await db.query('UPDATE knowledge_base SET vues = vues + 1 WHERE id_article = $1', [id]);
    
    const result = await db.query('SELECT * FROM knowledge_base WHERE id_article = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération article:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouvel article
router.post('/', async (req, res) => {
  try {
    const { titre, contenu, categorie, tags, auteur } = req.body;
    
    if (!titre || !contenu || !categorie) {
      return res.status(400).json({ error: 'Titre, contenu et catégorie requis' });
    }
    
    const result = await db.query(
      `INSERT INTO knowledge_base (titre, contenu, categorie, tags, auteur) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [titre, contenu, categorie, tags || [], auteur || 'Inconnu']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur création article:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un article
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, contenu, categorie, tags } = req.body;
    
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (titre !== undefined) {
      updates.push(`titre = $${paramCount}`);
      params.push(titre);
      paramCount++;
    }
    
    if (contenu !== undefined) {
      updates.push(`contenu = $${paramCount}`);
      params.push(contenu);
      paramCount++;
    }
    
    if (categorie !== undefined) {
      updates.push(`categorie = $${paramCount}`);
      params.push(categorie);
      paramCount++;
    }
    
    if (tags !== undefined) {
      updates.push(`tags = $${paramCount}`);
      params.push(tags);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification fournie' });
    }
    
    updates.push(`date_modification = CURRENT_TIMESTAMP`);
    params.push(id);
    
    const query = `UPDATE knowledge_base SET ${updates.join(', ')} WHERE id_article = $${paramCount} RETURNING *`;
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur modification article:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer comme utile
router.post('/:id/helpful', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE knowledge_base SET utile = utile + 1 WHERE id_article = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur marquage utile:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Archiver/Désarchiver
router.post('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const { archived } = req.body;
    
    const result = await db.query(
      'UPDATE knowledge_base SET archived = $1 WHERE id_article = $2 RETURNING *',
      [archived, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur archivage:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un article
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM knowledge_base WHERE id_article = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    res.json({ message: 'Article supprimé' });
  } catch (error) {
    console.error('Erreur suppression article:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les catégories existantes
router.get('/meta/categories', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT DISTINCT categorie, COUNT(*) as count FROM knowledge_base WHERE archived = false GROUP BY categorie ORDER BY categorie'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Upload d'une image (conversion en base64)
router.post('/upload-image', async (req, res) => {
  try {
    const { filename, base64Data, mimeType } = req.body;
    
    if (!filename || !base64Data || !mimeType) {
      return res.status(400).json({ error: 'Données manquantes' });
    }
    
    // Calculer la taille en bytes (base64 fait ~1.37x la taille originale)
    const sizeBytes = Math.round((base64Data.length * 3) / 4);
    
    // Limiter à 2MB
    if (sizeBytes > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image trop volumineuse (max 2MB)' });
    }
    
    const result = await db.query(
      `INSERT INTO knowledge_images (filename, base64_data, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4)
       RETURNING id_image, filename, mime_type, size_bytes, date_upload`,
      [filename, base64Data, mimeType, sizeBytes]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur upload image:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer une image par ID
router.get('/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM knowledge_images WHERE id_image = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération image:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Lier une image à un article
router.post('/:articleId/images/:imageId', async (req, res) => {
  try {
    const { articleId, imageId } = req.params;
    const { ordre } = req.body;
    
    await db.query(
      `INSERT INTO knowledge_article_images (id_article, id_image, ordre)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_article, id_image) DO UPDATE SET ordre = $3`,
      [articleId, imageId, ordre || 0]
    );
    
    res.json({ message: 'Image liée à l\'article' });
  } catch (error) {
    console.error('Erreur liaison image:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les images d'un article
router.get('/:articleId/images', async (req, res) => {
  try {
    const { articleId } = req.params;
    
    const result = await db.query(
      `SELECT ki.*, kai.ordre
       FROM knowledge_images ki
       JOIN knowledge_article_images kai ON ki.id_image = kai.id_image
       WHERE kai.id_article = $1
       ORDER BY kai.ordre, ki.date_upload`,
      [articleId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération images article:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une image (et ses liaisons)
router.delete('/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM knowledge_images WHERE id_image = $1', [id]);
    
    res.json({ message: 'Image supprimée' });
  } catch (error) {
    console.error('Erreur suppression image:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
