// ==========================================
// SCENARIO SYSTEM
// ==========================================
// Gère le cycle de vie des scénarios et les étapes du tutoriel.
// Affiche les overlays, highlights et panneaux d'instructions.
// ==========================================

import SCENARIOS, { STEP_TYPES } from '../data/scenarios/index.js';

/**
 * Système de gestion des scénarios
 * Gère les étapes scriptées, les conditions de victoire/défaite,
 * et l'interface utilisateur du tutoriel (overlays, highlights)
 */
class ScenarioSystem {
    /**
     * @param {object} game - Référence au jeu principal
     */
    constructor(game) {
        /** @type {object} Référence au jeu */
        this.game = game;

        /** @type {object|null} Scénario actuellement chargé */
        this.currentScenario = null;

        /** @type {number} Index de l'étape actuelle (0-based) */
        this.currentStepIndex = -1;

        /** @type {boolean} Scénario actif (démarré et non terminé) */
        this.isActive = false;

        /** @type {boolean} Scénario terminé */
        this.isComplete = false;

        /** @type {boolean} Victoire ou défaite */
        this.victory = false;

        // Éléments DOM
        this.overlayElement = null;
        this.backdropElement = null;
        this.panelElement = null;
        this.highlightEl = null;
        this.arrowElement = null;

        // Binding pour les callbacks
        this.handlePanelButtonClick = this.handlePanelButtonClick.bind(this);
        this.handleGlobalClick = this.handleGlobalClick.bind(this);

        // Créer les éléments DOM
        this.createDOMElements();

        // Flag pour savoir si le blocage est actif
        this._blockingActive = false;

        // Flag pour savoir si la cible a déjà été cliquée (empêche les clics multiples)
        this._targetClicked = false;

        // Référence à la tâche contrôlée par le scénario (pour manipulation de timer)
        this._scenarioTask = null;

        // Animation de timer en cours
        this._timerAnimationId = null;
    }

    // ==========================================
    // LIFECYCLE
    // ==========================================

    /**
     * Charge un scénario par son ID
     * @param {string} scenarioId - ID du scénario à charger
     * @returns {boolean} True si le chargement a réussi
     */
    loadScenario(scenarioId) {
        const scenario = SCENARIOS[scenarioId];
        if (!scenario) {
            console.error(`ScenarioSystem: Scénario '${scenarioId}' non trouvé`);
            return false;
        }

        // Réinitialiser l'état des pauses avant de charger un nouveau scénario
        this.resumeAll();

        this.currentScenario = scenario;
        this.currentStepIndex = -1;
        this.isActive = false;
        this.isComplete = false;
        this.victory = false;

        // Charger la config dans GameConfig
        this.game.config.loadScenario(scenario);

        console.log(`ScenarioSystem: Scénario '${scenarioId}' chargé`);
        return true;
    }

    /**
     * Démarre le scénario (après le démarrage du jeu)
     */
    start() {
        if (!this.currentScenario) {
            console.warn('ScenarioSystem: Aucun scénario chargé');
            return;
        }

        this.isActive = true;

        // Appliquer les pauses de systèmes définies dans la config du scénario
        if (this.currentScenario.config?.pauseSystems) {
            this.currentScenario.config.pauseSystems.forEach(system => {
                this.setPaused(true, system);
            });
        }

        // Si le scénario a des étapes, commencer la première
        if (this.currentScenario.steps && this.currentScenario.steps.length > 0) {
            this.nextStep();
        }

        console.log('ScenarioSystem: Scénario démarré');
    }

    /**
     * Réinitialise complètement le système de scénario
     */
    reset() {
        this.currentScenario = null;
        this.currentStepIndex = -1;
        this.isActive = false;
        this.isComplete = false;
        this.victory = false;
        this._messageCountAtStepStart = 0;
        this._currentTargetSelector = null;
        this._targetClicked = false;

        // Réinitialiser l'état des pauses
        this.resumeAll();

        // Cacher l'overlay et désactiver le blocage
        this.hideOverlay();

        console.log('ScenarioSystem: Reset effectué');
    }

    /**
     * Met à jour le système (appelé chaque frame)
     */
    update() {
        if (!this.isActive || this.isComplete) return;

        // Vérifier les conditions de l'étape actuelle
        this.checkStepCompletion();

        // Vérifier les conditions de victoire/défaite
        this.checkVictory();
        this.checkDefeat();

        // Mettre à jour la position du highlight si nécessaire
        this.updateHighlightPosition();
    }

    /**
     * Termine le scénario
     * @param {boolean} success - True si victoire, false si défaite
     */
    end(success) {
        this.isActive = false;
        this.isComplete = true;
        this.victory = success;

        this.hideOverlay();

        console.log(`ScenarioSystem: Scénario terminé - ${success ? 'Victoire' : 'Défaite'}`);

        // Notifier le jeu
        if (success) {
            this.game.onScenarioVictory?.();
        } else {
            this.game.onScenarioDefeat?.();
        }
    }

    // ==========================================
    // GESTION DES ÉTAPES
    // ==========================================

    /**
     * Passe à l'étape suivante
     */
    nextStep() {
        if (!this.currentScenario?.steps) return;

        // Restaurer le scroll si bloqué à l'étape précédente
        this.unblockContainerScroll();

        // Annuler les timeouts en cours de l'étape précédente
        this.clearPendingActions();

        this.currentStepIndex++;

        // Vérifier si on a terminé toutes les étapes
        if (this.currentStepIndex >= this.currentScenario.steps.length) {
            console.log('ScenarioSystem: Toutes les étapes terminées');
            // Le scénario continue en mode libre jusqu'à la condition de victoire
            this.hideOverlay();
            return;
        }

        const step = this.getCurrentStep();
        if (!step) return;

        console.log(`ScenarioSystem: Étape ${this.currentStepIndex + 1}/${this.currentScenario.steps.length} - ${step.id}`);

        // Appliquer les déblocages de bâtiments
        if (step.unlockBuildings) {
            this.game.config.setUnlockedBuildings([...step.unlockBuildings]);
            this.game.panels?.refreshBuildingsPanel?.();
        }

        // Exécuter les actions onBeforeStart (avant l'affichage de l'UI)
        if (step.onBeforeStart) {
            this.executeStepActions(step.onBeforeStart);
        }

        // Afficher l'interface de l'étape
        this.showStepUI(step);

        // Exécuter les actions onStart (après l'affichage de l'UI)
        if (step.onStart) {
            this.executeStepActions(step.onStart);
        }
    }

