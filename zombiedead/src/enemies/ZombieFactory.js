import * as THREE from 'three';
import { Zombie } from './Zombie.js';
import {
    ZOMBIE_WALKER_SPEED, ZOMBIE_WALKER_HEALTH,
    ZOMBIE_RUNNER_SPEED, ZOMBIE_RUNNER_HEALTH,
    ZOMBIE_FATTY_SPEED, ZOMBIE_FATTY_HEALTH,
    ZOMBIE_ABOMINATION_SPEED, ZOMBIE_ABOMINATION_HEALTH,
    ZOMBIE_ATTACK_DAMAGE, ZOMBIE_FATTY_ATTACK_DAMAGE, ZOMBIE_ABOMINATION_ATTACK_DAMAGE,
    ZOMBIE_SCORE_WALKER, ZOMBIE_SCORE_RUNNER, ZOMBIE_SCORE_FATTY, ZOMBIE_SCORE_ABOMINATION,
    ZOMBIE_BODY_WIDTH,
    ZOMBIE_COLLISION_RADIUS, ZOMBIE_FATTY_COLLISION_RADIUS, ZOMBIE_ABOMINATION_COLLISION_RADIUS,
    ZOMBIE_WALKER_MASS, ZOMBIE_RUNNER_MASS, ZOMBIE_FATTY_MASS, ZOMBIE_ABOMINATION_MASS,
    ZOMBIE_SKIN_DECAY_GREEN, ZOMBIE_SKIN_PALE, ZOMBIE_SKIN_DARK_DECAY, ZOMBIE_BLOOD_STAIN,
    ZOMBIE_CLOTHES_RAGS, ZOMBIE_CLOTHES_HOSPITAL, ZOMBIE_CLOTHES_OFFICE, ZOMBIE_CLOTHES_WORKER,
    LIMB_HP_WALKER, LIMB_HP_RUNNER, LIMB_HP_FATTY, LIMB_HP_ABOMINATION
} from '../constants.js';

const CLOTHES_COLORS = [
    ZOMBIE_CLOTHES_RAGS, ZOMBIE_CLOTHES_HOSPITAL,
    ZOMBIE_CLOTHES_OFFICE, ZOMBIE_CLOTHES_WORKER
];

const SKIN_COLORS = [ZOMBIE_SKIN_DECAY_GREEN, ZOMBIE_SKIN_PALE, ZOMBIE_SKIN_DARK_DECAY];

/** Configurations par type de zombie (nommage Zombicide) */
const ZOMBIE_CONFIGS = {
    walker: {
        health: ZOMBIE_WALKER_HEALTH, speed: ZOMBIE_WALKER_SPEED,
        damage: ZOMBIE_ATTACK_DAMAGE, scoreValue: ZOMBIE_SCORE_WALKER,
        scale: 1, collisionRadius: ZOMBIE_COLLISION_RADIUS, mass: ZOMBIE_WALKER_MASS,
        limbHp: LIMB_HP_WALKER
    },
    runner: {
        health: ZOMBIE_RUNNER_HEALTH, speed: ZOMBIE_RUNNER_SPEED,
        damage: ZOMBIE_ATTACK_DAMAGE, scoreValue: ZOMBIE_SCORE_RUNNER,
        scale: 0.95, collisionRadius: ZOMBIE_COLLISION_RADIUS, mass: ZOMBIE_RUNNER_MASS,
        limbHp: LIMB_HP_RUNNER
    },
    fatty: {
        health: ZOMBIE_FATTY_HEALTH, speed: ZOMBIE_FATTY_SPEED,
        damage: ZOMBIE_FATTY_ATTACK_DAMAGE, scoreValue: ZOMBIE_SCORE_FATTY,
        scale: 1.3, collisionRadius: ZOMBIE_FATTY_COLLISION_RADIUS, mass: ZOMBIE_FATTY_MASS,
        limbHp: LIMB_HP_FATTY
    },
    abomination: {
        health: ZOMBIE_ABOMINATION_HEALTH, speed: ZOMBIE_ABOMINATION_SPEED,
        damage: ZOMBIE_ABOMINATION_ATTACK_DAMAGE, scoreValue: ZOMBIE_SCORE_ABOMINATION,
        scale: 1.7, collisionRadius: ZOMBIE_ABOMINATION_COLLISION_RADIUS, mass: ZOMBIE_ABOMINATION_MASS,
        limbHp: LIMB_HP_ABOMINATION
    }
};

