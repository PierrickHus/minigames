// ==========================================
// SYSTÈME DE PATHFINDING A*
// ==========================================

import { MAP_CONFIG, isValidTile, tileDistance } from '../core/MapConfig.js';
import PriorityQueue from '../utils/priority-queue.js';

/**
 * Classe de pathfinding utilisant l'algorithme A*
 * Optimisé pour les tuiles octogonales avec coûts de terrain variables
 */
class Pathfinder {
    constructor(terrainMap, game = null) {
        this.terrainMap = terrainMap;
        this.game = game;
    }

    /**
     * Trouve le chemin optimal entre deux points
     * @param {Object} start - {x, y} position de départ en tuiles
     * @param {Object} end - {x, y} position d'arrivée en tuiles
     * @param {Object} options - Options de pathfinding
     * @returns {Array|null} Tableau de {x, y, cost} ou null si pas de chemin
     */
    findPath(start, end, options = {}) {
        const {
            unitType = 'infantry',
            isNaval = false,
            season = 0,
            maxCost = Infinity,
            avoidEnemies = true,
            enemyFaction = null
        } = options;

        // Vérifications de base
        if (!isValidTile(start.x, start.y) || !isValidTile(end.x, end.y)) {
            return null;
        }

        // Vérifier que la destination est accessible
        if (!this.terrainMap.isPassable(end.x, end.y, isNaval)) {
            return null;
        }

        const openSet = new PriorityQueue();
        const closedSet = new Set();
        const gScore = new Map();
        const fScore = new Map();
        const cameFrom = new Map();

        const startKey = this.getKey(start.x, start.y);
        const endKey = this.getKey(end.x, end.y);

        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start, end));
        openSet.enqueue(start, fScore.get(startKey));

        while (!openSet.isEmpty()) {
            const current = openSet.dequeue();
            const currentKey = this.getKey(current.x, current.y);

            // Destination atteinte
            if (currentKey === endKey) {
                return this.reconstructPath(cameFrom, current, gScore);
            }

            closedSet.add(currentKey);

            // Explorer les voisins
            const neighbors = this.getNeighbors(current, {
                unitType,
                isNaval,
                season,
                avoidEnemies,
                enemyFaction
            });

            for (const neighbor of neighbors) {
                const neighborKey = this.getKey(neighbor.x, neighbor.y);

                if (closedSet.has(neighborKey)) continue;

                const tentativeG = gScore.get(currentKey) + neighbor.cost;

                // Vérifier si on dépasse le coût maximum
                if (tentativeG > maxCost) continue;

                if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, end));

                    if (!openSet.contains(neighborKey)) {
                        openSet.enqueue(neighbor, fScore.get(neighborKey));
                    }
                }
            }
        }

        return null; // Pas de chemin trouvé
    }

    /**
     * Calcule l'heuristique (distance estimée vers la destination)
     * Utilise la distance de Chebyshev pour les tuiles octogonales
     */
    heuristic(a, b) {
        return tileDistance(a.x, a.y, b.x, b.y);
    }

    /**
     * Génère une clé unique pour une position
     */
    getKey(x, y) {
        return `${x},${y}`;
    }

    /**
     * Obtient les voisins valides d'une tuile avec leurs coûts
     */
    getNeighbors(pos, options) {
        const neighbors = [];
        const { unitType, isNaval, season, avoidEnemies, enemyFaction } = options;

        for (const dir of MAP_CONFIG.DIRECTIONS) {
            const nx = pos.x + dir.dx;
            const ny = pos.y + dir.dy;

            if (!isValidTile(nx, ny)) continue;

            // Vérifier la traversabilité
            if (!this.terrainMap.isPassable(nx, ny, isNaval)) continue;

            // Calculer le coût de mouvement
            let cost = this.terrainMap.getMovementCost(nx, ny, season, unitType);

            if (cost === Infinity) continue;

            // Éviter les armées ennemies si demandé
            if (avoidEnemies && enemyFaction && this.game) {
                const armyAt = this.game.armies.find(a =>
                    a.tileX === nx && a.tileY === ny && a.faction !== enemyFaction
                );
                if (armyAt) {
                    cost += 10; // Pénalité pour passer près d'ennemis
                }
            }

            neighbors.push({ x: nx, y: ny, cost });
        }

        return neighbors;
    }

    /**
     * Reconstruit le chemin à partir des données de parcours
     */
    reconstructPath(cameFrom, current, gScore) {
        const path = [];
        let node = current;

        while (node) {
            const key = this.getKey(node.x, node.y);
            path.unshift({
                x: node.x,
                y: node.y,
                totalCost: gScore.get(key) || 0
            });
            node = cameFrom.get(key);
        }

        return path;
    }

    /**
     * Obtient toutes les tuiles accessibles depuis une position avec un budget de mouvement
     * @param {Object} start - {x, y} position de départ
     * @param {number} movementPoints - Points de mouvement disponibles
     * @param {Object} options - Options de calcul
     * @returns {Map} Map de "x,y" -> {x, y, cost, path}
     */
    getReachableTiles(start, movementPoints, options = {}) {
        const {
            unitType = 'infantry',
            isNaval = false,
            season = 0
        } = options;

        const reachable = new Map();
        const queue = [{ x: start.x, y: start.y, cost: 0, path: [] }];
        const visited = new Set();

        visited.add(this.getKey(start.x, start.y));
        reachable.set(this.getKey(start.x, start.y), {
            x: start.x,
            y: start.y,
            cost: 0,
            path: []
        });

        while (queue.length > 0) {
            const current = queue.shift();

            for (const dir of MAP_CONFIG.DIRECTIONS) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                const key = this.getKey(nx, ny);

                if (visited.has(key)) continue;
                if (!isValidTile(nx, ny)) continue;
                if (!this.terrainMap.isPassable(nx, ny, isNaval)) continue;

                const moveCost = this.terrainMap.getMovementCost(nx, ny, season, unitType);
                if (moveCost === Infinity) continue;

                const totalCost = current.cost + moveCost;

                if (totalCost <= movementPoints) {
                    visited.add(key);
                    const newPath = [...current.path, { x: nx, y: ny }];

                    reachable.set(key, {
                        x: nx,
                        y: ny,
                        cost: totalCost,
                        path: newPath
                    });

                    queue.push({
                        x: nx,
                        y: ny,
                        cost: totalCost,
                        path: newPath
                    });
                }
            }
        }

        return reachable;
    }

    /**
     * Obtient une prévisualisation du mouvement
     * @returns {Object} {path, totalCost, turnsRequired, canReachThisTurn, remainingMP}
     */
    getMovementPreview(start, end, movementPoints, options = {}) {
        const path = this.findPath(start, end, options);

        if (!path || path.length === 0) {
            return null;
        }

        const totalCost = path[path.length - 1].totalCost;
        const turnsRequired = Math.ceil(totalCost / (options.maxMovement || 5));
        const canReachThisTurn = totalCost <= movementPoints;
        const remainingMP = Math.max(0, movementPoints - totalCost);

        // Calculer combien de tuiles on peut parcourir ce tour
        let reachableIndex = 0;
        for (let i = 1; i < path.length; i++) {
            if (path[i].totalCost <= movementPoints) {
                reachableIndex = i;
            } else {
                break;
            }
        }

        return {
            path,
            totalCost,
            turnsRequired,
            canReachThisTurn,
            remainingMP,
            reachableIndex,
            thisSturnDestination: path[reachableIndex]
        };
    }

    /**
     * Trouve le chemin le plus court vers n'importe quelle tuile d'un ensemble
     * Utile pour trouver la ville/armée la plus proche
     */
    findPathToAny(start, targets, options = {}) {
        if (targets.length === 0) return null;

        let bestPath = null;
        let bestCost = Infinity;

        for (const target of targets) {
            const path = this.findPath(start, target, options);
            if (path && path[path.length - 1].totalCost < bestCost) {
                bestPath = path;
                bestCost = path[path.length - 1].totalCost;
            }
        }

        return bestPath;
    }

    /**
     * Vérifie s'il existe un chemin entre deux points
     */
    hasPath(start, end, options = {}) {
        return this.findPath(start, end, options) !== null;
    }

    /**
     * Calcule la distance en coût de mouvement entre deux points
     * @returns {number} Coût total ou Infinity si pas de chemin
     */
    getPathCost(start, end, options = {}) {
        const path = this.findPath(start, end, options);
        if (!path || path.length === 0) return Infinity;
        return path[path.length - 1].totalCost;
    }
}

export default Pathfinder;