    /**
     * Exécute les actions d'une étape (onStart ou onEnd)
     * Chaque action peut avoir un délai optionnel via la propriété 'delay' (en ms)
     * @param {object} actions - Objet contenant les actions à exécuter
     */
    executeStepActions(actions) {
        if (!actions) return;

        const defaultDelay = actions.delay || 0;

        // Reprendre des systèmes
        if (actions.resumeSystems) {
            const delay = actions.resumeSystemsDelay ?? defaultDelay;
            this.executeWithDelay(() => {
                actions.resumeSystems.forEach(system => {
                    this.setPaused(false, system);
                });
            }, delay);
        }

        // Mettre en pause des systèmes
        if (actions.pauseSystems) {
            const delay = actions.pauseSystemsDelay ?? defaultDelay;
            this.executeWithDelay(() => {
                actions.pauseSystems.forEach(system => {
                    this.setPaused(true, system);
                });
            }, delay);
        }

        // Mettre en pause TOUS les systèmes
        if (actions.pauseAll) {
            const delay = actions.pauseAllDelay ?? defaultDelay;
            this.executeWithDelay(() => {
                this.pauseAll();
            }, delay);
        }

        // Reprendre TOUS les systèmes
        if (actions.resumeAll) {
            const delay = actions.resumeAllDelay ?? defaultDelay;
            this.executeWithDelay(() => {
                this.resumeAll();
            }, delay);
        }

        // Donner un bonus
        if (actions.bonus) {
            const delay = actions.bonusDelay ?? defaultDelay;
            this.executeWithDelay(() => {
                this.giveBonus(actions.bonus);
            }, delay);
        }

        // Créer une tâche forcée
        if (actions.task) {
            const delay = actions.taskDelay ?? defaultDelay;
            this.executeWithDelay(() => {
                this.createForcedTask(actions.task);
            }, delay);
        }

        // Modifier le temps des constructions en cours
        if (actions.modifyConstructionTime !== undefined) {
            const delay = actions.modifyConstructionTimeDelay ?? 2000;

            if (this._constructionTimeReductionTimeout) {
                clearTimeout(this._constructionTimeReductionTimeout);
            }

            this._constructionTimeReductionTimeout = setTimeout(() => {
                const constructions = this.game.state?.constructions || [];
                constructions.forEach(c => {
                    const originalTime = c.totalTime;
                    const newTime = Math.max(c.elapsed + 1, actions.modifyConstructionTime);
                    const reduction = originalTime - newTime;
                    if (reduction > 0) {
                        this._constructionTimeReduction = reduction;
                    }
                    c.totalTime = newTime;
                });
            }, delay);
        }

        // Modifier le temps de production d'oiseaux
        if (actions.modifyBirdProductionTime !== undefined) {
            const delay = actions.modifyBirdProductionTimeDelay ?? defaultDelay;
            this.executeWithDelay(() => {
                this.modifyBirdProductionTime(actions.modifyBirdProductionTime);
            }, delay);
        }

        // Accélérer la production d'oiseaux
        if (actions.accelerateBirdProduction !== undefined) {
            const delay = actions.accelerateBirdProductionDelay ?? defaultDelay;
            this.executeWithDelay(() => {
                this.accelerateBirdProduction(actions.accelerateBirdProduction);
            }, delay);
        }

        // Geler le timer de la tâche contrôlée par le scénario
        if (actions.freezeTaskTimer) {
            const delay = actions.freezeTaskTimerDelay ?? defaultDelay;
            this.executeWithDelay(() => {
                this.freezeScenarioTask();
            }, delay);
        }

        // Dégeler le timer de la tâche contrôlée par le scénario
        if (actions.unfreezeTaskTimer) {
            const delay = actions.unfreezeTaskTimerDelay ?? defaultDelay;
            this.executeWithDelay(() => {
                this.unfreezeScenarioTask();
            }, delay);
        }

        // Modifier le temps restant de la tâche (valeur absolue) avec animation
        if (actions.setTaskTime !== undefined) {
            const delay = actions.setTaskTimeDelay ?? defaultDelay;
            const duration = actions.setTaskTimeDuration ?? 1000;
            this.executeWithDelay(() => {
                this.animateScenarioTaskTime(actions.setTaskTime, duration);
            }, delay);
        }

        // Ajouter du temps à la tâche avec animation
        if (actions.addTaskTime !== undefined) {
            const delay = actions.addTaskTimeDelay ?? defaultDelay;
            const duration = actions.addTaskTimeDuration ?? 1000;
            this.executeWithDelay(() => {
                const task = this._scenarioTask;
                if (task) {
                    const targetTime = task.timeRemaining + actions.addTaskTime;
                    this.animateScenarioTaskTime(targetTime, duration);
                }
            }, delay);
        }

        // Retirer du temps à la tâche avec animation
        if (actions.subtractTaskTime !== undefined) {
            const delay = actions.subtractTaskTimeDelay ?? defaultDelay;
            const duration = actions.subtractTaskTimeDuration ?? 1000;
            this.executeWithDelay(() => {
                const task = this._scenarioTask;
                if (task) {
                    const targetTime = Math.max(0, task.timeRemaining - actions.subtractTaskTime);
                    this.animateScenarioTaskTime(targetTime, duration);
                }
            }, delay);
        }

        // Forcer l'ajout de plusieurs tâches aléatoires
        if (actions.forceTasks !== undefined) {
            const delay = actions.forceTasksDelay ?? defaultDelay;
            const count = actions.forceTasks;
            this.executeWithDelay(() => {
                if (this.game.cleopatra) {
                    for (let i = 0; i < count; i++) {
                        this.game.cleopatra.forceNewTask();
                    }
                    // Forcer la mise à jour de l'affichage des tâches
                    this.game.cleopatra.updateTasksDisplay?.();
                }
            }, delay);
        }

        // Modifier la config du jeu dynamiquement
        if (actions.setConfig) {
            const delay = actions.setConfigDelay ?? defaultDelay;
            this.executeWithDelay(() => {
                if (this.game.config) {
                    Object.entries(actions.setConfig).forEach(([key, value]) => {
                        if (key in this.game.config.config) {
                            this.game.config.config[key] = value;
                        }
                    });
                }
            }, delay);
        }
    }

    /**
     * Exécute une fonction avec un délai optionnel
     * @param {Function} fn - Fonction à exécuter
     * @param {number} delay - Délai en millisecondes (0 = immédiat)
     */
    executeWithDelay(fn, delay) {
        if (delay > 0) {
            setTimeout(fn, delay);
        } else {
            fn();
        }
    }

    /**
     * Annule tous les timeouts et réinitialise les états temporaires
     */
    clearPendingActions() {
        this._constructionTimeReduction = null;
        if (this._constructionTimeReductionTimeout) {
            clearTimeout(this._constructionTimeReductionTimeout);
            this._constructionTimeReductionTimeout = null;
        }

        // Annuler l'animation du timer de tâche
        this.cancelTimerAnimation();
    }

    /**
     * Accélère la production d'oiseaux jusqu'à ce qu'un oiseau soit produit
     * @param {number} percentage - Pourcentage de la progression vers le prochain oiseau (0-100)
     */
    accelerateBirdProduction(percentage) {
        const state = this.game.state;
        if (!state) return;

        const aviaries = state.buildings['aviary'] || 0;
        if (aviaries <= 0) return;

        const currentBirds = Math.floor(state.birds);
        const targetProgress = currentBirds + (percentage / 100);
        state.birds = Math.min(targetProgress, aviaries);
    }

    /**
     * Modifie le temps de production d'oiseaux pour qu'un oiseau soit prêt dans X secondes
     * @param {number} targetSeconds - Temps en secondes avant le prochain oiseau
     */
    modifyBirdProductionTime(targetSeconds) {
        const state = this.game.state;
        if (!state) return;

        const aviaries = state.buildings['aviary'] || 0;
        if (aviaries <= 0) return;

        const currentBirds = Math.floor(state.birds);
        const productionTimePerBird = 180;
        const progressNeeded = 1 - (state.birds - currentBirds);
        const secondsToComplete = progressNeeded * productionTimePerBird;

        if (secondsToComplete > targetSeconds) {
            const progressToAdd = (secondsToComplete - targetSeconds) / productionTimePerBird;
            state.birds = Math.min(state.birds + progressToAdd, aviaries);
        }
    }

    // ==========================================
    // MANIPULATION DES TIMERS DE TÂCHES
    // ==========================================

    /**
     * Gèle le timer de la tâche contrôlée par le scénario
     */
    freezeScenarioTask() {
        const task = this._scenarioTask;
        if (!task) return;
        task.freezeTimer = true;
    }

