// ==========================================
// GAME TIMER
// ==========================================
// Classe utilitaire pour gérer les timers de jeu.
// Supporte le freeze, les animations, et différents modes de calcul.
// ==========================================

/**
 * Modes de calcul du timer
 * - COUNTDOWN: Compte à rebours (timeRemaining diminue)
 * - ELAPSED: Temps écoulé (elapsed augmente)
 */
export const TIMER_MODE = {
    COUNTDOWN: 'countdown',
    ELAPSED: 'elapsed'
};

/**
 * États possibles du timer
 */
export const TIMER_STATE = {
    RUNNING: 'running',
    PAUSED: 'paused',
    FROZEN: 'frozen',
    COMPLETED: 'completed'
};

/**
 * Classe GameTimer - Timer de jeu réutilisable
 * Encapsule toute la logique de gestion du temps avec support pour:
 * - Freeze/Unfreeze
 * - Animation fluide vers une valeur cible
 * - Modes countdown et elapsed
 * - Callbacks de complétion
 */
class GameTimer {
    /**
     * Crée un nouveau timer
     * @param {object} options - Options de configuration
     * @param {number} options.duration - Durée totale en secondes
     * @param {string} [options.mode=TIMER_MODE.COUNTDOWN] - Mode de calcul
     * @param {boolean} [options.autoStart=true] - Démarrer automatiquement
     * @param {Function} [options.onComplete] - Callback à la fin
     * @param {Function} [options.onUpdate] - Callback à chaque update
     */
    constructor(options = {}) {
        const {
            duration = 0,
            mode = TIMER_MODE.COUNTDOWN,
            autoStart = true,
            onComplete = null,
            onUpdate = null
        } = options;

        /** @type {number} Durée totale en secondes */
        this.duration = duration;

        /** @type {string} Mode de calcul (countdown ou elapsed) */
        this.mode = mode;

        /** @type {string} État actuel du timer */
        this.state = autoStart ? TIMER_STATE.RUNNING : TIMER_STATE.PAUSED;

        /** @type {number} Timestamp de démarrage */
        this._startTime = autoStart ? Date.now() : null;

        /** @type {number} Temps accumulé avant le dernier freeze (en ms) */
        this._accumulatedTime = 0;

        /** @type {number} Valeur forcée (pour le freeze) */
        this._frozenValue = null;

        /** @type {Function|null} Callback de complétion */
        this.onComplete = onComplete;

        /** @type {Function|null} Callback de mise à jour */
        this.onUpdate = onUpdate;

        // Animation
        /** @type {number|null} ID de l'animation en cours */
        this._animationId = null;

        /** @type {object|null} Données d'animation en cours */
        this._animation = null;
    }

    // ==========================================
    // GETTERS
    // ==========================================

    /**
     * Temps écoulé en secondes
     * @returns {number}
     */
    get elapsed() {
        if (this.state === TIMER_STATE.FROZEN && this._frozenValue !== null) {
            return this.mode === TIMER_MODE.ELAPSED
                ? this._frozenValue
                : this.duration - this._frozenValue;
        }

        if (this.state === TIMER_STATE.PAUSED || !this._startTime) {
            return this._accumulatedTime / 1000;
        }

        const now = Date.now();
        const runningTime = now - this._startTime;
        return (this._accumulatedTime + runningTime) / 1000;
    }

    /**
     * Temps restant en secondes (pour mode countdown)
     * @returns {number}
     */
    get remaining() {
        if (this.state === TIMER_STATE.FROZEN && this._frozenValue !== null) {
            return this.mode === TIMER_MODE.COUNTDOWN
                ? this._frozenValue
                : this.duration - this._frozenValue;
        }

        return Math.max(0, this.duration - this.elapsed);
    }

    /**
     * Valeur actuelle selon le mode
     * @returns {number}
     */
    get value() {
        return this.mode === TIMER_MODE.COUNTDOWN ? this.remaining : this.elapsed;
    }

    /**
     * Progression de 0 à 1
     * @returns {number}
     */
    get progress() {
        if (this.duration <= 0) return 1;
        return Math.min(1, this.elapsed / this.duration);
    }

    /**
     * Timer terminé ?
     * @returns {boolean}
     */
    get isComplete() {
        return this.state === TIMER_STATE.COMPLETED ||
               (this.mode === TIMER_MODE.COUNTDOWN && this.remaining <= 0) ||
               (this.mode === TIMER_MODE.ELAPSED && this.elapsed >= this.duration);
    }

