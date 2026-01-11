/**
 * Le Baiser de la Reine - Jeu de collecte de diamants avec mode DOOM
 * Le joueur controle un roi qui doit collecter 500 diamants puis survivre 5 minutes
 */

// ============== ELEMENTS DU DOM ==============
const menuScreen = document.getElementById('menu-screen');
const guideScreen = document.getElementById('guide-screen');
const newGameBtn = document.getElementById('new-game-btn');
const loadBtn = document.getElementById('load-btn');
const guideBtn = document.getElementById('guide-btn');
const backBtn = document.getElementById('back-btn');
const saveBtn = document.getElementById('save-btn');
const king = document.getElementById('king');
const kingHitbox = document.getElementById('king-hitbox');
const queen = document.getElementById('queen');
const house = document.getElementById('house');
const container = document.getElementById('game-container');
const scoreValue = document.getElementById('score-value');
const scoreDisplay = document.getElementById('score');
const victoryScreen = document.getElementById('victory-screen');
const replayBtn = document.getElementById('replay-btn');
const music = document.getElementById('medieval-music');
const doomMusicElement = document.getElementById('doom-music');
const musicBtn = document.getElementById('music-btn');
const difficultyDisplay = document.getElementById('difficulty');

// Elements DOOM
const doomTimer = document.getElementById('doom-timer');
const doomLives = document.getElementById('doom-lives');
const doomWarning = document.getElementById('doom-warning');
const doomAnnouncement = document.getElementById('doom-announcement');
const patternIndicator = document.getElementById('pattern-indicator');
const doomGameover = document.getElementById('doom-gameover');
const doomVictory = document.getElementById('doom-victory');
const doomRetryBtn = document.getElementById('doom-retry-btn');
const doomMenuBtn = document.getElementById('doom-menu-btn');
const doomVictoryBtn = document.getElementById('doom-victory-btn');
const doomVictoryLives = document.getElementById('doom-victory-lives');

// ============== ETAT DU JEU ==============
let gameStarted = false;
let kingX = window.innerWidth / 2 - 25;
let kingY = window.innerHeight / 2 - 25;
let score = 0;
const speed = 8;
let diamonds = [];
let musicPlaying = false;

// Position du chateau (centre de l'ecran)
const castleX = window.innerWidth / 2;
const castleY = window.innerHeight / 2;

// Reine - position et mouvement
let queenX = Math.random() * (window.innerWidth - 50);
let queenY = Math.random() * (window.innerHeight - 50);
let queenHitCooldown = false;

// Systeme bullet hell
let projectiles = [];
let currentDifficulty = 'easy';
let lastProjectileTime = 0;

// Hitbox du roi - style Touhou (petite hitbox centree)
const HITBOX_SIZE = 14;
const HITBOX_VERTICAL_OFFSET = 15;

/**
 * Met a jour la position visuelle de la hitbox du roi
 */
function updateKingHitbox() {
    if (!kingHitbox) return;

    const kingWidth = king.offsetWidth || 50;
    const kingHeight = king.offsetHeight || 50;
    const centerX = kingWidth / 2;
    const centerY = kingHeight / 2 + HITBOX_VERTICAL_OFFSET;
    const offsetX = centerX - HITBOX_SIZE / 2;
    const offsetY = centerY - HITBOX_SIZE / 2;

    kingHitbox.style.left = (kingX + offsetX) + 'px';
    kingHitbox.style.top = (kingY + offsetY) + 'px';
    kingHitbox.style.width = HITBOX_SIZE + 'px';
    kingHitbox.style.height = HITBOX_SIZE + 'px';
}

// ============== MODE DOOM ==============
let doomMode = false;
let doomTransitionActive = false; // Invincibilite pendant la transition
let doomLivesCount = 3;
let doomTimeRemaining = 300; // 5 minutes en secondes
let doomTimerInterval = null;
let currentPattern = 'chase';
let patternStartTime = 0;
const PATTERN_DURATION = 5000; // Change de pattern toutes les 5 secondes - plus intense
const DOOM_TRANSITION_DURATION = 4000; // Duree de l'animation de transition en ms
let queenTargetX = 0;
let queenTargetY = 0;
let spiralAngle = 0;

// Patterns disponibles en mode DOOM
const DOOM_PATTERNS = [
    'castle_siege',    // Reste au chateau et tire des spirales
    'corners_dance',   // Se teleporte entre les coins
    'stalker',         // Suit le joueur sans le toucher
    'cross_fire',      // Se positionne sur les points cardinaux
    'orbit',           // Tourne autour du chateau
    'hell_rain',       // Traverse le haut de l'ecran
    'diamond_hunt',    // Alterne haut/bas avec double spirale
    'flower_bloom',    // Motif de fleur en expansion
    'laser_cage',      // Cage de lasers convergents
    'chaos_spiral',    // Spirale chaotique imprévisible
    'wall_of_death',   // Murs de projectiles horizontaux
    'shotgun_burst',   // Rafales de shotgun rapides
    'galaxy_spin'      // Galaxie tournante multi-couches
];

// Coins de l'ecran pour le pattern corners_dance
const corners = [
    { x: 100, y: 100 },
    { x: window.innerWidth - 150, y: 100 },
    { x: window.innerWidth - 150, y: window.innerHeight - 150 },
    { x: 100, y: window.innerHeight - 150 }
];
let currentCorner = 0;

// Points cardinaux pour cross_fire
const cardinalPoints = [
    { x: castleX - 200, y: castleY },
    { x: castleX + 200, y: castleY },
    { x: castleX, y: castleY - 200 },
    { x: castleX, y: castleY + 200 }
];
let currentCardinal = 0;

// ============== TOUCHES ==============
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    z: false, q: false, s: false, d: false,
    Z: false, Q: false, S: false, D: false
};

// Controle souris
let mouseX = null;
let mouseY = null;
let useMouseControl = false;

// ============== BULLES DE DIALOGUE ==============
const kingBubble = document.getElementById('king-bubble');
const queenBubble = document.getElementById('queen-bubble');

const kingPhrases = [
    "Je vais tous les attraper ! 💎",
    "Ces diamants sont à moi !",
    "Encore un ! Magnifique !",
    "Je suis le plus riche !",
    "Quel trésor ! ✨"
];

const queenPhrases = [
    "Tu ne m'échapperas pas ! 😈",
    "Tes diamants seront miens !",
    "Attention à toi, Roi !",
    "Je vais t'attraper !"
];

const demonPhrases = [
    "JE VAIS TE DÉVORER ! 👿",
    "TON ÂME EST À MOI !",
    "TU NE SURVIVRAS PAS !",
    "MEURS, MISÉRABLE ROI !",
    "L'ENFER T'ATTEND ! 🔥",
    "AHAHAHA ! 💀",
    "SOUFFRE !",
    "PERSONNE NE M'ÉCHAPPE !"
];

const kingDoomPhrases = [
    "À l'aide ! 😱",
    "C'est un cauchemar !",
    "Je dois survivre !",
    "Plus que quelques minutes !",
    "Ne pas abandonner !"
];

let lastBubbleTime = 0;
const bubbleInterval = 5000;

// ============== GESTION DU MENU ==============

newGameBtn.addEventListener('click', () => {
    menuScreen.style.display = 'none';
    container.style.display = 'block';
    gameStarted = true;
    startGame();
});

