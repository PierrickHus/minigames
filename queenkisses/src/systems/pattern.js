/**
 * Système de gestion des patterns de projectiles
 * Responsabilité unique: création de projectiles selon des patterns définis
 * Principe OCP: facilement extensible avec de nouveaux patterns
 * Utilise Object Pooling pour optimiser les performances
 */

import { Projectile } from '../core/entities/projectile.js';
import { PROJECTILE_CONFIG } from '../data/config.js';

/**
 * Gestionnaire des patterns de projectiles
 */
export class PatternSystem {
    /**
     * Crée un nouveau système de patterns
     * @param {Renderer} renderer - Le renderer
     * @param {ProjectilePool} projectilePool - Pool de projectiles (optionnel)
     */
    constructor(renderer, projectilePool = null) {
        this.renderer = renderer;
        this.projectilePool = projectilePool;
    }

    /**
     * Génère des projectiles selon un pattern donné
     * @param {string} patternName - Nom du pattern à exécuter
     * @param {Queen} queen - La reine qui tire
     * @param {King} king - Le roi (cible)
     * @returns {Projectile[]} Tableau de nouveaux projectiles
     */
    generatePattern(patternName, queen, king) {
        const projectiles = [];
        const baseSpd = PROJECTILE_CONFIG.BASE_SPEED;
        const qx = queen.x + 35;
        const qy = queen.y + 35;
        const now = Date.now();
        const glow = { color: '#ff0000', blur: 12 };

        const dx = king.x - queen.x;
        const dy = king.y - queen.y;
        const playerAngle = Math.atan2(dy, dx);

        const pattern = this.getPattern(patternName);
        if (pattern) {
            return pattern.call(this, { projectiles, baseSpd, qx, qy, now, glow, playerAngle, queen, king });
        }

        return this.defaultPattern({ projectiles, baseSpd, qx, qy, now, glow });
    }

    /**
     * Retourne la fonction de pattern correspondante
     * @param {string} patternName - Nom du pattern
     * @returns {Function|null} Fonction de pattern
     */
    getPattern(patternName) {
        const patterns = {
            'castle_siege': this.castleSiege,
            'corners_dance': this.cornersDance,
            'stalker': this.stalker,
            'orbit': this.orbit,
            'cross_fire': this.crossFire,
            'hell_rain': this.hellRain,
            'diamond_hunt': this.diamondHunt,
            'shotgun_burst': this.shotgunBurst,
            'flower_bloom': this.flowerBloom,
            'laser_cage': this.laserCage,
            'wall_of_death': this.wallOfDeath,
            'galaxy_spin': this.galaxySpin,
            'chaos_spiral': this.chaosSpiral
        };

        return patterns[patternName] || null;
    }

    /**
     * Crée un projectile (via pool si disponible, sinon création classique)
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} vx - Vélocité X
     * @param {number} vy - Vélocité Y
     * @param {string} emoji - Emoji du projectile
     * @param {Object} glow - Effet de glow
     * @param {number} size - Taille du projectile
     * @returns {Projectile} Nouveau projectile
     */
    createProjectile(x, y, vx, vy, emoji, glow = null, size = 20) {
        if (this.projectilePool) {
            return this.projectilePool.createProjectile(x, y, vx, vy, emoji, glow, size);
        }
        return new Projectile(x, y, vx, vy, emoji, glow, size);
    }

    /**
     * Génère des projectiles selon un pattern normal (non-DOOM)
     * @param {Object} config - Configuration de difficulté
     * @param {number} score - Score actuel
     * @param {Queen} queen - La reine
     * @param {King} king - Le roi
     * @returns {Projectile[]} Tableau de projectiles
     */
    generateNormalPattern(config, score, queen, king) {
        const projectiles = [];
        const qx = queen.x + 25;
        const qy = queen.y + 25;
        const dx = king.x - queen.x;
        const dy = king.y - queen.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;
        const angle = Math.atan2(dy, dx);
        const spd = config.projectileSpeed;

        if (score < 20) {
            projectiles.push(this.createProjectile(qx, qy, dirX * spd, dirY * spd, config.emoji));
        } else if (score < 40) {
            for (let i = -1; i <= 1; i += 2) {
                const a = angle + i * 0.2;
                projectiles.push(this.createProjectile(qx, qy, Math.cos(a) * spd, Math.sin(a) * spd, config.emoji));
            }
        } else if (score < 70) {
            for (let i = -2; i <= 2; i++) {
                const a = angle + i * 0.2;
                projectiles.push(this.createProjectile(qx, qy, Math.cos(a) * spd, Math.sin(a) * spd, config.emoji));
            }
        } else {
            // EXTREME - spirale
            for (let i = 0; i < 8; i++) {
                const a = (Date.now() / 200) + (i * Math.PI / 4);
                projectiles.push(this.createProjectile(qx, qy, Math.cos(a) * spd, Math.sin(a) * spd, config.emoji));
            }
        }

        return projectiles;
    }

