/**
 * Le roi contrôlé par le joueur
 * Gère le déplacement et la hitbox style Touhou (petite et précise)
 */
import { Entity } from './entity.js';
import { KING_CONFIG } from '../../data/config.js';

export class King extends Entity {
    /**
     * Crée le roi
     * @param {number} x - Position X initiale
     * @param {number} y - Position Y initiale
     */
    constructor(x, y) {
        super(x, y);
        this.width = KING_CONFIG.WIDTH;
        this.height = KING_CONFIG.HEIGHT;
        this.speed = KING_CONFIG.SPEED;
        this.moving = false;
        this.hit = false;

        this.hitboxSize = KING_CONFIG.HITBOX_SIZE;
        this.hitboxVerticalOffset = KING_CONFIG.HITBOX_VERTICAL_OFFSET;
        this.hitboxX = 0;
        this.hitboxY = 0;
        this.showHitbox = true;

        this.updateHitbox();
    }

    /**
     * Met à jour la position de la hitbox
     */
    updateHitbox() {
        const centerX = this.width / 2;
        const centerY = this.height / 2 + this.hitboxVerticalOffset;
        this.hitboxX = this.x + centerX - this.hitboxSize / 2;
        this.hitboxY = this.y + centerY - this.hitboxSize / 2;
    }

    /**
     * Déplace le roi selon les inputs clavier
     * @param {Object} keys - État des touches (up, down, left, right)
     * @param {number} canvasWidth - Largeur du canvas pour les limites
     * @param {number} canvasHeight - Hauteur du canvas pour les limites
     */
    move(keys, canvasWidth, canvasHeight) {
        this.moving = false;

        if (keys.up) {
            this.y -= this.speed;
            this.moving = true;
        }
        if (keys.down) {
            this.y += this.speed;
            this.moving = true;
        }
        if (keys.left) {
            this.x -= this.speed;
            this.moving = true;
        }
        if (keys.right) {
            this.x += this.speed;
            this.moving = true;
        }

        this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));

        this.updateHitbox();
    }

    /**
     * Déplace le roi vers une position cible (souris)
     * @param {number} targetX - Position X cible
     * @param {number} targetY - Position Y cible
     * @param {number} canvasWidth - Largeur du canvas pour les limites
     * @param {number} canvasHeight - Hauteur du canvas pour les limites
     */
    moveToTarget(targetX, targetY, canvasWidth, canvasHeight) {
        const hitboxCenterOffsetX = this.width / 2;
        const hitboxCenterOffsetY = this.height / 2 + this.hitboxVerticalOffset;

        const goalX = targetX - hitboxCenterOffsetX;
        const goalY = targetY - hitboxCenterOffsetY;

        const dx = goalX - this.x;
        const dy = goalY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist > 3) {
            const mouseSpeed = Math.min(this.speed, dist * 0.2);
            this.x += (dx / dist) * mouseSpeed;
            this.y += (dy / dist) * mouseSpeed;
            this.moving = true;

            this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
            this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));

            this.updateHitbox();
        }
    }

    /**
     * Vérifie la collision avec la hitbox
     * @param {number} x - Position X à vérifier
     * @param {number} y - Position Y à vérifier
     * @returns {boolean} True si collision détectée
     */
    checkHitboxCollision(x, y) {
        const hitboxHalf = this.hitboxSize / 2;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2 + this.hitboxVerticalOffset;

        return x > centerX - hitboxHalf && x < centerX + hitboxHalf &&
               y > centerY - hitboxHalf && y < centerY + hitboxHalf;
    }
}