    /**
     * Dégèle le timer de la tâche contrôlée par le scénario
     */
    unfreezeScenarioTask() {
        const task = this._scenarioTask;
        if (!task) return;
        task.freezeTimer = false;
        task.startTime = Date.now() - (task.timeLimit - task.timeRemaining) * 1000;
    }

    /**
     * Anime le timer de la tâche vers une valeur cible
     * @param {number} targetTime - Temps cible en secondes
     * @param {number} duration - Durée de l'animation en ms
     */
    animateScenarioTaskTime(targetTime, duration = 1000) {
        const task = this._scenarioTask;
        if (!task) return;

        this.cancelTimerAnimation();

        const startTime = task.timeRemaining;
        const startTimestamp = performance.now();
        const difference = targetTime - startTime;

        const wasFrozen = task.freezeTimer;
        task.freezeTimer = true;

        const animate = (currentTimestamp) => {
            const elapsed = currentTimestamp - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            task.timeRemaining = startTime + (difference * eased);

            if (progress < 1) {
                this._timerAnimationId = requestAnimationFrame(animate);
            } else {
                task.timeRemaining = targetTime;
                task.timeLimit = targetTime;
                this._timerAnimationId = null;

                if (!wasFrozen) {
                    task.freezeTimer = false;
                    task.startTime = Date.now();
                }
            }
        };

        this._timerAnimationId = requestAnimationFrame(animate);
    }

    /**
     * Annule l'animation de timer en cours
     */
    cancelTimerAnimation() {
        if (this._timerAnimationId) {
            cancelAnimationFrame(this._timerAnimationId);
            this._timerAnimationId = null;
        }
    }

    /**
     * Crée une tâche forcée avec timer contrôlé par le scénario
     * @param {object} taskConfig - Configuration de la tâche
     * @param {string} taskConfig.taskId - ID de la tâche à forcer
     * @param {boolean} [taskConfig.freezeTimer] - Si true, le timer ne décompte pas
     * @param {number} [taskConfig.initialTime] - Temps initial du timer (optionnel)
     */
    createForcedTask(taskConfig) {
        if (!this.game.cleopatra) return;

        const success = this.game.cleopatra.assignSpecificTask(taskConfig.taskId);
        if (!success) {
            console.warn(`ScenarioSystem: Impossible de créer la tâche forcée '${taskConfig.taskId}'`);
            return;
        }

        const task = this.game.cleopatra.activeTasks[this.game.cleopatra.activeTasks.length - 1];
        if (!task) return;

        task.isScenarioTask = true;

        if (taskConfig.initialTime !== undefined) {
            task.timeRemaining = taskConfig.initialTime;
            task.timeLimit = taskConfig.initialTime;
            task.startTime = Date.now();
        }

        this._scenarioTask = task;

        if (taskConfig.freezeTimer) {
            this.freezeScenarioTask();
        }

        this.game.cleopatra.updateTasksDisplay?.();
    }

    /**
     * Récupère l'étape actuelle
     * @returns {object|null} L'étape actuelle ou null
     */
    getCurrentStep() {
        if (!this.currentScenario?.steps) return null;
        if (this.currentStepIndex < 0 || this.currentStepIndex >= this.currentScenario.steps.length) return null;
        return this.currentScenario.steps[this.currentStepIndex];
    }

    /**
     * Vérifie si l'étape actuelle est terminée
     */
    checkStepCompletion() {
        const step = this.getCurrentStep();
        if (!step) return;

        // Les étapes INTRO et EXPLAIN sont terminées par le bouton
        if (step.type === STEP_TYPES.INTRO || step.type === STEP_TYPES.EXPLAIN) {
            return;
        }

        // Vérifier la condition
        if (step.condition && this.checkCondition(step.condition)) {
            this.onStepComplete(step);
        }
    }

    /**
     * Appelé quand une étape est terminée
     * @param {object} step - L'étape terminée
     */
    onStepComplete(step) {
        console.log(`ScenarioSystem: Étape '${step.id}' terminée`);

        // Exécuter les actions onEnd
        if (step.onEnd) {
            this.executeStepActions(step.onEnd);
        }

        // Passer à l'étape suivante (sauf pour FREE qui attend la victoire)
        if (step.type !== STEP_TYPES.FREE) {
            this.nextStep();
        } else {
            // Mode libre terminé = victoire
            this.end(true);
        }
    }

    /**
     * Vérifie une condition
     * @param {object} condition - La condition à vérifier
     * @returns {boolean} True si la condition est remplie
     */
    checkCondition(condition) {
        const state = this.game.state;

        switch (condition.type) {
            case 'building_count': {
                // Compte les bâtiments terminés + en construction
                const builtCount = state.buildings[condition.building] || 0;
                const constructions = state.constructions || [];
                const inConstructionCount = constructions.filter(c => c.buildingId === condition.building).length;
                return (builtCount + inConstructionCount) >= condition.count;
            }

            case 'construction_started': {
                // Vérifie si une construction est en cours pour un bâtiment spécifique
                const constructions = state.constructions || [];
                if (condition.building) {
                    return constructions.some(c => c.buildingId === condition.building);
                }
                return constructions.length > 0;
            }

            case 'constructions_started': {
                // Vérifie si plusieurs bâtiments sont en construction ou ont été construits
                // condition.buildings: ['well', 'field'] - tous doivent être en cours ou construits
                if (!condition.buildings || !Array.isArray(condition.buildings)) return false;
                const constructions = state.constructions || [];
                const buildingCounts = state.buildingCounts || {};

                return condition.buildings.every(buildingId => {
                    const inConstruction = constructions.some(c => c.buildingId === buildingId);
                    const alreadyBuilt = (buildingCounts[buildingId] || 0) > 0;
                    return inConstruction || alreadyBuilt;
                });
            }

            case 'no_construction': {
                return !state.constructions || state.constructions.length === 0;
            }

            case 'gathering_active': {
                const tasks = state.gatheringTasks || [];
                if (condition.resource) {
                    return tasks.some(t => t.resourceId === condition.resource);
                }
                return tasks.length > 0;
            }

            case 'multiplier_set': {
                return this.game.panels?.gatherMultiplier === condition.value;
            }

            case 'message_sent': {
                // On vérifie si un message a été envoyé depuis le début de l'étape
                return state.messagesSentToCaesar > (this._messageCountAtStepStart || 0);
            }

            case 'population': {
                return state.population >= condition.count;
            }

            case 'resource': {
                const amount = state.resources[condition.resource] || 0;
                return amount >= condition.count;
            }

            case 'money': {
                return state.money >= condition.count;
            }

            case 'birds_available': {
                return Math.floor(state.birds || 0) >= condition.count;
            }

            case 'task_timer_low': {
                const task = this._scenarioTask;
                if (!task) return false;
                return task.timeRemaining <= condition.seconds;
            }

            default:
                console.warn(`ScenarioSystem: Type de condition inconnu '${condition.type}'`);
                return false;
        }
    }

    // ==========================================
    // SYSTÈME DE BONUS
    // ==========================================

