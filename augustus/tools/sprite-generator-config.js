/**
 * Configuration complète pour la génération de sprites via Stable Diffusion API
 * Utilisation: node sprite-generator.js
 */

// =============================================================================
// CONFIGURATION GLOBALE
// =============================================================================

export const GLOBAL_CONFIG = {
    // URL de l'API Automatic1111 / ComfyUI
    apiUrl: "http://127.0.0.1:7860",

    // Paramètres de génération
    steps: 40,
    cfgScale: 7.5,
    sampler: "DPM++ 2M Karras",

    // Dossier de sortie
    outputDir: "./sprites/generated",

    // Nombre de variations à générer par prompt (pour choisir la meilleure)
    variationsPerPrompt: 4,

    // Délai entre les requêtes (ms) pour ne pas surcharger
    delayBetweenRequests: 1000
};

// =============================================================================
// PROMPT NÉGATIF UNIVERSEL
// =============================================================================

export const NEGATIVE_PROMPT = `blurry, smooth, anti-aliasing, gradient,
realistic, photograph, watermark, text, 3d render,
painting, sketch, noise, jpeg artifacts, cropped,
deformed, bad anatomy, ugly, duplicate`;

// =============================================================================
// DÉFINITIONS DES TYPES D'UNITÉS
// =============================================================================

export const UNIT_TYPES = {
    infantry: {
        frameSize: { width: 64, height: 64 },
        sheetSize: { idle: 6, walk: 6, attack: 6, death: 4 },
        colorPalette: 16,
        description: "Infantry foot soldier"
    },
    cavalry: {
        frameSize: { width: 80, height: 80 },
        sheetSize: { idle: 6, walk: 6, attack: 6, death: 4 },
        colorPalette: 20,
        description: "Mounted cavalry soldier"
    },
    ranged: {
        frameSize: { width: 64, height: 64 },
        sheetSize: { idle: 6, walk: 6, attack: 6, death: 4 },
        colorPalette: 16,
        description: "Ranged archer/skirmisher"
    },
    elephant: {
        frameSize: { width: 96, height: 96 },
        sheetSize: { idle: 6, walk: 6, attack: 6, death: 4 },
        colorPalette: 24,
        description: "War elephant with howdah"
    }
};

// =============================================================================
// DÉFINITIONS DES FACTIONS
// =============================================================================

export const FACTIONS = {
    roman: {
        name: "Roman",
        colors: "red and gold",
        style: "disciplined, professional military",
        armorStyle: "lorica segmentata silver plate armor",
        shieldStyle: "large rectangular scutum shield with golden eagle SPQR emblem on red background",
        helmetStyle: "bronze galea helmet with tall red horsehair crest",
        weaponStyle: "short gladius sword",
        clothingStyle: "bright red tunic underneath, brown leather sandals"
    },
    gaul: {
        name: "Gallic",
        colors: "blue and earth tones",
        style: "fierce barbarian warrior",
        armorStyle: "bare muscular chest with blue woad war paint swirling tribal patterns",
        shieldStyle: "large oval wooden shield with celtic knot spiral design",
        helmetStyle: "no helmet, long wild blonde hair and large mustache",
        weaponStyle: "long iron celtic sword",
        clothingStyle: "colorful plaid tartan trousers, golden torc necklace, leather boots with fur trim"
    },
    carthage: {
        name: "Carthaginian",
        colors: "purple and white",
        style: "professional mercenary",
        armorStyle: "bronze scale armor over purple tunic with white linen",
        shieldStyle: "round aspis shield with crescent moon emblem",
        helmetStyle: "conical bronze helmet with cheek guards",
        weaponStyle: "curved falcata sword",
        clothingStyle: "leather sandals with leg wraps, african features"
    },
    macedon: {
        name: "Macedonian",
        colors: "bronze and blue",
        style: "greek phalanx soldier",
        armorStyle: "bronze muscle cuirass armor with blue tunic underneath",
        shieldStyle: "large round aspis shield with vergina sun star emblem",
        helmetStyle: "bronze phrygian helmet with tall blue horsehair plume",
        weaponStyle: "very long sarissa pike",
        clothingStyle: "leather pteruges skirt, bronze greaves on shins"
    },
    eastern: {
        name: "Eastern",
        colors: "orange and gold",
        style: "persian exotic warrior",
        armorStyle: "colorful scale lamellar armor with bright orange and gold robes",
        shieldStyle: "wicker and leather crescent shield",
        helmetStyle: "pointed bronze helmet with aventail mail curtain",
        weaponStyle: "curved shamshir scimitar sword",
        clothingStyle: "baggy colorful silk trousers, pointed leather boots"
    },
    rebel: {
        name: "Rebel",
        colors: "brown and grey",
        style: "ragged desperate fighter",
        armorStyle: "mismatched worn leather armor, ragged brown tunic",
        shieldStyle: "battered wooden round shield, no emblem",
        helmetStyle: "no helmet or simple leather cap, dirty unkempt hair",
        weaponStyle: "rusty sword or farming tool weapon",
        clothingStyle: "torn dirty clothes, bare feet or worn sandals"
    }
};

