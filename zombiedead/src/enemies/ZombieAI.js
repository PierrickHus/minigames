import * as THREE from 'three';
import { ZombieState, LocomotionMode } from './Zombie.js';
import {
    ZOMBIE_ATTACK_COOLDOWN_MS, ZOMBIE_DETECTION_RANGE,
    ZOMBIE_ATTACK_WINDUP_MS, ZOMBIE_ATTACK_ANIM_DURATION_MS
} from '../constants.js';
import {
    ANIM_CONSTANTS, getPivots, animWalk, animLimp, animCrawl,
    animAttack, animBite
} from './ZombieAnimations.js';

const _direction = new THREE.Vector3();
const WAYPOINT_REACH_DISTANCE = 0.8;

/**
 * Intelligence artificielle des zombies style Zombicide
 * Utilise ZombieAnimations pour la logique d'animation partagée avec le viewer debug
 */
export class ZombieAI {
    /**
     * @param {import('./Zombie.js').Zombie} zombie
     * @param {THREE.Vector3} playerPosition
     * @param {number} deltaTime
     * @param {import('../core/EventBus.js').EventBus} eventBus
     */
    static update(zombie, playerPosition, deltaTime, eventBus) {
        if (!zombie.isAlive) return;
        if (zombie.state === ZombieState.FALLING) return;

        ZombieAI._ensureInit(zombie);

        const distToPlayer = zombie.position.distanceTo(playerPosition);

        switch (zombie.state) {
            case ZombieState.CHASE:
                ZombieAI._handleChase(zombie, playerPosition, distToPlayer, deltaTime);
                break;
            case ZombieState.ATTACK:
                ZombieAI._handleAttack(zombie, playerPosition, distToPlayer, deltaTime, eventBus);
                break;
        }

        ZombieAI._animate(zombie, deltaTime);
    }

    /** Initialise les propriétés d'animation et trouve les pivots */
    static _ensureInit(zombie) {
        if (zombie._shambleTimer !== undefined) return;

        zombie._shambleTimer = Math.random() * Math.PI * 2;
        zombie._speedVariation = 1 + (Math.random() - 0.5) * ANIM_CONSTANTS.SPEED_VARIATION;
        zombie._attackAnimTimer = 0;
        zombie._attackAnimPlaying = false;
        zombie._attackDamageDealt = false;
        zombie._attackCooldown = 0;

        zombie._pivots = getPivots(zombie.mesh);
        zombie._leftArmRestRotX = zombie._pivots.leftArm?.rotation.x ?? 0;
        zombie._rightArmRestRotX = zombie._pivots.rightArm?.rotation.x ?? 0;
    }

    // ========== ÉTATS ==========

    static _handleChase(zombie, playerPosition, distToPlayer, deltaTime) {
        if (distToPlayer > ZOMBIE_DETECTION_RANGE) return;

        if (distToPlayer <= zombie.attackRange) {
            zombie.state = ZombieState.ATTACK;
            zombie._attackCooldown = 0;
            zombie._attackAnimPlaying = false;
            zombie._attackDamageDealt = false;
            return;
        }

        const target = ZombieAI._getMovementTarget(zombie, playerPosition);

        _direction.set(target.x - zombie.position.x, 0, target.z - zombie.position.z);
        const distToTarget = _direction.length();
        if (distToTarget < 0.01) return;
        _direction.divideScalar(distToTarget);

        const sway = Math.sin(zombie._shambleTimer * 1.3) * 0.1;
        const deviatedX = _direction.x + _direction.z * sway;
        const deviatedZ = _direction.z - _direction.x * sway;

        const effectiveSpeed = zombie.speed * zombie._speedVariation * deltaTime;
        zombie.position.x += deviatedX * effectiveSpeed;
        zombie.position.z += deviatedZ * effectiveSpeed;

        const targetAngle = Math.atan2(_direction.x, _direction.z);
        const currentAngle = zombie.mesh.rotation.y;
        const angleDiff = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
        zombie.mesh.rotation.y += angleDiff * deltaTime * 3;
    }

