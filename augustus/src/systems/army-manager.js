// ==========================================
// SYSTÈME DE GESTION DES ARMÉES (TUILES)
// ==========================================

import { UNIT_TYPES, FACTIONS } from '../data/index.js';
import { generateId, randomChoice } from '../utils/helpers.js';
import { MAP_CONFIG, tileDistance, isValidTile } from '../core/MapConfig.js';

class ArmyManager {
    constructor(game) {
        this.game = game;

        // Animations en cours
        this.animations = new Map();
        this.animationSpeed = 0.15; // Vitesse de l'animation (0-1 par frame)
    }

    /**
     * Crée une unité à partir d'un template
     */
    createUnit(unitTypeId) {
        const template = UNIT_TYPES[unitTypeId];
        if (!template) return null;

        return {
            ...template,
            currentMen: template.men,
            experience: 0,
            morale: template.stats.morale
        };
    }

    /**
     * Crée une armée
     */
    createArmy(faction, tileX, tileY, name, units = []) {
        return {
            id: generateId('army'),
            name: name,
            faction: faction,
            tileX: tileX,
            tileY: tileY,
            // Position visuelle pour l'animation
            visualX: tileX,
            visualY: tileY,
            // Garder x/y pour compatibilité temporaire
            x: tileX * 2,
            y: tileY * 2,
            units: units,
            movementPoints: 5,
            maxMovement: 5,
            experience: 0,
            general: null
        };
    }