    /**
     * Timer en cours ?
     * @returns {boolean}
     */
    get isRunning() {
        return this.state === TIMER_STATE.RUNNING;
    }

    /**
     * Timer gelé ?
     * @returns {boolean}
     */
    get isFrozen() {
        return this.state === TIMER_STATE.FROZEN;
    }

    /**
     * Timer en pause ?
     * @returns {boolean}
     */
    get isPaused() {
        return this.state === TIMER_STATE.PAUSED;
    }

    // ==========================================
    // CONTRÔLES DE BASE
    // ==========================================

    /**
     * Démarre ou reprend le timer
     */
    start() {
        if (this.state === TIMER_STATE.COMPLETED) return;

        if (this.state === TIMER_STATE.FROZEN) {
            // Sortir du freeze en ajustant le temps accumulé
            if (this._frozenValue !== null) {
                if (this.mode === TIMER_MODE.COUNTDOWN) {
                    this._accumulatedTime = (this.duration - this._frozenValue) * 1000;
                } else {
                    this._accumulatedTime = this._frozenValue * 1000;
                }
                this._frozenValue = null;
            }
        }

        this._startTime = Date.now();
        this.state = TIMER_STATE.RUNNING;
    }

    /**
     * Met le timer en pause (conserve le temps écoulé)
     */
    pause() {
        if (this.state !== TIMER_STATE.RUNNING) return;

        // Sauvegarder le temps écoulé
        if (this._startTime) {
            this._accumulatedTime += Date.now() - this._startTime;
        }
        this._startTime = null;
        this.state = TIMER_STATE.PAUSED;
    }

    /**
     * Gèle le timer à sa valeur actuelle
     * Le timer ne bouge plus jusqu'à unfreeze
     */
    freeze() {
        if (this.state === TIMER_STATE.FROZEN) return;

        this._frozenValue = this.value;
        this.cancelAnimation();
        this.state = TIMER_STATE.FROZEN;
    }

    /**
     * Dégèle le timer et reprend à partir de la valeur gelée
     */
    unfreeze() {
        if (this.state !== TIMER_STATE.FROZEN) return;

        // Convertir la valeur gelée en temps accumulé
        if (this._frozenValue !== null) {
            if (this.mode === TIMER_MODE.COUNTDOWN) {
                this._accumulatedTime = (this.duration - this._frozenValue) * 1000;
            } else {
                this._accumulatedTime = this._frozenValue * 1000;
            }
            this._frozenValue = null;
        }

        this._startTime = Date.now();
        this.state = TIMER_STATE.RUNNING;
    }

    /**
     * Réinitialise le timer
     * @param {boolean} [autoStart=true] - Redémarrer automatiquement
     */
    reset(autoStart = true) {
        this.cancelAnimation();
        this._accumulatedTime = 0;
        this._frozenValue = null;
        this._startTime = autoStart ? Date.now() : null;
        this.state = autoStart ? TIMER_STATE.RUNNING : TIMER_STATE.PAUSED;
    }

    /**
     * Force le timer à une valeur spécifique (instantané)
     * @param {number} value - Nouvelle valeur en secondes
     */
    setValue(value) {
        this.cancelAnimation();

        if (this.mode === TIMER_MODE.COUNTDOWN) {
            // value = temps restant
            this._accumulatedTime = (this.duration - value) * 1000;
        } else {
            // value = temps écoulé
            this._accumulatedTime = value * 1000;
        }

        if (this.state === TIMER_STATE.FROZEN) {
            this._frozenValue = value;
        } else if (this.state === TIMER_STATE.RUNNING) {
            this._startTime = Date.now();
        }
    }

    /**
     * Ajoute du temps au timer
     * @param {number} seconds - Secondes à ajouter
     */
    addTime(seconds) {
        const currentValue = this.value;
        this.setValue(currentValue + seconds);
    }

    /**
     * Retire du temps au timer
     * @param {number} seconds - Secondes à retirer
     */
    subtractTime(seconds) {
        const currentValue = this.value;
        this.setValue(Math.max(0, currentValue - seconds));
    }

    /**
     * Modifie la durée totale
     * @param {number} newDuration - Nouvelle durée en secondes
     */
    setDuration(newDuration) {
        this.duration = newDuration;
    }

    // ==========================================
    // ANIMATION
    // ==========================================

