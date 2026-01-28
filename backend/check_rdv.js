const db = require('./db');

(async () => {
  try {
    // Afficher la date actuelle du serveur
    const dateRes = await db.query('SELECT CURRENT_DATE, CURRENT_TIME, NOW()');
    console.log('Serveur date/heure:', dateRes.rows[0]);
    
    // Chercher tous les RDV d'aujourd'hui
    const res = await db.query(`
      SELECT id_rdv, cabinet, date_rdv, heure_rdv, statut, ville
      FROM rendez_vous 
      WHERE date_rdv = CURRENT_DATE 
      ORDER BY heure_rdv
    `);
    console.log('\nTous les RDV du jour:');
    console.log(JSON.stringify(res.rows, null, 2));
    
    // Chercher spécifiquement VILLENAVE
    const villenave = await db.query(`
      SELECT id_rdv, cabinet, date_rdv, heure_rdv, statut, ville
      FROM rendez_vous 
      WHERE ville ILIKE '%VILLENAVE%'
      ORDER BY date_rdv DESC, heure_rdv DESC
      LIMIT 5
    `);
    console.log('\nDerniers RDV à VILLENAVE:');
    console.log(JSON.stringify(villenave.rows, null, 2));
  } catch (error) {
    console.error('Erreur:', error);
  }
  process.exit(0);
})();
