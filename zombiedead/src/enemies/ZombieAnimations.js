import {
    ZOMBIE_ATTACK_WINDUP_MS, ZOMBIE_ATTACK_ANIM_DURATION_MS
} from '../constants.js';

/**
 * Constantes d'animation partagées entre le jeu et le viewer debug
 */
export const ANIM_CONSTANTS = {
    SHAMBLE_SWAY_AMOUNT: 0.06,
    SHAMBLE_SWAY_SPEED: 2.5,
    SHAMBLE_LEAN: 0.15,
    CRAWL_SWAY_SPEED: 2,
    LIMP_BOB: 0.05,
    LIMP_LEAN: 0.15,
    SPEED_VARIATION: 0.3
};

/** Noms de tous les pivots articulaires */
export const PIVOT_NAMES = [
    'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'neck',
    'leftElbow', 'rightElbow', 'leftKnee', 'rightKnee'
];

/**
 * Récupère tous les pivots d'un modèle Three.js
 * @param {THREE.Group} mesh
 * @returns {Object<string, THREE.Group|null>}
 */
export function getPivots(mesh) {
    const p = {};
    for (const name of PIVOT_NAMES) {
        p[name] = mesh.getObjectByName(name);
    }
    return p;
}

/**
 * Remet tous les pivots à rotation zéro
 * @param {Object<string, THREE.Group|null>} pivots
 */
export function resetPivots(pivots) {
    for (const name of PIVOT_NAMES) {
        const pv = pivots[name];
        if (pv) { pv.rotation.x = 0; pv.rotation.y = 0; pv.rotation.z = 0; }
    }
}

/**
 * Vérifie si un membre est fonctionnel (pivot existe + membre attaché)
 * @param {THREE.Group|null} pivot
 * @param {Object<string, { attached: boolean }>|null} limbs - zombie.limbs ou null pour le viewer
 * @param {string} name
 * @returns {boolean}
 */
export function limbOk(pivot, limbs, name) {
    if (!pivot) return false;
    if (!limbs) return true;
    return limbs[name]?.attached !== false;
}

// ========== ANIMATIONS ==========

/**
 * Animation de marche normale (2 jambes)
 * @param {Object} pv - Pivots
 * @param {Object|null} limbs - zombie.limbs ou null
 * @param {number} t - Timer d'animation
 */
export function animWalk(pv, limbs, t) {
    if (pv.neck) { pv.neck.rotation.y = Math.sin(t * 0.8) * 0.15; pv.neck.rotation.z = Math.sin(t * 0.6) * 0.06; }

    if (pv.leftLeg) { const h = Math.sin(t) * 0.25; pv.leftLeg.rotation.x = h; if (pv.leftKnee) pv.leftKnee.rotation.x = Math.max(0, -h) * 0.8; }
    if (pv.rightLeg) { const h = Math.sin(t + Math.PI) * 0.25; pv.rightLeg.rotation.x = h; if (pv.rightKnee) pv.rightKnee.rotation.x = Math.max(0, -h) * 0.8; }

    if (pv.leftElbow) pv.leftElbow.rotation.x = -0.2;
    if (pv.rightElbow) pv.rightElbow.rotation.x = -0.2;

    return { bodyRotX: ANIM_CONSTANTS.SHAMBLE_LEAN + Math.sin(t * 0.7) * 0.03, bodyRotZ: Math.sin(t) * ANIM_CONSTANTS.SHAMBLE_SWAY_AMOUNT };
}

/**
 * Animation de boitement (1 jambe)
 * @param {Object} pv
 * @param {Object|null} limbs
 * @param {number} t
 * @param {boolean} missingLeft - La jambe gauche est manquante
 */
