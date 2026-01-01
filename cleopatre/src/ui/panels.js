// ==========================================
// GESTION DES PANNEAUX D'INTERFACE
// ==========================================
// Ce module gère tous les panneaux de l'interface utilisateur du jeu:
// - Liste des bâtiments constructibles (avec système de tiers)
// - Liste des tâches et actions (nourrir, envoyer messages)
// - Barre de ressources collectables en bas de l'écran
// - Affichage des statistiques de production
// ==========================================

import { BUILDINGS, RESOURCES, TIER_NAMES, BUILDING_TIER_UNLOCK } from '../data/index.js';

/**
 * Formate un temps en secondes en format lisible
 * Exemples: 3661s → "1h1m", 90s → "1m30s", 45s → "45s"
 * @param {number} seconds - Temps en secondes à formater
 * @returns {string} Temps formaté en chaîne lisible
 */
function formatTime(seconds) {
    const s = Math.ceil(seconds);
    if (s >= 3600) {
        // Plus d'une heure: afficher heures et minutes
        const hours = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        if (mins > 0) {
            return `${hours}h${mins}m`;
        }
        return `${hours}h`;
    }
    if (s >= 60) {
        // Plus d'une minute: afficher minutes et secondes
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return secs > 0 ? `${mins}m${secs}s` : `${mins}m`;
    }
    // Moins d'une minute: afficher les secondes uniquement
    return `${s}s`;
}

/**
 * Gestionnaire des panneaux d'interface utilisateur
 * Gère l'affichage et l'interaction avec les différents panneaux du jeu:
 * bâtiments, tâches, ressources et statistiques
 */
class PanelManager {
    /**
     * Crée une nouvelle instance du gestionnaire de panneaux
     * @param {Game} game - Instance du jeu principal
     */
    constructor(game) {
        /** @type {Game} Référence au jeu principal */
        this.game = game;

        /** @type {string} Onglet actuellement actif ('buildings', 'tasks', 'stats') */
        this.activeTab = 'buildings';

        /** @type {number|string} Multiplicateur pour la collecte de ressources (1, 5, 10 ou 'max') */
        this.gatherMultiplier = 1;

        /** @type {number|string} Multiplicateur pour la construction de bâtiments (1, 5, 10 ou 'max') */
        this.buildMultiplier = 1;

        // Initialisation des composants UI
        this.setupTabs();
        this.setupBuildMultiplierSelector();
        this.setupResourcesBar();
    }

