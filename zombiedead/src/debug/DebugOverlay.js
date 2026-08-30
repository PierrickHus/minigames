import * as THREE from 'three';
import { WORLD_SIZE } from '../constants.js';

/** Couleur de la grille navmesh (cellules walkable) */
const NAVMESH_WALKABLE_COLOR = 0x00ff00;
/** Couleur des cellules bloquées */
const NAVMESH_BLOCKED_COLOR = 0xff0000;
/** Couleur des lignes de pathfinding */
const PATH_LINE_COLOR = 0xffff00;
/** Hauteur de l'overlay au-dessus du sol */
const OVERLAY_Y = 0.05;
/** Hauteur des lignes de pathfinding */
const PATH_Y = 0.15;

/**
 * Overlay de debug 3D in-game
 * Affiche le navmesh et les chemins de pathfinding directement dans la scène 3D
 * Toggle avec F3, options individuelles modifiables
 */
export class DebugOverlay {
    /**
     * @param {THREE.Scene} scene
     * @param {import('../pathfinding/NavGrid.js').NavGrid} navGrid
     * @param {import('../core/EventBus.js').EventBus} eventBus
     */
    constructor(scene, navGrid, eventBus) {
        this._scene = scene;
        this._navGrid = navGrid;
        this._eventBus = eventBus;

        this.enabled = false;
        this.showNavmesh = true;
        this.showPaths = true;

        /** @type {THREE.Group} Conteneur du navmesh visuel */
        this._navmeshGroup = null;
        /** @type {THREE.Group} Conteneur des lignes de pathfinding */
        this._pathsGroup = new THREE.Group();
        this._pathsGroup.visible = false;
        this._scene.add(this._pathsGroup);

        this._navmeshBuilt = false;

        // Reconstruire le navmesh visuel quand la grille change
        this._eventBus.on('navgrid-changed', () => {
            this._navmeshBuilt = false;
        });

        this._setupKeyBinding();
    }

    /** Écoute F3 pour toggle l'overlay */
    _setupKeyBinding() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'F3') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    /** Active ou désactive l'overlay */
    toggle() {
        this.enabled = !this.enabled;

        if (this.enabled) {
            if (!this._navmeshBuilt) {
                this._buildNavmeshVisual();
            }
            if (this._navmeshGroup) {
                this._navmeshGroup.visible = this.showNavmesh;
            }
            this._pathsGroup.visible = this.showPaths;
        } else {
            if (this._navmeshGroup) this._navmeshGroup.visible = false;
            this._pathsGroup.visible = false;
        }

        this._eventBus.emit('debug-toggled', { enabled: this.enabled });
    }

    /**
     * Met à jour les visualisations de pathfinding
     * @param {Array<import('../enemies/Zombie.js').Zombie>} zombies
     */
    update(zombies) {
        if (!this.enabled) return;

        if (this.showPaths) {
            this._updatePathVisuals(zombies);
        }
    }

    /** Construit la visualisation du navmesh (grille colorée au sol) */
    _buildNavmeshVisual() {
        if (this._navmeshGroup) {
            this._scene.remove(this._navmeshGroup);
            this._disposeGroup(this._navmeshGroup);
        }

        this._navmeshGroup = new THREE.Group();
        const grid = this._navGrid;
        const cellSize = grid.cellSize;

        // Utilise des InstancedMesh pour les performances (une instance par cellule bloquée)
        const blockedCount = this._countBlockedCells();
        if (blockedCount === 0) {
            this._navmeshBuilt = true;
            return;
        }

        const cellGeo = new THREE.PlaneGeometry(cellSize * 0.9, cellSize * 0.9);
        cellGeo.rotateX(-Math.PI / 2);

        const blockedMat = new THREE.MeshBasicMaterial({
            color: NAVMESH_BLOCKED_COLOR,
            transparent: true,
            opacity: 0.25,
            depthWrite: false
        });

        const walkableMat = new THREE.MeshBasicMaterial({
            color: NAVMESH_WALKABLE_COLOR,
            transparent: true,
            opacity: 0.05,
            depthWrite: false
        });

        const blockedMesh = new THREE.InstancedMesh(cellGeo, blockedMat, blockedCount);
        const walkableCount = grid.gridWidth * grid.gridHeight - blockedCount;
        const walkableMesh = new THREE.InstancedMesh(cellGeo, walkableMat, walkableCount);

        let blockedIdx = 0;
        let walkableIdx = 0;
        const dummy = new THREE.Object3D();

        for (let row = 0; row < grid.gridHeight; row++) {
            for (let col = 0; col < grid.gridWidth; col++) {
                dummy.position.set(
                    grid.colToWorldX(col),
                    OVERLAY_Y,
                    grid.rowToWorldZ(row)
                );
                dummy.updateMatrix();

                if (grid.isWalkable(col, row)) {
                    walkableMesh.setMatrixAt(walkableIdx++, dummy.matrix);
                } else {
                    blockedMesh.setMatrixAt(blockedIdx++, dummy.matrix);
                }
            }
        }

        blockedMesh.instanceMatrix.needsUpdate = true;
        walkableMesh.instanceMatrix.needsUpdate = true;

        this._navmeshGroup.add(blockedMesh);
        this._navmeshGroup.add(walkableMesh);
        this._navmeshGroup.visible = this.enabled && this.showNavmesh;
        this._scene.add(this._navmeshGroup);

        this._navmeshBuilt = true;
    }

    /**
     * Met à jour les lignes de chemin de chaque zombie
     * @param {Array<import('../enemies/Zombie.js').Zombie>} zombies
     */
    _updatePathVisuals(zombies) {
        // Nettoyer les anciennes lignes
        this._clearGroup(this._pathsGroup);

        const lineMat = new THREE.LineBasicMaterial({ color: PATH_LINE_COLOR, linewidth: 2 });

        for (const zombie of zombies) {
            if (!zombie.isAlive || !zombie._pathData || !zombie._pathData.waypoints) continue;

            const pd = zombie._pathData;
            const points = [];

            // Position actuelle du zombie
            points.push(new THREE.Vector3(zombie.position.x, PATH_Y, zombie.position.z));

            // Waypoints restants
            for (let i = pd.waypointIndex; i < pd.waypoints.length; i++) {
                const wp = pd.waypoints[i];
                points.push(new THREE.Vector3(wp.x, PATH_Y, wp.z));
            }

            if (points.length < 2) continue;

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMat);
            this._pathsGroup.add(line);

            // Point au waypoint courant (sphère)
            if (pd.waypointIndex < pd.waypoints.length) {
                const wp = pd.waypoints[pd.waypointIndex];
                const dotGeo = new THREE.SphereGeometry(0.15, 4, 4);
                const dotMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
                const dot = new THREE.Mesh(dotGeo, dotMat);
                dot.position.set(wp.x, PATH_Y, wp.z);
                this._pathsGroup.add(dot);
            }
        }
    }

    /** @returns {number} Nombre de cellules bloquées dans la grille */
    _countBlockedCells() {
        let count = 0;
        for (let i = 0; i < this._navGrid.cells.length; i++) {
            if (this._navGrid.cells[i] === 1) count++;
        }
        return count;
    }

    /**
     * Supprime tous les enfants d'un groupe sans le détruire
     * @param {THREE.Group} group
     */
    _clearGroup(group) {
        while (group.children.length > 0) {
            const child = group.children[0];
            group.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
    }

    /**
     * Dispose un groupe et toutes ses ressources
     * @param {THREE.Group} group
     */
    _disposeGroup(group) {
        this._clearGroup(group);
    }
}
