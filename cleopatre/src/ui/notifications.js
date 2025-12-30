// ==========================================
// SYSTÈME DE NOTIFICATIONS
// ==========================================

// Liste des emojis de ressources pour le groupement
const RESOURCE_EMOJIS = ['🪵', '🪨', '🏜️', '🟤', '🧱', '💰', '💧', '🍞', '👥', '🧑‍🌾'];

// Patterns pour les notifications comptables (sans nombre initial)
const COUNTABLE_PATTERNS = [
    { pattern: /^Un paysan part chercher (.+)$/, key: 'gather', rebuild: (count, match) => `${count} paysans partent chercher ${match}` },
    { pattern: /^Construction de (.+) commencée !$/, key: 'build', rebuild: (count, match) => `${count} constructions de ${match} commencées !` }
];

// Messages identiques à regrouper avec un compteur (x2, x3, etc.)
const IDENTICAL_MESSAGES = [
    "Pas d'ouvriers disponibles !",
    "Pas assez d'argent !",
    "Pas assez de bois !",
    "Pas assez de pierre !",
    "Pas assez de sable !",
    "Pas assez de terre !",
    "Pas assez d'argile !",
    "Pas assez d'eau !",
    "Maximum atteint !",
    "Construction impossible !",
    "Action impossible !"
];

class NotificationManager {
    constructor() {
        this.container = document.getElementById('notifications');
        this.activeNotifications = new Map(); // Stocke les notifications actives par clé
    }

    /**
     * Trouve l'emoji de ressource dans un message
     * @param {string} message - Le message
     * @returns {string|null} - L'emoji trouvé ou null
     */
    findResourceEmoji(message) {
        for (const emoji of RESOURCE_EMOJIS) {
            if (message.includes(emoji)) {
                return emoji;
            }
        }
        return null;
    }

    /**
     * Vérifie si le message correspond à un pattern comptable
     * @param {string} message - Le message
     * @returns {object|null} - Info du pattern ou null
     */
    getCountablePattern(message) {
        for (const p of COUNTABLE_PATTERNS) {
            const match = p.pattern.exec(message);
            if (match) {
                return { ...p, match: match[1] };
            }
        }
        return null;
    }

    /**
     * Génère une clé de regroupement basée sur le pattern du message
     * @param {string} message - Le message
     * @param {string} type - Le type de notification
     * @returns {object|null} - Info de groupement ou null
     */
    getGroupInfo(message, type) {
        // Vérifier les messages identiques à regrouper
        if (IDENTICAL_MESSAGES.includes(message)) {
            return {
                key: `${type}_identical_${message}`,
                type: 'identical',
                baseMessage: message
            };
        }

        // Vérifier les patterns comptables
        const countable = this.getCountablePattern(message);
        if (countable) {
            return {
                key: `${type}_${countable.key}_${countable.match}`,
                type: 'countable',
                pattern: countable
            };
        }

        // Vérifier si le message contient un nombre et un emoji de ressource
        const hasNumber = /[+-]?\d+/.test(message);
        const emoji = this.findResourceEmoji(message);

        if (hasNumber && emoji) {
            return {
                key: `${type}_resource_${emoji}`,
                type: 'numeric'
            };
        }

        return null;
    }

    /**
     * Extrait la valeur numérique d'un message
     * @param {string} message - Le message
     * @returns {number|null} - La valeur ou null
     */
    extractValue(message) {
        const match = /([+-]?\d+)/.exec(message);
        return match ? Number.parseInt(match[1], 10) : null;
    }

    /**
     * Reconstruit le message avec la nouvelle valeur
     * @param {string} originalMessage - Le message original
     * @param {number} newValue - La nouvelle valeur
     * @returns {string} - Le nouveau message
     */
    rebuildMessage(originalMessage, newValue) {
        const prefix = newValue >= 0 ? '+' : '';
        return originalMessage.replace(/[+-]?\d+/, `${prefix}${newValue}`);
    }

    /**
     * Affiche une notification
     * @param {string} message - Le message à afficher
     * @param {string} type - Le type (success, error, warning, cleopatra)
     * @param {number} duration - Durée d'affichage en ms
     */
    show(message, type = 'info', duration = 4000) {
        const groupInfo = this.getGroupInfo(message, type);

        // Vérifier si on peut regrouper avec une notification existante
        if (groupInfo && this.activeNotifications.has(groupInfo.key)) {
            const existing = this.activeNotifications.get(groupInfo.key);

            if (groupInfo.type === 'identical') {
                // Incrémenter le compteur pour les messages identiques
                existing.count += 1;
                existing.element.textContent = `${groupInfo.baseMessage} (x${existing.count})`;
            } else if (groupInfo.type === 'countable') {
                // Incrémenter le compteur pour les patterns comptables
                existing.count += 1;
                existing.element.textContent = groupInfo.pattern.rebuild(existing.count, groupInfo.pattern.match);
            } else {
                // Accumuler la valeur pour les numériques
                const newValue = this.extractValue(message);
                if (newValue !== null) {
                    existing.accumulatedValue += newValue;
                    existing.element.textContent = this.rebuildMessage(message, existing.accumulatedValue);
                }
            }

            // Animation de mise à jour (force reflow pour relancer l'animation)
            existing.element.classList.remove('updated');
            existing.element.offsetWidth; // eslint-disable-line no-unused-expressions
            existing.element.classList.add('updated');

            // Reset le timer
            clearTimeout(existing.timeoutId);
            existing.timeoutId = this.scheduleRemoval(existing.element, groupInfo.key, duration);

            return;
        }

        // Créer une nouvelle notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        this.container.appendChild(notification);

        // Si groupable, stocker la référence
        if (groupInfo) {
            const timeoutId = this.scheduleRemoval(notification, groupInfo.key, duration);

            this.activeNotifications.set(groupInfo.key, {
                element: notification,
                accumulatedValue: groupInfo.type === 'numeric' ? (this.extractValue(message) || 0) : 0,
                count: 1, // Pour les patterns comptables
                timeoutId: timeoutId
            });
        } else {
            // Notification non groupable - comportement standard
            this.scheduleRemoval(notification, null, duration);
        }
    }

    /**
     * Programme la suppression d'une notification
     * @param {HTMLElement} notification - L'élément notification
     * @param {string|null} groupKey - La clé de regroupement
     * @param {number} duration - Durée avant suppression
     * @returns {number} - L'ID du timeout
     */
    scheduleRemoval(notification, groupKey, duration) {
        return setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'all 0.3s ease';

            setTimeout(() => {
                notification.remove();
                if (groupKey) {
                    this.activeNotifications.delete(groupKey);
                }
            }, 300);
        }, duration);
    }

    /**
     * Notification de succès
     */
    success(message) {
        this.show(message, 'success');
    }

    /**
     * Notification d'erreur
     */
    error(message) {
        this.show(message, 'error', 5000);
    }

    /**
     * Notification d'avertissement
     */
    warning(message) {
        this.show(message, 'warning');
    }

    /**
     * Notification de Cléopâtre
     */
    cleopatra(message) {
        this.show(`👑 ${message}`, 'cleopatra', 6000);
    }

    /**
     * Notification d'information
     */
    info(message) {
        this.show(message, 'info', 3000);
    }
}

export default NotificationManager;
