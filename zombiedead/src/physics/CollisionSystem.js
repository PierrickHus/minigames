import * as THREE from 'three';
import { GRAVITY, GROUND_LEVEL, PUSH_FORCE, SPRINT_PUSH_MULTIPLIER, PLAYER_MASS } from '../constants.js';

/**
 * Système de collision avec gravité et bousculade basée sur la masse
 * Gère : joueur-mur, zombie-mur, joueur-zombie, zombie-zombie
 * Les entités se poussent mutuellement proportionnellement à leur masse
 */
export class CollisionSystem {
    constructor() {
        /** @type {THREE.Box3[]} Colliders statiques (murs, obstacles) */
        this._staticColliders = [];
    }

    /**
     * Ajoute un collider statique (AABB)
     * @param {THREE.Box3} box
     */
    addStaticCollider(box) {
        this._staticColliders.push(box);
    }

    /**
     * Applique la gravité à une entité
     * @param {{ position: THREE.Vector3, velocityY: number }} entity
     * @param {number} deltaTime
     * @param {number} groundY - Niveau du sol pour cette entité
     */
    applyGravity(entity, deltaTime, groundY = GROUND_LEVEL) {
        entity.velocityY -= GRAVITY * deltaTime;
        entity.position.y += entity.velocityY * deltaTime;

        if (entity.position.y <= groundY) {
            entity.position.y = groundY;
            entity.velocityY = 0;
        }
    }

    /**
     * Applique et atténue la vélocité de poussée d'un zombie
     * @param {import('../enemies/Zombie.js').Zombie} zombie
     * @param {number} deltaTime
     */
    applyPushVelocity(zombie, deltaTime) {
        if (Math.abs(zombie.pushVelocityX) < 0.01 && Math.abs(zombie.pushVelocityZ) < 0.01) return;

        zombie.position.x += zombie.pushVelocityX * deltaTime;
        zombie.position.z += zombie.pushVelocityZ * deltaTime;

        // Friction : atténuation rapide
        const friction = Math.max(0, 1 - 6 * deltaTime);
        zombie.pushVelocityX *= friction;
        zombie.pushVelocityZ *= friction;
    }

    /**
     * Résout la collision du joueur avec les éléments statiques
     * @param {number} x - Position X souhaitée
     * @param {number} z - Position Z souhaitée
     * @param {number} radius - Rayon du joueur
     * @returns {{ x: number, z: number }}
     */
    resolvePlayerCollision(x, z, radius) {
        let correctedX = x;
        let correctedZ = z;

        for (const box of this._staticColliders) {
            const resolved = this._resolveSphereAABB(correctedX, correctedZ, radius, box);
            correctedX = resolved.x;
            correctedZ = resolved.z;
        }

        return { x: correctedX, z: correctedZ };
    }

    /**
     * Résout les collisions joueur-zombies avec bousculade basée sur la masse
     * Le joueur et les zombies se repoussent, la force dépend du ratio de masse
     * @param {number} playerX
     * @param {number} playerZ
     * @param {number} playerRadius
     * @param {boolean} isSprinting - Le joueur sprinte (pousse plus fort)
     * @param {Array<import('../enemies/Zombie.js').Zombie>} zombies
     * @returns {{ x: number, z: number }} Position corrigée du joueur
     */
    resolvePlayerZombieCollisions(playerX, playerZ, playerRadius, isSprinting, zombies) {
        let correctedX = playerX;
        let correctedZ = playerZ;
        const pushMultiplier = isSprinting ? SPRINT_PUSH_MULTIPLIER : 1;

        for (const zombie of zombies) {
            if (!zombie.isAlive) continue;

            const dx = correctedX - zombie.position.x;
            const dz = correctedZ - zombie.position.z;
            const distSq = dx * dx + dz * dz;
            const minDist = playerRadius + zombie.radius;

            if (distSq >= minDist * minDist || distSq === 0) continue;

            const dist = Math.sqrt(distSq);
            const overlap = minDist - dist;
            const nx = dx / dist;
            const nz = dz / dist;

            // Ratio de masse : plus le zombie est lourd, moins le joueur le pousse
            const totalMass = PLAYER_MASS + zombie.mass;
            const playerRatio = zombie.mass / totalMass;
            const zombieRatio = PLAYER_MASS / totalMass;

            // Séparation immédiate proportionnelle à la masse
            correctedX += nx * overlap * playerRatio;
            correctedZ += nz * overlap * playerRatio;
            zombie.position.x -= nx * overlap * zombieRatio;
            zombie.position.z -= nz * overlap * zombieRatio;

            // Vélocité de poussée sur le zombie (bousculade)
            const pushStrength = PUSH_FORCE * zombieRatio * pushMultiplier;
            zombie.pushVelocityX -= nx * pushStrength;
            zombie.pushVelocityZ -= nz * pushStrength;
        }

        return { x: correctedX, z: correctedZ };
    }