    /**
     * Crée les armées initiales de chaque faction
     */
    createInitialArmies() {
        const armies = [];

        // Armée du joueur
        const playerStart = FACTIONS[this.game.playerFaction].startCity;
        if (playerStart && this.game.cities[playerStart]) {
            const city = this.game.cities[playerStart];
            const armyTileX = city.tileX + 2;
            const armyTileY = city.tileY;
            armies.push({
                id: 'army_player_1',
                name: 'Legio I',
                faction: this.game.playerFaction,
                tileX: armyTileX,
                tileY: armyTileY,
                visualX: armyTileX,
                visualY: armyTileY,
                x: armyTileX * 2,
                y: armyTileY * 2,
                units: [
                    this.createUnit('hastati'),
                    this.createUnit('hastati'),
                    this.createUnit('velites'),
                    this.createUnit('equites')
                ],
                movementPoints: 5,
                maxMovement: 5,
                experience: 0,
                general: {
                    name: 'Gaius Julius',
                    command: 3,
                    influence: 2
                }
            });

            // Armée ennemie de test près de Rome (Gaulois)
            const enemyTileX = city.tileX + 6;
            const enemyTileY = city.tileY - 2;
            armies.push({
                id: 'army_test_enemy',
                name: 'Horde Gauloise',
                faction: 'gauls',
                tileX: enemyTileX,
                tileY: enemyTileY,
                visualX: enemyTileX,
                visualY: enemyTileY,
                x: enemyTileX * 2,
                y: enemyTileY * 2,
                units: [
                    this.createUnit('gallic_warriors'),
                    this.createUnit('gallic_warriors'),
                    this.createUnit('gallic_nobles')
                ],
                movementPoints: 5,
                maxMovement: 5,
                experience: 0,
                general: {
                    name: 'Brennus',
                    command: 2,
                    influence: 1
                }
            });

            // === ARMÉES DE TEST AUTOUR DE ROME (TOUTES FACTIONS) ===

            // Carthage - Sud-Ouest de Rome (avec éléphants)
            const carthageTileX = city.tileX - 5;
            const carthageTileY = city.tileY + 3;
            armies.push({
                id: 'army_test_carthage',
                name: 'Armée de Carthage',
                faction: 'carthage',
                tileX: carthageTileX,
                tileY: carthageTileY,
                visualX: carthageTileX,
                visualY: carthageTileY,
                x: carthageTileX * 2,
                y: carthageTileY * 2,
                units: [
                    this.createUnit('carthage_infantry'),
                    this.createUnit('carthage_infantry'),
                    this.createUnit('war_elephants'),
                    this.createUnit('numidian_cavalry')
                ],
                movementPoints: 5,
                maxMovement: 5,
                experience: 0,
                general: {
                    name: 'Hannibal',
                    command: 5,
                    influence: 4
                }
            });

            // Macédoine - Est de Rome (phalanges)
            const macedonTileX = city.tileX + 7;
            const macedonTileY = city.tileY + 2;
            armies.push({
                id: 'army_test_macedon',
                name: 'Phalange Macédonienne',
                faction: 'macedon',
                tileX: macedonTileX,
                tileY: macedonTileY,
                visualX: macedonTileX,
                visualY: macedonTileY,
                x: macedonTileX * 2,
                y: macedonTileY * 2,
                units: [
                    this.createUnit('phalangites'),
                    this.createUnit('phalangites'),
                    this.createUnit('hoplites')
                ],
                movementPoints: 5,
                maxMovement: 5,
                experience: 0,
                general: {
                    name: 'Philippos',
                    command: 4,
                    influence: 3
                }
            });

            // Pontus - Nord-Est de Rome
            const pontusTileX = city.tileX + 5;
            const pontusTileY = city.tileY - 4;
            armies.push({
                id: 'army_test_pontus',
                name: 'Armée du Pont',
                faction: 'pontus',
                tileX: pontusTileX,
                tileY: pontusTileY,
                visualX: pontusTileX,
                visualY: pontusTileY,
                x: pontusTileX * 2,
                y: pontusTileY * 2,
                units: [
                    this.createUnit('hoplites'),
                    this.createUnit('hoplites'),
                    this.createUnit('numidian_cavalry')
                ],
                movementPoints: 5,
                maxMovement: 5,
                experience: 0,
                general: {
                    name: 'Mithridate',
                    command: 3,
                    influence: 2
                }
            });

            // Maurétanie - Sud de Rome (cavalerie légère)
            const mauretaniaTileX = city.tileX;
            const mauretaniaTileY = city.tileY + 5;
            armies.push({
                id: 'army_test_mauretania',
                name: 'Cavaliers Maures',
                faction: 'mauretania',
                tileX: mauretaniaTileX,
                tileY: mauretaniaTileY,
                visualX: mauretaniaTileX,
                visualY: mauretaniaTileY,
                x: mauretaniaTileX * 2,
                y: mauretaniaTileY * 2,
                units: [
                    this.createUnit('numidian_cavalry'),
                    this.createUnit('numidian_cavalry'),
                    this.createUnit('gallic_warriors')
                ],
                movementPoints: 5,
                maxMovement: 5,
                experience: 0,
                general: {
                    name: 'Jugurtha',
                    command: 3,
                    influence: 2
                }
            });

            // Rebelles - Ouest de Rome
            const rebelsTileX = city.tileX - 6;
            const rebelsTileY = city.tileY - 1;
            armies.push({
                id: 'army_test_rebels',
                name: 'Bande de Rebelles',
                faction: 'rebels',
                tileX: rebelsTileX,
                tileY: rebelsTileY,
                visualX: rebelsTileX,
                visualY: rebelsTileY,
                x: rebelsTileX * 2,
                y: rebelsTileY * 2,
                units: [
                    this.createUnit('hastati'),
                    this.createUnit('velites'),
                    this.createUnit('gallic_warriors')
                ],
                movementPoints: 5,
                maxMovement: 5,
                experience: 0,
                general: {
                    name: 'Spartacus',
                    command: 3,
                    influence: 4
                }
            });
        }

        // Armées des autres factions
        Object.entries(FACTIONS).forEach(([factionId, faction]) => {
            if (factionId === this.game.playerFaction || factionId === 'senate' || factionId === 'rebels') return;

            if (faction.startCity && this.game.cities[faction.startCity]) {
                const city = this.game.cities[faction.startCity];
                const aiArmyTileX = city.tileX + 2;
                const aiArmyTileY = city.tileY;
                armies.push({
                    id: `army_${factionId}_1`,
                    name: `Armée ${faction.name}`,
                    faction: factionId,
                    tileX: aiArmyTileX,
                    tileY: aiArmyTileY,
                    visualX: aiArmyTileX,
                    visualY: aiArmyTileY,
                    x: aiArmyTileX * 2,
                    y: aiArmyTileY * 2,
                    units: this.generateArmyUnits(factionId, 3),
                    movementPoints: 5,
                    maxMovement: 5,
                    experience: 0
                });
            }
        });

        return armies;
    }