// =============================================================================
// DIRECTIONS
// =============================================================================

export const DIRECTIONS = {
    S:  { name: "South",     view: "facing forward toward viewer, front view" },
    SW: { name: "Southwest", view: "facing southwest diagonal, 3/4 front-left view" },
    W:  { name: "West",      view: "facing left, side profile view, looking west" },
    NW: { name: "Northwest", view: "facing away northwest diagonal, 3/4 back-left view" },
    N:  { name: "North",     view: "facing away from viewer, back view, looking north" },
    NE: { name: "Northeast", view: "facing away northeast diagonal, 3/4 back-right view" },
    E:  { name: "East",      view: "facing right, side profile view, looking east" },
    SE: { name: "Southeast", view: "facing southeast diagonal, 3/4 front-right view" }
};

// =============================================================================
// ANIMATIONS
// =============================================================================

export const ANIMATIONS = {
    idle: {
        frames: 6,
        description: "idle breathing animation loop, subtle chest movement, standing at attention pose"
    },
    walk: {
        frames: 6,
        description: "walk cycle animation loop, legs alternating steps, arms swinging naturally, seamless loop animation, weight shift left right"
    },
    attack: {
        frames: 6,
        description: "attack animation sequence"
    },
    death: {
        frames: 4,
        description: "death fall animation, dramatic death sequence"
    }
};

// =============================================================================
// TEMPLATES DE PROMPTS PAR TYPE D'UNITÉ
// =============================================================================