guideBtn.addEventListener('click', () => {
    guideScreen.style.display = 'flex';
});

backBtn.addEventListener('click', () => {
    guideScreen.style.display = 'none';
});

saveBtn.addEventListener('click', () => {
    if (doomMode) {
        saveBtn.textContent = '❌ Pas en DOOM!';
        setTimeout(() => saveBtn.textContent = '💾 Sauvegarder', 1500);
        return;
    }
    const saveData = { score, kingX, kingY, queenX, queenY };
    localStorage.setItem('roiDesDiamants', JSON.stringify(saveData));
    saveBtn.textContent = '✅ Sauvegardé!';
    setTimeout(() => saveBtn.textContent = '💾 Sauvegarder', 1500);
});

loadBtn.addEventListener('click', () => {
    const saveData = localStorage.getItem('roiDesDiamants');
    if (saveData) {
        const data = JSON.parse(saveData);
        menuScreen.style.display = 'none';
        container.style.display = 'block';
        gameStarted = true;
        score = data.score;
        kingX = data.kingX;
        kingY = data.kingY;
        queenX = data.queenX;
        queenY = data.queenY;
        scoreValue.textContent = score + ' / 500';
        king.style.left = kingX + 'px';
        king.style.top = kingY + 'px';
        queen.style.left = queenX + 'px';
        queen.style.top = queenY + 'px';
        diamonds.forEach(d => d.element.remove());
        diamonds = [];
        for (let i = 0; i < 15; i++) createDiamond();
        startMusic();
    } else {
        alert('Aucune sauvegarde trouvée !');
    }
});

// Boutons DOOM
doomRetryBtn.addEventListener('click', () => {
    doomGameover.style.display = 'none';

    // Nettoyer l'état précédent
    clearInterval(doomTimerInterval);
    clearProjectiles();
    doomMode = false;

    // Remettre le container visible
    container.style.display = 'block';

    // Repositionner le roi au centre
    kingX = window.innerWidth / 2 - 25;
    kingY = window.innerHeight / 2 - 25;
    king.style.left = kingX + 'px';
    king.style.top = kingY + 'px';

    // Repositionner la reine au chateau
    queenX = castleX - 35;
    queenY = castleY - 35;
    queen.style.left = queenX + 'px';
    queen.style.top = queenY + 'px';

    // Remettre les vies à 3
    doomLivesCount = 3;
    updateLivesDisplay();

    // Remettre le timer à 5 minutes
    doomTimeRemaining = 300;
    updateDoomTimer();

    // Relancer le jeu et le mode DOOM
    gameStarted = true;
    score = 400;
    startDoomMode();
});

doomMenuBtn.addEventListener('click', () => {
    doomGameover.style.display = 'none';
    exitDoomMode();
    menuScreen.style.display = 'flex';
});

doomVictoryBtn.addEventListener('click', () => {
    doomVictory.style.display = 'none';
    exitDoomMode();
    menuScreen.style.display = 'flex';
});

// ============== CONTROLES ==============

container.addEventListener('mousemove', (e) => {
    if (gameStarted) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        useMouseControl = true;
    }
});

container.addEventListener('mouseleave', () => {
    useMouseControl = false;
});

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// ============== DIAMANTS ==============

function createDiamond() {
    const diamond = document.createElement('div');
    diamond.className = 'diamond';
    diamond.textContent = '💎';
    const x = Math.random() * (window.innerWidth - 50);
    const y = Math.random() * (window.innerHeight - 100) + 50;
    diamond.style.left = x + 'px';
    diamond.style.top = y + 'px';
    container.appendChild(diamond);
    diamonds.push({ element: diamond, x, y });
}

function checkCollision(diamondObj) {
    return kingX < diamondObj.x + 35 &&
           kingX + 50 > diamondObj.x &&
           kingY < diamondObj.y + 35 &&
           kingY + 50 > diamondObj.y;
}

// ============== REINE / DEMON ==============

function checkQueenCollision() {
    const hitboxReduction = doomMode ? 10 : 0;
    return kingX < queenX + 50 - hitboxReduction &&
           kingX + 50 > queenX + hitboxReduction &&
           kingY < queenY + 50 - hitboxReduction &&
           kingY + 50 > queenY + hitboxReduction;
}

/**
 * Deplace la reine selon le mode actuel
 */
function moveQueen() {
    if (doomMode) {
        moveDemonQueen();
    } else {
        moveNormalQueen();
    }

    queen.style.left = queenX + 'px';
    queen.style.top = queenY + 'px';
}

/**
 * Deplacement normal de la reine (suit le joueur)
 */
function moveNormalQueen() {
    const dx = kingX - queenX;
    const dy = kingY - queenY;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

    if (distance > 5) {
        const config = getDifficultyConfig();
        queenX += (dx / distance) * config.queenSpeed;
        queenY += (dy / distance) * config.queenSpeed;
    }

    queenX = Math.max(0, Math.min(window.innerWidth - 50, queenX));
    queenY = Math.max(0, Math.min(window.innerHeight - 50, queenY));
}

/**
 * Deplacement du demon selon le pattern actuel
 */
function moveDemonQueen() {
    const now = Date.now();

    // Change de pattern periodiquement
    if (now - patternStartTime > PATTERN_DURATION) {
        selectNewPattern();
    }

    switch (currentPattern) {
        case 'castle_siege':
            moveToCastle();
            break;
        case 'corners_dance':
            moveToCorners();
            break;
        case 'stalker':
            moveStalker();
            break;
        case 'cross_fire':
            moveCrossFire();
            break;
        case 'orbit':
            moveOrbit();
            break;
        case 'hell_rain':
            moveHellRain();
            break;
        case 'diamond_hunt':
            moveDiamondHunt();
            break;
        case 'flower_bloom':
            moveToCastle();
            break;
        case 'laser_cage':
            moveOrbit();
            break;
        case 'chaos_spiral':
            moveChaos();
            break;
        case 'wall_of_death':
            moveHellRain();
            break;
        case 'shotgun_burst':
            moveStalker();
            break;
        case 'galaxy_spin':
            moveToCastle();
            break;
        default:
            moveStalker();
    }

    queenX = Math.max(0, Math.min(window.innerWidth - 70, queenX));
    queenY = Math.max(0, Math.min(window.innerHeight - 70, queenY));
}

/**
 * Pattern: Chaos - Mouvement erratique imprevisible
 */
function moveChaos() {
    const now = Date.now();
    // Mouvement chaotique basé sur plusieurs sinusoides
    queenX = castleX - 35 + Math.sin(now / 200) * 150 + Math.cos(now / 300) * 100;
    queenY = castleY - 35 + Math.cos(now / 250) * 150 + Math.sin(now / 350) * 80;
}

/**
 * Selectionne un nouveau pattern aleatoire
 */
