// ==========================================
// SYSTÈME DE CLÉOPÂTRE
// ==========================================

import { CLEOPATRA_TASKS, CLEOPATRA_IDLE_MESSAGES, REWARD_MESSAGES, DIFFICULTY_CONFIG, BUILDINGS, RESOURCES } from '../data/index.js';
import CleopatraSprite from './cleopatra-sprite.js';

class CleopatraSystem {
    constructor(game) {
        this.game = game;

        // Liste des tâches actives (peut en avoir plusieurs)
        this.activeTasks = [];

        // Nombre maximum de tâches simultanées
        this.maxActiveTasks = 3;

        // Délai entre l'ajout de nouvelles tâches (en secondes)
        this.taskCooldown = 45;
        this.lastTaskTime = 0;

        // Messages
        this.currentMessage = "Bienvenue, chef de village. Je compte sur vous pour faire prospérer ce village.";

        // Intervalle de messages idle
        this.idleMessageInterval = 20000; // 20 secondes
        this.lastIdleMessageTime = Date.now();

        // Sprite de Cléopâtre
        this.sprite = null;
        // Initialiser le sprite après un court délai pour s'assurer que le DOM est prêt
        setTimeout(() => this.initSprite(), 200);
    }

    /**
     * Initialise le sprite de Cléopâtre
     */
    initSprite() {
        const portraitContainer = document.querySelector('.cleopatra-portrait');
        if (portraitContainer) {
            this.sprite = new CleopatraSprite(portraitContainer);
            // Initialiser l'humeur du sprite
            this.sprite.setMood(this.game.state.cleopatraMood);
        }
    }

    /**
     * Met à jour le système
     */
    update(deltaTime) {
        const now = Date.now();

        // Mettre à jour toutes les tâches actives
        for (let i = this.activeTasks.length - 1; i >= 0; i--) {
            const task = this.activeTasks[i];
            task.timeRemaining = task.timeLimit - ((now - task.startTime) / 1000);

            // Vérifier si le temps est écoulé
            if (task.timeRemaining <= 0) {
                this.failTask(task);
                continue;
            }

            // Vérifier si la tâche est complétée
            if (this.checkTaskCompletion(task)) {
                this.completeTask(task);
                continue;
            }

            // Message de rappel à mi-temps
            if (task.timeRemaining < task.timeLimit / 2 && !task.reminderSent) {
                task.reminderSent = true;
                this.game.notifications.warning(`⏰ ${task.name} - Dépêchez-vous !`);
            }
        }

        // Mettre à jour l'affichage
        this.updateTasksDisplay();

        // Vérifier si on peut ajouter une nouvelle tâche
        const timeSinceLastTask = (now - this.lastTaskTime) / 1000;
        const timeUntilNextTask = this.taskCooldown - timeSinceLastTask;

        // Mettre à jour le timer de prochaine mission
        this.updateNextTaskTimer(timeUntilNextTask);

        if (timeSinceLastTask > this.taskCooldown && this.activeTasks.length < this.maxActiveTasks) {
            this.assignNewTask();
        }

        // Messages idle aléatoires (seulement si pas de tâches)
        if (this.activeTasks.length === 0 && now - this.lastIdleMessageTime > this.idleMessageInterval) {
            this.showIdleMessage();
            this.lastIdleMessageTime = now;
        }
    }

    /**
     * Calcule le tier maximum disponible selon le temps de jeu
     */
    getMaxAvailableTier() {
        const gameTime = this.game.state.gameTime || 0; // temps en secondes
        let maxTier = 1;

        for (const [tier, unlockTime] of Object.entries(DIFFICULTY_CONFIG.tierUnlockTimes)) {
            if (gameTime >= unlockTime) {
                maxTier = Math.max(maxTier, parseInt(tier));
            }
        }

        return maxTier;
    }