    /**
     * Résout les collisions entre zombies et avec les murs
     * Les zombies se poussent mutuellement selon leur masse
     * @param {Array<import('../enemies/Zombie.js').Zombie>} zombies
     */
    resolveZombieCollisions(zombies) {
        for (const zombie of zombies) {
            if (!zombie.isAlive) continue;
            this._resolveZombieStaticCollisions(zombie);
        }

        this._resolveZombieToZombieSeparation(zombies);
    }

    /**
     * Pousse le zombie hors des murs
     * @param {import('../enemies/Zombie.js').Zombie} zombie
     */
    _resolveZombieStaticCollisions(zombie) {
        for (const box of this._staticColliders) {
            const resolved = this._resolveSphereAABB(
                zombie.position.x, zombie.position.z, zombie.radius, box
            );
            zombie.position.x = resolved.x;
            zombie.position.z = resolved.z;
        }
    }

    /**
     * Sépare les zombies qui se chevauchent avec bousculade basée sur la masse
     * @param {Array<import('../enemies/Zombie.js').Zombie>} zombies
     */
    _resolveZombieToZombieSeparation(zombies) {
        for (let i = 0; i < zombies.length; i++) {
            if (!zombies[i].isAlive) continue;

            for (let j = i + 1; j < zombies.length; j++) {
                if (!zombies[j].isAlive) continue;

                const a = zombies[i];
                const b = zombies[j];
                const dx = b.position.x - a.position.x;
                const dz = b.position.z - a.position.z;
                const distSq = dx * dx + dz * dz;
                const minDist = a.radius + b.radius;

                if (distSq >= minDist * minDist || distSq === 0) continue;

                const dist = Math.sqrt(distSq);
                const overlap = minDist - dist;
                const nx = dx / dist;
                const nz = dz / dist;

                // Séparation proportionnelle à la masse inverse
                const totalMass = a.mass + b.mass;
                const ratioA = b.mass / totalMass;
                const ratioB = a.mass / totalMass;

                a.position.x -= nx * overlap * ratioA;
                a.position.z -= nz * overlap * ratioA;
                b.position.x += nx * overlap * ratioB;
                b.position.z += nz * overlap * ratioB;

                // Légère poussée pour un effet de bousculade entre zombies
                const pushStrength = PUSH_FORCE * 0.3;
                a.pushVelocityX -= nx * pushStrength * ratioA;
                a.pushVelocityZ -= nz * pushStrength * ratioA;
                b.pushVelocityX += nx * pushStrength * ratioB;
                b.pushVelocityZ += nz * pushStrength * ratioB;
            }
        }
    }

    /**
     * Résout la collision sphère-AABB (utilisé pour joueur et zombies contre les murs)
     * @param {number} x
     * @param {number} z
     * @param {number} radius
     * @param {THREE.Box3} box
     * @returns {{ x: number, z: number }}
     */
    _resolveSphereAABB(x, z, radius, box) {
        const closestX = Math.max(box.min.x, Math.min(x, box.max.x));
        const closestZ = Math.max(box.min.z, Math.min(z, box.max.z));

        const distX = x - closestX;
        const distZ = z - closestZ;
        const distSq = distX * distX + distZ * distZ;

        if (distSq < radius * radius && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const overlap = radius - dist;
            return {
                x: x + (distX / dist) * overlap,
                z: z + (distZ / dist) * overlap
            };
        }

        return { x, z };
    }

    /**
     * Vérifie la proximité entre deux positions
     * @param {THREE.Vector3} posA
     * @param {THREE.Vector3} posB
     * @param {number} range
     * @returns {boolean}
     */
    checkProximity(posA, posB, range) {
        const dx = posA.x - posB.x;
        const dz = posA.z - posB.z;
        return (dx * dx + dz * dz) < range * range;
    }

    /** Supprime tous les colliders statiques */
    clear() {
        this._staticColliders.length = 0;
    }
}
