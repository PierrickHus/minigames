// ==========================================
// SYSTÈME DE CLÉOPÂTRE
// ==========================================
// Ce système gère les interactions avec Cléopâtre, la reine d'Égypte.
// Il assigne des tâches au joueur (construction, collecte, nourriture, messages),
// gère l'humeur de Cléopâtre et détermine la progression de la partie.
// L'humeur à 0% = Game Over (exécution par Cléopâtre)
// ==========================================

import { CLEOPATRA_TASKS, CLEOPATRA_IDLE_MESSAGES, REWARD_MESSAGES, DIFFICULTY_CONFIG, BUILDINGS, RESOURCES } from '../data/index.js';
import CleopatraSprite from './cleopatra-sprite.js';

/**
 * Système de gestion de Cléopâtre et de ses missions
 * Gère l'attribution des tâches, leur suivi, les récompenses et l'humeur de la reine
 */
class CleopatraSystem {
    /**
     * Crée une nouvelle instance du système Cléopâtre
     * @param {Game} game - Instance du jeu principal
     */
    constructor(game) {
        /** @type {Game} Référence au jeu principal */
        this.game = game;

        /** @type {Array<object>} Liste des tâches actives (peut en avoir plusieurs simultanément) */
        this.activeTasks = [];

        /** @type {number} Nombre maximum de tâches simultanées autorisées */
        this.maxActiveTasks = 3;

        // Configuration des délais de tâches
        /** @type {number} Délai entre l'ajout de nouvelles tâches (en secondes) */
        this.taskCooldown = 45;
        /** @type {number} Délai initial avant la première tâche (en secondes) */
        this.initialDelay = 10;
        /** @type {number} Timestamp du dernier ajout de tâche */
        this.lastTaskTime = Date.now() - (this.taskCooldown - this.initialDelay) * 1000;

        // Système de messages
        /** @type {string} Message actuellement affiché par Cléopâtre */
        this.currentMessage = "Bienvenue, chef de village. Je compte sur vous pour faire prospérer ce village.";
        /** @type {number} Intervalle entre les messages idle (en ms) */
        this.idleMessageInterval = 20000;
        /** @type {number} Timestamp du dernier message idle */
        this.lastIdleMessageTime = Date.now();

        // Sprite de Cléopâtre
        /** @type {CleopatraSprite|null} Instance du sprite animé de Cléopâtre */
        this.sprite = null;
        // Initialiser le sprite après un court délai pour s'assurer que le DOM est prêt
        setTimeout(() => this.initSprite(), 200);

        // État pour détecter les changements de liste
        /** @type {number} Nombre de tâches au dernier update (pour détecter les transitions) */
        this._previousTaskCount = 0;

        // Timer séparé pour les tâches de type "message" (invisible au joueur)
        /** @type {number} Timer interne pour les tâches de message */
        this.messageTaskTimer = 0;
        /** @type {number} Délai jusqu'à la prochaine tâche de message */
        this.nextMessageTaskTime = this.getRandomMessageTaskDelay();

        // Initialiser l'affichage de la liste vide
        this.initEmptyTaskDisplay();
    }

    /**
     * Génère un délai aléatoire pour la prochaine tâche de message
     * Le délai est compris entre 60 et 180 secondes (1 à 3 minutes)
     * @returns {number} Délai en secondes
     */
    getRandomMessageTaskDelay() {
        return 60 + Math.random() * 120;
    }

    /**
     * Initialise l'affichage lorsque la liste de tâches est vide
     * Affiche un message "Aucune mission en cours"
     */
    initEmptyTaskDisplay() {
        const desc = document.getElementById('taskDescription');
        if (desc && this.activeTasks.length === 0) {
            desc.innerHTML = '<div class="no-tasks">Aucune mission en cours</div>';
        }
    }

    /**
     * Initialise le sprite animé de Cléopâtre
     * Le sprite est attaché au conteneur du portrait dans le DOM
     */
    initSprite() {
        const portraitContainer = document.querySelector('.cleopatra-portrait');
        if (portraitContainer) {
            this.sprite = new CleopatraSprite(portraitContainer);
            // Synchroniser l'humeur du sprite avec l'état du jeu
            this.sprite.setMood(this.game.state.cleopatraMood);
        }
    }

    /**
     * Met à jour le système à chaque frame du jeu
     * Gère les timers, vérifie la complétion/échec des tâches, et déclenche de nouvelles tâches
     * @param {number} deltaTime - Temps écoulé depuis la dernière frame (en secondes)
     */
    update(deltaTime) {
        const now = Date.now();

        // Mettre à jour toutes les tâches actives (itération inverse pour suppression sûre)
        for (let i = this.activeTasks.length - 1; i >= 0; i--) {
            const task = this.activeTasks[i];
            // Calculer le temps restant
            task.timeRemaining = task.timeLimit - ((now - task.startTime) / 1000);

            // Vérifier si le temps est écoulé → échec de la tâche
            if (task.timeRemaining <= 0) {
                this.failTask(task);
                continue;
            }

            // Vérifier si la tâche est complétée (et pas déjà en cours de finalisation)
            if (!task.isCompleting && this.checkTaskCompletion(task)) {
                this.completeTask(task);
                continue;
            }

            // Construction automatique si l'option est activée et que c'est une tâche de construction
            if (this.game.state.autoSendResources && task.type === 'build') {
                this.tryAutoBuild(task);
            }

            // Message de rappel à mi-temps (une seule fois par tâche)
            if (task.timeRemaining < task.timeLimit / 2 && !task.reminderSent) {
                task.reminderSent = true;
                this.game.notifications.warning(`⏰ ${task.name} - Dépêchez-vous !`);
            }
        }

        // Mettre à jour l'affichage des tâches
        this.updateTasksDisplay();

        // Vérifier si on peut ajouter une nouvelle tâche
        const timeSinceLastTask = (now - this.lastTaskTime) / 1000;
        const timeUntilNextTask = this.taskCooldown - timeSinceLastTask;

        // Mettre à jour le timer de prochaine mission dans l'UI
        this.updateNextTaskTimer(timeUntilNextTask);

        // Ajouter une nouvelle tâche si le cooldown est passé et qu'on n'a pas atteint le max
        if (timeSinceLastTask > this.taskCooldown && this.activeTasks.length < this.maxActiveTasks) {
            this.assignNewTask();
        }

        // Messages idle aléatoires (uniquement si aucune tâche active)
        if (this.activeTasks.length === 0 && now - this.lastIdleMessageTime > this.idleMessageInterval) {
            this.showIdleMessage();
            this.lastIdleMessageTime = now;
        }

        // Timer séparé et invisible pour les tâches de messages (ex: message à César)
        this.messageTaskTimer += deltaTime;
        if (this.messageTaskTimer >= this.nextMessageTaskTime) {
            this.tryAssignMessageTask();
            this.messageTaskTimer = 0;
            this.nextMessageTaskTime = this.getRandomMessageTaskDelay();
        }
    }

