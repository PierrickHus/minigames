/**
 * Gestionnaire des écrans de l'application
 * Gère l'affichage et la navigation entre les différentes vues du jeu
 */

/**
 * Liste des écrans où le bouton retour vers le menu principal doit être visible
 * @type {Set<string>}
 */
const MENU_SCREENS = new Set([
    'mainMenu',
    'characterSelect',
    'guideScreen',
    'creditsScreen',
    'settingsScreen'
]);

class ScreenManager {
    /**
     * Crée une nouvelle instance du gestionnaire d'écrans
     */
    constructor() {
        /** @type {string} ID de l'écran actuellement affiché */
        this.currentScreen = 'mainMenu';

        /** @type {string|null} ID de l'écran précédent (pour la navigation retour) */
        this.previousScreen = null;

        /** @type {HTMLElement|null} Référence au bouton retour */
        this.backButton = null;
    }

    /**
     * Affiche un écran spécifique et cache tous les autres
     * Met à jour l'historique de navigation et la visibilité du bouton retour
     * @param {string} screenId - L'ID de l'écran à afficher
     */
    show(screenId) {
        this.previousScreen = this.currentScreen;
        this.currentScreen = screenId;

        const allScreens = [
            'mainMenu',
            'characterSelect',
            'gameScreen',
            'guideScreen',
            'creditsScreen',
            'settingsScreen',
            'gameOverScreen',
            'victoryScreen'
        ];

        allScreens.forEach(id => {
            const screen = document.getElementById(id);
            if (screen) {
                if (id === screenId) {
                    screen.classList.add('active');
                } else {
                    screen.classList.remove('active');
                }
            }
        });

        this.updateBackButton(screenId);
    }

    /**
     * Met à jour la visibilité du bouton retour selon l'écran affiché
     * Le bouton est visible uniquement sur les écrans de menu (pas pendant le jeu)
     * @param {string} screenId - ID de l'écran actuel
     */
    updateBackButton(screenId) {
        if (!this.backButton) {
            this.backButton = document.getElementById('backButton');
        }

        if (this.backButton) {
            if (MENU_SCREENS.has(screenId)) {
                this.backButton.classList.remove('hidden');
            } else {
                this.backButton.classList.add('hidden');
            }
        }
    }

    /**
     * Retourne à l'écran précédent dans l'historique de navigation
     */
    back() {
        if (this.previousScreen) {
            this.show(this.previousScreen);
        }
    }

    /**
     * Retourne l'ID de l'écran actuellement affiché
     * @returns {string} ID de l'écran actuel
     */
    getCurrent() {
        return this.currentScreen;
    }
}

export default ScreenManager;
