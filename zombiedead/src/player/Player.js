import * as THREE from 'three';
import { PLAYER_MAX_HEALTH } from '../constants.js';

/**
 * État du joueur : santé, position, score
 * Émet des événements via l'EventBus lors de changements d'état
 */
export class Player {
    /**
     * @param {import('../core/EventBus.js').EventBus} eventBus
     */
    constructor(eventBus) {
        this._eventBus = eventBus;
        this.health = PLAYER_MAX_HEALTH;
        this.maxHealth = PLAYER_MAX_HEALTH;
        this.score = 0;
        this.isAlive = true;
        this.position = new THREE.Vector3(0, 0, 0);
    }

    /**
     * Inflige des dégâts au joueur
     * @param {number} amount - Quantité de dégâts
     */
    takeDamage(amount) {
        if (!this.isAlive) return;

        this.health = Math.max(0, this.health - amount);
        this._eventBus.emit('player-damaged', { damage: amount, health: this.health });

        if (this.health <= 0) {
            this.isAlive = false;
            this._eventBus.emit('game-over', { score: this.score });
        }
    }

    /**
     * Soigne le joueur
     * @param {number} amount - Quantité de soin
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    /**
     * Ajoute des points au score
     * @param {number} points
     */
    addScore(points) {
        this.score += points;
    }

    /** Réinitialise l'état du joueur */
    reset() {
        this.health = PLAYER_MAX_HEALTH;
        this.score = 0;
        this.isAlive = true;
        this.position.set(0, 0, 0);
    }
}