    /**
     * Génère des unités pour une armée IA
     */
    generateArmyUnits(factionId, count) {
        const units = [];
        const faction = FACTIONS[factionId];

        let availableUnits = [];
        if (faction.isRoman) {
            availableUnits = ['hastati', 'principes', 'velites', 'equites'];
        } else if (factionId === 'gauls') {
            availableUnits = ['gallic_warriors', 'gallic_nobles'];
        } else if (factionId === 'carthage') {
            availableUnits = ['carthage_infantry', 'war_elephants', 'numidian_cavalry'];
        } else if (factionId === 'macedon') {
            availableUnits = ['hoplites', 'phalangites'];
        } else if (factionId === 'mauretania') {
            availableUnits = ['numidian_cavalry', 'gallic_warriors'];
        } else {
            availableUnits = ['hastati', 'velites'];
        }

        for (let i = 0; i < count; i++) {
            const unitType = randomChoice(availableUnits);
            if (UNIT_TYPES[unitType]) {
                units.push(this.createUnit(unitType));
            }
        }

        return units;
    }

    /**
     * Sélectionne une armée
     */
    selectArmy(army) {
        this.game.selectedArmy = army;
        this.game.selectedCity = null;

        if (army.faction === this.game.playerFaction) {
            this.game.panels.showQuickActions();
            // Calculer les tuiles accessibles pour l'affichage
            this.calculateReachableTiles(army);
        } else {
            this.game.panels.hideQuickActions();
            this.game.reachableTiles = null;
        }

        this.game.panels.showArmyInfo(army);
    }

    /**
     * Calcule les tuiles accessibles pour une armée
     */
    calculateReachableTiles(army) {
        if (!this.game.pathfinder || army.movementPoints <= 0) {
            this.game.reachableTiles = null;
            return;
        }

        const startTile = { x: army.tileX, y: army.tileY };
        this.game.reachableTiles = this.game.pathfinder.getReachableTiles(
            startTile,
            army.movementPoints,
            {
                unitType: this.getArmyUnitType(army),
                season: this.game.season
            }
        );
    }

    /**
     * Démarre le mode déplacement
     */
    startMove() {
        if (!this.game.selectedArmy || this.game.selectedArmy.faction !== this.game.playerFaction) return;

        if (this.game.selectedArmy.movementPoints <= 0) {
            this.game.notify('Cette armée n\'a plus de points de mouvement!', 'warning');
            return;
        }

        this.game.campaignMap.startMoveMode();
        this.game.notify('Cliquez sur la destination', 'info');
    }

