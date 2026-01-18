/**
 * La reine / démon qui poursuit le joueur
 * Gère différents patterns de mouvement en mode DOOM
 */
import { Entity } from './entity.js';
import { QUEEN_CONFIG } from '../../data/config.js';

export class Queen extends Entity {
    /**
     * Crée la reine
     * @param {number} x - Position X initiale
     * @param {number} y - Position Y initiale
     * @param {number} canvasWidth - Largeur du canvas
     * @param {number} canvasHeight - Hauteur du canvas
     */
    constructor(x, y, canvasWidth, canvasHeight) {
        super(x, y);
        this.width = QUEEN_CONFIG.WIDTH;
        this.height = QUEEN_CONFIG.HEIGHT;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.isDemon = false;
        this.rage = false;
        this.dashing = false;

        this.currentPattern = 'chase';
        this.patternStartTime = 0;
        this.spiralAngle = 0;
        this.currentCorner = 0;
        this.currentCardinal = 0;

        this.corners = [
            { x: 100, y: 100 },
            { x: canvasWidth - 150, y: 100 },
            { x: canvasWidth - 150, y: canvasHeight - 150 },
            { x: 100, y: canvasHeight - 150 }
        ];

        const castleX = canvasWidth / 2;
        const castleY = canvasHeight / 2;
        this.cardinalPoints = [
            { x: castleX - 200, y: castleY },
            { x: castleX + 200, y: castleY },
            { x: castleX, y: castleY - 200 },
            { x: castleX, y: castleY + 200 }
        ];
    }

    /**
     * Déplace la reine en mode normal (suit le joueur)
     * @param {King} king - Le roi à poursuivre
     * @param {number} speed - Vitesse de déplacement
     */
    moveNormal(king, speed) {
        const dx = king.x - this.x;
        const dy = king.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        if (distance > 5) {
            this.x += (dx / distance) * speed;
            this.y += (dy / distance) * speed;
        }

        this.x = Math.max(0, Math.min(this.canvasWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(this.canvasHeight - this.height, this.y));
    }

    /**
     * Déplace la reine selon un pattern DOOM
     * @param {string} pattern - Nom du pattern à exécuter
     * @param {King} king - Le roi (pour certains patterns)
     */
    moveDoom(pattern, king) {
        const castleX = this.canvasWidth / 2 - 35;
        const castleY = this.canvasHeight / 2 - 35;

        switch (pattern) {
            case 'castle_siege':
                this.moveToCastle(castleX, castleY);
                break;
            case 'corners_dance':
                this.moveToCorners();
                break;
            case 'stalker':
            case 'shotgun_burst':
                this.moveStalker(king);
                break;
            case 'cross_fire':
                this.moveCrossFire();
                break;
            case 'orbit':
                this.moveOrbit(castleX, castleY);
                break;
            case 'hell_rain':
                this.moveHellRain();
                break;
            case 'diamond_hunt':
                this.moveDiamondHunt();
                break;
            case 'chaos_spiral':
                this.moveChaos(castleX, castleY);
                break;
            case 'flower_bloom':
                this.moveFlowerBloom(castleX, castleY);
                break;
            case 'laser_cage':
                this.moveLaserCage(castleX, castleY);
                break;
            case 'wall_of_death':
                this.moveWallOfDeath();
                break;
            case 'galaxy_spin':
                this.moveGalaxySpin(castleX, castleY);
                break;
            default:
                this.moveToCastle(castleX, castleY);
        }

        this.x = Math.max(0, Math.min(this.canvasWidth - QUEEN_CONFIG.DEMON_WIDTH, this.x));
        this.y = Math.max(0, Math.min(this.canvasHeight - QUEEN_CONFIG.DEMON_HEIGHT, this.y));
    }

    /**
     * Pattern: va au château
     */
    moveToCastle(castleX, castleY) {
        const dx = castleX - this.x;
        const dy = castleY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist > 10) {
            this.x += (dx / dist) * 8;
            this.y += (dy / dist) * 8;
        }
    }