    /**
     * Tente d'assigner une tâche de message (envoi de pigeon à César)
     * Cette méthode est appelée sur un timer invisible séparé du système de tâches principal.
     * Conditions requises: volière construite, pas de tâche message déjà active, place disponible
     */
    tryAssignMessageTask() {
        // Vérifier qu'une volière existe
        if (!this.game.hasBuilding('aviary')) {
            return;
        }

        // Vérifier qu'il n'y a pas déjà une tâche de message active
        const hasActiveMessageTask = this.activeTasks.some(t => t.type === 'message');
        if (hasActiveMessageTask) {
            return;
        }

        // Vérifier qu'on n'a pas atteint le max de tâches
        if (this.activeTasks.length >= this.maxActiveTasks) {
            return;
        }

        // Chercher la tâche send_message dans les templates
        const messageTaskTemplate = CLEOPATRA_TASKS.find(t => t.id === 'send_message');
        if (!messageTaskTemplate) {
            return;
        }

        // Créer la tâche
        this.assignSpecificTask('send_message');
    }

    /**
     * Calcule le tier maximum de tâches disponible selon le temps de jeu
     * Les tiers supérieurs se débloquent progressivement pour augmenter la difficulté
     * @returns {number} Tier maximum disponible (1, 2, 3...)
     */
    getMaxAvailableTier() {
        const gameTime = this.game.state.gameTime || 0; // temps en secondes
        let maxTier = 1;

        // Parcourir les temps de déverrouillage définis dans la config
        for (const [tier, unlockTime] of Object.entries(DIFFICULTY_CONFIG.tierUnlockTimes)) {
            if (gameTime >= unlockTime) {
                maxTier = Math.max(maxTier, parseInt(tier));
            }
        }

        return maxTier;
    }

    /**
     * Calcule le multiplicateur de ressources selon le temps de jeu
     * Les quantités demandées augmentent progressivement avec le temps
     * Formule: 1 + (minutes_de_jeu * facteur_par_minute), plafonné au max configuré
     * @returns {number} Multiplicateur à appliquer aux quantités de ressources
     */
    getResourceMultiplier() {
        const gameTimeMinutes = (this.game.state.gameTime || 0) / 60;
        const multiplier = 1 + (gameTimeMinutes * DIFFICULTY_CONFIG.resourceMultiplierPerMinute);
        return Math.min(multiplier, DIFFICULTY_CONFIG.maxResourceMultiplier);
    }

