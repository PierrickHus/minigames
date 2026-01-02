// ==========================================
// GAME CONFIG API
// ==========================================
// Système de configuration centralisé avec support deep merge.
// Permet aux scénarios d'override n'importe quelle valeur du jeu.
// ==========================================

import BUILDINGS, { TIER_NAMES } from '../data/buildings.js';
import { BUILDING_SHAPES, PLACEMENT_ZONES } from '../data/building-shapes.js';
import { CLEOPATRA_TASKS, DIFFICULTY_CONFIG, BUILDING_TIER_UNLOCK } from '../data/tasks.js';
import { RESOURCES, CONSUMABLES, RATION_CONFIG, POPULATION_GROWTH_CONFIG } from '../data/resources.js';
import { TIMER_CONFIG, GAME_CONDITIONS, MOOD_CONFIG, SCALING_CONFIG } from '../constants.js';

/**
 * Configuration par défaut du jeu (valeurs actuelles)
 * Ces valeurs sont utilisées si aucun scénario n'est chargé ou si le scénario ne les override pas
 */
const DEFAULT_CONFIG = {
    // ==========================================
    // RESSOURCES DE DÉPART
    // ==========================================
    startingMoney: 1000,
    startingResources: {
        wood: 0,
        stone: 0,
        sand: 0,
        dirt: 0,
        clay: 0
    },
    startingConsumables: {
        food: 100,
        water: 100
    },
    startingPeasants: 10,
    startingPopulation: 0,
    startingMood: MOOD_CONFIG.startingMood,
    startingBirds: 0,

    // ==========================================
    // TIMERS ET COOLDOWNS
    // ==========================================
    taskCooldown: TIMER_CONFIG.taskCooldown,
    rationInterval: TIMER_CONFIG.rationInterval,
    growthCheckInterval: TIMER_CONFIG.growthCheckInterval,
    idleMessageInterval: TIMER_CONFIG.idleMessageInterval,
    autoSaveInterval: TIMER_CONFIG.autoSaveInterval,

    // Temps de déblocage des tiers (en secondes depuis le début)
    tierUnlockTimes: {
        1: BUILDING_TIER_UNLOCK[1],
        2: BUILDING_TIER_UNLOCK[2],
        3: BUILDING_TIER_UNLOCK[3]
    },

    // ==========================================
    // CONDITIONS DE FIN
    // ==========================================
    victory: {
        population: GAME_CONDITIONS.victoryPopulation
    },
    defeat: {
        mood: GAME_CONDITIONS.gameOverMood
    },

    // ==========================================
    // DONNÉES DU JEU (deep merge possible)
    // ==========================================
    buildings: BUILDINGS,
    buildingShapes: BUILDING_SHAPES,
    placementZones: PLACEMENT_ZONES,
    tierNames: TIER_NAMES,
    tasks: CLEOPATRA_TASKS,
    resources: RESOURCES,
    consumables: CONSUMABLES,
    rationConfig: RATION_CONFIG,
    populationGrowthConfig: POPULATION_GROWTH_CONFIG,
    difficultyConfig: DIFFICULTY_CONFIG,
    scalingConfig: SCALING_CONFIG,
    moodConfig: MOOD_CONFIG,

    // ==========================================
    // RESTRICTIONS (null = pas de restriction)
    // ==========================================

    // Liste des bâtiments débloqués (null = tous selon tier)
    unlockedBuildings: null,

    // Liste des tâches actives (null = toutes selon tier)
    enabledTasks: null,

    // ==========================================
    // FLAGS SPÉCIAUX
    // ==========================================

    // Active les tâches automatiques de Cléopâtre (par défaut désactivé)
    autoTasks: false,

    // Active le timer de déblocage des tiers (par défaut désactivé)
    tierTimerEnabled: false,

    // Mode tutoriel (pas de game over immédiat)
    tutorialMode: false,

    // Affiche le timer "Prochaine mission" (par défaut caché)
    showNextTaskTimer: false,

    // Multiplicateur de temps de construction (1 = normal, 0.5 = 2x plus rapide)
    constructionTimeMultiplier: 1
};

/**
 * Gestionnaire de configuration du jeu
 * Fournit une API centralisée pour accéder aux paramètres du jeu
 * avec support du deep merge pour les overrides de scénarios
 */
class GameConfig {
    constructor() {
        /** @type {object} Configuration active (defaults + overrides) */
        this.config = this.deepClone(DEFAULT_CONFIG);

        /** @type {string|null} ID du scénario actuellement chargé */
        this.scenarioId = null;

        /** @type {object|null} Référence au scénario complet (pour les steps, etc.) */
        this.scenario = null;
    }

    // ==========================================
    // LIFECYCLE
    // ==========================================

