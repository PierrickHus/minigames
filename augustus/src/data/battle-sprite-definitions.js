// ==========================================
// DÉFINITIONS DES SPRITES DE BATAILLE (32x32 PIXEL ART HAUTE RÉSOLUTION)
// ==========================================

/**
 * Configuration des animations de bataille
 */
export const BATTLE_ANIM_CONFIG = {
    FRAME_SIZE: 32,
    FRAME_HEIGHT: 40,  // Hauteur augmentée pour les éléments dépassants (crêtes, drapeaux)
    TOP_MARGIN: 8,     // Marge en haut pour les éléments qui dépassent
    DIRECTIONS: 8, // S, SW, W, NW, N, NE, E, SE
    DIRECTION_NAMES: ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'],

    ANIMATIONS: {
        // 6 frames par animation pour des mouvements plus fluides
        // Vitesses augmentées (ms par frame) pour ralentir les animations
        idle: { frames: 6, speed: 400, offset: 0 },      // Respiration lente
        walk: { frames: 6, speed: 120, offset: 6 },      // Marche fluide
        melee: { frames: 6, speed: 80, offset: 12 },     // Attaque dynamique
        ranged: { frames: 6, speed: 100, offset: 18 },   // Tir/lancer
        death: { frames: 4, speed: 200, offset: 0 }      // Séparé
    },

    // Taille sprite sheet principale: 24 frames × 8 directions (32x40 pixels)
    // 6 frames × 4 animations = 24 frames
    SHEET_WIDTH: 768, // 24 × 32
    SHEET_HEIGHT: 320, // 8 × 40

    // Sprite sheet de mort séparée: 4 frames × 8 directions
    DEATH_SHEET_WIDTH: 128, // 4 × 32
    DEATH_SHEET_HEIGHT: 320 // 8 × 40
};

/**
 * Palettes de couleurs par type de faction (étendue pour plus de détails)
 */
const PALETTES = {
    roman: {
        skin: '#d4a574',
        skinShadow: '#b8896a',
        skinHighlight: '#e8c4a0',
        armor: '#c0c0c0',
        armorDark: '#888888',
        armorHighlight: '#e0e0e0',
        tunic: '#8b0000',
        tunicDark: '#5c0000',
        shield: '#8b4513',
        shieldMetal: '#c0c0c0',
        shieldDecor: '#ffd700',
        helmet: '#b8860b',
        helmetHighlight: '#daa520',
        crest: '#8b0000', // Crête du leader
        crestHighlight: '#ff4040',
        weapon: '#a0a0a0',
        weaponHighlight: '#d0d0d0',
        cape: '#8b0000', // Cape du leader
        capeShadow: '#5c0000',
        flag: '#8b0000', // Drapeau
        flagDecor: '#ffd700',
        outline: '#2c1810'
    },
    gaul: {
        skin: '#d4a574',
        skinShadow: '#b8896a',
        skinHighlight: '#e8c4a0',
        armor: '#2e7d32',
        armorDark: '#1b5e20',
        armorHighlight: '#4caf50',
        tunic: '#5d4037',
        tunicDark: '#3e2723',
        shield: '#4e342e',
        shieldMetal: '#ffd700',
        shieldDecor: '#8bc34a',
        helmet: '#b8860b',
        helmetHighlight: '#daa520',
        crest: '#ffd700',
        crestHighlight: '#ffeb3b',
        weapon: '#a0a0a0',
        weaponHighlight: '#d0d0d0',
        cape: '#1b5e20',
        capeShadow: '#0d3b0d',
        flag: '#2e7d32',
        flagDecor: '#ffd700',
        outline: '#2c1810'
    },
    carthage: {
        skin: '#c4956a',
        skinShadow: '#a07850',
        skinHighlight: '#dab090',
        armor: '#4a148c',
        armorDark: '#311b92',
        armorHighlight: '#7b1fa2',
        tunic: '#f5f5f5',
        tunicDark: '#bdbdbd',
        shield: '#4a148c',
        shieldMetal: '#ffd700',
        shieldDecor: '#f5f5f5',
        helmet: '#b8860b',
        helmetHighlight: '#daa520',
        crest: '#f5f5f5',
        crestHighlight: '#ffffff',
        weapon: '#a0a0a0',
        weaponHighlight: '#d0d0d0',
        cape: '#4a148c',
        capeShadow: '#311b92',
        flag: '#4a148c',
        flagDecor: '#ffd700',
        outline: '#1a1a1a'
    },
    macedon: {
        skin: '#d4a574',
        skinShadow: '#b8896a',
        skinHighlight: '#e8c4a0',
        armor: '#1565c0',
        armorDark: '#0d47a1',
        armorHighlight: '#42a5f5',
        tunic: '#bbdefb',
        tunicDark: '#90caf9',
        shield: '#1565c0',
        shieldMetal: '#ffd700',
        shieldDecor: '#ffeb3b',
        helmet: '#c0c0c0',
        helmetHighlight: '#e0e0e0',
        crest: '#ffd700',
        crestHighlight: '#ffeb3b',
        weapon: '#a0a0a0',
        weaponHighlight: '#d0d0d0',
        cape: '#1565c0',
        capeShadow: '#0d47a1',
        flag: '#1565c0',
        flagDecor: '#ffd700',
        outline: '#1a1a1a'
    },
    eastern: {
        skin: '#c4956a',
        skinShadow: '#a07850',
        skinHighlight: '#dab090',
        armor: '#ff6f00',
        armorDark: '#e65100',
        armorHighlight: '#ffa726',
        tunic: '#fff8e1',
        tunicDark: '#ffecb3',
        shield: '#5d4037',
        shieldMetal: '#ffd700',
        shieldDecor: '#ff6f00',
        helmet: '#ffd700',
        helmetHighlight: '#ffeb3b',
        crest: '#ff6f00',
        crestHighlight: '#ffa726',
        weapon: '#a0a0a0',
        weaponHighlight: '#d0d0d0',
        cape: '#ff6f00',
        capeShadow: '#e65100',
        flag: '#ff6f00',
        flagDecor: '#ffd700',
        outline: '#2c1810'
    },
    rebel: {
        skin: '#d4a574',
        skinShadow: '#b8896a',
        skinHighlight: '#e8c4a0',
        armor: '#616161',
        armorDark: '#424242',
        armorHighlight: '#9e9e9e',
        tunic: '#795548',
        tunicDark: '#5d4037',
        shield: '#5d4037',
        shieldMetal: '#9e9e9e',
        shieldDecor: '#757575',
        helmet: '#757575',
        helmetHighlight: '#9e9e9e',
        crest: '#795548',
        crestHighlight: '#8d6e63',
        weapon: '#9e9e9e',
        weaponHighlight: '#bdbdbd',
        cape: '#5d4037',
        capeShadow: '#3e2723',
        flag: '#795548',
        flagDecor: '#9e9e9e',
        outline: '#2c1810'
    }
};

// ==========================================
// GÉNÉRATEURS DE SPRITES PRINCIPAUX (32x40)
// ==========================================

const SIZE = 32;      // Largeur des sprites
const HEIGHT = 40;    // Hauteur des sprites (avec marge pour crêtes/drapeaux)
const TOP_MARGIN = 8; // Marge en haut pour les éléments dépassants

/**
 * Génère le sprite sheet d'infanterie 32x40
 * @param {HTMLCanvasElement} canvas - Canvas 768×320 (24 frames × 8 directions)
 * @param {string} factionType - Type de faction (roman, gaul, etc.)
 * @param {string} role - 'soldier', 'leader', ou 'standardBearer'
 */
