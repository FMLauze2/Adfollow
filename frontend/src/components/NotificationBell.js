import React, { useState, useEffect } from 'react';
import axios from 'axios';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Charger les notifications au montage
    fetchNotifications();

    // Polling toutes les 15 secondes
    const interval = setInterval(fetchNotifications, 15000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/notifications/unread');
      const notifs = response.data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.length);

      // Afficher une notification browser si nouvelle notification
      if (notifs.length > unreadCount && unreadCount >= 0) {
        showBrowserNotification(notifs[0]);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  const showBrowserNotification = (notification) => {
    if (!notification) return;

    // Demander la permission si pas encore accordée
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Afficher la notification si permission accordée
    if (Notification.permission === 'granted') {
      const notif = new Notification('🔔 AdFollow', {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `notif-${notification.id_notification}`,
        requireInteraction: true
      });

      // Jouer un son
      playNotificationSound();

      // Fermer après 10 secondes
      setTimeout(() => notif.close(), 10000);

      // Clic sur la notification
      notif.onclick = () => {
        window.focus();
        markAsRead(notification.id_notification);
        notif.close();
      };
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Erreur lecture son:', e));
    } catch (error) {
      console.log('Son notification non disponible');
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await axios.put(`http://localhost:4000/api/notifications/${notifId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('http://localhost:4000/api/notifications/read-all');
      fetchNotifications();
      setShowDropdown(false);
    } catch (error) {
      console.error('Erreur marquage notifications:', error);
    }
  };

  const cleanupOldNotifications = async () => {
    if (!window.confirm('Supprimer toutes les notifications pour les RDV du mois précédent et archivés ?')) {
      return;
    }

    try {
      const response = await axios.delete('http://localhost:4000/api/notifications/cleanup-old');
      alert(`✅ ${response.data.deleted} notification(s) supprimée(s)`);
      fetchNotifications();
    } catch (error) {
      console.error('Erreur nettoyage notifications:', error);
      alert('❌ Erreur lors du nettoyage des notifications');
    }
  };

  const formatDateTime = (dateRdv, heureRdv) => {
    // Si pas de date (notifications sans RDV comme daily_manquant)
    if (!dateRdv || !heureRdv) {
      return '';
    }
    
    // Extraire la date sans conversion de fuseau horaire
    const dateStr = typeof dateRdv === 'string' ? dateRdv.split('T')[0] : dateRdv;
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const jour = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    return `${jour} à ${heureRdv}`;
  };

  return (
    <div className="relative">
      {/* Bouton cloche */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        title="Notifications"
      >
        <span className="text-2xl">🔔</span>
        
        {/* Badge compteur */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown des notifications */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* En-tête */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg dark:text-white">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              {unreadCount > 0 && notifications.some(n => n.type_notification !== 'facturation' && n.type_notification !== 'contrat_manquant' && n.type_notification !== 'daily_manquant') && (
                <button
                  onClick={async () => {
                    // Marquer comme lues uniquement les notifications qui ne sont pas persistantes
                    for (const notif of notifications) {
                      if (notif.type_notification !== 'facturation' && 
                          notif.type_notification !== 'contrat_manquant' && 
                          notif.type_notification !== 'daily_manquant') {
                        await markAsRead(notif.id_notification);
                      }
                    }
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            {/* Bouton nettoyage */}
            <button
              onClick={cleanupOldNotifications}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 hover:underline"
              title="Supprimer les notifications pour les RDV du mois précédent et archivés"
            >
              🗑️ Nettoyer les anciennes notifications
            </button>
          </div>

          {/* Liste des notifications */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-2">✅</div>
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notif) => (
                  <div
                    key={notif.id_notification}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                    onClick={() => {
                      if (notif.type_notification === 'daily_manquant') {
                        // Dès que le daily est complété, on laisse l'utilisateur vider la notif
                        markAsRead(notif.id_notification);
                        window.location.href = '/dailyreports';
                        return;
                      }

                      // Ne pas auto-marquer les notifs persistantes (facturation / contrat)
                      if (notif.type_notification !== 'facturation' && 
                          notif.type_notification !== 'contrat_manquant') {
                        markAsRead(notif.id_notification);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      {notif.cabinet && (
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {notif.cabinet}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${
                        notif.type_notification === '15min' 
                          ? 'bg-red-100 text-red-700' 
                          : notif.type_notification === '1heure'
                          ? 'bg-orange-100 text-orange-700'
                          : notif.type_notification === 'facturation'
                          ? 'bg-yellow-100 text-yellow-700'
                          : notif.type_notification === 'contrat_manquant'
                          ? 'bg-purple-100 text-purple-700'
                          : notif.type_notification === 'daily_manquant'
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {notif.type_notification === '15min' && '⚠️ 15min'}
                        {notif.type_notification === '1heure' && '⏰ 1h'}
                        {notif.type_notification === '1jour' && '📅 1 jour'}
                        {notif.type_notification === 'facturation' && '💰 À facturer'}
                        {notif.type_notification === 'contrat_manquant' && '📄 Contrat manquant'}
                        {notif.type_notification === 'daily_manquant' && '📊 Daily manquant'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {notif.message}
                    </p>
                    {(notif.date_rdv || notif.type_rdv) && (
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        {notif.date_rdv && notif.heure_rdv && (
                          <span>{formatDateTime(notif.date_rdv, notif.heure_rdv)}</span>
                        )}
                        {notif.type_rdv && <span>{notif.type_rdv}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pied */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <button
                onClick={() => setShowDropdown(false)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
