/**
 * Diamant à collecter
 * Représente les collectibles du jeu
 */
import { Entity } from './entity.js';
import { DIAMOND_CONFIG } from '../../data/config.js';

export class Diamond extends Entity {
    /**
     * Crée un diamant
     * @param {number} x - Position X initiale
     * @param {number} y - Position Y initiale
     * @param {number} id - Identifiant unique du diamant
     */
    constructor(x, y, id) {
        super(x, y);
        this.id = id;
        this.width = DIAMOND_CONFIG.WIDTH;
        this.height = DIAMOND_CONFIG.HEIGHT;
    }

    /**
     * Vérifie la collision avec le roi
     * @param {King} king - Le roi
     * @returns {boolean} True si collision détectée
     */
    checkCollision(king) {
        return king.x < this.x + this.width &&
               king.x + king.width > this.x &&
               king.y < this.y + this.height &&
               king.y + king.height > this.y;
    }
}
