// ==========================================
// SYSTÈME D'INTELLIGENCE ARTIFICIELLE
// ==========================================

import { tileDistance } from '../core/MapConfig.js';

class AISystem {
    constructor(game) {
        this.game = game;
    }

    /**
     * Traite le tour de l'IA pour toutes les factions
     */
    processTurn() {
        this.game.armies
            .filter(a => a.faction !== this.game.playerFaction)
            .forEach(army => this.processArmyTurn(army));
    }

    /**
     * Traite le tour d'une armée IA
     */
    processArmyTurn(army) {
        // 30% de chance de bouger
        if (Math.random() > 0.3) return;

        // S'assurer que l'armée a des points de mouvement
        if (army.movementPoints <= 0) return;

        const targets = this.findTargets(army);

        if (targets.length > 0) {
            const target = this.selectTarget(targets);
            this.moveTowardsTarget(army, target);
        }
    }

    /**
     * Trouve les cibles potentielles pour une armée
     */
    findTargets(army) {
        const targets = [];
        const armyX = army.tileX;
        const armyY = army.tileY;

        // Villes ennemies proches
        Object.entries(this.game.cities).forEach(([id, city]) => {
            if (city.faction !== army.faction && city.faction !== 'rebels') {
                const dist = tileDistance(city.tileX, city.tileY, armyX, armyY);
                if (dist < 50) {
                    targets.push({
                        type: 'city',
                        tileX: city.tileX,
                        tileY: city.tileY,
                        priority: 2,
                        distance: dist
                    });
                }
            }
        });

        // Armées ennemies proches
        this.game.armies.forEach(enemyArmy => {
            if (enemyArmy.faction !== army.faction) {
                const dist = tileDistance(enemyArmy.tileX, enemyArmy.tileY, armyX, armyY);
                if (dist < 30) {
                    targets.push({
                        type: 'army',
                        tileX: enemyArmy.tileX,
                        tileY: enemyArmy.tileY,
                        priority: 3,
                        distance: dist,
                        army: enemyArmy
                    });
                }
            }
        });

        return targets;
    }

    /**
     * Sélectionne une cible parmi les possibilités
     */
    selectTarget(targets) {
        // Trier par priorité puis par distance
        targets.sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            return a.distance - b.distance;
        });

        // Prendre une des meilleures cibles avec un peu d'aléatoire
        const topTargets = targets.slice(0, 3);
        return topTargets[Math.floor(Math.random() * topTargets.length)];
    }

    /**
     * Déplace une armée vers sa cible en utilisant le pathfinding
     */
    moveTowardsTarget(army, target) {
        if (!this.game.pathfinder) return;

        const startTile = { x: army.tileX, y: army.tileY };
        const endTile = { x: target.tileX, y: target.tileY };

        // Calculer le chemin
        const path = this.game.pathfinder.findPath(startTile, endTile, {
            unitType: 'infantry',
            season: this.game.season
        });

        if (!path || path.length < 2) return;

        // Trouver jusqu'où on peut aller avec les PM actuels
        let finalIndex = 0;
        for (let i = 1; i < path.length; i++) {
            if (path[i].totalCost <= army.movementPoints) {
                finalIndex = i;
            } else {
                break;
            }
        }

        if (finalIndex === 0) return;

        // Vérifier si on va rencontrer un ennemi
        for (let i = 1; i <= finalIndex; i++) {
            const tile = path[i];

            // Vérifier les armées ennemies
            const enemyArmy = this.game.armyManager.findEnemyArmyAt(tile.x, tile.y, army.faction);
            if (enemyArmy) {
                // S'arrêter avant et engager le combat
                if (i > 1) {
                    // Animer le déplacement jusqu'à la position d'arrêt
                    const animationPath = path.slice(0, i);
                    this.game.armyManager.startMovementAnimation(army, animationPath);

                    army.tileX = path[i - 1].x;
                    army.tileY = path[i - 1].y;
                    army.x = army.tileX * 2;
                    army.y = army.tileY * 2;
                    army.movementPoints -= path[i - 1].totalCost;
                }
                this.game.battle.start(army, enemyArmy);
                return;
            }
        }

        // Se déplacer à la destination atteignable avec animation
        const animationPath = path.slice(0, finalIndex + 1);
        this.game.armyManager.startMovementAnimation(army, animationPath);

        const finalTile = path[finalIndex];
        army.tileX = finalTile.x;
        army.tileY = finalTile.y;
        army.x = army.tileX * 2;
        army.y = army.tileY * 2;
        army.movementPoints -= finalTile.totalCost;
    }
}

export default AISystem;