function selectNewPattern() {
    const oldPattern = currentPattern;
    do {
        currentPattern = DOOM_PATTERNS[Math.floor(Math.random() * DOOM_PATTERNS.length)];
    } while (currentPattern === oldPattern);

    patternStartTime = Date.now();
    currentCorner = 0;
    currentCardinal = 0;
    spiralAngle = 0;

    updatePatternIndicator();

    // Annonce du nouveau pattern avec bulle
    const patternNames = {
        'castle_siege': '🏰 SIÈGE DU CHÂTEAU !',
        'corners_dance': '📐 DANSE DES COINS !',
        'stalker': '👁️ TRAQUE !',
        'cross_fire': '✝️ FEU CROISÉ !',
        'orbit': '🌀 ORBITE !',
        'hell_rain': '🌧️ PLUIE INFERNALE !',
        'diamond_hunt': '💎 CHASSE AU DIAMANT !',
        'flower_bloom': '🌸 FLORAISON MORTELLE !',
        'laser_cage': '⚡ CAGE DE LASERS !',
        'chaos_spiral': '🌪️ CHAOS TOTAL !',
        'wall_of_death': '🧱 MUR DE LA MORT !',
        'shotgun_burst': '💥 RAFALE SHOTGUN !',
        'galaxy_spin': '🌌 GALAXIE INFERNALE !'
    };
    showBubble(queenBubble, patternNames[currentPattern] || currentPattern, 2000);
}

/**
 * Met a jour l'indicateur de pattern
 */
function updatePatternIndicator() {
    const patternNames = {
        'castle_siege': '🏰 Siège',
        'corners_dance': '📐 Coins',
        'stalker': '👁️ Traque',
        'cross_fire': '✝️ Croisé',
        'orbit': '🌀 Orbite',
        'hell_rain': '🌧️ Pluie',
        'diamond_hunt': '💎 Diamant',
        'flower_bloom': '🌸 Fleur',
        'laser_cage': '⚡ Cage',
        'chaos_spiral': '🌪️ Chaos',
        'wall_of_death': '🧱 Mur',
        'shotgun_burst': '💥 Shotgun',
        'galaxy_spin': '🌌 Galaxie'
    };
    patternIndicator.textContent = patternNames[currentPattern] || currentPattern;
}

// ============== PATTERNS DE MOUVEMENT ==============

/**
 * Pattern: Castle Siege - La reine va au chateau et tire des spirales
 */
function moveToCastle() {
    const targetX = castleX - 35;
    const targetY = castleY - 35;
    const dx = targetX - queenX;
    const dy = targetY - queenY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    if (dist > 10) {
        queenX += (dx / dist) * 8;
        queenY += (dy / dist) * 8;
    }
}

/**
 * Pattern: Corners Dance - Teleportation/dash entre les 4 coins
 */
function moveToCorners() {
    const target = corners[currentCorner];
    const dx = target.x - queenX;
    const dy = target.y - queenY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    if (dist > 20) {
        // Dash rapide vers le coin
        queen.classList.add('queen-dashing');
        queenX += (dx / dist) * 15;
        queenY += (dy / dist) * 15;
    } else {
        queen.classList.remove('queen-dashing');
        // Atteint le coin, passer au suivant apres un delai
        if (Date.now() % 1000 < 50) {
            currentCorner = (currentCorner + 1) % corners.length;
        }
    }
}

/**
 * Pattern: Stalker - Suit le joueur mais garde une distance
 */
function moveStalker() {
    const dx = kingX - queenX;
    const dy = kingY - queenY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const targetDist = 150;

    if (dist > targetDist + 20) {
        queenX += (dx / dist) * 5;
        queenY += (dy / dist) * 5;
    } else if (dist < targetDist - 20) {
        queenX -= (dx / dist) * 4;
        queenY -= (dy / dist) * 4;
    }
}

/**
 * Pattern: Cross Fire - Se positionne aux points cardinaux du chateau
 */
function moveCrossFire() {
    const target = cardinalPoints[currentCardinal];
    const dx = target.x - queenX;
    const dy = target.y - queenY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    if (dist > 15) {
        queenX += (dx / dist) * 10;
        queenY += (dy / dist) * 10;
    } else {
        if (Date.now() % 800 < 50) {
            currentCardinal = (currentCardinal + 1) % cardinalPoints.length;
        }
    }
}

/**
 * Pattern: Orbit - Tourne autour du chateau
 */
function moveOrbit() {
    const radius = 200;
    spiralAngle += 0.03;

    queenTargetX = castleX + Math.cos(spiralAngle) * radius - 35;
    queenTargetY = castleY + Math.sin(spiralAngle) * radius - 35;

    const dx = queenTargetX - queenX;
    const dy = queenTargetY - queenY;

    queenX += dx * 0.1;
    queenY += dy * 0.1;
}

/**
 * Pattern: Hell Rain - Traverse le haut de l'ecran
 */
function moveHellRain() {
    const targetY = 80;
    const dy = targetY - queenY;

    if (Math.abs(dy) > 10) {
        queenY += dy * 0.1;
    }

    // Mouvement horizontal
    queenX += Math.sin(Date.now() / 200) * 8;

    if (queenX < 50) queenX = 50;
    if (queenX > window.innerWidth - 100) queenX = window.innerWidth - 100;
}

/**
 * Pattern: Diamond Hunt - Alterne entre haut et bas
 */
function moveDiamondHunt() {
    const phase = Math.floor(Date.now() / 2000) % 2;
    let targetY;

    if (phase === 0) {
        targetY = 100;
    } else {
        targetY = window.innerHeight - 150;
    }

    const dx = kingX - queenX;
    const dy = targetY - queenY;

    queenX += dx * 0.02;
    queenY += dy * 0.08;
}

// ============== SYSTEME DE DIFFICULTE ==============

// Limite maximale de projectiles pour eviter les problemes de performance
const MAX_PROJECTILES = 150;

function getDifficultyConfig() {
    if (doomMode) {
        return {
            name: '👿 DOOM OF HELL 👿',
            class: 'diff-doom',
            queenClass: 'queen-demon',
            fireRate: 350,  // Tir rapide mais pas excessif
            projectileSpeed: 6,
            projectileCount: 24,
            patterns: ['doom_spiral', 'doom_burst', 'doom_hell', 'doom_rain', 'doom_cross'],
            queenSpeed: 0,
            projectileEmoji: '👿'
        };
    }

    if (score < 50) {
        return {
            name: 'Facile', class: 'diff-easy', queenClass: '',
            fireRate: 2000, projectileSpeed: 2, projectileCount: 1,
            patterns: ['single'], queenSpeed: 2.5, projectileEmoji: '💗'
        };
    } else if (score < 150) {
        return {
            name: 'Moyen', class: 'diff-medium', queenClass: '',
            fireRate: 1500, projectileSpeed: 3, projectileCount: 2,
            patterns: ['single', 'double'], queenSpeed: 3, projectileEmoji: '💜'
        };
    } else if (score < 300) {
        return {
            name: 'Difficile', class: 'diff-hard', queenClass: 'queen-rage',
            fireRate: 1000, projectileSpeed: 4, projectileCount: 3,
            patterns: ['single', 'double', 'triple', 'spread'], queenSpeed: 3.5, projectileEmoji: '🔥'
        };
    } else {
        return {
            name: 'EXTREME', class: 'diff-extreme', queenClass: 'queen-rage',
            fireRate: 600, projectileSpeed: 5, projectileCount: 5,
            patterns: ['spread', 'spiral', 'burst'], queenSpeed: 4, projectileEmoji: '☠️'
        };
    }
}

function updateDifficulty() {
    const config = getDifficultyConfig();
    if (currentDifficulty !== config.class) {
        currentDifficulty = config.class;
        difficultyDisplay.className = config.class;
        difficultyDisplay.textContent = config.name;

        queen.className = '';
        if (config.queenClass) queen.classList.add(config.queenClass);
    }
}