export function animLimp(pv, limbs, t, missingLeft) {
    const side = missingLeft ? 1 : -1;
    if (pv.neck) { pv.neck.rotation.x = -0.1 + Math.sin(t * 2) * 0.08; pv.neck.rotation.y = Math.sin(t * 1.5) * 0.2; }

    const rLeg = missingLeft ? pv.rightLeg : pv.leftLeg;
    const rKnee = missingLeft ? pv.rightKnee : pv.leftKnee;
    if (rLeg) { const h = Math.sin(t * 2) * 0.4; rLeg.rotation.x = h; if (rKnee) rKnee.rotation.x = Math.max(0, -h) * 1.2; }

    if (limbOk(pv.leftArm, limbs, 'leftArm')) { pv.leftArm.rotation.x = -0.5 + Math.sin(t * 2.5) * 0.2; if (pv.leftElbow) pv.leftElbow.rotation.x = -0.4; }
    if (limbOk(pv.rightArm, limbs, 'rightArm')) { pv.rightArm.rotation.x = -0.5 + Math.sin(t * 2.5 + Math.PI) * 0.2; if (pv.rightElbow) pv.rightElbow.rotation.x = -0.4; }

    const hop = Math.abs(Math.sin(t * 2)) * ANIM_CONSTANTS.LIMP_BOB;
    return { bodyRotX: ANIM_CONSTANTS.SHAMBLE_LEAN * 0.8, bodyRotZ: side * ANIM_CONSTANTS.LIMP_LEAN + Math.sin(t * 2) * 0.04, bodyY: -0.2 + hop };
}

/**
 * Anime un bras en mode rampement : étendre (main loin devant) -> tirer (se hisser)
 * Phase 0-0.5 : bras tendu devant (épaule en avant, coude droit)
 * Phase 0.5-1 : coude plie, épaule revient, le corps se hisse
 * @param {THREE.Group|null} shoulder
 * @param {THREE.Group|null} elbow
 * @param {Object|null} limbs
 * @param {string} name
 * @param {number} t
 * @param {number} offset
 */
export function animCrawlArm(shoulder, elbow, limbs, name, t, offset) {
    if (!limbOk(shoulder, limbs, name)) return;
    const period = Math.PI * 2;
    const cycle = ((t + offset) % period) / period;

    if (cycle < 0.5) {
        // Étendre : bras tendu loin devant au-dessus de la tête, coude droit
        const p = cycle / 0.5;
        shoulder.rotation.x = -1.6 - p * 0.4;
        if (elbow) elbow.rotation.x = -0.2 * (1 - p);
    } else {
        // Tirer : coude plie fort, épaule revient, se hisse
        const p = (cycle - 0.5) / 0.5;
        shoulder.rotation.x = -2 + p * 0.4;
        if (elbow) elbow.rotation.x = -p * 1.6;
    }
}

/**
 * Animation de rampement complète
 * Le corps est fortement penché en avant (pas PI/2 pour éviter les problèmes d'axes)
 * Position Y basse pour coller au sol
 * @param {Object} pv
 * @param {Object|null} limbs
 * @param {number} t
 */
export function animCrawl(pv, limbs, t) {
    const speed = ANIM_CONSTANTS.CRAWL_SWAY_SPEED;
    const ct = t * speed / ANIM_CONSTANTS.SHAMBLE_SWAY_SPEED;

    // Bras alternent : étendre puis tirer
    animCrawlArm(pv.leftArm, pv.leftElbow, limbs, 'leftArm', ct, 0);
    animCrawlArm(pv.rightArm, pv.rightElbow, limbs, 'rightArm', ct, Math.PI);

    // Jambes traînent vers l'arrière, genoux légèrement pliés
    if (limbOk(pv.leftLeg, limbs, 'leftLeg')) {
        pv.leftLeg.rotation.x = 0.4 + Math.sin(ct * 0.5) * 0.1;
        if (pv.leftKnee) pv.leftKnee.rotation.x = 0.3;
    }
    if (limbOk(pv.rightLeg, limbs, 'rightLeg')) {
        pv.rightLeg.rotation.x = 0.4 + Math.sin(ct * 0.5 + 1) * 0.1;
        if (pv.rightKnee) pv.rightKnee.rotation.x = 0.3;
    }

    // Tête relève pour regarder devant (compense l'inclinaison du corps)
    if (pv.neck) {
        pv.neck.rotation.x = -0.6;
        pv.neck.rotation.y = Math.sin(ct * 0.7) * 0.15;
    }

    return {
        bodyRotX: 1.2,
        bodyRotZ: Math.sin(ct) * 0.04,
        bodyY: 0.2
    };
}

/**
 * Animation d'attaque (bras)
 * @param {Object} pv
 * @param {Object|null} limbs
 * @param {number} t - Timer d'attaque en ms
 * @param {number} restRotX - Rotation X au repos des bras
 */
