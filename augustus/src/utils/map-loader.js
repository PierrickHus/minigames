// ==========================================
// CHARGEUR DE CARTE DEPUIS IMAGE
// ==========================================

import { MAP_CONFIG } from '../core/MapConfig.js';

/**
 * Palette de couleurs pour les terrains
 * Chaque couleur RGB correspond à un type de terrain
 * Format: 'R,G,B' -> TERRAIN_ID
 */
const TERRAIN_PALETTE = {
    // Eau
    '10,45,74': MAP_CONFIG.TERRAIN_IDS.DEEP_WATER,      // #0a2d4a - Eau profonde
    '26,77,110': MAP_CONFIG.TERRAIN_IDS.SHALLOW_WATER,  // #1a4d6e - Eau côtière

    // Terres
    '124,179,66': MAP_CONFIG.TERRAIN_IDS.PLAINS,        // #7cb342 - Plaines
    '139,195,74': MAP_CONFIG.TERRAIN_IDS.GRASSLAND,     // #8bc34a - Prairies
    '46,92,46': MAP_CONFIG.TERRAIN_IDS.FOREST,          // #2e5c2e - Forêt
    '27,67,50': MAP_CONFIG.TERRAIN_IDS.DENSE_FOREST,    // #1b4332 - Forêt dense
    '141,110,99': MAP_CONFIG.TERRAIN_IDS.HILLS,         // #8d6e63 - Collines
    '93,64,55': MAP_CONFIG.TERRAIN_IDS.MOUNTAINS,       // #5d4037 - Montagnes
    '62,39,35': MAP_CONFIG.TERRAIN_IDS.IMPASSABLE_MOUNTAINS, // #3e2723 - Montagnes infranchissables
    '230,196,127': MAP_CONFIG.TERRAIN_IDS.DESERT,       // #e6c47f - Désert
    '212,184,150': MAP_CONFIG.TERRAIN_IDS.SAND_COAST,   // #d4b896 - Côte sableuse
    '74,103,65': MAP_CONFIG.TERRAIN_IDS.MARSH,          // #4a6741 - Marais
    '197,160,63': MAP_CONFIG.TERRAIN_IDS.FARMLAND,      // #c5a03f - Terres agricoles
    '161,136,127': MAP_CONFIG.TERRAIN_IDS.ROAD,         // #a1887f - Route
    '66,165,245': MAP_CONFIG.TERRAIN_IDS.RIVER,         // #42a5f5 - Rivière
};

/**
 * Palette inversée pour l'export (TERRAIN_ID -> couleur hex)
 */
const TERRAIN_TO_COLOR = {
    [MAP_CONFIG.TERRAIN_IDS.DEEP_WATER]: '#0a2d4a',
    [MAP_CONFIG.TERRAIN_IDS.SHALLOW_WATER]: '#1a4d6e',
    [MAP_CONFIG.TERRAIN_IDS.PLAINS]: '#7cb342',
    [MAP_CONFIG.TERRAIN_IDS.GRASSLAND]: '#8bc34a',
    [MAP_CONFIG.TERRAIN_IDS.FOREST]: '#2e5c2e',
    [MAP_CONFIG.TERRAIN_IDS.DENSE_FOREST]: '#1b4332',
    [MAP_CONFIG.TERRAIN_IDS.HILLS]: '#8d6e63',
    [MAP_CONFIG.TERRAIN_IDS.MOUNTAINS]: '#5d4037',
    [MAP_CONFIG.TERRAIN_IDS.IMPASSABLE_MOUNTAINS]: '#3e2723',
    [MAP_CONFIG.TERRAIN_IDS.DESERT]: '#e6c47f',
    [MAP_CONFIG.TERRAIN_IDS.SAND_COAST]: '#d4b896',
    [MAP_CONFIG.TERRAIN_IDS.MARSH]: '#4a6741',
    [MAP_CONFIG.TERRAIN_IDS.FARMLAND]: '#c5a03f',
    [MAP_CONFIG.TERRAIN_IDS.ROAD]: '#a1887f',
    [MAP_CONFIG.TERRAIN_IDS.RIVER]: '#42a5f5',
};

