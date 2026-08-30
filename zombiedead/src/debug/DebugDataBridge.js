/**
 * Pont de données entre le jeu 3D et la page debug 2D
 * Utilise BroadcastChannel pour communiquer entre les deux onglets
 * Envoie un snapshot des données du jeu à intervalles réguliers
 * Fonctionne même quand le jeu est en pause grâce à un timer interne
 */

/** Intervalle d'envoi des snapshots en ms */
const BROADCAST_INTERVAL_MS = 100;

export class DebugDataBridge {
    /**
     * @param {import('../core/EventBus.js').EventBus} eventBus
     */
    constructor(eventBus) {
        this._eventBus = eventBus;
        this._channel = new BroadcastChannel('zombiedead-debug');
        this._lastBroadcast = 0;
        this.enabled = false;

        /** @type {object|null} Référence permanente vers l'état du jeu */
        this._gameState = null;

        /** Timer interne pour envoyer même quand la game loop est en pause */
        this._backgroundInterval = null;

        this._channel.onmessage = (e) => this._handleMessage(e.data);

        // Prévenir la page debug quand le jeu se recharge
        window.addEventListener('beforeunload', () => {
            this._channel.postMessage({ type: 'game-reload' });
        });
    }

    /**
     * Fournit la référence au gameState (appelé une fois à l'init)
     * @param {object} gameState
     */
    setGameState(gameState) {
        this._gameState = gameState;
    }

    /**
     * Appelé chaque frame par la game loop (complément au timer interne)
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (!this.enabled || !this._gameState) return;

        const now = performance.now();
        if (now - this._lastBroadcast < BROADCAST_INTERVAL_MS) return;
        this._lastBroadcast = now;

        this._sendSnapshot();
    }

    /** Construit et envoie un snapshot depuis le gameState courant */
    _sendSnapshot() {
        if (!this._gameState) return;

        const { player, playerCamera, enemyManager, waveManager, navGrid } = this._gameState;

        const snapshot = {
            timestamp: performance.now(),
            player: {
                x: player.position.x,
                z: player.position.z,
                health: player.health,
                maxHealth: player.maxHealth,
                score: player.score,
                isAlive: player.isAlive,
                rotationY: playerCamera.camera.rotation.y
            },
            zombies: enemyManager.zombies.map(z => ({
                type: z.type,
                x: z.position.x,
                z: z.position.z,
                health: z.health,
                maxHealth: z.maxHealth,
                speed: z.speed,
                state: z.state,
                isAlive: z.isAlive,
                damage: z.damage,
                scoreValue: z.scoreValue,
                pathData: z._pathData ? {
                    useDirectMode: z._pathData.useDirectMode,
                    waypointIndex: z._pathData.waypointIndex,
                    waypointCount: z._pathData.waypoints ? z._pathData.waypoints.length : 0,
                    waypoints: z._pathData.waypoints || [],
                    needsRecalc: z._pathData.needsRecalc,
                    recalcTimer: z._pathData.recalcTimer
                } : null
            })),
            wave: {
                current: waveManager.currentWave,
                remaining: waveManager.zombiesRemaining,
                isResting: waveManager.isResting
            },
            navGrid: {
                width: navGrid.gridWidth,
                height: navGrid.gridHeight,
                cellSize: navGrid.cellSize,
                cells: Array.from(navGrid.cells)
            }
        };

        this._channel.postMessage({ type: 'snapshot', data: snapshot });
    }

    /** Démarre le timer interne pour envoyer des snapshots même en pause */
    _startBackgroundBroadcast() {
        if (this._backgroundInterval) return;
        this._backgroundInterval = setInterval(() => {
            if (this.enabled && this._gameState) {
                this._sendSnapshot();
            }
        }, BROADCAST_INTERVAL_MS);
    }

    /** Arrête le timer interne */
    _stopBackgroundBroadcast() {
        if (this._backgroundInterval) {
            clearInterval(this._backgroundInterval);
            this._backgroundInterval = null;
        }
    }

    /**
     * Gère les messages de la page debug
     * @param {object} msg
     */
    _handleMessage(msg) {
        switch (msg.type) {
            case 'debug-connect':
                this.enabled = true;
                this._channel.postMessage({ type: 'debug-ack' });
                this._startBackgroundBroadcast();
                if (this._gameState) {
                    this._sendSnapshot();
                }
                this._eventBus.emit('debug-panel-connected');
                break;
            case 'debug-disconnect':
                this.enabled = false;
                this._stopBackgroundBroadcast();
                break;
        }
    }

    /** Nettoie le canal et le timer */
    dispose() {
        this._stopBackgroundBroadcast();
        this._channel.close();
    }
}
