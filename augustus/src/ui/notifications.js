// ==========================================
// SYSTÈME DE NOTIFICATIONS
// ==========================================

class NotificationManager {
    constructor(containerId = 'notifications') {
        this.container = document.getElementById(containerId);
        this.defaultDuration = 4000;
    }

    /**
     * Affiche une notification
     * @param {string} message - Le message à afficher
     * @param {string} type - Type: 'info', 'success', 'warning', 'error'
     * @param {number} duration - Durée en ms (optionnel)
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.textContent = message;

        this.container.appendChild(notif);

        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transform = 'translateX(100%)';
            setTimeout(() => notif.remove(), 300);
        }, duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration);
    }
}

export default NotificationManager;
