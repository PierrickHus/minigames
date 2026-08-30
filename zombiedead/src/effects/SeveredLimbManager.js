import * as THREE from 'three';
import { GRAVITY, SEVERED_LIMB_LIFETIME_MS } from '../constants.js';

/**
 * Gère les membres arrachés qui tombent au sol avec physique simple
 * Chaque membre est un clone du mesh original, éjecté avec vélocité + rotation
 */
export class SeveredLimbManager {
    /**
     * @param {THREE.Scene} scene
     */
    constructor(scene) {
        this._scene = scene;

        /** @type {Array<{ mesh: THREE.Object3D, vx: number, vy: number, vz: number, ry: number, rx: number, removeAt: number, grounded: boolean }>} */
        this._limbs = [];
    }

    /**
     * Éjecte un membre arraché dans la scène
     * Clone le contenu du pivot, le place à sa position monde, et l'éjecte
     * @param {THREE.Group} pivot - Le pivot du membre (leftArm, etc.)
     * @param {THREE.Vector3} impactPoint - Point d'impact de la balle (direction d'éjection)
     */
    spawnSeveredLimb(pivot, impactPoint) {
        if (!pivot || pivot.children.length === 0) return;

        // Cloner le mesh du membre
        const clone = pivot.clone();
        clone.name = `severed_${pivot.name}`;

        // Position monde du pivot
        const worldPos = new THREE.Vector3();
        pivot.getWorldPosition(worldPos);
        clone.position.copy(worldPos);

        // Réinitialiser la rotation locale et appliquer la rotation monde
        const worldQuat = new THREE.Quaternion();
        pivot.getWorldQuaternion(worldQuat);
        clone.quaternion.copy(worldQuat);

        this._scene.add(clone);

        // Retirer le pivot original du zombie (le cacher)
        pivot.visible = false;

        // Direction d'éjection : opposée à l'impact
        const ejectionDir = new THREE.Vector3()
            .subVectors(worldPos, impactPoint)
            .normalize();

        const ejectionSpeed = 2 + Math.random() * 2;

        this._limbs.push({
            mesh: clone,
            vx: ejectionDir.x * ejectionSpeed + (Math.random() - 0.5),
            vy: 2 + Math.random() * 2,
            vz: ejectionDir.z * ejectionSpeed + (Math.random() - 0.5),
            rx: (Math.random() - 0.5) * 5,
            ry: (Math.random() - 0.5) * 3,
            removeAt: performance.now() + SEVERED_LIMB_LIFETIME_MS,
            grounded: false
        });
    }

    /**
     * Met à jour la physique et le cycle de vie des membres arrachés
     * @param {number} deltaTime
     */
    update(deltaTime) {
        const now = performance.now();
        let i = this._limbs.length;

        while (i--) {
            const limb = this._limbs[i];

            // Physique si pas encore au sol
            if (!limb.grounded) {
                limb.vy -= GRAVITY * deltaTime;
                limb.mesh.position.x += limb.vx * deltaTime;
                limb.mesh.position.y += limb.vy * deltaTime;
                limb.mesh.position.z += limb.vz * deltaTime;

                // Rotation pendant le vol
                limb.mesh.rotation.x += limb.rx * deltaTime;
                limb.mesh.rotation.y += limb.ry * deltaTime;

                // Au sol
                if (limb.mesh.position.y <= 0.05) {
                    limb.mesh.position.y = 0.05;
                    limb.grounded = true;
                    limb.vx = 0;
                    limb.vy = 0;
                    limb.vz = 0;
                }
            }

            // Fondu avant disparition (dernière seconde)
            const remaining = limb.removeAt - now;
            if (remaining < 1000) {
                const opacity = Math.max(0, remaining / 1000);
                limb.mesh.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.transparent = true;
                        child.material.opacity = opacity;
                    }
                });
            }

            // Suppression
            if (remaining <= 0) {
                this._scene.remove(limb.mesh);
                limb.mesh.traverse(child => {
                    if (child.isMesh) {
                        child.geometry?.dispose();
                        child.material?.dispose();
                    }
                });
                this._limbs.splice(i, 1);
            }
        }
    }

    /** Supprime tous les membres */
    clear() {
        for (const limb of this._limbs) {
            this._scene.remove(limb.mesh);
        }
        this._limbs.length = 0;
    }
}
