// ==========================================
// SYSTÈME DE COLLISION DES UNITÉS
// ==========================================

/**
 * Gère les collisions entre unités pour éviter les chevauchements
 */
class CollisionSystem {
    constructor(battleSystem) {
        this.battle = battleSystem;

        // Configuration - très faible pour éviter l'effet de rebond
        this.separationStrength = 0.08; // Force de séparation très réduite
        this.minSeparation = 0; // Pas de distance minimale - les formations peuvent se toucher
        this.maxForce = 1.5; // Force maximale par frame pour éviter les mouvements brusques
    }

    /**
     * Vérifie si une unité peut se déplacer vers une position
     * @param {Object} unit - L'unité qui veut bouger
     * @param {number} targetX - Position X cible
     * @param {number} targetY - Position Y cible
     * @returns {boolean} true si le mouvement est possible
     */
    canMoveTo(unit, targetX, targetY) {
        const allUnits = this.getAllUnits();
        const unitRadius = this.getCollisionRadius(unit);

        for (const other of allUnits) {
            if (other === unit || other.currentMen <= 0) continue;

            const otherRadius = this.getCollisionRadius(other);
            const minDist = unitRadius + otherRadius + this.minSeparation;

            const dist = Math.hypot(other.x - targetX, other.y - targetY);

            if (dist < minDist) {
                return false;
            }
        }

        // Vérifier les obstacles
        if (this.battle.obstacles) {
            for (const obs of this.battle.obstacles) {
                if (this.collidesWithObstacle(targetX, targetY, unitRadius, obs)) {
                    return false;
                }
            }
        }

        // Vérifier les limites du terrain
        const mapWidth = this.battle.mapWidth || 1600;
        const mapHeight = this.battle.mapHeight || 1000;

        if (targetX - unitRadius < 0 || targetX + unitRadius > mapWidth ||
            targetY - unitRadius < 0 || targetY + unitRadius > mapHeight) {
            return false;
        }

        return true;
    }

    /**
     * Obtient toutes les unités actives
     */
    getAllUnits() {
        return [
            ...(this.battle.attackerUnits || []),
            ...(this.battle.defenderUnits || [])
        ].filter(u => u.currentMen > 0);
    }

    /**
     * Calcule le rayon de collision d'une unité basé sur sa formation
     */
    getCollisionRadius(unit) {
        if (this.battle.formationSystem) {
            return this.battle.formationSystem.getFormationRadius(unit);
        }

        // Fallback basé sur le type
        const radii = {
            infantry: 50,
            ranged: 55,
            skirmisher: 45,
            cavalry: 60,
            elephant: 70
        };

        return radii[unit.type] || 50;
    }

    /**
     * Vérifie si une position entre en collision avec un obstacle
     */
    collidesWithObstacle(x, y, radius, obstacle) {
        if (!obstacle) return false;

        switch (obstacle.type) {
            case 'rock':
            case 'building':
                // Collision circulaire
                const obsRadius = obstacle.radius || 20;
                return Math.hypot(x - obstacle.x, y - obstacle.y) < radius + obsRadius;

            case 'wall':
            case 'river':
                // Collision rectangulaire
                const halfW = (obstacle.width || 100) / 2;
                const halfH = (obstacle.height || 20) / 2;
                const obsX = obstacle.x;
                const obsY = obstacle.y;

                const closestX = Math.max(obsX - halfW, Math.min(x, obsX + halfW));
                const closestY = Math.max(obsY - halfH, Math.min(y, obsY + halfH));

                return Math.hypot(x - closestX, y - closestY) < radius;

            case 'forest':
                // Les unités peuvent traverser les forêts (avec malus)
                return false;

            default:
                return false;
        }
    }

    /**
     * Vérifie si une unité est engagée en mêlée (combat rapproché)
     */
    isEngagedInMelee(unit) {
        // Une unité est engagée si elle attaque une cible au corps à corps
        if (unit.state !== 'attacking' || !unit.target) return false;

        // Calculer la distance à la cible
        const dist = Math.hypot(unit.target.x - unit.x, unit.target.y - unit.y);
        const myRadius = this.battle.formationSystem?.getFormationRadius(unit) || 40;
        const targetRadius = this.battle.formationSystem?.getFormationRadius(unit.target) || 40;

        // Engagé si les formations sont en contact ou proches
        const contactDistance = myRadius + targetRadius + 30; // Marge de 30px pour le contact

        // Engagé si à portée de mêlée (pas une unité à distance qui tire de loin)
        const isRangedUnit = unit.type === 'ranged' || unit.type === 'skirmisher';
        return dist <= contactDistance && !isRangedUnit;
    }

