import { Pathfinder } from './Pathfinder.js';

/** Nombre maximum de chemins calculés par frame */
const MAX_PATHFINDS_PER_FRAME = 3;

/** Distance en dessous de laquelle le zombie passe en mode direct (pas de pathfinding) */
const DIRECT_MODE_DISTANCE = 8;

/** Distance seuils pour la fréquence de recalcul adaptatif */
const FAR_DISTANCE = 20;
const MID_DISTANCE = 8;

/** Intervalles de recalcul en secondes */
const RECALC_FAR_INTERVAL = 2;
const RECALC_MID_INTERVAL = 1;
const RECALC_NEAR_INTERVAL = 0.5;

/** Seuil de mouvement pour détecter un zombie bloqué */
const STUCK_THRESHOLD = 0.3;
const STUCK_CHECK_INTERVAL = 0.5;

/**
 * File d'attente de requêtes de pathfinding
 * Limite le nombre de calculs par frame et gère le recalcul adaptatif
 * selon la distance zombie-joueur
 */
export class PathRequestQueue {
    /**
     * @param {import('./NavGrid.js').NavGrid} navGrid
     * @param {import('../core/EventBus.js').EventBus} eventBus
     */
    constructor(navGrid, eventBus) {
        this._navGrid = navGrid;
        this._pathfinder = new Pathfinder();
        this._eventBus = eventBus;

        /**
         * Données de pathfinding par zombie (stockées sur l'objet zombie)
         * zombie._pathData = { waypoints, recalcTimer, stuckTimer, lastPos }
         */

        // Quand la grille change, invalider tous les chemins
        this._eventBus.on('navgrid-changed', () => this._invalidateAll = true);
        this._invalidateAll = false;

        /** @type {Array<import('../enemies/Zombie.js').Zombie>} Zombies en attente de recalcul */
        this._pendingRequests = [];
    }

    /**
     * Met à jour le pathfinding pour tous les zombies actifs
     * Gère le timing de recalcul et la limite par frame
     * @param {Array<import('../enemies/Zombie.js').Zombie>} zombies
     * @param {import('three').Vector3} playerPosition
     * @param {number} deltaTime
     */
    update(zombies, playerPosition, deltaTime) {
        this._pendingRequests.length = 0;

        for (const zombie of zombies) {
            if (!zombie.isAlive) continue;

            this._ensurePathData(zombie);
            const pd = zombie._pathData;
            const dist = Math.hypot(
                zombie.position.x - playerPosition.x,
                zombie.position.z - playerPosition.z
            );

            // Mode direct : pas de pathfinding si assez proche et ligne dégagée
            if (dist < DIRECT_MODE_DISTANCE && this._hasLineOfSight(zombie.position, playerPosition)) {
                pd.waypoints = null;
                pd.useDirectMode = true;
                continue;
            }

            pd.useDirectMode = false;

            // Détection de blocage
            pd.stuckTimer += deltaTime;
            if (pd.stuckTimer >= STUCK_CHECK_INTERVAL) {
                const moved = Math.hypot(
                    zombie.position.x - pd.lastPos.x,
                    zombie.position.z - pd.lastPos.z
                );
                if (moved < STUCK_THRESHOLD) {
                    pd.needsRecalc = true;
                }
                pd.lastPos.x = zombie.position.x;
                pd.lastPos.z = zombie.position.z;
                pd.stuckTimer = 0;
            }

            // Recalcul périodique adaptatif
            pd.recalcTimer += deltaTime;
            const interval = dist > FAR_DISTANCE ? RECALC_FAR_INTERVAL
                : dist > MID_DISTANCE ? RECALC_MID_INTERVAL
                : RECALC_NEAR_INTERVAL;

            if (pd.recalcTimer >= interval || pd.needsRecalc || this._invalidateAll) {
                this._pendingRequests.push({ zombie, playerPosition });
                pd.recalcTimer = 0;
                pd.needsRecalc = false;
            }
        }

        this._invalidateAll = false;

        // Traiter un nombre limité de requêtes par frame
        const toProcess = Math.min(this._pendingRequests.length, MAX_PATHFINDS_PER_FRAME);
        for (let i = 0; i < toProcess; i++) {
            const req = this._pendingRequests[i];
            this._computePath(req.zombie, req.playerPosition);
        }
    }

