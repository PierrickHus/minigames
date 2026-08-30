import * as THREE from 'three';

/**
 * Gestionnaire de la scène Three.js
 * Crée et configure le renderer, la scène et gère le redimensionnement
 */
export class SceneManager {
    /**
     * @param {HTMLCanvasElement} canvas - Canvas sur lequel dessiner
     */
    constructor(canvas) {
        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.4;

        this._onResize = this._onResize.bind(this);
        window.addEventListener('resize', this._onResize);

        /** @type {THREE.Camera|null} Référence à la caméra pour le resize */
        this._camera = null;
    }

    /**
     * Enregistre la caméra pour la mettre à jour au resize
     * @param {THREE.PerspectiveCamera} camera
     */
    setCamera(camera) {
        this._camera = camera;
    }

    /**
     * Effectue le rendu de la scène
     * @param {THREE.Camera} camera
     */
    render(camera) {
        this.renderer.render(this.scene, camera);
    }

    /** Gère le redimensionnement de la fenêtre */
    _onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer.setSize(width, height);

        if (this._camera) {
            this._camera.aspect = width / height;
            this._camera.updateProjectionMatrix();
        }
    }

    /** Libère les ressources */
    dispose() {
        window.removeEventListener('resize', this._onResize);
        this.renderer.dispose();
    }
}
