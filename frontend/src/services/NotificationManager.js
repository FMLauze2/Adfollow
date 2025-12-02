import axios from 'axios';

class NotificationManager {
  constructor() {
    this.checkInterval = null;
    this.notifiedRdvIds = new Set(); // Pour éviter les notifications en double
    this.isEnabled = false;
  }

  // Demander la permission pour les notifications
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications desktop');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Démarrer la vérification périodique
  async start() {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('Permission de notification refusée');
      return;
    }

    this.isEnabled = true;
    
    // Vérifier immédiatement
    this.checkUpcomingRdv();

    // Puis vérifier toutes les 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkUpcomingRdv();
    }, 5 * 60 * 1000); // 5 minutes

    console.log('NotificationManager démarré');
  }

  // Arrêter la vérification
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isEnabled = false;
    console.log('NotificationManager arrêté');
  }

  // Vérifier les RDV à venir dans l'heure
  async checkUpcomingRdv() {
    if (!this.isEnabled) return;

    try {
      const response = await axios.get('http://localhost:4000/api/rendez-vous');
      const rdvList = response.data || [];

      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      // Filtrer les RDV planifiés dans l'heure qui vient
      const upcomingRdv = rdvList.filter(rdv => {
        if (rdv.statut !== 'Planifié') return false;
        if (this.notifiedRdvIds.has(rdv.id_rdv)) return false; // Déjà notifié

        // Parser la date et l'heure du RDV
        const rdvDateTime = new Date(`${rdv.date_rdv.split('T')[0]}T${rdv.heure_rdv}`);
        
        // Vérifier si le RDV est dans l'heure qui vient
        return rdvDateTime > now && rdvDateTime <= oneHourLater;
      });

      // Envoyer une notification pour chaque RDV
      upcomingRdv.forEach(rdv => {
        this.sendNotification(rdv);
        this.notifiedRdvIds.add(rdv.id_rdv);
      });

    } catch (error) {
      console.error('Erreur lors de la vérification des RDV:', error);
    }
  }

  // Envoyer une notification
  sendNotification(rdv) {
    const dateRdv = new Date(`${rdv.date_rdv.split('T')[0]}T${rdv.heure_rdv}`);
    const timeString = dateRdv.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const title = `🔔 RDV dans moins d'1 heure`;
    const body = `${rdv.type_rdv}\n📍 ${rdv.cabinet} - ${rdv.ville}\n🕐 ${timeString}`;

    const notification = new Notification(title, {
      body: body,
      icon: '/logo192.png', // Utilise le logo de l'app si disponible
      badge: '/logo192.png',
      tag: `rdv-${rdv.id_rdv}`, // Pour ne pas dupliquer
      requireInteraction: true, // La notification reste affichée
      silent: false
    });

    notification.onclick = () => {
      window.focus();
      // Optionnel: naviguer vers la page des installations
      window.location.href = '/installations';
      notification.close();
    };

    console.log(`Notification envoyée pour RDV ${rdv.id_rdv}`);
  }

  // Nettoyer les IDs notifiés (utile pour éviter que le Set ne grossisse indéfiniment)
  clearNotifiedIds() {
    this.notifiedRdvIds.clear();
  }
}

// Singleton
const notificationManager = new NotificationManager();

export default notificationManager;
