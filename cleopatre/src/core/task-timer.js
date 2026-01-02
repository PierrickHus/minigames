// ==========================================
// TASK TIMER
// ==========================================
// Timer spécialisé pour les tâches de Cléopâtre.
// Étend GameTimer avec des fonctionnalités spécifiques aux missions.
// ==========================================

import GameTimer, { TIMER_MODE, TIMER_STATE } from './game-timer.js';

/**
 * Timer spécialisé pour les tâches/missions de Cléopâtre
 * Ajoute la gestion des rappels, des états visuels et de l'intégration avec le scénario
 */
class TaskTimer extends GameTimer {
    /**
     * Crée un nouveau timer de tâche
     * @param {object} options - Options de configuration
     * @param {number} options.duration - Durée totale en secondes
     * @param {boolean} [options.isTutorialTask=false] - Tâche de tutoriel
     * @param {boolean} [options.startFrozen=false] - Démarrer gelé
     * @param {Function} [options.onExpire] - Callback quand le timer expire
     * @param {Function} [options.onHalfTime] - Callback à mi-temps
     */
    constructor(options = {}) {
        const {
            duration,
            isTutorialTask = false,
            startFrozen = false,
            onExpire = null,
            onHalfTime = null,
            ...baseOptions
        } = options;

        super({
            duration,
            mode: TIMER_MODE.COUNTDOWN,
            autoStart: !startFrozen,
            ...baseOptions
        });

        /** @type {boolean} Tâche de tutoriel (contrôlée par le scénario) */
        this.isTutorialTask = isTutorialTask;

        /** @type {Function|null} Callback quand le timer expire */
        this.onExpire = onExpire;

        /** @type {Function|null} Callback à mi-temps (rappel) */
        this.onHalfTime = onHalfTime;

        /** @type {boolean} Rappel déjà envoyé */
        this._halfTimeTriggered = false;

        // Si startFrozen, geler immédiatement
        if (startFrozen) {
            this.state = TIMER_STATE.FROZEN;
            this._frozenValue = duration;
        }
    }

    // ==========================================
    // PROPRIÉTÉS SPÉCIFIQUES AUX TÂCHES
    // ==========================================

    /**
     * Temps restant (alias pour compatibilité)
     * @returns {number}
     */
    get timeRemaining() {
        return this.remaining;
    }

    /**
     * Définir le temps restant (pour compatibilité)
     * @param {number} value - Nouveau temps restant
     */
    set timeRemaining(value) {
        this.setValue(value);
    }

    /**
     * Durée totale (alias pour compatibilité)
     * @returns {number}
     */
    get timeLimit() {
        return this.duration;
    }

    /**
     * Définir la durée totale
     * @param {number} value - Nouvelle durée
     */
    set timeLimit(value) {
        this.duration = value;
    }

    /**
     * Timer gelé (alias pour compatibilité)
     * @returns {boolean}
     */
    get freezeTimer() {
        return this.isFrozen;
    }

    /**
     * Geler/dégeler le timer (pour compatibilité)
     * @param {boolean} value - true pour geler
     */
    set freezeTimer(value) {
        if (value && !this.isFrozen) {
            this.freeze();
        } else if (!value && this.isFrozen) {
            this.unfreeze();
        }
    }

    /**
     * Timer expiré (temps écoulé)
     * @returns {boolean}
     */
    get isExpired() {
        return this.remaining <= 0;
    }

    /**
     * Timer en zone critique (moins de 30% du temps)
     * @returns {boolean}
     */
    get isCritical() {
        return this.remaining < this.duration * 0.3;
    }

    /**
     * Timer en zone d'avertissement (moins de 50% du temps)
     * @returns {boolean}
     */
    get isWarning() {
        return this.remaining < this.duration * 0.5;
    }

    /**
     * Classe CSS pour l'état visuel
     * @returns {string}
     */
    get stateClass() {
        if (this.isExpired) return 'expired';
        if (this.isCritical) return 'critical';
        if (this.isWarning) return 'warning';
        return 'normal';
    }