export function generateInfantrySprites(canvas, factionType = 'roman', role = 'soldier') {
    const ctx = canvas.getContext('2d');
    const palette = PALETTES[factionType] || PALETTES.roman;
    const FRAMES_PER_ANIM = 6;

    // Pour chaque direction (8)
    for (let dir = 0; dir < 8; dir++) {
        // Idle frames (0-5)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawInfantry32x40(ctx, frame * SIZE, dir * HEIGHT, palette, dir, frame, 'idle', role);
        }
        // Walk frames (6-11)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawInfantry32x40(ctx, (frame + FRAMES_PER_ANIM) * SIZE, dir * HEIGHT, palette, dir, frame, 'walk', role);
        }
        // Melee attack frames (12-17)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawInfantry32x40(ctx, (frame + FRAMES_PER_ANIM * 2) * SIZE, dir * HEIGHT, palette, dir, frame, 'melee', role);
        }
        // Ranged attack frames (18-23) - pour infanterie, c'est idle
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawInfantry32x40(ctx, (frame + FRAMES_PER_ANIM * 3) * SIZE, dir * HEIGHT, palette, dir, frame, 'idle', role);
        }
    }
}

/**
 * Dessine un fantassin 32×40 avec détails haute résolution
 * La marge TOP_MARGIN en haut permet d'afficher les crêtes et drapeaux
 * @param {string} role - 'soldier', 'leader', ou 'standardBearer'
 */
function drawInfantry32x40(ctx, x, y, palette, direction, frame, animState, role = 'soldier') {
    // Décalage vertical pour la marge en haut (les éléments sont dessinés 8px plus bas)
    const baseY = y + TOP_MARGIN;

    // Offsets d'animation pour 6 frames - mouvements plus fluides
    // Frame 0-5: cycle complet d'animation
    const breathOffset = animState === 'idle' ? [0, 0, -1, -1, 0, 0][frame] : 0;
    const walkOffset = animState === 'walk' ? [0, 1, 1, 0, -1, -1][frame] : 0;
    const walkLeg = animState === 'walk' ? Math.floor(frame / 3) : 0; // Alterne tous les 3 frames
    const attackOffset = animState === 'melee' ? [0, 1, 2, 3, 2, 1][frame] : 0;

    // Direction: 0=S, 1=SW, 2=W, 3=NW, 4=N, 5=NE, 6=E, 7=SE
    const facingRight = direction >= 5 || direction <= 1;
    const facingDown = direction <= 2 || direction === 7;
    const isSide = direction === 2 || direction === 6;
    const facingUp = direction >= 3 && direction <= 5;

    ctx.imageSmoothingEnabled = false;
    const yOff = breathOffset + walkOffset;

    // Ombre au sol (plus grande et détaillée)
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 16, baseY + 30, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // === CAPE DU LEADER (dessinée en premier, derrière) ===
    if (role === 'leader' && !facingUp) {
        ctx.fillStyle = palette.cape;
        ctx.fillRect(x + 10, baseY + 10 + yOff, 12, 14);
        ctx.fillStyle = palette.capeShadow;
        ctx.fillRect(x + 10, baseY + 10 + yOff, 2, 14);
        ctx.fillRect(x + 20, baseY + 10 + yOff, 2, 14);
        // Mouvement de cape
        if (animState === 'walk') {
            const capeWave = [0, 1, 2, 1][frame % 4];
            ctx.fillStyle = palette.cape;
            ctx.fillRect(x + 8 - capeWave, baseY + 20 + yOff, 2, 4);
            ctx.fillRect(x + 22 + capeWave, baseY + 20 + yOff, 2, 4);
        }
    }

    // === JAMBES (tunique) ===
    ctx.fillStyle = palette.tunic;
    if (animState === 'walk') {
        // Jambe gauche
        const legL = walkLeg === 0 ? 2 : 0;
        ctx.fillRect(x + 10 - legL, baseY + 20 + yOff, 4, 8 + legL);
        // Ombre jambe
        ctx.fillStyle = palette.tunicDark || palette.armorDark;
        ctx.fillRect(x + 10 - legL, baseY + 20 + yOff, 1, 8 + legL);

        // Jambe droite
        ctx.fillStyle = palette.tunic;
        const legR = walkLeg === 1 ? 2 : 0;
        ctx.fillRect(x + 18 + legR, baseY + 20 + yOff, 4, 8 + legR);
        ctx.fillStyle = palette.tunicDark || palette.armorDark;
        ctx.fillRect(x + 18 + legR, baseY + 20 + yOff, 1, 8 + legR);
    } else {
        ctx.fillRect(x + 10, baseY + 20 + yOff, 12, 8);
        // Ombrage
        ctx.fillStyle = palette.tunicDark || palette.armorDark;
        ctx.fillRect(x + 10, baseY + 20 + yOff, 2, 8);
        ctx.fillRect(x + 20, baseY + 20 + yOff, 2, 8);
    }

    // === PIEDS/SANDALES ===
    ctx.fillStyle = palette.armorDark;
    ctx.fillRect(x + 9, baseY + 27 + yOff, 5, 3);
    ctx.fillRect(x + 18, baseY + 27 + yOff, 5, 3);
    // Détails sandales
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(x + 10, baseY + 28 + yOff, 3, 1);
    ctx.fillRect(x + 19, baseY + 28 + yOff, 3, 1);

    // === CORPS (armure lorica segmentata) ===
    ctx.fillStyle = palette.armor;
    ctx.fillRect(x + 9, baseY + 10 + yOff, 14, 10);

    // Détails armure - bandes horizontales
    ctx.fillStyle = palette.armorDark;
    ctx.fillRect(x + 9, baseY + 12 + yOff, 14, 1);
    ctx.fillRect(x + 9, baseY + 15 + yOff, 14, 1);
    ctx.fillRect(x + 9, baseY + 18 + yOff, 14, 1);

    // Highlight armure
    ctx.fillStyle = palette.armorHighlight || '#e8e8e8';
    ctx.fillRect(x + 10, baseY + 10 + yOff, 12, 1);
    ctx.fillRect(x + 14, baseY + 11 + yOff, 4, 1);

    // === CEINTURE ===
    ctx.fillStyle = palette.armorDark;
    ctx.fillRect(x + 9, baseY + 19 + yOff, 14, 2);
    // Boucle de ceinture
    ctx.fillStyle = palette.shieldMetal;
    ctx.fillRect(x + 14, baseY + 19 + yOff, 4, 2);

    // === BOUCLIER (scutum romain détaillé) ===
    if (facingUp) {
        // Vue de dos - bouclier sur le dos
        ctx.fillStyle = palette.shield;
        ctx.fillRect(x + 6, baseY + 8 + yOff, 20, 14);
        ctx.fillStyle = palette.shieldMetal;
        ctx.fillRect(x + 14, baseY + 14 + yOff, 4, 4);
        // Bordure
        ctx.fillStyle = palette.shieldDecor || palette.shieldMetal;
        ctx.fillRect(x + 6, baseY + 8 + yOff, 20, 2);
    } else if (isSide) {
        const shieldX = direction === 2 ? x + 2 : x + 24;
        ctx.fillStyle = palette.shield;
        ctx.fillRect(shieldX, baseY + 6 + yOff, 6, 18);
        // Umbo (boss central)
        ctx.fillStyle = palette.shieldMetal;
        ctx.fillRect(shieldX + 2, baseY + 12 + yOff, 2, 4);
        // Bordure
        ctx.fillStyle = palette.shieldDecor || palette.shieldMetal;
        ctx.fillRect(shieldX, baseY + 6 + yOff, 6, 2);
    } else if (facingDown) {
        // Vue de face - bouclier à gauche
        ctx.fillStyle = palette.shield;
        ctx.fillRect(x + 2, baseY + 6 + yOff, 8, 18);
        // Umbo
        ctx.fillStyle = palette.shieldMetal;
        ctx.fillRect(x + 4, baseY + 12 + yOff, 4, 6);
        // Décoration (aigle pour romains)
        ctx.fillStyle = palette.shieldDecor || palette.shieldMetal;
        ctx.fillRect(x + 5, baseY + 8 + yOff, 2, 3);
        ctx.fillRect(x + 4, baseY + 9 + yOff, 4, 1);
        // Bordure
        ctx.fillRect(x + 2, baseY + 6 + yOff, 8, 2);
        ctx.fillRect(x + 2, baseY + 22 + yOff, 8, 2);
    }

    // === TÊTE ===
    ctx.fillStyle = palette.skin;
    ctx.fillRect(x + 12, baseY + 4 + yOff, 8, 7);
    // Ombrage visage
    ctx.fillStyle = palette.skinShadow || palette.armorDark;
    ctx.fillRect(x + 12, baseY + 4 + yOff, 1, 7);
    ctx.fillRect(x + 19, baseY + 4 + yOff, 1, 7);
    // Yeux
    if (facingDown || isSide) {
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(x + 13, baseY + 6 + yOff, 2, 2);
        ctx.fillRect(x + 17, baseY + 6 + yOff, 2, 2);
    }

    // === CASQUE (galea) ===
    ctx.fillStyle = palette.helmet;
    ctx.fillRect(x + 10, baseY + 1 + yOff, 12, 5);
    // Protège-joues
    ctx.fillRect(x + 10, baseY + 5 + yOff, 2, 4);
    ctx.fillRect(x + 20, baseY + 5 + yOff, 2, 4);
    // Highlight casque
    ctx.fillStyle = palette.helmetHighlight || palette.helmet;
    ctx.fillRect(x + 12, baseY + 1 + yOff, 8, 2);
    // Visière
    ctx.fillStyle = palette.armorDark;
    ctx.fillRect(x + 12, baseY + 4 + yOff, 8, 1);

    // === CRÊTE DU CASQUE (utilise baseY, pas y, car dans la marge haute) ===
    if (role === 'leader') {
        // Grande crête transversale (centurion) - peut aller dans la marge TOP_MARGIN
        ctx.fillStyle = palette.crest;
        ctx.fillRect(x + 8, baseY - 2 + yOff, 16, 4);
        ctx.fillStyle = palette.crestHighlight || palette.crest;
        ctx.fillRect(x + 10, baseY - 2 + yOff, 12, 2);
        // Plumes détaillées - dans la marge
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = i % 2 === 0 ? palette.crest : palette.crestHighlight;
            ctx.fillRect(x + 8 + i * 2, baseY - 3 + yOff, 2, 1);
        }
    } else {
        // Petite crête normale
        ctx.fillStyle = palette.tunic;
        ctx.fillRect(x + 14, baseY - 1 + yOff, 4, 2);
    }

    // === DRAPEAU (porte-drapeau) - peut aller dans la marge ===
    if (role === 'standardBearer') {
        // Hampe
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x + 26, baseY - 4 + yOff, 2, 28);
        // Drapeau avec animation
        const flagWave = animState === 'walk' ? [0, 1, 2, 1][frame % 4] : [0, 0, 1, 0][frame % 4];
        ctx.fillStyle = palette.flag;
        ctx.fillRect(x + 18 - flagWave, baseY - 6 + yOff, 10, 10);
        ctx.fillRect(x + 16 - flagWave * 2, baseY - 4 + yOff, 4, 6);
        // Décoration drapeau (aigle/symbole)
        ctx.fillStyle = palette.flagDecor;
        ctx.fillRect(x + 20 - flagWave, baseY - 4 + yOff, 6, 6);
        ctx.fillRect(x + 22 - flagWave, baseY - 2 + yOff, 2, 2);
        // Franges
        ctx.fillStyle = palette.flagDecor;
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(x + 16 - flagWave * 2 + i * 2, baseY + 4 + yOff, 1, 2);
        }
    }

    // === BRAS ET ARME ===
    ctx.fillStyle = palette.skin;
    if (animState === 'melee' && role !== 'standardBearer') {
        // Animation d'attaque
        if (facingRight) {
            // Bras droit tendu
            ctx.fillRect(x + 22, baseY + 10 + yOff, 4 + attackOffset, 4);
            // Épée gladius
            ctx.fillStyle = palette.weapon;
            ctx.fillRect(x + 26 + attackOffset, baseY + 6 + yOff, 2, 12);
            // Garde dorée
            ctx.fillStyle = palette.helmetHighlight || palette.helmet;
            ctx.fillRect(x + 24 + attackOffset, baseY + 10 + yOff, 4, 2);
            // Highlight lame
            ctx.fillStyle = palette.weaponHighlight || '#e0e0e0';
            ctx.fillRect(x + 27 + attackOffset, baseY + 6 + yOff, 1, 10);
        } else {
            ctx.fillRect(x + 6 - attackOffset, baseY + 10 + yOff, 4 + attackOffset, 4);
            ctx.fillStyle = palette.weapon;
            ctx.fillRect(x + 4 - attackOffset, baseY + 6 + yOff, 2, 12);
            ctx.fillStyle = palette.helmetHighlight || palette.helmet;
            ctx.fillRect(x + 4 - attackOffset, baseY + 10 + yOff, 4, 2);
            ctx.fillStyle = palette.weaponHighlight || '#e0e0e0';
            ctx.fillRect(x + 4 - attackOffset, baseY + 6 + yOff, 1, 10);
        }
    } else if (role !== 'standardBearer') {
        // Position repos
        if (!facingUp) {
            // Bras droit avec épée au repos
            ctx.fillRect(x + 22, baseY + 12 + yOff, 3, 4);
            // Épée
            ctx.fillStyle = palette.weapon;
            ctx.fillRect(x + 24, baseY + 8 + yOff, 2, 10);
            ctx.fillStyle = palette.weaponHighlight || '#e0e0e0';
            ctx.fillRect(x + 25, baseY + 8 + yOff, 1, 8);
        }
    }

    // === OUTLINE (optionnel pour plus de définition) ===
    ctx.fillStyle = palette.outline;
    // Contour tête
    ctx.fillRect(x + 10, baseY + yOff, 1, 1);
    ctx.fillRect(x + 21, baseY + yOff, 1, 1);
}

