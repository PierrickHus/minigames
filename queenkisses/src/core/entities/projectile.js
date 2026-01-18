/**
 * Projectile tiré par la reine
 * Support l'Object Pooling pour optimiser les performances
 */
import { Entity } from './entity.js';

export class Projectile extends Entity {
    /**
     * Crée un projectile
     * @param {number} x - Position X initiale
     * @param {number} y - Position Y initiale
     * @param {number} vx - Vélocité X
     * @param {number} vy - Vélocité Y
     * @param {string} emoji - Emoji du projectile
     * @param {Object} glow - Effet de glow optionnel
     * @param {number} size - Taille du projectile
     */
    constructor(x, y, vx, vy, emoji, glow = null, size = 20) {
        super(x, y);
        this.vx = vx;
        this.vy = vy;
        this.emoji = emoji;
        this.glow = glow;
        this.size = size;
        this.rotation = 0;
    }

    /**
     * Met à jour la position du projectile
     */
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += 0.1;
    }

    /**
     * Vérifie si le projectile est hors écran
     * @param {number} canvasWidth - Largeur du canvas
     * @param {number} canvasHeight - Hauteur du canvas
     * @returns {boolean} True si le projectile est hors écran
     */
    isOffScreen(canvasWidth, canvasHeight) {
        return this.x < -50 || this.x > canvasWidth + 50 ||
               this.y < -50 || this.y > canvasHeight + 50;
    }

    /**
     * Vérifie la collision avec la hitbox du roi
     * @param {King} king - Le roi
     * @returns {boolean} True si collision détectée
     */
    checkCollision(king) {
        return king.checkHitboxCollision(this.x, this.y);
    }

    /**
     * Réinitialise le projectile pour le réutiliser (Object Pooling)
     * @param {number} x - Nouvelle position X
     * @param {number} y - Nouvelle position Y
     * @param {number} vx - Nouvelle vélocité X
     * @param {number} vy - Nouvelle vélocité Y
     * @param {string} emoji - Nouvel emoji
     * @param {Object} glow - Nouvel effet de glow
     * @param {number} size - Nouvelle taille
     */
    reset(x, y, vx, vy, emoji, glow = null, size = 20) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.emoji = emoji;
        this.glow = glow;
        this.size = size;
        this.rotation = 0;
    }
}