/**
 * Classe pour charger/sauvegarder des cartes depuis/vers des images
 */
class MapLoader {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Charge une carte depuis une image
     * @param {string} imagePath - Chemin vers l'image de la carte
     * @param {TerrainMap} terrainMap - Instance de TerrainMap à remplir
     * @returns {Promise<TerrainMap>}
     */
    async loadFromImage(imagePath, terrainMap) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                console.log(`Chargement de la carte: ${img.width}x${img.height}`);

                // Vérifier les dimensions
                if (img.width !== MAP_CONFIG.GRID_WIDTH || img.height !== MAP_CONFIG.GRID_HEIGHT) {
                    console.warn(`Dimensions de l'image (${img.width}x${img.height}) différentes de la config (${MAP_CONFIG.GRID_WIDTH}x${MAP_CONFIG.GRID_HEIGHT})`);
                }

                // Dessiner l'image sur le canvas
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.ctx.drawImage(img, 0, 0);

                // Lire les pixels
                const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
                const pixels = imageData.data;

                // Convertir les pixels en terrain
                for (let y = 0; y < img.height; y++) {
                    for (let x = 0; x < img.width; x++) {
                        const i = (y * img.width + x) * 4;
                        const r = pixels[i];
                        const g = pixels[i + 1];
                        const b = pixels[i + 2];

                        const terrainId = this.colorToTerrain(r, g, b);
                        terrainMap.setTerrain(x, y, terrainId);
                    }
                }

                // Générer les zones climatiques basées sur le terrain
                this.generateClimateFromTerrain(terrainMap);

                // Générer l'élévation basée sur le terrain
                this.generateElevationFromTerrain(terrainMap);