    /**
     * Assigne une nouvelle tâche aléatoire parmi celles disponibles
     * Filtre les tâches selon: tier actuel, bâtiments requis, place disponible
     * Configure la tâche avec des valeurs concrètes et l'ajoute à la liste active
     */
    assignNewTask() {
        const maxTier = this.getMaxAvailableTier();

        // Filtrer les tâches possibles selon l'état du jeu et le tier
        const possibleTasks = CLEOPATRA_TASKS.filter(task => {
            // Vérifier le tier
            if (task.tier > maxTier) {
                return false;
            }

            // Vérifier si le bâtiment requis existe
            if (task.requiresBuilding && !this.game.hasBuilding(task.requiresBuilding)) {
                return false;
            }

            // Vérifier si le bâtiment n'a pas atteint le max (inclure les constructions en cours et réservées)
            if (task.type === 'build') {
                const building = BUILDINGS[task.building];
                const count = this.game.getBuildingCount(task.building);
                const inProgress = this.game.state.constructions.filter(c => c.buildingId === task.building).length;
                const reserved = this.getReservedBuildingCount(task.building);
                const minRequired = Math.min(...task.count);
                // Vérifier s'il reste assez de place pour au moins le minimum requis
                if (count + inProgress + reserved + minRequired > building.maxCount) {
                    return false;
                }
            }

            return true;
        });

        if (possibleTasks.length === 0) {
            return;
        }

        // Choisir une tâche aléatoire parmi les possibles
        const taskTemplate = possibleTasks[Math.floor(Math.random() * possibleTasks.length)];

        // Créer une copie de la tâche pour la modifier
        const task = { ...taskTemplate };

        // Déterminer le nombre/quantité cible
        if (task.count) {
            if (task.type === 'build') {
                // Pour les constructions, limiter au nombre de places restantes
                const building = BUILDINGS[task.building];
                const count = this.game.getBuildingCount(task.building);
                const inProgress = this.game.state.constructions.filter(c => c.buildingId === task.building).length;
                const reserved = this.getReservedBuildingCount(task.building);
                const remaining = building.maxCount - count - inProgress - reserved;

                // Filtrer les counts possibles selon la place restante
                const possibleCounts = task.count.filter(c => c <= remaining);
                if (possibleCounts.length > 0) {
                    task.targetCount = possibleCounts[Math.floor(Math.random() * possibleCounts.length)];
                } else {
                    task.targetCount = remaining;
                }
            } else {
                // Pour les autres types, choisir aléatoirement dans la liste
                task.targetCount = task.count[Math.floor(Math.random() * task.count.length)];
            }
        }

        // Pour les tâches de collecte, choisir une ressource aléatoire
        if (task.resources) {
            task.targetResource = task.resources[Math.floor(Math.random() * task.resources.length)];
        }

        // Appliquer le multiplicateur de difficulté pour les tâches de collecte et nourriture
        if ((task.type === 'gather' || task.type === 'feed') && task.targetCount) {
            const multiplier = this.getResourceMultiplier();
            task.targetCount = Math.round(task.targetCount * multiplier);
        }

        // Fonction helper pour remplacer les variables dans les textes
        const replaceVars = (text) => {
            return text
                .replace('{count}', task.targetCount || 1)
                .replace('{resource}', task.targetResource ? RESOURCES[task.targetResource].name : '');
        };

        // Appliquer les remplacements aux messages
        task.messages = {
            start: replaceVars(task.messages.start),
            reminder: replaceVars(task.messages.reminder),
            success: replaceVars(task.messages.success),
            failure: replaceVars(task.messages.failure)
        };

        task.description = replaceVars(task.description);

        // Stocker l'état initial pour vérifier la progression
        task.initialState = this.captureRelevantState(task);

        // Initialiser les métadonnées de la tâche
        task.startTime = Date.now();
        task.timeRemaining = task.timeLimit;
        task.id = Date.now() + Math.random(); // ID unique
        this.activeTasks.push(task);

        // Mettre à jour le dernier temps d'ajout de tâche
        this.lastTaskTime = Date.now();

        // Afficher le message de démarrage
        this.setMessage(task.messages.start);
        this.game.notifications.cleopatra(task.name);

        // Jouer un son de nouvelle tâche
        this.game.playCleopatraNewTaskSound();

        // Afficher le panneau de tâches
        this.showTaskPanel();
    }

    /**
     * Calcule le nombre de bâtiments déjà réservés par des tâches actives
     * Évite d'assigner des tâches impossibles à compléter
     * @param {string} buildingId - ID du type de bâtiment
     * @returns {number} Nombre de bâtiments réservés par d'autres tâches
     */
    getReservedBuildingCount(buildingId) {
        let reserved = 0;
        for (const activeTask of this.activeTasks) {
            if (activeTask.type === 'build' && activeTask.building === buildingId && !activeTask.isCompleting) {
                reserved += activeTask.targetCount;
            }
        }
        return reserved;
    }

    /**
     * Capture l'état actuel du jeu pertinent pour une tâche
     * Utilisé comme référence pour mesurer la progression
     * @param {object} task - Tâche pour laquelle capturer l'état
     * @returns {object} État capturé (structure dépend du type de tâche)
     */
    captureRelevantState(task) {
        const state = {};

        switch (task.type) {
            case 'build':
                // Capturer le nombre total de bâtiments (construits + en cours + réservés)
                state.buildingCount = this.game.getBuildingCount(task.building);
                state.pendingCount = this.game.state.constructions.filter(c => c.buildingId === task.building).length;
                state.reservedByOtherTasks = this.getReservedBuildingCount(task.building);
                break;
            case 'gather':
                // Capturer le stock actuel de la ressource
                state.resourceAmount = this.game.state.resources[task.targetResource] || 0;
                break;
            case 'feed':
                // Capturer le stock de nourriture
                state.foodAmount = this.game.state.food;
                break;
            case 'message':
                // Capturer le nombre de messages envoyés à César
                state.messagesSent = this.game.state.messagesSentToCaesar || 0;
                break;
        }

        return state;
    }

    /**
     * Vérifie si une tâche est complétée
     * La logique dépend du type de tâche (build, gather, feed, message)
     * @param {object} task - Tâche à vérifier
     * @returns {boolean} true si la tâche est complétée
     */
    checkTaskCompletion(task) {
        if (!task) return false;

        switch (task.type) {
            case 'build':
                // Compter les bâtiments construits + en cours de construction
                const builtCount = this.game.getBuildingCount(task.building);
                const pendingCount = this.game.state.constructions.filter(c => c.buildingId === task.building).length;
                const totalCount = builtCount + pendingCount;
                // Calculer l'objectif en tenant compte de l'état initial complet
                const initialTotal = task.initialState.buildingCount
                    + (task.initialState.pendingCount || 0)
                    + (task.initialState.reservedByOtherTasks || 0);
                const needed = initialTotal + task.targetCount;
                return totalCount >= needed;

            case 'gather':
                // Les tâches de collecte nécessitent un envoi manuel (sauf si auto-send activé)
                if (this.game.state.autoSendResources) {
                    return this.canSendResourcesForTask(task);
                }
                // Vérifier si déjà envoyé manuellement
                return task.resourcesSent === true;

            case 'feed':
                // Vérifier si le stock de nourriture atteint l'objectif
                return this.game.state.food >= task.targetCount;

            case 'message':
                // Vérifier si cette tâche spécifique a été marquée comme complétée
                // Chaque tâche de message doit être validée individuellement (pas globalement)
                return task.messageCompleted === true;

            default:
                return false;
        }
    }

