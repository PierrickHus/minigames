import { BLOOD_PARTICLE_COUNT, BLOOD_PARTICLE_SPEED, BLOOD_PARTICLE_LIFE_MS, BLOOD_PARTICLE_SIZE } from '../constants.js';

/**
 * Émet un effet de sang à la position d'impact
 * @param {import('./ParticleSystem.js').ParticleSystem} particleSystem
 * @param {THREE.Vector3} position - Point d'impact
 */
export function createBloodBurst(particleSystem, position) {
    particleSystem.emit(position, {
        count: BLOOD_PARTICLE_COUNT,
        speed: BLOOD_PARTICLE_SPEED,
        life: BLOOD_PARTICLE_LIFE_MS / 1000,
        size: BLOOD_PARTICLE_SIZE,
        color: { r: 0.8, g: 0.05, b: 0.05 }
    });
}
