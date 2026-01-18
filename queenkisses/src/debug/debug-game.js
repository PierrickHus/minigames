/**
 * Logique de jeu pour le mode debug des patterns
 * Réutilise tous les systèmes du jeu principal sans duplication
 */

import { Renderer } from '../services/renderer.js';
import { King, Queen, Projectile } from '../core/entities/index.js';
import { PatternSystem } from '../systems/pattern.js';
import { InputManager } from '../systems/input.js';
import { CollisionSystem } from '../systems/collision.js';
import { ProjectilePool } from '../systems/object-pool.js';
import { GAME_CONFIG, POOL_CONFIG } from '../data/config.js';
import { DOOM_PATTERNS } from '../data/patterns.js';

/**
 * Gestionnaire du mode debug avec Object Pooling
 */
export class DebugGame {
    constructor() {
        // Pool de projectiles
        this.projectilePool = new ProjectilePool(
            Projectile,
            POOL_CONFIG.PROJECTILE_INITIAL_SIZE,
            POOL_CONFIG.PROJECTILE_MAX_SIZE
        );

        // Systèmes partagés (avec pool pour PatternSystem)
        this.renderer = new Renderer(document.getElementById('game-canvas'));
        this.patternSystem = new PatternSystem(this.renderer, this.projectilePool);
        this.inputManager = new InputManager(this.renderer.canvas);
        this.collisionSystem = new CollisionSystem();

        // Entités
        const centerX = this.renderer.width / 2 - 25;
        const centerY = this.renderer.height / 2 - 25;
        this.king = new King(centerX, centerY);
        this.queen = new Queen(100, 100, this.renderer.width, this.renderer.height);

        // Projectiles
        this.projectiles = [];

        // Configuration debug
        this.currentPattern = DOOM_PATTERNS[0];
        this.fireRate = 350;
        this.lastFireTime = 0;
        this.kingAI = 'random';
        this.aiTimer = 0;
        this.aiTarget = { x: centerX, y: centerY };

        // Statistiques
        this.fps = 0;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fpsUpdateTime = 0;

        // Configuration de la reine pour DOOM
        this.queen.isDemon = true;

        this.setupUI();
        this.start();

        console.log('🐛 Mode Debug chargé avec Object Pooling');
        console.log(`📦 Pool initialisé: ${POOL_CONFIG.PROJECTILE_INITIAL_SIZE} projectiles`);
    }