    /**
     * Calcule le multiplicateur de ressources selon le temps de jeu
     */
    getResourceMultiplier() {
        const gameTimeMinutes = (this.game.state.gameTime || 0) / 60;
        const multiplier = 1 + (gameTimeMinutes * DIFFICULTY_CONFIG.resourceMultiplierPerMinute);
        return Math.min(multiplier, DIFFICULTY_CONFIG.maxResourceMultiplier);
    }

    /**
     * Assigne une nouvelle tâche
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

            // Vérifier si le bâtiment n'a pas atteint le max
            if (task.type === 'build') {
                const building = BUILDINGS[task.building];
                const count = this.game.getBuildingCount(task.building);
                if (count >= building.maxCount) {
                    return false;
                }
            }

            return true;
        });

        if (possibleTasks.length === 0) {
            return;
        }

        // Choisir une tâche aléatoire
        const taskTemplate = possibleTasks[Math.floor(Math.random() * possibleTasks.length)];

        // Créer la tâche avec des valeurs concrètes
        const task = { ...taskTemplate };

        // Déterminer le nombre/quantité
        if (task.count) {
            task.targetCount = task.count[Math.floor(Math.random() * task.count.length)];
        }

        // Pour les ressources
        if (task.resources) {
            task.targetResource = task.resources[Math.floor(Math.random() * task.resources.length)];
        }

        // Appliquer le multiplicateur de difficulté pour les tâches de collecte et nourriture
        if ((task.type === 'gather' || task.type === 'feed') && task.targetCount) {
            const multiplier = this.getResourceMultiplier();
            task.targetCount = Math.round(task.targetCount * multiplier);
        }

        // Remplacer les variables dans les messages
        const replaceVars = (text) => {
            return text
                .replace('{count}', task.targetCount || 1)
                .replace('{resource}', task.targetResource ? RESOURCES[task.targetResource].name : '');
        };

        task.messages = {
            start: replaceVars(task.messages.start),
            reminder: replaceVars(task.messages.reminder),
            success: replaceVars(task.messages.success),
            failure: replaceVars(task.messages.failure)
        };

        task.description = replaceVars(task.description);

        // Stocker l'état initial pour vérification
        task.initialState = this.captureRelevantState(task);

        // Ajouter la tâche à la liste des tâches actives
        task.startTime = Date.now();
        task.timeRemaining = task.timeLimit;
        task.id = Date.now() + Math.random(); // ID unique
        this.activeTasks.push(task);

        // Mettre à jour le dernier temps d'ajout de tâche
        this.lastTaskTime = Date.now();

        // Afficher le message
        this.setMessage(task.messages.start);
        this.game.notifications.cleopatra(task.name);

        // Afficher le panneau de tâches
        this.showTaskPanel();
    }

    /**
     * Capture l'état pertinent pour la tâche
     */
    captureRelevantState(task) {
        const state = {};

        switch (task.type) {
            case 'build':
                state.buildingCount = this.game.getBuildingCount(task.building);
                break;
            case 'gather':
                state.resourceAmount = this.game.state.resources[task.targetResource] || 0;
                break;
            case 'feed':
                state.foodAmount = this.game.state.food;
                break;
            case 'message':
                state.messagesSent = this.game.state.messagesSentToCaesar || 0;
                break;
        }

        return state;
    }

    /**
     * Vérifie si une tâche est complétée
     */
    checkTaskCompletion(task) {
        if (!task) return false;

        switch (task.type) {
            case 'build':
                // Compter les bâtiments construits + en cours de construction
                const builtCount = this.game.getBuildingCount(task.building);
                const pendingCount = this.game.state.constructions.filter(c => c.buildingId === task.building).length;
                const totalCount = builtCount + pendingCount;
                const needed = task.initialState.buildingCount + task.targetCount;
                return totalCount >= needed;

            case 'gather':
                // Les tâches de collecte nécessitent un envoi manuel
                // Sauf si auto-send est activé
                if (this.game.state.autoSendResources) {
                    return this.canSendResourcesForTask(task);
                }
                // Vérifier si déjà envoyé manuellement
                return task.resourcesSent === true;

            case 'feed':
                return this.game.state.food >= task.targetCount;

            case 'message':
                const messagesSent = this.game.state.messagesSentToCaesar || 0;
                return messagesSent > task.initialState.messagesSent;

            default:
                return false;
        }
    }