    /**
     * Anime le timer vers une valeur cible
     * @param {number} targetValue - Valeur cible en secondes
     * @param {number} [duration=1000] - Durée de l'animation en ms
     * @param {string} [easing='easeOutCubic'] - Type d'easing
     * @returns {Promise} Résolu quand l'animation est terminée
     */
    animateTo(targetValue, duration = 1000, easing = 'easeOutCubic') {
        return new Promise((resolve) => {
            this.cancelAnimation();

            const startValue = this.value;
            const startTimestamp = performance.now();
            const difference = targetValue - startValue;

            // Geler pendant l'animation
            const wasRunning = this.state === TIMER_STATE.RUNNING;
            this.freeze();

            // Fonction d'easing
            const easingFn = this._getEasingFunction(easing);

            this._animation = {
                startValue,
                targetValue,
                duration,
                startTimestamp,
                difference,
                wasRunning,
                resolve
            };

            const animate = (currentTimestamp) => {
                if (!this._animation) {
                    resolve();
                    return;
                }

                const elapsed = currentTimestamp - startTimestamp;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easingFn(progress);

                this._frozenValue = startValue + (difference * easedProgress);

                if (progress < 1) {
                    this._animationId = requestAnimationFrame(animate);
                } else {
                    // Animation terminée
                    this._frozenValue = targetValue;
                    this._animationId = null;
                    this._animation = null;

                    // Restaurer l'état si nécessaire
                    if (wasRunning) {
                        this.unfreeze();
                    }

                    resolve();
                }
            };

            this._animationId = requestAnimationFrame(animate);
        });
    }

    /**
     * Annule l'animation en cours
     */
    cancelAnimation() {
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }

        if (this._animation) {
            // Garder la valeur actuelle
            this._animation.resolve?.();
            this._animation = null;
        }
    }

    /**
     * Retourne une fonction d'easing
     * @param {string} type - Type d'easing
     * @returns {Function}
     * @private
     */
    _getEasingFunction(type) {
        const easings = {
            linear: (t) => t,
            easeInQuad: (t) => t * t,
            easeOutQuad: (t) => t * (2 - t),
            easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: (t) => t * t * t,
            easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
            easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
            easeOutBack: (t) => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            }
        };

        return easings[type] || easings.easeOutCubic;
    }

    // ==========================================
    // UPDATE
    // ==========================================

    /**
     * Met à jour le timer (à appeler chaque frame si nécessaire)
     * Vérifie la complétion et appelle les callbacks
     * @param {number} [deltaTime] - Temps écoulé depuis le dernier update (non utilisé, pour compatibilité)
     */
    update(deltaTime) {
        // Appeler le callback de mise à jour si défini
        if (this.onUpdate && this.state !== TIMER_STATE.COMPLETED) {
            this.onUpdate(this.value, this.progress);
        }

        // Vérifier la complétion
        if (this.state === TIMER_STATE.RUNNING && this.isComplete) {
            this.state = TIMER_STATE.COMPLETED;
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    // ==========================================
    // SERIALIZATION
    // ==========================================

    /**
     * Exporte l'état du timer pour sauvegarde
     * @returns {object}
     */
    toJSON() {
        return {
            duration: this.duration,
            mode: this.mode,
            state: this.state,
            elapsed: this.elapsed,
            frozenValue: this._frozenValue
        };
    }

    /**
     * Restaure l'état du timer depuis une sauvegarde
     * @param {object} data - Données sauvegardées
     */
    fromJSON(data) {
        this.duration = data.duration;
        this.mode = data.mode;
        this.state = data.state;
        this._accumulatedTime = data.elapsed * 1000;
        this._frozenValue = data.frozenValue;

        if (this.state === TIMER_STATE.RUNNING) {
            this._startTime = Date.now();
        }
    }

    /**
     * Crée un timer à partir de données sauvegardées
     * @param {object} data - Données sauvegardées
     * @returns {GameTimer}
     */
    static fromJSON(data) {
        const timer = new GameTimer({
            duration: data.duration,
            mode: data.mode,
            autoStart: false
        });
        timer.fromJSON(data);
        return timer;
    }

    // ==========================================
    // FORMATAGE
    // ==========================================

    /**
     * Formate la valeur en MM:SS
     * @returns {string}
     */
    formatMMSS() {
        const totalSeconds = Math.ceil(this.value);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Formate la valeur en secondes
     * @returns {string}
     */
    formatSeconds() {
        return `${Math.ceil(this.value)}s`;
    }
}

export default GameTimer;
export { GameTimer };
