import * as THREE from 'three';
import { Weapon } from './Weapon.js';
import {
    PISTOL_DAMAGE, PISTOL_FIRE_RATE, PISTOL_MAG_SIZE,
    PISTOL_RESERVE_AMMO, PISTOL_RELOAD_TIME_MS, PISTOL_SPREAD
} from '../constants.js';

/**
 * Pistolet semi-automatique - arme de départ fiable
 */
export class Pistol extends Weapon {
    constructor() {
        super({
            name: 'Pistolet',
            damage: PISTOL_DAMAGE,
            fireRate: PISTOL_FIRE_RATE,
            magSize: PISTOL_MAG_SIZE,
            reserveAmmo: PISTOL_RESERVE_AMMO,
            reloadTimeMs: PISTOL_RELOAD_TIME_MS,
            spread: PISTOL_SPREAD,
            isAutomatic: false
        });
    }

    /**
     * Crée le mesh 3D du pistolet pour le viewmodel
     * @returns {THREE.Group}
     */
    createViewModel() {
        const group = new THREE.Group();
        const material = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });

        // Corps du pistolet
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.25), material);
        group.add(body);

        // Crosse
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.06), material);
        grip.position.set(0, -0.1, 0.06);
        grip.rotation.x = 0.3;
        group.add(grip);

        // Canon
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8),
            material
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.18);
        group.add(barrel);

        return group;
    }
}
