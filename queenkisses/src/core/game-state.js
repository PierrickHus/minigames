/**
 * Gestionnaire d'état du jeu
 * Responsabilité unique: gérer l'état global du jeu (score, vies, mode, etc.)
 */

import { GAME_CONFIG, DIFFICULTY_THRESHOLDS, DIFFICULTY_CONFIGS } from '../data/config.js';
import { DOOM_PATTERNS } from '../data/patterns.js';

/**
 * Gestionnaire de l'état du jeu
 */
export class GameStateManager {
    constructor() {
        this.score = 0;
        this.gameStarted = false;
        this.gameOver = false;
        this.canControlKing = true;

        // État DOOM
        this.doomMode = false;
        this.doomTransitionActive = false;
        this.doomLivesCount = GAME_CONFIG.DOOM_LIVES;
        this.doomTimeRemaining = GAME_CONFIG.DOOM_DURATION;
        this.doomTimerInterval = null;
        this.doomVictory = false;

        // Patterns
        this.currentPattern = null;
        this.patternStartTime = 0;
        this.inPatternTransition = false;

        // Cooldowns
        this.queenHitCooldown = false;
        this.lastProjectileTime = 0;
    }

    /**
     * Incrémente le score
     */
    incrementScore() {
        this.score++;
    }

    /**
     * Vérifie si le score cible est atteint
     * @returns {boolean} True si le score cible est atteint
     */
    isTargetScoreReached() {
        return this.score >= GAME_CONFIG.TARGET_SCORE;
    }

    /**
     * Obtient la configuration de difficulté actuelle
     * @returns {Object} Configuration de difficulté
     */
    getCurrentDifficulty() {
        if (this.doomMode) {
            return {
                name: 'DOOM',
                class: 'diff-doom',
                queenSpeed: 0,
                fireRate: 350,
                projectileSpeed: 6,
                emoji: '👿'
            };
        }

        if (this.score < DIFFICULTY_THRESHOLDS.EASY) {
            return DIFFICULTY_CONFIGS.EASY;
        } else if (this.score < DIFFICULTY_THRESHOLDS.MEDIUM) {
            return DIFFICULTY_CONFIGS.MEDIUM;
        } else if (this.score < DIFFICULTY_THRESHOLDS.HARD) {
            return DIFFICULTY_CONFIGS.HARD;
        } else {
            return DIFFICULTY_CONFIGS.EXTREME;
        }
    }

    /**
     * Active le mode DOOM
     */
    activateDoomMode() {
        this.doomMode = true;
        this.doomTransitionActive = false;
        this.doomLivesCount = GAME_CONFIG.DOOM_LIVES;
        this.doomTimeRemaining = GAME_CONFIG.DOOM_DURATION;
        this.selectNextPattern();
    }

    /**
     * Sélectionne le prochain pattern DOOM
     */
    selectNextPattern() {
        const randomPattern = DOOM_PATTERNS[Math.floor(Math.random() * DOOM_PATTERNS.length)];
        this.currentPattern = randomPattern;
        this.patternStartTime = Date.now();
        this.inPatternTransition = false;
    }

    /**
     * Vérifie si un changement de pattern est nécessaire
     * @returns {boolean} True si changement nécessaire
     */
    shouldChangePattern() {
        if (!this.doomMode || this.inPatternTransition) return false;

        const elapsed = Date.now() - this.patternStartTime;
        return elapsed > GAME_CONFIG.PATTERN_DURATION;
    }

    /**
     * Active la transition de pattern
     */
    startPatternTransition() {
        this.inPatternTransition = true;
    }

    /**
     * Décrémente les vies en mode DOOM
     * @returns {boolean} True si le jeu continue, false si game over
     */
    decrementDoomLives() {
        this.doomLivesCount--;
        return this.doomLivesCount > 0;
    }

    /**
     * Décrémente le temps restant en mode DOOM
     * @returns {boolean} True si victoire (temps écoulé)
     */
    decrementDoomTime() {
        this.doomTimeRemaining--;

        if (this.doomTimeRemaining <= 0) {
            this.doomVictory = true;
            return true;
        }

        return false;
    }

    /**
     * Démarre le timer DOOM
     * @param {Function} onTick - Callback appelé chaque seconde
     * @param {Function} onComplete - Callback appelé à la fin
     */
    startDoomTimer(onTick, onComplete) {
        this.stopDoomTimer();

        this.doomTimerInterval = setInterval(() => {
            if (this.decrementDoomTime()) {
                clearInterval(this.doomTimerInterval);
                this.doomTimerInterval = null;
                onComplete();
            } else {
                onTick(this.doomTimeRemaining);
            }
        }, 1000);
    }

    /**
     * Arrête le timer DOOM
     */
    stopDoomTimer() {
        if (this.doomTimerInterval) {
            clearInterval(this.doomTimerInterval);
            this.doomTimerInterval = null;
        }
    }

    /**
     * Termine le jeu (game over)
     */
    endGame() {
        this.gameOver = true;
        this.gameStarted = false;
        this.stopDoomTimer();
    }

    /**
     * Réinitialise l'état pour un nouveau jeu
     */
    reset() {
        this.score = 0;
        this.gameStarted = false;
        this.gameOver = false;
        this.canControlKing = true;
        this.doomMode = false;
        this.doomTransitionActive = false;
        this.doomLivesCount = GAME_CONFIG.DOOM_LIVES;
        this.doomTimeRemaining = GAME_CONFIG.DOOM_DURATION;
        this.doomVictory = false;
        this.currentPattern = null;
        this.patternStartTime = 0;
        this.inPatternTransition = false;
        this.queenHitCooldown = false;
        this.lastProjectileTime = 0;
        this.stopDoomTimer();
    }

    /**
     * Réinitialise uniquement pour retry DOOM
     */
    resetForDoomRetry() {
        this.doomMode = false;
        this.doomTransitionActive = false;
        this.doomVictory = false;
        this.doomLivesCount = GAME_CONFIG.DOOM_LIVES;
        this.doomTimeRemaining = GAME_CONFIG.DOOM_DURATION;
        this.currentPattern = null;
        this.score = GAME_CONFIG.TARGET_SCORE;
        this.gameStarted = true;
        this.stopDoomTimer();
    }
}
