// ==========================================
// SYSTÈME DE PROJECTILES
// ==========================================

/**
 * Configuration des types de projectiles
 */
const PROJECTILE_CONFIG = {
    arrow: {
        speed: 8,           // Pixels par frame
        arcHeight: 0.15,    // Hauteur de l'arc (% de la distance)
        size: { width: 6, height: 1 },
        color: '#4a3a2a',
        headColor: '#888',
        damage: 1.0
    },
    javelin: {
        speed: 6,
        arcHeight: 0.12,
        size: { width: 8, height: 2 },
        color: '#5d4037',
        headColor: '#888',
        damage: 1.3
    },
    sling: {
        speed: 10,
        arcHeight: 0.25,
        size: { width: 3, height: 3 },
        color: '#666',
        headColor: '#666',
        damage: 0.8
    }
};

/**
 * Gère les projectiles dans les batailles
 */
class ProjectileSystem {
    constructor(battleSystem) {
        this.battle = battleSystem;
        this.projectiles = [];
        this.projectileId = 0;
    }

    /**
     * Crée un projectile
     * @param {Object} shooter - Unité/soldat qui tire
     * @param {Object} target - Cible (unité ou position)
     * @param {string} type - Type de projectile ('arrow', 'javelin', 'sling')
     * @param {Object} options - Options supplémentaires
     * @returns {Object} Le projectile créé
     */
    createProjectile(shooter, target, type = 'arrow', options = {}) {
        const config = PROJECTILE_CONFIG[type] || PROJECTILE_CONFIG.arrow;

        // Position de départ (depuis le tireur)
        const startX = shooter.x || shooter.position?.x || 0;
        const startY = shooter.y || shooter.position?.y || 0;

        // Position cible
        let targetX, targetY;
        if (target.x !== undefined) {
            targetX = target.x;
            targetY = target.y;
        } else if (target.soldiers && target.soldiers.length > 0) {
            // Viser un soldat aléatoire de l'unité
            const aliveSoldiers = target.soldiers.filter(s => s.isAlive);
            if (aliveSoldiers.length > 0) {
                const randomSoldier = aliveSoldiers[Math.floor(Math.random() * aliveSoldiers.length)];
                targetX = randomSoldier.x;
                targetY = randomSoldier.y;
            } else {
                targetX = target.x;
                targetY = target.y;
            }
        } else {
            targetX = target.x || 0;
            targetY = target.y || 0;
        }

        // Ajouter une légère imprécision
        const spread = options.spread || 10;
        targetX += (Math.random() - 0.5) * spread;
        targetY += (Math.random() - 0.5) * spread;

        // Calculer la distance et le temps de vol
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.hypot(dx, dy);
        const flightTime = distance / config.speed;

        // Hauteur maximale de l'arc
        const arcHeight = distance * config.arcHeight;

        // Angle de direction
        const angle = Math.atan2(dy, dx);

        const projectile = {
            id: this.projectileId++,
            type: type,

            // Positions
            startX: startX,
            startY: startY,
            targetX: targetX,
            targetY: targetY,
            currentX: startX,
            currentY: startY,
            currentZ: 0, // Hauteur (pour l'arc)

            // Trajectoire
            progress: 0,
            flightTime: flightTime,
            arcHeight: arcHeight,
            angle: angle,
            tiltAngle: 0, // Inclinaison verticale

            // Références
            shooter: shooter,
            target: target,
            targetUnit: options.targetUnit || target,

            // Combat
            damage: options.damage || (shooter.stats?.attack || 5) * config.damage,
            hasHit: false,

            // Visuel
            config: config
        };

        this.projectiles.push(projectile);
        return projectile;
    }

    /**
     * Crée une volée de projectiles depuis une unité
     * @param {Object} unit - Unité qui tire
     * @param {Object} targetUnit - Unité ciblée
     * @param {number} count - Nombre de projectiles (ou auto si omis)
     */
    createVolley(unit, targetUnit, count = null) {
        if (!unit.soldiers) {
            // Fallback: créer quelques projectiles
            const numProjectiles = count || Math.ceil(unit.currentMen / 10);
            for (let i = 0; i < numProjectiles; i++) {
                setTimeout(() => {
                    this.createProjectile(unit, targetUnit, this.getProjectileType(unit));
                }, i * 50); // Échelonner les tirs
            }
            return;
        }

        // Créer un projectile par soldat de front qui tire
        const frontSoldiers = unit.soldiers.filter(s => s.isAlive && s.row === 0);
        const type = this.getProjectileType(unit);

        frontSoldiers.forEach((soldier, i) => {
            setTimeout(() => {
                if (soldier.isAlive) {
                    this.createProjectile(
                        { x: soldier.x, y: soldier.y },
                        targetUnit,
                        type,
                        {
                            targetUnit: targetUnit,
                            damage: unit.stats.attack / 3
                        }
                    );
                }
            }, i * 30 + Math.random() * 20); // Tirs échelonnés avec variation
        });
    }

    /**
     * Détermine le type de projectile pour une unité
     */
    getProjectileType(unit) {
        if (unit.id?.includes('velites') || unit.id?.includes('skirmisher')) {
            return 'javelin';
        }
        if (unit.id?.includes('slinger')) {
            return 'sling';
        }
        return 'arrow';
    }