    // ==========================================
    // MÉTHODES SPÉCIFIQUES
    // ==========================================

    /**
     * Met à jour le timer et vérifie les seuils
     * @param {number} [deltaTime] - Non utilisé, pour compatibilité
     */
    update(deltaTime) {
        // Vérifier le seuil de mi-temps pour le rappel
        if (!this._halfTimeTriggered && this.remaining < this.duration / 2) {
            this._halfTimeTriggered = true;
            if (this.onHalfTime) {
                this.onHalfTime(this);
            }
        }

        // Vérifier l'expiration
        if (this.state === TIMER_STATE.RUNNING && this.isExpired) {
            this.state = TIMER_STATE.COMPLETED;
            if (this.onExpire) {
                this.onExpire(this);
            }
            if (this.onComplete) {
                this.onComplete(this);
            }
        }

        // Appeler le callback de mise à jour
        if (this.onUpdate) {
            this.onUpdate(this.remaining, this.progress);
        }
    }

    /**
     * Réinitialise le timer avec une nouvelle durée
     * @param {number} [newDuration] - Nouvelle durée (optionnel)
     * @param {boolean} [autoStart=true] - Démarrer automatiquement
     */
    reset(newDuration, autoStart = true) {
        if (typeof newDuration === 'number') {
            this.duration = newDuration;
        }
        this._halfTimeTriggered = false;
        super.reset(autoStart);
    }

    /**
     * Formate le temps restant pour l'affichage
     * @returns {string}
     */
    format() {
        const seconds = Math.ceil(Math.max(0, this.remaining));
        if (seconds >= 60) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        return `${seconds}s`;
    }

    // ==========================================
    // SÉRIALISATION
    // ==========================================

    /**
     * Exporte l'état pour sauvegarde
     * @returns {object}
     */
    toJSON() {
        return {
            ...super.toJSON(),
            isTutorialTask: this.isTutorialTask,
            halfTimeTriggered: this._halfTimeTriggered
        };
    }

    /**
     * Restaure l'état depuis une sauvegarde
     * @param {object} data - Données sauvegardées
     */
    fromJSON(data) {
        super.fromJSON(data);
        this.isTutorialTask = data.isTutorialTask || false;
        this._halfTimeTriggered = data.halfTimeTriggered || false;
    }

    /**
     * Crée un TaskTimer depuis des données sauvegardées
     * @param {object} data - Données sauvegardées
     * @returns {TaskTimer}
     */
    static fromJSON(data) {
        const timer = new TaskTimer({
            duration: data.duration,
            isTutorialTask: data.isTutorialTask
        });
        timer.fromJSON(data);
        return timer;
    }

    // ==========================================
    // COMPATIBILITÉ LEGACY
    // ==========================================

    /**
     * Crée un TaskTimer depuis les anciennes propriétés de tâche
     * @param {object} legacyTask - Tâche avec startTime, timeLimit, timeRemaining
     * @returns {TaskTimer}
     */
    static fromLegacy(legacyTask) {
        const timer = new TaskTimer({
            duration: legacyTask.timeLimit,
            isTutorialTask: legacyTask.isTutorialTask || false,
            startFrozen: legacyTask.freezeTimer || false
        });

        // Restaurer la valeur actuelle
        if (legacyTask.timeRemaining !== undefined) {
            timer.setValue(legacyTask.timeRemaining);
        }

        return timer;
    }

    /**
     * Exporte vers le format legacy pour compatibilité
     * @returns {object}
     */
    toLegacy() {
        return {
            startTime: Date.now() - (this.duration - this.remaining) * 1000,
            timeLimit: this.duration,
            timeRemaining: this.remaining,
            freezeTimer: this.isFrozen,
            isTutorialTask: this.isTutorialTask
        };
    }
}

export default TaskTimer;
export { TaskTimer };
