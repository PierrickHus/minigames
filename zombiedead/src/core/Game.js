import { EventBus } from './EventBus.js';
import { GameLoop } from './GameLoop.js';
import { SceneManager } from '../scene/SceneManager.js';
import { setupLighting } from '../scene/LightingSetup.js';
import { createSkybox } from '../world/Skybox.js';
import { InputManager } from '../input/InputManager.js';
import { PlayerCamera } from '../player/PlayerCamera.js';
import { Player } from '../player/Player.js';
import { PlayerController } from '../player/PlayerController.js';
import { LevelBuilder } from '../world/LevelBuilder.js';
import { CollisionSystem } from '../physics/CollisionSystem.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { MuzzleFlash } from '../effects/MuzzleFlash.js';
import { createBloodBurst } from '../effects/BloodEffect.js';
import { AudioManager } from '../audio/AudioManager.js';
import { WeaponManager } from '../weapons/WeaponManager.js';
import { EnemyManager } from '../enemies/EnemyManager.js';
import { WaveManager } from '../waves/WaveManager.js';
import { HUDManager } from '../ui/HUDManager.js';
import { DamageOverlay } from '../ui/DamageOverlay.js';
import { MenuScreen } from '../ui/MenuScreen.js';
import { Minimap } from '../ui/Minimap.js';
import { NavGrid } from '../pathfinding/NavGrid.js';
import { PathRequestQueue } from '../pathfinding/PathRequestQueue.js';
import { DebugOverlay } from '../debug/DebugOverlay.js';
import { DebugDataBridge } from '../debug/DebugDataBridge.js';
import { ImpactEffectManager } from '../effects/ImpactEffect.js';
import { SeveredLimbManager } from '../effects/SeveredLimbManager.js';

/**
 * Orchestrateur principal du jeu ZombieDead
 * Initialise tous les sous-systèmes et gère la boucle de jeu
 */
export class Game {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this._canvas = canvas;

