import * as THREE from 'three';
import { MUZZLE_FLASH_DURATION_MS, MUZZLE_FLASH_INTENSITY } from '../constants.js';

/**
 * Flash lumineux au bout du canon lors du tir
 * Crée une lumière ponctuelle temporaire
 */
export class MuzzleFlash {
    /**
     * @param {THREE.Camera} camera
     */
    constructor(camera) {
        this._light = new THREE.PointLight(0xffaa44, 0, 5);
        // Position relative à la caméra (bout du canon)
        this._light.position.set(0.15, -0.1, -0.6);
        camera.add(this._light);

        this._timer = 0;
    }

    /** Déclenche le flash */
    trigger() {
        this._light.intensity = MUZZLE_FLASH_INTENSITY;
        this._timer = MUZZLE_FLASH_DURATION_MS / 1000;
    }

    /**
     * Met à jour le timer du flash
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (this._timer <= 0) return;

        this._timer -= deltaTime;
        if (this._timer <= 0) {
            this._light.intensity = 0;
        }
    }
}
