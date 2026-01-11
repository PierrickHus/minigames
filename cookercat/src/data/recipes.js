/**
 * Définition des recettes disponibles dans le jeu
 * Chaque recette contient les ingrédients nécessaires et les étapes de préparation
 */

import { INGREDIENTS, UTENSILS } from './ingredients.js';

/**
 * @typedef {Object} RecipeStep
 * @property {string} utensil - L'ustensile à utiliser
 * @property {number} duration - Durée en secondes
 * @property {string} description - Description de l'étape
 */

/**
 * @typedef {Object} Recipe
 * @property {string} name - Nom du plat
 * @property {string} icon - Icône du plat
 * @property {Array<string>} ingredients - Liste des ingrédients nécessaires
 * @property {Array<RecipeStep>} steps - Étapes de préparation
 * @property {number} difficulty - Difficulté (1-5)
 * @property {number} baseTime - Temps de base alloué en secondes
 */

export const RECIPES = {
    salade_simple: {
        name: 'Salade Simple',
        icon: '🥗',
        ingredients: ['salade', 'tomate', 'sel', 'poivre'],
        steps: [
            { utensil: 'couteau', duration: 20, description: 'Découper les légumes' },
            { utensil: 'assiette', duration: 5, description: 'Dresser dans l\'assiette' }
        ],
        difficulty: 1,
        baseTime: 120
    },

    omelette: {
        name: 'Omelette',
        icon: '🍳',
        ingredients: ['oeuf', 'beurre', 'sel', 'poivre'],
        steps: [
            { utensil: 'batteur', duration: 30, description: 'Battre les œufs' },
            { utensil: 'poele', duration: 120, description: 'Cuire à la poêle' },
            { utensil: 'assiette', duration: 5, description: 'Servir' }
        ],
        difficulty: 2,
        baseTime: 180
    },

    tarte_legumes: {
        name: 'Tarte aux Légumes',
        icon: '🥧',
        ingredients: ['fond_de_tarte', 'tomate', 'poivron', 'oignon', 'fromage'],
        steps: [
            { utensil: 'couteau', duration: 20, description: 'Découper les légumes' },
            { utensil: 'four', duration: 180, description: 'Cuire au four' },
            { utensil: 'assiette', duration: 5, description: 'Servir' }
        ],
        difficulty: 3,
        baseTime: 240
    },

    soupe_legumes: {
        name: 'Soupe de Légumes',
        icon: '🍲',
        ingredients: ['carotte', 'pomme_de_terre', 'oignon', 'sel', 'poivre'],
        steps: [
            { utensil: 'couteau', duration: 20, description: 'Découper les légumes' },
            { utensil: 'casserole', duration: 150, description: 'Cuire à la casserole' },
            { utensil: 'assiette', duration: 5, description: 'Servir' }
        ],
        difficulty: 2,
        baseTime: 200
    },

    gratin_pommes_terre: {
        name: 'Gratin de Pommes de Terre',
        icon: '🥔',
        ingredients: ['pomme_de_terre', 'lait', 'fromage', 'beurre', 'sel'],
        steps: [
            { utensil: 'couteau', duration: 20, description: 'Découper les pommes de terre' },
            { utensil: 'four', duration: 180, description: 'Cuire au four' },
            { utensil: 'assiette', duration: 5, description: 'Servir' }
        ],
        difficulty: 3,
        baseTime: 240
    },

    champignons_poeles: {
        name: 'Champignons Poêlés',
        icon: '🍄',
        ingredients: ['champignon', 'beurre', 'ail', 'sel', 'poivre'],
        steps: [
            { utensil: 'couteau', duration: 20, description: 'Nettoyer les champignons' },
            { utensil: 'poele', duration: 120, description: 'Faire revenir' },
            { utensil: 'assiette', duration: 5, description: 'Servir' }
        ],
        difficulty: 2,
        baseTime: 180
    },

    riz_curry: {
        name: 'Riz au Curry',
        icon: '🍛',
        ingredients: ['riz', 'curry', 'oignon', 'poivron', 'sel'],
        steps: [
            { utensil: 'couteau', duration: 20, description: 'Découper les légumes' },
            { utensil: 'casserole', duration: 150, description: 'Cuire le riz' },
            { utensil: 'assiette', duration: 5, description: 'Servir' }
        ],
        difficulty: 3,
        baseTime: 220
    },

    pates_fromage: {
        name: 'Pâtes au Fromage',
        icon: '🧀',
        ingredients: ['pates', 'fromage', 'beurre', 'lait', 'sel'],
        steps: [
            { utensil: 'casserole', duration: 150, description: 'Cuire les pâtes' },
            { utensil: 'poele', duration: 60, description: 'Faire la sauce' },
            { utensil: 'assiette', duration: 5, description: 'Servir' }
        ],
        difficulty: 2,
        baseTime: 240
    },

    poisson_grille: {
        name: 'Poisson Grillé',
        icon: '🐟',
        ingredients: ['poisson', 'citron', 'sel', 'poivre', 'beurre'],
        steps: [
            { utensil: 'poele', duration: 120, description: 'Griller le poisson' },
            { utensil: 'assiette', duration: 5, description: 'Servir avec citron' }
        ],
        difficulty: 3,
        baseTime: 180
    },

    steak_haricots: {
        name: 'Steak et Haricots',
        icon: '🥩',
        ingredients: ['viande', 'haricots_verts', 'beurre', 'sel', 'poivre'],
        steps: [
            { utensil: 'poele', duration: 120, description: 'Cuire le steak' },
            { utensil: 'casserole', duration: 100, description: 'Cuire les haricots' },
            { utensil: 'assiette', duration: 5, description: 'Dresser l\'assiette' }
        ],
        difficulty: 4,
        baseTime: 280
    },

    toast_miel: {
        name: 'Toast au Miel',
        icon: '🍯',
        ingredients: ['pain', 'miel', 'beurre'],
        steps: [
            { utensil: 'microonde', duration: 60, description: 'Toaster le pain' },
            { utensil: 'assiette', duration: 5, description: 'Servir avec miel' }
        ],
        difficulty: 1,
        baseTime: 90
    },

    quiche_champignons: {
        name: 'Quiche aux Champignons',
        icon: '🥧',
        ingredients: ['fond_de_tarte', 'champignon', 'oeuf', 'lait', 'fromage'],
        steps: [
            { utensil: 'couteau', duration: 20, description: 'Préparer les champignons' },
            { utensil: 'batteur', duration: 30, description: 'Battre les œufs' },
            { utensil: 'four', duration: 180, description: 'Cuire au four' },
            { utensil: 'assiette', duration: 5, description: 'Servir' }
        ],
        difficulty: 4,
        baseTime: 300
    }
};

/**
 * Obtient une recette aléatoire selon la difficulté souhaitée
 * @param {number} maxDifficulty - Difficulté maximale
 * @returns {Object} Une recette avec son ID
 */
export function getRandomRecipe(maxDifficulty = 5) {
    const availableRecipes = Object.entries(RECIPES)
        .filter(([_, recipe]) => recipe.difficulty <= maxDifficulty);

    const [id, recipe] = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
    return { id, ...recipe };
}

/**
 * Calcule le temps alloué pour une recette selon sa difficulté
 * @param {Recipe} recipe - La recette
 * @param {number} gameProgress - Progression du jeu (0-1)
 * @returns {number} Temps en secondes
 */
export function calculateRecipeTime(recipe, gameProgress = 0) {
    const minTime = recipe.baseTime * 0.8;
    const maxTime = recipe.baseTime * 1.5;

    return Math.floor(maxTime - (gameProgress * (maxTime - minTime)));
}

export default { RECIPES, getRandomRecipe, calculateRecipeTime };