// ============== PROJECTILES ==============

function createProjectile(x, y, vx, vy, emoji, special = '') {
    // Limite le nombre de projectiles pour eviter les problemes de performance
    if (projectiles.length >= MAX_PROJECTILES) {
        return;
    }

    const projectile = document.createElement('div');
    projectile.className = 'projectile';
    if (special) projectile.classList.add(special);
    projectile.textContent = emoji;
    projectile.style.left = x + 'px';
    projectile.style.top = y + 'px';
    container.appendChild(projectile);
    projectiles.push({ element: projectile, x, y, vx, vy });
}

function fireProjectiles() {
    if (doomMode) {
        if (!doomTransitionActive) {
            fireDoomProjectiles();
        }
        return;
    }

    const config = getDifficultyConfig();
    const pattern = config.patterns[Math.floor(Math.random() * config.patterns.length)];
    const spd = config.projectileSpeed;
    const emoji = config.projectileEmoji;

    const dx = kingX - queenX;
    const dy = kingY - queenY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    switch (pattern) {
        case 'single':
            createProjectile(queenX + 25, queenY + 25, dirX * spd, dirY * spd, emoji);
            break;
        case 'double':
            createProjectile(queenX + 25, queenY + 25, dirX * spd, dirY * spd, emoji);
            createProjectile(queenX + 25, queenY + 25, dirX * spd * 0.8, dirY * spd * 0.8, emoji);
            break;
        case 'triple':
            for (let i = -1; i <= 1; i++) {
                const angle = Math.atan2(dirY, dirX) + i * 0.3;
                createProjectile(queenX + 25, queenY + 25, Math.cos(angle) * spd, Math.sin(angle) * spd, emoji);
            }
            break;
        case 'spread':
            for (let i = -2; i <= 2; i++) {
                const angle = Math.atan2(dirY, dirX) + i * 0.25;
                createProjectile(queenX + 25, queenY + 25, Math.cos(angle) * spd, Math.sin(angle) * spd, emoji);
            }
            break;
        case 'spiral':
            for (let i = 0; i < 8; i++) {
                const angle = (Date.now() / 200) + (i * Math.PI / 4);
                createProjectile(queenX + 25, queenY + 25, Math.cos(angle) * spd, Math.sin(angle) * spd, emoji);
            }
            break;
        case 'burst':
            for (let i = 0; i < 12; i++) {
                const angle = (i * Math.PI * 2) / 12;
                createProjectile(queenX + 25, queenY + 25, Math.cos(angle) * spd, Math.sin(angle) * spd, emoji);
            }
            break;
        case 'hell':
            for (let i = 0; i < 16; i++) {
                const angle = (Date.now() / 100) + (i * Math.PI / 8);
                createProjectile(queenX + 25, queenY + 25, Math.cos(angle) * spd, Math.sin(angle) * spd, '👿');
            }
            break;
    }
}

// Variables pour les patterns complexes
let doomPhase = 0;
let lastDoomPatternSwitch = 0;

/**
 * Patterns de tir HARDCORE style Touhou - BULLET HELL EXTREME
 * Inspire des jeux danmaku japonais avec des centaines de projectiles
 */
