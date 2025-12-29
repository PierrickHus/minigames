// ==========================================
// SYSTÈME DE CAMÉRA
// ==========================================

import { MAP_CONFIG } from '../core/MapConfig.js';

/**
 * Gère la position et le zoom de la caméra sur la carte
 */
class Camera {
    constructor(canvasWidth = 800, canvasHeight = 600) {
        this.x = 0;           // Position X en tuiles
        this.y = 0;           // Position Y en tuiles
        this.zoom = MAP_CONFIG.DEFAULT_ZOOM;

        // Dimensions du viewport
        this.viewportWidth = canvasWidth;
        this.viewportHeight = canvasHeight;
    }

    /**
     * Met à jour les dimensions du viewport
     */
    setViewport(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    /**
     * Retourne la taille d'une tuile à l'écran
     */
    get tileSize() {
        return MAP_CONFIG.TILE_SIZE * this.zoom;
    }

    /**
     * Retourne le nombre de tuiles visibles horizontalement
     */
    get tilesPerScreenX() {
        return this.viewportWidth / this.tileSize;
    }

    /**
     * Retourne le nombre de tuiles visibles verticalement
     */
    get tilesPerScreenY() {
        return this.viewportHeight / this.tileSize;
    }

    /**
     * Centre la caméra sur une position en tuiles
     */
    centerOn(tileX, tileY) {
        this.x = tileX - this.tilesPerScreenX / 2;
        this.y = tileY - this.tilesPerScreenY / 2;
        this.clamp();
    }

    /**
     * Limite la caméra aux bords de la carte
     */
    clamp() {
        this.x = Math.max(0, Math.min(
            MAP_CONFIG.GRID_WIDTH - this.tilesPerScreenX,
            this.x
        ));
        this.y = Math.max(0, Math.min(
            MAP_CONFIG.GRID_HEIGHT - this.tilesPerScreenY,
            this.y
        ));
    }

    /**
     * Calcule les tuiles visibles à l'écran
     */
    getVisibleTiles() {
        return {
            startX: Math.floor(this.x),
            startY: Math.floor(this.y),
            endX: Math.min(
                MAP_CONFIG.GRID_WIDTH,
                Math.ceil(this.x + this.tilesPerScreenX) + 1
            ),
            endY: Math.min(
                MAP_CONFIG.GRID_HEIGHT,
                Math.ceil(this.y + this.tilesPerScreenY) + 1
            )
        };
    }

    /**
     * Convertit des coordonnées écran en coordonnées tuile
     */
    screenToTile(screenX, screenY) {
        return {
            x: Math.floor(this.x + screenX / this.tileSize),
            y: Math.floor(this.y + screenY / this.tileSize)
        };
    }

    /**
     * Convertit des coordonnées tuile en coordonnées écran
     */
    tileToScreen(tileX, tileY) {
        return {
            x: (tileX - this.x) * this.tileSize,
            y: (tileY - this.y) * this.tileSize
        };
    }

    /**
     * Vérifie si une tuile est visible
     */
    isTileVisible(x, y) {
        const visible = this.getVisibleTiles();
        return x >= visible.startX && x < visible.endX &&
               y >= visible.startY && y < visible.endY;
    }

    /**
     * Applique un zoom centré sur un point
     */
    applyZoom(delta, centerX, centerY) {
        const oldZoom = this.zoom;
        const zoomFactor = delta > 0 ? 0.9 : 1.1;

        this.zoom = Math.max(
            MAP_CONFIG.MIN_ZOOM,
            Math.min(MAP_CONFIG.MAX_ZOOM, this.zoom * zoomFactor)
        );

        // Zoom centré sur la souris
        if (centerX !== undefined && centerY !== undefined) {
            const tilePos = this.screenToTile(centerX, centerY);
            const oldTileSize = MAP_CONFIG.TILE_SIZE * oldZoom;

            this.x += (tilePos.x - this.x) * (1 - oldTileSize / this.tileSize);
            this.y += (tilePos.y - this.y) * (1 - oldTileSize / this.tileSize);
        }

        this.clamp();
    }

    /**
     * Déplacement de la caméra (pan)
     */
    pan(deltaX, deltaY) {
        this.x -= deltaX / this.tileSize;
        this.y -= deltaY / this.tileSize;
        this.clamp();
    }

    // ========== SAUVEGARDE / CHARGEMENT ==========

    /**
     * Exporte l'état de la caméra pour la sauvegarde
     */
    export() {
        return {
            x: this.x,
            y: this.y,
            zoom: this.zoom
        };
    }

    /**
     * Importe l'état de la caméra depuis une sauvegarde
     */
    import(data) {
        if (data) {
            this.x = data.x ?? 0;
            this.y = data.y ?? 0;
            this.zoom = data.zoom ?? MAP_CONFIG.DEFAULT_ZOOM;
            this.clamp();
        }
    }
}

export default Camera;
