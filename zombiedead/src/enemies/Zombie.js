import * as THREE from 'three';
import {
    ZOMBIE_COLLISION_RADIUS, ZOMBIE_DEATH_FADE_DURATION_MS,
    SPEED_MULTIPLIER_ONE_LEG, SPEED_MULTIPLIER_NO_LEGS,
    ATTACK_MULTIPLIER_ONE_ARM, ATTACK_MULTIPLIER_NO_ARMS,
    BITE_ATTACK_RANGE, ZOMBIE_ATTACK_RANGE,
    CRAWL_HEIGHT, LIMP_HEIGHT, STUMP_COLOR
} from '../constants.js';

/** États possibles d'un zombie */
export const ZombieState = {
    IDLE: 'idle',
    CHASE: 'chase',
    ATTACK: 'attack',
    /** Transition quand une jambe est perdue (le zombie tombe) */
    FALLING: 'falling',
    DYING: 'dying',
    DEAD: 'dead'
};

/** Mode de locomotion */
export const LocomotionMode = {
    WALK: 'walk',
    LIMP: 'limp',
    CRAWL: 'crawl'
};

/** Noms des membres détachables */
export const LimbName = {
    LEFT_ARM: 'leftArm',
    RIGHT_ARM: 'rightArm',
    LEFT_LEG: 'leftLeg',
    RIGHT_LEG: 'rightLeg',
    NECK: 'neck'
};

/**
 * Entité zombie avec état, santé, membres détachables et hitbox
 */
export class Zombie {
    /**
     * @param {object} config
     * @param {number} config.health
     * @param {number} config.speed
     * @param {number} config.damage
     * @param {number} config.scoreValue
     * @param {THREE.Group} config.mesh
     * @param {string} config.type
     */
    constructor(config) {
        this.health = config.health;
        this.maxHealth = config.health;
        this.baseSpeed = config.speed;
        this.speed = config.speed;
        this.baseDamage = config.damage;
        this.damage = config.damage;
        this.scoreValue = config.scoreValue;
        this.type = config.type;
        this.mesh = config.mesh;
        this.position = this.mesh.position;
        this.radius = ZOMBIE_COLLISION_RADIUS;
        this.mass = 60;
        this.state = ZombieState.CHASE;
        this.isAlive = true;

        /** Vélocité verticale pour la gravité */
        this.velocityY = 0;
        /** Vélocité horizontale de poussée */
        this.pushVelocityX = 0;
        this.pushVelocityZ = 0;

        this._deathTimer = 0;

        // === Système de membres ===
        /** @type {Object<string, { hp: number, maxHp: number, attached: boolean, pivot: THREE.Group|null }>} */
        this.limbs = {};
        this.locomotion = LocomotionMode.WALK;
        this._fallingTimer = 0;
        this._legCount = 2;
        this._armCount = 2;
    }

    /**
     * Initialise les HP des membres à partir d'une config de HP par type
     * @param {{ arm: number, leg: number, neck: number }} limbHpConfig
     */
    initLimbs(limbHpConfig) {
        this.limbs = {
            [LimbName.LEFT_ARM]: { hp: limbHpConfig.arm, maxHp: limbHpConfig.arm, attached: true, pivot: null },
            [LimbName.RIGHT_ARM]: { hp: limbHpConfig.arm, maxHp: limbHpConfig.arm, attached: true, pivot: null },
            [LimbName.LEFT_LEG]: { hp: limbHpConfig.leg, maxHp: limbHpConfig.leg, attached: true, pivot: null },
            [LimbName.RIGHT_LEG]: { hp: limbHpConfig.leg, maxHp: limbHpConfig.leg, attached: true, pivot: null },
            [LimbName.NECK]: { hp: limbHpConfig.neck, maxHp: limbHpConfig.neck, attached: true, pivot: null }
        };

        // Lier les pivots du mesh aux données de membres
        for (const limbName of Object.keys(this.limbs)) {
            const pivot = this.mesh.getObjectByName(limbName);
            if (pivot) {
                this.limbs[limbName].pivot = pivot;
            }
        }
    }

    /**
     * Inflige des dégâts à un membre spécifique
     * @param {string} limbName - Nom du membre touché
     * @param {number} amount - Dégâts
     * @returns {{ severed: boolean, limbName: string, isHeadshot: boolean }}
     */
    damageLimb(limbName, amount) {
        const limb = this.limbs[limbName];
        if (!limb?.attached) {
            // Membre déjà arraché : la balle traverse, pas de dégâts
            return { severed: false, limbName, isHeadshot: false };
        }

        // Tir dans le cou : dégâts globaux (la tête est un point faible)
        if (limbName === LimbName.NECK) {
            limb.hp -= amount;
            this.health -= amount;
            if (this.health <= 0 || limb.hp <= 0) {
                return this._severLimb(limbName);
            }
            return { severed: false, limbName, isHeadshot: true };
        }

        // Tir dans un membre (bras/jambe) : dégâts uniquement sur le membre
        limb.hp -= amount;
        if (limb.hp <= 0) {
            return this._severLimb(limbName);
        }

        return { severed: false, limbName, isHeadshot: false };
    }

