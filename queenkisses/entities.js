/**
 * Classes d'entités pour le jeu Canvas
 * Chaque entité gère sa propre logique de mise à jour
 */

/**
 * Classe de base pour les entités du jeu
 */
class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Met à jour l'entité
     * @param {number} deltaTime - Temps écoulé depuis la dernière frame
     */
    update(deltaTime) {
        // À implémenter par les sous-classes
    }
}

/**
 * Le roi contrôlé par le joueur
 */
export class King extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = 50;
        this.height = 50;
        this.speed = 8;
        this.moving = false;
        this.hit = false;

        // Hitbox style Touhou (petite et centrée)
        this.hitboxSize = 14;
        this.hitboxVerticalOffset = 15;
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
     * Déplace le roi selon les inputs
     * @param {Object} keys - État des touches
     * @param {number} canvasWidth - Largeur du canvas
     * @param {number} canvasHeight - Hauteur du canvas
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

        // Limite aux bordures
        this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));

        this.updateHitbox();
    }

    /**
     * Déplace le roi vers une position cible (souris)
     * @param {number} targetX - Position X cible
     * @param {number} targetY - Position Y cible
     * @param {number} canvasWidth - Largeur du canvas
     * @param {number} canvasHeight - Hauteur du canvas
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
     * @returns {boolean} True si collision
     */
    checkHitboxCollision(x, y) {
        const hitboxHalf = this.hitboxSize / 2;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2 + this.hitboxVerticalOffset;

        return x > centerX - hitboxHalf && x < centerX + hitboxHalf &&
               y > centerY - hitboxHalf && y < centerY + hitboxHalf;
    }
}

/**
 * La reine / démon qui poursuit le joueur
 */
export class Queen extends Entity {
    constructor(x, y, canvasWidth, canvasHeight) {
        super(x, y);
        this.width = 50;
        this.height = 50;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.isDemon = false;
        this.rage = false;
        this.dashing = false;

        // Pattern DOOM
        this.currentPattern = 'chase';
        this.patternStartTime = 0;
        this.spiralAngle = 0;
        this.currentCorner = 0;
        this.currentCardinal = 0;

        // Coins de l'écran
        this.corners = [
            { x: 100, y: 100 },
            { x: canvasWidth - 150, y: 100 },
            { x: canvasWidth - 150, y: canvasHeight - 150 },
            { x: 100, y: canvasHeight - 150 }
        ];

        // Points cardinaux autour du château
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
     * @param {string} pattern - Pattern à exécuter
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
            default:
                this.moveStalker(king);
        }

        this.x = Math.max(0, Math.min(this.canvasWidth - 70, this.x));
        this.y = Math.max(0, Math.min(this.canvasHeight - 70, this.y));
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
     * Pattern: traverse le haut de l'écran
     */
    moveHellRain() {
        const targetY = 80;
        const dy = targetY - this.y;

        if (Math.abs(dy) > 10) {
            this.y += dy * 0.1;
        }

        this.x += Math.sin(Date.now() / 200) * 8;

        if (this.x < 50) this.x = 50;
        if (this.x > this.canvasWidth - 100) this.x = this.canvasWidth - 100;
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
}

/**
 * Diamant à collecter
 */
export class Diamond extends Entity {
    constructor(x, y, id) {
        super(x, y);
        this.id = id;
        this.width = 35;
        this.height = 35;
    }

    /**
     * Vérifie la collision avec le roi
     * @param {King} king - Le roi
     * @returns {boolean} True si collision
     */
    checkCollision(king) {
        return king.x < this.x + this.width &&
               king.x + king.width > this.x &&
               king.y < this.y + this.height &&
               king.y + king.height > this.y;
    }
}

/**
 * Projectile tiré par la reine
 */
export class Projectile extends Entity {
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
     * @returns {boolean} True si hors écran
     */
    isOffScreen(canvasWidth, canvasHeight) {
        return this.x < -50 || this.x > canvasWidth + 50 ||
               this.y < -50 || this.y > canvasHeight + 50;
    }

    /**
     * Vérifie la collision avec la hitbox du roi
     * @param {King} king - Le roi
     * @returns {boolean} True si collision
     */
    checkCollision(king) {
        return king.checkHitboxCollision(this.x, this.y);
    }
}

/**
 * Bulle de dialogue
 */
export class SpeechBubble {
    constructor() {
        this.text = '';
        this.x = 0;
        this.y = 0;
        this.color = '#8b4513';
        this.active = false;
        this.alpha = 0;
        this.targetAlpha = 0;
        this.duration = 0;
        this.startTime = 0;
    }

    /**
     * Affiche une bulle de dialogue
     * @param {string} text - Texte à afficher
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {string} color - Couleur du texte
     * @param {number} duration - Durée d'affichage en ms
     */
    show(text, x, y, color = '#8b4513', duration = 2500) {
        this.text = text;
        this.x = x + 25; // Centre approximatif de l'emoji
        this.y = y;
        this.color = color;
        this.active = true;
        this.alpha = 0;
        this.targetAlpha = 1;
        this.duration = duration;
        this.startTime = Date.now();
    }

    /**
     * Met à jour l'état de la bulle
     */
    update() {
        if (!this.active) return;

        const elapsed = Date.now() - this.startTime;

        // Fade in
        if (this.alpha < this.targetAlpha) {
            this.alpha = Math.min(this.targetAlpha, this.alpha + 0.1);
        }

        // Fade out
        if (elapsed > this.duration - 500) {
            this.alpha = Math.max(0, this.alpha - 0.05);
        }

        if (elapsed > this.duration) {
            this.active = false;
            this.alpha = 0;
        }
    }

    /**
     * Met à jour la position de la bulle
     * @param {number} x - Nouvelle position X
     * @param {number} y - Nouvelle position Y
     */
    updatePosition(x, y) {
        if (this.active) {
            this.x = x + 25;
            this.y = y;
        }
    }
}