    /**
     * Vérifie si on peut envoyer les ressources pour une tâche spécifique
     */
    canSendResourcesForTask(task) {
        if (!task || task.type !== 'gather') return false;

        const currentResource = this.game.state.resources[task.targetResource] || 0;
        return currentResource >= task.targetCount;
    }

    /**
     * Envoie manuellement les ressources pour compléter une tâche
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

        // Marquer comme envoyé (sera consommé dans completeTask)
        task.resourcesSent = true;
        return true;
    }

    /**
     * Complète une tâche avec succès
     */
    completeTask(task) {
        // Consommer les ressources si c'est une tâche de collecte avec consumeResources
        if (task.type === 'gather' && task.consumeResources && task.targetResource) {
            const resourceToConsume = task.targetCount;
            const currentAmount = this.game.state.resources[task.targetResource] || 0;
            this.game.state.resources[task.targetResource] = Math.max(0, currentAmount - resourceToConsume);

            const resource = RESOURCES[task.targetResource];
            this.game.notifications.info(`${resource.icon} -${resourceToConsume} envoyé à Cléopâtre`);
        }

        // Récompense
        this.game.addMoney(task.reward);

        // Calculer le bonus d'humeur en fonction du temps restant
        // Plus il reste de temps, plus le bonus est grand (5 à 25 points)
        const timeRatio = task.timeRemaining / task.timeLimit;
        const moodGain = Math.round(5 + (timeRatio * 20)); // 5 minimum, jusqu'à 25 si très rapide

        // Améliorer l'humeur de Cléopâtre
        this.changeMood(moodGain);

        // Message de succès
        this.setMessage(task.messages.success);
        this.game.notifications.success(`✓ ${task.name} +${task.reward} 💰 | Humeur +${moodGain}`);

        // Retirer la tâche de la liste
        this.removeTask(task);

        // Réduire le cooldown progressivement pour augmenter la difficulté
        if (this.taskCooldown > 20) {
            this.taskCooldown -= 1;
        }
    }

    /**
     * Échoue une tâche
     */
    failTask(task) {
        // Pour les tâches de collecte, tenter un envoi automatique à la dernière seconde
        if (task.type === 'gather' && task.consumeResources && this.canSendResourcesForTask(task)) {
            this.game.notifications.warning("Envoi automatique des ressources !");
            task.resourcesSent = true;
            this.completeTask(task);
            return;
        }

        // Message d'échec
        this.setMessage(task.messages.failure);

        // Calculer la perte d'humeur en fonction du temps alloué
        // Plus la tâche était longue (temps alloué), plus la pénalité est grande
        const basePenalty = 5;
        const timePenalty = Math.round(task.timeLimit / 12); // ~5 par minute allouée
        const moodLoss = Math.max(10, basePenalty + timePenalty);

        this.changeMood(-moodLoss);
        this.game.notifications.error(`✗ ${task.name} échouée ! Humeur -${moodLoss}`);

        // Retirer la tâche de la liste
        this.removeTask(task);
    }

