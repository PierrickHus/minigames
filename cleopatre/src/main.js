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
            import('./data/buildings.js').then(module => {
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

                let builtCount = 0;
                for (let i = 0; i < actualCount; i++) {
                    // D'abord essayer de placer sur la grille
                    let placed = null;
                    if (game.villageRenderer) {
                        placed = game.villageRenderer.placeBuilding(buildingId);
                        if (!placed) {
                            console.log(`Pas de place pour ${building.name} sur la grille`);
                            continue; // Passer au suivant
                        }
                        // Marquer comme terminé immédiatement (utiliser UID pour les formes complexes)
                        game.villageRenderer.finishBuilding(placed.uid);
                    }

                    // Ajouter le bâtiment au compteur
                    if (!game.state.buildings[buildingId]) {
                        game.state.buildings[buildingId] = 0;
                    }
                    game.state.buildings[buildingId]++;
                    game.state.buildingsBuilt++;
                    builtCount++;

                    // Appliquer les effets
                    if (building.effects.population) {
                        game.state.population += building.effects.population;
                    }
                    if (building.effects.peasants) {
                        game.state.totalPeasants += building.effects.peasants;
                        game.state.availablePeasants += building.effects.peasants;
                    }
                }

                if (builtCount > 0) {
                    game.notifications.success(`+${builtCount} ${building.icon} ${building.name} (triche)`);
                } else {
                    game.notifications.error(`Pas de place pour ${building.name} !`);
                }

                // Rafraîchir l'interface
                if (game.panelManager) {
                    game.panelManager.refresh();
                }
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
            import('./data/buildings.js').then(module => {
                const BUILDINGS = module.default;
                console.log('=== BÂTIMENTS DISPONIBLES ===');
                Object.values(BUILDINGS).forEach(b => {
                    const count = game.state.buildings[b.id] || 0;
                    console.log(`${b.icon} ${b.id}: ${b.name} (${count}/${b.maxCount}) [Tier ${b.tier || 1}]`);
                });
            });
        },

        // Lister les tiers et leur statut
        tiers: () => {
            import('./data/tasks.js').then(module => {
                const { BUILDING_TIER_UNLOCK } = module;
                const gameTime = game.state.gameTime || 0;
                const formatTime = (s) => {
                    if (s >= 3600) return `${Math.floor(s/3600)}h${Math.floor((s%3600)/60)}m`;
                    if (s >= 60) return `${Math.floor(s/60)}m${Math.ceil(s%60)}s`;
                    return `${Math.ceil(s)}s`;
                };

                console.log('=== TIERS DE BÂTIMENTS ===');
                console.log(`Temps de jeu: ${formatTime(gameTime)}`);
                console.log('');

                [1, 2, 3].forEach(tier => {
                    const config = BUILDING_TIER_UNLOCK[tier];
                    const unlocked = gameTime >= config.time;
                    const timeRemaining = Math.max(0, config.time - gameTime);
                    const status = unlocked ? '✅ DÉBLOQUÉ' : `🔒 dans ${formatTime(timeRemaining)}`;
                    console.log(`${config.icon} Tier ${tier}: ${config.name} - ${status}`);
                    console.log(`   Débloqué à: ${formatTime(config.time)}`);
                });

                console.log('\nCommandes:');
                console.log('  cheat.unlockTier(n)    - Débloquer le tier n');
                console.log('  cheat.lockTier(n)      - Verrouiller le tier n');
                console.log('  cheat.unlockAllTiers() - Débloquer tous les tiers');
            });
        },

        // Débloquer un tier spécifique
        unlockTier: (tier) => {
            if (tier < 1 || tier > 3) {
                console.log('Tier invalide. Utilisez 1, 2 ou 3.');
                return;
            }

            import('./data/tasks.js').then(module => {
                const { BUILDING_TIER_UNLOCK } = module;
                const config = BUILDING_TIER_UNLOCK[tier];
                const requiredTime = config.time;

                if (game.state.gameTime >= requiredTime) {
                    console.log(`Tier ${tier} déjà débloqué !`);
                    return;
                }

                // Mettre le temps de jeu au minimum requis pour ce tier
                game.state.gameTime = requiredTime;
                game.notifications.success(`${config.icon} Tier ${tier} débloqué !`);
                console.log(`Tier ${tier} (${config.name}) débloqué !`);
                console.log(`Temps de jeu avancé à ${Math.floor(requiredTime / 60)}m${Math.floor(requiredTime % 60)}s`);
            });
        },

        // Verrouiller un tier spécifique
        lockTier: (tier) => {
            if (tier < 2 || tier > 3) {
                console.log('Seuls les tiers 2 et 3 peuvent être verrouillés (tier 1 toujours disponible).');
                return;
            }

            import('./data/tasks.js').then(module => {
                const { BUILDING_TIER_UNLOCK } = module;
                const prevTierConfig = BUILDING_TIER_UNLOCK[tier - 1];
                const targetTime = prevTierConfig.time + 1; // Juste après le tier précédent

                if (game.state.gameTime < BUILDING_TIER_UNLOCK[tier].time) {
                    console.log(`Tier ${tier} déjà verrouillé !`);
                    return;
                }

                game.state.gameTime = targetTime;
                game.notifications.warning(`🔒 Tier ${tier} verrouillé !`);
                console.log(`Tier ${tier} verrouillé !`);
                console.log(`Temps de jeu reculé à ${Math.floor(targetTime / 60)}m${Math.floor(targetTime % 60)}s`);
            });
        },

        // Débloquer tous les tiers
        unlockAllTiers: () => {
            import('./data/tasks.js').then(module => {
                const { BUILDING_TIER_UNLOCK } = module;
                const tier3Time = BUILDING_TIER_UNLOCK[3].time;

                game.state.gameTime = tier3Time;
                game.notifications.success('👑 Tous les tiers débloqués !');
                console.log('Tous les tiers de bâtiments débloqués !');
                console.log(`Temps de jeu avancé à ${Math.floor(tier3Time / 60)}m${Math.floor(tier3Time % 60)}s`);
            });
        },

        // Lister les bâtiments par tier
        tierBuildings: (tier) => {
            if (!tier || tier < 1 || tier > 3) {
                console.log('Usage: cheat.tierBuildings(1), cheat.tierBuildings(2), ou cheat.tierBuildings(3)');
                return;
            }

            import('./data/buildings.js').then(module => {
                const BUILDINGS = module.default;
                const buildings = Object.values(BUILDINGS).filter(b => (b.tier || 1) === tier);

                console.log(`=== BÂTIMENTS TIER ${tier} ===`);
                buildings.forEach(b => {
                    const count = game.state.buildings[b.id] || 0;
                    console.log(`${b.icon} ${b.id}: ${b.name} (${count}/${b.maxCount})`);
                });
                console.log(`Total: ${buildings.length} bâtiments`);
            });
        },

        // Construire un bâtiment aléatoire instantanément
        randomBuild: (count = 1) => {
            import('./data/buildings.js').then(buildingsModule => {
                import('./data/tasks.js').then(tasksModule => {
                    const BUILDINGS = buildingsModule.default;
                    const { BUILDING_TIER_UNLOCK } = tasksModule;
                    const gameTime = game.state.gameTime || 0;

                    // Filtrer les bâtiments disponibles (tier débloqué et pas au max)
                    const availableBuildings = Object.values(BUILDINGS).filter(b => {
                        const tier = b.tier || 1;
                        const tierConfig = BUILDING_TIER_UNLOCK[tier];
                        const tierUnlocked = gameTime >= tierConfig.time;
                        const currentCount = game.state.buildings[b.id] || 0;
                        const notAtMax = currentCount < b.maxCount;
                        return tierUnlocked && notAtMax;
                    });

                    if (availableBuildings.length === 0) {
                        console.log('Aucun bâtiment disponible à construire !');
                        return;
                    }

                    let built = 0;
                    for (let i = 0; i < count; i++) {
                        // Recalculer les disponibles à chaque itération
                        const stillAvailable = availableBuildings.filter(b => {
                            const currentCount = game.state.buildings[b.id] || 0;
                            return currentCount < b.maxCount;
                        });

                        if (stillAvailable.length === 0) break;

                        // Choisir un bâtiment aléatoire
                        const building = stillAvailable[Math.floor(Math.random() * stillAvailable.length)];

                        // D'abord essayer de placer sur la grille
                        let placed = null;
                        if (game.villageRenderer) {
                            placed = game.villageRenderer.placeBuilding(building.id);
                            if (!placed) {
                                console.log(`Pas de place pour ${building.name} sur la grille`);
                                // Retirer ce bâtiment des disponibles pour cette session
                                const idx = availableBuildings.findIndex(b => b.id === building.id);
                                if (idx !== -1) availableBuildings.splice(idx, 1);
                                continue; // Passer au suivant
                            }
                            // Marquer comme terminé immédiatement (utiliser UID pour les formes complexes)
                            game.villageRenderer.finishBuilding(placed.uid);
                        }

                        // Construire instantanément
                        if (!game.state.buildings[building.id]) {
                            game.state.buildings[building.id] = 0;
                        }
                        game.state.buildings[building.id]++;
                        game.state.buildingsBuilt++;

                        // Appliquer les effets
                        if (building.effects.population) {
                            game.state.population += building.effects.population;
                        }
                        if (building.effects.peasants) {
                            game.state.totalPeasants += building.effects.peasants;
                            game.state.availablePeasants += building.effects.peasants;
                        }

                        built++;
                        console.log(`${building.icon} ${building.name} construit !`);
                    }

                    if (built > 0) {
                        game.notifications.success(`+${built} bâtiment(s) aléatoire(s) (triche)`);
                        // Rafraîchir l'interface
                        if (game.panelManager) {
                            game.panelManager.refresh();
                        }
                    }
                });
            });
        },

        // Avancer le temps de jeu
        time: (seconds) => {
            if (typeof seconds !== 'number' || seconds <= 0) {
                console.log('Usage: cheat.time(300) - Avance le temps de 300 secondes (5 minutes)');
                console.log(`Temps actuel: ${Math.floor(game.state.gameTime / 60)}m${Math.floor(game.state.gameTime % 60)}s`);
                return;
            }

            game.state.gameTime += seconds;
            const totalTime = game.state.gameTime;
            game.notifications.info(`⏰ +${Math.floor(seconds / 60)}m${Math.floor(seconds % 60)}s`);
            console.log(`Temps avancé de ${seconds}s`);
            console.log(`Nouveau temps: ${Math.floor(totalTime / 60)}m${Math.floor(totalTime % 60)}s`);
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
cheat.randomBuild(n)  - Construire n bâtiments aléatoires (défaut: 1)
                        Ex: cheat.randomBuild(10)

=== TIERS DE BÂTIMENTS ===
cheat.tiers()         - Lister les tiers et leur statut
cheat.unlockTier(n)   - Débloquer le tier n (1, 2, ou 3)
cheat.lockTier(n)     - Verrouiller le tier n (2 ou 3)
cheat.unlockAllTiers()- Débloquer tous les tiers
cheat.tierBuildings(n)- Lister les bâtiments du tier n
cheat.time(s)         - Avancer le temps de jeu de s secondes
                        Ex: cheat.time(300) avance de 5 minutes

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
