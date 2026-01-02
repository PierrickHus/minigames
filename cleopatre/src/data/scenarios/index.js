// ==========================================
// REGISTRE DES SCÉNARIOS
// ==========================================
// Point d'entrée pour tous les scénarios du jeu.
// Chaque scénario est un fichier JS séparé (comme un mod).
// ==========================================

import FREEPLAY_SCENARIO from './freeplay.js';
import TUTORIAL_SCENARIO, { STEP_TYPES } from './tutorial.js';

/**
 * Tous les scénarios disponibles
 * Clé = ID du scénario
 */
const SCENARIOS = {
    freeplay: FREEPLAY_SCENARIO,
    tutorial: TUTORIAL_SCENARIO
};

/**
 * Récupère la liste des scénarios pour l'affichage
 * @returns {object[]} Liste des scénarios avec leurs métadonnées
 */
export function getScenarioList() {
    return Object.values(SCENARIOS).map(scenario => ({
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        icon: scenario.icon,
        recommended: scenario.recommended || false
    }));
}

/**
 * Récupère un scénario par son ID
 * @param {string} scenarioId - ID du scénario
 * @returns {object|undefined} Le scénario ou undefined
 */
export function getScenario(scenarioId) {
    return SCENARIOS[scenarioId];
}

export default SCENARIOS;
export { STEP_TYPES };
