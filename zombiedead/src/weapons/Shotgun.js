import * as THREE from 'three';
import { Weapon } from './Weapon.js';
import {
    SHOTGUN_DAMAGE, SHOTGUN_FIRE_RATE, SHOTGUN_MAG_SIZE,
    SHOTGUN_RESERVE_AMMO, SHOTGUN_RELOAD_TIME_MS, SHOTGUN_SPREAD,
    SHOTGUN_PELLET_COUNT
} from '../constants.js';

/**
 * Fusil à pompe - dégâts élevés à courte portée avec dispersion
 */
export class Shotgun extends Weapon {
    constructor() {
        super({
            name: 'Fusil à pompe',
            damage: SHOTGUN_DAMAGE,
            fireRate: SHOTGUN_FIRE_RATE,
            magSize: SHOTGUN_MAG_SIZE,
            reserveAmmo: SHOTGUN_RESERVE_AMMO,
            reloadTimeMs: SHOTGUN_RELOAD_TIME_MS,
            spread: SHOTGUN_SPREAD,
            isAutomatic: false,
            pelletCount: SHOTGUN_PELLET_COUNT
        });
    }

    /**
     * Crée le mesh 3D du fusil à pompe
     * @returns {THREE.Group}
     */
    createViewModel() {
        const group = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.4 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, metalness: 0.1, roughness: 0.8 });

        // Canon long
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8),
            metalMat
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.15);
        group.add(barrel);

        // Corps
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.25), metalMat);
        body.position.set(0, 0, 0.05);
        group.add(body);

        // Crosse en bois
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.2), woodMat);
        stock.position.set(0, -0.02, 0.22);
        group.add(stock);

        // Pompe
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.12), woodMat);
        pump.position.set(0, -0.04, -0.08);
        group.add(pump);

        return group;
    }
}
