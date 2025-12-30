// ==========================================
// GESTION DES PANNEAUX D'INTERFACE
// ==========================================

import { BUILDINGS, RESOURCES } from '../data/index.js';

/**
 * Formate un temps en secondes en format lisible (ex: 1m26s, 45s)
 */
function formatTime(seconds) {
    const s = Math.ceil(seconds);
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
        this.setupTabs();
        this.setupMultiplierSelector();
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
    }

    /**
     * Initialise la liste des bâtiments (appelé une seule fois)
     */
    initBuildingsList() {
        const container = document.getElementById('buildingsList');
        if (!container) return;

        container.innerHTML = '';

        Object.values(BUILDINGS).forEach(building => {
            const item = document.createElement('div');
            item.className = 'building-item';
            item.dataset.buildingId = building.id;

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
                if (this.game.canBuild(building.id)) {
                    this.game.startBuilding(building.id);
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

            container.appendChild(item);
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

        // Mettre à jour chaque élément
        Object.values(BUILDINGS).forEach(building => {
            const item = container.querySelector(`[data-building-id="${building.id}"]`);
            if (!item) return;

            const canBuild = this.game.canBuild(building.id);
            const count = this.game.getBuildingCount(building.id);
            const maxReached = count >= building.maxCount;

            // Vérifier si ce bâtiment est en construction
            const constructions = this.game.state.constructions.filter(c => c.buildingId === building.id);
            const isBuilding = constructions.length > 0;

            // Mettre à jour la classe disabled et building
            item.classList.toggle('disabled', !canBuild || maxReached);
            item.classList.toggle('building', isBuilding);

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
                const costs = [];
                if (building.cost.money) {
                    const hasEnough = this.game.state.money >= building.cost.money;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">💰${building.cost.money}</span>`);
                }
                if (building.cost.wood) {
                    const hasEnough = this.game.state.resources.wood >= building.cost.wood;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🪵${building.cost.wood}</span>`);
                }
                if (building.cost.stone) {
                    const hasEnough = this.game.state.resources.stone >= building.cost.stone;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🪨${building.cost.stone}</span>`);
                }
                if (building.cost.sand) {
                    const hasEnough = this.game.state.resources.sand >= building.cost.sand;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🏜️${building.cost.sand}</span>`);
                }
                if (building.cost.dirt) {
                    const hasEnough = this.game.state.resources.dirt >= building.cost.dirt;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🟤${building.cost.dirt}</span>`);
                }
                if (building.cost.clay) {
                    const hasEnough = this.game.state.resources.clay >= building.cost.clay;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🧱${building.cost.clay}</span>`);
                }
                if (building.cost.water) {
                    const hasEnough = this.game.state.water >= building.cost.water;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">💧${building.cost.water}</span>`);
                }
                costsDiv.innerHTML = costs.join(' ');
            }

            // Mettre à jour l'affichage du max
            const maxDiv = item.querySelector('.max-reached');
            if (maxDiv) {
                maxDiv.style.display = maxReached ? 'block' : 'none';
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
                            ${progress}% - ${Math.ceil((construction.totalTime - construction.elapsed))}s restantes
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
                            ${progress}% - ${Math.ceil((task.totalTime - task.elapsed))}s restantes
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
