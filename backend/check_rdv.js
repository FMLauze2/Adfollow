const db = require('./db');

(async () => {
  try {
    // Chercher les RDV à facturer ou facturés
    const res = await db.query(`
      SELECT id_rdv, cabinet, statut FROM rendez_vous 
      WHERE statut IN ('Effectué', 'Facturé') 
      ORDER BY id_rdv DESC 
      LIMIT 10
    `);
    console.log('RDV à facturer ou facturés:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error('Erreur:', error);
  }
  process.exit(0);
})();
