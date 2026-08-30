import * as THREE from 'three';
import {
    PLAYER_SPEED, PLAYER_SPRINT_SPEED, PLAYER_RADIUS, PLAYER_HEIGHT,
    GRAVITY, GROUND_LEVEL,
    DODGE_SPEED, DODGE_DURATION_MS, DODGE_COOLDOWN_MS, DODGE_COLLISION_RADIUS_MULTIPLIER
} from '../constants.js';

const MOUSE_SENSITIVITY = 0.002;
const PITCH_LIMIT = Math.PI / 2 - 0.01;

/**
 * Contrôleur FPS du joueur
 * Gère le mouvement ZQSD, la rotation souris, la gravité, les collisions et l'esquive
 */
export class PlayerController {
    /**
     * @param {import('../input/InputManager.js').InputManager} inputManager
     * @param {import('./PlayerCamera.js').PlayerCamera} playerCamera
     * @param {import('./Player.js').Player} player
     * @param {import('../physics/CollisionSystem.js').CollisionSystem} collisionSystem
     */
    constructor(inputManager, playerCamera, player, collisionSystem) {
        this._input = inputManager;
        this._playerCamera = playerCamera;
        this._player = player;
        this._collisionSystem = collisionSystem;

        this._yaw = 0;
        this._pitch = 0;
        this._direction = new THREE.Vector3();
        this._movement = new THREE.Vector3();

        /** Vélocité verticale du joueur pour la gravité */
        this._velocityY = 0;

        /** Indique si le joueur est en mouvement (pour le head bob) */
        this.isMoving = false;

        /** Indique si le joueur sprinte (pour la bousculade) */
        this.isSprinting = false;

        /** @type {Array<import('../enemies/Zombie.js').Zombie>} Référence aux zombies pour les collisions */
        this.zombies = [];

        // === Esquive ===
        this._isDodging = false;
        this._dodgeTimer = 0;
        this._dodgeCooldownTimer = 0;
        this._dodgeDirX = 0;
        this._dodgeDirZ = 0;
    }

    /** @returns {boolean} Le joueur est en esquive */
    get isDodging() {
        return this._isDodging;
    }

