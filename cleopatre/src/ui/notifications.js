// ==========================================
// SYSTÈME DE NOTIFICATIONS
// ==========================================
// Ce module gère l'affichage des notifications toast à l'utilisateur.
// Fonctionnalités principales:
// - Affichage de notifications de différents types (success, error, warning, cleopatra)
// - Regroupement intelligent des notifications similaires
// - Accumulation des valeurs numériques (+50 puis +30 = +80)
// - Comptage des messages identiques (x2, x3, etc.)
// - Animation d'apparition et de disparition
// ==========================================

/**
 * Liste des emojis de ressources utilisés pour identifier les notifications groupables
 * @type {string[]}
 */
const RESOURCE_EMOJIS = ['🪵', '🪨', '🏜️', '🟤', '🧱', '💰', '💧', '🍞', '👥', '🧑‍🌾'];

/**
 * Patterns pour les notifications avec compteur (transforment le texte)
 * Exemple: "Un paysan part chercher du bois" x3 → "3 paysans partent chercher du bois"
 * @type {Array<{pattern: RegExp, key: string, rebuild: function}>}
 */
const COUNTABLE_PATTERNS = [
    { pattern: /^Un paysan part chercher (.+)$/, key: 'gather', rebuild: (count, match) => `${count} paysans partent chercher ${match}` },
    { pattern: /^Construction de (.+) commencée !$/, key: 'build', rebuild: (count, match) => `${count} constructions de ${match} commencées !` }
];

/**
 * Messages identiques à regrouper avec un compteur simple (x2, x3, etc.)
 * Ces messages d'erreur apparaissent souvent en rafale lors de clics répétés
 * @type {string[]}
 */
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

/**
 * Gestionnaire des notifications toast
 * Affiche des messages temporaires à l'utilisateur avec regroupement intelligent
 */
class NotificationManager {
    /**
     * Crée une nouvelle instance du gestionnaire de notifications
     */
    constructor() {
        /** @type {HTMLElement} Conteneur DOM des notifications */
        this.container = document.getElementById('notifications');

        /** @type {Map<string, object>} Stocke les notifications actives par clé de regroupement */
        this.activeNotifications = new Map();
    }

    /**
     * Recherche un emoji de ressource dans un message
     * Utilisé pour déterminer si deux notifications concernent la même ressource
     * @param {string} message - Le message à analyser
     * @returns {string|null} L'emoji trouvé ou null si aucun
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
     * @param {string} message - Le message à vérifier
     * @returns {object|null} Informations du pattern ou null si pas de correspondance
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
     * Génère les informations de regroupement pour un message
     * Détermine comment ce message peut être fusionné avec d'autres
     * @param {string} message - Le message à analyser
     * @param {string} type - Le type de notification
     * @returns {object|null} Informations de groupement ou null si non groupable
     */
    getGroupInfo(message, type) {
        // Type 1: Messages identiques à regrouper avec compteur (x2, x3)
        if (IDENTICAL_MESSAGES.includes(message)) {
            return {
                key: `${type}_identical_${message}`,
                type: 'identical',
                baseMessage: message
            };
        }

        // Type 2: Patterns comptables (transformation du texte)
        const countable = this.getCountablePattern(message);
        if (countable) {
            return {
                key: `${type}_${countable.key}_${countable.match}`,
                type: 'countable',
                pattern: countable
            };
        }

        // Type 3: Messages numériques avec ressource (accumulation des valeurs)
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
     * @param {string} message - Le message contenant un nombre
     * @returns {number|null} La valeur extraite ou null si pas de nombre
     */
    extractValue(message) {
        const match = /([+-]?\d+)/.exec(message);
        return match ? Number.parseInt(match[1], 10) : null;
    }

    /**
     * Reconstruit le message avec une nouvelle valeur numérique
     * @param {string} originalMessage - Le message original
     * @param {number} newValue - La nouvelle valeur à insérer
     * @returns {string} Le message mis à jour
     */
    rebuildMessage(originalMessage, newValue) {
        const prefix = newValue >= 0 ? '+' : '';
        return originalMessage.replace(/[+-]?\d+/, `${prefix}${newValue}`);
    }

    /**
     * Affiche une notification
     * Gère le regroupement avec les notifications existantes si applicable
     * @param {string} message - Le message à afficher
     * @param {string} type - Le type (success, error, warning, cleopatra, info)
     * @param {number} duration - Durée d'affichage en millisecondes
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
                // Incrémenter le compteur et reconstruire le texte
                existing.count += 1;
                existing.element.textContent = groupInfo.pattern.rebuild(existing.count, groupInfo.pattern.match);
            } else {
                // Accumuler la valeur numérique
                const newValue = this.extractValue(message);
                if (newValue !== null) {
                    existing.accumulatedValue += newValue;
                    existing.element.textContent = this.rebuildMessage(message, existing.accumulatedValue);
                }
            }

            // Animation de mise à jour (flash visuel)
            existing.element.classList.remove('updated');
            existing.element.offsetWidth; // Force reflow pour relancer l'animation
            existing.element.classList.add('updated');

            // Reset le timer de suppression
            clearTimeout(existing.timeoutId);
            existing.timeoutId = this.scheduleRemoval(existing.element, groupInfo.key, duration);

            return;
        }

        // Créer une nouvelle notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        this.container.appendChild(notification);

        // Si groupable, stocker la référence pour regroupement futur
        if (groupInfo) {
            const timeoutId = this.scheduleRemoval(notification, groupInfo.key, duration);

            this.activeNotifications.set(groupInfo.key, {
                element: notification,
                accumulatedValue: groupInfo.type === 'numeric' ? (this.extractValue(message) || 0) : 0,
                count: 1,
                timeoutId: timeoutId
            });
        } else {
            // Notification non groupable - comportement standard
            this.scheduleRemoval(notification, null, duration);
        }
    }

    /**
     * Programme la suppression d'une notification après un délai
     * Gère l'animation de sortie (fade out + slide)
     * @param {HTMLElement} notification - L'élément DOM de la notification
     * @param {string|null} groupKey - La clé de regroupement (pour nettoyer la map)
     * @param {number} duration - Durée avant suppression en millisecondes
     * @returns {number} L'ID du timeout (pour annulation éventuelle)
     */
    scheduleRemoval(notification, groupKey, duration) {
        return setTimeout(() => {
            // Animation de sortie
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'all 0.3s ease';

            // Suppression effective après l'animation
            setTimeout(() => {
                notification.remove();
                if (groupKey) {
                    this.activeNotifications.delete(groupKey);
                }
            }, 300);
        }, duration);
    }

    /**
     * Affiche une notification de succès (verte)
     * @param {string} message - Le message à afficher
     */
    success(message) {
        this.show(message, 'success');
    }

    /**
     * Affiche une notification d'erreur (rouge, durée plus longue)
     * @param {string} message - Le message à afficher
     */
    error(message) {
        this.show(message, 'error', 5000);
    }

    /**
     * Affiche une notification d'avertissement (orange)
     * @param {string} message - Le message à afficher
     */
    warning(message) {
        this.show(message, 'warning');
    }

    /**
     * Affiche une notification de Cléopâtre (dorée, avec icône couronne)
     * @param {string} message - Le message à afficher
     */
    cleopatra(message) {
        this.show(`👑 ${message}`, 'cleopatra', 6000);
    }

    /**
     * Affiche une notification d'information (bleue, durée courte)
     * @param {string} message - Le message à afficher
     */
    info(message) {
        this.show(message, 'info', 3000);
    }
}

export default NotificationManager;
