// ==========================================
// POINT D'ENTRÉE PRINCIPAL
// ==========================================

import Game from './core/Game.js';

// Créer l'écran de chargement
function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'loadingScreen';
    loader.innerHTML = `
        <div class="loading-content">
            <h1>⚔️ AUGUSTUS ⚔️</h1>
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
            <p>Chargement de l'Empire...</p>
        </div>
    `;
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #2c1810 0%, #4a2c17 50%, #2c1810 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;

    const style = document.createElement('style');
    style.textContent = `
        #loadingScreen .loading-content {
            text-align: center;
        }
        #loadingScreen h1 {
            color: #ffd700;
            font-size: 3rem;
            margin-bottom: 30px;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
        }
        #loadingScreen .loading-bar {
            width: 300px;
            height: 10px;
            background: rgba(0,0,0,0.5);
            border-radius: 5px;
            overflow: hidden;
            margin: 0 auto 20px;
        }
        #loadingScreen .loading-progress {
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #ffd700, #c9a227);
            animation: loading 1.5s ease-in-out forwards;
        }
        #loadingScreen p {
            color: #c9a227;
            font-style: italic;
        }
        @keyframes loading {
            0% { width: 0%; }
            100% { width: 100%; }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(loader);
}

// Cacher l'écran de chargement
function hideLoading() {
    const loader = document.getElementById('loadingScreen');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.5s ease';
        setTimeout(() => loader.remove(), 500);
    }
}

// Configurer les gestionnaires d'événements
function setupEventHandlers(game) {
    // Mapping des actions
    const actions = {
        // Menu
        newGame: () => game.newGame(),
        loadGame: () => game.loadGame(),
        saveGame: () => game.saveGame(),
        showGuide: () => game.showGuide(),
        showCredits: () => game.showCredits(),
        showMenu: () => game.showMenu(),

        // Campagne
        endTurn: () => game.endTurn(),
        startMove: () => game.startMove(),
        attack: () => game.attack?.(),
        showRecruit: () => game.showRecruit?.(),

        // Ville
        closeCityView: () => game.closeCityView(),

        // Bataille
        battlePause: () => game.battle.pause(),
        battleSpeedUp: () => game.battle.speedUp(),
        battleRetreat: () => game.battle.retreat(),
        executePrisoners: () => game.battle.executePrisoners(),
        enslavePrisoners: () => game.battle.enslavePrisoners(),
        releasePrisoners: () => game.battle.releasePrisoners(),
        endBattle: () => game.battle.returnToCampaign(),

        // Guide
        closeGuide: () => game.closeGuide()
    };

    // Délégation d'événements sur tout le document
    document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (button) {
            const action = button.dataset.action;
            if (actions[action]) {
                actions[action]();
            } else {
                console.warn(`Action non trouvée: ${action}`);
            }
        }
    });

    // Exposer game et battle globalement pour les éléments générés dynamiquement
    window.game = game;
    window.battle = game.battle;
}

// Initialisation
function init() {
    showLoading();

    // Simuler un temps de chargement minimum pour l'effet visuel
    setTimeout(() => {
        const game = new Game();
        setupEventHandlers(game);
        hideLoading();
        console.log('Augustus - Rome Total War chargé!');
    }, 1500);
}

// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
