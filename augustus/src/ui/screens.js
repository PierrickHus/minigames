// ==========================================
// GESTION DES ÉCRANS
// ==========================================

// Écrans où le bouton retour vers le menu principal doit être visible
const MENU_SCREENS = new Set(['mainMenu', 'factionSelect', 'guideScreen']);

class ScreenManager {
    constructor() {
        this.currentScreen = 'mainMenu';
        this.previousScreen = null;
        this.backButton = null;
    }

    /**
     * Affiche un écran et cache les autres
     * @param {string} screenId - L'ID de l'écran à afficher
     */
    show(screenId) {
        this.previousScreen = this.currentScreen;
        this.currentScreen = screenId;

        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        // Gérer la visibilité du bouton retour
        this.updateBackButton(screenId);
    }

    /**
     * Met à jour la visibilité du bouton retour
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
     * Retourne à l'écran précédent
     */
    back() {
        if (this.previousScreen) {
            this.show(this.previousScreen);
        }
    }

    /**
     * Obtient l'écran actuel
     */
    getCurrent() {
        return this.currentScreen;
    }
}

export default ScreenManager;