    /**
     * Définit une destination pour l'armée (avec waypoint si multi-tour)
     * @param {Object} army - L'armée à déplacer
     * @param {Object} destination - {x, y} coordonnées de la tuile destination
     */
    setMovementTarget(army, destination) {
        if (!this.game.pathfinder) {
            this.game.notify('Erreur: pathfinder non initialisé', 'error');
            return;
        }

        // Si on clique sur la position actuelle, annuler le waypoint
        if (army.tileX === destination.x && army.tileY === destination.y) {
            army.waypoint = null;
            this.game.movementPreview = null;
            this.game.notify('Destination annulée', 'info');
            return;
        }

        // Vérifier si on clique sur une armée ennemie
        const enemyAtDestination = this.findEnemyArmyAt(destination.x, destination.y, army.faction);
        if (enemyAtDestination) {
            // Attaquer directement si adjacent
            const dist = tileDistance(army.tileX, army.tileY, destination.x, destination.y);
            if (dist <= 1) {
                this.game.battle.start(army, enemyAtDestination);
                return;
            }
            // Sinon, trouver une tuile adjacente accessible et s'y déplacer
            const adjacentTile = this.findBestAdjacentTile(army, destination);
            if (adjacentTile) {
                destination = adjacentTile;
                // Marquer l'ennemi comme cible pour l'attaque automatique après déplacement
                army.pendingAttackTarget = enemyAtDestination.id;
            }
        }

        const startTile = { x: army.tileX, y: army.tileY };

        // Calculer le chemin complet
        const path = this.game.pathfinder.findPath(startTile, destination, {
            unitType: this.getArmyUnitType(army),
            season: this.game.season
        });

        if (!path || path.length < 2) {
            this.game.notify('Aucun chemin valide vers cette destination!', 'warning');
            return;
        }

        // Trouver jusqu'où on peut aller ce tour
        let reachableIndex = 0;
        for (let i = 1; i < path.length; i++) {
            if (path[i].totalCost <= army.movementPoints) {
                reachableIndex = i;
            } else {
                break;
            }
        }

        if (reachableIndex === 0 && army.movementPoints <= 0) {
            // Pas de points de mouvement, juste définir le waypoint
            army.waypoint = { x: destination.x, y: destination.y };
            this.game.notify(`${army.name} se déplacera au prochain tour`, 'info');
            return;
        }

        if (reachableIndex === 0) {
            // On ne peut pas atteindre même la première case ce tour
            army.waypoint = { x: destination.x, y: destination.y };
            this.game.notify(`${army.name} se déplacera au prochain tour`, 'info');
            return;
        }

        // Déplacer l'armée jusqu'au point atteignable
        const reachedDestination = this.moveArmy(army, path[reachableIndex]);

        // Si la destination finale n'est pas atteinte, définir un waypoint
        if (reachedDestination && reachableIndex < path.length - 1) {
            army.waypoint = { x: destination.x, y: destination.y };
            this.game.notify(`${army.name} continuera vers sa destination au prochain tour`, 'info');
        } else if (reachedDestination) {
            // Destination atteinte, effacer le waypoint
            army.waypoint = null;
        }
    }

