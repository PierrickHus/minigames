import * as THREE from 'three';
import { AUDIO_MASTER_VOLUME } from '../constants.js';

/**
 * Gestionnaire audio utilisant l'API Web Audio via Three.js
 * Gère les sons d'armes, zombies et ambiance
 * Les sons sont générés procéduralement (pas de fichiers externes)
 */
export class AudioManager {
    /**
     * @param {THREE.Camera} camera
     */
    constructor(camera) {
        this._listener = new THREE.AudioListener();
        this._listener.setMasterVolume(AUDIO_MASTER_VOLUME);
        camera.add(this._listener);

        this._context = this._listener.context;
        this._initialized = false;
    }

    /**
     * Initialise le contexte audio (doit être appelé après une interaction utilisateur)
     */
    init() {
        if (this._context.state === 'suspended') {
            this._context.resume();
        }
        this._initialized = true;
    }

    /**
     * Joue un son procédural par nom
     * @param {string} name - Nom du son ('gunshot', 'shotgun', 'rifle', 'reload', 'hit', 'zombie-groan')
     */
    playSound(name) {
        if (!this._initialized) return;

        switch (name) {
            case 'gunshot':
                this._playNoise(0.1, 800, 0.3);
                break;
            case 'shotgun':
                this._playNoise(0.15, 400, 0.5);
                break;
            case 'rifle':
                this._playNoise(0.08, 1000, 0.2);
                break;
            case 'reload':
                this._playClick(0.3);
                break;
            case 'hit':
                this._playNoise(0.05, 200, 0.15);
                break;
            case 'zombie-groan':
                this._playGroan();
                break;
        }
    }

    /**
     * Génère un bruit blanc filtré (pour coups de feu)
     * @param {number} duration - Durée en secondes
     * @param {number} frequency - Fréquence de coupure du filtre
     * @param {number} volume
     */
    _playNoise(duration, frequency, volume) {
        const ctx = this._context;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = frequency;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        source.connect(filter).connect(gain).connect(ctx.destination);
        source.start();
    }

    /**
     * Génère un son de clic métallique (rechargement)
     * @param {number} duration
     */
    _playClick(duration) {
        const ctx = this._context;
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    /** Génère un grognement de zombie (oscillateur basse fréquence) */
    _playGroan() {
        const ctx = this._context;
        const duration = 0.5 + Math.random() * 0.5;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        const baseFreq = 80 + Math.random() * 40;
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(baseFreq * 0.7, ctx.currentTime + duration);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(filter).connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }
}
