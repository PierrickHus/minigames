// ==========================================
// GESTIONNAIRE DE SPRITES DE BATAILLE
// ==========================================

import {
    BATTLE_ANIM_CONFIG,
    SPRITE_GENERATORS,
    SPRITE_DIMENSIONS,
    DEATH_SPRITE_DIMENSIONS,
    generateDeathSprites
} from '../data/battle-sprite-definitions.js';
import { FACTIONS } from '../data/index.js';

// Rôles possibles pour les soldats
const ROLES = ['soldier', 'leader', 'standardBearer'];

/**
 * Gère la génération et récupération des sprites pour les batailles
 */
class BattleSpriteManager {
    constructor() {
        // Cache des sprite sheets générées
        // Clé: "unitType_factionType_role" (ex: "infantry_roman_leader")
        this.spriteSheets = new Map();
        this.deathSheets = new Map();

        // État
        this.isInitialized = false;
        this.fallbackMode = false;

        // Mapping faction vers type de palette
        this.factionToPalette = {
            julii: 'roman',
            brutii: 'roman',
            scipii: 'roman',
            senate: 'roman',
            gauls: 'gaul',
            carthage: 'carthage',
            macedon: 'macedon',
            pontus: 'eastern',
            mauretania: 'eastern',
            rebels: 'rebel'
        };
    }

    /**
     * Initialise le gestionnaire en générant tous les sprites
     */
    async initialize() {
        console.log('Initialisation des sprites de bataille (32x32 avec rôles)...');
        const startTime = performance.now();

        try {
            // Générer les sprites pour chaque combinaison type/faction/rôle
            const unitTypes = Object.keys(SPRITE_GENERATORS);
            const paletteTypes = ['roman', 'gaul', 'carthage', 'macedon', 'eastern', 'rebel'];

            for (const unitType of unitTypes) {
                for (const paletteType of paletteTypes) {
                    for (const role of ROLES) {
                        this.generateSpriteSheet(unitType, paletteType, role);
                        this.generateDeathSheet(unitType, paletteType, role);
                    }
                }
            }

            this.isInitialized = true;
            const endTime = performance.now();
            console.log(`Sprites de bataille initialisés en ${(endTime - startTime).toFixed(2)}ms`);
            console.log(`  - ${this.spriteSheets.size} sprite sheets générés`);
            console.log(`  - ${this.deathSheets.size} death sheets générés`);
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des sprites:', error);
            this.fallbackMode = true;
        }
    }

    /**
     * Génère un sprite sheet pour un type d'unité, une palette et un rôle
     * @param {string} unitType - Type d'unité (infantry, cavalry, etc.)
     * @param {string} paletteType - Type de palette (roman, gaul, etc.)
     * @param {string} role - Rôle du soldat (soldier, leader, standardBearer)
     */
    generateSpriteSheet(unitType, paletteType, role = 'soldier') {
        const dimensions = SPRITE_DIMENSIONS[unitType] || SPRITE_DIMENSIONS.infantry;
        const generator = SPRITE_GENERATORS[unitType];

        if (!generator) {
            console.warn(`Pas de générateur pour le type: ${unitType}`);
            return;
        }

        // Créer le canvas pour le sprite sheet
        const canvas = document.createElement('canvas');
        canvas.width = dimensions.sheetWidth;
        canvas.height = dimensions.sheetHeight;

        // Générer les sprites avec le rôle
        generator(canvas, paletteType, role);

        // Stocker dans le cache avec le rôle
        const key = `${unitType}_${paletteType}_${role}`;
        this.spriteSheets.set(key, canvas);
    }

    /**
     * Génère un sprite sheet de mort pour un rôle spécifique
     * @param {string} unitType - Type d'unité
     * @param {string} paletteType - Type de palette
     * @param {string} role - Rôle du soldat
     */
    generateDeathSheet(unitType, paletteType, role = 'soldier') {
        const dimensions = DEATH_SPRITE_DIMENSIONS[unitType] || DEATH_SPRITE_DIMENSIONS.infantry;

        const canvas = document.createElement('canvas');
        canvas.width = dimensions.sheetWidth;
        canvas.height = dimensions.sheetHeight;

        try {
            generateDeathSprites(canvas, unitType, paletteType, role);
            const key = `${unitType}_${paletteType}_${role}`;
            this.deathSheets.set(key, canvas);
        } catch (error) {
            // Pas grave si la mort échoue
        }
    }

    /**
     * Vérifie si le manager est prêt
     */
    isReady() {
        return this.isInitialized && !this.fallbackMode;
    }

    /**
     * Obtient le type de palette pour une faction
     */
    getPaletteType(factionId) {
        return this.factionToPalette[factionId] || 'rebel';
    }