    /**
     * Charge la configuration d'un scénario
     * Effectue un deep merge avec les valeurs par défaut
     * @param {object} scenario - Le scénario à charger
     */
    loadScenario(scenario) {
        if (!scenario) {
            console.warn('GameConfig: Tentative de charger un scénario null');
            return;
        }

        // Reset aux valeurs par défaut
        this.config = this.deepClone(DEFAULT_CONFIG);

        // Deep merge avec la config du scénario
        if (scenario.config) {
            this.config = this.deepMerge(this.config, scenario.config);
        }

        this.scenarioId = scenario.id;
        this.scenario = scenario;

        console.log(`GameConfig: Scénario '${scenario.id}' chargé`);
    }

    /**
     * Réinitialise la configuration aux valeurs par défaut
     */
    reset() {
        this.config = this.deepClone(DEFAULT_CONFIG);
        this.scenarioId = null;
        this.scenario = null;
    }

    // ==========================================
    // ACCESSEURS - VALEURS SIMPLES
    // ==========================================

    get startingMoney() { return this.config.startingMoney; }
    get startingResources() { return this.config.startingResources; }
    get startingConsumables() { return this.config.startingConsumables; }
    get startingPeasants() { return this.config.startingPeasants; }
    get startingPopulation() { return this.config.startingPopulation; }
    get startingMood() { return this.config.startingMood; }
    get startingBirds() { return this.config.startingBirds; }

    get taskCooldown() { return this.config.taskCooldown; }
    get rationInterval() { return this.config.rationInterval; }
    get growthCheckInterval() { return this.config.growthCheckInterval; }
    get tierUnlockTimes() { return this.config.tierUnlockTimes; }

    get victory() { return this.config.victory; }
    get defeat() { return this.config.defeat; }

    get unlockedBuildings() { return this.config.unlockedBuildings; }
    get enabledTasks() { return this.config.enabledTasks; }
    get autoTasks() { return this.config.autoTasks; }
    get tierTimerEnabled() { return this.config.tierTimerEnabled; }
    get tutorialMode() { return this.config.tutorialMode; }
    get showNextTaskTimer() { return this.config.showNextTaskTimer; }
    get constructionTimeMultiplier() { return this.config.constructionTimeMultiplier; }

    // ==========================================
    // ACCESSEURS - DONNÉES COMPLEXES
    // ==========================================

    get buildings() { return this.config.buildings; }
    get buildingShapes() { return this.config.buildingShapes; }
    get placementZones() { return this.config.placementZones; }
    get tierNames() { return this.config.tierNames; }
    get tasks() { return this.config.tasks; }
    get resources() { return this.config.resources; }
    get consumables() { return this.config.consumables; }
    get rationConfig() { return this.config.rationConfig; }
    get populationGrowthConfig() { return this.config.populationGrowthConfig; }
    get difficultyConfig() { return this.config.difficultyConfig; }
    get scalingConfig() { return this.config.scalingConfig; }
    get moodConfig() { return this.config.moodConfig; }

    // ==========================================
    // MÉTHODES D'ACCÈS PRATIQUES
    // ==========================================

    /**
     * Récupère les données d'un bâtiment par son ID
     * @param {string} buildingId - ID du bâtiment
     * @returns {object|undefined} Données du bâtiment
     */
    getBuilding(buildingId) {
        return this.config.buildings[buildingId];
    }

    /**
     * Récupère les shapes d'un bâtiment par son ID
     * @param {string} buildingId - ID du bâtiment
     * @returns {object|undefined} Données des shapes
     */
    getBuildingShapes(buildingId) {
        return this.config.buildingShapes[buildingId];
    }

    /**
     * Récupère les données d'une ressource par son ID
     * @param {string} resourceId - ID de la ressource
     * @returns {object|undefined} Données de la ressource
     */
    getResource(resourceId) {
        return this.config.resources[resourceId];
    }

    /**
     * Récupère une tâche par son ID
     * @param {string} taskId - ID de la tâche
     * @returns {object|undefined} Données de la tâche
     */
    getTask(taskId) {
        return this.config.tasks.find(t => t.id === taskId);
    }

    /**
     * Vérifie si un bâtiment est débloqué
     * @param {string} buildingId - ID du bâtiment
     * @param {number} currentTier - Tier actuel du joueur
     * @returns {boolean} True si le bâtiment est disponible
     */
    isBuildingUnlocked(buildingId, currentTier) {
        const building = this.getBuilding(buildingId);
        if (!building) return false;

        // Si une liste spécifique est définie, vérifier dedans
        if (this.config.unlockedBuildings !== null) {
            return this.config.unlockedBuildings.includes(buildingId);
        }

        // Sinon, vérifier le tier
        return building.tier <= currentTier;
    }