    /**
     * Donne un bonus au joueur
     * @param {object} bonus - Le bonus à donner
     */
    giveBonus(bonus) {
        const state = this.game.state;
        const notifications = [];

        if (bonus.money) {
            state.money += bonus.money;
            notifications.push(`+${bonus.money} 💰`);
        }

        if (bonus.wood) {
            state.resources.wood += bonus.wood;
            notifications.push(`+${bonus.wood} 🪵`);
        }

        if (bonus.stone) {
            state.resources.stone += bonus.stone;
            notifications.push(`+${bonus.stone} 🪨`);
        }

        if (bonus.dirt) {
            state.resources.dirt += bonus.dirt;
            notifications.push(`+${bonus.dirt} 🟤`);
        }

        if (bonus.clay) {
            state.resources.clay += bonus.clay;
            notifications.push(`+${bonus.clay} 🧱`);
        }

        if (bonus.sand) {
            state.resources.sand += bonus.sand;
            notifications.push(`+${bonus.sand} 🏖️`);
        }

        if (bonus.food) {
            state.consumables.food += bonus.food;
            notifications.push(`+${bonus.food} 🍖`);
        }

        if (bonus.water) {
            state.consumables.water += bonus.water;
            notifications.push(`+${bonus.water} 💧`);
        }

        if (bonus.birds) {
            state.birds += bonus.birds;
            notifications.push(`+${bonus.birds} 🕊️`);
        }

        if (bonus.peasants) {
            state.peasants += bonus.peasants;
            notifications.push(`+${bonus.peasants} 👷`);
        }

        // Afficher une notification
        if (notifications.length > 0) {
            this.game.notifications?.success(`Bonus: ${notifications.join(' ')}`);
        }
    }

    // ==========================================
    // CONDITIONS DE FIN
    // ==========================================

    /**
     * Vérifie la condition de victoire
     * Supporte des conditions complexes avec $and/$or
     *
     * Formats supportés:
     * - Simple: { population: 10000 }
     * - Multiple (ET implicite): { population: 10000, money: 5000 }
     * - ET explicite: { $and: [{ population: 10000 }, { money: 5000 }] }
     * - OU: { $or: [{ population: 10000 }, { money: 5000 }] }
     * - Combiné: { $and: [{ population: 5000 }, { $or: [{ money: 10000 }, { birds: 20 }] }] }
     */
    checkVictory() {
        const victory = this.game.config.victory;
        if (!victory) return;

        if (this.evaluateConditions(victory, 'victory')) {
            this.end(true);
        }
    }

    /**
     * Évalue un groupe de conditions récursivement
     * @param {object} conditions - Conditions à évaluer
     * @param {string} type - 'victory' ou 'defeat'
     * @param {string} defaultOperator - Opérateur par défaut ('and' pour victoire, 'or' pour défaite)
     * @returns {boolean}
     */
    evaluateConditions(conditions, type, defaultOperator = null) {
        if (!conditions) return false;

        const state = this.game.state;
        const operator = defaultOperator || (type === 'victory' ? 'and' : 'or');

        // Collecter les résultats de chaque condition
        const results = [];

        for (const [key, value] of Object.entries(conditions)) {
            if (key === '$and') {
                // Groupe ET : toutes les sous-conditions doivent être vraies
                const subResults = value.map(sub => this.evaluateConditions(sub, type, 'and'));
                results.push(subResults.every(r => r));
            } else if (key === '$or') {
                // Groupe OU : au moins une sous-condition doit être vraie
                const subResults = value.map(sub => this.evaluateConditions(sub, type, 'or'));
                results.push(subResults.some(r => r));
            } else {
                // Condition simple
                const currentValue = this.getVictoryConditionValue(key, state);
                results.push(this.evaluateSimpleCondition(currentValue, value, type));
            }
        }

        // Appliquer l'opérateur par défaut au niveau racine
        if (operator === 'and') {
            return results.every(r => r);
        } else {
            return results.some(r => r);
        }
    }

    /**
     * Évalue une condition simple
     * @param {number} currentValue - Valeur actuelle
     * @param {number|object} condition - Condition (nombre ou {min, max})
     * @param {string} type - 'victory' ou 'defeat'
     * @returns {boolean}
     */
    evaluateSimpleCondition(currentValue, condition, type) {
        if (type === 'victory') {
            // Pour la victoire, on veut atteindre/dépasser la valeur
            if (typeof condition === 'number') {
                return currentValue >= condition;
            }
            if (typeof condition === 'object') {
                if (condition.min !== undefined && currentValue < condition.min) return false;
                if (condition.max !== undefined && currentValue > condition.max) return false;
                return true;
            }
        } else {
            // Pour la défaite, utiliser isDefeatConditionMet
            return this.isDefeatConditionMet(currentValue, condition);
        }
        return false;
    }

    /**
     * Récupère la valeur actuelle pour une condition de victoire
     * @param {string} key - Clé de la condition (population, money, birds, food, etc.)
     * @param {object} state - État du jeu
     * @returns {number}
     */
    getVictoryConditionValue(key, state) {
        // Valeurs directes sur state
        if (key === 'population') return state.population || 0;
        if (key === 'money') return state.money || 0;
        if (key === 'birds') return state.birds || 0;
        if (key === 'mood') return state.cleopatraMood || 0;
        if (key === 'peasants') return state.availablePeasants || 0;

        // Ressources
        if (state.resources && key in state.resources) {
            return state.resources[key] || 0;
        }

        // Consommables (food, water)
        if (state.consumables && key in state.consumables) {
            return state.consumables[key] || 0;
        }

        // Nombre de bâtiments (ex: victory.hut = 5 -> avoir 5 huttes)
        if (state.buildings && key in state.buildings) {
            return state.buildings[key] || 0;
        }

        return 0;
    }

    /**
     * Vérifie la condition de défaite
     * Supporte des conditions complexes avec $and/$or
     *
     * Format des conditions:
     * - Simple: { mood: 0 }                    -> défaite si mood <= 0
     * - Avec min/max: { money: { min: 100 } }  -> défaite si money < 100
     * - Multiple (OU implicite): { food: { min: 10 }, mood: 0 } -> défaite si food < 10 OU mood <= 0
     * - ET explicite: { $and: [{ mood: 0 }, { food: { min: 0 } }] } -> défaite si mood <= 0 ET food < 0
     * - OU explicite: { $or: [{ mood: 0 }, { food: { min: 10 } }] }
     * - Combiné: { $or: [{ mood: 0 }, { $and: [{ food: { min: 5 } }, { water: { min: 5 } }] }] }
     *
     * Note: Par défaut au niveau racine, UNE SEULE condition suffit (OU implicite)
     */
    checkDefeat() {
        // En mode tutoriel, pas de game over
        if (this.game.config.tutorialMode) return;

        const defeat = this.game.config.defeat;
        if (!defeat) return;

        if (this.evaluateConditions(defeat, 'defeat')) {
            this.end(false);
        }
    }

    /**
     * Vérifie si une condition de défaite est remplie
     * @param {number} currentValue - Valeur actuelle
     * @param {number|object} condition - Condition (nombre simple = max, ou {min, max})
     * @returns {boolean}
     */
    isDefeatConditionMet(currentValue, condition) {
        // Format simple: { mood: 0 } -> équivalent à { mood: { max: 0 } }
        if (typeof condition === 'number') {
            return currentValue <= condition;
        }

        // Format objet: { min: X } et/ou { max: X }
        if (typeof condition === 'object') {
            // min: défaite si valeur < min
            if (condition.min !== undefined && currentValue < condition.min) {
                return true;
            }
            // max: défaite si valeur > max
            if (condition.max !== undefined && currentValue > condition.max) {
                return true;
            }
        }

        return false;
    }

    // ==========================================
    // API DE CONTRÔLE DU JEU - SYSTÈME DE PAUSE
    // ==========================================

    /**
     * État des pauses par système
     * @private
     */
    _pauseState = {
        global: false,
        constructions: false,
        gathering: false,
        tasks: false,
        production: false,
        consumption: false,
        growth: false,
        tierTimer: false,
        messageTask: false
    };