    /**
     * Met à jour la position et la rotation du joueur
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (!this._input.isPointerLocked) return;

        this._updateRotation();
        this._updateDodge(deltaTime);

        if (this._isDodging) {
            this._updateDodgeMovement(deltaTime);
        } else {
            this._updateMovement(deltaTime);
        }

        this._updateGravity(deltaTime);
    }

    /** Applique la rotation souris (yaw + pitch) */
    _updateRotation() {
        const mouseDelta = this._input.getMouseDelta();
        this._yaw -= mouseDelta.x * MOUSE_SENSITIVITY;
        this._pitch -= mouseDelta.y * MOUSE_SENSITIVITY;
        this._pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this._pitch));

        const camera = this._playerCamera.camera;
        camera.rotation.order = 'YXZ';
        camera.rotation.y = this._yaw;
        camera.rotation.x = this._pitch;
    }

    /**
     * Gère le déclenchement et le timer de l'esquive
     * Touche Espace pour esquiver dans la direction de mouvement courante
     * @param {number} deltaTime
     */
    _updateDodge(deltaTime) {
        if (this._dodgeCooldownTimer > 0) {
            this._dodgeCooldownTimer -= deltaTime * 1000;
        }

        // Déclenchement de l'esquive
        if (!this._isDodging && this._dodgeCooldownTimer <= 0 && this._input.isKeyDown('Space')) {
            this._startDodge();
        }

        // Timer d'esquive
        if (this._isDodging) {
            this._dodgeTimer -= deltaTime * 1000;
            if (this._dodgeTimer <= 0) {
                this._isDodging = false;
                this._dodgeCooldownTimer = DODGE_COOLDOWN_MS;
            }
        }
    }

    /** Démarre l'esquive dans la direction de mouvement, ou vers l'arrière par défaut */
    _startDodge() {
        this._isDodging = true;
        this._dodgeTimer = DODGE_DURATION_MS;

        // Direction d'esquive = direction de mouvement actuelle
        this._direction.set(0, 0, 0);
        if (this._input.isKeyDown('KeyW') || this._input.isKeyDown('KeyZ')) this._direction.z -= 1;
        if (this._input.isKeyDown('KeyS')) this._direction.z += 1;
        if (this._input.isKeyDown('KeyA') || this._input.isKeyDown('KeyQ')) this._direction.x -= 1;
        if (this._input.isKeyDown('KeyD')) this._direction.x += 1;

        // Par défaut esquive vers l'arrière si aucune touche
        if (this._direction.lengthSq() === 0) {
            this._direction.z = 1;
        }

        this._direction.normalize();
        this._direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this._yaw);

        this._dodgeDirX = this._direction.x;
        this._dodgeDirZ = this._direction.z;
    }

    /**
     * Mouvement pendant l'esquive : rapide, rayon de collision réduit
     * @param {number} deltaTime
     */
    _updateDodgeMovement(deltaTime) {
        const camera = this._playerCamera.camera;
        const dodgeRadius = PLAYER_RADIUS * DODGE_COLLISION_RADIUS_MULTIPLIER;

        let newX = camera.position.x + this._dodgeDirX * DODGE_SPEED * deltaTime;
        let newZ = camera.position.z + this._dodgeDirZ * DODGE_SPEED * deltaTime;

        // Collision avec les murs (rayon réduit)
        const wallCorrected = this._collisionSystem.resolvePlayerCollision(newX, newZ, dodgeRadius);
        newX = wallCorrected.x;
        newZ = wallCorrected.z;

        // Collision avec les zombies (rayon réduit = passe entre eux)
        const zombieCorrected = this._collisionSystem.resolvePlayerZombieCollisions(
            newX, newZ, dodgeRadius, false, this.zombies
        );

        camera.position.x = zombieCorrected.x;
        camera.position.z = zombieCorrected.z;
        this._player.position.set(camera.position.x, 0, camera.position.z);

        this.isMoving = true;
    }

    /**
     * Calcule et applique le déplacement ZQSD avec collisions murs + zombies
     * @param {number} deltaTime
     */
    _updateMovement(deltaTime) {
        this._direction.set(0, 0, 0);

        if (this._input.isKeyDown('KeyW') || this._input.isKeyDown('KeyZ')) this._direction.z -= 1;
        if (this._input.isKeyDown('KeyS')) this._direction.z += 1;
        if (this._input.isKeyDown('KeyA') || this._input.isKeyDown('KeyQ')) this._direction.x -= 1;
        if (this._input.isKeyDown('KeyD')) this._direction.x += 1;

        this.isMoving = this._direction.lengthSq() > 0;
        this.isSprinting = this.isMoving &&
            (this._input.isKeyDown('ShiftLeft') || this._input.isKeyDown('ShiftRight'));

        if (!this.isMoving) return;

        this._direction.normalize();
        const speed = this.isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;

        this._movement.copy(this._direction);
        this._movement.applyAxisAngle(new THREE.Vector3(0, 1, 0), this._yaw);
        this._movement.multiplyScalar(speed * deltaTime);

        const camera = this._playerCamera.camera;
        let newX = camera.position.x + this._movement.x;
        let newZ = camera.position.z + this._movement.z;

        const wallCorrected = this._collisionSystem.resolvePlayerCollision(newX, newZ, PLAYER_RADIUS);
        newX = wallCorrected.x;
        newZ = wallCorrected.z;

        const zombieCorrected = this._collisionSystem.resolvePlayerZombieCollisions(
            newX, newZ, PLAYER_RADIUS, this.isSprinting, this.zombies
        );

        camera.position.x = zombieCorrected.x;
        camera.position.z = zombieCorrected.z;
        this._player.position.set(camera.position.x, 0, camera.position.z);
    }

    /**
     * Applique la gravité au joueur
     * @param {number} deltaTime
     */
    _updateGravity(deltaTime) {
        const camera = this._playerCamera.camera;

        this._velocityY -= GRAVITY * deltaTime;
        camera.position.y += this._velocityY * deltaTime;

        const groundY = GROUND_LEVEL + PLAYER_HEIGHT;
        if (camera.position.y <= groundY) {
            camera.position.y = groundY;
            this._velocityY = 0;
        }
    }
}