    /**
     * Vérifie si deux unités sont en combat l'une contre l'autre
     */
    areUnitsInCombat(unitA, unitB) {
        // Vérifier si l'une des deux unités cible l'autre
        const aTargetsB = unitA.target === unitB && unitA.state === 'attacking';
        const bTargetsA = unitB.target === unitA && unitB.state === 'attacking';
        return aTargetsB || bTargetsA;
    }

    /**
     * Résout les chevauchements entre unités
     * Appelé à chaque frame pour séparer les unités trop proches
     */
    resolveOverlaps() {
        const units = this.getAllUnits();
        const forces = new Map();

        // Initialiser les forces
        for (const unit of units) {
            forces.set(unit, { x: 0, y: 0 });
        }

        // Calculer les forces de répulsion entre toutes les paires
        for (let i = 0; i < units.length; i++) {
            for (let j = i + 1; j < units.length; j++) {
                const unitA = units[i];
                const unitB = units[j];

                // Ne pas séparer les unités engagées en mêlée l'une contre l'autre
                if (this.areUnitsInCombat(unitA, unitB)) {
                    continue; // Laisser les unités en mêlée se chevaucher complètement
                }

                // Unités du même camp en combat peuvent aussi se chevaucher
                const bothInMelee = this.isEngagedInMelee(unitA) && this.isEngagedInMelee(unitB);
                if (bothInMelee && unitA.side === unitB.side) {
                    continue; // Alliés en mêlée peuvent se mélanger
                }

                const dx = unitB.x - unitA.x;
                const dy = unitB.y - unitA.y;
                const dist = Math.hypot(dx, dy);

                const radiusA = this.getCollisionRadius(unitA);
                const radiusB = this.getCollisionRadius(unitB);
                const minDist = radiusA + radiusB + this.minSeparation;

                if (dist < minDist && dist > 0) {
                    // Les unités se chevauchent, calculer la force de séparation
                    const overlap = minDist - dist;
                    const force = overlap * this.separationStrength;

                    // Direction de séparation (normalisée)
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Appliquer la force (divisée entre les deux unités)
                    const forceA = forces.get(unitA);
                    const forceB = forces.get(unitB);

                    // L'unité avec moins de troupes est poussée plus fort
                    const ratioA = unitB.currentMen / (unitA.currentMen + unitB.currentMen);
                    const ratioB = 1 - ratioA;

                    forceA.x -= nx * force * ratioA;
                    forceA.y -= ny * force * ratioA;
                    forceB.x += nx * force * ratioB;
                    forceB.y += ny * force * ratioB;
                }
            }
        }

        // Appliquer les forces
        for (const unit of units) {
            // Ne pas déplacer les unités engagées en mêlée
            if (this.isEngagedInMelee(unit)) continue;

            const force = forces.get(unit);
            if (force && (force.x !== 0 || force.y !== 0)) {
                // Limiter la force maximale pour éviter les mouvements brusques
                const forceMag = Math.hypot(force.x, force.y);
                if (forceMag > this.maxForce) {
                    force.x = (force.x / forceMag) * this.maxForce;
                    force.y = (force.y / forceMag) * this.maxForce;
                }

                // Vérifier que le nouveau positionnement est valide
                const newX = unit.x + force.x;
                const newY = unit.y + force.y;

                // Limiter aux bords du terrain
                const mapWidth = this.battle.mapWidth || 1600;
                const mapHeight = this.battle.mapHeight || 1000;
                const radius = this.getCollisionRadius(unit);

                unit.x = Math.max(radius, Math.min(mapWidth - radius, newX));
                unit.y = Math.max(radius, Math.min(mapHeight - radius, newY));

                // Mettre à jour les positions des soldats si nécessaire
                if (unit.soldiers && this.battle.formationSystem) {
                    this.battle.soldierManager?.updateSoldierTargetPositions(
                        unit,
                        this.battle.formationSystem
                    );
                }
            }
        }
    }

