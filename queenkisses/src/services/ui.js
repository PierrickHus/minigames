/**
 * Gestionnaire de l'interface utilisateur
 * Responsabilité unique: gérer tous les éléments DOM du jeu
 * Évite les manipulations DOM répétées en utilisant le cache et les mises à jour conditionnelles
 */

/**
 * Gestionnaire de l'interface utilisateur du jeu
 */
export class UIManager {
    constructor() {
        // Cache des éléments DOM pour éviter les requêtes répétées
        this.elements = {};
        this.cacheElements();

        // Valeurs précédentes pour éviter les mises à jour inutiles
        this.previousValues = {
            score: '',
            difficulty: '',
            difficultyClass: '',
            queenMessage: '',
            doomLives: '',
            doomTime: ''
        };
    }

    /**
     * Met en cache tous les éléments DOM nécessaires
     */
    cacheElements() {
        this.elements = {
            // Écrans principaux
            menuScreen: document.getElementById('menu-screen'),
            tutorialScreen: document.getElementById('tutorial-screen'),
            guideScreen: document.getElementById('guide-screen'),
            gameHud: document.getElementById('game-hud'),
            gameOverScreen: document.getElementById('gameover-screen'),
            victoryScreen: document.getElementById('victory-screen'),
            doomTransition: document.getElementById('doom-announcement'),
            doomGameover: document.getElementById('doom-gameover'),
            doomVictory: document.getElementById('doom-victory'),

            // HUD de jeu
            scoreDisplay: document.getElementById('score-value'),
            scoreContainer: document.getElementById('score'),
            difficultyDisplay: document.getElementById('difficulty'),
            queenMessage: document.getElementById('queen-message'),

            // HUD DOOM
            doomLives: document.getElementById('doom-lives'),
            doomTimer: document.getElementById('doom-timer'),

            // Affichages finaux
            finalScoreSpan: document.getElementById('final-score'),
            doomVictoryScore: document.getElementById('doom-victory-score')
        };
    }

    /**
     * Affiche un écran et cache les autres
     * @param {string} screenName - Nom de l'écran à afficher
     */
    showScreen(screenName) {
        const screens = [
            'menuScreen', 'tutorialScreen', 'guideScreen',
            'gameHud', 'gameOverScreen', 'victoryScreen',
            'doomTransition', 'doomGameover', 'doomVictory'
        ];

        const flexScreens = ['menuScreen', 'gameOverScreen', 'victoryScreen', 'doomGameover', 'doomVictory', 'doomTransition'];

        screens.forEach(screen => {
            const element = this.elements[screen];
            if (element) {
                if (screen === screenName) {
                    element.style.display = flexScreens.includes(screen) ? 'flex' : 'block';
                } else {
                    element.style.display = 'none';
                }
            }
        });
    }

    /**
     * Met à jour l'affichage du score (avec mise à jour conditionnelle)
     * @param {number} score - Score actuel
     * @param {number} target - Score cible (pour affichage)
     */
    updateScore(score, target = 500) {
        const newValue = `${score} / ${target}`;

        if (this.previousValues.score !== newValue && this.elements.scoreDisplay) {
            this.elements.scoreDisplay.textContent = newValue;
            this.previousValues.score = newValue;
        }
    }

    /**
     * Met à jour l'affichage de la difficulté (avec mise à jour conditionnelle)
     * @param {Object} difficulty - Configuration de difficulté
     */
    updateDifficulty(difficulty) {
        if (!this.elements.difficultyDisplay) return;

        const newValue = difficulty.name;
        const newClass = difficulty.class;

        if (this.previousValues.difficulty !== newValue) {
            this.elements.difficultyDisplay.textContent = newValue;
            this.previousValues.difficulty = newValue;
        }

        if (this.previousValues.difficultyClass !== newClass) {
            this.elements.difficultyDisplay.className = `difficulty ${newClass}`;
            this.previousValues.difficultyClass = newClass;
        }
    }

    /**
     * Affiche un message de la reine
     * @param {string} message - Message à afficher
     * @param {number} duration - Durée en ms
     */
    showQueenMessage(message, duration = 3000) {
        if (!this.elements.queenMessage || this.previousValues.queenMessage === message) return;

        this.elements.queenMessage.textContent = message;
        this.elements.queenMessage.style.opacity = '1';
        this.previousValues.queenMessage = message;

        setTimeout(() => {
            if (this.elements.queenMessage) {
                this.elements.queenMessage.style.opacity = '0';
                this.previousValues.queenMessage = '';
            }
        }, duration);
    }