        /** @type {EventBus} */
        this.eventBus = null;
        /** @type {GameLoop} */
        this._gameLoop = null;
        /** @type {boolean} */
        this._isRunning = false;
    }

    /** Initialise tous les sous-systèmes dans l'ordre de dépendance */
    init() {
        // 1. Systèmes de base
        this.eventBus = new EventBus();
        this._sceneManager = new SceneManager(this._canvas);
        const scene = this._sceneManager.scene;

        // 2. Éclairage et environnement
        setupLighting(scene);
        createSkybox(scene);

        // 3. Entrées
        this._inputManager = new InputManager(this._canvas);

        // 4. Joueur
        this._playerCamera = new PlayerCamera(this.eventBus);
        this._sceneManager.setCamera(this._playerCamera.camera);
        scene.add(this._playerCamera.camera);

        this._player = new Player(this.eventBus);

        // 5. Physique
        this._collisionSystem = new CollisionSystem();

        // 6. Niveau
        const colliders = LevelBuilder.build(scene);
        for (const collider of colliders) {
            this._collisionSystem.addStaticCollider(collider);
        }

        // 7. Pathfinding
        this._navGrid = new NavGrid(this.eventBus);
        this._navGrid.generate(colliders);
        this._pathRequestQueue = new PathRequestQueue(this._navGrid, this.eventBus);

        // 8. Contrôleur joueur
        this._playerController = new PlayerController(
            this._inputManager, this._playerCamera, this._player, this._collisionSystem
        );

        // 9. Effets
        this._particleSystem = new ParticleSystem(scene);
        this._muzzleFlash = new MuzzleFlash(this._playerCamera.camera);
        this._impactEffects = new ImpactEffectManager(scene, this._particleSystem);

        // Collecter les meshes du décor pour le raycasting des impacts
        this._sceneMeshes = [];
        scene.traverse((child) => {
            if (child.isMesh && child.geometry) {
                this._sceneMeshes.push(child);
            }
        });

        this._severedLimbManager = new SeveredLimbManager(scene);

        // 10. Audio
        this._audioManager = new AudioManager(this._playerCamera.camera);

        // 11. Armes
        this._weaponManager = new WeaponManager(
            this._playerCamera.camera, scene, this.eventBus, this._inputManager
        );

        // 12. Ennemis
        this._enemyManager = new EnemyManager(scene, this.eventBus, this._collisionSystem);

        // 13. Vagues
        this._waveManager = new WaveManager(this._enemyManager, this.eventBus);

        // 14. UI
        this._minimap = new Minimap();
        this._minimap.setStaticColliders(colliders);
        this._hudManager = new HUDManager(this.eventBus);
        this._damageOverlay = new DamageOverlay(this.eventBus);
        this._menuScreen = new MenuScreen(this.eventBus);

        // 15. Debug (F3 = overlay 3D, debug.html = panneau 2D séparé)
        this._debugOverlay = new DebugOverlay(scene, this._navGrid, this.eventBus);
        this._debugBridge = new DebugDataBridge(this.eventBus);
        this._debugGameState = {
            player: this._player,
            playerCamera: this._playerCamera,
            enemyManager: this._enemyManager,
            waveManager: this._waveManager,
            navGrid: this._navGrid
        };
        // Fournir le gameState au bridge immédiatement pour les connexions debug avant le lancement
        this._debugBridge.setGameState(this._debugGameState);

        // 16. Boucle de jeu
        this._gameLoop = new GameLoop(
            (dt) => this._update(dt),
            () => this._render()
        );

        // 17. Connexion des événements inter-systèmes
        this._connectEvents();

        // 18. Configuration des menus
        this._setupMenus();
    }

    /** Connecte les événements entre les différents systèmes */
    _connectEvents() {
        this.eventBus.on('blood-effect', (data) => {
            createBloodBurst(this._particleSystem, data.point);
        });

        this.eventBus.on('weapon-fired', (data) => {
            this._muzzleFlash.trigger();
            const soundMap = {
                'Pistolet': 'gunshot',
                'Fusil à pompe': 'shotgun',
                "Fusil d'assaut": 'rifle'
            };
            this._audioManager.playSound(soundMap[data.weapon] || 'gunshot');
        });

        this.eventBus.on('weapon-reload', () => {
            this._audioManager.playSound('reload');
        });

        // Impacts de balles
        this.eventBus.on('impact-surface', (data) => {
            this._impactEffects.createSurfaceImpact(data.point, data.normal);
        });

        this.eventBus.on('impact-enemy', (data) => {
            this._impactEffects.createEnemyImpact(data.point, data.normal, data.object);
        });

        // Arrachement de membre
        this.eventBus.on('limb-severed', (data) => {
            // Giclée de sang massive au point d'arrachement
            this._particleSystem.emit(data.point, {
                count: 25,
                speed: 5,
                life: 0.8,
                size: 0.2,
                color: { r: 0.7, g: 0.02, b: 0.02 }
            });
            // Membre tombe au sol
            this._severedLimbManager.spawnSeveredLimb(data.pivot, data.point);
        });

        this.eventBus.on('zombie-attack', (data) => {
            // Le joueur esquive : pas de dégâts
            if (this._playerController.isDodging) return;

            this._player.takeDamage(data.damage);
            this._audioManager.playSound('hit');
        });

        this.eventBus.on('zombie-killed', (data) => {
            this._player.addScore(data.scoreValue);
        });

        this.eventBus.on('game-over', (data) => {
            this._gameLoop.pause();
            this._inputManager.exitPointerLock();
            this._menuScreen.showGameOver(data.score, this._waveManager.currentWave);
        });

        document.addEventListener('pointerlockchange', () => {
            if (!this._isRunning) return;

            if (this._inputManager.isPointerLocked) {
                // Pointer lock acquis : reprendre si en pause
                if (this._gameLoop.isPaused && this._player.isAlive) {
                    this._menuScreen.hidePause();
                    this._gameLoop.resume();
                }
            } else if (this._player.isAlive) {
                // Pointer lock perdu : mettre en pause
                this._gameLoop.pause();
                this._menuScreen.showPause();
            }
        });
    }

    /** Configure les callbacks des écrans de menu */
    _setupMenus() {
        this._menuScreen.onStart = () => this._startGame();
        this._menuScreen.onRestart = () => this._restartGame();
        this._menuScreen.onResume = () => this._resumeGame();
        this._menuScreen.showMenu();
    }

    /** Démarre une nouvelle partie */
    _startGame() {
        this._audioManager.init();
        this._inputManager.requestPointerLock();
        this._menuScreen.hideMenu();
        this._isRunning = true;
        this._waveManager.startNextWave();
        this._gameLoop.start();
    }

    /** Reprend la partie après une pause (le pointerlockchange gère le resume) */
    _resumeGame() {
        this._inputManager.requestPointerLock();
    }

    /** Redémarre la partie après un game over */
    _restartGame() {
        this._menuScreen.hideGameOver();
        this._enemyManager.clear();
        this._severedLimbManager.clear();
        this._player.reset();
        this._playerCamera.camera.position.set(0, 1.7, 0);
        this._waveManager.reset();
        this._inputManager.requestPointerLock();
        this._isRunning = true;
        this._waveManager.startNextWave();
        this._gameLoop.resume();
    }

    /**
     * Boucle de mise à jour principale
     * @param {number} deltaTime
     */
    _update(deltaTime) {
        const zombies = this._enemyManager.zombies;

        this._weaponManager.targetMeshes = this._enemyManager.getTargetMeshes();
        this._weaponManager.sceneMeshes = this._sceneMeshes;

        // Passer les zombies au contrôleur joueur pour les collisions
        this._playerController.zombies = zombies;

        this._playerController.update(deltaTime);
        this._weaponManager.update(deltaTime);
        this._pathRequestQueue.update(zombies, this._player.position, deltaTime);
        this._enemyManager.update(deltaTime, this._player.position);
        this._waveManager.update(deltaTime, this._player.position);

        // Physique : gravité et push velocity pour chaque zombie
        for (const zombie of zombies) {
            if (!zombie.isAlive) continue;
            this._collisionSystem.applyGravity(zombie, deltaTime);
            this._collisionSystem.applyPushVelocity(zombie, deltaTime);
        }

        this._particleSystem.update(deltaTime);
        this._muzzleFlash.update(deltaTime);
        this._impactEffects.update(deltaTime);
        this._severedLimbManager.update(deltaTime);
        this._playerCamera.update(deltaTime, this._playerController.isMoving);
        this._damageOverlay.update(deltaTime);
        this._hudManager.update(this._player, this._weaponManager, this._waveManager);
        this._minimap.update(
            this._player.position,
            this._playerCamera.camera.rotation.y,
            this._enemyManager.zombies
        );

        // Debug
        this._debugOverlay.update(this._enemyManager.zombies);
        this._debugBridge.update(deltaTime);

        this._inputManager.resetMouseDelta();
    }

    /** Rendu de la scène */
    _render() {
        this._sceneManager.render(this._playerCamera.camera);
    }
}