    /**
     * Retire une tâche de la liste des tâches actives
     */
    removeTask(task) {
        const index = this.activeTasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
            this.activeTasks.splice(index, 1);
        }
    }

    /**
     * Affiche un message idle
     */
    showIdleMessage() {
        const message = CLEOPATRA_IDLE_MESSAGES[
            Math.floor(Math.random() * CLEOPATRA_IDLE_MESSAGES.length)
        ];
        this.setMessage(message);
    }

    /**
     * Met à jour le message affiché
     */
    setMessage(message) {
        this.currentMessage = message;
        const textElement = document.getElementById('cleopatraText');
        if (textElement) {
            textElement.textContent = message;
        }

        // Animation de parole
        if (this.sprite) {
            this.sprite.speak();
        }
    }

    /**
     * Affiche le panneau de tâches
     */
    showTaskPanel() {
        const panel = document.getElementById('currentTask');
        if (panel && this.activeTasks.length > 0) {
            panel.classList.remove('hidden');
            this.initAutoSendSwitch();
        }
    }

    /**
     * Cache le panneau de tâches si vide
     */
    hideTaskPanelIfEmpty() {
        const panel = document.getElementById('currentTask');
        if (panel && this.activeTasks.length === 0) {
            panel.classList.add('hidden');
        }
    }

    /**
     * Initialise le switch global d'auto-envoi
     */
    initAutoSendSwitch() {
        const autoSwitch = document.getElementById('autoSendGlobal');
        if (autoSwitch) {
            // Synchroniser avec l'état actuel
            autoSwitch.checked = this.game.state.autoSendResources;

            // Attacher l'événement
            autoSwitch.onchange = (e) => {
                this.game.state.autoSendResources = e.target.checked;
                if (e.target.checked) {
                    this.game.notifications.info("Envoi automatique activé");
                } else {
                    this.game.notifications.info("Envoi automatique désactivé");
                }
            };
        }
    }

    /**
     * Crée l'élément DOM pour une tâche (appelé une seule fois par tâche)
     */
    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-item-cleo';
        div.dataset.taskId = task.id;

        let labelText = '';
        let icon = '';

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

        div.innerHTML = `
            <div class="task-objective-row">
                <span class="task-icon">${icon}</span>
                <span class="task-label">${labelText}</span>
                <span class="task-progress" data-progress></span>
                <span class="task-send-btn" data-send-container></span>
            </div>
            <div class="task-timer" data-timer>⏱️ --:--</div>
        `;

        // Attacher l'événement du bouton d'envoi une seule fois
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

        return div;
    }

    /**
     * Met à jour les valeurs dynamiques d'un élément de tâche existant
     */
    updateTaskElement(element, task) {
        // Mettre à jour le timer
        const timerEl = element.querySelector('[data-timer]');
        if (timerEl) {
            const minutes = Math.floor(task.timeRemaining / 60);
            const seconds = Math.floor(task.timeRemaining % 60);
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            let timerColor = '#4ade80';
            if (task.timeRemaining < 30) {
                timerColor = '#ff6b6b';
                element.classList.add('urgent');
            } else if (task.timeRemaining < 60) {
                timerColor = '#ffaa00';
                element.classList.remove('urgent');
            } else {
                element.classList.remove('urgent');
            }

            timerEl.textContent = `⏱️ ${timeStr}`;
            timerEl.style.color = timerColor;
        }

        // Mettre à jour la progression
        const progressEl = element.querySelector('[data-progress]');
        if (progressEl) {
            switch (task.type) {
                case 'build': {
                    const currentCount = this.game.getBuildingCount(task.building);
                    const pendingCount = this.game.state.constructions.filter(c => c.buildingId === task.building).length;
                    const targetCount = task.initialState.buildingCount + task.targetCount;
                    progressEl.textContent = `${currentCount + pendingCount}/${targetCount}`;
                    break;
                }
                case 'gather': {
                    const currentAmount = Math.floor(this.game.state.resources[task.targetResource] || 0);
                    progressEl.textContent = `${currentAmount} en stock`;

                    // Afficher/masquer le bouton d'envoi
                    const sendBtn = element.querySelector('.send-btn-small');
                    if (sendBtn) {
                        const canSend = currentAmount >= task.targetCount && !task.resourcesSent;
                        sendBtn.style.display = canSend ? 'inline-block' : 'none';
                    }
                    break;
                }
                case 'feed': {
                    const currentFood = Math.floor(this.game.state.food);
                    progressEl.textContent = `${currentFood}/${task.targetCount}`;
                    break;
                }
                case 'message': {
                    const hasSent = (this.game.state.messagesSentToCaesar || 0) > task.initialState.messagesSent;
                    progressEl.textContent = hasSent ? '✓' : '✗';
                    break;
                }
            }
        }
    }

    /**
     * Met à jour l'affichage de toutes les tâches
     */
    updateTasksDisplay() {
        const panel = document.getElementById('currentTask');
        const desc = document.getElementById('taskDescription');

        if (!panel || !desc) return;

        // Cacher si pas de tâches
        if (this.activeTasks.length === 0) {
            panel.classList.add('hidden');
            return;
        }

        // Afficher le panneau
        panel.classList.remove('hidden');

        // Obtenir les IDs des tâches actuelles
        const currentTaskIds = new Set(this.activeTasks.map(t => String(t.id)));

        // Supprimer les éléments de tâches qui n'existent plus
        desc.querySelectorAll('.task-item-cleo').forEach(el => {
            if (!currentTaskIds.has(el.dataset.taskId)) {
                el.remove();
            }
        });

        // Créer ou mettre à jour chaque tâche
        for (const task of this.activeTasks) {
            let taskEl = desc.querySelector(`.task-item-cleo[data-task-id="${task.id}"]`);

            if (!taskEl) {
                // Créer le nouvel élément
                taskEl = this.createTaskElement(task);
                desc.appendChild(taskEl);
            }

            // Mettre à jour les valeurs dynamiques
            this.updateTaskElement(taskEl, task);
        }

        // Cacher/montrer le timer de prochaine mission
        const nextTaskTimer = document.getElementById('nextTaskTimer');
        if (nextTaskTimer) {
            if (this.activeTasks.length >= this.maxActiveTasks) {
                nextTaskTimer.style.display = 'none';
            }
        }
    }

    /**
     * Met à jour le timer de prochaine mission
     */
    updateNextTaskTimer(timeRemaining) {
        const nextTaskTimer = document.getElementById('nextTaskTimer');
        const countdown = document.getElementById('nextTaskCountdown');

        if (!nextTaskTimer || !countdown) return;

        // Afficher le timer
        nextTaskTimer.style.display = 'flex';

        if (timeRemaining <= 0) {
            countdown.textContent = 'Imminent...';
            countdown.style.color = '#ffd700';
        } else {
            const seconds = Math.ceil(timeRemaining);
            if (seconds >= 60) {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                countdown.textContent = secs > 0 ? `${mins}m${secs}s` : `${mins}m`;
            } else {
                countdown.textContent = `${seconds}s`;
            }
            countdown.style.color = '#4ade80';
        }
    }

    /**
     * Obtient les tâches actives
     */
    getActiveTasks() {
        return this.activeTasks;
    }

    /**
     * Obtient la première tâche active (compatibilité)
     */
    getCurrentTask() {
        return this.activeTasks.length > 0 ? this.activeTasks[0] : null;
    }

    /**
     * Force une nouvelle tâche (pour tests)
     */
    forceNewTask() {
        this.lastTaskTime = 0;
        this.assignNewTask();
    }

    /**
     * Modifie l'humeur de Cléopâtre
     * @param {number} amount - Valeur positive ou négative
     */
    changeMood(amount) {
        const oldMood = this.game.state.cleopatraMood;
        this.game.state.cleopatraMood = Math.max(0, Math.min(100, oldMood + amount));

        // Mettre à jour l'affichage
        this.updateMoodDisplay();

        // Mettre à jour le sprite selon l'humeur
        if (this.sprite) {
            this.sprite.setMood(this.game.state.cleopatraMood);

            // Animation de réaction
            if (amount > 10) {
                this.sprite.celebrate();
            } else if (amount < -10) {
                this.sprite.rage();
            }
        }

        // Vérifier si l'humeur est à 0
        if (this.game.state.cleopatraMood <= 0) {
            if (this.sprite) {
                this.sprite.rage();
            }
            setTimeout(() => {
                this.game.gameOver("Cléopâtre est furieuse ! Elle vous fait exécuter pour votre incompétence.");
            }, 1000);
        }
    }

    /**
     * Met à jour l'affichage de l'humeur
     */
    updateMoodDisplay() {
        const mood = this.game.state.cleopatraMood;
        const moodElement = document.getElementById('cleopatraMood');
        const moodBar = document.getElementById('moodBar');

        if (moodElement) {
            moodElement.textContent = `${mood}%`;
        }

        if (moodBar) {
            moodBar.style.width = `${mood}%`;

            // Couleur selon l'humeur
            if (mood <= 20) {
                moodBar.style.background = 'linear-gradient(90deg, #ff4444, #ff6b6b)';
            } else if (mood <= 50) {
                moodBar.style.background = 'linear-gradient(90deg, #ffaa00, #ffd700)';
            } else {
                moodBar.style.background = 'linear-gradient(90deg, #4ade80, #22c55e)';
            }
        }
    }

    /**
     * Obtient l'humeur actuelle
     */
    getMood() {
        return this.game.state.cleopatraMood;
    }

    /**
     * Assigne une tâche spécifique par ID (pour les cheats)
     */
    assignSpecificTask(taskId) {
        // Trouver la tâche par ID
        const taskTemplate = CLEOPATRA_TASKS.find(t => t.id === taskId);
        if (!taskTemplate) {
            this.game.notifications.error(`Tâche inconnue: ${taskId}`);
            return;
        }

        // Vérifier si le bâtiment requis est construit
        if (taskTemplate.requiresBuilding && !this.game.hasBuilding(taskTemplate.requiresBuilding)) {
            this.game.notifications.warning(`Cette tâche nécessite: ${taskTemplate.requiresBuilding}`);
        }

        // Copier le template
        const task = JSON.parse(JSON.stringify(taskTemplate));

        // Initialiser les valeurs si nécessaire
        if (task.type === 'build') {
            task.targetCount = Array.isArray(task.count)
                ? task.count[Math.floor(Math.random() * task.count.length)]
                : task.count;
        } else if (task.type === 'gather' && task.resources) {
            task.targetResource = task.resources[Math.floor(Math.random() * task.resources.length)];
            task.targetCount = Array.isArray(task.count)
                ? task.count[Math.floor(Math.random() * task.count.length)]
                : task.count;
        } else if (task.type === 'feed') {
            task.targetCount = Array.isArray(task.count)
                ? task.count[Math.floor(Math.random() * task.count.length)]
                : task.count;
        }

        // Remplacer les variables dans les messages
        const replaceVars = (text) => {
            if (!text) return text;
            return text
                .replace(/{count}/g, task.targetCount || '')
                .replace(/{resource}/g, task.targetResource ? RESOURCES[task.targetResource]?.name : '');
        };

        task.messages = {
            start: replaceVars(task.messages.start),
            reminder: replaceVars(task.messages.reminder),
            success: replaceVars(task.messages.success),
            failure: replaceVars(task.messages.failure)
        };

        task.description = replaceVars(task.description);

        // Stocker l'état initial pour vérification
        task.initialState = this.captureRelevantState(task);

        // Ajouter la tâche à la liste des tâches actives
        task.startTime = Date.now();
        task.timeRemaining = task.timeLimit;
        task.id = Date.now() + Math.random(); // ID unique
        this.activeTasks.push(task);

        // Mettre à jour le dernier temps d'ajout de tâche
        this.lastTaskTime = Date.now();

        // Afficher le message
        this.setMessage(task.messages.start);
        this.game.notifications.cleopatra(task.name);

        // Afficher le panneau de tâches
        this.showTaskPanel();
    }
}

export default CleopatraSystem;