    /**
     * Pattern: se téléporte entre les coins
     */
    moveToCorners() {
        const target = this.corners[this.currentCorner];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist > 20) {
            this.dashing = true;
            this.x += (dx / dist) * 15;
            this.y += (dy / dist) * 15;
        } else {
            this.dashing = false;
            if (Date.now() % 1000 < 50) {
                this.currentCorner = (this.currentCorner + 1) % this.corners.length;
            }
        }
    }

    /**
     * Pattern: suit le joueur à distance
     */
    moveStalker(king) {
        const dx = king.x - this.x;
        const dy = king.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 150;

        if (dist > targetDist + 20) {
            this.x += (dx / dist) * 5;
            this.y += (dy / dist) * 5;
        } else if (dist < targetDist - 20) {
            this.x -= (dx / dist) * 4;
            this.y -= (dy / dist) * 4;
        }
    }

    /**
     * Pattern: se positionne aux points cardinaux
     */
    moveCrossFire() {
        const target = this.cardinalPoints[this.currentCardinal];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist > 15) {
            this.x += (dx / dist) * 10;
            this.y += (dy / dist) * 10;
        } else {
            if (Date.now() % 800 < 50) {
                this.currentCardinal = (this.currentCardinal + 1) % this.cardinalPoints.length;
            }
        }
    }

    /**
     * Pattern: orbite autour du château
     */
    moveOrbit(castleX, castleY) {
        const radius = 200;
        this.spiralAngle += 0.03;

        const targetX = castleX + Math.cos(this.spiralAngle) * radius;
        const targetY = castleY + Math.sin(this.spiralAngle) * radius;

        this.x += (targetX - this.x) * 0.1;
        this.y += (targetY - this.y) * 0.1;
    }

    /**
     * Pattern: traverse le haut de l'écran de gauche à droite
     */
    moveHellRain() {
        const targetY = 80;
        const dy = targetY - this.y;

        if (Math.abs(dy) > 10) {
            this.y += dy * 0.1;
        }

        const speed = 6;
        const now = Date.now();
        const phase = Math.floor(now / 3000) % 2;

        if (phase === 0) {
            this.x += speed;
            if (this.x > this.canvasWidth - QUEEN_CONFIG.DEMON_WIDTH) {
                this.x = this.canvasWidth - QUEEN_CONFIG.DEMON_WIDTH;
            }
        } else {
            this.x -= speed;
            if (this.x < 0) {
                this.x = 0;
            }
        }
    }

    /**
     * Pattern: alterne haut/bas
     */
    moveDiamondHunt() {
        const phase = Math.floor(Date.now() / 2000) % 2;
        const targetY = phase === 0 ? 100 : this.canvasHeight - 150;

        this.y += (targetY - this.y) * 0.08;
    }

    /**
     * Pattern: mouvement chaotique
     */
    moveChaos(castleX, castleY) {
        const now = Date.now();
        this.x = castleX + Math.sin(now / 200) * 150 + Math.cos(now / 300) * 100;
        this.y = castleY + Math.cos(now / 250) * 150 + Math.sin(now / 350) * 80;
    }

    /**
     * Pattern: reste au centre pour flower bloom
     */
    moveFlowerBloom(castleX, castleY) {
        const dx = castleX - this.x;
        const dy = castleY - this.y;
        this.x += dx * 0.05;
        this.y += dy * 0.05;
    }

    /**
     * Pattern: reste au centre pour laser cage
     */
    moveLaserCage(castleX, castleY) {
        const dx = castleX - this.x;
        const dy = castleY - this.y;
        this.x += dx * 0.05;
        this.y += dy * 0.05;
    }

    /**
     * Pattern: traverse l'écran horizontalement pour wall of death
     */
    moveWallOfDeath() {
        const targetY = this.canvasHeight / 2 - 35;
        const dy = targetY - this.y;

        if (Math.abs(dy) > 10) {
            this.y += dy * 0.1;
        }

        const speed = 3;
        const now = Date.now();
        const phase = Math.floor(now / 4000) % 2;

        if (phase === 0) {
            this.x += speed;
            if (this.x > this.canvasWidth - QUEEN_CONFIG.DEMON_WIDTH) {
                this.x = this.canvasWidth - QUEEN_CONFIG.DEMON_WIDTH;
            }
        } else {
            this.x -= speed;
            if (this.x < 0) {
                this.x = 0;
            }
        }
    }

    /**
     * Pattern: grande orbite rapide pour galaxy spin
     */
    moveGalaxySpin(castleX, castleY) {
        const radius = 250;
        this.spiralAngle += 0.05;

        const targetX = castleX + Math.cos(this.spiralAngle) * radius;
        const targetY = castleY + Math.sin(this.spiralAngle) * radius;

        this.x += (targetX - this.x) * 0.15;
        this.y += (targetY - this.y) * 0.15;
    }
}