    /**
     * Indique si le jeu est en pause globale (étapes INTRO/EXPLAIN ou pause manuelle)
     * @returns {boolean}
     */
    isPaused() {
        // Pause globale manuelle
        if (this._pauseState.global) return true;

        // Pause automatique pendant les étapes INTRO/EXPLAIN
        if (!this.isActive) return false;
        const step = this.getCurrentStep();
        if (!step) return false;
        return step.type === STEP_TYPES.INTRO || step.type === STEP_TYPES.EXPLAIN;
    }

    /**
     * Vérifie si un système spécifique est en pause
     * @param {string} system - Système à vérifier: 'constructions', 'gathering', 'tasks', 'production', 'consumption', 'growth', 'tierTimer', 'messageTask'
     * @returns {boolean}
     */
    isSystemPaused(system) {
        // La pause globale affecte tous les systèmes
        if (this.isPaused()) return true;

        // Pause spécifique au système
        return this._pauseState[system] || false;
    }

    /**
     * Met en pause globale ou un système spécifique
     * @param {boolean} paused - true pour mettre en pause, false pour reprendre
     * @param {string|null} system - Système à pauser (null = pause globale)
     *   Valeurs possibles: 'constructions', 'gathering', 'tasks', 'production', 'consumption', 'tierTimer'
     */
    setPaused(paused, system = null) {
        if (system === null) {
            this._pauseState.global = paused;
        } else if (system in this._pauseState) {
            this._pauseState[system] = paused;
        }
    }

    /**
     * Met en pause tous les systèmes
     */
    pauseAll() {
        Object.keys(this._pauseState).forEach(key => {
            this._pauseState[key] = true;
        });
    }

    /**
     * Reprend tous les systèmes
     */
    resumeAll() {
        Object.keys(this._pauseState).forEach(key => {
            this._pauseState[key] = false;
        });
    }

    /**
     * Récupère l'état de pause de tous les systèmes
     * @returns {object}
     */
    getPauseState() {
        return { ...this._pauseState };
    }

    // ==========================================
    // API DE CONTRÔLE DU JEU - TÂCHES & TIERS
    // ==========================================

    /**
     * Active ou désactive les tâches automatiques de Cléopâtre
     * @param {boolean} enabled - true pour activer, false pour désactiver
     */
    setAutoTasksEnabled(enabled) {
        if (this.game.config) {
            this.game.config.config.autoTasks = enabled;
        }
    }

    /**
     * Lance une tâche spécifique de Cléopâtre
     * @param {string} taskId - ID de la tâche à lancer
     */
    startTask(taskId) {
        if (this.game.cleopatra) {
            this.game.cleopatra.startSpecificTask(taskId);
        }
    }

    /**
     * Débloque un tier spécifique immédiatement
     * @param {number} tier - Numéro du tier à débloquer (1, 2, 3)
     */
    unlockTier(tier) {
        if (this.game.state) {
            this.game.state.currentTier = Math.max(this.game.state.currentTier || 1, tier);
            this.game.panels?.refreshBuildingsPanel?.();
        }
    }

    /**
     * Active ou désactive le timer de déblocage des tiers
     * @param {boolean} enabled - true pour activer, false pour désactiver
     */
    setTierTimerEnabled(enabled) {
        if (this.game.config) {
            this.game.config.config.tierTimerEnabled = enabled;
        }
    }

    /**
     * Modifie une ressource
     * @param {string} resourceId - ID de la ressource (money, wood, stone, food, water, etc.)
     * @param {number} value - Valeur à appliquer
     * @param {string} mode - 'set' pour valeur absolue, 'add' pour ajouter, 'sub' pour soustraire
     */
    modifyResource(resourceId, value, mode = 'add') {
        const state = this.game.state;
        if (!state) return;

        let current = 0;
        let target = null;
        let key = resourceId;

        // Trouver où est stockée la ressource
        if (resourceId === 'money') {
            current = state.money;
            target = state;
            key = 'money';
        } else if (resourceId === 'population') {
            current = state.population;
            target = state;
            key = 'population';
        } else if (resourceId === 'peasants') {
            current = state.availablePeasants;
            target = state;
            key = 'availablePeasants';
        } else if (resourceId === 'mood') {
            current = state.cleopatraMood;
            target = state;
            key = 'cleopatraMood';
        } else if (resourceId === 'birds') {
            current = state.birds;
            target = state;
            key = 'birds';
        } else if (state.resources && resourceId in state.resources) {
            current = state.resources[resourceId];
            target = state.resources;
            key = resourceId;
        } else if (state.consumables && resourceId in state.consumables) {
            current = state.consumables[resourceId];
            target = state.consumables;
            key = resourceId;
        }

        if (!target) return;

        // Appliquer la modification
        switch (mode) {
            case 'set':
                target[key] = value;
                break;
            case 'add':
                target[key] = current + value;
                break;
            case 'sub':
                target[key] = Math.max(0, current - value);
                break;
        }
    }

    /**
     * Modifie le temps d'un timer (construction, collecte, etc.)
     * @param {string} timerType - Type: 'construction', 'gathering', 'task'
     * @param {number} index - Index du timer (0 pour le premier)
     * @param {number} value - Valeur en secondes
     * @param {string} mode - 'set', 'add', 'sub'
     */
    modifyTimer(timerType, index, value, mode = 'add') {
        const state = this.game.state;
        if (!state) return;

        let timers = null;
        let timeKey = 'elapsed';

        switch (timerType) {
            case 'construction':
                timers = state.constructions;
                break;
            case 'gathering':
                timers = state.gatheringTasks;
                timeKey = 'progress';
                break;
            case 'task':
                if (this.game.cleopatra?.currentTask) {
                    timers = [this.game.cleopatra.currentTask];
                    timeKey = 'timeRemaining';
                }
                break;
        }

        if (!timers || !timers[index]) return;

        const timer = timers[index];
        const current = timer[timeKey] || 0;

        switch (mode) {
            case 'set':
                timer[timeKey] = value;
                break;
            case 'add':
                timer[timeKey] = current + value;
                break;
            case 'sub':
                timer[timeKey] = Math.max(0, current - value);
                break;
        }
    }

    /**
     * Complète immédiatement toutes les constructions en cours
     */
    completeAllConstructions() {
        const state = this.game.state;
        if (!state?.constructions) return;

        state.constructions.forEach(c => {
            c.elapsed = c.totalTime;
        });
    }

    /**
     * Complète immédiatement toutes les collectes en cours
     */
    completeAllGathering() {
        const state = this.game.state;
        if (!state?.gatheringTasks) return;

        state.gatheringTasks.forEach(t => {
            t.elapsed = t.totalTime;
        });
    }

    /**
     * Annule toutes les constructions en cours
     * @param {boolean} refund - true pour rembourser les ressources
     */
    cancelAllConstructions(refund = false) {
        const state = this.game.state;
        if (!state?.constructions) return;

        state.constructions.forEach(c => {
            // Libérer les paysans
            state.availablePeasants += c.peasantsUsed || 1;

            // Rembourser si demandé
            if (refund && c.cost) {
                if (c.cost.gold) state.money += c.cost.gold;
                if (c.cost.resources) {
                    Object.entries(c.cost.resources).forEach(([res, amount]) => {
                        if (state.resources[res] !== undefined) {
                            state.resources[res] += amount;
                        }
                    });
                }
            }
        });

        state.constructions = [];
    }

    /**
     * Annule toutes les collectes en cours
     */
    cancelAllGathering() {
        const state = this.game.state;
        if (!state?.gatheringTasks) return;

        state.gatheringTasks.forEach(t => {
            state.availablePeasants += t.peasantsUsed || 1;
        });

        state.gatheringTasks = [];
    }