/**
 * Génère le sprite sheet d'archers/vélites 32x40
 */
export function generateArcherSprites(canvas, factionType = 'roman', role = 'soldier') {
    const ctx = canvas.getContext('2d');
    const palette = { ...PALETTES[factionType] || PALETTES.roman };
    palette.armor = palette.tunic; // Armure légère
    const FRAMES_PER_ANIM = 6;

    for (let dir = 0; dir < 8; dir++) {
        // Idle frames (0-5)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawArcher32x40(ctx, frame * SIZE, dir * HEIGHT, palette, dir, frame, 'idle', role);
        }
        // Walk frames (6-11)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawArcher32x40(ctx, (frame + FRAMES_PER_ANIM) * SIZE, dir * HEIGHT, palette, dir, frame, 'walk', role);
        }
        // Melee frames (12-17)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawArcher32x40(ctx, (frame + FRAMES_PER_ANIM * 2) * SIZE, dir * HEIGHT, palette, dir, frame, 'melee', role);
        }
        // Ranged frames (18-23)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawArcher32x40(ctx, (frame + FRAMES_PER_ANIM * 3) * SIZE, dir * HEIGHT, palette, dir, frame, 'ranged', role);
        }
    }
}

/**
 * Dessine un archer/vélite 32×40 avec détails
 * La marge TOP_MARGIN en haut permet d'afficher les crêtes et drapeaux
 */
