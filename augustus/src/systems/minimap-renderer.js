// ==========================================
// RENDU DE LA MINIMAP
// ==========================================

import { MAP_CONFIG } from '../core/MapConfig.js';
import { FACTIONS } from '../data/index.js';

/**
 * Classe de rendu optimisée pour la minimap
 * Pré-génère une image du terrain pour de meilleures performances
 */
class MinimapRenderer {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.game = game;

        // Image pré-rendue du terrain
        this.terrainImage = null;
        this.terrainImageDirty = true;

        // Dimensions
        this.width = canvas.width;
        this.height = canvas.height;

        // Échelle
        this.scaleX = this.width / MAP_CONFIG.GRID_WIDTH;
        this.scaleY = this.height / MAP_CONFIG.GRID_HEIGHT;
    }

    /**
     * Met à jour les dimensions
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
        this.scaleX = this.width / MAP_CONFIG.GRID_WIDTH;
        this.scaleY = this.height / MAP_CONFIG.GRID_HEIGHT;
        this.terrainImageDirty = true;
    }

    /**
     * Marque le terrain comme devant être régénéré
     */
    invalidateTerrain() {
        this.terrainImageDirty = true;
    }

    /**
     * Génère l'image du terrain (appelé une fois au chargement)
     */
    generateTerrainImage() {
        if (!this.game.terrainMap) return;

        // Créer un canvas temporaire pour dessiner le terrain
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = MAP_CONFIG.GRID_WIDTH;
        tempCanvas.height = MAP_CONFIG.GRID_HEIGHT;
        const tempCtx = tempCanvas.getContext('2d');

        // Créer ImageData pour un rendu pixel par pixel
        const imageData = tempCtx.createImageData(
            MAP_CONFIG.GRID_WIDTH,
            MAP_CONFIG.GRID_HEIGHT
        );

        // Dessiner chaque tuile comme un pixel
        for (let y = 0; y < MAP_CONFIG.GRID_HEIGHT; y++) {
            for (let x = 0; x < MAP_CONFIG.GRID_WIDTH; x++) {
                const terrainId = this.game.terrainMap.getTerrainId(x, y);
                const color = this.hexToRgb(MAP_CONFIG.TERRAIN_COLORS[terrainId] || '#000000');
                const idx = (y * MAP_CONFIG.GRID_WIDTH + x) * 4;

                imageData.data[idx] = color.r;
                imageData.data[idx + 1] = color.g;
                imageData.data[idx + 2] = color.b;
                imageData.data[idx + 3] = 255;
            }
        }

        tempCtx.putImageData(imageData, 0, 0);
        this.terrainImage = tempCanvas;
        this.terrainImageDirty = false;
    }

    /**
     * Convertit une couleur hexadécimale en RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    /**
     * Rendu principal de la minimap
     */
    render(cameraX, cameraY, viewportWidth, viewportHeight, zoom) {
        const ctx = this.ctx;

        // Régénérer l'image du terrain si nécessaire
        if (this.terrainImageDirty || !this.terrainImage) {
            this.generateTerrainImage();
        }

        // Dessiner le terrain pré-rendu
        if (this.terrainImage) {
            ctx.drawImage(
                this.terrainImage,
                0, 0,
                this.width, this.height
            );
        } else {
            // Fallback si l'image n'est pas prête
            ctx.fillStyle = '#1a3d5c';
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // Dessiner les territoires des factions
        this.renderTerritories(ctx);

        // Dessiner les villes
        this.renderCities(ctx);

        // Dessiner les armées
        this.renderArmies(ctx);

        // Dessiner le rectangle de viewport
        this.renderViewport(ctx, cameraX, cameraY, viewportWidth, viewportHeight, zoom);
    }

    /**
     * Dessine les territoires des factions (zones colorées)
     */
    renderTerritories(ctx) {
        if (!this.game.cities) return;

        // Pour chaque ville, dessiner une zone d'influence
        for (const city of Object.values(this.game.cities)) {
            if (!city.tiles) continue;

            const faction = FACTIONS[city.faction];
            if (!faction) continue;

            ctx.fillStyle = `${faction.color}44`;

            for (const tile of city.tiles) {
                const x = tile.x * this.scaleX;
                const y = tile.y * this.scaleY;
                ctx.fillRect(x - 1, y - 1, 3, 3);
            }
        }
    }

    /**
     * Dessine les villes sur la minimap
     */
    renderCities(ctx) {
        if (!this.game.cities) return;

        for (const city of Object.values(this.game.cities)) {
            const faction = FACTIONS[city.faction];
            if (!faction) continue;

            // Position du centre de la ville
            const x = city.tileX * this.scaleX;
            const y = city.tileY * this.scaleY;

            // Point coloré selon la faction
            ctx.fillStyle = faction.color;

            // Taille selon l'importance
            const size = city.isCapital ? 4 : 2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();

            // Bordure
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    }

    /**
     * Dessine les armées sur la minimap
     */
    renderArmies(ctx) {
        if (!this.game.armies) return;

        for (const army of this.game.armies) {
            const faction = FACTIONS[army.faction];
            if (!faction) continue;

            // Position de l'armée
            const tx = army.tileX !== undefined ? army.tileX : Math.floor(army.x / 2);
            const ty = army.tileY !== undefined ? army.tileY : Math.floor(army.y / 2);

            const x = tx * this.scaleX;
            const y = ty * this.scaleY;

            // Carré coloré
            ctx.fillStyle = faction.color;
            ctx.fillRect(x - 1, y - 1, 3, 3);

            // Bordure blanche pour visibilité
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x - 1, y - 1, 3, 3);
        }
    }

    /**
     * Dessine le rectangle de viewport (vue actuelle)
     */
    renderViewport(ctx, cameraX, cameraY, viewportWidth, viewportHeight, zoom) {
        // Calculer la taille du viewport en tuiles
        const tilesPerScreenX = viewportWidth / (MAP_CONFIG.TILE_SIZE * zoom);
        const tilesPerScreenY = viewportHeight / (MAP_CONFIG.TILE_SIZE * zoom);

        // Position et taille sur la minimap
        const x = cameraX * this.scaleX;
        const y = cameraY * this.scaleY;
        const w = tilesPerScreenX * this.scaleX;
        const h = tilesPerScreenY * this.scaleY;

        // Dessiner le rectangle
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Ombre pour meilleure visibilité
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, w, h);
    }

    /**
     * Convertit un clic sur la minimap en position tuile
     */
    minimapToTile(minimapX, minimapY) {
        return {
            x: Math.floor(minimapX / this.scaleX),
            y: Math.floor(minimapY / this.scaleY)
        };
    }

    /**
     * Gère le clic sur la minimap (pour recentrer la vue)
     */
    handleClick(minimapX, minimapY) {
        const tile = this.minimapToTile(minimapX, minimapY);
        return tile;
    }
}

export default MinimapRenderer;
