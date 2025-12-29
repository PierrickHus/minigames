// ==========================================
// TYPES DE TUILES DE VILLE
// ==========================================

/**
 * Types de tuiles qu'une ville peut occuper
 * Chaque type a des propriétés spécifiques affectant le gameplay
 */
const CITY_TILE_TYPES = {
    CENTER: {
        id: 'center',
        name: 'Centre-ville',
        description: 'Cœur administratif et gouvernemental',
        icon: '🏛️',
        defenseBonus: 30,
        buildingSlots: 5,
        populationCapacity: 10000,
        goldBonus: 20,
        foodBonus: 0,
        required: true,
        priority: 0  // Toujours placé en premier
    },

    RESIDENTIAL: {
        id: 'residential',
        name: 'Quartier Résidentiel',
        description: 'Logements pour les citoyens',
        icon: '🏘️',
        defenseBonus: 10,
        buildingSlots: 3,
        populationCapacity: 8000,
        goldBonus: 5,
        foodBonus: 0,
        priority: 1
    },

    MARKET: {
        id: 'market',
        name: 'Quartier Marchand',
        description: 'Commerce et négoce',
        icon: '🏪',
        defenseBonus: 5,
        buildingSlots: 4,
        populationCapacity: 3000,
        goldBonus: 50,
        foodBonus: 0,
        priority: 2
    },

    FARMLAND: {
        id: 'farmland',
        name: 'Terres Agricoles',
        description: 'Production alimentaire',
        icon: '🌾',
        defenseBonus: 0,
        buildingSlots: 2,
        populationCapacity: 2000,
        goldBonus: 5,
        foodBonus: 30,
        priority: 3
    },

    MILITARY: {
        id: 'military',
        name: 'Quartier Militaire',
        description: 'Casernes et terrains d\'entraînement',
        icon: '⚔️',
        defenseBonus: 40,
        buildingSlots: 4,
        populationCapacity: 3000,
        goldBonus: 0,
        foodBonus: 0,
        garrisonCapacity: 2000,
        priority: 4
    },

    PORT: {
        id: 'port',
        name: 'Port',
        description: 'Installations maritimes et commerce naval',
        icon: '⚓',
        defenseBonus: 15,
        buildingSlots: 3,
        populationCapacity: 4000,
        goldBonus: 30,
        foodBonus: 10,
        navalCapacity: 5,
        requiresCoastal: true,
        priority: 5
    },

    TEMPLE: {
        id: 'temple',
        name: 'Quartier Sacré',
        description: 'Temples et lieux de culte',
        icon: '⛪',
        defenseBonus: 5,
        buildingSlots: 3,
        populationCapacity: 2000,
        goldBonus: 10,
        foodBonus: 0,
        happinessBonus: 15,
        priority: 6
    },

    INDUSTRIAL: {
        id: 'industrial',
        name: 'Quartier Artisanal',
        description: 'Ateliers et manufactures',
        icon: '🔨',
        defenseBonus: 5,
        buildingSlots: 4,
        populationCapacity: 4000,
        goldBonus: 25,
        foodBonus: 0,
        productionBonus: 20,
        priority: 7
    },

    WALLS: {
        id: 'walls',
        name: 'Remparts',
        description: 'Fortifications défensives',
        icon: '🧱',
        defenseBonus: 60,
        buildingSlots: 0,
        populationCapacity: 0,
        goldBonus: 0,
        foodBonus: 0,
        isWall: true,
        priority: 10  // Placé en dernier (entoure la ville)
    }
};

/**
 * Seuils de population pour la croissance des villes
 */
const CITY_GROWTH_THRESHOLDS = {
    SETTLEMENT: {
        name: 'Hameau',
        minPop: 0,
        maxTiles: 1,
        layout: '1x1'
    },
    VILLAGE: {
        name: 'Village',
        minPop: 3000,
        maxTiles: 2,
        layout: '1x2'
    },
    TOWN: {
        name: 'Bourg',
        minPop: 5000,
        maxTiles: 4,
        layout: '2x2'
    },
    SMALL_CITY: {
        name: 'Petite Ville',
        minPop: 10000,
        maxTiles: 6,
        layout: '2x3'
    },
    CITY: {
        name: 'Ville',
        minPop: 20000,
        maxTiles: 9,
        layout: '3x3'
    },
    LARGE_CITY: {
        name: 'Grande Ville',
        minPop: 40000,
        maxTiles: 12,
        layout: '3x4'
    },
    METROPOLIS: {
        name: 'Métropole',
        minPop: 75000,
        maxTiles: 16,
        layout: '4x4'
    },
    MEGALOPOLIS: {
        name: 'Mégapole',
        minPop: 100000,
        maxTiles: 25,
        layout: '5x5'
    }
};

/**
 * Obtient la catégorie de ville basée sur la population
 */
function getCityCategory(population) {
    const thresholds = Object.entries(CITY_GROWTH_THRESHOLDS)
        .sort((a, b) => b[1].minPop - a[1].minPop);

    for (const [key, config] of thresholds) {
        if (population >= config.minPop) {
            return { key, ...config };
        }
    }

    return { key: 'SETTLEMENT', ...CITY_GROWTH_THRESHOLDS.SETTLEMENT };
}

/**
 * Calcule le nombre de tuiles pour une population donnée
 */
function calculateTileCount(population) {
    const category = getCityCategory(population);
    return category.maxTiles;
}

/**
 * Obtient le type de tuile par son ID
 */
function getCityTileType(id) {
    return Object.values(CITY_TILE_TYPES).find(t => t.id === id) || CITY_TILE_TYPES.RESIDENTIAL;
}

export {
    CITY_TILE_TYPES,
    CITY_GROWTH_THRESHOLDS,
    getCityCategory,
    calculateTileCount,
    getCityTileType
};