    /**
     * Initialise les données de pathfinding sur un zombie
     * @param {import('../enemies/Zombie.js').Zombie} zombie
     */
    _ensurePathData(zombie) {
        if (zombie._pathData) return;

        zombie._pathData = {
            waypoints: null,
            waypointIndex: 0,
            recalcTimer: Math.random() * 0.5,
            stuckTimer: 0,
            lastPos: { x: zombie.position.x, z: zombie.position.z },
            needsRecalc: true,
            useDirectMode: false
        };
    }

    /**
     * Calcule un chemin A* pour un zombie et stocke les waypoints
     * @param {import('../enemies/Zombie.js').Zombie} zombie
     * @param {import('three').Vector3} playerPosition
     */
    _computePath(zombie, playerPosition) {
        const grid = this._navGrid;
        const startCol = grid.worldToCol(zombie.position.x);
        const startRow = grid.worldToRow(zombie.position.z);
        const endCol = grid.worldToCol(playerPosition.x);
        const endRow = grid.worldToRow(playerPosition.z);

        const path = this._pathfinder.findPath(grid, startCol, startRow, endCol, endRow);
        const pd = zombie._pathData;

        if (path && path.length > 0) {
            // Convertir en coordonnées monde
            pd.waypoints = path.map(cell => ({
                x: grid.colToWorldX(cell.col),
                z: grid.rowToWorldZ(cell.row)
            }));
            pd.waypointIndex = 0;

            // Lissage : supprimer les waypoints intermédiaires en ligne de vue
            this._smoothPath(pd.waypoints);
        } else {
            pd.waypoints = null;
        }
    }

    /**
     * Simplifie le chemin en retirant les points intermédiaires visibles en ligne droite
     * Réduit les zig-zags de la grille pour un mouvement plus naturel
     * @param {Array<{ x: number, z: number }>} waypoints
     */
    _smoothPath(waypoints) {
        if (waypoints.length <= 2) return;

        let i = 0;
        while (i < waypoints.length - 2) {
            const a = waypoints[i];
            const c = waypoints[i + 2];

            if (this._hasLineOfSightXZ(a.x, a.z, c.x, c.z)) {
                waypoints.splice(i + 1, 1);
            } else {
                i++;
            }
        }
    }

    /**
     * Vérifie la ligne de vue entre deux positions monde via la grille
     * Utilise l'algorithme de Bresenham sur la grille
     * @param {number} x1
     * @param {number} z1
     * @param {number} x2
     * @param {number} z2
     * @returns {boolean}
     */
    _hasLineOfSightXZ(x1, z1, x2, z2) {
        const grid = this._navGrid;
        let col0 = grid.worldToCol(x1);
        let row0 = grid.worldToRow(z1);
        const col1 = grid.worldToCol(x2);
        const row1 = grid.worldToRow(z2);

        const dcol = Math.abs(col1 - col0);
        const drow = Math.abs(row1 - row0);
        const scol = col0 < col1 ? 1 : -1;
        const srow = row0 < row1 ? 1 : -1;
        let err = dcol - drow;

        while (col0 !== col1 || row0 !== row1) {
            if (!grid.isWalkable(col0, row0)) return false;

            const e2 = 2 * err;
            if (e2 > -drow) { err -= drow; col0 += scol; }
            if (e2 < dcol) { err += dcol; row0 += srow; }
        }

        return true;
    }

    /**
     * Vérifie la ligne de vue entre deux Vector3
     * @param {import('three').Vector3} from
     * @param {import('three').Vector3} to
     * @returns {boolean}
     */
    _hasLineOfSight(from, to) {
        return this._hasLineOfSightXZ(from.x, from.z, to.x, to.z);
    }
}
