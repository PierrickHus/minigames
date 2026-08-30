import { Game } from './core/Game.js';

/**
 * Point d'entrée de ZombieDead
 * Instancie et initialise le jeu
 */
const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);
game.init();