    /**
     * Tente de construire automatiquement un bâtiment pour une tâche
     * Appelé uniquement si autoSendResources est activé et pour les tâches de type 'build'
     * @param {object} task - Tâche de construction à traiter
     */
    tryAutoBuild(task) {
        if (!task || task.type !== 'build') return;

        // Calculer combien de bâtiments on doit encore construire
        const builtCount = this.game.getBuildingCount(task.building);
        const pendingCount = this.game.state.constructions.filter(c => c.buildingId === task.building).length;
        const totalCount = builtCount + pendingCount;
        // Prendre en compte l'état initial complet
        const initialTotal = task.initialState.buildingCount
            + (task.initialState.pendingCount || 0)
            + (task.initialState.reservedByOtherTasks || 0);
        const needed = initialTotal + task.targetCount;

        // Si on a déjà assez de bâtiments (construits + en cours), ne rien faire
        if (totalCount >= needed) return;

        // Tenter de construire un bâtiment si les ressources sont disponibles
        if (this.game.canBuild(task.building)) {
            this.game.startBuilding(task.building);
        }
    }

    /**
     * Vérifie si le joueur peut envoyer les ressources pour compléter une tâche de collecte
     * @param {object} task - Tâche de type 'gather' à vérifier
     * @returns {boolean} true si les ressources sont suffisantes
     */
    canSendResourcesForTask(task) {
        if (!task || task.type !== 'gather') return false;

        const currentResource = this.game.state.resources[task.targetResource] || 0;
        return currentResource >= task.targetCount;
    }

    /**
     * Envoie manuellement les ressources pour compléter une tâche de collecte
     * Appelé par le bouton d'envoi dans l'UI
     * @param {number} taskId - ID unique de la tâche
     * @returns {boolean} true si l'envoi a réussi
     */
    sendResourcesForTask(taskId) {
        const task = this.activeTasks.find(t => t.id === taskId);
        if (!task || task.type !== 'gather') {
            this.game.notifications.error("Tâche non trouvée !");
            return false;
        }

        if (!this.canSendResourcesForTask(task)) {
            const resource = RESOURCES[task.targetResource];
            const currentAmount = Math.floor(this.game.state.resources[task.targetResource] || 0);
            this.game.notifications.error(`Pas assez de ${resource.name} ! (${currentAmount}/${task.targetCount})`);
            return false;
        }

        // Marquer comme envoyé (les ressources seront consommées dans completeTask)
        task.resourcesSent = true;
        return true;
    }

    /**
     * Complète une tâche avec succès
     * Distribue les récompenses, améliore l'humeur, joue les animations et sons
     * @param {object} task - Tâche à compléter
     */
    completeTask(task) {
        // Empêcher les doubles completions
        if (task.isCompleting) return;
        task.isCompleting = true;

        // Consommer les ressources si c'est une tâche de collecte avec consumeResources
        if (task.type === 'gather' && task.consumeResources && task.targetResource) {
            const resourceToConsume = task.targetCount;
            const currentAmount = this.game.state.resources[task.targetResource] || 0;
            this.game.state.resources[task.targetResource] = Math.max(0, currentAmount - resourceToConsume);

            const resource = RESOURCES[task.targetResource];
            this.game.notifications.info(`${resource.icon} -${resourceToConsume} envoyé à Cléopâtre`);
        }

        // Donner la récompense en argent
        this.game.addMoney(task.reward);

        // Calculer le bonus d'humeur en fonction du temps restant
        // Plus il reste de temps, plus le bonus est grand (5 minimum, jusqu'à 25 si très rapide)
        const timeRatio = task.timeRemaining / task.timeLimit;
        const moodGain = Math.round(5 + (timeRatio * 20));

        // Améliorer l'humeur de Cléopâtre
        this.changeMood(moodGain);

        // Afficher le message de succès
        this.setMessage(task.messages.success);
        this.game.notifications.success(`✓ ${task.name} +${task.reward} 💰 | Humeur +${moodGain}`);

        // Jouer le son de tâche réussie
        this.game.playCleopatraTaskSuccessSound();

        // Ajouter l'animation de complétion à l'élément DOM
        const taskElement = document.querySelector(`.task-item-cleo[data-task-id="${task.id}"]`);
        if (taskElement) {
            taskElement.classList.add('completed');
            // Retirer la tâche après l'animation (1.6s = 1s délai + 0.6s fadeout)
            setTimeout(() => {
                this.removeTask(task);
            }, 1600);
        } else {
            // Si pas d'élément DOM, retirer immédiatement
            this.removeTask(task);
        }

        // Réduire le cooldown progressivement pour augmenter la difficulté
        // Minimum: 20 secondes
        if (this.taskCooldown > 20) {
            this.taskCooldown -= 1;
        }
    }

    /**
     * Échoue une tâche (temps écoulé)
     * Applique les pénalités d'humeur, joue les sons d'échec
     * @param {object} task - Tâche échouée
     */
    failTask(task) {
        // Pour les tâches de collecte, tenter un envoi automatique à la dernière seconde
        if (task.type === 'gather' && task.consumeResources && this.canSendResourcesForTask(task)) {
            this.game.notifications.warning("Envoi automatique des ressources !");
            task.resourcesSent = true;
            this.completeTask(task);
            return;
        }

        // Afficher le message d'échec
        this.setMessage(task.messages.failure);

        // Calculer la perte d'humeur en fonction du temps alloué
        // Plus la tâche était longue, plus la pénalité est grande (~5 par minute allouée)
        const basePenalty = 5;
        const timePenalty = Math.round(task.timeLimit / 12);
        const moodLoss = Math.max(10, basePenalty + timePenalty);

        this.changeMood(-moodLoss);
        this.game.notifications.error(`✗ ${task.name} échouée ! Humeur -${moodLoss}`);

        // Jouer le son de tâche échouée
        this.game.playCleopatraTaskFailedSound();

        // Retirer la tâche de la liste
        this.removeTask(task);
    }

