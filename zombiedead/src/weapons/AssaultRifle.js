import * as THREE from 'three';
import { Weapon } from './Weapon.js';
import {
    RIFLE_DAMAGE, RIFLE_FIRE_RATE, RIFLE_MAG_SIZE,
    RIFLE_RESERVE_AMMO, RIFLE_RELOAD_TIME_MS, RIFLE_SPREAD
} from '../constants.js';

/**
 * Fusil d'assaut automatique - cadence élevée, dégâts modérés
 */
export class AssaultRifle extends Weapon {
    constructor() {
        super({
            name: "Fusil d'assaut",
            damage: RIFLE_DAMAGE,
            fireRate: RIFLE_FIRE_RATE,
            magSize: RIFLE_MAG_SIZE,
            reserveAmmo: RIFLE_RESERVE_AMMO,
            reloadTimeMs: RIFLE_RELOAD_TIME_MS,
            spread: RIFLE_SPREAD,
            isAutomatic: true
        });
    }

    /**
     * Crée le mesh 3D du fusil d'assaut
     * @returns {THREE.Group}
     */
    createViewModel() {
        const group = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.5 });

        // Corps principal
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.4), metalMat);
        group.add(body);

        // Canon
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8),
            metalMat
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.3);
        group.add(barrel);

        // Chargeur
        const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.06), darkMat);
        magazine.position.set(0, -0.08, 0.05);
        magazine.rotation.x = -0.15;
        group.add(magazine);

        // Crosse
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.15), darkMat);
        stock.position.set(0, -0.01, 0.25);
        group.add(stock);

        // Viseur
        const sight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.03), metalMat);
        sight.position.set(0, 0.055, -0.05);
        group.add(sight);

        return group;
    }
}
