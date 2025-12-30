// ==========================================
// POINT D'ENTRÉE PRINCIPAL - CLÉOPÂTRE
// ==========================================

import Game from './core/Game.js';

// Créer l'écran de chargement
function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'loadingScreen';
    loader.innerHTML = `
        <div class="loading-content">
            <h1>🏛️ CLÉOPÂTRE 🏛️</h1>
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
            <p>Préparation du village...</p>
        </div>
    `;
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #2d1f10 0%, #4a3520 50%, #2d1f10 100%);
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
            background: linear-gradient(90deg, #ffd700, #d4af37);
            animation: loading 1.5s ease-in-out forwards;
        }
        #loadingScreen p {
            color: #d4af37;
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
        showMenu: () => game.showMenu(),

        // Guide
        closeGuide: () => game.closeGuide(),

        // Panneau latéral
        closeSidePanel: () => game.closeSidePanel()
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

    // Gestion de la sélection de personnage
    document.querySelectorAll('.character-card').forEach(card => {
        card.addEventListener('click', () => {
            const gender = card.dataset.gender;
            game.selectCharacter(gender);
        });
    });

    // Exposer game globalement pour le debug
    window.game = game;

    // Commandes de triche (accessibles via la console)
    window.cheat = {
        // Déclencher le game over
        gameOver: () => {
            game.gameOver("Triche: Game Over déclenché manuellement");
        },

        // Déclencher la victoire
        victory: () => {
            game.state.population = 10000;
            game.victory();
        },

        // Ajouter de l'argent
        money: (amount = 10000) => {
            game.state.money += amount;
            game.notifications.success(`+${amount} 💰 (triche)`);
        },

        // Ajouter des ressources
        resources: (amount = 100) => {
            game.state.resources.wood += amount;
            game.state.resources.stone += amount;
            game.state.resources.sand += amount;
            game.state.resources.dirt += amount;
            game.state.resources.clay += amount;
            game.state.food += amount;
            game.state.water += amount;
            game.notifications.success(`+${amount} de chaque ressource (triche)`);
        },

        // Ajouter de la population
        population: (amount = 1000) => {
            game.state.population += amount;
            game.notifications.success(`+${amount} 👥 (triche)`);
        },

        // Échouer la tâche de Cléopâtre en cours
        failTask: () => {
            if (game.cleopatra?.currentTask) {
                game.cleopatra.failTask();
            } else {
                console.log("Aucune tâche en cours");
            }
        },

        // Forcer une nouvelle tâche de Cléopâtre (aléatoire)
        newTask: () => {
            game.cleopatra?.forceNewTask();
        },

        // Forcer une tâche spécifique par ID
        task: (taskId) => {
            if (!game.cleopatra) {
                console.log("Système Cléopâtre non initialisé");
                return;
            }
            import('./data/tasks.js').then(module => {
                const { CLEOPATRA_TASKS } = module;
                const taskTemplate = CLEOPATRA_TASKS.find(t => t.id === taskId);
                if (!taskTemplate) {
                    console.log(`Tâche inconnue: ${taskId}`);
                    console.log('Utilisez cheat.tasks() pour voir les tâches disponibles');
                    return;
                }
                // Forcer l'assignation de cette tâche
                game.cleopatra.lastTaskTime = 0;
                game.cleopatra.assignSpecificTask(taskId);
            });
        },

        // Lister les tâches disponibles
        tasks: () => {
            import('./data/tasks.js').then(module => {
                const { CLEOPATRA_TASKS } = module;
                console.log('=== TÂCHES DISPONIBLES ===');
                CLEOPATRA_TASKS.forEach(t => {
                    console.log(`[Tier ${t.tier}] ${t.id}: ${t.name} (${t.type})`);
                });
                console.log('\nUtilisez cheat.task("id") pour forcer une tâche');
                console.log('Ex: cheat.task("send_message")');
            });
        },

        // Lister les animations de Cléopâtre
        anims: () => {
            if (!game.cleopatra?.sprite) {
                console.log("Sprite Cléopâtre non initialisé");
                return;
            }
            const sprite = game.cleopatra.sprite;
            console.log('=== ANIMATIONS DISPONIBLES ===');
            Object.keys(sprite.animations).forEach(name => {
                const anim = sprite.animations[name];
                const current = sprite.currentAnimation === name ? ' (actuelle)' : '';
                console.log(`${name}: ${anim.frames} frames, loop: ${anim.loop}${current}`);
            });
            console.log('\nUtilisez cheat.anim("nom") pour jouer une animation');
            console.log('Ex: cheat.anim("speaking")');
        },

        // Jouer une animation spécifique
        anim: (animName, duration = 3000) => {
            if (!game.cleopatra?.sprite) {
                console.log("Sprite Cléopâtre non initialisé");
                return;
            }
            const sprite = game.cleopatra.sprite;
            if (!sprite.animations[animName]) {
                console.log(`Animation inconnue: ${animName}`);
                console.log('Utilisez cheat.anims() pour voir les animations disponibles');
                return;
            }
            sprite.playAnimation(animName, duration);
            console.log(`Animation "${animName}" jouée pour ${duration}ms`);
        },

        // Changer l'humeur du sprite
        mood: (value) => {
            if (!game.cleopatra?.sprite) {
                console.log("Sprite Cléopâtre non initialisé");
                return;
            }
            game.cleopatra.sprite.setMood(value);
            console.log(`Humeur du sprite: ${game.cleopatra.sprite.currentMood} (valeur: ${value})`);
        },

        // Construire un bâtiment instantanément (sans coût)
        build: (buildingId, count = 1) => {
            const { BUILDINGS } = game.constructor.prototype.constructor.name === 'Game'
                ? { BUILDINGS: window.BUILDINGS }
                : {};

            // Accéder aux bâtiments via l'import
            import('../data/buildings.js').then(module => {
                const BUILDINGS = module.default;
                const building = BUILDINGS[buildingId];

                if (!building) {
                    console.log(`Bâtiment inconnu: ${buildingId}`);
                    console.log('Bâtiments disponibles:', Object.keys(BUILDINGS).join(', '));
                    return;
                }

                const currentCount = game.state.buildings[buildingId] || 0;
                const maxCount = building.maxCount;
                const actualCount = Math.min(count, maxCount - currentCount);

                if (actualCount <= 0) {
                    console.log(`${building.name} a atteint le maximum (${maxCount})`);
                    return;
                }

                for (let i = 0; i < actualCount; i++) {
                    // Ajouter le bâtiment
                    if (!game.state.buildings[buildingId]) {
                        game.state.buildings[buildingId] = 0;
                    }
                    game.state.buildings[buildingId]++;
                    game.state.buildingsBuilt++;

                    // Appliquer les effets
                    if (building.effects.population) {
                        game.state.population += building.effects.population;
                    }
                    if (building.effects.peasants) {
                        game.state.totalPeasants += building.effects.peasants;
                        game.state.availablePeasants += building.effects.peasants;
                    }
                }

                game.notifications.success(`+${actualCount} ${building.icon} ${building.name} (triche)`);
            });
        },

        // Ajouter une ressource spécifique
        wood: (n = 100) => { game.state.resources.wood += n; game.notifications.success(`+${n} 🪵`); },
        stone: (n = 100) => { game.state.resources.stone += n; game.notifications.success(`+${n} 🪨`); },
        sand: (n = 100) => { game.state.resources.sand += n; game.notifications.success(`+${n} 🏜️`); },
        dirt: (n = 100) => { game.state.resources.dirt += n; game.notifications.success(`+${n} 🟤`); },
        clay: (n = 100) => { game.state.resources.clay += n; game.notifications.success(`+${n} 🧱`); },
        food: (n = 100) => { game.state.food += n; game.notifications.success(`+${n} 🍞`); },
        water: (n = 100) => { game.state.water += n; game.notifications.success(`+${n} 💧`); },

        // Ajouter des paysans
        peasants: (n = 10) => {
            game.state.totalPeasants += n;
            game.state.availablePeasants += n;
            game.notifications.success(`+${n} 🧑‍🌾 paysans`);
        },

        // Lister les bâtiments disponibles
        buildings: () => {
            import('../data/buildings.js').then(module => {
                const BUILDINGS = module.default;
                console.log('=== BÂTIMENTS DISPONIBLES ===');
                Object.values(BUILDINGS).forEach(b => {
                    const count = game.state.buildings[b.id] || 0;
                    console.log(`${b.icon} ${b.id}: ${b.name} (${count}/${b.maxCount})`);
                });
            });
        },

        // Afficher l'aide
        help: () => {
            console.log(`
=== COMMANDES DE TRICHE ===
cheat.gameOver()      - Déclencher le game over
cheat.victory()       - Déclencher la victoire
cheat.money(n)        - Ajouter n argent (défaut: 10000)
cheat.resources(n)    - Ajouter n de chaque ressource (défaut: 100)
cheat.population(n)   - Ajouter n population (défaut: 1000)

=== TÂCHES CLÉOPÂTRE ===
cheat.tasks()         - Lister les tâches disponibles
cheat.task(id)        - Forcer une tâche spécifique
                        Ex: cheat.task('send_message')
cheat.newTask()       - Forcer une nouvelle tâche aléatoire
cheat.failTask()      - Échouer la tâche Cléopâtre en cours

=== RESSOURCES INDIVIDUELLES ===
cheat.wood(n)         - Ajouter n bois (défaut: 100)
cheat.stone(n)        - Ajouter n pierre (défaut: 100)
cheat.sand(n)         - Ajouter n sable (défaut: 100)
cheat.dirt(n)         - Ajouter n terre (défaut: 100)
cheat.clay(n)         - Ajouter n argile (défaut: 100)
cheat.food(n)         - Ajouter n nourriture (défaut: 100)
cheat.water(n)        - Ajouter n eau (défaut: 100)
cheat.peasants(n)     - Ajouter n paysans (défaut: 10)

=== BÂTIMENTS ===
cheat.buildings()     - Lister les bâtiments disponibles
cheat.build(id, n)    - Construire n bâtiments instantanément
                        Ex: cheat.build('house', 5)

=== ANIMATIONS CLÉOPÂTRE ===
cheat.anims()         - Lister les animations disponibles
cheat.anim(nom, ms)   - Jouer une animation spécifique
                        Ex: cheat.anim('speaking', 5000)
cheat.mood(valeur)    - Changer l'humeur du sprite (0-100)
                        Ex: cheat.mood(30) pour une humeur basse

cheat.help()          - Afficher cette aide
            `);
        }
    };

    console.log("💡 Tapez cheat.help() dans la console pour voir les commandes de triche");
}

// Initialisation
function init() {
    showLoading();

    // Simuler un temps de chargement minimum pour l'effet visuel
    setTimeout(() => {
        const game = new Game();
        setupEventHandlers(game);
        hideLoading();
        console.log('Cléopâtre - Le Village du Nil chargé!');
    }, 1500);
}

// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