    /**
     * Trouve une position libre proche d'un point
     * @param {number} x - Position X souhaitée
     * @param {number} y - Position Y souhaitée
     * @param {number} radius - Rayon de l'unité
     * @param {Object} excludeUnit - Unité à exclure (l'unité qui cherche)
     * @returns {Object|null} { x, y } ou null si aucune position trouvée
     */
    findFreePosition(x, y, radius, excludeUnit = null) {
        // Essayer d'abord la position demandée
        if (this.isPositionFree(x, y, radius, excludeUnit)) {
            return { x, y };
        }

        // Chercher en spirale autour du point
        const step = radius;
        for (let r = step; r < step * 10; r += step) {
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                const testX = x + Math.cos(angle) * r;
                const testY = y + Math.sin(angle) * r;

                if (this.isPositionFree(testX, testY, radius, excludeUnit)) {
                    return { x: testX, y: testY };
                }
            }
        }

        return null;
    }

    /**
     * Vérifie si une position est libre
     */
    isPositionFree(x, y, radius, excludeUnit = null) {
        const units = this.getAllUnits();

        for (const unit of units) {
            if (unit === excludeUnit) continue;

            const dist = Math.hypot(unit.x - x, unit.y - y);
            const minDist = this.getCollisionRadius(unit) + radius + this.minSeparation;

            if (dist < minDist) {
                return false;
            }
        }

        // Vérifier les obstacles
        if (this.battle.obstacles) {
            for (const obs of this.battle.obstacles) {
                if (this.collidesWithObstacle(x, y, radius, obs)) {
                    return false;
                }
            }
        }

        // Vérifier les limites
        const mapWidth = this.battle.mapWidth || 1600;
        const mapHeight = this.battle.mapHeight || 1000;

        if (x - radius < 0 || x + radius > mapWidth ||
            y - radius < 0 || y + radius > mapHeight) {
            return false;
        }

        return true;
    }

    /**
     * Calcule un chemin évitant les obstacles (simplifié)
     * @param {Object} unit - Unité qui se déplace
     * @param {number} targetX - Destination X
     * @param {number} targetY - Destination Y
     * @returns {Array} Chemin [{ x, y }, ...]
     */
    findPath(unit, targetX, targetY) {
        // Version simplifiée: chemin direct si possible, sinon contourner
        const radius = this.getCollisionRadius(unit);

        if (this.canMoveTo(unit, targetX, targetY)) {
            return [{ x: targetX, y: targetY }];
        }

        // Chercher un point intermédiaire
        const dx = targetX - unit.x;
        const dy = targetY - unit.y;
        const dist = Math.hypot(dx, dy);

        // Essayer de contourner par la gauche ou la droite
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const offset = radius * 2;

        const leftPoint = {
            x: unit.x + dx * 0.5 + perpX * offset,
            y: unit.y + dy * 0.5 + perpY * offset
        };

        const rightPoint = {
            x: unit.x + dx * 0.5 - perpX * offset,
            y: unit.y + dy * 0.5 - perpY * offset
        };

        if (this.isPositionFree(leftPoint.x, leftPoint.y, radius, unit)) {
            return [leftPoint, { x: targetX, y: targetY }];
        }

        if (this.isPositionFree(rightPoint.x, rightPoint.y, radius, unit)) {
            return [rightPoint, { x: targetX, y: targetY }];
        }

        // Pas de chemin trouvé, rester sur place
        return [];
    }

    /**
     * Ajuste une position de destination pour éviter les collisions
     */
    adjustDestination(unit, targetX, targetY) {
        if (this.canMoveTo(unit, targetX, targetY)) {
            return { x: targetX, y: targetY };
        }

        // Trouver la position libre la plus proche
        const radius = this.getCollisionRadius(unit);
        const freePos = this.findFreePosition(targetX, targetY, radius, unit);

        if (freePos) {
            return freePos;
        }

        // Rester en place
        return { x: unit.x, y: unit.y };
    }

    /**
     * Vérifie si deux unités sont en contact (mêlée)
     */
    areUnitsInContact(unitA, unitB) {
        const dist = Math.hypot(unitA.x - unitB.x, unitA.y - unitB.y);
        const contactDist = this.getCollisionRadius(unitA) + this.getCollisionRadius(unitB) + 5;
        return dist <= contactDist;
    }

    /**
     * Obtient toutes les unités ennemies au contact
     */
    getUnitsInContact(unit) {
        return this.getAllUnits().filter(other =>
            other !== unit &&
            other.faction !== unit.faction &&
            this.areUnitsInContact(unit, other)
        );
    }
}

export default CollisionSystem;
