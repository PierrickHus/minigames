/**
 * Configuration centralisée du jeu
 * Toutes les constantes et valeurs de configuration sont définies ici
 */

/**
 * Configuration générale du jeu
 */
export const GAME_CONFIG = {
    TARGET_SCORE: 10,
    FAKE_TARGET_SCORE: 500,
    DOOM_DURATION: 300,
    DOOM_LIVES: 3,
    PATTERN_DURATION: 5000,
    TRANSITION_DURATION: 4000,
    MAX_PROJECTILES: 150,
    DIAMOND_COUNT: 15
};

/**
 * Configuration du roi (joueur)
 */
export const KING_CONFIG = {
    WIDTH: 50,
    HEIGHT: 50,
    SPEED: 8,
    HITBOX_SIZE: 14,
    HITBOX_VERTICAL_OFFSET: 15
};

/**
 * Configuration de la reine
 */
export const QUEEN_CONFIG = {
    WIDTH: 50,
    HEIGHT: 50,
    DEMON_WIDTH: 70,
    DEMON_HEIGHT: 70
};

/**
 * Configuration des diamants
 */
export const DIAMOND_CONFIG = {
    WIDTH: 35,
    HEIGHT: 35
};

/**
 * Configuration des projectiles
 */
export const PROJECTILE_CONFIG = {
    BASE_SPEED: 5,
    DEFAULT_SIZE: 20
};

/**
 * Seuils de difficulté basés sur le score
 */
export const DIFFICULTY_THRESHOLDS = {
    EASY: 20,
    MEDIUM: 40,
    HARD: 70,
    EXTREME: 100
};

/**
 * Configuration de difficulté par niveau
 */
export const DIFFICULTY_CONFIGS = {
    EASY: {
        name: 'Facile',
        class: 'diff-easy',
        queenSpeed: 2.5,
        fireRate: 2000,
        projectileSpeed: 2,
        emoji: '💗'
    },
    MEDIUM: {
        name: 'Moyen',
        class: 'diff-medium',
        queenSpeed: 3,
        fireRate: 1500,
        projectileSpeed: 3,
        emoji: '💜'
    },
    HARD: {
        name: 'Difficile',
        class: 'diff-hard',
        queenSpeed: 3.5,
        fireRate: 1000,
        projectileSpeed: 4,
        emoji: '🔥'
    },
    EXTREME: {
        name: 'EXTREME',
        class: 'diff-extreme',
        queenSpeed: 4,
        fireRate: 600,
        projectileSpeed: 5,
        emoji: '☠️'
    }
};

/**
 * Configuration du renderer
 */
export const RENDERER_CONFIG = {
    BACKGROUND_COLOR: '#2a1810',
    ALPHA: false,
    WILL_CHANGE: true
};

/**
 * Configuration de l'Object Pooling
 */
export const POOL_CONFIG = {
    PROJECTILE_INITIAL_SIZE: 100,
    PROJECTILE_MAX_SIZE: 500,
    ENABLE_POOLING: true
};