    /**
     * Configure l'interface utilisateur du debug
     */
    setupUI() {
        // Sélecteur de pattern
        const patternSelect = document.getElementById('pattern-select');
        DOOM_PATTERNS.forEach(pattern => {
            const option = document.createElement('option');
            option.value = pattern;
            option.textContent = pattern.replace(/_/g, ' ').toUpperCase();
            patternSelect.appendChild(option);
        });

        patternSelect.addEventListener('change', (e) => {
            this.currentPattern = e.target.value;
            this.clearProjectiles();
        });

        // Sélecteur d'AI du roi
        document.getElementById('king-ai').addEventListener('change', (e) => {
            this.kingAI = e.target.value;
        });

        // Fire rate
        const fireRateSlider = document.getElementById('fire-rate');
        const fireRateValue = document.getElementById('fire-rate-value');

        fireRateSlider.addEventListener('input', (e) => {
            this.fireRate = parseInt(e.target.value);
            fireRateValue.textContent = `${this.fireRate}ms`;
        });

        // Boutons
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearProjectiles();
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetPositions();
        });
    }

    /**
     * Efface tous les projectiles et les retourne au pool
     */
    clearProjectiles() {
        if (POOL_CONFIG.ENABLE_POOLING) {
            this.projectilePool.releaseMultiple(this.projectiles);
        }
        this.projectiles = [];
    }

    /**
     * Réinitialise les positions
     */
    resetPositions() {
        const centerX = this.renderer.width / 2 - 25;
        const centerY = this.renderer.height / 2 - 25;

        this.king.x = centerX;
        this.king.y = centerY;
        this.king.updateHitbox();

        this.queen.x = centerX - 10;
        this.queen.y = centerY - 10;

        this.clearProjectiles();
    }

    /**
     * Met à jour l'AI du roi
     */
    updateKingAI() {
        this.aiTimer++;

        switch (this.kingAI) {
            case 'random':
                if (this.aiTimer % 60 === 0) {
                    this.aiTarget.x = Math.random() * (this.renderer.width - this.king.width);
                    this.aiTarget.y = Math.random() * (this.renderer.height - this.king.height);
                }
                this.king.moveToTarget(this.aiTarget.x, this.aiTarget.y, this.renderer.width, this.renderer.height);
                break;

            case 'circle':
                const angle = (this.aiTimer * 0.02) % (Math.PI * 2);
                const radius = 200;
                const centerX = this.renderer.width / 2;
                const centerY = this.renderer.height / 2;
                this.aiTarget.x = centerX + Math.cos(angle) * radius;
                this.aiTarget.y = centerY + Math.sin(angle) * radius;
                this.king.moveToTarget(this.aiTarget.x, this.aiTarget.y, this.renderer.width, this.renderer.height);
                break;

            case 'dodge':
                if (this.projectiles.length > 0) {
                    const nearest = this.findNearestProjectile();
                    if (nearest) {
                        const dx = this.king.x - nearest.x;
                        const dy = this.king.y - nearest.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < 100) {
                            this.aiTarget.x = this.king.x + (dx / dist) * 50;
                            this.aiTarget.y = this.king.y + (dy / dist) * 50;
                        }
                    }
                }
                this.king.moveToTarget(this.aiTarget.x, this.aiTarget.y, this.renderer.width, this.renderer.height);
                break;

            case 'edges':
                if (this.aiTimer % 120 === 0) {
                    const edges = [
                        { x: 50, y: 50 },
                        { x: this.renderer.width - 100, y: 50 },
                        { x: this.renderer.width - 100, y: this.renderer.height - 100 },
                        { x: 50, y: this.renderer.height - 100 }
                    ];
                    this.aiTarget = edges[Math.floor(Math.random() * edges.length)];
                }
                this.king.moveToTarget(this.aiTarget.x, this.aiTarget.y, this.renderer.width, this.renderer.height);
                break;

            case 'static':
                // Ne bouge pas
                break;
        }
    }

    /**
     * Trouve le projectile le plus proche du roi
     * @returns {Projectile|null} Projectile le plus proche
     */
    findNearestProjectile() {
        let nearest = null;
        let minDist = Infinity;

        for (const p of this.projectiles) {
            const dx = this.king.x - p.x;
            const dy = this.king.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                nearest = p;
            }
        }

        return nearest;
    }

    /**
     * Met à jour la logique du jeu
     */
    update() {
        // Tir de projectiles selon le pattern
        const now = Date.now();
        if (now - this.lastFireTime > this.fireRate && this.projectiles.length < GAME_CONFIG.MAX_PROJECTILES) {
            const newProjectiles = this.patternSystem.generatePattern(
                this.currentPattern,
                this.queen,
                this.king
            );
            this.projectiles.push(...newProjectiles);
            this.lastFireTime = now;
        }

        // Mise à jour des projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            if (!p || !p.update) {
                this.projectiles.splice(i, 1);
                continue;
            }

            p.update();

            if (p.isOffScreen(this.renderer.width, this.renderer.height)) {
                // Libérer le projectile au pool
                if (POOL_CONFIG.ENABLE_POOLING) {
                    this.projectilePool.release(p);
                }
                this.projectiles.splice(i, 1);
            }
        }

        // AI du roi
        this.updateKingAI();

        // Mouvement de la reine selon le pattern
        if (this.currentPattern) {
            this.queen.moveDoom(this.currentPattern, this.king);
        }

        // Mise à jour spirale de la reine
        this.queen.spiralAngle += 0.03;

        // Mise à jour des statistiques
        this.updateStats();
    }

    /**
     * Met à jour les statistiques affichées
     */
    updateStats() {
        this.frameCount++;

        const now = performance.now();
        const delta = now - this.fpsUpdateTime;

        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.frameCount = 0;
            this.fpsUpdateTime = now;

            // Mise à jour DOM (uniquement 1 fois par seconde)
            document.getElementById('stat-projectiles').textContent = this.projectiles.length;
            document.getElementById('stat-fps').textContent = this.fps;
            document.getElementById('stat-king-x').textContent = Math.round(this.king.x);
            document.getElementById('stat-king-y').textContent = Math.round(this.king.y);

            // Statistiques du pool (si debug activé)
            const stats = this.projectilePool.getStats();
            console.log(`📊 Pool - Reused: ${stats.reused}, Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
        }
    }

    /**
     * Rendu du jeu
     */
    render() {
        this.renderer.clear(true);

        // Château au centre
        const castleX = this.renderer.width / 2 - 35;
        const castleY = this.renderer.height / 2 - 35;
        this.renderer.drawEmoji('🏰', castleX, castleY, 70);

        // Reine démon
        this.renderer.drawEmoji('👿', this.queen.x, this.queen.y, 70);

        // Projectiles
        for (const p of this.projectiles) {
            this.renderer.drawProjectile(p);
        }

        // Roi
        this.renderer.drawKing(this.king, false);

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

    /**
     * Démarre le jeu
     */
    start() {
        this.gameLoop();
    }

    /**
     * Nettoie les ressources
     */
    dispose() {
        this.inputManager.dispose();
    }
}

// Démarrage du jeu debug
new DebugGame();
