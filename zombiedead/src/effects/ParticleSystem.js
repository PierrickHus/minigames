import * as THREE from 'three';
import { PARTICLE_POOL_SIZE } from '../constants.js';

/**
 * Système de particules basé sur un pool pré-alloué
 * Utilise un seul THREE.Points pour toutes les particules (1 draw call)
 */
export class ParticleSystem {
    /**
     * @param {THREE.Scene} scene
     */
    constructor(scene) {
        this._scene = scene;
        this._pool = new Array(PARTICLE_POOL_SIZE);

        // Initialisation du pool
        for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
            this._pool[i] = {
                alive: false,
                life: 0,
                maxLife: 0,
                x: 0, y: 0, z: 0,
                vx: 0, vy: 0, vz: 0,
                r: 1, g: 1, b: 1,
                size: 0.1
            };
        }

        // Géométrie avec buffers pré-alloués
        this._positions = new Float32Array(PARTICLE_POOL_SIZE * 3);
        this._colors = new Float32Array(PARTICLE_POOL_SIZE * 3);
        this._sizes = new Float32Array(PARTICLE_POOL_SIZE);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(this._positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(this._colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(this._sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            depthWrite: false
        });

        this._points = new THREE.Points(geometry, material);
        scene.add(this._points);
    }

    /**
     * Émet un groupe de particules depuis une position
     * @param {THREE.Vector3} position - Point d'émission
     * @param {object} config
     * @param {number} config.count - Nombre de particules
     * @param {number} config.speed - Vitesse initiale
     * @param {number} config.life - Durée de vie en secondes
     * @param {number} config.size - Taille des particules
     * @param {{ r: number, g: number, b: number }} config.color - Couleur RGB (0-1)
     * @param {boolean} [config.randomDirection=true] - Émission sphérique aléatoire
     */
    emit(position, config) {
        let emitted = 0;

        for (let i = 0; i < PARTICLE_POOL_SIZE && emitted < config.count; i++) {
            const p = this._pool[i];
            if (p.alive) continue;

            p.alive = true;
            p.life = config.life;
            p.maxLife = config.life;
            p.x = position.x;
            p.y = position.y;
            p.z = position.z;
            p.r = config.color.r;
            p.g = config.color.g;
            p.b = config.color.b;
            p.size = config.size;

            // Direction aléatoire sphérique
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = config.speed * (0.5 + Math.random() * 0.5);
            p.vx = Math.sin(phi) * Math.cos(theta) * speed;
            p.vy = Math.sin(phi) * Math.sin(theta) * speed;
            p.vz = Math.cos(phi) * speed;

            emitted++;
        }
    }

    /**
     * Met à jour toutes les particules actives
     * @param {number} deltaTime
     */
    update(deltaTime) {
        let hasActive = false;

        for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
            const p = this._pool[i];
            const i3 = i * 3;

            if (!p.alive) {
                this._sizes[i] = 0;
                continue;
            }

            p.life -= deltaTime;
            if (p.life <= 0) {
                p.alive = false;
                this._sizes[i] = 0;
                continue;
            }

            hasActive = true;

            // Physique simple
            p.vy -= 5 * deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.z += p.vz * deltaTime;

            // Fade proportionnel à la vie restante
            const lifeRatio = p.life / p.maxLife;

            this._positions[i3] = p.x;
            this._positions[i3 + 1] = p.y;
            this._positions[i3 + 2] = p.z;
            this._colors[i3] = p.r * lifeRatio;
            this._colors[i3 + 1] = p.g * lifeRatio;
            this._colors[i3 + 2] = p.b * lifeRatio;
            this._sizes[i] = p.size * lifeRatio;
        }

        if (hasActive) {
            this._points.geometry.attributes.position.needsUpdate = true;
            this._points.geometry.attributes.color.needsUpdate = true;
            this._points.geometry.attributes.size.needsUpdate = true;
        }
    }

    /** Libère les ressources */
    dispose() {
        this._scene.remove(this._points);
        this._points.geometry.dispose();
        this._points.material.dispose();
    }
}
