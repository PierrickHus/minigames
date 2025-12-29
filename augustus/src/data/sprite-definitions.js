// ==========================================
// DÉFINITIONS DES SPRITES D'ARMÉES (PIXEL ART)
// ==========================================

/**
 * Génère les sprites du légionnaire romain
 * Factions: julii, brutii, scipii, senate
 */
export function generateRomanSprites(canvas) {
    const ctx = canvas.getContext('2d');

    const colors = {
        skin: '#d4a574',
        armor: '#c0c0c0',
        armorDark: '#8a8a8a',
        tunic: '#8b0000',
        tunicLight: '#a52a2a',
        shield: '#8b4513',
        shieldDesign: '#ffd700',
        helmet: '#b8860b',
        helmetCrest: '#8b0000',
        cape: '#8b0000',
        capeShadow: '#5c0000',
        outline: '#2c1810',
        weapon: '#a0a0a0'
    };

    // Générer pour chaque direction
    for (let dir = 0; dir < 4; dir++) {
        // Frames idle (0-3)
        for (let frame = 0; frame < 4; frame++) {
            drawRomanFrame(ctx, frame * 32, dir * 32, colors, dir, frame, false);
        }
        // Frames walk (4-7)
        for (let frame = 0; frame < 4; frame++) {
            drawRomanFrame(ctx, (frame + 4) * 32, dir * 32, colors, dir, frame, true);
        }
    }
}

function drawRomanFrame(ctx, x, y, colors, direction, frame, isWalking) {
    // Animations
    const breathOffset = isWalking ? 0 : Math.sin(frame * Math.PI / 2) * 1;
    const walkOffset = isWalking ? Math.sin(frame * Math.PI / 2) * 2 : 0;
    const legOffset = isWalking ? (frame % 2 === 0 ? 2 : -2) : 0;
    const armOffset = isWalking ? (frame % 2 === 0 ? -1 : 1) : 0;
    const capeWave = Math.sin(frame * Math.PI / 2) * 2;
    const headTurn = !isWalking ? Math.sin(frame * Math.PI / 2) * 1 : 0;

    // Cape (derrière)
    if (direction !== 3) { // Pas visible de dos (direction N)
        ctx.fillStyle = colors.cape;
        ctx.fillRect(x + 11, y + 14 - breathOffset, 10, 10 + capeWave);
        ctx.fillStyle = colors.capeShadow;
        ctx.fillRect(x + 11, y + 20 - breathOffset, 10, 4 + capeWave);
    }

    // Casque
    ctx.fillStyle = colors.helmet;
    ctx.fillRect(x + 12 + headTurn, y + 4 - walkOffset, 8, 6);

    // Crête du casque
    ctx.fillStyle = colors.helmetCrest;
    ctx.fillRect(x + 14 + headTurn, y + 2 - walkOffset, 4, 3);

    // Visage
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 13 + headTurn, y + 8 - walkOffset, 6, 5);

    // Armure (torse)
    ctx.fillStyle = colors.armor;
    ctx.fillRect(x + 11, y + 12 - breathOffset, 10, 8);
    ctx.fillStyle = colors.armorDark;
    ctx.fillRect(x + 11, y + 16 - breathOffset, 10, 2);

    // Tunique (jupe)
    ctx.fillStyle = colors.tunic;
    ctx.fillRect(x + 12, y + 19 - breathOffset, 8, 4);

    // Jambes
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 12, y + 22 - walkOffset + legOffset, 3, 6);
    ctx.fillRect(x + 17, y + 22 - walkOffset - legOffset, 3, 6);

    // Sandales
    ctx.fillStyle = colors.outline;
    ctx.fillRect(x + 11, y + 27 - walkOffset + legOffset, 5, 2);
    ctx.fillRect(x + 16, y + 27 - walkOffset - legOffset, 5, 2);

    // Bouclier (selon direction)
    if (direction === 0 || direction === 1) { // S ou W
        ctx.fillStyle = colors.shield;
        ctx.fillRect(x + 4, y + 10 - breathOffset + armOffset, 6, 12);
        ctx.fillStyle = colors.shieldDesign;
        ctx.fillRect(x + 5, y + 12 - breathOffset + armOffset, 4, 2);
        ctx.fillRect(x + 5, y + 16 - breathOffset + armOffset, 4, 2);
    } else if (direction === 2) { // E
        ctx.fillStyle = colors.shield;
        ctx.fillRect(x + 22, y + 10 - breathOffset + armOffset, 6, 12);
        ctx.fillStyle = colors.shieldDesign;
        ctx.fillRect(x + 23, y + 12 - breathOffset + armOffset, 4, 2);
        ctx.fillRect(x + 23, y + 16 - breathOffset + armOffset, 4, 2);
    }

    // Pilum (lance)
    if (direction !== 1) { // Pas à gauche
        ctx.fillStyle = colors.weapon;
        ctx.fillRect(x + 23, y + 6 - walkOffset - armOffset, 2, 16);
        ctx.fillStyle = colors.outline;
        ctx.fillRect(x + 22, y + 4 - walkOffset - armOffset, 4, 3);
    }
}