    /**
     * Retire une tâche de la liste des tâches actives
     * @param {object} task - Tâche à retirer
     */
    removeTask(task) {
        const index = this.activeTasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
            this.activeTasks.splice(index, 1);
        }
    }

    /**
     * Affiche un message idle aléatoire de Cléopâtre
     * Appelé périodiquement quand aucune tâche n'est active
     */
    showIdleMessage() {
        const message = CLEOPATRA_IDLE_MESSAGES[
            Math.floor(Math.random() * CLEOPATRA_IDLE_MESSAGES.length)
        ];
        this.setMessage(message);
    }

    /**
     * Met à jour le message affiché par Cléopâtre
     * Déclenche également l'animation de parole du sprite
     * @param {string} message - Nouveau message à afficher
     */
    setMessage(message) {
        this.currentMessage = message;
        const textElement = document.getElementById('cleopatraText');
        if (textElement) {
            textElement.textContent = message;
        }

        // Déclencher l'animation de parole du sprite
        if (this.sprite) {
            this.sprite.speak();
        }
    }

    /**
     * Affiche le panneau de tâches dans l'UI
     * Initialise également le switch d'auto-envoi global
     */
    showTaskPanel() {
        const panel = document.getElementById('currentTask');
        if (panel) {
            panel.classList.remove('hidden');
            this.initAutoSendSwitch();
        }
    }

    /**
     * Cache le panneau de tâches si vide
     * Note: Désactivé - le panneau est toujours affiché
     */
    hideTaskPanelIfEmpty() {
        // Ne plus cacher le panneau, toujours l'afficher
    }

    /**
     * Initialise le switch global d'auto-envoi des ressources
     * Synchronise l'état avec le jeu et attache les événements
     */
    initAutoSendSwitch() {
        const autoSwitch = document.getElementById('autoSendGlobal');
        if (autoSwitch) {
            // Forcer le checkbox à l'état du jeu (pas l'inverse)
            // Cela corrige le bug où le navigateur restaurait une valeur via autocomplete
            autoSwitch.checked = this.game.state.autoSendResources;

            // N'attacher l'événement qu'une seule fois
            if (!autoSwitch._eventAttached) {
                autoSwitch._eventAttached = true;
                autoSwitch.addEventListener('change', (e) => {
                    this.game.state.autoSendResources = e.target.checked;
                    if (e.target.checked) {
                        this.game.notifications.info("Envoi automatique activé");
                    } else {
                        this.game.notifications.info("Envoi automatique désactivé");
                    }
                });
            }
        }
    }

    /**
     * Crée l'élément DOM pour afficher une tâche
     * Appelé une seule fois lors de l'ajout de la tâche
     * @param {object} task - Tâche pour laquelle créer l'élément
     * @returns {HTMLElement} Élément DOM de la tâche
     */
    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-item-cleo';
        div.dataset.taskId = task.id;

        let labelText = '';
        let icon = '';

        // Déterminer le texte et l'icône selon le type de tâche
        switch (task.type) {
            case 'build': {
                const building = BUILDINGS[task.building];
                icon = building.icon;
                labelText = `Construire ${task.targetCount} ${building.name}`;
                break;
            }
            case 'gather': {
                const resource = RESOURCES[task.targetResource];
                icon = resource.icon;
                labelText = `Envoyer ${task.targetCount} ${resource.name}`;
                break;
            }
            case 'feed': {
                icon = '🍞';
                labelText = `Avoir ${task.targetCount} nourriture`;
                break;
            }
            case 'message': {
                icon = '🕊️';
                labelText = 'Message à César';
                break;
            }
            default:
                labelText = task.description;
        }

        // Structure HTML de l'élément
        div.innerHTML = `
            <div class="task-objective-row">
                <span class="task-icon">${icon}</span>
                <span class="task-label">${labelText}</span>
                <span class="task-progress" data-progress></span>
                <span class="task-send-btn" data-send-container></span>
            </div>
            <div class="task-timer" data-timer>⏱️ --:--</div>
        `;

        // Pour les tâches de collecte, ajouter le bouton d'envoi manuel
        const sendContainer = div.querySelector('[data-send-container]');
        if (task.type === 'gather' && sendContainer) {
            sendContainer.innerHTML = `<button class="send-btn-small" style="display:none;">📦</button>`;
            const btn = sendContainer.querySelector('.send-btn-small');
            btn.onclick = (e) => {
                e.stopPropagation();
                if (this.sendResourcesForTask(task.id)) {
                    btn.style.display = 'none';
                }
            };
        }

        // Pour les tâches de message, ajouter le bouton d'envoi
        if (task.type === 'message' && sendContainer) {
            sendContainer.innerHTML = `<button class="send-btn-small send-message-btn-cleo" style="display:none;">🕊️ Envoyer</button>`;
            const btn = sendContainer.querySelector('.send-message-btn-cleo');
            btn.onclick = (e) => {
                e.stopPropagation();
                if (this.game.sendMessageToCaesar()) {
                    btn.style.display = 'none';
                }
            };
        }

        return div;
    }

    /**
     * Met à jour les valeurs dynamiques d'un élément de tâche existant
     * Appelé à chaque frame pour rafraîchir le timer et la progression
     * @param {HTMLElement} element - Élément DOM de la tâche
     * @param {object} task - Tâche correspondante
     */
    updateTaskElement(element, task) {
        // Mettre à jour le timer
        const timerEl = element.querySelector('[data-timer]');
        if (timerEl) {
            const minutes = Math.floor(task.timeRemaining / 60);
            const seconds = Math.floor(task.timeRemaining % 60);
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Couleur du timer selon l'urgence
            let timerColor = '#4ade80'; // Vert par défaut
            let shouldBeUrgent = false;
            if (task.timeRemaining < 30) {
                timerColor = '#ff6b6b'; // Rouge - critique
                shouldBeUrgent = true;
            } else if (task.timeRemaining < 60) {
                timerColor = '#ffaa00'; // Orange - attention
            }

            if (element.classList.contains('urgent') !== shouldBeUrgent) {
                element.classList.toggle('urgent', shouldBeUrgent);
            }

            const newTimerText = `⏱️ ${timeStr}`;
            if (timerEl.textContent !== newTimerText) {
                timerEl.textContent = newTimerText;
            }
            if (timerEl.style.color !== timerColor) {
                timerEl.style.color = timerColor;
            }
        }

        // Mettre à jour l'indicateur de progression
        const progressEl = element.querySelector('[data-progress]');
        if (progressEl) {
            switch (task.type) {
                case 'build': {
                    // Afficher construits+en cours / objectif
                    const currentCount = this.game.getBuildingCount(task.building);
                    const currentPending = this.game.state.constructions.filter(c => c.buildingId === task.building).length;
                    const initialTotal = task.initialState.buildingCount
                        + (task.initialState.pendingCount || 0)
                        + (task.initialState.reservedByOtherTasks || 0);
                    const targetCount = initialTotal + task.targetCount;
                    const newProgressText = `${currentCount + currentPending}/${targetCount}`;
                    if (progressEl.textContent !== newProgressText) {
                        progressEl.textContent = newProgressText;
                    }
                    break;
                }
                case 'gather': {
                    // Afficher le stock actuel
                    const currentAmount = Math.floor(this.game.state.resources[task.targetResource] || 0);
                    const newStockText = `${currentAmount} en stock`;
                    if (progressEl.textContent !== newStockText) {
                        progressEl.textContent = newStockText;
                    }

                    // Afficher/masquer le bouton d'envoi selon la disponibilité
                    const sendBtn = element.querySelector('.send-btn-small');
                    if (sendBtn) {
                        const canSend = currentAmount >= task.targetCount && !task.resourcesSent;
                        const newDisplay = canSend ? 'inline-block' : 'none';
                        if (sendBtn.style.display !== newDisplay) {
                            sendBtn.style.display = newDisplay;
                        }
                    }
                    break;
                }
                case 'feed': {
                    // Afficher nourriture actuelle / objectif
                    const currentFood = Math.floor(this.game.state.food);
                    const newFeedText = `${currentFood}/${task.targetCount}`;
                    if (progressEl.textContent !== newFeedText) {
                        progressEl.textContent = newFeedText;
                    }
                    break;
                }
                case 'message': {
                    // Afficher le statut de la tâche
                    let newText;
                    let newColor;
                    if (task.messageCompleted) {
                        newText = '✓ Envoyé';
                        newColor = '#4ade80';
                    } else {
                        // Vérifier si on peut envoyer
                        const hasBirds = this.game.state.birds >= 1;
                        const cost = this.game.getMessageCost();
                        const hasMoney = this.game.state.money >= cost;

                        if (hasBirds && hasMoney) {
                            newText = `💰${cost}`;
                            newColor = '#ffd700';
                        } else if (!hasBirds) {
                            newText = 'Pas d\'oiseau';
                            newColor = '#ff6b6b';
                        } else {
                            newText = `💰${cost} (manque)`;
                            newColor = '#ff6b6b';
                        }
                    }
                    if (progressEl.textContent !== newText) {
                        progressEl.textContent = newText;
                    }
                    if (progressEl.style.color !== newColor) {
                        progressEl.style.color = newColor;
                    }

                    // Afficher/masquer le bouton d'envoi
                    const sendBtn = element.querySelector('.send-message-btn-cleo');
                    if (sendBtn) {
                        const hasBirds = this.game.state.birds >= 1;
                        const cost = this.game.getMessageCost();
                        const hasMoney = this.game.state.money >= cost;
                        const canSend = hasBirds && hasMoney && !task.messageCompleted;
                        const newDisplay = canSend ? 'inline-block' : 'none';
                        if (sendBtn.style.display !== newDisplay) {
                            sendBtn.style.display = newDisplay;
                        }
                    }
                    break;
                }
            }
        }
    }

    /**
     * Met à jour l'affichage complet de la liste des tâches
     * Gère les transitions vide/non-vide et synchronise le DOM avec les tâches actives
     */
    updateTasksDisplay() {
        const panel = document.getElementById('currentTask');
        const desc = document.getElementById('taskDescription');

        if (!panel || !desc) return;

        // Toujours afficher le panneau
        panel.classList.remove('hidden');

        const currentCount = this.activeTasks.length;
        const wasEmpty = this._previousTaskCount === 0;
        const isEmpty = currentCount === 0;

        // Détecter les changements d'état (vide <-> avec tâches)
        if (wasEmpty !== isEmpty) {
            if (isEmpty) {
                // Transition vers liste vide: afficher le message
                desc.innerHTML = '<div class="no-tasks">Aucune mission en cours</div>';
            } else {
                // Transition vers liste avec tâches: supprimer le message
                const noTasksEl = desc.querySelector('.no-tasks');
                if (noTasksEl) {
                    noTasksEl.remove();
                }
            }
        }

        this._previousTaskCount = currentCount;

        // Si liste vide, ne rien faire de plus
        if (isEmpty) {
            return;
        }

        // Obtenir les IDs des tâches actuelles pour comparaison
        const currentTaskIds = new Set(this.activeTasks.map(t => String(t.id)));

        // Supprimer les éléments de tâches qui n'existent plus (sauf si en animation de complétion)
        desc.querySelectorAll('.task-item-cleo').forEach(el => {
            if (!currentTaskIds.has(el.dataset.taskId) && !el.classList.contains('completed')) {
                el.remove();
            }
        });

        // Créer ou mettre à jour chaque tâche
        for (const task of this.activeTasks) {
            // Ne pas mettre à jour les tâches en cours de complétion (animation)
            if (task.isCompleting) continue;

            let taskEl = desc.querySelector(`.task-item-cleo[data-task-id="${task.id}"]`);

            if (!taskEl) {
                // Créer le nouvel élément DOM
                taskEl = this.createTaskElement(task);
                desc.appendChild(taskEl);
            }

            // Mettre à jour les valeurs dynamiques (sauf si en animation)
            if (!taskEl.classList.contains('completed')) {
                this.updateTaskElement(taskEl, task);
            }
        }

        // Cacher le timer de prochaine mission si max atteint
        const nextTaskTimer = document.getElementById('nextTaskTimer');
        if (nextTaskTimer) {
            if (this.activeTasks.length >= this.maxActiveTasks) {
                if (nextTaskTimer.style.display !== 'none') {
                    nextTaskTimer.style.display = 'none';
                }
            }
        }
    }

    /**
     * Met à jour l'affichage du timer de prochaine mission
     * Optimisé pour ne modifier le DOM que si les valeurs ont changé
     * @param {number} timeRemaining - Secondes restantes avant la prochaine mission
     */
    updateNextTaskTimer(timeRemaining) {
        const nextTaskTimer = document.getElementById('nextTaskTimer');
        const countdown = document.getElementById('nextTaskCountdown');

        if (!nextTaskTimer || !countdown) return;

        // Afficher le timer
        if (nextTaskTimer.style.display !== 'flex') {
            nextTaskTimer.style.display = 'flex';
        }

        let newText;
        let newColor;
        if (timeRemaining <= 0) {
            newText = 'Imminent...';
            newColor = '#ffd700';
        } else {
            const seconds = Math.ceil(timeRemaining);
            if (seconds >= 60) {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                newText = secs > 0 ? `${mins}m${secs}s` : `${mins}m`;
            } else {
                newText = `${seconds}s`;
            }
            newColor = '#4ade80';
        }

        if (countdown.textContent !== newText) {
            countdown.textContent = newText;
        }
        if (countdown.style.color !== newColor) {
            countdown.style.color = newColor;
        }
    }

    /**
     * Retourne la liste des tâches actives
     * @returns {Array<object>} Tableau des tâches actives
     */
    getActiveTasks() {
        return this.activeTasks;
    }

    /**
     * Retourne la première tâche active (méthode de compatibilité)
     * @returns {object|null} Première tâche ou null si aucune
     */
    getCurrentTask() {
        return this.activeTasks.length > 0 ? this.activeTasks[0] : null;
    }

    /**
     * Force l'assignation d'une nouvelle tâche (pour les tests/cheats)
     * Tente d'abord la méthode normale, puis cherche manuellement une tâche réalisable
     * @returns {boolean} true si une tâche a été créée
     */
    forceNewTask() {
        // Réinitialiser le timer
        this.lastTaskTime = 0;

        // Essayer d'abord la méthode normale
        const beforeCount = this.activeTasks.length;
        this.assignNewTask();

        // Si une tâche a été ajoutée, succès
        if (this.activeTasks.length > beforeCount) {
            return true;
        }

        // Sinon, chercher manuellement une tâche réalisable
        const maxTier = this.getMaxAvailableTier();

        // Filtrer les tâches réalisables avec des critères assouplis
        const possibleTasks = CLEOPATRA_TASKS.filter(task => {
            // Vérifier le tier
            if (task.tier > maxTier) return false;

            // Pour les tâches de type message, vérifier la volière
            if (task.type === 'message') {
                if (task.requiresBuilding && !this.game.hasBuilding(task.requiresBuilding)) {
                    return false;
                }
            }

            // Pour les tâches de construction, vérifier qu'il reste de la place
            if (task.type === 'build') {
                const building = BUILDINGS[task.building];
                if (!building) return false;

                const count = this.game.getBuildingCount(task.building);
                const inProgress = this.game.state.constructions.filter(c => c.buildingId === task.building).length;
                const reserved = this.getReservedBuildingCount(task.building);
                const remaining = building.maxCount - count - inProgress - reserved;

                // Il faut au moins pouvoir construire 1 bâtiment
                if (remaining < 1) return false;
            }

            return true;
        });

        if (possibleTasks.length === 0) {
            this.game.notifications.warning("Aucune tâche réalisable disponible !");
            console.warn("[forceNewTask] Aucune tâche réalisable trouvée");
            return false;
        }

        // Choisir une tâche aléatoire parmi les possibles
        const taskTemplate = possibleTasks[Math.floor(Math.random() * possibleTasks.length)];

        // Utiliser assignSpecificTask pour l'ajouter
        return this.assignSpecificTask(taskTemplate.id);
    }

    /**
     * Modifie l'humeur de Cléopâtre
     * Gère les animations du sprite et vérifie le game over à 0%
     * @param {number} amount - Valeur positive (bonus) ou négative (pénalité)
     */
    changeMood(amount) {
        const oldMood = this.game.state.cleopatraMood;
        // Clamp entre 0 et 100
        this.game.state.cleopatraMood = Math.max(0, Math.min(100, oldMood + amount));

        // Mettre à jour l'affichage de la jauge
        this.updateMoodDisplay();

        // Mettre à jour le sprite selon l'humeur
        if (this.sprite) {
            this.sprite.setMood(this.game.state.cleopatraMood);

            // Animations de réaction pour les changements significatifs
            if (amount > 10) {
                this.sprite.celebrate(); // Animation de joie
            } else if (amount < -10) {
                this.sprite.rage(); // Animation de colère
            }
        }

        // GAME OVER si l'humeur tombe à 0
        if (this.game.state.cleopatraMood <= 0) {
            if (this.sprite) {
                this.sprite.rage();
            }
            // Délai pour voir l'animation avant le game over
            setTimeout(() => {
                this.game.gameOver("Cléopâtre est furieuse ! Elle vous fait exécuter pour votre incompétence.");
            }, 1000);
        }
    }

    /**
     * Met à jour l'affichage visuel de l'humeur (pourcentage et barre de progression)
     * La couleur de la barre change selon le niveau: vert > 50%, orange 20-50%, rouge < 20%
     * Optimisé pour ne modifier le DOM que si les valeurs ont changé
     */
    updateMoodDisplay() {
        const mood = this.game.state.cleopatraMood;
        const moodElement = document.getElementById('cleopatraMood');
        const moodBar = document.getElementById('moodBar');

        if (moodElement) {
            const newMoodText = `${mood}%`;
            if (moodElement.textContent !== newMoodText) {
                moodElement.textContent = newMoodText;
            }
        }

        if (moodBar) {
            const newWidth = `${mood}%`;
            if (moodBar.style.width !== newWidth) {
                moodBar.style.width = newWidth;
            }

            // Couleur selon l'humeur
            let newBackground;
            if (mood <= 20) {
                newBackground = 'linear-gradient(90deg, #ff4444, #ff6b6b)'; // Rouge critique
            } else if (mood <= 50) {
                newBackground = 'linear-gradient(90deg, #ffaa00, #ffd700)'; // Orange attention
            } else {
                newBackground = 'linear-gradient(90deg, #4ade80, #22c55e)'; // Vert OK
            }
            if (moodBar.style.background !== newBackground) {
                moodBar.style.background = newBackground;
            }
        }
    }

    /**
     * Retourne l'humeur actuelle de Cléopâtre
     * @returns {number} Humeur entre 0 et 100
     */
    getMood() {
        return this.game.state.cleopatraMood;
    }

    /**
     * Assigne une tâche spécifique par son ID (pour les cheats/tests)
     * Vérifie les prérequis et configure la tâche avec des valeurs concrètes
     * @param {string} taskId - ID de la tâche (ex: 'build_house', 'send_message')
     * @returns {boolean} true si la tâche a été créée avec succès
     */
    assignSpecificTask(taskId) {
        // Trouver la tâche par ID
        const taskTemplate = CLEOPATRA_TASKS.find(t => t.id === taskId);
        if (!taskTemplate) {
            this.game.notifications.error(`Tâche inconnue: ${taskId}`);
            return false;
        }

        // Vérifier si le bâtiment requis est construit (pour message)
        if (taskTemplate.requiresBuilding && !this.game.hasBuilding(taskTemplate.requiresBuilding)) {
            this.game.notifications.warning(`Cette tâche nécessite: ${taskTemplate.requiresBuilding}`);
            return false;
        }

        // Créer une copie profonde du template
        const task = JSON.parse(JSON.stringify(taskTemplate));

        // Initialiser les valeurs spécifiques selon le type
        if (task.type === 'build') {
            // Vérifier s'il reste de la place pour ce bâtiment
            const building = BUILDINGS[task.building];
            if (!building) {
                this.game.notifications.error(`Bâtiment inconnu: ${task.building}`);
                return false;
            }

            const count = this.game.getBuildingCount(task.building);
            const inProgress = this.game.state.constructions.filter(c => c.buildingId === task.building).length;
            const reserved = this.getReservedBuildingCount(task.building);
            const remaining = building.maxCount - count - inProgress - reserved;

            if (remaining <= 0) {
                this.game.notifications.warning(`Max atteint pour ${building.name} !`);
                console.warn(`[Cheat] Impossible de créer la tâche: plus de place pour ${building.name} (max atteint)`);
                return false;
            }

            // Limiter le targetCount au nombre restant
            const possibleCounts = (Array.isArray(task.count) ? task.count : [task.count]).filter(c => c <= remaining);
            if (possibleCounts.length > 0) {
                task.targetCount = possibleCounts[Math.floor(Math.random() * possibleCounts.length)];
            } else {
                task.targetCount = remaining;
            }
        } else if (task.type === 'gather' && task.resources) {
            // Choisir une ressource aléatoire
            task.targetResource = task.resources[Math.floor(Math.random() * task.resources.length)];
            task.targetCount = Array.isArray(task.count)
                ? task.count[Math.floor(Math.random() * task.count.length)]
                : task.count;
        } else if (task.type === 'feed') {
            task.targetCount = Array.isArray(task.count)
                ? task.count[Math.floor(Math.random() * task.count.length)]
                : task.count;
        }

        // Fonction helper pour remplacer les variables dans les textes
        const replaceVars = (text) => {
            if (!text) return text;
            return text
                .replace(/{count}/g, task.targetCount || '')
                .replace(/{resource}/g, task.targetResource ? RESOURCES[task.targetResource]?.name : '');
        };

        // Appliquer les remplacements aux messages
        task.messages = {
            start: replaceVars(task.messages.start),
            reminder: replaceVars(task.messages.reminder),
            success: replaceVars(task.messages.success),
            failure: replaceVars(task.messages.failure)
        };

        task.description = replaceVars(task.description);

        // Stocker l'état initial pour vérification
        task.initialState = this.captureRelevantState(task);

        // Initialiser les métadonnées de la tâche
        task.startTime = Date.now();
        task.timeRemaining = task.timeLimit;
        task.id = Date.now() + Math.random(); // ID unique
        this.activeTasks.push(task);

        // Mettre à jour le dernier temps d'ajout de tâche
        this.lastTaskTime = Date.now();

        // Afficher le message de démarrage
        this.setMessage(task.messages.start);
        this.game.notifications.cleopatra(task.name);

        // Afficher le panneau de tâches
        this.showTaskPanel();

        return true;
    }
}

export default CleopatraSystem;