function fireDoomProjectiles() {
    const baseSpd = 5;
    const qx = queenX + 35;
    const qy = queenY + 35;
    const now = Date.now();

    const dx = kingX - queenX;
    const dy = kingY - queenY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;
    const playerAngle = Math.atan2(dy, dx);

    // Phase qui change toutes les 2 secondes pour varier les sous-patterns
    doomPhase = Math.floor(now / 2000) % 4;

    switch (currentPattern) {
        case 'castle_siege':
            // Double spirale tournante + tir cible
            for (let i = 0; i < 8; i++) {
                const angle = (now / 100) + (i * Math.PI * 2 / 8);
                createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '🔥', 'projectile-doom');
            }
            for (let i = 0; i < 8; i++) {
                const angle = -(now / 120) + (i * Math.PI * 2 / 8);
                createProjectile(qx, qy, Math.cos(angle) * (baseSpd * 0.7), Math.sin(angle) * (baseSpd * 0.7), '💀', 'projectile-skull');
            }
            for (let i = -2; i <= 2; i++) {
                const angle = playerAngle + i * 0.15;
                createProjectile(qx, qy, Math.cos(angle) * (baseSpd + 2), Math.sin(angle) * (baseSpd + 2), '👿', 'projectile-doom');
            }
            break;

        case 'corners_dance':
            // Burst radial + tir predateur
            for (let i = 0; i < 12; i++) {
                const angle = (i * Math.PI * 2) / 12 + (now / 500);
                createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '👿', 'projectile-doom');
            }
            for (let i = -2; i <= 2; i++) {
                const angle = playerAngle + i * 0.2;
                createProjectile(qx, qy, Math.cos(angle) * (baseSpd + 2), Math.sin(angle) * (baseSpd + 2), '💀', 'projectile-skull');
            }
            break;

        case 'stalker':
            // Arc vers le joueur + spirale
            for (let i = -4; i <= 4; i++) {
                const angle = playerAngle + i * 0.12;
                createProjectile(qx, qy, Math.cos(angle) * (baseSpd + 1), Math.sin(angle) * (baseSpd + 1), '👁️', 'projectile-doom');
            }
            for (let i = 0; i < 6; i++) {
                const angle = (now / 150) + (i * Math.PI / 3);
                createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '💜', 'projectile-doom');
            }
            break;

        case 'cross_fire':
            // Croix tournante
            for (let branch = 0; branch < 4; branch++) {
                const branchAngle = (now / 200) + (branch * Math.PI / 2);
                for (let i = 1; i <= 3; i++) {
                    const speed = baseSpd * (0.6 + i * 0.25);
                    createProjectile(qx, qy, Math.cos(branchAngle) * speed, Math.sin(branchAngle) * speed, '✝️', 'projectile-doom');
                }
            }
            for (let i = -1; i <= 1; i++) {
                createProjectile(qx, qy, dirX * (baseSpd + 3), dirY * (baseSpd + 3) + i * 0.5, '💀', 'projectile-skull');
            }
            break;

        case 'orbit':
            // Double helice
            for (let i = 0; i < 10; i++) {
                const angle = spiralAngle * 3 + (i * Math.PI / 5);
                createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '🌀', 'projectile-doom');
            }
            for (let i = 0; i < 10; i++) {
                const angle = -spiralAngle * 2.5 + (i * Math.PI / 5);
                createProjectile(qx, qy, Math.cos(angle) * (baseSpd * 0.8), Math.sin(angle) * (baseSpd * 0.8), '💜', 'projectile-doom');
            }
            break;

        case 'hell_rain':
            // Pluie depuis la reine
            for (let i = 0; i < 8; i++) {
                const x = queenX - 100 + i * 30;
                const spreadAngle = (Math.random() - 0.5) * 0.3;
                createProjectile(x, qy, spreadAngle * 2, baseSpd + Math.random(), '🔥', 'projectile-doom');
            }
            for (let i = 0; i < 6; i++) {
                const angle = (now / 120) + (i * Math.PI / 3);
                createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '🌀', 'projectile-doom');
            }
            break;

        case 'diamond_hunt':
            // Double spirale + tir cible
            for (let i = 0; i < 8; i++) {
                const angle = (now / 80) + (i * Math.PI * 2 / 8);
                createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '💎', 'projectile-doom');
            }
            for (let i = 0; i < 8; i++) {
                const angle = -(now / 100) + (i * Math.PI * 2 / 8);
                createProjectile(qx, qy, Math.cos(angle) * (baseSpd * 0.7), Math.sin(angle) * (baseSpd * 0.7), '💜', 'projectile-doom');
            }
            for (let i = -2; i <= 2; i++) {
                const angle = playerAngle + i * 0.2;
                createProjectile(qx, qy, Math.cos(angle) * (baseSpd + 2), Math.sin(angle) * (baseSpd + 2), '👿', 'projectile-doom');
            }
            break;

        case 'flower_bloom':
            // Petales en expansion
            for (let petal = 0; petal < 6; petal++) {
                const petalAngle = (petal * Math.PI * 2 / 6) + (now / 400);
                for (let i = -1; i <= 1; i++) {
                    const subAngle = petalAngle + i * 0.2;
                    createProjectile(qx, qy, Math.cos(subAngle) * baseSpd, Math.sin(subAngle) * baseSpd, '🌸', 'projectile-doom');
                }
            }
            break;

        case 'laser_cage':
            // Lasers depuis les bords + spirale
            for (let i = 0; i < 4; i++) {
                const y = 150 + i * (window.innerHeight - 300) / 3;
                createProjectile(0, y, baseSpd * 1.8, 0, '⚡', 'projectile-doom');
                createProjectile(window.innerWidth, y, -baseSpd * 1.8, 0, '⚡', 'projectile-doom');
            }
            for (let i = 0; i < 8; i++) {
                const angle = (now / 100) + (i * Math.PI / 4);
                createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '💀', 'projectile-skull');
            }
            break;

        case 'chaos_spiral':
            // Spirales chaotiques
            for (let s = 0; s < 3; s++) {
                const spiralSpeed = 60 + s * 40;
                const spiralDir = s % 2 === 0 ? 1 : -1;
                for (let i = 0; i < 6; i++) {
                    const angle = (now / spiralSpeed) * spiralDir + (i * Math.PI * 2 / 6) + (s * Math.PI / 3);
                    createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '🌪️', 'projectile-doom');
                }
            }
            break;

        case 'wall_of_death':
            // Mur avec trou mouvant
            const holePosition = (now / 1500) % 1;
            const holeX = holePosition * window.innerWidth;
            for (let x = 0; x < window.innerWidth; x += 60) {
                if (Math.abs(x - holeX) > 80) {
                    createProjectile(x, qy, 0, baseSpd, '🧱', 'projectile-doom');
                }
            }
            for (let i = 0; i < 6; i++) {
                const angle = (now / 150) + (i * Math.PI / 3);
                createProjectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '🔥', 'projectile-doom');
            }
            break;

        case 'shotgun_burst':
            // Rafale vers le joueur
            for (let i = -4; i <= 4; i++) {
                const angle = playerAngle + i * 0.1;
                const speed = baseSpd + 1 + Math.random();
                createProjectile(qx, qy, Math.cos(angle) * speed, Math.sin(angle) * speed, '💥', 'projectile-doom');
            }
            for (let i = 0; i < 6; i++) {
                const angle = (now / 200) + (i * Math.PI / 3);
                createProjectile(qx, qy, Math.cos(angle) * baseSpd * 0.8, Math.sin(angle) * baseSpd * 0.8, '💀', 'projectile-skull');
            }
            break;

        case 'galaxy_spin':
            // Bras de galaxie
            for (let arm = 0; arm < 4; arm++) {
                const armBaseAngle = (arm * Math.PI * 2 / 4) + (now / 300);
                for (let dist = 1; dist <= 4; dist++) {
                    const angle = armBaseAngle + dist * 0.2;
                    const speed = baseSpd * (0.5 + dist * 0.2);
                    createProjectile(qx, qy, Math.cos(angle) * speed, Math.sin(angle) * speed, '🌌', 'projectile-doom');
                }
            }
            for (let i = -1; i <= 1; i++) {
                const angle = playerAngle + i * 0.25;
                createProjectile(qx, qy, Math.cos(angle) * (baseSpd + 2), Math.sin(angle) * (baseSpd + 2), '💀', 'projectile-skull');
            }
            break;
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.element.style.left = p.x + 'px';
        p.element.style.top = p.y + 'px';

        // Collision avec le roi - hitbox centree style Touhou
        // Calcul dynamique base sur les dimensions de l'element
        const kingWidth = king.offsetWidth || 50;
        const kingHeight = king.offsetHeight || 50;
        const centerX = kingX + kingWidth / 2;
        const centerY = kingY + kingHeight / 2 + HITBOX_VERTICAL_OFFSET;
        const hitboxHalf = HITBOX_SIZE / 2;

        if (p.x > centerX - hitboxHalf && p.x < centerX + hitboxHalf &&
            p.y > centerY - hitboxHalf && p.y < centerY + hitboxHalf) {

            if (!queenHitCooldown && !doomTransitionActive) {
                if (doomMode) {
                    loseLife();
                } else if (score > 0) {
                    const config = getDifficultyConfig();
                    let damage = 1;
                    if (config.name.includes('DOOM')) damage = 5;
                    else if (config.name === 'EXTREME') damage = 3;
                    else if (config.name === 'Difficile') damage = 2;

                    score = Math.max(0, score - damage);
                    scoreValue.textContent = score + ' / 500';
                }

                king.style.filter = 'drop-shadow(0 0 20px red)';
                setTimeout(() => {
                    king.style.filter = 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))';
                }, 300);

                queenHitCooldown = true;
                setTimeout(() => queenHitCooldown = false, doomMode ? 150 : 500);
            }

            p.element.remove();
            projectiles.splice(i, 1);
            continue;
        }

        // Hors ecran
        if (p.x < -50 || p.x > window.innerWidth + 50 ||
            p.y < -50 || p.y > window.innerHeight + 50) {
            p.element.remove();
            projectiles.splice(i, 1);
        }
    }
}

function handleProjectiles() {
    if (!gameStarted) return;

    const config = getDifficultyConfig();
    const now = Date.now();

    if (now - lastProjectileTime > config.fireRate) {
        fireProjectiles();
        lastProjectileTime = now;
    }

    updateProjectiles();
    if (!doomMode) updateDifficulty();
}

function clearProjectiles() {
    projectiles.forEach(p => p.element.remove());
    projectiles = [];
}

// ============== MODE DOOM ==============

/**
 * Animation fluide d'un element vers une position cible
 * @param {Object} params - Parametres de l'animation
 * @param {Function} params.getCurrentPos - Fonction retournant {x, y} position actuelle
 * @param {Function} params.setPos - Fonction pour definir la nouvelle position (x, y)
 * @param {number} params.targetX - Position X cible
 * @param {number} params.targetY - Position Y cible
 * @param {number} params.duration - Duree de l'animation en ms
 * @param {Function} params.onComplete - Callback a la fin de l'animation
 */
function animateToPosition(params) {
    const startTime = Date.now();
    const startPos = params.getCurrentPos();
    const startX = startPos.x;
    const startY = startPos.y;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / params.duration, 1);
        // Easing out cubic pour un mouvement fluide
        const eased = 1 - Math.pow(1 - progress, 3);

        const currentX = startX + (params.targetX - startX) * eased;
        const currentY = startY + (params.targetY - startY) * eased;
        params.setPos(currentX, currentY);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else if (params.onComplete) {
            params.onComplete();
        }
    }
    requestAnimationFrame(animate);
}

