import * as THREE from 'three';
import { FOG_COLOR } from '../constants.js';

/**
 * Configure l'arrière-plan de la scène
 * Ambiance de nuit sombre pour le jeu de zombies
 * @param {THREE.Scene} scene
 */
export function createSkybox(scene) {
    scene.background = new THREE.Color(FOG_COLOR);
}
