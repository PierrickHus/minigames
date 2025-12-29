// ==========================================
// ZONES CLIMATIQUES ET EFFETS SAISONNIERS
// ==========================================

import { MAP_CONFIG } from '../core/MapConfig.js';

/**
 * Zones climatiques avec effets par saison
 *
 * Chaque saison a:
 * - attritionMod: Modificateur d'attrition (ajouté au taux de base du terrain)
 * - movementMod: Multiplicateur de coût de mouvement
 * - foodMod: Multiplicateur de production de nourriture
 * - description: Description pour l'UI
 */
const CLIMATE_ZONES = {
    // Climat tempéré (Europe centrale, Gaule, Italie du Nord)
    temperate: {
        id: MAP_CONFIG.CLIMATE_IDS.TEMPERATE,
        name: 'Tempéré',
        description: 'Climat doux avec quatre saisons distinctes',
        seasons: {
            spring: {
                attritionMod: 0,
                movementMod: 1.0,
                foodMod: 1.2,
                description: 'Le printemps apporte le renouveau'
            },
            summer: {
                attritionMod: 0,
                movementMod: 1.0,
                foodMod: 1.5,
                description: 'L\'été est favorable aux campagnes'
            },
            autumn: {
                attritionMod: 0.01,
                movementMod: 1.0,
                foodMod: 1.0,
                description: 'L\'automne et ses récoltes'
            },
            winter: {
                attritionMod: 0.03,
                movementMod: 1.5,
                foodMod: 0.5,
                description: 'L\'hiver ralentit les armées'
            }
        }
    },

    // Climat maritime (Britannie, côtes atlantiques)
    maritime: {
        id: MAP_CONFIG.CLIMATE_IDS.MARITIME,
        name: 'Maritime',
        description: 'Climat océanique humide et variable',
        seasons: {
            spring: {
                attritionMod: 0,
                movementMod: 1.0,
                foodMod: 1.0,
                description: 'Temps changeant mais clément'
            },
            summer: {
                attritionMod: 0,
                movementMod: 0.8,
                foodMod: 1.2,
                description: 'Vents favorables pour la navigation'
            },
            autumn: {
                attritionMod: 0.02,
                movementMod: 1.2,
                foodMod: 1.0,
                description: 'Les tempêtes commencent'
            },
            winter: {
                attritionMod: 0.05,
                movementMod: 2.0,
                foodMod: 0.8,
                description: 'Tempêtes violentes, mer dangereuse'
            }
        }
    },

    // Climat aride (Afrique du Nord, déserts)
    arid: {
        id: MAP_CONFIG.CLIMATE_IDS.ARID,
        name: 'Aride',
        description: 'Climat sec et chaud, désertique',
        seasons: {
            spring: {
                attritionMod: 0.02,
                movementMod: 1.0,
                foodMod: 0.5,
                description: 'Chaleur modérée'
            },
            summer: {
                attritionMod: 0.03,
                movementMod: 1.3,
                foodMod: 0.2,
                description: 'Chaleur intense, progression difficile'
            },
            autumn: {
                attritionMod: 0.03,
                movementMod: 1.0,
                foodMod: 0.5,
                description: 'Températures plus clémentes'
            },
            winter: {
                attritionMod: 0.01,
                movementMod: 0.8,
                foodMod: 0.8,
                description: 'Meilleure saison pour traverser'
            }
        }
    },

    // Climat alpin (Alpes, hautes montagnes)
    alpine: {
        id: MAP_CONFIG.CLIMATE_IDS.ALPINE,
        name: 'Alpin',
        description: 'Climat de haute montagne, rude',
        seasons: {
            spring: {
                attritionMod: 0.03,
                movementMod: 1.5,
                foodMod: 0.3,
                description: 'Fonte des neiges, cols dangereux'
            },
            summer: {
                attritionMod: 0.01,
                movementMod: 1.0,
                foodMod: 0.5,
                description: 'Seule période favorable au passage'
            },
            autumn: {
                attritionMod: 0.04,
                movementMod: 1.5,
                foodMod: 0.3,
                description: 'Les neiges reviennent'
            },
            winter: {
                attritionMod: 0.05,
                movementMod: 2.0,
                foodMod: 0.1,
                description: 'Cols fermés, passage très difficile'
            }
        }
    },

    // Climat méditerranéen (Italie, Grèce, côtes)
    mediterranean: {
        id: 5, // Ajout pour la Méditerranée
        name: 'Méditerranéen',
        description: 'Étés chauds et secs, hivers doux',
        seasons: {
            spring: {
                attritionMod: 0,
                movementMod: 1.0,
                foodMod: 1.3,
                description: 'Temps idéal pour les campagnes'
            },
            summer: {
                attritionMod: 0.02,
                movementMod: 1.0,
                foodMod: 1.0,
                description: 'Chaleur sèche mais supportable'
            },
            autumn: {
                attritionMod: 0,
                movementMod: 1.0,
                foodMod: 1.2,
                description: 'Vendanges et récoltes'
            },
            winter: {
                attritionMod: 0.01,
                movementMod: 1.2,
                foodMod: 0.7,
                description: 'Hiver doux, pluies fréquentes'
            }
        }
    }
};

