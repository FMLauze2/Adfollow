const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../db');
const { parseICS, convertICSToRDV } = require('../services/ics/parseICS');

// Configuration multer pour l'upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/calendar' || file.originalname.endsWith('.ics')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers .ics sont acceptés'));
    }
  }
});

// POST /api/import-ics - Importer des RDV depuis un fichier ICS
router.post('/', upload.single('icsFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const icsContent = req.file.buffer.toString('utf-8');
    const events = parseICS(icsContent);

    if (events.length === 0) {
      return res.status(400).json({ error: 'Aucun événement trouvé dans le fichier ICS' });
    }

    const importResults = {
      imported: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    for (const event of events) {
      try {
        const rdv = convertICSToRDV(event);

        // Vérifier si un RDV avec le même UID existe déjà
        if (rdv.ics_uid) {
          const existing = await pool.query(
            'SELECT id_rdv FROM rendez_vous WHERE ics_uid = $1',
            [rdv.ics_uid]
          );

          if (existing.rows.length > 0) {
            importResults.skipped++;
            importResults.details.push({
              cabinet: rdv.cabinet,
              date: rdv.date_rdv,
              status: 'skipped',
              reason: 'RDV déjà importé (UID existant)'
            });
            continue;
          }
        }

        // Vérifier les doublons basés sur cabinet + date + heure
        const duplicate = await pool.query(
          'SELECT id_rdv FROM rendez_vous WHERE cabinet = $1 AND date_rdv = $2 AND heure_rdv = $3',
          [rdv.cabinet, rdv.date_rdv, rdv.heure_rdv]
        );

        if (duplicate.rows.length > 0) {
          importResults.skipped++;
          importResults.details.push({
            cabinet: rdv.cabinet,
            date: rdv.date_rdv,
            status: 'skipped',
            reason: 'RDV similaire existe déjà (même cabinet/date/heure)'
          });
          continue;
        }

        // Insérer le nouveau RDV
        const result = await pool.query(
          `INSERT INTO rendez_vous (
            cabinet, type_rdv, date_rdv, heure_rdv, 
            adresse, ville, code_postal, 
            telephone, email, statut, notes, ics_uid
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id_rdv`,
          [
            rdv.cabinet, rdv.type_rdv, rdv.date_rdv, rdv.heure_rdv,
            rdv.adresse, rdv.ville, rdv.code_postal,
            rdv.telephone, rdv.email, rdv.statut, rdv.notes, rdv.ics_uid
          ]
        );

        importResults.imported++;
        importResults.details.push({
          cabinet: rdv.cabinet,
          date: rdv.date_rdv,
          status: 'imported',
          id_rdv: result.rows[0].id_rdv
        });

      } catch (error) {
        console.error('Erreur import événement:', error);
        importResults.errors++;
        importResults.details.push({
          cabinet: event.summary || 'Inconnu',
          status: 'error',
          reason: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Import terminé: ${importResults.imported} importés, ${importResults.skipped} ignorés, ${importResults.errors} erreurs`,
      results: importResults
    });

  } catch (error) {
    console.error('Erreur import ICS:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import du fichier ICS', details: error.message });
  }
});

module.exports = router;
