import * as THREE from 'three';
import { WEAPON_SWAY_AMOUNT, WEAPON_RECOIL_AMOUNT, WEAPON_RECOIL_RECOVERY_SPEED } from '../constants.js';

/**
 * Gère le rendu de l'arme en vue FPS (bas-droite de l'écran)
 * Applique le balancement, le recul et l'animation de rechargement
 */
export class WeaponViewModel {
    /**
     * @param {THREE.Camera} camera
     * @param {THREE.Scene} scene
     */
    constructor(camera, scene) {
        this._camera = camera;
        this._scene = scene;

        /** @type {THREE.Group|null} Mesh de l'arme actuelle */
        this._currentModel = null;

        this._recoilOffset = 0;
        this._swayX = 0;
        this._swayY = 0;
        this._reloadOffset = 0;
        this._isReloading = false;
        this._reloadTimer = 0;
        this._reloadDuration = 0;

        // Conteneur attaché à la caméra
        this._container = new THREE.Group();
        camera.add(this._container);
    }

    /**
     * Change le modèle d'arme affiché
     * @param {THREE.Group} model - Nouveau mesh d'arme
     */
    setModel(model) {
        if (this._currentModel) {
            this._container.remove(this._currentModel);
        }
        this._currentModel = model;
        // Position FPS : bas-droite
        model.position.set(0.25, -0.2, -0.4);
        this._container.add(model);
    }

    /** Déclenche l'animation de recul */
    triggerRecoil() {
        this._recoilOffset = WEAPON_RECOIL_AMOUNT;
    }

    /**
     * Déclenche l'animation de rechargement
     * @param {number} durationMs - Durée du rechargement
     */
    triggerReload(durationMs) {
        this._isReloading = true;
        this._reloadTimer = 0;
        this._reloadDuration = durationMs / 1000;
    }

    /**
     * Met à jour les animations du viewmodel
     * @param {number} deltaTime
     * @param {{ x: number, y: number }} mouseDelta - Delta souris pour le sway
     */
    update(deltaTime, mouseDelta) {
        if (!this._currentModel) return;

        this._updateSway(mouseDelta);
        this._updateRecoil(deltaTime);
        this._updateReloadAnimation(deltaTime);

        this._currentModel.position.x = 0.25 + this._swayX;
        this._currentModel.position.y = -0.2 + this._swayY - this._recoilOffset * 0.5 - this._reloadOffset;
        this._currentModel.position.z = -0.4 + this._recoilOffset;
    }

    /**
     * Calcule le balancement de l'arme en fonction du mouvement souris
     * @param {{ x: number, y: number }} mouseDelta
     */
    _updateSway(mouseDelta) {
        this._swayX += (-mouseDelta.x * WEAPON_SWAY_AMOUNT - this._swayX) * 0.1;
        this._swayY += (-mouseDelta.y * WEAPON_SWAY_AMOUNT - this._swayY) * 0.1;
    }

    /**
     * Atténue progressivement le recul
     * @param {number} deltaTime
     */
    _updateRecoil(deltaTime) {
        this._recoilOffset *= (1 - WEAPON_RECOIL_RECOVERY_SPEED * deltaTime);
        if (this._recoilOffset < 0.001) {
            this._recoilOffset = 0;
        }
    }

    /**
     * Animation de rechargement (descente puis remontée)
     * @param {number} deltaTime
     */
    _updateReloadAnimation(deltaTime) {
        if (!this._isReloading) return;

        this._reloadTimer += deltaTime;
        const progress = this._reloadTimer / this._reloadDuration;

        if (progress < 0.5) {
            this._reloadOffset = progress * 0.6;
        } else if (progress < 1) {
            this._reloadOffset = (1 - progress) * 0.6;
        } else {
            this._reloadOffset = 0;
            this._isReloading = false;
        }
    }

    /** Nettoie le conteneur */
    dispose() {
        if (this._currentModel) {
            this._container.remove(this._currentModel);
        }
        this._camera.remove(this._container);
    }
}
