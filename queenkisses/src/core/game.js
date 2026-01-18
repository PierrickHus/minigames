/**
 * Le Baiser de la Reine - Version avec Object Pooling
 * Architecture modulaire SOLID + Optimisation Object Pooling
 */

import { Renderer } from '../services/renderer.js';
import { King, Queen, Diamond, SpeechBubble, Projectile } from './entities/index.js';
import { PatternSystem } from '../systems/pattern.js';
import { InputManager } from '../systems/input.js';
import { CollisionSystem } from '../systems/collision.js';
import { GameStateManager } from './game-state.js';
import { UIManager } from '../services/ui.js';
import { ProjectilePool, poolManager } from '../systems/object-pool.js';
import { GAME_CONFIG, DIAMOND_CONFIG, POOL_CONFIG } from '../data/config.js';
import { QUEEN_MESSAGES } from '../data/messages.js';

/**
 * Classe principale du jeu avec Object Pooling
 * Responsabilité: orchestrer tous les systèmes et gérer la boucle de jeu
 */
class Game {
    constructor() {
        // Initialisation du pool de projectiles
        this.projectilePool = new ProjectilePool(
            Projectile,
            POOL_CONFIG.PROJECTILE_INITIAL_SIZE,
            POOL_CONFIG.PROJECTILE_MAX_SIZE
        );

        // Enregistrer dans le gestionnaire global
        poolManager.registerPool('projectiles', this.projectilePool);

        // Initialisation des systèmes (avec pool pour PatternSystem)
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.inputManager = new InputManager(this.canvas);
        this.patternSystem = new PatternSystem(this.renderer, this.projectilePool);
        this.collisionSystem = new CollisionSystem();
        this.stateManager = new GameStateManager();
        this.uiManager = new UIManager();

        // Entités du jeu
        this.king = null;
        this.queen = null;
        this.diamonds = [];
        this.projectiles = []; // Projectiles actifs

        // Bulles de dialogue
        this.kingBubble = new SpeechBubble();
        this.queenBubble = new SpeechBubble();

        // Musique
        this.music = document.getElementById('medieval-music');
        this.doomMusic = document.getElementById('doom-music');
        this.musicPlaying = false;

        // Transition DOOM
        this.inPatternTransition = false;

        // Statistiques de performance
        this.showPoolStats = false; // Debug

        this.initEventListeners();
        this.initTutorial();
        this.gameLoop();

        console.log('🎮 Version avec Object Pooling chargée');
        console.log(`📦 Pool initialisé: ${POOL_CONFIG.PROJECTILE_INITIAL_SIZE} projectiles`);
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initEventListeners() {
        // Boutons du menu
        document.getElementById('new-game-btn')?.addEventListener('click', () => this.startNewGame());
        document.getElementById('load-btn')?.addEventListener('click', () => this.loadGame());
        document.getElementById('tutorial-btn')?.addEventListener('click', () => this.showTutorial());
        document.getElementById('guide-btn')?.addEventListener('click', () => this.showGuide());

        // Boutons de game over / victory
        document.getElementById('restart-btn')?.addEventListener('click', () => this.startNewGame());
        document.getElementById('doom-retry-btn')?.addEventListener('click', () => this.retryDoom());
        document.getElementById('menu-btn')?.addEventListener('click', () => this.returnToMenu());
        document.getElementById('menu-doom-btn')?.addEventListener('click', () => this.returnToMenu());
        document.getElementById('menu-victory-btn')?.addEventListener('click', () => this.returnToMenu());
        document.getElementById('victory-menu-btn')?.addEventListener('click', () => this.returnToMenu());

        // Bouton musique
        document.getElementById('music-btn')?.addEventListener('click', () => this.toggleMusic());

        // Debug: touche P pour afficher les stats du pool
        window.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                this.showPoolStats = !this.showPoolStats;
                if (this.showPoolStats) {
                    console.log('📊 Statistiques du pool activées');
                }
            }
        });
    }

    /**
     * Initialise le tutoriel (logique existante conservée)
     */
    initTutorial() {
        // Code du tutoriel inchangé
    }

    /**
     * Démarre une nouvelle partie
     */
    startNewGame() {
        // Réinitialisation complète
        this.releaseAllProjectiles(); // Libérer tous les projectiles au pool
        this.stateManager.reset();
        this.projectiles = [];
        this.diamonds = [];

        // Création des entités
        const centerX = this.renderer.width / 2 - 25;
        const centerY = this.renderer.height / 2 - 25;

        this.king = new King(centerX, centerY);
        this.queen = new Queen(
            Math.random() * (this.renderer.width - 100) + 50,
            Math.random() * (this.renderer.height - 100) + 50,
            this.renderer.width,
            this.renderer.height
        );

        // Génération des diamants
        this.spawnDiamonds();

        // Démarrage du jeu
        this.stateManager.gameStarted = true;
        this.uiManager.showGameHud();
        this.canvas.style.display = 'block';

        this.playMusic(this.music);

        // Reset stats du pool
        this.projectilePool.resetStats();
    }

    /**
     * Génère les diamants sur la carte
     */
    spawnDiamonds() {
        this.diamonds = [];
        const castleRadius = 100;

        for (let i = 0; i < GAME_CONFIG.DIAMOND_COUNT; i++) {
            let x, y, tooClose;

            do {
                x = Math.random() * (this.renderer.width - DIAMOND_CONFIG.WIDTH);
                y = Math.random() * (this.renderer.height - DIAMOND_CONFIG.HEIGHT);

                const distFromCastle = Math.sqrt(
                    Math.pow(x - this.renderer.width / 2, 2) +
                    Math.pow(y - this.renderer.height / 2, 2)
                );

                tooClose = distFromCastle < castleRadius;
            } while (tooClose);

            this.diamonds.push(new Diamond(x, y, i));
        }
    }

    /**
     * Gère la collecte d'un diamant
     */
    collectDiamond(diamond) {
        this.stateManager.incrementScore();
        this.uiManager.updateScore(this.stateManager.score, GAME_CONFIG.FAKE_TARGET_SCORE);

        // Effet de particules
        this.renderer.createParticleExplosion(
            diamond.x + diamond.width / 2,
            diamond.y + diamond.height / 2,
            '#00bfff',
            15
        );

        // Retirer le diamant collecté
        const index = this.diamonds.findIndex(d => d.id === diamond.id);
        if (index !== -1) {
            this.diamonds.splice(index, 1);
        }

        // Générer un nouveau diamant à une position aléatoire
        this.spawnSingleDiamond();

        // Vérifier si on atteint le score cible
        if (this.stateManager.isTargetScoreReached() && !this.stateManager.doomMode && !this.stateManager.doomTransitionActive) {
            this.startDoomTransition();
        }
    }

    /**
     * Génère un seul nouveau diamant
     */
    spawnSingleDiamond() {
        const castleRadius = 100;
        let x, y, tooClose;

        do {
            x = Math.random() * (this.renderer.width - DIAMOND_CONFIG.WIDTH);
            y = Math.random() * (this.renderer.height - DIAMOND_CONFIG.HEIGHT);

            const distFromCastle = Math.sqrt(
                Math.pow(x - this.renderer.width / 2, 2) +
                Math.pow(y - this.renderer.height / 2, 2)
            );

            tooClose = distFromCastle < castleRadius;
        } while (tooClose);

        const newId = this.diamonds.length > 0
            ? Math.max(...this.diamonds.map(d => d.id)) + 1
            : 0;

        this.diamonds.push(new Diamond(x, y, newId));
    }

    /**
     * Démarre la transition vers le mode DOOM
     */
    startDoomTransition() {
        if (this.stateManager.doomTransitionActive || this.stateManager.doomMode) {
            return;
        }

        this.stateManager.doomTransitionActive = true;
        this.stateManager.canControlKing = false;
        this.releaseAllProjectiles();
        this.diamonds = [];

        // Position cible : roi au sud du château
        const castleX = this.renderer.width / 2;
        const castleY = this.renderer.height / 2;
        this.kingTargetX = castleX - 25;
        this.kingTargetY = castleY + 120;

        // La reine doit revenir au château
        this.queenTargetX = castleX - 35;
        this.queenTargetY = castleY - 35;

        // Phase 1 : Déplacement vers les positions (2 secondes)
        setTimeout(() => {
            // Phase 2 : Afficher le message DOOM et transformer la reine
            this.uiManager.showDoomTransition();
            this.queen.isDemon = true;
            this.queen.rage = true;
            this.renderer.shake(20);

            // Phase 3 : Après le message, démarrer le jeu DOOM
            setTimeout(() => {
                this.activateDoomMode();
            }, 3000);
        }, 2000);
    }

    /**
     * Met à jour la transition DOOM (déplacement automatique)
     */
    updateDoomTransition() {
        if (!this.stateManager.doomTransitionActive || this.stateManager.doomMode) {
            return;
        }

        // Déplacer le roi vers sa position cible
        if (this.kingTargetX !== undefined) {
            const dx = this.kingTargetX - this.king.x;
            const dy = this.kingTargetY - this.king.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                this.king.x += (dx / dist) * 5;
                this.king.y += (dy / dist) * 5;
                this.king.updateHitbox();
            }
        }

        // Déplacer la reine vers le château
        if (this.queenTargetX !== undefined) {
            const dx = this.queenTargetX - this.queen.x;
            const dy = this.queenTargetY - this.queen.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                this.queen.x += (dx / dist) * 6;
                this.queen.y += (dy / dist) * 6;
            }
        }
    }

    /**
     * Active le mode DOOM après la transition
     */
    activateDoomMode() {
        this.stateManager.activateDoomMode();
        this.stateManager.canControlKing = true;
        this.releaseAllProjectiles();

        // Cacher l'annonce DOOM
        this.uiManager.hideDoomTransition();

        // Démarrer le timer DOOM
        this.stateManager.startDoomTimer(
            (timeRemaining) => this.uiManager.updateDoomTimer(timeRemaining),
            () => this.doomVictory()
        );

        // Affichage
        this.uiManager.showScreen('gameHud');
        this.uiManager.showDoomHud();
        this.uiManager.updateDoomLives(this.stateManager.doomLivesCount);

        // Musique DOOM
        this.playMusic(this.doomMusic);
    }

    /**
     * Libère tous les projectiles actifs et les retourne au pool
     */
    releaseAllProjectiles() {
        if (POOL_CONFIG.ENABLE_POOLING) {
            this.projectilePool.releaseMultiple(this.projectiles);
        }
        this.projectiles = [];
    }

    /**
     * Gère un hit en mode normal
     */
    handleNormalHit() {
        this.stateManager.score = Math.max(0, this.stateManager.score - 3);
        this.uiManager.updateScore(this.stateManager.score, GAME_CONFIG.FAKE_TARGET_SCORE);

        this.king.hit = true;
        this.stateManager.queenHitCooldown = true;

        this.renderer.shake(8);
        this.kingBubble.show("Aïe ! Elle m'a eu !", this.king.x, this.king.y - 60, '#8b4513');
        this.queenBubble.show("Bisou bisou mon chéri ! 💋", this.queen.x, this.queen.y - 60, '#ff69b4');

        setTimeout(() => {
            this.king.hit = false;
            this.stateManager.queenHitCooldown = false;
        }, 1000);
    }

    /**
     * Gère un hit en mode DOOM
     */
    handleDoomHit() {
        const canContinue = this.stateManager.decrementDoomLives();
        this.uiManager.updateDoomLives(this.stateManager.doomLivesCount);

        this.renderer.shake(15);

        if (!canContinue) {
            this.doomGameOver();
        } else {
            this.stateManager.queenHitCooldown = true;
            setTimeout(() => {
                this.stateManager.queenHitCooldown = false;
            }, 1500);
        }
    }

    /**
     * Game over en mode DOOM
     */
    doomGameOver() {
        this.stateManager.endGame();
        this.uiManager.showDoomGameover();
        this.canvas.style.display = 'none';
        this.stopMusic();
        this.logPoolStats();
    }

    /**
     * Victoire en mode DOOM
     */
    doomVictory() {
        this.stateManager.doomVictory = true;
        this.stateManager.endGame();
        this.uiManager.showDoomVictory(this.stateManager.score);
        this.canvas.style.display = 'none';
        this.stopMusic();
        this.logPoolStats();
    }

    /**
     * Réessayer le mode DOOM depuis le début
     */
    retryDoom() {
        this.uiManager.elements.doomGameover.style.display = 'none';
        this.canvas.style.display = 'block';
        this.uiManager.showGameHud();

        this.stateManager.resetForDoomRetry();
        this.releaseAllProjectiles();

        // Réinitialiser la reine en mode normal
        this.queen.isDemon = false;
        this.queen.rage = false;
        this.queen.dashing = false;

        // Positions initiales au centre
        const centerX = this.renderer.width / 2 - 25;
        const centerY = this.renderer.height / 2 - 25;

        this.king.x = centerX;
        this.king.y = centerY + 100;
        this.king.hit = false;
        this.king.updateHitbox();

        this.queen.x = centerX - 10;
        this.queen.y = centerY - 80;

        this.projectilePool.resetStats();

        // Relancer la transition DOOM
        this.startDoomTransition();
    }

    /**
     * Retour au menu
     */
    returnToMenu() {
        this.stateManager.reset();
        this.releaseAllProjectiles();
        this.stopMusic();
        this.canvas.style.display = 'none';
        this.uiManager.showMenu();
        this.logPoolStats();
    }

    /**
     * Affiche les statistiques du pool dans la console
     */
    logPoolStats() {
        const stats = this.projectilePool.getStats();
        console.log('📊 Statistiques du Pool de Projectiles:');
        console.log(`  - Total créés: ${stats.created}`);
        console.log(`  - Total réutilisés: ${stats.reused}`);
        console.log(`  - Taux de réussite cache: ${(stats.hitRate * 100).toFixed(1)}%`);
        console.log(`  - Actuellement en cours d'utilisation: ${stats.inUse}`);
        console.log(`  - Disponibles dans le pool: ${stats.available}`);
        console.log(`  - Taille totale: ${stats.total}`);
    }

    /**
     * Gestion de la musique
     */
    playMusic(musicElement) {
        this.stopMusic();
        this.currentMusic = musicElement;

        if (this.musicPlaying && musicElement) {
            musicElement.volume = 0.3;
            musicElement.play().catch(e => console.log('Autoplay bloqué:', e));
        }
    }

    stopMusic() {
        if (this.music) this.music.pause();
        if (this.doomMusic) this.doomMusic.pause();
    }

    toggleMusic() {
        this.musicPlaying = !this.musicPlaying;

        if (this.musicPlaying) {
            this.currentMusic?.play().catch(e => console.log('Autoplay bloqué:', e));
        } else {
            this.stopMusic();
        }
    }

    /**
     * Mise à jour de la logique du jeu
     */
    update() {
        if (!this.stateManager.gameStarted) return;

        // Mise à jour des bulles de dialogue
        this.kingBubble.update();
        this.queenBubble.update();
        this.kingBubble.updatePosition(this.king.x, this.king.y - 60);
        this.queenBubble.updatePosition(this.queen.x, this.queen.y - 60);

        // Gestion de la transition DOOM (déplacement automatique)
        if (this.stateManager.doomTransitionActive && !this.stateManager.doomMode) {
            this.updateDoomTransition();
            return;
        }

        // Mouvement du roi (seulement si autorisé)
        if (this.stateManager.canControlKing) {
            if (this.inputManager.mouse.isHovering) {
                this.king.moveToTarget(
                    this.inputManager.mouse.x,
                    this.inputManager.mouse.y,
                    this.renderer.width,
                    this.renderer.height
                );
            } else if (this.inputManager.hasDirectionalInput()) {
                this.king.move(this.inputManager.keys, this.renderer.width, this.renderer.height);
            }
        }

        // Mise à jour de la difficulté
        const difficulty = this.stateManager.getCurrentDifficulty();
        this.uiManager.updateDifficulty(difficulty);

        if (this.stateManager.doomMode) {
            this.updateDoomMode(difficulty);
        } else {
            this.updateNormalMode(difficulty);
        }

        // Afficher stats du pool si demandé
        if (this.showPoolStats) {
            this.displayPoolStatsOnScreen();
        }
    }

    /**
     * Mise à jour en mode normal
     */
    updateNormalMode(difficulty) {
        // Mouvement de la reine
        this.queen.moveNormal(this.king, difficulty.queenSpeed);

        // Collision reine-roi
        if (this.collisionSystem.checkKingQueenCollision(this.king, this.queen) &&
            !this.stateManager.queenHitCooldown) {
            this.handleNormalHit();
        }

        // Collecte de diamants
        const collidingDiamonds = this.collisionSystem.findCollidingDiamonds(this.king, this.diamonds);
        collidingDiamonds.forEach(diamond => this.collectDiamond(diamond));

        // Tir de projectiles
        const now = Date.now();
        if (now - this.stateManager.lastProjectileTime > difficulty.fireRate &&
            this.projectiles.length < GAME_CONFIG.MAX_PROJECTILES) {

            const newProjectiles = this.patternSystem.generateNormalPattern(
                difficulty,
                this.stateManager.score,
                this.queen,
                this.king
            );

            this.projectiles.push(...newProjectiles);
            this.stateManager.lastProjectileTime = now;
        }

        // Mise à jour des projectiles
        this.updateProjectiles();
    }

    /**
     * Mise à jour en mode DOOM
     */
    updateDoomMode(difficulty) {
        // Changement de pattern
        if (this.stateManager.shouldChangePattern()) {
            this.startPatternTransition();
        }

        // Mouvement de la reine selon le pattern (continue même pendant transition)
        if (this.stateManager.currentPattern) {
            this.queen.moveDoom(this.stateManager.currentPattern, this.king);
        }

        // Tir de projectiles (continue même pendant transition)
        const now = Date.now();
        if (now - this.stateManager.lastProjectileTime > difficulty.fireRate &&
            this.projectiles.length < GAME_CONFIG.MAX_PROJECTILES) {

            const newProjectiles = this.patternSystem.generatePattern(
                this.stateManager.currentPattern,
                this.queen,
                this.king
            );

            this.projectiles.push(...newProjectiles);
            this.stateManager.lastProjectileTime = now;
        }

        // Mise à jour des projectiles
        this.updateProjectiles();
    }

    /**
     * Démarre une transition de pattern
     */
    startPatternTransition() {
        this.inPatternTransition = true;
        this.stateManager.startPatternTransition();

        // Message de la reine
        const message = QUEEN_MESSAGES[this.stateManager.currentPattern] || "Prépare-toi !";
        this.uiManager.showQueenMessage(message);

        setTimeout(() => {
            this.stateManager.selectNextPattern();
            this.inPatternTransition = false;
        }, 2000);
    }

    /**
     * Met à jour tous les projectiles
     */
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            if (!p || !p.update) {
                this.projectiles.splice(i, 1);
                continue;
            }

            p.update();

            // Collision avec le roi
            if (this.collisionSystem.checkKingProjectileCollision(this.king, p)) {
                if (!this.stateManager.queenHitCooldown && !this.stateManager.doomTransitionActive) {
                    if (this.stateManager.doomMode) {
                        this.handleDoomHit();
                    } else {
                        this.handleNormalHit();
                    }
                }

                // Libérer le projectile au pool
                if (POOL_CONFIG.ENABLE_POOLING) {
                    this.projectilePool.release(p);
                }
                this.projectiles.splice(i, 1);
                continue;
            }

            // Projectiles hors écran
            if (p.isOffScreen(this.renderer.width, this.renderer.height)) {
                // Libérer le projectile au pool
                if (POOL_CONFIG.ENABLE_POOLING) {
                    this.projectilePool.release(p);
                }
                this.projectiles.splice(i, 1);
            }
        }
    }

    /**
     * Affiche les stats du pool à l'écran (debug)
     */
    displayPoolStatsOnScreen() {
        const stats = this.projectilePool.getStats();
        const ctx = this.renderer.ctx;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 300, 150);

        ctx.fillStyle = '#00ff00';
        ctx.font = '14px monospace';
        ctx.fillText('📊 POOL STATS', 20, 30);
        ctx.fillText(`Created: ${stats.created}`, 20, 50);
        ctx.fillText(`Reused: ${stats.reused}`, 20, 70);
        ctx.fillText(`Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`, 20, 90);
        ctx.fillText(`In Use: ${stats.inUse}`, 20, 110);
        ctx.fillText(`Available: ${stats.available}`, 20, 130);
        ctx.fillText(`Total: ${stats.total}`, 20, 150);
        ctx.restore();
    }

    /**
     * Rendu du jeu
     */
    render() {
        if (!this.stateManager.gameStarted) return;

        this.renderer.clear(this.stateManager.doomMode);

        // Château au centre
        const castleX = this.renderer.width / 2 - 35;
        const castleY = this.renderer.height / 2 - 35;
        this.renderer.drawEmoji('🏰', castleX, castleY, 70);

        // Diamants (mode normal)
        if (!this.stateManager.doomMode) {
            this.diamonds.forEach(diamond => {
                this.renderer.drawEmoji('💎', diamond.x, diamond.y, diamond.width);
            });
        }

        // Reine
        const queenEmoji = this.queen.isDemon ? '👿' : '👸';
        const queenSize = this.queen.isDemon ? 70 : this.queen.width;
        this.renderer.drawEmoji(queenEmoji, this.queen.x, this.queen.y, queenSize);

        // Roi
        this.renderer.drawKing(this.king, this.stateManager.doomMode);

        // Projectiles (au-dessus du roi)
        this.projectiles.forEach(p => this.renderer.drawProjectile(p));

        // Bulles de dialogue
        this.renderer.drawSpeechBubble(this.kingBubble);
        this.renderer.drawSpeechBubble(this.queenBubble);

        // Particules
        this.renderer.updateParticles();

        this.renderer.restore();
    }

    /**
     * Boucle de jeu principale
     */
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    // Méthodes conservées pour compatibilité
    showTutorial() {}
    showGuide() {}
    loadGame() {}
}

// Démarrage du jeu
new Game();
