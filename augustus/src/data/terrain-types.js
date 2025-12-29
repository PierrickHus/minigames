// ==========================================
// DÉFINITIONS DES TYPES DE TERRAIN
// ==========================================

import { MAP_CONFIG } from '../core/MapConfig.js';

/**
 * Types de terrain avec leurs propriétés de gameplay
 *
 * Propriétés:
 * - id: Identifiant numérique (pour Uint8Array)
 * - name: Nom d'affichage
 * - color: Couleur de rendu
 * - movementCost: Coût de mouvement (1.0 = normal)
 * - defenseBonus: Bonus de défense en combat (%)
 * - attritionRate: Taux d'attrition de base (% par tour)
 * - isPassable: Traversable par unités terrestres
 * - isNaval: Traversable par unités navales
 * - foodYield: Production de nourriture
 * - goldYield: Production d'or
 * - climate: Zone climatique par défaut
 */
const TERRAIN_TYPES = {
    // ========== TERRAINS AQUATIQUES ==========
    DEEP_WATER: {
        id: MAP_CONFIG.TERRAIN_IDS.DEEP_WATER,
        name: 'Haute Mer',
        color: '#0a2d4a',
        movementCost: 1.0,
        defenseBonus: 0,
        attritionRate: 0,
        isPassable: false,
        isNaval: true,
        foodYield: 2,
        goldYield: 0,
        climate: 'maritime',
        icon: '🌊'
    },

    SHALLOW_WATER: {
        id: MAP_CONFIG.TERRAIN_IDS.SHALLOW_WATER,
        name: 'Eaux Côtières',
        color: '#1a4d6e',
        movementCost: 1.0,
        defenseBonus: 0,
        attritionRate: 0,
        isPassable: false,
        isNaval: true,
        foodYield: 3,
        goldYield: 1,
        climate: 'maritime',
        icon: '🏖️'
    },

    // ========== TERRAINS DE PLAINE ==========
    PLAINS: {
        id: MAP_CONFIG.TERRAIN_IDS.PLAINS,
        name: 'Plaines',
        color: '#7cb342',
        movementCost: 1.0,
        defenseBonus: 0,
        attritionRate: 0,
        isPassable: true,
        isNaval: false,
        foodYield: 4,
        goldYield: 1,
        climate: 'temperate',
        icon: '🌾'
    },

    GRASSLAND: {
        id: MAP_CONFIG.TERRAIN_IDS.GRASSLAND,
        name: 'Prairie',
        color: '#8bc34a',
        movementCost: 1.0,
        defenseBonus: 0,
        attritionRate: 0,
        isPassable: true,
        isNaval: false,
        foodYield: 3,
        goldYield: 1,
        climate: 'temperate',
        icon: '🌿'
    },

    // ========== TERRAINS FORESTIERS ==========
    FOREST: {
        id: MAP_CONFIG.TERRAIN_IDS.FOREST,
        name: 'Forêt',
        color: '#2e5c2e',
        movementCost: 2.0,
        defenseBonus: 25,
        attritionRate: 0.02,
        isPassable: true,
        isNaval: false,
        foodYield: 2,
        goldYield: 2,
        climate: 'temperate',
        icon: '🌲'
    },

    DENSE_FOREST: {
        id: MAP_CONFIG.TERRAIN_IDS.DENSE_FOREST,
        name: 'Forêt Dense',
        color: '#1b4332',
        movementCost: 3.0,
        defenseBonus: 40,
        attritionRate: 0.03,
        isPassable: true,
        isNaval: false,
        foodYield: 1,
        goldYield: 2,
        climate: 'temperate',
        icon: '🌳'
    },

    // ========== TERRAINS MONTAGNEUX ==========
    HILLS: {
        id: MAP_CONFIG.TERRAIN_IDS.HILLS,
        name: 'Collines',
        color: '#8d6e63',
        movementCost: 1.5,
        defenseBonus: 20,
        attritionRate: 0.01,
        isPassable: true,
        isNaval: false,
        foodYield: 2,
        goldYield: 2,
        climate: 'temperate',
        icon: '⛰️'
    },

    MOUNTAINS: {
        id: MAP_CONFIG.TERRAIN_IDS.MOUNTAINS,
        name: 'Montagnes',
        color: '#5d4037',
        movementCost: 4.0,
        defenseBonus: 50,
        attritionRate: 0.02,
        isPassable: true,
        isNaval: false,
        foodYield: 0,
        goldYield: 3,
        climate: 'alpine',
        icon: '🏔️'
    },

    IMPASSABLE_MOUNTAINS: {
        id: MAP_CONFIG.TERRAIN_IDS.IMPASSABLE_MOUNTAINS,
        name: 'Hautes Montagnes',
        color: '#3e2723',
        movementCost: Infinity,
        defenseBonus: 0,
        attritionRate: 0,
        isPassable: false,
        isNaval: false,
        foodYield: 0,
        goldYield: 0,
        climate: 'alpine',
        icon: '❄️'
    },

    // ========== TERRAINS ARIDES ==========
    DESERT: {
        id: MAP_CONFIG.TERRAIN_IDS.DESERT,
        name: 'Désert',
        color: '#e6c47f',
        movementCost: 2.5,
        defenseBonus: -10,
        attritionRate: 0.02,
        isPassable: true,
        isNaval: false,
        foodYield: 0,
        goldYield: 1,
        climate: 'arid',
        icon: '🏜️'
    },

    SAND_COAST: {
        id: MAP_CONFIG.TERRAIN_IDS.SAND_COAST,
        name: 'Côte Sableuse',
        color: '#d4b896',
        movementCost: 1.5,
        defenseBonus: 0,
        attritionRate: 0.02,
        isPassable: true,
        isNaval: false,
        foodYield: 2,
        goldYield: 2,
        climate: 'arid',
        icon: '🏝️'
    },

    // ========== TERRAINS HUMIDES ==========
    MARSH: {
        id: MAP_CONFIG.TERRAIN_IDS.MARSH,
        name: 'Marécages',
        color: '#4a6741',
        movementCost: 3.0,
        defenseBonus: 15,
        attritionRate: 0.01,
        isPassable: true,
        isNaval: false,
        foodYield: 1,
        goldYield: 0,
        climate: 'temperate',
        icon: '🐊'
    },

    // ========== TERRAINS DÉVELOPPÉS ==========
    FARMLAND: {
        id: MAP_CONFIG.TERRAIN_IDS.FARMLAND,
        name: 'Terres Agricoles',
        color: '#c5a03f',
        movementCost: 1.0,
        defenseBonus: -5,
        attritionRate: 0,
        isPassable: true,
        isNaval: false,
        foodYield: 6,
        goldYield: 2,
        climate: 'temperate',
        icon: '🌻'
    },

    ROAD: {
        id: MAP_CONFIG.TERRAIN_IDS.ROAD,
        name: 'Route',
        color: '#a1887f',
        movementCost: 0.5,
        defenseBonus: -10,
        attritionRate: 0,
        isPassable: true,
        isNaval: false,
        foodYield: 0,
        goldYield: 3,
        climate: 'temperate',
        icon: '🛤️'
    },

    RIVER: {
        id: MAP_CONFIG.TERRAIN_IDS.RIVER,
        name: 'Rivière',
        color: '#42a5f5',
        movementCost: 2.0,
        defenseBonus: 20,
        attritionRate: 0,
        isPassable: true,
        isNaval: true,
        foodYield: 3,
        goldYield: 2,
        climate: 'temperate',
        icon: '🌊'
    }
};