    /**
     * Cache le message de la reine
     */
    hideQueenMessage() {
        if (this.elements.queenMessage) {
            this.elements.queenMessage.style.opacity = '0';
            this.previousValues.queenMessage = '';
        }
    }

    /**
     * Met à jour l'affichage des vies DOOM (avec mise à jour conditionnelle)
     * @param {number} lives - Nombre de vies restantes
     */
    updateDoomLives(lives) {
        const newValue = '❤️'.repeat(lives);

        if (this.previousValues.doomLives !== newValue && this.elements.doomLives) {
            this.elements.doomLives.textContent = newValue;
            this.previousValues.doomLives = newValue;
        }
    }

    /**
     * Met à jour le timer DOOM (avec mise à jour conditionnelle)
     * @param {number} seconds - Secondes restantes
     */
    updateDoomTimer(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const newValue = `${minutes}:${secs.toString().padStart(2, '0')}`;

        if (this.previousValues.doomTime !== newValue && this.elements.doomTimer) {
            this.elements.doomTimer.textContent = newValue;
            this.previousValues.doomTime = newValue;
        }
    }

    /**
     * Affiche l'écran de game over
     * @param {number} score - Score final
     */
    showGameOver(score) {
        if (this.elements.finalScoreSpan) {
            this.elements.finalScoreSpan.textContent = score;
        }
        this.showScreen('gameOverScreen');
    }

    /**
     * Affiche l'écran de victoire
     * @param {number} score - Score final
     */
    showVictory(score) {
        if (this.elements.finalScoreSpan) {
            this.elements.finalScoreSpan.textContent = score;
        }
        this.showScreen('victoryScreen');
    }

    /**
     * Affiche l'écran de transition DOOM
     */
    showDoomTransition() {
        if (this.elements.doomTransition) {
            this.elements.doomTransition.classList.add('active');
        }
    }

    /**
     * Cache l'écran de transition DOOM
     */
    hideDoomTransition() {
        if (this.elements.doomTransition) {
            this.elements.doomTransition.classList.remove('active');
        }
    }

    /**
     * Affiche l'écran de game over DOOM
     */
    showDoomGameover() {
        this.showScreen('doomGameover');
    }

    /**
     * Affiche l'écran de victoire DOOM
     * @param {number} score - Score final
     */
    showDoomVictory(score) {
        if (this.elements.doomVictoryScore) {
            this.elements.doomVictoryScore.textContent = score;
        }
        this.showScreen('doomVictory');
    }

    /**
     * Affiche le HUD de jeu normal
     */
    showGameHud() {
        this.showScreen('gameHud');
        this.showNormalHud();
    }

    /**
     * Affiche les éléments du HUD normal (score, difficulté)
     */
    showNormalHud() {
        if (this.elements.scoreContainer) {
            this.elements.scoreContainer.style.display = 'block';
        }
        if (this.elements.difficultyDisplay) {
            this.elements.difficultyDisplay.style.display = 'block';
        }
        if (this.elements.doomLives) {
            this.elements.doomLives.style.display = 'none';
        }
        if (this.elements.doomTimer) {
            this.elements.doomTimer.style.display = 'none';
        }
    }

    /**
     * Affiche les éléments du HUD DOOM (vies, timer)
     */
    showDoomHud() {
        if (this.elements.scoreContainer) {
            this.elements.scoreContainer.style.display = 'none';
        }
        if (this.elements.difficultyDisplay) {
            this.elements.difficultyDisplay.style.display = 'none';
        }
        if (this.elements.doomLives) {
            this.elements.doomLives.style.display = 'block';
        }
        if (this.elements.doomTimer) {
            this.elements.doomTimer.style.display = 'block';
        }
    }

    /**
     * Affiche le menu principal
     */
    showMenu() {
        this.showScreen('menuScreen');
    }

    /**
     * Réinitialise toutes les valeurs en cache pour forcer la mise à jour
     */
    resetCache() {
        this.previousValues = {
            score: '',
            difficulty: '',
            difficultyClass: '',
            queenMessage: '',
            doomLives: '',
            doomTime: ''
        };
    }
}
