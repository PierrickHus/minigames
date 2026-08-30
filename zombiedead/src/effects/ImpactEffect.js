import * as THREE from 'three';
import {
    IMPACT_SPARK_COUNT, IMPACT_SPARK_SPEED, IMPACT_SPARK_LIFE_MS, IMPACT_SPARK_SIZE,
    IMPACT_DECAL_SIZE, IMPACT_DECAL_LIFETIME_MS, IMPACT_MAX_DECALS
} from '../constants.js';

/**
 * Gère les effets visuels d'impact de balle
 * Étincelles de particules + marques (decals) sur les surfaces
 */
export class ImpactEffectManager {
    /**
     * @param {THREE.Scene} scene
     * @param {import('./ParticleSystem.js').ParticleSystem} particleSystem
     */
    constructor(scene, particleSystem) {
        this._scene = scene;
        this._particleSystem = particleSystem;

        /** @type {Array<{ mesh: THREE.Mesh, removeAt: number }>} Pool de decals actifs */
        this._decals = [];

        this._decalMaterial = new THREE.MeshBasicMaterial({
            color: 0x222222,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this._decalGeometry = new THREE.PlaneGeometry(IMPACT_DECAL_SIZE, IMPACT_DECAL_SIZE);
    }

    /**
     * Crée un impact de balle sur une surface (décor)
     * @param {THREE.Vector3} point - Point d'impact
     * @param {THREE.Vector3} normal - Normale de la surface
     */
    createSurfaceImpact(point, normal) {
        this._emitSparks(point);
        this._addDecal(point, normal);
    }

    /**
     * Crée un impact de balle sur un PNJ (sang + marque de sang)
     * @param {THREE.Vector3} point - Point d'impact
     * @param {THREE.Vector3} normal - Normale de la surface touchée
     * @param {THREE.Object3D} object - Mesh touché (pour attacher le decal au PNJ)
     */
    createEnemyImpact(point, normal, object) {
        this._emitBloodSparks(point);
        this._addBloodDecal(point, normal, object);
    }

    /**
     * Met à jour les decals (supprime ceux qui ont expiré)
     * @param {number} deltaTime
     */
    update(deltaTime) {
        const now = performance.now();
        let i = this._decals.length;

        while (i--) {
            const decal = this._decals[i];
            const remaining = decal.removeAt - now;

            // Fondu pendant la dernière seconde
            if (remaining < 1000) {
                const newOpacity = Math.max(0, remaining / 1000) * 0.8;
                if (decal.mesh.material.opacity !== newOpacity) {
                    decal.mesh.material.opacity = newOpacity;
                }
            }

            if (remaining <= 0) {
                this._scene.remove(decal.mesh);
                decal.mesh.material.dispose();
                this._decals.splice(i, 1);
            }
        }
    }

    /**
     * Émet des étincelles jaune/orange au point d'impact
     * @param {THREE.Vector3} point
     */
    _emitSparks(point) {
        this._particleSystem.emit(point, {
            count: IMPACT_SPARK_COUNT,
            speed: IMPACT_SPARK_SPEED,
            life: IMPACT_SPARK_LIFE_MS / 1000,
            size: IMPACT_SPARK_SIZE,
            color: { r: 1, g: 0.7, b: 0.2 }
        });
    }

    /**
     * Émet des particules de sang au point d'impact sur un PNJ
     * @param {THREE.Vector3} point
     */
    _emitBloodSparks(point) {
        this._particleSystem.emit(point, {
            count: IMPACT_SPARK_COUNT + 4,
            speed: IMPACT_SPARK_SPEED,
            life: IMPACT_SPARK_LIFE_MS / 1000,
            size: IMPACT_SPARK_SIZE * 1.5,
            color: { r: 0.7, g: 0.05, b: 0.05 }
        });
    }

    /**
     * Place un decal (marque sombre) sur la surface au point d'impact
     * @param {THREE.Vector3} point
     * @param {THREE.Vector3} normal
     */
    _addDecal(point, normal) {
        // Supprimer les plus anciens si on dépasse la limite
        while (this._decals.length >= IMPACT_MAX_DECALS) {
            const oldest = this._decals.shift();
            this._scene.remove(oldest.mesh);
            oldest.mesh.material.dispose();
        }

        // Créer un nouveau decal positionné sur la surface
        const material = this._decalMaterial.clone();
        const mesh = new THREE.Mesh(this._decalGeometry, material);
        mesh.position.copy(point);

        // Orienter le decal selon la normale de la surface
        mesh.position.addScaledVector(normal, 0.01);
        mesh.lookAt(point.x + normal.x, point.y + normal.y, point.z + normal.z);

        // Rotation aléatoire autour de la normale pour varier l'apparence
        mesh.rotateZ(Math.random() * Math.PI * 2);

        // Légère variation de taille
        const scaleFactor = 0.7 + Math.random() * 0.6;
        mesh.scale.setScalar(scaleFactor);

        this._scene.add(mesh);
        this._decals.push({
            mesh,
            removeAt: performance.now() + IMPACT_DECAL_LIFETIME_MS
        });
    }

    /**
     * Place un decal de sang sur le mesh d'un PNJ, attaché à son parent pour suivre le mouvement
     * @param {THREE.Vector3} point - Point d'impact en espace monde
     * @param {THREE.Vector3} normal - Normale de la surface en espace monde
     * @param {THREE.Object3D} object - Mesh touché
     */
    _addBloodDecal(point, normal, object) {
        // Remonter au Group racine du PNJ pour attacher le decal
        let parent = object;
        while (parent.parent && parent.parent.type !== 'Scene') {
            parent = parent.parent;
        }

        const bloodMat = new THREE.MeshBasicMaterial({
            color: 0x8B0000,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const size = IMPACT_DECAL_SIZE * (1.2 + Math.random() * 0.8);
        const bloodGeo = new THREE.PlaneGeometry(size, size);
        const mesh = new THREE.Mesh(bloodGeo, bloodMat);

        // Convertir le point d'impact en espace local du parent
        const localPoint = parent.worldToLocal(point.clone());
        mesh.position.copy(localPoint);

        // Orienter le decal selon la normale (convertie en espace local)
        const localNormal = normal.clone().transformDirection(parent.matrixWorld.clone().invert());
        mesh.position.addScaledVector(localNormal, 0.02);
        const lookTarget = localPoint.clone().add(localNormal);
        mesh.lookAt(lookTarget);

        mesh.rotateZ(Math.random() * Math.PI * 2);

        parent.add(mesh);
        this._decals.push({
            mesh,
            removeAt: performance.now() + IMPACT_DECAL_LIFETIME_MS
        });
    }
}