/**
 * Demarre la sequence de transition vers le mode DOOM
 * Animation: reine se transforme et va au chateau, roi va au sud
 */
function startDoomTransition() {
    doomTransitionActive = true;
    doomMode = true;
    doomLivesCount = 3;
    doomTimeRemaining = 300;
    currentPattern = null; // Pas de pattern pendant la transition

    // Cacher les elements normaux
    scoreDisplay.style.display = 'none';
    difficultyDisplay.style.display = 'none';
    saveBtn.style.display = 'none';
    diamonds.forEach(d => d.element.remove());
    diamonds = [];

    // Activer le mode visuel DOOM
    container.classList.add('doom-mode');
    house.classList.add('doom-castle');

    // Warning flash
    doomWarning.classList.add('active');

    // Transformer la reine en demon avec animation
    queen.classList.add('queen-transforming');
    setTimeout(() => {
        queen.textContent = '👿';
        queen.classList.remove('queen-transforming');
        queen.classList.add('queen-demon');
    }, 500);

    // Position cible pour le roi: sud du chateau
    const kingTargetX = castleX - 25;
    const kingTargetY = castleY + 150;

    // Position cible pour la reine: au chateau
    const queenTargetPosX = castleX - 35;
    const queenTargetPosY = castleY - 35;

    // Animer le roi vers le sud du chateau
    animateToPosition({
        getCurrentPos: () => ({ x: kingX, y: kingY }),
        setPos: (x, y) => {
            kingX = x;
            kingY = y;
            king.style.left = kingX + 'px';
            king.style.top = kingY + 'px';
            updateKingHitbox();
        },
        targetX: kingTargetX,
        targetY: kingTargetY,
        duration: DOOM_TRANSITION_DURATION * 0.8,
        onComplete: null
    });

    // Animer la reine vers le chateau
    animateToPosition({
        getCurrentPos: () => ({ x: queenX, y: queenY }),
        setPos: (x, y) => {
            queenX = x;
            queenY = y;
            queen.style.left = queenX + 'px';
            queen.style.top = queenY + 'px';
        },
        targetX: queenTargetPosX,
        targetY: queenTargetPosY,
        duration: DOOM_TRANSITION_DURATION * 0.8,
        onComplete: null
    });

    // Afficher l'annonce DOOM
    doomAnnouncement.classList.add('active');

    // Changer la musique
    switchToDoomMusic();

    // Apres la transition, demarrer le vrai mode DOOM
    setTimeout(() => {
        doomWarning.classList.remove('active');
        doomAnnouncement.classList.remove('active');
        doomTransitionActive = false;

        // Afficher les elements DOOM UI
        doomTimer.classList.add('active');
        doomLives.classList.add('active');
        patternIndicator.classList.add('active');

        // Initialiser le premier pattern
        patternStartTime = Date.now();
        currentPattern = DOOM_PATTERNS[Math.floor(Math.random() * DOOM_PATTERNS.length)];
        updatePatternIndicator();

        // Demarrer le timer
        updateDoomTimer();
        doomTimerInterval = setInterval(() => {
            doomTimeRemaining--;
            updateDoomTimer();
            if (doomTimeRemaining <= 0) {
                doomVictorySequence();
            }
        }, 1000);

        updateLivesDisplay();

        // Message du demon
        showBubble(queenBubble, demonPhrases[Math.floor(Math.random() * demonPhrases.length)], 3000);
    }, DOOM_TRANSITION_DURATION);
}

/**
 * Demarre le mode DOOM OF HELL (appelle la transition)
 */
function startDoomMode() {
    startDoomTransition();
}

/**
 * Met a jour l'affichage du timer
 */
function updateDoomTimer() {
    const minutes = Math.floor(doomTimeRemaining / 60);
    const seconds = doomTimeRemaining % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (doomTimer.textContent !== `⏱️ ${timeStr}`) {
        doomTimer.textContent = `⏱️ ${timeStr}`;
    }

    // Effet urgent dans la derniere minute
    if (doomTimeRemaining <= 60) {
        doomTimer.style.color = '#ff0000';
        doomTimer.style.animation = 'timerPulse 0.5s ease-in-out infinite';
    }
}

/**
 * Met a jour l'affichage des vies
 */
function updateLivesDisplay() {
    const hearts = doomLives.querySelectorAll('.life-heart');
    hearts.forEach((heart, i) => {
        if (i < doomLivesCount) {
            heart.classList.remove('lost');
            heart.textContent = '❤️';
        } else {
            heart.classList.add('lost');
            heart.textContent = '🖤';
        }
    });
}

/**
 * Perd une vie en mode DOOM
 */
function loseLife() {
    doomLivesCount--;
    updateLivesDisplay();

    // Effet visuel
    container.style.animation = 'none';
    container.offsetHeight;
    container.style.animation = 'warningFlash 0.2s ease-in-out 3';

    showBubble(kingBubble, kingDoomPhrases[Math.floor(Math.random() * kingDoomPhrases.length)], 2000);

    if (doomLivesCount <= 0) {
        doomGameOverSequence();
    }
}

/**
 * Sequence de game over DOOM
 */
function doomGameOverSequence() {
    gameStarted = false;
    clearInterval(doomTimerInterval);
    clearProjectiles();

    const survivalTime = 300 - doomTimeRemaining;
    const minutes = Math.floor(survivalTime / 60);
    const seconds = survivalTime % 60;

    document.getElementById('doom-gameover-text').textContent =
        `Vous avez survécu ${minutes}:${seconds.toString().padStart(2, '0')}`;

    container.style.display = 'none';
    doomGameover.style.display = 'flex';
}

/**
 * Sequence de victoire DOOM
 */
function doomVictorySequence() {
    gameStarted = false;
    clearInterval(doomTimerInterval);
    clearProjectiles();

    // Afficher les vies restantes
    let livesStr = '';
    for (let i = 0; i < doomLivesCount; i++) livesStr += '❤️';
    for (let i = doomLivesCount; i < 3; i++) livesStr += '🖤';
    doomVictoryLives.textContent = `Vies restantes : ${livesStr}`;

    container.style.display = 'none';
    doomVictory.style.display = 'flex';
}

/**
 * Reinitialise le mode DOOM pour reessayer
 */
function resetDoomMode() {
    exitDoomMode();
    score = 500;
}

/**
 * Sort du mode DOOM et reinitialise
 */
function exitDoomMode() {
    doomMode = false;
    clearInterval(doomTimerInterval);
    clearProjectiles();

    // Restaurer les elements normaux
    scoreDisplay.style.display = 'block';
    difficultyDisplay.style.display = 'block';
    saveBtn.style.display = 'block';

    // Cacher les elements DOOM
    doomTimer.classList.remove('active');
    doomLives.classList.remove('active');
    patternIndicator.classList.remove('active');
    container.classList.remove('doom-mode');
    house.classList.remove('doom-castle');
    doomTimer.style.color = '';
    doomTimer.style.animation = '';

    // Restaurer la reine
    queen.textContent = '👸';
    queen.classList.remove('queen-demon');

    // Revenir à la musique normale
    switchToNormalMusic();

    // Reset
    score = 0;
    currentDifficulty = '';
    currentPattern = 'chase';
    gameStarted = false;
}

