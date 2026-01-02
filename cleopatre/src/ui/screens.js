// ==========================================
// GESTION DES ÉCRANS
// ==========================================
// Ce module gère la navigation entre les différents écrans de l'application:
// - Menu principal
// - Sélection de personnage
// - Écran de jeu
// - Guide du joueur
// - Game Over
// - Victoire
// ==========================================

/**
 * Liste des écrans où le bouton retour vers le menu principal doit être visible
 * @type {Set<string>}
 */
const MENU_SCREENS = new Set(['mainMenu', 'scenarioSelect', 'characterSelect', 'guideScreen']);

/**
 * Gestionnaire des écrans de l'application
 * Gère l'affichage et la navigation entre les différentes vues du jeu
 */
class ScreenManager {
    /**
     * Crée une nouvelle instance du gestionnaire d'écrans
     */
    constructor() {
        /** @type {string} ID de l'écran actuellement affiché */
        this.currentScreen = 'mainMenu';

        /** @type {string|null} ID de l'écran précédent (pour la navigation retour) */
        this.previousScreen = null;

        /** @type {HTMLElement|null} Référence au bouton retour (caché pendant le jeu) */
        this.backButton = null;
    }

    /**
     * Affiche un écran spécifique et cache tous les autres
     * Met à jour l'historique de navigation et la visibilité du bouton retour
     * @param {string} screenId - L'ID de l'écran à afficher
     */
    show(screenId) {
        // Sauvegarder l'écran actuel comme précédent
        this.previousScreen = this.currentScreen;
        this.currentScreen = screenId;

        // Liste de tous les écrans disponibles dans l'application
        const allScreens = [
            'mainMenu', 'scenarioSelect', 'characterSelect', 'gameScreen',
            'guideScreen', 'gameOverScreen', 'victoryScreen'
        ];

        // Basculer la classe 'active' pour afficher/cacher les écrans
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

        // Mettre à jour la visibilité du bouton retour
        this.updateBackButton(screenId);
    }

    /**
     * Met à jour la visibilité du bouton retour selon l'écran affiché
     * Le bouton est visible uniquement sur les écrans de menu (pas pendant le jeu)
     * @param {string} screenId - ID de l'écran actuel
     */
    updateBackButton(screenId) {
        // Récupérer la référence du bouton si pas encore fait
        if (!this.backButton) {
            this.backButton = document.getElementById('backButton');
        }

        if (this.backButton) {
            // Afficher le bouton uniquement sur les écrans de menu
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