/**
 * Obtient un type de terrain par son ID numérique
 */
function getTerrainById(id) {
    return Object.values(TERRAIN_TYPES).find(t => t.id === id) || TERRAIN_TYPES.PLAINS;
}

/**
 * Obtient un type de terrain par son nom de clé
 */
function getTerrainByKey(key) {
    return TERRAIN_TYPES[key] || TERRAIN_TYPES.PLAINS;
}

/**
 * Vérifie si un terrain est traversable par une unité
 */
function canTraverse(terrainId, isNavalUnit = false) {
    const terrain = getTerrainById(terrainId);
    if (isNavalUnit) {
        return terrain.isNaval;
    }
    return terrain.isPassable;
}

/**
 * Calcule le coût de mouvement pour un terrain
 */
function getMovementCost(terrainId, unitType = 'infantry') {
    const terrain = getTerrainById(terrainId);
    let cost = terrain.movementCost;

    // Modificateurs par type d'unité
    if (unitType === 'cavalry') {
        // Cavalerie pénalisée en forêt et montagne
        if (terrain.id === MAP_CONFIG.TERRAIN_IDS.FOREST) cost *= 1.5;
        if (terrain.id === MAP_CONFIG.TERRAIN_IDS.DENSE_FOREST) cost *= 2.0;
        if (terrain.id === MAP_CONFIG.TERRAIN_IDS.MOUNTAINS) cost *= 1.5;
        if (terrain.id === MAP_CONFIG.TERRAIN_IDS.MARSH) cost *= 1.5;
    }

    return cost;
}

export { TERRAIN_TYPES, getTerrainById, getTerrainByKey, canTraverse, getMovementCost };
