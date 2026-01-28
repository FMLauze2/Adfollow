const db = require('./db');

(async () => {
  try {
    // Afficher la date actuelle du serveur
    const dateRes = await db.query('SELECT CURRENT_DATE, NOW()::date as date_locale');
    console.log('Serveur date:', dateRes.rows[0]);
    
    // Chercher tous les RDV à partir d'aujourd'hui
    const res = await db.query(`
      SELECT id_rdv, cabinet, date_rdv, heure_rdv, statut, archive
      FROM rendez_vous 
      WHERE DATE(date_rdv AT TIME ZONE 'Europe/Paris') >= CURRENT_DATE
      ORDER BY date_rdv DESC
      LIMIT 20
    `);
    console.log('\nRDV à partir d\'aujourd\'hui:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error('Erreur:', error);
  }
  process.exit(0);
})();