export const PROMPT_TEMPLATES = {

    // =========================================================================
    // INFANTERIE
    // =========================================================================
    infantry: {
        base: (faction) => `
pixel art sprite sheet, game asset, single horizontal strip,
${faction.name.toLowerCase()} infantry soldier,
${faction.armorStyle},
${faction.shieldStyle},
${faction.weaponStyle},
${faction.helmetStyle},
${faction.clothingStyle},
${faction.style},
`.trim(),

        idle: (faction, direction) => `
sprite sheet, 6 frames, ${faction.name} soldier,
${faction.armorStyle}, ${faction.shieldStyle},
${faction.weaponStyle}, ${faction.helmetStyle},
idle stance, ${direction.view},
pixel art, game sprite, retro, 16-bit
`.trim(),

        walk: (faction, direction) => `
sprite sheet, 6 frames, ${faction.name} soldier walking,
${faction.armorStyle}, ${faction.shieldStyle},
${faction.weaponStyle}, ${faction.helmetStyle},
walk cycle animation, ${direction.view},
pixel art, game sprite, retro, 16-bit
`.trim(),

        attack: (faction, direction) => `
sprite sheet, 6 frames, ${faction.name} soldier attacking,
${faction.armorStyle}, ${faction.shieldStyle},
${faction.weaponStyle} swinging, ${faction.helmetStyle},
attack animation, combat pose, ${direction.view},
pixel art, game sprite, retro, 16-bit
`.trim(),

        death: (faction) => `
sprite sheet, 4 frames, ${faction.name} soldier dying,
${faction.armorStyle}, falling down, death animation,
pixel art, game sprite, retro, 16-bit
`.trim()
    },

    // =========================================================================
    // CAVALERIE
    // =========================================================================
    cavalry: {
        base: (faction) => `
pixel art sprite sheet, game asset, single horizontal strip,
${faction.name.toLowerCase()} cavalry soldier mounted on horse,
rider wearing ${faction.armorStyle},
${faction.colors} military cloak flowing,
oval cavalry shield, long cavalry sword,
${faction.helmetStyle},
horse with ${faction.colors} saddle cloth,
`.trim(),

        idle: (faction, direction) => `
pixel art sprite sheet, game asset, single horizontal strip,
6 frames showing idle animation loop,
${faction.name.toLowerCase()} cavalry soldier mounted on brown horse,
rider wearing ${faction.armorStyle},
${faction.colors} military cloak flowing,
oval cavalry shield with emblem, long spatha cavalry sword,
${faction.helmetStyle},
horse with ${faction.colors} saddle cloth,
leather horse tack and bridle, horse standing still with slight movement,
tail swishing, rider sitting upright,
${direction.view},
80x80 pixels per frame, 480x80 total image,
16-bit retro game style, visible pixels, hard edges,
limited 20 color palette, transparent background,
mounted warrior
`.trim(),

        walk: (faction, direction) => `
pixel art sprite sheet, game asset, single horizontal strip,
6 frames showing horse trot cycle animation,
${faction.name.toLowerCase()} cavalry soldier mounted on brown horse,
rider wearing ${faction.armorStyle},
${faction.colors} military cloak flowing behind,
oval cavalry shield, long spatha cavalry sword at side,
${faction.helmetStyle},
horse with ${faction.colors} saddle cloth,
horse trotting animation, legs moving in trot gait,
rider bobbing with horse movement, cloak billowing,
${direction.view},
80x80 pixels per frame, 480x80 total image,
16-bit retro game style, visible pixels, hard edges,
limited 20 color palette, transparent background,
seamless trot loop animation
`.trim(),

        attack: (faction, direction) => `
pixel art sprite sheet, game asset, single horizontal strip,
6 frames showing cavalry charge attack animation,
${faction.name.toLowerCase()} cavalry soldier mounted on galloping horse,
rider wearing ${faction.armorStyle},
${faction.colors} cloak flying dramatically,
oval cavalry shield raised, long sword raised high then slashing down,
${faction.helmetStyle},
horse charging forward,
horse gallop animation, dramatic charge attack,
sword swing from high to low, rider leaning into attack,
${direction.view},
80x80 pixels per frame, 480x80 total image,
16-bit retro game style, visible pixels, hard edges,
limited 20 color palette, transparent background,
dynamic cavalry combat animation
`.trim(),

        death: (faction) => `
pixel art sprite sheet, game asset, single horizontal strip,
4 frames showing cavalry death animation,
${faction.name.toLowerCase()} cavalry soldier falling from brown horse,
rider in ${faction.armorStyle}, ${faction.colors} cloak,
horse rearing and falling, rider thrown off,
death sequence: horse hit, horse falling, rider thrown, both down,
dramatic cavalry death scene,
80x80 pixels per frame, 320x80 total image,
16-bit retro game style, visible pixels, hard edges,
limited 20 color palette, transparent background
`.trim()
    },

    // =========================================================================
    // ARCHERS / UNITÉS À DISTANCE
    // =========================================================================
    ranged: {
        base: (faction) => `
pixel art sprite sheet, game asset, single horizontal strip,
${faction.name.toLowerCase()} archer soldier,
light leather armor over ${faction.colors} tunic,
composite recurve bow, quiver full of arrows on back,
`.trim(),

        idle: (faction, direction) => `
pixel art sprite sheet, game asset, single horizontal strip,
6 frames showing idle breathing animation loop,
${faction.name.toLowerCase()} auxiliary archer,
light leather armor over ${faction.colors} tunic,
no shield, composite recurve bow held at rest,
quiver full of arrows on back, simple bronze helmet,
leather bracers on forearms, light sandals,
relaxed archer stance, bow lowered,
${direction.view},
64x64 pixels per frame, 384x64 total image,
16-bit retro game style, visible pixels, hard edges,
limited 16 color palette, transparent background,
light infantry skirmisher
`.trim(),

        walk: (faction, direction) => `
pixel art sprite sheet, game asset, single horizontal strip,
6 frames showing walk cycle animation loop,
${faction.name.toLowerCase()} auxiliary archer,
light leather armor over ${faction.colors} tunic,
composite recurve bow carried, quiver bouncing on back,
simple bronze helmet, leather bracers, light sandals,
quick skirmisher walk, light-footed movement,
${direction.view},
64x64 pixels per frame, 384x64 total image,
16-bit retro game style, visible pixels, hard edges,
limited 16 color palette, transparent background,
seamless loop animation
`.trim(),

        attack: (faction, direction) => `
pixel art sprite sheet, game asset, single horizontal strip,
6 frames showing bow attack animation,
${faction.name.toLowerCase()} auxiliary archer,
light leather armor over ${faction.colors} tunic,
composite recurve bow, quiver on back, simple bronze helmet,
archery attack sequence: reach for arrow, nock arrow,
draw bowstring back, full draw aim, release arrow, follow through,
${direction.view},
64x64 pixels per frame, 384x64 total image,
16-bit retro game style, visible pixels, hard edges,
limited 16 color palette, transparent background,
ranged combat animation, arrow visible in flight on release frame
`.trim(),

        death: (faction) => `
pixel art sprite sheet, game asset, single horizontal strip,
4 frames showing death fall animation,
${faction.name.toLowerCase()} archer,
light leather armor, ${faction.colors} tunic,
bow falling, quiver spilling arrows,
death sequence: hit reaction, staggering, falling, dead on ground,
64x64 pixels per frame, 256x64 total image,
16-bit retro game style, visible pixels, hard edges,
limited 16 color palette, transparent background
`.trim()
    },

    // =========================================================================
    // ÉLÉPHANTS DE GUERRE
    // =========================================================================
    elephant: {
        base: (faction) => `
pixel art sprite sheet, game asset, single horizontal strip,
war elephant with wooden tower howdah,
${faction.colors} decorations,
`.trim(),

        idle: (faction, direction) => `
pixel art sprite sheet, game asset, single horizontal strip,
6 frames showing idle animation loop,
carthaginian war elephant, large african elephant,
wooden tower howdah on back with ${faction.colors} decorations,
2 small archer soldiers visible in tower,
mahout rider on elephant neck with hook,
elephant wearing bronze head armor plate,
decorated tusks with metal tips, ${faction.colors} fabric draping on sides,
elephant standing with subtle swaying movement,
ears flapping slightly, trunk moving,
${direction.view},
96x96 pixels per frame, 576x96 total image,
16-bit retro game style, visible pixels, hard edges,
limited 24 color palette, transparent background,
massive war beast, ancient military
`.trim(),

        walk: (faction, direction) => `
pixel art sprite sheet, game asset, single horizontal strip,
6 frames showing elephant walk cycle animation,
carthaginian war elephant, large african elephant,
wooden tower howdah with ${faction.colors} decorations,
2 archer soldiers in tower swaying with movement,
mahout on neck guiding elephant,
bronze head armor, decorated tusks, ${faction.colors} fabric draping,
elephant walking forward, heavy footstep animation,
trunk swinging, ears moving, tower swaying,
${direction.view},
96x96 pixels per frame, 576x96 total image,
16-bit retro game style, visible pixels, hard edges,
limited 24 color palette, transparent background,
seamless heavy walk loop
`.trim(),

        attack: (faction, direction) => `
pixel art sprite sheet, game asset, single horizontal strip,
6 frames showing elephant attack animation,
carthaginian war elephant, large african elephant,
wooden tower howdah, archers firing from tower,
mahout commanding attack,
elephant attack sequence: trumpet roar, rear up slightly,
charge forward, tusk attack, trample, recover,
trunk raised trumpeting, aggressive pose,
${direction.view},
96x96 pixels per frame, 576x96 total image,
16-bit retro game style, visible pixels, hard edges,
limited 24 color palette, transparent background,
war elephant combat animation
`.trim(),

        death: (faction) => `
pixel art sprite sheet, game asset, single horizontal strip,
4 frames showing elephant death animation,
war elephant collapsing,
tower falling apart, soldiers thrown off,
mahout falling, elephant going down,
death sequence: hit stagger, legs buckling, falling sideways, collapsed,
dramatic war elephant death,
96x96 pixels per frame, 384x96 total image,
16-bit retro game style, visible pixels, hard edges,
limited 24 color palette, transparent background
`.trim()
    }
};

