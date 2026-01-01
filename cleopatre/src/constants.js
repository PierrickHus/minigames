// ==========================================
// CONSTANTES GLOBALES DU JEU
// ==========================================
// Ce fichier centralise toutes les constantes magiques utilisées
// dans le jeu pour éviter la duplication et faciliter la maintenance.
// ==========================================

/**
 * Identifiants des types de ressources
 * @readonly
 * @enum {string}
 */
export const RESOURCE_IDS = {
    WOOD: 'wood',
    STONE: 'stone',
    SAND: 'sand',
    DIRT: 'dirt',
    CLAY: 'clay'
};

/**
 * Identifiants des consommables
 * @readonly
 * @enum {string}
 */
export const CONSUMABLE_IDS = {
    FOOD: 'food',
    WATER: 'water'
};

/**
 * Types de tâches de Cléopâtre
 * @readonly
 * @enum {string}
 */
export const TASK_TYPES = {
    BUILD: 'build',
    GATHER: 'gather',
    MESSAGE: 'message',
    FEED: 'feed',
    WATER: 'water',
    POPULATION: 'population'
};

/**
 * Identifiants des écrans du jeu
 * @readonly
 * @enum {string}
 */
export const SCREEN_IDS = {
    MAIN_MENU: 'mainMenu',
    CHARACTER_SELECT: 'characterSelect',
    GAME: 'gameScreen',
    GUIDE: 'guideScreen',
    GAME_OVER: 'gameOverScreen',
    VICTORY: 'victoryScreen'
};

/**
 * Configuration du système de scaling des coûts
 * @readonly
 */
export const SCALING_CONFIG = {
    /** Facteur d'augmentation par bâtiment existant (15%) */
    buildingCostFactor: 1.15,
    /** Coût de base pour envoyer un message */
    baseMessageCost: 50,
    /** Facteur d'augmentation du coût des messages */
    messageCostFactor: 1.5
};

/**
 * Configuration des timers du jeu (en secondes)
 * @readonly
 */
export const TIMER_CONFIG = {
    /** Intervalle entre les distributions de rations */
    rationInterval: 60,
    /** Seuil d'avertissement avant la prochaine ration */
    rationWarningThreshold: 15,
    /** Intervalle de vérification de la croissance de population */
    growthCheckInterval: 30,
    /** Délai entre les nouvelles tâches de Cléopâtre */
    taskCooldown: 45,
    /** Intervalle des messages idle de Cléopâtre */
    idleMessageInterval: 30,
    /** Intervalle de sauvegarde automatique */
    autoSaveInterval: 60
};

/**
 * Configuration de l'interface utilisateur
 * @readonly
 */
export const UI_CONFIG = {
    /** Nombre maximum de tâches actives simultanées */
    maxActiveTasks: 3,
    /** Durée d'affichage des notifications (ms) */
    notificationDuration: 3000,
    /** Durée d'affichage des notifications Cléopâtre (ms) */
    cleopatraNotificationDuration: 5000,
    /** Temps d'animation de disparition des notifications (ms) */
    notificationFadeTime: 300
};

/**
 * Configuration de l'humeur de Cléopâtre
 * @readonly
 */
export const MOOD_CONFIG = {
    /** Humeur de départ */
    startingMood: 75,
    /** Bonus d'humeur pour tâche réussie */
    taskSuccessBonus: 5,
    /** Pénalité d'humeur pour tâche échouée */
    taskFailurePenalty: 10,
    /** Seuil critique (rouge) */
    criticalThreshold: 20,
    /** Seuil d'attention (orange) */
    warningThreshold: 50
};

/**
 * Configuration des conditions de victoire/défaite
 * @readonly
 */
export const GAME_CONDITIONS = {
    /** Population requise pour la victoire */
    victoryPopulation: 10000,
    /** Humeur minimale avant game over */
    gameOverMood: 0
};

/**
 * Couleurs utilisées dans l'interface
 * @readonly
 */
export const UI_COLORS = {
    /** Vert - succès, positif */
    success: '#4ade80',
    /** Vert foncé - succès alternatif */
    successDark: '#22c55e',
    /** Rouge - erreur, critique */
    error: '#ff6b6b',
    /** Rouge foncé - erreur alternatif */
    errorDark: '#ff4444',
    /** Orange - attention */
    warning: '#ffaa00',
    /** Or - attention alternatif */
    warningGold: '#ffd700',
    /** Gris - neutre */
    neutral: '#aaa',
    /** Texte principal */
    text: '#eee',
    /** Fond principal */
    background: '#1a1a2e'
};

/**
 * Identifiants des éléments DOM principaux
 * @readonly
 */
export const DOM_IDS = {
    // Affichages de ressources
    MONEY_DISPLAY: 'moneyDisplay',
    FOOD_DISPLAY: 'foodDisplay',
    WATER_DISPLAY: 'waterDisplay',
    POPULATION_DISPLAY: 'populationDisplay',
    PEASANTS_DISPLAY: 'peasantsDisplay',
    RATION_TIMER: 'rationTimerDisplay',

    // Panneaux
    BUILDINGS_LIST: 'buildingsList',
    TASKS_LIST: 'tasksList',
    RESOURCES_BAR: 'resourcesBarList',

    // Cléopâtre
    CLEOPATRA_MOOD: 'cleopatraMood',
    MOOD_BAR: 'moodBar',
    TASK_DESCRIPTION: 'taskDescription',
    NEXT_TASK_TIMER: 'nextTaskTimer',
    NEXT_TASK_COUNTDOWN: 'nextTaskCountdown',

    // Canvas
    VILLAGE_CANVAS: 'villageCanvas',
    CLEOPATRA_CANVAS: 'cleopatraCanvas'
};

/**
 * Configuration audio
 * @readonly
 */
export const AUDIO_CONFIG = {
    /** Volume par défaut (0-1) */
    defaultVolume: 0.5,
    /** Volume des effets sonores par défaut */
    defaultSfxVolume: 0.7,
    /** Volume de la musique par défaut */
    defaultMusicVolume: 0.4
};
