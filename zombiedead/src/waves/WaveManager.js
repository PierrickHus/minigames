import {
    WAVE_BASE_COUNT, WAVE_SCALING_FACTOR, WAVE_REST_DURATION_MS,
    WAVE_RUNNER_START_WAVE, WAVE_FATTY_START_WAVE, WAVE_ABOMINATION_START_WAVE,
    WAVE_RUNNER_RATIO, WAVE_FATTY_RATIO, WAVE_ABOMINATION_RATIO, WAVE_SPAWN_INTERVAL_MS
} from '../constants.js';
import { SpawnPoint } from './SpawnPoint.js';

/**
 * Gestionnaire des vagues de zombies
 * Contrôle la progression, le nombre de zombies par vague et le repos entre vagues
 */
export class WaveManager {
    /**
     * @param {import('../enemies/EnemyManager.js').EnemyManager} enemyManager
     * @param {import('../core/EventBus.js').EventBus} eventBus
     */
    constructor(enemyManager, eventBus) {
        this._enemyManager = enemyManager;
        this._eventBus = eventBus;

        this.currentWave = 0;
        this.zombiesRemaining = 0;
        this.isResting = false;

        this._restTimer = 0;
        this._spawnTimer = 0;
        this._zombiesToSpawn = 0;
        this._spawnPoints = SpawnPoint.generateEdgeSpawnPoints();
        this._playerPosition = null;

        this._eventBus.on('zombie-killed', () => {
            this.zombiesRemaining--;
            if (this.zombiesRemaining <= 0 && this._zombiesToSpawn <= 0) {
                this._startRest();
            }
        });
    }

    /**
     * Met à jour la logique de vague (repos, spawn progressif)
     * @param {number} deltaTime
     * @param {import('three').Vector3} playerPosition
     */
    update(deltaTime, playerPosition) {
        this._playerPosition = playerPosition;

        if (this.isResting) {
            this._restTimer -= deltaTime * 1000;
            if (this._restTimer <= 0) {
                this.startNextWave();
            }
            return;
        }

        // Spawn progressif des zombies de la vague courante
        if (this._zombiesToSpawn > 0) {
            this._spawnTimer -= deltaTime * 1000;
            if (this._spawnTimer <= 0) {
                this._spawnOneZombie();
                this._spawnTimer = WAVE_SPAWN_INTERVAL_MS;
            }
        }
    }

    /** Démarre la vague suivante */
    startNextWave() {
        this.currentWave++;
        this.isResting = false;

        const totalZombies = WAVE_BASE_COUNT + (this.currentWave - 1) * WAVE_SCALING_FACTOR;
        this._zombiesToSpawn = totalZombies;
        this.zombiesRemaining = totalZombies;
        this._spawnTimer = 0;

        this._eventBus.emit('wave-start', { wave: this.currentWave, totalZombies });
    }

    /** Démarre la période de repos entre deux vagues */
    _startRest() {
        this.isResting = true;
        this._restTimer = WAVE_REST_DURATION_MS;
        this._eventBus.emit('wave-complete', { wave: this.currentWave });
    }

    /** Fait apparaître un zombie au point de spawn le plus valide */
    _spawnOneZombie() {
        const type = this._chooseZombieType();
        const spawnPoint = this._pickValidSpawnPoint();

        if (spawnPoint) {
            this._enemyManager.spawnZombie(type, spawnPoint.position.clone());
        }

        this._zombiesToSpawn--;
    }

    /**
     * Choisit le type de zombie en fonction de la vague actuelle
     * Progression Zombicide : walker -> runner -> fatty -> abomination
     * @returns {string}
     */
    _chooseZombieType() {
        const roll = Math.random();

        if (this.currentWave >= WAVE_ABOMINATION_START_WAVE && roll < WAVE_ABOMINATION_RATIO) {
            return 'abomination';
        }
        if (this.currentWave >= WAVE_FATTY_START_WAVE && roll < WAVE_ABOMINATION_RATIO + WAVE_FATTY_RATIO) {
            return 'fatty';
        }
        if (this.currentWave >= WAVE_RUNNER_START_WAVE && roll < WAVE_ABOMINATION_RATIO + WAVE_FATTY_RATIO + WAVE_RUNNER_RATIO) {
            return 'runner';
        }

        return 'walker';
    }

    /**
     * Sélectionne un point de spawn valide (loin du joueur)
     * @returns {SpawnPoint|null}
     */
    _pickValidSpawnPoint() {
        if (!this._playerPosition) return this._spawnPoints[0];

        const validPoints = this._spawnPoints.filter(
            sp => sp.isValidForSpawn(this._playerPosition)
        );

        if (validPoints.length === 0) return this._spawnPoints[0];

        return validPoints[Math.floor(Math.random() * validPoints.length)];
    }

    /** Réinitialise le gestionnaire pour une nouvelle partie */
    reset() {
        this.currentWave = 0;
        this.zombiesRemaining = 0;
        this.isResting = false;
        this._zombiesToSpawn = 0;
        this._restTimer = 0;
    }
}
