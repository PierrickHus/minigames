// ==========================================
// GESTION DES PANNEAUX D'INTERFACE
// ==========================================

import { BUILDINGS, RESOURCES, TIER_NAMES, BUILDING_TIER_UNLOCK } from '../data/index.js';

/**
 * Formate un temps en secondes en format lisible (ex: 1h30m, 1m26s, 45s)
 */
function formatTime(seconds) {
    const s = Math.ceil(seconds);
    if (s >= 3600) {
        const hours = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        if (mins > 0) {
            return `${hours}h${mins}m`;
        }
        return `${hours}h`;
    }
    if (s >= 60) {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return secs > 0 ? `${mins}m${secs}s` : `${mins}m`;
    }
    return `${s}s`;
}

class PanelManager {
    constructor(game) {
        this.game = game;
        this.activeTab = 'buildings';
        this.gatherMultiplier = 1; // Multiplicateur actuel pour la collecte
        this.buildMultiplier = 1; // Multiplicateur actuel pour la construction
        this.setupTabs();
        this.setupMultiplierSelector();
        this.setupBuildMultiplierSelector();
        this.initGatherButtons();
    }

    /**
     * Configure les onglets du panneau d'actions
     */
    setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    /**
     * Change d'onglet
     */
    switchTab(tabName) {
        this.activeTab = tabName;

        // Mettre à jour les boutons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Mettre à jour le contenu
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });

        // Rafraîchir le contenu
        this.refresh();
    }

    /**
     * Configure le sélecteur de multiplicateur
     */
    setupMultiplierSelector() {
        const container = document.getElementById('gatherButtons');
        if (!container) return;

        // Vérifier si le sélecteur existe déjà pour éviter les doublons
        const existingSelector = document.getElementById('multiplierSelector');
        if (existingSelector) {
            // Réattacher les événements sur le sélecteur existant
            existingSelector.querySelectorAll('.mult-btn').forEach(btn => {
                btn.onclick = () => this.setMultiplier(btn.dataset.mult === 'max' ? 'max' : parseInt(btn.dataset.mult));
            });
            return;
        }

        // Créer le sélecteur de multiplicateur
        const selector = document.createElement('div');
        selector.className = 'multiplier-selector';
        selector.id = 'multiplierSelector';

        const multipliers = [1, 5, 10, 'max'];
        multipliers.forEach(mult => {
            const btn = document.createElement('button');
            btn.className = `mult-btn ${mult === 1 ? 'active' : ''}`;
            btn.dataset.mult = mult;
            btn.textContent = mult === 'max' ? 'Max' : `x${mult}`;
            btn.addEventListener('click', () => this.setMultiplier(mult));
            selector.appendChild(btn);
        });

        container.parentNode.insertBefore(selector, container);
    }

    /**
     * Change le multiplicateur
     */
    setMultiplier(mult) {
        this.gatherMultiplier = mult;

        // Mettre à jour les boutons actifs
        document.querySelectorAll('.mult-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mult === String(mult));
        });

        // Rafraîchir les boutons de collecte
        this.updateGatherButtons();
    }

    /**
     * Calcule le nombre réel d'ouvriers à envoyer
     */
    getActualWorkerCount(resource) {
        const state = this.game.state;
        const maxAffordable = Math.floor(state.money / resource.gatherCost);
        const maxWorkers = state.availablePeasants;

        if (this.gatherMultiplier === 'max') {
            return Math.min(maxAffordable, maxWorkers);
        }

        return Math.min(this.gatherMultiplier, maxAffordable, maxWorkers);
    }

    /**
     * Configure le sélecteur de multiplicateur pour les bâtiments
     */
    setupBuildMultiplierSelector() {
        const container = document.getElementById('buildingsList');
        if (!container) return;

        // Vérifier si le sélecteur existe déjà
        const existingSelector = document.getElementById('buildMultiplierSelector');
        if (existingSelector) {
            existingSelector.querySelectorAll('.mult-btn').forEach(btn => {
                btn.onclick = () => this.setBuildMultiplier(btn.dataset.mult === 'max' ? 'max' : parseInt(btn.dataset.mult));
            });
            return;
        }

        // Créer le sélecteur de multiplicateur
        const selector = document.createElement('div');
        selector.className = 'multiplier-selector';
        selector.id = 'buildMultiplierSelector';

        const multipliers = [1, 5, 10, 'max'];
        multipliers.forEach(mult => {
            const btn = document.createElement('button');
            btn.className = `mult-btn ${mult === 1 ? 'active' : ''}`;
            btn.dataset.mult = mult;
            btn.textContent = mult === 'max' ? 'Max' : `x${mult}`;
            btn.addEventListener('click', () => this.setBuildMultiplier(mult));
            selector.appendChild(btn);
        });

        container.parentNode.insertBefore(selector, container);
    }

    /**
     * Change le multiplicateur de construction
     */
    setBuildMultiplier(mult) {
        this.buildMultiplier = mult;

        // Mettre à jour les boutons actifs (uniquement ceux du sélecteur de construction)
        const selector = document.getElementById('buildMultiplierSelector');
        if (selector) {
            selector.querySelectorAll('.mult-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mult === String(mult));
            });
        }

        // Rafraîchir la liste des bâtiments
        this.updateBuildingsList();
    }

    /**
     * Calcule le nombre réel de bâtiments à construire
     */
    getActualBuildCount(building) {
        const state = this.game.state;
        const builtCount = this.game.getBuildingCount(building.id);
        const pendingCount = state.constructions.filter(c => c.buildingId === building.id).length;
        const remainingSlots = building.maxCount - builtCount - pendingCount;

        // Calculer combien on peut construire avec les ressources
        let maxByMoney = Math.floor(state.money / building.cost.money);
        let maxByWorkers = state.availablePeasants;
        let maxByResources = Infinity;

        // Vérifier chaque ressource
        if (building.cost.wood) {
            maxByResources = Math.min(maxByResources, Math.floor(state.resources.wood / building.cost.wood));
        }
        if (building.cost.stone) {
            maxByResources = Math.min(maxByResources, Math.floor(state.resources.stone / building.cost.stone));
        }
        if (building.cost.sand) {
            maxByResources = Math.min(maxByResources, Math.floor(state.resources.sand / building.cost.sand));
        }
        if (building.cost.dirt) {
            maxByResources = Math.min(maxByResources, Math.floor(state.resources.dirt / building.cost.dirt));
        }
        if (building.cost.clay) {
            maxByResources = Math.min(maxByResources, Math.floor(state.resources.clay / building.cost.clay));
        }
        if (building.cost.water) {
            maxByResources = Math.min(maxByResources, Math.floor(state.water / building.cost.water));
        }

        const maxPossible = Math.min(remainingSlots, maxByMoney, maxByWorkers, maxByResources);

        if (this.buildMultiplier === 'max') {
            return Math.max(0, maxPossible);
        }

        return Math.max(0, Math.min(this.buildMultiplier, maxPossible));
    }

    /**
     * Initialise les boutons de collecte de ressources (appelé une seule fois)
     */
    initGatherButtons() {
        const container = document.getElementById('gatherButtons');
        if (!container) return;

        container.innerHTML = '';

        Object.values(RESOURCES).forEach(resource => {
            const item = document.createElement('div');
            item.className = 'gather-item';
            item.dataset.resource = resource.id;

            item.innerHTML = `
                <div class="gather-header">
                    <span class="gather-name">${resource.icon} ${resource.name}</span>
                    <span class="gather-icon">${resource.icon}</span>
                </div>
                <div class="gather-details">+${resource.gatherAmount} en ${resource.gatherTime}s</div>
                <div class="gather-time">⏱️ ${resource.gatherTime}s</div>
                <div class="gather-cost">💰${resource.gatherCost}</div>
            `;

            item.addEventListener('click', () => {
                const count = this.getActualWorkerCount(resource);
                if (count > 0) {
                    for (let i = 0; i < count; i++) {
                        this.game.gatherResource(resource.id);
                    }
                } else {
                    // Déterminer la cause exacte du blocage
                    const state = this.game.state;
                    if (state.availablePeasants < 1) {
                        this.game.notifications.error("Pas d'ouvriers disponibles !");
                    } else if (state.money < resource.gatherCost) {
                        this.game.notifications.error("Pas assez d'argent !");
                    } else {
                        this.game.notifications.error("Action impossible !");
                    }
                }
            });

            container.appendChild(item);
        });
    }

    /**
     * Rafraîchit l'affichage des panneaux
     */
    refresh() {
        this.updateBuildingsList();
        this.updateTasksList();
        this.updateResourcesDisplay();
        this.updateGatherButtons();
        this.updateStatsDisplay();
    }

    /**
     * Obtient les informations de déblocage d'un tier
     */
    getTierUnlockInfo(tier) {
        const unlockConfig = BUILDING_TIER_UNLOCK[tier];
        if (!unlockConfig) return { unlocked: true, timeRemaining: 0 };

        const gameTime = this.game.state.gameTime || 0;
        const unlocked = gameTime >= unlockConfig.time;
        const timeRemaining = Math.max(0, unlockConfig.time - gameTime);

        return {
            unlocked,
            timeRemaining,
            config: unlockConfig
        };
    }

    /**
     * Initialise la liste des bâtiments (appelé une seule fois)
     */
    initBuildingsList() {
        const container = document.getElementById('buildingsList');
        if (!container) return;

        container.innerHTML = '';

        // Trier les bâtiments par tier
        const buildingsByTier = {};
        Object.values(BUILDINGS).forEach(building => {
            const tier = building.tier || 1;
            if (!buildingsByTier[tier]) {
                buildingsByTier[tier] = [];
            }
            buildingsByTier[tier].push(building);
        });

        // Afficher par tier
        [1, 2, 3].forEach(tier => {
            if (!buildingsByTier[tier] || buildingsByTier[tier].length === 0) return;

            const unlockInfo = this.getTierUnlockInfo(tier);
            const unlockConfig = BUILDING_TIER_UNLOCK[tier];

            // Header de tier
            const tierHeader = document.createElement('div');
            tierHeader.className = 'tier-header';
            tierHeader.dataset.tier = tier;

            if (unlockInfo.unlocked) {
                tierHeader.innerHTML = `<span class="tier-icon">${unlockConfig.icon}</span> ${TIER_NAMES[tier]}`;
            } else {
                tierHeader.classList.add('locked');
                tierHeader.innerHTML = `
                    <span class="tier-icon">🔒</span>
                    <span class="tier-name">${TIER_NAMES[tier]}</span>
                    <span class="tier-unlock-time">Débloque dans ${formatTime(unlockInfo.timeRemaining)}</span>
                `;
            }
            container.appendChild(tierHeader);

            // Container pour les bâtiments du tier
            const tierContainer = document.createElement('div');
            tierContainer.className = 'tier-buildings';
            tierContainer.dataset.tier = tier;
            if (!unlockInfo.unlocked) {
                tierContainer.classList.add('locked');
            }

            // Bâtiments du tier
            buildingsByTier[tier].forEach(building => {
                const item = document.createElement('div');
                item.className = 'building-item';
                item.dataset.buildingId = building.id;
                item.dataset.tier = tier;

                item.innerHTML = `
                    <div class="building-header">
                        <span class="building-name">${building.name} (<span class="count">0</span>/${building.maxCount})</span>
                        <span class="building-icon">${building.icon}</span>
                    </div>
                    <div class="building-desc">${building.description}</div>
                    <div class="building-time">⏱️ ${formatTime(building.buildTime)}</div>
                    <div class="building-cost"></div>
                    <div class="max-reached" style="color: #ff6b6b; margin-top: 5px; display: none;">Maximum atteint</div>
                `;

                // Event listener permanent
                item.addEventListener('click', () => {
                    // Vérifier si le tier est débloqué
                    const currentUnlockInfo = this.getTierUnlockInfo(tier);
                    if (!currentUnlockInfo.unlocked) {
                        this.game.notifications.error(`Tier verrouillé ! Débloque dans ${formatTime(currentUnlockInfo.timeRemaining)}`);
                        return;
                    }

                    const count = this.getActualBuildCount(building);
                    if (count > 0) {
                        for (let i = 0; i < count; i++) {
                            this.game.startBuilding(building.id);
                        }
                    } else {
                        // Déterminer la cause exacte du blocage
                        const state = this.game.state;
                        const builtCount = this.game.getBuildingCount(building.id);
                        const pendingCount = state.constructions.filter(c => c.buildingId === building.id).length;

                        if (builtCount + pendingCount >= building.maxCount) {
                            this.game.notifications.error("Maximum atteint !");
                        } else if (state.availablePeasants < 1) {
                            this.game.notifications.error("Pas d'ouvriers disponibles !");
                        } else if (state.money < building.cost.money) {
                            this.game.notifications.error("Pas assez d'argent !");
                        } else if (building.cost.wood && state.resources.wood < building.cost.wood) {
                            this.game.notifications.error("Pas assez de bois !");
                        } else if (building.cost.stone && state.resources.stone < building.cost.stone) {
                            this.game.notifications.error("Pas assez de pierre !");
                        } else if (building.cost.sand && state.resources.sand < building.cost.sand) {
                            this.game.notifications.error("Pas assez de sable !");
                        } else if (building.cost.dirt && state.resources.dirt < building.cost.dirt) {
                            this.game.notifications.error("Pas assez de terre !");
                        } else if (building.cost.clay && state.resources.clay < building.cost.clay) {
                            this.game.notifications.error("Pas assez d'argile !");
                        } else if (building.cost.water && state.water < building.cost.water) {
                            this.game.notifications.error("Pas assez d'eau !");
                        } else {
                            this.game.notifications.error("Construction impossible !");
                        }
                    }
                });

                tierContainer.appendChild(item);
            });

            container.appendChild(tierContainer);
        });
    }

    /**
     * Met à jour la liste des bâtiments (mise à jour des états seulement)
     */
    updateBuildingsList() {
        const container = document.getElementById('buildingsList');
        if (!container) return;

        // Si la liste n'est pas initialisée, l'initialiser
        if (!container.querySelector('[data-building-id]')) {
            this.initBuildingsList();
        }

        // Compteur de bâtiments visibles par tier (pour gérer les headers)
        const visibleByTier = { 1: 0, 2: 0, 3: 0 };

        // Mettre à jour le statut des tiers
        [1, 2, 3].forEach(tier => {
            const unlockInfo = this.getTierUnlockInfo(tier);
            const unlockConfig = BUILDING_TIER_UNLOCK[tier];
            const tierHeader = container.querySelector(`.tier-header[data-tier="${tier}"]`);
            const tierContainer = container.querySelector(`.tier-buildings[data-tier="${tier}"]`);

            if (tierHeader) {
                if (unlockInfo.unlocked) {
                    tierHeader.classList.remove('locked');
                    tierHeader.innerHTML = `<span class="tier-icon">${unlockConfig.icon}</span> ${TIER_NAMES[tier]}`;
                } else {
                    tierHeader.classList.add('locked');
                    tierHeader.innerHTML = `
                        <span class="tier-icon">🔒</span>
                        <span class="tier-name">${TIER_NAMES[tier]}</span>
                        <span class="tier-unlock-time">Débloque dans ${formatTime(unlockInfo.timeRemaining)}</span>
                    `;
                }
            }

            if (tierContainer) {
                tierContainer.classList.toggle('locked', !unlockInfo.unlocked);
            }
        });

        // Mettre à jour chaque élément
        Object.values(BUILDINGS).forEach(building => {
            const item = container.querySelector(`[data-building-id="${building.id}"]`);
            if (!item) return;

            const tier = building.tier || 1;
            const unlockInfo = this.getTierUnlockInfo(tier);
            const canBuild = this.game.canBuild(building.id);
            const count = this.game.getBuildingCount(building.id);
            const maxReached = count >= building.maxCount;

            // Vérifier si ce bâtiment est en construction
            const constructions = this.game.state.constructions.filter(c => c.buildingId === building.id);
            const isBuilding = constructions.length > 0;
            const pendingCount = constructions.length;

            // Vérifier si le max est atteint avec les constructions en cours
            const totalWithPending = count + pendingCount;
            const maxReachedWithPending = totalWithPending >= building.maxCount;

            // Cacher si max atteint définitivement (constructions terminées)
            const shouldHide = maxReached && !isBuilding;
            item.style.display = shouldHide ? 'none' : '';

            // Compter les visibles par tier
            if (!shouldHide) {
                visibleByTier[tier]++;
            }

            // Mettre à jour la classe disabled et building
            // Désactivé si tier verrouillé OU si on ne peut pas construire
            item.classList.toggle('disabled', !unlockInfo.unlocked || !canBuild || maxReached);
            item.classList.toggle('tier-locked', !unlockInfo.unlocked);
            item.classList.toggle('building', isBuilding);
            // Contour vert si au max avec constructions en cours (attente)
            item.classList.toggle('building-max', maxReachedWithPending && isBuilding && !maxReached);

            // Mettre à jour le compteur
            const countSpan = item.querySelector('.count');
            if (countSpan) countSpan.textContent = count;

            // Mettre à jour le temps/progression
            const timeDiv = item.querySelector('.building-time');
            if (timeDiv) {
                if (isBuilding) {
                    // Afficher la progression
                    const construction = constructions[0];
                    const progress = ((construction.elapsed / construction.totalTime) * 100).toFixed(0);
                    const remaining = construction.totalTime - construction.elapsed;
                    const suffix = constructions.length > 1 ? ` (+${constructions.length - 1})` : '';
                    timeDiv.innerHTML = `🏗️ ${progress}% - ${formatTime(remaining)}${suffix}`;
                    timeDiv.classList.add('in-progress');
                } else {
                    // Afficher le temps de construction normal
                    timeDiv.innerHTML = `⏱️ ${formatTime(building.buildTime)}`;
                    timeDiv.classList.remove('in-progress');
                }
            }

            // Mettre à jour les coûts
            const costsDiv = item.querySelector('.building-cost');
            if (costsDiv) {
                // Calculer le multiplicateur effectif pour ce bâtiment
                const buildCount = this.getActualBuildCount(building);
                const mult = buildCount > 0 ? buildCount : 1;
                const showMult = this.buildMultiplier !== 1 && mult > 1;

                const costs = [];
                if (building.cost.money) {
                    const totalCost = building.cost.money * mult;
                    const hasEnough = this.game.state.money >= totalCost;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">💰${totalCost}${showMult ? ` (x${mult})` : ''}</span>`);
                }
                if (building.cost.wood) {
                    const totalCost = building.cost.wood * mult;
                    const hasEnough = this.game.state.resources.wood >= totalCost;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🪵${totalCost}</span>`);
                }
                if (building.cost.stone) {
                    const totalCost = building.cost.stone * mult;
                    const hasEnough = this.game.state.resources.stone >= totalCost;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🪨${totalCost}</span>`);
                }
                if (building.cost.sand) {
                    const totalCost = building.cost.sand * mult;
                    const hasEnough = this.game.state.resources.sand >= totalCost;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🏜️${totalCost}</span>`);
                }
                if (building.cost.dirt) {
                    const totalCost = building.cost.dirt * mult;
                    const hasEnough = this.game.state.resources.dirt >= totalCost;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🟤${totalCost}</span>`);
                }
                if (building.cost.clay) {
                    const totalCost = building.cost.clay * mult;
                    const hasEnough = this.game.state.resources.clay >= totalCost;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🧱${totalCost}</span>`);
                }
                if (building.cost.water) {
                    const totalCost = building.cost.water * mult;
                    const hasEnough = this.game.state.water >= totalCost;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">💧${totalCost}</span>`);
                }
                costsDiv.innerHTML = costs.join(' ');
            }

            // Mettre à jour l'affichage du max
            const maxDiv = item.querySelector('.max-reached');
            if (maxDiv) {
                maxDiv.style.display = maxReached ? 'block' : 'none';
            }
        });

        // Gérer l'affichage des headers et containers selon la visibilité
        [1, 2, 3].forEach(tier => {
            const tierHeader = container.querySelector(`.tier-header[data-tier="${tier}"]`);
            const tierContainer = container.querySelector(`.tier-buildings[data-tier="${tier}"]`);
            const unlockInfo = this.getTierUnlockInfo(tier);

            // Afficher le header et le container même si locked (pour voir le timer)
            // Mais cacher si tous les bâtiments sont max et le tier est unlock
            if (tierHeader && tierContainer) {
                const shouldShow = !unlockInfo.unlocked || visibleByTier[tier] > 0;
                tierHeader.style.display = shouldShow ? '' : 'none';
                tierContainer.style.display = shouldShow ? '' : 'none';
            }
        });
    }

    /**
     * Initialise la liste des tâches (appelé une seule fois)
     */
    initTasksList() {
        const container = document.getElementById('tasksList');
        if (!container) return;

        // Zone pour les tâches en cours (constructions, collectes)
        const inProgressSection = document.createElement('div');
        inProgressSection.id = 'tasksInProgress';
        container.appendChild(inProgressSection);

        // Tâches de base statiques
        const staticTasks = [
            {
                id: 'feed',
                name: 'Nourrir les paysans',
                desc: 'Distribuer nourriture et eau aux paysans',
                cost: 'Auto (consommation)',
                action: null,
                requiresBuilding: null
            },
            {
                id: 'sendMessage',
                name: 'Envoyer un message à César',
                desc: 'Utiliser un oiseau messager (nécessite une volière)',
                cost: '💰50',
                action: () => this.game.sendMessageToCaesar(),
                requiresBuilding: 'aviary'
            }
        ];

        staticTasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'task-item';
            item.dataset.taskId = task.id;
            item.innerHTML = `
                <div class="task-name">${task.name}</div>
                <div class="task-desc">${task.desc}</div>
                <div class="task-cost">${task.cost}</div>
                <div class="task-locked" style="display: none;">🔒 Nécessite une volière</div>
            `;

            // Attacher l'événement une seule fois
            if (task.action) {
                item.addEventListener('click', () => {
                    // Vérifier dynamiquement si cliquable
                    if (!item.classList.contains('disabled')) {
                        task.action();
                    }
                });
            }

            container.appendChild(item);
        });
    }

    /**
     * Met à jour la liste des tâches (mise à jour des états seulement)
     */
    updateTasksList() {
        const container = document.getElementById('tasksList');
        if (!container) return;

        // Initialiser si nécessaire
        if (!container.querySelector('[data-task-id]')) {
            this.initTasksList();
        }

        // Mettre à jour la zone des tâches en cours
        const inProgressSection = document.getElementById('tasksInProgress');
        if (inProgressSection) {
            let html = '';

            // Constructions en cours
            this.game.state.constructions.forEach((construction) => {
                const building = BUILDINGS[construction.buildingId];
                const progress = ((construction.elapsed / construction.totalTime) * 100).toFixed(0);
                html += `
                    <div class="task-item in-progress">
                        <div class="task-name">🏗️ Construction: ${building.name}</div>
                        <div class="task-desc">En cours de construction</div>
                        <div class="construction-progress">
                            <div class="construction-progress-bar" style="width: ${progress}%"></div>
                        </div>
                        <div style="color: #4ade80; margin-top: 5px;">
                            ${progress}% - ${formatTime(construction.totalTime - construction.elapsed)} restantes
                        </div>
                    </div>
                `;
            });

            // Collectes en cours
            this.game.state.gatheringTasks.forEach((task) => {
                const resource = RESOURCES[task.resourceId];
                const progress = ((task.elapsed / task.totalTime) * 100).toFixed(0);
                html += `
                    <div class="task-item in-progress">
                        <div class="task-name">${resource.icon} Collecte: ${resource.name}</div>
                        <div class="task-desc">Un paysan collecte des ressources</div>
                        <div class="construction-progress">
                            <div class="construction-progress-bar" style="width: ${progress}%"></div>
                        </div>
                        <div style="color: #4ade80; margin-top: 5px;">
                            ${progress}% - ${formatTime(task.totalTime - task.elapsed)} restantes
                        </div>
                    </div>
                `;
            });

            inProgressSection.innerHTML = html;
        }

        // Mettre à jour l'état des tâches statiques
        const sendMessageItem = container.querySelector('[data-task-id="sendMessage"]');
        if (sendMessageItem) {
            const hasAviary = this.game.hasBuilding('aviary');
            const isDisabled = !hasAviary;

            sendMessageItem.classList.toggle('disabled', isDisabled);
            sendMessageItem.classList.toggle('clickable', !isDisabled);

            const lockedDiv = sendMessageItem.querySelector('.task-locked');
            if (lockedDiv) {
                lockedDiv.style.display = isDisabled ? 'block' : 'none';
            }
        }
    }

    /**
     * Met à jour l'affichage des ressources
     */
    updateResourcesDisplay() {
        const state = this.game.state;

        // Ressources stockées
        document.getElementById('woodStock').textContent = Math.floor(state.resources.wood);
        document.getElementById('stoneStock').textContent = Math.floor(state.resources.stone);
        document.getElementById('sandStock').textContent = Math.floor(state.resources.sand);
        document.getElementById('dirtStock').textContent = Math.floor(state.resources.dirt);
        document.getElementById('clayStock').textContent = Math.floor(state.resources.clay);
    }

    /**
     * Met à jour l'affichage des statistiques
     */
    updateStatsDisplay() {
        const stats = this.game.statistics;
        if (!stats) return;

        const productionContainer = document.getElementById('statsProduction');
        const alertsContainer = document.getElementById('statsAlerts');
        const theoreticalContainer = document.getElementById('statsTheoretical');

        if (productionContainer) {
            const allStats = stats.getAllStats();
            const resourceNames = {
                money: { name: 'Or', icon: '💰' },
                food: { name: 'Nourriture', icon: '🍞' },
                water: { name: 'Eau', icon: '💧' },
                population: { name: 'Population', icon: '👥' },
                wood: { name: 'Bois', icon: '🪵' },
                stone: { name: 'Pierre', icon: '🪨' },
                sand: { name: 'Sable', icon: '🏜️' },
                dirt: { name: 'Terre', icon: '🟤' },
                clay: { name: 'Argile', icon: '🧱' }
            };

            let html = '';
            for (const [key, stat] of Object.entries(allStats)) {
                const res = resourceNames[key];
                if (!res) continue;

                const rateColor = stat.rate > 0 ? '#4ade80' : stat.rate < 0 ? '#ff6b6b' : '#aaa';
                const alertClass = stat.alertLevel === 'critical' ? 'stat-critical' : stat.alertLevel === 'warning' ? 'stat-warning' : '';

                html += `
                    <div class="stat-item ${alertClass}">
                        <span class="stat-icon">${res.icon}</span>
                        <span class="stat-name">${res.name}</span>
                        <span class="stat-value">${Math.floor(stat.current)}</span>
                        <span class="stat-rate" style="color: ${rateColor}">${stat.rateText}</span>
                    </div>
                `;
            }
            productionContainer.innerHTML = html;
        }

        if (alertsContainer) {
            const allStats = stats.getAllStats();
            const alerts = [];

            for (const [key, stat] of Object.entries(allStats)) {
                if (stat.alertLevel !== 'normal') {
                    const names = {
                        money: 'Or', food: 'Nourriture', water: 'Eau',
                        population: 'Population', wood: 'Bois', stone: 'Pierre',
                        sand: 'Sable', dirt: 'Terre', clay: 'Argile'
                    };
                    alerts.push({
                        key,
                        name: names[key],
                        level: stat.alertLevel,
                        depletionText: stat.depletionText
                    });
                }
            }

            if (alerts.length === 0) {
                alertsContainer.innerHTML = '<div class="no-alerts">Aucune alerte</div>';
            } else {
                let html = '';
                alerts.forEach(alert => {
                    const color = alert.level === 'critical' ? '#ff6b6b' : '#ffaa00';
                    const icon = alert.level === 'critical' ? '⚠️' : '⚡';
                    html += `
                        <div class="alert-item" style="border-left-color: ${color}">
                            <span class="alert-icon">${icon}</span>
                            <span class="alert-name">${alert.name}</span>
                            <span class="alert-level" style="color: ${color}">${alert.level === 'critical' ? 'Critique' : 'Attention'}</span>
                            ${alert.depletionText ? `<span class="alert-depletion">${alert.depletionText}</span>` : ''}
                        </div>
                    `;
                });
                alertsContainer.innerHTML = html;
            }
        }

        if (theoreticalContainer) {
            const theoretical = stats.getTheoreticalProduction();
            const items = [
                { icon: '🍞', name: 'Nourriture', value: theoretical.food },
                { icon: '💧', name: 'Eau', value: theoretical.water },
                { icon: '💰', name: 'Or', value: theoretical.money },
                { icon: '🪵', name: 'Bois', value: theoretical.wood },
                { icon: '🪨', name: 'Pierre', value: theoretical.stone }
            ].filter(i => i.value !== 0);

            if (items.length === 0) {
                theoreticalContainer.innerHTML = '<div class="no-production">Aucune production automatique</div>';
            } else {
                let html = '';
                items.forEach(item => {
                    html += `
                        <div class="theoretical-item">
                            <span class="theoretical-icon">${item.icon}</span>
                            <span class="theoretical-name">${item.name}</span>
                            <span class="theoretical-value" style="color: #4ade80">+${item.value.toFixed(1)}/min</span>
                        </div>
                    `;
                });
                theoreticalContainer.innerHTML = html;
            }
        }
    }

    /**
     * Met à jour les boutons de collecte
     */
    updateGatherButtons() {
        const state = this.game.state;
        const container = document.getElementById('gatherButtons');
        if (!container) return;

        // Si pas initialisé, initialiser
        if (!container.querySelector('[data-resource]')) {
            this.initGatherButtons();
        }

        Object.values(RESOURCES).forEach(resource => {
            const item = container.querySelector(`[data-resource="${resource.id}"]`);
            if (!item) return;

            const workerCount = this.getActualWorkerCount(resource);
            const canGather = workerCount > 0;
            const totalCost = workerCount * resource.gatherCost;
            const totalGather = workerCount * resource.gatherAmount;

            // Vérifier si cette ressource est en cours de collecte
            const gatherings = state.gatheringTasks.filter(t => t.resourceId === resource.id);
            const isGathering = gatherings.length > 0;

            // Mettre à jour les classes
            item.classList.toggle('disabled', !canGather);
            item.classList.toggle('gathering', isGathering);

            // Mettre à jour les détails (quantité collectée et nombre d'ouvriers)
            const detailsDiv = item.querySelector('.gather-details');
            if (detailsDiv) {
                if (workerCount > 1) {
                    detailsDiv.innerHTML = `<strong>+${totalGather}</strong> ${resource.icon} avec <strong>${workerCount} ouvriers</strong> <span class="per-worker">(${resource.gatherAmount}/ouvrier)</span>`;
                } else if (workerCount === 1) {
                    detailsDiv.innerHTML = `+${resource.gatherAmount} ${resource.icon} en ${resource.gatherTime}s`;
                } else {
                    detailsDiv.innerHTML = `+${resource.gatherAmount} ${resource.icon} en ${resource.gatherTime}s`;
                }
            }

            // Mettre à jour le temps/progression
            const timeDiv = item.querySelector('.gather-time');
            if (timeDiv) {
                if (isGathering) {
                    const task = gatherings[0];
                    const progress = ((task.elapsed / task.totalTime) * 100).toFixed(0);
                    const remaining = task.totalTime - task.elapsed;
                    const suffix = gatherings.length > 1 ? ` (+${gatherings.length - 1})` : '';
                    timeDiv.innerHTML = `🧑‍🌾 ${progress}% - ${formatTime(remaining)}${suffix}`;
                    timeDiv.classList.add('in-progress');
                } else {
                    timeDiv.innerHTML = `⏱️ ${formatTime(resource.gatherTime)}`;
                    timeDiv.classList.remove('in-progress');
                }
            }

            // Mettre à jour le coût affiché
            const costDiv = item.querySelector('.gather-cost');
            if (costDiv) {
                if (workerCount > 1) {
                    costDiv.innerHTML = `<span class="${canGather ? '' : 'insufficient'}">💰${totalCost}</span> (${workerCount} ouvriers)`;
                } else if (workerCount === 1) {
                    costDiv.innerHTML = `<span class="${canGather ? '' : 'insufficient'}">💰${resource.gatherCost}</span>`;
                } else {
                    costDiv.innerHTML = `<span class="insufficient">💰${resource.gatherCost}</span>`;
                }
            }
        });
    }
}

export default PanelManager;