                console.log('Carte chargée avec succès');
                resolve(terrainMap);
            };

            img.onerror = () => {
                reject(new Error(`Impossible de charger l'image: ${imagePath}`));
            };

            img.src = imagePath;
        });
    }

    /**
     * Convertit une couleur RGB en ID de terrain
     * Utilise la distance euclidienne pour trouver la couleur la plus proche
     */
    colorToTerrain(r, g, b) {
        const key = `${r},${g},${b}`;

        // Correspondance exacte
        if (TERRAIN_PALETTE[key] !== undefined) {
            return TERRAIN_PALETTE[key];
        }

        // Trouver la couleur la plus proche
        let minDistance = Infinity;
        let closestTerrain = MAP_CONFIG.TERRAIN_IDS.DEEP_WATER;

        for (const [colorKey, terrainId] of Object.entries(TERRAIN_PALETTE)) {
            const [pr, pg, pb] = colorKey.split(',').map(Number);
            const distance = Math.sqrt(
                Math.pow(r - pr, 2) +
                Math.pow(g - pg, 2) +
                Math.pow(b - pb, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestTerrain = terrainId;
            }
        }

        return closestTerrain;
    }

    /**
     * Génère les zones climatiques basées sur la position et le terrain
     */
    generateClimateFromTerrain(terrainMap) {
        const C = MAP_CONFIG.CLIMATE_IDS;

        for (let y = 0; y < terrainMap.height; y++) {
            for (let x = 0; x < terrainMap.width; x++) {
                const terrain = terrainMap.getTerrain(x, y);
                let climate = C.TEMPERATE;

                // Zone méditerranéenne (sud de l'Europe)
                if ((y > 130 && y < 230 && x > 235) ||
                    (y > 120 && y < 200 && x > 145 && x < 235) ||
                    (y > 150 && y < 200 && x < 150)) {
                    climate = 5; // Méditerranéen
                }

                // Zone maritime (Britannie, Irlande, côtes atlantiques)
                if ((x < 210 && y < 65) || (x < 165 && y < 90)) {
                    climate = C.MARITIME;
                }

                // Zone aride (Afrique du Nord)
                if (y > 210) {
                    climate = C.ARID;
                }

                // Zone alpine (montagnes)
                if (terrain.id === MAP_CONFIG.TERRAIN_IDS.MOUNTAINS ||
                    terrain.id === MAP_CONFIG.TERRAIN_IDS.IMPASSABLE_MOUNTAINS) {
                    climate = C.ALPINE;
                }

                terrainMap.setClimate(x, y, climate);
            }
        }
    }

    /**
     * Génère l'élévation basée sur le terrain
     */
    generateElevationFromTerrain(terrainMap) {
        const T = MAP_CONFIG.TERRAIN_IDS;

        for (let y = 0; y < terrainMap.height; y++) {
            for (let x = 0; x < terrainMap.width; x++) {
                const terrainId = terrainMap.getTerrainId(x, y);
                let elevation = 50;

                switch (terrainId) {
                    case T.DEEP_WATER: elevation = 0; break;
                    case T.SHALLOW_WATER: elevation = 20; break;
                    case T.HILLS: elevation = 100 + Math.random() * 50; break;
                    case T.MOUNTAINS: elevation = 180 + Math.random() * 50; break;
                    case T.IMPASSABLE_MOUNTAINS: elevation = 240 + Math.random() * 15; break;
                    default: elevation = 50 + Math.random() * 30;
                }

                terrainMap.setElevation(x, y, Math.floor(elevation));
            }
        }
    }

    /**
     * Exporte une TerrainMap vers une image PNG
     * @param {TerrainMap} terrainMap - La carte à exporter
     * @returns {string} Data URL de l'image PNG
     */
    exportToImage(terrainMap) {
        this.canvas.width = terrainMap.width;
        this.canvas.height = terrainMap.height;

        const imageData = this.ctx.createImageData(terrainMap.width, terrainMap.height);
        const pixels = imageData.data;

        for (let y = 0; y < terrainMap.height; y++) {
            for (let x = 0; x < terrainMap.width; x++) {
                const terrainId = terrainMap.getTerrainId(x, y);
                const color = TERRAIN_TO_COLOR[terrainId] || '#ff00ff'; // Magenta pour erreur

                // Convertir hex en RGB
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);

                const i = (y * terrainMap.width + x) * 4;
                pixels[i] = r;
                pixels[i + 1] = g;
                pixels[i + 2] = b;
                pixels[i + 3] = 255; // Alpha
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
        return this.canvas.toDataURL('image/png');
    }

    /**
     * Télécharge la carte actuelle comme fichier PNG
     * @param {TerrainMap} terrainMap - La carte à télécharger
     * @param {string} filename - Nom du fichier
     */
    downloadMap(terrainMap, filename = 'map.png') {
        const dataUrl = this.exportToImage(terrainMap);

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.click();
    }
}

// Instance singleton
const mapLoader = new MapLoader();

/**
 * Charge une carte depuis une image
 * @param {string} imagePath - Chemin vers l'image
 * @param {TerrainMap} terrainMap - TerrainMap à remplir
 */
async function loadMapFromImage(imagePath, terrainMap) {
    return mapLoader.loadFromImage(imagePath, terrainMap);
}

/**
 * Exporte une carte vers une image
 * @param {TerrainMap} terrainMap - Carte à exporter
 */
function exportMapToImage(terrainMap) {
    return mapLoader.exportToImage(terrainMap);
}

/**
 * Télécharge une carte comme fichier PNG
 * @param {TerrainMap} terrainMap - Carte à télécharger
 * @param {string} filename - Nom du fichier
 */
function downloadMap(terrainMap, filename) {
    mapLoader.downloadMap(terrainMap, filename);
}

export {
    MapLoader,
    loadMapFromImage,
    exportMapToImage,
    downloadMap,
    TERRAIN_PALETTE,
    TERRAIN_TO_COLOR
};