function drawArcher32x40(ctx, x, y, palette, direction, frame, animState, role = 'soldier') {
    // Décalage vertical pour la marge en haut
    const baseY = y + TOP_MARGIN;

    // Offsets d'animation pour 6 frames - mouvements plus fluides
    const breathOffset = animState === 'idle' ? [0, 0, -1, -1, 0, 0][frame] : 0;
    const walkOffset = animState === 'walk' ? [0, 1, 1, 0, -1, -1][frame] : 0;
    const walkLeg = animState === 'walk' ? Math.floor(frame / 3) : 0;
    // Phase de lancer sur 6 frames: préparation, armé, lancer, relâché, retour1, retour2
    const throwPhase = animState === 'ranged' ? frame : 0;

    const facingRight = direction >= 5 || direction <= 1;
    const facingUp = direction >= 3 && direction <= 5;
    const facingDown = direction <= 2 || direction === 7;

    ctx.imageSmoothingEnabled = false;
    const yOff = breathOffset + walkOffset;

    // Ombre
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x + 16, baseY + 30, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // === JAMBES ===
    ctx.fillStyle = palette.tunic;
    if (animState === 'walk') {
        const legL = walkLeg === 0 ? 2 : 0;
        ctx.fillRect(x + 10 - legL, baseY + 20 + yOff, 4, 8 + legL);
        const legR = walkLeg === 1 ? 2 : 0;
        ctx.fillRect(x + 18 + legR, baseY + 20 + yOff, 4, 8 + legR);
    } else {
        ctx.fillRect(x + 10, baseY + 20 + yOff, 12, 8);
    }

    // Pieds (sandales légères)
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x + 9, baseY + 27 + yOff, 5, 3);
    ctx.fillRect(x + 18, baseY + 27 + yOff, 5, 3);

    // === CORPS (tunique légère) ===
    ctx.fillStyle = palette.armor;
    ctx.fillRect(x + 10, baseY + 10 + yOff, 12, 10);
    // Ombrage tunique
    ctx.fillStyle = palette.tunicDark || palette.armorDark;
    ctx.fillRect(x + 10, baseY + 10 + yOff, 2, 10);

    // === CARQUOIS/JAVELOTS SUR LE DOS ===
    ctx.fillStyle = '#5d4037';
    if (!facingDown) {
        ctx.fillRect(x + 22, baseY + 6 + yOff, 3, 16);
        // Javelots
        ctx.fillStyle = palette.weapon;
        ctx.fillRect(x + 23, baseY + 4 + yOff, 1, 4);
        ctx.fillRect(x + 24, baseY + 5 + yOff, 1, 4);
    }

    // === TÊTE ===
    ctx.fillStyle = palette.skin;
    ctx.fillRect(x + 12, baseY + 4 + yOff, 8, 7);
    // Ombrage
    ctx.fillStyle = palette.skinShadow || palette.armorDark;
    ctx.fillRect(x + 12, baseY + 4 + yOff, 1, 7);

    // === CASQUE LÉGER / CHEVEUX ===
    ctx.fillStyle = palette.armorDark;
    ctx.fillRect(x + 12, baseY + 2 + yOff, 8, 3);
    // Highlight
    ctx.fillStyle = palette.armorHighlight || palette.armor;
    ctx.fillRect(x + 14, baseY + 2 + yOff, 4, 1);

    // === CRÊTE DU LEADER (peut aller dans la marge TOP_MARGIN) ===
    if (role === 'leader') {
        ctx.fillStyle = palette.crest;
        ctx.fillRect(x + 10, baseY - 1 + yOff, 12, 4);
        ctx.fillStyle = palette.crestHighlight || palette.crest;
        ctx.fillRect(x + 12, baseY - 1 + yOff, 8, 2);
        // Plumes détaillées
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = i % 2 === 0 ? palette.crest : palette.crestHighlight;
            ctx.fillRect(x + 10 + i * 2, baseY - 2 + yOff, 2, 1);
        }
    }

    // === DRAPEAU (porte-drapeau) - peut aller dans la marge ===
    if (role === 'standardBearer') {
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x + 26, baseY - 4 + yOff, 2, 28);
        const flagWave = [0, 1, 2, 1, 0, 1][frame % 6];
        ctx.fillStyle = palette.flag;
        ctx.fillRect(x + 18 - flagWave, baseY - 6 + yOff, 10, 10);
        ctx.fillStyle = palette.flagDecor;
        ctx.fillRect(x + 20 - flagWave, baseY - 4 + yOff, 6, 6);
        // Franges
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(x + 18 - flagWave + i * 2, baseY + 2 + yOff, 1, 2);
        }
    }

    // === BRAS ET JAVELOT ===
    ctx.fillStyle = palette.skin;
    if (animState === 'ranged' && role !== 'standardBearer') {
        // Animation de lancer sur 6 frames: 0=repos, 1=armé, 2=max, 3=lancer, 4-5=retour
        const armExt = [0, 1, 2, 3, 1, 0][throwPhase];
        const hasJavelin = throwPhase < 4; // Le javelot est lancé à la frame 3
        if (facingRight) {
            ctx.fillRect(x + 20, baseY + 10 + yOff - armExt, 4 + armExt, 4);
            if (hasJavelin) {
                // Javelot
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(x + 24 + armExt, baseY + 6 + yOff - armExt, 2, 12);
                // Pointe
                ctx.fillStyle = palette.weapon;
                ctx.fillRect(x + 24 + armExt, baseY + 4 + yOff - armExt, 2, 4);
                ctx.fillStyle = palette.weaponHighlight || '#e0e0e0';
                ctx.fillRect(x + 25 + armExt, baseY + 4 + yOff - armExt, 1, 3);
            }
        } else {
            ctx.fillRect(x + 8 - armExt, baseY + 10 + yOff - armExt, 4 + armExt, 4);
            if (hasJavelin) {
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(x + 6 - armExt, baseY + 6 + yOff - armExt, 2, 12);
                ctx.fillStyle = palette.weapon;
                ctx.fillRect(x + 6 - armExt, baseY + 4 + yOff - armExt, 2, 4);
            }
        }
    } else if (role !== 'standardBearer') {
        // Position repos avec javelot
        if (!facingUp) {
            ctx.fillRect(x + 22, baseY + 12 + yOff, 3, 4);
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(x + 24, baseY + 4 + yOff, 2, 14);
            ctx.fillStyle = palette.weapon;
            ctx.fillRect(x + 24, baseY + 2 + yOff, 2, 4);
        }
    }
}

/**
 * Génère le sprite sheet de cavalerie 40×48
 */
export function generateCavalrySprites(canvas, factionType = 'roman', role = 'soldier') {
    const ctx = canvas.getContext('2d');
    const palette = PALETTES[factionType] || PALETTES.roman;

    // Cavalerie: 40×48 pixels (avec marge pour crêtes/drapeaux)
    const CAVALRY_WIDTH = 40;
    const CAVALRY_HEIGHT = 48;
    const FRAMES_PER_ANIM = 6;
    for (let dir = 0; dir < 8; dir++) {
        // Idle frames (0-5)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawCavalry40x48(ctx, frame * CAVALRY_WIDTH, dir * CAVALRY_HEIGHT, palette, dir, frame, 'idle', role);
        }
        // Walk/gallop frames (6-11)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawCavalry40x48(ctx, (frame + FRAMES_PER_ANIM) * CAVALRY_WIDTH, dir * CAVALRY_HEIGHT, palette, dir, frame, 'walk', role);
        }
        // Melee frames (12-17)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawCavalry40x48(ctx, (frame + FRAMES_PER_ANIM * 2) * CAVALRY_WIDTH, dir * CAVALRY_HEIGHT, palette, dir, frame, 'melee', role);
        }
        // Ranged frames (18-23) - pour cavalerie, c'est idle
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawCavalry40x48(ctx, (frame + FRAMES_PER_ANIM * 3) * CAVALRY_WIDTH, dir * CAVALRY_HEIGHT, palette, dir, frame, 'idle', role);
        }
    }
}

/**
 * Dessine un cavalier 40×48 avec détails
 * La marge de 16px en haut permet d'afficher les crêtes et drapeaux
 */