    /**
     * Déplace une armée vers une tuile destination
     * @param {Object} army - L'armée à déplacer
     * @param {Object} destination - {x, y} coordonnées de la tuile destination
     * @returns {boolean} - true si le déplacement a réussi
     */
    moveArmy(army, destination) {
        if (!this.game.pathfinder) {
            this.game.notify('Erreur: pathfinder non initialisé', 'error');
            return false;
        }

        const startTile = { x: army.tileX, y: army.tileY };

        // Calculer le chemin
        const path = this.game.pathfinder.findPath(startTile, destination, {
            unitType: this.getArmyUnitType(army),
            season: this.game.season
        });

        if (!path || path.length < 2) {
            this.game.notify('Aucun chemin valide vers cette destination!', 'warning');
            return false;
        }

        // Trouver jusqu'où on peut aller avec les PM actuels
        let finalIndex = 0;
        for (let i = 1; i < path.length; i++) {
            if (path[i].totalCost <= army.movementPoints) {
                finalIndex = i;
            } else {
                break;
            }
        }

        if (finalIndex === 0) {
            this.game.notify('Pas assez de points de mouvement!', 'warning');
            return false;
        }

        // Parcourir le chemin
        for (let i = 1; i <= finalIndex; i++) {
            const tile = path[i];

            // Vérifier les collisions avec des armées ennemies
            const enemyArmy = this.findEnemyArmyAt(tile.x, tile.y, army.faction);
            if (enemyArmy) {
                // Arrêter une tuile avant et lancer la bataille
                if (i > 1) {
                    army.tileX = path[i - 1].x;
                    army.tileY = path[i - 1].y;
                    army.x = army.tileX * 2;
                    army.y = army.tileY * 2;
                    army.movementPoints -= path[i - 1].totalCost;
                }
                this.game.battle.start(army, enemyArmy);
                return true;
            }

            // Vérifier si on attaque une ville ennemie
            const targetCity = this.findEnemyCityAt(tile.x, tile.y, army.faction);
            if (targetCity) {
                // S'arrêter sur la ville et initier le siège
                army.tileX = tile.x;
                army.tileY = tile.y;
                army.x = army.tileX * 2;
                army.y = army.tileY * 2;
                army.movementPoints -= tile.totalCost;

                this.initiateSiege(army, targetCity);
                return true;
            }
        }

        // Appliquer l'attrition pour le chemin parcouru
        this.applyPathAttrition(army, path.slice(0, finalIndex + 1));

        // Démarrer l'animation de mouvement
        const animationPath = path.slice(0, finalIndex + 1);
        this.startMovementAnimation(army, animationPath);

        // Mettre à jour les points de mouvement immédiatement
        const finalTile = path[finalIndex];
        army.movementPoints -= finalTile.totalCost;

        // La position logique est mise à jour immédiatement pour le pathfinding
        army.tileX = finalTile.x;
        army.tileY = finalTile.y;
        army.x = army.tileX * 2;
        army.y = army.tileY * 2;

        // Rafraîchir l'affichage et les tuiles accessibles
        this.refreshSelectedArmyPanel();
        this.calculateReachableTiles(army);

        // Vérifier s'il y a un ennemi adjacent après le déplacement pour auto-attaque
        const adjacentEnemy = this.findAdjacentEnemy(army);
        if (adjacentEnemy && army.pendingAttackTarget === adjacentEnemy.id) {
            // Lancer l'attaque automatiquement
            army.pendingAttackTarget = null;
            this.game.battle.start(army, adjacentEnemy);
            return true;
        }
        army.pendingAttackTarget = null;

        // Recalculer la prévisualisation de mouvement depuis la nouvelle position
        if (this.game.campaignMap?.lastMouseTile) {
            this.game.campaignMap.updateMovementPreview(this.game.campaignMap.lastMouseTile);
        }

        this.game.notify(`${army.name} se déplace...`, 'info');
        return true;
    }

    /**
     * Trouve un ennemi adjacent à l'armée
     */
    findAdjacentEnemy(army) {
        for (const dir of MAP_CONFIG.DIRECTIONS) {
            const nx = army.tileX + dir.dx;
            const ny = army.tileY + dir.dy;
            const enemy = this.findEnemyArmyAt(nx, ny, army.faction);
            if (enemy) return enemy;
        }
        return null;
    }

    /**
     * Démarre l'animation de mouvement pour une armée
     * @param {Object} army - L'armée à animer
     * @param {Array} path - Le chemin à suivre
     */
    startMovementAnimation(army, path) {
        if (path.length < 2) return;

        // Initialiser la position visuelle si nécessaire
        if (army.visualX === undefined) {
            army.visualX = path[0].x;
            army.visualY = path[0].y;
        }

        // Stocker la direction initiale
        if (path.length >= 2) {
            const dx = path[1].x - path[0].x;
            const dy = path[1].y - path[0].y;
            army.lastDirection = this.vectorToDirection(dx, dy);
        }

        this.animations.set(army.id, {
            army: army,
            path: path,
            currentSegment: 0,
            progress: 0, // 0 à 1 pour le segment actuel
            startX: army.visualX,
            startY: army.visualY,
            startTime: performance.now()
        });
    }

