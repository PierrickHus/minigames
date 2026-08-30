import * as THREE from 'three';

/**
 * Raycaster spécialisé pour le tir d'armes
 * Gère le tir contre les PNJ et le décor séparément
 */
export class WeaponRaycaster {
    constructor() {
        this._raycaster = new THREE.Raycaster();
        this._raycaster.far = 100;
        this._direction = new THREE.Vector3();
    }

    /**
     * Lance un rayon de tir et teste d'abord les cibles PNJ, puis le décor
     * Retourne le hit le plus proche, qu'il soit PNJ ou décor
     * @param {THREE.Camera} camera
     * @param {THREE.Object3D[]} targetMeshes - Meshes des cibles PNJ
     * @param {THREE.Object3D[]} sceneMeshes - Meshes du décor (murs, voitures, etc.)
     * @param {number} spread - Dispersion du tir
     * @returns {{ hit: boolean, object: THREE.Object3D|null, point: THREE.Vector3|null, normal: THREE.Vector3|null, distance: number, isEnemy: boolean }}
     */
    castShot(camera, targetMeshes, sceneMeshes, spread = 0) {
        this._prepareDirection(camera, spread);
        this._raycaster.set(camera.position, this._direction);

        // Tester PNJ
        const enemyHit = this._findClosest(targetMeshes);
        // Tester décor
        const sceneHit = this._findClosest(sceneMeshes);

        // Retourner le plus proche des deux
        if (enemyHit && sceneHit) {
            if (enemyHit.distance <= sceneHit.distance) {
                return { ...enemyHit, isEnemy: true };
            }
            return { ...sceneHit, isEnemy: false };
        }
        if (enemyHit) return { ...enemyHit, isEnemy: true };
        if (sceneHit) return { ...sceneHit, isEnemy: false };

        return { hit: false, object: null, point: null, normal: null, distance: 0, isEnemy: false };
    }

    /**
     * Lance plusieurs rayons avec dispersion (fusil à pompe)
     * @param {THREE.Camera} camera
     * @param {THREE.Object3D[]} targetMeshes
     * @param {THREE.Object3D[]} sceneMeshes
     * @param {number} spread
     * @param {number} pelletCount
     * @returns {Array}
     */
    castMultipleShots(camera, targetMeshes, sceneMeshes, spread, pelletCount) {
        const results = [];
        for (let i = 0; i < pelletCount; i++) {
            results.push(this.castShot(camera, targetMeshes, sceneMeshes, spread));
        }
        return results;
    }

    /**
     * Prépare la direction du rayon avec dispersion optionnelle
     * @param {THREE.Camera} camera
     * @param {number} spread
     */
    _prepareDirection(camera, spread) {
        camera.getWorldDirection(this._direction);

        if (spread > 0) {
            this._direction.x += (Math.random() - 0.5) * spread;
            this._direction.y += (Math.random() - 0.5) * spread;
            this._direction.z += (Math.random() - 0.5) * spread;
            this._direction.normalize();
        }
    }

    /**
     * Trouve l'intersection la plus proche parmi un ensemble de meshes
     * @param {THREE.Object3D[]} meshes
     * @returns {{ hit: boolean, object: THREE.Object3D, point: THREE.Vector3, normal: THREE.Vector3, distance: number }|null}
     */
    _findClosest(meshes) {
        if (!meshes || meshes.length === 0) return null;

        const intersects = this._raycaster.intersectObjects(meshes, true);
        if (intersects.length === 0) return null;

        const closest = intersects[0];

        // Transformer la normale de l'espace local vers l'espace monde
        let worldNormal;
        if (closest.face) {
            worldNormal = closest.face.normal.clone();
            worldNormal.transformDirection(closest.object.matrixWorld);
        } else {
            worldNormal = new THREE.Vector3(0, 1, 0);
        }

        return {
            hit: true,
            object: closest.object,
            point: closest.point.clone(),
            normal: worldNormal,
            distance: closest.distance
        };
    }
}