// =============================================================================
// GÉNÉRATION DE LA LISTE COMPLÈTE DES SPRITES À CRÉER
// =============================================================================

/**
 * Génère la liste complète de tous les sprites à créer
 * @returns {Array} Liste des objets sprite avec prompt, filename, dimensions
 */
export function generateSpriteList() {
    const sprites = [];

    for (const [unitType, unitConfig] of Object.entries(UNIT_TYPES)) {
        const template = PROMPT_TEMPLATES[unitType];
        if (!template) continue;

        for (const [factionId, faction] of Object.entries(FACTIONS)) {
            // Éléphants uniquement pour Carthage et Eastern
            if (unitType === 'elephant' && !['carthage', 'eastern'].includes(factionId)) {
                continue;
            }

            for (const [animName, animConfig] of Object.entries(ANIMATIONS)) {
                // Death n'a pas de directions
                if (animName === 'death') {
                    const prompt = template.death(faction);
                    const frames = animConfig.frames;
                    const width = unitConfig.frameSize.width * frames;
                    const height = unitConfig.frameSize.height;

                    sprites.push({
                        id: `${unitType}_${factionId}_${animName}`,
                        unitType,
                        faction: factionId,
                        animation: animName,
                        direction: null,
                        prompt,
                        filename: `${unitType}/${factionId}/${animName}.png`,
                        width,
                        height,
                        frameWidth: unitConfig.frameSize.width,
                        frameHeight: unitConfig.frameSize.height,
                        frameCount: frames
                    });
                } else {
                    // Animations avec directions
                    for (const [dirCode, direction] of Object.entries(DIRECTIONS)) {
                        const promptFn = template[animName];
                        if (!promptFn) continue;

                        const prompt = promptFn(faction, direction);
                        const frames = animConfig.frames;
                        const width = unitConfig.frameSize.width * frames;
                        const height = unitConfig.frameSize.height;

                        sprites.push({
                            id: `${unitType}_${factionId}_${animName}_${dirCode}`,
                            unitType,
                            faction: factionId,
                            animation: animName,
                            direction: dirCode,
                            prompt,
                            filename: `${unitType}/${factionId}/${animName}_${dirCode}.png`,
                            width,
                            height,
                            frameWidth: unitConfig.frameSize.width,
                            frameHeight: unitConfig.frameSize.height,
                            frameCount: frames
                        });
                    }
                }
            }
        }
    }

    return sprites;
}