    /**
     * Convertit un vecteur en direction
     */
    vectorToDirection(dx, dy) {
        if (dx === 0 && dy > 0) return 'S';
        if (dx === 0 && dy < 0) return 'N';
        if (dx > 0 && dy === 0) return 'E';
        if (dx < 0 && dy === 0) return 'W';
        if (dx > 0 && dy > 0) return 'SE';
        if (dx < 0 && dy > 0) return 'SW';
        if (dx > 0 && dy < 0) return 'NE';
        if (dx < 0 && dy < 0) return 'NW';
        return 'S';
    }

    /**
     * Met à jour toutes les animations de mouvement
     * Appelé à chaque frame
     */
    updateAnimations() {
        for (const [armyId, anim] of this.animations) {
            const { army, path, currentSegment, startX, startY } = anim;

            // Calculer le segment actuel
            const fromIdx = currentSegment;
            const toIdx = currentSegment + 1;

            if (toIdx >= path.length) {
                // Animation terminée
                army.visualX = path[path.length - 1].x;
                army.visualY = path[path.length - 1].y;
                this.animations.delete(armyId);
                continue;
            }

            const fromTile = fromIdx === 0 ? { x: startX, y: startY } : path[fromIdx];
            const toTile = path[toIdx];

            // Mettre à jour la direction de l'armée
            const dx = toTile.x - fromTile.x;
            const dy = toTile.y - fromTile.y;
            army.lastDirection = this.vectorToDirection(dx, dy);

            // Incrémenter la progression
            anim.progress += this.animationSpeed;

            if (anim.progress >= 1) {
                // Passer au segment suivant
                anim.progress = 0;
                anim.currentSegment++;

                if (anim.currentSegment >= path.length - 1) {
                    // Animation terminée
                    army.visualX = path[path.length - 1].x;
                    army.visualY = path[path.length - 1].y;
                    this.animations.delete(armyId);
                } else {
                    army.visualX = toTile.x;
                    army.visualY = toTile.y;
                }
            } else {
                // Interpoler la position
                army.visualX = fromTile.x + (toTile.x - fromTile.x) * anim.progress;
                army.visualY = fromTile.y + (toTile.y - fromTile.y) * anim.progress;
            }
        }
    }

    /**
     * Vérifie si une armée est en cours d'animation
     */
    isAnimating(army) {
        return this.animations.has(army.id);
    }

    /**
     * Vérifie si des animations sont en cours
     */
    hasActiveAnimations() {
        return this.animations.size > 0;
    }

    /**
     * Initialise les positions visuelles pour toutes les armées
     * (utile après le chargement d'une sauvegarde)
     */
    initializeVisualPositions() {
        for (const army of this.game.armies) {
            if (army.visualX === undefined) {
                army.visualX = army.tileX;
            }
            if (army.visualY === undefined) {
                army.visualY = army.tileY;
            }
        }
    }

    /**
     * Détermine le type d'unité dominant dans l'armée
     */
    getArmyUnitType(army) {
        if (!army.units || army.units.length === 0) return 'infantry';

        const typeCounts = { infantry: 0, cavalry: 0, ranged: 0 };
        for (const unit of army.units) {
            const type = unit.type || 'infantry';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        }

        if (typeCounts.cavalry > typeCounts.infantry) return 'cavalry';
        return 'infantry';
    }

    /**
     * Trouve une armée ennemie à une position
     */
    findEnemyArmyAt(tileX, tileY, excludeFaction) {
        return this.game.armies.find(a =>
            a.tileX === tileX &&
            a.tileY === tileY &&
            a.faction !== excludeFaction
        );
    }