function drawCavalry40x48(ctx, x, y, palette, direction, frame, animState, role = 'soldier') {
    // Marge en haut pour cavalerie (48-32=16px)
    const CAVALRY_TOP_MARGIN = 16;
    const baseY = y + CAVALRY_TOP_MARGIN;

    // Animation de galop sur 6 frames pour mouvement plus fluide
    const gallopPhase = animState === 'walk' ? frame % 6 : 0;
    // Animation d'attaque sur 6 frames
    const attackOffset = animState === 'melee' ? [0, 1, 2, 3, 2, 1][frame] : 0;

    const facingRight = direction >= 5 || direction <= 1;
    const facingDown = direction <= 2 || direction === 7;

    ctx.imageSmoothingEnabled = false;

    // Ombre du cheval
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 20, baseY + 30, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // === CHEVAL - CORPS ===
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x + 8, baseY + 14, 24, 10);
    // Ombrage
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x + 8, baseY + 22, 24, 2);
    ctx.fillRect(x + 8, baseY + 14, 2, 10);
    // Highlight
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(x + 10, baseY + 14, 20, 2);

    // === JAMBES DU CHEVAL (animation galop sur 6 frames) ===
    ctx.fillStyle = '#5d4037';
    // Cycle de galop fluide: [avant-G, avant-D, arrière-G, arrière-D]
    const legOffsets = [
        [0, 1, 0, 1],   // Frame 0
        [1, 1, -1, 0],  // Frame 1
        [1, 0, -1, -1], // Frame 2
        [0, -1, 0, -1], // Frame 3
        [-1, -1, 1, 0], // Frame 4
        [-1, 0, 1, 1]   // Frame 5
    ];
    const offsets = legOffsets[gallopPhase] || legOffsets[0];
    // Jambe avant gauche
    ctx.fillRect(x + 8, baseY + 22 + offsets[0], 4, 6);
    // Jambe avant droite
    ctx.fillRect(x + 14, baseY + 22 + offsets[1], 4, 6);
    // Jambe arrière gauche
    ctx.fillRect(x + 24, baseY + 22 + offsets[2], 4, 6);
    // Jambe arrière droite
    ctx.fillRect(x + 28, baseY + 22 + offsets[3], 4, 6);
    // Sabots
    ctx.fillStyle = '#2c1810';
    ctx.fillRect(x + 8, baseY + 27 + offsets[0], 4, 2);
    ctx.fillRect(x + 14, baseY + 27 + offsets[1], 4, 2);
    ctx.fillRect(x + 24, baseY + 27 + offsets[2], 4, 2);
    ctx.fillRect(x + 28, baseY + 27 + offsets[3], 4, 2);

    // === TÊTE DU CHEVAL ===
    ctx.fillStyle = '#8b4513';
    if (facingRight) {
        ctx.fillRect(x + 30, baseY + 10, 8, 8);
        ctx.fillRect(x + 36, baseY + 12, 4, 6);
        // Naseau
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(x + 38, baseY + 16, 2, 2);
        // Œil
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 32, baseY + 12, 2, 2);
        // Crinière
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(x + 28, baseY + 8, 6, 4);
    } else {
        ctx.fillRect(x + 2, baseY + 10, 8, 8);
        ctx.fillRect(x, baseY + 12, 4, 6);
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(x, baseY + 16, 2, 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 6, baseY + 12, 2, 2);
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(x + 6, baseY + 8, 6, 4);
    }

    // === QUEUE ===
    ctx.fillStyle = '#2c1810';
    const tailWave = animState === 'walk' ? [0, 1, 2, 1, 0, 1][frame % 6] : 0;
    if (facingRight) {
        ctx.fillRect(x + 4 - tailWave, baseY + 14, 4, 6);
    } else {
        ctx.fillRect(x + 32 + tailWave, baseY + 14, 4, 6);
    }

    // === SELLE ET TAPIS ===
    ctx.fillStyle = palette.tunic;
    ctx.fillRect(x + 14, baseY + 10, 12, 6);
    ctx.fillStyle = palette.tunicDark || palette.armorDark;
    ctx.fillRect(x + 14, baseY + 14, 12, 2);
    // Décoration selle
    ctx.fillStyle = palette.shieldDecor || palette.shieldMetal;
    ctx.fillRect(x + 18, baseY + 10, 4, 2);

    // === CAVALIER - JAMBES ===
    ctx.fillStyle = palette.tunic;
    ctx.fillRect(x + 12, baseY + 12, 4, 8);
    ctx.fillRect(x + 24, baseY + 12, 4, 8);

    // === CAVALIER - CORPS ===
    ctx.fillStyle = palette.armor;
    ctx.fillRect(x + 14, baseY + 4, 12, 10);
    // Détails armure
    ctx.fillStyle = palette.armorDark;
    ctx.fillRect(x + 14, baseY + 7, 12, 1);
    ctx.fillRect(x + 14, baseY + 10, 12, 1);
    // Highlight
    ctx.fillStyle = palette.armorHighlight || '#e0e0e0';
    ctx.fillRect(x + 16, baseY + 4, 8, 2);

    // === CAVALIER - TÊTE ===
    ctx.fillStyle = palette.skin;
    ctx.fillRect(x + 16, baseY + 0, 8, 6);
    // Yeux
    if (facingDown) {
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(x + 17, baseY + 2, 2, 2);
        ctx.fillRect(x + 21, baseY + 2, 2, 2);
    }

    // === CASQUE ===
    ctx.fillStyle = palette.helmet;
    ctx.fillRect(x + 14, baseY - 2, 12, 4);
    // Highlight
    ctx.fillStyle = palette.helmetHighlight || palette.helmet;
    ctx.fillRect(x + 16, baseY - 2, 8, 2);

    // === CRÊTE DU LEADER (peut aller dans la marge) ===
    if (role === 'leader') {
        ctx.fillStyle = palette.crest;
        ctx.fillRect(x + 12, baseY - 5, 16, 4);
        ctx.fillStyle = palette.crestHighlight || palette.crest;
        ctx.fillRect(x + 14, baseY - 5, 12, 2);
        // Plumes détaillées
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = i % 2 === 0 ? palette.crest : palette.crestHighlight;
            ctx.fillRect(x + 12 + i * 2, baseY - 6, 2, 1);
        }
    }

    // === DRAPEAU (porte-drapeau) - peut aller dans la marge ===
    if (role === 'standardBearer') {
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x + 32, baseY - 12, 2, 32);
        const flagWave = [0, 1, 2, 1, 0, 1][frame % 6];
        ctx.fillStyle = palette.flag;
        ctx.fillRect(x + 22 - flagWave, baseY - 14, 12, 12);
        ctx.fillStyle = palette.flagDecor;
        ctx.fillRect(x + 24 - flagWave, baseY - 12, 8, 8);
        // Franges
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(x + 22 - flagWave + i * 2, baseY - 4, 1, 2);
        }
    }

    // === LANCE/ÉPÉE ===
    ctx.fillStyle = palette.weapon;
    if (animState === 'melee' && role !== 'standardBearer') {
        if (facingRight) {
            // Lance en attaque
            ctx.fillRect(x + 26 + attackOffset, baseY - 4, 12 + attackOffset, 2);
            ctx.fillRect(x + 26 + attackOffset, baseY + 2, 2, 6);
            // Pointe
            ctx.fillStyle = palette.weaponHighlight || '#e0e0e0';
            ctx.fillRect(x + 36 + attackOffset, baseY - 4, 4, 2);
        } else {
            ctx.fillRect(x + 2 - attackOffset, baseY - 4, 12 + attackOffset, 2);
            ctx.fillRect(x + 12 - attackOffset, baseY + 2, 2, 6);
            ctx.fillStyle = palette.weaponHighlight || '#e0e0e0';
            ctx.fillRect(x - attackOffset, baseY - 4, 4, 2);
        }
    } else if (role !== 'standardBearer') {
        // Lance au repos
        ctx.fillRect(x + 26, baseY - 6, 2, 16);
        ctx.fillStyle = palette.weaponHighlight || '#e0e0e0';
        ctx.fillRect(x + 26, baseY - 8, 2, 4);
    }

    // === BOUCLIER ===
    if (facingDown && role !== 'standardBearer') {
        ctx.fillStyle = palette.shield;
        ctx.fillRect(x + 8, baseY + 2, 6, 10);
        ctx.fillStyle = palette.shieldMetal;
        ctx.fillRect(x + 9, baseY + 5, 4, 4);
        ctx.fillStyle = palette.shieldDecor || palette.shieldMetal;
        ctx.fillRect(x + 8, baseY + 2, 6, 2);
    }
}