    static _getMovementTarget(zombie, playerPosition) {
        const pd = zombie._pathData;
        if (!pd || pd.useDirectMode || !pd.waypoints || pd.waypoints.length === 0) {
            return { x: playerPosition.x, z: playerPosition.z };
        }
        const wp = pd.waypoints[pd.waypointIndex];
        const dist = Math.hypot(zombie.position.x - wp.x, zombie.position.z - wp.z);
        if (dist < WAYPOINT_REACH_DISTANCE) {
            pd.waypointIndex++;
            if (pd.waypointIndex >= pd.waypoints.length) {
                return { x: playerPosition.x, z: playerPosition.z };
            }
            return pd.waypoints[pd.waypointIndex];
        }
        return wp;
    }

    static _handleAttack(zombie, playerPosition, distToPlayer, deltaTime, eventBus) {
        if (distToPlayer > zombie.attackRange * 1.5 && !zombie._attackAnimPlaying) {
            zombie.state = ZombieState.CHASE;
            return;
        }

        _direction.subVectors(playerPosition, zombie.position);
        _direction.y = 0;
        if (_direction.lengthSq() > 0) {
            zombie.mesh.rotation.y = Math.atan2(_direction.x, _direction.z);
        }

        if (!zombie._attackAnimPlaying) {
            zombie._attackCooldown -= deltaTime * 1000;
            if (zombie._attackCooldown <= 0) {
                zombie._attackAnimPlaying = true;
                zombie._attackAnimTimer = 0;
                zombie._attackDamageDealt = false;
            }
            return;
        }

        zombie._attackAnimTimer += deltaTime * 1000;

        if (!zombie._attackDamageDealt && zombie._attackAnimTimer >= ZOMBIE_ATTACK_WINDUP_MS) {
            zombie._attackDamageDealt = true;
            if (distToPlayer <= zombie.attackRange * 1.3) {
                eventBus.emit('zombie-attack', {
                    damage: zombie.damage,
                    attackerPosition: zombie.position.clone(),
                    isBite: zombie.armCount === 0
                });
            }
        }

        if (zombie._attackAnimTimer >= ZOMBIE_ATTACK_ANIM_DURATION_MS) {
            zombie._attackAnimPlaying = false;
            zombie._attackCooldown = ZOMBIE_ATTACK_COOLDOWN_MS;
        }
    }

    // ========== ANIMATION (délègue à ZombieAnimations) ==========

    static _animate(zombie, deltaTime) {
        zombie._shambleTimer += deltaTime * ANIM_CONSTANTS.SHAMBLE_SWAY_SPEED * zombie._speedVariation;

        const result = zombie._attackAnimPlaying
            ? ZombieAI._getAttackAnim(zombie)
            : ZombieAI._getLocomotionAnim(zombie);

        ZombieAI._applyBodyTransform(zombie, result);
    }

    /** Retourne le résultat d'animation de locomotion selon le mode */
    static _getLocomotionAnim(zombie) {
        const { _pivots: pv, limbs, _shambleTimer: t } = zombie;
        switch (zombie.locomotion) {
            case LocomotionMode.CRAWL: return animCrawl(pv, limbs, t);
            case LocomotionMode.LIMP: return animLimp(pv, limbs, t, !limbs.leftLeg?.attached);
            default: return animWalk(pv, limbs, t);
        }
    }

    /** Retourne le résultat d'animation d'attaque (bras ou morsure) */
    static _getAttackAnim(zombie) {
        const { _pivots: pv, limbs, _attackAnimTimer: t } = zombie;
        if (zombie.armCount === 0) return animBite(pv, t);
        return animAttack(pv, limbs, t, zombie._leftArmRestRotX);
    }

    /** Applique les transformations du corps retournées par une animation */
    static _applyBodyTransform(zombie, result) {
        if (!result) return;
        if (result.bodyRotX !== undefined) zombie.mesh.rotation.x = result.bodyRotX;
        if (result.bodyRotZ !== undefined) zombie.mesh.rotation.z = result.bodyRotZ;
        if (result.bodyY !== undefined) zombie.mesh.position.y = result.bodyY;
        if (result.bodyZ !== undefined) zombie.mesh.position.z = result.bodyZ;
    }
}