    /**
     * Trouve la meilleure tuile adjacente à une cible pour attaquer
     * @param {Object} army - L'armée qui veut attaquer
     * @param {Object} targetPos - Position de la cible {x, y}
     * @returns {Object|null} - Tuile adjacente {x, y} ou null
     */
    findBestAdjacentTile(army, targetPos) {
        const { DIRECTIONS } = MAP_CONFIG;
        let bestTile = null;
        let bestCost = Infinity;

        for (const dir of DIRECTIONS) {
            const nx = targetPos.x + dir.dx;
            const ny = targetPos.y + dir.dy;

            // Vérifier que la tuile est valide et traversable
            if (!isValidTile(nx, ny)) continue;
            if (!this.game.terrainMap.isPassable(nx, ny)) continue;

            // Vérifier qu'il n'y a pas d'armée sur cette tuile
            if (this.findArmyAt(nx, ny)) continue;

            // Calculer le coût pour atteindre cette tuile
            const path = this.game.pathfinder.findPath(
                { x: army.tileX, y: army.tileY },
                { x: nx, y: ny },
                { unitType: this.getArmyUnitType(army), season: this.game.season }
            );

            if (path && path.length > 1) {
                const cost = path[path.length - 1].totalCost;
                if (cost < bestCost) {
                    bestCost = cost;
                    bestTile = { x: nx, y: ny };
                }
            }
        }

        return bestTile;
    }

    /**
     * Trouve une ville ennemie à une position
     */
    findEnemyCityAt(tileX, tileY, excludeFaction) {
        for (const city of Object.values(this.game.cities)) {
            if (city.faction === excludeFaction) continue;

            // Vérifier si la tuile fait partie de la ville
            if (city.tiles) {
                if (city.tiles.some(t => t.x === tileX && t.y === tileY)) {
                    return city;
                }
            } else if (city.tileX === tileX && city.tileY === tileY) {
                return city;
            }
        }
        return null;
    }

    /**
     * Initie un siège sur une ville
     */
    initiateSiege(army, city) {
        // Chercher une armée défensive
        const defenderArmy = this.game.armies.find(a =>
            a.faction === city.faction &&
            tileDistance(a.tileX, a.tileY, city.tileX, city.tileY) < 5
        );

        if (defenderArmy) {
            // Bataille avec l'armée défensive
            this.game.battle.start(army, defenderArmy, city);
        } else if (city.garrison && city.garrison.length > 0) {
            // Créer une armée temporaire avec la garnison
            const garrisonArmy = {
                id: `garrison_${city.id}`,
                name: `Garnison de ${city.name}`,
                faction: city.faction,
                tileX: city.tileX,
                tileY: city.tileY,
                x: city.tileX * 2,
                y: city.tileY * 2,
                units: city.garrison,
                movementPoints: 0,
                maxMovement: 0
            };
            this.game.armies.push(garrisonArmy);
            this.game.battle.start(army, garrisonArmy, city);
        } else {
            // Ville sans défense - capture directe
            this.captureCity(city, army.faction);
        }
    }

    /**
     * Applique l'attrition pour un chemin parcouru
     */
    applyPathAttrition(army, path) {
        if (!this.game.terrainMap) return;

        let totalAttrition = 0;

        for (let i = 1; i < path.length; i++) {
            const tile = path[i];
            const attritionRate = this.game.terrainMap.getAttritionRate(
                tile.x,
                tile.y,
                this.game.season
            );
            totalAttrition += attritionRate;
        }

        if (totalAttrition > 0) {
            let totalLosses = 0;
            army.units.forEach(unit => {
                const losses = Math.floor(unit.currentMen * totalAttrition);
                if (losses > 0) {
                    unit.currentMen = Math.max(1, unit.currentMen - losses);
                    totalLosses += losses;
                }
            });

            if (totalLosses > 0) {
                this.game.notify(`${army.name} a perdu ${totalLosses} hommes par attrition`, 'warning');
            }
        }
    }

    /**
     * Réinitialise les points de mouvement de toutes les armées
     */
    resetMovementPoints() {
        this.game.armies.forEach(army => {
            army.movementPoints = army.maxMovement;
        });
    }

    /**
     * Continue les déplacements automatiques des armées avec waypoints
     * Appelé au début de chaque tour
     */
    continueWaypointMovements() {
        // Seulement pour les armées du joueur
        const playerArmies = this.game.armies.filter(a => a.faction === this.game.playerFaction);

        for (const army of playerArmies) {
            if (army.waypoint && army.movementPoints > 0) {
                // Continuer vers le waypoint
                this.setMovementTarget(army, army.waypoint);
            }
        }
    }