    /**
     * Annule une tâche de Cléopâtre (la fait échouer sans pénalité)
     * @param {number} index - Index de la tâche (0 pour la première)
     */
    cancelTask(index = 0) {
        if (this.game.cleopatra?.activeTasks?.[index]) {
            this.game.cleopatra.activeTasks.splice(index, 1);
            this.game.cleopatra.updateTasksDisplay?.();
        }
    }

    /**
     * Force la complétion d'une tâche de Cléopâtre
     * @param {number} index - Index de la tâche (0 pour la première)
     */
    completeTask(index = 0) {
        const task = this.game.cleopatra?.activeTasks?.[index];
        if (task) {
            this.game.cleopatra.completeTask(task);
        }
    }

    /**
     * Récupère le nombre de constructions en cours
     * @returns {number}
     */
    getConstructionsCount() {
        return this.game.state?.constructions?.length || 0;
    }

    /**
     * Récupère la réduction de temps de construction appliquée par l'étape actuelle
     * @returns {number|null} Réduction en secondes ou null si aucune
     */
    getConstructionTimeReduction() {
        return this._constructionTimeReduction || null;
    }

    /**
     * Récupère le nombre de collectes en cours
     * @returns {number}
     */
    getGatheringCount() {
        return this.game.state?.gatheringTasks?.length || 0;
    }

    /**
     * Récupère le nombre de tâches actives de Cléopâtre
     * @returns {number}
     */
    getActiveTasksCount() {
        return this.game.cleopatra?.activeTasks?.length || 0;
    }

    /**
     * Récupère la valeur d'une ressource
     * @param {string} resourceId - ID de la ressource
     * @returns {number}
     */
    getResource(resourceId) {
        const state = this.game.state;
        if (!state) return 0;

        if (resourceId === 'money') return state.money || 0;
        if (resourceId === 'population') return state.population || 0;
        if (resourceId === 'peasants') return state.availablePeasants || 0;
        if (resourceId === 'mood') return state.cleopatraMood || 0;
        if (resourceId === 'birds') return state.birds || 0;
        if (state.resources?.[resourceId] !== undefined) return state.resources[resourceId];
        if (state.consumables?.[resourceId] !== undefined) return state.consumables[resourceId];

        return 0;
    }

    /**
     * Récupère le tier actuel
     * @returns {number}
     */
    getCurrentTier() {
        return this.game.state?.currentTier || 1;
    }

    /**
     * Vérifie si un bâtiment est débloqué
     * @param {string} buildingId - ID du bâtiment
     * @returns {boolean}
     */
    isBuildingUnlocked(buildingId) {
        return this.game.config?.isBuildingUnlocked(buildingId, this.getCurrentTier()) || false;
    }

    /**
     * Ajoute un bâtiment instantanément (sans construction)
     * @param {string} buildingId - ID du bâtiment
     * @param {number} count - Nombre à ajouter
     */
    addBuilding(buildingId, count = 1) {
        const state = this.game.state;
        if (!state) return;

        if (!state.buildings[buildingId]) {
            state.buildings[buildingId] = 0;
        }
        state.buildings[buildingId] += count;

        // Appliquer les effets du bâtiment
        const building = this.game.config?.getBuilding(buildingId);
        if (building) {
            state.population += (building.population || 0) * count;
            state.availablePeasants += (building.peasants || 0) * count;
        }
    }

    /**
     * Définit le nombre de paysans maximum
     * @param {number} max - Nombre maximum de paysans
     */
    setMaxPeasants(max) {
        if (this.game.state) {
            this.game.state.maxPeasants = max;
        }
    }

    /**
     * Active ou désactive l'envoi automatique de ressources
     * @param {boolean} enabled
     */
    setAutoSendResources(enabled) {
        if (this.game.state) {
            this.game.state.autoSendResources = enabled;
        }
    }

    /**
     * Affiche une notification
     * @param {string} message - Message à afficher
     * @param {string} type - Type: 'info', 'success', 'warning', 'error'
     */
    showNotification(message, type = 'info') {
        this.game.notifications?.[type]?.(message);
    }

    // ==========================================
    // INTERFACE UTILISATEUR
    // ==========================================

    /**
     * Crée les éléments DOM pour l'overlay
     */
    createDOMElements() {
        // Backdrop sombre (pour les étapes sans highlight)
        this.backdropElement = document.createElement('div');
        this.backdropElement.className = 'scenario-backdrop hidden';
        this.backdropElement.id = 'scenarioBackdrop';
        document.body.appendChild(this.backdropElement);

        // Container overlay (pour le highlight visuel, pointer-events: none)
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'scenario-overlay hidden';
        this.overlayElement.id = 'scenarioOverlay';

        // Highlight (trou lumineux)
        this.highlightEl = document.createElement('div');
        this.highlightEl.className = 'scenario-highlight hidden';
        this.overlayElement.appendChild(this.highlightEl);

        // Flèche
        this.arrowElement = document.createElement('div');
        this.arrowElement.className = 'scenario-arrow';
        this.arrowElement.textContent = '👇';
        this.overlayElement.appendChild(this.arrowElement);

        // Panneau d'instructions
        this.panelElement = document.createElement('div');
        this.panelElement.className = 'scenario-panel';
        this.panelElement.innerHTML = `
            <p class="scenario-message"></p>
            <button class="scenario-btn">Continuer</button>
        `;
        this.overlayElement.appendChild(this.panelElement);

        // Ajouter au DOM
        document.body.appendChild(this.overlayElement);

        // Event listener pour le bouton
        const btn = this.panelElement.querySelector('.scenario-btn');
        btn?.addEventListener('click', this.handlePanelButtonClick);
    }

    /**
     * Affiche l'interface pour une étape
     * @param {object} step - L'étape à afficher
     */
    showStepUI(step) {
        // Sauvegarder le compteur de messages pour la condition message_sent
        this._messageCountAtStepStart = this.game.state.messagesSentToCaesar || 0;

        // Reset le flag de clic sur la cible (nouvelle étape = nouveau clic autorisé)
        this._targetClicked = false;

        // Mode FREE : pas de blocage, panneau discret en bas
        if (step.type === STEP_TYPES.FREE) {
            this.disableClickBlocking();
            this.overlayElement.classList.add('hidden');
            this.backdropElement.classList.add('hidden');
            this.hideHighlight();

            // Afficher le panneau en mode libre (fond vert, sans bouton)
            this.panelElement.classList.add('free-mode', 'position-bottom');
            this.panelElement.classList.remove('position-center');

            const messageEl = this.panelElement.querySelector('.scenario-message');
            if (messageEl) {
                messageEl.textContent = step.message;
            }

            const btnEl = this.panelElement.querySelector('.scenario-btn');
            if (btnEl) {
                btnEl.classList.add('hidden');
            }

            return;
        }

        // Nettoyer le mode FREE si on en sort
        this.panelElement.classList.remove('free-mode');

        // Activer le blocage global des clics
        this.enableClickBlocking();
        this.overlayElement.classList.remove('hidden');

        // Appliquer la position du panneau (top par défaut, center ou bottom si spécifié)
        this.panelElement.classList.remove('position-bottom', 'position-center');
        if (step.panelPosition === 'bottom') {
            this.panelElement.classList.add('position-bottom');
        } else if (step.panelPosition === 'center') {
            this.panelElement.classList.add('position-center');
        }

        // Configurer le message
        const messageEl = this.panelElement.querySelector('.scenario-message');
        if (messageEl) {
            messageEl.textContent = step.message;
        }

        // Configurer le bouton
        const btnEl = this.panelElement.querySelector('.scenario-btn');
        if (btnEl) {
            if (step.type === STEP_TYPES.INTRO || step.type === STEP_TYPES.EXPLAIN) {
                btnEl.textContent = step.buttonText || 'Continuer';
                btnEl.classList.remove('hidden');
            } else {
                btnEl.classList.add('hidden');
            }
        }

        // Nettoyer l'élément forcé de l'étape précédente
        if (this._forceShownElement) {
            this._forceShownElement.classList.remove('force-visible');
            this._forceShownElement.classList.add('hidden');
            this._forceShownElement = null;
        }

        // Forcer l'affichage d'un élément (ex: tooltip) pendant cette étape
        if (step.forceShowElement) {
            const element = document.querySelector(step.forceShowElement);
            if (element) {
                element.classList.remove('hidden');
                element.classList.add('force-visible');
                this._forceShownElement = element;
            }
        }

        // Gérer le backdrop vs highlight selon le type d'étape
        const hasTarget = step.target && (step.type === STEP_TYPES.HIGHLIGHT || step.type === STEP_TYPES.EXPLAIN || step.type === STEP_TYPES.WAIT);

        if (hasTarget) {
            // Étape avec cible : afficher le highlight (trou lumineux), cacher le backdrop
            this.backdropElement.classList.add('hidden');
            this.showHighlight(step.target);
        } else {
            // Étape sans cible (INTRO) : afficher le backdrop plein, cacher le highlight
            this.backdropElement.classList.remove('hidden');
            this.hideHighlight();
        }
    }