export function animAttack(pv, limbs, t, restRotX = 0) {
    const windupEnd = ZOMBIE_ATTACK_WINDUP_MS;
    const strikeEnd = windupEnd + 100;
    const totalDuration = ZOMBIE_ATTACK_ANIM_DURATION_MS;
    let armRot, elbowRot = 0, neckRotX = 0;

    if (t < windupEnd) {
        const p = t / windupEnd; armRot = p * p * 1.8; neckRotX = p * 0.3; elbowRot = -p * 1.2;
    } else if (t < strikeEnd) {
        const p = (t - windupEnd) / (strikeEnd - windupEnd);
        armRot = 1.8 - p * 2.8; neckRotX = 0.3 - p * 0.6; elbowRot = -1.2 + p * 1.2;
    } else {
        const p = (t - strikeEnd) / (totalDuration - strikeEnd);
        const ease = 1 - (1 - p) * (1 - p);
        armRot = -1 * (1 - ease); neckRotX = -0.3 * (1 - ease);
    }

    if (limbOk(pv.leftArm, limbs, 'leftArm')) { pv.leftArm.rotation.x = restRotX + armRot; if (pv.leftElbow) pv.leftElbow.rotation.x = elbowRot; }
    if (limbOk(pv.rightArm, limbs, 'rightArm')) { pv.rightArm.rotation.x = restRotX + armRot; if (pv.rightElbow) pv.rightElbow.rotation.x = elbowRot; }
    if (pv.neck) pv.neck.rotation.x = neckRotX;

    return { bodyRotX: (t >= windupEnd && t < strikeEnd) ? 0.15 : 0 };
}

/**
 * Animation de morsure (sans bras)
 * @param {Object} pv
 * @param {number} t - Timer d'attaque en ms
 */
export function animBite(pv, t) {
    if (!pv.neck) return {};
    const windupEnd = ZOMBIE_ATTACK_WINDUP_MS;
    const strikeEnd = windupEnd + 100;
    const totalDuration = ZOMBIE_ATTACK_ANIM_DURATION_MS;
    let neckRotX;

    if (t < windupEnd) {
        const p = t / windupEnd; neckRotX = p * p * 0.5;
    } else if (t < strikeEnd) {
        const p = (t - windupEnd) / (strikeEnd - windupEnd); neckRotX = 0.5 - p * 1.2;
    } else {
        const p = (t - strikeEnd) / (totalDuration - strikeEnd);
        const ease = 1 - (1 - p) * (1 - p); neckRotX = -0.7 * (1 - ease);
    }
    pv.neck.rotation.x = neckRotX;
    pv.neck.rotation.z = (t >= windupEnd * 0.8 && t < strikeEnd) ? 0.1 : 0;
    return {};
}

/**
 * Animation de mort
 * @param {Object} pv
 * @param {Object|null} limbs
 * @param {number} progress - 0 à 1
 */
export function animDeath(pv, limbs, progress) {
    if (limbOk(pv.leftArm, limbs, 'leftArm')) { pv.leftArm.rotation.x = -progress * 1.2; if (pv.leftElbow) pv.leftElbow.rotation.x = -progress * 0.5; }
    if (limbOk(pv.rightArm, limbs, 'rightArm')) { pv.rightArm.rotation.x = -progress * 1.2; if (pv.rightElbow) pv.rightElbow.rotation.x = -progress * 0.5; }
    if (pv.leftKnee) pv.leftKnee.rotation.x = progress * 0.3;
    if (pv.rightKnee) pv.rightKnee.rotation.x = progress * 0.3;
    if (pv.neck) { pv.neck.rotation.x = -progress * 0.5; pv.neck.rotation.z = progress * 0.4; }

    return { bodyRotX: -progress * (Math.PI / 2), bodyY: -progress * 0.5 };
}

/**
 * Animation de bousculade
 * @param {Object} pv
 * @param {Object|null} limbs
 * @param {number} t - Temps en secondes
 */
