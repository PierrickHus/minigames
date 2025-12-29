// ==========================================
// INDEX DES DONNÉES
// ==========================================

import FACTIONS from './factions.js';
import BUILDINGS from './buildings.js';
import UNIT_TYPES from './units.js';
// CITIES est maintenant chargé depuis assets/maps/MAP_cities.json

// Nouveaux exports pour le système de tuiles
import { TERRAIN_TYPES, getTerrainById } from './terrain-types.js';
import { CLIMATE_ZONES, calculateAttrition, getSeasonMovementModifier } from './climate-zones.js';
import { CITY_TILE_TYPES, CITY_GROWTH_THRESHOLDS, getCityCategory, calculateTileCount } from './city-tiles.js';

export {
    FACTIONS,
    BUILDINGS,
    UNIT_TYPES,
    // Terrain
    TERRAIN_TYPES,
    getTerrainById,
    // Climat
    CLIMATE_ZONES,
    calculateAttrition,
    getSeasonMovementModifier,
    // Tuiles de ville
    CITY_TILE_TYPES,
    CITY_GROWTH_THRESHOLDS,
    getCityCategory,
    calculateTileCount
};
