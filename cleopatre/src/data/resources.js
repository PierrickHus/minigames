// ==========================================
// DONNÉES DES RESSOURCES
// ==========================================

const RESOURCES = {
    wood: {
        id: 'wood',
        name: 'Bois',
        icon: '🪵',
        gatherTime: 10, // secondes
        gatherAmount: 5,
        gatherCost: 10, // coût en argent pour envoyer un paysan
        description: 'Utilisé pour construire des structures en bois'
    },

    stone: {
        id: 'stone',
        name: 'Pierre',
        icon: '🪨',
        gatherTime: 15,
        gatherAmount: 3,
        gatherCost: 15,
        description: 'Matériau solide pour les constructions durables'
    },

    sand: {
        id: 'sand',
        name: 'Sable',
        icon: '🏜️',
        gatherTime: 8,
        gatherAmount: 8,
        gatherCost: 5,
        description: 'Abondant dans le désert, utilisé pour les grands monuments'
    },

    dirt: {
        id: 'dirt',
        name: 'Terre',
        icon: '🟤',
        gatherTime: 6,
        gatherAmount: 10,
        gatherCost: 5,
        description: 'Facile à trouver, utilisée pour les fondations'
    },

    clay: {
        id: 'clay',
        name: 'Argile',
        icon: '🧱',
        gatherTime: 12,
        gatherAmount: 4,
        gatherCost: 12,
        description: 'Matériau de base pour les briques'
    }
};

// Ressources consommables
const CONSUMABLES = {
    food: {
        id: 'food',
        name: 'Nourriture',
        icon: '🍞',
        consumptionPerPeasant: 1, // par ration
        description: 'Les paysans ont besoin de nourriture pour travailler'
    },

    water: {
        id: 'water',
        name: 'Eau',
        icon: '💧',
        consumptionPerPeasant: 0.5, // par ration
        description: 'Essentielle à la vie du village'
    }
};

// Configuration des rations
const RATION_CONFIG = {
    interval: 60, // Une ration toutes les 60 secondes
    warningThreshold: 15 // Avertissement quand il reste 15 secondes
};

// Configuration de la croissance naturelle de population
const POPULATION_GROWTH_CONFIG = {
    baseGrowthRate: 0.5,        // Habitants par minute de base
    growthInterval: 30,          // Vérification toutes les 30 secondes
    minFoodReserve: 10,          // Minimum de nourriture pour croître
    minWaterReserve: 5,          // Minimum d'eau pour croître
    foodPerNewHabitant: 2,       // Nourriture consommée par nouvel habitant
    waterPerNewHabitant: 1,      // Eau consommée par nouvel habitant
    maxGrowthPerTick: 50,        // Maximum d'habitants gagnés par tick
    housingMultiplier: 0.1       // Bonus de croissance par maison (10%)
};

export { RESOURCES, CONSUMABLES, RATION_CONFIG, POPULATION_GROWTH_CONFIG };