/**
 * Calcule les statistiques de génération
 * @returns {Object} Statistiques
 */
export function getGenerationStats() {
    const sprites = generateSpriteList();

    const stats = {
        totalSprites: sprites.length,
        byUnitType: {},
        byFaction: {},
        byAnimation: {},
        estimatedTime: null
    };

    for (const sprite of sprites) {
        // Par type d'unité
        stats.byUnitType[sprite.unitType] = (stats.byUnitType[sprite.unitType] || 0) + 1;

        // Par faction
        stats.byFaction[sprite.faction] = (stats.byFaction[sprite.faction] || 0) + 1;

        // Par animation
        stats.byAnimation[sprite.animation] = (stats.byAnimation[sprite.animation] || 0) + 1;
    }

    // Estimation du temps (30 secondes par sprite en moyenne)
    const secondsPerSprite = 30;
    const totalSeconds = sprites.length * secondsPerSprite * GLOBAL_CONFIG.variationsPerPrompt;
    stats.estimatedTime = {
        seconds: totalSeconds,
        minutes: Math.round(totalSeconds / 60),
        hours: Math.round(totalSeconds / 3600 * 10) / 10
    };

    return stats;
}

// =============================================================================
// EXPORT POUR UTILISATION DIRECTE
// =============================================================================

export default {
    GLOBAL_CONFIG,
    NEGATIVE_PROMPT,
    UNIT_TYPES,
    FACTIONS,
    DIRECTIONS,
    ANIMATIONS,
    PROMPT_TEMPLATES,
    generateSpriteList,
    getGenerationStats
};