    /**
     * Récupère une frame de sprite
     * @param {string} unitType - Type d'unité (infantry, cavalry, etc.)
     * @param {string} factionId - ID de faction (julii, gauls, etc.)
     * @param {string} direction - Direction (S, SW, W, NW, N, NE, E, SE)
     * @param {string} animState - État d'animation (idle, walk, melee, ranged)
     * @param {number} animationTime - Temps d'animation en ms
     * @param {string} role - Rôle du soldat (soldier, leader, standardBearer)
     * @returns {Object|null} { image, sx, sy, sw, sh }
     */
    getFrame(unitType, factionId, direction, animState, animationTime, role = 'soldier') {
        if (!this.isReady()) return null;

        const paletteType = this.getPaletteType(factionId);
        const safeRole = ROLES.includes(role) ? role : 'soldier';
        const key = `${unitType}_${paletteType}_${safeRole}`;
        const sheet = this.spriteSheets.get(key);

        if (!sheet) {
            // Fallback vers soldier si le rôle n'existe pas
            const fallbackKey = `${unitType}_${paletteType}_soldier`;
            let fallbackSheet = this.spriteSheets.get(fallbackKey);

            if (!fallbackSheet) {
                // Fallback vers infantry_soldier si le type n'existe pas
                const infantryKey = `infantry_${paletteType}_soldier`;
                fallbackSheet = this.spriteSheets.get(infantryKey);
                if (!fallbackSheet) return null;
                return this.getFrameFromSheet(fallbackSheet, 'infantry', direction, animState, animationTime);
            }
            return this.getFrameFromSheet(fallbackSheet, unitType, direction, animState, animationTime);
        }

        return this.getFrameFromSheet(sheet, unitType, direction, animState, animationTime);
    }

    /**
     * Calcule les coordonnées de la frame dans le sprite sheet
     */
    getFrameFromSheet(sheet, unitType, direction, animState, animationTime) {
        const dimensions = SPRITE_DIMENSIONS[unitType] || SPRITE_DIMENSIONS.infantry;
        const animConfig = BATTLE_ANIM_CONFIG.ANIMATIONS[animState] || BATTLE_ANIM_CONFIG.ANIMATIONS.idle;

        // Calculer l'index de direction (0-7)
        const dirIndex = BATTLE_ANIM_CONFIG.DIRECTION_NAMES.indexOf(direction);
        const safeDir = dirIndex >= 0 ? dirIndex : 0;

        // Calculer l'index de frame
        const frameIndex = Math.floor(animationTime / animConfig.speed) % animConfig.frames;
        const frameOffset = animConfig.offset + frameIndex;

        // Coordonnées source
        const sx = frameOffset * dimensions.width;
        const sy = safeDir * dimensions.height;

        return {
            image: sheet,
            sx: sx,
            sy: sy,
            sw: dimensions.width,
            sh: dimensions.height
        };
    }

    /**
     * Récupère une frame de mort
     * @param {string} unitType - Type d'unité
     * @param {string} factionId - ID de faction
     * @param {string} direction - Direction
     * @param {number} frame - Index de frame (0-3)
     * @param {string} role - Rôle du soldat
     */
    getDeathFrame(unitType, factionId, direction, frame, role = 'soldier') {
        const paletteType = this.getPaletteType(factionId);
        const safeRole = ROLES.includes(role) ? role : 'soldier';
        const key = `${unitType}_${paletteType}_${safeRole}`;
        let sheet = this.deathSheets.get(key);

        // Fallback vers soldier si le rôle n'existe pas
        if (!sheet) {
            const fallbackKey = `${unitType}_${paletteType}_soldier`;
            sheet = this.deathSheets.get(fallbackKey);
        }

        if (!sheet) return null;

        const dimensions = DEATH_SPRITE_DIMENSIONS[unitType] || DEATH_SPRITE_DIMENSIONS.infantry;
        const dirIndex = BATTLE_ANIM_CONFIG.DIRECTION_NAMES.indexOf(direction);
        const safeDir = dirIndex >= 0 ? dirIndex : 0;
        const safeFrame = Math.min(frame, 3);

        return {
            image: sheet,
            sx: safeFrame * dimensions.width,
            sy: safeDir * dimensions.height,
            sw: dimensions.width,
            sh: dimensions.height
        };
    }

    /**
     * Obtient les dimensions d'un type d'unité
     */
    getDimensions(unitType) {
        return SPRITE_DIMENSIONS[unitType] || SPRITE_DIMENSIONS.infantry;
    }

    /**
     * Convertit un angle en direction
     * @param {number} angle - Angle en radians (de atan2(dy, dx))
     * @returns {string} Direction (S, SW, W, etc.)
     */
    angleToDirection(angle) {
        // En canvas: atan2(dy, dx) donne:
        // - angle 0 = droite (E)
        // - angle PI/2 = bas (S) car Y positif est vers le bas
        // - angle PI ou -PI = gauche (W)
        // - angle -PI/2 = haut (N)

        // Normaliser l'angle à 0-2PI
        let normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

        // Mapping: on veut 0=S, 1=SW, 2=W, 3=NW, 4=N, 5=NE, 6=E, 7=SE
        // atan2 en canvas: 0=E, PI/2=S, PI=W, 3PI/2=N (sens horaire car Y inversé)
        //
        // Pour convertir:
        // - E (angle=0) doit donner index 6
        // - S (angle=PI/2) doit donner index 0
        // - W (angle=PI) doit donner index 2
        // - N (angle=3PI/2 ou -PI/2) doit donner index 4

        // Décaler pour que S (PI/2) devienne 0, puis calculer le secteur
        // On soustrait PI/2 pour centrer sur S, puis on inverse le sens
        const shifted = (normalized - Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
        const sector = Math.round(shifted / (Math.PI / 4)) % 8;

        return BATTLE_ANIM_CONFIG.DIRECTION_NAMES[sector];
    }

    /**
     * Convertit un vecteur en direction
     */
    vectorToDirection(dx, dy) {
        if (dx === 0 && dy === 0) return 'S';
        const angle = Math.atan2(dy, dx);
        return this.angleToDirection(angle);
    }
}

export default BattleSpriteManager;