/**
 * Génère le sprite sheet d'éléphant 48×56
 */
export function generateElephantSprites(canvas, factionType = 'carthage', role = 'soldier') {
    const ctx = canvas.getContext('2d');
    const palette = PALETTES[factionType] || PALETTES.carthage;

    // Éléphant: 48×56 pixels (avec marge pour crêtes/drapeaux)
    const ELEPHANT_WIDTH = 48;
    const ELEPHANT_HEIGHT = 56;
    const FRAMES_PER_ANIM = 6;
    for (let dir = 0; dir < 8; dir++) {
        // Idle frames (0-5)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawElephant48x56(ctx, frame * ELEPHANT_WIDTH, dir * ELEPHANT_HEIGHT, palette, dir, frame, 'idle', role);
        }
        // Walk frames (6-11)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawElephant48x56(ctx, (frame + FRAMES_PER_ANIM) * ELEPHANT_WIDTH, dir * ELEPHANT_HEIGHT, palette, dir, frame, 'walk', role);
        }
        // Melee frames (12-17)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawElephant48x56(ctx, (frame + FRAMES_PER_ANIM * 2) * ELEPHANT_WIDTH, dir * ELEPHANT_HEIGHT, palette, dir, frame, 'melee', role);
        }
        // Ranged frames (18-23) - pour éléphant, c'est idle (les archers tirent)
        for (let frame = 0; frame < FRAMES_PER_ANIM; frame++) {
            drawElephant48x56(ctx, (frame + FRAMES_PER_ANIM * 3) * ELEPHANT_WIDTH, dir * ELEPHANT_HEIGHT, palette, dir, frame, 'idle', role);
        }
    }
}

/**
 * Dessine un éléphant de guerre 48×56 avec détails
 * La marge de 16px en haut permet d'afficher les crêtes et drapeaux
 */
function drawElephant48x56(ctx, x, y, palette, direction, frame, animState, role = 'soldier') {
    // Marge en haut pour éléphant (56-40=16px)
    const ELEPHANT_TOP_MARGIN = 16;
    const baseY = y + ELEPHANT_TOP_MARGIN;

    // Animation de marche sur 6 frames
    const walkPhase = animState === 'walk' ? frame % 6 : 0;
    // Mouvement de trompe fluide sur 6 frames
    const trunkSwing = Math.sin(frame * Math.PI / 2) * 2;

    const facingRight = direction >= 5 || direction <= 1;

    ctx.imageSmoothingEnabled = false;

    // Ombre
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + 24, baseY + 38, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // === CORPS DE L'ÉLÉPHANT ===
    ctx.fillStyle = '#808080';
    ctx.fillRect(x + 10, baseY + 14, 28, 16);
    // Ombrage
    ctx.fillStyle = '#606060';
    ctx.fillRect(x + 10, baseY + 26, 28, 4);
    ctx.fillRect(x + 10, baseY + 14, 4, 16);
    // Highlight
    ctx.fillStyle = '#909090';
    ctx.fillRect(x + 14, baseY + 14, 20, 4);

    // === JAMBES (animation sur 6 frames) ===
    ctx.fillStyle = '#707070';
    // Marche lente et lourde de l'éléphant sur 6 frames
    const legOffsets = [
        [0, 1, 0, 1],   // Frame 0
        [1, 1, -1, 0],  // Frame 1
        [1, 0, -1, -1], // Frame 2
        [0, -1, 0, -1], // Frame 3
        [-1, -1, 1, 0], // Frame 4
        [-1, 0, 1, 1]   // Frame 5
    ];
    const offsets = legOffsets[walkPhase] || legOffsets[0];
    // Jambes avant
    ctx.fillRect(x + 12, baseY + 28 + offsets[0], 6, 10);
    ctx.fillRect(x + 20, baseY + 28 + offsets[1], 6, 10);
    // Jambes arrière
    ctx.fillRect(x + 28, baseY + 28 + offsets[2], 6, 10);
    // Pieds
    ctx.fillStyle = '#505050';
    ctx.fillRect(x + 12, baseY + 36 + offsets[0], 6, 3);
    ctx.fillRect(x + 20, baseY + 36 + offsets[1], 6, 3);
    ctx.fillRect(x + 28, baseY + 36 + offsets[2], 6, 3);

    // === TÊTE ===
    ctx.fillStyle = '#707070';
    if (facingRight) {
        ctx.fillRect(x + 34, baseY + 10, 10, 12);
        // Trompe
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 42, baseY + 16 + trunkSwing, 4, 14);
        ctx.fillRect(x + 44, baseY + 28 + trunkSwing, 4, 4);
        // Oreilles
        ctx.fillStyle = '#787878';
        ctx.fillRect(x + 32, baseY + 8, 4, 10);
        // Œil
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(x + 36, baseY + 12, 3, 3);
    } else {
        ctx.fillRect(x + 4, baseY + 10, 10, 12);
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 2, baseY + 16 + trunkSwing, 4, 14);
        ctx.fillRect(x, baseY + 28 + trunkSwing, 4, 4);
        ctx.fillStyle = '#787878';
        ctx.fillRect(x + 12, baseY + 8, 4, 10);
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(x + 9, baseY + 12, 3, 3);
    }

    // === DÉFENSES ===
    ctx.fillStyle = '#f5f5dc';
    if (facingRight) {
        ctx.fillRect(x + 42, baseY + 12, 6, 3);
        ctx.fillStyle = '#e8e8d0';
        ctx.fillRect(x + 46, baseY + 12, 2, 3);
    } else {
        ctx.fillRect(x, baseY + 12, 6, 3);
        ctx.fillStyle = '#e8e8d0';
        ctx.fillRect(x, baseY + 12, 2, 3);
    }

    // === COUVERTURE DÉCORATIVE ===
    ctx.fillStyle = palette.tunic;
    ctx.fillRect(x + 12, baseY + 12, 24, 6);
    ctx.fillStyle = palette.tunicDark || palette.armorDark;
    ctx.fillRect(x + 12, baseY + 16, 24, 2);
    // Franges
    ctx.fillStyle = palette.shieldDecor || palette.shieldMetal;
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(x + 14 + i * 4, baseY + 18, 2, 3);
    }

    // === TOUR (HOWDAH) ===
    ctx.fillStyle = palette.armor;
    ctx.fillRect(x + 14, baseY + 2, 20, 12);
    // Crénelures
    ctx.fillStyle = palette.armorDark;
    ctx.fillRect(x + 14, baseY + 2, 4, 4);
    ctx.fillRect(x + 22, baseY + 2, 4, 4);
    ctx.fillRect(x + 30, baseY + 2, 4, 4);
    // Highlight
    ctx.fillStyle = palette.armorHighlight || '#c0c0c0';
    ctx.fillRect(x + 16, baseY + 4, 16, 2);

    // === ARCHERS DANS LA TOUR ===
    // Archer 1
    ctx.fillStyle = palette.skin;
    ctx.fillRect(x + 18, baseY + 0, 4, 4);
    ctx.fillStyle = palette.helmet;
    ctx.fillRect(x + 18, baseY - 1, 4, 2);
    // Archer 2
    ctx.fillStyle = palette.skin;
    ctx.fillRect(x + 26, baseY + 0, 4, 4);
    ctx.fillStyle = palette.helmet;
    ctx.fillRect(x + 26, baseY - 1, 4, 2);

    // === CRÊTE DU LEADER (peut aller dans la marge) ===
    if (role === 'leader') {
        ctx.fillStyle = palette.crest;
        ctx.fillRect(x + 18, baseY - 6, 12, 6);
        ctx.fillStyle = palette.crestHighlight || palette.crest;
        ctx.fillRect(x + 20, baseY - 6, 8, 3);
        // Plumes détaillées
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = i % 2 === 0 ? palette.crest : palette.crestHighlight;
            ctx.fillRect(x + 18 + i * 2, baseY - 7, 2, 1);
        }
    }

    // === DRAPEAU (peut aller dans la marge) ===
    if (role === 'standardBearer') {
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x + 36, baseY - 12, 2, 24);
        const flagWave = [0, 1, 2, 1, 0, 1][frame % 6];
        ctx.fillStyle = palette.flag;
        ctx.fillRect(x + 26 - flagWave, baseY - 14, 12, 12);
        ctx.fillStyle = palette.flagDecor;
        ctx.fillRect(x + 28 - flagWave, baseY - 12, 8, 8);
        // Franges
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(x + 26 - flagWave + i * 2, baseY - 4, 1, 2);
        }
    }
}