    // ==================== PATTERNS DOOM ====================

    /**
     * Pattern: Double spirale au château
     */
    castleSiege({ projectiles, baseSpd, qx, qy, now, glow }) {
        for (let i = 0; i < 8; i++) {
            const angle = (now / 100) + (i * Math.PI * 2 / 8);
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '🔥', glow));
        }
        for (let i = 0; i < 8; i++) {
            const angle = -(now / 120) + (i * Math.PI * 2 / 8);
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * baseSpd * 0.7, Math.sin(angle) * baseSpd * 0.7, '💀', glow));
        }
        return projectiles;
    }

    /**
     * Pattern: Burst radial depuis les coins
     */
    cornersDance({ projectiles, baseSpd, qx, qy, now, glow }) {
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI * 2) / 12 + (now / 500);
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '👿', glow));
        }
        return projectiles;
    }

    /**
     * Pattern: Arc de projectiles vers le joueur
     */
    stalker({ projectiles, baseSpd, qx, qy, playerAngle, glow }) {
        for (let i = -4; i <= 4; i++) {
            const angle = playerAngle + i * 0.12;
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * (baseSpd + 1), Math.sin(angle) * (baseSpd + 1), '👁️', glow));
        }
        return projectiles;
    }

    /**
     * Pattern: Double hélice en orbite
     */
    orbit({ projectiles, baseSpd, qx, qy, queen, glow }) {
        for (let i = 0; i < 10; i++) {
            const angle = queen.spiralAngle * 3 + (i * Math.PI / 5);
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '🌀', glow));
        }
        for (let i = 0; i < 10; i++) {
            const angle = -queen.spiralAngle * 2.5 + (i * Math.PI / 5);
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * (baseSpd * 0.8), Math.sin(angle) * (baseSpd * 0.8), '💜', glow));
        }
        return projectiles;
    }

    /**
     * Pattern: Croix avec branches tournantes
     */
    crossFire({ projectiles, baseSpd, qx, qy, now, playerAngle, glow }) {
        for (let branch = 0; branch < 4; branch++) {
            const branchAngle = (now / 200) + (branch * Math.PI / 2);
            for (let i = 1; i <= 3; i++) {
                const speed = baseSpd * (0.6 + i * 0.25);
                projectiles.push(this.createProjectile(qx, qy, Math.cos(branchAngle) * speed, Math.sin(branchAngle) * speed, '✝️', glow));
            }
        }
        for (let i = -1; i <= 1; i++) {
            const dirX = Math.cos(playerAngle);
            const dirY = Math.sin(playerAngle);
            projectiles.push(this.createProjectile(qx, qy, dirX * (baseSpd + 3), dirY * (baseSpd + 3) + i * 0.5, '💀', glow));
        }
        return projectiles;
    }

    /**
     * Pattern: Pluie depuis la reine qui traverse l'écran
     */
    hellRain({ projectiles, baseSpd, qx, qy, now, glow }) {
        for (let i = 0; i < 5; i++) {
            const offsetX = (i - 2) * 20;
            const spreadAngle = (Math.random() - 0.5) * 0.2;
            projectiles.push(this.createProjectile(qx + offsetX, qy, spreadAngle * 2, baseSpd + Math.random() * 2, '🔥', glow));
        }
        for (let i = 0; i < 4; i++) {
            const angle = (now / 120) + (i * Math.PI / 2);
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '🌀', glow));
        }
        return projectiles;
    }

    /**
     * Pattern: Double spirale avec tirs ciblés
     */
    diamondHunt({ projectiles, baseSpd, qx, qy, now, playerAngle, glow }) {
        for (let i = 0; i < 8; i++) {
            const angle = (now / 80) + (i * Math.PI * 2 / 8);
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '💎', glow));
        }
        for (let i = 0; i < 8; i++) {
            const angle = -(now / 100) + (i * Math.PI * 2 / 8);
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * (baseSpd * 0.7), Math.sin(angle) * (baseSpd * 0.7), '💜', glow));
        }
        for (let i = -2; i <= 2; i++) {
            const angle = playerAngle + i * 0.2;
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * (baseSpd + 2), Math.sin(angle) * (baseSpd + 2), '👿', glow));
        }
        return projectiles;
    }

    /**
     * Pattern: Rafale explosive vers le joueur
     */
    shotgunBurst({ projectiles, baseSpd, qx, qy, now, playerAngle, glow }) {
        for (let i = -4; i <= 4; i++) {
            const angle = playerAngle + i * 0.1;
            const speed = baseSpd + 1 + Math.random();
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * speed, Math.sin(angle) * speed, '💥', glow));
        }
        for (let i = 0; i < 6; i++) {
            const angle = (now / 200) + (i * Math.PI / 3);
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * baseSpd * 0.8, Math.sin(angle) * baseSpd * 0.8, '💀', glow));
        }
        return projectiles;
    }

    /**
     * Pattern: Pétales en expansion
     */
    flowerBloom({ projectiles, baseSpd, qx, qy, now, glow }) {
        for (let petal = 0; petal < 6; petal++) {
            const petalAngle = (petal * Math.PI * 2 / 6) + (now / 400);
            for (let i = -1; i <= 1; i++) {
                const subAngle = petalAngle + i * 0.2;
                projectiles.push(this.createProjectile(qx, qy, Math.cos(subAngle) * baseSpd, Math.sin(subAngle) * baseSpd, '🌸', glow));
            }
        }
        return projectiles;
    }

    /**
     * Pattern: Lasers horizontaux depuis les bords
     */
    laserCage({ projectiles, baseSpd, qx, qy, now, glow }) {
        for (let i = 0; i < 4; i++) {
            const y = 150 + i * (this.renderer.height - 300) / 3;
            projectiles.push(this.createProjectile(0, y, baseSpd * 1.8, 0, '⚡', glow));
            projectiles.push(this.createProjectile(this.renderer.width, y, -baseSpd * 1.8, 0, '⚡', glow));
        }
        for (let i = 0; i < 8; i++) {
            const angle = (now / 100) + (i * Math.PI / 4);
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '💀', glow));
        }
        return projectiles;
    }

    /**
     * Pattern: Mur vertical avec trou mouvant
     */
    wallOfDeath({ projectiles, baseSpd, qx, qy, now, glow }) {
        const holePosition = (now / 1500) % 1;
        const holeX = holePosition * this.renderer.width;
        for (let x = 0; x < this.renderer.width; x += 60) {
            if (Math.abs(x - holeX) > 80) {
                projectiles.push(this.createProjectile(x, 0, 0, baseSpd, '🧱', glow));
            }
        }
        for (let i = 0; i < 6; i++) {
            const angle = (now / 150) + (i * Math.PI / 3);
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '🔥', glow));
        }
        return projectiles;
    }

    /**
     * Pattern: Bras de galaxie en spirale
     */
    galaxySpin({ projectiles, baseSpd, qx, qy, now, playerAngle, glow }) {
        for (let arm = 0; arm < 4; arm++) {
            const armBaseAngle = (arm * Math.PI * 2 / 4) + (now / 300);
            for (let dist = 1; dist <= 4; dist++) {
                const angle = armBaseAngle + dist * 0.2;
                const speed = baseSpd * (0.5 + dist * 0.2);
                projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * speed, Math.sin(angle) * speed, '🌌', glow));
            }
        }
        for (let i = -1; i <= 1; i++) {
            const angle = playerAngle + i * 0.25;
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * (baseSpd + 2), Math.sin(angle) * (baseSpd + 2), '💀', glow));
        }
        return projectiles;
    }

    /**
     * Pattern: Spirales chaotiques multiples
     */
    chaosSpiral({ projectiles, baseSpd, qx, qy, now, glow }) {
        for (let s = 0; s < 3; s++) {
            const spiralSpeed = 60 + s * 40;
            const spiralDir = s % 2 === 0 ? 1 : -1;
            for (let i = 0; i < 6; i++) {
                const angle = (now / spiralSpeed) * spiralDir + (i * Math.PI * 2 / 6) + (s * Math.PI / 3);
                projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '🌪️', glow));
            }
        }
        return projectiles;
    }

    /**
     * Pattern par défaut - spirale simple
     */
    defaultPattern({ projectiles, baseSpd, qx, qy, now, glow }) {
        for (let i = 0; i < 8; i++) {
            const angle = (now / 150) + (i * Math.PI / 4);
            projectiles.push(this.createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '💀', glow));
        }
        return projectiles;
    }
}