/**
 * Génère les sprites du guerrier gaulois
 */
export function generateGaulSprites(canvas) {
    const ctx = canvas.getContext('2d');

    const colors = {
        skin: '#d4a574',
        hair: '#b8860b',
        tunic: '#2e7d32',
        tunicLight: '#4caf50',
        pants: '#5d4037',
        shield: '#4e342e',
        shieldDesign: '#ffd700',
        cape: '#ff9800',
        capeShadow: '#e65100',
        outline: '#2c1810',
        weapon: '#a0a0a0',
        mustache: '#8b6914'
    };

    for (let dir = 0; dir < 4; dir++) {
        for (let frame = 0; frame < 4; frame++) {
            drawGaulFrame(ctx, frame * 32, dir * 32, colors, dir, frame, false);
        }
        for (let frame = 0; frame < 4; frame++) {
            drawGaulFrame(ctx, (frame + 4) * 32, dir * 32, colors, dir, frame, true);
        }
    }
}

function drawGaulFrame(ctx, x, y, colors, direction, frame, isWalking) {
    const breathOffset = isWalking ? 0 : Math.sin(frame * Math.PI / 2) * 1;
    const walkOffset = isWalking ? Math.sin(frame * Math.PI / 2) * 2 : 0;
    const legOffset = isWalking ? (frame % 2 === 0 ? 2 : -2) : 0;
    const capeWave = Math.sin(frame * Math.PI / 2) * 3;
    const headTurn = !isWalking ? Math.sin(frame * Math.PI / 2) * 1 : 0;

    // Cape
    ctx.fillStyle = colors.cape;
    ctx.fillRect(x + 10, y + 12 - breathOffset, 12, 12 + capeWave);
    ctx.fillStyle = colors.capeShadow;
    ctx.fillRect(x + 10, y + 20 - breathOffset, 12, 4 + capeWave);

    // Cheveux longs
    ctx.fillStyle = colors.hair;
    ctx.fillRect(x + 11 + headTurn, y + 3 - walkOffset, 10, 8);
    ctx.fillRect(x + 10 + headTurn, y + 8 - walkOffset, 12, 4);

    // Visage
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 13 + headTurn, y + 6 - walkOffset, 6, 6);

    // Moustache
    ctx.fillStyle = colors.mustache;
    ctx.fillRect(x + 12 + headTurn, y + 10 - walkOffset, 8, 2);

    // Tunique
    ctx.fillStyle = colors.tunic;
    ctx.fillRect(x + 11, y + 12 - breathOffset, 10, 10);
    ctx.fillStyle = colors.tunicLight;
    ctx.fillRect(x + 13, y + 14 - breathOffset, 6, 2);

    // Pantalon
    ctx.fillStyle = colors.pants;
    ctx.fillRect(x + 12, y + 21 - walkOffset, 8, 6);

    // Jambes
    ctx.fillRect(x + 12, y + 22 - walkOffset + legOffset, 3, 6);
    ctx.fillRect(x + 17, y + 22 - walkOffset - legOffset, 3, 6);

    // Bottes
    ctx.fillStyle = colors.outline;
    ctx.fillRect(x + 11, y + 27 - walkOffset + legOffset, 5, 2);
    ctx.fillRect(x + 16, y + 27 - walkOffset - legOffset, 5, 2);

    // Bouclier rond
    if (direction === 0 || direction === 1) {
        ctx.fillStyle = colors.shield;
        ctx.beginPath();
        ctx.arc(x + 6, y + 16 - breathOffset, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colors.shieldDesign;
        ctx.beginPath();
        ctx.arc(x + 6, y + 16 - breathOffset, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Épée
    ctx.fillStyle = colors.weapon;
    ctx.fillRect(x + 24, y + 8 - walkOffset, 2, 14);
    ctx.fillRect(x + 22, y + 10 - walkOffset, 6, 2);
}

/**
 * Génère les sprites du soldat carthaginois
 */
export function generateCarthageSprites(canvas) {
    const ctx = canvas.getContext('2d');

    const colors = {
        skin: '#c49a6c',
        armor: '#6d4c41',
        armorLight: '#8d6e63',
        tunic: '#4a148c',
        tunicLight: '#7b1fa2',
        helmet: '#5d4037',
        cape: '#6d4c41',
        capeShadow: '#3e2723',
        outline: '#1a1a1a',
        weapon: '#8a8a8a',
        gold: '#ffd700'
    };

    for (let dir = 0; dir < 4; dir++) {
        for (let frame = 0; frame < 4; frame++) {
            drawCarthageFrame(ctx, frame * 32, dir * 32, colors, dir, frame, false);
        }
        for (let frame = 0; frame < 4; frame++) {
            drawCarthageFrame(ctx, (frame + 4) * 32, dir * 32, colors, dir, frame, true);
        }
    }
}

function drawCarthageFrame(ctx, x, y, colors, direction, frame, isWalking) {
    const breathOffset = isWalking ? 0 : Math.sin(frame * Math.PI / 2) * 1;
    const walkOffset = isWalking ? Math.sin(frame * Math.PI / 2) * 2 : 0;
    const legOffset = isWalking ? (frame % 2 === 0 ? 2 : -2) : 0;
    const capeWave = Math.sin(frame * Math.PI / 2) * 2;

    // Cape
    ctx.fillStyle = colors.cape;
    ctx.fillRect(x + 11, y + 14 - breathOffset, 10, 10 + capeWave);

    // Casque pointu
    ctx.fillStyle = colors.helmet;
    ctx.fillRect(x + 12, y + 5 - walkOffset, 8, 6);
    ctx.fillRect(x + 14, y + 2 - walkOffset, 4, 4);

    // Visage
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 13, y + 9 - walkOffset, 6, 4);

    // Armure
    ctx.fillStyle = colors.armor;
    ctx.fillRect(x + 11, y + 12 - breathOffset, 10, 8);
    ctx.fillStyle = colors.gold;
    ctx.fillRect(x + 14, y + 14 - breathOffset, 4, 2);

    // Tunique
    ctx.fillStyle = colors.tunic;
    ctx.fillRect(x + 12, y + 19 - breathOffset, 8, 4);

    // Jambes
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 12, y + 22 - walkOffset + legOffset, 3, 6);
    ctx.fillRect(x + 17, y + 22 - walkOffset - legOffset, 3, 6);

    // Sandales
    ctx.fillStyle = colors.outline;
    ctx.fillRect(x + 11, y + 27 - walkOffset + legOffset, 5, 2);
    ctx.fillRect(x + 16, y + 27 - walkOffset - legOffset, 5, 2);

    // Lance
    ctx.fillStyle = colors.weapon;
    ctx.fillRect(x + 24, y + 2 - walkOffset, 2, 24);
    ctx.fillStyle = colors.outline;
    ctx.fillRect(x + 23, y + 0 - walkOffset, 4, 4);
}

