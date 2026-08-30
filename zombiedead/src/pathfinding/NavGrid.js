import { WORLD_SIZE } from '../constants.js';

/** Taille d'une cellule de la grille en unités monde */
const CELL_SIZE = 1;

/** Marge autour des obstacles pour éviter que les zombies rasent les murs */
const OBSTACLE_PADDING = 0.3;

/**
 * Grille de navigation 2D pour le pathfinding
 * Découpe le monde en cellules marquées walkable (0) ou blocked (1)
 * Supporte les mises à jour dynamiques (ajout/retrait d'obstacles)
 */
export class NavGrid {
    /**
     * @param {import('../core/EventBus.js').EventBus} eventBus
     */
    constructor(eventBus) {
        this._eventBus = eventBus;
        this.cellSize = CELL_SIZE;
        this.gridWidth = Math.ceil(WORLD_SIZE / CELL_SIZE);
        this.gridHeight = Math.ceil(WORLD_SIZE / CELL_SIZE);
        this._halfWorld = WORLD_SIZE / 2;

        /** Grille plate : 0 = walkable, 1 = blocked */
        this.cells = new Uint8Array(this.gridWidth * this.gridHeight);
    }

    /**
     * Génère la grille à partir des colliders statiques
     * Chaque cellule qui intersecte un collider (avec padding) est marquée blocked
     * @param {THREE.Box3[]} colliders
     */
    generate(colliders) {
        this.cells.fill(0);

        for (const box of colliders) {
            this._markBoxBlocked(box);
        }
    }

    /**
     * Marque les cellules couvertes par une bounding box comme bloquées
     * @param {THREE.Box3} box
     */
    _markBoxBlocked(box) {
        const minCol = this._worldToCol(box.min.x - OBSTACLE_PADDING);
        const maxCol = this._worldToCol(box.max.x + OBSTACLE_PADDING);
        const minRow = this._worldToRow(box.min.z - OBSTACLE_PADDING);
        const maxRow = this._worldToRow(box.max.z + OBSTACLE_PADDING);

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                if (this._isInBounds(col, row)) {
                    this.cells[row * this.gridWidth + col] = 1;
                }
            }
        }
    }

    /**
     * Marque une zone rectangulaire comme bloquée (ajout d'obstacle dynamique)
     * @param {THREE.Box3} box
     */
    addObstacle(box) {
        this._markBoxBlocked(box);
        this._eventBus.emit('navgrid-changed');
    }

    /**
     * Libère les cellules d'une zone et recalcule si d'autres obstacles les couvrent encore
     * Utilisé quand un obstacle est retiré ou détruit
     * @param {THREE.Box3} box
     * @param {THREE.Box3[]} allColliders - Liste complète des colliders restants
     */
    removeObstacle(box, allColliders) {
        const minCol = this._worldToCol(box.min.x - OBSTACLE_PADDING);
        const maxCol = this._worldToCol(box.max.x + OBSTACLE_PADDING);
        const minRow = this._worldToRow(box.min.z - OBSTACLE_PADDING);
        const maxRow = this._worldToRow(box.max.z + OBSTACLE_PADDING);

        // Libère les cellules de la zone
        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                if (this._isInBounds(col, row)) {
                    this.cells[row * this.gridWidth + col] = 0;
                }
            }
        }

        // Re-marque les cellules couvertes par d'autres colliders dans cette zone
        for (const other of allColliders) {
            this._markBoxBlocked(other);
        }

        this._eventBus.emit('navgrid-changed');
    }

    /**
     * Vérifie si une cellule est walkable
     * @param {number} col
     * @param {number} row
     * @returns {boolean}
     */
    isWalkable(col, row) {
        if (!this._isInBounds(col, row)) return false;
        return this.cells[row * this.gridWidth + col] === 0;
    }

    /**
     * Vérifie si un déplacement diagonal est autorisé
     * Bloque les diagonales qui couperaient un coin de mur en L
     * @param {number} fromCol
     * @param {number} fromRow
     * @param {number} toCol
     * @param {number} toRow
     * @returns {boolean}
     */
    isDiagonalAllowed(fromCol, fromRow, toCol, toRow) {
        if (!this.isWalkable(toCol, toRow)) return false;

        // Pour une diagonale, les deux cellules adjacentes doivent être walkable
        const dcol = toCol - fromCol;
        const drow = toRow - fromRow;

        return this.isWalkable(fromCol + dcol, fromRow) &&
               this.isWalkable(fromCol, fromRow + drow);
    }

    /**
     * Convertit une position monde X en index de colonne
     * @param {number} worldX
     * @returns {number}
     */
    worldToCol(worldX) {
        return this._worldToCol(worldX);
    }

    /**
     * Convertit une position monde Z en index de ligne
     * @param {number} worldZ
     * @returns {number}
     */
    worldToRow(worldZ) {
        return this._worldToRow(worldZ);
    }

    /**
     * Convertit un index de colonne en position monde X (centre de la cellule)
     * @param {number} col
     * @returns {number}
     */
    colToWorldX(col) {
        return (col + 0.5) * this.cellSize - this._halfWorld;
    }

    /**
     * Convertit un index de ligne en position monde Z (centre de la cellule)
     * @param {number} row
     * @returns {number}
     */
    rowToWorldZ(row) {
        return (row + 0.5) * this.cellSize - this._halfWorld;
    }

    /**
     * @param {number} worldX
     * @returns {number}
     */
    _worldToCol(worldX) {
        return Math.max(0, Math.min(this.gridWidth - 1,
            Math.floor((worldX + this._halfWorld) / this.cellSize)
        ));
    }

    /**
     * @param {number} worldZ
     * @returns {number}
     */
    _worldToRow(worldZ) {
        return Math.max(0, Math.min(this.gridHeight - 1,
            Math.floor((worldZ + this._halfWorld) / this.cellSize)
        ));
    }

    /**
     * @param {number} col
     * @param {number} row
     * @returns {boolean}
     */
    _isInBounds(col, row) {
        return col >= 0 && col < this.gridWidth && row >= 0 && row < this.gridHeight;
    }
}
