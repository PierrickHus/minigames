/** Coût de déplacement orthogonal */
const COST_STRAIGHT = 10;
/** Coût de déplacement diagonal (approximation de sqrt(2) * 10) */
const COST_DIAGONAL = 14;

/**
 * Les 8 directions de voisinage : 4 orthogonales + 4 diagonales
 * [dcol, drow, coût]
 */
const NEIGHBORS = [
    [-1, 0, COST_STRAIGHT], [1, 0, COST_STRAIGHT],
    [0, -1, COST_STRAIGHT], [0, 1, COST_STRAIGHT],
    [-1, -1, COST_DIAGONAL], [1, -1, COST_DIAGONAL],
    [-1, 1, COST_DIAGONAL], [1, 1, COST_DIAGONAL]
];

/**
 * Pathfinder A* optimisé pour la NavGrid
 * Utilise une heuristique octile (diagonales autorisées)
 * et un binary heap pour la file de priorité
 */
export class Pathfinder {
    constructor() {
        /**
         * Réutilisation de maps entre les appels pour réduire les allocations
         * @type {Map<number, number>}
         */
        this._gScore = new Map();
        /** @type {Map<number, number>} */
        this._cameFrom = new Map();
    }

    /**
     * Trouve un chemin entre deux positions sur la grille
     * @param {import('./NavGrid.js').NavGrid} grid
     * @param {number} startCol
     * @param {number} startRow
     * @param {number} endCol
     * @param {number} endRow
     * @returns {Array<{ col: number, row: number }>|null} Chemin ou null si aucun trouvé
     */
    findPath(grid, startCol, startRow, endCol, endRow) {
        // Si la destination est bloquée, trouver la cellule walkable la plus proche
        if (!grid.isWalkable(endCol, endRow)) {
            const alt = this._findNearestWalkable(grid, endCol, endRow);
            if (!alt) return null;
            endCol = alt.col;
            endRow = alt.row;
        }

        if (!grid.isWalkable(startCol, startRow)) return null;
        if (startCol === endCol && startRow === endRow) return [];

        this._gScore.clear();
        this._cameFrom.clear();

        const gridWidth = grid.gridWidth;
        const startKey = startRow * gridWidth + startCol;
        const endKey = endRow * gridWidth + endCol;

        this._gScore.set(startKey, 0);

        // File de priorité simple (tableau trié par fScore croissant)
        const openSet = [{ key: startKey, col: startCol, row: startRow, f: 0 }];
        const closedSet = new Set();

        while (openSet.length > 0) {
            // Extraire le noeud avec le plus petit fScore
            const current = openSet.shift();

            if (current.key === endKey) {
                return this._reconstructPath(gridWidth, startKey, endKey, endCol, endRow);
            }

            closedSet.add(current.key);

            for (const [dcol, drow, moveCost] of NEIGHBORS) {
                const ncol = current.col + dcol;
                const nrow = current.row + drow;
                const nkey = nrow * gridWidth + ncol;

                if (closedSet.has(nkey)) continue;

                // Vérification diagonale (éviter de couper les coins)
                const isDiagonal = dcol !== 0 && drow !== 0;
                if (isDiagonal) {
                    if (!grid.isDiagonalAllowed(current.col, current.row, ncol, nrow)) continue;
                } else if (!grid.isWalkable(ncol, nrow)) {
                    continue;
                }

                const tentativeG = this._gScore.get(current.key) + moveCost;
                const existingG = this._gScore.get(nkey);

                if (existingG !== undefined && tentativeG >= existingG) continue;

                this._gScore.set(nkey, tentativeG);
                this._cameFrom.set(nkey, current.key);

                const h = this._heuristic(ncol, nrow, endCol, endRow);
                const f = tentativeG + h;

                // Insertion triée dans l'openSet
                const node = { key: nkey, col: ncol, row: nrow, f };
                const insertIdx = this._binarySearchInsert(openSet, f);
                openSet.splice(insertIdx, 0, node);
            }
        }

        return null;
    }

    /**
     * Heuristique octile : précise pour les grilles avec diagonales
     * @param {number} col
     * @param {number} row
     * @param {number} endCol
     * @param {number} endRow
     * @returns {number}
     */
    _heuristic(col, row, endCol, endRow) {
        const dx = Math.abs(col - endCol);
        const dy = Math.abs(row - endRow);
        return COST_STRAIGHT * (dx + dy) + (COST_DIAGONAL - 2 * COST_STRAIGHT) * Math.min(dx, dy);
    }

    /**
     * Reconstruit le chemin depuis la map cameFrom
     * @param {number} gridWidth
     * @param {number} startKey
     * @param {number} endKey
     * @param {number} endCol
     * @param {number} endRow
     * @returns {Array<{ col: number, row: number }>}
     */
    _reconstructPath(gridWidth, startKey, endKey, endCol, endRow) {
        const path = [];
        let currentKey = endKey;

        while (currentKey !== startKey) {
            const col = currentKey % gridWidth;
            const row = Math.floor(currentKey / gridWidth);
            path.push({ col, row });
            currentKey = this._cameFrom.get(currentKey);
        }

        path.reverse();
        return path;
    }

    /**
     * Trouve la cellule walkable la plus proche d'une position bloquée
     * Recherche en spirale autour de la cible
     * @param {import('./NavGrid.js').NavGrid} grid
     * @param {number} col
     * @param {number} row
     * @returns {{ col: number, row: number }|null}
     */
    _findNearestWalkable(grid, col, row) {
        const maxRadius = 5;
        for (let r = 1; r <= maxRadius; r++) {
            for (let dc = -r; dc <= r; dc++) {
                for (let dr = -r; dr <= r; dr++) {
                    if (Math.abs(dc) !== r && Math.abs(dr) !== r) continue;
                    if (grid.isWalkable(col + dc, row + dr)) {
                        return { col: col + dc, row: row + dr };
                    }
                }
            }
        }
        return null;
    }

    /**
     * Recherche binaire pour insérer un noeud trié par fScore
     * @param {Array<{ f: number }>} arr
     * @param {number} f
     * @returns {number} Index d'insertion
     */
    _binarySearchInsert(arr, f) {
        let low = 0;
        let high = arr.length;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (arr[mid].f < f) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return low;
    }
}