    /**
     * Inflige des dégâts globaux (torse)
     * @param {number} amount
     */
    takeDamage(amount) {
        if (!this.isAlive) return;
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    /**
     * Arrache un membre du zombie
     * @param {string} limbName
     * @returns {{ severed: boolean, limbName: string, isHeadshot: boolean, pivot: THREE.Group|null }}
     */
    _severLimb(limbName) {
        const limb = this.limbs[limbName];
        limb.attached = false;

        const isHeadshot = limbName === LimbName.NECK;

        // Décapitation = mort instantanée
        if (isHeadshot) {
            this.die();
            return { severed: true, limbName, isHeadshot: true, pivot: limb.pivot };
        }

        // Ajouter un moignon sanglant à la position du pivot
        if (limb.pivot) {
            const stump = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 6, 4),
                new THREE.MeshStandardMaterial({
                    color: STUMP_COLOR, roughness: 0.9,
                    emissive: STUMP_COLOR, emissiveIntensity: 0.15
                })
            );
            stump.name = `stump_${limbName}`;
            // Positionner le moignon là où était le pivot
            stump.position.copy(limb.pivot.position);
            this.mesh.add(stump);
        }

        // Recalculer les capacités
        this._updateLimbCounts();
        this._updateLocomotion();
        this._updateCombatStats();

        // Transition de chute si une jambe vient d'être perdue
        if ((limbName === LimbName.LEFT_LEG || limbName === LimbName.RIGHT_LEG) && this.state !== ZombieState.DYING) {
            this.state = ZombieState.FALLING;
            this._fallingTimer = 0.8;
        }

        return { severed: true, limbName, isHeadshot: false, pivot: limb.pivot };
    }

    /** Compte les membres restants et met à jour les compteurs */
    _updateLimbCounts() {
        this._armCount = 0;
        this._legCount = 0;

        if (this.limbs[LimbName.LEFT_ARM].attached) this._armCount++;
        if (this.limbs[LimbName.RIGHT_ARM].attached) this._armCount++;
        if (this.limbs[LimbName.LEFT_LEG].attached) this._legCount++;
        if (this.limbs[LimbName.RIGHT_LEG].attached) this._legCount++;
    }

    /** Met à jour le mode de locomotion selon les jambes restantes */
    _updateLocomotion() {
        if (this._legCount === 2) {
            this.locomotion = LocomotionMode.WALK;
            this.speed = this.baseSpeed;
        } else if (this._legCount === 1) {
            this.locomotion = LocomotionMode.LIMP;
            this.speed = this.baseSpeed * SPEED_MULTIPLIER_ONE_LEG;
        } else {
            this.locomotion = LocomotionMode.CRAWL;
            this.speed = this.baseSpeed * SPEED_MULTIPLIER_NO_LEGS;
        }
    }

    /** Met à jour les stats de combat selon les bras restants */
    _updateCombatStats() {
        if (this._armCount === 2) {
            this.damage = this.baseDamage;
        } else if (this._armCount === 1) {
            this.damage = Math.ceil(this.baseDamage * ATTACK_MULTIPLIER_ONE_ARM);
        } else {
            this.damage = Math.ceil(this.baseDamage * ATTACK_MULTIPLIER_NO_ARMS);
        }
    }

    /** @returns {number} Portée d'attaque effective (réduite sans bras) */
    get attackRange() {
        return this._armCount > 0 ? ZOMBIE_ATTACK_RANGE : BITE_ATTACK_RANGE;
    }

    /** @returns {number} Nombre de jambes restantes */
    get legCount() { return this._legCount; }

    /** @returns {number} Nombre de bras restants */
    get armCount() { return this._armCount; }

    /** @returns {boolean} Le zombie est-il un rampant */
    get isCrawling() { return this.locomotion === LocomotionMode.CRAWL; }

    /** @returns {boolean} Le zombie boite */
    get isLimping() { return this.locomotion === LocomotionMode.LIMP; }

    /** Déclenche la mort du zombie */
    die() {
        this.isAlive = false;
        this.state = ZombieState.DYING;
        this._deathTimer = ZOMBIE_DEATH_FADE_DURATION_MS / 1000;
    }

    /**
     * Met à jour la transition de chute (quand une jambe est perdue)
     * @param {number} deltaTime
     * @returns {boolean} true si la chute est terminée
     */
    updateFalling(deltaTime) {
        if (this.state !== ZombieState.FALLING) return false;

        this._fallingTimer -= deltaTime;
        const progress = 1 - Math.max(0, this._fallingTimer / 0.8);

        // Animation de chute sur le côté
        const targetHeight = this._legCount === 0 ? CRAWL_HEIGHT : LIMP_HEIGHT;
        this.mesh.position.y = targetHeight * progress;

        if (this._legCount === 0) {
            // Tombe en avant pour ramper (1.2 rad = fortement penché)
            this.mesh.rotation.x = progress * 1.2;
        } else {
            // Penche du côté de la jambe manquante
            const missingLeft = !this.limbs[LimbName.LEFT_LEG].attached;
            this.mesh.rotation.z = progress * (missingLeft ? 0.15 : -0.15);
        }

        if (this._fallingTimer <= 0) {
            this.state = ZombieState.CHASE;
            return true;
        }

        return false;
    }

    /**
     * Met à jour l'animation de mort
     * @param {number} deltaTime
     * @returns {boolean} true si le zombie doit être retiré
     */
    updateDeath(deltaTime) {
        if (this.state !== ZombieState.DYING) return false;

        this._deathTimer -= deltaTime;
        const progress = 1 - (this._deathTimer / (ZOMBIE_DEATH_FADE_DURATION_MS / 1000));

        this.mesh.rotation.x = -progress * (Math.PI / 2);
        this.mesh.position.y = -progress * 0.5;

        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.transparent = true;
                const targetOpacity = 1 - progress;
                if (child.material.opacity !== targetOpacity) {
                    child.material.opacity = targetOpacity;
                }
            }
        });

        if (this._deathTimer <= 0) {
            this.state = ZombieState.DEAD;
            return true;
        }

        return false;
    }
}