    /**
     * Met en surbrillance un ou plusieurs éléments
     * @param {string} selector - Sélecteur CSS de l'élément principal
     */
    showHighlight(selector) {
        const step = this.getCurrentStep();

        // Support pour plusieurs cibles via step.targets
        const selectors = step?.targets || [selector];
        const targets = selectors.map(s => document.querySelector(s)).filter(Boolean);

        if (targets.length === 0) {
            console.warn(`ScenarioSystem: Aucun élément trouvé pour les sélecteurs`);
            this.hideHighlight();
            return;
        }

        // Marquer tous les éléments comme cibles
        targets.forEach(t => t.classList.add('scenario-target'));
        this._currentTargetSelector = selector;
        this._currentTargetSelectors = selectors;

        // Appliquer le mode sans backdrop si spécifié
        this.highlightEl.classList.remove('no-backdrop');
        if (step?.noBackdrop) {
            this.highlightEl.classList.add('no-backdrop');
        }

        // Scroll automatique vers le premier élément cible
        this.scrollToTarget(targets[0]);

        // Bloquer le scroll du container si demandé
        if (step?.blockScroll) {
            this.blockContainerScroll(targets[0]);
        }

        // Positionner le highlight
        this.updateHighlightPosition();

        // Afficher le highlight
        this.highlightEl.classList.remove('hidden');

        // Afficher la flèche seulement pour les étapes HIGHLIGHT (où on demande de cliquer)
        if (step?.type === STEP_TYPES.HIGHLIGHT) {
            this.arrowElement.classList.remove('hidden');
        } else {
            this.arrowElement.classList.add('hidden');
        }
    }

    /**
     * Scroll vers l'élément cible dans son container scrollable
     * Essaie de centrer l'élément dans le container visible
     * @param {HTMLElement} target - Élément cible
     */
    scrollToTarget(target) {
        // Trouver le vrai container scrollable (celui qui a overflow)
        const scrollableParent = this.findScrollableParent(target);
        if (!scrollableParent) return;

        // Calculer les positions relatives via getBoundingClientRect
        const containerRect = scrollableParent.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        const isHorizontalScroll = scrollableParent.scrollWidth > scrollableParent.clientWidth;
        const isVerticalScroll = scrollableParent.scrollHeight > scrollableParent.clientHeight;

        if (isHorizontalScroll) {
            // Position actuelle de la cible par rapport au container
            const targetLeftInContainer = targetRect.left - containerRect.left + scrollableParent.scrollLeft;
            // Position pour centrer horizontalement
            const targetCenterX = targetLeftInContainer + targetRect.width / 2;
            const containerCenterX = scrollableParent.clientWidth / 2;
            const scrollLeft = targetCenterX - containerCenterX;

            scrollableParent.scrollTo({
                left: Math.max(0, scrollLeft),
                behavior: 'smooth'
            });
        }

        if (isVerticalScroll) {
            // Position actuelle de la cible par rapport au container
            const targetTopInContainer = targetRect.top - containerRect.top + scrollableParent.scrollTop;
            // Position pour centrer verticalement
            const targetCenterY = targetTopInContainer + targetRect.height / 2;
            const containerCenterY = scrollableParent.clientHeight / 2;
            const scrollTop = targetCenterY - containerCenterY;

            scrollableParent.scrollTo({
                top: Math.max(0, scrollTop),
                behavior: 'smooth'
            });
        }
    }

    /**
     * Trouve le parent scrollable d'un élément
     * @param {HTMLElement} element - Élément de départ
     * @returns {HTMLElement|null} Parent scrollable ou null
     */
    findScrollableParent(element) {
        let parent = element.parentElement;
        while (parent) {
            const style = window.getComputedStyle(parent);
            const overflowY = style.overflowY;
            const overflowX = style.overflowX;

            const isScrollableY = (overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight;
            const isScrollableX = (overflowX === 'auto' || overflowX === 'scroll') && parent.scrollWidth > parent.clientWidth;

            if (isScrollableY || isScrollableX) {
                return parent;
            }
            parent = parent.parentElement;
        }
        return null;
    }

    /**
     * Bloque le scroll du container parent de l'élément
     * @param {HTMLElement} target - Élément cible
     */
    blockContainerScroll(target) {
        const scrollableParent = this.findScrollableParent(target);
        if (scrollableParent && !this._blockedScrollContainer) {
            this._blockedScrollContainer = scrollableParent;
            this._originalOverflow = scrollableParent.style.overflow;
            scrollableParent.style.overflow = 'hidden';
        }
    }

    /**
     * Restaure le scroll du container bloqué
     */
    unblockContainerScroll() {
        if (this._blockedScrollContainer) {
            this._blockedScrollContainer.style.overflow = this._originalOverflow || '';
            this._blockedScrollContainer = null;
            this._originalOverflow = null;
        }
    }

    /**
     * Met à jour la position du highlight et de la flèche
     */
    updateHighlightPosition() {
        if (!this._currentTargetSelector) return;

        const step = this.getCurrentStep();
        const selectors = this._currentTargetSelectors || [this._currentTargetSelector];
        const targets = selectors.map(s => document.querySelector(s)).filter(Boolean);

        if (targets.length === 0) return;

        // Calculer le bounding box combiné de tous les éléments
        let rect = this.getCombinedBoundingRect(targets);
        const padding = 8;

        // Étendre le highlight dans une direction (en pixels)
        // Format: { bottom: 200 } pour étendre de 200px vers le bas
        if (step?.expandHighlight) {
            const expand = step.expandHighlight;
            rect = {
                left: rect.left - (expand.left || 0),
                top: rect.top - (expand.top || 0),
                right: rect.right + (expand.right || 0),
                bottom: rect.bottom + (expand.bottom || 0),
                width: rect.width + (expand.left || 0) + (expand.right || 0),
                height: rect.height + (expand.top || 0) + (expand.bottom || 0)
            };
        }

        // Positionner le highlight
        this.highlightEl.style.left = `${rect.left - padding}px`;
        this.highlightEl.style.top = `${rect.top - padding}px`;
        this.highlightEl.style.width = `${rect.width + padding * 2}px`;
        this.highlightEl.style.height = `${rect.height + padding * 2}px`;

        // Positionner la flèche selon la position configurée (sur le bounding box combiné)
        const arrowPos = step?.arrowPosition || 'top';
        this.positionArrow(rect, arrowPos);
    }

    /**
     * Calcule le bounding rect combiné de plusieurs éléments
     * @param {HTMLElement[]} elements - Liste d'éléments
     * @returns {object} Bounding rect combiné
     */
    getCombinedBoundingRect(elements) {
        if (elements.length === 0) return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };

        const rects = elements.map(el => el.getBoundingClientRect());

        const left = Math.min(...rects.map(r => r.left));
        const top = Math.min(...rects.map(r => r.top));
        const right = Math.max(...rects.map(r => r.right));
        const bottom = Math.max(...rects.map(r => r.bottom));

        return {
            left,
            top,
            right,
            bottom,
            width: right - left,
            height: bottom - top
        };
    }

