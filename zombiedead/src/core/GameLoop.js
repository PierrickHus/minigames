import { MAX_DELTA_TIME } from '../constants.js';

/**
 * Boucle de jeu principale basée sur requestAnimationFrame
 * Gère le calcul du deltaTime avec plafonnement pour éviter les spirales de mort
 */
export class GameLoop {
    /**
     * @param {Function} updateCallback - Fonction appelée chaque frame avec deltaTime
     * @param {Function} renderCallback - Fonction de rendu appelée après l'update
     */
    constructor(updateCallback, renderCallback) {
        this._updateCallback = updateCallback;
        this._renderCallback = renderCallback;
        this._lastTime = 0;
        this._animFrameId = null;
        this._running = false;
        this._paused = false;

        this._loop = this._loop.bind(this);
    }

    /** Démarre la boucle de jeu */
    start() {
        this._running = true;
        this._paused = false;
        this._lastTime = performance.now();
        this._animFrameId = requestAnimationFrame(this._loop);
    }

    /** Arrête complètement la boucle */
    stop() {
        this._running = false;
        if (this._animFrameId !== null) {
            cancelAnimationFrame(this._animFrameId);
            this._animFrameId = null;
        }
    }

    /** Met la boucle en pause (continue de tourner mais n'update pas) */
    pause() {
        this._paused = true;
    }

    /** Reprend après une pause */
    resume() {
        this._paused = false;
        this._lastTime = performance.now();
    }

    /** @returns {boolean} */
    get isPaused() {
        return this._paused;
    }

    /**
     * Frame de la boucle interne
     * @param {number} timestamp - Timestamp fourni par requestAnimationFrame
     */
    _loop(timestamp) {
        if (!this._running) return;

        this._animFrameId = requestAnimationFrame(this._loop);

        if (this._paused) return;

        const deltaTime = Math.min((timestamp - this._lastTime) / 1000, MAX_DELTA_TIME);
        this._lastTime = timestamp;

        this._updateCallback(deltaTime);
        this._renderCallback();
    }
}