    /**
     * Réapprovisionne les armées dans les villes alliées
     * Appelé à chaque fin de tour
     */
    resupplyArmies() {
        for (const army of this.game.armies) {
            // Vérifier si l'armée est dans une ville alliée
            const city = this.findAlliedCityAt(army.tileX, army.tileY, army.faction);

            if (city) {
                let totalReplenished = 0;

                for (const unit of army.units) {
                    if (unit.currentMen < unit.men) {
                        // Récupérer 20% des effectifs manquants par tour
                        const missing = unit.men - unit.currentMen;
                        const replenish = Math.ceil(missing * 0.2);
                        unit.currentMen = Math.min(unit.men, unit.currentMen + replenish);
                        totalReplenished += replenish;
                    }
                }

                if (totalReplenished > 0 && army.faction === this.game.playerFaction) {
                    this.game.notify(`${army.name} a reçu ${totalReplenished} renforts à ${city.name}`, 'success');
                }
            }
        }

        // Rafraîchir l'affichage de l'armée sélectionnée
        this.refreshSelectedArmyPanel();
    }

    /**
     * Rafraîchit le panneau de l'armée sélectionnée
     */
    refreshSelectedArmyPanel() {
        if (this.game.selectedArmy) {
            this.game.panels.showArmyInfo(this.game.selectedArmy);
        }
    }

    /**
     * Trouve une ville alliée à une position
     */
    findAlliedCityAt(tileX, tileY, faction) {
        for (const city of Object.values(this.game.cities)) {
            if (city.faction !== faction) continue;

            // Vérifier le centre de la ville
            if (city.tileX === tileX && city.tileY === tileY) {
                return city;
            }

            // Vérifier les tuiles de la ville
            if (city.tiles) {
                for (const tile of city.tiles) {
                    if (tile.x === tileX && tile.y === tileY) {
                        return city;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Supprime une armée
     */
    removeArmy(armyId) {
        this.game.armies = this.game.armies.filter(a => a.id !== armyId);
    }

    /**
     * Trouve l'armée à une position tuile
     */
    findArmyAt(tileX, tileY, radius = 0) {
        return this.game.armies.find(army => {
            if (radius === 0) {
                return army.tileX === tileX && army.tileY === tileY;
            }
            return tileDistance(army.tileX, army.tileY, tileX, tileY) <= radius;
        });
    }

    /**
     * Trouve un ennemi proche (armée ou ville) pour attaquer
     */
    findNearbyEnemy(army) {
        const attackRange = 3; // Distance d'attaque en tuiles

        // Chercher d'abord les armées ennemies proches
        for (const otherArmy of this.game.armies) {
            if (otherArmy.faction === army.faction) continue;

            const dist = tileDistance(army.tileX, army.tileY, otherArmy.tileX, otherArmy.tileY);
            if (dist <= attackRange) {
                return { type: 'army', target: otherArmy, distance: dist };
            }
        }

        // Chercher les villes ennemies proches
        for (const city of Object.values(this.game.cities)) {
            if (city.faction === army.faction) continue;

            const dist = tileDistance(army.tileX, army.tileY, city.tileX, city.tileY);
            if (dist <= attackRange) {
                return { type: 'city', target: city, distance: dist };
            }
        }

        return null;
    }

    /**
     * Capture une ville
     */
    captureCity(city, newFaction) {
        const oldFaction = city.faction;
        city.faction = newFaction;
        city.garrison = [];

        // Réduire l'ordre public après la conquête
        city.order = Math.max(20, city.order - 30);

        this.game.notify(`${city.name} a été conquise!`, 'success');

        // Modifier les relations diplomatiques
        if (oldFaction !== 'rebels') {
            this.game.diplomacy.modifyRelation(newFaction, oldFaction, -30);
        }
    }
}

export default ArmyManager;