/**
 * Fabrique de zombies style Walking Dead / Zombicide
 * Les membres utilisent des pivots (Group) positionnés aux articulations
 * pour que les rotations se fassent autour des épaules/hanches
 */
export class ZombieFactory {
    /**
     * @param {string} type
     * @param {THREE.Vector3} position
     * @returns {Zombie}
     */
    static create(type, position) {
        const config = ZOMBIE_CONFIGS[type] || ZOMBIE_CONFIGS.walker;
        const mesh = ZombieFactory._buildMesh(type, config.scale);
        mesh.position.copy(position);

        const zombie = new Zombie({
            health: config.health, speed: config.speed,
            damage: config.damage, scoreValue: config.scoreValue,
            mesh, type
        });
        zombie.radius = config.collisionRadius;
        zombie.mass = config.mass;
        zombie.initLimbs(config.limbHp);

        return zombie;
    }

    /**
     * Construit un mesh avec le mode debug optionnel (pose en T, sans aléatoire)
     * @param {string} type
     * @param {number} scale
     * @param {boolean} [debugTPose=false] - Si true, construit en pose T sans éléments aléatoires
     * @returns {THREE.Group}
     */
    static _buildMesh(type, scale, debugTPose = false) {
        let group;
        switch (type) {
            case 'runner': group = ZombieFactory._buildRunner(scale, debugTPose); break;
            case 'fatty': group = ZombieFactory._buildFatty(scale, debugTPose); break;
            case 'abomination': group = ZombieFactory._buildAbomination(scale, debugTPose); break;
            default: group = ZombieFactory._buildWalker(scale, debugTPose); break;
        }
        return group;
    }

    /**
     * Construit un mesh en pose T pour le viewer debug
     * @param {string} type
     * @returns {THREE.Group}
     */
    static buildDebugMesh(type) {
        const config = ZOMBIE_CONFIGS[type] || ZOMBIE_CONFIGS.walker;
        return ZombieFactory._buildMesh(type, config.scale, true);
    }

    /** @returns {string[]} Liste des types disponibles */
    static getTypes() {
        return Object.keys(ZOMBIE_CONFIGS);
    }

    /** @returns {object} Configs exportées pour le debug */
    static getConfigs() {
        return ZOMBIE_CONFIGS;
    }

    // ========== BUILDERS PAR TYPE ==========

