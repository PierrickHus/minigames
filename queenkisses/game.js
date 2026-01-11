/**
 * Le Baiser de la Reine - Version Canvas optimisée
 * Jeu de collecte de diamants avec mode DOOM
 */

import { Renderer } from './renderer.js';
import { King, Queen, Diamond, Projectile, SpeechBubble } from './entities.js';

// ============== CONFIGURATION ==============

const CONFIG = {
    TARGET_SCORE: 400,
    DOOM_DURATION: 300, // 5 minutes en secondes
    DOOM_LIVES: 3,
    PATTERN_DURATION: 5000,
    TRANSITION_DURATION: 4000,
    MAX_PROJECTILES: 150,
    DIAMOND_COUNT: 15
};

const DOOM_PATTERNS = [
    'castle_siege', 'corners_dance', 'stalker', 'cross_fire',
    'orbit', 'hell_rain', 'diamond_hunt', 'flower_bloom',
    'laser_cage', 'chaos_spiral', 'wall_of_death', 'shotgun_burst', 'galaxy_spin'
];

// ============== CLASSE PRINCIPALE DU JEU ==============

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);

        // État du jeu
        this.gameStarted = false;
        this.score = 0;
        this.doomMode = false;
        this.doomTransitionActive = false;
        this.doomLivesCount = CONFIG.DOOM_LIVES;
        this.doomTimeRemaining = CONFIG.DOOM_DURATION;
        this.doomTimerInterval = null;

        // Entités
        this.king = null;
        this.queen = null;
        this.diamonds = [];
        this.projectiles = [];

        // Bulles de dialogue
        this.kingBubble = new SpeechBubble();
        this.queenBubble = new SpeechBubble();

        // Contrôles
        this.keys = { up: false, down: false, left: false, right: false };
        this.mouseX = null;
        this.mouseY = null;
        this.useMouseControl = false;

        // Système de tir
        this.lastProjectileTime = 0;
        this.currentDifficulty = 'easy';
        this.currentPattern = 'chase';
        this.patternStartTime = 0;

        // Cooldowns
        this.queenHitCooldown = false;
        this.lastBubbleTime = 0;

        // Musique
        this.music = document.getElementById('medieval-music');
        this.doomMusic = document.getElementById('doom-music');
        this.currentMusic = this.music;
        this.musicPlaying = false;

        // Éléments UI DOM
        this.initUIElements();
        this.initEventListeners();
        this.initTutorial();

        // Démarrage
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    /**
     * Initialise les références aux éléments UI
     */
    initUIElements() {
        this.ui = {
            menuScreen: document.getElementById('menu-screen'),
            guideScreen: document.getElementById('guide-screen'),
            gameHud: document.getElementById('game-hud'),
            scoreValue: document.getElementById('score-value'),
            scoreDisplay: document.getElementById('score'),
            difficultyDisplay: document.getElementById('difficulty'),
            doomTimer: document.getElementById('doom-timer'),
            doomLives: document.getElementById('doom-lives'),
            patternIndicator: document.getElementById('pattern-indicator'),
            doomAnnouncement: document.getElementById('doom-announcement'),
            victoryScreen: document.getElementById('victory-screen'),
            doomGameover: document.getElementById('doom-gameover'),
            doomVictory: document.getElementById('doom-victory'),
            doomVictoryLives: document.getElementById('doom-victory-lives'),
            musicBtn: document.getElementById('music-btn'),
            saveBtn: document.getElementById('save-btn')
        };
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initEventListeners() {
        // Boutons menu
        document.getElementById('new-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('load-btn').addEventListener('click', () => this.loadGame());
        document.getElementById('guide-btn').addEventListener('click', () => {
            this.ui.guideScreen.style.display = 'flex';
        });
        document.getElementById('back-btn').addEventListener('click', () => {
            this.ui.guideScreen.style.display = 'none';
        });

        // Boutons jeu
        this.ui.saveBtn.addEventListener('click', () => this.saveGame());
        this.ui.musicBtn.addEventListener('click', () => this.toggleMusic());
        document.getElementById('replay-btn').addEventListener('click', () => this.returnToMenu());
        document.getElementById('doom-retry-btn').addEventListener('click', () => this.retryDoom());
        document.getElementById('doom-menu-btn').addEventListener('click', () => this.returnToMenu());
        document.getElementById('doom-victory-btn').addEventListener('click', () => this.returnToMenu());

        // Contrôles clavier
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Contrôles souris
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameStarted) {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
                this.useMouseControl = true;
            }
        });
        this.canvas.addEventListener('mouseleave', () => {
            this.useMouseControl = false;
        });

        // Redimensionnement
        window.addEventListener('resize', () => this.handleResize());

        // Étoiles du menu
        this.createStars();
    }

    /**
     * Gère l'appui sur une touche
     */
    handleKeyDown(e) {
        const keyMap = {
            'ArrowUp': 'up', 'z': 'up', 'Z': 'up',
            'ArrowDown': 'down', 's': 'down', 'S': 'down',
            'ArrowLeft': 'left', 'q': 'left', 'Q': 'left',
            'ArrowRight': 'right', 'd': 'right', 'D': 'right'
        };

        if (keyMap[e.key]) {
            this.keys[keyMap[e.key]] = true;
            this.useMouseControl = false;
            e.preventDefault();
        }
    }

    /**
     * Gère le relâchement d'une touche
     */
    handleKeyUp(e) {
        const keyMap = {
            'ArrowUp': 'up', 'z': 'up', 'Z': 'up',
            'ArrowDown': 'down', 's': 'down', 'S': 'down',
            'ArrowLeft': 'left', 'q': 'left', 'Q': 'left',
            'ArrowRight': 'right', 'd': 'right', 'D': 'right'
        };

        if (keyMap[e.key]) {
            this.keys[keyMap[e.key]] = false;
        }
    }

    /**
     * Gère le redimensionnement de la fenêtre
     */
    handleResize() {
        if (this.king) {
            this.king.x = Math.min(this.king.x, this.renderer.width - 50);
            this.king.y = Math.min(this.king.y, this.renderer.height - 50);
        }
        if (this.queen) {
            this.queen.canvasWidth = this.renderer.width;
            this.queen.canvasHeight = this.renderer.height;
        }
    }

    /**
     * Démarre une nouvelle partie
     */
    startGame() {
        this.ui.menuScreen.style.display = 'none';
        this.ui.gameHud.style.display = 'block';
        this.canvas.style.display = 'block';

        // Réinitialisation
        this.score = 0;
        this.doomMode = false;
        this.doomTransitionActive = false;
        this.currentDifficulty = 'easy';
        this.projectiles = [];

        // Création des entités
        const centerX = this.renderer.width / 2 - 25;
        const centerY = this.renderer.height / 2 - 25;
        this.king = new King(centerX, centerY);

        const queenX = Math.random() * (this.renderer.width - 50);
        const queenY = Math.random() * (this.renderer.height - 50);
        this.queen = new Queen(queenX, queenY, this.renderer.width, this.renderer.height);

        // Diamants
        this.diamonds = [];
        for (let i = 0; i < CONFIG.DIAMOND_COUNT; i++) {
            this.createDiamond(i);
        }

        // UI
        this.updateScore();
        this.updateDifficulty();

        this.gameStarted = true;
        this.startMusic();
    }

    /**
     * Crée un diamant à une position aléatoire
     */
    createDiamond(id) {
        const x = Math.random() * (this.renderer.width - 50);
        const y = Math.random() * (this.renderer.height - 100) + 50;
        this.diamonds.push(new Diamond(x, y, id || Date.now()));
    }

    /**
     * Met à jour l'affichage du score
     */
    updateScore() {
        const newText = `${this.score} / 500`;
        if (this.ui.scoreValue.textContent !== newText) {
            this.ui.scoreValue.textContent = newText;
        }
    }

    /**
     * Retourne la configuration de difficulté actuelle
     */
    getDifficultyConfig() {
        if (this.doomMode) {
            return {
                name: '👿 DOOM OF HELL 👿',
                class: 'diff-doom',
                queenSpeed: 0,
                fireRate: 350,
                projectileSpeed: 6,
                emoji: '👿'
            };
        }

        if (this.score < 50) {
            return {
                name: 'Facile', class: 'diff-easy', queenSpeed: 2.5,
                fireRate: 2000, projectileSpeed: 2, emoji: '💗'
            };
        } else if (this.score < 150) {
            return {
                name: 'Moyen', class: 'diff-medium', queenSpeed: 3,
                fireRate: 1500, projectileSpeed: 3, emoji: '💜'
            };
        } else if (this.score < 300) {
            return {
                name: 'Difficile', class: 'diff-hard', queenSpeed: 3.5,
                fireRate: 1000, projectileSpeed: 4, emoji: '🔥'
            };
        } else {
            return {
                name: 'EXTREME', class: 'diff-extreme', queenSpeed: 4,
                fireRate: 600, projectileSpeed: 5, emoji: '☠️'
            };
        }
    }

    /**
     * Met à jour l'indicateur de difficulté
     */
    updateDifficulty() {
        const config = this.getDifficultyConfig();
        if (this.currentDifficulty !== config.class) {
            this.currentDifficulty = config.class;
            this.ui.difficultyDisplay.className = config.class;
            this.ui.difficultyDisplay.textContent = config.name;

            if (config.name === 'Difficile' || config.name === 'EXTREME') {
                this.queen.rage = true;
            } else {
                this.queen.rage = false;
            }
        }
    }

    /**
     * Gère les projectiles (création et mise à jour)
     */
    handleProjectiles() {
        const config = this.getDifficultyConfig();
        const now = Date.now();

        // Création de nouveaux projectiles
        if (now - this.lastProjectileTime > config.fireRate) {
            if (this.doomMode && !this.doomTransitionActive) {
                this.fireDoomProjectiles();
            } else if (!this.doomMode) {
                this.fireNormalProjectiles(config);
            }
            this.lastProjectileTime = now;
        }

        // Mise à jour des projectiles existants
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update();

            // Collision avec le roi
            if (p.checkCollision(this.king)) {
                if (!this.queenHitCooldown && !this.doomTransitionActive) {
                    this.handleHit();
                }
                this.projectiles.splice(i, 1);
                continue;
            }

            // Hors écran
            if (p.isOffScreen(this.renderer.width, this.renderer.height)) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    /**
     * Gère un coup reçu par le roi
     */
    handleHit() {
        if (this.doomMode) {
            this.loseLife();
        } else if (this.score > 0) {
            const config = this.getDifficultyConfig();
            let damage = 1;
            if (config.name === 'EXTREME') damage = 3;
            else if (config.name === 'Difficile') damage = 2;

            this.score = Math.max(0, this.score - damage);
            this.updateScore();
        }

        this.king.hit = true;
        this.renderer.shake(15);
        setTimeout(() => { this.king.hit = false; }, 300);

        this.queenHitCooldown = true;
        setTimeout(() => { this.queenHitCooldown = false; }, this.doomMode ? 150 : 500);
    }

    /**
     * Tire des projectiles en mode normal
     */
    fireNormalProjectiles(config) {
        if (this.projectiles.length >= CONFIG.MAX_PROJECTILES) return;

        const qx = this.queen.x + 25;
        const qy = this.queen.y + 25;
        const dx = this.king.x - this.queen.x;
        const dy = this.king.y - this.queen.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;
        const angle = Math.atan2(dy, dx);
        const spd = config.projectileSpeed;

        // Pattern simple basé sur le score
        if (this.score < 50) {
            this.projectiles.push(new Projectile(qx, qy, dirX * spd, dirY * spd, config.emoji));
        } else if (this.score < 150) {
            for (let i = -1; i <= 1; i += 2) {
                const a = angle + i * 0.2;
                this.projectiles.push(new Projectile(qx, qy, Math.cos(a) * spd, Math.sin(a) * spd, config.emoji));
            }
        } else if (this.score < 300) {
            for (let i = -2; i <= 2; i++) {
                const a = angle + i * 0.2;
                this.projectiles.push(new Projectile(qx, qy, Math.cos(a) * spd, Math.sin(a) * spd, config.emoji));
            }
        } else {
            // EXTREME - spirale
            for (let i = 0; i < 8; i++) {
                const a = (Date.now() / 200) + (i * Math.PI / 4);
                this.projectiles.push(new Projectile(qx, qy, Math.cos(a) * spd, Math.sin(a) * spd, config.emoji));
            }
        }
    }

    /**
     * Tire des projectiles en mode DOOM
     */
    fireDoomProjectiles() {
        if (this.projectiles.length >= CONFIG.MAX_PROJECTILES) return;

        const baseSpd = 5;
        const qx = this.queen.x + 35;
        const qy = this.queen.y + 35;
        const now = Date.now();

        const dx = this.king.x - this.queen.x;
        const dy = this.king.y - this.queen.y;
        const playerAngle = Math.atan2(dy, dx);

        const glow = { color: '#ff0000', blur: 12 };

        switch (this.currentPattern) {
            case 'castle_siege':
                // Double spirale
                for (let i = 0; i < 8; i++) {
                    const angle = (now / 100) + (i * Math.PI * 2 / 8);
                    this.projectiles.push(new Projectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '🔥', glow));
                }
                for (let i = 0; i < 8; i++) {
                    const angle = -(now / 120) + (i * Math.PI * 2 / 8);
                    this.projectiles.push(new Projectile(qx, qy, Math.cos(angle) * baseSpd * 0.7, Math.sin(angle) * baseSpd * 0.7, '💀', glow));
                }
                break;

            case 'corners_dance':
                // Burst radial
                for (let i = 0; i < 12; i++) {
                    const angle = (i * Math.PI * 2) / 12 + (now / 500);
                    this.projectiles.push(new Projectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '👿', glow));
                }
                break;

            case 'stalker':
                // Arc vers le joueur
                for (let i = -4; i <= 4; i++) {
                    const angle = playerAngle + i * 0.12;
                    this.projectiles.push(new Projectile(qx, qy, Math.cos(angle) * (baseSpd + 1), Math.sin(angle) * (baseSpd + 1), '👁️', glow));
                }
                break;

            case 'orbit':
                // Double hélice
                for (let i = 0; i < 10; i++) {
                    const angle = this.queen.spiralAngle * 3 + (i * Math.PI / 5);
                    this.projectiles.push(new Projectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '🌀', glow));
                }
                break;

            case 'shotgun_burst':
                // Rafale vers le joueur
                for (let i = -4; i <= 4; i++) {
                    const angle = playerAngle + i * 0.1;
                    const speed = baseSpd + 1 + Math.random();
                    this.projectiles.push(new Projectile(qx, qy, Math.cos(angle) * speed, Math.sin(angle) * speed, '💥', glow));
                }
                break;

            default:
                // Pattern par défaut - spirale simple
                for (let i = 0; i < 8; i++) {
                    const angle = (now / 150) + (i * Math.PI / 4);
                    this.projectiles.push(new Projectile(qx, qy, Math.cos(angle) * baseSpd, Math.sin(angle) * baseSpd, '💀', glow));
                }
        }
    }

    /**
     * Démarre le mode DOOM
     */
    startDoomMode() {
        this.doomTransitionActive = true;
        this.doomMode = true;
        this.doomLivesCount = CONFIG.DOOM_LIVES;
        this.doomTimeRemaining = CONFIG.DOOM_DURATION;

        // Nettoie les diamants
        this.diamonds = [];

        // Cache les éléments normaux
        this.ui.scoreDisplay.style.display = 'none';
        this.ui.difficultyDisplay.style.display = 'none';
        this.ui.saveBtn.style.display = 'none';

        // Transforme la reine en démon
        this.queen.isDemon = true;

        // Affiche l'annonce
        this.ui.doomAnnouncement.classList.add('active');

        // Change la musique
        this.switchToDoomMusic();

        // Animation de transition
        const castleX = this.renderer.width / 2 - 25;
        const castleY = this.renderer.height / 2 - 25;
        const queenTargetX = castleX - 10;
        const queenTargetY = castleY - 10;

        this.animateEntity(this.queen, queenTargetX, queenTargetY, CONFIG.TRANSITION_DURATION * 0.8);
        this.animateEntity(this.king, castleX, castleY + 150, CONFIG.TRANSITION_DURATION * 0.8);

        // Après la transition
        setTimeout(() => {
            this.ui.doomAnnouncement.classList.remove('active');
            this.doomTransitionActive = false;

            // Affiche l'UI DOOM
            this.ui.doomTimer.classList.add('active');
            this.ui.doomLives.classList.add('active');
            this.ui.patternIndicator.classList.add('active');

            // Démarre le timer
            this.updateDoomTimer();
            this.doomTimerInterval = setInterval(() => {
                this.doomTimeRemaining--;
                this.updateDoomTimer();
                if (this.doomTimeRemaining <= 0) {
                    this.doomVictory();
                }
            }, 1000);

            // Premier pattern
            this.selectNewPattern();
            this.updateLivesDisplay();
        }, CONFIG.TRANSITION_DURATION);
    }

    /**
     * Anime une entité vers une position
     */
    animateEntity(entity, targetX, targetY, duration) {
        const startX = entity.x;
        const startY = entity.y;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            entity.x = startX + (targetX - startX) * eased;
            entity.y = startY + (targetY - startY) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    /**
     * Sélectionne un nouveau pattern DOOM
     */
    selectNewPattern() {
        let newPattern;
        do {
            newPattern = DOOM_PATTERNS[Math.floor(Math.random() * DOOM_PATTERNS.length)];
        } while (newPattern === this.currentPattern);

        this.currentPattern = newPattern;
        this.patternStartTime = Date.now();
        this.queen.currentPattern = newPattern;
        this.updatePatternIndicator();
    }

    /**
     * Met à jour l'indicateur de pattern
     */
    updatePatternIndicator() {
        const names = {
            'castle_siege': '🏰 Siège', 'corners_dance': '📐 Coins',
            'stalker': '👁️ Traque', 'cross_fire': '✝️ Croisé',
            'orbit': '🌀 Orbite', 'hell_rain': '🌧️ Pluie',
            'diamond_hunt': '💎 Diamant', 'flower_bloom': '🌸 Fleur',
            'laser_cage': '⚡ Cage', 'chaos_spiral': '🌪️ Chaos',
            'wall_of_death': '🧱 Mur', 'shotgun_burst': '💥 Shotgun',
            'galaxy_spin': '🌌 Galaxie'
        };
        this.ui.patternIndicator.textContent = names[this.currentPattern] || this.currentPattern;
    }

    /**
     * Met à jour l'affichage du timer DOOM
     */
    updateDoomTimer() {
        const minutes = Math.floor(this.doomTimeRemaining / 60);
        const seconds = this.doomTimeRemaining % 60;
        const timeStr = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (this.ui.doomTimer.textContent !== timeStr) {
            this.ui.doomTimer.textContent = timeStr;
        }
    }

    /**
     * Met à jour l'affichage des vies
     */
    updateLivesDisplay() {
        const hearts = this.ui.doomLives.querySelectorAll('.life-heart');
        hearts.forEach((heart, i) => {
            if (i < this.doomLivesCount) {
                heart.classList.remove('lost');
                heart.textContent = '❤️';
            } else {
                heart.classList.add('lost');
                heart.textContent = '🖤';
            }
        });
    }

    /**
     * Le roi perd une vie en mode DOOM
     */
    loseLife() {
        this.doomLivesCount--;
        this.updateLivesDisplay();
        this.renderer.shake(20);

        if (this.doomLivesCount <= 0) {
            this.doomGameOver();
        }
    }

    /**
     * Game Over en mode DOOM
     */
    doomGameOver() {
        this.gameStarted = false;
        clearInterval(this.doomTimerInterval);
        this.projectiles = [];

        const survivalTime = CONFIG.DOOM_DURATION - this.doomTimeRemaining;
        const minutes = Math.floor(survivalTime / 60);
        const seconds = survivalTime % 60;

        document.getElementById('doom-gameover-text').textContent =
            `Vous avez survécu ${minutes}:${seconds.toString().padStart(2, '0')}`;

        this.canvas.style.display = 'none';
        this.ui.gameHud.style.display = 'none';
        this.ui.doomGameover.style.display = 'flex';
    }

    /**
     * Victoire en mode DOOM
     */
    doomVictory() {
        this.gameStarted = false;
        clearInterval(this.doomTimerInterval);
        this.projectiles = [];

        let livesStr = '';
        for (let i = 0; i < this.doomLivesCount; i++) livesStr += '❤️';
        for (let i = this.doomLivesCount; i < 3; i++) livesStr += '🖤';
        this.ui.doomVictoryLives.textContent = `Vies restantes : ${livesStr}`;

        this.canvas.style.display = 'none';
        this.ui.gameHud.style.display = 'none';
        this.ui.doomVictory.style.display = 'flex';
    }

    /**
     * Réessaie le mode DOOM
     */
    retryDoom() {
        this.ui.doomGameover.style.display = 'none';
        this.canvas.style.display = 'block';
        this.ui.gameHud.style.display = 'block';

        clearInterval(this.doomTimerInterval);
        this.projectiles = [];
        this.doomMode = false;

        const centerX = this.renderer.width / 2 - 25;
        const centerY = this.renderer.height / 2 - 25;
        this.king.x = centerX;
        this.king.y = centerY;
        this.queen.x = centerX - 10;
        this.queen.y = centerY - 10;

        this.doomLivesCount = CONFIG.DOOM_LIVES;
        this.doomTimeRemaining = CONFIG.DOOM_DURATION;
        this.score = CONFIG.TARGET_SCORE;

        this.gameStarted = true;
        this.startDoomMode();
    }

    /**
     * Retourne au menu principal
     */
    returnToMenu() {
        this.gameStarted = false;
        clearInterval(this.doomTimerInterval);
        this.projectiles = [];
        this.doomMode = false;

        this.canvas.style.display = 'none';
        this.ui.gameHud.style.display = 'none';
        this.ui.victoryScreen.style.display = 'none';
        this.ui.doomGameover.style.display = 'none';
        this.ui.doomVictory.style.display = 'none';
        this.ui.menuScreen.style.display = 'flex';

        // Reset UI
        this.ui.scoreDisplay.style.display = 'block';
        this.ui.difficultyDisplay.style.display = 'block';
        this.ui.saveBtn.style.display = 'block';
        this.ui.doomTimer.classList.remove('active');
        this.ui.doomLives.classList.remove('active');
        this.ui.patternIndicator.classList.remove('active');

        this.switchToNormalMusic();
    }

    /**
     * Sauvegarde la partie
     */
    saveGame() {
        if (this.doomMode) {
            this.ui.saveBtn.textContent = '❌ Pas en DOOM!';
            setTimeout(() => { this.ui.saveBtn.textContent = '💾 Sauvegarder'; }, 1500);
            return;
        }

        const saveData = {
            score: this.score,
            kingX: this.king.x,
            kingY: this.king.y,
            queenX: this.queen.x,
            queenY: this.queen.y
        };

        localStorage.setItem('roiDesDiamants', JSON.stringify(saveData));
        this.ui.saveBtn.textContent = '✅ Sauvegardé!';
        setTimeout(() => { this.ui.saveBtn.textContent = '💾 Sauvegarder'; }, 1500);
    }

    /**
     * Charge une partie sauvegardée
     */
    loadGame() {
        const saveData = localStorage.getItem('roiDesDiamants');
        if (!saveData) {
            alert('Aucune sauvegarde trouvée !');
            return;
        }

        const data = JSON.parse(saveData);
        this.startGame();

        this.score = data.score;
        this.king.x = data.kingX;
        this.king.y = data.kingY;
        this.queen.x = data.queenX;
        this.queen.y = data.queenY;

        this.updateScore();
        this.updateDifficulty();
    }

    /**
     * Gère la musique
     */
    startMusic() {
        if (!this.musicPlaying) {
            this.currentMusic.play().then(() => {
                this.musicPlaying = true;
                this.ui.musicBtn.textContent = '🔇 Stop';
            }).catch(() => {});
        }
    }

    toggleMusic() {
        if (this.musicPlaying) {
            this.currentMusic.pause();
            this.ui.musicBtn.textContent = '🎵 Musique';
            this.musicPlaying = false;
        } else {
            this.currentMusic.play();
            this.ui.musicBtn.textContent = '🔇 Stop';
            this.musicPlaying = true;
        }
    }

    switchToDoomMusic() {
        if (this.musicPlaying) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
        this.currentMusic = this.doomMusic;
        this.doomMusic.play().then(() => {
            this.musicPlaying = true;
            this.ui.musicBtn.textContent = '🔇 Stop';
        }).catch(() => {});
    }

    switchToNormalMusic() {
        if (this.musicPlaying) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
        this.currentMusic = this.music;
        this.music.play().then(() => {
            this.musicPlaying = true;
            this.ui.musicBtn.textContent = '🔇 Stop';
        }).catch(() => {});
    }

    /**
     * Crée les étoiles du menu
     */
    createStars() {
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

    /**
     * Initialise le tutoriel
     */
    initTutorial() {
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

        const updateTutorial = () => {
            const step = tutorialSteps[tutorialStep];
            tutorialTitle.textContent = step.title;
            tutorialText.textContent = step.text;
            tutorialDemo.innerHTML = step.demo;
            tutorialStepDisplay.textContent = (tutorialStep + 1) + ' / ' + tutorialSteps.length;
            tutorialPrev.disabled = tutorialStep === 0;
            tutorialNext.textContent = tutorialStep === tutorialSteps.length - 1 ? 'Terminer ✓' : 'Suivant ➡️';
        };

        tutorialBtn.addEventListener('click', () => {
            tutorialStep = 0;
            updateTutorial();
            tutorialScreen.style.display = 'flex';
        });

        tutorialClose.addEventListener('click', () => {
            tutorialScreen.style.display = 'none';
        });

        tutorialPrev.addEventListener('click', () => {
            if (tutorialStep > 0) {
                tutorialStep--;
                updateTutorial();
            }
        });

        tutorialNext.addEventListener('click', () => {
            if (tutorialStep < tutorialSteps.length - 1) {
                tutorialStep++;
                updateTutorial();
            } else {
                tutorialScreen.style.display = 'none';
            }
        });
    }

    /**
     * Boucle principale du jeu
     */
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        // Efface et prépare le canvas
        this.renderer.clear(this.doomMode);

        // Dessine le château
        this.renderer.drawCastle(this.doomMode);

        if (this.gameStarted) {
            // Mouvement du roi
            if (this.useMouseControl && this.mouseX !== null && this.mouseY !== null) {
                this.king.moveToTarget(this.mouseX, this.mouseY, this.renderer.width, this.renderer.height);
            } else {
                this.king.move(this.keys, this.renderer.width, this.renderer.height);
            }

            // Mouvement de la reine
            if (this.doomMode && !this.doomTransitionActive) {
                // Change de pattern périodiquement
                if (Date.now() - this.patternStartTime > CONFIG.PATTERN_DURATION) {
                    this.selectNewPattern();
                }
                this.queen.moveDoom(this.currentPattern, this.king);
            } else if (!this.doomMode) {
                const config = this.getDifficultyConfig();
                this.queen.moveNormal(this.king, config.queenSpeed);
            }

            // Gestion des projectiles
            this.handleProjectiles();

            // Collecte des diamants (mode normal uniquement)
            if (!this.doomMode) {
                for (let i = this.diamonds.length - 1; i >= 0; i--) {
                    if (this.diamonds[i] && this.diamonds[i].checkCollision(this.king)) {
                        this.renderer.createParticleExplosion(
                            this.diamonds[i].x + 17,
                            this.diamonds[i].y + 17,
                            '#00bfff',
                            15
                        );
                        this.diamonds.splice(i, 1);
                        this.score++;
                        this.updateScore();

                        if (this.score >= CONFIG.TARGET_SCORE) {
                            this.startDoomMode();
                            break; // Sortir de la boucle immédiatement après le passage en DOOM
                        } else {
                            setTimeout(() => {
                                if (!this.doomMode) { // Ne créer un diamant que si on n'est pas en mode DOOM
                                    this.createDiamond();
                                }
                            }, 500);
                        }
                    }
                }

                // Difficulté
                this.updateDifficulty();
            }

            // Dessine les diamants
            this.diamonds.forEach(diamond => this.renderer.drawDiamond(diamond));

            // Dessine les projectiles
            this.projectiles.forEach(p => this.renderer.drawProjectile(p));

            // Dessine la reine et le roi
            this.renderer.drawQueen(this.queen);
            this.renderer.drawKing(this.king);

            // Met à jour et dessine les bulles
            this.kingBubble.update();
            this.queenBubble.update();
            this.kingBubble.updatePosition(this.king.x, this.king.y);
            this.queenBubble.updatePosition(this.queen.x, this.queen.y);
            this.renderer.drawSpeechBubble(this.kingBubble);
            this.renderer.drawSpeechBubble(this.queenBubble);
        }

        // Particules
        this.renderer.updateParticles();

        // Restaure le contexte
        this.renderer.restore();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Démarrage du jeu
new Game();
console.log('🎮 Version Canvas chargée ! Meilleure performance garantie.');
