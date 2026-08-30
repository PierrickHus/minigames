/**
 * Gère les écrans de menu : démarrage, pause et game over
 * Les changements de visibilité sont conditionnels (CLAUDE.md)
 */
export class MenuScreen {
    /**
     * @param {import('../core/EventBus.js').EventBus} eventBus
     */
    constructor(eventBus) {
        this._eventBus = eventBus;

        this._menuScreen = document.getElementById('menuScreen');
        this._pauseScreen = document.getElementById('pauseScreen');
        this._gameOverScreen = document.getElementById('gameOverScreen');
        this._finalScore = document.getElementById('finalScore');
        this._finalWave = document.getElementById('finalWave');
        this._startButton = document.getElementById('startButton');
        this._restartButton = document.getElementById('restartButton');
        this._resumeButton = document.getElementById('resumeButton');

        /** @type {Function|null} Callbacks externes */
        this.onStart = null;
        this.onRestart = null;
        this.onResume = null;

        this._startButton.addEventListener('click', () => {
            if (this.onStart) this.onStart();
        });

        this._restartButton.addEventListener('click', () => {
            if (this.onRestart) this.onRestart();
        });

        this._resumeButton.addEventListener('click', () => {
            if (this.onResume) this.onResume();
        });

        this._eventBus.on('game-over', (data) => this.showGameOver(data.score));
    }

    /** Affiche le menu principal */
    showMenu() {
        this._show(this._menuScreen);
        this._hide(this._pauseScreen);
        this._hide(this._gameOverScreen);
    }

    /** Cache le menu principal */
    hideMenu() {
        this._hide(this._menuScreen);
    }

    /** Affiche l'écran de pause */
    showPause() {
        this._show(this._pauseScreen);
    }

    /** Cache l'écran de pause */
    hidePause() {
        this._hide(this._pauseScreen);
    }

    /**
     * Affiche l'écran de game over avec le score final
     * @param {number} score
     * @param {number} [wave]
     */
    showGameOver(score, wave) {
        this._finalScore.textContent = `Score: ${score}`;
        if (wave !== undefined) {
            this._finalWave.textContent = `Vague atteinte: ${wave}`;
        }
        this._show(this._gameOverScreen);
    }

    /** Cache l'écran de game over */
    hideGameOver() {
        this._hide(this._gameOverScreen);
    }

    /**
     * Affiche un élément (mise à jour conditionnelle)
     * @param {HTMLElement} element
     */
    _show(element) {
        if (element.classList.contains('hidden')) {
            element.classList.remove('hidden');
        }
    }

    /**
     * Cache un élément (mise à jour conditionnelle)
     * @param {HTMLElement} element
     */
    _hide(element) {
        if (!element.classList.contains('hidden')) {
            element.classList.add('hidden');
        }
    }
}
