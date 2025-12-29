// ==========================================
// CONFIGURATION DE LA CARTE
// ==========================================

/**
 * Configuration globale de la carte de campagne
 * 1 tuile ≈ 10 km² (compromis entre réalisme et performance)
 */
const MAP_CONFIG = {
    // Dimensions de la grille en tuiles
    GRID_WIDTH: 400,        // ~4000 km est-ouest (Hispanie → Asie Mineure)
    GRID_HEIGHT: 300,       // ~3000 km nord-sud (Britannie → Afrique)

    // Taille d'affichage d'une tuile en pixels
    TILE_SIZE: 16,          // pixels par tuile à zoom 1x

    // Échelle réelle
    KM_PER_TILE: 10,        // 1 tuile = 10 km

    // Limites de zoom
    MIN_ZOOM: 0.25,
    MAX_ZOOM: 2.0,
    DEFAULT_ZOOM: 0.5,

    // Directions octogonales (8 directions égales)
    DIRECTIONS: [
        { dx: 0, dy: -1, name: 'N' },   // Nord
        { dx: 1, dy: -1, name: 'NE' },  // Nord-Est
        { dx: 1, dy: 0, name: 'E' },    // Est
        { dx: 1, dy: 1, name: 'SE' },   // Sud-Est
        { dx: 0, dy: 1, name: 'S' },    // Sud
        { dx: -1, dy: 1, name: 'SW' },  // Sud-Ouest
        { dx: -1, dy: 0, name: 'W' },   // Ouest
        { dx: -1, dy: -1, name: 'NW' }  // Nord-Ouest
    ],

    // IDs des types de terrain
    TERRAIN_IDS: {
        DEEP_WATER: 0,
        SHALLOW_WATER: 1,
        PLAINS: 2,
        GRASSLAND: 3,
        FOREST: 4,
        DENSE_FOREST: 5,
        HILLS: 6,
        MOUNTAINS: 7,
        IMPASSABLE_MOUNTAINS: 8,
        DESERT: 9,
        SAND_COAST: 10,
        MARSH: 11,
        FARMLAND: 12,
        ROAD: 13,
        RIVER: 14
    },

    // IDs des zones climatiques
    CLIMATE_IDS: {
        TEMPERATE: 0,
        MARITIME: 1,
        ARID: 2,
        ALPINE: 3,
        TROPICAL: 4
    },

    // Saisons (correspondant à game.season)
    SEASONS: ['spring', 'summer', 'autumn', 'winter'],

    // Couleurs des terrains pour le rendu
    TERRAIN_COLORS: {
        0: '#0a2d4a',   // DEEP_WATER
        1: '#1a4d6e',   // SHALLOW_WATER
        2: '#7cb342',   // PLAINS
        3: '#8bc34a',   // GRASSLAND
        4: '#2e5c2e',   // FOREST
        5: '#1b4332',   // DENSE_FOREST
        6: '#8d6e63',   // HILLS
        7: '#5d4037',   // MOUNTAINS
        8: '#3e2723',   // IMPASSABLE_MOUNTAINS
        9: '#e6c47f',   // DESERT
        10: '#d4b896',  // SAND_COAST
        11: '#4a6741',  // MARSH
        12: '#c5a03f',  // FARMLAND
        13: '#a1887f',  // ROAD
        14: '#42a5f5'   // RIVER
    }
};

/**
 * Convertit des coordonnées pixel (ancien système 800x600) en coordonnées tuiles
 */
function pixelToTile(pixelX, pixelY) {
    return {
        tileX: Math.floor(pixelX * MAP_CONFIG.GRID_WIDTH / 800),
        tileY: Math.floor(pixelY * MAP_CONFIG.GRID_HEIGHT / 600)
    };
}

/**
 * Convertit des coordonnées tuiles en coordonnées pixel (pour le rendu)
 */
function tileToPixel(tileX, tileY, zoom = 1) {
    return {
        x: tileX * MAP_CONFIG.TILE_SIZE * zoom,
        y: tileY * MAP_CONFIG.TILE_SIZE * zoom
    };
}

/**
 * Vérifie si des coordonnées sont dans les limites de la carte
 */
function isValidTile(x, y) {
    return x >= 0 && x < MAP_CONFIG.GRID_WIDTH && y >= 0 && y < MAP_CONFIG.GRID_HEIGHT;
}

/**
 * Calcule la distance en tuiles entre deux points (distance de Chebyshev pour octogonal)
 */
function tileDistance(x1, y1, x2, y2) {
    return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
}

export { MAP_CONFIG, pixelToTile, tileToPixel, isValidTile, tileDistance };