// ============== BULLES DE DIALOGUE ==============

function showBubble(bubble, text, duration = 2500) {
    bubble.textContent = text;
    bubble.classList.remove('show', 'pop');
    requestAnimationFrame(() => {
        bubble.classList.add('show', 'pop');
    });
    setTimeout(() => bubble.classList.remove('show', 'pop'), duration);
}

function updateBubblePositions() {
    kingBubble.style.left = (kingX - 50) + 'px';
    kingBubble.style.top = (kingY - 60) + 'px';
    queenBubble.style.left = (queenX - 50) + 'px';
    queenBubble.style.top = (queenY - 60) + 'px';
}

function randomBubbleDialog() {
    if (!gameStarted) return;

    const now = Date.now();
    if (now - lastBubbleTime < bubbleInterval) return;
    lastBubbleTime = now;

    if (doomMode) {
        if (Math.random() > 0.5) {
            showBubble(kingBubble, kingDoomPhrases[Math.floor(Math.random() * kingDoomPhrases.length)]);
        } else {
            showBubble(queenBubble, demonPhrases[Math.floor(Math.random() * demonPhrases.length)]);
        }
    } else {
        if (Math.random() > 0.5) {
            showBubble(kingBubble, kingPhrases[Math.floor(Math.random() * kingPhrases.length)]);
        } else {
            showBubble(queenBubble, queenPhrases[Math.floor(Math.random() * queenPhrases.length)]);
        }
    }
}

// ============== MUSIQUE ==============

let currentMusicElement = music;

function startMusic() {
    if (!musicPlaying) {
        currentMusicElement.play().then(() => {
            musicPlaying = true;
            musicBtn.textContent = '🔇 Stop';
        }).catch(() => {});
    }
}

/**
 * Bascule vers la musique DOOM
 */
function switchToDoomMusic() {
    if (!doomMusicElement) {
        console.warn('Element doom-music non trouvé');
        return;
    }
    if (musicPlaying && currentMusicElement) {
        currentMusicElement.pause();
        currentMusicElement.currentTime = 0;
    }
    currentMusicElement = doomMusicElement;
    doomMusicElement.volume = 0.8;
    doomMusicElement.play().then(() => {
        musicPlaying = true;
        musicBtn.textContent = '🔇 Stop';
    }).catch((e) => console.warn('Impossible de jouer la musique DOOM:', e));
}

/**
 * Revient à la musique médiévale normale
 */
function switchToNormalMusic() {
    if (musicPlaying) {
        currentMusicElement.pause();
        currentMusicElement.currentTime = 0;
    }
    currentMusicElement = music;
    music.play().then(() => {
        musicPlaying = true;
        musicBtn.textContent = '🔇 Stop';
    }).catch(() => {});
}

musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (musicPlaying) {
        currentMusicElement.pause();
        musicBtn.textContent = '🎵 Musique';
        musicPlaying = false;
    } else {
        currentMusicElement.play();
        musicBtn.textContent = '🔇 Stop';
        musicPlaying = true;
    }
});

// ============== VICTOIRE NORMALE ==============

function showVictory() {
    // Au lieu de la victoire normale, demarrer le mode DOOM
    startDoomMode();
}

replayBtn.addEventListener('click', () => {
    document.querySelectorAll('.confetti').forEach(c => c.remove());
    victoryScreen.style.display = 'none';
    menuScreen.style.display = 'flex';
});

// ============== JEU PRINCIPAL ==============

function startGame() {
    clearProjectiles();
    currentDifficulty = '';
    difficultyDisplay.className = 'diff-easy';
    difficultyDisplay.textContent = 'Facile';
    queen.className = '';
    queen.textContent = '👸';

    kingX = window.innerWidth / 2 - 25;
    kingY = window.innerHeight / 2 - 25;
    queenX = Math.random() * (window.innerWidth - 50);
    queenY = Math.random() * (window.innerHeight - 50);
    score = 0;
    scoreValue.textContent = '0 / 500';

    king.style.left = kingX + 'px';
    king.style.top = kingY + 'px';
    queen.style.left = queenX + 'px';
    queen.style.top = queenY + 'px';

    diamonds.forEach(d => d.element.remove());
    diamonds = [];
    for (let i = 0; i < 15; i++) createDiamond();

    startMusic();
}

function gameLoop() {
    if (!gameStarted) {
        requestAnimationFrame(gameLoop);
        return;
    }

    try {
        handleProjectiles();
    } catch (e) {
        console.error('Erreur handleProjectiles:', e);
    }

    // Mouvement du roi
    let moving = false;

    if (useMouseControl && mouseX !== null && mouseY !== null) {
        // Calculer le centre de la hitbox par rapport a kingX/kingY
        const kingWidth = king.offsetWidth || 50;
        const kingHeight = king.offsetHeight || 50;
        const hitboxCenterOffsetX = kingWidth / 2;
        const hitboxCenterOffsetY = kingHeight / 2 + HITBOX_VERTICAL_OFFSET;

        // La cible est la position ou kingX/kingY doit etre pour que le centre de la hitbox soit sur la souris
        const targetX = mouseX - hitboxCenterOffsetX;
        const targetY = mouseY - hitboxCenterOffsetY;

        const dx = targetX - kingX;
        const dy = targetY - kingY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist > 3) {
            const mouseSpeed = Math.min(speed, dist * 0.2);
            kingX += (dx / dist) * mouseSpeed;
            kingY += (dy / dist) * mouseSpeed;
            moving = true;
        }
    } else {
        if (keys.ArrowUp || keys.z || keys.Z) { kingY -= speed; moving = true; }
        if (keys.ArrowDown || keys.s || keys.S) { kingY += speed; moving = true; }
        if (keys.ArrowLeft || keys.q || keys.Q) { kingX -= speed; moving = true; }
        if (keys.ArrowRight || keys.d || keys.D) { kingX += speed; moving = true; }
    }

    if (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight ||
        keys.z || keys.Z || keys.q || keys.Q || keys.s || keys.S || keys.d || keys.D) {
        useMouseControl = false;
    }

    kingX = Math.max(0, Math.min(window.innerWidth - 50, kingX));
    kingY = Math.max(0, Math.min(window.innerHeight - 50, kingY));

    king.style.left = kingX + 'px';
    king.style.top = kingY + 'px';
    king.style.transform = moving ? 'scale(1.1)' : 'scale(1)';

    updateKingHitbox();

    // Mode normal: collecte de diamants
    if (!doomMode) {
        for (let i = diamonds.length - 1; i >= 0; i--) {
            if (diamonds[i] && checkCollision(diamonds[i])) {
                diamonds[i].element.classList.add('collected');
                const element = diamonds[i].element;
                setTimeout(() => element.remove(), 300);
                diamonds.splice(i, 1);
                score++;
                scoreValue.textContent = score + ' / 500';

                if (score >= 400 && !doomMode) {
                    startDoomMode();
                    break;
                }
                setTimeout(createDiamond, 500);
            }
        }
    }

    try {
        moveQueen();
    } catch (e) {
        console.error('Erreur moveQueen:', e);
    }

    // Collision avec la reine (seulement en mode normal)
    if (!doomMode && checkQueenCollision() && !queenHitCooldown && score > 0) {
        score = Math.max(0, score - 3);
        scoreValue.textContent = score + ' / 500';

        king.style.filter = 'drop-shadow(0 0 20px red)';
        queen.style.transform = 'scale(1.3)';
        setTimeout(() => {
            king.style.filter = 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))';
            queen.style.transform = 'scale(1)';
        }, 500);

        queenHitCooldown = true;
        setTimeout(() => queenHitCooldown = false, 1000);
    }

    updateBubblePositions();
    requestAnimationFrame(gameLoop);
}

