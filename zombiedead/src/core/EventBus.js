/**
 * Système de publication/abonnement pour la communication découplée entre systèmes
 * Permet aux modules de communiquer sans dépendances directes
 */
export class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this._listeners = new Map();
    }

    /**
     * Abonne un callback à un événement
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à appeler
     */
    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);
    }

    /**
     * Désabonne un callback d'un événement
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à retirer
     */
    off(event, callback) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    /**
     * Émet un événement avec des données optionnelles
     * @param {string} event - Nom de l'événement
     * @param {*} [data] - Données associées à l'événement
     */
    emit(event, data) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            for (const callback of listeners) {
                callback(data);
            }
        }
    }

    /** Supprime tous les abonnements */
    clear() {
        this._listeners.clear();
    }
}