/**
 * Obtient une zone climatique par son ID
 */
function getClimateById(id) {
    for (const [key, climate] of Object.entries(CLIMATE_ZONES)) {
        if (climate.id === id) {
            return { ...climate, key };
        }
    }
    return { ...CLIMATE_ZONES.temperate, key: 'temperate' };
}

/**
 * Obtient une zone climatique par son nom
 */
function getClimateByName(name) {
    return CLIMATE_ZONES[name] || CLIMATE_ZONES.temperate;
}

/**
 * Calcule le modificateur d'attrition total pour un terrain et une saison
 * @param {number} baseAttrition - Taux d'attrition de base du terrain
 * @param {string} climateName - Nom de la zone climatique
 * @param {number} seasonIndex - Index de la saison (0-3)
 * @returns {number} Taux d'attrition total
 */
function calculateAttrition(baseAttrition, climateName, seasonIndex) {
    const climate = getClimateByName(climateName);
    const seasonName = MAP_CONFIG.SEASONS[seasonIndex];
    const seasonData = climate.seasons[seasonName];

    return baseAttrition + seasonData.attritionMod;
}

/**
 * Calcule le modificateur de mouvement pour un climat et une saison
 * @param {string} climateName - Nom de la zone climatique
 * @param {number} seasonIndex - Index de la saison (0-3)
 * @returns {number} Multiplicateur de mouvement
 */
function getSeasonMovementModifier(climateName, seasonIndex) {
    const climate = getClimateByName(climateName);
    const seasonName = MAP_CONFIG.SEASONS[seasonIndex];
    return climate.seasons[seasonName].movementMod;
}

/**
 * Calcule le modificateur de nourriture pour un climat et une saison
 * @param {string} climateName - Nom de la zone climatique
 * @param {number} seasonIndex - Index de la saison (0-3)
 * @returns {number} Multiplicateur de nourriture
 */
function getSeasonFoodModifier(climateName, seasonIndex) {
    const climate = getClimateByName(climateName);
    const seasonName = MAP_CONFIG.SEASONS[seasonIndex];
    return climate.seasons[seasonName].foodMod;
}

/**
 * Obtient la description de la saison pour un climat
 */
function getSeasonDescription(climateName, seasonIndex) {
    const climate = getClimateByName(climateName);
    const seasonName = MAP_CONFIG.SEASONS[seasonIndex];
    return climate.seasons[seasonName].description;
}

export {
    CLIMATE_ZONES,
    getClimateById,
    getClimateByName,
    calculateAttrition,
    getSeasonMovementModifier,
    getSeasonFoodModifier,
    getSeasonDescription
};
