import { ZombieAI } from './ZombieAI.js';
import { ZombieFactory } from './ZombieFactory.js';
import { LimbName } from './Zombie.js';
import { HEADSHOT_DAMAGE_MULTIPLIER } from '../constants.js';

/**
 * Gère la collection de zombies actifs
 * Responsable du spawn, de la mise à jour, du nettoyage et du lien avec le raycasting
 */
export class EnemyManager {
    /**
     * @param {THREE.Scene} scene
     * @param {import('../core/EventBus.js').EventBus} eventBus
     * @param {import('../physics/CollisionSystem.js').CollisionSystem} collisionSystem
     */
    constructor(scene, eventBus, collisionSystem) {
        this._scene = scene;
        this._eventBus = eventBus;
        this._collisionSystem = collisionSystem;

        /** @type {import('./Zombie.js').Zombie[]} */
        this.zombies = [];

        this._eventBus.on('weapon-hit', (data) => this._onWeaponHit(data));
    }

    /**
     * Fait apparaître un zombie dans la scène
     * @param {string} type - Type de zombie
     * @param {THREE.Vector3} position
     */
    spawnZombie(type, position) {
        const zombie = ZombieFactory.create(type, position);
        this._scene.add(zombie.mesh);
        this.zombies.push(zombie);
    }

    /**
     * Retourne tous les meshes de zombies vivants pour le raycasting
     * @returns {THREE.Object3D[]}
     */
    getTargetMeshes() {
        const meshes = [];
        for (const zombie of this.zombies) {
            if (zombie.isAlive) {
                meshes.push(zombie.mesh);
            }
        }
        return meshes;
    }

    /** @returns {number} Nombre de zombies encore vivants */
    getAliveCount() {
        let count = 0;
        for (const zombie of this.zombies) {
            if (zombie.isAlive) count++;
        }
        return count;
    }

    /**
     * Met à jour tous les zombies (IA, collisions, nettoyage des morts)
     * @param {number} deltaTime
     * @param {THREE.Vector3} playerPosition
     */
    update(deltaTime, playerPosition) {
        const toRemove = [];

        for (const zombie of this.zombies) {
            if (zombie.isAlive) {
                // Gérer la transition de chute (perte de jambe)
                zombie.updateFalling(deltaTime);
                ZombieAI.update(zombie, playerPosition, deltaTime, this._eventBus);
            } else if (zombie.updateDeath(deltaTime)) {
                toRemove.push(zombie);
            }
        }

        // Collisions entre zombies et avec les murs
        this._collisionSystem.resolveZombieCollisions(this.zombies);

        // Retrait des zombies complètement morts
        for (const zombie of toRemove) {
            this._removeZombie(zombie);
        }
    }

    /**
     * Gère un tir touchant un zombie
     * Identifie le membre touché via le mesh du raycast et applique les dégâts ciblés
     * @param {{ object: THREE.Object3D, point: THREE.Vector3, damage: number }} data
     */
    _onWeaponHit(data) {
        const zombie = this._findZombieByMesh(data.object);
        if (!zombie?.isAlive) return;

        const limbName = this._identifyLimb(data.object, zombie);
        const wasAlive = zombie.isAlive;
        let result;

        if (limbName) {
            // Dégâts ciblés sur un membre
            const damage = limbName === LimbName.NECK
                ? data.damage * HEADSHOT_DAMAGE_MULTIPLIER
                : data.damage;
            result = zombie.damageLimb(limbName, damage);
        } else {
            // Tir dans le torse : dégâts globaux
            zombie.takeDamage(data.damage);
            result = { severed: false, limbName: null, isHeadshot: false };
        }

        this._eventBus.emit('blood-effect', { point: data.point });

        // Membre arraché
        if (result.severed && result.pivot) {
            this._eventBus.emit('limb-severed', {
                zombie,
                limbName: result.limbName,
                pivot: result.pivot,
                point: data.point,
                isHeadshot: result.isHeadshot
            });
        }

        // Headshot (même sans arrachement)
        if (limbName === LimbName.NECK && wasAlive) {
            this._eventBus.emit('headshot', { point: data.point });
        }

        if (wasAlive && !zombie.isAlive) {
            this._eventBus.emit('zombie-killed', {
                type: zombie.type,
                scoreValue: zombie.scoreValue,
                position: zombie.position.clone(),
                isHeadshot: result.isHeadshot
            });
        }
    }

    /**
     * Identifie quel membre du zombie a été touché en remontant l'arbre du mesh
     * @param {THREE.Object3D} hitMesh - Mesh touché par le raycast
     * @param {import('./Zombie.js').Zombie} zombie
     * @returns {string|null} Nom du membre (LimbName) ou null si c'est le torse
     */
    _identifyLimb(hitMesh, zombie) {
        const limbNames = new Set([
            LimbName.LEFT_ARM, LimbName.RIGHT_ARM,
            LimbName.LEFT_LEG, LimbName.RIGHT_LEG,
            LimbName.NECK
        ]);

        // Remonter l'arbre depuis le mesh touché jusqu'à trouver un pivot nommé
        let current = hitMesh;
        while (current && current !== zombie.mesh) {
            if (limbNames.has(current.name)) {
                return current.name;
            }
            current = current.parent;
        }

        return null;
    }

    /**
     * Recherche le zombie propriétaire d'un mesh enfant
     * @param {THREE.Object3D} mesh
     * @returns {import('./Zombie.js').Zombie|null}
     */
    _findZombieByMesh(mesh) {
        // Remonte l'arbre jusqu'au Group racine du zombie
        let current = mesh;
        while (current.parent && current.parent.type !== 'Scene') {
            current = current.parent;
        }

        return this.zombies.find(z => z.mesh === current) || null;
    }

    /**
     * Retire un zombie de la scène et du tableau
     * @param {import('./Zombie.js').Zombie} zombie
     */
    _removeZombie(zombie) {
        this._scene.remove(zombie.mesh);

        // Libère les géométries et matériaux
        zombie.mesh.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });

        const index = this.zombies.indexOf(zombie);
        if (index !== -1) {
            this.zombies.splice(index, 1);
        }
    }

    /** Retire tous les zombies */
    clear() {
        for (const zombie of [...this.zombies]) {
            this._removeZombie(zombie);
        }
        this.zombies.length = 0;
    }
}