/**
 * Génère le sprite sheet de mort (32x32)
 * @param {HTMLCanvasElement} canvas - Canvas pour les sprites de mort
 * @param {string} unitType - 'infantry', 'archer', 'cavalry', 'elephant'
 * @param {string} factionType - Type de faction
 * @param {string} role - 'soldier', 'leader', 'standardBearer'
 */
export function generateDeathSprites(canvas, unitType = 'infantry', factionType = 'roman', role = 'soldier') {
    const ctx = canvas.getContext('2d');
    const palette = PALETTES[factionType] || PALETTES.roman;

    // Dimensions selon le type
    const dimensions = {
        infantry: { width: 32, height: 32 },
        ranged: { width: 32, height: 32 },
        skirmisher: { width: 32, height: 32 },
        cavalry: { width: 40, height: 32 },
        elephant: { width: 48, height: 40 }
    };

    const dim = dimensions[unitType] || dimensions.infantry;

    for (let dir = 0; dir < 8; dir++) {
        for (let frame = 0; frame < 4; frame++) {
            const fx = frame * dim.width;
            const fy = dir * dim.height;

            if (unitType === 'infantry' || unitType === 'ranged' || unitType === 'skirmisher') {
                drawDeathInfantry32x32(ctx, fx, fy, palette, dir, frame, role);
            } else if (unitType === 'cavalry') {
                drawDeathCavalry40x32(ctx, fx, fy, palette, dir, frame, role);
            } else if (unitType === 'elephant') {
                drawDeathElephant48x40(ctx, fx, fy, palette, dir, frame, role);
            }
        }
    }
}

/**
 * Animation de mort pour fantassin 32x32
 */
function drawDeathInfantry32x32(ctx, x, y, palette, direction, frame, role = 'soldier') {
    ctx.imageSmoothingEnabled = false;

    // Frame 0: debout, touché
    // Frame 1: tombe
    // Frame 2: au sol
    // Frame 3: corps final

    if (frame === 0) {
        // Touché - recule légèrement
        // Ombre
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 30, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corps
        ctx.fillStyle = palette.armor;
        ctx.fillRect(x + 12, y + 14, 8, 10);
        ctx.fillStyle = palette.armorDark;
        ctx.fillRect(x + 12, y + 18, 8, 2);

        // Tête penchée
        ctx.fillStyle = palette.skin;
        ctx.fillRect(x + 13, y + 8, 6, 6);
        ctx.fillStyle = palette.helmet;
        ctx.fillRect(x + 12, y + 6, 8, 4);

        // Jambes
        ctx.fillStyle = palette.tunic;
        ctx.fillRect(x + 12, y + 24, 4, 6);
        ctx.fillRect(x + 16, y + 24, 4, 6);

        // Arme tombant
        ctx.fillStyle = palette.weapon;
        ctx.fillRect(x + 20, y + 12, 2, 14);

        // Leader: crête
        if (role === 'leader') {
            ctx.fillStyle = palette.crest;
            ctx.fillRect(x + 10, y + 4, 12, 3);
        }

    } else if (frame === 1) {
        // Tombe - penché à 45°
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 18, y + 28, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corps penché
        ctx.fillStyle = palette.armor;
        ctx.fillRect(x + 10, y + 16, 10, 8);
        ctx.fillStyle = palette.armorDark;
        ctx.fillRect(x + 10, y + 20, 10, 2);

        // Tête
        ctx.fillStyle = palette.skin;
        ctx.fillRect(x + 8, y + 12, 6, 5);
        ctx.fillStyle = palette.helmet;
        ctx.fillRect(x + 7, y + 10, 8, 4);

        // Jambes
        ctx.fillStyle = palette.tunic;
        ctx.fillRect(x + 16, y + 22, 6, 6);
        ctx.fillRect(x + 20, y + 24, 4, 5);

        // Arme au sol
        ctx.fillStyle = palette.weapon;
        ctx.fillRect(x + 22, y + 20, 8, 2);

        // Leader: crête tombant
        if (role === 'leader') {
            ctx.fillStyle = palette.crest;
            ctx.fillRect(x + 5, y + 8, 10, 3);
        }

    } else {
        // Au sol - horizontal (frames 2-3)
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 28, 12, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corps allongé
        ctx.fillStyle = palette.armor;
        ctx.fillRect(x + 6, y + 22, 14, 6);
        ctx.fillStyle = palette.armorDark;
        ctx.fillRect(x + 6, y + 26, 14, 2);

        // Tête au sol
        ctx.fillStyle = palette.skin;
        ctx.fillRect(x + 20, y + 22, 6, 5);
        ctx.fillStyle = palette.helmet;
        ctx.fillRect(x + 24, y + 22, 4, 4);

        // Jambes
        ctx.fillStyle = palette.tunic;
        ctx.fillRect(x + 2, y + 23, 6, 4);

        // Arme au sol
        ctx.fillStyle = palette.weapon;
        ctx.fillRect(x + 4, y + 18, 12, 2);
        ctx.fillStyle = palette.weaponHighlight || '#d0d0d0';
        ctx.fillRect(x + 4, y + 18, 3, 2);

        // Bouclier tombé
        ctx.fillStyle = palette.shield;
        ctx.fillRect(x + 20, y + 16, 8, 6);
        ctx.fillStyle = palette.shieldMetal;
        ctx.fillRect(x + 22, y + 17, 4, 4);

        // Leader: crête au sol
        if (role === 'leader') {
            ctx.fillStyle = palette.crest;
            ctx.fillRect(x + 26, y + 20, 4, 6);
        }

        // Porte-drapeau: drapeau tombé
        if (role === 'standardBearer') {
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(x + 2, y + 12, 2, 14);
            ctx.fillStyle = palette.flag;
            ctx.fillRect(x + 4, y + 10, 10, 8);
            ctx.fillStyle = palette.flagDecor;
            ctx.fillRect(x + 6, y + 12, 6, 4);
        }
    }
}

/**
 * Animation de mort pour cavalier 40x32
 */
