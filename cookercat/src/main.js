/**
 * Point d'entrée principal du jeu O'Cha'To
 * Initialise les gestionnaires, gère les événements et la boucle de jeu
 */

import ScreenManager from './ui/ScreenManager.js';
import Game from './core/Game.js';
import GameRenderer from './renderer/GameRenderer.js';
import { INGREDIENTS } from './data/ingredients.js';

/**
 * Gestionnaire principal de l'application
 */
class App {
    constructor() {
        /** @type {ScreenManager} Gestionnaire des écrans */
        this.screenManager = new ScreenManager();

        /** @type {Game} Instance du jeu */
        this.game = new Game();

        /** @type {GameRenderer|null} Renderer du jeu */
        this.renderer = null;

        /** @type {number|null} ID de la boucle de jeu */
        this.gameLoopId = null;

        /** @type {Object} Références aux éléments DOM */
        this.elements = {
            livesDisplay: document.getElementById('livesDisplay'),
            clientsDisplay: document.getElementById('clientsDisplay'),
            scoreDisplay: document.getElementById('scoreDisplay'),
            timerDisplay: document.getElementById('timerDisplay'),
            orderPanel: document.getElementById('orderPanel'),
            orderTimer: document.getElementById('orderTimer'),
            dishName: document.getElementById('dishName'),
            ingredientsList: document.getElementById('ingredientsList'),
            stepsList: document.getElementById('stepsList'),
            pauseModal: document.getElementById('pauseModal'),
            gameCanvas: document.getElementById('gameCanvas')
        };

        this.initEventListeners();
        this.loadSettings();
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initEventListeners() {
        document.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleAction(action);
            }
        });

        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                const gender = card.dataset.gender;
                this.startGame(gender);
            });
        });

        const volumeMusic = document.getElementById('volumeMusic');
        const volumeSfx = document.getElementById('volumeSfx');

        if (volumeMusic) {
            volumeMusic.addEventListener('input', (e) => {
                document.getElementById('volumeMusicValue').textContent = `${e.target.value}%`;
                this.saveSettings();
            });
        }

        if (volumeSfx) {
            volumeSfx.addEventListener('input', (e) => {
                document.getElementById('volumeSfxValue').textContent = `${e.target.value}%`;
                this.saveSettings();
            });
        }
    }

    /**
     * Gère les actions des boutons
     * @param {string} action - L'action à exécuter
     */
    handleAction(action) {
        switch (action) {
            case 'newGame':
                this.screenManager.show('characterSelect');
                break;

            case 'loadGame':
                this.loadGame();
                break;

            case 'startTutorial':
                this.startTutorial();
                break;

            case 'showGuide':
                this.screenManager.show('guideScreen');
                break;

            case 'closeGuide':
                this.screenManager.show('mainMenu');
                break;

            case 'showCredits':
                this.screenManager.show('creditsScreen');
                break;

            case 'showSettings':
                this.screenManager.show('settingsScreen');
                break;

            case 'showMenu':
                this.showMainMenu();
                break;

            case 'pauseGame':
                this.pauseGame();
                break;

            case 'resumeGame':
                this.resumeGame();
                break;

            default:
                console.log('Action inconnue:', action);
        }
    }

    /**
     * Démarre une nouvelle partie
     * @param {string} gender - Genre du personnage
     */
    startGame(gender) {
        this.game.start(gender);
        this.screenManager.show('gameScreen');

        if (!this.renderer) {
            this.renderer = new GameRenderer(this.elements.gameCanvas);
            this.setupGameClick();
        }

        this.startGameLoop();
        this.updateUI();
        this.showNotification('Bienvenue à O\'Cha\'To !', 'info');
    }

    /**
     * Configure le clic sur le canvas
     */
    setupGameClick() {
        this.elements.gameCanvas.addEventListener('click', (e) => {
            if (this.game.paused || this.game.gameOver) {
                return;
            }

            const rect = this.elements.gameCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const clicked = this.renderer.getClickedElement(x, y);

            if (clicked) {
                if (clicked.type === 'ingredient') {
                    this.handleIngredientClick(clicked.id);
                } else if (clicked.type === 'utensil') {
                    this.handleUtensilClick(clicked.id);
                }
            }
        });
    }

    /**
     * Gère le clic sur un ingrédient
     * @param {string} ingredientId - ID de l'ingrédient
     */
    handleIngredientClick(ingredientId) {
        const success = this.game.collectIngredient(ingredientId);

        if (success) {
            const ingredient = INGREDIENTS[ingredientId];
            this.showNotification(`${ingredient.icon} ${ingredient.name} collecté !`, 'success');
            this.updateUI();
        } else {
            this.showNotification('Cet ingrédient n\'est pas nécessaire', 'error');
        }
    }

    /**
     * Gère le clic sur un ustensile
     * @param {string} utensilId - ID de l'ustensile
     */
    handleUtensilClick(utensilId) {
        if (!this.game.hasAllIngredients()) {
            this.showNotification('Collectez d\'abord tous les ingrédients !', 'error');
            return;
        }

        const success = this.game.useUtensil(utensilId);

        if (success) {
            const step = this.game.currentOrder.steps[this.game.currentStep - 1];
            this.showNotification(`${step.description} ✓`, 'success');

            if (this.game.isRecipeComplete()) {
                this.game.completeOrder();
                this.showNotification(`🎉 Plat servi ! +${this.game.score}`, 'success');

                if (this.game.gameOver) {
                    this.victory();
                }
            }

            this.updateUI();
        } else {
            this.showNotification('Ce n\'est pas le bon ustensile !', 'error');
        }
    }

    /**
     * Démarre la boucle de jeu
     */
    startGameLoop() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
        }

        const loop = (timestamp) => {
            const deltaTime = timestamp - this.game.lastUpdate;
            this.game.lastUpdate = timestamp;

            this.game.update(deltaTime);
            this.updateUI();

            if (this.renderer) {
                this.renderer.render(this.game.getStats());
            }

            if (this.game.gameOver) {
                if (this.game.lives <= 0) {
                    this.gameOver();
                }
                return;
            }

            this.gameLoopId = requestAnimationFrame(loop);
        };

        this.game.lastUpdate = performance.now();
        this.gameLoopId = requestAnimationFrame(loop);
    }

    /**
     * Met à jour l'interface utilisateur
     */
    updateUI() {
        const stats = this.game.getStats();

        const newLivesText = `❤️ ${stats.lives}`;
        if (this.elements.livesDisplay.textContent !== newLivesText) {
            this.elements.livesDisplay.textContent = newLivesText;
        }

        const newClientsText = `👥 ${stats.clientsServed}/100`;
        if (this.elements.clientsDisplay.textContent !== newClientsText) {
            this.elements.clientsDisplay.textContent = newClientsText;
        }

        const newScoreText = `⭐ ${stats.score}`;
        if (this.elements.scoreDisplay.textContent !== newScoreText) {
            this.elements.scoreDisplay.textContent = newScoreText;
        }

        const minutes = Math.floor(stats.timeRemaining / 60);
        const seconds = stats.timeRemaining % 60;
        const newTimerText = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
        if (this.elements.timerDisplay.textContent !== newTimerText) {
            this.elements.timerDisplay.textContent = newTimerText;
        }

        if (stats.currentOrder) {
            if (this.elements.orderPanel.classList.contains('hidden')) {
                this.elements.orderPanel.classList.remove('hidden');
            }

            const orderMinutes = Math.floor(stats.timeRemaining / 60);
            const orderSeconds = stats.timeRemaining % 60;
            const newOrderTimerText = `⏱️ ${orderMinutes}:${orderSeconds.toString().padStart(2, '0')}`;
            if (this.elements.orderTimer.textContent !== newOrderTimerText) {
                this.elements.orderTimer.textContent = newOrderTimerText;
            }

            const newDishName = `${stats.currentOrder.icon} ${stats.currentOrder.name}`;
            if (this.elements.dishName.textContent !== newDishName) {
                this.elements.dishName.textContent = newDishName;
            }

            this.updateIngredientsList(stats);
            this.updateStepsList(stats);
        }
    }

    /**
     * Met à jour la liste des ingrédients dans le panneau
     * @param {Object} stats - Statistiques du jeu
     */
    updateIngredientsList(stats) {
        const ingredients = stats.currentOrder.ingredients.map(id => {
            const ing = INGREDIENTS[id];
            const collected = stats.collectedIngredients.includes(id);
            return `<li style="${collected ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${ing.icon} ${ing.name}</li>`;
        }).join('');

        const newContent = `<h4>Ingrédients:</h4><ul>${ingredients}</ul>`;
        if (this.elements.ingredientsList.innerHTML !== newContent) {
            this.elements.ingredientsList.innerHTML = newContent;
        }
    }

    /**
     * Met à jour la liste des étapes dans le panneau
     * @param {Object} stats - Statistiques du jeu
     */
    updateStepsList(stats) {
        const steps = stats.currentOrder.steps.map((step, index) => {
            const completed = index < stats.currentStep;
            const current = index === stats.currentStep;
            const style = completed ? 'text-decoration: line-through; opacity: 0.6;' : (current ? 'font-weight: bold; color: #4ECDC4;' : '');
            return `<li style="${style}">${completed ? '✓' : (current ? '▶' : '○')} ${step.description}</li>`;
        }).join('');

        const newContent = `<h4>Étapes:</h4><ul>${steps}</ul>`;
        if (this.elements.stepsList.innerHTML !== newContent) {
            this.elements.stepsList.innerHTML = newContent;
        }
    }

    /**
     * Démarre le tutoriel
     */
    startTutorial() {
        this.showNotification('Le tutoriel n\'est pas encore disponible', 'info');
    }

    /**
     * Charge une partie sauvegardée
     */
    loadGame() {
        this.showNotification('Aucune sauvegarde disponible', 'info');
    }

    /**
     * Sauvegarde les paramètres
     */
    saveSettings() {
        const settings = {
            volumeMusic: document.getElementById('volumeMusic')?.value || 50,
            volumeSfx: document.getElementById('volumeSfx')?.value || 50,
            showTutorialHints: document.getElementById('showTutorialHints')?.checked || true
        };

        localStorage.setItem('ochato_settings', JSON.stringify(settings));
    }

    /**
     * Charge les paramètres
     */
    loadSettings() {
        const saved = localStorage.getItem('ochato_settings');
        if (saved) {
            const settings = JSON.parse(saved);

            const volumeMusic = document.getElementById('volumeMusic');
            const volumeSfx = document.getElementById('volumeSfx');
            const showTutorialHints = document.getElementById('showTutorialHints');

            if (volumeMusic) {
                volumeMusic.value = settings.volumeMusic;
                document.getElementById('volumeMusicValue').textContent = `${settings.volumeMusic}%`;
            }

            if (volumeSfx) {
                volumeSfx.value = settings.volumeSfx;
                document.getElementById('volumeSfxValue').textContent = `${settings.volumeSfx}%`;
            }

            if (showTutorialHints) {
                showTutorialHints.checked = settings.showTutorialHints;
            }
        }
    }

    /**
     * Met le jeu en pause
     */
    pauseGame() {
        this.game.pause();
        this.elements.pauseModal.classList.remove('hidden');
    }

    /**
     * Reprend le jeu
     */
    resumeGame() {
        this.game.resume();
        this.elements.pauseModal.classList.add('hidden');
        this.startGameLoop();
    }

    /**
     * Retour au menu principal
     */
    showMainMenu() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }

        this.screenManager.show('mainMenu');
    }

    /**
     * Gère le game over
     */
    gameOver() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }

        document.getElementById('gameOverMessage').textContent =
            'Vous avez perdu toutes vos vies...';
        document.getElementById('finalClientsServed').textContent = this.game.clientsServed;
        document.getElementById('finalScore').textContent = this.game.score;

        this.screenManager.show('gameOverScreen');
    }

    /**
     * Gère la victoire
     */
    victory() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }

        document.getElementById('victoryScore').textContent = this.game.score;
        document.getElementById('victoryLives').textContent = this.game.lives;

        this.screenManager.show('victoryScreen');
    }

    /**
     * Affiche une notification
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification ('success', 'error', 'info')
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

const app = new App();
