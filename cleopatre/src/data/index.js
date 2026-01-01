// ==========================================
// EXPORT DES DONNÉES DU JEU
// ==========================================
// Point d'entrée centralisé pour tous les fichiers de données.
// Permet aux autres modules d'importer toutes les données depuis un seul endroit:
// import { BUILDINGS, RESOURCES, CLEOPATRA_TASKS } from '../data/index.js';
// ==========================================

// Données des bâtiments (types, coûts, effets, tiers)
export { default as BUILDINGS, TIER_NAMES } from './buildings.js';

// Données des ressources (types, coûts de collecte, consommables)
export { RESOURCES, CONSUMABLES, RATION_CONFIG, POPULATION_GROWTH_CONFIG } from './resources.js';

// Données des tâches de Cléopâtre (missions, messages, difficulté)
export { CLEOPATRA_TASKS, CLEOPATRA_IDLE_MESSAGES, REWARD_MESSAGES, DIFFICULTY_CONFIG, BUILDING_TIER_UNLOCK } from './tasks.js';

// Données des formes de bâtiments (shapes, zones de placement)
export { BUILDING_SHAPES, PLACEMENT_ZONES } from './building-shapes.js';