/**
 * Génère les sprites du phalangite macédonien
 */
export function generateMacedonSprites(canvas) {
    const ctx = canvas.getContext('2d');

    const colors = {
        skin: '#d4a574',
        armor: '#b8860b',
        armorDark: '#8b6914',
        tunic: '#4a148c',
        helmet: '#ffd700',
        helmetCrest: '#9c27b0',
        cape: '#9c27b0',
        capeShadow: '#6a1b9a',
        outline: '#1a1a1a',
        weapon: '#8a8a8a',
        shield: '#ffd700'
    };

    for (let dir = 0; dir < 4; dir++) {
        for (let frame = 0; frame < 4; frame++) {
            drawMacedonFrame(ctx, frame * 32, dir * 32, colors, dir, frame, false);
        }
        for (let frame = 0; frame < 4; frame++) {
            drawMacedonFrame(ctx, (frame + 4) * 32, dir * 32, colors, dir, frame, true);
        }
    }
}

function drawMacedonFrame(ctx, x, y, colors, direction, frame, isWalking) {
    const breathOffset = isWalking ? 0 : Math.sin(frame * Math.PI / 2) * 1;
    const walkOffset = isWalking ? Math.sin(frame * Math.PI / 2) * 2 : 0;
    const legOffset = isWalking ? (frame % 2 === 0 ? 2 : -2) : 0;
    const capeWave = Math.sin(frame * Math.PI / 2) * 2;

    // Cape violette
    ctx.fillStyle = colors.cape;
    ctx.fillRect(x + 11, y + 14 - breathOffset, 10, 12 + capeWave);
    ctx.fillStyle = colors.capeShadow;
    ctx.fillRect(x + 11, y + 22 - breathOffset, 10, 4 + capeWave);

    // Casque à crête
    ctx.fillStyle = colors.helmet;
    ctx.fillRect(x + 12, y + 4 - walkOffset, 8, 7);
    ctx.fillStyle = colors.helmetCrest;
    ctx.fillRect(x + 10, y + 3 - walkOffset, 12, 3);

    // Visage
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 13, y + 9 - walkOffset, 6, 4);

    // Armure dorée
    ctx.fillStyle = colors.armor;
    ctx.fillRect(x + 11, y + 12 - breathOffset, 10, 8);
    ctx.fillStyle = colors.armorDark;
    ctx.fillRect(x + 11, y + 16 - breathOffset, 10, 2);

    // Tunique
    ctx.fillStyle = colors.tunic;
    ctx.fillRect(x + 12, y + 19 - breathOffset, 8, 4);

    // Jambes
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 12, y + 22 - walkOffset + legOffset, 3, 6);
    ctx.fillRect(x + 17, y + 22 - walkOffset - legOffset, 3, 6);

    // Sandales
    ctx.fillStyle = colors.outline;
    ctx.fillRect(x + 11, y + 27 - walkOffset + legOffset, 5, 2);
    ctx.fillRect(x + 16, y + 27 - walkOffset - legOffset, 5, 2);

    // Sarisse (très longue lance)
    ctx.fillStyle = colors.weapon;
    ctx.fillRect(x + 24, y + 0, 2, 30);
    ctx.fillStyle = colors.outline;
    ctx.fillRect(x + 23, y + 0, 4, 3);

    // Petit bouclier rond
    if (direction === 0 || direction === 1) {
        ctx.fillStyle = colors.shield;
        ctx.beginPath();
        ctx.arc(x + 7, y + 15 - breathOffset, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Génère les sprites du cavalier/archer oriental
 * Factions: pontus, mauretania
 */
export function generateEasternSprites(canvas) {
    const ctx = canvas.getContext('2d');

    const colors = {
        skin: '#c49a6c',
        tunic: '#00695c',
        tunicLight: '#00897b',
        pants: '#3e2723',
        cape: '#795548',
        capeShadow: '#4e342e',
        helmet: '#5d4037',
        outline: '#1a1a1a',
        weapon: '#8a8a8a',
        bow: '#8b4513',
        gold: '#ffd700'
    };

    for (let dir = 0; dir < 4; dir++) {
        for (let frame = 0; frame < 4; frame++) {
            drawEasternFrame(ctx, frame * 32, dir * 32, colors, dir, frame, false);
        }
        for (let frame = 0; frame < 4; frame++) {
            drawEasternFrame(ctx, (frame + 4) * 32, dir * 32, colors, dir, frame, true);
        }
    }
}

function drawEasternFrame(ctx, x, y, colors, direction, frame, isWalking) {
    const breathOffset = isWalking ? 0 : Math.sin(frame * Math.PI / 2) * 1;
    const walkOffset = isWalking ? Math.sin(frame * Math.PI / 2) * 2 : 0;
    const legOffset = isWalking ? (frame % 2 === 0 ? 2 : -2) : 0;
    const capeWave = Math.sin(frame * Math.PI / 2) * 3;

    // Cape
    ctx.fillStyle = colors.cape;
    ctx.fillRect(x + 10, y + 12 - breathOffset, 12, 14 + capeWave);
    ctx.fillStyle = colors.capeShadow;
    ctx.fillRect(x + 10, y + 22 - breathOffset, 12, 4 + capeWave);

    // Turban/casque
    ctx.fillStyle = colors.helmet;
    ctx.fillRect(x + 11, y + 3 - walkOffset, 10, 7);
    ctx.fillStyle = colors.gold;
    ctx.fillRect(x + 14, y + 5 - walkOffset, 4, 2);

    // Visage
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 13, y + 8 - walkOffset, 6, 5);

    // Tunique
    ctx.fillStyle = colors.tunic;
    ctx.fillRect(x + 11, y + 12 - breathOffset, 10, 10);
    ctx.fillStyle = colors.tunicLight;
    ctx.fillRect(x + 13, y + 14 - breathOffset, 6, 2);

    // Pantalon
    ctx.fillStyle = colors.pants;
    ctx.fillRect(x + 12, y + 21 - walkOffset, 8, 6);

    // Jambes
    ctx.fillRect(x + 12, y + 22 - walkOffset + legOffset, 3, 6);
    ctx.fillRect(x + 17, y + 22 - walkOffset - legOffset, 3, 6);

    // Bottes
    ctx.fillStyle = colors.outline;
    ctx.fillRect(x + 11, y + 27 - walkOffset + legOffset, 5, 2);
    ctx.fillRect(x + 16, y + 27 - walkOffset - legOffset, 5, 2);

    // Arc
    ctx.fillStyle = colors.bow;
    ctx.fillRect(x + 24, y + 6 - walkOffset, 2, 12);
    ctx.fillRect(x + 22, y + 6 - walkOffset, 4, 2);
    ctx.fillRect(x + 22, y + 16 - walkOffset, 4, 2);
}

/**
 * Génère les sprites de la milice rebelle
 */
export function generateRebelSprites(canvas) {
    const ctx = canvas.getContext('2d');

    const colors = {
        skin: '#d4a574',
        tunic: '#616161',
        tunicLight: '#757575',
        pants: '#424242',
        cape: '#455a64',
        capeShadow: '#37474f',
        outline: '#1a1a1a',
        weapon: '#6d6d6d',
        hair: '#3e2723'
    };

    for (let dir = 0; dir < 4; dir++) {
        for (let frame = 0; frame < 4; frame++) {
            drawRebelFrame(ctx, frame * 32, dir * 32, colors, dir, frame, false);
        }
        for (let frame = 0; frame < 4; frame++) {
            drawRebelFrame(ctx, (frame + 4) * 32, dir * 32, colors, dir, frame, true);
        }
    }
}

function drawRebelFrame(ctx, x, y, colors, direction, frame, isWalking) {
    const breathOffset = isWalking ? 0 : Math.sin(frame * Math.PI / 2) * 1;
    const walkOffset = isWalking ? Math.sin(frame * Math.PI / 2) * 2 : 0;
    const legOffset = isWalking ? (frame % 2 === 0 ? 2 : -2) : 0;
    const capeWave = Math.sin(frame * Math.PI / 2) * 2;

    // Cape usée
    ctx.fillStyle = colors.cape;
    ctx.fillRect(x + 11, y + 14 - breathOffset, 10, 10 + capeWave);

    // Cheveux en désordre
    ctx.fillStyle = colors.hair;
    ctx.fillRect(x + 11, y + 4 - walkOffset, 10, 6);

    // Visage
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 13, y + 7 - walkOffset, 6, 5);

    // Tunique simple
    ctx.fillStyle = colors.tunic;
    ctx.fillRect(x + 11, y + 11 - breathOffset, 10, 10);

    // Pantalon
    ctx.fillStyle = colors.pants;
    ctx.fillRect(x + 12, y + 20 - walkOffset, 8, 6);

    // Jambes
    ctx.fillRect(x + 12, y + 22 - walkOffset + legOffset, 3, 6);
    ctx.fillRect(x + 17, y + 22 - walkOffset - legOffset, 3, 6);

    // Pieds nus ou sandales usées
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x + 12, y + 27 - walkOffset + legOffset, 4, 2);
    ctx.fillRect(x + 16, y + 27 - walkOffset - legOffset, 4, 2);

    // Bâton ou lance improvisée
    ctx.fillStyle = colors.weapon;
    ctx.fillRect(x + 24, y + 4 - walkOffset, 2, 20);
}
