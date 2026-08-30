import * as THREE from 'three';
import {
    AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY,
    DIRECTIONAL_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY,
    FOG_COLOR, FOG_NEAR, FOG_FAR
} from '../constants.js';

/**
 * Configure l'éclairage et le brouillard de la scène
 * Ambiance crépusculaire Walking Dead : lumière chaude orangée basse,
 * brouillard dense, ombres longues comme un coucher de soleil post-apocalyptique
 * @param {THREE.Scene} scene
 */
export function setupLighting(scene) {
    // Lumière ambiante faible et chaude
    const ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY);
    scene.add(ambientLight);

    // Lumière directionnelle basse (soleil couchant) pour des ombres longues
    const directionalLight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
    directionalLight.position.set(-15, 8, -10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 120;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);

    // Lumière de remplissage bleutée (côté opposé au soleil)
    const fillLight = new THREE.DirectionalLight(0x6688AA, 0.4);
    fillLight.position.set(10, 5, 8);
    scene.add(fillLight);

    // Brouillard brun-orangé caractéristique des scènes TWD
    scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);
    scene.background = new THREE.Color(FOG_COLOR);
}