export function animPushed(pv, limbs, t) {
    if (t < 0.2) {
        const p = t / 0.2;
        if (limbOk(pv.leftArm, limbs, 'leftArm')) { pv.leftArm.rotation.x = p * 0.5; if (pv.leftElbow) pv.leftElbow.rotation.x = p * 0.4; }
        if (limbOk(pv.rightArm, limbs, 'rightArm')) { pv.rightArm.rotation.x = p * 0.5; if (pv.rightElbow) pv.rightElbow.rotation.x = p * 0.4; }
        if (pv.neck) { pv.neck.rotation.x = p * 0.4; pv.neck.rotation.y = p * 0.2; }
        return { bodyRotX: -p * 0.3, bodyZ: p * 0.3 };
    }
    const p = Math.min((t - 0.2) / 0.6, 1);
    const ease = 1 - (1 - p) * (1 - p);
    if (limbOk(pv.leftArm, limbs, 'leftArm')) { pv.leftArm.rotation.x = 0.5 * (1 - ease) - ease * 0.15; if (pv.leftElbow) pv.leftElbow.rotation.x = 0.4 * (1 - ease); }
    if (limbOk(pv.rightArm, limbs, 'rightArm')) { pv.rightArm.rotation.x = 0.5 * (1 - ease) - ease * 0.15; if (pv.rightElbow) pv.rightElbow.rotation.x = 0.4 * (1 - ease); }
    if (pv.neck) { pv.neck.rotation.x = 0.4 * (1 - ease); pv.neck.rotation.y = 0.2 * (1 - ease); }
    return { bodyRotX: -0.3 * (1 - ease), bodyZ: 0.3 * (1 - ease) };
}

/**
 * Animation idle
 * @param {Object} pv
 * @param {Object|null} limbs
 * @param {number} t
 */
export function animIdle(pv, limbs, t) {
    if (limbOk(pv.leftArm, limbs, 'leftArm')) { pv.leftArm.rotation.x = -0.15 + Math.sin(t * 1.5) * 0.05; if (pv.leftElbow) pv.leftElbow.rotation.x = -0.15; }
    if (limbOk(pv.rightArm, limbs, 'rightArm')) { pv.rightArm.rotation.x = -0.15 + Math.sin(t * 1.5 + 0.5) * 0.05; if (pv.rightElbow) pv.rightElbow.rotation.x = -0.15; }
    if (pv.neck) { pv.neck.rotation.y = Math.sin(t * 0.6) * 0.2; pv.neck.rotation.x = Math.sin(t * 0.4) * 0.05; }
    return {};
}

/**
 * Animation regard autour
 * @param {Object} pv
 * @param {Object|null} limbs
 * @param {number} t
 */
export function animHeadlook(pv, limbs, t) {
    if (pv.neck) { pv.neck.rotation.y = Math.sin(t * 1.2) * 0.5; pv.neck.rotation.x = Math.sin(t * 0.8) * 0.2; pv.neck.rotation.z = Math.sin(t * 0.5) * 0.1; }
    if (limbOk(pv.leftArm, limbs, 'leftArm')) { pv.leftArm.rotation.x = -0.15; if (pv.leftElbow) pv.leftElbow.rotation.x = -0.1; }
    if (limbOk(pv.rightArm, limbs, 'rightArm')) { pv.rightArm.rotation.x = -0.15; if (pv.rightElbow) pv.rightElbow.rotation.x = -0.1; }
    return {};
}

/**
 * Animation de course
 * @param {Object} pv
 * @param {Object|null} limbs
 * @param {number} t
 */
export function animRun(pv, limbs, t) {
    const speed = 6;
    if (limbOk(pv.leftArm, limbs, 'leftArm')) { pv.leftArm.rotation.x = Math.sin(t * speed) * 0.8; if (pv.leftElbow) pv.leftElbow.rotation.x = -0.6 + Math.sin(t * speed) * 0.3; }
    if (limbOk(pv.rightArm, limbs, 'rightArm')) { pv.rightArm.rotation.x = Math.sin(t * speed + Math.PI) * 0.8; if (pv.rightElbow) pv.rightElbow.rotation.x = -0.6 + Math.sin(t * speed + Math.PI) * 0.3; }
    if (pv.leftLeg) { const h = Math.sin(t * speed + Math.PI) * 0.6; pv.leftLeg.rotation.x = h; if (pv.leftKnee) pv.leftKnee.rotation.x = Math.max(0, -h) * 1.5; }
    if (pv.rightLeg) { const h = Math.sin(t * speed) * 0.6; pv.rightLeg.rotation.x = h; if (pv.rightKnee) pv.rightKnee.rotation.x = Math.max(0, -h) * 1.5; }
    if (pv.neck) { pv.neck.rotation.x = -0.2 + Math.sin(t * speed) * 0.1; pv.neck.rotation.y = Math.sin(t * speed * 0.5) * 0.15; }
    return { bodyRotX: 0.2, bodyRotZ: Math.sin(t * speed * 0.5) * 0.04 };
}