    /**
     * Récupère tous les bâtiments débloqués pour un tier donné
     * @param {number} currentTier - Tier actuel du joueur
     * @returns {object[]} Liste des bâtiments disponibles
     */
    getUnlockedBuildings(currentTier) {
        const buildings = [];

        for (const [id, building] of Object.entries(this.config.buildings)) {
            if (this.isBuildingUnlocked(id, currentTier)) {
                buildings.push({ id, ...building });
            }
        }

        return buildings;
    }

    /**
     * Récupère les tâches disponibles pour un tier donné
     * @param {number} currentTier - Tier de difficulté actuel
     * @returns {object[]} Liste des tâches disponibles
     */
    getAvailableTasks(currentTier) {
        if (this.config.disableTasks) return [];

        return this.config.tasks.filter(task => {
            // Vérifier le tier
            if (task.tier > currentTier) return false;

            // Si une liste spécifique est définie, vérifier dedans
            if (this.config.enabledTasks !== null) {
                return this.config.enabledTasks.includes(task.id);
            }

            return true;
        });
    }

    // ==========================================
    // MODIFICATION RUNTIME (pour tutoriel)
    // ==========================================

    /**
     * Met à jour la liste des bâtiments débloqués (pour tutoriel progressif)
     * @param {string[]|null} buildingIds - Liste des IDs ou null pour tout débloquer selon tier
     */
    setUnlockedBuildings(buildingIds) {
        this.config.unlockedBuildings = buildingIds;
    }

    /**
     * Ajoute un bâtiment à la liste des débloqués
     * @param {string} buildingId - ID du bâtiment à débloquer
     */
    unlockBuilding(buildingId) {
        if (this.config.unlockedBuildings === null) {
            // Si null, on ne fait rien (tout est débloqué par tier)
            return;
        }
        if (!this.config.unlockedBuildings.includes(buildingId)) {
            this.config.unlockedBuildings.push(buildingId);
        }
    }

    // ==========================================
    // SAUVEGARDE / CHARGEMENT
    // ==========================================

    /**
     * Retourne les données à sauvegarder
     * @returns {object} Données de sauvegarde
     */
    toSaveData() {
        return {
            scenarioId: this.scenarioId,
            // Sauvegarder les overrides runtime (ex: bâtiments débloqués pendant le tutoriel)
            runtimeOverrides: {
                unlockedBuildings: this.config.unlockedBuildings
            }
        };
    }

    /**
     * Restaure la configuration depuis une sauvegarde
     * @param {object} saveData - Données de sauvegarde
     * @param {object} scenarios - Dictionnaire des scénarios disponibles
     */
    fromSaveData(saveData, scenarios) {
        if (!saveData || !saveData.scenarioId) {
            console.warn('GameConfig: Pas de scenarioId dans la sauvegarde');
            return;
        }

        const scenario = scenarios[saveData.scenarioId];
        if (!scenario) {
            console.warn(`GameConfig: Scénario '${saveData.scenarioId}' non trouvé`);
            return;
        }

        // Recharger le scénario
        this.loadScenario(scenario);

        // Appliquer les overrides runtime
        if (saveData.runtimeOverrides) {
            if (saveData.runtimeOverrides.unlockedBuildings !== undefined) {
                this.config.unlockedBuildings = saveData.runtimeOverrides.unlockedBuildings;
            }
        }
    }

    // ==========================================
    // UTILITAIRES
    // ==========================================

    /**
     * Clone profondément un objet
     * @param {*} obj - Objet à cloner
     * @returns {*} Clone de l'objet
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }

        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    /**
     * Fusionne profondément deux objets
     * Les valeurs de source écrasent celles de target
     * @param {object} target - Objet cible
     * @param {object} source - Objet source (overrides)
     * @returns {object} Objet fusionné
     */
    deepMerge(target, source) {
        if (source === null || source === undefined) {
            return target;
        }

        if (typeof source !== 'object' || Array.isArray(source)) {
            return source;
        }

        const result = { ...target };

        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                const sourceValue = source[key];
                const targetValue = target[key];

                if (
                    sourceValue !== null &&
                    typeof sourceValue === 'object' &&
                    !Array.isArray(sourceValue) &&
                    targetValue !== null &&
                    typeof targetValue === 'object' &&
                    !Array.isArray(targetValue)
                ) {
                    // Deep merge pour les objets imbriqués
                    result[key] = this.deepMerge(targetValue, sourceValue);
                } else {
                    // Remplacement direct pour les autres types
                    result[key] = this.deepClone(sourceValue);
                }
            }
        }

        return result;
    }
}

export default GameConfig;
export { DEFAULT_CONFIG };
