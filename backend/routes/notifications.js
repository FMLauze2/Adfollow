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

module.exports = router;
