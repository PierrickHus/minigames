import * as THREE from 'three';
import {
    PLAYER_HEIGHT, PLAYER_HEAD_BOB_SPEED, PLAYER_HEAD_BOB_AMPLITUDE,
    PLAYER_DAMAGE_SHAKE_INTENSITY, PLAYER_DAMAGE_SHAKE_DURATION_MS
} from '../constants.js';

/**
 * Caméra FPS avec effets de head-bob et tremblement de dégâts
 */
export class PlayerCamera {
    /**
     * @param {import('../core/EventBus.js').EventBus} eventBus
     */
    constructor(eventBus) {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.y = PLAYER_HEIGHT;

        this._bobTimer = 0;
        this._bobOffset = 0;
        this._shakeTimer = 0;
        this._shakeIntensity = 0;

        eventBus.on('player-damaged', (data) => {
            this._triggerShake(data.damage);
        });
    }

    /**
     * Met à jour les effets caméra
     * @param {number} deltaTime
     * @param {boolean} isMoving - Le joueur est-il en mouvement
     */
    update(deltaTime, isMoving) {
        this._updateHeadBob(deltaTime, isMoving);
        this._updateShake(deltaTime);

        this.camera.position.y = PLAYER_HEIGHT + this._bobOffset;
    }

    /**
     * Calcule l'effet de balancement pendant la marche
     * @param {number} deltaTime
     * @param {boolean} isMoving
     */
    _updateHeadBob(deltaTime, isMoving) {
        if (isMoving) {
            this._bobTimer += deltaTime * PLAYER_HEAD_BOB_SPEED;
            this._bobOffset = Math.sin(this._bobTimer) * PLAYER_HEAD_BOB_AMPLITUDE;
        } else {
            // Retour progressif à la position neutre
            this._bobOffset *= 0.9;
            this._bobTimer = 0;
        }
    }

    /**
     * Calcule le tremblement de la caméra lors de dégâts
     * @param {number} deltaTime
     */
    _updateShake(deltaTime) {
        if (this._shakeTimer <= 0) return;

        this._shakeTimer -= deltaTime * 1000;
        const shakeX = (Math.random() - 0.5) * this._shakeIntensity;
        const shakeY = (Math.random() - 0.5) * this._shakeIntensity;
        this.camera.rotation.x += shakeX;
        this.camera.rotation.z += shakeY;

        if (this._shakeTimer <= 0) {
            this.camera.rotation.z = 0;
        }
    }

    /**
     * Déclenche un tremblement proportionnel aux dégâts reçus
     * @param {number} damage
     */
    _triggerShake(damage) {
        const intensityRatio = damage / 100;
        this._shakeIntensity = PLAYER_DAMAGE_SHAKE_INTENSITY * intensityRatio;
        this._shakeTimer = PLAYER_DAMAGE_SHAKE_DURATION_MS;
    }
}