    /**
     * @param {number} scale
     * @param {boolean} debugTPose
     * @returns {THREE.Group}
     */
    static _buildWalker(scale, debugTPose) {
        const group = new THREE.Group();
        const skinColor = debugTPose ? ZOMBIE_SKIN_DECAY_GREEN : SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)];
        const clothesColor = debugTPose ? ZOMBIE_CLOTHES_RAGS : CLOTHES_COLORS[Math.floor(Math.random() * CLOTHES_COLORS.length)];

        const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.9 });
        const clothesMat = new THREE.MeshStandardMaterial({ color: clothesColor, roughness: 0.85 });
        const bloodMat = new THREE.MeshStandardMaterial({
            color: ZOMBIE_BLOOD_STAIN, roughness: 1, emissive: ZOMBIE_BLOOD_STAIN, emissiveIntensity: 0.1
        });

        // Torse
        ZombieFactory._createPart(group, 'torso',
            new THREE.BoxGeometry(ZOMBIE_BODY_WIDTH, 0.6, 0.25), clothesMat, 0, 1, 0);

        // Tache de sang
        if (!debugTPose && Math.random() > 0.3) {
            ZombieFactory._createPart(group, 'bloodStain',
                new THREE.BoxGeometry(0.2, 0.15, 0.01), bloodMat,
                (Math.random() - 0.5) * 0.2, 1, 0.13);
        }

        ZombieFactory._addHead(group, skinMat, 1.45);

        // Bras avec pivots aux épaules
        const armRestRotX = debugTPose ? 0 : -0.7;
        ZombieFactory._addPivotArm(group, skinMat, { x: -0.35, y: 1.25, width: 0.1, length: 0.5, rotX: armRestRotX, name: 'leftArm' });
        ZombieFactory._addPivotArm(group, skinMat, { x: 0.35, y: 1.25, width: 0.1, length: 0.5, rotX: armRestRotX, name: 'rightArm' });

        ZombieFactory._addPivotLegs(group, clothesMat, 0.14, 0.6, debugTPose);

        group.scale.setScalar(scale);
        return group;
    }

    /**
     * @param {number} scale
     * @param {boolean} debugTPose
     * @returns {THREE.Group}
     */
    static _buildRunner(scale, debugTPose) {
        const group = new THREE.Group();
        const skinMat = new THREE.MeshStandardMaterial({ color: ZOMBIE_SKIN_PALE, roughness: 0.85 });
        const clothesMat = new THREE.MeshStandardMaterial({ color: 0x4A4A5A, roughness: 0.8 });
        const bloodMat = new THREE.MeshStandardMaterial({
            color: ZOMBIE_BLOOD_STAIN, roughness: 1, emissive: ZOMBIE_BLOOD_STAIN, emissiveIntensity: 0.15
        });

        ZombieFactory._createPart(group, 'torso',
            new THREE.BoxGeometry(0.4, 0.55, 0.22), clothesMat, 0, 1, 0);

        // Bouche ensanglantée
        ZombieFactory._createPart(group, 'mouthBlood',
            new THREE.BoxGeometry(0.12, 0.06, 0.01), bloodMat, 0, 1.38, 0.13);

        ZombieFactory._addHead(group, skinMat, 1.45);

        const armRestRotX = debugTPose ? 0 : -0.3;
        ZombieFactory._addPivotArm(group, skinMat, { x: -0.3, y: 1.2, width: 0.1, length: 0.45, rotX: armRestRotX, name: 'leftArm' });
        ZombieFactory._addPivotArm(group, skinMat, { x: 0.3, y: 1.2, width: 0.1, length: 0.45, rotX: armRestRotX, name: 'rightArm' });

        ZombieFactory._addPivotLegs(group, clothesMat, 0.13, 0.55, debugTPose);

        group.scale.setScalar(scale);
        return group;
    }

    /**
     * @param {number} scale
     * @param {boolean} debugTPose
     * @returns {THREE.Group}
     */
    static _buildFatty(scale, debugTPose) {
        const group = new THREE.Group();
        const skinMat = new THREE.MeshStandardMaterial({ color: ZOMBIE_SKIN_DARK_DECAY, roughness: 0.95 });
        const clothesMat = new THREE.MeshStandardMaterial({ color: ZOMBIE_CLOTHES_WORKER, roughness: 0.9 });
        const bloodMat = new THREE.MeshStandardMaterial({
            color: ZOMBIE_BLOOD_STAIN, roughness: 1, emissive: ZOMBIE_BLOOD_STAIN, emissiveIntensity: 0.1
        });

        ZombieFactory._createPart(group, 'torso',
            new THREE.BoxGeometry(0.7, 0.7, 0.45), clothesMat, 0, 1, 0);

        // Ventre
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), skinMat);
        belly.name = 'belly';
        belly.position.set(0, 0.8, 0.2);
        belly.scale.set(1, 0.8, 0.7);
        belly.castShadow = true;
        group.add(belly);

        ZombieFactory._createPart(group, 'bellyBlood',
            new THREE.BoxGeometry(0.2, 0.15, 0.01), bloodMat, 0.05, 0.75, 0.35);

        ZombieFactory._addHead(group, skinMat, 1.5);

        const armRestRotX = debugTPose ? 0 : -0.4;
        ZombieFactory._addPivotArm(group, skinMat, { x: -0.53, y: 1.3, width: 0.18, length: 0.55, rotX: armRestRotX, name: 'leftArm' });
        ZombieFactory._addPivotArm(group, skinMat, { x: 0.53, y: 1.3, width: 0.18, length: 0.55, rotX: armRestRotX, name: 'rightArm' });

        ZombieFactory._addPivotLegs(group, clothesMat, 0.2, 0.6, debugTPose);

        group.scale.setScalar(scale);
        return group;
    }

    /**
     * @param {number} scale
     * @param {boolean} debugTPose
     * @returns {THREE.Group}
     */
    static _buildAbomination(scale, debugTPose) {
        const group = new THREE.Group();
        const skinMat = new THREE.MeshStandardMaterial({
            color: 0x3A4A2A, roughness: 0.95, emissive: 0x1A2A0A, emissiveIntensity: 0.1
        });
        const mutationMat = new THREE.MeshStandardMaterial({
            color: 0x5A2030, roughness: 0.8, emissive: 0x3A0010, emissiveIntensity: 0.2
        });
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xCCBBAA, roughness: 0.7 });

        ZombieFactory._createPart(group, 'torso',
            new THREE.BoxGeometry(0.9, 0.8, 0.5), skinMat, 0, 1.1, 0);

        // Excroissances mutantes
        const mutPositions = [
            { x: -0.3, y: 1.4, z: 0.2 }, { x: 0.25, y: 1.5, z: 0.15 }, { x: 0, y: 1.6, z: 0.25 }
        ];
        for (let i = 0; i < mutPositions.length; i++) {
            const pos = mutPositions[i];
            const mutation = new THREE.Mesh(
                new THREE.SphereGeometry(0.1 + (debugTPose ? 0.05 : Math.random() * 0.1), 6, 4),
                mutationMat
            );
            mutation.name = `mutation_${i}`;
            mutation.position.set(pos.x, pos.y, pos.z);
            mutation.castShadow = true;
            group.add(mutation);
        }

        // Tête déformée avec pivot nuque
        const neck = new THREE.Group();
        neck.name = 'neck';
        neck.position.set(0, 1.5, 0);

        const headMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.3, 0.3), skinMat
        );
        headMesh.name = 'head_mesh';
        headMesh.position.set(0, 0.15, 0);
        headMesh.castShadow = true;
        neck.add(headMesh);

        // Yeux
        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xCC4400, emissive: 0xFF4400, emissiveIntensity: 0.5
        });
        const eyeGeo = new THREE.BoxGeometry(0.05, 0.04, 0.02);
        for (const side of [-1, 1]) {
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.name = side < 0 ? 'leftEye' : 'rightEye';
            eye.position.set(side * 0.08, 0.18, 0.16);
            neck.add(eye);
        }

        // Mâchoire
        const jaw = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.08, 0.08), boneMat
        );
        jaw.name = 'jaw';
        jaw.position.set(0, 0.02, 0.16);
        neck.add(jaw);

        group.add(neck);

        const armRestRotX = debugTPose ? 0 : -0.5;
        ZombieFactory._addPivotArm(group, skinMat, { x: -0.67, y: 1.35, width: 0.22, length: 0.65, rotX: armRestRotX, name: 'leftArm' });
        ZombieFactory._addPivotArm(group, skinMat, { x: 0.67, y: 1.35, width: 0.22, length: 0.65, rotX: armRestRotX, name: 'rightArm' });

        // Jambes massives
        ZombieFactory._addPivotLegs(group, skinMat, 0.25, 0.7, debugTPose, 0.2);

        group.scale.setScalar(scale);
        return group;
    }

    // ========== UTILITAIRES ==========

    /**
     * Crée une pièce nommée et l'ajoute au groupe
     * @param {THREE.Group} group
     * @param {string} name
     * @param {THREE.BufferGeometry} geometry
     * @param {THREE.Material} material
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {THREE.Mesh}
     */
    static _createPart(group, name, geometry, material, x, y, z) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        group.add(mesh);
        return mesh;
    }

    /**
     * Ajoute une tête avec pivot à la nuque (neck)
     * Le pivot est positionné à la base du cou, la tête est décalée vers le haut
     * Permet la rotation de la tête indépendamment du corps
     * @param {THREE.Group} group
     * @param {THREE.Material} skinMat
     * @param {number} yPos - Position Y du centre de la tête
     */
    static _addHead(group, skinMat, yPos) {
        // Pivot à la nuque (base du cou, sous la tête)
        const neckY = yPos - 0.15;
        const neck = new THREE.Group();
        neck.name = 'neck';
        neck.position.set(0, neckY, 0);

        // Tête décalée vers le haut par rapport au pivot nuque
        const headOffsetY = yPos - neckY;
        const headMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.25, 0.25), skinMat
        );
        headMesh.name = 'head_mesh';
        headMesh.position.set(0, headOffsetY, 0);
        headMesh.castShadow = true;
        neck.add(headMesh);

        // Yeux (positionnés relativement à la tête dans le pivot)
        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xCC4400, emissive: 0xFF4400, emissiveIntensity: 0.3
        });
        const eyeGeo = new THREE.BoxGeometry(0.05, 0.04, 0.02);
        for (const side of [-1, 1]) {
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.name = side < 0 ? 'leftEye' : 'rightEye';
            eye.position.set(side * 0.06, headOffsetY + 0.03, 0.13);
            neck.add(eye);
        }

        // Bouche
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0x1A0A0A, roughness: 1 });
        const mouth = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.05, 0.02), mouthMat
        );
        mouth.name = 'mouth';
        mouth.position.set(0, headOffsetY - 0.05, 0.13);
        neck.add(mouth);

        group.add(neck);
    }

    /**
     * Ajoute un bras avec pivot épaule + pivot coude
     * Hiérarchie : épaule (Group) -> bras supérieur (Mesh) + coude (Group) -> avant-bras (Mesh)
     * @param {THREE.Group} group
     * @param {THREE.Material} material
     * @param {object} cfg
     * @param {number} cfg.x - Position X de l'épaule
     * @param {number} cfg.y - Position Y de l'épaule
     * @param {number} cfg.width - Largeur du bras
     * @param {number} cfg.length - Longueur totale du bras
     * @param {number} cfg.rotX - Rotation X au repos
     * @param {string} cfg.name - 'leftArm' ou 'rightArm'
     */
    static _addPivotArm(group, material, cfg) {
        const upperLen = cfg.length * 0.5;
        const lowerLen = cfg.length * 0.5;
        const side = cfg.name === 'leftArm' ? 'left' : 'right';

        // Pivot épaule
        const shoulder = new THREE.Group();
        shoulder.name = cfg.name;
        shoulder.position.set(cfg.x, cfg.y, 0);
        shoulder.rotation.x = cfg.rotX;

        // Bras supérieur (de l'épaule au coude)
        const upperMesh = new THREE.Mesh(
            new THREE.BoxGeometry(cfg.width, upperLen, cfg.width),
            material
        );
        upperMesh.name = `${cfg.name}_upper_mesh`;
        upperMesh.position.set(0, -upperLen / 2, 0);
        upperMesh.castShadow = true;
        shoulder.add(upperMesh);

        // Pivot coude (en bas du bras supérieur)
        const elbow = new THREE.Group();
        elbow.name = `${side}Elbow`;
        elbow.position.set(0, -upperLen, 0);
        shoulder.add(elbow);

        // Avant-bras (du coude au poignet)
        const lowerMesh = new THREE.Mesh(
            new THREE.BoxGeometry(cfg.width * 0.9, lowerLen, cfg.width * 0.9),
            material
        );
        lowerMesh.name = `${cfg.name}_lower_mesh`;
        lowerMesh.position.set(0, -lowerLen / 2, 0);
        lowerMesh.castShadow = true;
        elbow.add(lowerMesh);

        group.add(shoulder);
    }

    /**
     * Ajoute les jambes avec pivots hanches + pivots genoux
     * Hiérarchie : hanche (Group) -> cuisse (Mesh) + genou (Group) -> mollet (Mesh)
     * @param {THREE.Group} group
     * @param {THREE.Material} material
     * @param {number} legWidth
     * @param {number} legLength - Longueur totale de la jambe
     * @param {boolean} debugTPose
     * @param {number} [hipSpacing=0.12]
     */
    static _addPivotLegs(group, material, legWidth, legLength, debugTPose, hipSpacing = 0.12) {
        const upperLen = legLength * 0.5;
        const lowerLen = legLength * 0.5;

        for (const side of [-1, 1]) {
            const sideName = side < 0 ? 'left' : 'right';

            // Pivot hanche
            const hip = new THREE.Group();
            hip.name = `${sideName}Leg`;
            hip.position.set(side * hipSpacing, 0.6, 0);

            // Cuisse (de la hanche au genou)
            const upperMesh = new THREE.Mesh(
                new THREE.BoxGeometry(legWidth, upperLen, legWidth),
                material
            );
            upperMesh.name = `${sideName}Leg_upper_mesh`;
            upperMesh.position.set(0, -upperLen / 2, 0);
            upperMesh.castShadow = true;
            hip.add(upperMesh);

            // Pivot genou (en bas de la cuisse)
            const knee = new THREE.Group();
            knee.name = `${sideName}Knee`;
            knee.position.set(0, -upperLen, 0);
            hip.add(knee);

            // Mollet (du genou au pied)
            const lowerMesh = new THREE.Mesh(
                new THREE.BoxGeometry(legWidth * 0.9, lowerLen, legWidth * 0.9),
                material
            );
            lowerMesh.name = `${sideName}Leg_lower_mesh`;
            lowerMesh.position.set(0, -lowerLen / 2, 0);
            lowerMesh.castShadow = true;
            knee.add(lowerMesh);

            group.add(hip);
        }
    }
}