    /**
     * Configure les onglets du panneau d'actions
     * Attache les événements click aux boutons d'onglets
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
     * Change l'onglet actif du panneau d'actions
     * Met à jour les classes CSS et rafraîchit le contenu
     * @param {string} tabName - Nom de l'onglet ('buildings', 'tasks', 'stats')
     */
    switchTab(tabName) {
        this.activeTab = tabName;

        // Mettre à jour les boutons d'onglets (classe 'active')
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Mettre à jour le contenu visible
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });

        // Rafraîchir le contenu du nouvel onglet
        this.refresh();
    }

    /**
     * Configure la barre de ressources en bas de l'écran
     * Initialise le sélecteur de multiplicateur et les boutons de collecte
     */
    setupResourcesBar() {
        // Configuration du sélecteur de multiplicateur de collecte
        const multiplierContainer = document.getElementById('resourceMultiplierBar');
        if (multiplierContainer) {
            multiplierContainer.querySelectorAll('.mult-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const mult = btn.dataset.mult === 'max' ? 'max' : parseInt(btn.dataset.mult);
                    this.setGatherMultiplier(mult);
                });
            });
        }

        // Configuration des boutons de collecte pour chaque ressource
        const resourcesList = document.getElementById('resourcesBarList');
        if (resourcesList) {
            resourcesList.querySelectorAll('.resource-bar-item').forEach(item => {
                const resourceId = item.dataset.resource;
                // Les oiseaux ne sont pas collectables manuellement
                if (resourceId === 'birds') return;

                const gatherBtn = item.querySelector('.gather-btn');
                if (gatherBtn) {
                    gatherBtn.addEventListener('click', () => {
                        const resource = RESOURCES[resourceId];
                        if (!resource) return;

                        // Calculer le nombre d'ouvriers à envoyer selon le multiplicateur
                        const count = this.getActualWorkerCount(resource);
                        if (count > 0) {
                            // Lancer autant de collectes que possible
                            for (let i = 0; i < count; i++) {
                                this.game.gatherResource(resourceId);
                            }
                        } else {
                            // Afficher un message d'erreur explicatif
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
                }
            });
        }
    }

    /**
     * Change le multiplicateur de collecte de ressources
     * @param {number|string} mult - Nouveau multiplicateur (1, 5, 10 ou 'max')
     */
    setGatherMultiplier(mult) {
        this.gatherMultiplier = mult;

        // Mettre à jour l'affichage des boutons actifs
        const container = document.getElementById('resourceMultiplierBar');
        if (container) {
            container.querySelectorAll('.mult-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mult === String(mult));
            });
        }

        // Rafraîchir la barre de ressources pour montrer les nouveaux coûts
        this.updateResourcesBar();
    }

    /**
     * Calcule le nombre réel d'ouvriers à envoyer pour une collecte
     * Prend en compte: multiplicateur choisi, argent disponible, ouvriers disponibles
     * @param {object} resource - Objet ressource avec gatherCost
     * @returns {number} Nombre d'ouvriers pouvant être envoyés
     */
    getActualWorkerCount(resource) {
        const state = this.game.state;
        // Maximum d'ouvriers qu'on peut payer
        const maxAffordable = Math.floor(state.money / resource.gatherCost);
        // Ouvriers disponibles
        const maxWorkers = state.availablePeasants;

        if (this.gatherMultiplier === 'max') {
            // Mode max: envoyer autant que possible
            return Math.min(maxAffordable, maxWorkers);
        }

        // Mode multiplicateur fixe: limité par le multiplicateur, l'argent et les ouvriers
        return Math.min(this.gatherMultiplier, maxAffordable, maxWorkers);
    }

    /**
     * Configure le sélecteur de multiplicateur pour la construction de bâtiments
     * Crée dynamiquement le sélecteur si nécessaire
     */
    setupBuildMultiplierSelector() {
        const container = document.getElementById('buildingsList');
        if (!container) return;

        // Vérifier si le sélecteur existe déjà (éviter les doublons)
        const existingSelector = document.getElementById('buildMultiplierSelector');
        if (existingSelector) {
            // Réattacher les événements
            existingSelector.querySelectorAll('.mult-btn').forEach(btn => {
                btn.onclick = () => this.setBuildMultiplier(btn.dataset.mult === 'max' ? 'max' : parseInt(btn.dataset.mult));
            });
            return;
        }

        // Créer le sélecteur de multiplicateur
        const selector = document.createElement('div');
        selector.className = 'multiplier-selector';
        selector.id = 'buildMultiplierSelector';

        // Boutons disponibles: x1, x5, x10, Max
        const multipliers = [1, 5, 10, 'max'];
        multipliers.forEach(mult => {
            const btn = document.createElement('button');
            btn.className = `mult-btn ${mult === 1 ? 'active' : ''}`;
            btn.dataset.mult = mult;
            btn.textContent = mult === 'max' ? 'Max' : `x${mult}`;
            btn.addEventListener('click', () => this.setBuildMultiplier(mult));
            selector.appendChild(btn);
        });

        // Insérer avant la liste des bâtiments
        container.parentNode.insertBefore(selector, container);
    }

    /**
     * Change le multiplicateur de construction de bâtiments
     * @param {number|string} mult - Nouveau multiplicateur (1, 5, 10 ou 'max')
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
     * Calcule le nombre réel de bâtiments constructibles avec le multiplicateur actuel
     * Simule les coûts cumulés avec le scaling logarithmique pour déterminer
     * combien de bâtiments on peut construire avec les ressources actuelles
     * @param {object} building - Objet bâtiment avec cost, maxCount, id
     * @returns {number} Nombre de bâtiments pouvant être construits
     */
    getActualBuildCount(building) {
        const state = this.game.state;
        const builtCount = this.game.getBuildingCount(building.id);
        const pendingCount = state.constructions.filter(c => c.buildingId === building.id).length;
        const remainingSlots = building.maxCount - builtCount - pendingCount;

        // Vérifications préalables
        if (remainingSlots <= 0) return 0;
        if (state.availablePeasants < 1) return 0;

        // Déterminer le nombre cible selon le multiplicateur
        let targetCount;
        if (this.buildMultiplier === 'max') {
            targetCount = Math.min(remainingSlots, state.availablePeasants);
        } else {
            targetCount = Math.min(this.buildMultiplier, remainingSlots, state.availablePeasants);
        }

        // Simulation des coûts cumulés pour chaque bâtiment successif
        // Le coût augmente de 15% pour chaque bâtiment déjà construit (scaling logarithmique)
        let canBuild = 0;
        let simulatedMoney = state.money;
        let simulatedResources = { ...state.resources };
        let simulatedWater = state.water;
        const totalCount = builtCount + pendingCount;

        for (let i = 0; i < targetCount; i++) {
            // Calculer le coût pour le (n+i)ème bâtiment
            // Formule: coût_base * 1.15^nombre_existants
            const multiplier = Math.pow(1.15, totalCount + i);

            const cost = {
                money: building.cost.money, // L'or reste fixe (pas de scaling)
                wood: building.cost.wood ? Math.ceil(building.cost.wood * multiplier) : 0,
                stone: building.cost.stone ? Math.ceil(building.cost.stone * multiplier) : 0,
                sand: building.cost.sand ? Math.ceil(building.cost.sand * multiplier) : 0,
                dirt: building.cost.dirt ? Math.ceil(building.cost.dirt * multiplier) : 0,
                clay: building.cost.clay ? Math.ceil(building.cost.clay * multiplier) : 0,
                water: building.cost.water ? Math.ceil(building.cost.water * multiplier) : 0
            };

            // Vérifier si on peut payer ce bâtiment
            if (simulatedMoney < cost.money) break;
            if (cost.wood && simulatedResources.wood < cost.wood) break;
            if (cost.stone && simulatedResources.stone < cost.stone) break;
            if (cost.sand && simulatedResources.sand < cost.sand) break;
            if (cost.dirt && simulatedResources.dirt < cost.dirt) break;
            if (cost.clay && simulatedResources.clay < cost.clay) break;
            if (cost.water && simulatedWater < cost.water) break;

            // Déduire les coûts de la simulation
            simulatedMoney -= cost.money;
            if (cost.wood) simulatedResources.wood -= cost.wood;
            if (cost.stone) simulatedResources.stone -= cost.stone;
            if (cost.sand) simulatedResources.sand -= cost.sand;
            if (cost.dirt) simulatedResources.dirt -= cost.dirt;
            if (cost.clay) simulatedResources.clay -= cost.clay;
            if (cost.water) simulatedWater -= cost.water;

            canBuild++;
        }

        return canBuild;
    }

    /**
     * Rafraîchit l'affichage de tous les panneaux
     * Appelé lors des changements d'onglet ou des mises à jour de l'état du jeu
     */
    refresh() {
        this.updateBuildingsList();
        this.updateTasksList();
        this.updateResourcesBar();
        this.updateStatsDisplay();
    }

    /**
     * Obtient les informations de déblocage d'un tier de bâtiments
     * @param {number} tier - Numéro du tier (1, 2, 3)
     * @returns {object} Informations: unlocked (boolean), timeRemaining (seconds), config
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
     * Initialise la structure DOM de la liste des bâtiments
     * Appelé une seule fois au démarrage, crée les éléments pour chaque bâtiment
     * Organisation par tiers avec headers et containers
     */
    initBuildingsList() {
        const container = document.getElementById('buildingsList');
        if (!container) return;

        container.innerHTML = '';

        // Regrouper les bâtiments par tier
        const buildingsByTier = {};
        Object.values(BUILDINGS).forEach(building => {
            const tier = building.tier || 1;
            if (!buildingsByTier[tier]) {
                buildingsByTier[tier] = [];
            }
            buildingsByTier[tier].push(building);
        });

        // Créer la structure pour chaque tier (1, 2, 3)
        [1, 2, 3].forEach(tier => {
            if (!buildingsByTier[tier] || buildingsByTier[tier].length === 0) return;

            const unlockInfo = this.getTierUnlockInfo(tier);
            const unlockConfig = BUILDING_TIER_UNLOCK[tier];

            // Header du tier (avec icône et timer si verrouillé)
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

            // Créer les éléments pour chaque bâtiment du tier
            buildingsByTier[tier].forEach(building => {
                const item = document.createElement('div');
                item.className = 'building-item';
                item.dataset.buildingId = building.id;
                item.dataset.tier = tier;

                // Structure HTML de l'élément bâtiment
                item.innerHTML = `
                    <div class="building-header">
                        <span class="building-name">${building.name} (<span class="count-display"><span class="count-built">0</span></span>/${building.maxCount})</span>
                        <span class="building-icon">${building.icon}</span>
                    </div>
                    <div class="building-desc">${building.description}</div>
                    <div class="building-time">⏱️ ${formatTime(building.buildTime)}</div>
                    <div class="building-cost"></div>
                    <div class="max-reached" style="color: #ff6b6b; margin-top: 5px; display: none;">Maximum atteint</div>
                `;

                // Attacher l'événement click (permanent)
                item.addEventListener('click', () => {
                    // Vérifier si le tier est débloqué au moment du clic
                    const currentUnlockInfo = this.getTierUnlockInfo(tier);
                    if (!currentUnlockInfo.unlocked) {
                        this.game.notifications.error(`Tier verrouillé ! Débloque dans ${formatTime(currentUnlockInfo.timeRemaining)}`);
                        return;
                    }

                    // Calculer combien de bâtiments on peut construire
                    const count = this.getActualBuildCount(building);
                    if (count > 0) {
                        // Lancer autant de constructions que possible
                        for (let i = 0; i < count; i++) {
                            this.game.startBuilding(building.id);
                        }
                    } else {
                        // Déterminer la cause exacte du blocage pour le message d'erreur
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
     * Met à jour l'affichage de la liste des bâtiments
     * Rafraîchit les états (coûts, progression, disponibilité) sans recréer le DOM
     */
    updateBuildingsList() {
        const container = document.getElementById('buildingsList');
        if (!container) return;

        // Initialiser la liste si elle n'existe pas encore
        if (!container.querySelector('[data-building-id]')) {
            this.initBuildingsList();
        }

        // Compteur de bâtiments visibles par tier (pour gérer l'affichage des headers)
        const visibleByTier = { 1: 0, 2: 0, 3: 0 };

        // Mettre à jour le statut des tiers (verrouillé/déverrouillé)
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

        // Mettre à jour chaque élément de bâtiment
        Object.values(BUILDINGS).forEach(building => {
            const item = container.querySelector(`[data-building-id="${building.id}"]`);
            if (!item) return;

            const tier = building.tier || 1;
            const unlockInfo = this.getTierUnlockInfo(tier);
            const canBuild = this.game.canBuild(building.id);
            const count = this.game.getBuildingCount(building.id);
            const maxReached = count >= building.maxCount;

            // Vérifier les constructions en cours
            const constructions = this.game.state.constructions.filter(c => c.buildingId === building.id);
            const isBuilding = constructions.length > 0;
            const pendingCount = constructions.length;

            // Max atteint avec les constructions en cours
            const totalWithPending = count + pendingCount;
            const maxReachedWithPending = totalWithPending >= building.maxCount;

            // Cacher si max définitivement atteint (pas de construction en cours)
            const shouldHide = maxReached && !isBuilding;
            item.style.display = shouldHide ? 'none' : '';

            // Compter les bâtiments visibles par tier
            if (!shouldHide) {
                visibleByTier[tier]++;
            }

            // Mettre à jour les classes CSS
            item.classList.toggle('disabled', !unlockInfo.unlocked || !canBuild || maxReached);
            item.classList.toggle('tier-locked', !unlockInfo.unlocked);
            item.classList.toggle('building', isBuilding);
            // Contour vert si max atteint avec constructions en cours (attente)
            item.classList.toggle('building-max', maxReachedWithPending && isBuilding && !maxReached);

            // Mettre à jour le compteur (construits + en cours)
            const countDisplay = item.querySelector('.count-display');
            if (countDisplay) {
                if (pendingCount > 0) {
                    // Format: "3+2" (3 construits, 2 en construction)
                    countDisplay.innerHTML = `<span class="count-built">${count}</span><span class="count-pending">+${pendingCount}</span>`;
                } else {
                    countDisplay.innerHTML = `<span class="count-built">${count}</span>`;
                }
            }

            // Mettre à jour le temps/progression de construction
            const timeDiv = item.querySelector('.building-time');
            if (timeDiv) {
                if (isBuilding) {
                    // Afficher la barre de progression
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

            // Mettre à jour les coûts (avec scaling logarithmique)
            const costsDiv = item.querySelector('.building-cost');
            if (costsDiv) {
                // Obtenir les coûts scalés depuis le jeu
                const scaledCost = this.game.getScaledBuildingCost(building.id);

                const costs = [];
                // Or (pas de scaling, reste fixe)
                if (scaledCost.money) {
                    const hasEnough = this.game.state.money >= scaledCost.money;
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">💰${scaledCost.money}</span>`);
                }
                // Bois (avec indicateur d'augmentation si scalé)
                if (scaledCost.wood) {
                    const hasEnough = this.game.state.resources.wood >= scaledCost.wood;
                    const suffix = scaledCost.wood > building.cost.wood ? ' ↑' : '';
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🪵${scaledCost.wood}${suffix}</span>`);
                }
                // Pierre
                if (scaledCost.stone) {
                    const hasEnough = this.game.state.resources.stone >= scaledCost.stone;
                    const suffix = scaledCost.stone > building.cost.stone ? ' ↑' : '';
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🪨${scaledCost.stone}${suffix}</span>`);
                }
                // Sable
                if (scaledCost.sand) {
                    const hasEnough = this.game.state.resources.sand >= scaledCost.sand;
                    const suffix = scaledCost.sand > building.cost.sand ? ' ↑' : '';
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🏜️${scaledCost.sand}${suffix}</span>`);
                }
                // Terre
                if (scaledCost.dirt) {
                    const hasEnough = this.game.state.resources.dirt >= scaledCost.dirt;
                    const suffix = scaledCost.dirt > building.cost.dirt ? ' ↑' : '';
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🟤${scaledCost.dirt}${suffix}</span>`);
                }
                // Argile
                if (scaledCost.clay) {
                    const hasEnough = this.game.state.resources.clay >= scaledCost.clay;
                    const suffix = scaledCost.clay > building.cost.clay ? ' ↑' : '';
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">🧱${scaledCost.clay}${suffix}</span>`);
                }
                // Eau
                if (scaledCost.water) {
                    const hasEnough = this.game.state.water >= scaledCost.water;
                    const suffix = scaledCost.water > building.cost.water ? ' ↑' : '';
                    costs.push(`<span class="${hasEnough ? '' : 'insufficient'}">💧${scaledCost.water}${suffix}</span>`);
                }
                costsDiv.innerHTML = costs.join(' ');
            }

            // Mettre à jour l'indicateur de maximum atteint
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

            if (tierHeader && tierContainer) {
                // Afficher si verrouillé (pour voir le timer) ou s'il y a des bâtiments visibles
                const shouldShow = !unlockInfo.unlocked || visibleByTier[tier] > 0;
                tierHeader.style.display = shouldShow ? '' : 'none';
                tierContainer.style.display = shouldShow ? '' : 'none';
            }
        });
    }

    /**
     * Initialise la structure DOM de la liste des tâches
     * Crée les tâches statiques (nourrir, messages) et la zone pour les tâches en cours
     */
    initTasksList() {
        const container = document.getElementById('tasksList');
        if (!container) return;

        // Définition des tâches statiques (toujours affichées en haut)
        const staticTasks = [
            {
                id: 'feed',
                name: 'Nourrir les paysans',
                desc: 'Distribuer nourriture et eau aux paysans',
                cost: 'Auto (consommation)',
                action: null, // Pas d'action manuelle, consommation automatique
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

        // Créer les éléments pour chaque tâche statique
        staticTasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'task-item static-task';
            item.dataset.taskId = task.id;
            item.innerHTML = `
                <div class="task-name">${task.name}</div>
                <div class="task-desc">${task.desc}</div>
                <div class="task-cost">${task.cost}</div>
                <div class="task-locked" style="display: none;">🔒 Nécessite une volière</div>
            `;

            // Attacher l'événement click si la tâche a une action
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

        // Zone pour les tâches en cours (constructions, collectes)
        const inProgressSection = document.createElement('div');
        inProgressSection.id = 'tasksInProgress';
        container.appendChild(inProgressSection);
    }

    /**
     * Met à jour la liste des tâches
     * Rafraîchit les états des tâches statiques et affiche les tâches en cours
     */
    updateTasksList() {
        const container = document.getElementById('tasksList');
        if (!container) return;

        // Initialiser si nécessaire
        if (!container.querySelector('[data-task-id]')) {
            this.initTasksList();
        }

        // Mettre à jour la zone des tâches en cours (constructions, collectes)
        const inProgressSection = document.getElementById('tasksInProgress');
        if (inProgressSection) {
            let html = '';

            // Afficher les constructions en cours
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

            // Afficher les collectes en cours
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

        // Mettre à jour l'état de la tâche "Envoyer un message"
        const sendMessageItem = container.querySelector('[data-task-id="sendMessage"]');
        if (sendMessageItem) {
            const hasAviary = this.game.hasBuilding('aviary');
            const hasMessageTask = this.game.hasActiveMessageTask();
            const hasBirds = this.game.state.birds >= 1;
            const messageCost = this.game.getMessageCost();
            const hasEnoughMoney = this.game.state.money >= messageCost;

            // Conditions pour activer: volière + mission active + oiseaux + argent
            const isDisabled = !hasAviary || !hasMessageTask || !hasBirds || !hasEnoughMoney;

            sendMessageItem.classList.toggle('disabled', isDisabled);
            sendMessageItem.classList.toggle('clickable', !isDisabled);

            // Mettre à jour la description selon l'état
            const descDiv = sendMessageItem.querySelector('.task-desc');
            if (descDiv) {
                if (!hasAviary) {
                    descDiv.textContent = '🔒 Nécessite une volière';
                } else if (!hasMessageTask) {
                    descDiv.textContent = '⏳ En attente d\'une mission de message';
                } else if (!hasBirds) {
                    descDiv.textContent = `🕊️ Aucun oiseau (${Math.floor(this.game.state.birds)}/${this.game.getBuildingCount('aviary') * 5})`;
                } else {
                    descDiv.textContent = `🕊️ ${Math.floor(this.game.state.birds)} oiseau(x) disponible(s)`;
                }
            }

            // Mettre à jour le coût affiché
            const costDiv = sendMessageItem.querySelector('.task-cost');
            if (costDiv) {
                if (hasAviary) {
                    const costClass = hasEnoughMoney ? '' : 'insufficient';
                    costDiv.innerHTML = `<span class="${costClass}">💰${messageCost}</span> 🕊️1`;
                } else {
                    costDiv.textContent = '💰??';
                }
            }

            // Afficher/masquer l'indicateur de verrouillage
            const lockedDiv = sendMessageItem.querySelector('.task-locked');
            if (lockedDiv) {
                lockedDiv.style.display = !hasAviary ? 'block' : 'none';
            }
        }
    }

    /**
     * Met à jour la barre de ressources en bas de l'écran
     * Affiche le stock, le coût de collecte et la progression des collectes en cours
     */
    updateResourcesBar() {
        const state = this.game.state;
        const container = document.getElementById('resourcesBarList');
        if (!container) return;

        // Mettre à jour chaque ressource
        Object.values(RESOURCES).forEach(resource => {
            const item = container.querySelector(`[data-resource="${resource.id}"]`);
            if (!item) return;

            const workerCount = this.getActualWorkerCount(resource);
            const canGather = workerCount > 0;
            const totalCost = workerCount * resource.gatherCost;
            const totalGather = workerCount * resource.gatherAmount;

            // Vérifier les collectes en cours pour cette ressource
            const gatherings = state.gatheringTasks.filter(t => t.resourceId === resource.id);
            const isGathering = gatherings.length > 0;

            // Mettre à jour les classes CSS
            item.classList.toggle('disabled', !canGather);
            item.classList.toggle('gathering', isGathering);

            // Mettre à jour le stock affiché
            const stockEl = item.querySelector(`#${resource.id}StockBar`);
            if (stockEl) {
                stockEl.textContent = Math.floor(state.resources[resource.id]);
            }

            // Mettre à jour le rendement affiché
            const yieldEl = item.querySelector('.resource-bar-yield');
            if (yieldEl) {
                if (workerCount > 1) {
                    yieldEl.textContent = `+${totalGather} (x${workerCount})`;
                } else {
                    yieldEl.textContent = `+${resource.gatherAmount}`;
                }
            }

            // Mettre à jour le coût du bouton de collecte
            const costEl = item.querySelector('.gather-btn-cost');
            if (costEl) {
                const displayCost = workerCount > 0 ? totalCost : resource.gatherCost;
                costEl.textContent = `💰${displayCost}`;
                costEl.classList.toggle('insufficient', state.money < displayCost);
            }

            // Mettre à jour la barre de progression de collecte
            const progressContainer = item.querySelector('.resource-bar-progress');
            if (progressContainer) {
                if (isGathering) {
                    progressContainer.classList.remove('hidden');
                    const task = gatherings[0];
                    const progress = (task.elapsed / task.totalTime) * 100;
                    const progressFill = progressContainer.querySelector('.progress-fill');
                    const progressText = progressContainer.querySelector('.progress-text');
                    if (progressFill) {
                        progressFill.style.width = `${progress}%`;
                    }
                    if (progressText) {
                        const remaining = task.totalTime - task.elapsed;
                        const suffix = gatherings.length > 1 ? ` +${gatherings.length - 1}` : '';
                        progressText.textContent = `${Math.floor(progress)}% - ${formatTime(remaining)}${suffix}`;
                    }
                } else {
                    progressContainer.classList.add('hidden');
                }
            }
        });

        // Affichage spécial pour les oiseaux (pas de bouton de collecte)
        const birdsItem = container.querySelector('[data-resource="birds"]');
        if (birdsItem) {
            const aviaries = this.game.getBuildingCount('aviary');
            const maxBirds = aviaries * 5; // 5 oiseaux par volière
            const birdsStockEl = birdsItem.querySelector('#birdsStockBar');
            if (birdsStockEl) {
                birdsStockEl.textContent = `${Math.floor(state.birds)}/${maxBirds}`;
            }

            // Masquer si aucune volière construite
            birdsItem.style.display = aviaries > 0 ? '' : 'none';
        }
    }

    /**
     * Met à jour l'affichage des statistiques de production
     * Affiche les taux de production/consommation, alertes et production théorique
     */
    updateStatsDisplay() {
        const stats = this.game.statistics;
        if (!stats) return;

        const productionContainer = document.getElementById('statsProduction');
        const alertsContainer = document.getElementById('statsAlerts');
        const theoreticalContainer = document.getElementById('statsTheoretical');

        // Section production: afficher chaque ressource avec son taux
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

                // Couleur selon le taux: vert si positif, rouge si négatif, gris si nul
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

        // Section alertes: afficher les ressources en danger
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

        // Section production théorique: afficher les productions automatiques des bâtiments
        if (theoreticalContainer) {
            const theoretical = stats.getTheoreticalProduction();
            const items = [
                { icon: '🍞', name: 'Nourriture', value: theoretical.food },
                { icon: '💧', name: 'Eau', value: theoretical.water },
                { icon: '💰', name: 'Or', value: theoretical.money },
                { icon: '🪵', name: 'Bois', value: theoretical.wood },
                { icon: '🪨', name: 'Pierre', value: theoretical.stone }
            ].filter(i => i.value !== 0); // Ne montrer que les non-nuls

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

}

export default PanelManager;