    /**
     * Positionne la flèche autour de l'élément cible
     * @param {DOMRect} rect - Rectangle de l'élément cible
     * @param {string} position - Position: 'top', 'bottom', 'left', 'right'
     */
    positionArrow(rect, position) {
        const arrowSize = 32;
        const offset = 8;

        // Reset des classes de direction
        this.arrowElement.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left', 'arrow-right');
        this.arrowElement.classList.add(`arrow-${position}`);

        switch (position) {
            case 'bottom':
                // Flèche en dessous, pointant vers le haut
                this.arrowElement.textContent = '👆';
                this.arrowElement.style.left = `${rect.left + rect.width / 2 - arrowSize / 2}px`;
                this.arrowElement.style.top = `${rect.bottom + offset}px`;
                break;

            case 'left':
                // Flèche à gauche, pointant vers la droite
                this.arrowElement.textContent = '👉';
                this.arrowElement.style.left = `${rect.left - arrowSize - offset}px`;
                this.arrowElement.style.top = `${rect.top + rect.height / 2 - arrowSize / 2}px`;
                break;

            case 'right':
                // Flèche à droite, pointant vers la gauche
                this.arrowElement.textContent = '👈';
                this.arrowElement.style.left = `${rect.right + offset}px`;
                this.arrowElement.style.top = `${rect.top + rect.height / 2 - arrowSize / 2}px`;
                break;

            case 'top':
            default:
                // Flèche au-dessus, pointant vers le bas (défaut)
                this.arrowElement.textContent = '👇';
                this.arrowElement.style.left = `${rect.left + rect.width / 2 - arrowSize / 2}px`;
                this.arrowElement.style.top = `${rect.top - arrowSize - offset}px`;
                break;
        }
    }

    /**
     * Cache le highlight
     */
    hideHighlight() {
        // Retirer la classe de tous les anciens éléments ciblés
        if (this._currentTargetSelectors) {
            this._currentTargetSelectors.forEach(selector => {
                const target = document.querySelector(selector);
                target?.classList.remove('scenario-target');
            });
            this._currentTargetSelectors = null;
        }
        this._currentTargetSelector = null;

        // Recacher l'élément forcé et retirer force-visible
        if (this._forceShownElement) {
            this._forceShownElement.classList.remove('force-visible');
            this._forceShownElement.classList.add('hidden');
            this._forceShownElement = null;
        }

        this.highlightEl.classList.add('hidden');
        this.arrowElement.classList.add('hidden');
    }

    /**
     * Cache l'overlay complet (backdrop + highlight)
     */
    hideOverlay() {
        this.disableClickBlocking();
        this.overlayElement.classList.add('hidden');
        this.backdropElement.classList.add('hidden');
        this.hideHighlight();
    }

    /**
     * Active le blocage des clics (sauf sur l'élément cible)
     */
    enableClickBlocking() {
        if (this._blockingActive) return;
        this._blockingActive = true;
        // Capturer en phase de capture pour intercepter avant l'élément
        document.addEventListener('click', this.handleGlobalClick, true);
    }

    /**
     * Désactive le blocage des clics
     */
    disableClickBlocking() {
        if (!this._blockingActive) return;
        this._blockingActive = false;
        document.removeEventListener('click', this.handleGlobalClick, true);
    }

    /**
     * Gère tous les clics pendant le tutoriel
     * Bloque tout sauf : élément cible (une seule fois), panneau de tutoriel, bouton Menu
     * @param {MouseEvent} event - L'événement de clic
     */
    handleGlobalClick(event) {
        const target = event.target;

        // Toujours autoriser le panneau de tutoriel et ses enfants
        if (this.panelElement?.contains(target)) {
            return;
        }

        // Toujours autoriser le bouton Menu (data-action="showMenu")
        if (target.closest('[data-action="showMenu"]')) {
            return;
        }

        // Si on a des cibles de tutoriel, autoriser les clics dessus
        // Sauf pour les étapes WAIT et EXPLAIN qui ne doivent pas être cliquables
        const currentStep = this.getCurrentStep();
        const isClickableStep = currentStep && currentStep.type === STEP_TYPES.HIGHLIGHT;

        if (this._currentTargetSelectors && isClickableStep) {
            // Vérifier si le clic est sur l'une des cibles
            for (const selector of this._currentTargetSelectors) {
                const tutorialTarget = document.querySelector(selector);
                if (tutorialTarget && (tutorialTarget === target || tutorialTarget.contains(target))) {
                    // Autoriser le clic sur cette cible
                    return;
                }
            }
        }

        // Bloquer tous les autres clics
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    /**
     * Gère le clic sur le bouton du panneau
     */
    handlePanelButtonClick() {
        const step = this.getCurrentStep();
        if (!step) return;

        // Les étapes INTRO et EXPLAIN passent à la suivante au clic
        if (step.type === STEP_TYPES.INTRO || step.type === STEP_TYPES.EXPLAIN) {
            this.onStepComplete(step);
        }
    }

    // ==========================================
    // SAUVEGARDE / CHARGEMENT
    // ==========================================

    /**
     * Retourne les données à sauvegarder
     * @returns {object} Données de sauvegarde
     */
    toSaveData() {
        return {
            scenarioId: this.currentScenario?.id || null,
            stepIndex: this.currentStepIndex,
            isActive: this.isActive,
            isComplete: this.isComplete,
            victory: this.victory
        };
    }

    /**
     * Restaure l'état depuis une sauvegarde
     * @param {object} saveData - Données de sauvegarde
     */
    fromSaveData(saveData) {
        if (!saveData || !saveData.scenarioId) return;

        // Charger le scénario
        this.loadScenario(saveData.scenarioId);

        // Restaurer l'état
        this.currentStepIndex = saveData.stepIndex || -1;
        this.isActive = saveData.isActive || false;
        this.isComplete = saveData.isComplete || false;
        this.victory = saveData.victory || false;

        // Si le scénario est actif et a des étapes, afficher l'UI de l'étape courante
        if (this.isActive && !this.isComplete && this.currentStepIndex >= 0) {
            const step = this.getCurrentStep();
            if (step) {
                this.showStepUI(step);
            }
        }
    }

    // ==========================================
    // UTILITAIRES
    // ==========================================

    /**
     * Récupère tous les scénarios disponibles
     * @returns {object[]} Liste des scénarios
     */
    static getAvailableScenarios() {
        return Object.values(SCENARIOS).map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            icon: s.icon,
            recommended: s.recommended || false
        }));
    }
}

export default ScenarioSystem;
export { SCENARIOS };
