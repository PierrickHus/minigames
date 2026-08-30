import * as THREE from 'three';
import { WORLD_SIZE, SPAWN_EDGE_MARGIN, SPAWN_MIN_DISTANCE_FROM_PLAYER } from '../constants.js';

/**
 * Point de spawn pour les zombies
 * Vérifie que le spawn est assez loin du joueur
 */
export class SpawnPoint {
    /**
     * @param {THREE.Vector3} position
     */
    constructor(position) {
        this.position = position;
    }

    /**
     * Vérifie si ce point est valide pour faire apparaître un zombie
     * Le spawn est invalide si le joueur est trop proche
     * @param {THREE.Vector3} playerPosition
     * @returns {boolean}
     */
    isValidForSpawn(playerPosition) {
        const dx = this.position.x - playerPosition.x;
        const dz = this.position.z - playerPosition.z;
        return (dx * dx + dz * dz) > SPAWN_MIN_DISTANCE_FROM_PLAYER * SPAWN_MIN_DISTANCE_FROM_PLAYER;
    }

    /**
     * Génère un ensemble de points de spawn le long des bords de la carte
     * @returns {SpawnPoint[]}
     */
    static generateEdgeSpawnPoints() {
        const points = [];
        const halfSize = WORLD_SIZE / 2 - SPAWN_EDGE_MARGIN;
        const step = 5;

        // Bords nord et sud
        for (let x = -halfSize; x <= halfSize; x += step) {
            points.push(new SpawnPoint(new THREE.Vector3(x, 0, -halfSize)));
            points.push(new SpawnPoint(new THREE.Vector3(x, 0, halfSize)));
        }

        // Bords est et ouest
        for (let z = -halfSize; z <= halfSize; z += step) {
            points.push(new SpawnPoint(new THREE.Vector3(-halfSize, 0, z)));
            points.push(new SpawnPoint(new THREE.Vector3(halfSize, 0, z)));
        }

        return points;
    }
}