// ============== INITIALISATION ==============

window.addEventListener('resize', () => {
    kingX = Math.min(kingX, window.innerWidth - 50);
    kingY = Math.min(kingY, window.innerHeight - 50);
});

function createStars() {
    const starsContainer = document.getElementById('stars');
    if (!starsContainer) return;

    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.width = (Math.random() * 3 + 1) + 'px';
        star.style.height = star.style.width;
        star.style.animationDelay = (Math.random() * 2) + 's';
        starsContainer.appendChild(star);
    }
}

// ============== TUTORIEL ==============

const tutorialScreen = document.getElementById('tutorial-screen');
const tutorialBtn = document.getElementById('tutorial-btn');
const tutorialClose = document.getElementById('tutorial-close');
const tutorialPrev = document.getElementById('tutorial-prev');
const tutorialNext = document.getElementById('tutorial-next');
const tutorialTitle = document.getElementById('tutorial-title');
const tutorialText = document.getElementById('tutorial-text');
const tutorialDemo = document.getElementById('tutorial-demo');
const tutorialStepDisplay = document.getElementById('tutorial-step');

let tutorialStep = 0;
const tutorialSteps = [
    {
        title: "👑 Bienvenue, jeune Roi !",
        text: "Tu es le Roi et ton but est de collecter des diamants.",
        demo: '<span class="demo-emoji">👑</span>'
    },
    {
        title: "🎮 Les Contrôles",
        text: "Utilise les flèches ou ZQSD pour te déplacer.",
        demo: '<div class="keys"><div class="key">Z / ↑</div><div class="keys-row"><div class="key">Q / ←</div><div class="key">S / ↓</div><div class="key">D / →</div></div></div>'
    },
    {
        title: "💎 Les Diamants",
        text: "Collecte 400 diamants pour déclencher le mode final !",
        demo: '<span class="demo-emoji">👑</span><span class="demo-arrow">➡️</span><span class="demo-emoji">💎</span>'
    },
    {
        title: "👸 La Reine",
        text: "Évite la Reine et ses projectiles. Elle devient plus agressive !",
        demo: '<span class="demo-emoji">👑</span><span class="demo-arrow" style="color: #ff4444;">❌</span><span class="demo-emoji">👸</span>'
    },
    {
        title: "👿 DOOM OF HELL",
        text: "À 400 diamants, la Reine devient un DÉMON ! Survie 5 minutes avec 3 vies !",
        demo: '<span class="demo-emoji">👿</span><span style="font-size: 40px; color: #ff0000; margin: 0 20px;">5:00 ❤️❤️❤️</span>'
    }
];

function updateTutorial() {
    const step = tutorialSteps[tutorialStep];
    tutorialTitle.textContent = step.title;
    tutorialText.textContent = step.text;
    tutorialDemo.innerHTML = step.demo;
    tutorialStepDisplay.textContent = (tutorialStep + 1) + ' / ' + tutorialSteps.length;
    tutorialPrev.disabled = tutorialStep === 0;
    tutorialNext.textContent = tutorialStep === tutorialSteps.length - 1 ? 'Terminer ✓' : 'Suivant ➡️';
}

tutorialBtn.addEventListener('click', () => {
    tutorialStep = 0;
    updateTutorial();
    tutorialScreen.style.display = 'flex';
});

tutorialClose.addEventListener('click', () => tutorialScreen.style.display = 'none');

tutorialPrev.addEventListener('click', () => {
    if (tutorialStep > 0) { tutorialStep--; updateTutorial(); }
});

tutorialNext.addEventListener('click', () => {
    if (tutorialStep < tutorialSteps.length - 1) { tutorialStep++; updateTutorial(); }
    else tutorialScreen.style.display = 'none';
});

// ============== CHEAT CODES ==============

window.cheat = {
    difficulty: function(level) {
        const levels = { 'easy': 0, 'medium': 50, 'hard': 150, 'extreme': 300, 'doom': 400 };
        if (!gameStarted) { console.log('❌ Lance une partie d\'abord !'); return; }
        if (levels[level] !== undefined) {
            if (level === 'doom') {
                score = 400;
                scoreValue.textContent = '400 / 500';
                startDoomMode();
            } else {
                score = levels[level];
                scoreValue.textContent = score + ' / 500';
                updateDifficulty();
            }
            console.log('✅ Difficulté: ' + getDifficultyConfig().name);
        } else {
            console.log('❌ Niveaux: easy, medium, hard, extreme, doom');
        }
    },
    setScore: function(amount) {
        if (!gameStarted) { console.log('❌ Lance une partie d\'abord !'); return; }
        score = Math.min(400, Math.max(0, amount));
        scoreValue.textContent = score + ' / 500';
        updateDifficulty();
        console.log('✅ Score: ' + score);
    },
    win: function() {
        if (!gameStarted) { console.log('❌ Lance une partie d\'abord !'); return; }
        if (doomMode) {
            doomVictorySequence();
        } else {
            score = 500;
            scoreValue.textContent = '500 / 500';
            showVictory();
        }
        console.log('🏆 VICTOIRE !');
    },
    doom: function() {
        if (!gameStarted) { console.log('❌ Lance une partie d\'abord !'); return; }
        startDoomMode();
        console.log('👿 DOOM MODE ACTIVÉ !');
    },
    addLife: function() {
        if (doomMode && doomLivesCount < 3) {
            doomLivesCount++;
            updateLivesDisplay();
            console.log('❤️ Vie ajoutée !');
        }
    },
    addTime: function(seconds = 60) {
        if (doomMode) {
            doomTimeRemaining += seconds;
            updateDoomTimer();
            console.log('⏱️ +' + seconds + ' secondes !');
        }
    },
    pattern: function(name) {
        if (doomMode && DOOM_PATTERNS.includes(name)) {
            currentPattern = name;
            patternStartTime = Date.now();
            updatePatternIndicator();
            console.log('✅ Pattern: ' + name);
        } else {
            console.log('❌ Patterns: ' + DOOM_PATTERNS.join(', '));
        }
    },
    clearBullets: function() {
        clearProjectiles();
        console.log('✅ Projectiles supprimés');
    },
    help: function() {
        console.log('🎮 === CHEAT CODES ===');
        console.log('cheat.difficulty("easy/medium/hard/extreme/doom")');
        console.log('cheat.setScore(nombre)');
        console.log('cheat.win()');
        console.log('cheat.doom() - Active le mode DOOM');
        console.log('cheat.addLife() - Ajoute une vie en DOOM');
        console.log('cheat.addTime(seconds) - Ajoute du temps en DOOM');
        console.log('cheat.pattern("nom") - Change le pattern');
        console.log('cheat.clearBullets()');
    }
};

// Demarrage
createStars();
setInterval(randomBubbleDialog, 1000);
gameLoop();
console.log('🎮 Cheats disponibles ! Tape cheat.help()');
