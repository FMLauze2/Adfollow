// backend/routes/search.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/search - Recherche globale dans toute l'application
 * Query param: q (terme de recherche)
 */
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        rdv: [],
        contrats: [],
        cabinets: [],
        knowledge: []
      });
    }

    const searchTerm = `%${q.toLowerCase()}%`;

    // Recherche dans les RDV
    const rdvResults = await pool.query(`
      SELECT id_rdv, cabinet, type_rdv, date_rdv, heure_rdv, ville, statut, notes
      FROM rendez_vous
      WHERE (
        LOWER(cabinet) LIKE $1 OR
        LOWER(ville) LIKE $1 OR
        LOWER(type_rdv) LIKE $1 OR
        LOWER(notes) LIKE $1 OR
        LOWER(praticiens::text) LIKE $1
      )
      AND (archive = FALSE OR archive IS NULL)
      ORDER BY date_rdv DESC
      LIMIT 20
    `, [searchTerm]);

    // Recherche dans les contrats
    const contratResults = await pool.query(`
      SELECT id_contrat, cabinet, ville, prix, 
             TO_CHAR(date_creation, 'YYYY-MM-DD') as date_creation,
             TO_CHAR(date_envoi, 'YYYY-MM-DD') as date_envoi,
             TO_CHAR(date_reception, 'YYYY-MM-DD') as date_reception
      FROM contrats
      WHERE (
        LOWER(cabinet) LIKE $1 OR
        LOWER(ville) LIKE $1 OR
        LOWER(praticiens::text) LIKE $1 OR
        LOWER(adresse) LIKE $1
      )
      ORDER BY date_creation DESC
      LIMIT 20
    `, [searchTerm]);

    // Recherche dans les cabinets (distinct des RDV)
    const cabinetResults = await pool.query(`
      SELECT DISTINCT ON (cabinet) 
        cabinet, ville, adresse, code_postal
      FROM rendez_vous
      WHERE LOWER(cabinet) LIKE $1
      ORDER BY cabinet, date_rdv DESC
      LIMIT 10
    `, [searchTerm]);

    // Recherche dans la base de connaissances
    const knowledgeResults = await pool.query(`
      SELECT id, title, category, content
      FROM knowledge_base
      WHERE (
        LOWER(title) LIKE $1 OR
        LOWER(content) LIKE $1 OR
        LOWER(category) LIKE $1
      )
      ORDER BY created_at DESC
      LIMIT 15
    `, [searchTerm]);

    // Formater les résultats
    res.json({
      rdv: rdvResults.rows.map(r => ({
        ...r,
        _type: 'rdv',
        _label: `${r.cabinet} - ${r.type_rdv}`,
        _date: r.date_rdv,
        _url: `/installations?traiter=${r.id_rdv}`
      })),
      contrats: contratResults.rows.map(c => {
        let statut = 'Brouillon';
        if (c.date_reception) statut = 'Reçu';
        else if (c.date_envoi) statut = 'Envoyé';
        
        return {
          ...c,
          statut,
          _type: 'contrat',
          _label: `Contrat ${c.cabinet}`,
          _date: c.date_creation,
          _url: `/contrats-suivi`
        };
      }),
      cabinets: cabinetResults.rows.map(cab => ({
        ...cab,
        _type: 'cabinet',
        _label: cab.cabinet,
        _location: `${cab.ville || ''} ${cab.code_postal || ''}`.trim(),
        _url: `/installations?search=${encodeURIComponent(cab.cabinet)}`
      })),
      knowledge: knowledgeResults.rows.map(k => ({
        ...k,
        _type: 'knowledge',
        _label: k.title,
        _category: k.category,
        _preview: k.content.substring(0, 150) + '...',
        _url: `/knowledge`
      }))
    });

  } catch (err) {
    console.error('Erreur recherche globale:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
