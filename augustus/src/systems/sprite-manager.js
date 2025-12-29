// ==========================================
// GESTIONNAIRE DE SPRITES D'ARMÉES
// ==========================================

import { generateRomanSprites, generateGaulSprites, generateCarthageSprites,
         generateMacedonSprites, generateEasternSprites, generateRebelSprites } from '../data/sprite-definitions.js';

/**
 * Configuration des sprites
 */
export const SPRITE_CONFIG = {
    FRAME_WIDTH: 32,
    FRAME_HEIGHT: 32,
    DIRECTIONS: ['S', 'W', 'E', 'N'],
    IDLE_FRAMES: 4,
    WALK_FRAMES: 4,
    IDLE_SPEED: 300,  // ms par frame
    WALK_SPEED: 150   // ms par frame
};

/**
 * Gestionnaire central des sprites d'armées
 */
class SpriteManager {
    constructor() {
        this.spriteSheets = new Map();  // factionType -> Canvas
        this.loaded = false;
        this.fallbackMode = false;
    }

    /**
     * Initialise tous les sprites au démarrage
     */
    async initialize() {
        try {
            await this.generateAllSprites();
            this.loaded = true;
            console.log('SpriteManager: Sprites générés avec succès');
        } catch (error) {
            console.error('SpriteManager: Erreur lors de la génération des sprites:', error);
            this.fallbackMode = true;
        }
    }

    /**
     * Génère les sprites pour chaque type de faction
     */
    generateAllSprites() {
        const generators = {
            'roman': generateRomanSprites,
            'gauls': generateGaulSprites,
            'carthage': generateCarthageSprites,
            'macedon': generateMacedonSprites,
            'eastern': generateEasternSprites,
            'rebels': generateRebelSprites
        };

        for (const [type, generator] of Object.entries(generators)) {
            const canvas = this.createSpriteSheet();
            generator(canvas);
            this.spriteSheets.set(type, canvas);
        }
    }

    /**
     * Crée un canvas hors-écran pour le sprite sheet
     * Structure: 8 colonnes (4 idle + 4 walk) x 4 lignes (directions)
     */
    createSpriteSheet() {
        const canvas = document.createElement('canvas');
        canvas.width = SPRITE_CONFIG.FRAME_WIDTH * 8;   // 256px (4 idle + 4 walk)
        canvas.height = SPRITE_CONFIG.FRAME_HEIGHT * 4; // 128px (4 directions)
        return canvas;
    }

    /**
     * Obtient la frame appropriée pour une armée
     * @param {string} factionId - ID de la faction
     * @param {string} direction - Direction (S, W, E, N, SW, SE, NW, NE)
     * @param {boolean} isMoving - Si l'armée est en mouvement
     * @param {number} animationTime - Temps d'animation en ms
     * @returns {Object|null} - Infos de la frame ou null pour fallback
     */
    getFrame(factionId, direction, isMoving, animationTime) {
        const factionType = this.getFactionType(factionId);
        const spriteSheet = this.spriteSheets.get(factionType);

        if (!spriteSheet || this.fallbackMode) {
            return null;
        }

        const directionIndex = this.getDirectionIndex(direction);
        const speed = isMoving ? SPRITE_CONFIG.WALK_SPEED : SPRITE_CONFIG.IDLE_SPEED;
        const frameCount = isMoving ? SPRITE_CONFIG.WALK_FRAMES : SPRITE_CONFIG.IDLE_FRAMES;
        const frameIndex = Math.floor(animationTime / speed) % frameCount;

        // Offset X: idle = 0-3, walk = 4-7
        const xOffset = isMoving ? SPRITE_CONFIG.IDLE_FRAMES : 0;

        return {
            image: spriteSheet,
            sx: (xOffset + frameIndex) * SPRITE_CONFIG.FRAME_WIDTH,
            sy: directionIndex * SPRITE_CONFIG.FRAME_HEIGHT,
            sw: SPRITE_CONFIG.FRAME_WIDTH,
            sh: SPRITE_CONFIG.FRAME_HEIGHT
        };
    }

    /**
     * Mappe une faction vers son type de sprite
     */
    getFactionType(factionId) {
        if (['julii', 'brutii', 'scipii', 'senate'].includes(factionId)) {
            return 'roman';
        }
        if (['pontus', 'mauretania'].includes(factionId)) {
            return 'eastern';
        }
        if (['gauls', 'carthage', 'macedon', 'rebels'].includes(factionId)) {
            return factionId;
        }
        return 'rebels'; // Fallback
    }

    /**
     * Convertit une direction en index (0-3)
     */
    getDirectionIndex(direction) {
        const mapping = {
            'S': 0, 'SW': 0, 'SE': 0,
            'W': 1, 'NW': 1,
            'E': 2, 'NE': 2,
            'N': 3
        };
        return mapping[direction] ?? 0;
    }

    /**
     * Vérifie si les sprites sont chargés
     */
    isReady() {
        return this.loaded && !this.fallbackMode;
    }
}

export default SpriteManager;
