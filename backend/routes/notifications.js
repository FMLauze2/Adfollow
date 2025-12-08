const express = require('express');
const router = express.Router();
const notificationService = require('../services/NotificationService');

// GET toutes les notifications non lues
router.get('/unread', async (req, res) => {
  try {
    const notifications = await notificationService.getUnreadNotifications();
    res.json(notifications);
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT marquer une notification comme lue
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await notificationService.markAsRead(id);
    
    if (success) {
      res.json({ message: 'Notification marquée comme lue' });
    } else {
      res.status(500).json({ error: 'Erreur marquage notification' });
    }
  } catch (error) {
    console.error('Erreur marquage notification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT marquer toutes les notifications comme lues
router.put('/read-all', async (req, res) => {
  try {
    const success = await notificationService.markAllAsRead();
    
    if (success) {
      res.json({ message: 'Toutes les notifications marquées comme lues' });
    } else {
      res.status(500).json({ error: 'Erreur marquage notifications' });
    }
  } catch (error) {
    console.error('Erreur marquage notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE supprimer les notifications anciennes (avant le mois en cours)
router.delete('/cleanup-old', async (req, res) => {
  try {
    const pool = require('../db');
    
    // Calculer le 1er jour du mois en cours
    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const cutoffDateStr = firstDayOfCurrentMonth.toISOString().split('T')[0];

    // Supprimer les notifications pour les RDV antérieurs au mois en cours
    const result = await pool.query(
      `DELETE FROM notifications 
       WHERE type_notification IN ('facturation', 'contrat_manquant')
       AND id_rdv IN (
         SELECT id_rdv FROM rendez_vous WHERE date_rdv < $1
       )`,
      [cutoffDateStr]
    );

    // Supprimer aussi les notifications de RDV archivés
    const archivedResult = await pool.query(
      `DELETE FROM notifications 
       WHERE type_notification IN ('facturation', 'contrat_manquant')
       AND id_rdv IN (
         SELECT id_rdv FROM rendez_vous WHERE archive = TRUE
       )`
    );

    const totalDeleted = result.rowCount + archivedResult.rowCount;
    
    res.json({ 
      success: true, 
      deleted: totalDeleted,
      message: `${totalDeleted} notification(s) supprimée(s)`
    });
  } catch (error) {
    console.error('Erreur nettoyage notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