    /**
     * Met à jour tous les projectiles
     * @param {number} deltaTime - Temps écoulé en ms
     */
    updateProjectiles(deltaTime) {
        const completedProjectiles = [];
        const frameTime = deltaTime / 16.67; // Normaliser à ~60fps

        for (const proj of this.projectiles) {
            // Incrémenter la progression
            proj.progress += frameTime / proj.flightTime;

            if (proj.progress >= 1) {
                proj.progress = 1;
                completedProjectiles.push(proj);
            }

            // Interpolation linéaire pour X et Y
            proj.currentX = proj.startX + (proj.targetX - proj.startX) * proj.progress;
            proj.currentY = proj.startY + (proj.targetY - proj.startY) * proj.progress;

            // Arc parabolique pour Z (hauteur)
            // z = 4 * arcHeight * progress * (1 - progress)
            proj.currentZ = 4 * proj.arcHeight * proj.progress * (1 - proj.progress);

            // Calculer l'angle de tilt (inclinaison)
            // Dérivée de la parabole: dz/dp = 4 * arcHeight * (1 - 2*progress)
            const dzProgress = 4 * proj.arcHeight * (1 - 2 * proj.progress);
            const dxy = Math.hypot(
                proj.targetX - proj.startX,
                proj.targetY - proj.startY
            ) / proj.flightTime;
            proj.tiltAngle = Math.atan2(-dzProgress, dxy);
        }

        // Traiter les impacts
        for (const proj of completedProjectiles) {
            this.handleProjectileHit(proj);
        }

        // Supprimer les projectiles complétés
        this.projectiles = this.projectiles.filter(p => !p.hasHit && p.progress < 1);
    }

    /**
     * Gère l'impact d'un projectile
     */
    handleProjectileHit(projectile) {
        projectile.hasHit = true;

        const target = projectile.targetUnit;
        if (!target || target.currentMen <= 0) return;

        // Trouver le soldat le plus proche du point d'impact
        if (target.soldiers) {
            const hitSoldier = this.findClosestSoldier(
                target,
                projectile.targetX,
                projectile.targetY
            );

            if (hitSoldier && hitSoldier.isAlive) {
                // Chance de toucher basée sur la distance au soldat
                const dist = Math.hypot(
                    hitSoldier.x - projectile.targetX,
                    hitSoldier.y - projectile.targetY
                );

                const hitChance = Math.max(0.3, 1 - dist / 20);

                if (Math.random() < hitChance) {
                    // Touché!
                    const damage = Math.ceil(projectile.damage);

                    // Appliquer les dégâts
                    if (this.battle.soldierManager) {
                        // Tuer le soldat si dégâts suffisants
                        if (damage >= hitSoldier.health) {
                            this.battle.soldierManager.triggerDeathAnimation(target, hitSoldier.index);
                            target.currentMen--;

                            // Repositionner la formation
                            if (this.battle.formationSystem) {
                                this.battle.formationSystem.repositionAfterCasualties(target, [hitSoldier.index]);
                            }
                        }
                    } else {
                        target.currentMen = Math.max(0, target.currentMen - 1);
                    }

                    // Dégâts au moral
                    target.morale -= damage * 0.1;
                }
            }
        } else {
            // Pas de soldats individuels, appliquer les dégâts à l'unité
            target.currentMen = Math.max(0, target.currentMen - Math.ceil(projectile.damage / 10));
            target.morale -= projectile.damage * 0.05;
        }
    }

    /**
     * Trouve le soldat le plus proche d'un point
     */
    findClosestSoldier(unit, x, y) {
        if (!unit.soldiers) return null;

        let closest = null;
        let minDist = Infinity;

        for (const soldier of unit.soldiers) {
            if (!soldier.isAlive) continue;

            const dist = Math.hypot(soldier.x - x, soldier.y - y);
            if (dist < minDist) {
                minDist = dist;
                closest = soldier;
            }
        }

        return closest;
    }

    /**
     * Rend tous les projectiles
     * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
     */
    renderProjectiles(ctx) {
        for (const proj of this.projectiles) {
            this.renderProjectile(ctx, proj);
        }
    }

    /**
     * Rend un projectile individuel
     */
    renderProjectile(ctx, proj) {
        ctx.save();

        // Position (Y ajusté par la hauteur Z)
        const drawX = proj.currentX;
        const drawY = proj.currentY - proj.currentZ;

        ctx.translate(drawX, drawY);
        ctx.rotate(proj.angle);
        ctx.rotate(proj.tiltAngle);

        const config = proj.config;

        if (proj.type === 'arrow') {
            // Corps de la flèche
            ctx.fillStyle = config.color;
            ctx.fillRect(-3, -0.5, 6, 1);

            // Pointe
            ctx.fillStyle = config.headColor;
            ctx.beginPath();
            ctx.moveTo(3, 0);
            ctx.lineTo(1, -1);
            ctx.lineTo(1, 1);
            ctx.closePath();
            ctx.fill();

            // Empennage
            ctx.fillStyle = '#c00';
            ctx.fillRect(-3, -1, 1, 2);
        } else if (proj.type === 'javelin') {
            // Corps du javelot
            ctx.fillStyle = config.color;
            ctx.fillRect(-4, -1, 8, 2);

            // Pointe
            ctx.fillStyle = config.headColor;
            ctx.beginPath();
            ctx.moveTo(5, 0);
            ctx.lineTo(2, -2);
            ctx.lineTo(2, 2);
            ctx.closePath();
            ctx.fill();
        } else if (proj.type === 'sling') {
            // Pierre de fronde
            ctx.fillStyle = config.color;
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Dessine l'ombre des projectiles au sol
     */
    renderProjectileShadows(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';

        for (const proj of this.projectiles) {
            // L'ombre est à la position XY réelle (sans le Z)
            ctx.beginPath();
            ctx.ellipse(
                proj.currentX,
                proj.currentY + 2, // Légèrement décalé vers le bas
                3,
                1.5,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }

    /**
     * Nettoie tous les projectiles
     */
    clear() {
        this.projectiles = [];
    }

    /**
     * Nombre de projectiles actifs
     */
    get count() {
        return this.projectiles.length;
    }
}

export default ProjectileSystem;