function drawDeathCavalry40x32(ctx, x, y, palette, direction, frame, role = 'soldier') {
    ctx.imageSmoothingEnabled = false;

    if (frame === 0) {
        // Cheval touché, cavalier encore dessus
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 30, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cheval penché
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x + 6, y + 16, 24, 10);
        ctx.fillStyle = '#6d3610';
        ctx.fillRect(x + 6, y + 22, 24, 4);

        // Jambes du cheval pliées
        ctx.fillStyle = '#7a3d14';
        ctx.fillRect(x + 8, y + 24, 4, 6);
        ctx.fillRect(x + 24, y + 24, 4, 6);

        // Cavalier
        ctx.fillStyle = palette.armor;
        ctx.fillRect(x + 14, y + 6, 10, 10);
        ctx.fillStyle = palette.skin;
        ctx.fillRect(x + 16, y + 2, 6, 5);
        ctx.fillStyle = palette.helmet;
        ctx.fillRect(x + 15, y + 0, 8, 4);

        // Leader: crête
        if (role === 'leader') {
            ctx.fillStyle = palette.crest;
            ctx.fillRect(x + 13, y - 2, 12, 3);
        }

    } else if (frame === 1) {
        // Cheval tombe, cavalier éjecté
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 28, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cheval qui tombe
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x + 4, y + 18, 26, 8);
        ctx.fillStyle = '#6d3610';
        ctx.fillRect(x + 4, y + 24, 26, 4);

        // Jambes du cheval en l'air
        ctx.fillStyle = '#7a3d14';
        ctx.fillRect(x + 6, y + 26, 4, 4);
        ctx.fillRect(x + 12, y + 26, 4, 4);
        ctx.fillRect(x + 22, y + 26, 4, 4);

        // Cavalier tombant
        ctx.fillStyle = palette.armor;
        ctx.fillRect(x + 28, y + 10, 8, 8);
        ctx.fillStyle = palette.skin;
        ctx.fillRect(x + 30, y + 6, 5, 4);
        ctx.fillStyle = palette.helmet;
        ctx.fillRect(x + 30, y + 4, 6, 3);

    } else {
        // Au sol (frames 2-3)
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 28, 18, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cheval au sol
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x + 2, y + 22, 28, 6);
        ctx.fillStyle = '#6d3610';
        ctx.fillRect(x + 2, y + 26, 28, 3);

        // Tête du cheval
        ctx.fillStyle = '#7a3d14';
        ctx.fillRect(x + 28, y + 20, 8, 6);

        // Jambes
        ctx.fillStyle = '#7a3d14';
        ctx.fillRect(x + 4, y + 28, 4, 2);
        ctx.fillRect(x + 10, y + 28, 4, 2);
        ctx.fillRect(x + 20, y + 28, 4, 2);

        // Cavalier au sol
        ctx.fillStyle = palette.armor;
        ctx.fillRect(x + 4, y + 16, 12, 5);
        ctx.fillStyle = palette.skin;
        ctx.fillRect(x + 16, y + 16, 5, 4);
        ctx.fillStyle = palette.helmet;
        ctx.fillRect(x + 20, y + 16, 4, 3);

        // Arme au sol
        ctx.fillStyle = palette.weapon;
        ctx.fillRect(x + 24, y + 14, 12, 2);

        // Leader: crête au sol
        if (role === 'leader') {
            ctx.fillStyle = palette.crest;
            ctx.fillRect(x + 22, y + 14, 6, 4);
        }

        // Porte-drapeau: drapeau tombé
        if (role === 'standardBearer') {
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(x + 32, y + 8, 2, 16);
            ctx.fillStyle = palette.flag;
            ctx.fillRect(x + 24, y + 6, 10, 8);
        }
    }
}

/**
 * Animation de mort pour éléphant 48x40
 */
function drawDeathElephant48x40(ctx, x, y, palette, direction, frame, role = 'soldier') {
    ctx.imageSmoothingEnabled = false;

    if (frame === 0) {
        // Éléphant touché
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 24, y + 38, 20, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corps
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 8, y + 16, 28, 14);
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 8, y + 26, 28, 4);

        // Jambes pliées
        ctx.fillStyle = '#707070';
        ctx.fillRect(x + 10, y + 28, 6, 10);
        ctx.fillRect(x + 28, y + 28, 6, 10);

        // Tête
        ctx.fillStyle = '#707070';
        ctx.fillRect(x + 34, y + 14, 10, 10);

        // Tour inclinée
        ctx.fillStyle = palette.armor;
        ctx.fillRect(x + 12, y + 6, 20, 10);

    } else if (frame === 1) {
        // Éléphant qui tombe
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 24, y + 36, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corps penché
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 6, y + 20, 30, 12);
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 6, y + 28, 30, 4);

        // Jambes
        ctx.fillStyle = '#707070';
        ctx.fillRect(x + 8, y + 30, 6, 8);
        ctx.fillRect(x + 16, y + 32, 6, 6);
        ctx.fillRect(x + 28, y + 30, 6, 8);

        // Tête
        ctx.fillStyle = '#707070';
        ctx.fillRect(x + 36, y + 18, 10, 10);
        // Trompe
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 42, y + 26, 4, 8);

        // Tour qui tombe
        ctx.fillStyle = palette.armor;
        ctx.fillRect(x + 8, y + 10, 22, 10);

    } else {
        // Au sol (frames 2-3)
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x + 24, y + 36, 22, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corps au sol
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 4, y + 26, 34, 10);
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 4, y + 32, 34, 4);

        // Jambes
        ctx.fillStyle = '#707070';
        ctx.fillRect(x + 6, y + 36, 6, 3);
        ctx.fillRect(x + 14, y + 36, 6, 3);
        ctx.fillRect(x + 26, y + 36, 6, 3);

        // Tête au sol
        ctx.fillStyle = '#707070';
        ctx.fillRect(x + 36, y + 26, 10, 8);
        // Trompe
        ctx.fillStyle = '#606060';
        ctx.fillRect(x + 44, y + 30, 4, 6);

        // Défense
        ctx.fillStyle = '#f5f5dc';
        ctx.fillRect(x + 44, y + 28, 4, 2);

        // Tour effondrée
        ctx.fillStyle = palette.armor;
        ctx.fillRect(x + 2, y + 18, 24, 8);
        ctx.fillStyle = palette.armorDark;
        ctx.fillRect(x + 2, y + 22, 24, 4);

        // Leader: crête tombée
        if (role === 'leader') {
            ctx.fillStyle = palette.crest;
            ctx.fillRect(x + 26, y + 16, 8, 4);
        }

        // Porte-drapeau: drapeau tombé
        if (role === 'standardBearer') {
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(x + 30, y + 10, 2, 14);
            ctx.fillStyle = palette.flag;
            ctx.fillRect(x + 32, y + 8, 10, 8);
        }
    }
}

// ==========================================
// EXPORT PAR TYPE D'UNITÉ
// ==========================================

/**
 * Mapping type d'unité vers générateur
 */
export const SPRITE_GENERATORS = {
    infantry: generateInfantrySprites,
    ranged: generateArcherSprites,
    skirmisher: generateArcherSprites,
    cavalry: generateCavalrySprites,
    elephant: generateElephantSprites
};

/**
 * Dimensions des sprites par type
 * Hauteur augmentée à 40px pour accommoder les crêtes et drapeaux
 * - infantry/ranged/skirmisher: 32x40, sheet 768x320 (24 frames × 8 directions)
 * - cavalry: 40x48, sheet 960x384 (24 frames × 8 directions)
 * - elephant: 48x56, sheet 1152x448 (24 frames × 8 directions)
 */
export const SPRITE_DIMENSIONS = {
    infantry: { width: 32, height: 40, sheetWidth: 768, sheetHeight: 320 },
    ranged: { width: 32, height: 40, sheetWidth: 768, sheetHeight: 320 },
    skirmisher: { width: 32, height: 40, sheetWidth: 768, sheetHeight: 320 },
    cavalry: { width: 40, height: 48, sheetWidth: 960, sheetHeight: 384 },
    elephant: { width: 48, height: 56, sheetWidth: 1152, sheetHeight: 448 }
};

/**
 * Dimensions des sprite sheets de mort (même hauteur que les sprites normaux)
 */
export const DEATH_SPRITE_DIMENSIONS = {
    infantry: { width: 32, height: 40, sheetWidth: 128, sheetHeight: 320 },
    ranged: { width: 32, height: 40, sheetWidth: 128, sheetHeight: 320 },
    skirmisher: { width: 32, height: 40, sheetWidth: 128, sheetHeight: 320 },
    cavalry: { width: 40, height: 48, sheetWidth: 160, sheetHeight: 384 },
    elephant: { width: 48, height: 56, sheetWidth: 192, sheetHeight: 448 }
};
